# Tools v2: AP® Biology Osmosis (brief and build notes)

Status file for the v2 rebuild of `bio/tools/osmosis.html` (the most opened tool on the site, rank 1 in
`docs/tools-v2-rollout.md`; the first tool after the flagship and the first on the kit through a second course
layer). Standard: `docs/tools-v2-standard.md`. Branch `claude/tools-v2-osmosis`. NOT merged: the owner looks at the
first tool of each batch first.

## The one main idea
**Water moves toward the lower water potential (toward more solute), and what that does to a cell depends on whether
it has a wall.** CED topic 2.7 (2025 framework; `docs/apbio-ced-map.json`): hypotonic, hypertonic, isotonic; water
moves by osmosis from high water potential (low solute) to low water potential (high solute); plant cells build
turgor against the wall, animal cells with no wall swell and lyse; plasmolysis in a hypertonic solution.

## Research (rule 10): what exists and what we took
What could be opened and read is marked "seen"; pages that served only a summary are marked "summary only", and
nothing is claimed about their screens beyond it.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| PhET, Membrane Transport (2025; summary and model notes seen) | Add solutes to either side of a membrane, add channels and pumps, watch particles | Controls on the picture, instant response, steady state shown as "still moving, no net flow" | No water and no osmosis at all; no cell that changes shape | The PhET rules already in the standard (grab the picture first, 1 to 3 word labels, one cue, extremes respond). Confirms the gap: the best simulator maker has no osmosis screen |
| Meir et al. 2005, OsmoBeaker (*Cell Biology Education*; article seen) | Bouncing molecules in two compartments, an IV fluid and red blood cell scenario | Students improved on "direction" and "amount versus concentration" | Gains were weak on equilibrium and on pressure; "presenting a simulation is not enough", students needed prompts | The eight listed misconceptions drove the picture: dots show concentration (crowding), not amount; equilibrium says "no net movement", never "stops"; the wall's push is drawn and named; a cause line gives the reason every time |
| Amoeba Sisters, Osmosis and water potential (transcript seen) | U tube, then red blood cells in an IV, then plant cells and turgor, then ψ = ψs + ψp | "Hypo rhymes with low", the three words are comparisons, "water still moves at equilibrium", the wall stops bursting | A video: nothing to do | The order of the story (solute first, then direction, then the cell's fate, then the wall); the three words attached to the solution; the wording of the equal case |
| dmccreary osmosis simulator (page seen) | Two concentration sliders, temperature, an animal or plant toggle, an "Equilibrate" button, a rail of ψ numbers | Plant against animal on one model; a turgor gauge | Five controls and a numbers rail beside the picture; nothing moves until a button; equal concentrations and equal ψ are not told apart | Plant against animal as the comparison, but as two big tabs that keep the solution; no numbers on the picture |
| Biology Simulations, Diffusion and Osmosis (page seen) | A split beaker, three solute sizes, temperature, a concentration graph | Molecule size and the membrane | No cell, no tonicity words, no fate of the cell | Nothing for this idea (it is the diffusion idea) |
| McGraw Hill "How Osmosis Works" (page seen) | A narrated animation and five quiz questions | Short | Watching only; its own quiz defines osmosis by "water concentration" | Not copied. Our cause line uses water potential and solute, the CED's words |
| LabXchange (Introduction to Diffusion and Osmosis; Water Potential and Osmosis; Osmosis Data Analysis lab; summaries only), Concord Consortium (summary only), BioMan (summary only), Pearson and HHMI BioInteractive (no osmosis interactive found that could be read) | Scroll stories, a virtual potato lab with a spreadsheet | (not inspected) | (not inspected) | The potato core data lab is the classic AP lab: ours stays as the questions and the mini FRQ in Test yourself |

What ours can do better than all of them: one control on the picture, the cell's fate that instant, plant and
animal in the same solution one tap apart, and the reason written in the idea's colours under the picture.

## The design
- **Main control:** "Solute outside", one knob on the picture under the beaker, 0 to 1.0 M sucrose in steps of
  0.05 M (drag, tap the track, arrow keys, Home, End). Its value rides on the knob ("0.60 M").
- **Instant response:** the picture shows where the cell settles in that solution, with no Play and no clock
  (`ApBioMath.osmosis.equilibrium`, a 220 ms tween between results; none with reduced motion).
- **Two big tabs:** 1 Plant cell, 2 Animal cell (a red blood cell). A tab never moves the solute, so the same
  solution can be compared on both cells (rule 8).
- **Opens** on the plant cell in the isotonic solution (0.30 M): calm, and a drag either way does something.
- **Cue:** "Drag the solute" at the knob, once per device, gone at the first touch. "Show me how" (three
  pointers) opens only from its link and from "?".
- **Cause line** (`K.cause`, new in the kit), live as the knob moves:
  "More solute outside → lower water potential outside → water moves out → Plasmolyzed";
  "No solute outside → higher water potential outside → water moves in → wall pushes back → Turgid";
  "... → water moves in → no wall to push back → Bursts (lysis)";
  "Same solute both sides → equal water potential → no net water movement → Flaccid".
- **Compare:** the setting before the change stays as a dashed outline of the cell and a "before" mark on the
  track (a mark, never a moved handle). Cleared by a tab change.
- **Watch it happen** (small, secondary): replays the change from a fresh cell; the arrows thin to nothing as the
  water potentials meet; it ends on a one sentence takeaway. It never moves the knob.
- **One colour per idea, everywhere:** water blue (arrows, "water moved out", the water potential pills), solute
  amber (dots, the knob's label and value, the solution's name), the wall and its push green, red for a burst cell
  only. The red blood cell is red because it is one.
- **Extremes:** 0 M bursts the animal cell (a torn membrane in a cloud of its contents) and makes the plant cell
  turgid with the wall pushing back; 1.0 M crowds the beaker with dots, shrinks the plant's membrane to a small
  round body inside the wall and leaves the red blood cell small and spiky.

### What is on screen in Explore (counted; Playwright, opening state)
Outside the picture: 2 tabs, the purpose line (9 words), "Show me how", the cause line (4 pills at the opening,
5 or 6 at an extreme), "Watch it happen". That is 4 controls and about 27 words at the opening (36 at the wordiest
setting). No side panel, no graph, no readout cards, no numbers except the one on the knob.
On the picture: the beaker with the cell, the solute dots, 1 control (the knob with its value), the control's name
("Solute outside") and its two ends ("0", "1.0 M"), the solution's name (1 word), the water's label (3 words), the
cell's state (1 or 2 words). Only while they are true: "wall pushes back" (a turgid plant cell), "wall" and
"membrane" (once they separate), "before" (after a change), the cue (first visit).

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself:** one dropdown on the stage, "What to practice":
  1. **Predict, then run** (the old Predict mode, unchanged in content and grading): a seeded challenge with the
     potato core, the red blood cell or the dialysis bag, sucrose or NaCl, on the same picture. Two parts
     (direction at the start, state at the end), then the timed run plays (`trajectory`), each part is marked and
     explained, "Next challenge". Recorded as `osmosis:predict-<system>:dir|state` as before. Nothing on the
     picture gives the answer away before the run (no solution name, no arrows, "Predict first").
  2. **Potato core questions** (the old Questions mode, unchanged): the stimulus table, the 5 questions and the
     mini FRQ, one at a time.
- `#predict`, `#predict-rbc`, `#questions` and `#frq` still open the same place.

### What moved
| From today's tool | Where it is now |
|---|---|
| "Predict, then run" mode | Test yourself, first part |
| "Questions" mode (5 questions, mini FRQ) | Test yourself, second part |
| The six readouts (ψ outside, ψ inside at the start and end, net water, mass change, state) | "?" ("This setting"), live; direction and state are also on the picture |
| The two worked equations (ψs = −iCRT) | "?" |
| The mass change graph and its sampled table | "?" ("The lab graph"), for the cell and setting shown |
| The ψ ladder beside the beaker (out, in, Δψ) | Removed from the picture (it is the Water potential tool's screen, see below); the two values are in "?" and the comparison is the second pill of the cause line |
| "Calculate it: ψ practice" link | "?" ("Practice the calculation: water potential") |
| "How this model works", the intro | About (the ⋯ menu), with one new line on what Explore shows |
| The "why" paragraph | Explore: the cause line and the takeaway. Test yourself: unchanged, after each challenge |
| Play from the start, the clock | Explore: "Watch it happen" (no clock). Test yourself: the run and its clock, as before |

### What the new Explore cannot do that the old one could (questions for the owner; nothing dropped silently)
1. **Dialysis bag in free play.** Old Explore had a third specimen, a dialysis bag, with a second slider for the
   sucrose inside it. It is now only in Test yourself (Predict challenges). Reason: two concentration sliders on
   one picture is the Water potential tool's screen, and the owner wants the two tools more specific. Bring it back
   as a third tab ("Model cell")?
2. **NaCl (i = 2) in free play.** Old Explore let the beaker hold NaCl. Explore is sucrose only, so "more solute"
   is the same as "higher molarity"; NaCl is still in the Predict challenges and in the Water potential tool. OK?
3. **Temperature slider.** Removed from Explore (fixed at 22 °C for the plant cell and 37 °C for the red blood
   cell; it changes ψ by a few percent and nothing you can see). It stays in the Water potential tool. OK?
4. **Time slider.** Old Explore could stop the clock at any minute (a potato core after 30 minutes, not yet at
   equilibrium). Explore now shows the settled result only; the timed runs are in Test yourself. OK?
5. **Trials with scatter.** "Run one trial", "Run a concentration series", "Clear runs" and the table of your own
   runs (each with random measurement error) are gone. The model's curve and its sampled table are in "?". The
   potato data table is still the stimulus of the questions. Is collecting your own noisy data worth a tool of its
   own (a "potato core lab" in the Graph group), or is it not needed?
6. **Tap the graph to set the concentration.** Gone with the graph's move to "?".
7. **The potato core as the Explore plant cell.** Explore's plant cell is now an idealized cell that is exactly
   flaccid in the isotonic solution (as textbooks draw it). The potato core, which starts slightly turgid, is in
   Test yourself. See `docs/apbio-needs-author.md`, "osmosis-explore-plant-cell".
8. **One optional teaser** (flagship round 3, rule 10: "Can you ...?") was left out to keep the screen quiet. Add
   one per tab ("Find the weakest solution that keeps the red blood cell whole")?

## Overlap with the Water potential tool (not touched)
`bio/tools/water-potential.html` (rank 5) stays as it is. Its screen: a plant cell and a beaker SIDE BY SIDE on a
shared ψ scale in bar, four sliders (cell concentration, turgor pressure, beaker concentration and solute,
temperature) and ψs = −iCRT worked with the numbers; then calculation practice. It teaches the calculation.
Osmosis now teaches the picture: a cell IN the solution, what happens to it, and the words for it. To keep the two
apart, the ψ scale and every bar value left the Osmosis picture (the old ladder was the same scale); Osmosis has no
numbers on the stage but the molarity on the knob. What still overlaps: both show a plant cell shrinking in a
strong solution. When Water potential is rebuilt (wave 1), its Explore should keep the scale and the numbers and
should not grow a red blood cell or tonicity words.

## Accuracy
- Model: `ApBioMath.osmosis.equilibrium` (new, `bio/assets/tools/bio-tool-math.js`): the water content at which ψ
  inside equals ψ outside, by bisection; the same ψs = −(n/W)RT, ψp = ε(W/W0 − 1) and lysis rule as `simulate`.
  Unit test: it agrees with a very long `simulate` for the three systems, and ψ is equal at the end.
- Explore's cells (`bio/data/tools/osmosis.json`, `explore`): a plant cell with cell sap 0.30 osmol/L, just full
  (W0 = 1, so ψp = 0 in the isotonic solution), wall stiffness 60 bar; the existing red blood cell (0.30 osmol/L,
  lysis at 1.55 times its size). Both are isotonic with 0.30 M sucrose, so "isotonic" (equal solute) and "no net
  movement" (equal ψ) are the same stop, and the three words never disagree with the arrows. The validator
  (`scripts/lib/apbio-tool-checks/osmosis.mjs`) checks all of this through the model.
- Results on the 0.05 M grid: plant 0 to 0.25 M turgid (ψp 6.6 to 1.1 bar), 0.30 M flaccid, 0.35 M and up
  plasmolyzed; red blood cell 0 to 0.15 M burst, 0.20 and 0.25 M swollen, 0.30 M normal, 0.35 M and up shriveled.
- Checked against the CED and OpenStax Biology for AP® Courses 5.2: direction (high to low water potential),
  hypotonic gives turgor in plants and lysis in animal cells, hypertonic gives plasmolysis and shriveling
  (crenation), isotonic gives a flaccid plant cell and a normal animal cell, the wall is what stops a plant cell
  bursting, water still crosses both ways at equilibrium.
- The picture keeps to it: solute dots have the same density rule inside and outside (equal crowding at 0.30 M);
  the gap of a plasmolyzed cell holds the outside solution (dots, since the wall lets it through); "water moved
  out" is past tense once settled, and "no net movement" at equilibrium; the replay's timing is illustrative (no
  clock is shown in Explore).
- Open points are in `docs/apbio-needs-author.md` (osmosis-explore-plant-cell, osmosis-tonicity-words,
  osmosis-arrows-settled).

## What was built
- `bio/assets/tools/osmosis.js` (rewritten), `bio/assets/tools/osmosis.css` (new, loaded by this page only),
  `bio/data/tools/osmosis.json` (`explore` block, intro and one assumption line; questions, FRQ, stimulus and the
  three systems unchanged).
- **The biology adapter:** `ApBioTools.studioKit2` in `bio/assets/tools/bio-tools.js`. A tool passes
  `{ studio: { kit2: { stage, ref, parts, questionsLabel, onShow } } }` to `T.mount`; the adapter turns the kit on
  (`K.on`), sets the two modes, puts the stage full width in Explore, the reference behind "?", the Test yourself
  parts in the side panel with one dropdown, and reuses `studioQuestions` for the stimulus questions and the FRQ.
  Other biology tools do not reach it (they have no `kit2`); their pages and scripts are unchanged.
- **Build opt in, as APES:** `"kit2": true` on the tool in `bio/data/pages.json`; `scripts/build-apbio.mjs` then
  adds `tool-kit2.css`, `tool-kit2.js` and the tool's own stylesheet. Only `bio/tools/osmosis.html` changed.
- **Kit (shared, not forked):** `K.head` (purpose line and "Show me how") and `K.cause` (the cause line and the
  takeaway), lifted out of the flagship page as the rollout plan asks; styles in `tool-kit2.css`. The flagship
  still uses its own copies (not refactored here; its page is unchanged).
- `osmosis.js` loads the kit itself if a cached copy of the old page (without the kit's tags) runs the new script.

## Checks run (2026-11-17)
`node --test scripts/test/apbio-*.test.mjs` (72 pass, one new: equilibrium against a long simulate),
`check-apbio-content --check` (the osmosis validator now checks the Explore cells through the model),
`build-apbio --check`, `check-site`, `check-weight --check`, `build-apenv --check` and its tests (186 pass),
`build-apmacro --check`, `build-apcalc --check`.
Playwright (Chromium, service workers blocked, local server; the tool is free, so nothing was unlocked) at 390x844,
768x1024 and 1440x900, light and dark, 243 assertions passing: opens at 0.30 M with the cue and no side panel; a
real pointer drag changes the picture and the cause line mid drag; the cue leaves; the "before" mark; a tab change
does not move the solute (checked both ways); Home, End and arrow keys (burst at 0 M, swollen at 0.20, normal at
0.30); Watch it happen does not move the solute and ends on the takeaway; reduced motion (instant, straight to the
takeaway); Show me how and Esc; "?" (numbers and graph); Test yourself: nothing gives the answer away, both parts
needed, the run, the marks, Next challenge, the dropdown to the potato core questions and back; back to Explore
with the setting kept; `#predict-rbc`, `#questions`, `#frq`; no sideways scroll; no console errors. Water
potential, Enzyme activity, Simpson diversity and Chi-square load as before and do not load the kit; the flagship
page loads with the changed kit and no errors. Preview: `node scripts/tool-preview.mjs bio/tools/osmosis.html
<out>` opens from disk with no errors.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students.
- The flagship was not moved onto `K.head` and `K.cause` (two copies of the cause line code exist until it is).
- The old figure's styles (`.os-fig` and friends) are still in `bio-tools.css`, unused by this page.
- On a desktop the beaker is centred with empty space left and right of it.
- The settled picture shows arrows for water that has already moved (labelled in the past tense). An owner or
  teacher may prefer no arrows once settled.
