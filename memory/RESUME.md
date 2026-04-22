# Resume Point — 2026-04-22

## Current Task
Repo migration housekeeping. silt-seb was transferred from `izabael/` to `silt-tech/` org today.

## State
- Branch: `izabael/add-grok-4.20` — 8 commits ahead of `origin/main`, no PR open
- Origin: `https://github.com/silt-tech/silt-seb.git` (transferred 2026-04-22)
- Working tree: CLAUDE.md has one pending edit (repo path update) — committed during this park

## Completed This Session (2026-04-22)
1. **Transferred `izabael/silt-seb` → `silt-tech/silt-seb`** via `gh api` POST /transfer
2. Updated local git remote to new silt-tech URL — fetch/push verified
3. Updated project CLAUDE.md + memory/MEMORY.md with new repo path
4. Investigated duplicate repos at izabael/ vs silt-tech/:
   - `seb-demos` and `seb-projections` existed at BOTH orgs
   - izabael/ copies were abandoned stubs (2 commits, 1 KB, frozen since 2026-03-27)
   - silt-tech/ copies are canonical (30+ commits, built-out)
5. **Archived** `izabael/seb-demos` and `izabael/seb-projections` via PATCH /repos (not deleted — user preferred archive). Descriptions updated to point at silt-tech canonicals.

## Open Action (needs human)
- **Vercel reconnect** — after the silt-seb transfer, Vercel's GitHub integration for auto-deploy-on-push likely broke. CLI deploys (`vercel --prod`) keep working; auto-deploy does not until reconnected at https://vercel.com/izabael/silt-seb/settings/git

## Deferred (per user — "leave 2 and 3 alone")
User explicitly said NOT to touch these this session:
- `izabael/ai-playground` — ambiguous whether it's a SILT product (powers izabael.com as "flagship instance of SILT AI Playground") or Izabael personal infra. Stays at izabael/ for now.
- `izabael/SILT-PC` + `izabael/silt-seb-twitter` — both are clearly SILT-branded, both still at izabael/. Eventually should move to silt-tech/ but not this session.

## Context for Future Sessions
- The convention going forward: **all official SILT repos live at silt-tech/**. Izabael personal stuff (izabael-com, izabael-home, war-dreams, izaplayer, izadaemon, sss-launcher, lucid-dream-journal, alchemy-pathworking, forks) stays at izabael/.
- `silt-tech/` roster now: SEB, silt-site, siltcloud, silt-seb (new), silt-forge, silt-atlas, seb-demos, seb-projections, silt-guardrail, silt-vault, silt-gateway, silt-pipeline, QuantumProofVault = 13 repos
- `izabael/add-grok-4.20` branch has a lot stacked: Grok 4.20 + Grok 4.1 Fast models, /press nav, landing v2.0 catch-up, Sample Report PDF overhaul (Behavioral Observations page, redacted names, live-Redis randomization). Ripe for a PR when the human is ready.

## Reflections
- Duplicate repos on 2026-03-27 were a quiet footgun — same-day creation at both orgs, same scaffolding SHAs, then only one side kept moving. Archive banner is the right signal for abandoned husks; deleting would have cost `delete_repo` scope refresh which the human didn't want to do.
- `gh repo transfer` is async — the API response shows pre-transfer state. Poll or just wait a few seconds before verifying.
- When in doubt about whether something is "SILT official" vs "Izabael personal," ask. The ai-playground question had a real answer only the human could give.
