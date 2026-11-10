# Author B: Unit 2, Population and Migration Patterns and Processes

Read `docs/aphug-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (12)

`population-distribution` (2.1), `distribution-consequences` (2.2), `population-composition` (2.3), `population-dynamics` (2.4), `transition-model` (2.5), `malthusian-theory` (2.6), `population-policies` (2.7), `women-population-change` (2.8), `aging-populations` (2.9), `migration-causes` (2.10), `forced-voluntary-migration` (2.11), `migration-effects` (2.12).

## FRQs (one of each type)

- Q1 type `none` (no stimulus) on `population-policies`: Population growth, policy and aging: RNI, TFR and a pronatalist or antinatalist policy. File `human-geography/data/frq/frq-population-policy-none.json` (id `frq-population-policy-none`).
- Q2 type `one` (one stimulus) on `aging-populations`: A population pyramid of an aging country: the shape, the dependency ratio and the effects. File `human-geography/data/frq/frq-aging-pyramid-one.json` (id `frq-aging-pyramid-one`).
- Q3 type `two` (two stimuli) on `migration-effects`: A migration flow map and a table of remittances: push and pull, and effects at two scales. File `human-geography/data/frq/frq-migration-flows-two.json` (id `frq-migration-flows-two`).

## Stimulus sets planned in the map

- `map` on `population-dynamics`: A world choropleth of total fertility rate (dated source)
- `data` on `population-composition`: Two population pyramids, expansive and constrictive
- `data` on `distribution-consequences`: A table of density measures for three invented countries
- `map` on `forced-voluntary-migration`: A flow map of step and chain migration

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) any set you add: at least one `map`, one `data` and one `image` or `text` set per unit.

## Files you own

For each topic id above: `human-geography/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `human-geography/figures/` (ids starting with your topic ids; drawn SVG scenes only, no photos); `scripts/aphug-figures/author-b.mjs` if you generate figures; your report `docs/aphug-reviews/self-b.md`.

## Notes for your topics

Unit 2 topics 2.1 to 2.5 are free. Pyramids drawn from data (`plot.kind: pyramid`), every rate an `ApHugCalc` recipe (RNI in percent, migration not in it; doubling time by the rule of 70), the three densities against carrying capacity (a reader-report trap), the DTM in five stages with its limits (a country is never "in" a stage: data are consistent with one), the epidemiological transition, Malthus with three critiques, pronatalist vs antinatalist policies dated (China by year), Ravenstein, forced vs voluntary migration with the CED terms. Model items: the DTM stages, push and pull sorting.
