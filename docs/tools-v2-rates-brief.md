# Tools v2: AP® Biology Rates and percent change (brief and build notes)

Status file for the v2 rebuild of `bio/tools/rates.html` (rollout row 26, group G, free). Standard:
`docs/tools-v2-standard.md`; builder rules: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-rates`, cut
from `claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions made for the owner are also one
line each in `docs/tools-v2-owner-log.md`.

## The one main idea
**A rate is how much something changes per unit of time: Δy ÷ Δt, the slope of the amount against time; percent
change compares a change with where it started.** CED skill `stats-rates`. The AP® Biology formula sheet (College
Board, Equations and Formulas, Appendix A, read here) lists under Rate and Growth: Rate = dY/dt, with "dY = amount of
change" and "dt = change in time" (the current sheet, via Cognito; the lab manual's Appendix A agrees). Percent change
is not on the sheet.

## Research (rule 10)
"Seen" means the page text was fetched and read here; "known" means only from its description.

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, seen and used) | A line graph of a generated catalase run; tap two points for a slope triangle (up to three, a list of their rates); a draggable tangent (centered difference, "rate ≈"); a toggle to hide it; Clear; three goals. Percent change: a start bar cut in tenths, a draggable end bar, the "divide by the end" mistake in a sentence. Practice: generated and fixed problems | Every piece: the triangle (now one, on the drawn run), the tangent (its own tab), the tenths (a ruler), the mistake sentence ("?"), the goals (Challenges), Practice (unchanged) |
| The current AP® Biology Equations and Formulas sheet, as quoted by Cognito's "AP Biology formula sheet" (seen; the College Board PDF link returned 404) | Rate dY/dt ("change in Y per unit time"); no percent change formula | The "?" wording; percent change is not on the sheet |
| The older lab manual sheet (College Board Appendix A, seen) | Rate dY/dt; dY amount of change, dt change in time; no percent change | Agrees on both points |
| Nuffield Foundation practical biology, catalase and hydrogen peroxide (seen) | Conical flask with a bung and delivery tube, an upside down measuring cylinder full of water over a trough, held by a clamp stand; read the oxygen volume and time it; rate = volume ÷ time | The scene: the real school apparatus, drawn as it is set up |
| Desmos movable points and slope triangles (known) | Drag a point; the triangle and its numbers follow | The control: knobs riding the readings |
| PhET (known; no rate of change sim in biology) | Controls on the picture, instant response | The standard's rules |

What ours does that none of these do: the drawn experiment and its graph are one screen. Moving the end of the
interval moves the gas in the cylinder, the timer and the triangle together, each in the same colour as its part of
Δy ÷ Δt, and one bubble rises per 0.25 mL of oxygen added, so a fast minute visibly sends more bubbles than a slow one.

