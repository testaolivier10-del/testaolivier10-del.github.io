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
  shine and a stopper. On the flask's neck a small Q gauge: a dial with a log scale, K as a green notch, the Q needle
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
  x"), the needle reaches the notch, and the cause line says "meets K"; a moment later the takeaway: "At equilibrium Q =
  K: that is the x the ICE table solves for." Past it the knob still moves (Explore is free): Q passes K and the cause
  line says "would run back".
- **Cause line:** "x 0.100 M → Q 0.640 → below K 54.3 → still runs forward"; "x 0.275 M → Q 53.8 → meets K 54.3 → at
  equilibrium"; "x 0.300 M → Q 144 → above K 54.3 → would run back". Colours: x blue, Q vermillion, K green.
- **Two reactions** (quiet tabs, "H₂ + I₂" and "N₂O₄" on a phone): H₂ + I₂ ⇌ 2HI, K<sub>c</sub> = 54.3 at 430 °C, 14 of
  each to start (0.350 M), equilibrium at x = 0.275 M (exact 0.2753); N₂O₄ ⇌ 2NO₂, K<sub>p</sub> = 0.146 at 25 °C,
  22 N₂O₄ to start (0.550 atm), equilibrium at x = 0.125 atm (exact 0.1246). The knob stops one step before a
  reactant would run out (13 and 14 steps), where Q is far above K.
- **Cue:** "Drag x", beside the knob along the rail, once per device. Show me how: three callouts (the knob, the
  table, the gauge).
- **"?":** how the table follows the flask, Q and K for this reaction (only gases and dissolved species in K; no units
  on the exam; K changes only with temperature), why Q lands near K and not on it (whole molecules; the exact x), the
  5% rule (with this flask's x as a percent of the start), K<sub>c</sub> and K<sub>p</sub>, the colours, the
  constants and their sources, then the drill's rules.
- **Reduced motion:** a short cross fade to the new state and the numbers at once.

### What is on screen in Explore (counted at 1440, opening state)
Outside the picture: 2 tabs, the purpose line (9 words), "Show me how", the cause line (4 pills and "Start:"),
"Start over" once x has moved. On the picture: the flask (28 or 22 molecules at the start), the gauge with "Q" and
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

## Checks run
See the end of this file (filled in after the runs).

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no students.
- On a phone the stage is tall (the flask is kept the largest object): at 390 × 844 the E row sits near the bottom
  of the screen with the flask in view, so a student may scroll a little to see both.
- The middle of a reaction event (about 0.12 s, the atoms changing partners) still counts the reactants: the
  numbers change when the products have formed.
- Between the flask and the clipboard on wide screens there is plain wall.
- Khan Academy's exercises were not opened (the search did not return them).
