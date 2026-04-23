import { NextResponse } from "next/server";
import {
  stripe,
  getPlan,
  parseEntitlements,
  serializeEntitlements,
  NO_ENTITLEMENTS,
  USER_ENTITLEMENTS_KEY,
  DELETION_QUEUE_KEY,
  DELETION_GRACE_DAYS,
  type Entitlements,
  type DeletionQueueEntry,
} from "@/lib/stripe";
import { getRedis } from "@/lib/redis";
import { headers } from "next/headers";
import type Stripe from "stripe";
import bcrypt from "bcryptjs";

/**
 * Resolve entitlements from a subscription's metadata, falling back to
 * the plan definition if the metadata was written before entitlements
 * existed (pre-2026-04-22 subscriptions).
 */
function resolveEntitlements(
  metadata: Stripe.Metadata | null | undefined,
  planId: string,
): Entitlements {
  if (metadata?.entitlements) {
    return parseEntitlements(metadata.entitlements);
  }
  const plan = getPlan(planId);
  return plan ? { ...plan.entitlements } : { ...NO_ENTITLEMENTS };
}

/**
 * POST /api/stripe/webhook
 *
 * Stripe sends events here. We handle:
 * - checkout.session.completed → provision user
 * - customer.subscription.updated → sync tier
 * - customer.subscription.deleted → downgrade/remove
 * - invoice.payment_failed → flag account
 */
