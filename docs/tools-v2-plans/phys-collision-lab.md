# Plan: AP® Physics 1, Collision lab (tools v2)

**Tool and page:** `physics/tools/collision-lab.html`; `physics/assets/tools/collision-lab.js` (406 lines) and
`.css`, `physics/assets/tools/math/collision-lab.js`, data `physics/data/tools/collision-lab.json` (contexts
`momentum`, `impulse`, `conservation`, `collisions`). Premium. Rollout row 77, group P, wave 17, size rework.

**The one idea:** the total momentum is the same before and after every collision; kinetic energy is not always.
Tabs, one idea each: "Collide" (two carts, sticky or bouncy bumpers), "Explode" (carts pushed apart from rest:
momenta equal and opposite), "Impulse" (a stiffer bumper: shorter, bigger force, same area under F against t).

## Research
- PhET Collision Lab (known, group row; `phet.colorado.edu/en/simulations/collision-lab`): drag the balls' velocity
  arrows, momentum vectors live; take velocity arrows as handles.
- Pivot Interactives cart collisions (known): real air track footage; take the air track and the photogate look.
- The Physics Classroom momentum pages (known). Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Drag a cart; velocity of A and B sliders | Collide: main control, drag each cart's velocity arrow tip (K.handle) |
| Mass of A and B sliders | Collide: quiet mass blocks stacked on each cart (tap to add or remove) |
| Bounce e slider (0 sticky Velcro to 1 elastic spring) | Collide: quiet tap on the bumper to swap Velcro, rubber, spring (e 0, 0.5, 1) |
| Crash, Reset, Time slider | Instant: the after state drawn as soon as an arrow is set; time bar and Watch it; Start over |
| Collision / Explosion mode; energy stored in the spring | Explode tab, main control the spring compression |
| Bumper stiffness k; F vs t view | Impulse tab, main control k |
| p and K bars; center of mass | Bars as momentum arrows on the carts plus one total arrow; KE bars to the Impulse tab and "?"; centre of mass as a small marker on the track (quiet) |
| Drills Momentum bar charts, Find a final velocity, Sticky collision, Is KE conserved?, Momentum or energy?, Explosion, Impulse from a graph; ids `collision-lab:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** an aluminium air track on a bench with two gliders (cart A red, cart B blue), bumpers at their faces,
  brass mass blocks on top; above each cart its velocity arrow (handle) and its momentum arrow; a total momentum
  arrow above the track that does not change length through the collision.
- **Main control:** drag a velocity arrow. The after state appears at once as the carts' new arrows (Watch it plays
  the run); the total arrow stays the same.
- **Animates:** the run, bumpers squashing at contact, Velcro sticking, the F against t curve drawing in the
  Impulse tab during contact.
- **Cause line:** "p before 1.2 kg·m/s → sticky → both move at 0.40 m/s → p after 1.2, K lost 0.36 J".
- **Takeaway:** "Momentum is always kept; only an elastic bounce keeps kinetic energy too."
- **Outside the picture:** 3 tabs, purpose line, Show me how, time bar, cause line.

## Science to verify
- Conservation of momentum, coefficient of restitution e, perfectly inelastic final velocity; J = FΔt = Δp
  (equations sheet). Two final velocities of an elastic collision are shown, never asked (guide exclusion:
  simultaneous equations).
- Air track mass and speed ranges plausible. No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.handle` (arrow tips),
`K.tap`, `K.scrub`, `K.player`, `K.cue`, `K.cause`. `phys-scene.js` vectors.

## Risks reviewers will likely block on
- Arrow lengths proportional to v and p in every frame, including during contact.
- Carts must not pass through each other at high speeds (contact detection per frame).
- Arrow tips as handles on touch: 44 px targets even for a short arrow (a minimum knob).
- At 360 px the two momentum arrows and the total must not overlap labels.
