# Tools v2: AP® Calculus AB Limit explorer (brief and build notes)

Status file for the v2 rebuild of `calculus/tools/limit-explorer.html` (free, rollout row 40, group G, wave 4).
Standard: `docs/tools-v2-standard.md`; builder brief: `docs/tools-v2-builder-brief.md`; plan:
`docs/tools-v2-plans/calc-limit-explorer.md`. Branch `claude/tools-v2-calc-limit-explorer`, cut from
`claude/tools-v2-all`. NOT merged: the independent review comes first. Decisions made for the owner are also one line
each in `docs/tools-v2-owner-log.md`.

The second calculus tool on the kit. It uses the calculus adapter `ApCalcTools.studioKit2` and `K.handle` as they are
(no shared file changed: the kit, the adapter, `calc-plot.js`, the model `tools/math/limit-explorer.js` and the
Tangent tracer are untouched). The Tangent tracer's road, car, ring knob and magnifier are redrawn in this tool's own
file rather than lifted into a shared piece, so the tracer needs no new sweep (the plan allowed either).

## The one main idea per screen

1. **Close in on a point** (CED 1.2 to 1.16): walk toward x = a from each side; the limit is the height both sides
   head for, whatever happens at a itself (a hole, a point out of place, a jump, an asymptote, an oscillation, a
   squeeze).
2. **Out to infinity** (CED 1.15): walk far out; the height levels off at a horizontal asymptote.

## Research (rule 10): what exists and what we took

| Source | Seen how | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| GeoGebra "Limits from a Graph" (geogebra.org/m/nf5ehhx9) | page text (applet not run) | Left piece red, right piece blue; an "x → c" button moves x closer; a trace of the values on the y axis; the limit notation appears once the values are close enough | Five boxes and three buttons before anything moves | One colour per side; the heights carried to the y axis (our thin height lines and the two marks on the axis); the conclusion only once both sides are close ("x → c" is our Close in) |
| GeoGebra "One-sided limits" (geogebra.org/m/x5WuzzY4, Thomas' Calculus) | page text | A point moved along the curve; generated problems | No instructions | The point riding the curve (our cars' noses) |
| Desmos calculator (desmos.com/calculator) | not reachable here (the fetch was refused); known as text | A point with a slider for x is exact | The control sits beside the graph | Not taken: our cars are dragged on the road itself |
| 3Blue1Brown, Essence of calculus ch. 7 "Limits" (3blue1brown.com/topics/calculus) | not reachable here (the fetch was refused); known as text from the Tangent tracer's brief | Zooming in on a hole: the curve stays a line, the hole stays a hole | A video: nothing to do | The zoom as a magnifier that follows the cars in (the Tangent tracer's glass) |

