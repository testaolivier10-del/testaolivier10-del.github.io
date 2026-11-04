# Author F self-review: Unit 6, the open economy (2026-11-03)

## Done

| Topic | Items | In sets | Apply/analyze | Graph items | Numeric | Sets (kind) |
|---|---|---|---|---|---|---|
| `balance-of-payments` (6.1) | 17 | 8 | 16 | 0 (no graph in 6.1) | 4 | data, text |
| `exchange-rates` (6.2) | 17 | 8 | 16 | 0 (no graph in 6.2) | 5 | data, text |
| `foreign-exchange-market` (6.3) | 17 | 8 | 15 | 4 (label; shift + equilibrium; point; label + shift + equilibrium in the mirror market) | 0 | graph, graph |
| `fx-policy-changes` (6.4) | 17 | 8 | 17 | 4 (demand shift; label + supply shift; both curves, quantity left out; point) | 0 | text, data |
| `fx-net-exports` (6.5) | 17 | 8 | 17 | 3 (AD-AS: AD left; label + AD right; point on SRAS) | 3 | data, text |
| `real-rates-financial-flows` (6.6) | 18 | 8 | 18 | 4 (forex label + demand; loanable funds supply; mirror forex supply; point) | 1 | graph, text |

103 items, four options on every single-answer item, every option explained, numeric keys as `ApMacroCalc`
recipes (`sub`, `add`, `neg`, `inverseRate`, `convert`, `netExports`, `realRate`) with the reader-report slips
as authored mistakes (sign of a deficit, goods-only trade balance, assets counted in the current account,
rate used upside down, multiplying instead of dividing, adding expected inflation). "Make it specific" builder
and an order item in most topics. Every monetary item names its framework (ample or limited reserves) and uses
that framework's tool.

Each topic has its lesson, notes (500+ words, `<h2>` sections, a worked example before any calculation or graph,
a comparison table, a `mac-slip` box for the reader-report slip), glossary and a figure. Figures (LevlPrep
originals, drawn by `scripts/apmacro-figures/author-f.mjs`, which also writes `macroeconomics/data/figures/<topic>.json`):
`balance-of-payments-accounts`, `exchange-rates-two-quotes`, `foreign-exchange-market-mirror`,
`fx-policy-changes-demand-shift`, `fx-net-exports-chain`, `real-rates-financial-flows-links`.

FRQs: `frq-open-economy-long` (10: loanable funds graph 3, capital flow 1 + 1, forex graph 3, net exports 1,
capital and financial account 1; units 4 and 6), `frq-balance-payments-short` (5: current account, CFA, why
they sum to zero, foreign asset purchases, a changed entry; invented data table), `frq-forex-short` (5: forex
graph for Arland's dollar 3, the bel 1, net exports 1). Graph parts carry `auto` on labels, shift and outcome.

## Map edits (docs/apmacro-dependency-map.json)

- `current-account`: aliases "trade balance" and "balance of trade" moved to a new concept `balance-of-trade`
  (taught in `balance-of-payments`, depends on `exports-imports` and `current-account`): the trade balance is
  part of the current account, not the whole. `current-account` now has aliases "current account deficit",
  "current account surplus".
- Unit 6 `tools.stimulusThemes`: the 12 sets above (data, graph and text all present).

## Checks

`node scripts/check-apmacro-content.mjs --topic <id>`: ok for all six topics; the three FRQs pass.
`node scripts/check-apmacro-map.mjs --check`: nothing used before it is taught.
`APMACRO_PUBLISHED=unit-6 node scripts/build-apmacro.mjs --out <scratch>`: 6 topics built.
`node --test scripts/test/apmacro-*.test.mjs`: 118 of 121 pass; the 3 failures are outside Unit 6 content
(registration hub card; the `adas-lab` and `forex-lab` tool stubs in progress).

## Open points

In `docs/apmacro-needs-author.md` under "Author F": `f-inflow-loanable-funds`, `f-official-reserves`,
`f-one-curve-keys` (the grader keys one of two accepted shifts; prompts name the actor), `f-invented-countries`,
`f-appreciation-costs`, `f-policy-real-rate`.
