# Tools v2: AP® Statistics Design randomizer (brief and build notes)

Status file for the v2 rebuild of `statistics/tools/design-randomizer.html` (rollout row 100, group P, wave 15,
Premium). Plan: `docs/tools-v2-plans/stat-design-randomizer.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-stat-design-randomizer`, cut from `claude/tools-v2-all`.
NOT merged: an independent review comes first. Decisions made for the owner are also one line each in
`docs/tools-v2-owner-log.md`. The second AP® Statistics tool on the kit: it reuses `ApStatTools.studioKit2` and the
`"kit2": true` page flag added by Interval capture (spec decisions 19 and 20).

## The one main idea
**Random assignment balances the groups, so the estimates centre on the true effect; blocks and pairs make them vary
less; letting someone choose the groups biases them.** Vocabulary as the CED (1.10, 1.13) and the authoring guide:
experimental units, treatments, explanatory and response variables, completely randomized, randomized block and
matched pairs designs, confounding, placebo, blinding; random assignment allows cause and effect, random sampling
allows generalizing.

## Research (rule 10)
| Source | How it works | What we took |
|---|---|---|
| The old LevlPrep tool (`origin/main`, read and used) | Two illustrated scenes, four design chips in the panel, Randomize (markers in chance order, plants grow), a dotplot with one row per design (and per blinding), Run 100, a blinding checkbox, per unit tables | All of it (see "What moved") |
| Rossman/Chance applet index (seen as text) | Lists "Randomizing Subjects", "Matched Pairs" and "Randomized Block Design" applets; the applets themselves not opened | Known by name only |
| A course lab built on Rossman/Chance "Randomizing Subjects" (nfriedrichsen.github.io Design lab, seen) | 24 subject cards (sex, height, a hidden gene) randomized into two groups; many randomizations give a plot of the difference in a lurking variable, centered at zero | The lurking variable's balance made visible: here the sunny pots (or older volunteers) that got A and B, in the cause line, every run |
| StatKey (lock5stat.com, seen as text only: the index page) | Randomization test for a difference in means, a dotplot of differences | The row of estimates as a dotplot |
| Art of Stat web apps | Not reached (the fetch was not approved in time) | The plan's "labels dealt one by one" taken from the plan's note |

What ours does that none of these do: the experiment is drawn (pots on a sunny and a shady bench, people at tables),
a hand deals the treatment stickers in the order the design's chance mechanism picks them, the plants grow to scale
against a ruler, and the estimate drops into its own design's row, so the four designs' rows sit side by side against
the true effect.

