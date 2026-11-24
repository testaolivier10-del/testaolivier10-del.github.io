# Plan: AP® Calculus BC, Parametric motion

## Tool and page
`calculus-bc/tools/parametric-motion.html`; scripts `calculus-bc/assets/tools/parametric-motion.js`,
`calculus-bc/assets/tools/math/parametric-motion.js` (`ApCalcMath.parametricMotion`), `parametric-motion.css`; data
`calculus-bc/assets/tool-data/parametric-motion.json`. **Premium.** Rollout row 110, group G, wave 18, marked restyle
(control on the picture; time slider in the panel; three overlays).

## The one idea (two tabs)
1. **Velocity on a path:** the velocity vector ⟨x′(t), y′(t)⟩ points along the path; its length is the speed and its
   slope is dy/dx.
2. **Distance travelled:** the distance along the path is the area under the speed graph.

## Research
- GeoGebra parametric particle applets (https://www.geogebra.org, search "parametric velocity vector"): a particle
  with its vector. Take: the vector drawn on the moving thing, with its x and y legs.
- Desmos parametric with a t slider (https://www.desmos.com/calculator): exact; control beside. Leave the slider.
- PhET "Ladybug Motion 2D" (https://phet.colorado.edu/en/simulations/ladybug-motion-2d): a bug you drag, velocity
  and acceleration arrows on it. Take: arrows on a real creature, toggles kept quiet.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Paths: ellipse, loop, eight, wheel (cycloid), drift (velocity given) | path picker beside "Show me how" |
| Play (cue key `apcalcbc-parametric-motion-play`) | "Run" (secondary) |
| Drag the particle along its path; drag time on the speed graph; time slider | main control: the drone (`K.handle` on the path, picking the nearest t on the current pass); time on the speed graph via `K.scrub` in tab 2; the slider goes |
| Velocity vector (blue) with dashed x and y legs | kept; the legs become thin solid lines |
| Acceleration vector (green), tangent line (vermillion), each switch off | the acceleration as a quiet toggle on the picture; the tangent line always drawn thin in tab 1 |
| Remembered overlays and path (`apcalcbc_parametric-motion_show`, `_path` in localStorage) | kept (the toggle and the path) |
| Vertical and horizontal tangents and stops marked on the path | kept, named only when reached |
| Velocity given: the path builds from its starting point | kept for the drift path |
| Test yourself: drill (contexts slope, second, length, vector, position, plane); record ids `parametric-motion:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** seen from above, a small drone flying over a park on the exact grid; its path drawn as a light trail;
  the wheel path is a pebble stuck in a rolling bicycle tyre (the cycloid). Tab 2 adds the speed graph under the map,
  its area filling as the drone flies, and a trip meter on the drone.
- **Main control:** the drone; arrows step t.
- **Animates:** the drone banks to face its velocity; the vector arrows grow and turn; at a stop the drone hovers and
  the arrow shrinks to a dot labelled "stop"; tab 2's area fills.
- **Cause line:** tab 1 "x′ = 2, y′ = −1 → slope dy/dx = −0.5 → speed 2.24"; tab 2 "area under speed from 0 to 2 =
  5.1 → distance 5.1".
- **Takeaway:** "Distance is ∫ speed dt, not the change in position."
- **Outside:** 2 tabs, purpose line, path picker, Show me how, cause line, Run: 4 controls, about 22 words.

## Science to verify
dy/dx = (dy/dt)/(dx/dt) with dx/dt ≠ 0; d²y/dx² = (d/dt(dy/dx))/(dx/dt); speed √(x′² + y′²); arc length ∫ speed dt;
position adds its initial value; vectors ⟨ , ⟩ notation; vertical tangent where x′ = 0 and y′ ≠ 0 (CED 9.1 to 9.6;
`docs/apcalcbc-authoring-guide.md` notation; OpenStax Calculus Volume 3 §1.2 and Volume 2 §7.2). Speed is never
|dy/dx|.

## Reuse
`ApCalcTools.studioKit2` (AB's) with `"kit2": true` in `calculus-bc/data/pages.json`; `K.handle`, `K.scrub`,
`K.tabs`, `K.cause`; the car idea from AB Motion lab (`calc-motion-lab.md`) as a drone. BC never copies AB code. AB's
build byte-identical (`build-apcalc --check`), then `build-apcalcbc --check`.

## Risks reviewers will likely block on
- Dragging the drone where the path crosses itself (loop, eight) must stay on the current pass.
- Arrow labels (v, a) and the tangent label at 360 px: two labels at most on the drone.
- Hover at a stop: the cause line must not divide by zero (say "stopped: no slope").
- The trip meter from the drawn area at every frame.
