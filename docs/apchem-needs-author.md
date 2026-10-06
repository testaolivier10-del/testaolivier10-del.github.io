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

## unit9-data: thermodynamic values used in Unit 9 (open, 2026-10-06)

Unit 9 items use standard values at 298 K from general tables, not from the CED (the exam gives
data in each question). Spot-check against one reference before publishing: S° (N₂ 191.6, H₂ 130.7,
NH₃ 192.8, O₂ 205.2, H₂O(l) 69.9, H₂O(g) 188.8, CO₂ 213.8, CH₄ 186.3, CaCO₃ 91.7, CaO 38.1,
H₂O₂(l) 109.6, NO 210.8), ΔG°f (C₂H₅OH(l) −174.8, CO₂ −394.4, H₂O(l) −237.1, Cu₂S −86.2,
SO₂ −300.1, Fe₂O₃ −742.2, CO −137.2), dissolution data (NH₄NO₃ +25.7 kJ/mol and +108.7 J/(mol·K);
NaCl +3.9 and +43.4; CaCl₂ −81.3 and −44.7; NH₄Cl +14.8 and +75.0) and E° values (Ag⁺ +0.80,
Cu²⁺ +0.34, Pb²⁺ −0.13, Ni²⁺ −0.25, Fe²⁺ −0.44, Zn²⁺ −0.76, Al³⁺ −1.66, Mg²⁺ −2.37). Every key
is recomputed from these numbers, so a changed value means regenerating the dependent keys.
Where: `chem/data/questions/{entropy-change,gibbs-free-energy,dissolution-free-energy,coupled-reactions,cell-potential}.json`,
`chem/data/frq/frq-*.json` (Unit 9).

## unit9-atp: ATP values in coupled-reactions (open, 2026-10-06)

The ATP item set gives ΔG = −30.5 kJ/mol for ATP hydrolysis and +13.8 kJ/mol for glucose
phosphorylation "at 37 °C and pH 7". These are the usual biochemical standard values (ΔG°′); the
actual ΔG in a cell is more negative. Is presenting them as cell-condition values acceptable for
the exam's level, or should the stem say "biochemical standard conditions"? Where:
`chem/data/questions/coupled-reactions.json` (stimulus coupled-reactions-s2).

## unit9-exclusions-applied: how Unit 9 handles the reported exclusions (open, 2026-10-06)

Pending `ced-exclusions`: no Unit 9 item asks for an electrode's sign (9.8), and every Nernst item
is qualitative (direction of E from Q, concentration cells). The notes for 9.8 and 9.10 mention
electrode signs and one worked Nernst number only inside `going-further` asides. If the CED allows
quantitative Nernst, add numeric items to `nernst-equation`.
