# Author C: Unit 3

Read `docs/apmicro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (7)

`production-function` (3.1), `short-run-costs` (3.2), `long-run-costs` (3.3), `types-of-profit` (3.4), `profit-maximization` (3.5), `firm-decisions` (3.6), `perfect-competition` (3.7).

## FRQs

- `long` on `perfect-competition` (graph part: `pc`): A perfectly competitive market and firm side by side: short-run profit, entry, the new long-run equilibrium. File `microeconomics/data/frq/frq-perfect-competition-long.json` (id `frq-perfect-competition-long`).
- `short` on `short-run-costs`: A firm's cost table: marginal cost, average variable cost, the profit-maximizing output and profit at a given price. File `microeconomics/data/frq/frq-cost-table-short.json` (id `frq-cost-table-short`).
- `short` on `firm-decisions` (graph part: `pc`): A competitive firm making losses: the shutdown decision, exit and the long-run price. File `microeconomics/data/frq/frq-long-run-short.json` (id `frq-long-run-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `microeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `microeconomics/figures/` (ids starting with your topic ids); `scripts/apmicro-figures/author-c.mjs` if you generate figures; your report `docs/apmicro-reviews/self-c.md`.

## Notes for your topics

Unit 3 carries the cost curves and perfect competition: MC from a table (divide by the change in output), MC through the minimum of AVC and ATC in every figure (`costs` kind), the profit-maximizing rule from a table and a graph, shutdown at minimum AVC, the two-panel `pc` graph with d = MR = AR = P carried across (`line` task), the profit or loss box (`shade` profit or loss), entry and exit to the long run at minimum ATC. Constant-cost industries are the model; increasing- and decreasing-cost are a labeled extension (needs-author `increasing-cost`). A lump-sum tax moves ATC only (an ATC shift alone in the engine), a per-unit tax MC and ATC.
