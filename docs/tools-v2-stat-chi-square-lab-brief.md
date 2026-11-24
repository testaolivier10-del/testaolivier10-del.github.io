# Tools v2: AP® Statistics Chi-square lab (brief and build notes)

Status file for the v2 rebuild of `statistics/tools/chi-square-lab.html` (rollout row 52, group G, wave 13, Premium,
marked rework). Plan: `docs/tools-v2-plans/stat-chi-square-lab.md`. Standard: `docs/tools-v2-standard.md`; builder
rules: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-stat-chi-square-lab`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`. Second AP® Statistics tool on the kit, on the adapter Interval capture added
(`ApStatTools.studioKit2`, spec decision 19); the adapter itself is unchanged.

## The one main idea
**χ² adds up how far each cell's count is from the count we would expect if H₀ were true; the cells far from
expected drive it, and a large χ² leaves a small p-value.** Expected count = (row total)(column total)/(grand total);
each cell adds (O − E)²/E; df = (r − 1)(c − 1); the p-value is the area to the right of χ² under the chi-square curve
for that df: assuming H₀ is true, the probability of a χ² this large or larger (never the probability that a
hypothesis is true). Conclusions follow `docs/apstat-authoring-guide.md` ("Writing conclusions in context").

## Research (rule 10)
"Seen" means the page's text was fetched and read here (Firecrawl); none of the applets could be operated.

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, read and used) | A two-way table with observed and expected counts and a heat colour per cell (orange O above E, blue below); the χ² curve for the df with the statistic, the shaded p-value, the α cutoff and a stacked bar of the components; tap a cell, then a slider, − and +, a typed count or arrow keys; Chance table; Step by step; a homogeneity or independence switch; α 0.01, 0.05, 0.10; every number in tables | All of it (see "What moved") |
| StatKey, Chi-square Test for Association (Lock5, seen) | Pick a dataset; the original table with "Observed, Expected, Contribution to χ²" in each cell; Generate 1, 10, 100, 1000 randomization samples under "Null hypothesis: No Association" into a dotplot of χ² | Each cell carries its observed and expected count (its contribution is the cause line's "part" and the bar); the null drawn tables are our Chance table |
| Rossman/Chance, Analyzing Two-way Tables (`ChisqShuffle`, seen as search text; the applet index seen) | "Chisq Cell Contributions" per cell, then "Sum = …, df = …, p-value"; shuffling under H₀ | The contributions summed into one statistic: our bar of parts along the curve's axis, end to end, ends at χ² |
| The integrated AP® Biology Chi-square test (`docs/tools-v2-chi-square-brief.md`, used) | A choice chamber of drawn pill bugs; each chamber's gap is a piece of the bar under the curve; the critical value line; takeaways after a run | The bar of parts under the curve and its colours by direction; the stage layout; its review lessons (Explore laid out after a deep link; no figures collapsing in Test yourself) |
| OpenStax Introductory Statistics 2e §11.3, 11.4 (known, not fetched here) and the AP® Statistics CED (course research in `docs/apstat-research/`) | Expected counts from the margins, df, the upper tail, conditions | The science checks below |

What ours does that none of these do: the table IS the picture (one stack of trays per cell, its height the count, a
line at its expected count), so changing one count visibly moves its row and column totals and every expected line at
once, and the gaps feed the bar under the curve in the same frame.

## The design
- **Picture (one scene):** a cafeteria wall with one wooden counter per row (the groups: schools, age groups,
  fertilizers), a sign with the row's name, and one stack per cell standing on it. A stack is made of trays (lunch),
  survey cards (news source) or seedling flats (flowers), each one standing for u counts (u = 1, 2, 5 or 10, the
  smallest that keeps a tray at least 4 px tall; said in "?"), so the stack's height is the count (the top tray can be
  part of one). Column heads are the categories, each with a drawn icon (pizza, salad, sandwich, hot meal; phone,
  TV, laptop; many flowers, one flower, leaves). A dark line with two small pointers across each stack is its expected
  count. The gap between the top and the line is orange (more than expected) or blue (fewer, the empty space up to
  the line). Each cell shows its count (left, orange or blue ink) and its expected count (right, after a short line
  like the one on the stack; "expected 30.7" on wide screens). Row totals at the right, column totals and the grand
  total at the bottom; the selected cell's row and column totals are in the course colour. An expected count under 5
  turns its line and number red.
