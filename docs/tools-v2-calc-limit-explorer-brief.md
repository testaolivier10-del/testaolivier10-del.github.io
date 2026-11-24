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
  head for 2 → limit 2"; a jump "… → they disagree → no limit"; the asymptote "… → unbounded → no limit";
  sin(1/x) "… → keep swinging → no limit". A phone says "left 1.95", "right 2.04", "both → 2".
- **Takeaways:** after Close in, for example "The limit is 2, even though f(1) is not defined, so f is not continuous
  at x = 1."; after Fill the hole "Now f(1) = 2, the limit, so f is continuous at x = 1." (only once the slab is in).

### Tab 2, "Out to infinity"
- f(x) = (2x² + 3x)/(x² + 1) on an x axis **squeezed by powers of ten** (grid lines at 0, ±1, ±10, …, ±10,000;
  "x: 1, 10, 100, 1,000 …" on the picture); y to scale; the asymptote y = 2 as a blue line. The cars drive
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
- The tool's About text (intro and how it works), the page line, the description and the blurb were reworded for the
  new Explore (in `calculus/data/tools/limit-explorer.json` and `calculus/data/pages.json`); title and URL unchanged.
- No new curve was added for "does not level off" at infinity (the old gallery had none; a later tool or round).

## What was built

- `calculus/assets/tools/limit-explorer.js`: the Explore (`explore()`) and the mount rewritten; the quiz code kept.
  `calculus/assets/tools/limit-explorer.css`: the v2 styles appended (`.le2*`; the old ones stay for the quiz
  figures). `calculus/data/pages.json`: `"kit2": true`, the description, blurb and page line reworded.
  `calculus/data/tools/limit-explorer.json` (the source; `assets/tool-data/` is built from it): intro and how it works
  reworded (contexts unchanged).
- `scripts/tools-v2/calc-limit-explorer-sweep.mjs` (layout, `--fit`, `--frames`, `--dark`, `--shots`) and
  `scripts/tools-v2/calc-limit-explorer-perf.mjs`.

## Checks run (2026-11-24)

`node --test scripts/test/apcalc-*.test.mjs` (156 pass), `apcalcbc-*` (71 pass), `check-apcalc-content --check`,
`build-apcalc --check` (333), `build-apcalcbc --check` (420), `build-apmacro --check` (203), `check-site`, `check-weight
--check` all clean; `check-tool-use` with a local copy of the list (never the committed file): this page reports
tool-open, tool-touch, tool-mode and tool-use as frame v2, nothing under automation.

- Sweep (`calc-limit-explorer-sweep.mjs`, one width per process): 60 states and a first visit at each of 360, 390,
  430, 600, 768, 820, 1024, 1280, 1440 and 1920, light and dark (dark asserted): 1,200 states, 23,660 checks, 0
  failures.
- Fit (`--fit`) at 390x844, 1024x768, 1280x800, both tabs: both car knobs, the picture and the cause line in view at
  once, no inner scroll.
- Frames (`--frames`) at 390 dark and 1440 light: every frame of Close in, Back out, a Page Down glide, Fill the hole,
  Undo, a jump's Close in and Drive out (about 1,900 frames): each tag reads its car's drawn nose, the cause line the
  tags, no takeaway before the picture shows it, motion seen on every drive and glide, no car drawn at NaN; leaving
  for Test yourself mid Close in stops it.
- Browser checks (`calc-limit-explorer-interact.mjs`): 59 passing: real touch drag at 390 (CDP), keys (←, Page Down,
  End, aria-valuetext current), Close in with motion and its takeaway, the picture in view after it, Fill the hole
  closes the circle, "?" has the five row table, a mouse drag into the magnifier and inside it at 1440, a press on
  the road brings that side's car, the picker opens tab 2, Drive out, back by the tab, reduced motion (Close in lands
  at once), Test yourself by `?seed=7#quiz` (a wrong answer marked, Show the answer offered, the tries recorded as
  `limit-explorer:<context>:<step>`, the same problem on a second load), no lock on the free tool, no console errors,
  light and dark.
