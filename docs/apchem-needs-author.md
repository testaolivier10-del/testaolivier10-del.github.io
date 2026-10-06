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

## unit6-data-values: reference values used in Unit 6 (open, 2026-10-06)

Unit 6 uses one set of common textbook values throughout (checked for internal consistency by
code, not against one cited data source): ΔH°f (kJ/mol) CH₄ −74.8, C₂H₅OH(l) −277.7, CO −110.5,
CO₂ −393.5, H₂O(l) −285.8, H₂O(g) −241.8, NH₃ −46.1, NO +90.3, NO₂ +33.2, Fe₂O₃ −824.2, Al₂O₃
−1675.7, glucose −1273.3; average bond enthalpies H–H 436, C–H 413, C–C 348, C=C 614, O–H 463, O=O
495, C=O (CO₂) 799, N≡N 941, N–H 391, H–Cl 431, Cl–Cl 242, C–Cl 328, H–F 567, F–F 155; water
c = 4.18 J/(g·°C), ice 2.09, ΔHfus 6.01, ΔHvap 40.7 (at 100 °C) and 44.0 kJ/mol (at 25 °C). Tables
differ by a few kJ (e.g. C–H 411-416, C=O in CO₂ 799-805). Since every item gives its values in the
stimulus, nothing is graded against memorized data; confirm the set or swap in the owner's
preferred table. Also: the combustion ΔH of ethyne in `hess-law` uses −1300.0 kJ/mol (giving
ΔH°f +227.2, matching tables); KClO₃ decomposition is given as −78.0 kJ/mol (sources range about
−78 to −90 depending on data set; only used qualitatively).

## unit6-figures-review: Unit 6 figures not yet checked by a person (open, 2026-10-06)

Nine new SVGs in `chem/figures/` (endo-exo-energy-flow, enthalpy-diagram-pair,
thermal-contact-particles, coffee-cup-calorimeter, water-heating-curve, thermochemical-scaling,
bond-enthalpy-ladder, formation-pathway, hess-carbon-routes) were rendered and inspected by the
author only. The heating curve and ladders are labelled "not to scale" or use schematic heights.
