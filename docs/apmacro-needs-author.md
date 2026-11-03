# AP® Macroeconomics: open points for a person

Questions the research and the build could not settle. Add an entry instead of guessing; mark it resolved with
the date and the answer. Seeded in Phase 0 (2026-11-03) from `docs/apmacro-research/framework.md` section 10.

## ced-text: essential knowledge for Topics 3.7-6.6 was not read in the CED (open, 2026-11-03)

The CED PDF could be read only for Units 1-2 and Topics 3.2-3.6. Knowledge for 3.7-6.6 in
`docs/apmacro-ced-map.json` comes from the 2023-2026 scoring guidelines, Chief Reader Reports and standard
economics, and says so in each topic's `source`. A person should scan the CED for Units 3-6 (essential knowledge
and any "beyond the scope" statements besides the PPI) and correct the map before those units are reviewed.

## topic-skills: per-topic focus skills are ours (open, 2026-11-03)

The Course at a Glance skill tags for 5.5-5.7 were garbled in extraction, and no topic's tags were copied: every
topic's `skills` in the map is our reading of what it practices. Check against the CED's topic pages.

## balanced-budget: is the balanced-budget multiplier in the CED? (open, 2026-11-03)

It was not seen in the readable CED text (3.2 names the spending and tax multipliers). `ApMacroCalc` has it and
the formulas page leaves it out; authors teach it only as a consequence of the two multipliers until confirmed.

## quantity-theory: MV = PY and money neutrality wording (open, 2026-11-03)

5.3 is built on the quantity theory of money; confirm the CED's wording (and whether velocity is computed).

## money-multiplier: the money multiplier and the reserve requirement in the current CED (open, 2026-11-03)

The ample-reserves framework is taught as the Fed's current system (spec decision 7) and limited reserves
alongside for the reserve requirement and the money multiplier. Confirm the CED's essential knowledge for 4.4 and
4.6 and when the ample-reserves framework entered it; the reader reports test both.

## mcq-options: four or five answer choices on the 2027 digital exam (open, 2026-11-03)

Older exams had five; other digital AP® exams use four. `MCQ_OPTIONS` is 4 (`scripts/lib/apmacro-exams.mjs`) and
the content check holds single-answer items to it. Change it in one place if the answer is five.

## mcq-sets: set counts in Section I (open, 2026-11-03)

Whether Section I has stimulus sets and how many is not published. `EXAM_SETS` allows 0-6 data, 0-6 graph and
0-4 scenario sets in a form until a person confirms.

## practice-weights: skill weights in Section I are not published (open, 2026-11-03)

No percentage weighting by skill category was found. `practicesConfirmed` is false, so the forms check enforces
unit weights only.

## exam-2026: 2026 statistics (open, 2026-11-03)

The 2026 student count, mean, Chief Reader Report and scoring statistics were not posted; the 2026 percentages
in the research are rounded and may change.

## blocked-pages: two College Board pages were not read (open, 2026-11-03)

https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-macroeconomics and
https://apstudents.collegeboard.org/courses/ap-macroeconomics/assessment (a permission prompt was not answered).

## graph-labels: the CED's graph labeling appendix (open, 2026-11-03)

The axis labels in `mac-graph.js` (`AXIS`, `labelText`) and the authoring guide are the standard ones; check them
against the CED's graph appendix (accepted abbreviations, the reserve market's axis names, the foreign exchange
axis wording).

## reserve-graph: how the reserve market graph is drawn (open, 2026-11-03)

`mac-graph.js` draws reserve demand as a steep segment, then flat in the ample range at the administered rate,
with vertical reserve supply crossing in the flat part; raising the administered rate shifts the flat part up.
The scoring guidelines describe "bounds" on the policy rate (interest on reserves and the ON RRP rate). Decide
whether the graph needs both bounds drawn before Unit 4 is reviewed.

## identity: accent, cover, icon, headline and ranks (open, 2026-11-03)

