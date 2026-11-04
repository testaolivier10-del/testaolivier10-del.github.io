# Author B: Unit 2

Read `docs/apmacro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (7)

`gdp-circular-flow` (2.1), `gdp-limitations` (2.2), `unemployment` (2.3), `price-indices-inflation` (2.4), `inflation-costs` (2.5), `real-nominal-gdp` (2.6), `business-cycles` (2.7).

## FRQs

- `short` on `unemployment`: Labor force data: the unemployment and participation rates, discouraged workers, and the type of unemployment in a downturn. File `macroeconomics/data/frq/frq-unemployment-short.json` (id `frq-unemployment-short`).
- `short` on `real-nominal-gdp`: Nominal GDP and a price index over two years: the deflator, real GDP, and whether output grew. File `macroeconomics/data/frq/frq-real-nominal-short.json` (id `frq-real-nominal-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `macroeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `macroeconomics/figures/` (ids starting with your topic ids); `scripts/apmacro-figures/author-b.mjs` if you generate figures; your report `docs/apmacro-reviews/self-b.md`.

## Notes for your topics

Unit 2 is free. GDP by expenditure (what is left out: intermediate, used goods, transfers), unemployment (labor force, the rates, natural = frictional + structural, cyclical = actual - natural, discouraged workers), CPI and inflation (substitution bias; no PPI calculation), real vs nominal (the deflator the right way up), the business cycle with the output gap. Every number an `ApMacroCalc` recipe with the reader-report slip as a mistake (x 100 missing, the deflator inverted).
