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
- **Picture:** a lab bench. Above: a black seed tray of radish seedlings at day 7, lined up from
  shortest to tallest against a measuring board (a ruler down its left edge: a tick every 0.5 cm, numbers every 2 cm,
  every 4 on phones, 0 to 16 cm). Each plant drawn as a radish seedling: the red top of its root at the soil, a rose
  stem, two heart shaped seed leaves (cotyledons, notched at the tip) where the stem ends; its height is soil to where
  the leaves meet. A blue line across the tray at the mean height, an amber line at the median; their names on pills
  at the right end of each line, in a strip of board kept free of plants ("mean 5.49 cm" and "median 5.20 cm"; on a
  phone "mean" and "median", the values are in the cause line); when the lines are closer than a pill and 4 px, the
  higher line's name sits just over the lower one's. Both lines' white halos are drawn first, then the 5 px blue
  mean line, then the 2.4 px amber median line, so close lines show as blue rims around the amber. The middle plant (the two middle plants when n is even) glows
  amber. Below, lying on the bench at every width: a clipboard, "Each plant's height (cm)": the heights in order with
  the middle one(s) amber; on a paper 640 px or wider the words take a column at the left with a worked line each
  ("mean = 38.4 ÷ 7 = 5.49 cm", "median = the middle value = 5.20 cm" or "(5.2 + 5.5) ÷ 2 = 5.35 cm") and the plank the
  rest of the paper, and every plant as a dot on a wooden plank (a number line 0 to 16 cm) that
  rests on a blue pivot at the mean ("mean"); the middle dot(s) amber with "median" over them (or beside the top dot
  when the stack is tall).
- **Main control, on the picture:** every plant. A small knob sits where its seed leaves meet (8 px on phones, its
  44 px hit area invisible); a press anywhere in a plant's column, on a knob or not, takes the plant whose column is
  under the finger, so the target is the whole column, at least 44 px wide (a narrow tray holds fewer plants: 5 at
  360, 6 at 390, 7 at 430, up to 10 on larger screens). Drag up or
  down: the plant grows or shrinks (1.0 to 15.0 cm, to 0.1 cm) and stays where it stands while held; on release the
  row sorts itself again and the plants slide to their places. Keys on a knob: arrows 0.1 cm, Shift or Page 1 cm,
  Home and End the ends; its value text says "Plant 3 of 7 from the shortest, 5.0 cm, a middle plant".
- **Quiet controls, under the picture:** "− 7 plants +" (Add a plant sows the next seedling: it sprouts in its place
  in the row while the others make room; Remove one pulls the last one sown: it rises out of the soil and fades; 3 plants
  up to what the tray holds) and Start over.
- **Opens** on 7 plants, 3.8, 4.4, 4.9, 5.2, 5.9, 6.6 and 7.6 cm: mean 5.49 cm, median 5.20 cm, SD 1.31, SE 0.50 (sown in
  the order 3.8, 7.6, 5.2, 4.4, 6.6, 4.9, 5.9, then 5.5, 4.6, 6.2; on a phone that holds fewer, the first 5 sown, the set
  3.8, 4.4, 5.2, 6.6, 7.6, mean 5.52, median 5.20). The order makes the SE fall with every plant added from 3 to 10. The two centres open
  0.29 cm apart, so both lines show. The tallest plant to 14.0 cm: mean 6.40 cm, median stays 5.20 cm.
- **Cause line** (`K.cause`): at rest "7 plants → mean 5.49 cm → median 5.20 cm → SD 1.31 · SE 0.50"; after a drag
  "one plant to 14.0 cm → mean 6.40 (was 5.49) → median stays 5.20 → SD 3.48 · SE 1.31"; after Add or Remove "8 plants
  → mean stays 5.49 → median (5.2 + 5.5) ÷ 2 = 5.35 → ...". The SD and SE pill rides along only while the line
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
  the "?" table all come from the counted plants' drawn heights in that frame. The numbers are worked out from the
  heights to the 0.1 cm the clipboard lists (so the list, its sum, the mean and every pill agree on every frame, mid
  change too); the lines, the pivot and the dots sit at the exact drawn heights.
