# Legibility sweep (2026-11)

Owner request: every table, figure, diagram and graph on the site must be easy to read, with no words crowding,
overlapping, cut off or crossed by lines. Branch `fix/legibility-sweep`, shipped as a pull request.

## The check

`scripts/check-legibility.mjs` renders each course page (desktop 1280px and phone 390px) and each standalone
`*/figures/*.svg` in Chrome and flags:

- `table-gap`: neighbouring table cells closer than 10px (screen-reader-only text ignored);
- `svg-overlap`: two labels overlapping (stacked lines of one label, exact duplicates and halo copies ignored);
- `svg-clipped`: a label cut off by the figure or a scrolling/hidden-overflow ancestor;
- `svg-line-through`: a line, curve or arrow drawn through a label. Uses hit testing, so clipped curve parts and
  lines hidden behind a filled box do not count; a thin grid line behind a haloed label does not count.

Run: `CHROME=/usr/bin/google-chrome node scripts/check-legibility.mjs [files...]` (all pages when no files).
Playwright's own Chromium download is blocked in the cloud container; use the system Chrome.

## Fixes

- `assets/theme.css`: readable default padding for every table (the A&P word parts table was the report).
- A&P action potential graph: label moved off the curve and arrows.
- Figure fixes per course: see the commit log on the branch. Rule for fixes: move, resize, add a halo or reroute
  a line; never change wording (a label may be split onto two lines). A&P and ochem fixes are layout only.

## Status

- Full sweep (5,808 renders) done 2026-11-03. Tables clean. 130 pages/figures still flagged after the checker
  was tightened (A&P 26, calculus AB+BC 39, precalculus 30, ochem 8, bio/chem/env/physics/psych 18), being fixed.
- Not covered: figures that only appear after clicking inside a tool.