- **The χ² panel:** beside the table on wide screens (900 px and up), under it otherwise: the chi-square curve for
  the table's df ("χ² if H₀ is true, df = 6"), the parts bar along its axis (one piece per cell, (O − E)²/E long,
  orange or blue, the selected cell's outlined), the χ² marker with its purple pill where the bar ends, the p-value
  shaded to its right with its key ("p-value = 0.1018"), the α cutoff line with its name ("α = 0.05 cutoff 12.59";
  short "cutoff 12.59" when there is less room; never across the marker). The axis runs to the study's own χ² (up to
  four times the usual range), so every part of the bar is on it; a later χ² past the end pins the marker with "→".
- **Main control:** the selected stack's knob (`K.handle`, vertical). A press anywhere on a cell picks that cell and
  drags its stack from where the finger is (no jump). Keys on the knob: up and down 1, Shift or Page Up and Down 10,
  Home and End the ends, left and right the next cell. A cell's count runs from 0 (1 when its row or column would
  be empty) to the study's cap (1.15 × its largest count).
- **Quiet:** Chance table (a table drawn as if H₀ were true: each row keeps its total, the counts follow the pooled
  column shares), Start over, the study picker beside "Show me how".
- **Animates:** trays go on or come off one count at a time (a drag follows the finger in 60 to 340 ms; Chance table,
  Start over: every cell together over 600 to 700 ms); the totals, every expected line, the gaps, the parts bar, the
  marker, the pill and the shading follow in the same frame. A study change cross fades. Reduced motion: the result at
  once with a 260 ms cross fade.
