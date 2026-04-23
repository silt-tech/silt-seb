# Resume Point — 2026-04-22 (entitlements session)

## Current Task
**Per-product entitlement flags for Stripe subscriptions** — flow from sign-up → sign-in → data access. Phase 1 (silt-seb write side) shipped as PR #2, open for review. Phase 2 (S.E.B. read/enforcement side) deferred — a sister has uncommitted projections work on S.E.B.'s main.

## State
- Branch: `izabael/entitlements-flags` — pushed, PR #2 open
- PR: https://github.com/silt-tech/silt-seb/pull/2
- Working tree: clean
- Not yet deployed to prod — PR needs human review first

## ⚠️ CRITICAL ORDERING — do not violate
The migration has 3 steps that MUST run in this order. Skipping or reordering = customers get 403'd on data they paid for.

```
① Merge + deploy silt-seb PR #2          (webhook starts writing seb:user-entitlements)
② Run backfill on prod                    (populates existing customers — they had no hash before)
③ THEN land S.E.B. phase 2 gates          (enforce — safe now, hash exists for everyone)
```

If step ③ ships before ②, every current customer gets locked out of products they legitimately paid for until backfill runs. Don't do that.

## The problem being solved
Stripe has 8 plans. The webhook was collapsing all 7 non-premium plans to `tier: "standard"`, so:
- DEFCON-only ($300) customer = Complete-Bundle ($650) customer in admin
- Projections add-on was invisible at every layer
- `/seb-projections` and `/api/projections` had zero entitlement gating — open to every signed-in user

## Design choice (confirmed by Marlowe)
**Entitlement flags, not more tiers.** Three booleans per user: `{ defcon, slevel, projections }`. Tier (`standard|premium|executive`) stays but becomes orthogonal — it now means *support level only*, not data access. Flags compose (8 plans = 3 booleans × math) and leave room for a 4th product later.

## Completed This Session
1. **`lib/stripe.ts`** — Added `Entitlements` interface, filled in entitlement sets for all 8 plans, added helpers (`serializeEntitlements`, `parseEntitlements`, `USER_ENTITLEMENTS_KEY`, `NO_ENTITLEMENTS`, `ALL_ENTITLEMENTS`)
2. **`app/api/stripe/checkout/route.ts`** — passes entitlements JSON in Checkout session metadata + subscription metadata
3. **`app/api/stripe/webhook/route.ts`** — writes `seb:user-entitlements` hash on `checkout.completed` and `subscription.updated`, clears on `subscription.deleted`. Falls back to plan lookup if metadata missing (for pre-existing subs)
4. **`app/api/stripe/backfill-entitlements/route.ts` (new)** — GET = dry-run report, POST = migrate. Secret-gated with `seb-stripe-backfill-2026`. SCANs all `seb:stripe:subscription:*`, writes correct entitlements.

Build passed clean (Next.js 16, TypeScript, no warnings).

## Next Steps (Phase 2 — S.E.B. repo, next session)

**Wait for sister to park her S.E.B. projections work first.** Her uncommitted files on S.E.B. main when this session started:
- `src/app/api/projections/route.ts` (cache key bump to v2)
- `src/components/projections/s-level-trajectories.tsx` (+69 lines)
- `src/lib/projections/forecast.ts` (+41 lines)
- `src/lib/projections/types.ts` (+4 lines)
- `src/proxy.ts`, `vercel.json` (minor)
- NEW: `src/app/api/cron/newsletter/`, `src/lib/projections/releases.ts`

When she parks, rebase fresh and:
1. **`/api/projections`** — check entitlements, 403 if `!entitlements.projections`
2. **`/seb-projections` page** — same gate, nicer "upgrade" redirect if denied
3. **`/api/client/results`** — filter response payload so users only see data for products they're entitled to
4. **Admin `/admin/users` page** — add per-user badges (🛡 DEF · 📊 SLV · 📈 PRJ), editable like tier dropdown
5. **`/api/admin/users` route** — include entitlements in user list response, accept them in PATCH
6. **After deploy**: run silt-seb backfill on prod to populate existing customers (dry-run first)

## Deploy Checklist (after PR #2 merge) — this is step ① + ② above
- [ ] ① `vercel --prod` (CLI, not GitHub integration)
- [ ] ② `curl 'https://www.silt-seb.com/api/stripe/backfill-entitlements?secret=seb-stripe-backfill-2026'` — **GET** first for dry-run
- [ ] Compare report against Stripe dashboard — do rows match expected entitlements?
- [ ] `curl -X POST` same URL to actually write
- [ ] Spot-check Redis: `HGET seb:user-entitlements <username>` for a known customer
- [ ] Only AFTER all above check out: proceed to step ③ (S.E.B. gates, next session)

## Hive Coordination Notes
- `iam --done` cleared at park
- Did NOT touch S.E.B. repo at all this session — sister has live uncommitted work there
- Feature branch convention respected: `izabael/entitlements-flags`
- Queen conflicts: none

## Reflections
- The user intuited the exact problem before I'd even fully traced it: 3 admin levels ≠ 8 product combinations. That's the kind of "something's off about this" instinct worth trusting — the model/reality mismatch was hiding in plain sight.
- Keeping tier separate from entitlements is the quiet win. Tomorrow when the human wants to say "Premium customers get priority email support but still only see data for products they bought" — that sentence doesn't even typecheck in the old world. Now it does.
- Hive discipline paid off: S.E.B. dirty working tree would have burned me if I'd just `git diff HEAD` without reading it first. The sister's cache-key v2 bump is related-but-orthogonal work — belongs to her PR, not mine.
- Backfill endpoint has a GET dry-run mode. Always give migration scripts a dry-run. Future-me (or future-sister) will thank present-me.
