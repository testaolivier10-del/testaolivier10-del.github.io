# Builder T2 self-review: `frq-coach` and `scale-lab` (2026-11-09)

Per-tool reports: `tools-frq-coach.md`, `tools-scale-lab.md`. Nothing committed (the lead commits).

## Built

- `scale-lab` (free): Explore with four scales of one invented data set (world, world regions, Country A whole,
  Country A by province) and a six-step map-scale ladder with drawings; five seeded drill kinds (identify the
  scale of the data, across scales in Country A, five dated real cross-scale chains, a source at the wrong scale,
  map-scale arithmetic with `ApHugCalc.mapToGround`).
- `frq-coach` (Premium): eight original questions across the skills chapter and Units 1-7 (27 parts, all six
  verbs); Explore part by part (verb and demand, writing box with `ApHugGrade.flags` checklist, rubric line and
  sample, "which answer earns the point"); three drill kinds.
- Covers `assets/covers/tools/aphug/{scale-lab,frq-coach}.svg` and `index.json` (created; only my two entries).

## Tested

- `node --test scripts/test/aphug-tool-scale-lab.test.mjs scripts/test/aphug-tool-frq-coach.test.mjs`: 11 pass.
- `node scripts/check-aphug-content.mjs`: tools 0 failing (300 seeds per context and type, keys recomputed).
- Scratch build `APHUG_PUBLISHED=geo-skills,unit-1..unit-7 node scripts/build-aphug.mjs --out /tmp/hug-t2/...`,
  served on 8822, Playwright at 360 and 1280, light and dark: no overlapping labels, no console errors besides
  the sandbox's blocked external hosts.

## Requests for the lead (shared files; worked around locally)

1. **Load `hug-map.js` on tool pages.** `tail()` in `scripts/lib/aphug-build.mjs` expands `hug-questions.js` to
   `['hug-math.js', 'hug-calc.js', 'hug-grade.js', 'hug-model.js', f]`; add `'hug-map.js'` after `'hug-model.js'`
   (map trainers T3 and T4 need it too). Until then `scale-lab.js` injects `../assets/hug-map.js` when
   `window.ApHugMap` is missing; that branch can stay as a fallback.
2. **`ApHugMath.diagnose` sign slip** (`human-geography/assets/tools/hug-tool-math.js`): the message "Below the
   mean, a z score is negative." is left from Psychology. Suggest: "The size is right but the sign is wrong."
   No T2 drill reaches it (all keys are positive), but other trainers may.

## Open points

- Explore's global and regional views put invented values on real outlines (spec allows it, labeled "Invented
  data for practice" and redrawn on New data set). A reviewer may prefer an abstract variable name.
- The regional map shades disputed territories with their world region's class (`disputedOk`); by-country maps
  leave them hatched as no data.
- Chain cases and FRQ contexts use real places (Riau, Flint, Miami Beach, Brasilia, Poland and the UK, the
  Netherlands, Punjab, the Berlin Conference): due for the Phase 4 accuracy pass.
