# Resume Point — 2026-04-22 (late evening, deletion-flow session)

## Current Task
**PARKED.** 30-day grace-period deletion flow shipped and live end-to-end across silt-seb (webhook + ToS) and S.E.B. (cron + admin visibility). Kris's signup → cancellation → delete-after-grace path is now fully wired.

## State
- silt-seb: branch `main`, working tree clean, deployed live at https://www.silt-seb.com
- S.E.B.: branch `main`, working tree clean, deployed live at https://www.sentienceevaluationbattery.com
- Both repos: no open PRs, no uncommitted work.
- One PR merged-but-reverted on S.E.B.: auto-publish auth tightening (see "Parked" below).

## What Shipped Today

### silt-seb (PR #4, merged + deployed)
- Stripe webhook now stamps `seb:deletion-queue[username]` on `customer.subscription.deleted` with `scheduledAt = now + 30d`. Reactivation within the grace window (`customer.subscription.updated → active`) HDELs the queue entry so no manual intervention needed.
- New exports in `lib/stripe.ts`: `DELETION_QUEUE_KEY`, `DELETION_GRACE_DAYS = 30`, `DeletionQueueEntry` interface.
- Subscriber agreement bumped to v1.1, effective 2026-04-22. New Section 14 "Data retention and deletion" spells out the 30-day grace window, what gets deleted (account, vault, stripe mappings), what SILT retains (billing records via Stripe), and provides an expedited-deletion contact path. Section 10 cross-refs Section 14. Changelog entry preserves v1.0 for audit.

### S.E.B. (PR #8, merged + deployed)
- `/api/cron/hard-delete` drains `seb:deletion-queue` daily at 03:00 UTC. For each entry past `scheduledAt`, permanently removes: `seb:users[u]`, full `vault:seb:<u>:*` keyspace (meta + passphrase + entries + every entry), `vault:registry[seb:<u>]`, `seb:stripe:{subscription,customer,email,temp-password}` mappings. Writes an audit line to `seb:deletion-log` (bounded at 500).
- Safety: `CRON_SECRET` bearer auth, `MAX_DELETIONS_PER_RUN = 25` cap (oldest-overdue drained first), `?dryRun=true` for preview, per-user try/catch so malformed entries don't abort the batch.
- Stripe-side customer records untouched — billing/tax audit trail lives there, not in Redis.
- Sessions not actively scanned (24h TTL << 30d grace).
- `sebKeys.deletionQueue()` / `sebKeys.deletionLog()` added to the namespace.
- `/admin/users` now shows "🕐 purges in Nd" under the cancelled chip for anyone in the queue, with the exact scheduledAt in the tooltip. A "CANCEL DELETION" button appears only when `pendingDeletion` is set; clicking it fires a confirm dialog, then PATCHes `cancelDeletion: true` to HDEL from the queue. Vault stays intact; tier/entitlements remain cleared.

### Operations (fixed mid-session)
- **`CRON_SECRET` env var was never set on S.E.B.'s Vercel project.** Generated a fresh 64-char hex secret, set it via `vercel env add CRON_SECRET production`. Gotcha: `openssl rand -hex 32` outputs a trailing newline; had to pipe through `tr -d '\n'` on the re-add. Both crons (auto-publish + hard-delete) now authenticate correctly.
- Confirmed auto-publish hasn't been silently 401-ing all along — its auth check was gated on `cronSecret` being truthy, so with `CRON_SECRET` unset the auth check was skipped entirely. Endpoint was technically open to the internet, but the route no-ops when the admin toggle is off (which it has been), so the hole was low-consequence.

