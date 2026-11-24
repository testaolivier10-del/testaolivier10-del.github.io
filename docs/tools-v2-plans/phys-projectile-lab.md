# Plan: AP® Physics 1, Projectile lab (tools v2)

**Tool and page:** `physics/tools/projectile-lab.html`; `physics/assets/tools/projectile-lab.js` (600 lines) and
`.css`, `physics/assets/tools/math/projectile-lab.js`, data `physics/data/tools/projectile-lab.json` (contexts
`components`, `flight`, `range`, `maxh`, `first`, `vxconst`, `relative`; g 9.8, 10 accepted). Premium. Rollout row
90, group P, wave 21, size rework.

**The one idea:** horizontal and vertical motion are independent: the horizontal speed stays, the vertical speed
changes by g each second. Tabs, one idea each: "Launch" (one ball, its shadows on the ground and on a wall), "Drop
and throw" (a dropped and a thrown ball land together), "Moving cart" (a ball shot straight up from a moving cart
lands back in it).

## Research
- PhET Projectile Motion (known, group row; `phet.colorado.edu/en/simulations/projectile-motion`): drag the cannon's
  barrel, the trajectory and a time marker; take the barrel as the handle.
- The Physics Classroom projectile simulator (known): horizontal and vertical components as separate arrows.
- The monkey and hunter and ball from a cart classroom demos (known). Builder: open the first two.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Views One ball, Compare, Moving cart | Tabs Launch, Drop and throw, Moving cart |
| Drag the barrel (angle), cliff height drag; Launch angle, Launch speed, Launch height sliders | Launch: main control drag the barrel (angle and speed by distance); quiet cliff handle; sliders gone, log it |
| From the ground / From the cart | Launch: the cliff at zero height is the ground |
| Launch button; Read the flight at time t | Instant: the whole path drawn at once as strobe images; time bar and Watch it |
| Keep as A (ghost of a previous shot) | The "before" tick on the barrel only (no ghost paths), log it |
| Cart speed, launch speed straight up from the cart | Moving cart tab: main control cart speed; quiet launch speed |
| Velocity components (v, v_x, v_y), g picker | Arrows on the ball at the time bar (whole v plus its x and y shadows' velocities); g in ⋯ |
| Drills Components, Horizontal launch, Time of flight and range, Maximum height, Which lands first?, The horizontal velocity stays the same, Seen from a moving cart; ids `projectile-lab:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a cannon on a cliff over a meadow, a brick wall at the left: the ball's shadow slides along the ground
  at constant speed (evenly spaced strobe marks) while its shadow on the wall falls with growing gaps; the strobe
  images of the ball sit at their equal time steps.
- **Main control:** drag the barrel. The path, both shadows and the landing flag update at once.
- **Drop and throw:** two balls leave the cliff at the same moment, one dropped, one thrown; their strobe images line
  up level each step. **Moving cart:** a cart on rails fires a ball straight up; seen from the ground the path is a
  parabola, and the ball lands back in the cart.
- **Cause line:** "v_x 8.0 m/s every second, v_y −9.8 m/s each second → 2.3 s in the air → lands 18 m out".
- **Takeaway:** "The ground shadow never speeds up; only the falling one does."
- **Outside the picture:** 3 tabs, purpose line, Show me how, time bar, cause line.

## Science to verify
- x = x₀ + v_x t, y = y₀ + v_y t − ½gt² (equations sheet); no air resistance (say so in "?").
- Strobe spacing at equal times; time of flight from a cliff by the quadratic (computed, not asked in Explore).
- Relative velocity in one dimension only (guide exclusion: no 2D relative velocity): the cart tab stays 1D in
  the horizontal. g stated. No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.handle` (barrel tip),
`K.drag`, `K.scrub`, `K.player`, `K.cue`, `K.cause`. `phys-scene.js` vectors.

## Risks reviewers will likely block on
- Long range shots must fit the stage at 360 px (camera zooms out smoothly, labels keep 11 px).
- Strobe images must be at true equal times (measure spacing).
- Velocity arrows on the ball proportional at every time bar position.
- The barrel handle must not cover the cannon or the ball at launch.
