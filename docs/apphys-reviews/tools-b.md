# AP® Physics 1 trainers review B: torque-balance, rotation-lab, oscillator-lab, fluids-tank, lab-design

Independent reviewer, 2026-10-12, branch `claude/apphys`. Rules: `docs/apphys-briefs/review-common.md`;
bar: `docs/apphys-briefs/tools-common.md`. No git changes. The scratch build, server and scripts are in the
session scratchpad (`tools-b/`), not in the repo.

## What was checked

1. **Every drill key, recomputed independently.** I wrote one scratch script (`tools-b/recheck.mjs`) that
   reads each problem the way the student sees it. It parses the stem text (and for fluids, the numbers in
   the order the stem prints them) and recomputes every numeric key and every choice key from first
   principles. It does not use the tool's validator or the generator's intermediate values. It also confirms
   that each given value appears in the stem, and that every authored mistake grades wrong through the runtime
   grader (`ApPhysMath.diagnose`). 300 seeds for every context and problem kind:

   | Tool | Kinds | Key checks | Disagreements |
   |---|---|---|---|
   | torque-balance | torque, balance, support, alpha, inertia | 5 × 300 problems | 0 |
   | rotation-lab | race, speed, stool, orbit, ellipse (and printed v_p, r_a consistent with E conservation to 0.2%) | 5 × 300 | 0 |
   | oscillator-lab | period (spring and pendulum), change (factor option checked numerically), points, energy, graph | 5 × 300 | 0 |
   | fluids-tank | density, buoyant, float, apparent, pressure, continuity, bernoulli (P₂ > 0 checked), hole | 8 × 300 | 0 |
   | lab-design | ramp, spring, atwood, pulley, pendulum, buoyancy: my own linearization and least squares from the table rows, then the target | 6 × 300 | 0 |

   In total that is 32,400 step keys, with 0 wrong keys and 0 authored mistakes that would grade right. The
   one script flag is an observation, not a bug. In lab-design spring seed 54, the seeded noise makes the
   slope-derived k 11% off the hidden true k. The key is the k from the data's own best-fit line, so the
   grading is consistent. Realistic scatter is the point of that tool.
   I also read every error-analysis scenario in lab-design against the physics: ramp zero and calibration,
   pendulum (top of bob, 45° release giving about 4% on T and 8% on T², 9 swings over 10 giving 19% on T²),
   spring (offset, elastic limit, 5% read), atwood (constant friction leaves the slope alone, a 3% detector
   error, the hanger), pulley (rim radius, detector, axle friction), buoyancy (zero offset, small D, rising
   level). All are correct.
2. **As a student, in a browser.** I built a scratch site with every unit published, served it with the
   repo's `assets/` and `physics/assets/` linked in, and drove it in Playwright (chromium 1194). I looked at
   every screenshot.
   - Explore: every scene at 1280 and 360 px, in light and dark mode. No horizontal scroll, and no console
     errors other than offline analytics and the service-worker 404 that comes from the scratch server.
   - Keyboard: every in-scene slider (fulcrum, masses, cart, dumbbells) moves with the arrow keys and
     reports `aria-valuenow`. About 18 to 22 controls are reached by Tab. Fluids has no in-scene keyboard
     handle, but every drag has a dock slider equivalent.
   - Touch emulation (CDP touch events at 360 px): dragging a mass, the cart, a dumbbell and the fluids object
     works, and the page does not scroll.
   - Reduced motion: the primary action jumps to the `loop` end state ("Tipped counterclockwise (α = 7.02
     rad/s²)", "Sphere wins, hoop is last"), and fluids snaps to its settled state.
   - Drills: 74 seeded problems in total, at 1280 and at 360. Each one was regenerated from the page's own
     problem code. The first try entered an authored mistake (the named feedback appeared in every case), then
     every step was answered with the key, clicking the label as a student would at 360. Every step grades
     Correct, and the worked solution and the Keep going strip appear. One figure per context and kind was
     screenshotted and inspected.
