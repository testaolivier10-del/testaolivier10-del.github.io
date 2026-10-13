# AP® Physics 1: open questions for a person

Open points and contested science for human review (`docs/apphys-spec.md`). Add an entry instead of
guessing; mark it resolved with the date and the answer.

Consolidated at launch (2026-10-13) from every review in `docs/apphys-reviews/` (unit reviews u1, u2,
u3-4, u5-6, u7-8, the author self-checks `self-unit-*`, `tools-a`, `tools-b`, `exams`), deduplicated.
Open entries first, then the resolved ones with where they were settled.

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

## equations-sheet: verify the sheet's equations (open, 2026-10-12; mostly checked)

The official sheet's text extraction gave only headers, conventions, units and prefixes; the equation list
came from a transcription. The exams review (2026-10-12) checked all 53 rows of the page (`EQ` in
`scripts/lib/apphys-entry.mjs`) and fixed three; what is left is `exam-geometry` below, which needs the
image PDF.

## scope-calls: judged in scope, check with ced-exclusions (open)

Reviewers judged each in scope; they stand or fall with the CED boundary text above, so check them in
the same pass:
- 1.4 / `reference-frames-9` tests a braking (non-inertial) frame; the frame is named and the item asks only
  why the accelerations differ (u1). Keep, or move to a going-further note for a strict reading.
- 2.x components of forces in equations beside an FBD (cords at 30°, ramps); the FBD itself keeps whole
  forces (self-unit-2, u2: in scope).
- 3.3 U_G = −Gm₁m₂/r in one item (`phys-potential-energy-12`) and one notes section (self-unit-3-4, u3-4: keep).
- 5.4 parallel-axis theorem in two items and a notes example (self-unit-5-6, u5-6: keep, it is on the sheet).
- 6.5 rolling while slipping: `rolling-s2` compares v_cm with Rω from a table, no skid model (u5-6: fits
  "qualitative").
- 6.6 orbits: E = −K and escape speed derived from E = 0 and F = ma_c, not memorized (u5-6: fine).
- 7.3 v_max = 2πA/T (`phys-shm-representations-15`) is given in the stem and derived in the notes (u7-8:
  keep; rewrite in place, not drop, if 7.3 should be graph reading only).

## exam-geometry: the cylinder surface area row (open, 2026-10-12)

The equations-sheet page's geometry row has S = 2πrℓ + 2πr² for a cylinder. The sheet has S as a cylinder
variable in the standard layout, but the reviewer could not open the image PDF to confirm it, nor the
exact work-energy line (exams review, open question 1). Check both rows against the official PDF.

## momentum-bars-frq: should a Unit 4 TBR ask for a momentum bar chart? (open)

Momentum bar charts are taught in notes and items, but no FRQ asks the student to draw one.
`drawSpec.kind: "bars"` with columns `p_A`, `p_B`, `p_total` could serve (self-unit-3-4, u3-4). Owner's call.

## numeric-tolerance: tolerance on two-figure keys (open, style)

Many two-figure keys accept a full unit in the last digit (11 ± 1 m/s, 1.0 ± 0.1 m/s), wider than the
authoring guide's "two units in the last digit of honest rounding" for small leading digits. No authored
slip falls inside any of them (u3-4). Tightening is a course-wide style decision.

## grader-bare-integer: "2" for a key of 2.3 (open, runtime policy)

A bare integer equal to the key rounded to one figure scores value right and sig figs wrong, instead of
matching an authored slip (u1). Runtime policy in `physics/assets/phys-questions.js`, not content.

## tools-polish: trainer layout ideas left for the owner (open)

From `tools-a` and `tools-b` (the rest of their open items were polished on 2026-10-13):
- Energy bar problems print "One unit = 6.13 J" while the bars use 6.125 J (graded to ±0.3 unit; the
  validator wants 3 figures). Harmless.
- `fluids-tank` has no in-SVG keyboard handle (the dock sliders cover it), unlike the other four
  scene tools.
- `torque-balance` at 360 px is now cropped and zoomed 1.75×; a zoom around the fulcrum would help more
  but changes the interaction.

## figure-sources: figure generators are not in the repo (open, minor)

Unit 1 figures came from scratch Python scripts (self-unit-1); the SVGs in `physics/figures/` and the
inline stimuli are the source of record, and `kick-components.svg` has a hand edit a regeneration would
undo (u1). Port to `scripts/apphys-figures/` only if figures will be regenerated. Likewise the unit
authors' item builders were scratch scripts: edit the JSON directly (ids are positional).

## Resolved

- **og-image** (2026-10-12): `physics/assets/og-image.png` rendered with
  `CHROMIUM_PATH=<chromium> ONLY=physics/assets/og-image.png node scripts/build-og-images.mjs`.
- **trailing-zeros** (2026-10-12): "20" counted as 1 figure marked a correct two-figure answer down
  (self-unit-1). Fixed: `sigRange` reads an ambiguous whole number as any count it can stand for.
- **round-number-leniency** (2026-10-12): typing 90 for 85 scored full value credit (u2). Fixed: the
  own-precision match reads an ambiguous whole number at its most precise (`gradeNumeric`).
- **formatKey exponent form** (2026-10-12): keys printed as "6.0e+4 J" (self-unit-3-4). Fixed in the runtime
  ("6.0 × 10^4 J").
- **collision-lab validator** (2026-10-12): failures seen mid-build (self-unit-3-4, self-unit-5-6); tools
  0 failing since.
- **worked examples repeating bank items** and **Unit 6 predict balance** (2026-10-12, u5-6 follow-up):
  every notes worked example renumbered in Units 3-7; "no change" 4 of 18.
- **exams-page parse error** and **syntax test** (2026-10-12, exams review): fixed;
  `scripts/test/apphys-syntax.test.mjs` parses every physics browser script.
- **spec decision 10 unit counts** (exams review): updated to both forms U1 5, U2 8, U3 8, U4 5, U5 5, U6 3,
  U7 3, U8 5.
- **TBR for Unit 1 as a motion diagram in a box**, **"frames at constant velocity" wording**, **Δt = 0.1 s
  with two-figure keys**, **Atwood in second-law**, **orbits in 2.9**, **apparent-weight model values**,
  **mixed-unit MR FRQ**, **pendulum restoring force depth**, **Bernoulli in words**, **exit pressure = P₀**,
  **g = 10 in FRQ rubrics** (u1, u2, u3-4, u7-8): judged right as authored; nothing to change.
- **scaling-drills picture**, **projectile-lab empty sky**, **motion-graphs bare landing**, **lab-design
  sparse drill bench**, **rotation-lab stray 28° label** (tools-a, tools-b): polished 2026-10-13.
- **shm items changed in place** (`phys-shm-period-1`, `phys-shm-representations-10`; u7-8): the exam forms
  were built and checked after the change (`EXAM_NUMBERS`, form tests pass).
- **"centre of mass" search alias** (launch): dropped; the site's spelling rule reads glossary aliases as
  visible text.
