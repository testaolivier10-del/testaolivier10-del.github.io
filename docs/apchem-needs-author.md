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

## unit2-data: values chosen for Unit 2 items (open, 2026-10-06)

Unit 2 items use typical textbook values, rounded, which differ slightly between sources. An
accuracy reviewer should confirm they are acceptable for teaching (none is a released-exam value):

- Bond energies (kJ/mol): H–H 436, Cl–Cl 243 (curve drawn at 243), HCl 431, HBr 366, C–C 347,
  C=C 614, C≡C 839, N–N 160, N=N 418, N≡N 945, C–O 358, C=O 745 (in a ketone-like C=O; 799 is
  the CO₂ value). Bond lengths (pm): H₂ 74, Cl₂ 199, HCl 127, HBr 141, F₂ 142 (energy 159).
- Ion-center distances (pm): NaF 231, NaCl 282, KCl 315, MgO 210, CaO 240; ionic radii (Shannon,
  6-coordinate) Na⁺ 102, K⁺ 138, Mg²⁺ 72, Ca²⁺ 100, Sr²⁺ 118, Ba²⁺ 135, F⁻ 133, Cl⁻ 181, O²⁻ 140.
  Melting points (°C): NaF 993, NaCl 801, KCl 770, MgO 2852, CaO 2613, SrO 2531, BaO 1923, KI 681.
- Metallic radii (pm): Fe 126, Cr 128, Cu 128, Zn 134, Sn 151, Ag 144, Ti 147, Al 143; small
  atoms in steels: C 77, N 71, B 84 (covalent radii). Brass/bronze hardness values (Vickers 50,
  70, 95 for annealed Cu, 70/30 brass, 93/7 bronze) are representative, not from one source.
- Measured angles: NH₃ 107°, H₂O 104.5°, SO₂ about 119°, SCl₂ about 103°; ClO₂⁻ O–Cl–O about
  111°; Cl–O lengths ClO₂⁻ 156 pm, ClO₃⁻ 149 pm, typical single bond about 170 pm.

## unit2-chlorite: VSEPR angle for ClO₂⁻ in the long FRQ (open, 2026-10-06)

`frq-chlorite-ion-structure` part (f) asks for the O–Cl–O angle in ClO₂⁻ (bent, four domains).
VSEPR's lone-pair argument predicts "slightly less than 109.5°", but the measured angle is about
111°. The rubric accepts any estimate from 100° to 115° with the four-domain reasoning, and the
sample notes the measured value. Decide whether to keep this ion or switch to a species whose
measured angle follows the simple rule (for example SCl₂, about 103°).

## unit2-expanded-octet: preferred diagrams for ClO₂⁻ and sulfate (open, 2026-10-06)

The course follows the formal-charge rule (formal charges nearest zero, with an expanded octet
allowed from period 3 on), so the long FRQ prefers ClO₂⁻ drawn with one Cl=O bond, and the 2.6
notes say sulfate can be drawn either way. Many chemists prefer the all-octet diagrams for
these ions (computations show little d-orbital involvement). The exam has accepted both in
recent scoring; confirm the course's wording against the current CED and scoring guidelines.

## unit2-map: concept moves made while writing Unit 2 (done, 2026-10-06; for review)

- `delocalization` ("delocalized electrons") moved from 2.6 to 2.1 (`bond-types`): metallic
  bonding in 2.1 and 2.4 needs "delocalized" before resonance in 2.6. Now depends on
  valence-electron and chemical-bond.
- "shared pair" removed as an alias of `bonding-pair` (2.5): 2.1 defines a covalent bond as a
  shared pair of electrons, which the ordering check flagged as a use of a later term.
- "melting point" stays a 3.1 concept; Unit 2 says "melting temperature" or "melts at".