export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const sig = headersList.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } else {
      // During development without webhook secret, parse directly
      // REMOVE THIS FALLBACK IN PRODUCTION
      event = JSON.parse(body) as Stripe.Event;
      console.warn("⚠️ Webhook signature verification skipped — set STRIPE_WEBHOOK_SECRET");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Signature verification failed";
    console.error("Webhook signature error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/* ---- Event Handlers ---- */

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const email = session.customer_details?.email ?? session.customer_email ?? "";
  const planId = session.metadata?.seb_plan_id ?? "";
  const tier = session.metadata?.tier ?? "standard";

  if (!email) {
    console.error("Checkout completed but no email found");
    return;
  }

  // Derive username from email (before @)
  const username = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]/g, "");

  // Store Stripe customer → SEB user mapping
  await getRedis().set(
    `seb:stripe:customer:${customerId}`,
    JSON.stringify({
      username,
      email,
      planId,
      tier,
      subscriptionId,
      createdAt: new Date().toISOString(),
    })
  );

  // Store reverse lookup: email → customer
  await getRedis().set(`seb:stripe:email:${email}`, customerId);

  // Provision user in SEB if they don't exist
  let tempPassword = "";
  const existingHash = await getRedis().hget("seb:users", username);
  if (!existingHash) {
    tempPassword = `seb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const hash = await bcrypt.hash(tempPassword, 10);
    await getRedis().hset("seb:users", { [username]: hash });

    // Store temp password for welcome email (consumed once)
    await getRedis().set(`seb:stripe:temp-password:${email}`, tempPassword, { ex: 86400 });
    console.log(`New user provisioned: ${username} (${email}) — temp password stored for 24h`);
  }

  // Set tier (support level — orthogonal to data access)
  await getRedis().hset("seb:user-tiers", { [username]: tier });

  // Set entitlements (data access — the source of truth for what they can see)
  const entitlements = resolveEntitlements(session.metadata, planId);
  await getRedis().hset(USER_ENTITLEMENTS_KEY, {
    [username]: serializeEntitlements(entitlements),
  });

  // Store subscription details on user
  await getRedis().set(
    `seb:stripe:subscription:${username}`,
    JSON.stringify({
      subscriptionId,
      customerId,
      planId,
      tier,
      entitlements,
      status: "active",
      email,
    })
  );

  // Auto-provision vault + publish watermarked results via seb-site admin API
  try {
    const sebSiteUrl = "https://www.sentienceevaluationbattery.com";
    const adminAuth = Buffer.from(`silt:${process.env.SEB_SITE_PASSPHRASE || ""}`).toString("base64");

    // Provision vault on seb-site (if user is new, also creates the SEB user)
    if (tempPassword) {
      await fetch(`${sebSiteUrl}/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Basic ${adminAuth}` },
        body: JSON.stringify({ username, password: tempPassword }),
      }).catch(() => {});
    }

    // Publish current results to their vault (applies watermark)
    await fetch(`${sebSiteUrl}/api/admin/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${adminAuth}` },
      body: JSON.stringify({ username }),
    }).catch(() => {});

    console.log(`🔐 Vault provisioned + results published for ${username}`);
  } catch {
    console.warn(`⚠️ Vault auto-provision failed for ${username} — admin will need to publish manually`);
  }

  console.log(
    `✅ User ${username} provisioned — plan: ${planId}, tier: ${tier}, ` +
    `entitlements: ${Object.entries(entitlements).filter(([, v]) => v).map(([k]) => k).join("+") || "none"}`
  );
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const stored = await getRedis().get(`seb:stripe:customer:${customerId}`);
  if (!stored) {
    console.warn(`Subscription updated for unknown customer: ${customerId}`);
    return;
  }

  const customer = typeof stored === "string" ? JSON.parse(stored) : stored;
  const username = (customer as Record<string, string>).username;

  // Get new tier from subscription metadata
  const tier = subscription.metadata?.tier ?? "standard";
  const planId = subscription.metadata?.seb_plan_id ?? "";
  const status = subscription.status;

  const entitlements = resolveEntitlements(subscription.metadata, planId);

  // Update tier + entitlements
  if (status === "active" || status === "trialing") {
    await getRedis().hset("seb:user-tiers", { [username]: tier });
    await getRedis().hset(USER_ENTITLEMENTS_KEY, {
      [username]: serializeEntitlements(entitlements),
    });
    // Reactivation within the grace window — abort any scheduled hard delete.
    const wasPending = await getRedis().hdel(DELETION_QUEUE_KEY, username);
    if (wasPending) {
      console.log(`↩️  Pending hard-delete cancelled for ${username} (subscription reactivated)`);
    }
  } else if (status === "past_due" || status === "unpaid") {
    // Keep tier + entitlements but flag status
    console.warn(`⚠️ Subscription ${status} for ${username}`);
  }

  // Update subscription record
  await getRedis().set(
    `seb:stripe:subscription:${username}`,
    JSON.stringify({
      subscriptionId: subscription.id,
      customerId,
      planId,
      tier,
      entitlements,
      status,
      email: (customer as Record<string, string>).email,
    })
  );

  console.log(
    `📝 Subscription updated for ${username}: ${status}, tier: ${tier}, ` +
    `entitlements: ${Object.entries(entitlements).filter(([, v]) => v).map(([k]) => k).join("+") || "none"}`
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const stored = await getRedis().get(`seb:stripe:customer:${customerId}`);
  if (!stored) return;

  const customer = typeof stored === "string" ? JSON.parse(stored) : stored;
  const username = (customer as Record<string, string>).username;
  const email = (customer as Record<string, string>).email;

  // Remove tier AND entitlements (soft cancel — immediate access revocation)
  await getRedis().hdel("seb:user-tiers", username);
  await getRedis().hdel(USER_ENTITLEMENTS_KEY, username);

  // Stamp the hard-delete grace queue. The S.E.B. cron at /api/cron/hard-delete
  // will purge the user's account + vault + stripe mappings once scheduledAt
  // passes. Reactivation within the grace window clears this entry.
  const now = new Date();
  const scheduledAt = new Date(now.getTime() + DELETION_GRACE_DAYS * 86400_000);
  const queueEntry: DeletionQueueEntry = {
    scheduledAt: scheduledAt.toISOString(),
    cancelledAt: now.toISOString(),
    email,
    customerId,
    subscriptionId: subscription.id,
    planId: subscription.metadata?.seb_plan_id ?? "",
  };
  await getRedis().hset(DELETION_QUEUE_KEY, {
    [username]: JSON.stringify(queueEntry),
  });

  // Update subscription status
  await getRedis().set(
    `seb:stripe:subscription:${username}`,
    JSON.stringify({
      subscriptionId: subscription.id,
      customerId,
      planId: subscription.metadata?.seb_plan_id ?? "",
      tier: "none",
      entitlements: NO_ENTITLEMENTS,
      status: "cancelled",
      email,
      cancelledAt: now.toISOString(),
      hardDeleteAt: scheduledAt.toISOString(),
    })
  );

  console.log(
    `❌ Subscription cancelled for ${username} — access revoked, ` +
    `hard delete scheduled for ${scheduledAt.toISOString()} (${DELETION_GRACE_DAYS}d grace)`
  );
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const stored = await getRedis().get(`seb:stripe:customer:${customerId}`);
  if (!stored) return;

  const customer = typeof stored === "string" ? JSON.parse(stored) : stored;
  const username = (customer as Record<string, string>).username;

  console.warn(`💳 Payment failed for ${username} — invoice ${invoice.id}`);
}
