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

## unit-1-data-values: verify reference data used in Unit 1 items (resolved, 2026-10-06)

Resolved in the Unit 1 review (`docs/apchem-reviews/u1.md`). Isotope masses and abundances for
Mg, Cl, Ga, B and Cu match the NIST atomic weights and isotopic compositions table to every digit
shown. First ionization energies (Na 496 … Cl 1251 kJ/mol), Al successive ionization energies
(577.5, 1816.7, 2744.8, 11,577, 14,842), Pauling electronegativities (0.93 … 3.16) and the period 3
radii (186 … 99 pm) are the standard CRC/textbook values. PES binding energies: Ne 84.0/4.68/2.08
match gas-phase values (870.2/48.5/21.6 eV); Na, Mg and Si agree with X-ray binding energies within
the few percent expected between solid- and gas-phase references, so they are realistic rounded
values, and every item states the values it uses. One inconsistency fixed: the PES item stimulus
gave Mg 3s as 0.74 while the notes and FRQ give 0.738; now 0.738 everywhere.

Original entry:

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

Unit 1 review note (2026-10-06, still open): electron affinity is listed with ionization energy, radii and
electronegativity among the 1.7 periodic properties (2019 CED as recalled, and every study guide
checked), so the qualitative mention stays. The paired-electron
explanation of the P → S dip appears in the notes and lesson ideas only; no item or FRQ tests it
(chem-periodic-trends-9 cites the dip as data only). The CED text for 1.7 could not be fetched
verbatim, so the owner should still decide whether that explanation stays in the main text.
## unit2-data: values chosen for Unit 2 items (open, 2026-10-06)
## unit2-data: values chosen for Unit 2 items (resolved by the u2 review, 2026-10-06)

Resolved: checked against standard tables (Wikipedia data pages, which compile CRC and
WebElements; Shannon radii). All values are acceptable for teaching. Two differ between sources
without changing any answer: MgO melts at 2852 °C in some tables and 2825 °C in CRC, and tin's
metallic radius is listed anywhere from 140.5 to 162 pm (151 is inside that range; every value is
well above Cu 128 and Zn 134, so the bronze reasoning holds). See `docs/apchem-reviews/u2.md`.

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

## unit2-chlorite: VSEPR angle for ClO₂⁻ in the long FRQ (resolved by the u2 review, 2026-10-06)

Resolved: keep ClO₂⁻. The measured angle (111°, Cl–O 156 pm) is confirmed. The exam asks for
VSEPR estimates with domain reasoning, so a rubric that accepts 100° to 115° with the four-domain
argument is fair and keeps the ion's real data honest. The rubric's accept list was made consistent
with that range (it had said 105° to 112°).

`frq-chlorite-ion-structure` part (f) asks for the O–Cl–O angle in ClO₂⁻ (bent, four domains).
VSEPR's lone-pair argument predicts "slightly less than 109.5°", but the measured angle is about
111°. The rubric accepts any estimate from 100° to 115° with the four-domain reasoning, and the
sample notes the measured value. Decide whether to keep this ion or switch to a species whose
measured angle follows the simple rule (for example SCl₂, about 103°).

## unit2-expanded-octet: preferred diagrams for ClO₂⁻ and sulfate (resolved by the u2 review, 2026-10-06)

Resolved: the CED (2.6) gives the octet rule and formal charge as the criteria for choosing a
diagram, and recent scoring accepts either an all-octet or an expanded-octet diagram for period 3
oxyanions when a question does not name a criterion. The course follows that: the 2.6 notes say
both are accepted, and the FRQ part (d) now asks why "the formal-charge criterion favors" the
expanded diagram (not that it is simply "preferred"), its sample says both diagrams are valid, and
the expanded-octet remark is no longer required for the reasoning point. Part (b) still asks for
the all-octet diagram explicitly. A teacher reviewer may still confirm against the newest scoring
guidelines (teacher-review).

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
## unit4-dissolving: is dissolving an ionic solid physical or chemical? (open, 2026-10-06)

Topic 4.4 (`physical-chemical-changes`) teaches that dissolving an ionic solid has features of both
kinds of change (strong ionic attractions broken and ion-dipole attractions formed, yet no new
substance), and asks students to justify a classification at the particle level. No item keys a
single label for it. Check how the CED and recent scoring guidelines treat this case, and whether an
item should key one answer.

## unit4-reaction-type-labels: are synthesis, decomposition and replacement labels assessed? (open, 2026-10-06)

Topic 4.7 (`reaction-types`) classifies reactions mainly as precipitation, acid-base and electron
transfer (with combustion), as the CED does, and teaches synthesis, decomposition and
single/double replacement only as descriptive pattern names (one select-all item asks which reactions are
decompositions). Confirm that these older labels are not tested directly; if they are not, consider
dropping the decomposition item.

## unit4-electron-transfer-before-4.9: "electron transfer" used in 4.7 before 4.9 (open, 2026-10-06)

The CED asks 4.7 to classify reactions as redox, but the map teaches the terms "redox",
"oxidation" and "reduction" in 4.9. Topic 4.7 therefore says "electron transfer" (a plain
description, built from "electron" taught in 1.2) and points ahead to 4.9. If you would rather 4.7
use the word "redox", move a short version of the `redox` concept into 4.7 as a
`circularDependencies` pull-forward.

## unit4-limiting-reactant-moved: limiting reactant now taught in 4.3 (decision needed, 2026-10-06)

The CED's 4.3 (representations of reactions) has students identify the excess reactant in a
particle diagram, so the `limiting-reactant` concept (aliases include "in excess") moved from 4.5
`stoichiometry` to 4.3 `reaction-representations` in `docs/apchem-dependency-map.json`, depending
on `reaction-diagram`; `yield` (4.5) now depends on both `limiting-reactant` and `stoichiometry`.
4.3 teaches it with particles; 4.5 does the gram calculations. Confirm or revert.
## unit5-kinetics-scope: Unit 5 choices to confirm (open, 2026-10-06)

Written for Unit 5 (`chem/data/*/` for the 11 kinetics topics); check against the CED:

- **Arrhenius equation.** Not on the equations sheet. The notes for 5.5 mention it only in a
  `going-further` aside and teach the qualitative idea (higher T or lower Ea gives a larger k);
  no item calculates with it. Confirm no quantitative Arrhenius is assessed.
- **Zero-order integrated law.** Not on the sheet, but 5.3 teaches [A]t = [A]0 − kt and the
  [A]-vs-t plot, and one set (NH₃ on hot tungsten) asks for a zero-order k from the slope.
  Confirm zero order is assessed this way.
- **Half-lives other than first order.** Only t½ = 0.693/k is calculated. Second-order halving
  times appear only as reasoning from the integrated law (one MCQ). Confirm no second- or
  zero-order half-life formula is expected.
- **Fractional orders.** Rate laws use orders 0, 1 and 2 only (the 5.2 notes say so); a
  pre-equilibrium with A ⇌ 2 B (giving order ½) was left out. Confirm.
- **Pre-equilibrium notation.** 5.9 uses k₁, k₋₁, k₂ and k = k₂k₁/k₋₁ with one numeric item on
  combining constants. Confirm a numeric item like this is within scope (it may be
  qualitative-only on the exam), and that "forward/reverse rates equal" is the wording wanted
  before Unit 7 introduces equilibrium.
- **Pseudo-first-order.** The long FRQ `frq-dye-fading` uses a large excess of OH⁻ and asks for
  k = k_obs/[OH⁻] without naming "pseudo-first-order". Confirm this is fair at this level.
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
