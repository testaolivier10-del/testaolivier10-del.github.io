# Originality review: all 18 FRQs (2026-11-09)

Rule: spec decision 4, no released College Board free-response question reproduced or adapted. Test: flag an FRQ
when its scenario plus the sequence of parts, or its stimulus plus two or more parts, track a released question.
Testing a standard concept (a monopoly graph, MRP = MRC) is allowed. No released wording was copied into the repo;
the comparison table was kept outside it.

## Released sets read

All read in full (scenario, stimulus, every part and subpart), from apcentral.collegeboard.org or, for 2021 and
2022 (no longer linked there), the Internet Archive copies of the same AP Central PDFs:

- 2021 Set 1 and Set 2; 2022 Set 1 and Set 2; 2023 Set 1 and Set 2; 2024 Set 1 and Set 2; 2025 Set 1 and Set 2.
- 2026: AP Central lists one free-response set only; read.

Nothing could not be read.

## Verdicts

| FRQ | Closest released question | Verdict |
|---|---|---|
| frq-consumer-choice-short | 2025 Set 2 Q3 (marginal utility table, total utility, best bundle) | Borderline, **rewritten** (one part) |
| frq-cost-table-short | 2026 Q2 (price-taker with a total cost table: AVC, profit, profit-maximizing output by marginal analysis) | **Flagged, rewritten** |
| frq-elasticity-short | 2022 Set 1 Q3 (demand table, elasticity calculation, then elastic or inelastic) | Borderline, **rewritten** (one part) |
| frq-externality-short | 2021 Set 2 Q2 (pollution from a competitive industry with constant external cost: graph, deadweight loss, the per-unit tax) | **Flagged, rewritten** |
| frq-game-monopoly-long | 2026 Q1 (duopoly matrix, a payoff change, a merger to a monopoly graph with profit and deadweight loss, a lump-sum tax) | **Flagged, rewritten** |
| frq-game-theory-short | 2024 Set 1 Q3 and 2025 Set 1 Q3 (dominant strategy, Nash, a payoff change, the merged or combined profit) | **Flagged, rewritten** |
| frq-hiring-table-short | 2023 Set 2 Q2 (output table: MRP of a worker, where diminishing returns begin, profit-maximizing hires, a fixed-cost change) | **Flagged, rewritten** |
| frq-labor-market-long | 2025 Set 1 Q1 E and 2021 Set 1 Q2 share single parts | Original |
| frq-long-run-short | side-by-side graphs are standard; no released question asks loss, shut-down and long-run price in this order | Original |
| frq-monocomp-short | no released monopolistic competition graph question | Original |
| frq-monopoly-long | 2022 Set 1 Q1 and 2024 Set 2 Q1 (patent monopoly: graph, shade consumer surplus, elasticity, a price ceiling) | **Flagged, rewritten** |
| frq-monopsony-short | 2025 Set 2 Q2 (the only employer in a small town: hires, wage bill, a minimum wage) | **Flagged, rewritten** |
| frq-perfect-competition-long | 2024 Set 1 Q1 (constant-cost long-run graphs, demand shift from a related good, number of firms, cross-price elasticity) | **Flagged, rewritten** |
| frq-ppc-trade-short | 2023 Set 1 Q2 shares comparative advantage and terms of trade, with a different stimulus (ours: draw the PPC from numbers) | Original |
| frq-price-control-short | 2024 Set 2 Q3 B shares one part | Original |
| frq-surplus-short | 2024 Set 2 Q3 A and 2025 Set 1 Q2 A share one calculation | Original |
| frq-tax-surplus-long | 2024 Set 2 Q3 C shares the subsidy cost only | Original |
| frq-trade-tariff-long | 2026 Q3 (domestic graph, world price below, a tariff, producer surplus) and 2025 Set 1 Q2 (rice, world price, consumer surplus) | **Flagged, rewritten** |

## Changed FRQs (ids and file names kept; tell the exam builder)

