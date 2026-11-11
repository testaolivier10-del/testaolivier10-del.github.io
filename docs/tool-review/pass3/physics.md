# AP Physics 1: cleanup pass 3 (2026-11-11, builder c7)

Judge: `docs/tool-review/pass2/judge-c.md`. Shots: `/home/claude/shots/pass3/physics/<tool>_before_d.png`, `_after_d.png`, `_after_p.png`.
Checked cold at 1280x800 and 390x844 after each change. No fact, answer or scoring changed.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| Oscillator lab | FAIL: spring, energy bars and three stacked graphs on open; T twice | Every size opens on the spring and one x-t graph (x-t / v-t / a-t tabs beside it, drawn one unit per CSS px so labels stay 12 to 14 px); the K / U bars join when Play is first pressed; the caption no longer repeats T (the T pill shows it) | PASS: 1 hero + 1 graph, 2 numbers after Play (T, E) |
| Collision lab | TOUCH UP: p and KE bars both before Crash, bare "1.00", stray arrow dash | Before contact only the momentum bars show (full width); KE bars and the force graph join at contact; slider named "Bounce e: 0 sticky Velcro, 1 elastic spring"; no velocity arrow under 0.2 m/s | PASS |
| Energy bar charts | PASS (nit: h printed twice) | No change | PASS |
| Fluids tank | TOUCH UP: 9 controls, force diagram far from tank | The four object chips are one Object select (5 controls); on a wide stage the force panel is narrower so the diagram sits beside the tank. Phone "cm" under the coach: the shared hint bubble, not mine | PASS |
| Free-body diagrams | PASS | No change | PASS |
| Lab design | TOUCH UP: graph select and Best fit before any reading; tiny x readout on phone | Graph choice and Best-fit line appear after three readings; the ramp's x reading is drawn at the size of t | PASS |
| Motion graphs | TOUCH UP: "drag" said four times; faint example with 6 notes competes | The instruction is said once on the track (plus the caption); the cue now says what the graphs record; the example run is behind an "Example run" button; the empty x panel says "Your run draws here" | PASS |
| Projectile lab | TOUCH UP: t, vx, vy (vx no unit); dashed box reads as a stray shape | Two numbers: t and speed in m/s (vx, vy stay as the arrows and in Numbers); the cliff handle is solid, filled and named "height" | PASS |
| Rotation lab | TOUCH UP: gray energy bars and key before Race; 4 object toggles | Bars and key appear with the first Race; the racer toggles moved under Settings & numbers | PASS |
| Scaling drills | TOUCH UP: "T x 1" three times; halo on a label; phone blank band | The factor shows once (the pill); the panel foot keeps "swings"; the equation line appears once something changed; a portrait phone shows the picture and the bars together (no switch, no band). Halo: shared hint, not mine | PASS |
| Torque balance | PASS (nit: net torque three times) | No change | PASS |

Notes: the oscillator's pendulum label "10°" sits close to the bob (pre-existing, readable). Rotation lab's ramp shifts up when the bars appear at Race.