## The design
- **Three tabs, one idea each.**
  1. **Rate over time** (opening): a catalase run on a lab bench. Potato extract and hydrogen peroxide in a conical
     flask with a bung; a delivery tube to an upside down measuring cylinder held in a clamp over a water trough; a
     digital timer; on stages 600 px and wider, a clipboard with the six readings. The graph of the oxygen collected
     is under the scene. **Main control:** the end point of an interval, a knob on the graph that snaps to the
     readings (the start point is a quiet second knob; a press near either reading grabs it). The slope triangle:
     Δt leg amber, Δy leg green, the slope (hypotenuse) purple. In the cylinder the oxygen collected in the interval
     is a green band between two levels, labelled "Δy 8.3 mL"; the timer reads the end time, labelled "Δt 2 min";
     the clipboard rows of the two readings light up. The slope's value sits in the graph's title row ("slope 4.15
     mL/min").
  2. **Rate at a moment:** the same run. One knob slides along the curve (0.1 min steps); its tangent crosses the
     plot, a 1 min run (amber) and its rise (green) are drawn on it, the rate sits in the title row ("rate ≈ 3.4
     mL/min"); in the flask the foam is high while the reaction is fast ("Fast fizz", "Fizzing", "Slow fizz").
  3. **Percent change:** two potato cores standing on two balances, "Start" (4.00 g) and "After a day". Drag the
     after core taller or shorter (its mass, 2.80 to 4.80 g, −30% to +20%, snapping to whole percents of the start); it glistens with water when it gained and wrinkles
     when it lost. A ruler beside it is marked in tenths of the start mass (0% at the start's height, carried across
     by a line); a bracket shows the change (teal gain, red loss) and the percent sits at the core's top.
- **Cause line** (`K.cause`): "Δy = 8.3 mL → ÷ Δt 2 min → = 4.15 mL/min"; "at 1.5 min → rises 3.4 mL in 1 min →
  ≈ 3.4 mL/min"; "+0.48 g → ÷ start 4.00 g → × 100 = +12.0%". Takeaways when settled: the last interval ("Flatter
  slope, smaller rate: the reaction is slowing down."), the whole run ("The average over the whole run hides the fall
  from 4.90 to 1.00 mL/min."), a late moment ("A flatter tangent: the rate has fallen as the H₂O₂ runs out.").
- **Every change is animated:** a snap to another reading tweens the drawn time (the gas level, the band, the timer,
  the triangle, the knob and every number move together); oxygen bubbles rise from the tube only while oxygen is
  being added (one per 0.25 mL), none when time runs back; the foam rises and falls with the rate; the core grows or
  shrinks; a tab switch and Start over cross fade or tween. Reduced motion: the new state at once with a 260 ms cross
  fade.
- **Every number is read from the drawing:** the knobs sit on the drawn point, not the target. During a tween Δt and
  Δy are read at the drawn times (one decimal) and the slope is computed from those two numbers as shown, so the
  three always agree; at rest they are the table's readings.
- **The curve:** a monotone cubic through the six readings (`smooth()` in `rates.js`): it passes through every
  reading exactly and has a slope everywhere, so the tangent touches the curve that is drawn.
- **Cue:** "Drag the end point" above the end knob, once per device. "Show me how" (three pointers: the knob, the
  picture, the tabs) from the purpose line and from "?".
- **One colour per idea:** Δy and the oxygen collected green (water stays blue), Δt and the timer amber, the rate
  purple; percent change: the start slate, a gain teal, a loss red, the percent purple.

### What is on screen in Explore (counted, 1440, opening)
Outside the picture: 3 tabs, the purpose line (9 words), "Show me how", the graph, the cause line (3 pills), "Start
over". No side panel. Controls: 3 tabs, Show me how, 2 knobs, Start over.
On the scene: 2 labels ("Catalase + H₂O₂", "Δy 8.3 mL"), "Δt 2 min" under the timer, the timer's "2:00", the
cylinder's 10 and 15, the clipboard (12 numbers, 2 headings) on wide stages.
On the graph: the title, the slope pill, Δt and Δy, 4 y ticks, 6 x ticks and "Time (min)", 6 readings.
Rate at a moment: the oxygen pill and the foam word replace Δy and Δt in the scene; on the graph "run 1 min" and
"rise 3.4 mL". Percent change: "Start", "After a day", 2 balance readings, the change, the percent, the ruler.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself**, one dropdown on the stage:
  1. **Problems** (the old Practice, unchanged in content, grading and record ids: new numbers every time or the two
     worked problems, one part at a time). Its figure keeps its height on a phone and its words are at least 11 px;
     the typed slope lines and the predicted end bar are thin solid lines (no dashes).
  2. **Challenges** (the old goals, and one for percent change): the first minute; a rate near the end, speeding up
     or slowing down; the whole run; make the core lose 10%. On the Explore picture from its opening; Explore keeps
     its own state.
- Deep links: `#practice` and `?seed=` open Problems as before; `#goals` opens Challenges.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Tap two points for a slope triangle | Drag two knobs (end loud, start quiet) that snap to the readings; a press near a reading grabs the nearer knob |
| Up to three triangles at once, and the list of their rates | One triangle; the last three intervals measured are listed in "?" with "A flatter triangle has a smaller rate." |
| Clear the triangles | Start over (each tab back to its opening, animated) |
| The tangent and its Hide / Show toggle | Its own tab, Rate at a moment (always shown there) |
| Tangent slope as a centered difference | The slope of the smooth curve through the readings, shown "≈" (needs-author `rates-tangent-estimate`) |
| The run from the generator (seed 2024) | Fixed readings 0, 4.9, 8.3, 10.5, 12.0, 13.0 mL (data `explore.run`) |
| Percent change bars in tenths of the start, drag the end bar | Two cores on balances, drag the after core; the ruler in tenths of the start |
| "Dividing by the end would give …" | "?", worked out for the core as drawn |
| The goals (first minute, near the end, whole run) | Test yourself, Challenges (and a fourth: lose 10%) |
| Practice | Test yourself, Problems, unchanged |
| The formulas and how answers are checked | "?" (unchanged, plus the formula sheet's dY/dt) |

## Decisions made for the owner (also in the owner log)
1. Explore is the school catalase apparatus (flask, delivery tube, cylinder over a trough, timer) with its graph, and
   two potato cores on balances; not a bare graph and bars.
2. Three tabs: Rate over time, Rate at a moment, Percent change.
3. Tapping two points became two knobs that snap to the readings.
4. One triangle at a time; the intervals measured are listed in "?".
5. Clear the triangles became Start over.
6. The tangent toggle became its own tab.
7. The tangent is the slope of a smooth curve through the readings, not a centered difference.
8. Explore uses fixed readings, not a generated run.
9. Percent bars became cores on balances with a ruler in tenths of the start.
10. The "divide by the end" sentence moved to "?".
11. The goals became Challenges, with a fourth for percent change.
12. Problems' dashed lines and outline became thin solid lines; its figure keeps its height on phones.
13. Δy is green, so the oxygen collected never looks like the water.
14. The rate's value sits in the graph's title row, always in the same place.
15. "?" title "Numbers & formulas"; hub blurb reworded; title, description and URL unchanged.
16. Percent change is never said to be on the formula sheet in the tool; the notes sentence that says it is goes to
    needs-author.

## Accuracy
- Rates: Δy ÷ Δt from two readings; unit mL/min. At rest every number is the table's (4.90, 3.40, 2.20, 1.50, 1.00
  mL/min for the five minutes; 2.60 for the whole run; 4.15 for 0 to 2 min). The trend words ("slowing down") come
  from the readings, and the reason (substrate used up) is the course's own (`why` in the data).
- The tangent: the slope of the monotone cubic at that time (its end slopes from the three point formula, clamped).
  At 0 min it gives 5.65 mL/min, more than the first minute's average 4.90, as a slowing reaction should; it is an
  estimate from six readings and is shown with "≈".
- Percent change = (end − start) ÷ start × 100, from the masses as shown (two decimals), one decimal; the sign kept.
- Conventions logged in `docs/apbio-needs-author.md` (`rates-explore-catalase`): the readings are invented; the
  cylinder's numbers are printed to read the gas volume from the top; one bubble per 0.25 mL; the foam height
  follows the rate; the core's height is proportional to its mass (constant width). Open: `rates-formula-sheet` (the
  notes page says percent change is on the formula sheet; the sheet we read does not list it) and
  `rates-tangent-estimate` (updated).

## What was built
- `bio/assets/tools/rates.js` (rewritten; the practice figures kept and restyled), `bio/assets/tools/rates.css`
  (new, this page only), `bio/data/tools/rates.json` (`explore`; contexts and problems unchanged),
  `bio/data/pages.json` (`"kit2": true`, the blurb), `bio/assets/tools/bio-tools.js` (the "?" title string). The
  adapter `ApBioTools.studioKit2` is used as it is (a practice part and a docked part, as chi-square).
- `scripts/tools-v2/rates-sweep.mjs`: ten widths, one process each, light and dark; `--frames` (frame by frame at 390
  and 1440); `--perf` (CPU x4 beside the flagship).

## Checks run (2026-11-19)
- `node --test scripts/test/apbio-*.test.mjs` (74 pass), `check-apbio-content` (0 failing), `build-apbio --check`,
  `check-site`, `check-weight --check` (623 budgets within range); `scripts/check-tool-use.mjs` with a local copy of
  its list: the rates page sends tool-open, tool-touch (explore), tool-mode (quiz), tool-use, nothing under
  automation.
- Sweep: 16 landmark states (six intervals, five moments, five cores), the first visit with its cue, Challenges and
  Problems, at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, light and dark. Each state checks clipping,
  label overlaps (4 px, with the tick numbers and the knobs), text at least 11 px, the picture the largest thing,
  knobs 44 px, sideways scroll, the phone cause line (two rows, constant height), and that the words match the
  drawing (gas and band measured in the cylinder, the legs and the tangent measured on the graph, the core measured
  on its balance, the knob on the drawn point). Frames at 390 and 1440: a real drag of the end point out to 5 and
  back, keys (End, the start point stepping), Start over, the moment Home and End and a drag along the curve, the core
  keyed and dragged, reduced motion; every frame checked. Final run: **896 passed, 0 failed** (84 to 90 state checks a
  width, each running every check above; frames: 1,117 at 390 and 1,341 at 1440, all agreeing).
- Real touch drag of the end knob at 390 with the graph at the bottom of the screen: it moves, the page does not
  scroll. Problems: a wrong answer gives "Not yet" and the method line.
- Perf, CPU x4, same hour as the flagship (machine at load 6 to 9 on 2 cores), drag out and back: the end point
  median 16.7 ms at 390 and 1440, p95 33 ms at 390 and 33 to 67 ms at 1440 (between runs); the moment knob median
  16.7, p95 17 to 33 ms; the core median 16.7, p95 17 ms. The flagship's fertilizer drag in the same runs: median
  33 ms, p95 83 to 100 ms at 390 and 167 ms at 1440.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is still to come.
- The scene at 1440 leaves wall between the timer and the clipboard; the apparatus is sized by the scene's height.
- The end knob tweens behind a fast drag (each snap is a short tween), so the knob trails the finger by up to a
  fraction of a second; the numbers stay right on every frame.
- The end point drag at 1440 under CPU x4 had one run with p95 67 ms (load 9); the other run 33 ms. Each frame
  repaints the whole scene SVG (one layer); not split further.
- The rise label on the moment tab can be hidden when the rise is tiny and nothing near it is clear (the cause line
  still has the number); the sweep allows that.

## Review round 1 (2026-11-19): BLOCK, fixed
`/home/claude/review-rates/REVIEW.md`. Maths, frame agreement, perf, touch and nothing dropped confirmed.
Must fix:
1. **Cylinder scale under the gas:** the graduations and 5, 10, 15 are drawn in their own layer above the gas, band
   and water, with a halo.
2. **Rise label hidden late in the run:** near the end the step is drawn under the tangent (from the tangent 1 min
   earlier, across to the point's time, up to the point) and the label has spots right of the point; the sweep sets
   every 0.1 min from 0 to 5 at every width and fails on any missing rise label or any other check.
3. **"Lose 10%" needed pixel input:** the core snaps to whole percents of the start for drag and keys (start now
   4.00 g so each percent is an exact 0.04 g; keys step 1%, Shift or Page 10%). The sweep checks every half pixel
   gives a whole percent and that PageDown, PageDown, ArrowDown, ArrowDown from the opening reach −10%.
Should fix, all done: bench props on wide stages (catalase: H₂O₂ stock bottle, cut potato on a tile; percent change:
the soaking beaker, cork borer, cut potato) and larger cores; the foam word to the end of the run; the current sheet
cited (via Cognito); the notes sentence and the lesson's formula line reworded, `rates-formula-sheet` closed; the
core's range −30% to +20%; Δt rounds before dropping ".0"; the readings sit 22 px inside the axes, so a knob at 0
keeps 4 px from the tick numbers (a sweep check). Merged `claude/tools-v2-all` (chi-square integrated) first.
