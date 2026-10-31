# AP® Precalculus course: spec and status

The source of truth for LevlPrep's eleventh course. A fresh session reads this file, `CLAUDE.md`,
`docs/apprecalc-research/framework.md` and `market.md`, not the chat history. When the plan changes, update this
file in the same commit. Open points for a person go in `docs/apprecalc-needs-author.md`.

Course key `apprecalc` (storage, analytics, registry, SQL). URL path `/precalculus/`. Pass `pcalc-2027`. Every new
browser global starts with `ApPrecalc`; question ids `pcalc-`; CSS classes `pcalc-`; files `pcalc-*.js`. Template:
the AP® Calculus AB course as it stands on main (math rendered to MathML at build time, `expr` items graded by
evaluation, the three-decimal calculator rule, `ApCalcPlot`-style plots), carrying every newer shared page type
(light channel redesign, course covers, dashboards design F, video lessons, quick answers, "Make it specific"
prompts, the AI FRQ grader hook, the tools upgrade). Where AP® Psychology (the newest fork) has a shared page type
Calculus AB lacks, carry it over.

## 1. Owner brief (2026-10-30), condensed

- Olivier asked to "plan out the next 2 courses and build them" and picked AP® Precalculus plus AP® Calculus BC
  (recommended: Precalculus was the close runner-up to AP® Psychology, about 254,000 takers in 2025, and with BC
  makes a full math path Precalc → Calc AB → Calc BC; every answer can be checked by code, so low risk while
  courses are unreviewed).
- Build it the same way as the other courses: research, build everything, independent accuracy reviews, one PR the
  owner reviews before merging. Only stop him for what genuinely needs him (Polar, Worker setting, merge).
- Tools at the bar of the NREMT body map: interactive, visual where useful, professional illustration quality, simple
  on landing with detail revealed progressively, each tool full screen, easy to read on a phone.
- Every course feels the same (glossary, textbook with the plain/interactive toggle, practice, review with flagged
  questions only in Review, exams, flashcards tab, dashboard design F); own identity and cover art. **No score
  calculator, no readiness band, no Beta label**; the "not yet reviewed by an AP® Precalculus teacher" note stays.
- Premium pass one-time through 30 June 2027 at the AP® price ($25), founding discount as the other passes.

## 2. What the research says (details and URLs in `docs/apprecalc-research/`, done 2026-10-31)

**Content.** Unchanged for 2026-27 apart from about 40 reworded essential knowledge statements and one new
exclusion (open vs closed endpoints on increasing/decreasing intervals). 4 units, 58 topics: Unit 1 Polynomial and
Rational Functions (14), Unit 2 Exponential and Logarithmic Functions (15), Unit 3 Trigonometric and Polar
Functions (15) are on the exam (MCQ weights 30-40%, 25-40%, 30-35%); Unit 4 Functions Involving Parameters,
Vectors, and Matrices (14) is not assessed.

**Exam (Tue 11 May 2027, morning), new timing for 2027.** 2 h 55 min, hybrid digital (MCQ in Bluebook, FRQs shown
in Bluebook and handwritten). Section I: 42 MCQ, 62.5%: Part A 29 without calculator in 65 min, Part B 13 with a
graphing calculator in 40 min. Section II: 4 FRQs of 6 points, 37.5%: Part A (calculator, radian mode, 35 min) Q1
Function Concepts and Q2 Modeling a Non-Periodic Context; Part B (no calculator, 35 min) Q3 Modeling a Periodic
Context and Q4 Symbolic Manipulations. Decimals accurate to three places, no rounding partway. Required calculator
skills include regressions (linear through sinusoidal) and residual plots.

**Scores.** 2024: 184,394 takers, 75.6% 3+. 2025: 253,596 takers, 80.8% 3+. 2026: 82% 3+, 29% fives. FRQ means
(of 6), 2025: Q1 3.51, Q2 2.16, Q3 3.13, Q4 1.93 (Q4 weakest both years).

