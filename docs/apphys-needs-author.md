# AP® Physics 1: open questions for a person

Open points and contested science for human review (`docs/apphys-spec.md`). Add an entry instead of
guessing; mark it resolved with the date and the answer.

## ced-exclusions: verify the Units 3-8 boundary statements (open, 2026-10-12)

The CED's boundary (exclusion) statements for Units 1-2 were read in the CED itself. The PDF
extraction stopped at the Unit 3 opener (`docs/apphys-research/framework.md`, access note), so the
Units 3-8 boundaries come from a per-topic transcription (physicslearn.org) and need checking
against the CED PDF (https://apcentral.collegeboard.org/media/pdf/ap-physics-1-course-and-exam-description.pdf):

- 3.2 / 3.4: only mechanical energy analyzed; thermal energy and sound qualitative only.
- 4.2: no quantitative analysis of variable-mass systems.
- 4.3: no simultaneous equations; 1D quantitative, 2D semiquantitative only.

Partial evidence for Unit 3 (reviewer, 2026-10-12, `docs/apphys-reviews/u3-4.md`): the CED PDF still could not be
read past the Unit 3 opener (proxy refused the download; the web fetch truncates at 2.6). U_G = −Gm₁m₂/r is on the
2025 equations sheet and two review sites file it under 3.3, so it stays in 3.3 (one item, `phys-potential-energy-12`,
plus a notes section). Nothing in the Unit 3-4 banks depends on an unverified boundary being looser than listed.
- 5.1 / 5.2 / 5.3: rotation described as clockwise or counterclockwise; torque vector direction out.
- 5.4: I computed for at most five objects; I of extended bodies given, not memorized.
- 5.5: no rotation in multiple planes.
- 6.3: direction of angular momentum and angular impulse out.
- 6.5: rolling friction out; rolling while slipping qualitative only.
- 8.4: fluids ideal and pipes full unless stated.
- Any other Unit 3-8 boundary the CED prints that is not listed here.

Until resolved, authors treat every item above as excluded (`docs/apphys-authoring-guide.md`,
"Scope"). Where: `docs/apphys-ced-map.json` (`exclusions` per topic with `source`,
`exclusionsSummary.unverifiedUnits3to8`).

## unit7-names: Unit 7 topic names (open, 2026-10-12)

The official Course at a Glance extraction did not show Unit 7's topic names. The map uses 7.1
Defining Simple Harmonic Motion, 7.2 Frequency and Period of SHM, 7.3 Representing and Analyzing
SHM, 7.4 Energy of Simple Harmonic Oscillators (physicslearn and Fiveable agree). Our titles are
our own words, but the CED numbers and scope per topic need a check against the CED
(`docs/apphys-ced-map.json` marks Unit 7 `namesUnverified`). Physics C's 7.5 (pendulums) is not in
Physics 1.

## ced-practices: science practice weights (open, 2026-10-12)

The skill ids 1.A-1.C, 2.A-2.D, 3.A-3.C were read in the CED. The MCQ and FRQ weight ranges per
practice (MCQ: practice 2 55-75%, practice 3 25-35%, practice 1 not in MCQ; FRQ 20-35 / 30-40 /
35-45%) come from a third-party copy and are unverified. The content check enforces "practice 1 is
free response only" on that basis; if the CED tests Creating Representations in MCQ, relax the rule
in `scripts/check-apphys-content.mjs` (checkItem) and `scripts/lib/apphys-exams.mjs` (checkForms).

## g-policy: which g, and when both are right (open, 2026-10-12)

The equations sheet prints g = 9.8 m/s²; the CED says the course uses 10 m/s² and does not penalize
9.8 or 9.81. Phase 0 policy (`docs/apphys-authoring-guide.md`, "Units, g and significant
figures"): every item either states g in the stem, or carries `numeric.gAlt` (the key worked with
the other value) so both are graded right; worked examples use 9.8. The grader names a 9.8/10 slip
when the item stated g. Owner to confirm 9.8 as the default (vs 10, which makes mental arithmetic
easier and is what the CED calls the course value).

## score-cutoffs: the score calculator's bands (estimated 2026-10-12, Phase 3)

The College Board publishes no raw-to-score conversion for the redesigned exam, and no scoring
worksheet with cut-offs has been released for any Physics 1 form we could find (third-party
calculators use unsourced tables: test-ninjas 56/43/32/20 of 80, num8ers 70/54/40/25 of 100).
So the bands are **estimates**, now **70 / 55 / 41 / 31** (composite out of 100 for a 5 / 4 / 3 / 2),
in `physics/assets/pages/score.js` and the readiness band in `pages/exams.js` (a test keeps them
equal); the calculator page says they are estimates, not official.

Method (script kept out of the repo; rerun when 2026 statistics appear):
1. Composite = 50 × MCQ/42 + 50 × FRQ/40, as the exam weights the sections.
2. Free-response mean and spread from the 2025 scoring statistics (ap25-physics-1-scoring-statistics.pdf:
   means 4.74/10, 6.09/12, 4.93/10, 4.65/8, SDs 2.96, 3.69, 3.11, 2.84), so the FRQ section averages 51%;
   its SD assumes the four questions correlate 0.5-0.7.
3. Multiple choice has no published statistics: mean taken as 46-56% and SD 18-22 points, correlation
   with FRQ 0.7-0.8; composite treated as normal.
4. Each cut is the composite at which the share at or above it matches the published distribution
   (2025: 19.8% fives, 44.5% 4+, 67.4% 3+, 80.8% 2+; 2026: 19%, 43%, 68%, 83%). The median over the 108
   model choices is 69.7 / 54.5 / 41.1 / 31.3 (ranges 65-74, 51-58, 38-45, 26-36), rounded to 70/55/41/31.

Limits: a model of the distribution, not an equating; the spread is about ±4 points, which the page
states ("within about 5 points of a cut-off, treat it as either score"). Replace with released
cut-offs if the College Board ever publishes a scoring worksheet for the current format.

## tools-premium: which trainers are free (open, 2026-10-12)

Decided 2026-10-12 (spec section 6): one trainer per unit made the AP® Chemistry rule (first trainer of
each unit free) give away nine of eleven, so only three are free: the flagship `free-body-diagrams`,
`motion-graphs` (Unit 1, the first one a student meets) and `scaling-drills` (skills). The other eight
carry `"premium": "tools"`. Owner to confirm; to change one, add or remove `"premium": "tools"` in
`physics/data/pages.json` and rebuild.

## teacher-review: an AP® Physics 1 teacher to review the course (open)

The Beta pill and "not yet been reviewed by an AP® Physics 1 teacher" stay on every page until a
teacher signs off (site rule `apphys-beta-and-report`).

## equations-sheet: verify the sheet's equations (open, 2026-10-12)

The official sheet's text extraction gave only headers, conventions, units and prefixes; the
equation list in the framework file is from a transcription. Phase 3 writes the equations-sheet page
(`EQ` in `scripts/lib/apphys-entry.mjs`); check each row against the official PDF then.

## og-image: render on a machine with Playwright (resolved, 2026-10-12)

`physics/assets/og-image.png` was rendered in Phase 0 with
`CHROMIUM_PATH=<chromium> ONLY=physics/assets/og-image.png node scripts/build-og-images.mjs`.
