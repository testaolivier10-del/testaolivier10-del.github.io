# AP® Microeconomics accuracy review: rewritten FRQs and Phase 3 (2026-11-09)

Independent reviewer, not the author. Scope: (1) the 11 FRQs the originality review rewrote
(`docs/apmicro-reviews/originality.md`, "Changed FRQs"); (2) Phase 3: both practice exam forms (all 120 MCQs as
served, with five options), the Section II choices, the 64 "Make it specific" prompts and every row, worked line and
graph of the formula page (`scripts/lib/apmicro-entry.mjs`). Tool files were not touched (a tools reviewer works in
the same folder). Every number below was recomputed by hand or by a scratch script written from the stem, not from
the stored recipe; graph and matrix keys were re-derived from the economics, then graded through
`ApMicroGrade.graph` and `ApMicroMatrix` loaded in a vm (`scripts/test/harness.mjs`).

## 1. The 11 rewritten FRQs

For each FRQ: every number recomputed; points total 5 (short) or 10 (long); one rubric line per point, each a single
checkable point the sample earns; labels and part references consistent; every `auto` line graded by the runtime
grader with the full-credit response correct and every other named region, every wrong curve and every wrong
direction marked wrong with the right slip; no concept used before the FRQ's latest listed topic (the topic it
unlocks with).

| FRQ | Recheck |
|---|---|
| consumer-choice-short | MU per dollar: books 10, 8, 6, 4; tickets 12, 8, 5. \$30: 2 books, 2 tickets (total utility 290, best of every affordable bundle). \$35: 3 books, 2 tickets (320 against 300 for 1 and 3). 80 / 10 = 8. Sunk cost taught in `marginal-analysis`. |
| cost-table-short | MC 2, 1.5, 2, 2.5, 3, 4; MC 20 to 30 = 2. TFC 40. At \$3.20: 50 bagels (MC 3 < 3.20 < 4; profit 10 against 8 at 40). AVC 2.00, 1.75, 1.83, 2.00, 2.20, 2.50: minimum 1.75 > 1.60, shut down. |
| elasticity-short | 50% / 20% = 2.5; TR 1,000 to 1,200 (elastic, consistent); 1,080 to 800 (inelastic); a new substitute makes demand more elastic. |
| externality-short | `efficient` (4, 6) left of `market` (5, 5). `ext-cost` = a + b + c, the band between MSC and S from 0 to QM; `dwl` (a) graded wrong with its slip. A \$5 damage raises the DWL. |
| game-monopoly-long | Pedalwise Expand dominant (45 > 40, 70 > 50); Sunpath none (Stay if Pedalwise expands, 25 > 10; Expand if Pedalwise stays, 50 > 48); one Nash (Expand, Stay); sums 55, 95, 90, 98: joint (Stay, Stay). My solver and `ApMicroMatrix` agree. Costs: X at `min-atc`; MC up graded right, MC down, ATC up and ATC down wrong. |
| game-theory-short | Alder none (35 > 25, 60 > 48); Bexley Late dominant (30 > 20, 55 > 45); one Nash (Regular, Late); rule: Alder +13, Bexley -10; combined 90 to 93, the joint cell. |
| hiring-table-short | MP 10, 14, 10, 6, 3; MRP at \$4: 40, 56, 40, 24, 12. Wage \$20: hire 4. Price \$6: fourth MRP 36 > 30, fifth 18 < 30. |
| monopoly-long | (40 - 25) x 200 = 3,000; MR = MC = 18 > 0, elastic; MC 18 < ATC 25 is consistent with QM left of minimum ATC (graph: QM 3.21, minimum ATC at 3.5). Profit b, DWL d; tax shifts MC up (ATC follows), D and ATC graded wrong with their slips. |
| monopsony-short | `hire` (3, 4) on SL below MRP = MFC; `competitive` (4.5, 5.5): more labor, higher wage; DWL b between MRP and SL from QM to the competitive quantity; wage bill graded wrong. |
| perfect-competition-long | Line at the market price, qF at minimum ATC (5.6, 5). Fee shifts ATC only (MC and S graded wrong with their slips). Loss a (ATC2 above P at the same q). (8 - 9) x 500 = -500. Exit, price to the new higher minimum ATC; supply more elastic in the long run. |
| trade-tariff-long | OC lentils: Castrel 8 / 4 = 2 cloth, Ostavia 6 / 6 = 1: Ostavia. Table is D = 120 - 10P, S = 10P - 20, crossing at \$7, 50. Imports at \$4: 80 - 20 = 60; tariff revenue 1 x (70 - 30) = 40; DWL 5 + 5 = 10. Gain from trade d (the triangle under min(D, S) above PW), tariff DWL d + f; every other region graded wrong. |

