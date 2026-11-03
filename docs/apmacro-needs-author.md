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

### b-cycle-graph: no business cycle graph kind (decided, 2026-11-03)

Decided by the integrator: no `cycle` kind for now. It is not cheap: real GDP against time is not a pair of
curves that shift to a new equilibrium, so `ApMacroGraph`'s model (shapes, shifts, `eq`, `outcome`), the checker
and `ApMacroGrade.graph` would each need a second paradigm (phases and turning points along a time path), and the
drag renderer a different control. What Unit 2 needs is covered: the cycle as a lesson figure and as `ApMacroPlot`
line data sets that set items ask about (peak, trough, expansion, the output gap against potential), and the PPC
for unemployment. The research (`framework.md` section 8, "Every graph students must draw") lists the graphs FRQs ask for, and
the business cycle is not among them. Reopen if a person finds
that the exam does; then a `cycle` kind with `do: ["point"]` (place the peak, trough or a recession) is the
smallest useful version. The original note:

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

### f-one-curve-keys: forex and loanable funds keys that name one of two accepted shifts (resolved, 2026-11-03)

Resolved by the integrator with `key.alt`: `mac-fx-policy-changes-9` and `-11`, `mac-real-rates-financial-flows-9`
and `-11`, `frq-forex-short` A and `frq-open-economy-long` A and C now say only what changed (relative real
interest rates, relative price levels, inflation abroad, government borrowing) and grade either accepted shift (both
for relative price levels); rubric lines name both. Items about one side (tourists, imports, income) still name it.
Still for a person: confirm both are credited on current scoring guidelines. The original note:

The exam accepts either shift for several changes: government borrowing (demand for loanable funds right, or
supply left), a capital inflow (demand for the currency right, or supply left), higher inflation abroad (demand
for the home currency right, or supply left). `ApMacroGrade.graph` keys one set of shifts, so every graph item and
FRQ graph part here names the actor in its prompt ("Belvian savers buy more Arland bonds") to make one curve the
answer, and the FRQ rubric `accept` lists say the other shift also earns the point and the automatic tick looks
only for the keyed one. A grader option for alternative keys (a shared-file change to `mac-graph.js` /
`mac-grade.js`) would let prompts be worded as the exam words them.

### f-invented-countries: invented countries, real currencies in the notes (resolved as a rule, 2026-11-03)

The integrator set one rule (authoring guide, "Invented countries"): graded content (items, FRQs, tool drills) uses
invented countries with invented currencies, teaching text may use real currencies labeled illustrative. Applied:
`frq-forex-short` now calls Arland's currency the arl (as every other Unit 6 item does) and Unit 6's balance of
payments counts Arland's amounts in arls; Arland, used by authors A-E as well, is now Unit 6's alone (Dornia,
Halvet, Quillon, Quentar, Sundra elsewhere), and the other names two sets shared were split (Calder, Ostra, Pell,
Tamsin, Velora). The forex lab's drills moved to invented currencies; Graph Studio's forex words dropped the crown,
peso, mark, franc and florin. The owner may still prefer real countries in graded content (the exam uses them); one
rule now, in one place. The original note:

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

### a-ppc-straight: the `ppc` graph kind is bowed only (resolved, 2026-11-03)

Resolved by the integrator: `mac-graph.js` has a straight-line PPC (`linear: true`, intercepts from `ends`), with
the checker and grader. `frq-ppc-trade-short` part A now draws Kestria's straight PPC (36 corn, 12 fabric, shown
on the axes) with labels and point U inside; its rubric and sample name the straight line. The original note:

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

## Author C (Unit 3)

### c-expected-inflation: inflation expectations shift SRAS in 3.3, but the map teaches the term in 5.2 (resolved, 2026-11-03)

Resolved by the integrator: `expected-inflation` (aliases "inflation expectations", "expected inflation rate") is now
taught in `sras` (3.3, the earliest topic that needs it in CED order), depending only on `inflation`, with its
glossary entry moved from `phillips-curve` to `sras`. The `sras` lesson, notes table and `mac-sras-10` now use the
term. The original note:

