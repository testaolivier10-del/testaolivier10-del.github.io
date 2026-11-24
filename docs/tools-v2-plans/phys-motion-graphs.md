# Plan: AP® Physics 1, Motion graphs (tools v2)

**Tool and page:** `physics/tools/motion-graphs.html`; `physics/assets/tools/motion-graphs.js` (703 lines) and
`.css`, `physics/assets/tools/math/motion-graphs.js`, data `physics/data/tools/motion-graphs.json` (targets
`walk-away`, `out-and-back`, `stairs`, `steady-right`, `speed-up-slow-down`, `right-then-left`; contexts `slope`,
`area`, `pick`, `describe`, `turn`, `signs`, `dist`). Free. Rollout row 91, group P, wave 21, size restyle.

**The one idea:** the x, v and a graphs are three views of one motion; the slope of each is the next. Two tabs:
"Drive it" (drag the cart, the three graphs draw live) and "Set v and a" (set the starting velocity and the
acceleration; the motion and its graphs follow).

## Research
- PhET The Moving Man (known, group row): drag the man, position, velocity and acceleration plot live; take the
  three stacked graphs with one time cursor.
- Vernier motion detector labs (known): a real detector at the end of a track; take the detector drawn in the scene.
- Desmos activities on matching position graphs (known): matching is a challenge (Test yourself here). Builder:
  open the first two.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Drive modes Drag, Match, Set v and a | Tabs Drive it, Set v and a; Match is Test yourself "Match the graph" (ids `motion-graphs:match:<target>`), log it |
| Drag the cart (pointer and arrow keys) | Drive it: main control |
| Example run, Start over, ▶ Run | Drive it opens with the example run already drawn (graphs never empty); Start over; Run replays |
| Starting velocity, acceleration, start position sliders | Set v and a: K.handle on the cart's velocity arrow (main) and on its acceleration arrow (beside it, same idea); start position quiet |
| Time cursor on the graphs | The kit's scrub on the graphs, the cart follows |
| New target (Match) | Test yourself |
| Drills Velocity from slope, Displacement from area, Pick the a against t graph, Describe the motion, Turning points, Signs of v and a, Distance and displacement; ids `motion-graphs:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a straight track on a bench with a motion detector (ultrasonic sensor drawn as the real device) at the
  left end, a cart with wheels; a soft sonic pulse drawn while it measures. Under it, three stacked graphs (x, v, a)
  sharing one time axis, each in its own colour that matches its arrow on the cart.
- **Main control:** drag the cart. The x graph draws the position, the v graph its slope, the a graph the slope of v,
  live; a time cursor joins the three.
- **Set v and a:** drag the velocity arrow's tip and the acceleration arrow's tip on the cart; the run and all three
  graphs redraw at once; the turning point is named on the x graph when v crosses zero.
- **Cause line:** "v +0.6 m/s, a −0.2 m/s² → slows → turns at 3.0 s → comes back".
- **Takeaway:** "Where x is steepest, v is largest; where v is flat, a is zero."
- **Outside the picture:** 2 tabs, purpose line, Show me how, cause line, Start over.

## Science to verify
- Kinematics with constant acceleration (equations sheet); the live derivative of a hand drag smoothed honestly
  (state the smoothing in "?"; guide: nonuniform acceleration is qualitative only).
- Sign conventions: right is positive; "slowing down" when v and a have opposite signs (CED 1.x).
- Detector range realistic (0.15 to 6 m for a classroom sensor, known). No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.drag` (cart along the
track), `K.handle` (arrow tips), `K.scrub`, `K.player`, `K.cue`, `K.cause`. A Test yourself part for Match and one
for Problems.

## Risks reviewers will likely block on
- Three graphs plus the scene at 360 px: graphs may be short but tick labels 11 px; the cart stays the biggest thing.
- The v and a traces from a hand drag must not be noisy spikes (smoothing) and must agree with the arrows.
- Perf: live plotting at x4 throttle; append to paths, no rebuilds.
- Arrow keys hold to drive must not scroll the page.