All provisional (spec section 9): yellow-green accent hue 88° (`#355A0A` on `#EEF4E0`, dark `#CDE6A0`; the widest
gap on the wheel, between Environmental Science's olive and Biology's green), cover `#2E4D0C` with `#C8F07A` (a
supply and demand cross with a shifted curve), icon the same cross, headline "every graph, every shift.", ranks
Scarcity Spotter to Macroeconomics Legend. One place: `IDENTITY` in `scripts/lib/apmacro-build.mjs`, with
`assets/theme.css`, `assets/hub-progress.js`, `scripts/lib/course-homes.json` and the cover CSS twins (listed in
`docs/apmacro-architecture.md`, "Registration").

## free-tier: graph skills, Units 1 and 2 (open, 2026-11-03)

Spec decision 6, proposed: Unit 1 alone is only 5-10% of the exam. Free trainers `graph-studio`, `ppc-trade`,
`indicators-lab` (spec section 6). Owner to confirm.

## frq-grader: the AI FRQ grader is not wired for this course (open, 2026-11-03)

The hook is in `pages/frq.js` as in every course; `FRQ_COURSES` does not list `apmacro`. Graph parts are checked by
code; written parts would need their own calibration before the grader is turned on.

## Author B (Unit 2)

### b-cycle-graph: no business cycle graph kind (open, 2026-11-03)

Topic 2.7's focus skills include 4.A, but `mac-graph.js` has no business cycle kind (real GDP against time with
potential output), so Unit 2 has no drawable business cycle item. Unit 2's graph items use the PPC instead
(unemployment and a recession as a point inside, full employment on the curve, a larger labor force shifting it
out), and the cycle itself is a lesson figure and a line-plot data set. A person should decide whether the exam
asks students to draw the cycle and, if so, whether Graph Studio needs a `cycle` kind.

### b-transfer-payments: taught in 2.1, not 3.8 (open, 2026-11-03)

GDP by expenditure leaves out transfer payments (author B brief; CED 2.1), so the map's `transfer-payments`
concept moved from `fiscal-policy` to `gdp-circular-flow` (dependsOn `gdp`) and is defined in Unit 2's glossary.
Author C should not define it again in `fiscal-policy`; confirm nothing in Unit 3 relied on its old place.

### b-real-gdp-method: base-year prices vs chained prices (open, 2026-11-03)

The notes say statistics agencies now compute real GDP with chained prices because one fixed base year can
overstate growth, and that the exam uses the base-year method. Check this wording against the CED's 2.6 text.

### b-recession-dating: how a recession is defined (open, 2026-11-03)

The 2.7 notes say a committee of economists dates United States recessions as a significant, widespread fall in
activity lasting more than a few months, with two quarters of falling real GDP as a common rule of thumb; no item
keys on either definition. Check that the course should mention the committee (the NBER) at all.

## Author F (Unit 6)

### f-inflow-loanable-funds: capital inflows and the supply of loanable funds (open, 2026-11-03)

Topic 6.6 teaches that a capital inflow adds to the supply of loanable funds in the receiving country (holding
down its real interest rate and softening crowding out) and lowers it in the sending country. This is standard
college macro and common in AP® Macroeconomics review material, but the CED 6.6 text was not read (`ced-text`).
Used in `real-rates-financial-flows` notes, lesson idea 3, items 10 (graph, SLF right) and 18, not in any FRQ.

### f-official-reserves: central bank reserve transactions in the balance of payments (open, 2026-11-03)

The 6.1 notes say, in a "going further" aside only, that central bank purchases and sales of foreign assets are
recorded with the other asset trades in the capital and financial account (some textbooks show an official
reserves line). No item asks about it. Confirm the CED's treatment before adding items.

### f-one-curve-keys: forex and loanable funds keys that name one of two accepted shifts (open, 2026-11-03)

