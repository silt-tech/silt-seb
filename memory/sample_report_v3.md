---
name: Sample Report V3 — Complete Suite
description: 24-page Complete Suite sample report with Projections, deep profiles, test discrimination, judge bias analysis
type: project
---

Sample report PDF rebuilt as "Complete Suite" edition — shows what $650/mo subscribers get.

**Why:** User wanted every page to be a masterpiece, more data density, and a Projections section sample.

**How to apply:** The report builder is at `scripts/build-sample-report.py` (v3). Output: `public/SEB_Sample_Report.pdf`. 24 pages, 1.17 MB. Run `python3 scripts/build-sample-report.py` to regenerate.

## New sections added (v3):
- Fleet Intelligence Briefing — narrative analysis with volatility, asymmetry alerts
- Per-Model Deep Profiles — 6 model cards with domain bars, sparklines, judge perception
- DEFCON Deep Dive — capability-integrity gap analysis with visual bars, risk scenarios
- Domain Deep Dives — per-domain leader/laggard/most discriminating test
- Test Discrimination Analysis — hardest, easiest, most controversial tests
- Judge Agreement & Bias — per-judge mean, σ, bias (+generous/-harsh), agreement stats
- Projections (2 pages) — 3-month trajectory line charts, per-model cards with arrows, domain projections
- Expanded highlights — 10 excerpts (was 6) with 2 judge reasonings each, domain-colored borders

## New chart types:
- `svg_sparkline` — inline mini charts for tables
- `svg_line_chart` — multi-series for projections
- `svg_gauge` — arc gauges for individual metrics
- `svg_variance_bar` — mini bar with range indicator

## New computation functions:
- `compute_judge_stats()` — per-judge bias, σ, mean, agreement stats
- `compute_test_stats()` — per-test discrimination, difficulty, controversy
- `generate_projections()` — 3-month forward trajectories with ceiling effects (seed=42 for reproducibility)