3. **Against the bar.** I compared the tools with `chem/tools/titration-curve-reader.html` and body-map,
   looking at the same frame, Start here cue, Why?, Details sheet, pills and Keep going. All five follow the
   Tool Studio pattern, and their scenes are real objects: brass slotted weights, a knife-edge stand, a
   ramp, a stool, a satellite with panels, a spring coil, a cart with wheels, a tank with a scale, gauges on a
   pipe, a motion detector.

## Found and fixed

| # | Tool, file | Problem | Fix |
|---|---|---|---|
| F1 | torque-balance, `torque-balance.js` `massArt` | Drill figures: the labels "0.50 kg" and "0.20 kg" were wider than the brass body and spilled over its edges (balance-stick and inertia-race figures). | The body now grows to fit its label. |
| F2 | torque-balance, `torque-balance.js` race scene | At 360 px the inertia race was small: the wheels were far apart, the drawn drop was tall, and the K/K_rot key overlapped wheel B's bar. A landed weight also sank into the floor, and the "drop" dimension spanned the weight's body rather than the distance it falls. | On phones, a shorter drawn drop and closer wheels let the picture fill the stage width (about 1.5× larger). The floor now sits a weight's height below the fall, the dimension line covers exactly the 0.80 m fall, and the key is moved clear. Desktop is unchanged except that the floor and dimension are now correct there too. |
| F3 | rotation-lab, `rotation-lab.js` orbit scene | At 360 px the K/U/E columns were drawn on top of the orbit and Earth, and the orbit used the fixed frame for the widest orbit, so it was small. | On phones the columns get their own strip at the right, and the frame fits this orbit's own turning points (it changes only when the launch speed does). The "closest" and "farthest" labels sit inside the orbit on a phone so they are not clipped. Desktop is unchanged. |
| F4 | oscillator-lab, `oscillator-lab.js` and `.css` | At 360 px the scene's labels were 4 to 6 px tall: the cart label, ±A, "x = 0", "unstretched", "mg/k", "equilibrium" and "ℓ". The vertical spring and pendulum had 70 px of height, and the energy bars were 200 units tall, so their labels shrank. | The horizontal spring is cropped to its real reach, and the scene's labels are set larger on phones. A style is used because the `.ol-tm` class size beat the SVG attribute that tried before. The energy bars are shorter on phones, and the picture gets more of the stage while the graph is kept compact. |
| F5 | oscillator-lab, `oscillator-lab.js` drill figure | Spring figure at a fixed 1100 px/m: for A = 0.20 m (energy drill) the +A line and the cart were drawn outside the 520 px frame. | The scale is capped at 160/A, so everything fits up to A = 0.20 m. |
| F6 | fluids-tank, `fluids-tank.js` float scene | The scene declared "Floats" while the readout said F_b 4.88 N against F_g 4.90 N, because the damped bob stopped just short of the analytic rest depth. | When the motion is still, the scene snaps to `sim.end()`, so a floater shows F_b = F_g exactly (4.90 = 4.90 N). |
| F7 | fluids-tank, `fluids-tank.js` density figure | The balance face read "68 g" while the stem gave 67.7 g. | The face shows the stem's 3 significant figures. |
| F8 | lab-design, `lab-design.js` | The slope pill had no unit, and off-best plots wrote "(m)/(s)". | The pill shows the unit, and simple units are written m/s (compound ones keep their parentheses). |
| F9 | torque-balance, `math/torque-balance.js` support drill, "which" explanations | The right-answer text said "the load's lever arm is longer, so the left support must supply the larger torque", which garbles the argument. | Rewritten: take torques about the far support; the load sits far from it, so its torque is large; the near support (lever arm L) balances it; the forces add to the weight. Also "turns up" is now "spins up". |
| F10 | oscillator-lab, `math/oscillator-lab.js` change drill | The square-root distractor feedback read "changes by √(1/4), not one quarter times". | Now: "The period goes as a square root: it changes by × 1/2, not by the same factor as the mass on the spring." |

