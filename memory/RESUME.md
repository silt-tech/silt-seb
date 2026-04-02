# Resume Point — 2026-04-02

## Current Task
Scanner animations + model strip redesign. All deployed to Vercel.

## State
- Branch: main, clean (all committed + pushed + deployed)
- Last deploy: 25faf53 — live at silt-seb.com

## Completed This Session
1. Red/blue scanner sweeps on model strip (red L→R top, blue R→L bottom, 4px, 3s desktop)
2. SILT logo: black text with red swish scanning L→R across "SILT™ Sentience Evaluation Battery" (7s)
3. Model strip layout: removed pipes, flexbox centered, added "MODELS SUBJECTED TO FULL BATTERY..." header
4. Request Demo button: shrunk ~20%, nudged up 2px
5. Mobile overrides: 3px sweeps, 2s timing, 9s logo swish
6. Deployed 5 times iterating on timing/width/colors
7. Removed header sweep bar (user preferred clean header)

## Animation Speeds (final)
- SILT logo swish: 7s linear (desktop), 9s (mobile)
- Model strip red sweep: 3s ease-in-out (desktop), 2s (mobile)
- Model strip blue sweep: 3s ease-in-out (desktop), 2s (mobile)
- Sweep height: 4px desktop, 3px mobile
- Sweep width: 18%

## Open Bugs
- Twitter bot workflow failing (GitHub Actions)
- None on silt-seb.com

## Next Steps
1. Test mobile on real devices
2. Consider swipe dot indicators under carousels
3. Expand model fleet beyond current set

## Context
- Always commit + push + deploy (user can't check mobile without deploy)
- Logo gradient on .logo wrapper spans both SILT™ and Sentience Evaluation Battery
- User iterated ~15 times on timing — current values are final
