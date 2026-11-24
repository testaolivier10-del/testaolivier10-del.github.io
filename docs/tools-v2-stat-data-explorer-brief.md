# Tools v2: AP® Statistics Data explorer (brief and build notes)

Status file for the v2 rebuild of `statistics/tools/data-explorer.html` (rollout row 54, group G, wave 13, Free).
Plan: `docs/tools-v2-plans/stat-data-explorer.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-stat-data-explorer`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`. The fourth AP® Statistics tool on the kit: it reuses `ApStatTools.studioKit2` and the
`"kit2": true` page flag (spec decisions 19 to 22).

## The one main idea (two tabs)
1. **Mean and median:** drag one value far out: the mean (the balance point) follows it, the median (the middle
   value) barely moves.
2. **Outliers and the boxplot:** the box holds the middle half; a value more than 1.5 × IQR past the box is an outlier.

Vocabulary and rules as the CED (Unit 1) and `docs/apstat-authoring-guide.md`: quartiles by the AP® rule (median of
each half, the median left out when n is odd; the TI-84's 1-Var Stats gives the same), IQR = Q3 − Q1, fences
Q1 − 1.5 × IQR and Q3 + 1.5 × IQR, whiskers to the most extreme values inside the fences, outliers as their own dots,
sample SD with n − 1, z = (value − mean) ÷ SD, mean and SD not resistant, median and IQR resistant.

## Research (rule 10)
"Seen" means the page was fetched and read here; none of the interactives could be operated (no browser for them).

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, read and used) | Dotplot, histogram and boxplot on one axis; drag a dot (mouse, touch, keys); mean and median lines; chips for mean ± 1 SD and the fences; a bin width slider; tap a dot for its z-score; Add a value, Remove, Reset; a data set chooser; Why and a second sheet with every summary | All of it (see "What moved") |
| Seeing Theory, basic probability (Brown; from the plan, not reopened) | Expectation drawn as a balance; redraws as you change it | The mean as the point the data balance on |
| Art of Stat web apps index (seen as text) | Lists "Explore Quantitative Data" among its apps; the app itself not operated | Known by name: one data set, its graphs and summaries |
| StatKey, one quantitative variable (Lock5; seen as text, the data set list) | Pick a data set; a dotplot with its summary statistics | A picker of real looking data sets; the summaries as a table (here in "?") |
| PhET Center and Variability (seen as the search listing) | Kicked balls on a line; mean, median, range, IQR and MAD; the mean as a balance point | People standing on the scale instead of dots; the balance |
| Quartile references (CalculatorSoup and a Pearson quartile page, seen) | Q1 and Q3 as the medians of the halves, the median left out when n is odd; other software interpolates | The rule in "?", with the warning that software can differ |

What ours does that none of these do: the values are people standing on a plank marked in the data's units; the
plank rests on a wedge and only balances when the wedge is under the mean, so dragging a person far out tips the
plank and the wedge slides after the mean while the median's flag stays put; the boxplot tab draws the box as a
crate under the same people, with fence posts standing on the plank, and rings each person past a post.

## The design
- **Tab 1, Mean and median.** A sky over a hill and grass; a long wooden plank across the whole picture with the
  values marked on its face (the last number carries the unit). Each value is a person standing at it; people at
  the same value stand on each other's shoulders, as dots on a dotplot, so a stack's height is the count at that
  value; people at nearby values stand beside them, overlapping in depth. A gray stone wedge
  under the plank; an orange triangle on the plank's underside at the mean, with "mean 17.8" in a pill on the grass
  under it. A green flag on a pole at the median ("median 15" on its cloth). Quiet: the ± 1 SD switch shades the band
  mean ± one SD behind the people with "−1 SD" and "+1 SD" at its ends.
- **Tab 2, Outliers and the boxplot.** The same people on the level plank (on two trestles). On the grass under it the
  boxplot: a wooden crate from Q1 to Q3, a green slat at the median ("median 15" over it, "Q1 11" and "Q3 21" under
  it), ropes to stakes at the whisker ends, an orange dot per outlier named "outlier". Two fence posts stand on the
  plank at the fences, each with its sign ("fence 36"); a fence off the scale is a sign at that edge with an arrow
  ("← fence −4"). A person past a post wears an orange ring. Below, on a pale board, the histogram of the same people;
  its bin width is a quiet knob on the board ("bin width"; on phones "bins of 5 min").
- **Main control:** drag any person sideways (press anywhere on them; the kit's knob rides above whoever was touched
  last, with the value in a tag while it moves). Keys: Tab to the people (arrows pick a person, Escape clears, Delete
  takes the picked one away), Tab again to the knob (arrows one unit, Shift or Page ten, Home and End the ends).
  A tap without moving picks the person: their z-score (tab 1) or their place against the fences (tab 2) in the cause
  line.
- **Under the cause line:** "− 20 students +" ("n = 20" on phones; 5 to 40 people), the ± 1 SD switch (tab 1), Start
  over. The data set picker sits beside "Show me how".
- **Animates:** a drag moves the person with the finger; the mean mark follows at once, the wedge slides after it
  (about a quarter second) and the plank tips by the imbalance about the wedge's tip (420 × (mean − tip) ÷ the scale's
  range degrees, at most 6) and settles level; the flag walks to the new median; people step up or down a level as the
  stacks change. A key moves the person over 240 ms. Tab 2: the crate stretches, the slat, ropes, stakes and posts
  slide to their new values, rings and outlier dots fade in or out as a person crosses a post, bars grow. A new person
  drops in from above (520 ms); a removed one rises and fades (420 ms); Start over walks everyone back. The SD band
  grows out from the mean. A data set or tab change cross fades. Reduced motion: the result at once with a 260 ms
  cross fade.
- **Every number is read from the people as drawn:** a person counts once they have landed and stops counting as
  they start to leave; each counted person's value is their drawn x (to 0.1 px, as written) read back on the scale,
  to the data's step. The mean mark, the wedge's target, the tilt, the flag, the SD band, the crate, slat, ropes,
  posts, rings, outlier dots, bars and every label and cause line pill come from those values in that frame; a mark's number shows only while the mark is still (then it is exactly where the mark is drawn).
- **Cause line:** tab 1 at rest "20 students → mean 17.8 → median 15" (and "→ SD 10.3" with the band on); after a
  drag "48 → 68 min → mean 17.8 → 18.8 → median stays 15"; a picked person "15 min → z = −0.05 → 0.05 SD below the
  mean". Tab 2 at rest "Q1 11 · Q3 21 → IQR 10 → fences −4 and 36 → 1 outlier: 48"; after a drag "35 → 40 min →
  40 > Q3 + 1.5 × IQR = 36 → outlier"; a picked person "20 min → inside −4 to 36 → not an outlier".
- **Takeaways** (once each per data set, when a drag settles): "The median resists outliers; the mean does not."
  (the mean moved more than twice the median and at least 0.3); "Crossing the middle moves the median; the mean
  shares any change among all n."; "More than 1.5 × IQR past the box: an outlier."; "Back inside the fences: not an
  outlier."; "The box holds the middle half, so one far value barely moves it." (the quartiles did not move).
- **Cue:** "Drag a person" above the knob, which starts on the person farthest from the mean (48 min), once per
  device. "Show me how" (three steps: drag a person, the second tab, the people and data set) from the purpose line
  and "?".
- **Height:** phones: the picture is what is left of the screen under the head and above the cause line (the quiet
  buttons may sit below), so the picture, the knob and the cause line show together (390 x 844, 375 x 667, 360 x 740);
  wider screens: the frame gives the stage its height (1024 x 768, 1280 x 800 checked), no inner scroll.
- **Colors** (as the drill): the mean `--stat-s2` (orange), the median `--stat-s3` (green), the box the course ink on
  wood, fences gray, outliers `--stat-s2` (the mean is never drawn on the boxplot tab), the histogram `--stat-s1`.

### What is on screen in Explore (counted at 1440)
Outside the picture: 2 tabs, the purpose line (7 words), the data picker, "Show me how", the cause line (3 pills,
about 8 words), the people stepper, the ± 1 SD switch (tab 1), Start over. On the picture, tab 1: the plank's numbers
(8), the flag's "median 15", the mean pill, 20 people, the knob (and "−1 SD", "+1 SD" with the band). Tab 2: 2 signs,
the plank's numbers, "median", "Q1", "Q3", "outlier", "Histogram, bins of 5 min", the bar counts, "bin width", 20
people, the knob and the bin knob. Controls: the people (drag, tap, keys), the knob, the bin knob (tab 2), the tabs,
the picker, the stepper, the switch, Start over, Show me how.

### Explore against Test yourself
- **Explore:** as above; nothing graded.
- **Test yourself:** unchanged: the drill (five kinds: summary, resist, fences, describe, zscore), each answered step
  drawn on its figure (the old three view picture, `inner()`, kept as it was), first tries recorded as
  `data-explorer:<context>:<step>`; `?seed=` and `#quiz` open it. Free, as before.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Data sets: commute times, quiz scores, resting pulse rates | Kept; the picker beside "Show me how" (short names on phones) |