- Perf at CPU x4 (`calc-limit-explorer-perf.mjs`, the machine at load 5 to 7 from other runs; the flagship in the same
  run): 390: drag in and back median 16.7 ms, p95 33 ms (4.3 ms main thread a frame); Close in on sin(1/x) median
  33 ms, p95 50 ms (5.5 ms); Drive out 16.7 / 50 ms (4.2 ms); a new curve 16.7 / 16.8 ms; flagship 33 / 100 ms (9.3
  ms). 1440 (before the per frame tag size cache): drag 16.7 / 33 ms; Close in on sin(1/x) 33 / 83 ms (7.2 ms);
  Drive out 33 / 67 ms; flagship 50 / 83 ms. Main thread work is within budget everywhere; the frame target is missed
  on the heavy drives only while the machine is loaded, as the flagship's is.

Preview: `/mnt/user-data/outputs/calc-limit-explorer-v2/index.html`, shots in `shots/` (sweep states at 360, 390,
768 and 1440, light and dark, and the frames runs).

## Not done, and what I am not happy with

- The picture is still a graph with a road on it (the grid must stay for exact heights); less of a scene than the lake.
- On a phone the magnifier, two tags and the cars crowd the upper corner; the tags fall back to the height alone.
- sin(1/x) near 0 is a zigzag band, an honest "too many swings to draw" but not a road.
- Close in on sin(1/x) is the heaviest drive (about 33 ms a frame at CPU x4 under load).
- The squeezed axis in tab 2 is a choice a teacher may question (logged in `docs/apcalc-needs-author.md`).
- Desmos and 3Blue1Brown pages could not be fetched here; GeoGebra pages were read as text, applets not run.
- No real phone, no screen reader pass, no real students; the independent review is next.

## Review round 1 (2026-11-24)

The independent review (`/home/claude/review-calc-limit/REVIEW.md`) blocked on five must fix items; all fixed:
1. **Dark mode band.** The sin(1/x) and squeeze zigzag and its fill have light dark mode colours (`.le2-zig`,
   `.le2-band`), in the picture and in the glass.
2. **The glass on the height marks.** `lensGeo()` now keeps the glass, its handle and its zoom label off the hole, a
   jump's ends, the lamp and the two height marks on the y axis; the handle points out to its own corner; the marks are
   boxes the zoom label avoids.
3. **The glass on a car.** A car is a hard reject: on a narrow picture the glass shrinks (×0.88 steps, down to 56 px
   radius) until a corner is clear of both cars.
4. **The chip on Fill the hole.** The chip avoids the Fill button and the cue; Fill avoids the chip; the first visit
   draws three times so they settle. The sweep's first visit now checks the chip as well as the cue.
5. **About text.** The first round edited the built copy (`assets/tool-data/`), which the build overwrote. The source
   `calculus/data/tools/limit-explorer.json` (intro, how it works) and `calculus/data/pages.json` (page line,
   description, blurb) are reworded now and AB rebuilt; the owner log line is corrected.

Should fix, done: a car off the picture keeps the road's direction (climbing out) with a longer arrow; the pill reads
"unbounded" everywhere; "too many swings to draw" tries spots beside the band before any far one (and is dropped if none
fits); more spots for "hole" and "y = f(x)" (phones now show both); a car's screen reader value is where a key takes it
and the final value is said when the glide ends; "?" says "drawn as a zigzag band"; the squeezed axis label reads
"x: 1, 10, 100, 1,000 …"; the cause line keeps one height (46 px, phones 84 px) for the chain and the takeaway. Perf:
the glass's road is built once per ×1.25 zoom step in its own coordinates and scaled into place by a transform
(strokes keep their width); the rest of the moving layer is still rewritten each frame (cars, tags and labels change on
every frame of a drive).

Checks after round 1: sweep 360, 390, 1024, 1440 light and dark (480 states, 9,464 checks, 0 failures); frames at 390
dark and 1440 light (1,986 checks, 0 failures); browser checks 59 passing; perf at CPU ×4 (load 3.6, flagship in the
same run): 1440 Close in on sin(1/x) median 33 ms, p95 67 ms, 5.7 ms main thread a frame (was 7.2), drag in 16.7 / 33
ms (4.2), Drive out 33 / 50 ms (4.7); 390 Close in on sin(1/x) 33 / 50 ms (5.1), drag in 16.7 / 33 ms (3.5); flagship
33 / 67 to 83 ms (8.0 to 8.8). AB 156 and BC 71 tests pass; content check, `build-apcalc`, `build-apcalcbc`,
`build-apmacro --check`, `check-site` and `check-weight` clean.
