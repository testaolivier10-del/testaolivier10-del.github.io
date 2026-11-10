# Author D self-review: Unit 4 (Imperfect Competition)

Phase 1 content for topics 4.1-4.5 and four FRQs, written to `docs/apmicro-briefs/d.md` and `content-common.md`.

## Done

| Topic | Items | In sets | Sets (kind) | Graph / matrix items | Numeric | Figures |
|---|---|---|---|---|---|---|
| `imperfect-competition` (4.1) | 19 | 8 | data, text | label, point (MR = MC, price from D) | 2 (MR from a schedule) | `imperfect-competition-price-maker` |
| `monopoly` (4.2) | 25 | 13 | graph (lettered areas), data, text | shade dwl, cs, loss; point allocative, fair-return (natural), revenue-max; shift ATC (lump-sum fee) | 5 (MC, profit-max Q, profit, subsidy at P = MC, profit) | `monopoly-areas`, `monopoly-natural` |
| `price-discrimination` (4.3) | 18 | 11 | data, data, text | point allocative (D = MC), shade dwl | 4 (revenue by group, CS, DWL, PPD surplus) | `price-discrimination-perfect` |
| `monopolistic-competition` (4.4) | 20 | 11 | graph (lettered areas), data, text | label (long run), point tangency, shift D left (entry), shift D right (exit), shade loss | 2 (profit, excess capacity) | `monopolistic-competition-runs` |
| `oligopoly-game-theory` (4.5) | 19 | 12 | graph (matrix), data, text (matrix) | 7 matrix items: dominant, nash, best, joint, a payoff `change`, a 3x2 game, a game with two Nash equilibria | 2 (joint profit, gain from cheating) | `oligopoly-game-theory-matrix` |

101 items, 55 in sets; every single-answer option explained; key positions rotated; the key is the longest option in at most 2 items per topic; no absolute words (always, only, all, every...) in any of my distractors (the bank-wide test-wise rule counts every author's distractors). Each topic has a lesson (hook, prereqs to earlier topics, figure, chain, ideas, misconception, 6-7 checks with set items consecutive, summary), notes over 500 words with worked examples before each calculation and comparison tables (the four structures in 4.1, regulated prices in 4.2, single price vs perfect price discrimination in 4.3, perfect competition vs monopolistic competition vs monopoly in 4.4), and a glossary entry for every concept the topic teaches.

FRQs (all pass `checkFrq`, all build with `APMICRO_PUBLISHED=unit-2,unit-3,unit-4`):
- `frq-monopoly-long` (10): labeled monopoly graph and PM/QM (labels, point), shade CS, shade DWL, profit from a table, elasticity at QM (E(i), E(ii)), price ceiling at P = MC as a `line` task (to `allocative`), effect on Q and DWL. Units 2 and 4.
- `frq-game-monopoly-long` (10): matrix part (Ridgeway dominant Expand, Sunpath none, one Nash), both comparisons in words, a subsidy `change` making Sunpath's Expand dominant, then a monopoly graph (labels, point), a lump-sum fee as a shift of ATC only, why P and Q do not change, shade DWL. Units 3 and 4.
- `frq-game-theory-short` (5): dominant strategies and Nash, both comparisons for "no dominant strategy", a fee `change` that moves the Nash equilibrium, the joint-payoff cell (which here is the Nash cell of the original game, said explicitly).
- `frq-monocomp-short` (5): short-run graph (labels, point), shade profit, entry shifts D left (explained in the sample), long-run point at the tangency with excess capacity in the sample.

Every number comes from an `ApMicroCalc` recipe; every graph and matrix key passes the content check's grader run. Figures are drawn by `scripts/apmicro-figures/author-d.mjs` from the engine's own curves (`mic-graph.js`), so MC passes through the minimum of ATC and every marked point (MR = MC, P = ATC, P = MC, the tangency) is where the grader puts it. All firms and data are invented and labeled.

Checks: `node scripts/check-apmicro-content.mjs --topic <id>` reports ok for all five topics, and `node scripts/check-apmicro-map.mjs --check` passes.

## Map edits (`docs/apmicro-dependency-map.json`)

1. `monopoly`, `oligopoly`, `monopolistic-competition` and `mr-below-demand` now `taughtIn: imperfect-competition` (4.1 introduces the four structures and MR below demand, as the CED's 4.1 does; without this 4.1 could not name a structure). `mr-below-demand` now depends on `market-power` and `marginal-revenue`.
2. `lump-sum-tax` moved from `externalities` (author E) to `monopoly`, `dependsOn: ["fixed-cost"]` (was `pigouvian`, `fixed-cost`): my long FRQ (from the brief) and the 2026-style monopoly question need it in Unit 4. Author E can still use it; E need not define it again.
3. Added `game-theory` ("game theory", alias "strategic interaction") and `prisoners-dilemma` ("prisoner's dilemma") to `oligopoly-game-theory`.
4. Unit 4 `tools.stimulusThemes`: replaced the two placeholder themes that no longer matched with the 13 sets written (data, graph and text sets in the unit).

## Requests for the lead

1. `scripts/lib/apmicro-map.mjs` line 418: declared previews are matched by the class `psy-preview` (left from the psychology fork), while `preStrip` strips `mic-preview`. A topic's `previews` entry can never be honored; the regex should look for `mic-preview`. I did not need a preview after the map edit above.
2. `mic-graph.js` monopoly kind: with a regulated price line (`line: { id: 'Pr' }`) there are no areas for the new outcome, so "shade consumer surplus or deadweight loss under the price ceiling" cannot be asked. Regions keyed on `lineAt` (cs, dwl and profit with Q at the line's intersection with demand, or with MC) would allow it. My FRQ asks for the line and states the outcomes in words instead.
3. "Productive efficiency" is not a concept in the map. 4.4 uses the phrase, explained inline as "producing at minimum ATC"; Unit 3's author may want to add it (taught in `perfect-competition`).

## Open points

- Mixed strategies and sequential games are left out (needs-author `ced-text`); every game here is simultaneous and pure-strategy.
- The game-theory short FRQ's joint-payoff cell coincides with the Nash cell; that is intentional (the other matrices teach the prisoner's dilemma gap), but a reviewer may prefer a matrix where they differ.
- Not yet reviewed by an independent accuracy check (Phase 4).
