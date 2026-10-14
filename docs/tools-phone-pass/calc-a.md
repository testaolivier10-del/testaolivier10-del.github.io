# Phone pass: AP® Calculus AB group A (limit-explorer, tangent-tracer, rule-drills), 2026-10-13

Rules: `docs/tools-phone-pass.md`. Checked at 360×740, 390×844, 740×360 and 1280×800, light and dark, Explore, every
drill kind at 360 px and the Enlarge view, with Playwright, measuring rendered on-picture text (font size × the
svg's screen scale). Screenshots (scratch, not committed):
`/tmp/claude-0/-home-claude-testaolivier10-del-github-io/1e00213e-3bb5-50fc-a8ac-0b1f2469eb3d/scratchpad/rev-a/shots/`
(`before-*` and `after-*`, named `<tool>-<size>-<theme>-<view or kind>.png`).

Shared fix cleanup: the per-tool `body.ls-on .calc-crumb{display:none}` workaround is removed from all three CSS
files (tool-studio.css hides the calc crumb now).

## limit-explorer

- Smallest on-picture text at 360 px: 11.5 px (compact table) → 12 px; key numbers in the table 11.5 → 14 px.
- Graph labels 13 px on phones (`.ls-phone .le-graph svg`), checklist and verdict 13 px.
- Drill plots (graph, classify) 13 px on phones; drill value tables 14 px.
- IVT drill: the plot of the table points was hidden on phones; now the table sits over the plot in portrait, and in
  landscape both show side by side with compact tables, the plot drawn at its true width (no scaled-down labels).
- Problem statements on the stage set fractions and limits full size (`math-style: normal`).
- Enlarge: the graph re-lays out (344×524 at 360 px); the table stays below it. Nothing under the Enlarge button.
- Left: Explore desktop text sizes unchanged (11.5 px headers at 1280 px).

## tangent-tracer

- Explore svg text 12 → 13 px on phones (titles 14 px); h-ruler labels 11 → 12 px.
- Drill figures (`.tt-qstage`) were 11 px (shared plot default) → 13 px on phones; sketch "?" and badges 12 px;
  the four "which graph" thumbnails were already a 2×2 grid (about 170 px each at 360 px).
- Rate-table drill on a narrow stage: x-axis says just "t" (unit in the table) and runs past the last time, so the
  label no longer sits on the last point; 40 px kept clear for the Enlarge button.
- Not-differentiable: the "y" axis label dropped when a dashed mark is at x = 0 (it covered "x = 0").
- Handles: P r = 24 and Q r = 22 hit circles (48/44 px); sketch points take the whole column (≥ 28 px either side).
- Enlarge: both panels re-lay out (344×626 at 360 px).

## rule-drills

- Explore on a narrow stage showed only the first level of the tree and left the lower half of the stage empty.
  Now it draws up to three levels when every card fits (390 px: three levels), drops levels until nothing is cut,
  and when 170 px or more are left it also draws f and f′ below (360 px: one level plus the graph).
- Tree labels: role 11 → 12 px, rule 12.5 → 13 px on phones; drill and side plots 13 px.
- Wide stage (≥ 720 px) unchanged.

## Checks

Validators and tests pass after the changes (`node --test scripts/test/apcalc-tool-{limit-explorer,tangent-tracer,rule-drills}.test.mjs`).
No horizontal scroll at any size; no console errors (blocked analytics only). Graded behaviour, ids and recording
unchanged.
