# Tools upgrade (2026-10)

Status file for the tools work the owner asked for on 2026-10-27: a hands-on pass through every tool, then
three builds. Read this before continuing any of it.

## Owner brief

- Research (2026-10-27) compared LevlPrep's tools with what students use and want. The owner chose three builds:
  1. NREMT exam formats: drag-and-drop and options-table items (the Registry's technology-enhanced items), real
     dragging for build-list items, then an adaptive exam mode that stops early like the real exam and reports
     each domain as above, near or below passing.
  2. An ochem synthesis trainer: start material to target, step by step, with the reason when a route dead ends.
  3. A&P in 3D, reusing the NREMT body map engine (`nremt/assets/body-viewer.js`).
- First: a hands-on pass through every tool, rated against the body map bar (just works, very interactive, good
  information, good at its job, interesting; simple on landing with progressive disclosure; professional
  illustration quality; readable on a phone; opens full screen as just the tool).
- Ships as one pull request the owner reviews before merging.

## Hands-on pass

Harness: loads every tool at 390 px and 1280 px with Premium unlocked locally, records console errors, failed
requests and sideways scroll, and screenshots before and after interacting. Mechanical result: every tool page
loads clean; `nremt/sound-trainer.html` and `bio/tools/tree-reading.html` scroll sideways at 390 px.
Per-tool ratings and fixes: `docs/tool-audit-2026-10.md`. Fixing those findings is not part of the three builds;
it waits for the owner's go-ahead.

## Builds

| Build | Status | Files |
|---|---|---|
| NREMT item types and adaptive exam | in progress | |
| Ochem synthesis trainer | in progress | |
| A&P 3D anatomy | in progress | |

## Decisions

## Open points
