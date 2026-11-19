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
  grid and labelled axes kept exact: the road's center line IS y = f(x)). A small car sits on the road at P,
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
- **Cause line:** "h = 0.5 → secant slope 2.5"; a third pill "almost the tangent, slope 2" only once the secant's
  slope is within 0.005 of the tangent's (so it never claims a far secant is the tangent); at a corner, cusp or
  jump the third pill is "no tangent slope at x = a" once |h| ≤ 0.1.

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
| Zoom ×1 to ×64 at P | Replaced by tab 2's magnifier (it follows h, both for smooth points and corners). The zoom at will in tab 1 is gone: local linearity (2.1, 4.6) is seen in the magnifier with a small h |
| The table of secant slopes for h = ±1 ... ±0.001 | "?" (live for the current P) |
| "Why?" (the limit definition with the numbers) | "?" |
| Numbers at P, the formula of f and of f′ | "?" |
| Twelve shelf functions | The curve picker beside "Show me how" (both tabs) |
| Type your own function | "?" ("Your own curve": the same forgiving input, with the preview) |
| Keyboard notes | "?" |

## What is on screen in Explore (counted; Playwright, opening state at 1440)
Outside the picture: 2 tabs, the purpose line (10 words), the curve picker, "Show me how", the cause line (3 pills:
"f rising at x = 1 → slope 2 → f′(1) = 2"), "Drive across". That is 5 controls and about 20 words. No side panel,
no table, no readout cards.
On the picture: the road with its car, 1 main control (P's knob with its tag "slope 2"), the labels "y = f(x)",
"tangent", "run 1", "rise 2" and "f′(x), the slope of f", the pen and its orange bar, the axes; the cue (first visit).
Only while true: "from the left" / "from the right", "vertical tangent", "cusp", "jump", "no value" under the pen.
Tab 2: Q's knob with "h = 1", the flag, "secant", "tangent", "h", "Δy"; the magnifier and its "zoom ×N" only while
Q is within about 64 px of P and the glass magnifies at least twice; P is a quiet knob.

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)
- Two tabs: "Slope at a point" (P, the derivative as the slope and the f′ graph) and "Secant to tangent" (Q, the limit).
- The curve is drawn as a road with a car on it; the grid, axes and tick labels stay, so the math is exact.
- The hillside under the road fades out in about 30 px, thins where the road is steep and never goes below the x axis (so it cannot be read as an area or a band).
- P and Q stay where the curve is inside its own window (the old P could leave the picture and be hidden).
- The h slider is gone: Q is dragged on the road, the magnifier replaces the zoom buttons, "Slide Q in" replaces h → 0.
- "Show all of f′ (dotted)" and "Clear the f′ trace" are gone (a dotted ghost reads as a real part; a new curve or
  Drive across clears and redraws the ink).
- Typed curves moved into "?" ("Type your own…" in the picker opens it).
- The table of secant slopes, the limit with the numbers, the values at P and both formulas moved into "?".
- The tool's About text was reworded for the new Explore; title, description, blurb and URL unchanged.
- At a point with no slope the car keeps the heading of the side it came from.
- P's knob is a clear ring with the car inside it, at every width and in both tabs (review round 1).

## What was built
- `calculus/assets/tools/tangent-tracer.js`: Explore rewritten (`explore()`); Test yourself (`quiz()`) unchanged.
  `calculus/assets/tools/tangent-tracer.css`: the v2 styles appended (the old ones stay for the quiz figures).
- The adapter `ApCalcTools.studioKit2` (`calculus/assets/tools/calc-tools.js`) and `"kit2": true` for this tool in
  `calculus/data/pages.json`; `scripts/build-apcalc.mjs` then adds `tool-kit2.css` and `tool-kit2.js` (only this
  page changed; BC pages unchanged; both builds `--check` clean).
- `K.handle` in `assets/course/tool-kit2.js` (documented in its header) and `.tk2-handle` in `tool-kit2.css`.
- `scripts/tools-v2/tangent-tracer-sweep.mjs`; `scripts/check-tool-use.mjs` now lists this tool (frame v2) and
  Osmosis as v2 (the list said "old", so the check failed on this branch before).

## Checks run (2026-11-18)
`node --test scripts/test/apcalc-*.test.mjs` (156 pass), `apcalcbc-*` (71 pass), `check-apcalc-content --check`,
`build-apcalc --check`, `build-apcalcbc --check`, `build-apmacro --check`, `check-site`, `check-weight --check`,
`check-tool-use` (this page reports frame v2). Sweep: 1040 states at 10 widths, 12394 checks, 0 failures (road panel
46 to 53 percent of the stage). Browser checks at 390 (real touch drag through CDP), 768 and 1440, light and dark: 193
assertions passing: opening state and cue, drag mid frames, keys (arrows, Home, End, the corner stop), Drive across
frames and its takeaway, the tab keeps the curve and P, Page Down on Q, the magnifier and Q's knob in it, a drag in
the glass, Slide Q in and back, "?" with the table, Test yourself (a wrong answer, Show the answer, the record id
`tangent-tracer:` stored, a right answer moves to the next step), back to Explore, deep links `#quiz` and `?seed=`,
reduced motion (results at once), no sideways scroll, no console errors. Preview:
`/mnt/user-data/outputs/tangent-tracer-v2/index.html`, shots in `shots/`.

