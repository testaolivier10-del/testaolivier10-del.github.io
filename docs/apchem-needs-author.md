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
- 9.8: labeling electrodes as positive or negative not assessed. (Confirmed in the CED, 9.8.A.3,
  Unit 9 review 2026-10-06.)
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
## unit3-real-gas-data: model-generated PV/nRT values (resolved, 2026-10-06)

Resolved by the Unit 3 review (`docs/apchem-reviews/u3.md`). The van der Waals values were
checked against CoolProp's reference multiparameter equations of state (the NIST REFPROP
formulations fitted to measured data) and several were wrong: at 300 K the notes had CO₂ 0.718 at
50 atm (reference 0.681) and N₂ 0.972 (0.997); at 400 K the stimulus had N₂ dipping below 1
(the reference never does at 400 K) and CO₂ 0.761 at 100 atm (0.817); NH₃ at 2.000 mol/L and
450.0 K is 62.5 atm, not 62.9. The notes table, the worked example (CO₂ 38.2 atm, 0.776), the
stimulus graph (now He, Ar, CH₄, CO₂ at 350 K, where Ar shows the dip then rise that the items
need) and the NH₃ cylinder (62.5 atm, PV/nRT 0.846) now use reference values to three decimals.

## unit3-scope-checks: Unit 3 scope choices to confirm (open, 2026-10-06; reviewed 2026-10-06)

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
- Review 2026-10-06 (`docs/apchem-reviews/u3.md`): every point above was confirmed as written in
  the content (no item uses molality, percent by mass/volume, colligative properties, solid
  solubility vs temperature, a logarithm or transmittance; IR ranges are given in the stimulus;
  every water molecule in the particle diagrams faces the ion with the opposite partial charge).
  The CED's own Unit 3 exclusion text still could not be read (the PDF extraction stops at 3.1),
  so the CED-wording questions stay open with `ced-exclusions`.

## unit4-dissolving: is dissolving an ionic solid physical or chemical? (open, 2026-10-06)
## unit4-dissolving: is dissolving an ionic solid physical or chemical? (resolved, 2026-10-06, Unit 4 review)

Topic 4.4 (`physical-chemical-changes`) teaches that dissolving an ionic solid has features of both
kinds of change (strong ionic attractions broken and ion-dipole attractions formed, yet no new
substance), and asks students to justify a classification at the particle level.

**Decision: keep as written; no item keys a single label.** The CED's 4.4 essential knowledge
presents the dissolution of a salt as a process with features of both physical and chemical change
(ionic bonds broken, ion-dipole interactions formed), and the classification question is used to
elicit particle-level reasoning, not a one-word label. An item keying "physical" or "chemical"
alone would mark a defensible answer wrong. Item `chem-physical-chemical-changes-8` asks why the
case is hard to classify, which matches this. Reviewer: Unit 4 accuracy check
(`docs/apchem-reviews/u4.md`).

## unit4-reaction-type-labels: are synthesis, decomposition and replacement labels assessed? (resolved, 2026-10-06, Unit 4 review)

Topic 4.7 (`reaction-types`) classifies reactions as precipitation, acid-base and electron
transfer (with combustion), as the CED does, and mentions synthesis, decomposition and
single/double replacement as descriptive pattern names.

**Decision: the pattern names are not assessed; no item keys them.** The CED's 4.7 asks students to
classify reactions by what is transferred (precipitation, acid-base, redox) and treats combustion
as a redox example; the older synthesis/decomposition/replacement taxonomy is not in its learning
objectives or essential knowledge. The notes and glossary keep the names as shorthand (students
meet them in class), but the three items that keyed them were rewritten to test the CED
classification instead: `chem-reaction-types-4` (why combustion is electron transfer),
`-12` (acid-base replaces single replacement as a distractor; key is electron transfer only) and
`-16` (which reactions involve electron transfer, replacing "which are decompositions"; it also
shows that a decomposition need not be electron transfer).

## unit4-electron-transfer-before-4.9: "electron transfer" used in 4.7 before 4.9 (resolved, 2026-10-06, Unit 4 review)

The CED asks 4.7 to classify reactions as redox, but the map teaches "redox", "oxidation" and
"reduction" in 4.9. Topic 4.7 says "electron transfer" and points ahead to 4.9.

**Decision: keep "electron transfer" in 4.7; no pull-forward.** "Electron transfer" is the CED's
own definition of a redox reaction, so 4.7 tests the same idea; the term "redox" with oxidation
numbers arrives two topics later in the same unit, and the 4.9 notes and items use both. No 4.7
item needs oxidation numbers (they use the uncombined-to-combined clue or ion charges). Renaming
would add a circular dependency for no assessment gain.

## unit4-limiting-reactant-moved: limiting reactant now taught in 4.3 (resolved, 2026-10-06, Unit 4 review)

