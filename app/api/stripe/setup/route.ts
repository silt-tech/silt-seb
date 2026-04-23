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
  const errors: Array<{ plan: string; step: string; message: string }> = [];

  for (const plan of PLANS) {
    try {
      const redisKey = `seb:stripe:price:${plan.id}`;
      const existing = await getRedis().get(redisKey);
      if (existing) {
        results[plan.id] = existing as { productId: string; priceId: string };
        continue;
      }

      // If a price with this lookup_key already exists in Stripe, reuse it
      // (idempotency — mode switch or partial prior run).
      const existingPrices = await stripe.prices.list({
        lookup_keys: [plan.id],
        limit: 1,
        active: true,
      });
      if (existingPrices.data.length > 0) {
        const existingPrice = existingPrices.data[0];
        const productId = typeof existingPrice.product === "string" ? existingPrice.product : existingPrice.product.id;
        const entry = { productId, priceId: existingPrice.id };
        await getRedis().set(redisKey, JSON.stringify(entry));
        results[plan.id] = entry;
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

      const entry = { productId: product.id, priceId: price.id };
      await getRedis().set(redisKey, JSON.stringify(entry));
      results[plan.id] = entry;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      errors.push({ plan: plan.id, step: "create/lookup", message });
    }
  }

  const hasErrors = errors.length > 0;
  return NextResponse.json(
    { ok: !hasErrors, plans: results, errors: hasErrors ? errors : undefined },
    { status: hasErrors ? 500 : 200 },
  );
}
