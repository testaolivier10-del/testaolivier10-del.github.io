# Plan: AP® Physics 1, Torque balance (tools v2)

**Tool and page:** `physics/tools/torque-balance.html`; `physics/assets/tools/torque-balance.js` (577 lines) and
`.css`, `physics/assets/tools/math/torque-balance.js`, data `physics/data/tools/torque-balance.json` (contexts
`torque-angle`, `balance-stick`, `support-plank`, `rod-release`, `inertia-race`). Premium. Rollout row 75, group P,
wave 17, size restyle (the simplest physics tool; a good first tool to add the physics adapter if it starts first).

**The one idea:** torque is force times its distance from the pivot; equal and opposite torques balance. Tabs, one
idea each: "Balance" (masses on a meter stick), "Angle" (only the perpendicular part of a pull turns), "Inertia"
(the same mass farther out turns more slowly).

## Research
- PhET Balancing Act (known, group row; `phet.colorado.edu/en/simulations/balancing-act`): drag bricks onto a plank,
  remove supports, it tips at once; take the instant tip and the distance marks.
- The Physics Classroom torque and balance pages (known). Builder: open both.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Drag a mass along the stick; hang 100, 200, 500 g; Where to hang a mass; Remove every mass | Balance: main control (drag masses); a quiet mass tray at the end of the bench |
| Hold level, Release | Balance: a quiet "hands" toggle; with hands off the stick tips at once (instant), no Release step |
| Fulcrum position | Balance: quiet handle on the fulcrum |
| Support forces | Balance: the support arrow on the fulcrum (labelled) |
| Pull F_A, its angle, where it acts | Angle tab: drag the pull arrow's tip (size and direction), main control |
| Inertia race (wheel A and B sliders from the axle, Race) | Inertia tab: drag the sliders on wheel B; the race starts on release |
| Reset | Start over |
| Drills Torque with an angle, balance, support plank, rod release, inertia race; ids `torque-balance:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a wooden meter stick on a triangular fulcrum on a lab bench, brass hanging masses on hooks, distance
  marks every 10 cm; each mass has a torque arrow curling around the pivot sized by its torque.
- **Main control:** drag a mass along the stick; the stick tilts to the side that wins (smoothly, with a stop at the
  bench), the curl arrows resize.
- **Angle:** a spring scale pulls the stick at an angle; the force stays one whole arrow (no components drawn, guide
  rule) and the lever arm r⊥ is a thin solid line from the pivot to the force's line, which shortens as the angle
  closes.
- **Inertia:** two wheels with sliding weights on spokes, each wound with a string and a falling mass.
- **Cause line:** "200 g at 30 cm → 0.59 N·m ⟲ vs 0.49 N·m ⟳ → tips left".
- **Takeaway:** "Twice the distance, half the mass, same torque."
- **Outside the picture:** 3 tabs, purpose line, Show me how, cause line.

## Science to verify
- τ = rF sinθ, Στ = Iα, I = Σmr² for point masses (equations sheet); only clockwise or counterclockwise (guide
  exclusion: no right hand rule).
- Torque diagrams draw forces at their point of application (guide FBD section for rotation).
- Inertia race times from the model (string, falling mass) against a hand calculation. g stated. No OpenStax.

## Reuse
`ApPhysTools.studioKit2`: if this tool is built before Free body diagrams, it adds the adapter (see that plan's
Reuse). Kit: `K.tabs`, `K.drag` along the stick (`track`), `K.handle` (pull tip), `K.tap`, `K.cue`, `K.cause`.

## Risks reviewers will likely block on
- Masses must ride the tilted stick exactly (no floating) during a tilt.
- Curl arrow sizes proportional to torque; tilt direction always agrees with the cause line.
- Distance labels and mass labels 4 px apart at 360 px.
- The lever arm line must not read as a ghost or a second stick (solid thin line, labelled "lever arm").
