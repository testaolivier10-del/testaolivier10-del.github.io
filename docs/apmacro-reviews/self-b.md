# AP® Macroeconomics: author B self-report (Unit 2), 2026-11-03

## Done

All seven Unit 2 topics: lesson, notes, questions, glossary and one LevlPrep original figure each; two short FRQs.
`node scripts/check-apmacro-content.mjs --topic <id>` is clean for every topic; both FRQs pass the full run;
`node scripts/check-apmacro-map.mjs --check` reports nothing used before it is taught. Unit 2 alone passes the
bank-wide test-wise and near-duplicate rules. Built with `APMACRO_PUBLISHED=unit-2` into a scratch folder: pages,
math, figures and literal dollar signs render.

| Topic | Items | Numeric | Graph | Sets (data / graph / text) | Notes words |
|---|---|---|---|---|---|
| gdp-circular-flow (2.1) | 17 | 4 | 0 | 1 / 0 / 2 | about 840 |
| gdp-limitations (2.2) | 16 | 2 | 0 | 1 / 0 / 2 | about 660 |
| unemployment (2.3) | 18 | 6 | 2 (PPC point, PPC shift) | 2 / 0 / 1 | about 700 |
| price-indices-inflation (2.4) | 16 | 6 | 0 | 2 / 0 / 1 | about 690 |
| inflation-costs (2.5) | 16 | 1 | 0 | 1 / 0 / 2 | about 700 |
| real-nominal-gdp (2.6) | 17 | 8 | 0 | 2 / 0 / 1 | about 690 |
| business-cycles (2.7) | 21 | 2 | 2 (PPC points) | 1 / 1 / 2 | about 600 |

121 items, 88-94% apply/analyze per topic, 59-69% in sets. Every numeric key is an `ApMacroCalc` recipe, with the
reader-report slips as mistakes (the "× 100" left out, the deflator or CPI fraction upside down, multiplying by the
deflator, dividing by the adult population, adding the natural and actual rates, adding imports, counting
transfers). No PPI calculation, no released questions, all data invented and labeled.

FRQs: `frq-unemployment-short` (A(i) unemployment rate, A(ii) participation rate, B discouraged workers, C(i)
cyclical, C(ii) cyclical rate) and `frq-real-nominal-short` (A real GDP, B did output grow, C inflation from the
deflator, D the deflator, E deflation), 5 points each, one rubric line per point, full-credit samples.

Figures: `scripts/apmacro-figures/author-b.mjs` writes the seven SVGs to `macroeconomics/figures/` and the entries
to `macroeconomics/data/figures/<topic>.json`.

## Map edits (`docs/apmacro-dependency-map.json`)

- `transfer-payments`: `taughtIn` `fiscal-policy` -> `gdp-circular-flow`, `dependsOn` `["gdp"]` (2.1 must say GDP
  leaves out transfers). Author C's `glossary/fiscal-policy.json` also defines it; one of the two should go.
- `unit-2` `tools.stimulusThemes`: seven sets (four data, one graph, two text).

## Open points

In `docs/apmacro-needs-author.md` under "Author B": `b-cycle-graph` (no business cycle graph kind, so Unit 2's graph
items use the PPC), `b-transfer-payments`, `b-real-gdp-method`, `b-recession-dating`.
