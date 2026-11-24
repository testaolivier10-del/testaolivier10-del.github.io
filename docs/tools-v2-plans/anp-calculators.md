# Plan: A&P, Calculators (tools v2)

## Tool and page
- Page `anatomy-physiology/tools/calculators.html` (built from `anatomy-physiology/data/pages.json`). Scripts
  `anatomy-physiology/assets/tools/calculators.js` (1,089 lines, 78 KB) and `calc-art.js`; data
  `anatomy-physiology/data/tools/calculators.json` (89 calculators in 15 groups; each has inputs, derived
  expressions, steps, ranges, meaning, presets, a practice generator) and `data/calc-pictures.json` (a small drawing
  per formula family). Spec section 8.6.
- **Free.** Rollout row 70, group C (calculators and drills), size rework ("many items, one screen": question 5).
  Unchanged on `claude/tools-v2-all`.

## The one idea
In a body formula, changing one input changes the output by a predictable amount, and the picture shows why.
Five tabs, as A&P Graphs and Predict did (a few drawn screens in Explore, every item in Test yourself):
1. **Vessel radius** (`radius`): half the radius, one sixteenth the flow (r to the fourth).
2. **Cardiac output** (`cardiac-output`): heart rate times stroke volume.
3. **Filtration** (`ur-glomerular-nfp`): blood pressure out minus the two pressures back.
4. **Ventilation** (`ventilation`): dead space air never reaches the alveoli.
5. **Blood pH** (`fab-henderson`): the bicarbonate to CO₂ ratio sets the pH.

## Research
- [Basic model of blood flow in arteries (Virtual Labs)](https://ibe-amrt.vlabs.ac.in/exp/blood-flow-model/simulation/index.html):
  change the vessel and the flow responds. Take: the vessel is drawn and the radius is dragged on its wall.
- [Interactive simulator for Guyton's venous return curve (Adv. Physiol. Educ., PMC)](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10981291/):
  a physiology formula made into a direct control with a live readout. Take: the number sits on the picture.
- Khan Academy exercises (group C row) and PhET (group P row) for the Test yourself practice and the instant
  response. Seen as text only; the builder opens them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Picker of 89 calculators by group (`AnpToolKit.picker`), `#<id>` deep link and hashchange | Explore holds the 5 tabs; the picker and all 89 stay in Test yourself; `#radius`, `#cardiac-output`, `#ur-glomerular-nfp`, `#ventilation`, `#fab-henderson` open those Explore tabs, any other `#<id>` opens Test yourself on it |
| Calculate mode: number inputs, live worked steps, ranges, meaning, presets, "For your exam" line, the family picture | Test yourself part "Work it out" (every calculator, unchanged); in Explore the steps become the cause line and the presets the tab's preset cases |
| Practice mode: random problem, answer with tolerance, full solution after Check, record `calculators:<id>:practice` through AnpCore | Test yourself part "Practice", ids unchanged |
| Invalid input messages (`invalid`) | Explore knobs are capped to valid ranges; the messages stay in Test yourself |
| Notes and sources | "?" |

## Design
- **Vessel radius:** an arteriole drawn cut open, smooth muscle ring around it, red cells flowing. Drag the wall
  (knob on the wall) to narrow or widen it; cells speed up or crowd and slow, a flow meter downstream reads mL/min.
  Cause line: "Radius × 0.5 → resistance × 16 → flow 40 → 2.5 mL/min".
- **Cardiac output:** the heart beating; main knob heart rate (drag the beat rate on the ECG strip under it),
  quiet second knob stroke volume (the ventricle's fill line). Blood leaving per minute fills a litre jug.
- **Filtration:** a glomerulus in Bowman's capsule; arrows of glomerular blood pressure out, capsular pressure and
  blood colloid pressure back, each arrow's length from its value; main knob the afferent arteriole's pressure.
  Filtrate drips into the capsule at the net rate.
- **Ventilation:** airway tree and alveoli; main knob tidal volume (drag the chest), quiet rate knob. The first
  150 mL of each breath is drawn staying in the airways; only the rest reaches the alveoli.
- **Blood pH:** a capillary with HCO₃⁻ and CO₂ particles; main knob PCO₂ (breath rate cue: CO₂ out of the lungs),
  pH gauge on the picture with 7.35 to 7.45 band.
- Each tab: one main knob, at most one quiet knob, the formula with live numbers as the cause line, a takeaway
  at the extremes ("Small change in radius, huge change in flow").
- **Outside the picture:** five tabs, purpose line, cause line. About 25 words.

## Science to verify
- Poiseuille: R ∝ 1 / r⁴ at constant length and viscosity; the default 40 mL/min and factors: OpenStax A&P 2e 20.2.
- CO = HR × SV, resting about 5 L/min (70 × 70 mL): OpenStax 19.4.
- Glomerular NFP = GBHP − (CHP + BCOP) = 55 − (15 + 30) = 10 mm Hg: OpenStax 25.6.
- Alveolar ventilation = (TV − dead space) × rate, anatomic dead space about 150 mL: OpenStax 22.3.
- pH = 6.1 + log([HCO₃⁻] / (0.03 × PCO₂)), 24 mmol/L and 40 mm Hg give 7.4: OpenStax 26.4.
- Every value range open in `docs/anp-needs-author.md` (calculators lines) stays as noted there.

## Reuse
- `AnpToolKit.kit2` (`anatomy-physiology/assets/tools/tool-kit.js`), `"kit2": true` in `data/pages.json`; Test
  yourself through the studio's quiz mode with the picker (the graphs pattern: "Read it" for the other items).
- The calculator engine (expression parser, derived values) so Explore numbers equal the worked steps.
- Drawings: the arteriole of `predict-explore.js`, the heart and lungs of `graphs-explore.js`, `scene.js`; reuse
  them, never copy (Predict owns the direction story, Calculators the numbers).
- Explore in its own weight bucket, as `anatomy-physiology/predict-explore` did.

## Risks reviewers will likely block on
- Overlap with A&P Predict and Graphs: each tab must teach the number, visibly different from those screens.
- Picture motion (cells, blood) out of step with the numbers (the flow meter derived from what is drawn).
- Two knobs on one picture where the quiet one moves the main one (rule 8).
- Formula text with sub and superscripts under 11 px at 360; the cause line over two rows.
- Five animated scenes: every timer stops when a tab hides; perf at CPU x4.
