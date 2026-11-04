# Author A: the "Graph skills you need" chapter, Unit 1

Read `docs/apmacro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (10)

`scarcity` (1.1), `opportunity-cost-ppc` (1.2), `comparative-advantage` (1.3), `demand` (1.4), `supply` (1.5), `market-equilibrium` (1.6), `axes-points` (skills), `slopes-curves` (skills), `shifts-movements` (skills), `curves-crossing` (skills).

## FRQs

- `short` on `opportunity-cost-ppc` (graph part: `ppc`): Two countries' PPCs: opportunity cost, comparative advantage and terms of trade that help both. File `macroeconomics/data/frq/frq-ppc-trade-short.json` (id `frq-ppc-trade-short`).
- `short` on `market-equilibrium` (graph part: `sd`): A market after a change in input costs: the curve that shifts, the new price and quantity, and the shortage at the old price. File `macroeconomics/data/frq/frq-market-shift-short.json` (id `frq-market-shift-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `macroeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `macroeconomics/figures/` (ids starting with your topic ids); `scripts/apmacro-figures/author-a.mjs` if you generate figures; your report `docs/apmacro-reviews/self-a.md`.

## Notes for your topics

The graph skills chapter is free and sets up every graph in the course: draw each idea on a graph (two axes, a point, a slope, a shift versus a movement, a crossing), with graph items of every task (label, shift, point). Unit 1 is free too: the PPC (inside, on, outside; bowed out vs straight; growth) and supply and demand (shifters named, both curves shifting with an indeterminate axis left out of `outcome`). Comparative advantage from output and input tables, terms of trade between the two opportunity costs; every opportunity cost an `ApMacroCalc` recipe. You also write the `ppc-trade` trainer's content (builder T3 owns its code) only if T3 asks.
