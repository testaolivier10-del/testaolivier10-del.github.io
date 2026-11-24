# Plan: AP® Chemistry, Buffers (tools v2)

**Tool and page:** `chem/tools/buffer-drills.html`; `chem/assets/tools/buffer-drills.js` (249 lines) and `.css`,
data `chem/data/tools/buffer-drills.json` (contexts `acetic-acid`, `formic-acid`, `hypochlorous-acid`,
`dihydrogen-phosphate`, `ammonia`, `methylamine`). Premium. Rollout row 105, group P, wave 12, size rework (the name
says drills; it is a simulator).

**The one idea:** a buffer soaks up added acid or base because its weak acid and conjugate base trade places; plain
water cannot. One screen.

## Research
- PhET pH Scale and Acid Base Solutions (known, group row): drag a dropper over the beaker, the meter answers at
  once; take the dropper on the picture.
- ChemCollective buffer virtual labs (known, `chemcollective.org`): add measured HCl and NaOH and read the meter;
  take mmol as the honest unit.
- Concord Consortium molecular workbench acid base models (known): particles reacting where they meet. Builder:
  open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| + H₃O⁺, + OH⁻ buttons in the panel | Explore: main control, tap the HCl or NaOH dropper bottle over the beaker (each tap one drop of 1 mmol) |
| mmol added (− acid, + base) readout | The drop count on the dropper and the cause line |
| Buffer picker (6 contexts) | Explore: two quiet chips (acetic acid, ammonia); others in Test yourself, log it |
| Buffer amount 5, 10, 20 mmol | Explore: quiet chip (capacity: a bigger beaker holds more HA and A⁻) |
| Amount of each form (HA, A⁻; B, BH⁺) bars | The particles in the beaker |
| pH | The pH meter in the beaker |
| Start over | Start over |
| Ratio for a target pH, pH of a buffer, Buffer capacity, Adding strong acid or base (drill types) | Test yourself "Problems" |
| Drill ids `buffer-drills:<ctx>:<step>`, `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** two beakers side by side on a bench, each with a pH meter probe and display: "Buffer" (HA and A⁻
  drawn as molecules, atoms shown) and "Water" (a few water molecules only). Above them two dropper bottles, HCl and
  NaOH; every drop goes into both beakers at once, so the comparison is always visible.
- **Main control:** tap a dropper bottle: one drop falls into each beaker. In the buffer, the OH⁻ meets an HA and they
  become A⁻ and water where they meet; the meter moves a little. In the water, the OH⁻ stays and the meter jumps.
- **Animates:** drops fall; particles convert in place; the meter needles swing; when the buffer runs out of HA, its
  meter starts jumping too (capacity reached, named on the beaker).
- **Cause line:** "3 drops OH⁻ → 3 HA become A⁻ → ratio 13 : 7 → pH 4.74 → 5.01; water 7.00 → 11.5".
- **Takeaway:** "A buffer holds its pH until one of its two forms runs out."
- **Outside the picture:** purpose line, Show me how, cause line, 2 chips, Start over. About 25 words.

## Science to verify
- Henderson Hasselbalch pH = pKa + log([A⁻]/[HA]) (equations sheet); exact pH for water with strong acid or base in
  the stated volume.
- Ka and Kb of each buffer (CRC, NIST): acetic 1.8 × 10⁻⁵, formic 1.8 × 10⁻⁴, hypochlorous about 3 × 10⁻⁸,
  H₂PO₄⁻ pKa2 7.2, ammonia Kb 1.8 × 10⁻⁵, methylamine Kb about 4.4 × 10⁻⁴ (check each).
- The equation fails near one form exhausted: draw exact pH there, not the formula.
- Trap: logs only after topic 5.3 (authoring guide: nothing used before it is taught); the tool is unit 8, so fine,
  but say it. No OpenStax.

## Reuse
`ApChemTools.studioKit2` (Problems part); `window.ApChemBeaker` (it was written for the buffer tool: pH readout,
particles that convert in place). Kit: `K.tap`, `K.cue`, `K.cause`. Not the first AP® Chemistry tool on kit2.

## Risks reviewers will likely block on
- Two beakers at 360 px: each still large enough for 20 particles and a readable meter (11 px digits minimum).
- The meter number, the particles and the cause line agree on every drop frame.
- Fast repeated taps: drops queue, never skip a state.
- Ion charges (H₃O⁺, A⁻) must not wrap inside a pill.