Our CED summary for 3.3 lists inflation expectations as an SRAS shifter, but the map's `expected-inflation`
concept (aliases "inflation expectations") is taught in `phillips-curve` (author E), so Unit 3 cannot use the term.
Unit 3 says it in plain words instead ("workers expect prices to rise faster and bargain for higher nominal
wages") in `sras` and `long-run-self-adjustment`. A lead should decide whether to move `expected-inflation` to
`sras` (it depends only on `inflation`) so the CED term can be used from 3.3.

### c-transfer-multiplier: the effect of a transfer as MPC / MPS (open, 2026-11-03)

`fiscal-policy` teaches that a change in transfer payments raises disposable income like a tax cut, so its effect
on output is MPC / MPS times the transfer (keyed as `totalChange(-transfer, taxMultiplier)`). Standard college
macro, but the CED text for 3.8 was not read (ced-text); confirm that transfers are treated this way.

### c-balanced-budget-use: one item and one notes paragraph derive the balanced-budget multiplier (open, 2026-11-03)

Per the `balanced-budget` entry, `multipliers` derives it only as a consequence of the two multipliers (G and T
up by 50 with MPC 0.8: +250 - 200 = +50; `mac-multipliers-12`), with the name given once. Drop the item if the CED
leaves it out.

### c-fiscal-lags: lags named in fiscal-policy (open, 2026-11-03)

`fiscal-policy` names recognition, decision and implementation lags as why discretionary policy can arrive late
(one item, `mac-fiscal-policy-14`). Standard, but not seen in the readable CED; check it is in scope for 3.8.

### c-long-frq-money: the long FRQ's money market part (open, 2026-11-03)

`frq-recession-long` part D asks for the effect of higher real GDP on the money market with the money supply
held constant, stated as a limited-reserves framework (it lists `money-market` and `monetary-policy`, so it
unlocks with 4.6). Readers have scored this shape (money demand right, nominal rate up); check the framework
wording is what a 2027 reader expects, given that under ample reserves the central bank would hold the policy rate.

### c-downward-stickiness: why self-adjustment from a recession is slow (open, 2026-11-03)

`long-run-self-adjustment` says nominal wages are especially slow to fall (contracts, reluctance to cut pay). Standard
in college texts; the CED text for 3.7 was not read.

## Author E (Unit 5)

### e-lrpc-shift-srpc: does the SRPC move with LRPC when the natural rate changes? (open, 2026-11-03)

`phillips-curve` item 13 (a fall in the natural rate) lets the student move LRPC only (`movable: ["LRPC"]`), so
the key is "LRPC left" and nothing else can be marked wrong. Some texts also shift the SRPC with it, so that it
still crosses LRPC at expected inflation. A person should check how the scoring guidelines treat the SRPC in that
case before an item lets both curves move.

### e-phillips-long-run: the long run after a demand shock (open, 2026-11-03)

The lessons, items 10-12 and `frq-phillips-short` C say the SRPC shifts right (or left) in the long run "as
expected inflation adjusts", and the economy returns to LRPC at the new inflation rate; the item stems state the
expectations assumption ("households and firms come to expect the higher inflation rate"). This is the standard
reader-report treatment; confirm it matches the CED 5.2 wording. After a negative supply shock with no policy,
the content (and `frq-phillips-long` D and E) says nominal wages fall, SRAS shifts back right, the SRPC shifts
back left, and the economy returns to its starting inflation and unemployment rates.

### e-crowding-out-curve: demand or supply for government borrowing (resolved, 2026-11-03)

Resolved by the integrator: `mac-crowding-out-2` and `-3`, `frq-crowding-out-short` A and `frq-deficit-long` C no
longer fix the curve ("show the effect of the borrowing on the real interest rate"); they key DLF and accept SLF
the other way (`key.alt`), with rubric lines and samples naming both. The original note:

As in `f-one-curve-keys`: every `lf` graph item and FRQ graph part in `crowding-out` and both E FRQs says "show
the borrowing as a change in the demand for loanable funds", and the `SLF` slip line and the notes say a
supply-side drawing (lower public saving) also raises the real rate. The FRQ rubrics do not list the supply
shift as accepted because the prompt fixes the curve; revisit if a grader option for alternative keys is added.

### e-quantity-theory-scope: velocity arithmetic and the growth-rate form (open, 2026-11-03)

Adds to `quantity-theory`. `money-growth-inflation` computes velocity (nominal GDP / M), the price level from
M x V / Y, and long-run inflation from "money growth + velocity growth - real output growth" (items 1-3, 5, 8,
9, notes). The growth-rate form is an approximation, labeled "about" in every stem. Confirm both are in scope for
5.3 before Unit 5 is reviewed; if the CED stops at M x V = P x Y in words, items 5 and 8 can become qualitative.

### e-growth-policy-scope: what 5.7 includes (open, 2026-11-03)

The 5.7 content covers investment incentives, smaller deficits (less crowding out), education and training,
public health, research funding and patents, infrastructure, and supply-side fiscal policy (incentives to work,
save and invest, with its AD effect in the short run). It says the size of supply-side effects "remains debated"
and takes no side. Institutions and property rights appear in one closing notes sentence only. A person should
check the list against the CED 5.7 text (`ced-text`).

### e-real-facts: real-world facts in hooks and notes (resolved by the Unit 5 reviewer, 2026-11-03)

Checked (`docs/apmacro-reviews/unit-5.md`): US real GDP per person was 19,614 (2017 dollars) in 1960 Q1 and
71,751 in 2026 Q3 (BEA via FRED, A939RX0Q048SBEA), 3.7 times; nonfarm business output per hour rose from index
32.0 to 120.0 (BLS via FRED, OPHNFB), 3.75 times. The hook and notes now say "about three and a half times" for
both (they said "several times" and "roughly three times"). The 1960s trade-off and 1970s oil-shock stagflation
match CRS report RL34428; Germany 1923 and Zimbabwe 2008 as money-financed hyperinflations match standard
accounts (Hanke and Kwok, Cato Journal 2009, for Zimbabwe). The original note:

Unchecked against a source in this pass, stated cautiously: US real GDP per person "roughly three times" its 1960
level and output per hour "several times" (`economic-growth` hook and notes); Germany 1923 and Zimbabwe 2008 as
hyperinflations from money creation to pay government bills (`money-growth-inflation`); low unemployment with
high inflation in the 1960s and stagflation after the 1970s oil price jumps (`phillips-curve` hook). Verify
before publishing; every number in items is invented and labeled.

### e-frq-scenario: FRQ scenario text sits in part A's prompt (resolved, 2026-11-03)

Resolved by the integrator: FRQs have a text `scenario` field shown before the parts (generator, `checkFrq`,
`frq-kit.js`); the opening scenario of part A moved there in 13 FRQs (every author's, not only E's). The original note:

The FRQ format has no field for a text scenario above the parts (`stimulus` is checked as a data table), so each
E FRQ opens its part A prompt with the scenario. A text `scenario` field rendered above the parts (generator and
`checkFrq`) would match the exam's layout; until then the wording works as it stands.

## Author D (Unit 4)

### d-m1-savings: savings deposits moved into M1 in May 2020 (open, 2026-11-03)

U.S. official statistics have counted savings deposits in M1 since May 2020; older textbooks (and possibly the
CED's 4.3 text, not read) put them in M2 only. `money-functions` teaches the current definition and says older
books differ; no item asks where savings deposits go, and no table includes them (M1 items use currency and
checkable deposits; M2 adds small time deposits and retail money market funds). A person should check the CED's
4.3 wording and decide whether to state one definition.

### d-expected-inflation: "expected inflation" is a 5.2 concept but 4.2 needs it (resolved, 2026-11-03)

Resolved with `c-expected-inflation`: the term is taught in 3.3, "expected inflation rate" is now its alias (no
longer `real-rate`'s), and `real-rate` depends on it. Unit 4's wording stands. The original note:

The map teaches `expected-inflation` ("expected inflation", "inflation expectations") in `phillips-curve` (5.2),
but the real interest rate (4.2) is the nominal rate minus expected inflation. Smallest fix made: the alias
"expected inflation rate" on `real-rate` (4.2), and Unit 4 always writes "the expected inflation rate". A person
(or author E) may prefer to move the term itself to 4.2.

### d-lf-government: government borrowing as a demand shift or a supply shift (resolved in the grader, 2026-11-03)

The integrator added `key.alt` (SLF left) to `frq-ample-reserves-long` E(i), so the automatic check now credits
both, as its rubric already did. Still for a person: confirm both on the current scoring guidelines. The original note:

`loanable-funds` and `frq-ample-reserves-long` teach government borrowing as DLF shifting right and say that
showing lower public saving as SLF shifting left also raises the real rate (the FRQ rubric accepts both). Check
that both are accepted on the current scoring guidelines.

### d-bond-yield: computing a bond's yield (open, 2026-11-03)

`financial-assets` has a worked example and two numeric items for the yield on a bond's price (yearly payment /
price x 100), to make the inverse link concrete. The exam is not known to ask for this calculation; a person
should confirm it is in scope or drop the two items (mac-financial-assets-3 and -15).

### d-ample-tools: what Unit 4 teaches about the ample-reserves tools (open, 2026-11-03)

Taught: interest on reserve balances as the main administered rate, the ON RRP rate as a floor for other lenders,
the federal funds rate trading between them (just below IORB), the reserve requirement at zero since March 2020,
open market operations used to keep reserves ample. Not taught: the discount (primary credit) rate as an
administered rate in the ample framework (it is taught only as a limited-reserves tool). The reserve market graph
draws one flat level (IORB), as `mac-graph.js` does (see `reserve-graph`). Check against the CED's 4.6.

## Builder T1 (Graph Studio)

### t1-lras-drill: LRAS shifts are in Explore only (open, 2026-11-03)

Graph Studio's Explore shows "more labor and capital" as LRAS and SRAS both shifting right (real output up, price
level down) and says SRAS usually moves with LRAS. The drills leave LRAS shifts out, because scoring guidelines
differ on whether SRAS must shift too, and `ApMacroGrade.graph` would mark the other answer wrong. The same holds
for a lower natural rate of unemployment (LRPC left, Explore only: does SRPC shift left with it?). A person should
say which answer readers credit; then the scenarios `adas-capacity` and `ph-natural` can be drilled
(`"drill": false` in `macroeconomics/data/tools/graph-studio.json`).

### t1-deficit-alt: a deficit graded either way in the drills (open, 2026-11-03; `key.alt` now shared and used by content)

As in `d-lf-government` and `e-crowding-out-curve`: the drill accepts DLF right or SLF left for "the government
borrows to cover a larger deficit" (the tool grades the shift against both keys with `ApMacroGrade.graph`, keeps the
one the student drew, and the result step follows that graph: quantity of loanable funds up for DLF, down for
SLF). Confirm both are credited on the current scoring guidelines. The shared grader could do this for every item
(`key.alt`, proposed in the T1 report).

