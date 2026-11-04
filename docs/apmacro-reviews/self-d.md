# AP® Macroeconomics: author D self-report (Unit 4), 2026-11-03

## Done

All seven Unit 4 topics: lesson, notes, questions, glossary and one LevlPrep original figure each; four FRQs.
`node scripts/check-apmacro-content.mjs --topic <id>` is clean for every topic; the four FRQs pass the full run;
`node scripts/check-apmacro-map.mjs --check` reports nothing used before it is taught. Built with
`APMACRO_PUBLISHED=unit-4` into a scratch folder: pages, math, figures and literal dollar signs render.

| Topic | Items | Numeric | Graph | Sets (data / graph / text) | Apply/analyze | In sets | Notes words |
|---|---|---|---|---|---|---|---|
| financial-assets (4.1) | 18 | 2 | 0 | 1 / 0 / 1 | 83% | 44% | about 750 |
| nominal-real-rates (4.2) | 17 | 4 | 0 | 1 / 0 / 1 | 88% | 47% | about 650 |
| money-functions (4.3) | 16 | 2 | 0 | 1 / 0 / 1 | 81% | 50% | about 740 |
| banking-money-supply (4.4) | 18 | 7 | 0 | 1 / 0 / 1 | 89% | 44% | about 810 |
| money-market (4.5) | 18 | 0 | 4 (label, MS shift, MD shift, point) | 0 / 1 / 1 | 89% | 44% | about 710 |
| monetary-policy (4.6) | 23 | 1 | 5 (reserve label, RD up, RS right with the rate unchanged, MS right, MS left) | 1 / 1 / 1 | 91% | 52% | about 960 |
| loanable-funds (4.7) | 19 | 2 | 4 (label, DLF shift, SLF shift, point) | 1 / 1 / 1 | 89% | 58% | about 720 |

129 items. Every numeric key is an `ApMacroCalc` recipe with the slips as mistakes (adding inflation, using the
expected rate after the fact, multiplying the whole cash deposit, one bank's loans versus the system, multiplying
by the ratio, total instead of excess reserves, the sign of public saving). Every monetary item names its
framework; ample-reserves items use the reserve market and administered rates, limited-reserves items the money
market and open market operations. A "Make it specific" chain item in six topics. All data invented and labeled.

FRQs: `frq-ample-reserves-long` (A administered rate, B reserve market graph 3, C investment, D output and price
level 2, E(i) loanable funds graph 2, E(ii) private investment), `frq-open-market-long` (A bond sale, B money market
graph 3, C bond prices, D AD 2, E unemployment, F(i) multiplier, F(ii) maximum change), `frq-money-multiplier-short`
(balance sheet A-E), `frq-money-market-short` (A money market graph 3, B why MD shifts, C bond prices). One rubric
line per point, `auto` on the graph points, full-credit samples.

Figures: `scripts/apmacro-figures/author-d.mjs` writes the seven SVGs to `macroeconomics/figures/` and the entries
in `macroeconomics/data/figures/<topic>.json`.

## Map edits (`docs/apmacro-dependency-map.json`, my topics' concepts only)

- `money-supply` and `central-bank` now taught in `banking-money-supply` (4.4), not 4.5 and 4.6: 4.4 is "the
  Expansion of the Money Supply" and needs both words (the central bank sets the reserve requirement);
  `money-supply` depends on `money-supply-measures` and `money-creation`.
- Alias "money market funds" on `money-supply-measures` (4.3), so M2's retail money market funds are not read
  as the 4.5 money market.
- Alias "expected inflation rate" on `real-rate` (4.2): see needs-author `d-expected-inflation`.
- Unit 4 `tools.stimulusThemes`: 16 sets (6 data, 3 graph, 7 text).

## Open points

In `docs/apmacro-needs-author.md` under "Author D": `d-m1-savings`, `d-expected-inflation`, `d-lf-government`,
`d-bond-yield`, `d-ample-tools`.
