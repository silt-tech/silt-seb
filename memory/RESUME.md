# Resume Point — 2026-04-22 (end of day)

## Current Task
**PARKED.** End-to-end sign-up → access-control → data-visibility flow shipped and live across both silt-seb (pricing/checkout) and S.E.B. (data portal). Kris notified via email with test-mode instructions.

## State
- silt-seb: branch `main`, working tree clean, deployed live at https://www.silt-seb.com
- S.E.B.: branch `main`, working tree clean, deployed live at https://www.sentienceevaluationbattery.com
- Both repos: no open PRs, no uncommitted work, no dangling branches in flight

## What Shipped Today (the full arc)

### silt-seb PRs (merged + deployed)
- **PR #2** — per-product entitlement flags: `Entitlements { defcon, slevel, projections }` added to `PlanDef`, webhook writes `seb:user-entitlements` hash, backfill endpoint for existing customers. Phase 1 of the big unification.
- **PR #3** — diagnostic/robustness on `/api/stripe/setup`: per-plan try/catch + `stripe.prices.list({lookup_keys})` reuse logic (idempotent across test↔live mode switches). Stripe products populated in Redis for all 8 plans. Also gitignored `.claude/`.

### S.E.B. PRs (merged + deployed)
- **PR #1** (sister PID 454733's work) — projections v2: cache key bumped to v2, release-date anchors added to forecast.ts, s-level-trajectories date-axis chart, newsletter cron wiring, new lib/projections/releases.ts.
- **PR #3** (mine, later superseded by #4) — entitlement gates + session auth for /client and /seb-projections + admin badges. Renamed `src/proxy.ts` → `src/middleware.ts` to actually wire it into Next.js (the old rename Kris did in Feb left it as dead code).
- **PR #4** — slim middleware fix. Vercel's orchestration layer silently rejected the fat middleware that imported `@upstash/redis`, with "Unexpected error" at 0ms build. Split into:
  - Edge middleware (routing-only, session cookie *presence* check, no Redis)
  - Serverless enforcement in `/api/projections/route.ts` and `/seb-projections/layout.tsx`
  This unblocked deploys and became the pattern going forward.
- **PR #5** — align admin user view with silt-seb plans. Added Plan column (friendly names from planId), subscription status indicator for non-active subs, centralized entitlement resolver at `src/lib/entitlements.ts` (resolution order: admin role > Premium/Executive tier > hash > all-false). Fixed the shawn case (Executive tier, all-false hash → was getting blocked; now auto-allowed via tier).
- **PR #6** — denial banner on /client when `?denied=X` query param present (explains what was blocked, links to silt-seb.com pricing). /seb-projections page header matches /client pattern (username display + Security link + Logout button).
- **PR #7** — security tightening: removed Basic Auth bypass on /client and /seb-projections. Admins now log in via /login with SILT creds to view client data. Keeps audit trail uniform and entitlement enforcement consistent across both pages.

### Operational
- silt-seb deployed via `vercel --prod` (confirmed working).
- S.E.B. was hitting Vercel orchestration rejections for a while before the slim-middleware fix — traced to middleware's Redis imports. Also discovered the `seb-site` Vercel project is linked to `neuronomocon-bit/seb-site` (stale GitHub repo) and the GitHub Actions `VERCEL_DEPLOY_HOOK` secret never made it across the silt-tech transfer. Deploys currently happen via CLI (the reliable path). The broken Actions workflow is cosmetic — someone could set `gh secret set VERCEL_DEPLOY_HOOK --repo silt-tech/SEB` to revive it but not critical.
- Stripe is in **TEST mode** on silt-seb production (`sk_test_...`). Products/prices populated in Redis, full buy flow works with test card `4242 4242 4242 4242`. Zero real charges possible.
- Email sent to Kris (neuronomocon@gmail.com, message ID `19db7ec8c60a0d2d`) explaining the flow end-to-end and how to test sign-up.

## Architecture now