- **Sizing:** the scene's height comes from the window: the window's height less what sits above the scene in the
  tool and the cause line with its buttons, so the plants (the main control) and the cause line show together at
  every width (390 × 844, 1024 × 768, 1280 × 800 included; phones 440 to 640 px, larger 380 to 820 px). The tray is
  above and the clipboard below at every width (review round 1: side by side left bare paper on wide screens). A wide
  but short scene (at least 900 px wide, under 540 px tall, as at 1024 × 768) keeps the clipboard 150 px tall (no worked
  lines), so the plants get the height (recheck 1).
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
  2. **Challenges** (the old three goals), on the Explore picture from its opening (Challenge 3 from 3 plants): drag one plant past 11 cm and see
     which centre moves more; make the SD 0.3 cm or less by bringing the plants together; add plants until there are
     10 and watch SE shrink while the SD stays about the same. `#goals` opens it.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| A dot plot of plant heights; drag a dot | Drag a radish plant on the board; the same plants are dots on the clipboard's plank |
| Mean (solid) and median (dashed) lines | Blue and amber lines across the tray, the pivot and "median" on the plank |
| ±1 SD band and ±1 SE bracket on the Explore plot | Not drawn in Explore (the idea is centre, not spread); SD and SE are numbers in the cause line and worked out in "?"; the band and bracket stay on the Problems figure |
| Add a dot (up to 16), Remove a dot (at least 3) | Add a plant, Remove one (3 to what the tray holds: 10 on larger screens, 5 at 360 and 6 at 390, so every column is at least 44 px) |
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
3. Every plant is a knob, and a press anywhere in a plant's column (on a knob or not) takes that plant; every column
   is at least 44 px wide, so a narrow tray holds fewer plants: 5 at 360 px, 6 at 390, 7 at 430, up to 10 (review
   round 1; first build allowed 10 everywhere, 23.6 px columns at 360).
4. Add and Remove are a quiet "− n plants +" under the picture (the plan put them on the picture at the end of the
   row); 3 plants up to what the tray holds (the old tool allowed 16).
5. The ±1 SD band and ±1 SE bracket leave Explore; SD and SE stay as numbers (cause line, "?") and on the Problems figure.
6. Mean and median are shown to 2 decimals everywhere in Explore (data to 0.1 cm), so an even n median such as 5.65 is exact.
7. On phones the line pills say only "mean" and "median"; the values are in the cause line.
8. The SD and SE pill drops out of the cause line when it would make a third row (it stays in "?").
9. Mode and range are worked out in "?" only (measured heights rarely repeat; the idea is mean against median).
10. The clipboard shows the sorted heights and, on a tall paper, the worked mean and median lines.
11. The Explore scene's height comes from the window's height (the plants and the cause line fit together).
12. The practice figure takes Explore's colours (mean blue, median amber, solid lines, rose dots) and larger words.
13. Challenges: the old n = 12 goal becomes "until the tray is full" (10 on larger screens).
14. Blurb reworded; the page title, description and URL unchanged.
15. The tray above and the clipboard below at every width; a wide paper puts its words in a left column (review round 1).
16. The opening heights changed so the mean and median open 0.29 cm apart (review round 1).
17. Every number is worked out from the heights to 0.1 cm as the clipboard lists them (review round 1).
18. The sowing order is 3.8, 7.6, 5.2, 4.4, 6.6, 4.9, 5.9, 5.5, 4.6, 6.2, so the SE falls with every plant added; Challenge 3 starts on 3 plants (recheck 1).
19. A wide but short scene keeps a 150 px clipboard without the worked lines (recheck 1).

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

