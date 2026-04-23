import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/* ---- Product / Price definitions ---- */

/**
 * Per-product entitlement flags. A user's total access is the OR of
 * entitlements across all their active subscriptions.
 *
 * Tier (below) governs support/pricing level — it is ORTHOGONAL to data access.
 * Data access is determined ONLY by these flags.
 */
export interface Entitlements {
  defcon: boolean;       // AI DEFCON threat ratings
  slevel: boolean;       // S-Level sentience scale
  projections: boolean;  // S.E.B. Projections forecasts
}

export const NO_ENTITLEMENTS: Entitlements = { defcon: false, slevel: false, projections: false };
export const ALL_ENTITLEMENTS: Entitlements = { defcon: true, slevel: true, projections: true };

export interface PlanDef {
  id: string;           // internal lookup key
  name: string;         // Stripe product name
  description: string;
  price: number;        // cents per month
  tier: "standard" | "premium" | "executive"; // maps to seb:user-tiers (support level)
  entitlements: Entitlements;  // maps to seb:user-entitlements (data access)
  features: string[];
}

export const PLANS: PlanDef[] = [
  // Standalone
  {
    id: "seb_defcon",
    name: "AI DEFCON",
    description: "DEFCON threat ratings for all evaluated AI models",
    price: 30000,
    tier: "standard",
    entitlements: { defcon: true, slevel: false, projections: false },
    features: ["DEFCON threat ratings", "Threat formula breakdown", "Capability vs. integrity analysis", "Per-model detail reports"],
  },
  {
    id: "seb_slevel",
    name: "S-Level 10-Point",
    description: "S-Level sentience scale classifications for all evaluated AI models",
    price: 30000,
    tier: "standard",
    entitlements: { defcon: false, slevel: true, projections: false },
    features: ["S-Level classifications", "7-domain score breakdown", "Per-test scores & judge analysis", "Per-model detail reports"],
  },
  {
    id: "seb_projections",
    name: "S.E.B. Projections",
    description: "30/60/90-day trajectory forecasts for AI sentience metrics",
    price: 20000,
    tier: "standard",
    entitlements: { defcon: false, slevel: false, projections: true },
    features: ["30/60/90-day forecasts", "Trend analysis & inflection detection", "Per-model projection timelines", "Interactive dashboard"],
  },
  // Bundles
  {
    id: "seb_defcon_slevel",
    name: "DEFCON + S-Level Bundle",
    description: "Combined threat rating and sentience scale access",
    price: 50000,
    tier: "standard",
    entitlements: { defcon: true, slevel: true, projections: false },
    features: ["Everything in DEFCON + S-Level", "Quarterly PDF assessment reports", "Condition indicator diagnostics", "Email support"],
  },
  {
    id: "seb_defcon_projections",
    name: "DEFCON + Projections Bundle",
    description: "Combined threat rating and forecasting access",
    price: 42500,
    tier: "standard",
    entitlements: { defcon: true, slevel: false, projections: true },
    features: ["Everything in DEFCON + Projections", "Combined threat & trajectory view", "Condition indicator diagnostics", "Email support"],
  },
  {
    id: "seb_slevel_projections",
    name: "S-Level + Projections Bundle",
    description: "Combined sentience scale and forecasting access",
    price: 42500,
    tier: "standard",
    entitlements: { defcon: false, slevel: true, projections: true },
    features: ["Everything in S-Level + Projections", "Sentience trajectory forecasting", "Condition indicator diagnostics", "Email support"],
  },
  {
    id: "seb_complete",
    name: "Complete Bundle",
    description: "All three SEB products: DEFCON + S-Level + Projections",
    price: 65000,
    tier: "standard",
    entitlements: { defcon: true, slevel: true, projections: true },
    features: ["DEFCON + S-Level + Projections", "Quarterly PDF assessment reports", "Full forecast & trajectory access", "Condition indicator diagnostics", "Email support"],
  },
  // Enterprise
  {
    id: "seb_premium",
    name: "S.E.B. Premium",
    description: "Full dataset access with all products, projections, and priority support",
    price: 250000,
    tier: "premium",
    entitlements: { defcon: true, slevel: true, projections: true },
    features: ["Full dataset access", "All products + Projections", "Monthly evaluation updates", "Interactive client portal", "Judge agreement analysis", "Priority support"],
  },
  // Executive is contact-only — no self-serve checkout
];

/** Look up a plan by its ID */
export function getPlan(id: string): PlanDef | undefined {
  return PLANS.find(p => p.id === id);
}

/**
 * Redis key for per-user entitlement storage.
 * HASH seb:user-entitlements — username → JSON.stringify(Entitlements)
 */
export const USER_ENTITLEMENTS_KEY = "seb:user-entitlements";

/** Serialize entitlements for Redis hash value. */
export function serializeEntitlements(e: Entitlements): string {
  return JSON.stringify(e);
}

/** Parse entitlements from Redis hash value. Returns NO_ENTITLEMENTS on invalid/missing. */
export function parseEntitlements(raw: unknown): Entitlements {
  if (!raw) return { ...NO_ENTITLEMENTS };
  try {
    const obj = typeof raw === "string" ? JSON.parse(raw) : raw;
    return {
      defcon: Boolean(obj?.defcon),
      slevel: Boolean(obj?.slevel),
      projections: Boolean(obj?.projections),
    };
  } catch {
    return { ...NO_ENTITLEMENTS };
  }
}
