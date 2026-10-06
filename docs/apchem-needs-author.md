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

## unit8-values: Unit 8 conventions to confirm (open, 2026-10-06)

Written for Unit 8 (`chem/data/*/` for topics 8.1-8.11); please confirm or correct:

- **pH significant figures.** Items grade pH and pKa with decimal places equal to the significant
  figures of the concentration or K (`places`), and ratios from 10^(pH − pKa) with significant
  figures equal to the exponent's decimal places. Some teachers accept one place more or less.
- **Ka/Kb values used** (25 °C, rounded to 2 significant figures): acetic acid 1.8 × 10⁻⁵, HF
  6.8 × 10⁻⁴, HNO₂ 4.0 × 10⁻⁴, HOCl 3.0 × 10⁻⁸, HOBr 2.0 × 10⁻⁹, HOI 2.3 × 10⁻¹¹, HClO₂
  1.1 × 10⁻², chloroacetic 1.4 × 10⁻³, dichloroacetic 5.5 × 10⁻², fluoroacetic 2.6 × 10⁻³,
  trifluoroacetic 0.59, formic 1.8 × 10⁻⁴, H₂PO₄⁻ 6.2 × 10⁻⁸, HCO₃⁻ 4.7 × 10⁻¹¹, HCN
  6.2 × 10⁻¹⁰, NH₃ Kb 1.8 × 10⁻⁵, CH₃NH₂ Kb 4.4 × 10⁻⁴, ethanol about 10⁻¹⁶. Literature values
  vary in the second figure; every item gives the value it uses. Kw at 0 °C (1.1 × 10⁻¹⁵) and
  50 °C (5.5 × 10⁻¹⁴) are rounded literature values.
- **Indicator pKa values** (methyl orange 3.5, bromocresol green 4.7, bromothymol blue 7.1,
  phenolphthalein 9.3, methyl red 5.0, thymol blue 8.9 for its second change) and "range ≈ pKa ± 1"
  are the textbook simplification; real ranges are listed slightly differently by suppliers.
- **8.11 kept qualitative** (ced-exclusions above): no solubility-vs-pH calculation anywhere; one
  `going-further` aside mentions that it can be done.
- **Polyprotic titrations**: items read pKa₁/pKa₂ and equivalence points from a curve and identify
  species; no polyprotic pH calculation is required (the old "polyprotic titration numerics"
  exclusion is from the pre-2019 framework; check whether the 2024 CED says anything).
- **Grader fix**: `chem/assets/chem-questions.js` `near()` used an absolute 1e-9 slack, so any
  answer below about 1e-9 was accepted for small keys (Ka, Kb, [OH⁻]). Changed to a relative
  slack; test `scripts/test/apchem-numeric-small.test.mjs`. No other copy of this function was
  found in the repo.
