# AP® Microeconomics launch: running log

A restart picks up from the last line. Steps, as the AP® Macroeconomics launch (`docs/apmacro-reviews/launch.md`):
(1) merge main; (2) close the open review points (phone legibility, matrix units, tool titles, natural wording);
(3) publish and register live, every generator, site-wide wording; (4) final identity; (5) launch leftovers;
(6) SQL; (7) full CI with browser checks and a look at 360 and 1280, light and dark; (8) spec, CLAUDE.md, owner
checklist.

## 1. Merge main

- `git fetch origin main` (2026-11-10): main is still `b30de6b0` ("My class: do not jump to the top when switching
  pages (#177)"), the commit the branch forked from. Nothing to merge, no shared-page changes to carry over.

## 2. Open review points

- (a) cost-lab and firm-market, every drill kind at 360, light and dark, walked to the end (Playwright walker from
  the tools review, with a step that closes any sheet; scripts in `/tmp/micl/`). All ten kinds finish, Keep going
  shows, no console error. The Explanation sheet does not open by itself after Show the answer; the review's walker
  had left it open from its own sweep. Found and fixed: in cost-lab's Explore, with both a fixed and a per-unit cost
  moved, six curve labels crowded the top right on a phone (MC1, MC2, ATC1, ATC2, AVC1, AVC2) and P_BE touched the
  axis title. On a stage under 480 px the faded curves are now unlabeled (engine option `oldLabels: false`, live
  labels unnumbered with `curveN: ''`), and a high P_BE moves the axis title to the foot of the axis. The engine's
  label width estimate was low for the site font (MC is 23 px, not 18): `box()` now takes 10.5 px a character and 7
  a subscript, labels keep 4 px apart across, and a label with no slot near its curve's end walks back along the
  curve (old curves too) instead of landing on another label.
- (b) Graph Studio at 360: axis marks are spread with measured widths (8.2 px a character, 8.8 an uppercase subscript
  letter, 5.8 another, 4 px apart across, 20 down the axis), so QSUB and QE, QD1 and QD2 no longer touch; the horizontal axis title sits 4 px lower so subscripted
  marks under it (qF, Q2 on the labor graphs) clear it.
- (c) Graph stimuli on a phone: a graph drawn under 306 px wide gets `data-fit` xs or xxs (`mic-core.js`, a
  ResizeObserver; trainer stages are left alone) and `mic.css` sets larger words, so cell letters and marks render at
  about 10 px or more (were 8.7 at 286 px). Payoff matrix row headers no longer break inside a word
  (`overflow-wrap: normal`; the wrapper scrolls if a long name needs it).
- (d) Payoff matrix units: `matrix.unitLabel` (`mic-matrix.js`) is the caption's unit in words. Set on the two FRQs
  (`frq-game-monopoly-long` thousands, `frq-game-theory-short` hundreds), bank items 9, 11 (thousands of new
  subscribers, no longer "20 thousand" in every cell), 14, 15, 16 and stimulus s3, both exam matrices and every
  game-lab matrix (the plug-standard game is in millions, and its tax line now says millions). The content check
  fails a matrix whose text counts payoffs in hundreds, thousands or millions without a matching `unitLabel`
  (`matrixUnitProblems`, tested).
- (e) Tool names: `pages.json` `name` now equals the cover title for all eight (Graph Studio, Elasticity Lab,
  Surplus and Policy Lab, Cost Curve Lab, Firm and Market Lab, Game Theory Lab, Factor Market Lab, Externality Lab),
  so the h1, the studio header, the page title, the course home tool list and the cover agree.
- (f) Natural wording restored: 1.5 says "total cost" (was "full cost") in its lesson, notes, questions and glossary;
  1.6 says "marginal cost" (was "additional cost") and its MC preview box is now plain text; 1.3 says "better
  technology" (was "better methods"); 3.2's food-truck item and notes table say "lump-sum tax" (was "lump-sum license
  fee"); the duplicate `lump-sum-tax` in `glossary/externalities.json` is gone. Map check and content check clean.
- Found by the map check once the chapters are published (80 pages scanned, none before): every 5.1 labor graph's
  firm panel read "S = MFC = W", and MFC is taught in 5.2. The engine's `labor` kind takes `mfc: false` (the line
  reads "S = W"); the five 5.1 labor graphs set it (tested).
- Standalone figures (`check-legibility`, 16 lines through labels in 10 author figures): labels moved in
  `scripts/apmicro-figures/author-b.mjs`, `author-d.mjs` and `author-e.mjs` (E1 and E2 into the right wedge of their
  curves, CS between MR and D, Profit under ATC, D = MSB under its curve's end, the tax DWL label below demand).
