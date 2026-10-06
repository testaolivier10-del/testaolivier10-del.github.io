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

## unit-1-data-values: verify reference data used in Unit 1 items (open, 2026-10-06)

Unit 1 items and FRQs use rounded literature values written from memory, not looked up: PES binding
energies (Ne 84.0/4.68/2.08; Na 104/6.84/3.67/0.496; Mg 126/9.07/5.31/0.738; Si 178/15.1/10.3/1.46/0.79
MJ/mol), period 3 radii (Na 186 ... Cl 99 pm), first ionization energies, electronegativities, Al
successive ionization energies, and isotope masses/abundances (Mg, Ga, Cl, B, Cu). Every number derived
from them was recomputed by code, but the source values themselves need a check against a data table
during the Unit 1 accuracy review. Where: `chem/data/questions/{photoelectron-spectroscopy,periodic-trends,mass-spectra}.json`,
`chem/data/frq/frq-pes-sodium-magnesium.json`, `frq-copper-oxide-formula.json`.

## unit-1-frq-scope: electron affinity and the P/S ionization dip (open, 2026-10-06)

The periodic-trends notes explain the P → S ionization-energy dip by repulsion between paired 3p
electrons, and mention electron affinity qualitatively. Confirm both are within what the CED expects
for 1.7, or trim to a going-further aside.