**Where students lose points.** Decimals not to three places or rounded midway; wrong limit notation; reasoning not
tied to the given function or values; Q2 not linking average rate of change to the secant and the estimate to
concavity, and domain-from-context reasoning (almost nobody earns it); Q4 inverse trig, rewriting to a single log
or single tangent, equations quadratic in eˣ, missed solutions; Q3 phase shift and b from the period. Full list in
`framework.md` section 7.

**Market.** UWorld has no AP® Precalculus product; Fiveable is the only competitor with a full exam in the 2027
format. Free: Khan Academy, AP Classroom videos. Gap: function modeling with feedback, rates of change and
concavity reasoning, the Q4 manipulations drilled step by step, calculator regression tasks.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, formula page, unit practice tests.
Premium: unlimited practice, exams, every lesson, analytics, every trainer.

1. **Function Lab (flagship).** Every function type the course teaches on one stage: drag the parameters, watch the
   graph, table, formula and words change together; transformations, end behaviour, asymptotes, zeros.
2. **Rates of change you can see.** Average rate of change as secant slopes over equal intervals, how they change
   (concavity), the reasoning the Q2 rubric asks for, graded.
3. **Q4 made drillable.** Rewriting to a single log or a single tangent, equations quadratic in eˣ, inverse trig
   with the right range: step by step, each step graded by evaluation.
4. **Modeling with real data.** Build linear, quadratic, exponential, logarithmic and sinusoidal models; regressions
   and residual plots the way the calculator part asks; the three-decimal rule enforced.
5. **Built for May 2027**: 29/13 MCQ split, the four FRQ types at 6 points with rubrics and full-credit samples,
   two full timed practice exams.
6. **In CED order, nothing used before it is taught**, with an "Algebra you need" chapter (the prerequisites the CED
   assumes) placed before the topic that first needs each skill. Unit 4 included as "beyond the exam" (not in
   exams or unit weights), because many classes teach it.

## 4. Continuity with the other courses

Built like AP® Calculus AB, so every shared page type matches. Same shared layer (`assets/`, Tool Studio, flagging,
XP, tutor, dashboard, covers), item formats, the "not yet reviewed" note, trademark rules. Every shared-layer fix
goes into the shared file, never a precalculus-only copy. Identity: own accent, icon, headline, cover art, ranks.

## 5. Build plan

