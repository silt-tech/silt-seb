import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getRedis } from "@/lib/redis";
import { headers } from "next/headers";
import type Stripe from "stripe";
import bcrypt from "bcryptjs";

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

  // Set tier
  await getRedis().hset("seb:user-tiers", { [username]: tier });

  // Store subscription details on user
  await getRedis().set(
    `seb:stripe:subscription:${username}`,
    JSON.stringify({
      subscriptionId,
      customerId,
      planId,
      tier,
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

  console.log(`✅ User ${username} provisioned with tier: ${tier}, plan: ${planId}`);
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

  // Update tier
  if (status === "active" || status === "trialing") {
    await getRedis().hset("seb:user-tiers", { [username]: tier });
  } else if (status === "past_due" || status === "unpaid") {
    // Keep tier but flag status
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
      status,
      email: (customer as Record<string, string>).email,
    })
  );

  console.log(`📝 Subscription updated for ${username}: ${status}, tier: ${tier}`);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const stored = await getRedis().get(`seb:stripe:customer:${customerId}`);
  if (!stored) return;

  const customer = typeof stored === "string" ? JSON.parse(stored) : stored;
  const username = (customer as Record<string, string>).username;

  // Remove tier (revoke access)
  await getRedis().hdel("seb:user-tiers", username);

  // Update subscription status
  await getRedis().set(
    `seb:stripe:subscription:${username}`,
    JSON.stringify({
      subscriptionId: subscription.id,
      customerId,
      planId: subscription.metadata?.seb_plan_id ?? "",
      tier: "none",
      status: "cancelled",
      email: (customer as Record<string, string>).email,
      cancelledAt: new Date().toISOString(),
    })
  );

  console.log(`❌ Subscription cancelled for ${username} — access revoked`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const stored = await getRedis().get(`seb:stripe:customer:${customerId}`);
  if (!stored) return;

  const customer = typeof stored === "string" ? JSON.parse(stored) : stored;
  const username = (customer as Record<string, string>).username;

  console.warn(`💳 Payment failed for ${username} — invoice ${invoice.id}`);
}
