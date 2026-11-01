# AP® Calculus BC: open points for a person

Questions and contested calls for the owner or a reviewer. Authors add here instead of guessing; each entry has
an id, the question, what was done meanwhile, and who decides. AB's open points stay in
`docs/apcalc-needs-author.md`.

## For the owner

- **identity** (Phase 0, decision 7, proposed). Accent violet, hue 270: light `--cink #5A1E96` on `--ctint #F1E7FA`
  (8.5:1; 10.2:1 on white, 9.7:1 on the page), dark `--cink #D6BFF5` (11.2:1 on the page, 9.8:1 on the tint).
  It sits between Organic Chemistry's indigo (249°) and Statistics' plum (298°), clear of the site teal and of
  Precalculus' forest green (`#11592F`, 145°), which ruled out the first proposal, emerald. Cover deep violet
  `#34104C` with lilac `#C88CFF` and gold `#FFD23F` (a function, a Taylor polynomial hugging it near its center,
  Σ). Icon: a sigma over a partial-sum curve. Headline "AP® Calculus BC, all the way to series."; hand line
  "every AB topic, then series". Ranks Sequence Starter, Curve Tracer, Polar Plotter, Series Tester, Taylor
  Builder, Convergence Prover, Calculus BC Legend. Close in hue to Psychology's old cover lilac and AB's crimson
  is a sibling, not a clash; confirm.
- **free-tier** (decision 6, proposed): Units 1 and 2, every "Math you need" lesson and 9.1-9.3; free trainer
  `series-lab`. Confirm or change (`PROFILES.bc.freeTopics`, `assets/premium.js` `apcalcbc`, `pages.json`).
- **ab-pass-upgrade**: does an AB pass holder get a discount on the BC pass? The shared pricing has no upgrade
  path today; nothing was built.
- **ab-pages-in-bc**: BC renders every AB topic's lesson and notes under `/calculus-bc/` from AB's files, so a
  BC student stays in one course (one progress store, review queue, dashboard, BC order and navigation). Those
  copies name the AB page as canonical (one copy indexed). The alternative, linking BC students out to the AB
  pages, splits their progress across two courses. Confirm the choice.
- **ab-trainers**: BC links AB's ten trainers on their AB pages rather than building them again, so answers
  there count in Calculus AB, not BC. Building them under `/calculus-bc/` would mean parameterizing the ten
  tool scripts the way the core runtime is now (Phase 2 work). Confirm.
- **launch-checklist** (filled at launch): apply `2026-10n-apcalcbc.sql`, create the Polar product "AP® Calculus
  BC Premium (through June 30, 2027)" $25, add `"cbc-2027"` to `POLAR_PRODUCTS` in the Worker settings, remove
  `onSale: false`, set the registry status, merge.

## For the course (Phase 1 and later)

- **partial-fractions-scope**: "linear partial fractions" read as distinct linear factors only (framework.md
  section 10 item 7: our reading of "linear, nonrepeating", not an exclusion statement). Items use two or three
  distinct linear factors.
- **logistic-solving**: the CED asks for interpretation, not an explicit solution; items do not ask students to
  solve dy/dt = ky(a - y).
- **mcq-mix**: the share of BC-only versus AB-content questions on the 2027 MCQ is not published (about 60% of
  the exam is AB content). Practice exams use the BC unit weights only (`unitRange`).
- **justify-counts** (Phase 3): AB's trainer holds 3-5 prompts per unit and 32+ in all; BC's counts (Units 9
  and 10 and the BC topics of 6-8) are set in Phase 3. The content check skips AB's counts for BC.
- **frq-grader**: the AI FRQ grader is not wired for BC (`docs/frq-grader.md`); decide at launch.
- **ab-score-calculator**: BC has no score calculator and no readiness band (owner 2026-10-14, 2026-10-26). AB
  still has its score calculator page live (`calculus/score-calculator.html`) and its band; left as is.
- **teacher-review**: the "not yet reviewed by an AP® Calculus BC teacher" note stays until a teacher reviews
  the course.
- **2026-statistics**: 2026 BC FRQ means, CR report and AB subscore distribution were not posted on 2026-10-31
  (framework.md section 10); refresh before quoting them.

## From the Phase 1 self-reports (merged 2026-10-31, integration pass)