- **Every number is read from the stacks as drawn:** the drawn table is integer counts per frame; the totals, the
  expected counts and lines, the parts, χ², the p-value, the knob's place and the cause line are all computed from it
  (the sweep reads each count back from its stack's drawn height and checks everything else against it).
- **Cause line:** "Sandwich, South: 33 vs 25.0 → part 2.56 → χ² 10.59 → p = 0.1018" (phones: "33 vs 25.0 expected"
  without the name; the cell is outlined), "E under 5" in red when the condition fails. Takeaways once the stacks
  stop: crossing α, "p < 0.05: convincing evidence that lunch choice differs by school." (or "p > 0.05: not
  convincing evidence ..."); the first drag that moves χ² by more than 1.5 without crossing, "Bigger gaps from expected
  make χ² bigger and the p-value smaller." (or the reverse); after a chance table, "Drawn with H₀ true: p = 0.6521.
  About 95 in 100 land above 0.05."
- **Cue:** "Drag a stack", once per device, beside the selected knob on the side with room; on a phone the first
  selected cell is the one with the biggest part of χ² among those where the cue fits beside it without covering a
  sign, a total or a number. "Show me how" (three steps: the knob, the curve, Chance table) from the purpose line and
  from "?".
- **Height:** below 1000 px the scene takes the room left on screen (min 440, 340 under 700 px tall phones), so the
  stacks, the knob, the curve and the cause line show together; short phones (scene under 460 px) get a compact curve
  panel (no title row; the pill and the key share the top row; df joins the axis's name).
- **Colours:** more than expected orange (`--stat-s2`, the old heat colour), fewer blue (`--stat-s1`), the expected
  line ink, χ² purple, the p-value the course colour, under 5 red; the stacks themselves neutral.

### What is on screen in Explore (counted at 1440, lunch study)
Outside the picture: the purpose line (7 words), the study picker, "Show me how", the cause line (4 pills), Chance
table, Start over: 3 controls plus the link. On the picture: 12 stacks with 12 counts and 12 expected counts, 4 column
names with icons, 3 row signs, "Total" twice, 3 row totals, 4 column totals, the grand total; the panel's title, the
p-value key, the χ² pill, the cutoff label, 5 tick numbers and the bar's name. Controls on the picture: the knob (and
every cell as a press target).

### Explore against Test yourself
- **Explore:** as above; nothing graded. The hypotheses, conditions, test choice and the conclusion in full are in "?".
- **Test yourself:** unchanged: the step drill (two kinds: Carry out the test; Choose and set up the test) with the
  table filling in on the stage; first tries recorded as `chi-square-lab:<context>:<step>`; `?seed=` and `#quiz`
  open it (the sweep checks both, then Explore, at 390 and 1440).

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| The two-way table: observed, expected, totals | The picture: stacks, lines, numbers, totals |
| Heat colour of each component (orange above, blue below) | The gap between the stack and its line, and the parts bar (the whole cell is no longer tinted) |
| χ² curve for the df, the statistic, shaded p-value, α cutoff, stacked components bar, selected cell outlined in both | Kept (the panel) |
| Tap a cell; slider, − and +; arrow keys on the cell | Tap or press a cell; the knob on its stack (drag, keys); the slider and − + went |
| Type a count | "?" More settings (the selected cell) |
| Chance table | Kept (secondary button) |
| Step by step (hide E, fill one cell at a time with the formula) | Test yourself ("Carry out the test" asks an expected count with the formula and its totals highlighted); "?" shows the selected cell's expected count with its numbers |
| Homogeneity or independence switch with the "does not fit" sentence | The test follows the study; "?" says which test, why, and why the other does not fit |
| α 0.01, 0.05, 0.10 | "?" More settings (the cutoff, the takeaways and the conclusion follow it) |
| Every number (observed, expected, components tables, χ², df, p, Table C, smallest expected) | "?" |
| Hypotheses, the expected counts condition, the conclusion in context | "?" (with the random and 10% conditions in words) |
| Study picker (three studies) | Beside "Show me how" (short names: Lunch choices, News sources, Fertilizers) |
| Legend (above, below, p-value) | The colours are named where they are used: the cause line's pill colour, the p-value key on the panel, "?" |
| Test yourself drill, record ids, `?seed=`, `#quiz`, Premium card when locked | Unchanged |

## Decisions made for the owner (also in the owner log)
1. The table is drawn as stacks on counters, one per cell, a tray (card, flat) per u counts, with the expected count as
   a line on each stack.
2. The heat colour moved from the whole cell to the gap between the stack and its line (and the parts bar).
3. The slider and − + went; the knob on the selected stack is the main control (a press on any cell picks and drags it).
4. Typing a count and α moved behind "?".
5. Step by step moved to Test yourself ("Carry out the test"); "?" works the selected cell's expected count.
6. The test switch went: the test follows the study, and "?" says why the other test does not fit.
7. The χ² panel sits beside the table on wide screens and under it otherwise; its axis runs to the study's own χ².
8. On phones the selected cell's numbers give way when its knob rises over them (the cause line has them), and the
   first pill drops the cell's name.
9. A cell can go to 0 unless its row or column would be empty (then 1); the cap is 1.15 × the study's largest count.
10. Goodness of fit appears only as a "Going further" line in "?" (out of the revised course).
11. Takeaways: crossing α (decision and evidence words), the first big change, a chance table ("about 95 in 100").
12. Test yourself figure: the old dashed cutoff line is solid.
13. Review round 1: the knob sits beside the selected stack's top, not on it (on phones the last column's on the left).
14. Review round 1: the first visit cue goes where it covers nothing (above or beside the knob, its arrow on the stack);
    phones under 430 px have no such place, so there a words cue ("Drag the ↕ on a stack") sits in the head row
    (recheck 1).
15. Review round 1: a chance table moves trays within each row in pairs, so the row totals never change while it plays.
16. Review round 1: phones cap a count at 1.05 times the study's largest; short phones show the column names without
    icons; the curve's axis reaches the study's opening χ² (up to 4 times its usual range; recheck 1); the wide panel's plot is at most 0.8 times as tall
    as wide.
17. Review round 1: the short expected label is "E 30.7" (no bare bar).

## Accuracy
- Every expected count, component, χ², df and p-value comes from `ApStatDist.chi2table` / `chi2Sf` / `invChi2`
  (through `ApStatMath.chiSquareLab.table`). Checked against SciPy (`chi2_contingency` without correction, `chi2.sf`,
  `chi2.ppf`) to 8 significant figures: lunch χ² 10.593556, df 6, p 0.10178010; news 48.222791, df 4, p 8.48e−10;
  plants 2.769935, df 2, p 0.25033188; cutoffs 12.591587, 9.487729, 5.991465; spot values pchisq(9.3, 6, upper) =
  0.15739592, (3.84, 1) = 0.05004352, (30, 4) = 4.894437e−6, (20, 12) = 0.06708596. All equal.
- The conditions: random (the study's words), 10% (for samples, not the experiment), every expected count at least 5
  (the smallest is in "?"; any cell under 5 is red and the cause line says "E under 5").
- The tests: lunch and plants are homogeneity (separate samples; random assignment for the plants, so a rejection is
  evidence the fertilizer causes the difference), news is independence (one sample, two variables; an association is
  not cause and effect). Hypotheses and conclusions come from the model's `hyp` and `conclusions` (the authoring
  guide's templates: compare p with α, evidence language, H₀ never accepted).
- The p-value is worded "assuming H₀ is true, the probability of a χ² of … or larger … It is not the probability that
  H₀ is true." No probability is given for a single hypothesis.
- Open points: `docs/apstat-needs-author.md` "Chi-square lab v2".

## What was built
- `statistics/assets/tools/chi-square-lab.js` (Explore rewritten on the kit; Test yourself and its figure unchanged),
  `chi-square-lab.css` (v2 rules appended; the drill figure's kept), `statistics/data/tools/chi-square-lab.json`
  (`explore.purpose`; per study `short`, `icons`, `token`, `noun`, `unit`, `claim`, `experiment`, `random`),
  `statistics/data/pages.json` and the build test's fixture (`"kit2": true` for this page).
- `scripts/tools-v2/stat-chi-square-lab-sweep.mjs` (ten widths, one process each, light and dark; the fit screens;
  deep links; `--frames`; `--perf`; `--shots`).

## Checks run (first build, 2026-11-24)
- `node --test scripts/test/apstat-*.test.mjs` (166 pass), `check-apstat-content` (0 failing), `build-apstat --check`,
  `build-apcalc --check`, `build-apmacro --check`, `check-site` (no broken references), `check-weight --check` (626
  budgets within range); `scripts/check-tool-use.mjs` with a local copy of its list: tool-open, tool-touch (explore),
  tool-mode (quiz), tool-use; nothing under automation. The locked state is the Premium card, no stage, no errors.
- Sweep, one process per width, light and dark (dark asserted through `localStorage.nremt_theme`): **781 passed, 0
  failed** (360: 78 with the two short phone fits, 390: 85 and 1440: 84 with the deep links, 1024 and 1280: 77 with
  their fit, the rest 76); frames **48 passed, 0 failed**. States: the first visit with its cue, a stack at its top and lowest, a last column cell
  at its top, the first cell at its top, Start over, a chance table, α = 0.01, a drag that crosses α (the takeaway),
  News, News with expected counts under 5, Fertilizers and one at its top, back to Lunch, Test yourself, back to
  Explore. Each checks clipping, 4 px between labels, labels clear of the stacks, the lines, the bar, the marker, the
  cutoff, the curve and the knob, text at least 11 px, the table the largest part, sideways scroll, the phone cause
  line (two rows, constant height), the cue covering nothing, and AGREE (every number against the stacks as drawn).
  Fit: 390 x 844, 1024 x 768, 1280 x 800, 375 x 667, 360 x 740 (the knob, the picture and the cause line on one
  screen, no inner scroll).
- Frames at 390 and 1440, AGREE after every animation frame: a real pointer drag up and back, a fast drag reversed
  mid change, a press on another cell and a drag, keys (up, Shift, Page Down, Home, End, right), Chance table, Start
  over, a study change and a chance table, leaving to Test yourself mid change and back (finished, clean), a real
  touch drag at 390 (the count moves, the page does not scroll), reduced motion (at once, takeaway, cross fade).
- Perf, CPU x4, the same run as the flagship: knob drag median 16.7 ms, p95 16.8 ms at 390 and 1440; chance table p95
  16.8 ms at 390 and 33.3 ms at 1440. The flagship's fertilizer drag: p95 50.0 ms at 390 and 66.7 ms at 1440.
- Preview: `/mnt/user-data/outputs/stat-chi-square-lab-v2/index.html`; shots in `shots/` (sweep states at 360, 390,
  768, 1024 and 1440 light and dark; mid animation `mid-*-chance`, `mid-*-drag`).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is still to come.
- On phones the stacks are small (about 1 px a count; a tray is 5 or 10 counts), and on a 375 x 667 phone the rows
  are about 40 px tall: the gaps still read, the trays barely. Wide screens are where the picture is at its best.
- The cells keep room above each stack up to the cap, so most stacks fill half to two thirds of their cell.
- The tall curve beside the table on wide screens is narrow and steep for small df.
- Mid change the totals show the drawn counts (a chance table's row total can read 101 for a moment); that is the
  honest drawn state, and it ends on the kept totals.
- Test yourself is the old drill unchanged (its figure is the old table; only its cutoff line is now solid, not
  dashed).

## Review round 1 (2026-11-24): BLOCK, fixed
`/home/claude/review-stat-chi/REVIEW.md`. Statistics and frame agreement held. Must fix:
1. The curve's title names the null by design: "(no association)" for independence, "(same distributions)" for
   homogeneity.
2. The short expected count reads "E 30.7" (the bare bar read as a minus sign); "expected 30.7" on wide cells.
3. The first visit cue is placed by `cueSpot`: above the knob, above the stack (its arrow on the stack, the bubble slid
   clear of the knob), beside or below, at the first place where it covers no stack, gap, expected line, number, sign,
   total or the knob, trying the cells from the biggest part of χ² down and "Drag a stack" then "Drag"; a smaller bubble
   under 1100 px and a smaller one on phones. Phones under 430 px have no such place: no cue there, the knob pulses
   (owner log). The sweep's cue check now covers stacks, gaps, lines and pointers.
4. The knob sits beside the stack's top (right of it; on phones the last column's on the left, clear of the totals),
   never above the numbers band, so it never hides the gap or the line.
5. Test yourself: the figure fits the stage less the expand button's 44 px (the Total row shows on first load at 390),
   and a wrong answer's pill goes under the table with a row kept for it.
Should fix, all done: a chance table moves trays in pairs within each row (the row totals never move; the frames run
checks it); "?" reads "Because the p-value (less than 0.0001) is less than"; the 10% condition with numbers ("100
students is less than 10% of all students at each school", "340 adults ..."); "?" works the expected count and its part
with E to 3 places; the chance takeaway "About 95 in 100 chance tables give p above 0.05" (α as set), and the tour step
says "above α"; the expected count hint renders at full size (`math-style: normal`, at least 12 px); short phones get
the stacks more room (names only in the heads, a slimmer totals row, the phone cap 1.05, the curve panel 112 px); the
wide panel's plot is at most 0.8 times as tall as wide, and the axis runs to at most 2.5 times its usual range (News'
χ² then pins at the end with "→"); bigger drawn icons (a TV picture, a web page, flowers in pots); the brief lists every
owner log decision.

Fix round checks (speed rule): sweep at 360 (with 375 x 667 and 360 x 740), 390, 1024 and 1440, light and dark,
**324 passed, 0 failed**; frames **50 passed, 0 failed** (with the row totals held through a chance table); AP Stats
tests 166 pass, content check 0 failing, `build-apstat`, `build-apcalc`, `build-apmacro --check`, `check-site`,
`check-weight --check`.

## Recheck 1 (2026-11-24): BLOCK, fixed
`/home/claude/review-stat-chi/REVIEW-recheck1.md`. Must fix: (1) the chance takeaway reads "Chance table: p = 0.3802.
About 95 in 100 chance tables give p above 0.05." (it had read "H₀ true: p = …"); (2) the cue's arrow was drawn over
its words when the bubble slid (`--tk2-cue-dx`): the words now sit above the arrow; the arrow tip stops 4 px above the
higher of the stack's top and its line's pointers (and above the knob's ring). Should fix: the axis reaches each
study's opening χ² again (News' parts bar whole); the wide χ² panel is pinned to the top and ends at the plot (no
empty bands inside it); narrow phones (under 430 px, where no bubble fits) get a words cue, "Drag the ↕ on a stack", at
the start of the Show me how row on a first visit, gone at the first touch. The sweep checks the fit on a first visit
too (with the words cue) and that the words cue shows under 430 px.

Checks: sweep 360 (with 375 x 667 and 360 x 740, first visit and later), 390, 1024 and 1440, light and dark, **331
passed, 0 failed**; frames **50 passed, 0 failed**; AP Stats tests 166 pass; content check, `build-apstat`,
`build-apcalc`, `build-apmacro --check`, `check-site`, `check-weight --check`.
