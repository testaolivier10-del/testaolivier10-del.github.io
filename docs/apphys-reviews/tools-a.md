# AP® Physics 1 trainers review A: motion-graphs, projectile-lab, free-body-diagrams, energy-bar-charts, collision-lab, scaling-drills

Independent reviewer, 2026-10-12, branch `claude/apphys`. Rules: `docs/apphys-briefs/review-common.md`;
bar: `docs/apphys-briefs/tools-common.md`. No git changes; scratch build and scripts in the session scratchpad
(`tools-a/`), not in the repo.

## What was checked

1. **Every drill key, recomputed independently.** For each tool I wrote a script that parses the problem
   *as the student reads it* (the stem text, or for graph problems the plotted points and the figure parameters)
   and recomputes every numeric key and every choice key from physics, without calling the tool's validator or
   its solver. 150 to 200 seeds per context and problem kind:

   | Tool | Keys rechecked | Disagreements before fixes | After |
   |---|---|---|---|
   | motion-graphs (slope, area, pick, describe, turn, signs, dist) | 2048 | 1 wording bug (see F1) | 0 |
   | projectile-lab (components, flight, range, maxh, first, vxconst, relative) | 3869 | 0 | 0 |
   | free-body-diagrams (11 scenes, numeric step) | 1173 | 12 (F3) | 0 |
   | energy-bar-charts (ke, work, friction, spring, speed, height, power, bars incl. every bar cell) | 5200 | 106 (F4) | 0 |
   | collision-lab (sticky, onefinal, explode, ke, impulse, cm, bars, choose) | 3535 | 5 (F5) | 0 |
   | scaling-drills (factor, combo with my own exponent table; units, convert tables read by hand) | 11700 | 0 (wording F6) | 0 |

   Also read: the named-miss text of every mistake in a sample problem of each kind, the worked solutions, and the
   models' header comments against the physics (constant-acceleration segments, ledger-based energy integration,
   impulse = area, CM at constant velocity, e-based outcomes, FBD solve() for all 11 scenes).
2. **As a student, in a browser.** Scratch build with every unit published, served with the repo's `assets/`
   and `physics/assets/` linked in. Playwright (chromium 1194) at 1280 px and 360 px (touch emulation), light and
   dark, and reduced motion. I looked at every screenshot.
   - Every drill kind of every tool driven end to end in the browser: the problem is regenerated from the
     page's own problem code, the first try is an authored mistake (checks the named feedback appears), then the
     key. Result: every kind renders, every key grades Correct, every authored slip is named, the Keep going strip
     appears after each problem, no console errors, no horizontal scroll, at 1280 light and 360 dark.
   - Free-body drill driven **by keyboard only** (palette, agent select, ←/→ and PageUp/PageDown to aim, ↑/↓ to
     size) for all 11 scenes: a wrong diagram (a "centripetal force" alone) gets the right named notes, the key
     diagram grades Correct, then the law step and the numeric step.
   - Explore: sliders move with arrow keys, the primary button (Launch, Run, Play, Crash) runs and ends in the
     right end state with reduced motion on, every mode tab switches, touch tap works.
3. **Against the bar** (body-map, the AP Chemistry trainers): one Start here cue on landing, progressive reveal,
   drawn objects, both themes, phone layout.

Validators and tests after the changes: all six `node --test scripts/test/apphys-tool-<slug>.test.mjs` pass
(9, 8, 8, 9, 8, 6). `node scripts/check-apphys-content.mjs`: tools 0 failing. `node scripts/check-apphys-map.mjs`:
nothing used before it is taught.

## Found and fixed

