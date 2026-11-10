# Author D: Unit 4

Read `docs/apmicro-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (5)

`imperfect-competition` (4.1), `monopoly` (4.2), `price-discrimination` (4.3), `monopolistic-competition` (4.4), `oligopoly-game-theory` (4.5).

## FRQs

- `long` on `monopoly` (graph part: `monopoly`): A monopoly: profit-maximizing quantity and price, profit, consumer surplus, deadweight loss and a price ceiling at P = MC. File `microeconomics/data/frq/frq-monopoly-long.json` (id `frq-monopoly-long`).
- `long` on `oligopoly-game-theory` (a matrix part, then a graph part: `monopoly`): A payoff matrix for two firms, then one firm's monopoly graph with a lump-sum tax. File `microeconomics/data/frq/frq-game-monopoly-long.json` (id `frq-game-monopoly-long`).
- `short` on `oligopoly-game-theory` (matrix part): A payoff matrix: dominant strategies, every Nash equilibrium and the effect of a payoff change. File `microeconomics/data/frq/frq-game-theory-short.json` (id `frq-game-theory-short`).
- `short` on `monopolistic-competition` (graph part: `monocomp`): A monopolistically competitive firm in the short run and the long run: entry and the tangency. File `microeconomics/data/frq/frq-monocomp-short.json` (id `frq-monocomp-short`).

## Stimulus sets

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) the sets you write: at least one `data`, one `graph` and one `text` set per unit.

## Files you own

For each topic id above: `microeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `microeconomics/figures/` (ids starting with your topic ids); `scripts/apmicro-figures/author-d.mjs` if you generate figures; your report `docs/apmicro-reviews/self-d.md`.

## Notes for your topics

Unit 4: monopoly (`monopoly` kind: Q where MR = MC, P read from demand, the profit box, consumer surplus and deadweight loss areas; the natural monopoly with `natural: true`, the fair-return and allocative points), price discrimination, monopolistic competition (`monocomp`, short run with profit, long run at the tangency with `run: 'long'`, excess capacity), and oligopoly with game theory as `matrix` items and an FRQ matrix part: dominant strategies proved by both comparisons, every Nash equilibrium, the joint-payoff cell, a payoff change (`change`). No ties for one player against the same choice of the other. Mixed strategies and sequential games are out until confirmed (needs-author `ced-text`).
