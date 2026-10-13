# AP® Calculus AB: open questions for a person

Things a person (the owner, or an AP® Calculus teacher) should decide or check. Add to this file instead
of guessing; mark an entry resolved with the date and move it to the end.

## ced-exclusions: verify the Units 3-8 boundary statements (open, 2026-10-13)

The research could read the CED's Units 1-2 learning objectives and exclusion statements but not Units
3-8 (`docs/apcalc-research/framework.md`, access note). `docs/apcalc-ced-map.json` has their topics from
secondary sources. A person with the CED PDF should check every Unit 3-8 objective and any exclusion
statement, and update the ced map and `docs/apcalc-authoring-guide.md` ("Scope").

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
(`calculus/data/pages.json`, spec section 6). Owner to confirm.

## calculator: link to a free graphing calculator (open)

Calculator parts link to the free Desmos graphing calculator (a new tab; nothing embedded). On the exam,
students use the Desmos built into Bluebook or an approved handheld; web Desmos is not allowed there.
The notice says so. Check the policy for 2027, and whether a note for handheld users is wanted.

## teacher-review: an AP® Calculus teacher to review the course (open)

Every unit gets an independent accuracy check in Phase 4. A teacher review of the justification language
and the 9-point rubrics is still wanted before launch.

## Resolved

None yet.
