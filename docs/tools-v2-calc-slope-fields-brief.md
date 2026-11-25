# Tools v2: AP® Calculus AB Slope fields (brief and build notes)

Status file for the v2 rebuild of `calculus/tools/slope-fields.html` (Premium, rollout row 78, group G, wave 16).
Standard: `docs/tools-v2-standard.md`; builder brief: `docs/tools-v2-builder-brief.md`; plan:
`docs/tools-v2-plans/calc-slope-fields.md`. Branch `claude/tools-v2-calc-slope-fields`, cut from `claude/tools-v2-all`.
NOT merged: the independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`.

The third calculus tool on the kit, through `ApCalcTools.studioKit2` and `K.handle`, `K.drag`, `K.cause`, `K.cue`,
`K.tour` as they are. No shared file changed: the kit, the adapter, `calc-plot.js`, the model
`tools/math/slope-fields.js`, the Riemann sums tool (another builder, same day) and the other calculus tools are
untouched. AB's and BC's builds pass `--check` (BC's page is `from: "ab"`, so it gets the same tool).

## The one main idea

The slope field shows the direction at every point; one starting point picks out one solution, which follows it.

## Research (rule 10): what exists and what we took

| Source | Seen how | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| GeoGebra "DE, Slope Fields, and Euler's Method" (geogebra.org/m/gd8f23bn) | page text and its instructions (applet not run here) | Drag the initial point A; type a differential equation; "if your function doesn't run along the slopes, it is not a solution" | Corners P1 and P2 to drag for the region, an equation box, an Euler step: many controls before the idea | The drag of the starting point with the solution redrawn at once; the "runs along the slopes" test as our cause line and "?" |
| Desmos "Slope (Direction) Field" (desmos.com/calculator/xwhlnodfyt) | not readable here (the scrape returned no picture); known as text | A clean field of short even segments, an initial point on a slider | The point is set by sliders beside the graph | Short even streaks, all the same length on screen, never crowding the curve |
| Ximera "Slope fields and Euler's method" (ximera.osu.edu, mooculus) | page text and figure captions | Predict, then reveal: "is y increasing at this point?", then the slope; autonomous fields have the same slope along every row; equilibria are where the slope is 0 | Static figures, nothing to drag | Predict then reveal stays in Test yourself (the sketch step); the equilibrium as a line where every streak is flat; the row test in "?" |

What ours does better: the leaf is dropped on the picture itself (drag, tap or arrow keys), the solution through it is
drawn both ways at once, and on release the leaf floats forward along it, so "the solution follows the field" is seen,
not told; the cause line works out the slope at that very point with its numbers.

## The design

- **Picture:** a river seen from above, filling the stage: grass banks with tufts, a sandy shore with pebbles, reeds
  at two corners, the water a deep gradient with a soft shine. The grid, the axes and the tick numbers are exact (the
  numbers sit on the banks). Every field segment is a short current streak in the water, all the same length on
  screen, with the slope dy/dx at its center (one every 44 px, 32 px on a phone; never shorter than 14 px). An
  equilibrium solution is a calm line: a band of still water with a teal line, labelled "equilibrium y = 2".
- **Main control: the leaf.** A green leaf, turned along the slope where it sits, inside the kit's ring knob (`K.handle`
  with a 2D value: `enc(x, y)` on the 0.1 grid, `pick(x, y)` from the finger, `keys` for arrows). Drag it, tap the water
  (the leaf comes there and can be dragged on), or use the keys. The solution through it is drawn at once, both ways,
  in crimson (the leaf's path), and stops at the edge of the water or where the slope turns vertical (an open circle,
  "domain ends").
- **Animates:** on a drop the leaf floats forward along its solution to the edge (0.8 to 1.7 s, eased, a small wake
  behind it), fades there, and a fresh leaf settles at the start; a new equation cross fades the streaks and the curve
  and then floats; k and the room temperature turn the streaks as they are dragged; "Check with the formula" draws its
  line in. Reduced motion: no float, a short cross fade, the takeaway at once.
- **Cause line:** "at (−2, 2.5) → y′ = 2.5 − 2 = 0.5 → heading up 0.5 for 1 across → above 2, so it moves away from 2";
  cooling "at (0, 90) → T′ = −0.08(90 − 20) = −5.6 → falling 5.6 °C a minute → above the room, so it falls toward 20";
  growth "… → k > 0, so it grows: doubles every 2.31"; x / y "… → vertical at x ≈ 1.73, so the domain ends"; on an
  equilibrium "on y = 2, so it stays at 2". Shorter forms when the line has no room (one row at 1280 px and wider, two
  below; phones "(−2, 2.5) → y′ = 0.5 → away from 2"). The line keeps one height, so the picture never jumps.
- **Takeaway** (when the leaf has arrived): "One starting point, one solution: y = 2 + 0.5e^(x + 2)." (the particular
  solution through the start, from separation of variables); on an equilibrium "… the flat line y = 2."; for x + y
  "One starting point, one solution (traced: y′ = x + y is not separable)."
- **The two models:** growth and decay (y′ = ky) and cooling (T′ = −k(T − Tₐ)) add a quiet k knob on the top bank
  (`K.drag`, tag "k = 0.3"); cooling adds the room temperature as a quiet knob on the right edge at the calm line
  ("room 20 °C") and a mug on the bank whose side reads the temperature where the leaf is drawn (it follows the
  floating leaf). Growth and decay mark ×2, ×4 … (or ×1/2, ×1/4 …) on the curve.

## Explore against Test yourself

- **Explore:** the river above. Nothing graded, no side panel.
- **Test yourself:** unchanged, byte for byte (`quiz()`, `figure()`, `sketchFig()` and the rest are the old file's):
  `ApCalcTools.drill` with six kinds (slopes, match, sketch, separate, concavity, exp; contexts slopes, match, sketch,
  separate, concavity, bacteria, isotope, drug, town), the sketch step graded by `sketchGrade`, first tries recorded as
  `slope-fields:<context>:<step>`. `?seed=` and `#quiz` open it as before; without a pass the Premium card shows as
  before.