What ours does better: one drag on the road moves a car, its tag f(x), its height on the y axis and the cause line at
once; the magnifier keeps both noses in view down to 0.0001 from a; the conclusion ("limit 2", "they disagree", "no
limit") appears only when both cars really are within 0.01, so it is never claimed from far away.

## The design

### Tab 1, "Close in on a point"
- **Picture:** the curve is a road through a landscape (sky, a soft hillside under the road, the graph's grid and
  axes kept exact: the road's center line IS y = f(x)). Two cars drive toward x = a: purple from the left, orange
  from the right. Each car's NOSE is the point (x, f(x)); its body trails behind on its own side. A thin line in the
  car's colour carries each nose's height to the y axis (two small marks there close in on the limit). A faint line
  stands at x = a ("x = 1").
- **The kinds of point:** a hole is a gap in the road with an open circle and a road cone; a point out of place is a
  lamp post standing at x = a whose lamp is the filled point f(2) = 1; a jump is the road broken, the left piece ending
  in an open circle and the right starting with a filled one; a vertical asymptote is the road climbing off the
  picture beside a red line ("asymptote"), and a car whose height leaves the picture stays at the edge, level, with
  an arrow out (its tag still reads the true f(x)); sin(1/x) is a road that buckles faster and faster until a strip
  near 0 is drawn as a zigzag band ("too many swings to draw"); the squeeze is the road between two guard rails
  y = |x| and y = −|x|.
- **Main control:** the purple car (`K.handle`, a clear ring around the car, the kit's slider with keys); the orange
  car is quiet until the purple one is first used, then as loud. Drag either along the road, or press the road and
  the car on that side comes. Keys: ← → move along the road (Shift: ten steps), Page Down ten times closer to a, Page
  Up ten times farther, Home and End the ends. A key jump glides (the car eases there; the tag reads the car where it
  is drawn).
- **Magnifier:** once the farther car is within about a third of the glass's radius of a (in pixels) and the glass
  magnifies at least twice, a magnifier grows in at the corner farthest from a that the road and the cars do not
  cross. It keeps the farther nose about 70% of the way to its rim (×10, ×100, ×1,000 …, "zoom ×N" under it); both
  knobs move into it onto the noses (dots in the cars' colours), so they can still be dragged closer. For a jump it
  squeezes heights so both pieces stay in the glass; for sin(1/x) it shows heights −1 to 1. No glass for the vertical
  asymptote (the cars are at the picture's edges there).
- **Secondary:** "Close in" (small) drives both cars to 0.001 from a, the glass zooming as it goes, and ends on the
  takeaway; then it reads "Back out". "Fill the hole" / "Move the point" (quiet, on the picture beside the hole, only
  for a removable point) lays a slab of road into the gap (or lifts the lamp into the hole) and closes the circle; it
  then reads "Undo". The curve picker beside "Show me how".
- **Cause line:** "from the left 1.95 + from the right 2.04 → closer to x = 1"; with both cars within 0.01: "… → both
  head for 2 → limit 2"; a jump "… → they disagree → no limit"; the asymptote "… → grow without bound → no limit";
  sin(1/x) "… → keep swinging → no limit". A phone says "left 1.95", "right 2.04", "both → 2".
- **Takeaways:** after Close in, for example "The limit is 2, even though f(1) is not defined, so f is not continuous
  at x = 1."; after Fill the hole "Now f(1) = 2, the limit, so f is continuous at x = 1." (only once the slab is in).

### Tab 2, "Out to infinity"
- f(x) = (2x² + 3x)/(x² + 1) on an x axis **squeezed by powers of ten** (each grid step ×10: 1, 10, 100, 1,000,
  10,000; "x: each grid step ×10" on the picture); y to scale; the asymptote y = 2 as a blue line. The cars drive
  outward (noses out, bodies toward 0), from x = ±3 (farther on a phone, so the rings never touch) to ±10,000.
- Cause line "f(−3) = 0.9 + f(3) = 2.7 → drive farther out"; beyond 1,000 on both sides "… → both level off at 2".
  "Drive out" ends on "Far out on both sides f(x) heads for 2, so y = 2 is a horizontal asymptote (the curve crosses
  it at x = 2/3 on the way)."; then "Back in".

### Both tabs
- Opens on the hole at x = 1 with the cars at x = 0 and x = 2. One cue, once per device: "Drag the car toward x = 1"
  beside the purple car (on its right when there is no room on its left), plus the kit's "Drag" chip on that knob.
- One colour per idea: from the left purple (s5), from the right orange (s4), the limit and the asymptote blue (s2),
  "no limit" and the vertical asymptote the warning red; the road ink.
- Every change animated: cars follow the finger and glide on keys; Close in and Drive out are drives; the glass grows
  in, zooms and leaves; the slab lays in and the lamp rises; a new curve or tab cross fades. Reduced motion: the
  results at once with a short cross fade.

## Explore against Test yourself

- **Explore:** the two tabs above. Nothing graded.
- **Test yourself:** unchanged. `ApCalcTools.drill` over the model's twelve kinds (graph, table, onesided, laws,
  algebra, squeeze, classify, continuity, remove, vertical, infinity, ivt), the figure on the stage drawn from each
  problem, every try marked on it, the method hints, first tries recorded as `limit-explorer:<context>:<step>`.
  `?seed=` and `#quiz` open it as before. The quiz code is the old file's, byte for byte (only the Explore and the
  mount around it changed).

## What moved (nothing dropped silently)

| From the old Explore | Where it is now |
|---|---|
| Function select (seven curves) | The curve picker beside "Show me how"; "Limits at infinity" opens tab 2 |
| Zoom slider with − and +, mouse wheel, pinch | Replaced by the cars dragged toward a, with the magnifier following them (wheel and pinch are gone) |
| Play the zoom | "Close in" (and "Drive out" in tab 2) |
| Two tracers with arrows along the curve | The two cars, each a main control |
| Table of values, a row per power of ten | "?" ("Closing in on x = a": all five rows, h = 1 to 0.0001, both sides; tab 2: x = ±1 to ±10,000) |
| Continuity checklist (three conditions) | The takeaway after Close in and after Fill; the full checklist live in "?" |
| "Fill the hole" / "Move the point to the limit" | Kept, on the picture beside the hole, animated ("Move the point") |
| Limits at infinity by zooming out | Tab 2: the squeezed axis and the cars driving out |
| Caption | The cause line |
| Why (the reasoning, the squeeze theorem, the sin(1/x) table trap) | "?" |
| Details (formula, the limits, how to say it, every row) | "?" |
| Test yourself, record ids, `?seed=`, `#quiz` | Unchanged |

## What is on screen in Explore (counted, opening state at 1440)

Outside the picture: 2 tabs, the purpose line (9 words: "The limit is the height both sides head for."), the
curve picker, "Show me how", the cause line (3 pills: "from the left 1", "from the right 3", "closer to x = 1"),
"Close in". That is 5 controls and about 20 words. No side panel, no table, no readout cards.
On the picture: the road, 2 cars (2 main controls) with their tags "f(0) = 1" and "f(2) = 3", their height lines,
"hole", "Fill the hole", the cone, "x = 1", "y = f(x)", the axes; the cue (first visit).

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)

- Two tabs: "Close in on a point" (six curves) and "Out to infinity" (the one curve at infinity).
- The curve is a road with two cars; each car's nose is the point (x, f(x)); the grid, axes and tick labels stay.
- Each nose's height is carried to the y axis by a thin line in the car's colour (from GeoGebra's trace on the axis).
- The zoom slider, its buttons, the wheel and pinch are gone: the cars are dragged in, the magnifier follows them.
- The table of values and the continuity checklist moved into "?"; the conclusion is the takeaway after Close in.
- The orange car starts quiet and becomes loud once the purple one is used (one chip on screen).
- The conclusion ("limit 2", "no limit") shows only when both cars are within 0.01 of a; the Close in takeaway only
  at 0.001.
- Tab 2's x axis is squeezed by powers of ten (labelled on the picture and explained in "?") so the cars can reach
  ±10,000 without the picture zooming under the finger; heights stay to scale.
- In the glass, a jump's heights are squeezed to keep both pieces in view; sin(1/x) shows −1 to 1.
- No magnifier for the vertical asymptote; a car whose height leaves the picture stays at the edge with an arrow and
  its tag keeps the true value (never "∞").
- Phones show the height alone on each car's tag ("1.95"); wider screens "f(0.95) = 1.95".
- The road, car and magnifier are redrawn in this tool's file, not lifted into a shared piece (the Tangent tracer is
  untouched).
- The tool's About text (intro and how it works) was reworded for the new Explore; title, description, blurb and URL
  unchanged.
- No new curve was added for "does not level off" at infinity (the old gallery had none; a later tool or round).

## What was built

- `calculus/assets/tools/limit-explorer.js`: the Explore (`explore()`) and the mount rewritten; the quiz code kept.
  `calculus/assets/tools/limit-explorer.css`: the v2 styles appended (`.le2*`; the old ones stay for the quiz
  figures). `calculus/data/pages.json`: `"kit2": true` for this tool. `calculus/assets/tool-data/limit-explorer.json`:
  intro and how it works reworded (contexts unchanged).
- `scripts/tools-v2/calc-limit-explorer-sweep.mjs` (layout, `--fit`, `--frames`, `--dark`, `--shots`) and
  `scripts/tools-v2/calc-limit-explorer-perf.mjs`.

## Checks run (2026-11-24)

See the "Checks" section at the end (filled in after the runs).
