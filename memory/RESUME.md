# Resume Point — 2026-03-31

## Current Task
Added DNA tagline to hero + trademark claims in footer. All deployed to Vercel.

## State
- Branch: main, dirty (app/page.tsx modified, not yet committed)
- 3 commits ahead of origin (unpushed)
- Deployed to Vercel (silt-seb.com) — live with all changes

## Completed This Session
1. Added "DNA is *also* just lines of code†" tagline under stats bar in hero
2. Georgia serif, maroon (#7c2d3e), 22pt — only "also" in italics
3. Dagger footnote in footer with DNA vs AI data comparison
4. Trademark claim in footer for both taglines ("DNA..." and "Know What Your AI Is Becoming")
5. Fixed emoji cross → unicode dagger (mobile rendering issue)
6. Tightened hero bottom padding (60px → 30px) for snug fit above model strip

## Open Bugs
- Twitter bot workflow failing (GitHub Actions)
- None on silt-seb.com

## Next Steps
1. Push 3 local commits + new commit to origin
2. Test mobile on real devices, iterate on spacing
3. Consider swipe dot indicators under carousels
4. Expand model fleet beyond current set

## Context
- Used `†` (U+2020 DAGGER) not `✝` (U+271D LATIN CROSS) — the emoji version renders as colorful cross on iOS/Android
- Hero padding reduced to 30px bottom to keep tagline snug above dark model strip
- Footer footnote is 9pt, rgba(255,255,255,0.45) — slightly larger than other legal text