## What moved (nothing dropped silently)

| From the old Explore | Where it is now |
|---|---|
| Draggable starting point (cue "Drag the starting point") | The leaf (`K.handle`), cue "Drag the leaf" |
| Solution traced both ways (adaptive Runge-Kutta) | Kept, drawn at once; the leaf floats forward along it on release |
| Exact particular solution dashed over the curve | "Check with the formula" (off at first): a thin solid purple line labelled with its formula; no dashes |
| Tap a grid point: its slope worked out | A tap on the water moves the leaf there and the cause line works out the slope at that point |
| Equation chips: x + y, x / y, xy, y − 2, ky, Cooling | All six in the equation picker beside "Show me how" (y − 2 first) |
| k for growth and decay and for cooling | A quiet knob on the top bank (only for those two) |
| Room temperature Tₐ (in More options) | A quiet knob on the right edge at the calm line (cooling only) |
| Field density (Sparse, Normal, Dense, in More options) | Set by the screen: about one streak every 44 px (32 on a phone), each at least 14 px long; explained in "?" |
| Doubling and half-life marks (×2, ×1/2) | Kept on the curve |
| Open end where the slope turns vertical | Kept, with "domain ends" |
| "Start over" | The frame menu's Start over (`s.startOver`): y′ = y − 2 at (−2, 2.5), k, the room and the formula's line reset; a new equation also starts its leaf at its default spot |
| Pills: slope, concave up or down, doubling time, domain ends, equilibrium | The cause line (slope, where it goes, doubling or half-life, domain ends, stays); concavity moved to "?" |
| Why (what the curve does), Details (separation through the point, the numbers) | "?": the equation, the numbers (start, slope worked out, second derivative and concavity, where the curve was drawn from and to, k, doubling time or half-life, the gap's halving time), the separation of variables through the point, why, how it is drawn, the keys, the notes |
| Test yourself, record ids, `?seed=`, `#quiz` | Unchanged |

## What is on screen in Explore (counted, opening state at 1440)

Outside the picture: the purpose line (8 words: "A solution follows the slope at every point."), the equation
picker, "Show me how", the cause line (4 pills: "at (−2, 2.5)", "y′ = 2.5 − 2 = 0.5", "heading up 0.5 for 1 across",
"above 2, so it moves away from 2"), "Check with the formula". That is 3 controls (picker, Show me how, Check) and about
22 words. No side panel, no table, no readout cards.
On the picture: the river (banks, streaks, grid, axes, ticks, axis names), the calm line with "equilibrium y = 2", the
crimson solution, the leaf in its ring (1 main control), the cue and the "Drag" chip (first visit). Growth and decay add
the k knob; cooling adds the k knob, the room knob and the mug.

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)