| Dotplot | The people on the plank (both tabs) |
| Histogram | Tab 2, under the boxplot, on its own board |
| Boxplot | Tab 2: the crate, slat, ropes and stakes, outlier dots |
| Drag a dot (mouse, touch, arrow keys); its cue "Drag a dot sideways" and the grab ring | Drag a person (any of them); keys on the knob and the people group; the cue "Drag a person" on the farthest person |
| Delete or Backspace on a dot removed it | Delete on the knob or on a picked person |
| Mean and median lines on all three plots | Tab 1: the mean mark, wedge and pill, the median flag. Tab 2: the median slat; the mean is in "?" |
| Mean ± 1 SD chip | The ± 1 SD switch (tab 1) |
| Outlier fences chip | Always drawn in tab 2 (posts and signs); not in tab 1 |
| Bin width slider | The quiet knob on the histogram's board (tab 2) |
| Tap a dot: z-score and fences | Kept, in the cause line (z in tab 1, fences in tab 2) |
| The cause text after a drag ("mean moved +1, median 0", SD and IQR before and after) | Tab 1: mean and median before and after; the IQR change shows as the crate in tab 2; SD and IQR in "?" |
| The shape words ("Skewed right: the mean sits to the right of the median") | "?" (Shape), with the stated rule of thumb |
| Add a value, Remove the selected value, Reset the data | The "− 20 students +" stepper (remove takes the picked person, else the last one); Start over |
| Why and the second sheet: every summary, the ordered values, the bin counts | "?", read from the people as drawn |
| The landing's "Drag a dot far to one side: which line follows it?" | The purpose line and the cue |
| Test yourself drill, figures, record ids, `?seed=`, `#quiz` | Unchanged |

