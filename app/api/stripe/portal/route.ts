import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getRedis } from "@/lib/redis";

/**
 * POST /api/stripe/portal
 * Body: { email: string }
 *
 * Creates a Stripe Billing Portal session so the customer
 * can manage their subscription (upgrade, downgrade, cancel, update payment).
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    // Look up Stripe customer ID from email
    const customerId = await getRedis().get(`seb:stripe:email:${email}`) as string | null;
    if (!customerId) {
      return NextResponse.json(
        { error: "No subscription found for this email" },
        { status: 404 }
      );
    }

    const origin = new URL(req.url).origin;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/#pricing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe portal error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
