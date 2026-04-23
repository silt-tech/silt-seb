import { NextResponse } from "next/server";
import { stripe, getPlan, serializeEntitlements } from "@/lib/stripe";
import { getRedis } from "@/lib/redis";
import type Stripe from "stripe";

/**
 * POST /api/stripe/checkout
 * Body: { planId: string, email?: string }
 *
 * Creates a Stripe Checkout Session and returns the URL.
 */
export async function POST(req: Request) {
  try {
    const { planId, email } = await req.json();

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Get price ID from Redis (set by /api/stripe/setup)
    const stored = await getRedis().get(`seb:stripe:price:${planId}`);
    if (!stored) {
      return NextResponse.json(
        { error: "Plan not configured in Stripe. Run /api/stripe/setup first." },
        { status: 500 }
      );
    }

    const { priceId } = typeof stored === "string" ? JSON.parse(stored) : stored;

    const origin = new URL(req.url).origin;

    const entitlementsJson = serializeEntitlements(plan.entitlements);

    const params: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel`,
      metadata: { seb_plan_id: planId, tier: plan.tier, entitlements: entitlementsJson },
      subscription_data: {
        metadata: { seb_plan_id: planId, tier: plan.tier, entitlements: entitlementsJson },
      },
      allow_promotion_codes: true,
      consent_collection: {
        terms_of_service: "required",
      },
      custom_text: {
        terms_of_service_acceptance: {
          message: "I agree to the [Subscriber Agreement](https://silt-seb.com/subscriber-agreement)",
        },
      },
    };

    if (email) {
      params.customer_email = email;
    }

    const session = await stripe.checkout.sessions.create(params);

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Stripe checkout error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