Part labels: every in-question reference (C(i), E(i), B(i), "part A", "part B", "part C") points to a part that
exists. Nothing outside the FRQ files refers to a removed part label (searched data, scripts and docs).

### Errors fixed

| Where | Before | After | Why |
|---|---|---|---|
| `frq-monopsony-short` part D prompt | "Explain why Corbie's marginal factor cost of labor is greater than the wage, without a minimum wage." | "Explain why Corbie's marginal factor cost of labor is greater than the wage it pays." | A leftover from the removed minimum wage part: the clause reads as part of the reason and confuses the ask. Rubric and sample unchanged. |
| `docs/apmicro-dependency-map.json` FRQ theme titles (all 11) | Titles of the old FRQs (e.g. monopoly "consumer surplus ... a price ceiling at P = MC", game-monopoly "monopoly graph with a lump-sum tax") | Titles that describe the rewritten questions | Labels consistent with the content; ids, topics and graph kinds unchanged. |

## 2. Section II on the forms

Form 1: `frq-perfect-competition-long` (Units 2, 3), `frq-game-theory-short` (Unit 4), `frq-externality-short`
(Unit 6). Form 2: `frq-labor-market-long` (Units 3, 5), `frq-price-control-short` (Unit 2), `frq-ppc-trade-short`
(Unit 1). No unit in two FRQs of a form; each long question has graph parts (perfect competition: three; labor
market: unchanged by the rewrites); the part labels referenced inside the two rewritten form FRQs exist. Still fits.

## 3. Section I: all 120 MCQs as served

Every question was read as `examVersion` serves it (bank question plus its fifth option at `fifthAt(id)`, key
moved with it) or as stored (the 20 exam-only items), with every key and named distractor recomputed: 1-01
(10%, 20%, 2; revenue 1,000 to 880), 1-03 (60 / 10 = 6; the 6.67 distractor is AVC at 30 chairs, 200 / 30), 1-04 (loss 50
against fixed cost 100), 1-06 (MR 10, 8, 6, 4, 2 against MC 4: 4 thousand at \$7), 1-08 (Altura dominant 30 > 20,
50 > 45; Bexley none), 1-09 (MRP 50, 40, 30, 20, 10 against \$30: 3), 2-01 (-10% / 10% = -1, inferior), 2-03 (MP 8,
10, 8: diminishing from the third; 8.7 is AP), 2-04 (30,000 and -10,000), 2-06 (1.50 x 200 = 300 thousand), 2-08
(no dominant strategy, two Nash cells, joint 22 at (Late, Early)), 2-09 (TLC 8, 20, 36, 56; MFC 8, 12, 16, 20: 3
at \$12), 2-10 (4 + 9 = 13). Graph reads checked against `ApMicroGraph.areas` and named points: 1-02 ceiling DWL c,
e; 2-02 floor PS b, d, f; 1-05 profit a; 2-05 loss a with the price (4.5) above minimum AVC (3.6) and below minimum
ATC (5), so the firm produces; 2-07 profit b; 1-07 fair-return quantity 6 between MR = MC (4) and P = MC (8); 1-10
DWL a. Bank stimulus reads (monopoly TR b, c; externality DWL a; subsidy DWL g; LRATC minimum 6 at 300 to 400
kayaks) also confirmed.

All 100 fifth options were judged against their stems: each must be clearly wrong, must not repeat or restate
another option and must not make the item ambiguous. 97 pass. Three were fixed (keys unchanged; the fifth stays at
the same position):

| Item | Before (fifth option) | After | Why |
|---|---|---|---|
| `mic-disequilibrium-changes-15` (form 1, Q19) | "The quantity of Y rises less than the quantity of X" | "The quantities of X and Y rise by the same amount" (why rewritten to match) | It said the same thing as option C ("The quantity of X rises more than the quantity of Y"), so a test-wise student could strike both at once. |
| `mic-profit-maximization-5` (form 1, Q33) | "\$4, the price minus the average cost" | "\$1.60, the price minus the average cost" (why: \$20 - \$18.40 = \$1.60 is profit per mug; AR = \$100 ÷ 5 = \$20) | The number did not match its own description (P - ATC at 5 mugs is 20 - 18.40 = 1.60), so it modeled no real slip. |
| `mic-public-goods-15` (form 2, Q58) | "A public good once the tolls are removed" | "A rival good, because each car uses up road space" (why: one more car slows no one, so nonrival; the gate makes it excludable: a club good) | The old statement is true (an uncrowded road with no tolls is a public good), so a student could defend it. The new one contradicts the stem. |

