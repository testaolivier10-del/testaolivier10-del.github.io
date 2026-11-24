# Plan: AP® Chemistry, Q vs K (tools v2)

**Tool and page:** `chem/tools/q-vs-k.html`; `chem/assets/tools/q-vs-k.js` (208 lines), data
`chem/data/tools/q-vs-k.json` (contexts `hydrogen-iodide`, `ammonia`, `sulfur-trioxide`, `calcium-carbonate`,
`silver-chloride`, `particles-ab`, `particles-dimer`; part topic `just`). Premium. Rollout row 107, group P, wave
12, size rework. Overlaps Equilibrium and kinetics and ICE tables: here the idea is only the comparison and its
direction.

**The one idea:** compare Q with K to see which way the reaction runs: Q < K forward, Q > K backward, Q = K no net
change. One screen.

## Research
- PhET Reversible Reactions (known, group row): add particles and watch them convert; take adding particles by hand.
- [AACT classroom resources on equilibrium](https://teachchemistry.org) (known): particle diagrams with Q and K
  counted; take counting Q from the drawn particles.
- ChemCollective equilibrium labs (known). Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| +/− one particle per species (panel) | Explore: main control, drag particles from a tray into the flask or out of it (a tap adds one too) |
| Let it react | Gone as a step: the flask reacts as soon as a particle is dropped (instant); "Watch it" replays |
| Volume of the vessel slider | Explore: quiet piston handle |
| Reaction picker (7) | Explore: two quiet chips (A + B ⇌ AB particles, CaCO₃ with its solid); the rest in Test yourself, log it |
| Views: Concentrations and pressures, Particle pictures | Explore: the particle picture; concentrations to "?" |
| New mixture | Test yourself |
| Drill ids `q-vs-k:<ctx>:<step>` (incl. `just`), `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a stoppered flask with drawn particles (A red, B blue, AB joined pairs) beside a small tray of spare
  particles; on the flask's neck a Q gauge (log scale) with the K notch, the needle at Q; an arrow over the reaction
  sign that points the way it will run, thick when far from K.
- **Main control:** drag a particle into the flask. Q jumps (the needle), the direction arrow swings, and the
  reaction runs that way at once: pairs form or split where they are until the needle reaches the notch.
- **The CaCO₃ chip:** a lump of solid at the bottom; dragging more solid in leaves Q unchanged (only the gas counts),
  the needle does not move and the cause line says so.
- **Animates:** particles fall in, join or split, the needle glides, the arrow fades as Q reaches K.
- **Cause line:** "added 3 B → Q 0.8 < K 4 → runs forward → AB forms until Q = K".
- **Takeaway:** "The reaction always runs toward Q = K."
- **Outside the picture:** purpose line, Show me how, 2 chips, cause line, Start over.

## Science to verify
- Q from the drawn counts with the stated per particle concentration; pure solids and liquids left out of Q and K
  (CED 7.3, 7.4); K values for HI, NH₃, SO₃, CaCO₃ (Kp = P_CO₂), AgCl Ksp (CRC, NIST).
- Volume change: Q changes by the gas mole difference; check the sign for each reaction drawn.
- Trap: Q vs K is the justification, Le Chatelier only the prediction (authoring guide CER). No OpenStax.

## Reuse
`ApChemTools.studioKit2` (Problems part); `window.ApChemBeaker` in `qk` mode (written for this tool). Kit: `K.drag`
or `K.tap`, `K.handle` (piston), `K.player`, `K.cue`, `K.cause`. Share flask art with the ICE and equilibrium plans.

## Risks reviewers will likely block on
- The thing the cue says to drag (a tray particle) must drag where grabbed, on touch too.
- The needle must read Q from the particles drawn in that frame, mid reaction.
- Particles stay inside the flask during a piston drag.
- At 360 px the tray must not cover the flask; put it under the flask.
