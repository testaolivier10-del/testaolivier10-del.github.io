# Author A self-report: "Graph skills you need" and Unit 1 (2026-11-03)

## Topics done (10 of 10)

Each topic has its lesson, notes, questions and glossary; every lesson has a figure.

| Topic | Items | Graph | Numeric | Specific | In sets (kinds) | Apply/analyze | Notes words |
|---|---|---|---|---|---|---|---|
| axes-points | 11 | 2 | 1 | 0 | 36% (data) | 82% | 717 |
| slopes-curves | 11 | 2 | 3 | 0 | 27% (data) | 82% | 646 |
| shifts-movements | 12 | 3 | 0 | 1 | 25% (text) | 83% | 706 |
| curves-crossing | 10 | 2 | 1 | 0 | 60% (graph, data) | 90% | 611 |
| scarcity | 16 | 0 | 0 | 0 | 50% (text, data) | 81% | 788 |
| opportunity-cost-ppc | 18 | 6 | 3 | 0 | 44% (data, graph) | 94% | 790 |
| comparative-advantage | 16 | 0 | 3 | 0 | 56% (data, data) | 94% | 776 |
| demand | 18 | 5 | 1 | 1 | 44% (data, text) | 89% | 726 |
| supply | 16 | 5 | 1 | 1 | 50% (data, text) | 94% | 677 |
| market-equilibrium | 19 | 5 | 2 | 1 | 58% (data, graph, text) | 95% | 725 |

147 items. The four graph skills topics are `kind: skill`, so the 15-item and 40%-in-sets minimums do not apply.
Each still has a set. Graph items cover label, point (on a curve, and inside, on and outside a PPC), shift
(D, S, PPC out and in) and shift plus equilibrium, including a two-curve shift with the indeterminate price left
out of `outcome`. Every opportunity cost, slope, shortage and surplus is an `ApMacroCalc` recipe, and the usual
slip is an authored mistake: an inverted ratio, the level read as the change, quantities added.

## FRQs

- `frq-ppc-trade-short` (5 points): A, a graph with labels and point U inside, both `auto` (2); B, Lomar's
  opportunity cost (1); C, comparative advantage in corn, explained (1); D, terms of trade that help both (1).
  The data (Kestria, Lomar) differ from every lesson and notes example.
- `frq-market-shift-short` (5 points): A, a graph with labels, S shifted left and the outcome, all `auto` (3); B,
  the shortage at the old price (1); C, how the shortage moves the market to equilibrium (1).

## Figures

The generator is `scripts/apmacro-figures/author-a.mjs`, and it writes 12 SVGs to `macroeconomics/figures/`
plus the registry files `macroeconomics/data/figures/<topic>.json`. Numbers in the figures come from
`ApMacroCalc`. All figures are white-background LevlPrep originals, and every one was checked by eye after
rendering. No `labels/` files.

## Map edits (`docs/apmacro-dependency-map.json`, smallest Edits)

- New concepts: `trade-off` (scarcity), `capital-goods` and `attainable` (opportunity-cost-ppc),
  `output-input-method` (comparative-advantage), `income-substitution` (demand), `disequilibrium`
  (market-equilibrium). Each one is defined in its topic's glossary.
- `stimulusThemes`: 12 in unit-1 (data, graph and text) and 3 in graph-skills (data, text, graph).

## Checks

- `node scripts/check-apmacro-content.mjs --topic <id>`: ok for all 10 topics. The full run reports 0 failing,
  and both FRQs pass.
- `node scripts/check-apmacro-map.mjs --check`: nothing used before it is taught.
- `APMACRO_PUBLISHED=graph-skills,unit-1 node scripts/build-apmacro.mjs --out <scratch>`: 10 topics, 62 files.
- `node --test scripts/test/apmacro-*.test.mjs`: 118 of 121 pass. The 3 failures are outside author A's files:
  `apmacro-build.test.mjs` "no hub card", and `adas-lab` and `forex-lab` "context c1: lists no types".

## Open points (in `docs/apmacro-needs-author.md`, section Author A)

`a-ppc-straight` (the `ppc` kind is bowed only; trade PPCs are straight), `a-ppc-growth-words`,
`a-shortage-scarcity`, `a-supply-slope-reason`, `a-demand-determinants`.

## Shared-file change wanted

`macroeconomics/assets/mac-graph.js` (T1 or the lead): an option for a straight-line PPC, so the trade FRQ and
`ppc-trade` can draw constant-cost curves (see `a-ppc-straight`).
