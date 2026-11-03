# Author F: Unit 6

Read `docs/apmacro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (6)

`balance-of-payments` (6.1), `exchange-rates` (6.2), `foreign-exchange-market` (6.3), `fx-policy-changes` (6.4), `fx-net-exports` (6.5), `real-rates-financial-flows` (6.6).

## FRQs

- `long` on `foreign-exchange-market` (graph part: `forex`): Higher real interest rates in one country: loanable funds, capital flows, the foreign exchange market, the currency and net exports. File `macroeconomics/data/frq/frq-open-economy-long.json` (id `frq-open-economy-long`).
- `short` on `balance-of-payments`: Balance of payments entries: the current account, the capital and financial account and why they sum to zero. File `macroeconomics/data/frq/frq-balance-payments-short.json` (id `frq-balance-payments-short`).
- `short` on `fx-policy-changes` (graph part: `forex`): Higher inflation abroad: the market for the dollar, appreciation and net exports. File `macroeconomics/data/frq/frq-forex-short.json` (id `frq-forex-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `macroeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `macroeconomics/figures/` (ids starting with your topic ids); `scripts/apmacro-figures/author-f.mjs` if you generate figures; your report `docs/apmacro-reviews/self-f.md`.

## Notes for your topics

Unit 6: the balance of payments (CA + CFA = 0, numeric examples), exchange rates (conversions with `inverseRate`, `convert`), and the foreign exchange market (`forex` graph items with `names.currency` and `names.other`; the vertical axis is the other currency per unit of this one; label items offer the flipped ratio as the wrong choice), its determinants, net exports and capital flows from relative real interest rates. Do not rush it: readers report Unit 6 rushed every year.
