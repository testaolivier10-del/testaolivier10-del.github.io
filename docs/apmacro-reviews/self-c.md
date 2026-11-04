# AP® Macroeconomics: author C self-report (Unit 3), 2026-11-03

## Done

All nine Unit 3 topics: lesson, notes, questions, glossary and one LevlPrep original figure each; one long and two
short FRQs. `node scripts/check-apmacro-content.mjs --topic <id>` is clean for every topic, the full run reports
no FRQ failures, and `node scripts/check-apmacro-map.mjs --check` reports nothing used before it is taught. Built
with `APMACRO_PUBLISHED=unit-3` into a scratch folder: 9 topics, 56 files, every figure, set and graph renders.

| Topic | Items | Numeric | Graph | Sets (data / graph / text) | In sets | Apply/analyze | Notes words |
|---|---|---|---|---|---|---|---|
| aggregate-demand (3.1) | 17 | 2 | 2 (shift, point) | 1 / 0 / 1 | 47% | 94% | about 830 |
| multipliers (3.2) | 17 | 8 | 1 (shift) | 1 / 0 / 1 | 47% | 94% | about 770 |
| sras (3.3) | 17 | 1 | 3 (shift, shift, point) | 1 / 1 / 0 | 41% | 94% | about 730 |
| lras (3.4) | 16 | 1 | 3 (shift, two-curve shift, PPC shift) | 1 / 0 / 1 | 44% | 94% | about 660 |
| adas-equilibrium (3.5) | 16 | 2 | 3 (label, shift + equilibrium, point) | 1 / 1 / 0 | 44% | 94% | about 580 |
| adas-short-run-changes (3.6) | 17 | 1 | 3 (two with equilibrium, one double shift) | 1 / 1 / 1 | 59% | 100% | about 650 |
| long-run-self-adjustment (3.7) | 17 | 1 | 3 (recessionary, inflationary, AD then SRAS) | 1 / 1 / 0 | 41% | 94% | about 630 |
| fiscal-policy (3.8) | 17 | 4 | 2 (shift + equilibrium) | 1 / 0 / 1 | 47% | 94% | about 650 |
| automatic-stabilizers (3.9) | 16 | 3 | 0 | 1 / 0 / 1 | 50% | 94% | about 620 |

150 items. Every numeric key is an `ApMacroCalc` recipe; the reader-report slips are authored mistakes (multiplying
the gap, the spending multiplier for a tax change, 1 / MPC, totals instead of changes for the MPC, adding
imports, a percent change from the wrong base). No distractor uses an absolute word; the key is the longest
option in at most 40% of single items per topic. Every set is invented and labeled; no released question used.

FRQs: `frq-multiplier-short` (spending and tax multipliers, the G rise and the tax cut that close a 200 gap,
why the tax cut is larger), `frq-self-adjustment-short` (graph part on `adas`: labels, SRAS left, outcome; why
SRAS shifts; unemployment in the long run), `frq-recession-long` (10 points: AD-AS graph with the gap and a rise
in G, the multiplier and the G that closes the gap, why a tax cut is larger, a money market graph part with MS
held constant in a limited-reserves framework, self-adjustment and the price level compared). The long one lists
`money-market` and `monetary-policy`, so it unlocks with 4.6.

Figures: `scripts/apmacro-figures/author-c.mjs` writes nine SVGs to `macroeconomics/figures/` (AD movement and
shift, multiplier rounds bar chart, SRAS, LRAS, gaps, demand-pull and cost-push, self-adjustment, fiscal policy
closing a gap, the automatic stabilizer flow).

## Map edits (smallest Edits, my topics only)

- `price-level`: taughtIn `adas-equilibrium` -> `aggregate-demand`, dependsOn `ad-as-model` -> `price-index` (the AD
  curve's vertical axis is the price level, so 3.1 has to name it).
- `long-run` (aliases "short run"): taughtIn `lras` -> `sras` (SRAS is defined by the short run).
- Unit 3 `tools.stimulusThemes`: the 19 sets written (data, graph and text each present).
- `transfer-payments` was moved to `gdp-circular-flow` by author B; I removed my duplicate glossary entry.

## Open points (needs-author, "Author C")

c-expected-inflation (the CED's SRAS shifter uses a term the map teaches in 5.2; worded in plain language; a lead
could move the concept to `sras`), c-transfer-multiplier, c-balanced-budget-use, c-fiscal-lags, c-long-frq-money,
c-downward-stickiness.

## Not mine, seen in the run

`apmacro-build.test.mjs` ("no hub card") and the `adas-lab` and `forex-lab` tool tests fail on files other agents
own; the bank's one near-duplicate pair is `mac-crowding-out-1` / `mac-loanable-funds-12`.