Ids keep the author letter and number from `docs/apcalcbc-reviews/self-<a-d>.md`. Duplicates merged: A1 and B1's
meta descriptions sit with the integration fixes under "Resolved"; C4 (absolute words) is resolved there too.

- **a3-split-integral** (map): AB's map teaches the concept `split-integral` at 8.6, though splitting an integral
  at a point is 6.6's additivity; 6.13 avoids the phrase. Consider moving the concept to `integral-properties`
  (an AB map change: AB's map check and build must stay clean). Reviewer.
- **a4-euler-multistep** (accuracy): concavity alone does not always fix the sign of a multi-step Euler error (it
  also depends on how the slope changes with y). The one multi-step item (`cbc-eulers-method-3`, dy/dx = x + y)
  holds because every solution curve in the region is concave up and the slope increases with y; the FRQ asks only
  about the first step. Phase 3 exam items and reviewers: keep that care.
- **a5-logistic-scope**: items interpret only; the fish table and figure come from the closed-form solution, but no
  item or note asks for or shows it. Matches `logistic-solving` above; confirm.
- **a6-figure-text-size** (site-wide): single-panel figures are 760 px wide with 13-15 px labels (as AB's), small
  on a phone; two-panel ones were stacked. A site-wide rule on figure text size would help both courses. Owner.
- **b2-both-rates-zero** (9.1 scope): the notes say the slope test does not apply when dx/dt = dy/dt = 0 and stop
  (no limit of dy/dx taught); no item depends on it. Reviewer to confirm the scope.
- **b3-frq-sign-chart** (`frq-u9-motion-tangent` (b)): the point for the interval with a reason is given only for a
  reason based on dy/dt (2024 report). Confirm that a sign chart of dy/dt with a sentence earns it (AB's rule: a
  sign chart alone does not). Reviewer.
- **b4-two-particles**: the CED Unit 9 note asks for care with subscripts when two particles appear; there is one
  collision item (9.6 item 15). A two-particle FRQ part could be added in Phase 3 if the exams need one.
- **c1-polar-frq-slot**: the polar FRQ `frq-u9-polar-area` is type `parametric` (the Q2 slot), per the brief; its
  part (b) uses a candidates test (a global argument). Reviewer.
- **c2-basel**: Σ1/n² = π²/6 is stated as a known fact, not derived; one p-series item gives it in the stem.
- **c3-alternating-harmonic**: the alternating harmonic series is stated to converge (to ln 2) in 10.5 as a
  reference series (EK LIM-7.A.7), with the proof deferred to 10.7. Reviewer.
- **d1-rearrangement**: 10.9 notes mention Riemann's rearrangement theorem in a `going-further` aside only; items
  test only LIM-7.A.14 (absolutely convergent series keep their sum).
- **d2-taylor-equals-f** (accuracy): 10.14 notes say that for "the functions in this course" the Taylor series
  equals the function on its interval. True for the four memorized series and those derived from them, not for
  every function. A teacher may want a sentence on that. Reviewer.
- **d3-frq-general-term**: `frq-u10-taylor-error` gives the general term of the Taylor series in the stem, since
  part (d) needs it. Confirm it matches the Q6 style. Reviewer.
- **d4-small-values-items**: error bounds below about 0.005 are single-answer items, not numeric ones. With the
  guard below (`small-values`) a numeric item could now take such a key on BC; the content check's own
  three-decimal test (`check-apcalc-content.mjs`, numeric mistakes) does not know the guard yet, so keep tiny keys
  out of numeric items until it does.
- **figure-accent** (new, integration pass): 39 of BC's 41 figures use emerald `#0A5A34`, the accent proposed
  first and dropped for violet (decision 7). Once the owner confirms the identity, change `EMERALD` in
  `scripts/apcalcbc-figures/author-{a,b,c,d}.mjs` and rerun them (the 6.14 flowchart already uses violet).

## Resolved

- **ab-text-on-bc** (Phase 1, author A; resolved 2026-10-31). AB's 6.10 and 6.14 notes and the 6.14 lesson carry
  `calc-ab-only`/`cbc-only` spans; `courseOnly` unwraps the current course's spans (and drops the marker class
  from a kept `<li>`/`<tr>`), so AB's build is byte-identical and BC's pages read the BC wording (checked on
  both builds: no course-only class or AB-only sentence left on BC, no BC sentence on AB).
- **a1-next-link** (6.10's "Next" to 6.14; resolved). The generator's BC path adds the real next topic as "Next: ..."
  in front of an authored Next that BC's order relabels "Later: ..." (`lessonConnections` in
  `build-apcalc.mjs`): 6.10 now says Next 6.11, Later 6.14; 8.13 says Next "Parametric Equations and Vectors",
  Later 9.1. Every BC lesson's Connections, "What comes next" and notes pager agree (scan of a full BC build).
- **a2-flowchart** (resolved). BC has its own `integration-flowchart` (six questions, the two BC ones in violet,
  tagged "BC"): `scripts/apcalcbc-figures/integration-flowchart.mjs` → `calculus-bc/figures/`, registered in
  `calculus-bc/data/figures/choosing-integration-methods.json` (BC's figures win on a clash; AB's figure and pages
  unchanged). BC captions in the 6.14 notes and lesson name the six questions. The content check now also checks
  BC figure files that belong to no BC topic.
- **b1-meta-descriptions** (resolved). `calculus-bc/data/descriptions.json` has hand-written lesson and notes
  descriptions for all 30 BC topics and the 3 BC math topics (author B's wording for Unit 9), the BC 6.14 notes
  (its BC opening is too long to be one), units 9 and 10, and shorter `<title>` names for 8 topics that were cut.
- **c4-absolute-words** (resolved). The bank-wide absolute-word rule is clean: 0 of 786 distractors in BC's bank
  (and of the AB + BC bank together) carry an absolute word; nothing needed changing by the time of this pass.
- **small-values** (D's choice; resolved for BC). The three-decimal rule accepted 0 or a wrong tiny value when the
  key is below about 0.005. `calc-questions.js` now, with `ApCalcCourse.smallValues` (BC pages only), also
  requires three significant digits there and says so; AB is unchanged, and its same weakness is logged in
  `docs/apcalc-needs-author.md` (`small-values`). Test in `apcalcbc-questions.test.mjs`. The calculus shell budget
  went 69.5 → 69.7 KB for it (`check-weight.mjs`).
- **order-and-links** (checked). BC's unit pages, course home and curriculum (dashboard) list the 121 topics in the
  merged map's order (BC topics between AB's in CED order); no BC page links an AB lesson, notes or unit page
  (only canonicals, AB's trainers by decision `ab-trainers`, AB's runtime and figures).

## Phase 3

- **p3-exam-sets** (reviewer). BC's practice exams have fewer and shorter stimulus sets than AB's (6 and 8 sets of
  2-4; 17 and 21 of 42 questions in sets; AB's test wants 6+ sets of 3-5 and half the questions). Most BC bank
  sets mix single-answer items with numeric, `expr` or interval items, and the s1 sets are lesson checks, so few
  whole single-answer sets are left. More sets would need exam-only no-calculator sets; say if worth it.
- **p3-part-b** (reviewer). Part B is all exam-only calculator items, as AB. Each form has 4 Unit 9 calculator
  items (one set) and 1 Unit 10 item (a Taylor value; a series integrated term by term); the real exam's
  calculator mix by unit is not published. Check the balance.
- **p3-logistic-solution** (reviewer). `cbc-exam-2-08` gives the logistic solution formula and asks when growth is
  fastest (P = L/2, then solve). The guide says logistic models are interpreted, not solved; giving the solution
  keeps it in scope, but confirm.
- **p3-free-prompts** (owner). The first three prompts in course order are free, so BC's free prompts are AB's
  Unit 1 ones. A BC visitor might be better served by one BC prompt free (say `u10-interval-endpoints`); that
  needs a per-course rule in `FREE_JUSTIFY`.
- **p3-spare-frqs** (author). Spares: `frq-u9-motion-tangent`, `frq-u10-geometric-tests`. Both `techniques` FRQs
  are used, so there is no spare Q5; a third would let a future form vary.
- **p3-accuracy** (Phase 4). The 26 exam-only items, 11 prompts and the formula rows await the independent
  accuracy check; every key is recomputed by code but the distractor explanations are unreviewed.