## Review round 1 (2026-11-24): BLOCK, fixed
`/home/claude/review-bio-desc/REVIEW.md`. Statistics, frame agreement, fit, the cue and perf confirmed. Merged
`claude/tools-v2-all` first (the builder brief's new lessons; no conflicts).
Must fix:
1. **The mean line hidden under the median at the opening.** Both halos are drawn first, then the 5 px blue mean
   line, then the 2.4 px amber median line, so close lines show as blue rims around the amber; the opening heights
   changed (mean 5.49, median 5.20) so the two lines open 0.29 cm apart. The sweep checks the draw order and widths.
2. **Taps on phones took the wrong plant** (36 in 100 at 360). A press, on a knob or not, always takes the plant whose
   column is under the finger (`plantAt`); every column is at least 44 px, so a narrow tray holds fewer plants (5 at
   360, 6 at 390, 7 at 430, 10 on larger screens; the opening is 7, or the largest odd number the tray holds). The
   first build's columns were 23.6 px at 360 and 26.6 px at 390, not "about 30 px". The frames run taps every plant
   for real (touch) on its knob centre, ±6 and ±12 px across, and its stem, at 360 and 390: 66 taps, 0 wrong.
3. **A press mid slide made the row jump 218 to 480 px.** Only the pressed plant's growth ends at once (`hold`); the
   row's slide goes on. The frames run presses a plant 60 ms after a release and checks that no plant moves more than
   a third of its way in one frame.
4. **Bare clipboard paper on wide screens.** The tray is above and the clipboard below at every width; a paper 640 px
   or wider puts its words in a left column and gives the plank the rest, the dots sized from the room (up to 13 px).
Should fix: S5 every number from the heights to 0.1 cm (the worked mean is its own sum over n on every frame, and the
sweep checks it); S6 the knobs are put back in row order after each sort, so Tab goes left to right (focus kept); S7
phone knobs are 8 px dots (the 44 px hit area is invisible), the focus ring small; S8 the Problems figure's mean and
median labels read inward near an edge; S9 the brief's figures corrected (above and in the owner log).
Checks after the fixes (speed rule, fix round): sweep at 360, 390 (87 each), 1024, 1280 and 1440 (85 each), light
and dark, **429 passed, 0 failed**; frames **61 passed, 0 failed** (818 frames at 390 and 721 at 1440, 66 real touch
taps at 360 and 390, the mid slide press); AP Bio tests, content check, `build-apbio --check`, `check-site`.

## Recheck 1 (2026-11-24): BLOCK on one item, fixed
`/home/claude/review-bio-desc/REVIEW.md` (Recheck 1). Every round 1 fix confirmed (taps 0 wrong at 360 to 768).
1. **Challenge 3 on phones** opened on a full tray with "+" off, and with the old sowing order the SE rose from 3 to 5
   plants. The sowing order is now 3.8, 7.6, 5.2, 4.4, 6.6, 4.9, 5.9, 5.5, 4.6, 6.2 (the first 5 and the first 7 are
   the same sets, so both openings are unchanged); the SE falls with every plant added (3 to 5: 1.11, 0.83, 0.70; 5 to
   10: 0.70 to 0.36, while the SD goes 1.92 to 1.14). Challenge 3's picture starts on 3 plants at every width. The
   sweep checks it at every width: 3 plants with "+" on, the SE smaller at each step to a full tray, the challenge met.
2. **Small plants at 1024 × 768.** A scene at least 900 px wide and under 540 px tall keeps a 150 px clipboard (words
   and plank side by side, no worked lines, a smaller clip); the board gets about 270 px at 1024 × 768 (was 190).
Integration round checks (2026-11-24): sweep at all ten widths, one process each, light and dark, at real window
heights, **878 passed, 0 failed** (89 a width at 360 to 600, 87 at 768 to 1920; Challenge 3 checked at every width);
frames **61 passed, 0 failed** (698 frames at 390 and 741 at 1440, 66 real touch taps at 360 and 390, 0 wrong, the mid
slide press); AP Bio tests 74 pass, content check 0 failing, `build-apbio --check`, `check-site`, `check-weight`.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students.
- A phone holds 5 or 6 plants, so the "fill the tray" challenge and an even count of 8 or 10 are seen only on larger
  screens (the even count is still there at 4 and 6).
- The dots are plain rose discs, not drawn radishes.
- On a wide screen the tray is long and low (16 cm in about 350 px at 1440 × 900), with much board above the plants
  at the opening (the room for an outlier).

## Recheck 2 (2026-11-24): PASS, one should fix done
In Challenge 3 the SD and SE pill stays in the cause line at every count: when it would need a third row (an even
count on a 360 px phone), the median pill drops its working ("median 5.35" for "median (5.2 + 5.5) ÷ 2 = 5.35"; the
spoken line keeps the working). The sweep checks the pill at every count of Challenge 3. Checks: sweep at 360 and 390
(91 each), 1024 and 1440 (89 each), light and dark, **360 passed, 0 failed**; frames **61 passed, 0 failed** (66 real
touch taps, 0 wrong).
