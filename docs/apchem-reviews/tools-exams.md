# Accuracy review: trainers, practice exams, justification prompts, entry pages (2026-10-06)

Independent review, AP Chemistry teacher standard. Scope: the six trainers (`chem/assets/tools/*`,
`chem/assets/tools/chem-tool-math.js`, `chem/data/tools/*`, `scripts/lib/apchem-tool-checks/*`), the 32
exam-only items and both forms (`chem/data/exams/*`), the 37 prompts (`chem/data/justify/*`), the
equations-sheet walkthrough, the score calculator and the unit practice test pages
(`scripts/lib/apchem-entry.mjs`, `chem/assets/pages/score.js`).

## Method

- Seeded sweeps in code (scratch scripts, not committed), on top of the validators' 300 per context:
  1,500 problems per ICE context and type, Q vs K context and buffer context and type; 600 titration
  curves per context; 3,000 units problems per context; 500 particle pictures per context.
- For every numeric step: is the key accepted when rounded to 3 significant figures (or to the
  step's decimal places)? Is a correct answer worked from rounded intermediates accepted? Does the
  exact (no small-x) answer pass when the approximation holds?
- Independent physics: exact buffer pH from the charge balance compared with Henderson-Hasselbalch;
  titration starting pH, equivalence pH (weak acid: √(Kb·C)), half-equivalence = pKa, diprotic first
  equivalence ≈ (pKa1 + pKa2)/2; the volume window over which each "wrong" indicator changes color.
- Water orientation in the hydration pictures checked geometrically from the SVG coordinates
  (O nearer the cation, H nearer the anion) for every ion.
- Every exam-only key recomputed by hand; every justification prompt read against AP scoring
  conventions (both species compared, direction plus reason, Q vs K rather than Le Châtelier,
  "disorder" not credited, E° intensive).
- Equations sheet compared line by line with the College Board sheet
  (apcentral.collegeboard.org/media/pdf/ap-chemistry-equations-sheet.pdf).

## Findings and fixes

### Trainers

1. **Q vs K: correct rounded answers marked wrong (fixed).** Amounts are shown to 2 significant
   figures and the Q step accepted 3%. A Q rounded to 2 figures (for example 0.15 for 0.1546) failed
   in about 4% of problems in every context. Tolerance raised to 5% (`chem-tool-math.js`, `howItWorks`
   text updated). The Q/K gap is always at least ×10^0.45, so 5% cannot blur the direction.
2. **Buffers: Henderson-Hasselbalch off by more than the 0.02 tolerance (fixed).** For formic acid
   (dilute base form) and methylamine (dilute acid form at high pH) the exact pH differed from the
   HH answer by 0.03 to 0.04 (about 2% of `add` and `ph` problems in those contexts; for example
   0.0289 M HCOO⁻ / 0.2935 M HCOOH: exact 2.77, HH 2.74). Also about 4% of `add` problems had a
   base/acid ratio outside 0.1 to 10, outside the range where the exam treats a mixture as a buffer.
   The generator now keeps only problems where the ratio is 0.1 to 10 and HH is within 0.02 of the
   exact pH, before and after the addition (`hhOk`).
3. **Buffers, ratio step (fixed).** A student working from the two-decimal pKa the drill shows
   (9.26 for NH₄⁺) and rounding to two decimals, as the answer is displayed, failed when the ratio
   was near 0.1. The cell now also allows 0.006 absolute.
4. **Titration indicator feedback (fixed).** For HCl with NaOH the equivalence pH is 7.00 and the
   jump is so steep that methyl red and phenolphthalein change color within 0.04 to 0.1 mL of
   equivalence. The feedback said they change "too early" or "too late", which is false in practice
   and contradicts what students are taught. Bromothymol blue stays the keyed best match, the
   question now asks for the indicator that fits "best", and an indicator whose whole range sits
   within 0.1 mL of equivalence gets "not the best match ... would still change within a drop or
   two". The early/late wording now also handles the falling curve of a base titration correctly.
5. **Checked and right:** ICE rows, coefficient handling, sign of the change, the 5% check (largest
   reactant percent, threshold 5%, exact quadratic when it fails; the small-x value is within 1.8%
   of exact whenever the check passes, inside the 2% tolerance); perfect-square x; K from a measured
   amount (K from a 3-figure E row always passes at 4%). Titration curves are the exact charge
   balance; start pH, equivalence pH, half-equivalence = pKa within 0.05 and the diprotic regions all
   agree with the textbook formulas; region species lists are correct. Indicator ranges match the
   Wikipedia/CRC table to 0.1 pH. Hydration pictures: O toward every cation and H toward every
   anion in all 500 seeds. Acid pictures: strong acids fully ionized; weak acids 0.2 to 4% ionized,
   drawn as 1 of 6, with the explanation giving the exact percent. Limiting-reactant and
   equilibrium boxes conserve atoms and give Q = K only for the keyed box. Units drill: every key
   passes the grader with its own sig figs; the add/subtract rule, kelvin conversion, R choice and
   log decimal-place rules are right.
6. **Not changed, noted:** a K computed from an E row rounded to 2 figures can miss the 4% window
   (2-figure intermediates are a real rounding error, so this is fair). The calorimetry drill keys
   c = 4.18 J/(g·°C) as stated in the problem; a student who uses 4.184 is 0.1% off and passes
   except when the answer sits on a rounding boundary (5% of seeds), where the sig-fig rule flags
   the last digit, which is the drill's point.

### Practice exams (32 exam-only items, 2 forms)

Every key recomputed: 731 torr; 1.44 × 10⁻³ mol (P = 730.9/760 atm, 296.15 K); 73 mL overflowing a
50.00 mL buret; pH 4.44 and 4.30; 1.20 × 10²³ O atoms; 72.1 g H₂O (O₂ limiting); 32.0 mL NaOH;
0.0250 M after five half-lives; −43.7 kJ/mol; −197.8 kJ/mol; Kc = 50.3; pH 12.699; 1.40 × 10⁻⁴ M and
7.00 × 10⁻⁴ M; ε = 2.45 × 10³ M⁻¹ cm⁻¹; longer path gives too high a concentration; +1.56 V;
−301 kJ/mol; Ag⁺ reduced at the silver strip; +1.10 V with Cu; 21.2% N; NO₃⁻ at 120°; ×4.5; 30.0 min;
Ksp = 1.1 × 10⁻¹²; Q = 200 > K so reverse; pH 4.26 (x/C = 0.05%); percent ionization rises on dilution.
Each has one defensible answer and real-format four-option stems. **No key changed.**
One distractor explanation fixed: chem-exam-1-15's "3.55" option is 0.156/(0.0220 + 0.0220), which
also leaves [HI] unsquared; the explanation now says both slips.
Forms: 60 MCQ each, unit counts inside every CED weight range (checked by `checkForms`), 3 long + 4
short FRQs, no question shared, sets whole and in order.

### Justification prompts (37)

All "earns" answers would earn the point under AP conventions (both species compared on charge and
distance, direction with the causal chain, Q vs K with K unchanged, microstates not "disorder", E°
intensive, electrons per Cu²⁺). All "misses" answers fail for the stated reason. Two fixed:
- **u3-real-gas-attractions**: the context said "300 K and moderate pressure" for 1.00 mol NH₃ in
  1.00 L, which is about 24.6 atm, above NH₃'s vapor pressure at 300 K (about 10.6 atm), so the
  sample would partly condense. Now 500 K (gas, about 41 atm ideal, still a lower measured
  pressure); "at this crowding" reworded.
- **u6-specific-heat**: the particle-level reason credited "vibrations" (water's intramolecular
  vibrations are barely excited at room temperature) and left out the main reason per gram: 100 g
  of water is 5.55 mol of molecules against 1.57 mol of copper atoms. The checklist and model
  answer now give the particle count first, then rotations and hydrogen bonds.

### Entry pages

- **Equations sheet:** every equation and constant on the College Board sheet is present and right
  (the sheet's [A]t = [A]0e^(−kt) form is covered by the first-order row). The "not on the sheet"
  list (no reduction potential table, solubility rules, Arrhenius, zero-order law) matches the
  sheet. No change.
- **Score calculator (cut-offs changed):** method (50 × MCQ/60 + 50 × FRQ/46) matches the current
  exam's 50/50 weighting and 3 × 10 + 4 × 4 = 46 FRQ points. Cut-offs were 75 / 60 / 45 / 30, an
  unsourced guess that is stricter than every public source. Now **72 / 58 / 42 / 27**: the
  cut-offs reported for the 2014 exam (the first in the current format, also composite /100;
  "2014 AP Chemistry Exam Results", studylib.net/doc/8192491), the numbers used by Omni Calculator,
  Test Ninjas and num8ers. Other calculators use lower lines (RemNote 65/53/40/27). Since 2022
  15-18% of students earn a 5 (College Board distributions), against about 10% in 2014, so the page
  now says the real 5 line may be a little lower, and still labels the result an estimate. The
  practice exam's readiness band uses the same numbers (test updated).
- **Unit practice tests:** built from bank items already reviewed per unit; the selection
  (`unitSample`) takes only single-answer sets that do not refer to a previous question. No issue.

## Checks

`check-apchem-content.mjs --check` (all units published): 0 failing. `check-apchem-map.mjs --check`:
passes. `node --test scripts/test/*.test.mjs`: 611 pass, 0 fail.

## Open

- `tools-premium` (owner decision) unchanged.
- If the College Board publishes a newer scoring worksheet, replace the 2014 cut-offs.