| # | Tool, file | Problem | Fix |
|---|---|---|---|
| F1 | motion-graphs, `math/motion-graphs.js` (area) | A v-t graph entirely **below** the axis was treated as "crossing v = 0": the solution said "the graph crosses v = 0, so the cart turns around", asked a distance step, and offered "+7" as the distance-vs-displacement slip. Physically wrong for a cart moving steadily in the − direction. (`cross` compared dist with signed disp.) | `cross` now compares dist with \|disp\|. All-negative graphs get the average-velocity step, and a named slip for the dropped minus sign. Stem reworded ("Use the area under the graph between ...") since "how far it moves" also read as distance when the key is a signed displacement. |
| F2 | scaling-drills, `math/scaling-drills.js` | The k^(2p) slip was explained as "You squared once too often" for every power, including p = ½ (where the student actually *left out the root*) and p = 1. | Feedback now names the real slip for p = ±½ (left out the √), ±1 (squared a linear factor), and other powers. |
| F3 | free-body-diagrams, `math/free-body-diagrams.js` (atwood) | Masses like 6.25 kg were printed "6.3 kg" while the key used 6.25 kg (key differs by up to 0.3%, inside tolerance, but the stem did not give the numbers the solution used). | Masses printed exactly. |
| F4 | energy-bar-charts, `math/energy-bar-charts.js` | (a) spring launch: compression drawn as 0.091 m, printed "9 cm" (U off by 2%, v by 1%); (b) skater: end height 0.64 m printed "0.6 m" (ΔU off by up to 1%). | Compression now whole centimeters; end height rounded to 0.1 m before use. |
| F5 | collision-lab, `math/collision-lab.js` (ke) | Final velocities printed to 3 s.f. could change the total momentum by up to 25% when the total was near zero, while the step says "momentum is the same before and after". | Setups where the printed values do not conserve momentum within 0.5% (or \|p\| < 0.1) are redrawn. |
| F6 | collision-lab (bars) | Stem read "After the collision, A moves at rest" and "B is left at 0.5 m/s". | "A is at rest", "B is moving left at ...". |
| F7 | scaling-drills (torque) | Variable named "force (perpendicular) F", which read awkwardly in every stem. | "perpendicular force F". |
| F8 | collision-lab explore, `collision-lab.js/.css` | Track scene: mass labels spilled outside the carts (white on the track), and v_A, v_B and the CM label collided with each other (badly at 360 px). Narrow bar charts: the two titles ran together ("Momentum (kg·m/s)Kinetic energy (J)"). | Mass label above each cart in ink; v_A and v_B on their own rows starting over their own cart; CM marker above them; scene height raised. Short titles "p (kg·m/s)" and "K (J)" when the bar panel is narrow. Same spacing in the drill's cart figure. |
| F9 | collision-lab drill on a phone | With the problem text on the stage, the cart picture and the F-t graph shrank to thumbnails (about 50 px tall). | On ≤ 760 px the text is the caption and the figure fills the stage (the bar-chart builder keeps its layout). |
| F10 | projectile-lab explore | The first mode tab and the main button were both labelled "Launch": a student pressing the tab saw nothing happen. | Mode tab renamed "One ball". |
| F11 | free-body-diagrams drill | A diagram the student fixed on a later try was labelled "Diagram shown". | "Diagram fixed" when the student's own diagram passed; "Diagram shown" only when they pressed Show the answer. |
| F12 | free-body-diagrams explore at 360 px | Pill "Nothing moves: the forces balance" truncated to "Nothing moves: the forces ...". | "Forces balance" (the full sentence is still announced to screen readers). |
| F13 | energy-bar-charts explore | Skater: slider said 4.0 m, picture said "h = 4.01 m" (start point snapped to the nearest table sample above the height); on a phone the v/h readout sat on top of the skater at the right rim. | Start position interpolated to the exact height; skater readout centered over the empty middle of the half-pipe. |

No numeric key was wrong beyond the stem-precision cases F3 to F5 (all within the 2% grading tolerance, so no
student was marked wrong for a right answer; they are fixed because the stem must give the numbers the
solution uses).

## Checked and fine

- Physics of every explanation sampled: signs and directions, "slowing down does not mean negative a", the top of
  a toss (v = 0, a = −g), independence of horizontal and vertical motion, complementary angles, Atwood a and T,
  friction static vs kinetic and the μ<sub>s</sub>F<sub>N</sub> limit, normal force with an angled pull or push,
  flat curves (no "centripetal force" on an FBD), buoyancy (floating, held, sinking), systems and where work vs
  stored energy goes on the bar charts, impulse = area, CM unchanged by internal forces, elastic vs inelastic.
- g stated in every problem that uses it (9.8 m/s²); units on every answer box; answer precision consistent.
- Pictures agree with numbers in every sampled figure (F-t shapes and peaks, v-t points, projectile paths,
  FBD arrows to scale with the 10 N key, bar heights in units).
- Each tool lands with one Start here cue, a short instruction, the primary control, and More / Why / Details.
  Keyboard reach and screen-reader labels on all custom controls (FBD arrows, cliff-height handle, bars).

## Open (for a person)

1. **scaling-drills explore picture** is the weakest of the six against the bar: the pendulum is two grey
   circles on lines in a mostly empty stage, and most relations use the "generic" picture. It works and is
   correct, but it reads closer to a placeholder than body-map or the chemistry trainers. A redesign (a real bob
   and pivot, a spring and block, a planet, drawn at the scaled size) is more than a review fix.
2. **projectile-lab at 1280 px**: the sky is tall and mostly empty for the default 18 m/s launch (the y-axis is
   sized for the highest possible flight). Consider fitting the view to the current flight.
3. **motion-graphs landing**: the three empty grids before any motion look bare for a moment; a faint example
   trace or a ghost cart path would make the first screen more inviting.
4. Energy unit text: bar problems print "One unit = 6.13 J" while the bars use the exact 6.125 J. Graded to
   ±0.3 unit, so harmless; the validator requires the unit be given to 3 figures, so I left it.
5. The scratch preview logged a 404 for `/sw.js` and blocked analytics requests; both are preview artifacts,
   not tool errors.

## Files changed

`physics/assets/tools/math/{motion-graphs,free-body-diagrams,energy-bar-charts,collision-lab,scaling-drills}.js`,
`physics/assets/tools/{collision-lab,energy-bar-charts,free-body-diagrams,projectile-lab}.js`,
`physics/assets/tools/collision-lab.css`. No shared file, data file, validator or test was edited.
