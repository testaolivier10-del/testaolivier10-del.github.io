# AP® Microeconomics: Phase 0 dependency map

The map is `docs/apmicro-dependency-map.json`. It is checked by `node scripts/check-apmicro-map.mjs --check`
(library `scripts/lib/apmicro-map.mjs`, tests `scripts/test/apmicro-map.test.mjs`); `--order` prints the course
order. If this file and the JSON disagree, the JSON is right. Unit and topic facts come from
`docs/apmicro-ced-map.json` (our own words, from `docs/apmicro-research/framework.md`); no CED text is reproduced.
Open questions are in `docs/apmicro-needs-author.md`. Both JSON files were generated in Phase 0 by one script so
they agree; from now on they are edited by hand.

## The CED check (Phase 0, 2026-11-09)

| Source | What it settled |
|---|---|
| Course at a Glance and course page | All 36 topic titles, in order (6, 9, 7, 5, 4, 5); unit weights (12-15, 20-25, 22-25, 15-22, 10-13, 8-13%); big ideas used here: MKT, CBA, PRD, POL |
| CED PDF, readable through Topic 3.3 | Objectives and knowledge there; indifference curves out (1.6, MU per dollar in); a graphed quota out (2.9, its effect on quantities in) |
| Exam pages | Tue 4 May 2027, Session 2; 60 MCQ in 70 min (66%); 3 FRQs in 60 min with a 10-minute reading period (33%): one long (10 points), two short (5 each); four-function calculator |
| Scoring guidelines and Chief Reader Reports 2023-2025 | Knowledge for 3.4-6.5 (marked in `source`; needs-author `ced-text`), the graphs students draw, where they lose points |

Per-topic focus skills are ours (needs-author `topic-skills`). Practice weights in Section I are not published
(`practicesConfirmed: false`); the forms check enforces only unit weights.

## Counts

| | |
|---|---|
| Chapters | 7: Units 1-6 and one skills chapter, "Graph skills you need" (`graph-skills`) |
| Topics | 40: the 36 CED topics in order, 4 graph skills topics placed before Unit 1 |
| Concepts | 136, each with its terms and aliases; a starting set: authors add every term a topic teaches that the map lacks |
| Everyday words | 14 (trade, demand, supply, equilibrium, resources, tax, subsidy, budget, wage, profit, scarce ...) |
| Planned tools | 9 simulators (the 8 trainers of spec section 6 and `justify`), 18 FRQ themes (6 long, each naming its graph kind, and 12 short; each with its author) |

Concepts per chapter: graph skills 9, Unit 1 23, Unit 2 33, Unit 3 26, Unit 4 15, Unit 5 12, Unit 6 18.

## Format

As `docs/apmacro-phase0.md`, with these differences:

- `topics[].ced` runs without gaps (`MIC_TOPICS` and `UNIT_SIZES` `{1:6, 2:9, 3:7, 4:5, 5:4, 6:5}` in
  `scripts/lib/apmicro-map.mjs`).
- An FRQ theme's `graph` must be a kind `ApMicroGraph` draws, or `matrix` (`GRAPH_KINDS`).
- `REQUIRED_SIMULATORS` lists the eight trainers plus `justify`.
- Topic slugs avoid the token "ap"; the chapter id `graph-skills` has the letters inside a word only.

## Course order

Units in CED order. The four graph skills topics sit before Unit 1 (`before: "scarcity"`), because the PPC in 1.3
is the first graph and every unit after uses shifts, crossings and areas:

| Skills topic | Teaches |
|---|---|
| `axes-points` | two labeled axes, a point as a pair of values, direct and inverse relationships |
| `slopes-curves` | slope as rise over run; straight and U-shaped curves |
| `shifts-movements` | a change in a variable on an axis moves along a curve; anything else shifts it |
| `curves-crossing` | where two curves cross, comparing crossings, and the area of a rectangle and a triangle on a graph (every surplus, revenue and loss area later) |

Notable ordering choices (each is a `dependsOn` the check enforces):

- `area-graph` (graph skills) comes before `consumer-surplus` (2.6), so every shaded region builds on it.
- `marginal-cost` (3.2) depends on `total-cost` and `diminishing-returns`; `mrp` (5.1) on `marginal-product` (3.1)
  and `marginal-revenue` (3.5), so derived demand can name every link.
- `deadweight-loss` (2.8) depends on `total-surplus` (2.6); `monopoly-dwl` (4.2) reuses it.
- `dominant-strategy` and `nash-equilibrium` (4.5) both depend on `best-response`, taught first in the same topic.
- `monopsony` (5.4) depends on `mrc` and `labor-supply` (5.2, 5.3).
- `lorenz` (6.5) depends only on `ordered-pair`; `gini` is taught with it and flagged (needs-author `gini`).

There are no circular dependencies and no preview boxes in Phase 0.

## FRQ themes (spec 5a)

| Author | Units | Long (graph) | Short |
|---|---|---|---|
| A | graph skills, 1 | | PPCs and comparative advantage (ppc); consumer choice with MU per dollar |
| B | 2 | per-unit tax then subsidy (sd-micro); trade and a tariff (sd-micro) | elasticity from a table; a binding price control (sd-micro); surplus and a shift (sd-micro) |
| C | 3 | perfect competition market and firm, short run to long run (pc) | cost table; losses, shutdown and exit (pc) |
| D | 4 | monopoly with a price ceiling at P = MC (monopoly); a payoff matrix then a monopoly with a lump-sum tax (monopoly) | payoff matrix (matrix); monopolistic competition short and long run (monocomp) |
| E | 5, 6 | competitive labor market and firm (labor) | hiring table; monopsony (monopsony); negative externality (externality) |

Each theme lives in its unit's `tools.frqThemes` with `id`, `title`, `topic`, `type`, `author` and, for a graph
part, `graph`.
