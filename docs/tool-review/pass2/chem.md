# AP Chemistry tools: second pass, simple and clear (2026-11-10)

Builder `chem (pass 2)`, branch `claude/tv2-chem`, brief `docs/tool-review/SIMPLIFY.md`. Every tool opened at
1280x800 and 390x844, Explore and Test yourself. Shots: `/home/claude/shots/pass2/chem/<tool>_land_d.png`,
`_land_p.png` (after) and `_before_d.png`.

How the counts were taken (desktop opening screen): labels = text labels on the picture (axis ticks and the
table's own cells not counted); numbers = live readouts on the picture (pills and gauge text); controls = control
groups in the dock and on the stage (a row of + / - steppers or a set of trend chips is one group; Explanation, the
mode tabs and the Setup / Details rows not counted); words = words outside buttons (title excluded); panels =
separate pictures on the stage.

| Tool | The idea | Best way to show it | Verdict | Before (labels / numbers / controls / words / panels) | After | What changed | Behind a tap now |
|---|---|---|---|---|---|---|---|
| ICE table drills | The I, C, E rows are the mixture before, during and at equilibrium; x moves Q to K | The live table beside the jar; drag x, the E row and the jar change, then Q slides toward K | SIMPLIFY | 9 / 4 (Q, K, "More x", bar values) / 2 / 12 / 4 (table, bars, jar, gauge) | 3 / 1 (Q) / 3 / 12 / 2 (table, jar; gauge once x moves) | Gauge appears under the jar once x moves; K pill and verdict pill gone (K is in the equation, the verdict is the caption); jar centred with the gauge right under it. Drill: the jar joins the table once the I row has a value; typing now updates it (the listener stayed in the dock after the table moved to the stage, so nothing updated until Check) | Bar chart (start against now), on the stage under the table, both modes |
| Equilibrium and kinetics | Q against K decides the shift; temperature, amounts and a catalyst act through rates | The vessel with its Q-K gauge and the concentration graph beside it; drag the temperature | SIMPLIFY | 6 / 5 (Q, K, T, "Q = K" pill, gauge line) / 7 / 13 / 3 | 5 / 2 (Q, K) / 5 (slider, amounts, catalyst, challenge; the graph's view switch) / 5 / 3 | The shift is said once (caption), not in a pill and under the gauge too; T only on its slider; graph switch on one line; Challenge me is secondary so the slider is the one primary control. Drill: the graph appears once the change is applied | Pause (Details, beside speed of time) |
| Particle diagrams | Atoms are conserved; what is left over and what formed | Before box and your After box; tap particles in | SIMPLIFY (small) | 4 / 1 ("Your box is empty") / 3 / 22 / 2 | 3 / 0 / 3 / 18 / 2 | The empty pill repeated the box's own "Empty: add particles"; pill row keeps its room so the boxes do not jump on the first tap | Nothing new |
| Periodic trends and PES | Trends across and down; PES peaks are subshells | One picture at a time: the heat-map table, or the spectrum with its shell picture | SIMPLIFY | 9 / 2 (value, trend pill) / 3 / 55 (incl. a 35-word note on the stage) / 3 (table, spectrum, shells) | 5 / 1 / 3 / 20 / 1 | Desktop works like the phone: Table / Na spectrum / Across and down tabs, each view fills the stage (table and spectrum larger). Caption names the trend ("larger down a group, smaller across a period") instead of repeating the value in the pill; no right pill; spectrum note is one line. Drill: the spectrum's caption repeated its axis and the problem, gone | Element value sentence and spectrum reading moved to Why (they were already there in part) |
| Q vs K | Compare Q with K to predict the direction | The jar of countable molecules over the Q-K gauge; tap + and - | SIMPLIFY (small) | 3 / 3 (Q, K, "Runs forward") / 3 / 16 / 2 | 3 / 2 / 3 / 9 / 2 | Direction no longer in a third pill; caption no longer repeats the Q value | Q value sentence starts Why |
| Titration curve reader | What is in the flask at each point of the curve | Flask, particle view and the curve moving together; drag the volume | SIMPLIFY | 4 / 3 (pH, region, indicator) / 5 / 11 / 2 | 4 / 2 (pH, indicator) / 3 / 7 / 2 | Region pill gone (it repeated the caption and called pH 6.59 in the buffer region "Near neutral", the review's accuracy flag); Start over appears after titrant is added; caption no longer falls back to the pH | +1 mL (Details, with the setup) |
| Units and sig figs | Units cancel to the one asked for; report the right sig figs | The fraction itself: tap each quantity to move it top, bottom, out; struck units cancel | SIMPLIFY | 3 / 0 / 2 (stage tiles; 6 dock cards x 3 buttons) / 30 / 1 | 3 / 0 / 2 (stage tiles; Answer one for credit) / 12 / 1 | The dock repeated the stage as 18 buttons; now the stage is the one action and the fraction is no longer hidden from screen readers (its buttons were focusable inside aria-hidden). Result said once (caption), Goal stays a pill | The per-quantity cards with names and notes ("Place each quantity by name", Details) |
| Buffer drills | A buffer soaks up added acid or base, so pH barely moves | Beaker beside the pH graph with pure water dashed; tap + OH- / + H3O+ | SIMPLIFY (small) | 8 / 3 (pH, HA count, A- count) / 3 / 11 / 2 | 8 / 1 (pH, with its buffered word) / 2 / 11 / 2 | Count pill gone; Start over appears after the first addition | Particle counts (Details, already there) |

Counts: LEAVE 0, SIMPLIFY 8, CHANGE 0. Particle diagrams, Q vs K and buffer were close to passing: one repeated
item each, fixed without touching the picture.

## Graphics quality
- The pictures are the real thing in every tool (molecules, flask and burette, beaker, periodic table, PES with
  shells, the unit fraction) and consistent with the course's particle colors. Nothing decorative was found.
- ICE on a phone: the jar is about 140 px tall under the table, so molecules are small but countable; the room for
  the gauge is kept from the start so the jar does not shrink when it appears.
- Equilibrium vessel: at the default volume about a third of the vessel is the grey space behind the piston. It is
  the volume control drawn honestly, so it stays; a tighter crop at the starting volume would help.
- Particle diagrams, Pick the picture: the four answer pictures sit small in the dock (about 110 px) while the
  Before box fills the stage; counting particles in them is harder than it should be. Not changed here (the drill
  shell decides the layout); worth a follow-up: put the choices on the stage beside Before.
- "I" atoms still read a little like "1" at small sizes (noted in the first pass).

## What I chose not to simplify, and why
- ICE: the table, the jar and the Q-K gauge stay on one screen; the gauge is revealed when x moves, right under the
  jar, so the cause (x) and the effect (Q toward K) are read together.
- Equilibrium: the concentration graph stays beside the vessel (the vessel and its graph are one thing); its three
  views (concentrations, collision energies, rates) stay as a switch on the graph.
- Buffer: the graph stays beside the beaker from the start; the dashed pure-water line is the punchline and
  appears with the first addition.
- Titration: the flask, particle view and curve stay together; the curve is the concept.
- Periodic trends: the table keeps its values on the cells (the "Show values" option turns them off); the table is
  the data.

## Shared changes
- `ApChemTools.drill` (Tool Studio caption): when an item's first step repeats the question, the caption says
  "Answer one step at a time." (or "Answer in the step, then Check.") instead of the question again. Every chem
  trainer's drill benefits; nothing else changes.
- `ApChemMath.trends` ion item: "a iodine atom" now "an iodine atom".

## Checks
`build-apchem.mjs --check`, `check-apchem-content.mjs`, `check-apchem-map.mjs`, all `apchem-*` tests,
`check-site.mjs`, `check-weight.mjs`: all clean (98 tests pass).