## Decisions made for the owner (also in the owner log)
1. The dots are people standing on a plank; only equal values stand on each other's shoulders (a stack's height is
   its count); neighbors overlap side by side.
2. The mean is a balance: the plank rests on a wedge that slides to the mean; the plank tips by the imbalance and
   settles (as if the plank weighed nothing).
3. The median is a flag on a pole.
4. Two tabs: Mean and median; Outliers and the boxplot. The histogram is in tab 2 under the boxplot.
5. The boxplot is drawn as a crate, ropes, stakes; the fences as posts with signs standing on the plank (not
   through the boxplot); outliers ringed on the plank and as dots on the boxplot.
6. Drag any person; the kit's knob rides above whoever was touched last; tap to pick (z-score or fences in the cause
   line). A drag is read on the level scale.
7. The mean ± 1 SD band is a quiet switch under the cause line (tab 1 only); the fences are always on in tab 2 and
   off in tab 1.
8. The mean is not drawn on the boxplot tab (orange means outlier there).
9. Add, Remove and Reset became a stepper and Start over; a new person lands inside the middle half (spread by the
   golden ratio so they do not pile on one value).
10. The shape words and every summary table moved to "?".
11. After a drag the cause line names the mean and median before and after; the old SD and IQR before and after
    moved (the IQR shows as the crate in tab 2; both are in "?").
