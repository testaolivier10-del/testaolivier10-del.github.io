# AP Physics 1: second pass, simple and clear (2026-11-11)

Builder math1 (pass 2), branch `claude/tv2-math1`. Every tool opened at 1280x800 and 390x844; landing shots in
`/home/claude/shots/pass2/physics/<tool>_land_d.png` / `_land_p.png`, changed tools also `_before_d.png`.

How counted (opening screen, desktop): **L** text labels on the picture (axis tick numbers not counted), **N** live
numbers on the picture (readout pills included), **C** control groups showing in the dock (a chip row or a segmented
switch counts as one), **W** words outside buttons in the dock and on the stage (title excluded), **P** panels.

| Tool | The idea | Best way to show it | Verdict | Before (L/N/C/W/P) | After | What changed | Moved behind a tap or in time |
|---|---|---|---|---|---|---|---|
| Collision lab | Momentum always conserved in a crash; kinetic energy only when the bumper gives it back | Carts on a track above before/now p and K bars; press Crash | SIMPLIFY | 12/9/4/14/3 | 10/7/4/6/2 | The force-time graph appears when the bumper first touches and the pulse draws itself as contact runs (it was fully drawn before any contact, with J = 0). Caption no longer repeats p and K under the sentence. | F(t) panel: appears at contact. "Now" p and K: Numbers table (unchanged) |
| Energy bar charts | The bars depend on the system you choose | Scene above K, U, W bars; toggle Earth in or out; Play | SIMPLIFY | 11/7/3/27/2 | 9/6/3/22/2 | Scene readout keeps v and h (time dropped); "System: the skater and Earth" repeated the chips, now a screen-reader caption only. | Time: scene label and Numbers |
| Fluids tank | Why things float or sink, scale readings, pressure, Bernoulli | Tank with the object and its forces to scale; drop it in | SIMPLIFY | 6/2/4/48/2 | 6/2/4/23/2 | The 25-word note under the force diagram is gone. | "F_b if fully under" already in Numbers; agents named on each arrow |
| Free-body diagrams | Forces from agents, to scale, add tip to tail | Object in its situation with arrows; one slider | LEAVE | 5/1/4/18/1 | same | Already calm: one scene, tip-to-tail inset, one slider. | |
| Lab design | Noisy data, the plot that makes a line, the slope | Bench beside the graph that fills as you take readings | LEAVE | 3/1/4/22/2 | same | The graph is the concept and starts empty; the bench is its cause. | |
| Motion graphs | One motion makes x, v and a together | Drag the cart; three stacked graphs record | LEAVE | 6/2/3/26/1 | same | Stacked graphs read as one picture; the faint example run is labeled once. | |
| Oscillator lab | What sets a period (and what does not); energy trading in SHM | Oscillator, K/U bars and x, v, a on one clock; Play then change one thing | SIMPLIFY | 9/2/4/21/3 | 7/2/4/21/3 | "Press Play to trace it" said once (on x), not three times. | |
| Projectile lab | Horizontal steady, vertical falling, same time | Cannon, strobe trail with components; Launch | LEAVE | 3/3/3/20/1 | same | One picture, one primary button. | |
| Rotation lab | Rolling shapes split energy by beta; L = I omega; orbits | Three shapes racing down a ramp with energy bars | LEAVE | 7/3/3/32/1 | same | Bars sit under the ramp as one picture. | |
| Scaling drills | How a quantity scales before computing | Before and after pictures with factor bars; drag a slider | LEAVE | 6/2/3/16/1 | same | One question per relation; the picture is the ratio. | |
| Torque balance | Torques balance about the pivot | Meter stick with masses and CCW/CW bars; Release | LEAVE | 5/3/3/27/1 | same | The bars under the stick are the torque comparison. | |

Counts: 7 LEAVE, 4 SIMPLIFY, 0 CHANGE.

## Graphics quality
All eleven are drawn scenes (carts, skater, tank, table, bench, cannon, ramp, pendulums, meter stick), consistent
with the site, light and dark. No clip art or decoration found that does not teach. The oscillator lab's desktop
graphs are small (ticks about 9 px) beside a roomy scene; readable, left as is.

## Not simplified, and why
- Collision lab: the six bar values stay. Before/now momentum against before/now energy, A, B and total, is the
  comparison the tool exists for (cause and effect on one screen), so they are over the 2 live number guide on purpose.
- Oscillator lab: x, v and a stay stacked on desktop (one time axis, read together: v is greatest where x = 0). A
  phone already shows one at a time with x-t / v-t / a-t.
- Energy bar charts: the equation line "Start + W = Now" stays under the bars; it is the bookkeeping the bars show.