- The field is a river seen from above; each segment is a current streak, an equilibrium a calm line; the grid, axes
  and tick numbers stay exact.
- The starting point is a leaf in a ring knob; a tap on the water moves it there; on release it floats forward (in x,
  the direction time runs) along the solution to the edge, then a fresh leaf settles at the start.
- Explore opens on y′ = y − 2 at (−2, 2.5) (above the calm line, so the leaf floats away from it), not on x + y (the old
  default, not separable and so outside AB's solving).
- The picker lists all six old equations in the order y − 2, xy, x / y, x + y, ky, cooling.
- "Check with the formula" starts off and draws a thin solid line in its own color, labelled with the formula; for
  x + y it draws the exact solution y = Ce^x − x − 1 (outside AB), said so in "?".
- The field density control is gone: spacing follows the screen (44 px, phones 32 px, streaks at least 14 px).
- The room temperature knob sits on the calm line at the right edge; k sits on the top bank; both quiet.
- The mug on the bank reads the temperature where the leaf is drawn (so it falls as the leaf floats).
- Growth and decay use t from 0 (the old view widened them to negative t on wide screens).
- Concavity moved from a pill to "?"; the takeaway gives the particular solution through the point.
- The cause line keeps one height (one row at 1280 px and wider, two rows below, the kit's on phones) and drops the
  "heading" pill, then shortens, when it has no room.
- The old "Start over" button is gone; the frame menu's Start over does it (y − 2 at (−2, 2.5), k, the room and the
  formula's line reset).
- The tool's About text (intro and how it works), the description, blurb and lede were reworded for the new Explore
  (in `calculus/data/tools/slope-fields.json` and `calculus/data/pages.json`); title and URL unchanged.

## What was built

- `calculus/assets/tools/slope-fields.js`: the Explore (`explore()`) and the mount rewritten on the kit; the quiz code
  and its helpers kept byte for byte. `calculus/assets/tools/slope-fields.css`: the v2 styles appended (`.sf2*`; the old
  ones stay for the quiz figures). `calculus/data/pages.json`: `"kit2": true`, desc, blurb, lede.
  `calculus/data/tools/slope-fields.json`: intro and how it works (contexts unchanged).
- `scripts/tools-v2/calc-slope-fields-sweep.mjs` (layout; `--dark`, `--fit`, `--frames`, `--shots`),
  `calc-slope-fields-interact.mjs` (browser checks), `calc-slope-fields-perf.mjs` (frame times beside the flagship).

## Math checked

- Each equation's field: every drawn streak's slope at its center is f there (the sweep reads every streak back from
  the picture, at every state and width).
- Solutions: the traced curve passes through the drawn start, stays in the water, and the particular solution from the
  formula sits on it to under 0.75 px (perpendicular distance; the sweep, every state). Every formula string the tool
  writes is checked against the model's exact solution at about 70 start points per equation (interact).
- y = 2 + (y₀ − 2)e^(x − x₀); y = y₀e^((x² − x₀²)/2); y = ±√(x² + y₀² − x₀²) with the sign of y₀ (y = ±x on y² = x²,
  stopping at the origin where x / y is 0 / 0); y = y₀e^(k(t − t₀)); T = Tₐ + (T₀ − Tₐ)e^(−k(t − t₀)).
- Equilibria: y = 2 (unstable), y = 0 for xy and ky (ky: unstable for k > 0, stable for k < 0, every line for k = 0),
  T = Tₐ (stable). Second derivatives in "?": y − 2; y + x²y; (y² − x²)/y³; 1 + x + y; k²y; k²(T − Tₐ).
- Only separable equations are solved; x + y is labelled not separable (authoring guide exclusions). Contested points
  are in `docs/apcalc-needs-author.md`.

## Checks run (2026-11-24)

`node --test scripts/test/apcalc-*.test.mjs` (156 pass), `apcalcbc-*` (71 pass), `check-apcalc-content --check`,
`build-apcalc --check` (333), `build-apcalcbc --check` (420), `build-apmacro --check` (203), `check-site`, `check-weight
--check` all clean; `check-tool-use` with a local copy of the list (never the committed file): this page reports
tool-open, tool-touch, tool-mode and tool-use as frame v2, nothing under automation.

- Sweep (`calc-slope-fields-sweep.mjs`, one width per process): 68 states (every equation at its start, the four
  corners, the formula on, after a float; on an equilibrium, vertical ends, k and the room at their ends) at each of
  360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920, light and dark (dark asserted), plus a first visit at each:
  1,360 states, 32,240 checks, 0 failures.
- Fit (`--fit`) at 390x844, 1024x768, 1280x800, 375x667 and 360x740, for y − 2, cooling and growth: the leaf's knob,
  the picture and the cause line in view at once, no inner scroll.
- Frames (`--frames`) at 390 dark and 1440 light: every frame of a float on each equation, a new equation, the
  formula drawing in and a real drag then float (about 2,570 frames): the leaf on the drawn curve and turned along it,
  the mug reading the drawn leaf, the takeaway never while the leaf floats, the cause line's point the drawn start;
  leaving for Test yourself mid float stops it.
- Browser checks (`calc-slope-fields-interact.mjs`): 65 passing (real touch drag at 390, a tap on the water, keys with
  aria-valuetext current, the float and its takeaway, the picker, k and the room dragged, Check with the formula, every
  formula against the exact solution, "?" filled on a fresh page and following, the menu's Start over, reduced motion,
  Test yourself by `?seed=7#quiz` with a wrong answer, Show the answer and the tries recorded as
  `slope-fields:<context>:<step>`, the Premium card without a pass, no console errors), light and dark.
- Perf at CPU x4 (`calc-slope-fields-perf.mjs`, load about 2, the flagship in the same run): 390: drag median 16.7 ms,
  p95 16.8 ms (2.5 ms main thread a frame); float 16.7 / 16.7 ms; new equation 16.7 / 16.8 ms; k drag 16.7 / 16.8 ms.
  1440: drag 16.7 / 33.4 ms (3.5 ms); float 16.7 / 16.8 ms; new equation 16.7 / 16.8 ms; k drag 16.7 / 33.4 ms (3.6
  ms). Flagship 33.3 / 66.6 ms (390) and 33.3 / 83.2 ms (1440).

Preview: `/mnt/user-data/outputs/calc-slope-fields-v2/index.html`, shots in `shots/` (sweep states at 360, 390, 768,
1024 and 1440, light and dark; fit; frames; mid float).

## Not done, and what I am not happy with

- The river is a calm, flat scene: banks, sand, reeds and water, but less material than the flagship's lake and farm.
- The leaf floats only forward (x increasing); the curve upstream is drawn but never ridden.
- On phones the k knob's track is short (about 80 to 150 px) beside the mug.
- With the leaf on the very top or bottom edge the ring reaches onto the bank.
- Desmos could not be read here; GeoGebra and Ximera were read as text (applets not run).
- No real phone, no screen reader pass, no real students; the independent review is next.

## Review round 1 (2026-11-24)

The independent review (`/home/claude/review-calc-slope/REVIEW.md`) blocked on one must fix; fixed:
1. **y′ = x / y through the origin.** From (1, 1) or (−1, 1) the tracer stepped over (0, 0), so the curve crossed it
   with no open end and "?" wrote y = √(x² + 0). Now `solution()` cuts each run where it reaches x = 0 on y = ±x and
   marks that end "undefined" (open circle, "domain ends", the cause line "undefined at (0, 0), so the domain ends",
   "?" rows "(0 / 0 at the origin)"); "?" ends the separation with "y = x, x > 0" (or −x, x < 0) and the takeaway adds
   the domain. The sweep has (1, 1), (−1, 1) and (1, −1) and asserts no drawn point is across the y axis and an open
   end sits at (0, 0).

Should fix, all done: the takeaway is one span (the kit's line is a flex row) with the formula in a no wrap span and
its exponent a superscript; labels on the water draw exponents as superscripts too (`data-plain` keeps the text); no
streak runs through a placed label (the sweep checks); the picker reads "y′ = ky, growth and decay" (phones give the
picker up to 250 px); a new equation fades the water and the labels only, never the banks; light streaks have a dark
under stroke and the water's top is a step darker; a y tick number beside the leaf's ring moves out past it instead
of hiding; e^(x) is e^x.
