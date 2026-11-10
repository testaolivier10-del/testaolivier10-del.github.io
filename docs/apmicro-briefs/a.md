# Author A: the "Graph skills you need" chapter, Unit 1

Read `docs/apmicro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (10)

`scarcity` (1.1), `economic-systems` (1.2), `production-possibilities` (1.3), `comparative-advantage` (1.4), `cost-benefit` (1.5), `marginal-analysis` (1.6), `axes-points` (skills), `slopes-curves` (skills), `shifts-movements` (skills), `curves-crossing` (skills).

## FRQs

- `short` on `comparative-advantage` (graph part: `ppc`): Two producers' PPCs: opportunity cost, comparative advantage and terms of trade that help both. File `microeconomics/data/frq/frq-ppc-trade-short.json` (id `frq-ppc-trade-short`).
- `short` on `marginal-analysis`: A consumer with a budget: marginal utility per dollar, the utility-maximizing bundle and a sunk cost that changes nothing. File `microeconomics/data/frq/frq-consumer-choice-short.json` (id `frq-consumer-choice-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `microeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `microeconomics/figures/` (ids starting with your topic ids); `scripts/apmicro-figures/author-a.mjs` if you generate figures; your report `docs/apmicro-reviews/self-a.md`.

## Notes for your topics

The graph skills chapter is free and sets up every graph and every area in the course: draw each idea on a graph (two axes, a point, a slope, a shift versus a movement, a crossing, the area of a rectangle and a triangle), with graph items of every task (label, shift, point, shade). Unit 1 is free too: the PPC (inside, on, outside; bowed out for increasing opportunity cost, straight for constant, `bow: 'in'` only as a labeled contrast; growth), comparative advantage from output and input tables with terms of trade between the two opportunity costs (every opportunity cost an `ApMicroCalc` recipe), cost-benefit and marginal analysis, and consumer choice with MU per dollar (no indifference curves). Write the 1.1, 1.3, 1.4 overlap with AP® Macroeconomics fresh, with micro examples (a firm, a consumer, one market), using Macro's files only as a starting draft (spec section 4).
