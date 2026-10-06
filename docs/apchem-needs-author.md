# AP® Chemistry: open questions for a person

Open points and contested science for human review (`docs/apchem-spec.md`). Add an entry instead
of guessing; mark it resolved with the date and the answer.

## ced-exclusions: verify the Units 3-9 exclusion statements (open, 2026-10-06)

The CED's exclusion statements for Units 1-2 were read in the CED itself. For Units 3-9 the CED
text could not be extracted (`docs/apchem-research/framework.md`, section 4), so these come from
secondary sources and memory of the 2019 CED, and need checking against the current CED PDF
(https://apcentral.collegeboard.org/media/pdf/ap-chemistry-course-and-exam-description.pdf):

- 3.7: molality, percent by mass and percent by volume calculations not assessed; colligative
  properties not assessed.
- 8.11: calculations of solubility as a function of pH not assessed (qualitative only).
- 9.8: labeling electrodes as positive or negative not assessed.
- 9.10: the Nernst equation is on the sheet; the exam emphasizes qualitative reasoning (sign and
  direction from Q vs 1). Is any quantitative Nernst calculation assessed?
- Any other Unit 3-9 exclusion statement the CED has that is not listed here.

Until this is resolved, authors treat every item above as excluded (`docs/apchem-authoring-guide.md`,
"Scope"). Where: `docs/apchem-ced-map.json` (`exclusions`, `exclusionsSummary`).

## ced-practices: science practice weights and skill ids (open, 2026-10-06)

The MCQ and FRQ weight ranges per practice and the skill ids 1.A-6.G come from third-party copies
of the CED table. Check them against the CED (`docs/apchem-ced-map.json`, `sciencePractices`); the
content check accepts exactly the skill ids listed there.

## teacher-review: an AP® Chemistry teacher to review the course (open)

The Beta pill and "not yet been reviewed by an AP® Chemistry teacher" stay on every page until a
teacher signs off (site rule `apchem-beta-and-report`).

## tools-premium: which trainers are free (open)

AP® Biology frees one simulator and all skills tools (apbio decision 9). Proposed for AP®
Chemistry: the particle-diagram trainer free, the other trainers and drills Premium. Owner to
confirm before the first trainer ships.

## unit7-data: reference values used in Unit 7 items (open, 2026-10-06)

Unit 7 items quote approximate K and Ksp values at 25 °C (or "a certain temperature") as given data:
Kc for N2 + O2 ⇌ 2 NO ≈ 4.5 × 10⁻³¹ and H2 + Cl2 ⇌ 2 HCl ≈ 2.5 × 10³³; Kc(N2O4 ⇌ 2 NO2) = 4.6 × 10⁻³ at
298 K and about 10 at 450 K; Kc(H2 + I2 ⇌ 2 HI) = 50.0 at 450 °C; Ksp AgCl 1.8 × 10⁻¹⁰, AgBr 5.0 × 10⁻¹³,
Ag2CrO4 1.1 × 10⁻¹², CaF2 3.9 × 10⁻¹¹, PbCl2 1.7 × 10⁻⁵, BaSO4 1.1 × 10⁻¹⁰, Mg(OH)2 5.6 × 10⁻¹² (one
item instead gives a solubility of 1.1 × 10⁻⁴ M, which implies 5.3 × 10⁻¹²), Ca(OH)2 5.0 × 10⁻⁶,
SrF2 4.3 × 10⁻⁹. Literature values vary by source; every item states its value, so answers are
internally consistent. Several K values in setups (NOCl, PCl5, COCl2, CO + H2O at 1.56, the methanol
Kp of 2.5 × 10⁻³ at 500 K, the FeSCN²⁺ molar absorptivity) are invented for the problem and labeled
"at a certain temperature". Reviewer: confirm the literature-style values are acceptable as given
data, and that the cobalt chloride equilibrium is described correctly as endothermic in the forward
(blue) direction.

## unit7-small-x: the 5% rule (open, 2026-10-06)

Notes and items teach the common "5% rule" for the small-x approximation and use the quadratic formula
when it fails. The CED is understood to expect the approximation for small K; confirm the exam does not
require the quadratic formula (we teach it as the fallback and test it in two items only).