## The design
- **Picture:** two parts. The experiment (the larger, left on a desktop, top on a phone): a band with the A and B key
  and **Randomize and run**, then the greenhouse (a window over the back bench with the sun and its light; a shaded
  front bench; a ruler post at each bench's left; 16 terracotta pots with seedlings) or the memory study (24 people
  at four tables, younger in front of an aisle, older behind, a group label in the left margin, a score gauge out of
  30 beside each person, a pill on the table in front of each; the blind switch on the floor). The plot of estimates:
  its title (the axis's quantity), four rows each headed by its design card, the true effect as a solid line with its
  value in a pill under the axis, the axis numbers.
- **Main control:** Randomize and run, on the picture. The design is a tap on a card (the cards are the row heads).
  Quiet: the experiment picker beside "Show me how", Run 100 and Start over under the cause line, the blind switch
  (memory study only).
- **Animates:** a hand carries each sticker to its unit and sticks it (it grows in), in the deal order; then the sun
  crosses the window while every plant grows from a 5 cm seedling to its height (or every gauge fills to the score);
  then the estimate drops as a dot from the top of its row to its stack. Run 100: the scene shows the last of the
  hundred with a cross fade, and the hundred dots stream in (13 ms apart, each falling 0.42 s). Block frames and pair
  trays fade in and out with the design; a new bench comes in with a cross fade. Reduced motion: the result at once
  with a 0.26 s cross fade.
- **The design on the scene:** completely randomized shows nothing extra; randomized block draws a frame round each
  block and names it on the bench ("Block 1: Sunny row"); matched pairs puts each pair on a shared tray (pots) or
  mat (people); someone picks deals every A first.
- **Every number is read from the picture as drawn:** a sticker counts once it is down at full size; the balance
  pill counts the stickers on the second block; the estimate is the mean drawn height (stem length over the ruler's
  scale) or gauge score of A minus that of B, shown only when every sticker is down and the growth is done; a row's
  count, centre (the triangle) and the cause line's "centered" are the dots that have landed.
- **Cause line:** landing "Randomized → chance deals A and B → estimate = mean A − mean B"; dealing "Randomized →
  dealt by chance 7 of 16"; growing "Randomized → sunny: 5 A, 3 B → week 3"; landed "Randomized → sunny: 5 A, 3 B →
  estimate 3.1 cm → true 2.5"; after Run 100 (or 20 runs in the row) "Blocked → 101 runs → centered 2.5 cm → true 2.5"
  ("centered 7.2 cm" in vermillion and "true 2.5: biased" when the row's mean is off by more than 3 standard errors and
  0.3 units); a picked unit "Plant 6 → sunny row → A: new → 31.2 cm".
- **Takeaways** (once each per experiment, at rest): "Random assignment centers the estimates on the true effect.";
  "Blocking by sunlight makes the estimates vary less around the truth." (only when the block row's SD is under 85% of
  the completely randomized row's); "Pairing similar plants makes the estimates vary less around the truth."; "The
  gardener gave A to the sunny pots: the estimates are biased."; "Not blind: expecting caffeine to help raises
  scores, so estimates run high."
- **Cue:** "Start here" under Randomize and run, once per device. "Show me how" (three steps: a card, Randomize and
  run, Run 100) from the purpose line and "?".
- **Height:** below 1000 px the scene's height is what is left of the screen under the head and above the cause line
  and Run 100, so the picture, Randomize and run, the cause line and Run 100 show together.
- **Colours:** A the second series (vermillion), B the first (blue), estimates the third (green), the design the
  course ink, the lurking variable sun yellow, biased vermillion.

### What is on screen in Explore (counted at 1440, after a run)
Outside the picture: the purpose line (6 words), the experiment picker, "Show me how", the cause line (4 pills,
about 12 words), Run 100, Start over. On the picture: the A and B key (2 stickers, 4 words), Randomize and run, the
two bench labels, the ruler numbers, the plot's title, four cards (name and count), the axis numbers, the true effect
pill. Controls: Randomize and run, 4 cards, the units (tap or arrows), Run 100, Start over, the picker, Show me how
(the blind switch on the memory study).

### Explore against Test yourself
- **Explore:** as above; nothing graded.
- **Test yourself:** unchanged: the drill, five kinds (name the design, variables and units, scope, random
  assignment step by step, confounding and blinding) with its figures; first tries recorded as
  `design-randomizer:<context>:<step>`; `?seed=` and `#quiz` open it. The Premium lock is the course's (unchanged).

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Scenes: tomato seedlings (one row by the window), the memory study (younger and older) | Kept, redrawn; the picker beside "Show me how" |
| Design chips (Randomized, Blocked, Matched pairs, Someone chooses) | The four cards on the picture, each the head of its row |
| Randomize and run (markers in chance order, plants grow, scores show) | Randomize and run on the picture; the hand deals in the design's order; plants grow to scale; scores fill gauges |
| The dotplot of estimates, one row per design (and per blinding) against the true effect (dashed) | Kept; one row per design, not blind runs as hollow dots in the same row; the true effect solid with its pill |
| Run 100 | Kept, under the cause line (no dealing, dots stream in) |
| Blinding checkbox (memory study) | A quiet switch on the floor of the room, on by default |
| Clear the dots | Start over |
| The strip (sunny or older units in A and B; means of A and B) | The cause line's balance pill and estimate; the means in "?" |
| Tap a unit (its group, age, treatment, value) | Kept, in the cause line; arrows from the keyboard |
| Per unit table, table of every design (runs, mean, SD) | "?" |
| Why text per design, reading the dots, blinding, scope of inference | "?" |
| Test yourself drill and its figures | Unchanged |

## Decisions made for the owner (also in the owner log)
1. The design chips became cards on the picture, the heads of the plot's rows.
2. Randomize and run on the picture; Run 100 and Start over under the cause line.
3. A hand deals the stickers in the design's own chance order (`dealOrder`).
4. Block frames and pair trays or mats draw the design on the scene.
5. Plants grow to scale against a ruler; scores fill gauges out of 30.
6. Run 100 skips the per unit animation.
7. A change mid run drops that run and brings in a new bench; leaving to Test yourself finishes it.
8. Clear the dots is Start over; the tables moved to "?".
9. The memory study's "no random assignment" is the researcher choosing, so it can still be blind.
10. Blinding is a quiet switch; not blind runs are hollow dots; the caffeine pill is drawn different when not blind.
11. Tap a unit to read it in the cause line; no per unit numbers on the picture.
12. Phone cards show the name only.
13. Takeaways only when the rows at rest show them.
14. The true effect line is solid, with a pill.

## Accuracy
- The model is unchanged apart from `dealOrder()` (tested: every unit once; one block then the other; pair by pair;
  every A first when someone picks). Assignments are equal groups; block and pairs balance the other variable exactly
  (the validator checks it); the estimate is mean A minus mean B (checked).
- True effects: plants 2.5 cm (sunlight adds 6 cm), memory 1.5 words (older volunteers recall 4 fewer; an unblinded
  placebo effect adds 1.8 to caffeine). "Biased" uses the old tool's rule (3 standard errors and 0.3 units).
- Scope: "?" says random assignment allows cause and effect for units like these, and generalizing needs random
  sampling, which these units did not have.
- Open points: `docs/apstat-needs-author.md` "Design randomizer v2".

## What was built
- `statistics/assets/tools/design-randomizer.js` (Explore rewritten; Test yourself and its figures unchanged),
  `design-randomizer.css` (v2 rules; the drill figures' rules kept), `statistics/assets/tools/math/design-randomizer.js`
  (`dealOrder`), `statistics/data/tools/design-randomizer.json` (`explore.purpose`, short names, takeaways, the memory
  study's chooser), `statistics/data/pages.json` and the build test's fixture (`"kit2": true`), the rebuilt page and
  tool data; `scripts/test/apstat-tool-design-randomizer.test.mjs` (the deal order).
- `scripts/tools-v2/stat-design-randomizer-sweep.mjs` (ten widths, one process each, light and dark; `--frames`;
  `--perf`; `--shots`).

## Checks run

### First build (2026-11-24)
- `node --test scripts/test/apstat-*.test.mjs` (167 pass, one new: the deal order), `check-apstat-content` (0
  failing), `build-apstat --check` (the other nine trainers unchanged), `build-apcalc --check`, `build-apmacro --check`,
  `check-site` (no broken references; American spellings in visible text), `check-weight --check` (626 budgets within
  range); `scripts/check-tool-use.mjs` with a local copy of its list: tool-open, tool-touch (explore), tool-mode
  (quiz), tool-use; nothing under automation. The locked state is unchanged (no Premium: the course's lock card, no
  tool, no console errors).
- Sweep, one process per width, light and dark (the dark runs assert `data-theme="dark"`, set through
  `localStorage.nremt_theme`): **822 passed, 0 failed** over the ten widths (82 a width, 84 at 360 with the 360 x 740
  and 375 x 667 landings): the first visit with its cue, one run, Run 100 for every design, each design fresh, a picked
  unit, the memory study empty, run, Run 100 blind and not blind, block not blind, someone picks, pairs, Start over,
  Test yourself. Each state checks clipping, 4 px between labels, labels clear of dots, stickers, the truth line and
  the button, card text inside its card, text at least 11 px, the experiment the largest part, sideways scroll, the
  phone cause line (two rows, constant height), that the picture, Randomize and run, the cause line and Run 100 show
  together (390 x 844, 1024 x 768, 1280 x 800 and every other width), and AGREE.
- Frames: **68 passed, 0 failed** (about 2,900 frames at 390 and 1440, every one agreeing): a run (deal, grow, drop),
  Run 100, a design change mid run (no dot from the dropped run), a real tap (touch at 390) on a unit and arrows, a
  real tap on a card and Enter on a card, the memory study, blinding off mid run, Run 100 not blind, Start over,
  leaving to Test yourself mid run and back (clean, the run finished, its dot landed, the hand gone), reduced motion
  (at once, with the cross fade). The card fit at phone widths changed after this run; 360, 390 and 430 were run again
  (248 passed, 0 failed).
- Perf, CPU x4, the same run as the flagship: one run (plants) median 16.7 ms, p95 16.8 ms at 390 and 33.3 ms at
  1440; one run (memory) p95 33.3 and 50.0 ms; Run 100 on a plot already holding 500 dots p95 33.3 and 50.0 ms. The
  flagship's fertilizer drag: median 33.4 ms, p95 83.3 ms at 390 and 66.7 ms at 1440.
- Preview: `/mnt/user-data/outputs/stat-design-randomizer-v2/index.html`; shots in `shots/` (every sweep state at 360,
  390, 768, 1024 and 1440 light and dark; mid animation `mid-deal`, `mid-grow` at 390 and 1440).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is still to come.
- The plants grow to true scale, so the treatment effect (2.5 cm) is only a few pixels on a phone; the lesson is in
  the rows of dots, but a student looking only at the bench sees sunlight's effect, not the fertilizer's.
- The memory study at 360 px is crowded (24 people in about 340 px); readable, but the gauges are thin.
- Blocking shows its narrower row in the memory study only most of the time (253 of 300 seeds in a simulation), so
  that takeaway may not appear there; the plants scene always shows it.
- "Biased" can flag a completely randomized row by chance (about 1 in 300 batches of 100).
- The hand is a simple drawn hand; it reads as a hand at 1440 but is small on a phone.
- Rows of dots compress (overlap) once a design has several hundred runs; Start over clears them.
- Research: the Art of Stat apps were not reached; the Rossman/Chance applet itself was not operated (a lab page
  that uses it was read).
