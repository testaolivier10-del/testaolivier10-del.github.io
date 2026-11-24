# Plan: AP® Chemistry, Titration curve reader (tools v2)

**Tool and page:** `chem/tools/titration-curve-reader.html`; `chem/assets/tools/titration-curve-reader.js` (353
lines), data `chem/data/tools/titration-curve-reader.json` (contexts `hydrochloric-acid`, `acetic-acid`,
`formic-acid`, `hypochlorous-acid`, `ammonia`, `diprotic-acid`). Free. Rollout row 60, group P, wave 12, size rework.

**The one idea:** the pH jumps at the equivalence point, and halfway there the pH equals pKa. One screen; the
analyte is a quiet bottle choice on the bench.

## Research
- [ChemCollective virtual lab, titration walkthrough](https://chemcollective.org/assets/modules/activities/vlab/assignments/walkthrough/titration.htm):
  a real burette, flask and pH meter; take the burette as the control and drop by drop near the endpoint.
- PhET Acid Base Solutions and pH Scale (known, group row): a particle magnifier on the solution; take the magnifier
  circle for HA, A⁻ and OH⁻.
- [Purdue, practicing titrations](https://www.purdue.edu/science///K12/LabPages/practicetitrations.html): the
  indicator colour change and the swirl. Builder: open all three.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Volume added slider | Explore: main control, drag the burette's stopcock handle (flow) or the liquid level; the volume read on the burette scale |
| +1 drop, +1 mL, Start over | Explore: a quiet drop button on the burette tip; Start over |
| ▶ Run | "Watch it" (K.player) |
| Analyte contexts (6) | Explore: three bottles on the bench (HCl, acetic acid, ammonia); formic, hypochlorous and the diprotic acid in Test yourself, log it |
| Indicator choice | Explore: quiet; phenolphthalein default, the flask colour shows it |
| Species bars (HA, A⁻, H₃O⁺, OH⁻, B, BH⁺, H₂A, HA⁻, A²⁻) | Explore: the magnifier circle on the flask (drawn particles) |
| Curve with eq and ½ eq marks | Explore: the curve draws as it is poured, with the two marks named |
| New numbers | Test yourself |
| Drill (6 contexts, ids `titration-curve-reader:<ctx>:<step>`), `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a lab bench: burette on a clamp stand over an Erlenmeyer flask on a white tile and stir plate, a pH
  probe in the flask with a meter showing pH, a stir bar spinning. The flask liquid takes the indicator colour from
  the computed pH. A magnifier circle on the flask shows the particles (atoms drawn, ApChemMath templates).
- **Main control:** drag the stopcock open; titrant flows in drops (faster further open). Each drop changes the pH
  on the meter and extends the curve drawn beside the stand on graph paper; near equivalence the colour flashes then
  stays.
- **Animates:** drops fall; the swirl; particles in the magnifier convert (HA meets OH⁻, becomes A⁻ and water).
- **Cause line:** "12.5 mL → half the HA turned to A⁻ → [HA] = [A⁻] → pH = pKa 4.74".
- **Takeaway:** "The steep rise is the equivalence point; its pH depends on what is left."
- **Outside the picture:** purpose line, Show me how, Watch it, cause line, Start over. About 25 words.

## Science to verify
- Ka of acetic (1.8 × 10⁻⁵), formic (1.8 × 10⁻⁴), hypochlorous (3.0 × 10⁻⁸ to 4.0 × 10⁻⁸, check), Kb of ammonia
  (1.8 × 10⁻⁵) (CRC Handbook, NIST). Kw 1.0 × 10⁻¹⁴ at 25 °C (equations sheet).
- pH at equivalence: 7 for strong/strong, above 7 for weak acid, below 7 for weak base; pH = pKa at half equivalence
  (Henderson Hasselbalch on the equations sheet).
- Phenolphthalein range about 8.2 to 10; methyl orange 3.1 to 4.4 (CRC indicator table).
- Trap: the equivalence point is not the endpoint; say both words exactly. Diprotic second equivalence (CED 8.5).
  No OpenStax.

## Reuse
`ApChemTools.studioKit2` with a Problems part; `window.ApChemBeaker` for the magnifier particles. Kit: `K.drag`,
`K.tap`, `K.player`, `K.cue`, `K.cause`. Not the first AP® Chemistry tool on kit2.

## Risks reviewers will likely block on
- Flask, magnifier and graph compete (the old fault): the graph sits under or beside the stand, smaller than the
  scene; on phones the magnifier sits inside the flask, not as a separate panel.
- The flask colour, the meter and the curve point must agree on every drop frame.
- Burette scale numbers at 11 px or more; the stopcock target 44 px.
- A fast drag past equivalence must not skip the colour change (draw every drop's state).