One branch, `claude/apprecalc`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/apprecalc-research/framework.md`, `market.md`; this spec | **done 2026-10-31** |
| 0 | Fork Calculus AB: runtime `precalculus/assets/` (`pcalc-*`), generator, checks, tests, fixture, CED and dependency maps, registration hidden, tool scaffolding, architecture, authoring guide, briefs, needs-author | **done 2026-10-31** (section 5b) |
| 1 | Content: lessons, notes, banks (with stimulus sets), FRQs of all four types, glossary, figures | to do |
| 2 | Trainers (section 6) | to do |
| 3 | Two practice exams, unit tests, "Make it specific" prompts, formula page, cram kit | to do |
| 4 | Independent accuracy checks per unit, tools, exams | to do |
| Launch | Publish, generators, continuity pass, "eleven courses" wording, full CI with browser checks, PR | to do |

### 5a. Authors and builders (Phase 1 and 2)

Briefs in `docs/apprecalc-briefs/` (`content-common.md`, `tools-common.md`, `review-common.md` and one file per
author or builder, generated from the map). Topics in course order; FRQ themes from the map's `frqThemes`.

| Author | Topics | FRQs |
|---|---|---|
| A | 1.1-1.10 and `alg-functions`, `alg-intervals`, `alg-lines`, `alg-quadratics`, `alg-polynomial-algebra`, `alg-complex-numbers`, `alg-rational-expressions` (17) | q1-rational-graph, q2-cubic-volume (2) |
| B | 1.11-1.14, 2.1-2.6, `alg-systems`, `alg-exponents` (12) | q2-quadratic-attendance, q2-exponential-depreciation, q1-exponential-justify, q2-cooling-residuals (4) |
| C | 2.7-2.15 (9) | q1-table-composition-inverse, q1-log-function, q2-logarithmic-sales, q4-exp-log-equations, q4-quadratic-in-ex (5) |
| D | 3.1-3.7, `alg-right-triangle`, `alg-circles` (9) | q3-ferris-wheel, q3-tide, q3-spring, q3-waterwheel (4) |
| E | 3.8-3.15 (8) | q1-trig-composition, q4-trig-equation-interval, q4-single-tangent, q4-single-sine (4) |
| F | 4.1-4.14, beyond the exam (14) | none |

19 FRQs: 5 Q1, 6 Q2, 4 Q3, 4 Q4 (two exams need two of each). Builders: T1 `function-lab`, `rate-of-change`,
`regression-lab`; T2 `poly-rational`, `exp-log-lab`, `symbolic-steps`; T3 `unit-circle`, `sinusoid-builder`; T4
`polar-graphs`, `vectors-matrices`. Phase 3 (the lead): two exams, unit tests, "Make it specific" prompts, the
formula page, cram kit.

### 5b. Phase 0 as built (2026-10-31)

- Runtime `precalculus/assets/` forked from AP® Calculus AB in one rename pass, then changed as listed in
  `docs/apprecalc-architecture.md` ("Runtime differences"): domain-aware `expr` notes, exam config for May 2027
  (29/13 MCQ in 65/40 min; Q1+Q2 calculator and Q3+Q4 no calculator, 35 min each, 6 points), no score calculator,
  composite or band, the "Make it specific" builder from AP® Psychology, Unit 4 kept out of exams and cram plans.
- Map: `docs/apprecalc-ced-map.json`, `docs/apprecalc-dependency-map.json` (58 CED topics, 11 algebra topics, 124
  concepts, 13 with notation), explained in `docs/apprecalc-phase0.md`.
- Generator `scripts/build-apprecalc.mjs`, checks `check-apprecalc-map.mjs`, `check-apprecalc-content.mjs`
  (with the calculus-wording check), tests `scripts/test/apprecalc-*.test.mjs`, fixture
  `scripts/test/fixtures/apprecalc-data/` (every item format, one FRQ of each type).
- Ten trainer stubs (four files each), registered in `precalculus/data/pages.json`.
- Registration hidden, twinning every AB point (`docs/apprecalc-architecture.md`, "Registration"); SQL migration
  `scripts/sql/migrations/2026-10n-apprecalc.sql` written, not applied.
- Docs: architecture, authoring guide, phase0, needs-author, briefs.

## 6. Trainers (proposed)

Each has Explore and Test yourself (seeded drills, feedback naming the slip), as the other courses.

| Slug | Unit | What |
|---|---|---|
| `function-lab` | 1-3 | Flagship. Parameters, transformations and every representation linked (graph, table, formula, words) |
| `rate-of-change` | 1-2 | Average rates as secants over equal intervals, rate of change of the rate, concavity, the Q2 reasoning |
| `poly-rational` | 1 | Zeros and multiplicity, end behaviour, holes, vertical and horizontal asymptotes, sign charts |
| `exp-log-lab` | 2 | Exponential vs linear growth (ratios vs differences), logs as inverses, semi-log plots, log rules |
| `regression-lab` | 1-3 | Fit linear to sinusoidal models to data, residual plots, choosing a model, three-decimal answers |
| `unit-circle` | 3 | Radians, sine and cosine from the circle, tangent as slope, the graphs unrolling from the circle |
| `sinusoid-builder` | 3 | Periodic modeling: amplitude, period (b), phase shift, midline from data or context (Q3) |
| `symbolic-steps` | 2-3 | Q4 rewriting and solving step by step: logs, exponentials, trig identities and equations, inverse trig |
| `polar-graphs` | 3 | Polar coordinates and curves drawn as θ sweeps, rates of change of r |
| `vectors-matrices` | 4 | Parametric functions, vectors, matrices as linear transformations (beyond the exam) |

Free (proposed, owner to confirm): `function-lab`, `rate-of-change`, `unit-circle`.

## 7. How answers are graded

All grading is code. Choice items exact; numbers with the three-decimal rule on calculator items, exact forms
otherwise; `expr` items by evaluation at seeded points (domain-aware for logs and inverse trig); FRQs self-scored with
one rubric line per point and full-credit samples (the AI grader hook only when its eval passes).

## 8. Decisions log

1. (2026-10-31) **Fork AP® Calculus AB as it is on main**, keeping every newer shared page type; bring over any
   shared page type only AP® Psychology has.
2. (2026-10-31) **No "ap" in any served path.** Folder `/precalculus/`, files `pcalc-*.js`, ids `pcalc-`. Registry
   and storage key `apprecalc`.
3. (2026-10-31) **Pass and price mirror the other AP® courses:** `pcalc-2027`, $25 one-time, through 30 June 2027,
   registered `onSale: false` until the owner checklist.
4. (2026-10-31) **Sources:** College Board CED, exam pages, scoring guidelines and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted.
5. (2026-10-31) **Exam format as researched** (section 2). Default exam date Tue 2027-05-11. Exams draw only from
   Units 1-3.
6. (2026-10-31) **Free tier (proposed, owner to confirm):** Unit 1 and the "Algebra you need" chapter.
7. (2026-10-31) **Unit 4 built as "beyond the exam"**: lessons, notes and practice, never in exams, unit tests'
   weights or cram plans.
8. (2026-10-31) **Identity (proposed, owner to confirm):** forest green, hue 145°, apart from every other course's
   accent: light ink `#11592F` on tint `#E3F3E8` (7.3:1; 8.4:1 on white), dark ink `#ACE4BF` on
   `rgba(80,200,130,0.10)`; cover deep green `#0B4A33` with mint `#8AF0C0`. Icon: a unit circle with a radius and a
   sine wave. Headline "AP® Precalculus, every function in motion."; hand line "see every function move". Ranks:
   Function Explorer, Rate Reader, Asymptote Hunter, Log Unlocker, Circle Turner, Model Builder, Precalculus
   Legend. One place: `IDENTITY` in `scripts/lib/apprecalc-build.mjs` (with `assets/theme.css`, `hub-progress.js`).