12. Takeaways once each per data set, only when the drawn change shows them.
13. On phones the stepper reads "n = 20", the histogram's knob says "bins of 5 min" and the picker shows short names;
    the boxplot and histogram bands are small fixed sizes so the people get the room.
14. Delete or Backspace on the knob (or a picked person) removes that person, as the old dot keys did.
15. People are sized to the room (at least 15 px wide, at most about 1.8 data steps wide), resized smoothly, never
    during a drag.
16. The flag, crate, slat, ropes and posts slide smoothly (at most about 1.2 px a millisecond); a mark's number fades
    out while it slides and its cause line pill reads "…" until it lands.

## Accuracy
- Every summary is `ApStatMath.dataExplorer.stats` over the drawn values (`ApStatDist.summary` underneath: AP quartile
  rule, sample SD with n − 1, 1.5 × IQR fences, whiskers to the last values inside). Hand checks of the three data
  sets: commute times (n 20) mean 17.75, median 15, Q1 11, Q3 21, IQR 10, fences −4 and 36, one high outlier 48
  (skewed right); quiz scores (n 18) median 42, Q1 38, Q3 45, fences 27.5 and 55.5, one low outlier 22 (skewed
  left); pulse rates (n 22) median 70, Q1 66, Q3 74, IQR 8, fences 54 and 86, no outliers (roughly symmetric).
- The balance: Σ(xᵢ − x̄) = 0, so a weightless plank with equal people balances exactly at the mean; the tilt shown
  while the wedge catches up is 420 × (x̄ − tip) ÷ the scale's range degrees (at most 6), so it has the sign of the
  turning effect about the tip and is zero only with the tip under the mean; its size is a picture, not a physics
  model. The balance is said in "?".
- Histogram bins hold their left edge (`X.bins`), as before.
- Open points: `docs/apstat-needs-author.md` "Data explorer v2".

## What was built
- `statistics/assets/tools/data-explorer.js` (Explore rewritten on the kit; Test yourself and its `inner()` figure
  unchanged), `data-explorer.css` (v2 rules appended), `statistics/data/tools/data-explorer.json` (`explore.purpose`,
  `explore.takeaways`, `pickShort`, a new intro), `statistics/data/pages.json` and the build test's fixture
  (`"kit2": true`), the rebuilt page and tool data. The model is unchanged.
- `scripts/tools-v2/stat-data-explorer-sweep.mjs` (ten widths, one process each, light and dark; `--frames`;
  `--perf`; `--shots`).

## Checks run

### First build (2026-11-24)
- `node --test scripts/test/apstat-*.test.mjs` (167 pass), `check-apstat-content` (0 failing), `build-apstat --check`
  (the other nine trainers unchanged), `build-apcalc --check`, `build-apmacro --check`, `check-site` (no broken
  references; US spellings, also in code comments), `check-weight --check` (626 budgets within range);
  `scripts/check-tool-use.mjs` with a local copy of its list (and playwright 1.63): the page sends tool-open,
  tool-touch (explore), tool-mode (quiz), tool-use, nothing under automation. Free, as before (no lock).
- Sweep, one process per width, light and dark (the dark runs assert `data-theme="dark"`, set through
  `localStorage.nremt_theme`): **1,022 passed, 0 failed** over the ten widths (102 a width, 104 at 360 with the
  360 x 740 and 375 x 667 landings): the first visit with its cue, a person dragged to each end, a tapped person, the
  SD band, three added and one removed, 40 people (both tabs), Start over, 5 people, each data set in both tabs, the
  boxplot tab with an outlier made and unmade, a picked person, the narrowest and widest bins, Start over, Test
  yourself. Each state checks clipping, 4 px between labels, labels clear of the people, the knob, the posts, the
  crate and the outlier dots, text at least 11 px, the plank and people the largest part, sideways scroll, the phone
  cause line (two rows, constant height), that the picture, the knob and the cause line show together with no inner
  scroll (390 x 844, 1024 x 768, 1280 x 800 and every other width), that "?" is filled and matches the people, and
  AGREE.
