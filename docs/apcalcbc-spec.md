# AP® Calculus BC course: spec and status

The source of truth for LevlPrep's twelfth course. A fresh session reads this file, `CLAUDE.md`,
`docs/apcalcbc-research/framework.md` and `market.md`, and the AP® Calculus AB docs it builds on
(`docs/apcalc-spec.md`, `docs/apcalc-architecture.md`, `docs/apcalc-authoring-guide.md`), not the chat history.
When the plan changes, update this file in the same commit. Open points for a person go in
`docs/apcalcbc-needs-author.md`.

Course key `apcalcbc` (storage, analytics, registry, SQL). URL path `/calculus-bc/`. Pass `cbc-2027`. Every new
browser global starts with `ApCalcBC`; new question ids `cbc-`; CSS classes `cbc-` where a class must differ from
AB's `calc-`. Built **on** AP® Calculus AB as it stands on main (after the redesign, dashboards design F, video
lessons, quick answers, the AI FRQ grader hook and the tools upgrade), so every shared page type carries over.

## 1. Owner brief (2026-10-30), condensed

- Olivier asked to "plan out the next 2 courses and build them" and picked AP® Precalculus plus AP® Calculus BC
  (recommended: a full math path Precalc → Calc AB → Calc BC, BC reusing most of Calc AB, a fast, low-risk build).
- Build it the same way as the other courses: research, build everything, independent accuracy reviews, one PR the
  owner reviews before merging. Only stop him for what genuinely needs him (Polar, Worker setting, merge).
- Tools at the bar of the NREMT body map: interactive, visual where useful, professional illustration quality, simple
  on landing with detail revealed progressively, each tool full screen, easy to read on a phone.
- Every course feels the same (glossary, textbook with the plain/interactive toggle, practice, review with flagged
  questions only in Review, exams, flashcards tab, dashboard design F); own identity and cover art. **No score
  calculator, no readiness band, no Beta label** (owner 2026-10-14, 2026-10-26); the "not yet reviewed by an AP®
  Calculus BC teacher" note stays.
- Premium pass one-time through 30 June 2027 at the AP® price ($25), founding discount as the other passes.

## 2. What the research says (details and URLs in `docs/apcalcbc-research/`, done 2026-10-31)

**Content.** Unchanged for 2026-27. 111 BC topics: the 81 AB topics plus 30 BC-only: 6.11 integration by parts,
6.12 linear partial fractions, 6.13 improper integrals, the BC techniques inside 6.14, 7.5 Euler's method, 7.9
logistic models, 8.13 arc length, Unit 9 (9.1-9.9 parametric, vector-valued and polar), Unit 10 (10.1-10.15
sequences and series). Unit 10 assesses only the nth term, integral, comparison, limit comparison, alternating
series and ratio tests. BC MCQ weights: U1-U4 5-10% each, U5 10-15%, U6 15-20%, U7 5-10%, U8 5-10%, U9 10-15%,
U10 15-20%.

**Exam (Mon 10 May 2027, morning), the same new format as AB.** Section I: 42 MCQ in 100 min (Part A 29 without
calculator, 62 min; Part B 13 with a graphing calculator, 38 min), 50%. Section II: 6 FRQs of 9 points in 90 min
(Part A 2 with calculator, 30 min; Part B 4 without, 60 min), 50%. Q1, Q3 and Q4 are shared with AB; Q2 is
parametric/vector motion or polar, Q5 mixes BC techniques, Q6 is always series. An AB subscore is reported (about
60% of the exam is AB content). A student cannot take AB and BC in the same year.

**Scores.** 2025: 160,436 takers, 78.6% 3+, 44% fives. 2026: 82% 3+, 46% fives. AB subscore 2025: 88% 3+,
47.7% fives, so about half of BC students still drop points on AB content.

**Where students lose points.** Interval of convergence (endpoints untested, ratio test used at an endpoint, radius
given for interval); Lagrange and alternating series error bounds (wrong bound, conditions not shown); polar area
(r not squared, ½ dropped, wrong limits; the 2025 polar question averaged 3.09 of 9); parametric motion (speed as
|dy/dx|, initial condition subtracted, dt missing); Taylor polynomials (wrong center, derivative slips, a series
written for a polynomial). Full list in `framework.md`.

**Market.** UWorld (1,800+ BC questions), Fiveable $79/yr, Princeton Review book $27.99 (old format), free Khan and
Flipped Math. Series is the hardest unit by every account. Gap: drillable series reasoning (which test, endpoints,
error bound) with feedback, visual parametric and polar tools, BC FRQs in the 2027 format.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, formula page, unit practice tests.
Premium: unlimited practice, exams, every lesson, analytics, every trainer.

1. **Series trainer (flagship).** Pick the test, justify it, check both endpoints, state the interval; and a Taylor
   lab where the polynomial wraps the function as terms are added, with the Lagrange and alternating error bounds
   drawn as a band.
2. **Parametric, polar and vector, visible.** A particle traced by (x(t), y(t)) with velocity and speed live; polar
   curves drawn as θ sweeps, with the area being swept shaded and the ½∫r² setup built step by step.
