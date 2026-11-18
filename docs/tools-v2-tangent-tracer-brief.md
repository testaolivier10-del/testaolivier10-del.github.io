# Tools v2: AP® Calculus AB Tangent tracer (brief and build notes)

Status file for the v2 rebuild of `calculus/tools/tangent-tracer.html` (free, rank 14 in `docs/tools-v2-rollout.md`,
group G "graph explorers"). Standard: `docs/tools-v2-standard.md`. Branch `claude/tools-v2-tangent-tracer`, cut from
`claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions made for the owner are also one line
each in `docs/tools-v2-owner-log.md`.

This is the first calculus tool on the kit and the first graph explorer, so it adds two shared pieces:
- **The calculus adapter** `ApCalcTools.studioKit2` in `calculus/assets/tools/calc-tools.js` (the pattern of
  `ApBioTools.studioKit2`): a trainer passes `studio: { kit2: fn }` to `T.modes`; Explore then shows the tool's own
  stage full width with its reference behind "?", and Test yourself stays the course's shared drill, untouched.
- **`K.handle`** in `assets/course/tool-kit2.js`: a draggable point on a picture whose position is any function of
  its value (a point on a curve, on an axis, in an inset), with the kit's knob look, a real slider for keys and
  screen readers, an arrow that turns with the direction it moves, a tag, and a small "before" tick. Later graph
  tools use it for every "drag the point" control.

## The one main idea per screen

1. **Slope at a point** (tab 1, CED 2.1 to 2.3): the derivative at a point is the slope of the curve there (the
   direction you are heading if you drive along it), and the graph of f′ is that slope, point by point.
2. **Secant to tangent** (tab 2, CED 2.1 and 2.2, the limit definition): the slope through two points closes in on
   the tangent's slope as h → 0, from either side; where the two sides close in on different numbers (or none),
   f′ does not exist (CED 2.4).

They are two ideas (the first is what a derivative is, the second is how it is defined as a limit), so each gets
its own tab with its own main control (rule 11). A tab never changes the curve or P (rule 8).

## Research (rule 10): what exists and what we took

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| Math Insight, "The derivative function" (GeoGebra applet; page seen) | Drag a red diamond on f; a red tangent line follows; a second diamond on the graph of f′ traces it out; a box to type f; checkboxes to hide parts | The derivative point moves with the dragged point, on its own graph below the same x | No instruction on the applet; a plain chart; nothing says why the f′ point is where it is | The linked pair (drag on f, the f′ point follows on the same x, a guide between them) |
| GeoGebra "Tangent line and derivative" (yXUy4ACU; page text seen, applet not run) | Sliders build f; checkboxes "show the slope", "trace slope coordinates", "show the derivative"; drag A on the curve | The trace of slope coordinates is the derivative drawn by the student | Four switches before anything happens | The trace: f′ is drawn only where P has been, so the student draws it |
| GeoGebra "Derivative as a function" (zYHjGaUA), Houston ACT "Derivatives and tangent lines" (summaries only) | The same pattern | (not inspected) | (not inspected) | Confirms the pattern is the standard one |
| 3Blue1Brown, Essence of calculus ch. 2 "The paradox of the derivative" (lesson page text seen; videos not watched here) | A car's distance against time; the slope as speed; two points slide together so the secant rotates into the tangent; "imagine zooming in on the point" | Motion gives the slope a meaning; the secant rotating; zooming in until the curve looks straight | A video: nothing to do | A vehicle on the curve whose heading IS the tangent; the zoom as a magnifier that follows h, so a smooth curve looks straight and a corner stays a corner |
| Desmos help, "Derivatives" (page seen) | Graph f′ with prime notation; the tangent at (a, f(a)) moves with a slider for a | Exact | The control is a slider beside the graph, not the point | Not taken: our point is dragged on the curve itself |
| dmccreary "Derivative from graph" MicroSim (page seen) | Draw your own tangent through P, check against the true one, percent error | A draw, check, compare loop | Text heavy; difficulty menu | Its loop is already our Test yourself (sketch f′ and the tangent line steps) |

What ours does better: one drag, on the curve itself, moves the vehicle, the tangent, its rise and run, the slope
on the knob and the pen that draws f′, all at once; the secant has its own tab, and a magnifier keeps Q visible as h
shrinks, so the limit is seen, not only read in a table.

## The design

### Tab 1, "Slope at a point"
- **Main control:** P, a knob on the road (`K.handle` on the curve). Drag anywhere along the road (or press the
  road), arrow keys move it along x (Shift: ten steps), Home and End go to the ends; a corner, cusp or jump is a
  stop the keys land on and a drag snaps to.
- **Picture:** the curve is a road through a landscape (sky, a hillside that fades below the road, the graph's
  grid and labelled axes kept exact: the road's centre line IS y = f(x)). A small car sits on the road at P,
  turned to the tangent; the tangent line runs across in orange with a bold arrow ahead of the car (the direction
  you are heading), and a rise and run triangle with run 1 (or 0.5, 0.2 when 1 would leave the picture) and its
  rise. Below, on graph paper with the same x, a pen draws f′ (blue ink) wherever P has been; an orange bar from
  the axis up to the pen is the slope now.
- **Where f′ does not exist:** at a corner the two one sided directions are drawn (left and right, each labelled);
  a cusp or a vertical tangent shows a vertical line; at a jump the road breaks; at the end of the road only one
  side exists. The pen lifts (no ink there); the knob's tag says "no slope".
- **Secondary:** "Drive across" (small) drives P from one end to the other and draws all of f′ (the old Trace f′),
  then ends on the takeaway. The curve picker sits beside "Show me how".
- **Cause line:** "f rising at x = 1 → slope 2 → f′(1) = 2"; "slope from the left −1 + from the right 1 → they
  disagree → f′(0) does not exist"; and so on for each kind of point.

### Tab 2, "Secant to tangent"
- **Main control:** Q, a knob on the road at x = a + h (`K.handle`). Drag it toward P from either side; keys: arrows
  move h, Page Down makes h ten times smaller, Page Up ten times bigger. P stays draggable as a quiet knob.
- **Picture:** the same road, taller (no f′ paper). The secant through P and Q in purple, its run h and rise Δy,
  the tangent at P thin orange. When Q comes within a few millimetres of P, a **magnifier** appears and follows h:
  it shows the road around P zoomed so Q always sits halfway out (×10, ×100, ×1000), and in it the secant and the
  tangent visibly merge. Q's knob moves into the magnifier then, so it can still be dragged closer.
- **Secondary:** "Slide Q in" (small) slides h to 0.001 from the side Q is on (the old "h → 0"), the magnifier
  zooming as it goes, and ends on the takeaway; once there it reads "Back to h = 1".
- **Cause line:** "h = 0.5 → secant slope 2.5 → tangent slope 2"; at a corner the third pill is "no tangent slope".

### Both tabs
- Opens on f(x) = x² at x = 1 (tab 1). One cue, once per device: "Drag P along the road" at the knob.
- One colour per idea, everywhere: the road and f in ink; the slope and tangent orange (the course's s4); f′ blue
  (s2); the secant purple (s5); "does not exist" in the course's warning red.
- Every change of state is animated: P and Q follow the finger; a new curve or a tab change cross fades; the
  magnifier grows in and shrinks away; it zooms smoothly; Drive across and Slide Q in are animations. Reduced
  motion: the same results at once with a short cross fade.

## Explore against Test yourself

- **Explore:** the two tabs above. Nothing graded.
- **Test yourself:** unchanged. The shared drill (`ApCalcTools.drill`) with its six kinds (estimate f′ from a
  tangent line; a difference quotient from a table with units; which graph is f′; sketch f′ from f, graded point
  by point; write the tangent line; where f is not differentiable and why), the method hints, Show the answer, and
  first tries recorded as `tangent-tracer:<context>:<step>` exactly as before. `?seed=` and `#quiz` still open it.

## What moved (nothing dropped silently)

| From the old Explore | Where it is now |
|---|---|
| The h slider (log scale, both sides) in the panel | Tab 2: Q dragged on the road, keys (Page Down: ten times closer), and "Slide Q in" |
| "h → 0" button | Tab 2, "Slide Q in" |
| "Tangent" toggle | Tab 1 always shows the tangent; tab 2 shows it thin as the target |
| "Trace f′" | Tab 1, "Drive across" |
| The f′ trace as P moves | Tab 1, the pen on the graph paper |
| "Show all of f′ (dotted)" | Removed (a dotted ghost reads as a real part); "Drive across" draws all of f′ |
| "Clear the f′ trace" | The trace clears with a new curve; "Drive across" redraws it |
| Zoom ×1 to ×64 at P | Tab 2's magnifier (it follows h, both for smooth points and corners) |
| The table of secant slopes for h = ±1 ... ±0.001 | "?" (live for the current P) |
| "Why?" (the limit definition with the numbers) | "?" |
| Numbers at P, the formula of f and of f′ | "?" |
| Twelve shelf functions | The curve picker beside "Show me how" (both tabs) |
| Type your own function | "?" ("Your own curve": the same forgiving input, with the preview) |
| Keyboard notes | "?" |