9. (2026-10-31) **FRQ types** `concepts`, `modeling`, `periodic`, `symbolic` (Q1-Q4), 6 points each, the calculator
   flag fixed by type; a practice exam draws one of each in exam order. Unit 4 never has an FRQ.
10. (2026-10-31) **No score calculator, composite or readiness band** (owner brief): exam results show the two
   sections apart with their weights (62.5% and 37.5%); the dashboard has `band: false`.
11. (2026-10-31) **"Make it specific"** replaces AB's justification trainer: the prompt format of AB plus the
   part-by-part builder from AP® Psychology (`ApPrecalcQuestions.specific`). Skills: values, limits, rates,
   concavity, domain, model, invertible, periodic, symbolic, decimals. The checker refuses calculus wording, an
   invertibility answer without values and a rate answer without the secant.
12. (2026-10-31) **"Beyond the exam" as built:** Unit 4's chapter has `beyondExam: true` and weight `[0, 0]`; the
   generator adds one line ("Beyond the exam. The AP® Precalculus exam does not test this unit. Many classes teach
   it, and it prepares you for calculus.") to its unit page, lessons, notes and sheet; the curriculum marks it
   `beyond: true` so exams, unit tests, mixed sets and cram plans skip it; checks refuse Unit 4 FRQs, exam items and
   a pasted copy of the line.
13. (2026-10-31) **Domain-aware `expr` grading:** sample points outside the key's domain are skipped; a point where
   the key is defined and the answer is not counts as different (so `2 ln x` is wrong for `ln(x^2)` on a two-sided
   domain, with a note); fewer than 8 defined points is refused.
14. (2026-10-31) **Calculus wording is refused** in authored text ("increasing at a decreasing rate", "derivative",
   "instantaneous rate"), except inside a `.pcalc-trap` callout that names the trap.

## 9. Open items for the owner

- Confirm the identity (decision 8), the free tier (decision 6) and free trainers (section 6).
- The rest is in `docs/apprecalc-needs-author.md` ("Owner decisions": site weight, og image, AI grader).
- Launch checklist (filled at launch): migration, Polar product, Worker `POLAR_PRODUCTS` line, `onSale`, merge.