### t1-phillips-shock: a supply shock on the Phillips curves (open, 2026-11-03)

"Oil prices jump, so SRAS shifts left" is drilled as SRPC shifting right with no E2 step, because `mac-graph.js`
places the Phillips equilibrium where SRPC meets LRPC (the expected inflation rate), while the short-run point after
the shock is to the right of LRPC. An AD shift is drilled as a point on SRPC (up and to the left for more AD).
Check that this matches how readers score the shock.

### t1-axis-marks: value marks on the axes (open, 2026-11-03)

The renderer change proposed in the T1 report labels E1 and E2 on both axes with P, Q (supply and demand), PL, Y
(AD-AS), i, M (money market), i, R (reserve market), r, Q (loanable funds), π, u (Phillips curves) and XR, Q
(foreign exchange), with subscripts 1 and 2. Check the letters against the CED's graph appendix (`graph-labels`).

### t1-free-explore: Explore is free for every graph (open, 2026-11-03)

Spec section 6 makes Graph Studio free as "Explore plus the PPC and supply-and-demand drills". Built that way:
Explore draws all eight graph kinds for everyone; the drills for the other graphs (and the AD-AS
shift-or-movement drill) ask `ApMacroCore.locked` and show the Premium gate. The shift-or-movement drill on supply
and demand (topic `shifts-movements`, graph skills) is free. The owner should confirm.

