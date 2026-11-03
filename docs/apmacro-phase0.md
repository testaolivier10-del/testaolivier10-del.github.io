# AP® Macroeconomics: Phase 0 dependency map

The map is `docs/apmacro-dependency-map.json`. It is checked by `node scripts/check-apmacro-map.mjs --check`
(library `scripts/lib/apmacro-map.mjs`, tests `scripts/test/apmacro-map.test.mjs`); `--order` prints the course
order. If this file and the JSON disagree, the JSON is right. Unit and topic facts come from
`docs/apmacro-ced-map.json` (our own words, from `docs/apmacro-research/framework.md`); no CED text is reproduced.
Open questions are in `docs/apmacro-needs-author.md`. Both JSON files were generated in Phase 0 by one script so
they agree; from now on they are edited by hand.

## The CED check (Phase 0, 2026-11-03)

| Source | What it settled |
|---|---|
| Course at a Glance | All 42 topic titles, in order (6, 7, 9, 7, 7, 6); the four big ideas (MEA, MKT, MOD, POL) |
| CED PDF, readable for Units 1-2 and Topics 3.2-3.6 | Objectives and knowledge there; the PPI calculation exclusion (2.4); the 2.7 wording fix |
| Course and exam pages | Unit weights (MCQ section), the May 2027 exam (Fri 7 May, Session 2), 60 MCQ in 70 min (66%), 3 FRQs in 60 min with a 10-minute reading period (33%): one long (10 points), two short (5 each); four-function calculator |
| Scoring guidelines and Chief Reader Reports 2023-2026 | Knowledge for 3.7-6.6 (marked in `source`; needs-author `ced-text`), the graphs students draw, where they lose points |

Per-topic focus skills are ours (the CED's tags for 5.5-5.7 were garbled in extraction; needs-author
`topic-skills`). Practice weights in Section I are not published (`practicesConfirmed: false`, needs-author
`practice-weights`); the forms check enforces only unit weights.

## Counts

| | |
|---|---|
| Chapters | 7: Units 1-6 (CED weights 5-10, 12-17, 17-27, 18-23, 20-30, 10-13%) and one skills chapter, "Graph skills you need" (`graph-skills`) |
| Topics | 46: the 42 CED topics in order, 4 graph skills topics placed before Unit 1 |
| Concepts | 132, each with its terms and aliases; a starting set: authors add every term a topic teaches that the map lacks |
| Everyday words | 28 (goods, services, trade, money, interest, inflation, bonds, stocks, consumption, investment, exports, imports, recession ...) |
| Planned tools | 9 simulators (the 8 trainers of spec section 6 and `justify`), 18 FRQ themes (6 long, each naming its graph kind, and 12 short; each with its author) |

Concepts per chapter: graph skills 10, Unit 1 24, Unit 2 30, Unit 3 23, Unit 4 22, Unit 5 14, Unit 6 9. Stimulus
themes, comparison tables and pathways are left for the authors (each brief names what to add).

## Format

As `docs/appsych-phase0.md`, with these differences:

- `practices[]` are the four CED skill categories (1 Principles and Models 1.A-1.D, 2 Interpretation 2.A-2.C,
  3 Manipulation 3.A-3.C, 4 Graphing and Visuals 4.A-4.C). Graphing is assessed only in Section II: a topic may
  list 4.A-4.C as a focus (the FRQs practice it), but only a `graph` item may carry it (content check).
- `bigIdeas` are the four of the CED; every unit topic has exactly one.
- `topics[].ced` runs without gaps (`MAC_TOPICS` and `UNIT_SIZES` in `scripts/lib/apmacro-map.mjs`).
- FRQ themes have type `long` or `short` (`FRQ_TYPES`), at least 6 long and 12 short (`FRQ_MIN`), name their
  author, and a long theme names the `graph` kind of its graph part (spec 5a). Stimulus themes have `stimulus`:
  `data`, `graph` or `text`.
- `REQUIRED_SIMULATORS` lists the eight trainers plus `justify`.
- Topic slugs avoid the letters "ap" (`slopes-curves`, not `graph-slopes`), so no served path carries the token.
  The chapter id `graph-skills` contains them as letters inside a word, never as a token, and is not a file name.

## Course order

Units in CED order. The four graph skills topics sit before Unit 1 (`before: "scarcity"`), because the PPC in 1.2
is the first graph and every unit after uses shifts and crossings:

| Skills topic | Teaches |
|---|---|
| `axes-points` | two labeled axes, a point as a pair of values, direct and inverse relationships |
| `slopes-curves` | slope as rise over run; upward, downward, vertical and horizontal curves |
| `shifts-movements` | a change in a variable on an axis moves along a curve; anything else shifts it |
| `curves-crossing` | where two curves cross; comparing the new crossing with the old on each axis |

Notable ordering choices (each is a `dependsOn` the check enforces):

- `law-of-demand` and `law-of-supply` (1.4, 1.5) come before every market graph; the money market (4.5), loanable
  funds (4.7) and the foreign exchange market (6.3) depend on them.
- `potential-output` and `output-gap` are taught in 2.7 (business cycles), so AD-AS (3.5) and fiscal policy
  (3.8) can use the gaps.
- `ample-reserves` and `policy-rate` (4.6) depend on `fractional-reserve` and `required-reserves` (4.4): the
  limited-reserves framework is taught first, then the ample one the Federal Reserve now uses (spec decision 7).
  The term `limited-reserves` itself is taught in 4.4, with the money multiplier it makes work, so 4.4 and 4.5
  items can name the framework they set (integrator, 2026-11-03); its tools, `open-market-operations` and
  `discount-rate`, stay in 4.6.
- `crowding-out` (5.5) depends on `loanable-funds` (4.7) and `budget-deficit` (5.4); `capital-flows` (6.6) on
  `real-rate` (4.2) and the foreign exchange determinants (6.4).

There are no circular dependencies and no preview boxes in Phase 0.

## FRQ themes (spec 5a)

| Author | Unit | Long | Short |
|---|---|---|---|
| A | 1 | | PPC and trade; a market after a cost change |
| B | 2 | | unemployment and indicators; real vs nominal |
| C | 3 | recessionary gap with fiscal policy and self-adjustment (adas) | multiplier; self-adjustment |
| D | 4 | ample reserves (reserves); open market operation (money) | money multiplier; money market |
| E | 5 | supply shock and the Phillips curves (phillips); deficit spending and crowding out (lf) | Phillips curve; crowding out |
| F | 6 | real rates, capital flows and the currency (forex) | balance of payments; foreign exchange |

Each theme lives in its unit's `tools.frqThemes` with `id`, `title`, `topic`, `type`, `author` and, for a long
one, `graph`.