The `limiting-reactant` concept moved from 4.5 `stoichiometry` to 4.3 `reaction-representations`
in `docs/apchem-dependency-map.json`; `yield` (4.5) depends on both.

**Decision: confirm the move.** The CED's 4.3 has students represent reactions with particle
diagrams including a reactant in excess, which needs the limiting/excess idea; 4.5 then extends it
to masses and theoretical yield. The 4.3 notes teach it with particles first and 4.5 links back
("You met this with particles in topic 4.3"); `check-apchem-map.mjs --check` passes with this
order.

## unit5-kinetics-scope: Unit 5 choices to confirm (open, 2026-10-06)
The CED's 4.3 (representations of reactions) has students identify the excess reactant in a
particle diagram, so the `limiting-reactant` concept (aliases include "in excess") moved from 4.5
`stoichiometry` to 4.3 `reaction-representations` in `docs/apchem-dependency-map.json`, depending
on `reaction-diagram`; `yield` (4.5) now depends on both `limiting-reactant` and `stoichiometry`.
4.3 teaches it with particles; 4.5 does the gram calculations. Confirm or revert.
## unit5-kinetics-scope: Unit 5 choices to confirm (resolved, 2026-10-06)

**Resolved 2026-10-06 (Unit 5 accuracy review, `docs/apchem-reviews/u5.md`).** Evidence: the
current CED PDF (apcentral, read through a text extractor) and the equations sheet
(`docs/apchem-research/framework.md`, section 2). Unit 5 has one exclusion statement, at 5.6:
"Calculations involving the Arrhenius equation will not be assessed on the AP Exam." No other
Unit 5 exclusion was found. Answers, point by point:

- **Arrhenius:** confirmed excluded from calculation. Keep it qualitative (as now: a
  `going-further` aside in 5.5, no item calculates with it). Added to `docs/apchem-ced-map.json`
  (5.6 `exclusions`, `exclusionsSummary.verifiedUnit5`).
- **Zero order:** keep. 5.3's learning objective covers zero-, first- and second-order
  concentration-time graphs; the sheet omits the zero-order law because it is just a straight
  line ([A] vs t, slope −k). Finding k from that slope (the NH₃ set) is in scope.
- **Half-lives:** keep as is. The sheet gives only t½ = 0.693/k (first order). Second- and
  zero-order half-lives stay reasoning-only.
- **Fractional orders:** keep 0, 1, 2 only. Nothing in the CED or sheet calls for fractional
  orders, and the A ⇌ 2 B pre-equilibrium stays out.
- **Pre-equilibrium numeric item:** keep. 5.9 asks students to derive the rate law by setting the
  fast step's forward and reverse rates equal; combining k₁k₂/k₋₁ numerically (one item, worked
  in the notes first) is a direct use of that algebra, not a new skill. "Forward and reverse
  rates equal" needs only dynamic equilibrium (taught in 3.3), not a Unit 7 equilibrium constant.
- Not verified verbatim: the 5.2, 5.3 and 5.9 essential knowledge text (the extractor returned
  only the 5.6 exclusion). The answers above rest on the sheet, the CED topic list and the
  absence of any other Unit 5 exclusion; a person may still want to read those pages.
- **Pseudo-first-order (`frq-dye-fading`):** keep. The stem says [OH⁻] stays essentially
  constant, and part (f) reasons from data (doubling [OH⁻] doubles the measured constant), so no
  named concept is required; the crystal-violet fading lab in the CED's lab list uses the same
  idea.

Original questions, kept for the record:

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
## unit6-data-values: reference values used in Unit 6 (resolved 2026-10-06)

**Resolved 2026-10-06 (Unit 6 accuracy review, `docs/apchem-reviews/u6.md`):** the set is accepted.
Each ΔH°f matches the NBS/CODATA-based textbook tables to within 1 kJ/mol (checked against an
open textbook appendix and the NIST WebBook: Al₂O₃ −1675.7, Fe₂O₃ −824.2, CO −110.5, CO₂ −393.5,
H₂O(l) −285.8, H₂O(g) −241.8, NO₂ +33.2, glucose −1273.3, O₃ +142.7, C₂H₄ +52.4, SO₂ −296.8,
SO₃ −395.7 exact; CH₄ −74.8 vs −74.6, C₂H₅OH −277.7 vs −277.6, NH₃ −46.1 vs −45.9 (NIST CODATA
−45.94), NO +90.3 vs +91.3 in the newer table, +90.25 in NBS 1982). The bond enthalpies are the
common general-chemistry average set; water/ice values and ΔHfus/ΔHvap are standard. Compound Q in
`phase-change-energy` (94.10 g/mol, mp 41 °C, bp 182 °C, ΔHfus 11.3 kJ/mol) is phenol's real
data (NIST ΔfusH 11.5 kJ/mol), so it is realistic. Every item gives its values, so no key depends on
the choice of table. Original note:

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

