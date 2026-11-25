# Tools v2: AP® Calculus AB Riemann sums (brief and build notes)

Status file for the v2 rebuild of `calculus/tools/riemann-sums.html` (Premium, rollout row 76, group G, wave 16,
marked rework). Standard: `docs/tools-v2-standard.md`; builder brief: `docs/tools-v2-builder-brief.md`; plan:
`docs/tools-v2-plans/calc-riemann-sums.md`. Branch `claude/tools-v2-calc-riemann-sums`, cut from
`claude/tools-v2-all`. NOT merged: the independent review comes first. Decisions made for the owner are also one line
each in `docs/tools-v2-owner-log.md`.

The third calculus tool on the kit, through the adapter `ApCalcTools.studioKit2` as it is (no shared file changed:
the kit, the adapter, `calc-plot.js`, `calc-tool-math.js` and the model `tools/math/riemann-sums.js` are untouched).
The Test yourself code (`quiz`, `stripsSvg`, the figures, the methods) is the old file's, byte for byte.

## The one main idea per screen

1. **More strips** (CED 6.2, 6.3): as the strips get thinner, their total closes in on the true area, the definite
   integral.
2. **Over or under** (CED 6.2): whether a sum is too big or too small follows from f rising or falling (left and
   right sums) or bending (midpoint and trapezoidal sums), and only when that holds on the whole interval.

## Research (rule 10): what exists and what we took

| Source | Seen how | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| GeoGebra "Left, Right, Midpoint Riemann Sums" (geogebra.org/m/ntu6vg7n, after Mulholland and Rubinstein) | page text (applet not run) | An n slider; a "position" slider for left, middle, right; the sum shown; an "actual area" button to compare | The kind of sum is a slider, the comparison hides behind a button, no reason for over or under | The n control and the exact value always beside the sum (our tank's line); the kind as four named buttons |
| Math Insight "Applet: Area of Riemann sum" (mathinsight.org/applet/area_riemann_sum) | page text (applet not run) | A point moved along the axis highlights one rectangle and shows its area calculation; the full calculation and the integral in panels | The calculation lives in three Show/Hide panels; positive f only | Tap a strip to read its term (in the cause line, not a panel); the strip table in "?" |
| SFU / MIT Mathlets "Riemann sums" (found as text in the search) | search result text only | Left, right, midpoint, trapezoid on one graph | Not opened | Nothing new |
| Desmos Riemann sum graphs | known as text (not fetched; WebFetch not used in this run) | The strips redraw at once as n changes | Bare rectangles, no error shown | No lag between n and the drawn strips (our split and merge runs 0.32 s and the numbers follow the drawn frame) |

What ours does better: the error is a colored region you can see (orange counted extra, green missed) and the over
or under verdict in tab 2 names the shape that causes it; the columns hold water and pour into a tank, so a sum is an
amount (the units are on the tank); every number is read from the drawn picture on every frame, including during a
split or merge of the strips.

## The design

### Tab 1, "More strips"
- **Picture:** the graph of the rate with its strips drawn as glass columns of water standing on the axis (a glint of
  light inside each, walls that fade when the strips are thinner than a few pixels, then a tick on the axis at each
  wall); beside them a measuring tank on a foot holds the columns' total, its amount above it ("134.7 L") and a thin
  "exact" line at the true value. The gap between each column's top and the curve is orange ("extra") where the column
  counts area above the curve and green ("missed") where it falls short. A column below the axis is reddish purple
  ("counts as negative") and drains the tank; a tank that can drop below where it started gets a "start" line.
- **Main control:** the strips' knob on a rail across the picture's top edge (`K.handle`, log scale 1 to 100 with
  faint ticks at 1, 2, 5, 10, 20, 50, 100, "1" and "100" at the ends, a tag "4 strips"). Keys: ← → one fewer or more
  (Shift: ten), Page Up doubles, Page Down halves, Home 1, End 100.
- **Secondary:** the four sums (Left, Right, Midpoint, Trapezoid) as a quiet switch on the picture's top left (on a
  phone, a row above the rail); "Fill one by one" under the picture (the tank drains through a tap, then each column
  pours into it along a stream, the cause line counting "poured 3 of 8 columns → tank 87.2 L"); a tap on a column
  outlines it and puts its term in the cause line ("strip 3 of 8 → 2.5 × r(5) → = 35.63 L").
