# Tools v2: AP® Biology Osmosis (brief and build notes)

Status file for the v2 rebuild of `bio/tools/osmosis.html` (the most opened tool on the site, rank 1 in
`docs/tools-v2-rollout.md`; the first tool after the flagship and the first on the kit through a second course
layer). Standard: `docs/tools-v2-standard.md`. Branch `claude/tools-v2-osmosis`. NOT merged: an independent review comes first (the owner no longer reviews each tool; decisions made for him
are in `docs/tools-v2-owner-log.md`).

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
- **Two big tabs:** 1 Plant cell, 2 Red blood cell (the animal cell; named for what is drawn since owner round 2). A tab never moves the solute, so the same
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
("Solute outside") and its two ends ("0", "1.0 M"), the solution's name (1 word), the
cell's state (1 or 2 words). Only while water is moving: the arrows and "water moving out" (owner round 1). Only while they are true: "wall pushes back" (a turgid plant cell), "wall" and
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

## Owner round 1: visuals (2026-11-17)
Owner on the preview: "remember visuals should be same standard as the last one" (the water pollution flagship).
The first build was a flat beaker of dots with empty grey either side. This round changes the drawing only: the
same interaction, the same controls, and fewer things on the settled picture (not more). No text was added.

### What changed
- **A scene across the whole stage.** The vessel of solution now runs edge to edge: glass walls and floor with
  thickness, a rolled rim, one long highlight, a surface with a meniscus, water that is lighter near the surface
  and deeper below, and a bench the vessel stands on, where the control lies. No grey bands on a desktop; the
  phone keeps the same scene (taller: about 106 vw).
- **The plant cell looks like a plant cell:** a wall with thickness (two edges and a light middle line), the
  membrane as its own dark line just inside it, shaded cytoplasm with seven chloroplasts and a nucleus with a
  nucleolus, and a large central vacuole (shaded blue, the same blue as water) that holds the cell sap's solute
  and swells and shrinks more than anything else. Turgid: the wall bows out, its corners round and the green
  arrows of its push show. Flaccid: the membrane only touches the wall. Plasmolyzed: the protoplast rounds up and
  pulls away, the chloroplasts crowd around a small vacuole, and the gap holds the outside solution.
- **The red blood cell looks like one:** a soft shaded disc, paler in the middle where it is thinnest. Swollen:
  it rounds up, the pale middle fills in and a highlight appears. Shriveled: smaller with a scalloped edge
  (crenation; rounded bumps, not spikes). Burst: a torn, empty membrane in a fading cloud of what it held.
- **Solute as particles:** larger shaded particles with the same density rule inside and outside, spread by a
  fixed farthest point pattern (the first pattern showed rows when crowded). None are drawn on the wall itself.
- **Water arrows only while water is moving:** for the half second the cell takes to settle after a change (and
  for as long as a drag keeps changing it), and in Watch it happen; drops run along them and they thin as the
  water potentials meet. The settled picture has no arrows and no water label (it is in the cause line). The
  arrows show the way water is really going from the cell as it was: lowering the solute from 0.80 to 0.50 M shows
  water coming back in, while the cause line still describes that solution against a fresh cell (see open points).
- **The cue** ("Drag the solute") no longer covers "Solute outside": the label sits lower on the bench (checked
  in the browser at every size).
- The cell is larger (it is sized by the height of the solution). The cell's state is not shown early on the way
  to a burst.
- Colours are the cause line's, everywhere: water blue (vacuole, arrows), solute amber, wall and its push green,
  red only for the burst label and pill. The chloroplasts are a leaf green, darker and yellower than the wall's
  green, so they are not read as "wall".

### Accuracy of the drawing (checked against OpenStax Biology for AP® Courses 5.2 and the CED)
Plasmolysis: the membrane and what it holds pull away from the wall and the wall keeps its shape; the gap fills
with the outside solution. Turgid: the membrane presses on the wall and the wall resists. Flaccid: no pressure,
not pulled away. Crenation: a shrunken cell with a scalloped edge. Lysis: the membrane tears and the contents
leave. The vacuole holding most of the water and solute is standard for a mature plant cell. Not to scale and
said nowhere as fact: the number of particles, the size of the swelling, the replay's timing.

### Checks run (this round)
`node --test scripts/test/apbio-*.test.mjs` (72 pass), `check-apbio-content --check`, `build-apbio --check`,
`check-weight --check`. Playwright as before at 390, 768 and 1440, light and dark, 261 assertions passing; new:
arrows are drawn mid drag and are gone once settled, and the cue does not overlap the control's label. Preview and
shots regenerated (a mid drag shot added).

### Honest comparison with the flagship, and open points
- It is now a drawn scene with material and depth, and the cell carries the detail. It is still simpler than the
  lake (one object in a vessel against a whole landscape); nothing more was added because every extra detail here
  could be misread.
