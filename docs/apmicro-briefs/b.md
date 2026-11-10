# Author B: Unit 2

Read `docs/apmicro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (9)

`demand` (2.1), `supply` (2.2), `price-elasticity-demand` (2.3), `price-elasticity-supply` (2.4), `other-elasticities` (2.5), `equilibrium-surplus` (2.6), `disequilibrium-changes` (2.7), `government-intervention` (2.8), `trade-policy` (2.9).

## FRQs

- `long` on `government-intervention` (graph part: `sd-micro`): A market with a per-unit tax: the new prices, tax revenue, incidence by elasticity and deadweight loss, then a subsidy and its cost. File `microeconomics/data/frq/frq-tax-surplus-long.json` (id `frq-tax-surplus-long`).
- `long` on `trade-policy` (graph part: `sd-micro`): A domestic market opened to trade: the world price, imports, a tariff and the surplus areas it changes. File `microeconomics/data/frq/frq-trade-tariff-long.json` (id `frq-trade-tariff-long`).
- `short` on `price-elasticity-demand`: Elasticity from a table: price elasticity, the total revenue test and the effect of a price change on revenue. File `microeconomics/data/frq/frq-elasticity-short.json` (id `frq-elasticity-short`).
- `short` on `government-intervention` (graph part: `sd-micro`): A binding price ceiling or floor: the shortage or surplus, the quantity traded and deadweight loss. File `microeconomics/data/frq/frq-price-control-short.json` (id `frq-price-control-short`).
- `short` on `equilibrium-surplus` (graph part: `sd-micro`): A competitive market graph: consumer and producer surplus, then the effect of a shift on each. File `microeconomics/data/frq/frq-surplus-short.json` (id `frq-surplus-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `microeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `microeconomics/figures/` (ids starting with your topic ids); `scripts/apmicro-figures/author-b.mjs` if you generate figures; your report `docs/apmicro-reviews/self-b.md`.

## Notes for your topics

Unit 2 is the area unit: every `sd-micro` policy (ceiling, floor, tax, subsidy, world price, tariff) with shade items for consumer and producer surplus, tax revenue, subsidy cost (the whole rectangle out to the new quantity), tariff revenue and deadweight loss, each with the slip named, and `numeric` items from the area recipes. Elasticity: the absolute value for price elasticity, the sign for income and cross elasticity, the total revenue test; the midpoint method taught briefly and labeled (needs-author `midpoint`). Topics 2.1 to 2.4 are free. A graphed quota is out of the course (2.9); its effect on quantities is in. Both curves shifting: leave the indeterminate axis out of `outcome`.
