# Tools v2: AP® Precalculus Function lab (brief and build notes)

Status file for the v2 rebuild of `precalculus/tools/function-lab.html` (free, rollout row 117, group G, wave 20).
Standard: `docs/tools-v2-standard.md`. Plan: `docs/tools-v2-plans/pcalc-function-lab.md`. Branch
`claude/tools-v2-pcalc-function-lab`, cut from `claude/tools-v2-all`. NOT merged: an independent review comes first.
Decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

This is the first AP® Precalculus tool on the kit, so it adds the course adapter:
- **`ApPrecalcTools.studioKit2`** in `precalculus/assets/tools/pcalc-tools.js` (the pattern of `ApCalcTools.studioKit2`):
  a trainer passes `studio: { kit2: fn }` to `T.modes`; Explore then shows the tool's own stage full width with its
  reference behind "?", and Test yourself stays the course's shared drill, untouched. Trainers without `kit2` take
  the old path, byte for byte.
- **`"kit2": true`** for this page only in `precalculus/data/pages.json`; `scripts/build-apprecalc.mjs` then adds
  `tool-kit2.css` and `tool-kit2.js` (same two lines as `build-apcalc.mjs`). Only `function-lab.html` changes in the
  build; AB and Macro builds `--check` clean.
- The pins are the kit's `K.handle` on the tool's own picture (it draws its own svg, like the Tangent tracer, and maps
  its own coordinates; `pcalc-plot.js` is used only by Test yourself's figures). `K.handle` is one value per knob, so
  each pin encodes two numbers in its value (the square pin h and k, the round pin a and the rung of b); keys and the
  screen reader text are the tool's (`keys`, `valuetext`). No kit change.

## The one main idea

g(x) = a·f(b(x − h)) + k: h and k slide the graph, a stretches it up and down, b squeezes it sideways, and every point
moves by the same rule, (x, y) → (x/b + h, a·y + k). One screen, one main control (the square pin), one second control
on the same idea (the round pin).

## Research (rule 10): what exists and what we took

| Source | Seen how | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET "Graphing Quadratics" (phet.colorado.edu/en/simulations/graphing-quadratics; its teacher guide PDF) | Page and guide text only (the sim itself was not run here; the pages describe a Vertex Form screen where students "explore transformations of a parabola") | Direct manipulation of the vertex; the equation follows | Quadratics only | Two handles, nothing else needed to play; the formula follows the handles |
| GeoGebra "Quadratic Functions: Vertex Form" (geogebra.org/m/DKqSmxK9) | Page text seen (the applet did not load in the fetch) | Sliders a, h, k; the vertex V labelled; a target point to hit | Sliders beside the graph, not the graph itself; no parent shown | The vertex as the (h, k) pin; the reflection when a < 0 |
| Desmos calculator (desmos.com/calculator) and GeoGebra home (geogebra.org) | Fetch blocked here (permission not answered); known only from the plan's notes | Sliders for a, b, h, k | Sliders are a panel | Not taken: the pins replace the sliders |

What ours does better: the parent stays as a labelled gray wire, every key point is a bead whose parent point has the
same colour, and while a pin moves an arrow runs from each parent point to its bead, so "every point moves the same
way" is seen (parallel arrows for a translation, arrows fanning out from (h, k) for a dilation). Show the steps plays the
four changes in the order they act, each named on the cause line.

## The design

- **Picture:** a workshop pegboard in a wooden frame. The holes are the grid (one hole per unit; π/4 apart sideways for
  sine), the painted lines are the exact axes with their numbers, and the graph of g is a bent steel wire with a
  shadow on the board. The parent f is a thin matte gray wire behind it, labelled "f(x) = x²". Asymptotes are thin red
  threads across the board, each labelled ("asymptote x = 1"). Key points are coloured beads on g; the matching
  points on f are small dots of the same colour (open ones hollow: the piecewise jump).
- **Main control:** the square pin at (h, k), where the parent's origin goes (`K.handle`; tag "h = 2, k = −1"). Drag
  it anywhere; arrows step 0.1 (Shift: 1), Home puts it at (0, 0).
- **Second control:** the round pin on one key point (tag "a = 1, b = 1"). Up and down sets a (tenths, never 0: past 0
  the wire flips); sideways sets b, snapping to the rung of a ladder nearest the finger (tenths from 0.5 to 3; below
  0.5 the reciprocals 0.4, 1/3, 1/4, 0.2, 1/8, 0.1, so the width factor 1/b is a clean 2.5, 3, 4, 5, 8 or 10). Past h
  the pin is on the other side and b is negative. It waits small and quiet until the square pin has been used.
- **Animates:** the wire glides to each new shape (a fast follow under a finger; 220 ms for a key; a flip passes
  through flat in 420 ms, so it is seen turning over); a new parent morphs (the old wire fades as the new one comes in,
  with the same a, b, h, k); Back to f glides home; Show the steps first glides the wire back onto f, then plays b
  (dilate, then reflect over the y-axis), h, a (dilate, then reflect over the x-axis), k, each held a moment.
  Reduced motion: each change at once with a short fade; Show the steps goes one step per press ("Next step").
- **Cause line** (`K.cause`, from what is drawn at that frame): "h = 2, k = −1 → every point right 2, down 1";
  "a = 2 → twice as tall + b = 0.5 → twice as wide"; "a = −1.5 → flipped upside down, 1.5 times as tall"; during the
  steps "Step 2 of 5: h = 0.6 → every point right 0.6", in the CED's words for the step ("horizontal dilation",
  "reflected over the y-axis"). After the steps, the takeaway: "Every point moves the same way: (x, y) → (x/b + h,
  a·y + k)."
