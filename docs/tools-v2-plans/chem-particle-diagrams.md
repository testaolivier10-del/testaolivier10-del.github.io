# Plan: AP® Chemistry, Particle diagrams (tools v2)

**Tool and page:** `chem/tools/particle-diagrams.html`; `chem/assets/tools/particle-diagrams.js` (255 lines), data
`chem/data/tools/particle-diagrams.json` (contexts `ions-in-water`, `limiting-reactant`, `equilibrium-counts`,
`acid-strength`). Free. Rollout row 37, group B, wave 5, size rework (12 +/− controls in the panel, Check on landing).

**The one idea:** a reaction rearranges the same atoms, particle by particle. Tabs, one idea each: "React" (atoms are
conserved; the reactant that runs out first limits the product), "Dissolve" (an ionic solid splits into its ions in
the right ratio), "Acids" (a strong acid ionizes fully, a weak acid mostly stays together).

## Research
- PhET Reactants, Products and Leftovers (known, group row): choose reactant counts, see products and leftovers at
  once; take the before and after boxes.
- [AACT particle diagram resources](https://teachchemistry.org) (known): conventions for drawing ions with water.
- PhET Molecule Shapes and Build a Molecule (known, group row): grab a particle and drop it. Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Build it mode: tap or drag particles into the after box; +/− per kind; Empty the box; Check my box; Show the answer; New problem | Test yourself "Build the after box", same grading |
| Pick the picture mode | Test yourself "Pick the picture" |
| Atom tally | Explore: atom counts on the box rim (from the drawn atoms); Test yourself keeps the tally |
| Contexts: ions in water, limiting reactant, equilibrium counts, acid strength | Explore tabs: React, Dissolve, Acids; equilibrium counts in Test yourself only (it is the Q vs K tool's idea), log it |
| Drill ids `particle-diagrams:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself, unchanged |

## Design
- **Picture (React):** two sealed glass boxes on a bench joined by a reaction arrow: "Before" and "After". Molecules
  drawn with atoms (ApChemMath templates: H₂, O₂, H₂O, N₂, NH₃). A tray of reactant molecules under "Before".
- **Main control:** drag a molecule from the tray into "Before" (or out). "After" rebuilds at once: atoms from each
  reactant molecule fly across and rearrange into products; leftovers stay as they were, tinted "left over".
- **Dissolve:** drag a crystal (NaCl, CaCl₂) into a water box; it breaks into ions, each surrounded by oriented
  water molecules, in the 1 : 1 or 1 : 2 ratio. **Acids:** drop HCl or HF; HCl splits into H₃O⁺ and Cl⁻ fully, HF
  mostly stays as molecules.
- **Cause line:** "4 H₂ + 3 O₂ → 4 H₂O, 1 O₂ left over → H₂ ran out first".
- **Takeaway:** "Count atoms: the same atoms are on both sides, only the partners change."
- **Outside the picture:** 3 tabs, purpose line, Show me how, cause line, Empty the box.

## Science to verify
- Each reaction's balanced equation and limiting reactant from the drawn counts (code check).
- Ion ratios and hydration orientation (O of water toward cations, H toward anions) (CED 3.10, 1.x conventions).
- HF is weak (Ka about 6.8 × 10⁻⁴), HCl strong; how many HF to draw ionized at the drawn count must be honest
  (likely zero or one of ten: say "about").
- Trap: no ion pairs drawn for strong electrolytes; no molecules of NaCl in water. No OpenStax.

## Reuse
`ApChemTools.studioKit2` with parts; `ApChemMath.particles` templates. Kit: `K.tabs`, `K.drag` (or the new `K.draw`
if it lands first for drag and drop with snapping), `K.cue`, `K.cause`. Not the first AP® Chemistry tool on kit2.

## Risks reviewers will likely block on
- Atoms flying across must count where they are drawn (the rim tally reads the drawn atoms).
- Water molecules around ions crowd the box at 360 px: keep counts low (6 to 8 ions).
- The tray item under the finger must be the one picked (elementFromPoint).
- Leftover tint must not be the only cue (a small pill "left over").