- During a drag that reverses a change the arrows ("water moving in") and the cause line ("water moves out", for
  that solution against a fresh cell) point different ways. Both are true; the owner may want one of them changed.
- The red blood cell stands for "Animal cell" (no nucleus). A generic animal cell with a nucleus would match the
  tab's name better but not the model's numbers.
- With reduced motion there are no arrows at all outside the cause line.
- The particles do not move (no random motion); moving them would be true but is ambient motion on a busy picture.

## Owner round 2: every change is seen happening (2026-11-17)
Owner: "there is no animation for the burst. also i shouldnt have to ask for these things. this should just be the
standard for everything. also it will take way too long to critique every tool individually so just do all of
them". The standard gained rules 12 to 15 and a new process (no per tool owner review; an independent review that
can block; `docs/tools-v2-owner-log.md`). This tool was brought up to them.

### What changed
- **Every change of state is animated on a plain drag** (not only in Watch it happen), about 0.6 s:
  the red blood cell swells, strains for a moment (its membrane drawn thin), then tears: the tear widens, the cell
  empties and what it held spreads and thins (about 0.85 s more); it shrivels smoothly into a scalloped edge; the
  plant protoplast pulls away from the wall smoothly; the wall bows out as the cell goes turgid. The same burst
  animation plays in Watch it happen and in the Predict runs of Test yourself.
- **A burst cell does not heal.** Raising the solute again fades the torn cell out and puts a new cell in, marked
  "new cell" for about 2.6 s, which then swells or shrinks to where it settles in the new solution.
- **The cause line follows the picture.** When a change sends water back the other way (0.80 down to 0.50 M: the
  plasmolyzed cell takes some water back), the arrows say "water moving in" and the cause line tells that change:
  "Less solute than before → water potential outside rises → water moves back in → Still plasmolyzed". A change
  that goes the same way as a fresh cell's story (or a tab change, or the replay) shows the fresh cell story as
  before. Checked in the browser mid drag: the two never name opposite directions.
- **Reduced motion:** the result at once with a 240 ms cross fade, and a still mark of the direction (arrows
  without drops and "water moved out") that stays until the next change; "new cell" still shows.
- **The tab is "Red blood cell"** (was "Animal cell"), and the purpose line says "a red blood cell". The tab's id
  is unchanged; `#predict-rbc`, `#predict`, `#questions` and `#frq` work as before.
- **Phone:** the particle pattern is now made for the shape of the vessel it fills (the desktop pattern clumped at
  the left edge of a narrow one); the two tabs show their full names at 390 with room to spare (checked: no
  clipped text).

### Checks run (this round)
`node --test scripts/test/apbio-*.test.mjs` (72 pass), `check-apbio-content --check`, `build-apbio --check`,
`check-site`, `check-weight --check`. Playwright at 390, 768 and 1440, light and dark, 298 assertions passing;
new: the burst is caught mid animation (emptying cell and torn membrane both drawn) and then settles; "new cell"
after going back; on a reversed drag the arrows and the cause line agree, and the fresh cell story returns when the
drag goes back; reduced motion has the still mark and no moving drops; tab names are not clipped. Shots: burst
frames added (`07a` to `07d`, `08`).

### Open points
- The change story appears only when the water goes the other way from a fresh cell's; a student who drags back
  and forth sees the line switch between the two stories. Both are true at the moment they show.
- The strain moment is short (0.24 s) and subtle.
- Still no real phone, no screen reader pass; the independent review is next.

## Review round 1 (2026-11-18, `/home/claude/review-osmosis/REVIEW.md`: BLOCK, 6 must fix, 7 should fix)
All six must fix items and all seven should fix items were done. One suggestion was not taken, with the reason
(see "Cause line grammar").

### Must fix
1. **Back from a burst on a real drag.** The animation is now one loop that chases the setting, not a sequence
   restarted at every step. When the solute goes back up, the torn cell fades (0.48 s) while a new cell comes in,
   and "new cell" (2.6 s) and the fade survive every further step of the same drag; only a tab change clears
   them. Checked with a 10 step pointer drag: the fade is seen mid drag and the label never drops once shown.
