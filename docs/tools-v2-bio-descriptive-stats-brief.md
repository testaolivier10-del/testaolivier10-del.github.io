# Tools v2: AP® Biology Descriptive statistics (brief and build notes)

Status file for the v2 rebuild of `bio/tools/descriptive-stats.html` (rollout row 45, group G, wave 4, free).
Plan: `docs/tools-v2-plans/bio-descriptive-stats.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-bio-descriptive-stats`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`. Kept separate from Confidence intervals (same audience, real seedlings): that tool is
about error bars and chance; this one is only about centre (mean against median).

## The one main idea
**One extreme value pulls the mean far more than the median.** The mean uses the size of every value (Σx ÷ n), so
one plant made 6.8 cm taller adds 6.8 ÷ n to it; the median only cares which value is in the middle once the values
are sorted, so one extreme plant moves it by one plant at most. With an outlier, the median describes the typical
plant better. CED skill `stats-descriptive` (part topics `stats-sd-se` for SD and SE, unchanged).

## Research (rule 10)
"Seen" means the page's text was fetched and read here; none of the interactives could be operated.

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, seen in code) | A dot plot of 7 plant heights; drag a dot; mean (solid) and median (dashed) lines, a ±1 SD band, a ±1 SE bracket; Add a dot, Remove a dot, Reset; a readout of n, mean, median, SD, SE; three goals | All of it; see "What moved" |
| PhET, Center and Variability (teacher guide, seen) | Kicked balls on a line; drag a ball; the median with cards a student sorts (or auto sort); the mean as a balance point; a challenge asks which measure a far ball moves more; students often miss that a ball can be dragged | The row sorts itself (the median is the middle card), the mean as the point the data balance on, a cue on the first thing to drag |
| Mean as Balance Point (dmccreary statistics course, seen as text) | Drag points on a number line; a seesaw beam balances on a fulcrum at the mean | The clipboard's plank resting on a pivot at the mean |
| CODAP, "Behaviors of the mean and median" (Concord, seen as text) | Drag one point of a small data set: the mean moves, the median does not; then a large set | The core interaction (one value dragged, two centres compared) |
| Seeing Theory, Basic probability (Brown, seen as text) | Expectation and variance redraw at once as the student changes the distribution | Instant redraw on every frame of a drag |
| StatKey, descriptive statistics (Lock5; only the menu could be read) | One quantitative variable: a dot plot with summary statistics | Dot plot and summary numbers as one view (the clipboard and the cause line) |
| Desmos activities on mean and median (searched, not opened) | A dot dragged along a number line | Known only by name |

What ours does that none of these do: the data are the real thing, radish seedlings measured against a board, and
the student grows one by hand; the mean and median are lines across the same tray at the plants' own heights, the
middle plant glows, and the same plants stand as dots on a plank that balances on the mean, all on one frame.

## The design
- **Picture:** a lab bench. Left (top on narrow stages): a black seed tray of radish seedlings at day 7, lined up from
  shortest to tallest against a measuring board (a ruler down its left edge: a tick every 0.5 cm, numbers every 2 cm,
  every 4 on phones, 0 to 16 cm). Each plant drawn as a radish seedling: the red top of its root at the soil, a rose
  stem, two heart shaped seed leaves (cotyledons, notched at the tip) where the stem ends; its height is soil to where
  the leaves meet. A blue line across the tray at the mean height, an amber line at the median; their names on pills
  at the right end of each line, in a strip of board kept free of plants ("mean 5.41 cm" and "median 5.40 cm"; on a
  phone "mean" and "median", the values are in the cause line); when the lines are closer than a pill and 4 px, the
  higher line's name sits just over the lower one's. The middle plant (the two middle plants when n is even) glows
  amber. Right (below on narrow stages): a clipboard, "Each plant's height (cm)": the heights in order with the
  middle one(s) amber, on a tall paper a worked line each ("mean = 37.9 ÷ 7 = 5.41 cm", "median = the middle value =
  5.40 cm" or "(5.4 + 5.6) ÷ 2 = 5.50 cm"), and every plant as a dot on a wooden plank (a number line 0 to 16 cm) that
  rests on a blue pivot at the mean ("mean"); the middle dot(s) amber with "median" over them (or beside the top dot
  when the stack is tall).
- **Main control, on the picture:** every plant. A quiet knob sits where its seed leaves meet; a press anywhere in a
  plant's column takes that plant (the one drawn under the finger), so the target is the whole column. Drag up or
  down: the plant grows or shrinks (1.0 to 15.0 cm, to 0.1 cm) and stays where it stands while held; on release the
  row sorts itself again and the plants slide to their places. Keys on a knob: arrows 0.1 cm, Shift or Page 1 cm,
  Home and End the ends; its value text says "Plant 3 of 7 from the shortest, 5.0 cm, a middle plant".
- **Quiet controls, under the picture:** "− 7 plants +" (Add a plant sows the next seedling: it sprouts in its place
  in the row while the others make room; Remove one pulls the last one sown: it rises out of the soil and fades; 3 to
  10 plants) and Start over.
- **Opens** on 7 plants, 3.6, 4.5, 5.0, 5.4, 5.9, 6.3 and 7.2 cm: mean 5.41 cm, median 5.40 cm, SD 1.19, SE 0.45.
  The tallest plant to 14.0 cm: mean 6.39 cm, median stays 5.40 cm.
- **Cause line** (`K.cause`): at rest "7 plants → mean 5.41 cm → median 5.40 cm → SD 1.19 · SE 0.45"; after a drag
  "one plant to 14.0 cm → mean 6.39 (was 5.41) → median stays 5.40 → SD 3.47 · SE 1.31"; after Add or Remove "8 plants
  → mean 5.44 (was 5.41) → median (5.4 + 5.6) ÷ 2 = 5.50 → ...". The SD and SE pill rides along only while the line
  fits two rows (measured; otherwise it is in "?"). Every number is worked out from the plants as drawn.
- **Takeaways** (when a change settles, Explore only): an outlier made by a drag, "With an outlier, the median
  describes the typical plant better."; a middle plant dragged so the median moved more than the mean, "The median
  follows the middle plant; the mean shares any change among all n plants."; odd to even n, "An even number of plants:
  the median is the mean of the two middle ones."
- **Every change is animated:** a drag moves the plant with the finger, and the lines, glow, dots, pivot, pills and
  cause line follow on that frame; release slides the plants to their sorted places (320 ms); a key grows or shrinks
  the plant (240 ms) and the row sorts; a new plant sprouts from the soil (620 ms) while the others slide apart and
  the leaves resize to the spacing; a pulled plant rises and fades (420 ms); Start over grows or shrinks every plant
  back, pulls the extra ones and sprouts missing ones. Reduced motion: the result at once with a 260 ms cross fade.
- **Every number is read from the plants as drawn:** a plant counts once it has finished sprouting and stops counting
  as it starts to leave; the lines, the pills, the glow (the middle rank by drawn height, so it is right mid drag
  before the row sorts), the plant count, the dots, the pivot, the sorted values, the worked lines, the cause line and
  the "?" table all come from the counted plants' drawn heights in that frame.
- **Sizing:** the scene's height comes from the window: the window's height less what sits above the scene in the
  tool and the cause line with its buttons, so the plants (the main control) and the cause line show together at
  every width (390 × 844, 1024 × 768, 1280 × 800 included; phones 440 to 640 px, larger 380 to 820 px). The layout
  is side by side when the scene is 900 px wide (or 640 px and short), stacked otherwise.
- **Cue:** "Drag a plant taller" above the tallest plant, its arrow on that plant's knob, once per device; it covers
  no label or plant. "Show me how" (three pointers: a plant, the clipboard, the plant count) from the purpose line and
  from "?".
- **One colour per idea:** mean blue (line, pill, pivot, word, worked line, cause pill), median amber (line, pill,
  glow, middle dot and value, word, worked line, cause pill), the changed plant rose (the radish stem colour), SD and
  SE slate. The practice figure in Test yourself takes the same mean and median colours, solid lines, rose dots.

### What is on screen in Explore (counted at 1440, opening)
Outside the picture: the purpose line (12 words), "Show me how", the cause line (4 pills, 14 words), the plant count
("−", "7 plants", "+"), Start over. No side panel. Controls: 7 plant knobs (one per plant), 2 count buttons, Start
over, Show me how.
On the picture: the ruler's numbers (2 to 16 and "cm"), the tray's name, 2 line pills, the clipboard title, 7 sorted
values, 2 worked lines, the plank's numbers (0 to 16), "median", "mean", and on a first visit the cue.

### Explore against Test yourself
- **Explore:** as above. Nothing locked, graded or asked.
- **Test yourself**, one dropdown on the stage ("What to practice"):
  1. **Problems** (the old Practice: new numbers or the three worked problems, the same parts, grading and record ids
     `descriptive-stats:<cid>:<part>`; `#practice` and `?seed=` open it). Its figure keeps the old dot plot with the
     ±1 SD band and ±1 SE bracket, now in Explore's colours (mean blue, median amber and solid, rose dots) and words of
     14 px in its viewBox (at least 11 px on a phone).
  2. **Challenges** (the old three goals), on the Explore picture from its opening: drag one plant past 11 cm and see
     which centre moves more; make the SD 0.3 cm or less by bringing the plants together; add plants until there are
     10 and watch SE shrink while the SD stays about the same. `#goals` opens it.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| A dot plot of plant heights; drag a dot | Drag a radish plant on the board; the same plants are dots on the clipboard's plank |
