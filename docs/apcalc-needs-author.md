# AP® Calculus AB: open questions for a person

Things a person (the owner, or an AP® Calculus teacher) should decide or check. Add to this file instead
of guessing; mark an entry resolved with the date and move it to the end. At launch (2026-10-13) every open
question in `docs/apcalc-reviews/*.md` (the independent reviews and the authors' self-check reports) and
`docs/tools-phone-pass/calc-*.md` was consolidated here, deduplicated, with the answered ones under Resolved.

## ced-exclusions: verify the Units 3-8 boundary statements (open, 2026-10-13)

The research could read the CED's Units 1-2 learning objectives and exclusion statements but not Units
3-8 (`docs/apcalc-research/framework.md`, access note). `docs/apcalc-ced-map.json` has their topics from
secondary sources. A person with the CED PDF should check every Unit 3-8 objective and any exclusion
statement, and update the ced map and `docs/apcalc-authoring-guide.md` ("Scope").

Every review hit the same wall (the CED PDF is blocked by the proxy; WebFetch reads only through topic 2.2).
The scope calls that rest on it, each kept by its reviewer and waiting for the CED text:
- 3.4: arcsin, arccos and arctan taught; the other three inverse trig derivatives only "derivable" (u2-3, self-u3-4).
- 5.x: relative extrema defined on an open interval, so an endpoint is never a relative extremum (self-u5, u4-5).
- 6.2: trapezoid and midpoint over/under estimates from concavity (one item, `calc-riemann-sums-8`) (self-u6, u6).
- 6.10: completing the square with arctan forms only, no arcsin forms (self-u6, u6).
- 7.7: a particular solution's domain as the largest open interval containing x₀ on which it is defined and
  differentiable and the equation is defined (self-u7-8a, u7-8).
- 7.x: "solution curves do not cross" as the reason a solution stays off an equilibrium; FRQ
  `frq-u7-equilibrium-cosine` (b) also accepts the explicit-solution argument (self-u7-8a, u7-8).
- 8.8: isosceles right triangles with the hypotenuse in the base (area s²/4) beside the other cross sections (self-u8b).
- Rolle's theorem is named once (as the f(a) = f(b) case of the MVT) and accepted in one rubric line (self-u5).

## weight-ranges: unit weights differ between sources (open, 2026-10-13)

The map uses the current course page's ranges (10-15, 10-15, 5-10, 10-15, 15-20, 15-20, 5-10, 10-15%).
Older CED copies, as summarized by third parties, give narrower ones (10-12, 10-12, 9-13, 10-15, 15-18,
17-20, 6-12, 10-15%; `docs/apcalc-research/framework.md` section 1). The practice exam form check
(`unitRange`) and the cram plan use the map's numbers. Check against the current CED.

## mcq-2027: how the 2027 exam scales 42 questions (open)

The May 2027 format (29 + 13 MCQ, 2 + 4 FRQ) is from College Board's announcement. How 42 multiple-choice
questions and 54 FRQ points combine into a composite is not published; the score calculator and the
practice exam assume 50/50.

## score-cutoffs: the score calculator's bands (estimated 2026-10-13, Phase 3)

The College Board publishes no raw-to-score conversion for the current exam (framework.md section 7), and
how the 42-question Section I will be scaled in 2027 is unknown. So the bands are **estimates**, **66 / 49 /
40 / 23** (composite out of 100 for a 5 / 4 / 3 / 2), in `calculus/assets/pages/score.js` and the readiness
band in `pages/exams.js` (a test keeps them equal); the calculator page says they are estimates, not official.

Method (the physics method, `docs/apphys-needs-author.md`; script kept out of the repo, rerun when 2026
statistics appear):
1. Composite = 50 × MCQ/42 + 50 × FRQ/54, as the exam weights the sections.
2. Free-response means and SDs from the scoring statistics: 2025 (ap25-calculus-ab-scoring-statistics.pdf)
   means 3.26, 4.06, 4.82, 3.91, 3.60, 4.12, SDs 2.58, 3.01, 2.83, 2.65, 2.39, 3.10 (44.0% of 54); 2024
   means 4.71, 4.24, 3.55, 3.86, 3.14, 3.59, SDs 2.69, 3.28, 2.72, 3.01, 2.80, 2.60 (42.8%). The section SD
   assumes the six questions correlate 0.5, 0.6 or 0.7.
3. Multiple choice has no published statistics: mean 48, 53 or 58%, SD 18, 21 or 24 points, correlation with
   the free-response section 0.7 or 0.8; the composite treated as normal.
4. Each cut is the composite at which the share at or above it matches a published distribution (2024: 21.4%
   fives, 49.2% 4+, 64.5% 3+, 87.1% 2+; 2025: 20.3, 49.2, 64.2, 87.0; 2026: 20, 48, 65, 89). Years before 2024
   are left out: the College Board changed how it sets the scores that year (4s jumped from 16% to 28%).
   The median over the 324 model choices is 66.0 / 48.9 / 40.1 / 22.9 (10th-90th percentile 63-69, 46-52,
   37-43, 19-27), rounded to 66/49/40/23.

Limits: a model of the distribution, not an equating; the 3 band is narrow (about 15% of students) and the
MCQ mean is the largest unknown, so the spread is about ±3-4 points, which the page states ("within about 5
points of a cut-off, treat it as either score"). Replace with released cut-offs if the College Board ever
publishes a scoring worksheet for the 2027 format.

## shell-method: confirm it is not tested (open)

The shell method is not a CED topic and is treated as out of scope; no exclusion statement was found to
confirm it. A teacher should confirm.

## tools-premium: which trainers are free (open, 2026-10-13)

`limit-explorer`, `tangent-tracer` and `rule-drills` are free; the other seven are Premium
(`calculus/data/pages.json`, spec section 6). Owner to confirm. The course home, the Premium page and the Premium dialog name all
three (launch).

## calculator: link to a free graphing calculator (open)

Calculator parts link to the free Desmos graphing calculator (a new tab; nothing embedded). On the exam,
students use the Desmos built into Bluebook or an approved handheld; web Desmos is not allowed there.
The notice says so. Check the policy for 2027, and whether a note for handheld users is wanted.

## teacher-review: an AP® Calculus teacher to review the course (open)

Every unit, the trainers and the exams had an independent accuracy check (Phase 4, `docs/apcalc-reviews/`). A
teacher review, above all of the justification language and the 9-point rubrics, is still wanted; the Beta note
("not yet reviewed by an AP® Calculus AB teacher") stays until then.

## form2-particle: Form 2 tests particle motion twice with a calculator (open, exams review)

Practice exam 2's Part B set (v = e^{sin t} − 1.2: turn, position, total distance) and its Section II Part A
`frq-u8-particle-calculator` (turns, position, total distance) test the same skill. Real exams sometimes do this,
but it overweights one skill. Option: swap that FRQ for a calculator FRQ of another type (changes spec decision 11).

## notes-reuse-items: notes worked examples print some items' answers (open, u2-3 review)

Several notes pages work the exact numbers of a bank item: `quotient-rule` WE3 (items 1, 4), `product-rule` WE3
(1), `basic-derivative-rules` WE3 (8), `chain-rule` "from a table" (1), `choosing-derivative-rules` WE3 (4),
`inverse-trig-derivatives` WE3 (5), `implicit-differentiation` WE2 (1-2), `higher-order-derivatives` WE3 (6-7),
`derivative-definition` WE1 (13), `differentiability` WE1-2 (6, 16). Fine for learning; if an exam form draws these
ids a student can look the answer up. Cheap fix: change the notes' numbers.

## small-content-calls: wording a teacher may prefer (open)

- `calc-inverse-trig-derivatives-16` explains "arcsin x + arccos x is constant" with "a function with derivative 0
  on an interval is constant" (an MVT consequence, 5.1, stated as a fact) (u2-3).
- Separation of variables gets 3-4 of the 9 points in the Unit 7 FRQs (released FRQs often give it 5), since the
  points are shared with the slope field, tangent line and concavity parts (self-u7-8a).
- `frq-u3-implicit-oval` (d) is related rates (4.4); an exam form should place it after Unit 4 (u2-3).
- `frq-u6-model-1` is the classic 8.3 rate-in/rate-out shape kept in Unit 6 (u6); an exam builder weighing units
  may count it as Unit 8.
- Unit 1a's authored keys are all first; options are shuffled for students, but an exam built with `fixed: true`
  should reorder them (u1).

## calculator-share: few calculator items in the bank (open)

Units 3-6 have few calculator items (Unit 6: 8 of 179); the practice exams' Part B uses exam-only items for
that reason (decision 11). Add numerical-integral and solve-for-T items if more calculator practice is wanted
(self-u3-4, self-u6, u6).

## grader-units: typed units the grader knows (open, self-u3-4)

`UNIT_WORDS` has no kilogram, mg, ticket or bacteria, and "°C" normalizes differently from "degrees Celsius";
authors list the common spellings in each item's `units`. Adding these words would make typed units more forgiving.

## varied-stems: some cross-topic items share a stem template (open, u7-8)

The "use a calculator to find the crossing" items (`calc-cross-sections-squares-6`, `-triangles-6`,
`calc-washer-method-axes-6`, `calc-washer-method-other-axes-6`, `calc-area-between-curves-x-6`) share a stem with
different functions; `calc-area-between-curves-y-15` repeats the region of `-x-10` on purpose (same area by
horizontal strips). The near-duplicate rule no longer flags them since launch (each $...$ span is one word and a
set item counts its stimulus title), but more varied stems would read better.

## checks-and-tooling: small checker and map improvements (open)

- A content-check rule for control characters in JSON strings (exams review; one slipped into
  `u4-lhospital-form-first`).
- The ordering pattern for `math-inverse-functions` notation `[fgh]^{-1}` also matches $h^{-1/3}$; it could
  require the exponent to be exactly −1 (self-u2).

## tool-polish: trainer ideas left for a person (open)

- The first-run "Write your answer here" / hint tooltip (shared tool-studio) covers the end of the prompt or the
  dock on phones until dismissed (exams, tools-b, phone pass calc-b). Seen the same on AP® Physics 1.
- `limit-explorer` formula-only drill kinds leave a large empty stage on phones; a small picture per kind (tools-a).
- `accumulation`: the drill's tank at t = 0 only repeats A(0) (tools-c).
- `area-volume`: the Explore solid's default yaw (−0.75) shows a disc solid mostly end-on; about −0.4 would show
  its shape better (tools-c).
- `related-rates` scenes keep a fixed 420×290 shape, so portrait phones show space above and below; Enlarge gives
  the full screen (phone pass calc-b).
- `ApCalcPlot` uses 11 px tick labels; each tool overrides it on phones in its own CSS. One shared rule in
  `calc-tools.css` would cover every tool (tools-c).
- `frq-u4-implicit-cubic`'s inline figure: the lower branch stops at x ≈ 13.3 instead of the frame edge (u4-5).

## lesson-weight: lesson pages are heavy (open, launch)

Lessons carry their text and their check questions (in the page data) as MathML: median 15.9 KB gzipped,
`squeeze-theorem` 41.7 KB (its graph stimulus is in both the page and the page data). The budget checks only the
first lesson (22 KB). Loading check questions from the bank, or not repeating the stimulus SVG in the page data,
would roughly halve the heavy ones.

## Resolved

All 2026-10-13, answered by the independent reviewers or fixed; kept here so nobody asks again.

- Composition limit law said "continuous" before 1.10: fine, glossed in words (self-math-u1a 1, u1).
- Unbounded behavior in words before 1.14 ("does not exist; grows without bound"): right (self-math-u1a 2, u1).
- Skill topics without stimulus sets; late inverse-function and geometry pages in the free math chapter: fine (u1).
- $\cos x \le \frac{\sin x}{x} \le 1$ stated without proof; degree-mode π/180 remark; one-sided asymptote of ln x;
  oscillating discontinuity mentioned: all kept (self-u1b, u1).
- "Degrees per minute" accepted for a Celsius rate; $\frac{d}{dx}x^2 = 2x$ in 2.4 from the 2.2 derivation: fine (self-u2, u2-3).
- FRQ rubric `accept` lines were escaped: `frq-kit.js` renders them (`richText`) (self-u2 3, self-u7-8a 1, u7-8).
- `check-apcalc-content --topic` hung while tool validators were in progress; FRQ figure stimuli failed with an
  empty figure registry: both fixed (`checkFrq` takes the registry) (self-u2 5, self-u3-4 1, u2-3).
- L'Hospital from a table ("twice-differentiable" in the stimulus); concavity reasons in 4.6: kept (self-u3-4, u4-5).
- Inflection at a corner of f′ ("f′ changes from increasing to decreasing"): correct (self-u5 2, u4-5).
- Glossary `ftc` states both parts: now labelled "Part 2 (topic 6.7)" (self-u6 4, u6).
- No-calculator FRQ 3(d) washers about x = −1: the prompt now gives x = 3 − √(9 − y) (self-u8b 1, u7-8).
- Dark-mode inversion of the shaded 3D solids: checked, fine (self-u8b 3, u7-8).
- `slope-fields` tool data named an unknown topic; two figure SVGs were not well-formed XML: fixed before launch
  (self-u7-8a 5, u2-3; the content check and an XML parse pass).
- The exam check reported "unknown question" for unpublished topics: gone once every unit was published (u7-8).
- Trainer captions split a question at a decimal point ("2.5 feet"): the `studioAsk` sentence split skips a "."
  before a digit, in calculus and AP® Physics 1 (tools-b, phone pass calc-b; fixed at launch).
- Near-duplicate false positives for items whose stems differ only in their math or region: rule fixed at launch
  (see varied-stems).
