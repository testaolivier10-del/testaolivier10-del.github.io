# Tools v2: AP® Biology Chi-square test (brief and build notes)

Status file for the v2 rebuild of `bio/tools/chi-square.html` (rollout row 24, group G, free). Standard:
`docs/tools-v2-standard.md`; builder rules: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-chi-square`,
cut from `claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions made for the owner are also
one line each in `docs/tools-v2-owner-log.md`.

## The one main idea
**χ² adds up how far each observed count is from the count the null hypothesis expects; only when it is past the
critical value for the test's degrees of freedom (p = 0.05) is the gap too big to blame on chance.** CED skills
(`stats-chi-square`): χ² = Σ (o − e)² / e from the AP® Biology formula sheet; df = categories − 1; the critical
value from the sheet's p = 0.05 row; "reject" or "fail to reject the null hypothesis" (never "accept", never "proves").

## Research (rule 10)
"Seen" means the page's own text was fetched and read here; none could be operated, so nothing is claimed about how
they feel in the hand.

| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, seen and used) | Bars of observed counts with dashed expected boxes; drag a bar (N changes, every expected box moves); a stacked meter of (o − e)²/e; the χ² curve with the critical value and 5% tail; Chance sample with a tally; Double the sample; four goals; a test picker over six contexts | The meter (now the bar under the curve, one piece per chamber), the curve with its tail and critical value, chance runs, doubling, the goals; the dashed boxes and the moving N went |
| AP® Biology Equations and Formulas (College Board appendix, two copies seen) | χ² = Σ (o − e)² / e; table p 0.05 and 0.01, df 1 to 8 | The formula and the p = 0.05 row exactly (7.82 at df 3). One difference at p = 0.01, df 1 (6.64 there, 6.63 here): logged, see Accuracy |
| Cognito, "AP Biology formula sheet" (seen) | p = 0.05 column, "fail to reject" worked example | Confirms the row and the wording |
| ShowMeClass, choice chamber (page text seen; the interactive did not load) | Two sided chamber, pick the stimulus, release the animals, count after five minutes, compare with a 50/50 null | The choice chamber as the real setting; their gap: the χ² steps (expected, df, critical value) are not shown |
| LabXchange, Fruit fly behavior lab (summary seen) | A virtual choice chamber, then a χ² goodness of fit on where the flies went | Same setting; nothing on the χ² picture itself |
| StatKey goodness of fit (Lock5; the page could not be fetched here) | Known from its description: randomization samples pile up as dots, the p value is the share past your statistic | The idea of chance runs piling up into the curve |
| PhET | No χ² screen exists | The control on the picture, instant response (the standard's rules) |

What ours does that none of them do: the student moves real animals between real chambers, the signs count them
against the expected count at once, each chamber's gap is a coloured piece of χ² on the chance curve, and "Let them
wander" makes the null true so the student watches chance alone pile dots under the curve, about 1 in 20 past the line.

## The design
- **Picture:** a lab bench (wood grain) with a clear plastic choice chamber on it, seen from above: a damp blue paper
  towel floor for wet chambers (droplets, damp streaks), dry sandy filter paper for dry ones, plastic dividers with a
  doorway in each, a dark card over the dark chambers. 40 pill bugs (each drawn: segmented domed body with its
  plates, seven pairs of legs, head with antennae, tail prongs, a shadow). Each chamber has a sign in its outer corner:
  its name, the bugs in it ("24 bugs") and "expected 20".
- **Two tabs:** "Two chambers" (wet, dry: df 1) and "Four chambers" (wet or dry by light or dark: df 3). Each tab
  keeps its own bugs.
- **Main control, on the picture:** drag a bug into another chamber (mouse or touch; it lifts while held). Keys: each
  chamber is a button; Enter (or +, Up) brings a bug in from the fullest chamber, Delete (or −, Down) sends one to the
  emptiest. N is fixed, so the expected counts never move while the student plays.
- **The χ² graph** under the scene: the chance curve for this df (shaded faintly), the critical value line named
  "critical value 3.84" (or 7.82) with "5% tail" past it, a bar along the χ² axis made of one piece per chamber in the
  chamber's colour ((o − e)²/e end to end), the χ² marker with its pill ("χ² = 1.60", red once past the line), and the
  chance runs as dots over their χ² values with a tally ("chance runs 16 · past the line 1"). The critical labels sit
  on the side of their line away from the marker.
- **Cause line** (`K.cause`): "vs expected: wet +4 + dry −4 → χ² = 1.60 → under 3.84 → fail to reject"; four
  chambers: "4 gaps → χ² = 2.00 → under 7.82 → fail to reject". Takeaways after a run ("No preference: χ² = 0.40,
  under the line, as most chance runs are (1 of 16 past it so far).", a false alarm named a type I error) and after
  doubling ("Same shares, twice the bugs: χ² went from 3.60 to 7.20 ...").
- **Buttons:** "Let them wander" (each bug picks a chamber at random with equal chance and walks there through the
  doorways), "40 bugs | 80 bugs" (every count doubles or halves, the new bugs drop in, the extra ones fade out),
  "Start over" (the opening, tally cleared).
- **Opens** on 24 wet, 16 dry (χ² = 1.60; four chambers 13, 9, 11, 7, χ² = 2.00).
- **Every change is animated:** the dragged bug follows the finger; a dropped bug walks to a free spot; wander, tab
  switch and Start over walk the bugs through the doorways; doubling grows new bugs in and halving fades bugs out. The
  signs, bar, pill and cause line are read from the bugs as drawn in that frame (a bug counts where its transform puts
  it; a fading bug counts while it is at least half drawn). The decision words wait until the bugs stop.
- **Reduced motion:** the new places at once with a 240 ms cross fade; the words whole at once.
- **Cue:** "Drag a bug to the other side", once per device, under the bug nearest the doorway in the fuller chamber.
  "Show me how" (three pointers: a bug, the graph, Let them wander) from the purpose line and from "?".
- **One colour per idea:** wet blue, dry amber (four chambers: wet light sky blue, wet dark blue, dry light orange,
  dry dark brown); χ² purple; the critical value and its tail magenta; reject red, fail to reject teal. Every value
  is also written.

### What is on screen in Explore (counted, 1440, opening)
Outside the picture: 2 tabs, the purpose line (9 words), "Show me how", the graph, the cause line (5 pills),
3 controls (Let them wander, the 40 | 80 toggle, Start over). No side panel.
On the picture: 40 bugs, 2 signs (3 lines each: name, count, expected), the cue on a first visit.
On the graph: the title, the χ² pill, "critical value 3.84", "5% tail", 6 ticks; the tally once a run has happened.
Four chambers: 4 signs, 5 ticks, "4 gaps" in the cause line.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself**, one dropdown on the stage:
  1. **Problems** (the old Practice, unchanged in content, grading and record ids: new numbers every time or the three
     worked problems, one part at a time). Its figure is the old one with expected counts as solid outlines (no
     dashes), a small drawing of what was counted under each category (die faces, coins, poppy, daisy, cornflower,
     feeders with a direction arrow, candies, yeast colonies) and the formula sheet's table of critical values under
     it, the student's df column marked.
  2. **Challenges** (the old Explore goals): flip the decision to reject; switch to 80 bugs with χ² under the line;
     switch to four chambers; let them wander 20 times. On the same chamber, starting from the opening; Explore keeps
     its own bugs.
- Deep links: `#practice` and `?seed=` open Problems as before; `#goals` opens Challenges.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Bars and dashed expected boxes | Explore: bugs in chambers with signs; Problems keeps bars, with solid outlines |
| Dragging a bar (N changed, expected boxes moved) | Dragging a bug between chambers (N fixed) |
| The test picker (six contexts, 2 to 6 categories) | Two tabs (2 and 4 chambers). The six contexts (3, 5, 6 categories, df 2, 4, 5) stay in Problems |
| Tests with unequal expected shares (seed mix 50/30/20, yeast 3 : 1) | Problems only (Explore's null is equal shares); logged in review round 1 |
| −/+ steppers and arrow keys on a bar | Keys on each chamber (Enter in, Delete out) |
| The stacked meter | The bar under the curve, one piece per chamber |
| Readout (N, df, χ², critical) and the decision sentence | Cause line; "?" works the chamber out (o, e, o − e, (o − e)², (o − e)²/e, df, critical value, decision) |
| Chance sample and its tally | Let them wander; dots on the graph and the tally |
| Double the sample | 40 bugs / 80 bugs toggle (both ways) |
| Reset to expected | Start over (the opening); the expected counts are reached by dragging |
| Expected count under 5 warning | Cannot happen in the chamber (40 bugs expect 10 or 20); the rule is in "?" and in Problems' how it works |
| The four goals | Test yourself, Challenges |
| The critical value table card | Behind "?" (as before) and under each problem |
| Practice, worked set, problem code and link | Test yourself, Problems, unchanged |

## Decisions made for the owner (also in the owner log)
1. Explore is a choice chamber of pill bugs, not bars over the practice contexts.
2. Two tabs, 2 and 4 chambers (df 1 and 3); df 2, 4 and 5 only in Problems.
3. N fixed at 40 (or 80): bugs move between chambers.
4. Steppers became keys on each chamber.
5. Reset to expected became Start over (the opening).
6. Chance sample became Let them wander, with dots piling up on the graph.
7. Double the sample became a two way 40 | 80 toggle.
8. The goals became Test yourself, Challenges.
9. Readout and decision sentence moved to the cause line and "?".
10. Four chamber cause line says "4 gaps".
11. The expected under 5 warning is not in Explore.
12. Problems' figure: solid outlines, drawings of what was counted, the table under it.
13. "?" title "Numbers & critical values".
14. Hub blurb reworded; title, description, URL unchanged.

## Accuracy
- χ², df and the decision come from `ApBioMath.chiSquare` and `CHI_CRIT` (unchanged; the validator types the table
  independently). Reject only when χ² is greater than the critical value. With 40 or 80 bugs χ² never equals a
  critical value exactly, so no tie appears.
- Wording: "reject the null" and "fail to reject"; "?" says failing to reject is not proof the null is true and that
  rejecting does not say why. "p = 0.05" names the row of the table used.
- Let them wander: each bug independently picks a chamber with equal chance (the null true). The real chance of a
  false alarm with whole bugs is not exactly 5%: 3.85% for 40 bugs in two chambers and 5.67% for 80 (exact binomial
  sums), 4.52% and 4.89% for four chambers (exact multinomial sums, per the review). So the tool says "about 1 run in 20"
  and "?" gives the numbers (an earlier draft said "or fewer", which is false at 80 bugs).
- p = 0.01, df 1 now prints 6.64 as the formula sheet appendix does (review round 1; chi-crit-p01-df1 closed).
  Open: chi-explore-pill-bugs (the setting, the wording of the 5%, the dark card).

## What was built
- `bio/assets/tools/chi-square.js` (rewritten; the practice figure kept and restyled), `bio/assets/tools/chi-square.css`
  (new, this page only), `bio/data/tools/chi-square.json` (`explore`; contexts and problems unchanged),
  `bio/data/pages.json` (`"kit2": true`, the blurb), `bio/assets/tools/bio-tools.js` (one title string). The adapter
  `ApBioTools.studioKit2` is used as it is (a practice part and a docked part, as Simpson and Hardy-Weinberg).
- `scripts/tools-v2/chi-square-sweep.mjs` (kept sweep, one width per process, plus `--frames`),
  `chi-square-perf.mjs` (frame times at CPU x4 beside the flagship), `chi-square-interact.mjs` (the tool used).

## Checks run (2026-11-19)
- `node --test scripts/test/apbio-*.test.mjs` (74 pass), `check-apbio-content` (0 failing), `build-apbio --check`,
  `check-site` (after fixing the British spellings it caught), `check-weight --check` (623 budgets within range),
  `build-apcalc --check`, `build-apmacro --check`; `scripts/check-tool-use.mjs` with a local copy of its list: the
  chi-square page sends tool-open, tool-touch (explore), tool-mode (quiz), tool-use, nothing under automation.
- Sweep: 13 landmark states (two chambers: opening, even, past the line, all wet, near and just past the line, 80
  bugs; four chambers: opening, even, past, all in one, near, 80), the first visit, Challenges and Problems, at 360,
  390, 430, 600, 768, 820, 1024, 1280, 1440, 1920, light and dark; about 6,000 checks a width. Frame by frame at 390
  and 1440 (about 1,100 frames each: drag slow and fast and back, wander, 40 to 80, wander at 80, 80 to 40, tab
  switches, keys, Start over, a wander restarted mid run, leaving mid run, reduced motion): every frame's signs,
  cause line, χ² pill and bar pieces match the bugs drawn in it; no decision word while bugs move. Final run: **76,106 passed, 0 failed**
  (about 6,050 a width; 15,658 frame checks over 1,782 frames).
- `chi-square-interact.mjs`: 167 passed, 0 failed (390 real touch, 768 and 1440 mouse, light and dark).
- Perf, CPU x4, same run as the flagship (machine at load 5 on 2 cores): dragging a bug, median 16.7 ms and p95
  16.8 ms at 390 and at 1440, main thread 5 ms a frame; the flagship's fertilizer drag in the same hour: median 50 ms,
  p95 117 ms, main thread 11 ms a frame. Let them wander with 80 bugs walking: median 16.7 ms, p95 50 ms at 390 and
  83 to 133 ms at 1440 (the bugs now have their own compositing layer, which roughly halved it).
- Preview: `/mnt/user-data/outputs/chi-square-v2/index.html`; shots in `/mnt/user-data/outputs/chi-square-v2/shots/`
  (`sweep-*` landmark states, `v-*` including mid drag, mid wander, mid 80 bugs, mid tab switch).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students.
- Let them wander with 80 bugs at 1440 has a p95 above 50 ms at CPU x4 (80 moving SVG `<use>` elements repaint the
  bug layer each frame). The drag, the main control, is within budget.
- The df 1 chance curve rises without limit at 0, so its shaded area meets the top of the plot as a faded block on the
  left; the stroked curve comes in from the top edge.
- On a phone in four chambers with 80 bugs, the bugs are about 18 px and crowd; they still count right.
- The four chamber cause line names the gaps only as "4 gaps" (the per chamber gaps are on the signs and in the bar).
- Bugs on the drag path are lifted over the dividers rather than walking through a doorway (a hand moving a bug).

## Review round 1 (2026-11-19): BLOCK, fixed
`/home/claude/review-chi-square/REVIEW.md`. Science and frame agreement confirmed. The branch already held the latest
`claude/tools-v2-all` (nothing to merge; its `check-tool-use.mjs` untouched).

Must fix:
1. **Explore empty after a deep link** (`#goals`, `#practice`, `?seed=`): `shown()` saved `drawnCounts()` before the
   scene had a layout. It now saves only once the scene is laid out. Sweep: each deep link, then Explore, shows 24, 16.
2. **Problems figure collapsed** (the table sat in the fixed-height slot): the figure, its slot and the practice
   stage keep their own height and the stage body scrolls, as on main. Sweep: the figure is at least 250 px tall at
   every width and its text, measured at the drawn scale (the smaller of width and height over the viewBox), is at
   least 11 px; the old check read only the width.
3. **Run dots dropped**: every run is drawn; once the tallest column would not fit, every dot gets a smaller step
   (recheck 1 polish: the radius stays at 3 px or more and only the spacing shrinks, so dots overlap). Sweep: 150 runs give 150 dots, inside the plot.
4. **Dots over "5% tail"**: the label now sits under "critical value" at the top of the line, and the pile's room
   stops below both. Sweep: 150 runs heaped around the critical value cover no label, in both tabs.
5. **A drag during a wander**: a grab (or a key) while bugs walk finishes the walk at once, counts the run as its own
   chance run, then the drag starts. Frames: no decision word while bugs walk; the tally rises by one, not two.

Checks after the fixes: sweep (ten widths, one process each, plus frames) **77,666 passed, 0 failed**; interact 167
passed; AP Bio tests 74 pass; content check, build-apbio --check, check-site and check-weight pass. A press on the
chamber during a walk finishes the walk even when no bug is under the finger.

Should fix: the df 1 fill left of where the curve enters now fades upward and the curve starts exactly at that point
(found by halving); 6.64 (above); unequal expected tests logged (above); the phone graph title is "χ² (curve: chance
alone)"; the chamber buttons say "expected 20"; needs-author rates corrected to 4.52% and 4.89%. Wander at 1440 with
80 bugs: not changed beyond the compositor layer of round 0 (see "Not happy with").