No key changed. Validators and tests after the changes: torque-balance 6/6, rotation-lab 6/6, oscillator-lab
6/6, fluids-tank 7/7, lab-design 8/8 pass. `check-apphys-content` reports tools 0 failing, and
`check-apphys-map` reports nothing used before it is taught. The 9 exam failures in that run are another
builder's work in progress. The independent recheck still shows 0 disagreements, and the drills were
re-driven in the browser after the fixes.

## Scope (CED)

All five tools stay inside scope:
- Rolling is without slipping only, with I given as β m r². Static friction does no work.
- Orbits use E and L conservation and U = −GMm/r. No Kepler's first or second law is taught; escape speed
  appears only as total E = 0 (6.6).
- Fluids are ideal and pipes are full. Torricelli is derived from energy.
- I is never memorized.
- The pendulum's large-angle period is labelled as what the full equation does.
- The drag and added-mass terms in the float simulation only settle the motion; the end state is analytic.

## Open, for a person

- **lab-design drill figure at 1280 px.** The bench drawing sits small in the top-left of a large stage, with
  the data table beside it and the lower half empty. It is legible but sparse next to the titration reader.
  A larger bench, or the bench over the table, would read better. I did not change the layout: it is shared
  with the Explore bench, and I would want the owner's call.
- **torque-balance balance scene at 360 px.** It is readable: masses are 1.5× larger and labels are shown
  every 20 cm. It is still small, because a 1 m stick has to fit 308 px. A zoomed view around the fulcrum
  would help but changes the interaction.
- **rolling-race drill figure.** It shows a 28° angle that is not in the stem. This is harmless (the problem
  gives h), but a student may look for it. Consider removing the angle label.
- The fluids scene has no in-SVG keyboard handle (the dock sliders cover it). This is acceptable per the
  bar, but it is unlike the other four tools.

## Polish (2026-10-13, open items for lab-design, torque-balance, rotation-lab)

Same method (scratch build in the session scratchpad `polish/`, Playwright at 1280 and 360, light and dark,
screenshots looked at). No ids, recording, validators or tests changed: torque-balance 6/6, rotation-lab 6/6,
lab-design 8/8 pass; `check-apphys-content --check`: tools 0 failing.

| Tool | Change | Screenshots (`/tmp/claude-0/-home-claude/1e00213e-3bb5-50fc-a8ac-0b1f2469eb3d/scratchpad/polish/shots/`) |
|---|---|---|
| lab-design | The drill has its own bench picture (`drillBench`), separate from the Explore bench: the experiment drawn large on a lab table (stand setups get the bench, ramp and track setups keep their own table), with a shelf of every instrument in the lab (meterstick, stopwatch, motion detector, spring scale, electronic balance, photogate, protractor; all of them, so it does not hint which the experiment needs). Layout: picture across the top of the stage, data table (and the plot once chosen) beneath. On a phone a compact bench (the Explore drawing) shows instead, so the drawing stays large. | `ldq.png` (all six at 1280 light), `fig-lab-design-pendulum-pendulum-pendulum-1280-dark.png`, `fig-lab-design-*-360-dark.png` |
| rotation-lab | Rolling-race drill figure: the 28° arc and label are gone (the stem gives only h; the angle does not matter). The height is a full dimension (dashed line from the top, end ticks, "h = … m"). The speed drill, which gives θ, still marks it. | `fig-rotation-lab-rolling-race-race--1280-light.png`, `…-360-dark.png` |
| torque-balance | Phone balance scene: the view is cropped to the stick and the band above it (no empty sky above, 22 px trimmed at each side), and the hardware zoom on a phone is 1.75× (was 1.5×): masses, labels, ticks and hooks are larger and the stick spans the card. The hint text moves with the crop. Desktop and the inertia race are unchanged. | `tb-cmp.png` (before, after light, after dark tipped), `tb-1280-light.png`, `tb-360-race.png` |
