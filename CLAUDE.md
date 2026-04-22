# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
npm run dev      # Start local dev server at http://localhost:3000
npm run build    # Production build
```

There are no tests or linting configured in this project.

## Environment

Redis connection via Upstash. Set in `.env.local`:

```
KV_REST_API_URL=https://calm-colt-53570.upstash.io
KV_REST_API_TOKEN=<token>
```

Same Redis instance as S.E.B. and silt-vault.

## Deployment

Deploy with Vercel CLI directly:

```bash
vercel --prod
```

- **Vercel project**: `silt-seb`
- **Repo**: `silt-tech/silt-seb.git` (origin — transferred from izabael/ 2026-04-22)
- **Domain**: silt-seb.com

## Architecture

This is a **Next.js 16 App Router** site — the public-facing S.E.B. dashboard at silt-seb.com.

### Route structure

- `/` — Public landing page: model evaluation cards, domain scores, DEFCON ratings, pricing section
- `/api/revalidate` — On-demand ISR revalidation endpoint (secret: `seb-refresh-2026`)

### Data layer (`lib/`)

| File | Purpose |
|---|---|
| `seb-data.ts` | Server-side data aggregation — fetches from Redis (`seb:results`), computes model summaries, domains, DEFCON, S-Levels |
| `redis.ts` | Upstash Redis client singleton |

### Key design decisions

- **Server-side rendering** — data aggregation runs on the server, not client
- **Dynamic model discovery** — models are auto-discovered from Redis keys, not hardcoded
- **On-demand revalidation** — ISR triggered by `/api/revalidate?secret=<token>`, not time-based
- **No auth** — this is the public-facing site, all content is freely visible
- **Inline styles** — no CSS framework, all styling inline

### Cross-project: Education links ↔ siltcloud.com

The 4 education link buttons (above DEFCON section in `app/page.tsx`) deep-link to anchor IDs on `siltcloud.com/silt-education`. The anchor IDs live in `siltcloud/app/components/EducationTabs.tsx`. If section IDs change on siltcloud, update the `key` values in the education links array here. Current mapping:

| silt-seb label | siltcloud anchor ID |
|---|---|
| The Code That Wakes Up | `#why-it-matters` |
| Sectors Requiring AI Governance | `#sectors-governance` |
| The Sentience Evaluation Battery | `#seb-framework` |
| Custom AI Governance Training | `#training-contact` |

### Shared Redis (seb namespace)

- `seb:results` — raw SEB evaluation results (same data as sentienceevaluationbattery.com)
- Same Upstash instance as silt-vault (`calm-colt-53570.upstash.io`)
