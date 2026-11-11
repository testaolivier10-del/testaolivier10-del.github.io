# Anatomy & Physiology: second pass, simple and clear (2026-11-10)

Brief: `docs/tool-review/SIMPLIFY.md`. Branch `claude/tv2-anp`. Every tool opened at 1280x800 and 390x844 (Premium
on). Shots: `/home/claude/shots/pass2/anatomy-physiology/<tool>_land_d.png` and `_land_p.png` (after), `_before_d.png`
for changed tools, plus `pathways_figure_d.png`, `predict_figure_run_d.png` and `graphs_wiggers_d.png` for the
figure states the landing item does not show. Counts are for the opening screen on a desktop (labels on the picture /
live numbers on it / controls showing / words outside buttons / panels in the stage).

Verdicts: LEAVE 3, SIMPLIFY 5, CHANGE 0.

| Tool | The idea | Best way to show it | Verdict | Before | After | What changed | Behind a tap now |
|---|---|---|---|---|---|---|---|
| 3D anatomy | Find and name structures on a real body | The body itself, tap a part | LEAVE | 0 / 0 / 4 / 12 / 1 | same | Nothing | |
| Calculators | See what the formula means while the numbers change | The formula's picture reacting to a slider, the answer under it | SIMPLIFY | hematocrit 5 / 3 / 4 / about 45 / 1 | 5 / 3 / 4 / about 20 / 1 | Reference lines leave the stage; shorter first line ("Drag a slider and watch the picture change."); middle ear drawn as three bones (malleus on the eardrum, incus, stapes footplate at the oval window) instead of one rope; the sweat picture's white outlined label is plain ink | "Usual values" under Explanation (every result's reference, kept current) |
| Feedback loops | Every loop has the same seven parts, and the body answers | The variable on its gauge, the body part that answers, the ring lighting part by part | SIMPLIFY | about 24 / 1 / 4 / about 75 / 3 | about 14 / 1 / 4 / about 40 / 3 | On landing the ring shows the seven part names only; each part's words appear when the signal first reaches it and stay until Reset; the drawing's action labels ("arteriole narrows ...", "muscle shivers ...") appear when they happen; the caption under the drawing that repeated the effector is gone | Nothing new: the words arrive with the run |
| Graph reader | Read values and phases off physiology graphs | The graph, a cursor, the reading beside it | SIMPLIFY | Wiggers 14 / 5 / 4 / about 30 / 1 | Wiggers 14 / 0 / 4 / about 30 / 1 | At most two value pills on the graph; with three or more readings the dots stay and the values are read in the list under the chart (they were shown twice) | |
| Lab practical | Name labeled structures on real figures | The figure, tap a label | LEAVE | Explore: the figure's own labels | same | Nothing (see pushback) | |
| Pathway tracer | The order things happen and where | The figure, with a pin where each step happens | SIMPLIFY | cardiac cycle: figure plus a 2-column box map; 9 white cover boxes / 0 / 4+bank / about 30 / 2 | figure about two thirds of the stage, a slim numbered list; covers blend in / 0 / same / same / 2 | Beside a figure the step map is a numbered list (a dot with the pin's number and the step's words, no icons, no snake arrows), one column on a desktop, two on a phone; the figure gets the width. Covered labels take the colour of the drawing around them instead of white boxes, and their leader lines are painted out where they run over white | |
| Predict the change | Up, down or no change, and the chain of causes | The situation on the body, the change marked, each variable pinned; the chain drawn on it after Run | SIMPLIFY | circulation: figure plus a 2x2 dial grid with "Tap to call" four times / 0 / 4 / about 70 / 2 | figure about two thirds of the stage, a slim numbered dial list / 0 / 4 / about 55 / 2 | Dials beside a figure are a list (small dial, pin number, name); "Tap to call" is gone from every dial (the dock says it once); a dial's line appears with the call ("Your call: ↑") | |
| Word roots | Split a term into parts and read its meaning | The split word | LEAVE | 0 / 0 / 4 / 15 / 1 | same | Nothing | |

## Graphics quality

- Scene plates (pathways, Predict): the pins sit where the accuracy check put them; nothing was moved. The white cover
  boxes read as broken placeholders on coloured figures (the cardiac cycle wheel had nine); they now take the
  surrounding colour (`AnpLabFit.blendCovers`). Leader lines of hidden labels are erased with the lab practical's
  tracer where they cross white background; on figures where a line crosses an outline (the body silhouette of
  OpenStax 19.4) the rest of the line stays. A straight-line follow-through was tried and dropped: it also erased
  parts of outlines, which is worse than a stray line.
- Calculators: the 24 picture families from pass 1 are real drawings and stay. The one that read as a random shape,
  the middle ear's single "rope", is now three bones. Gut water balance still carries many numbers (each is a slider
  input of the budget); left as is.
- Loops: the 18 drawings stay; calmer because their words now arrive with the action.

## Pushback (not simplified, on purpose)

- Feedback loops keep three things on the stage (gauge, body drawing, ring): they are one cause-and-effect picture
  (the variable moves, the body answers, the ring shows which part is acting), and SIMPLIFY says not to split those.
  The seven part names stay on landing: they are the framework the tool exists to teach.
- Lab practical Explore shows every printed label of the figure: that is the mode (spec 8.1, labels shown); Study,
  Quiz and Timed hide them.
- Calculators keep the result card under the picture although the picture's headline also names the answer: the
  card carries the unit and the band ("within the usual range"), and it is the same place on all 89 calculators.
- Net filtration pressure and similar pictures keep four numbers: the four Starling pressures are the formula.

## Accuracy check (A&P science)

No pin, place, answer, explanation, item id or scoring rule changed. The only new anatomy is the ossicle drawing,
checked against OpenStax A&P 2e 14.1 (structures of the ear) (malleus handle attached to the tympanic membrane, malleus head to incus body,
incus long process to stapes head, stapes footplate in the oval window). No contested items.

## Checks

`node scripts/build-anp.mjs --check`, `node scripts/check-anp-content.mjs --check` (0 failing),
`node --test scripts/test/anp-*.test.mjs` (55 pass), `node scripts/check-site.mjs` (OK),
`node scripts/check-weight.mjs` (A&P shell within 57.5 KB: the cover colouring lives in `lab-fit.js`, loaded on first use).

## Not done

- 3D anatomy shows "Reset view" twice (stage corner and dock); left, since the tool passes and the brief says not to
  change a passing tool.
- Predict's text feed under the dials during Run and its "Show the chain" tree overlap; both kept (the feed is the
  run's narration, the tree is the reference).
- Pathway Spot the error with long pathways (15 steps on the airway figure) still crowds pins at the nose; the
  list under it carries the words.