## T2: Bank Reserves Lab and Policy Chain Builder (open, 2026-11-03)

Judgment calls in `macroeconomics/assets/tools/math/reserves-lab.js` and `policy-chain.js` for a person to confirm
against the CED (4.4-4.6, 5.1, 5.5, 6.6) before Unit 4 is reviewed:

- **Money market under ample reserves.** The lab draws the money market beside the reserve market and, when an
  administered rate changes, shifts the money supply so the nominal interest rate follows the policy rate (the
  quantity of money falls as lending slows). The sources read say only that the nominal rate follows the federal
  funds rate; they do not say how the money market is drawn in the ample framework. The drills never ask for the
  money market in an ample-reserves question (they key the reserve market, as the reader reports say).
- **The discount rate with ample reserves.** Treated as the ceiling of the range, set above IORB and moved with it;
  changed alone it does not move the policy rate. In the limited framework it shifts reserve supply (discount
  lending) and the money supply. Confirm the CED lists it this way.
- **The ON RRP rate.** Explore shows raising it lifting the flat part of reserve demand (the Fed moves it with
  IORB); the drills key only the IORB rate as the ample-reserves tool, so no item turns on the ON RRP rate alone.
  Ties to `reserve-graph` (one flat part drawn, not two bounds).
- **Reserve requirement, limited reserves.** Shown as reserve demand shifting (vertical step of the steep part)
  and the money supply shifting; the multiplier drill uses 1 / ratio on a bank's new excess reserves (the Fed
  buys bonds from a bank, so all of it is excess). Ratios 0.10, 0.20, 0.25.