All 11: frq-consumer-choice-short, frq-cost-table-short, frq-elasticity-short, frq-externality-short,
frq-game-monopoly-long, frq-game-theory-short, frq-hiring-table-short, frq-monopoly-long, frq-monopsony-short,
frq-perfect-competition-long, frq-trade-tariff-long. Point totals are unchanged (5 short, 10 long). Part labels
changed in: cost-table (C, D, E became C(i), C(ii), D), elasticity (B removed, C and D became B and C, new D),
hiring (C(i), C(ii) became B(i), B(ii); new C), perfect-competition (B became B(i), B(ii); F replaced),
trade-tariff (G became G(i), G(ii)). Topics changed in: cost-table (adds `firm-decisions`), game-monopoly
(`monopoly` replaced by the cost curves of `short-run-costs`, already listed), perfect-competition
(`other-elasticities` replaced by `price-elasticity-supply`). Units are unchanged everywhere.

## Rewrites (summary, before and after)

- **consumer-choice-short**: C was total utility of the best bundle; now the budget rises to \$35 and the student
  identifies the new best bundle (3 books, 2 tickets). A, B and the sunk-cost part D kept.
- **cost-table-short**: B (AVC at 40) and E (profit) removed. Now: MC (kept), identify fixed cost from the table,
  profit-maximizing output and its marginal explanation, then the price falls to \$1.60, below the \$1.75 minimum
  AVC: shut down.
- **elasticity-short**: the "elastic or inelastic" part removed; the revenue part now checks consistency with A;
  new D: a rival studio opens, so demand becomes more elastic.
- **externality-short**: graph and efficient quantity kept; deadweight loss shading and the corrective tax
  replaced by shading the total external cost, why the efficient quantity is not zero, and how the deadweight loss
  changes if damage were \$5 a ton.
- **game-monopoly-long**: matrix part A kept; then the largest combined profit cell (auto `joint`), why it is not a
  Nash equilibrium, and a new second half on one firm's short-run cost curves (draw MC, AVC, ATC and the minimum of
  ATC; why MC crosses ATC there; a rise in pay per repair shifts MC; why AFC is unchanged; why the ATC-AVC gap
  narrows). The merger, monopoly graph, lump-sum fee and deadweight loss are gone.
- **game-theory-short**: part A kept; the fee and combined-profit parts replaced by using the rival's dominant
  strategy to choose, a town rule forcing Regular hours (who gains, who opposes) and its effect on combined profit.
- **hiring-table-short**: diminishing returns and fixed-rent parts removed. Now: MRP of the fourth mechanic, hires
  when the wage falls to \$20 (4) with MRP vs MRC, whether the fourth is hired when the price rises to \$6, and
  derived demand.
- **monopoly-long**: the barrier is now sole control of a key resource, not a patent; shade profit instead of
  consumer surplus; the price ceiling at P = MC replaced by a \$5 per-unit tax (shift MC, effect on Q and P, effect on
  deadweight loss). Graph, deadweight loss, profit from the table and elasticity at QM kept.
- **monopsony-short**: graph and the MFC explanation kept; wage bill and minimum wage replaced by showing the
  competitive outcome (point `competitive`) and shading the monopsony deadweight loss.
- **perfect-competition-long**: the shock is now a yearly inspection fee (a fixed cost) instead of a substitute's
  price: shift ATC, why MC does not move, shade the loss, calculate a \$500 loss, exit, a higher long-run price
  (new minimum ATC), and short-run vs long-run price elasticity of supply. The cross-price part is gone.
- **trade-tariff-long**: the good is now lentils, not rice; consumer surplus shading replaced by shading the gain
  from trade; producer and consumer surplus effects replaced by calculating the tariff's deadweight loss (\$10) and
  why farmers back the tariff. Comparative advantage, the world price graph, imports, tariff revenue and the
  deadweight loss shading kept.

Remaining risk: the canonical formats (monopoly graph, side-by-side competitive graphs, a payoff matrix, a world
price with a tariff) recur in every year's exam, so single parts still match concepts; no FRQ now shares its setup
plus two or more asks with one released question.

`node scripts/check-apmicro-content.mjs`: 0 failing (FRQ 0, exams 0).

Process note: while checking for exam references I ran `node scripts/build-apmicro.mjs --help`, which ignores
the flag and runs the build. It rewrote only `microeconomics/formula-sheet.html` and
`microeconomics/assets/formulas.json` from the current data (the "Easy to forget" count went from 10 to 11
formulas). This is ordinary build output, but it is outside this review's files; the lead may want to rebuild or
restore those two files.