```
silt-seb.com (pricing)                   sentienceevaluationbattery.com (data)
├─ /                 pricing page        ├─ /                  Basic Auth (admin)
├─ /api/stripe/      checkout/webhook    ├─ /admin/            Basic Auth (admin)
│                                        ├─ /client            session cookie
│                                        ├─ /seb-projections   session cookie + entitlements.projections
│                                        └─ /api/*             mix of Basic / session / public

         shared Upstash Redis: seb:users, seb:user-tiers,
         seb:user-entitlements, seb:stripe:*, seb:session:*
```

Webhook auto-provisions users and vaults on checkout. Sub cancellation = soft cancel (keeps login + vault, removes entitlements). Hard cancel is 3 lines away if needed later (see email to Kris).

## What's NOT done (by design, not omission)
- **Welcome email with temp password** — temp password sits in Redis for 24h but no email auto-sends it. Easy to wire when branded copy is ready.
- **Username case normalization** — Eddie vs eddie trap will bite again; worth a follow-up to lowercase at login.
- **Product-level data filtering in /client** — today's scope was access gates. A DEFCON-only customer still technically sees all raw data on /client; filtering is v2.
- **GitHub Actions deploy workflow** — `VERCEL_DEPLOY_HOOK` secret missing post-transfer. CLI deploys work fine; actions hook is optional convenience.
- **Stripe LIVE mode flip** — test mode is deliberate for now. [Flip guide in memory](stripe_test_to_live_flip.md) — 3 steps, env swap + setup re-run + verify.

## Sister coordination (today)
- SEB-PROJECTIONS sister (PID 454733): shipped projections v2 + built silt-newsletter.fly.dev (newsletter-daemon). Parked gracefully.
- S.E.B. sister (PID 7581): shipped ou812 decoy hardening + email to Kris earlier in the day. Parked with stash handoff. I mopped up the stash through a queue of coordinated messages via HiveQueen.
- Zero sister conflicts, zero shared-branch clobbers. The queen system earned its keep today.

## Deploy checklist for next session
Nothing urgent. If anything weird surfaces with checkout/entitlements flow:
- Check silt-seb Vercel logs: `vercel logs https://www.silt-seb.com`
- Check webhook signature verification: `STRIPE_WEBHOOK_SECRET` env var
- Spot-check Redis: `HGET seb:user-entitlements <username>` and `HGET seb:user-tiers <username>`
- Confirm the resolver at `S.E.B/src/lib/entitlements.ts` is returning what you expect for that user's combination of tier + hash

## Reflections
- The split between Edge middleware (routing) and Serverless (enforcement) turned out to be a forcing function: middleware with heavy async Redis imports gets silently rejected by Vercel with no useful error. Saved that lesson to memory — future me/sister will hit this again without it.
- The admin UI "Tier" column was lying: 7 of 8 plans all mapped to "Standard," hiding the real plan identity. Marlowe's instinct that "something's off" beat my initial read. Plan column + entitlementsEffective rendering fixes the lie.
- Vercel "Unexpected error" with 0ms build and empty body should be immediately suspect for middleware bundle issues. Not a build error, an orchestration rejection. Don't chase build logs when the symptom is 0ms.
- Kris's Feb rename of middleware.ts → proxy.ts was on a separate branch (`seb-site-main`) that was deployed but never merged to main. That's why local source and deployed behavior disagreed for months. Weird things happen when branches live out of band from main.
- OAuth re-auth pattern that works when browser doesn't launch: `flow.run_local_server(port=FIXED, open_browser=False)` and hand the user the URL manually. Saved as a pattern for future headless-style auth flows.

## Memory Files (current)
- [MEMORY.md index](MEMORY.md)
- [Populate before enforce](populate_before_enforce.md)
- [Keep Edge middleware slim](vercel_middleware_redis.md)
- [Stripe test→live flip](stripe_test_to_live_flip.md)
- [Stripe config](stripe_config.md)
- [Education links](education_links.md)
- (plus older: all_credentials, company_email, sample_report_v2/v3, etc)