- **Limited reserves on the reserve market.** Drawn with reserve supply on the steep part of reserve demand
  (`start: { RS: -5 }`, outside the item checker's -2 to 2 for authored items, Explore only).
- **Chains.** Fiscal (spending: policy, AD, outcome; taxes add disposable income and consumption), monetary
  (ample: IORB, policy rate, other rates, investment, AD, outcome; limited: bonds, money supply, nominal rate,
  ...), open economy (relative real rates, capital flows, demand for the dollar, appreciation, net exports, AD),
  crowding out (deficit, demand for loanable funds, real rate, investment, capital and growth), self-adjustment
  (gap, wages and input prices, SRAS, back to full employment). Confirm the link granularity readers expect
  (for example whether "other interest rates" is a separate link from the policy rate).

## T4: AD-AS Lab and Foreign Exchange Lab (open, 2026-11-03)

Judgment calls in `macroeconomics/assets/tools/math/adas-lab.js` and `forex-lab.js` for a person to confirm
against the CED (3.6, 3.7, 5.2, 6.2-6.6) before Units 3, 5 and 6 are reviewed:

- **t4-phillips-map: the AD-AS to Phillips link.** Each AD-AS point maps to one Phillips point: unemployment
  falls as real GDP rises past Y<sub>F</sub>, inflation is drawn at the price-level height, and SRPC shifts
  opposite to SRAS. So an AD shock moves along SRPC, a supply shock shifts SRPC (stagflation), and self-adjustment
  shifts SRPC back to LRPC: after an AD rise the economy ends on LRPC at higher inflation (expected inflation
  rose), after a one-time supply shock at the starting inflation rate. Confirm readers score the long run this
  way (the drill's last step turns on it). As `t1-phillips-shock`, a supply shock is drilled as SRPC shifting, with
  no E2 step.
- **t4-shock-list: the causes and their curves.** AD: confidence, wealth, government purchases, personal income
  taxes, incomes abroad (exports), business expectations, interest rates (investment). SRAS: oil and energy prices,
  nominal wages, a drought, expected inflation, input prices, a per-unit subsidy. Technology and productivity are
  left out (they move LRAS too, `t1-lras-drill`).
- **t4-one-curve-forex: one keyed curve per change.** (Partly resolved 2026-11-03: the "Interest rates and capital
  flows" drill now says only "the real interest rate in X rises relative to Y" and accepts either side through
  `key.alt`; the "shift" kind keeps naming the actor because its mirror-market step follows the curve drawn.) As `f-one-curve-keys`: a price-level or real-interest-rate
  change can shift both demand and supply of a currency; every scenario names the actor ("Mexicans buy fewer of
  the now pricier American goods", "European investors buy more American bonds") so one curve is the answer, and
  the slip line names the other side's buyers. A grader `key.alt` would let prompts say only "the real interest
  rate rises".
- **t4-real-currencies: real countries and currencies in the drills.** (Resolved 2026-11-03 by the rule in
  `f-invented-countries`: the drills now use invented countries and currencies, `DRILL_CUR` and `DRILL_PAIRS` in the
  model, with the same price ranges; Explore keeps the real pairs, labeled illustrative.) The drills use the dollar, euro, peso,
  pound and rupee with their economies (Author F's items use invented countries). Prices of a currency come from
  short lists near recent values (for example 1.00 to 1.25 dollars per euro, 16 to 25 pesos per dollar), so the
  inverse and conversion steps are realistic; Explore's rates are illustrative and labeled so.
- **t4-flows-wording: a lower real interest rate.** The capital-flow step keys "less flows into" the country (a
  net outflow) when its real interest rate falls and foreign investors buy fewer of its bonds; confirm the wording
  readers accept ("financial capital flows out").
- **t4-skills: practice codes on drill steps.** Graph shifts 4.C, axis labels 4.A, outcomes 3.A, explanations of
  an effect 2.B or 3.B, calculations 2.B, definitions 1.A. Check against the CED skill list.

## T3: Multiplier Lab, Economic Indicators Lab, PPC and Trade Trainer (open, 2026-11-03)

### t3-ppc-straight: straight-line PPCs are drawn as data (resolved, 2026-11-03)

Resolved by the integrator: the straight PPC exists (`a-ppc-straight`). The trade view stays on `ApMacroPlot`:
it draws both countries' lines, before and after trade, on one figure, and `ApMacroGraph` draws one PPC per graph,
so moving it would split the figure in two and lose the comparison; nothing on it is graded. The original note:

Related to `a-ppc-straight`. `ApMacroGraph`'s `ppc` kind is bowed only, so the PPC and Trade Trainer draws the
bowed PPC (shapes, shifts, inside/on/outside, increasing cost) with `ApMacroGraph` and the two countries'
constant-cost PPCs in the trade view and the output and terms drills with `ApMacroPlot` (a data figure from the
countries' outputs, nothing graded on it). If T1 or the lead adds a straight `ppc` shape, the trade view can move
to it.

### t3-gap-model: closing a gap uses the simple multiplier (open, 2026-11-03)

As the exam does, the change in real GDP is change × multiplier with a constant price level ("the largest
change"), and the policy change is gap ÷ multiplier. The Close a gap view draws AD moving toward LRAS by the share
of the gap the student's policy closes (the gap closes exactly at gap ÷ multiplier); with an upward SRAS the real
effect would be a little smaller, which the Why sheet says. Confirm the wording "largest change" matches how
readers credit it.

### t3-balanced-budget: equal rises in purchases and taxes (open, 2026-11-03)

Related to `balanced-budget`. One drill step asks the effect of purchases and taxes both rising by X and keys
"real GDP rises by X", reasoned as the two multiplier effects added (X × 1/MPS minus X × MPC/MPS), never as a
separate formula; the Multiplier view has the same case. Drop both if the CED leaves it out.

### t3-money-cases: the four money creation cases (open, 2026-11-03)

Limited-reserves model, labeled every time, with the ample-reserves contrast in each worked solution: a cash
deposit changes excess reserves by (1 − rr)X and the money supply by at most (1 − rr)X / rr (the deposit itself is
not new money); the Fed buying bonds from a bank: X / rr; from the public (sellers deposit the payment): X of new
deposits plus (1 − rr)X / rr of loans = X / rr; selling bonds to a bank: −X / rr. Confirm the public case is
scored as X / rr on current scoring guidelines (some sources ask only for the loans).

### t3-indicators: counting and classifying (open, 2026-11-03)

GDP: a newly built house is investment, unsold output is inventory investment, a foreign tourist's hotel stay is an
export, transfers, financial assets, used and intermediate goods, unpaid household work and a US-owned factory
abroad are left out; an import is shown in Explore as counted in C or I and subtracted as M (the count drill leaves
imports out, since "where does it go" has two answers). Unemployment: a new graduate searching is frictional,
discouraged workers are out of the labor force; seasonal unemployment is not used. Check against the CED's 2.1-2.3.

### t3-graph-labels: label clashes in `ApMacroGraph.svg` (resolved, 2026-11-03)

Vertical-curve labels over their line, colliding old and new labels and the PPC label under a point: fixed in the
shared renderer by the lead; T3's local workarounds were removed and the graphs rechecked at 360 and 1280 px.