2. **Isotonic settles on "no net water movement".** The change story ("Less solute than before → ... → water
   moves back in") now lives only while the arrows show it. When the cell has settled the line is the settled
   story for that solution, so 0.30 M always ends on "Same solute both sides → equal water potential → no net
   water movement → Flaccid" (or "Normal size"), and the picture's label no longer says both.
3. **No word runs ahead of the picture.** The state pill is read from the cell as drawn (its water now), not from
   where it will end, so it passes through "Flaccid" or "Normal size" on the way. While water is moving the cause
   line stops at the water pill ("... → water moves out"); the result pills are added when the cell is in that
   state. "Turgid" and "wall pushes back" appear once the wall is seen bowing (60 percent of the way), in a drag
   and in Watch it happen; "wall" and "membrane" appear with the gap. "Burst (lysed)" appears after the tear.
4. **The dashed "before" outline is gone** on both tabs. The tick on the track stays.
5. **A real burst.** Strain: the membrane turns thin and pale (solid, not dashed) and the cell overshoots 7
   percent in size (0.32 s). Tear: the membrane snaps back about 20 percent in the first tenth of a second, the gap
   opens wide at once, a plume and the particles leave through the gap and travel outward before thinning, and the
   cell empties. Settled: a solid, slack, torn membrane with curled ends, empty. About 1 s; the same in Watch it
   happen and in the Predict runs.
6. **Phone, Predict.** On Run it and check (and Replay), if the picture is not fully on screen it is scrolled to
   the middle first, the run plays, then the marks are scrolled back into view.

### Should fix
- **Red blood cell shapes.** The drawn area of the cell now follows its water. Normal: a biconcave disc with a
  plain pale, dished middle. Swollen at 0.20 M is 22 percent wider and the dish fills in.
- **Crowding.** Inside particles now fill the cell (or the plant's vacuole) and the drawn area follows the water,
  so inside crowding matches outside once settled, at every setting.
- **Plasmolysis.** The protoplast's area follows its mass (the 45 percent that is not water does not shrink) and
  the vacuole's follows the water: at 1.0 M the protoplast is 78 percent of its width, not a pellet, with a smaller
  vacuole, and it rests against the wall on one side instead of floating in the middle.
- **Cause line grammar.** Calmer: three pills while water moves, the full line when settled, and the "than
  before" wording only during a reversal. NOT taken: "do not swap the first two pills at all mid drag". Keeping
  "More solute outside → lower water potential outside" above arrows that point in would state a cause that
  points the other way from the picture (rule 14).
- **Replay** is now a plain button beside Next challenge, in the flow of the feedback (nothing sticky over text).
- **"24 hours"** in potato challenges (and the clock in hours), not "1440 minutes".
- **"before"** over the tick hides when the knob is within 58 px of it (the tick stays).
- Also: a deep link's specimen (`#predict-rbc`) is now always the first challenge (it could be skipped by the
  random draw before); with reduced motion the still direction mark now leaves after 2.6 s, so a settled picture
  never carries an arrow or a change story.

### Checks run
`node --test scripts/test/apbio-*.test.mjs` (72 pass), `check-apbio-content --check`, `build-apbio --check`,
`check-site`, `check-weight --check`. Playwright at 390, 768 and 1440, light and dark: 390 assertions passing. New,
one or more per must fix: (1) the 10 step drag back from a burst; (2) "no net water movement" and no "back" in the
line or the label after arriving at 0.30 M from either side on both tabs, and the change story while moving;
(3) every frame of a plant drag to 1.0 M, back to 0 M and of the replay is checked for a state word or label that
does not match the drawn cell, and for a result pill while arrows are drawn; (4) no `.os2-before` in any frame;
(5) strain, tear and emptying all seen, the torn membrane narrower than the strained cell, "Burst" never before
the tear, settled membrane solid; (6) the picture inside the viewport during a Predict run and the marks in view
after it; plus "24 hours", Replay not sticky. Preview and shots regenerated (burst frames `07a` to `07f`, `08`,
`08b`).

## Review recheck 1 (2026-11-18: still BLOCK on two items from the round 1 fixes; both fixed)
- **A. Result pills blinked before the tear, and for one frame at the start of a change.** Swelling, straining
  and the tear are now one moving span: while the setting means the cell must burst and it has not torn yet, water
  is "moving in" (arrows on, the line stops at the water pill), so "→ no wall to push back → Bursts (lysis)" is
  written once, at the tear. The loop is switched on before any word is written, so the first frame of a change
  never shows a result. Checked frame by frame (logged in the page from the same task that makes the change): a
  jump to 0 M, a real drag to 0 M, Watch it happen (burst and plant), a shrivel and a swell, at 1440 and 390, light
  and dark: "Bursts" only with a torn membrane drawn, no result pill in the first 200 ms, the line changes length
  once per change.
- **B. Released particles came to rest above the water.** Each particle's flight is shortened to fit the water
  around the cell at that stage size (with a small spread so they do not line up at the edge), and every drawn
  particle is clamped to the water as well. Checked at 390, 768 and 1440, light and dark: after a burst every
  particle's box is inside the solution's.
- **Should fix, reduced motion:** the cause line is whole at once (the result is already drawn), including the
  change story with its result ("... → water moves back in → Shriveled (crenated)").
- Checks: 72 unit tests, content, build, site and weight checks; Playwright 390 assertions (full pass) and 98 new
  frame by frame ones. Preview and shots regenerated.


## After review (from the Water potential review, 2026-11-18)
- "No net movement" during a run is a thin two headed arrow (a head at each end) in place of the dashed lines, the
  same mark as Water potential (`both()`, `.os2-eq`, `.os2-eq-h`). Nothing else changed. See
  `docs/tools-v2-water-potential-brief.md`, review round 1.