3. **The whole AB course inside, one source.** Units 1-8 are the AB lessons, notes and banks (no copies), with BC's
   extra topics placed in CED order, so a fix lands once and both courses get it.
4. **Built for May 2027**: the 29/13 MCQ split, BC FRQs in the six exam slots (Q2 parametric/polar, Q5 techniques,
   Q6 series), 9-point rubrics, full-credit samples, two full timed practice exams.
5. **Justification on the reader-report misses**, now with the BC ones: endpoints, error bound conditions, ratio
   test limits, polar setup.

## 4. Continuity with the other courses

Same shared layer (`assets/`, Tool Studio, flagging, XP, tutor, dashboard, covers), item formats (`expr` items and
the three-decimal calculator rule), the "not yet reviewed" note, trademark rules. Every shared-layer fix goes into
the shared file. Calculus AB must not change behaviour: its checks and tests stay green on this branch.

## 5. Build plan

One branch, `claude/apcalcbc`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/apcalcbc-research/framework.md`, `market.md`; this spec | **done 2026-10-31** |
| 0 | Course shell on the AB runtime: how BC reads AB's data (section 8 decision 1), BC map (111 topics + math chapter), dependency map, generator, runtime, checks, tests, fixture, registration hidden, tool scaffolding, architecture, authoring guide, briefs, needs-author | to do |
| 1 | Content: the 30 BC-only topics (lessons, notes, banks with stimulus sets, glossary, figures), BC FRQs (Q2/Q5/Q6 types), BC edits to 6.14 | to do |
| 2 | BC trainers (section 6) | to do |
| 3 | Two practice exams (BC unit mix, BC FRQ slots), unit tests for 9 and 10, justification prompts, formula page additions, cram kit | to do |
| 4 | Independent accuracy checks (Unit 6-8 BC topics, Unit 9, Unit 10, tools, exams) | to do |
| Launch | Publish, generators, continuity pass, "twelve courses" wording, full CI with browser checks, PR | to do |

## 6. Trainers (proposed)

The ten AB trainers are reused on BC pages (same files, linked from BC topics). New, each with Explore and Test
yourself (seeded drills, feedback naming the slip):

| Slug | Unit | What |
|---|---|---|
| `series-lab` | 10 | Flagship. Choose and justify a convergence test, partial sums plotted against the limit, interval of convergence with both endpoints checked |
| `taylor-lab` | 10 | Taylor and Maclaurin polynomials wrapping f as terms are added; center slider; Lagrange and alternating error bounds drawn as a band |
| `parametric-motion` | 9 | Particle traced by (x(t), y(t)) or a vector function; velocity and acceleration vectors, speed, distance by arc length, dy/dx and d²y/dx² |
| `polar-lab` | 9 | Polar curves drawn as θ sweeps; area swept shaded, area between curves, dy/dx in polar, r and dr/dθ sign readings |
| `integration-methods` | 6 | Parts (tabular too), partial fractions, improper integrals as limits, choosing the method |
| `euler-logistic` | 7 | Euler's method steps on a slope field, over/under from concavity; logistic growth with carrying capacity and the fastest-growth point |

Free (proposed, owner to confirm): AB's free trainers (`tangent-tracer`, `limit-explorer`, `rule-drills`) and
`series-lab`.

## 7. How answers are graded

All grading is code. Choice items exact; numbers with the three-decimal rule on calculator items, exact forms
otherwise; `expr` items by evaluation at seeded points (series terms and Taylor polynomials too); intervals of
convergence by a new interval answer type if Phase 0 needs one (endpoints and brackets graded separately, so the
slip is named). FRQs self-scored with one rubric line per point and full-credit samples.

## 8. Decisions log

1. (2026-10-31) **One source for AB content.** BC reads AB's authored topics from `calculus/data/` at build time and
   its own 30 topics from `calculus-bc/data/`; no AB file is copied. Phase 0 settles the mechanics (which runtime
   files are shared, storage keys `apcalcbc_*`, how a BC lesson links to AB notes) and records them in
   `docs/apcalcbc-architecture.md`. AB pages and behaviour stay unchanged.
2. (2026-10-31) **No "ap" in any served path.** Folder `/calculus-bc/`. Registry and storage key `apcalcbc`.
3. (2026-10-31) **Pass and price mirror the other AP® courses:** `cbc-2027`, $25 one-time, through 30 June 2027,
   registered `onSale: false` until the owner checklist.
4. (2026-10-31) **Sources:** College Board CED, exam pages, scoring guidelines and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted.
5. (2026-10-31) **Exam format as researched** (section 2). Default exam date Mon 2027-05-10.
6. (2026-10-31) **Free tier (proposed, owner to confirm):** Units 1 and 2 and the "Math you need" chapter as AB,
   plus 9.1-9.3 so a BC visitor tries BC material free.

## 9. Open items for the owner

- Confirm the free tier (decision 6) and free trainers (section 6).
- Whether an AB pass holder gets a discount on the BC pass (the shared pricing has no upgrade path today).
- Launch checklist (filled at launch): migration, Polar product, Worker `POLAR_PRODUCTS` line, `onSale`, merge.
