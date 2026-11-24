# Plan: AP® Physics 1, Rotation lab (tools v2)

**Tool and page:** `physics/tools/rotation-lab.html`; `physics/assets/tools/rotation-lab.js` (448 lines) and `.css`,
`physics/assets/tools/math/rotation-lab.js`, data `physics/data/tools/rotation-lab.json` (contexts `rolling-race`,
`rolling-ramp`, `spinning-stool`, `circular-orbit`, `elliptical-orbit`). Premium. Rollout row 92, group P, wave 21,
size rebuild (nothing to change today, only Race; three unrelated scenes). Must stay a different screen from Torque
balance's Inertia tab (that one is a string and falling mass; this one is rolling).

**The one idea:** how the mass is spread decides how fast a rolling object gets down a ramp. Tabs, one idea each:
"Rolling race" (mass near the rim turns more energy into spin and loses), "Spinning stool" (pull the arms in, I
drops, the spin speeds up: L is kept), "Orbit" (a planet speeds up near the star: L is kept).

## Research
- PhET (known, group row): no rolling race sim; PhET Ladybug Revolution for ω and the "Torque" legacy sim for I.
  Take the instant response rule only.
- The hoop, disk and sphere race and the spinning stool with dumbbells (classic demos, known): the real objects to
  draw. Builder: open a video of each for the motion.
- PhET Gravity and Orbits (known): drag the planet's velocity arrow; take that handle for the Orbit tab.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Rolling race: racers picker (hoop, disk, sphere, sliding block), ramp angle, Race | Rolling race: main control, drag the weights on a "build your own" wheel between hub and rim; the race against a fixed disk runs on release; racer chips (hoop, disk, sphere, sliding block) quiet; ramp angle quiet |
| Energy shares (translational vs rotational) | Two small liquid tubes per racer on the picture |
| Spinning stool: Dumbbells from the axis slider, drag a dumbbell, Arms out, Spin | Spinning stool: main control, drag a dumbbell in or out; the spin answers at once |
| Orbit: launch speed (× circular speed), Launch; circular vs elliptical | Orbit: main control, drag the planet's velocity arrow; quiet "circular" snap |
| Reset | Start over |
| Drills Rolling race, Rolling down a ramp, Spinning stool, Circular orbit, Elliptical orbit; ids `rotation-lab:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture (race):** a wooden ramp with lanes, a solid disk racer and a "build your own" wheel (a rim, spokes and two
  brass weights that slide on the spokes); finish line and a lap timer.
- **Main control:** drag the weights toward the hub or the rim; on release both wheels roll; the build your own wheel
  wins with weights at the hub and loses with them at the rim; tubes show the split of K into rolling and spinning.
- **Stool:** a student on a stool holding dumbbells, spinning; drag a dumbbell in, the spin speeds up, an L arrow
  around the axis stays the same length.
- **Orbit:** a star and a planet with its velocity arrow; equal time marks on the path bunch up far from the star.
- **Cause line (race):** "weights at the rim → I 0.9 mr² → more K into spin → slower down the ramp".
- **Takeaway:** "Mass far from the axis is harder to spin, so it rolls down slower."
- **Outside the picture:** 3 tabs, purpose line, Show me how, cause line.

## Science to verify
- Rolling without slipping a = g sinθ / (1 + I/(mr²)); hoop 1, disk ½, sphere ⅖ (given, never memorized: guide
  exclusion); v = rω (CED 6.5).
- L = Iω conserved on the stool; K rises (work by the arms) (CED 6.4).
- Orbit: angular momentum about the star conserved; Kepler's first and second laws are excluded as named laws
  (guide), so the tab says "L is kept", not "Kepler". No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.drag` (weights along
the spokes, dumbbells), `K.handle` (orbit arrow), `K.player`, `K.cue`, `K.cause`. Liquid tube energy art shared with
the Energy bar charts plan.

## Risks reviewers will likely block on
- Weights on a rolling wheel must be dragged only while it is still (or the drag pauses the race).
- Race outcome, timer and cause line agree with the drawn positions every frame.
- The student on the stool at 360 px: dumbbell targets 44 px while spinning (pause on touch).
- Three different scenes: each gets its own sweep landmarks and its own cue.