- **Animates:** a change of n or of the sum blends the old tops into the new ones (0.32 s; the new walls come in as
  the old fade), the tank level follows; Fill one by one pours; after a fill any change refills the columns (0.4 s);
  a new curve cross fades.
- **Cause line:** "4 strips → left sum 134.7 L → exact 163.3 L → under by 28.6" (orange "over by", green "under
  by"); on a phone "left 134.7 L".
- **Takeaways:** at 100 strips "With 100 strips the left sum 162.1 L is only 1.2 from ∫₀¹⁰ r(t) dt = 163.3 L:
  thinner strips close in."; after Fill one by one "Poured together, the 4 columns hold 134.7 L: that is the left
  sum. The exact amount is 163.3 L.".

### Tab 2, "Over or under"
- The same picture; the four sums are the main control (larger, ringed, the first visit cue "Tap a sum"); the knob
  is quiet (its own n, starting at 3 strips so the error regions are large).
- **Cause line:** the shape, what it does to this kind's tops, the verdict, from the model's rule (`R.verdict`):
  "r increasing → left tops below r → underestimate"; "r concave up → trapezoid tops above r → overestimate";
  midpoint "f concave up → midpoint misses more than it adds → underestimate"; no rule: "f changes direction → no
  rule for left → this time under by 2.26". Tables: "values rise → left: under if r rises throughout", or "a table
  shows no bending → over or under not known".

### Both tabs
- Opens on "A pump speeding up", r(t) = 8 + t²/4 L/min on [0, 10], left sum, 4 strips. The picker ("Rate") lists two
  flows, six functions and two tables (optgroups). A table fixes the strips: the knob hides and the rail reads "The
  table sets the strips: 4 widths"; data points instead of a curve; no exact line and no error regions; midpoint
  disabled for an even number of points (the cyclist).
- One color per idea: water and the sum blue; negative columns reddish purple; extra orange; missed green; the
  curve, "exact" and the rule's shape pill ink.
- One cue per tab, once per device: "Drag for more strips" under the knob (the kit's "Drag" chip beside it); "Tap a
  sum" under the switch in tab 2.
- Reduced motion: every change lands at once with a short cross fade; Fill one by one shows the full tank and the
  takeaway at once.
- The stage fits the screen's height (`fitHeight()` below 1024 px wide): at 375x667 the knob, the picture and the cause
  line are on one screen.

## Explore against Test yourself

- **Explore:** the two tabs above. Nothing graded.
- **Test yourself:** unchanged. `ApCalcTools.drill` over the model's five kinds (table, overunder, context, sigma,
  tosum), the strips drawn on the problem's figure, every try marked on it, the method hints, first tries recorded as
  `riemann-sums:<context>:<step>`. `?seed=` and `#quiz` open it as before. The Premium card shows when locked, as
  before.

## What moved (nothing dropped silently)

| From the old Explore | Where it is now |
|---|---|
| n slider in the panel (1 to 40), cue "Drag n: more strips" | The strips' knob on the picture (1 to 100), cue "Drag for more strips" |
| Left / right / midpoint / trapezoid switch | On the picture: quiet in tab 1, the main control in tab 2 |
| Strips shaded, positive and negative in two tones | Glass columns of water; negative ones reddish purple and draining the tank |
| Error slivers (amber missed, pink extra) | Kept, recolored: green missed, orange extra (pink is now the negative columns) |
| "Add them one by one" with a running sum | "Fill one by one": the columns pour into the tank, the cause line counts |
| Exact value beside the sum | The tank's "exact" line and the cause line |
| Over or under explained from increasing/decreasing or concavity (caption and Why) | Tab 2's cause line; the full rules in "?" |
| Tap a strip to read its term | Kept: its term in the cause line, the strip outlined |
| Picker: 6 functions, 2 tables, 2 flows | Kept, grouped; a table fixes the strips (the knob hides) |
| Flow: the tank fills to the amount | The tank is now on every curve, the picture itself |
| Details: Δx, the sigma sum, the strip table, total and exact; all four side by side; for tables the area under one possible smooth f (labelled not given) | "?" |
| Why: verdict, meaning in units, negative strips, slivers, the rule, doubling n halves or quarters the error | "?" (units, negative strips, rules, error) and the cause line |
| Test yourself, record ids, `?seed=`, `#quiz`, the Premium lock | Unchanged |

## What is on screen in Explore (counted, opening state at 1440)

Outside the picture: 2 tabs, the purpose line (10 words: "Thinner strips: the sum closes in on the exact area."),
the "Rate" picker, "Show me how", the cause line (4 pills: "4 strips", "left sum 134.7 L", "exact 163.3 L", "under by
28.6"), "Fill one by one". That is 4 controls besides the tabs and about 22 words. No side panel, no table, no readout
cards. On the picture: the knob (the main control) with its tag "4 strips" and "1" / "100" at the rail's ends, the
four sums, 4 columns, the curve "r(t)", "missed", the tank with "134.7 L" and "exact", axes with ticks and titles; the
cue and chip on a first visit.

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)

- Two tabs: "More strips" and "Over or under".
- The strips are glass columns of water and a tank holds their total, for every curve and table (a function without
  units too; the cyclist's tank holds meters).
- The knob runs on a log rail from 1 to 100 strips (the old slider stopped at 40); Page Up doubles, Page Down halves.
- The kind of sum is shared by both tabs; each tab keeps its own n (tab 2 starts at 3 strips).
- Error colors: orange extra, green missed (the plan said blue for missed; the water is blue). The old amber and pink
  are gone; pink now means a negative column.
- Negative columns drain the tank; a "start" line appears in the tank when a total can fall below where it began.
- The tank's scale is fixed for each curve (it covers every running total of every sum from 1 to 100 strips), so it
  never rescales under the finger; on the cubic the tank is mostly empty.
- Fill one by one first drains the tank, then pours each column (about 3 s); after it the columns stay empty until the
  next change, which refills them.
- Takeaways at 100 strips (tab 1) and after Fill one by one; none in tab 2 (the cause line is the reason).
- The strip table, Δx, the sigma notation, all four sums, the rules, units and the table's possible smooth area moved
  to "?".
- A tap on a column reads its term; there is no keyboard path to one column (every term is in the "?" table).
- The tool opens on "A pump speeding up" (the old default was the first function).
- On phones in tab 2 the quiet knob's tag hides while the first visit "Tap a sum" cue shows (they share the row).
- The About text, the description, the blurb and the page line were reworded (in `calculus/data/tools/riemann-sums.json`
  and `calculus/data/pages.json`); title and URL unchanged.

## What was built

- `calculus/assets/tools/riemann-sums.js`: the Explore (`explore()`) and the mount rewritten; the quiz code kept.
  `calculus/assets/tools/riemann-sums.css`: the v2 styles appended (`.rs2*`; the old ones stay for the quiz figures).
  `calculus/data/pages.json`: `"kit2": true`, the description, blurb and page line. `calculus/data/tools/riemann-sums.json`
  (the source; `assets/tool-data/` is built from it): intro and how it works reworded (contexts unchanged).
- `scripts/tools-v2/calc-riemann-sums-sweep.mjs` (layout, `--fit`, `--frames`, `--dark`, `--shots`),
  `calc-riemann-sums-interact.mjs`, `calc-riemann-sums-perf.mjs`.

## Math checked (against `docs/apcalc-authoring-guide.md`, OpenStax Calculus Volume 1 §5.1 and §3.6, CED 6.2 and 6.3)

- Every column is the model's own piece (`R.pieces`, `R.tablePieces`), so the drawn area is the model's sum; the
  sweep reads the drawn path back and compares it with the words on every state and frame.
- Over or under comes from `R.verdict` and `R.shape` (unchanged): increasing gives left under and right over,
  decreasing the reverse; concave up gives trapezoid over and midpoint under, concave down the reverse; neither on
  the whole interval gives "no rule" and the actual side ("this time under by 2.26"). The sweep checks that
  "overestimate" only shows with more orange than green drawn, and "underestimate" the other way.
- With equal widths the trapezoid sum is the average of the left and right sums (in "?"); the error halves (left,
  right) or quarters (midpoint, trapezoid) as n doubles (in "?"); the limit of the sums as n → ∞ is the definite
  integral (in "?" and the 100 strips takeaway).
- Sigma notation and Δx in "?" are the old Details' code (Δt = (10 − 0)/8 = 1.25; Σ r(t₍ᵢ₋₁₎) Δt).
- Units: a column is a width in minutes times a rate in liters per minute, so the tank holds liters (the
  accumulated unit, not the rate's). Tables keep unequal widths; a midpoint sum from a table needs an odd number of
  points (the six point cyclist table has none).
- Logged for a teacher: water for plain functions and for distance, the "start" line for net signed area, and the
  midpoint wording (`docs/apcalc-needs-author.md`).

## Checks run (2026-11-24)

`node --test scripts/test/apcalc-*.test.mjs` (156 pass), `apcalcbc-*` (71 pass), `check-apcalc-content --check`,
`build-apcalc --check` (333), `build-apcalcbc --check` (420), `build-apmacro --check` (203), `check-site` (US spelling;
the meta description cut to 159 characters), `check-weight --check` all clean; `check-tool-use` with a local copy of
the list (never the committed file): this page reports tool-open, tool-touch, tool-mode and tool-use as frame v2,
nothing under automation.

- Sweep (`calc-riemann-sums-sweep.mjs`, one width per process): 134 states (ten curves and tables, tab 1 at 1, 4,
  12, 100 strips, each sum, a tap, a finished fill, tab 2 with each sum, and the first visit of each tab) at each of
  360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920, light and dark (dark asserted): 2,680 states, 58,200
  checks, 0 failures.
- Fit (`--fit`) at 390x844, 1024x768, 1280x800, 375x667 and 360x740, first visit and later, tab 1, tab 2 and a table:
  the knob, the sums, the picture and the cause line in view at once, no inner scroll (150 checks, 0 failures).
- Frames (`--frames`) at 390 dark and 1440 light: a real mouse drag of the knob, End (4 to 100 strips), Home, a change
  of sum, a tab change, Fill one by one, the refill after it and a fill with negative columns (about 1,960 frames):
  the cause line's sum is the drawn area and the tank's number its drawn level on every frame, no takeaway before the
  picture shows it, motion seen; leaving for Test yourself mid fill stops it and returns clean.
- Browser checks (`calc-riemann-sums-interact.mjs`): 69 passing: real touch drag at 390 (CDP), keys (←, Home, Page Up
  twice, Page Down, End with its takeaway, aria-valuetext current), Fill one by one with motion and its takeaway, the
  picture in view after it, a tap on a column reads its term, a click in the gap above a column selects nothing, "?"
  has one table row per strip, a mouse drag at 1440 (the tag follows), the four sums, tab 2's rule on the pump (left
  and trapezoid), the quiet knob in tab 2, a table (the knob hides, midpoint off), reduced motion (Fill lands at once),
  Test yourself by `?seed=7#quiz` (a wrong answer marked, Show the answer offered, the tries recorded as
  `riemann-sums:<context>:<step>`, the same problem on a second load), the Premium card when not unlocked (no stage),
  no console errors, light and dark. "?" opened during a fill pauses it.
- Perf at CPU x4 (`calc-riemann-sums-perf.mjs`, load 5.0 from other builders' sweeps; the flagship in the same run):
  390: knob 4 to 100 and back median 16.7 ms, p95 49.9 ms (5.4 ms main thread a frame); End 16.7 / 33.3 ms (4.1);
  Fill 100 columns 16.7 / 33.4 ms (3.1); tab 2 changes 16.7 / 33.4 ms (4.1); flagship 33.3 / 66.7 ms (9.1). 1440: knob
  16.7 / 33.4 ms (5.9); End 16.7 / 33.4 ms (5.0); Fill 16.7 / 50.0 ms (3.7); tab 2 16.7 / 16.8 ms (3.5); flagship 33.4
  / 83.3 ms (10.0). A run at load 8 missed the frame target on the drag (8.2 ms a frame) before the per frame layout
  reads were removed and the fast drag blend capped.

Preview: `/mnt/user-data/outputs/calc-riemann-sums-v2/index.html`, shots in `shots/` (sweep states at 360, 390,
768, 1440, light and dark, the fit and the frames runs).

## Not done, and what I am not happy with

- The picture is still a graph with water in it (the grid must stay so heights and areas are exact); less of a scene
  than the lake. The tank is honest but plain beside the flagship's landscape.
- Water for plain functions and for the cyclist's distance is a stretch (logged for a teacher).
- At 375x667 the plot is only about 150 px tall: the tabs, the two line purpose and the picker take the top of the
  screen.
- The pour stream is a dashed moving line (flow), the one dashed shape on the picture; a reviewer may prefer a solid
  stream.
- "extra" and "missed" name only the biggest region of each; the colours carry the rest.
- A tap on a column has no keyboard path (the "?" table lists every term).
- On the cubic the tank is mostly empty (its fixed scale has to hold the one strip right sum, 18.75).
- No real phone, no screen reader pass, no real students; GeoGebra and Math Insight were read as page text, applets
  not run; Desmos not fetched. The independent review is next.

## Review round 1 (2026-11-24)

The independent review (`/home/claude/review-calc-riemann/REVIEW.md`) blocked on four must fix items; all fixed:
1. **The Fill takeaway's amount.** `fillEnd` now sets the fill to the last column, draws that frame, then takes the
   number from `R.total(S.ps)`, so the sentence and the tank agree (the frames sweep asserts it).
2. **A midpoint sum from a table.** `midOk` also requires each shared point to be the true middle of its pair, so
   Midpoint is off for the inflow table (t = 0, 2, 5, 7, 12) as well as the cyclist, with the reason on the button;
   "?" and the About text say so. Test yourself's table drills now make each midpoint pair equally wide (`genTable1`),
   the unit test asserts a true midpoint table and the generated ones; record ids unchanged. Logged in the owner log
   and `docs/apcalc-needs-author.md` (the shared `riemannTable` helper is left for a person to check).
3. **The pour arc.** Removed. A column pours through a spout in the tank's left wall: a short solid stream inside the
   tank down to the water; a negative column, and the tank emptying before a fill, run out of a tap at the foot. No
   dashed shapes remain.
4. **The chip at 360.** No chip on phones (the cue names the knob); on wider screens it drops below the knob near the
   rail's ends and goes once any control is used.

Should fix, done: the error has its unit ("under by 28.6 L"); the error regions are opaque, lighter orange and green,
so nothing mixes into a color the legend lacks; the wave is 2 sin x on [0, 3π/2] (exact 2); "more missed than extra"
/ "more extra than missed"; "a table can't show bending"; a light meniscus under each column's top, thicker glass
walls, a wavy water surface in the tank, the spout and tap, numbered tank marks (0 and nice steps); phones get a
shorter purpose line and the stage fits the picture and the cause line (Fill may sit just below), so the plot is about
180 px tall at 375x667 (was 138); in tab 2 on phones the quiet knob waits until the "Tap a sum" cue goes. Not done:
the cubic's tank keeps its fixed scale (logged).

Checks after round 1: sweep 360, 390, 1024, 1440 light and dark (1,072 states, 23,280 checks, 0 failures); fit at
390x844, 1024x768, 1280x800, 375x667 and 360x740 (0 failures); frames at 390 dark and 1440 light (1,944 checks, 0
failures, the fill takeaway's amount equal to the tank's on every frame); browser checks 71 passing (Midpoint off for
inflow, the fill takeaway "134.7 L"); AB 157 and BC 71 tests pass; content check, `build-apcalc`, `build-apcalcbc`,
`build-apmacro --check`, `check-site` and `check-weight` clean. Perf at CPU x4 (load 4.7 to 5.0, flagship 33 to 50 ms
median and 9.3 to 11.7 ms main thread in the same run): 390 knob drag 16.7 / 33.4 ms (4.3 ms a frame), End 16.7 / 50.0
(4.1), Fill 16.7 / 33.4 (3.3); 1440 knob drag 16.8 / 50.0 (5.9), End 16.7 / 49.9 (3.7), Fill 100 columns 33.3 / 66.6
(4.9), tab 2 16.7 / 33.3 (3.5).