| Mean (solid) and median (dashed) lines | Blue and amber lines across the tray, the pivot and "median" on the plank |
| ±1 SD band and ±1 SE bracket on the Explore plot | Not drawn in Explore (the idea is centre, not spread); SD and SE are numbers in the cause line and worked out in "?"; the band and bracket stay on the Problems figure |
| Add a dot (up to 16), Remove a dot (at least 3) | Add a plant, Remove one (3 to 10: a tray of 10 keeps every plant a 30 px target on a phone) |
| Reset | Start over (shown, not swapped) |
| The readout: n, mean, median, SD (s), SE | The cause line and the plant count; "?" works out this picture (mean, median, mode, range, s, SE) |
| The sentence after each change (mean moved vs median moved, SE = SD ÷ √n) | The cause line ("(was …)", "stays") and the takeaways |
| The three goals (one plant past 11 cm, SD small by bunching, n = 12) | Challenges (n = 10, the most a tray holds) |
| Practice (6 contexts, 3 worked problems) | Problems, unchanged; the radish context is the one drawn in Explore |
| The formula box (mean, s with n − 1, SE, median and range rules) | "?" (the AP® Biology formula sheet's formulas and definitions, mode included), plus "Why the mean moves more" |

## Decisions made for the owner (also in the owner log)
1. Explore is a tray of radish seedlings against a measuring board with a clipboard plank, not a bare dot plot.
2. The row stays sorted shortest to tallest; a dragged plant keeps its place until let go, then the row sorts (so
   the median is literally the middle plant).
3. Every plant is a knob, and a press anywhere in a plant's column takes it; columns are about 30 px wide at 10
   plants on a 360 px phone (the plan asked 44 px; ten plants do not fit at 44).
4. Add and Remove are a quiet "− n plants +" under the picture (the plan put them on the picture at the end of the
   row); 3 to 10 plants (the old tool allowed 16).
5. The ±1 SD band and ±1 SE bracket leave Explore; SD and SE stay as numbers (cause line, "?") and on the Problems figure.
6. Mean and median are shown to 2 decimals everywhere in Explore (data to 0.1 cm), so an even n median such as 5.65 is exact.
7. On phones the line pills say only "mean" and "median"; the values are in the cause line.
8. The SD and SE pill drops out of the cause line when it would make a third row (it stays in "?").
9. Mode and range are worked out in "?" only (measured heights rarely repeat; the idea is mean against median).
10. The clipboard shows the sorted heights and, on a tall paper, the worked mean and median lines.
11. The Explore scene's height comes from the window's height (the plants and the cause line fit together).
12. The practice figure takes Explore's colours (mean blue, median amber, solid lines, rose dots) and larger words.
13. Challenges: the old n = 12 goal becomes n = 10.
14. Blurb reworded; the page title, description and URL unchanged.

## Accuracy
- The AP® Biology Equations and Formulas sheet: x̄ = (1 ÷ n) Σxᵢ; s = √(Σ(xᵢ − x̄)² ÷ (n − 1)); SE = s ÷ √n; median the
  middle value separating the greater and lesser halves; mode the value that occurs most often; range the greatest
  minus the smallest. The tool's `statsOf` and the course's `ApBioMath` both divide by n − 1 (the content check
  compares them independently); even n medians average the two middle values.
- Heights are invented (said in "?") for radish seedlings 7 days after sowing (3.6 to 7.2 cm, the range of the old
  tool and of the radish practice context); a plant may be dragged to 15 cm, a very tall, stretched seedling.
- Logged as `ds-explore-radish` in `docs/apbio-needs-author.md` (the heights, the 2 decimal display, mode in "?").

## What was built
- `bio/assets/tools/descriptive-stats.js` (rewritten on the kit; the practice figure and its stage kept as they were),
  `bio/assets/tools/descriptive-stats.css` (new, this page only), `bio/data/tools/descriptive-stats.json` (`explore`;
  contexts and problems unchanged), `bio/data/pages.json` (`"kit2": true`, the blurb), the content check
  `scripts/lib/apbio-tool-checks/descriptive-stats.mjs` (the explore block). The adapter `ApBioTools.studioKit2` is
  used as it is (a practice part and a docked Challenges part, as confidence intervals and rates).
- `scripts/tools-v2/bio-descriptive-stats-sweep.mjs`: ten widths, one process each, light and dark; `--frames`;
  `--perf`; `--shots`.

## Checks run
See "Final run" at the bottom.

### Final run (2026-11-24)
- `node --test scripts/test/apbio-*.test.mjs` (74 pass), `check-apbio-content` (0 failing; the new explore checks
  run), `build-apbio --check`, `check-site` (no broken references), `check-weight --check` (626 budgets within range);
  `scripts/check-tool-use.mjs` with a local copy of its list: the page sends tool-open, tool-touch (explore),
  tool-mode (quiz), tool-use with frame v2, nothing under automation.
- Sweep, one process per width, light and dark (dark asserted to render dark: `data-theme` and the board's colour,
  the site key `nremt_theme`): **778 passed, 0 failed** (79 a width at 360 to 600, 77 at 768 to 1920: 13 landmark
  states, the first visit with its cue, the fit of plants and cause line in the window, Challenges and Problems; in
  light also the tallest plant at every 0.5 cm from 1 to 15 cm at 7 and at 10 plants). Each state checks clipping,
  4 px between labels and 2 px from dots, pivot, leaves and the other line, text at least 11 px, leaves 11 px, knobs
  44 px, sideways scroll, the phone cause line (two rows, constant height), and that every number agrees with the
  plants as drawn.
- Frames: **57 passed, 0 failed** (805 frames at 390 and 732 at 1440, every one agreeing; tolerances are one unit in
  the last shown place, the DOM's 0.1 px rounding of the stems): a real drag of the tallest plant up, down past the
  others and back with the sort on release, a press in a plant's column away from its knob, keys, sowing, a sow on top
  of one still playing, pulling down to 3, Start over (four sprout), a drag while a plant sprouts, leaving to Test
  yourself mid change and back, a real touch drag at 390 (the plant grows, the page does not scroll), reduced motion
  (at once, with the cross fade).
- Perf, CPU x4, the same run as the flagship (load about 6.5 on the machine): dragging a plant at 10 plants median
  16.7 ms, p95 16.8 ms at 390 and 1440; sowing three plants p95 16.7 ms at 390 and 16.8 ms at 1440. The flagship's
  fertilizer drag in the same run: median 33.3 ms, p95 50 ms at 390 and 66.7 ms at 1440.
- Preview: `/mnt/user-data/outputs/bio-descriptive-stats-v2/index.html`; shots in `shots/` (sweep states at 390,
  768 and 1440 light and dark, Challenges and Problems, mid animation `mid-*-sort`, `mid-*-sprout`, `mid-*-pull`,
  `mid-*-startover`).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is still to come.
- At 10 plants on a 360 px phone each plant's column is about 30 px, under the 44 px the plan asked; the press takes
  the nearest plant, so a near miss takes a neighbour.
- After the row sorts, the knobs' Tab order is the order the plants were sown, not left to right.
- Pressing a plant while the row is still sliding finishes the slide at once (a small jump) before the drag starts.
- The clipboard on a wide screen still has empty paper between the worked lines and the plank at rest (room for a
  tall stack of dots); the dots are plain rose discs, not drawn radishes.
- On phones the board is short (16 cm in about 200 px), so the seed leaves are small (11 to 18 px).
- When mean and median are within a few hundredths the blue line shows only as a rim around the amber one.
