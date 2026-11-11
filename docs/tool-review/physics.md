# AP Physics 1: tool purpose review (2026-11-10)

Every scene, tab and chip opened in Chromium at 1280x800 and 390x844, run (Play, Launch, Crash, Race, Release,
drags) and at least one Test yourself item each. Screenshots: `/home/claude/shots/review/physics/<tool>/`
(d = desktop, p = phone) and tiled sheets in `/home/claude/shots/review/physics/*.png`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Collision lab | Momentum is always conserved in a crash; kinetic energy only when the bumper gives it back | LEAVE | Real carts on a track, a gliding CM marker, before/now momentum and energy bars, impulse as the shaded area under F(t). Sticky, elastic and explosion all read right. Small nits in notes. |
| Energy bar charts | The bars depend on the system you choose: inside it is a store, outside it is work | LEAVE | Skater, launcher, ramp onto a rough floor and lift are drawn scenes; toggling Earth in or out turns the U_g bar into a W bar live. Numbers check. |
| Fluids tank | Why things float or sink, what a scale reads under water, pressure with depth, Bernoulli, Torricelli | LEAVE | Five real scenes (tank, spring scale, probe with pressure arrows, gauges on a narrowing pipe with stacked energy-per-volume bars, a jet from a hole). Forces to scale. |
| Free-body diagrams | Forces from agents, drawn to scale, added tip to tail give the net force | LEAVE | Eleven illustrated situations (table, rope, two ropes, ramps, elevator, Atwood, crate, spring, car on a curve, block in water), tip-to-tail inset, ramp components. The flagship does its job. |
| Lab design | Take noisy data, find the plot that makes a line, read the slope | LEAVE | Bench drawn for all six experiments, table, graph, least-squares fit. Here the graph is the concept. Apparatus drawings are small (see notes). |
| Motion graphs | One motion makes the x, v and a graphs together | LEAVE | Dragging the cart records three graphs live; Set v and a runs exact motion; Match traces a target. |
| Oscillator lab | What sets a period (and what does not), and energy trading in SHM | FIX | Spring, hanging spring and pendulum all run with live x, v, a graphs and K/U bars. On desktop the pendulum scene clips its own labels: "ℓ = 1.00 m" is cut at the left edge and "On Earth, g = 9.8 m/s²" is cut at the right ("g = 9"). |
| Projectile lab | Horizontal motion steady, vertical motion falling, at the same time | LEAVE | Strobe trail with velocity components to scale (horizontal arrows equal, vertical ones shrink and flip); Compare flies A and B on one clock; Moving cart shows ground frame parabola vs cart frame straight up. Excellent. |
| Rotation lab | Rolling shapes split energy by β; L = Iω fixed on the stool; orbits trade K and U | LEAVE | Ramp race with real hoop, disk, sphere and block plus energy split bars; stool seen from above with arms moving in; orbit with Earth, satellite and K/U/E columns. Not blocks. |
| Scaling drills | How one quantity scales before you compute | LEAVE | 31 relations, each with its own before/after picture drawn to scale (tiles, cubes, pizzas, pendulums swinging at their true period ratio, braking strips, satellites, pipe tracers) and factor bars. |
| Torque balance | Torques balance about the pivot; same mass farther out means more I | LEAVE | Meter stick on a knife edge with draggable brass masses and CCW/CW bars; release tips it; inertia race drops two weights off two wheels and the smaller-I wheel wins with its energy split shown. |

Counts: 10 LEAVE, 1 FIX, 0 REDESIGN.

## Notes

### Oscillator lab (FIX)
- Desktop, Pendulum scene: the length label "ℓ = 1.00 m" runs off the left edge of the stage, and the planet line
  "On Earth, g = 9.8 m/s²" runs off the right edge at the bottom ("On Earth, g = 9"). Seen at 1280x800 before and
  during Play (`oscillator-lab/d04_Pendulum.png`, `d05_pplay.png`, crop `osc_crop.png`). The phone layout is fine.
  Repair: keep both labels inside the scene's viewBox (or shrink them with the pendulum scene's larger scale).
- Nothing else: the measured period beside the formula, the "change one thing" chips and the live graphs are the idea.

### Small nits on LEAVE tools (no verdict change)
- Collision lab: before the crash the F(t) panel already draws the whole pulse with "J = 0.000 N·s", which reads as
  if contact already happened; draw it only as contact runs (or dashed as a prediction). In Explosion mode the
  bumper slider stays on screen, greyed, though it does nothing there. Phone: the "Press Crash" tip sits on the
  F(t) axis label.
- Lab design: the apparatus is drawn small (cart and ramp about 150 px wide at desktop, about 60 px on a phone),
  so the motion detector, stopwatch or pulley is hard to make out. A larger bench on the phone would help.
- Projectile lab, Compare: the two landing labels ("A: 32.6 m, 2.36 s", "B: 28.6 m, 3.18 s") overlap when the
  balls land close together.
- Rotation lab, Orbit: Earth and the satellite are small in a large black panel; the satellite is a few pixels.
- Scaling drills: Test yourself shows only bars (no picture) for the factor problems; fine for a drill.

### Accuracy
Spot checks all matched: elastic and sticky collision results and impulses, skater and lift energies, buoyant force
and floating fraction, pipe pressure drop (continuity plus height), Torricelli speed and range, torque sums,
period factors. Nothing scientifically wrong found.

### Could not open
Nothing. Every tool and scene opened with no page errors.