The exam accepts either shift for several changes: government borrowing (demand for loanable funds right, or
supply left), a capital inflow (demand for the currency right, or supply left), higher inflation abroad (demand
for the home currency right, or supply left). `ApMacroGrade.graph` keys one set of shifts, so every graph item and
FRQ graph part here names the actor in its prompt ("Belvian savers buy more Arland bonds") to make one curve the
answer, and the FRQ rubric `accept` lists say the other shift also earns the point and the automatic tick looks
only for the keyed one. A grader option for alternative keys (a shared-file change to `mac-graph.js` /
`mac-grade.js`) would let prompts be worded as the exam words them.

### f-invented-countries: invented countries, real currencies in the notes (open, 2026-11-03)

Every item and FRQ uses invented countries (Arland with the arl, Belvia with the bel; in `frq-forex-short`
Arland's currency is called the dollar to match the theme title). The notes, lesson hooks and figures use the
US dollar and the euro with made-up rates labeled "suppose" or "made up for practice", for intuition. The exam
itself uses real countries; confirm this split is what the owner wants.

### f-appreciation-costs: the net exports effect only (open, 2026-11-03)

6.5 graph items say "considering only the effect on net exports" (AD shifts). An appreciation also makes imported
inputs cheaper, which could shift SRAS; the 6.5 notes mention this in a "going further" aside. Confirm that the
exam scores only the AD (net exports) effect for exchange rate questions.

### f-policy-real-rate: monetary policy and the real interest rate in the short run (open, 2026-11-03)

6.4 and 6.6 scenarios say "expected inflation does not change", so a change in the policy rate moves the real
rate and capital flows. The notes state the general rule (with expected inflation slow to move, real rates
follow nominal rates in the short run). Confirm wording against the CED 6.4/6.6 text when it is read.

## Author A (graph skills chapter and Unit 1)

### a-ppc-straight: the `ppc` graph kind is bowed only (open, 2026-11-03)

`mac-graph.js` draws every PPC as a quarter circle (increasing opportunity cost). Comparative advantage problems
use constant-cost, straight-line PPCs (CED 1.3; the lesson figure `comparative-advantage-two-ppcs` draws them
straight). The short FRQ `frq-ppc-trade-short` part A therefore asks only for labels and a point inside (neither
depends on the shape), and its sample describes a straight line while the on-page drawing tool shows a bowed
curve. A person (or builder T1/T3) should decide whether Graph Studio needs a straight `ppc` shape (for example a
`linear: true` option), after which part A could ask for the endpoints and a point outside after trade.

### a-ppc-growth-words: "economic growth" before Topic 5.6 (open, 2026-11-03)

The CED's 1.2 knowledge links an outward PPC shift to growth, but the map teaches `economic-growth` in 5.6, so
Unit 1 says "growth" and "more resources or better technology" and names economic growth only inside a preview
box. Check whether the map should teach the term in 1.2 instead.

### a-shortage-scarcity: shortage named in 1.1 only in a preview box (open, 2026-11-03)

Scarcity vs a shortage is a classic confusion, but `shortage` is taught in 1.6, so the 1.1 notes contrast them in a
preview box and the 1.1 items say "a store has sold out" instead. Confirm this is acceptable.

### a-supply-slope-reason: why supply slopes up (open, 2026-11-03)

The 1.5 lesson and items explain the law of supply by rising cost of extra output (a higher price covers it and
makes extra output profitable). The CED text for 1.5 was read only in summary (framework.md section 3); check that
the CED gives the same reason and does not expect marginal cost language (a microeconomics term).

### a-demand-determinants: the demand and supply shifter lists (open, 2026-11-03)

Demand shifters taught: tastes, income (normal and inferior goods), prices of substitutes and complements,
expectations, number of buyers. Supply shifters taught: input costs, technology, taxes and subsidies on producers,
expectations, number of sellers. "Prices of other goods the producer could make" is left out of supply (standard in
college texts, not in our CED summary). A person should check both lists against the CED 1.4 and 1.5 text.
