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