## Not done, and what I am not happy with
- The picture is still a graph with a road on it (the grid has to stay for exact slopes); less of a scene than the lake.
- The ring around the car is big on a desktop (about 76 px across at 1440); smaller felt cramped on a phone.
- With reduced motion the site gives every property a 0.01 ms transition, so a knob reads its new place a frame late.
- The phone keeps two rows for the cause line, so a one row line leaves a gap above the button.
- No real phone, no screen reader pass, no real students; the independent review is next.

## Review round 1 (2026-11-18)

The independent review (`/home/claude/review-tangent-tracer/REVIEW.md`) blocked on three must fix items. Fixed:
1. **Branch behind v2-all.** Merged `origin/claude/tools-v2-all`; `scripts/check-tool-use.mjs` taken byte for byte
   (frame v2 checked with a local uncommitted copy of the list); the owner log and the standard's status table
   resolved as appends.
2. **The car hidden by P's knob on a phone.** P's knob is a clear ring around the car (the ring's centre is the
   car's centre, its radius 0.57 of the car's length plus 4 px), at every width: an opaque knob on the road still
   hid a fifth of the car at 1440. It is still the kit's `K.handle` (a real slider with keys, focus ring and pulse).
   P's quiet knob in tab 2 is a thin ring too. Tags sit outside the ring; the windows' padding grew to fit it.
3. **Two cues in tab 2 and Q's chip on numbers.** P's cue hides when tab 2 opens (and comes back on tab 1 if P was
   never used). "Slide Q in" and Q's keys count as Q's first use (`K.handle` gained `used()`; keys already did).
   Q's chip sits on a side of Q clear of Q's tag, the labels, P and the car, and in the magnifier away from its
   centre and the zoom label (`K.handle` gained `chipSide(v)`, CSS in `tool-kit2.css` scoped to `.tk2-handle`).

Should fix, done: the one sided labels stay on phones ("left", "right"; more spots to try), "run" and "rise" get
more spots so a phone keeps them; the hillside is fainter, 30 px deep instead of 62, thinner where the road is
steep and never below the x axis; a cusp reads "slope → −∞ from the left + → ∞ from the right"; tab 2's cause line
above matches the code; the About text names "the Slope at a point tab" and "the Secant to tangent tab"; the
"moved" table says the zoom at will was replaced by the magnifier. Removed: `window.ApCalcTangentTracer` is set only
when a test sets `window.LevlToolTest` before load. The sweep gained frame assertions for 2 (the car is never hidden:
P's knob is a clear ring, the car is inside it and P on the road is inside it) and 3 (tab 2 first
visit: one cue, Q's chip clear of its tag, labels, P's dot in the glass and P's knob, at h = 1, −0.5, 0.05, 0.001;
the chip goes after Slide Q in and after Q's keys).

Checks after round 1 (2026-11-18, on the merge with v2-all): `apcalc-*` 156 pass, `apcalcbc-*` 71 pass,
`check-apcalc-content --check`, `build-apcalc --check` (333), `build-apcalcbc --check` (420), `build-apmacro --check`,
`check-site`, `check-weight --check` all clean; `check-tool-use` with a local copy of the list: this page reports
frame v2. Sweep one width per process: 1070 states, 12455 checks, 0 failures at all ten widths (road panel 46 to 53
percent). Extra frames (real CDP touch drag of the ring at 390, Slide Q in mid and end, dark mode, first visit of
both tabs) in `/mnt/user-data/outputs/tangent-tracer-v2/shots/r1-*.png`; no console errors.

## Recheck 1 (2026-11-18)

The re-check passed everything from round 1 and blocked on one item: in the magnifier, Q's tag (below Q) covered
P's dot at the glass centre on phones and tablets (360, 390, 768, also after Slide Q in). Fixed: while Q is in the
glass its tag goes outward along P→Q (sideways when Q is more to the side, else above or below, skipping a side
that leaves the road panel), so it always reaches away from the centre; Q's chip and the labels avoid the tag's new
box. The should fix too: the magnifier's small source ring at P is gone and the beams start at P's ring around the
car (one circle near the car). The sweep now asserts that no tag touches `.tt2-pdot` and checks tab 2 at
h = 1, −0.5, 0.05, ±0.01, ±0.001.