## unit6-figures-review: Unit 6 figures not yet checked by a person (resolved 2026-10-06)

**Resolved 2026-10-06 (Unit 6 accuracy review):** all nine rendered and checked: arrow directions and
signs, level order, every printed number (678 − 862 = −184; −74.8 / −965.1 / −890.3; −110.5 + −283.0
= −393.5; ×2, ×½, reverse on −92.2). One fix: `water-heating-curve` drew the ice and steam slopes
shallower than the liquid slope, which is backward for energy on the x-axis (ice 2.09 and steam
about 2.0 J/(g·°C) vs 4.18), so those segments are now steeper and the alt/desc say why. Original
note:

Nine new SVGs in `chem/figures/` (endo-exo-energy-flow, enthalpy-diagram-pair,
thermal-contact-particles, coffee-cup-calorimeter, water-heating-curve, thermochemical-scaling,
bond-enthalpy-ladder, formation-pathway, hess-carbon-routes) were rendered and inspected by the
author only. The heating curve and ladders are labelled "not to scale" or use schematic heights.
## unit7-data: reference values used in Unit 7 items (resolved, 2026-10-06)

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

**Resolved 2026-10-06 (Unit 7 review, `docs/apchem-reviews/u7.md`).** Values checked: Ksp against the
LibreTexts table "Solubility Constants for Compounds at 25 °C" (AgCl 1.77 × 10⁻¹⁰, AgBr 5.35 × 10⁻¹³,
Ag₂CrO₄ 1.12 × 10⁻¹², CaF₂ 3.45 × 10⁻¹¹, PbCl₂ 1.70 × 10⁻⁵, BaSO₄ 1.08 × 10⁻¹⁰, Mg(OH)₂ 5.61 × 10⁻¹²,
Ca(OH)₂ 5.02 × 10⁻⁶, SrF₂ 4.33 × 10⁻⁹, PbI₂ 9.8 × 10⁻⁹): all item values agree to two figures except CaF₂
(3.9 vs 3.45, within the usual spread between tables; kept, since it is given data). Gas-phase K values
recomputed from standard ΔG°f at 298 K: NO 4.5 × 10⁻³¹, HCl 2.5 × 10³³, water-gas shift 1.0 × 10⁵, all match.
Kc(N₂O₄) 4.6 × 10⁻³ at 298 K is the textbook value; the k-properties temperature table said 7.1 × 10⁻³ at
298 K, inconsistent with the rest of the unit, and was changed to 4.6 × 10⁻³ (notes: "about 5 × 10⁻³").
Ag₃PO₄: the item's solubility 1.6 × 10⁻⁵ M gave Ksp 1.8 × 10⁻¹⁸, far from the tabulated 8.9 × 10⁻¹⁷;
changed to 4.3 × 10⁻⁵ M (key 9.2 × 10⁻¹⁷). Cobalt: the forward reaction
Co(H₂O)₆²⁺ + 4 Cl⁻ → CoCl₄²⁻ + 6 H₂O is endothermic (heating turns it blue, cooling pink), as stated by
the RSC practical "The equilibrium between two coloured cobalt species"
(https://edu.rsc.org/experiments/the-equilibrium-between-two-coloured-cobalt-species/1.article);
the content is correct. Invented "certain temperature" constants are acceptable as given data.

## unit7-small-x: the 5% rule (resolved, 2026-10-06)

Notes and items teach the common "5% rule" for the small-x approximation and use the quadratic formula
when it fails. The CED is understood to expect the approximation for small K; confirm the exam does not
require the quadratic formula (we teach it as the fallback and test it in two items only).

**Resolved 2026-10-06 (Unit 7 review).** The CED 7.7 knowledge statement (in `docs/apchem-ced-map.json`)
expects the small-x simplification when K is small; no exclusion mentions the quadratic formula, and
study guides (e.g. Fiveable 7.7) say exam items are built so the approximation almost always works.
Keep the current treatment: the quadratic is taught as a fallback (one worked example, items
`chem-equilibrium-concentrations-6`/`-7`) and never needed in an FRQ. Every approximation in the unit
was rechecked against the exact solution: NOCl x = 0.0100 vs 0.0097 exact (4% check), phosgene 0.0200
vs 0.0196, H₂S 1.36 × 10⁻³ vs 1.33 × 10⁻³, A ⇌ B + C 6.3 × 10⁻³ vs 6.1 × 10⁻³ (6.3%, correctly flagged
as over 5%), PbCl₂ in 0.25 M NaCl 2.7 × 10⁻⁴ (exact 2.71 × 10⁻⁴).
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
## unit9-data: thermodynamic values used in Unit 9 (resolved 2026-10-06, Unit 9 review)

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

**Resolved (Unit 9 review, `docs/apchem-reviews/u9.md`).** Every S° and ΔG°f above matches the
LibreTexts "T1: Standard Thermodynamic Quantities" table (NBS/NIST values); H₂O(l) is 70.0 there and
69.9 in other tables (NIST 69.95), so either is fine. The other values used (NO₂ 240.1, SO₂ 248.2,
SO₃ 256.8, diamond 2.4, Fe 27.3, C₃H₈ 270.3) also match. The dissolution data agree with ΔH°f and S°
of the solids and aqueous ions (NaCl +3.9 and +43.4, NH₄Cl +14.7 and +75.3, NH₄NO₃ ΔS° +108.7;
NH₄NO₃ +25.7 and CaCl₂ −81.3/−44.7 are the usual tabulated enthalpies of solution, within table
scatter). The E° values are the standard textbook values. Every Unit 9 numeric key, authored
mistake and FRQ number was recomputed in code from these values; all keys were right.

## unit9-atp: ATP values in coupled-reactions (resolved 2026-10-06, Unit 9 review)

The ATP item set gives ΔG = −30.5 kJ/mol for ATP hydrolysis and +13.8 kJ/mol for glucose
phosphorylation "at 37 °C and pH 7". These are the usual biochemical standard values (ΔG°′); the
actual ΔG in a cell is more negative. Is presenting them as cell-condition values acceptable for
the exam's level, or should the stem say "biochemical standard conditions"? Where:
`chem/data/questions/coupled-reactions.json` (stimulus coupled-reactions-s2).

**Resolved.** Labeled as what they are: the stimulus now says "standard free energy changes at pH 7
(the standard state biochemists use), taken here for 37 °C", every ΔG in the set is ΔG°, and the
notes add one sentence that the real ΔG in a cell is more negative. Keys unchanged (−16.7 kJ/mol;
K = 6.5 × 10² at 310 K, which treats ΔG°′ as ΔG° at 310 K: fine for the exam's level).

## unit9-exclusions-applied: how Unit 9 handles the reported exclusions (partly resolved 2026-10-06)

Pending `ced-exclusions`: no Unit 9 item asks for an electrode's sign (9.8), and every Nernst item
is qualitative (direction of E from Q, concentration cells). The notes for 9.8 and 9.10 mention
electrode signs and one worked Nernst number only inside `going-further` asides. If the CED allows
quantitative Nernst, add numeric items to `nernst-equation`.

**Partly resolved (Unit 9 review).** Read in the current CED PDF: 9.8.A.3 has the exclusion
statement "Labeling an electrode as positive or negative will not be assessed on the AP Exam", so
the 9.8 handling is confirmed (the notes' aside now says so). For 9.10, EKs 9.10.A.1-A.3 are all
qualitative (direction and size of E relative to E° from Q, E = 0 at Q = K, concentration cells);
the rest of the 9.10 page (any EK or exclusion on algorithmic Nernst calculations) could not be
extracted, so the qualitative-only choice stays until someone reads that page.

## score-cutoffs: the composite cut-offs for the estimated score (open, 2026-10-06)

The score calculator and the practice exam's readiness band turn a 50/50 composite (out of 100) into
1-5 at 75 / 60 / 45 / 30. These are our estimate: the College Board does not publish the real
conversion, and third-party calculators use other numbers (for example 72 / 58 / 42 / 27). Both pages
say it is an estimate. If you have a better source (a released scoring worksheet you trust, or
teacher experience), change `CUTS` in `chem/assets/pages/score.js` and `band()` in
`chem/assets/pages/exams.js` together; `scripts/test/apchem-exams.test.mjs` holds them equal.

## phase3-findings: unit content issues seen while building Phase 3 (open, 2026-10-06)

Not fixed (unit content files were out of scope); for the unit owners:
- `check-apchem-map.mjs --check` with every unit published fails on
  `chem-ionic-solids-*` explanation text: "toward the electrodes" (2.3) uses `electrode`, taught in 9.8.
- `check-site.mjs` with every unit published reports "neighbours"/"neighbouring" (British spelling)
  in real-gases, solids-properties and the Unit 3 and 5 sheets, four notes meta descriptions that
  point back or end mid-sentence (bond-enthalpies, electron-configuration, equilibrium-intro,
  heat-transfer), and two FRQ titles too long for the title pattern (frq-dye-fading,
  frq-phosgene-ice). They also show up on the Unit 3 practice test page, which reuses bank items.
- Accuracy check (Phase 4) should cover `chem/data/exams/items.json` (32 items) and
  `chem/data/justify/*.json` (37 prompts).