- Frames: **77 passed, 0 failed** (2,224 frames at 390 and 1440, every one agreeing): a real pointer drag out and
  back, fast reversals, a tap (z-score), keys on the knob, arrows in the people group, add and remove, the SD band,
  Start over, a data set change, the tab change, a drag that makes an outlier and back, a drag across the middle,
  the bin knob, leaving to Test yourself mid change and back (clean), a real touch drag at 390 (the person moves, the
  page does not scroll), reduced motion (at once, with the cross fade).
- Perf, CPU x4, the same run as the flagship: a person dragged out and back, median 16.7 ms, p95 16.8 ms at 390 and
  1440 (mean tab); 40 people on the boxplot tab p95 16.8 ms at both. The flagship's fertilizer drag: p95 50.0 ms at 390
  and 66.6 ms at 1440.
- Test yourself by hand: `?seed=12345#quiz` opens a z-score problem; a wrong 1 draws "yours: z = 1.00" on the dots;
  −1.03 is accepted and draws the z scale.
- Preview: `/mnt/user-data/outputs/stat-data-explorer-v2/index.html`; shots in `shots/` (every sweep state at all ten
  widths light and dark; mid animation `mid-*-tilt`, `mid-*-arrive`, `mid-*-crate` at 390 and 1440).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is still to come.
- On phones the people are small (about 15 px wide) and the commute data's stacks leave sky above them.
- The mean is not drawn on the boxplot tab (one color per idea there: orange is the outlier).
- People stacked on shoulders is a pictograph convention, not a realistic scene.
- While a mark slides its number is hidden (faded, "…" in the cause line) for up to about half a second.
- People at nearby values overlap side by side; on phones a crowd at 10 to 20 minutes reads as a row of overlapping
  figures.
- On a 375 x 667 phone the boxplot tab's histogram bars are short (about 25 px).

## Review round 1 (2026-11-24): BLOCK, fixed
`/home/claude/review-stat-data/REVIEW.md`. The statistics, the agreement and nothing dropped held. `origin/claude/tools-v2-all`
merged in (docs tables kept from both sides); the spec decision is now 22 (the fourth AP® Statistics tool on the kit).
Must fix:
1. **M1** Only people with the same value stand on each other's shoulders, so a stack's height is the count at that
   value; people at nearby values stand beside them, overlapping in depth ("?" says so). The sweep checks that the
   levels at every value are 0, 1, ..., count − 1.
2. **M2** On phones (and short desktops) the boxplot tab's boxplot band and histogram are small fixed sizes and the
   people get the rest of the height; people are at least 15 px wide (sized to the room, at most about 1.8 data steps
   wide). The sweep checks the drawn width (15 px) and that the people's drawing is larger than the boxplot and the
   histogram's bars (the plank no longer counts).
3. **M3** The flag, crate, slat, ropes and posts slide smoothly (eased, at most about 1.2 px a millisecond); a mark's
   number fades out while it slides and its cause line pill reads "…" until it lands. The frames run checks no mark
   moves more than 26 px between two frames.
Should fix, all done: the spec renumbered; the pulse numbers (Q1 66, Q3 74, fences 54 and 86); the tilt worded as the
code (420 × (mean − tip) ÷ range degrees, at most 6); the brief's decision list has all 16; a drag is read on the level
scale, so a drop lands under the finger; the boxplot tab's trestles are splayed legs with a rail.

Fix round checks (speed rule): sweep at 360 (with the 360 x 740 and 375 x 667 landings), 375 x 667, 390, 1024 and 1440,
light and dark (dark asserted), **714 passed, 0 failed** (142 a state set, 144 at 360); frames **77 passed, 0 failed**
(2,301 frames at 390 and 1440, every one agreeing, no mark jump over 26 px); AP Stats tests 167 pass, content check 0
failing, `build-apstat`, `build-apcalc`, `build-apmacro --check`, `check-site`, `check-weight`. Perf on a loaded
machine (load average 5.5 on 2 cores), CPU x4, same run: a person dragged p95 50.0 ms at 390 and 100.1 ms at 1440
(boxplot tab 33.3 and 49.9); the flagship's fertilizer drag p95 100.1 and 100.0 ms. Shots:
`/mnt/user-data/outputs/stat-data-explorer-v2/shots-r1/`.