- **Labels:** the wire's own label is the formula in the transformation form with the numbers that are not 1 or 0,
  tinted by pin ("g(x) = 2·f(0.5(x − 2)) − 1"), on a pill with a short leader to the wire; the parent's label the same
  way. Labels keep 6 px from every number, tag, bead, knob and the cue; never sit on their own wire; on a crowded phone
  board they take the nearest free spot (longer leader), and as a last resort an axis number under the wire's label is
  hidden while covered. An axis number under a pin, a tag or the cue hides while covered too (never half covered).
- **Outside the picture:** the purpose line "Every point of f moves by the same rule." (8 words), the parent picker,
  Show me how, the cause line, Show the steps, Back to f.

## Explore against Test yourself

- **Explore:** the board above. Nothing graded.
- **Test yourself:** unchanged: the shared drill with its five contexts (identify, point map, describe, rational,
  exponential), the method hints, Show the answer, first tries recorded as `function-lab:<context>:<step>`. `?seed=`
  and `#quiz` still open it.

## What moved (nothing dropped silently)

| From the old Explore | Where it is now |
|---|---|
| Ten parents in a menu | The parent picker beside Show me how (the same ten) |
| Parent as a dashed ghost | A thin solid gray wire labelled with its formula |
| Square handle (h, k) | The square pin, main control |
| Round handle (a up and down, b sideways), cue key `apprecalc-function-lab-drag` | The round pin, same key; it waits until the square pin is used |
| "Pick one parameter and slide it" (panel slider, exact values) | Gone: the pins and their keys set every value (a and h, k in tenths; b on its ladder) |
| Formula line over the graph | The wire's label (transformation form); the concrete form (TeX) in "?" |
| Sentence in words | "?" (and the cause line says the last change in words) |
| Table of key points (same colours on graph and table) | "?" (the beads keep those colours; the round pin's row is marked) |
| Features: zeros, asymptotes with one-sided limits, end behavior in limit notation, domain, range | "?" (asymptotes are also drawn and labelled) |
| Zeros ringed on the x-axis | "?" only |
| One focused mapping line (dotted) | Arrows from every parent point to its bead while a pin moves and during the steps (solid, thin) |
| Play the steps | Show the steps (secondary), now ending on the takeaway |
| Reset to f | Back to f (a small button beside Show the steps) |
| Keyboard notes, "Inside and outside", order | "?" |

## What is on screen in Explore (counted; Playwright, opening state at 1440 and 390)

Outside the picture: the purpose line (8 words), "Parent" and its picker, "Show me how", the cause line (2 pills, 7
words), "Show the steps", "Back to f": 4 controls and about 25 words. No side panel, no table, no readout cards.
On the picture: the board with its axes and numbers; the steel wire g and its label; the gray parent and its label;
4 beads and 4 parent points (quadratic); 2 pins with their tags; the cue on a first visit. Only while true: asymptote
threads and their labels, the arrows (while a pin moves), the round pin's "Drag" chip (after the square pin's first use).

