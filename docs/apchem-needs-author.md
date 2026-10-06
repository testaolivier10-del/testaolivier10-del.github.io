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

## unit3-real-gas-data: model-generated PV/nRT values (open, 2026-10-06)

The PV/nRT values in `real-gases` (notes table at 300 K, stimulus graph at 400 K) and the
measured NH₃ pressure (62.9 atm, 2.000 mol in 1.000 L at 450.0 K) were generated from the van
der Waals equation with textbook a and b constants, not from tabulated experimental data. The
stimulus says "estimated from a model fitted to measured data". Trends and signs are right, but
the exact values (especially CO₂ near 100-200 atm at 300 K, close to its critical point) may
differ from measured compressibility factors. Check against a data table or relabel.

## unit3-scope-checks: Unit 3 scope choices to confirm (open, 2026-10-06)

- 3.7: molality, percent by mass/volume and colligative properties are only named in a
  `going-further` aside; no item uses them (per `ced-exclusions`).
- 3.10: the notes say most solids dissolve more in hot water "though there are exceptions";
  no item tests solid solubility vs temperature. Confirm the CED expects gas-solubility trends
  (pressure, temperature) only qualitatively, as written.
- 3.11: IR wavenumber ranges (O–H 3,200-3,550; C=O 1,680-1,750; C–O 1,000-1,300 cm⁻¹) are given
  in the stimulus, not expected from memory. Confirm the CED does not expect students to
  interpret IR spectra beyond "IR excites vibrations" (the set is labelled with data given).
- 3.12-3.13: "transmittance" is named in notes and glossary but never calculated (no log), since
  logarithms are taught before 5.3.
- Particle diagrams: water around an anion is drawn with one O–H pointing at the ion (the other
  H away), around a cation with O toward the ion. Confirm this matches the CED's expected
  depiction (the CED only requires correct dipole orientation).
