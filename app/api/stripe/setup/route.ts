import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { getRedis } from "@/lib/redis";

/**
 * POST /api/stripe/setup?secret=seb-stripe-setup-2026
 *
 * One-time setup: creates Stripe Products + Prices for each plan,
 * stores the price IDs in Redis so checkout can look them up.
 *
 * Safe to re-run — skips plans that already have a price ID stored.
 */
export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  if (searchParams.get("secret") !== "seb-stripe-setup-2026") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, { productId: string; priceId: string }> = {};

  for (const plan of PLANS) {
    const redisKey = `seb:stripe:price:${plan.id}`;
    const existing = await getRedis().get(redisKey);
    if (existing) {
      results[plan.id] = existing as { productId: string; priceId: string };
      continue;
    }

    // Create Stripe product
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: { seb_plan_id: plan.id, tier: plan.tier },
    });

    // Create monthly recurring price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: plan.id,
      metadata: { seb_plan_id: plan.id, tier: plan.tier },
    });

    // Store in Redis
    const entry = { productId: product.id, priceId: price.id };
    await getRedis().set(redisKey, JSON.stringify(entry));
    results[plan.id] = entry;
  }

  return NextResponse.json({ ok: true, plans: results });
}
