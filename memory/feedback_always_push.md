---
name: Always Push
description: User wants git push after every commit, no need to ask
type: feedback
---

Always push AND deploy after committing. Don't ask, just do it.

**Why:** User checks changes on mobile via silt-seb.com — can't see them without deploy.

**How to apply:** Every `git commit` should be followed by `git push` and `vercel --prod` in the same step.