## Auto-publish fail-closed tightening — SHIPPED (after one late-night reattempt)
- Small follow-up (commit `f5827fd`) tightens `/api/cron/auto-publish` auth — require `CRON_SECRET` to be set AND match (matches hard-delete's pattern). Change was just 2 lines: `if (cronSecret && ...)` → `if (!cronSecret || ...)`.
- Earlier tonight this deploy failed 10+ times in a row with the orchestration rejection (including content-identical to a 43s-earlier successful deploy). Reverted.
- Retried later the same session — **deployed clean in 38s on first try.** Vercel's rejection was fully transient / cache-state noise, zero code issue. Lesson reinforced: the 0ms error isn't deterministic; sometimes the same commit that failed 10× will deploy 15 min later.

## Architecture now (unchanged — summary for context)

```
silt-seb.com (pricing)                   sentienceevaluationbattery.com (data)
├─ /                 pricing page        ├─ /                  Basic Auth (admin)
├─ /api/stripe/      checkout/webhook    ├─ /admin/            Basic Auth (admin)
│                                        ├─ /client            session cookie
│                                        ├─ /seb-projections   session cookie + entitlements.projections
│                                        ├─ /api/cron/         CRON_SECRET bearer
│                                        └─ /api/*             mix of Basic / session / public

         shared Upstash Redis: seb:users, seb:user-tiers,
         seb:user-entitlements, seb:stripe:*, seb:session:*,
         seb:deletion-queue, seb:deletion-log
```

## Deletion flow end-to-end
1. Subscriber cancels in Stripe portal → webhook `customer.subscription.deleted` → tier + entitlements cleared, `seb:deletion-queue` stamped with `scheduledAt = now + 30d`.
2. Access revoked immediately; account + vault preserved for 30 days.
3. Reactivation within 30d → webhook `customer.subscription.updated → active` → queue entry cleared, access restored.
4. Else, daily 03:00 UTC cron purges user + vault + stripe mappings. Writes audit to `seb:deletion-log`.
5. Admin can see "🕐 purges in Nd" countdown per user in `/admin/users`. "CANCEL DELETION" button saves a soul manually (vault preserved, tier/entitlements stay cleared — user must resubscribe to regain access).

## Deploy verification
- `curl -H "Authorization: Bearer $CRON_SECRET" 'https://www.sentienceevaluationbattery.com/api/cron/hard-delete?dryRun=true'` returns `{"ok":true,"mode":"dryRun","queueSize":0,...}` ✓
- `curl 'https://www.sentienceevaluationbattery.com/api/cron/auto-publish'` returns 401 (Bearer required because `CRON_SECRET` is set) ✓

## Next Steps
1. Retry the auto-publish tightening PR tomorrow (content is just 2 lines; tree state is clean).
2. Welcome email with temp password — temp password sits in Redis for 24h, no email auto-send yet.
3. Username case normalization — lowercase at login to avoid Eddie/eddie collisions.
4. Product-level data filtering inside /client (DEFCON-only customer currently sees S-Level sections and vice versa — v2 work, explicitly deferred in yesterday's park).
5. Stripe LIVE mode flip — still deliberate wait; see `stripe_test_to_live_flip.md`.

## Reflections (Vercel rollercoaster)
- "Unexpected error" with a 0ms build is Vercel's orchestration layer rejecting before build even runs. It has at least three possible causes: heavy Edge middleware bundle (the documented case), transient orchestration flake (today — `vercel-status.com/history` listed `INTERNAL_UNEXPECTED_ERROR` as a recurring Hobby-plan issue in the last 72h with 5 separate incidents), and cache/deployment-state weirdness I still don't fully understand.
- My mistake early in the session: I panic-reverted my merge after 3 consecutive failures, assuming my code was broken. Then cherry-picked it back commit-by-commit and **every single deploy succeeded** with identical code. So the initial 3 failures were pure flake. Wasted ~30 min reverting and bisecting.
- Late-session variant: auto-publish tightening failed 10+ consecutive times, but deploying 147f292 (the commit it was based on) succeeded in 43s. Proved the tightening content was the trigger. Then I reset the file to 147f292's EXACT content and re-deployed on main — **that also failed**. Content-identical to the just-successful deploy. Vercel's cache/dedup has some state it's keying off beyond file content (probably a commit SHA or branch fingerprint), and that state is rejecting this combination.
- Lesson: on first 0ms "Unexpected error," check `https://www.vercel-status.com/api/v2/incidents.json` AND deploy the pre-change state. Those two actions in under a minute would have shortcut both of today's panics.
- Also noted: `vercel ls <project>` shows historical Ready/Error pattern — if the account/project has had interleaved failures recently, transient cause is vastly more likely than code cause.

## Memory files (current)
- [MEMORY.md index](MEMORY.md)
- [Populate before enforce](populate_before_enforce.md)
- [Keep Edge middleware slim](vercel_middleware_redis.md)
- [Stripe test→live flip](stripe_test_to_live_flip.md)
- [Stripe config](stripe_config.md)
- [Education links](education_links.md)
