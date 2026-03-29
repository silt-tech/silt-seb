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
- **Repo**: `izabael/silt-seb.git` (origin)
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

### Shared Redis (seb namespace)

- `seb:results` — raw SEB evaluation results (same data as sentienceevaluationbattery.com)
- Same Upstash instance as silt-vault (`calm-colt-53570.upstash.io`)