One explanation fixed: `mic-exam-2-08` "why.correct" said "Marlo's gets 12 rather than 7 by switching" (it gets
7 by switching) and named the cells "(Open early, Open late)", which are not the matrix's strategy names. Now:
"In (Marlo's Early, Nessa's Late), Marlo's gets 12 rather than the 7 it would get by switching to Late, and Nessa's
9 rather than the 6 it would get by switching to Early ...".

## 4. "Make it specific" prompts (64)

Every prompt, earns answer, misses answer and slot key was read; every number recomputed (slope 20 / 4 = 5; triangle
12; OC 2 tables; Ardent 2 against Birch 3, terms 2.5; net benefit 1,500; tutoring 3 hours; 4 against 3 utils per
dollar; 30% / 25% = 1.2 with revenue 800 to 700; cross-price -0.5; CS 80; tax 80 and DWL 10; shortage 300; imports 20
and tariff revenue 20; MP 10, 14, 10, 6; MC 6; economic profit -10,000; 6 units; shutdown (loss 300 against 200);
MRP 48; 4 workers; MP per dollar 2 against 2.5; monopsony 4 at \$12, consistent with a supply of 10, 12, 14 for 3, 4,
5 workers; DWL 30; Lorenz 15%; tax on advertising 15 and 35). Every keyed slot is right and every other option wrong.

| Prompt | Before | After | Why |
|---|---|---|---|
| `u6-progressive-tax` earns answer | "the Gini coefficient, the gap between the line and the curve, falls" | "the Gini coefficient, which measures the area between the line and the curve as a share, falls" | The Gini is an area ratio, not a gap; matches the wording needs-author `gini` fixes for the course. |

## 5. Formula page

All 29 rows: formula, meaning, use, trap and topic checked; every worked line evaluated through
`workedTex` and recomputed by hand (OC 2; 15 utils per dollar; 20%; 2; midpoint 1.22; 1; -1.25; 2; \$400; \$80; \$80;
\$80; \$180; \$20; 30 units; \$20; 10; 15; \$240; \$6; \$12; \$4; \$4; \$300; -10,000 dollars; \$40; \$80; 2 units per dollar;
\$360). Units and signs right. All 17 graph captions checked against the regions `ApMicroGraph.areas` lettered
(ceiling CS a + b + d, PS f, DWL c + e; tax revenue b + d, DWL c + e; subsidy cost b + c + e + f + g, DWL g; tariff
revenue e, DWL d + f; demand TR a; pc profit a; monopoly CS a, profit b, DWL d; externality DWL a). The payoff matrix
card: Firm A Low price dominant (40 > 20, 70 > 50). No errors.

## Runs

`node scripts/check-apmicro-content.mjs`: 0 failing (exams 0, FRQ 0). `node scripts/check-apmicro-map.mjs`: nothing
used before it is taught. `node scripts/build-apmicro.mjs --check`: clean (no chapter published yet).
`node --test scripts/test/apmicro-*.test.mjs`: 187 of 187 pass.

## Keys changed

None. No item id, FRQ id, option position or key moved.

## Open points for a person

1. Payoff units in matrices. `mic-matrix.js` shows `unit: "$"` as "\$25" in each cell with the caption "Payoffs
   (dollars)", but both rewritten game FRQs (and several bank items, e.g. `mic-oligopoly-game-theory-14`, `-16`)
   state the payoffs in hundreds or thousands of dollars in the scenario. The text is right; the caption is
   loose. Either a scale field in the matrix spec ("thousands of dollars") or a caption override would fix it
   everywhere; it is an engine change, so it is left to the integrator.
2. `frq-game-monopoly-long` F(i): moving ATC up (economically true, since ATC rises with MC) is graded wrong with
   the slip "MC shifts up, and AVC and ATC move up with it". That is the intended teaching (the variable cost moves
   MC; ATC follows), and the rubric line says so, but a reader of a paper answer would also expect MC drawn
   shifted. No change made.
