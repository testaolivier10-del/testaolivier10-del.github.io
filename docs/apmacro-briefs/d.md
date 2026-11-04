# Author D: Unit 4

Read `docs/apmacro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (7)

`financial-assets` (4.1), `nominal-real-rates` (4.2), `money-functions` (4.3), `banking-money-supply` (4.4), `money-market` (4.5), `monetary-policy` (4.6), `loanable-funds` (4.7).

## FRQs

- `long` on `monetary-policy` (graph part: `reserves`): A central bank with ample reserves fights a recession: the administered rate, the reserve market graph, investment, AD and the price level, then the loanable funds market. File `macroeconomics/data/frq/frq-ample-reserves-long.json` (id `frq-ample-reserves-long`).
- `long` on `monetary-policy` (graph part: `money`): Limited reserves and an inflationary gap: the open market operation, the money market, bond prices, AD and unemployment. File `macroeconomics/data/frq/frq-open-market-long.json` (id `frq-open-market-long`).
- `short` on `banking-money-supply`: A bank balance sheet: required and excess reserves, the most one bank can lend and the most the money supply can change. File `macroeconomics/data/frq/frq-money-multiplier-short.json` (id `frq-money-multiplier-short`).
- `short` on `money-market` (graph part: `money`): A rise in the price level: money demand, the nominal interest rate and bond prices. File `macroeconomics/data/frq/frq-money-market-short.json` (id `frq-money-market-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `macroeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `macroeconomics/figures/` (ids starting with your topic ids); `scripts/apmacro-figures/author-d.mjs` if you generate figures; your report `docs/apmacro-reviews/self-d.md`.

## Notes for your topics

Unit 4 is the most-missed unit on the exam. Teach limited reserves (balance sheets, required and excess reserves, the money multiplier, open market operations on the money market) and then ample reserves (administered rates, the reserve market: `reserves` graph items where raising interest on reserves shifts RD up and reserve supply in the ample range leaves the rate alone). Every monetary question states its framework. Real vs nominal interest rates; bond prices against rates; loanable funds (`lf` graph items: government borrowing shifts DLF right). Two long FRQs: one ample reserves, one limited.
