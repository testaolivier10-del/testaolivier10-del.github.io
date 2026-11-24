# Tools v2: AP® Chemistry ICE tables (brief and build notes)

Status file for the v2 rebuild of `chem/tools/ice-table-drills.html` (free; rollout row 72, group P, wave 12). Plan:
`docs/tools-v2-plans/chem-ice-table-drills.md`. Standard: `docs/tools-v2-standard.md`. Branch
`claude/tools-v2-chem-ice-tables`, cut from `claude/tools-v2-all`. NOT merged: an independent review comes first;
decisions made for the owner are also one line each in `docs/tools-v2-owner-log.md`.

## The one idea (rule 11)
**A reaction runs forward by x until Q reaches K; the ICE table is that change written down.** One screen, one main
control (x). It is not the Q vs K screen (which way a reaction goes) or the Equilibrium and kinetics screen (what a
stress does): here the idea is how far.

## Research (rule 10): what exists and what we took
Seen means the page itself was opened and read; text only means only a description could be read.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET Reversible Reactions (text only: the sim page's description and learning goals) | Particles in a box react back and forth; a concentration against time graph shows when the counts stop changing | Counting particles, equilibrium as counts that stop changing | No ICE table; an analogy reaction; best with a teacher | Real molecules in the flask, counted, beside the numbers |
| dmccreary ICE table interactive solver (seen) | Pick a preset (HI, PCl₅, N₂O₄, COCl₂), type initial amounts and K, Solve or Next step; rows coloured; the 5% verdict and the quadratic after Solve | Row by row; the 5% check named | A calculator: no picture of the mixture, nothing to move; the answer is computed for you | Row colours become one colour per idea (x blue, Q vermillion, K green); the 5% rule in "?" and Test yourself |
| Physics Classroom Concept Builder, Equilibrium ICE Tables (text only: its page and teacher notes) | 48 questions in 12 groups at three levels; Help Me per question | Graded steps, help on request | Questions only, no model to play with | Already ours: Test yourself (the drill: a row at a time, feedback on the exact slip) |
| UW–Madison Netorial, ICE Tables: Equilibrium (seen, text pages) | Five steps; x introduced in the C row "if needed"; asks the units and the size of the answer first | The order of the steps | Text only | "?" walks the same steps on this flask |
| ChemCollective virtual labs (text only: the activity list; the equilibrium labs are cobalt chloride and DNA binding) | A virtual stockroom; concentrations read from a solution info panel | Concentrations of a real flask | No ICE reaction among its equilibrium labs | The numbers are read off a real flask: here, by counting its molecules |
| Khan Academy ICE table exercises (searched; the search returned the pages above, so not opened) | Known from the plan: one row at a time with forgiving input | | | The drill already does this |

What ours does better: nothing to type in Explore; x is the thing you move, the flask shows every step of it as
molecules reacting (an H₂ and an I₂ meet, swap partners and leave as two HI), and the table, Q and the gauge are read
off the molecules that are drawn, so the ICE table is literally the flask written down.

## The design (Explore)
- **Scene:** the course's lab wall and bench (the same as Units and significant figures). A sealed round bottom flask
  of gas stands in a cork ring on the bench: the molecules drawn with their atoms (H white, I purple, N blue, O red;
  the course's atom colours), the gas tinted by the coloured species drawn (violet I₂, brown NO₂), the glass, its
  shine and a stopper. Beside the bulb, on a short glass tube, a small Q gauge: a dial with a log scale, K as a green notch, the Q needle
  in vermillion. Under the flask on the bench a rail with one tick per step of x and the knob. On the wall to the
  right a clipboard (on a phone: a notebook page lying on the bench under the flask) with the equation and K, the ICE
  table (column heads carry a small drawing of each molecule as the key; rows I, C, E with their names; C as "−x" with
  its value, E as "0.350 − x" with its value), "1 molecule = 0.025 M" and the last line Q = [HI]² / ([H₂][I₂]) = 53.8.
- **Main control:** the x knob on the rail (drag, tap the rail, arrow keys, Page Up/Down, Home, End). Each step of x
  is one reaction event, drawn where it happens: the reactants of one step meet, their atoms swap partners with a
  short glow, and the products leave to the reactants' places (N₂O₄ splits into two NO₂ that move apart; back the
  other way, two NO₂ meet and join). A fast drag starts the events a little apart, so the table counts up one step at
  a time. Dragging back runs the reverse events.
- **Numbers from the picture:** every number (the E and C rows, Q, the knob's tag, the cause line, the needle, the gas
  colour) is computed from the molecules drawn at that frame; a molecule counts once it has formed. The knob may lead
  the picture during a fast drag; its tag says the drawn x and catches up.
- **Equilibrium:** at the step nearest K the E row turns green and its name reads "equilibrium" (otherwise "at this
  x"), the needle reaches the notch, and the cause line says "≈ K"; a moment later the takeaway: "At equilibrium Q =
  K: that is the x the ICE table solves for." Past it the knob still moves (Explore is free): Q passes K and the cause
  line says "would run back".
- **Cause line:** "x 0.100 M → Q 0.640 → below K 54.3 → still runs forward"; "x 0.275 M → Q 53.8 → ≈ K 54.3 → at
  equilibrium"; "x 0.300 M → Q 144 → above K 54.3 → would run back". Colours: x blue, Q vermillion, K green.
- **Two reactions** (quiet tabs, "H₂ + I₂" and "N₂O₄" on a phone): H₂ + I₂ ⇌ 2HI, K<sub>c</sub> = 54.3 at 430 °C, 14 of
  each to start (0.350 M), equilibrium at x = 0.275 M (exact 0.2753); N₂O₄ ⇌ 2NO₂, K<sub>p</sub> = 0.146 at 25 °C,
  15 N₂O₄ to start (0.375 atm), equilibrium at x = 0.100 atm (exact 0.1002, Q 0.145). The knob stops at 13 steps for H₂ +
  I₂ (one before a reactant runs out) and at 10 for N₂O₄ (of a possible 15, so the flask stays countable), where Q
  is far above K.
- **Cue:** "Drag x", beside the knob along the rail, once per device. Show me how: three callouts (the knob, the
  table, the gauge).
- **"?":** how the table follows the flask, Q and K for this reaction (only gases and dissolved species in K; no units
  on the exam; K changes only with temperature), why Q lands near K and not on it (whole molecules; the exact x), the
  5% rule (with this flask's x as a percent of the start), K<sub>c</sub> and K<sub>p</sub>, the colours, the
  constants and their sources, then the drill's rules.
- **Reduced motion:** a short cross fade to the new state and the numbers at once.

### What is on screen in Explore (counted at 1440, opening state)
Outside the picture: 2 tabs, the purpose line (9 words), "Show me how", the cause line (4 pills and "Start:"),
"Start over" once x has moved. On the picture: the flask (28 or 15 molecules at the start), the gauge with "Q" and
"K", the rail with "x", the knob with its tag, the clipboard (title, K line, unit, 3 column heads with drawings, 3 row
letters with names, 9 cells, the scale line, the Q line). No side panel.

## Explore against Test yourself
- Explore: free play, nothing graded, no goal.
- Test yourself: the drill, unchanged in content, grading and records (`T.drill`): Find K, Small K and the 5% check,
  Perfect square, over all six reactions; the typed ICE table on the stage with its live jar and bar chart; ids
  `ice-table-drills:<context>:<step>`; `?seed=` and `#quiz` open it; "Kind of problem" is its one dropdown.

### What moved (nothing dropped)
| From the old tool | Where it is now |
|---|---|
| x slider in the panel | Explore: the knob on the rail under the flask |
| Reaction picker (6 reactions) | Explore: two tabs (HI, N₂O₄); all six in Test yourself |
| ICE table on the stage | Explore: the clipboard, filled from the drawn molecules |
| ApChemBeaker jar with the Q-to-K gauge | Explore: the drawn flask and the Q gauge on its neck; the jar stays in Test yourself |
| Bar chart (initial and at this x) | Test yourself (unchanged there); in Explore the molecules themselves |
| Solve for x | Test yourself (solving is the drill's job) |
| New numbers | Test yourself (every problem is new numbers) |
| "At this x" / "Equilibrium" row label | Kept: the E row's name changes at the equilibrium step |
| The 5% rule, small K, perfect square | Test yourself types; the 5% rule also in "?" |
| `?seed=`, `#quiz`, drill ids | Unchanged |
| The old mode memory (opening on the quiz if last used) | Not kept: every visit lands on Explore (the v2 rule); links still open Test yourself |

## Accuracy
- Data: `explore` in `chem/data/tools/ice-table-drills.json`. Validator (`scripts/lib/apchem-tool-checks/
  ice-table-drills.mjs`, run by `check-apchem-content`): the equations balance atom by atom, Kc goes with M and Kp
  with atm, no species runs out over the knob's range, Q crosses K exactly once, the nearest step is within 2% of K,
  the exact x (bisection) rounds to that step at three significant figures, and the gauge's range holds K and Q from
  the first step to the last.
- Constants: HI K<sub>c</sub> = 54.3 at 430 °C (`docs/apchem-needs-author.md` ice-hi-k, resolved); N₂O₄ K<sub>p</sub>
  = 0.146 at 25 °C from NBS ΔG°f, the Equilibrium and kinetics tool's value. Open for a person:
  `docs/apchem-needs-author.md` ice-explore-n2o4 (textbook K<sub>c</sub> 4.63 × 10⁻³ against the NBS data; the
  whole molecule steps).
- Colours: I₂ vapour violet, NO₂ brown, H₂, HI and N₂O₄ colourless.
- No OpenStax; no released questions.

## What was built
- `chem/assets/tools/ice-table-drills.js` (rewritten Explore; the drill and its view unchanged) and `.css` (rewritten;
  the old sheet styled only the old explore arrangement).
- The chemistry adapter: `placed: true` on a Test yourself part (`studioKit2` in `chem-tools.js`): a part that put
  itself in the frame (here the drill, through `T.drill`'s own studio arrangement) is only shown and hidden, and its
  task head stays the drill's. Units and significant figures is unchanged.
- Build opt in: `"kit2": true` on the tool in `chem/data/pages.json`; the page now loads the kit.
- `scripts/check-tool-use.mjs` is NOT changed. That this tool reports frame v2 was checked with a local copy (see
  Checks).
- Sweep, frames and perf: `scripts/tools-v2/chem-ice-tables-sweep.mjs` (`--frames`, `--perf`).

## Checks run (2026-11-23)
- `node --test scripts/test/apchem-*.test.mjs` (99 pass), `check-apchem-content --check` (the validator's new
  Explore checks included), `build-apchem --check`, `check-site`, `check-weight --check` (all budgets within range).
  No shared file changed (`chem-tools.js` is the course's own), so `build-apcalc` and `build-apmacro` were not needed.
- `check-tool-use` with a local, uncommitted copy of its list plus this tool (the committed file is untouched):
  tool-open, tool-touch(explore), tool-mode(quiz), tool-use; nothing sent under automation.
- Sweep, one width per process at 360, 390, 430, 600, 768, 820, 1024, 1280, 1440 and 1920, light and dark: 200
  states, 3720 checks, 0 failures (clipping, 4 px clearance between every text on the picture, no text under 11 px,
  the flask the largest object, atoms inside the flask, every number against the drawn molecules, the needle, the
  gas color, "at equilibrium" and the takeaway only at the equilibrium step, the phone cause line at most two rows and
  one height, no sideways scroll, no console errors, the first visit cue, Test yourself).
- Frames (`--frames`) at 390 and 1440: a fast pointer drag from 0 past equilibrium, a reversal mid change (End, then
  back to 2 while it reacts), arrow keys, End then Home, the N₂O₄ flask dragged across equilibrium and back, leaving
  for Test yourself mid change, reduced motion: about 1000 to 1160 frames per width, 0 problems (on every frame the E and C
  rows, Q, the knob's tag and the cause line equal what the drawn molecules give; every whole molecule is drawn
  bonded; the drawn step never leaves the range of the change; nothing left moving).
- Perf (`--perf`, CPU x4, mouse drag end to end and back, the flagship in the same run): 390 px: HI median 16.7 ms,
  p95 16.8 ms; N₂O₄ median 16.7, p95 33.3; flagship median 33.3, p95 66.6. 1440 px: HI median 16.7, p95 33.3; N₂O₄
  median 16.7, p95 33.3; flagship median 33.3, p95 83.3. The molecules, the gas color and the needle are drawn on a
  canvas over the flask only (the molecules at rest cached), so a moving molecule changes no element; the first
  build (SVG elements per atom) missed p95 at 1440 because every frame restyled the page.
- Behaviour (Playwright): a real CDP touch drag on the knob at 390 (x moves, the flask reacts, the cue goes), End,
  Home, Page Up, Start over, "?" text, About once, Show me how opens the tour, Test yourself shows the drill and a
  wrong I row gets its feedback, back to Explore clean, `?seed=` opens the same problem, no page errors.
- Preview: `node scripts/tool-preview.mjs chem/tools/ice-table-drills.html /mnt/user-data/outputs/chem-ice-tables-v2/index.html`;
  shots in `/mnt/user-data/outputs/chem-ice-tables-v2/shots/` (every sweep state at 10 widths, light and dark, the
  first visit, the takeaway, Test yourself; `*-mid-*` frames during a forward event, a reverse event, the N₂O₄
  split and the join, at 1440 light, 768 dark and 390 light).

## Review round 1 (2026-11-23): BLOCK, fixed
Review: `/home/claude/review-chem-ice/REVIEW.md`. `claude/tools-v2-all` merged in first.

Must fix:
1. **The scene fits the screen.** The picture is sized from the height the stage has left (`availH`): on a desktop the
   card's own height under the tabs and above the cause line, on a phone the screen's. Phone: a short neck and
   stopper, the gauge beside the bulb (up and to the right, on a glass tube), the knob's tag under the knob, and the
   table's rows and fonts from measured text (`bookMetrics`), so with the scene at the top of a 390 × 844 screen the
   knob, the E row, the Q line and the cause line are all in view. At 1024 × 768 and 1280 × 800 the card no longer
   scrolls inside. The sweep checks this at each width's own screen height (`fitProbe`).
2. **No bare wall on wide screens.** The same height-driven layout: the flask fills the left half of the stage and
   the clipboard, scaled with it (fonts × k, within 85% of the flask's area), the right half.
3. **The N₂O₄ flask can be counted.** Molecules sit in cells as wide as the widest molecule and as tall as the
   tallest (a tilt of at most 0.1 rad), with the largest atom's diameter between cells, so at rest no two atoms of
   different molecules are closer than one atom's width. The N₂O₄ start is now 15 molecules (0.375 atm, still landing
   within 1% of K at x = 0.100, exact 0.1002) and the knob stops at 10 steps (25 molecules at most, was 36). The
   sweep checks the clearance of every pair at every state.
4. **The products count from the middle of the swap** (t = 0.475 of the 0.82 s event, when the atoms are halfway
   to their new partners); they move to their places from t = 0.55. The frames check now measures each product
   atom's drawn progress from its old place to its new bond and fails when the picture shows the products more than
   58% formed but uncounted, or counted at under 42% (checked to fail with the old timing: 120 failures).
5. **Row names on phones**, beside each letter at 11 px ("equilibrium" at the equilibrium step).
6. **"equilibrium" clears the margin line**: the line is placed 8 px right of the longest measured row name; the
   sweep checks every text 4 px clear of it.

Should fix, all done: "≈ K" in place of "meets K"; the 0.146 source line says "pressures in atm"; the knob's tag sits
under the knob, off the cork ring (checked); each tour step scrolls its target into view once (on a phone the C and
E rows), and step 2 points at the C and E rows; tour step 1 says "Each step is one reaction event"; the mode memory
line in the owner log and the knob's caps corrected above; Test yourself's jar draws no letters on its atoms (this
page's sheet hides them; its key names each species); the sweep gains the clearance, line, tag and screen-fit checks.

Checks: sweep at 360, 390, 1024 (×768), 1280 (×800) and 1440, light and dark (22 states and 382 checks each, 0
failures), frames at 390 and 1440 (about 1160 frames each, 0 problems), AP Chem tests, content check, build `--check`,
`check-site`.

## Recheck 1 (2026-11-24): BLOCK on one item, fixed
Review: `/home/claude/review-chem-ice/REVIEW.md` ("Recheck 1"). `claude/tools-v2-all` merged in first.
- **M7, tablets in portrait (768 and 820 × 1024):** under 860 px the flask now stands over the notebook page (the
  phone arrangement), centred, sized from the screen height left under the tabs, so the flask is the largest object,
  the clipboard stays inside the stage and the card is filled (knob, table and cause line in view). The sweep now
  clips the clipboard's frame too and checks the flask against the page at every width.
- **S9:** molecules about 9% larger on phones (s 0.67 to 0.73 at 390): a tilt of at most 0.06 rad and one spare slot
  instead of two, still a full atom apart (checked).
- **S10:** a short phone (360 × 740) keeps the flask its full width-driven size; the table goes under the fold. The
  sweep's screen fit check asks only for the knob on a phone under 800 px tall.
- **S11:** one flask size for both reactions (a phone sizes it from the width; a tablet from the taller of the two
  pages); the sweep checks it.
- **S12:** the two stale lines below fixed. At 1920 the row letter and its name are one label (one text, the name a
  tspan).

Checks (integration round): sweep at all ten widths, one per process, light and dark, each at a real screen height
(844 up to 430, 960 at 600, 1024 at 768 and 820, 768 at 1024, 800 at 1280, 900 at 1440, 1080 at 1920), plus 360 × 740:
11 runs of 22 states and 382 checks, 0 failures; frames at 390 and 1440 (about 1000 to 1140 frames each, 0 problems);
AP Chem tests (99 pass), content check, build `--check`, `check-site`.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no students.
- On a phone the molecules are smallish so that they never touch: at 390 an I atom is about 17 px across and an H atom
  about 9 px, N and O about 11 px.
- Khan Academy's exercises were not opened (the search did not return them).