## Decisions made for the owner (also in `docs/tools-v2-owner-log.md`)
- The picture is a pegboard with a bent steel wire (a physical scene, not a real-world situation: the idea is the
  same for every parent, so no single context such as a ball's path fits all ten).
- The round pin rides on the wire when the square pin moves (its a and b do not change, only where it sits).
- The panel parameter slider is gone; b moves on a ladder of clean values (|b| from 0.1 to 3).
- The pins stay on the board and never come closer than 38 px (phone) or 44 px; a pin stops at the board's edge.
- After a resize or a new parent, the pins are pushed back onto the board (if that fails: a = b = 1 at the origin).
- Back to f is kept outside the picture (rule 8: reset always there), a fourth control beyond the plan's three.
- Zeros are no longer ringed on the picture (listed in "?").
- In a free drag the cause line uses plain words ("twice as tall", "flipped upside down", "flipped left to right");
  Show the steps and "?" use the CED's terms (dilation, reflection over an axis). A flip in a drag is about the pins'
  lines (y = k, x = h), so "over the x-axis" would not match the picture there.
- Axis numbers hide while a pin, a tag, the cue or (crowded phones only) the wire's label sits on them.
- The tool's About text (data `intro`, `howItWorks`) was reworded for the pins; title, description and URL unchanged.

## What was built
- `precalculus/assets/tools/function-lab.js`: Explore rewritten (`explore()`); Test yourself (`quiz()`) unchanged
  byte for byte; boot loads the kit if a cached page lacks it (as the Tangent tracer does).
- `precalculus/assets/tools/function-lab.css`: the v2 styles appended (`.fl2`, light and dark); the old ones stay for
  Test yourself's figures.
- The adapter `ApPrecalcTools.studioKit2`, `"kit2": true`, the build's kit links (above).
- `precalculus/data/tools/function-lab.json`: `intro` and `howItWorks` reworded.
- Kept checks: `scripts/tools-v2/pcalc-function-lab-sweep.mjs` (one width per process),
  `scripts/tools-v2/pcalc-function-lab-frames.mjs` (frame by frame), `scripts/tools-v2/pcalc-function-lab-perf.mjs`.
- `window.ApPrecalcFunctionLab` is set only when a test sets `window.LevlToolTest` before load.

## Checks run (2026-11-24)
- `node --test scripts/test/apprecalc-*.test.mjs` 143 pass; `check-apprecalc-content --check` 0 failing;
  `build-apprecalc --check`, `build-apcalc --check` (333), `build-apmacro --check` clean; `check-site` OK;
  `check-weight --check` all 626 budgets in range; `check-tool-use` with a local uncommitted copy of its list: this
  page sends tool-open, tool-touch, tool-mode and tool-use (frame v2), nothing under automation.
- Sweep, one width per process, light and dark, at 360x740, 390x844, 430x932, 600x960, 768x1024, 820x1180, 1024x768,
  1280x800, 1440x900, 1920x1080: 1460 states, 30220 checks, 0 failures (board 90 to 95 percent of the stage). Each width: a first visit (one cue, whole, covering
  nothing; at 390x844, 1024x768 and 1280x800 the board, both pins, the cause line and Show the steps in view with no
  scroll), the opening, every parent at six landmark states and after the round pin, Show the steps to the takeaway,
  "?" (table and features), and once #quiz. Dark is asserted (the `nremt_theme` key, and the board's dark fill).
- Frames (`pcalc-function-lab-frames.mjs`, motion on) at 390 and 1440: about 800 frames each, 0 failures: fast drags and
  reversals of both pins, the flip across h, a real CDP touch drag, Shift and arrow jumps, Show the steps (steps 1 to 5
  each named while moving), a new parent (morph), Back to f, and leaving for Test yourself mid run (no loop left,
  Explore back clean).
- Perf (`pcalc-function-lab-perf.mjs`, CPU x4, the reciprocal, the flagship in the same run, machine load 0.9):
  390: every run median 16.7 ms, p95 16.8 ms, main thread 2.4 to 4.2 ms a frame (flagship: median 33.3, p95 50.0,
  8.3 ms). 1440: drags median 16.7, p95 50.0; Show the steps p95 66.6 (one miss of the p95 target); morph p95 33.3;
  main thread 2.8 to 5.5 ms a frame (flagship: median 33.3, p95 50.0, 8.4 ms). The board is its own svg layer (painted
  once per layout), so a frame repaints only the wires, beads and labels.
- Flaky once: a 1920 sweep run reported a label touching a knob and a number under a knob in one state each; three
  later runs at 1920 were clean. Watch for it in review.

## Not done, and what I am not happy with
- The scene is a pegboard, not a situation the function comes from; it is a drawn object with depth, but less of a
  place than the lake.
- On a 360 px phone the board is crowded: the wire's label sometimes sits away from the wire (with a leader), and as a
  last resort hides one axis number.
- The round pin's tag reads the cap "b = ±3" for the fraction of a second a flip passes through flat.
- Desmos and GeoGebra could not be opened here (fetch blocked); their parts of the research come from the plan.
- Frame times on this shared machine are noisy (other builders' sweeps ran at the same time); compare with the flagship
  row of the same run.
- No real phone, no screen reader pass, no real students; the independent review is next.

## Review round 1 (2026-11-24)

The independent review (`/home/claude/review-pcalc-fn/REVIEW.md`) blocked on three must fix items. All are fixed, along with every should fix:
1. **Numbers mid flip.** While a flip passes through flat (|drawn b| over 3, |drawn a| under 0.05), that number is
   not a value of the slider. It now reads "flipping": the tag says "a = 2, b flipping", the wire's label shows the
   letter ("g(x) = 2·f(b(x − 2)) − 1"), and the cause line says "b flipping → flipping left to right". This holds in
   drags, Back to f and the steps. A reflection step names its own value for the whole step ("b = −0.7 → reflected
   over the y-axis").
2. **Show the steps' first phase.** It now cross fades g back onto f: the old wire fades out, the parent fades in, and
   the pins fade out at g's places and back in at f's. Nothing passes through flat in that phase. In any played change
   (a step through flat, Back to f) the round pin fades out while it is within 40 px of the square pin, so the knobs
   never sit on each other; a drag still keeps them 38 to 44 px apart. The frames check asserts this every frame
   (knobs never touch while both show), including a run with a < 0 and b < 0.
3. **Reduced motion steps.** At a stop (each press with reduced motion, and each hold with motion on), the step just
   done is shown finished and named with its result ("Step 1 of 4: b = 0.5 → horizontal dilation: twice as wide").
   The last step has its own stop before the takeaway. The sweep asserts that every step's result is named.

Should fix, done:
- Leaders are at most 40 px (70 px only for a wire mostly off the board). Before a longer leader is used, a label may
  cover a painted number instead.
- The live region speaks once the glide has settled, so it reads the new state.
- The page lede is now "Drag the pins and watch every point of f move." and the blurb "Drag two pins and watch every
  point of a graph move." (desc kept).
- "?" Zeros says "none" when g has no zero at all, and "none on the board" only when its zeros are off the board.
- Each half axis keeps at least one number on show. Tags choose the side that covers the fewest numbers and slide up
  to 60 px; labels never cover a half axis's last number; a covered half axis shows a spare (an odd number, or the same
  number on the other side of the axis).

The sweep and the frames check gained these assertions. The sweep also waits for the web fonts (labels and numbers are
measured with them), and the tool measures again once they load. A resize now lays the board out again before the next
paint (in the ResizeObserver callback, not a frame later). That one frame of old geometry was the cause of the 1920
flake; after the change, two full 1920 runs were clean.

Checks after round 1: the sweep at 360, 390, 1024, 1440 and 1920, light and dark, 0 failures; frames at 390 and 1440,
0 failures; `apprecalc-*` 143 pass, content check, the three builds `--check`, `check-site`, `check-weight` clean.
(These docs were first written into the wrong worktree by mistake and moved here in recheck 1.)

## Recheck 1 (2026-11-24)

The recheck held all eight round 1 items and blocked on two must fix items. Both are fixed, along with every should fix:
1. **The wire is never unlabelled.** The label tries, in order: a spot clear of everything with a leader of at most
   40 px; the same while covering a painted number (one number per half axis is kept); a leader of at most 70 px; then
   ever longer "loose" leaders. A loose leader stops at the first pin or tag it meets: the pin sits on the wire, so it
   still points at it. The sweep fails any state without a wire label. It gained the reviewer's two states, the square
   pin low left and the round pin across h, for every parent.
2. **Label in the cross fade.** In the first half of Show the steps' cross fade, the wire's label sits on g's fading
   wire and fades with it (and with the pins); in the second half it comes back on f.

Should fix, done:
- No leader passes under a tag, a knob, the chip or the cue. Leaders are measured as drawn, and a clear anchor on the
  line is searched for. The sweep checks both and counts states with a leader over 41 px: 10 of 186 at 360 and 8 at 390,
  all corner or crowded states.
- The round pin's keys skip any value or rung too close to the square pin, so they can flip a and reach b < 0. The
  frames check asserts this at 390.
- This round's decisions are logged here and in the owner log.
- Labels are measured from the drawn text when the browser has it, and the tool measures again each time a font finishes
  loading (a weight is fetched the first time it is used).

Checks after recheck 1: the sweep at 360, 390, 1024 and 1440, light and dark: 744 states, 15456 checks, 0 failures.
The frames check ran about 1400 frames each at 390 and 1440, with 0 failures (7 end checks, the key flip included).
Not happy with: the first exponential state after a parent change failed its first probe at 390, 1024 and 1440 (a wire
label off the board for an instant) and passed 300 ms later. The sweep now probes a failing state a second time and
lists each such case ("second look"). The likely cause is the late re-measure after a font loads on a loaded shared
machine (load about 6 on 2 cores); not reproduced when that width ran alone.

