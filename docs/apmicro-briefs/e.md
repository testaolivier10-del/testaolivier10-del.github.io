# Author E: Units 5 and 6

Read `docs/apmicro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (9)

`factor-markets` (5.1), `factor-demand-supply` (5.2), `competitive-factor-markets` (5.3), `monopsony` (5.4), `market-efficiency` (6.1), `externalities` (6.2), `public-goods` (6.3), `intervention-structures` (6.4), `inequality` (6.5).

## FRQs

- `long` on `competitive-factor-markets` (graph part: `labor`): A competitive labor market and firm side by side: the wage, hiring where MRP = MRC, and a change in product demand. File `microeconomics/data/frq/frq-labor-market-long.json` (id `frq-labor-market-long`).
- `short` on `competitive-factor-markets`: A hiring table: MRP, diminishing returns, the number of workers hired and a fixed cost that changes nothing. File `microeconomics/data/frq/frq-hiring-table-short.json` (id `frq-hiring-table-short`).
- `short` on `monopsony` (graph part: `monopsony`): A monopsony: hiring where MRP = MFC, the wage from labor supply, the wage bill and a minimum wage. File `microeconomics/data/frq/frq-monopsony-short.json` (id `frq-monopsony-short`).
- `short` on `externalities` (graph part: `externality`): A negative production externality: market vs efficient quantity, deadweight loss and the corrective tax. File `microeconomics/data/frq/frq-externality-short.json` (id `frq-externality-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `microeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `microeconomics/figures/` (ids starting with your topic ids); `scripts/apmicro-figures/author-e.mjs` if you generate figures; your report `docs/apmicro-reviews/self-e.md`.

## Notes for your topics

Unit 5: derived demand with every link (product demand, product price, MRP, labor demand, hiring), MRP = MP x MR, hiring where MRP = MRC from a table, the competitive `labor` graph (market and firm, the wage carried across as `line` W), the least-cost rule, and `monopsony` (hire where MRP = MFC, the wage read from labor supply, the wage bill area, a minimum wage line). Unit 6: market vs efficient quantity on the `externality` kind (MSB = MSC), deadweight loss pointing toward the efficient quantity, the corrective tax or subsidy, public goods and the free rider, and the Lorenz curve (`lorenz`, shift toward or away from equality; Gini only as a labeled measure, never computed in a graded item: needs-author `gini`).
