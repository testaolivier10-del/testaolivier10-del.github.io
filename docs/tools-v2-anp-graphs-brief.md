# Tools v2: A&P Graphs (brief and build notes)

Status file for the v2 rebuild of `anatomy-physiology/tools/graphs.html` (Graph reader; rank 3 in
`docs/tools-v2-rollout.md`, Premium, group G "graph explorers"; the first A&P tool on the v2 kit). Standard:
`docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-anp-graphs`, from
`claude/tools-v2-all`. NOT merged: an independent review comes first. Decisions made for the owner are also one line
each in `docs/tools-v2-owner-log.md`.

## What the old tool teaches (from `origin/main`)
76 physiology graphs (data: `anatomy-physiology/data/tools/graphs.json`, 410 questions) behind a grouped picker.
Each graph had two modes: Explore (a cursor along x, from a slider in the side dock or a drag on the chart, reading
every curve, and "What if" chips taken from the graph's shift questions that morph the curve) and Quiz (value, phase
and shift questions; 12 shift questions can also be answered by dragging the curve). Every first answer is recorded
as `graphs:<graph>:<question>` (XP, mastery, review) and fires `anp-graph-answer`. The picture was a bare chart:
nothing showed the body part the curve describes (rollout: "rework"; 496 words on stage, 11 controls at landing).

## The one main idea
**A physiology graph is a record of something a body part is doing: move along the curve and watch the part do it.**
Each Explore screen holds one graph and the drawn part it describes, one idea each (spec 8.5's named graphs):

| Tab | Graph (data id) | What the picture is | The idea of the screen |
|---|---|---|---|
| 1 Heart | `wiggers` (pressure panel) | the left heart cut open: left atrium, mitral valve, left ventricle, aortic valve, aorta | Pressure differences open and shut the valves; the ventricle's size is its volume |
| 2 Lungs | `spirogram` | the chest: rib cage, two lungs with their airways, the diaphragm | The trace is the air in the lungs; the residual air never leaves |
| 3 Red blood cell | `oxygen-hemoglobin` | a capillary with one red blood cell cut open: hemoglobin with four sites each, O2 in the plasma, and the tissue around it (lungs, resting tissue, working muscle) | Where PO2 is high hemoglobin loads; on the steep middle it gives O2 up |
| 4 Axon | `neuron-action-potential` | a patch of axon membrane: Na+ and K+ channels, ions on both sides, the charge across it | Which channels are open makes each phase of the action potential |
| 5 Sarcomere | `mt-length-tension` | one sarcomere between two Z discs: thin and thick filaments, the myosin heads that can reach actin | Overlap sets how many cross-bridges form, so it sets the tension |

The curves are the reviewed numbers from `graphs.json` (read through `AnpGraphMath.curveFn`, the same monotone curve
the old chart drew); nothing on the graph is new data.

## Research (rule 10)
Seen means the page was opened and read here; "text only" means only a description could be read.

| Source | How it works | What we took |
|---|---|---|
| Desmos movable points (help article and the 2013 announcement, seen) | A point (a, f(a)) is dragged and stays on its curve; everything tied to it redraws while it moves | The main control: grab anywhere on the graph and the point rides the curve; the picture is "everything tied to it" |
| GeoGebra gliders (described in the same Desmos article's terms; the GeoGebra pages were not opened) | A point restricted to a path | Same idea; nothing more |
| PhET Neuron (teacher guide, seen; the sim itself was not run here) | An axon you stimulate; ions, channels, + and − charges whose size follows the potential; a live potential chart | Charges drawn on both faces whose size follows the voltage; ions and channels named; their noted difficulty (students needed help to read what the chart measures) is why the picture names "Inside" and "Outside" |
| HHMI BioInteractive Oxygen circulation simulator (seen) | Ten settings, Calculate, PO2 graphs by body location, a saturation number | The body location ties PO2 to a place (lungs, tissue); ours shows the place around the cell instead of a separate graph, and needs no Calculate |
| An interactive 3D heart (mccullough.com heart-simulation-v2, seen) | A rotating heart, three named phases, heart rate slider | Nothing tied to a pressure curve; confirms the gap |
| Wiggers diagram explainers (search results: gcus, carepatron, Wikipedia mirrors; text only) | Static stacked curves with valve events | The four valve events as the moments the picture changes |

What ours does better than all of them: the curve and the body part are one screen, one drag moves both, and the
reason is written under them in the colors of the parts.

## The design
- **Main control (every tab):** drag along the graph (`K.scrub` on the plot: the whole plot is the grab area, a knob
  above it, arrow keys, Home, End). A dot rides each curve at the cursor. The picture follows at once.
- **Time is the recording's time.** On the Heart, Lungs and Axon tabs the cursor is a moment in the recording;
  dragging forward plays the moment forward and dragging back rewinds it. Moving things (blood through a valve, air
  in the airway, ions through a channel) are placed by how much has crossed by that moment, so they move only while
  the cursor moves and go backward with it. Nothing moves on its own (rule 13: motion only while something is
  happening).
- **Every change of state is animated:** a valve swings, a lung grows, a channel opens, a site binds or lets go, a
  sarcomere slides; a jump (a tap far along the graph) tweens the picture there (about 0.35 s). Reduced motion:
  the new state with a short cross fade.
- **Cause line** (`K.cause`) under the picture, from the picture as drawn (never from where it is going).
- **Labels** on the picture, 1 to 3 words, in the colour of the part and of its curve.
- **Colors, one per idea** (`graphs-explore.css`, from the course's visual language in `anp.css` where it has
  one): the aorta and its curve vermillion (`--anp-o2`), the left ventricle and its curve blue (a separate hue, so
  the two curves that run together in ejection stay apart in light and dark), the left atrium slate (`--anp-lo`),
  valves green (`--anp-para`), air blue, O2 vermillion, Na+ orange (`--anp-aff`), K+ purple, cross-bridges and the
  tension curve orange, actin blue, myosin violet. The part, its label, its curve and its pill share the color.

### What is on screen in Explore (counted in the browser, Heart at landing, 1440 x 900)
Outside the picture: 5 tabs, the purpose line (8 words), "Show me how", the cause line (4 pills): 36 words with the
tab names, 7 controls (5 tabs, "Show me how", the graph cursor). No side panel. On the picture: 5 labels (Left
atrium, Left ventricle, Aorta, Mitral valve, Aortic valve) and 1 number (the ventricle's volume). On the graph: the
axis titles, ticks, 3 curve names, the shaded phase, the cursor knob and a dot on each curve. Other screens: Lungs 2
to 4 labels ("Air in" or "Air out" only while air moves, "Residual air" only near the bottom) and the volume; Red
blood cell 4 labels (the place only where the PO2 belongs to one) and the saturation; Axon 4 labels and the inside
voltage; Sarcomere 4 labels and the tension. First visit only: the cue "Drag the graph" beside the knob.

### Explore against Test yourself
- **Explore:** the five screens above. Nothing graded or asked.
- **Test yourself:** all 76 graphs and every question, unchanged (ids, scoring, recording, the drag answer for
  shift questions, Keep going strip, finished card). One graph at a time with the grouped graph dropdown. Each graph
  keeps "Read it" (its old cursor and What if view) beside "Questions", because 71 graphs have no drawn screen yet.
- Deep links: `#<graph>` and `#<graph>/<question>` open Test yourself there; `#all` the list; `#<graph>/explore`
  opens the Explore tab for the five drawn graphs and "Read it" for the others; `?topic=` and `?chapter=` open the
  matching Explore tab when one exists, else Test yourself as before. New: `#explore/<tab>`.

### What moved (nothing dropped silently)
| From the old tool | Where it is now |
|---|---|
| Explore (cursor and What if) for the 5 drawn graphs | Explore, on the drawn screen (the What ifs are those graphs' shift questions, in Test yourself) |
| Explore for the other 71 graphs | Test yourself, "Read it" beside each graph's questions |
| Quiz (all questions) | Test yourself, "Questions", unchanged |
| The Wiggers ECG, volume and sounds panels | Test yourself (the full Wiggers graph); Explore draws the volume as the ventricle's size |
| "About this graph" intro | "?" for the Explore tab, "About this graph" in Test yourself |
| Phases and regions toggle | Test yourself, Details, unchanged |

## Decisions made for the owner
(also in `docs/tools-v2-owner-log.md`)
1. Explore shows five curated graphs, each with a drawn body part; the other 71 are in Test yourself (rollout open
   question 5, answered as the lead proposed).
2. The old per graph Explore (cursor and What if) stays in Test yourself as "Read it" for every graph.
3. No "Watch it happen" or Play: the student drags time; nothing plays by itself (one control never moves another).
4. The Heart screen shows the pressure panel only; the volume is the ventricle's drawn size and its number.
5. The left ventricle's curve and label are blue (it runs on top of the aorta's curve in ejection).
6. Hemoglobin is drawn filling one molecule at a time, to show cooperative binding (said in "?").

## Accuracy
Every word on the pictures and the cause lines was checked against the course notes that teach it
(`anatomy-physiology/data/notes/`: cardiac-cycle, lung-volumes, oxygen-transport, action-potential-basics,
muscle-tension), which are the course's reviewed text. The curves are the reviewed data; what the pictures add:
- Heart: the valve moments are the graph's own dashed lines (mitral shuts 0.205 s, aortic opens 0.25, shuts 0.52,
  mitral opens 0.60); the cavity's area follows the volume curve and the wall thickens as it empties; the atrium
  squeezes in the graph's atrial systole band and refills while the mitral valve is shut; isovolumetric phases are
  "both valves shut".
- Lungs: quiet breath in by the diaphragm, quiet breath out by recoil, the deep breath in by the diaphragm and rib
  muscles, the forced breath out by recoil and the belly muscles, the expiratory reserve by the belly muscles, the
  residual volume held by small airways squeezed shut (notes' wording).
- Red blood cell: lungs about 100 mm Hg, resting tissue about 40, working muscle about 20 (notes); dissolved O2 drawn
  in proportion to PO2; bound sites = the curve's saturation of 24 sites.
- Axon: Na+ channels open fast at threshold, inactivate near the peak, reset once repolarized; K+ channels open
  slowly and close late (hyperpolarization); + and − across the membrane sized by the voltage and swapped above 0 mV.
  A bug found in the check (Na+ channels drawn open again after their reset) was fixed.
- Sarcomere: frog numbers from the graph's intro; heads attach where their own thin filament reaches; the drawn
  number of cross-bridges equals the graph's tension; short side "thin filaments crowd the middle" then "thick
  filaments hit the Z discs" (notes' wording).
What each picture leaves out is said in "?". Five points for a person are in `docs/anp-needs-author.md`, "Graphs
tool, tools v2 drawn screens".

## What was built
- `anatomy-physiology/assets/tools/graphs-explore.js` and `.css` (new): the five screens and their engine (tabs,
  purpose line, the picture, the graph drawn in screen pixels with `K.scrub` on it, `K.cue`, `K.cause`, `K.tour`,
  the "?" reference). The picture is a pure function of the x it shows, which chases the cursor (tau 90 ms).
- **The A&P adapter:** `AnpToolKit.kit2(s, { stage, ref, onShow })` in `anatomy-physiology/assets/tools/tool-kit.js`
  (same pattern as `ApBioTools.studioKit2` and `OchemStudioKit.kit2`): turns the kit on, Explore and Test yourself,
  the stage in Explore only, the reference behind "?" in Explore. The item dropdown (`stdPicker`) is Test yourself
  only on a kit2 tool. Other A&P tools never call it and are unchanged.
- `anatomy-physiology/assets/tools/graphs.js`: with the kit on (`V2`), every part it puts in the studio is Test
  yourself only; its Explore / Quiz switch becomes "Read it" / "Questions" in the side panel; the reading cursor shows
  in Read it only; links route through `routeV2`; Test yourself opens on the graph of the Explore screen unless a link
  chose one. Without the kit it behaves as before.
- Build opt in: `"kit2": true`, `extraScripts`, `extraCss` on the tool in `anatomy-physiology/data/pages.json`;
  `scripts/build-anp.mjs` adds `tool-kit2.css` and `tool-kit2.js` for a kit2 tool. Only `tools/graphs.html` changed.
- `scripts/check-weight.mjs`: A&P shell 60 to 61 KB (measured 60.3).
- Sweep test: `scripts/tools-v2/anp-graphs-sweep.mjs`.

## Checks run (2026-11-18)
`node --test scripts/test/anp-*.test.mjs` (55 pass), `check-anp-content --check` (0 failing), `build-anp --check`,
`check-site` (OK), `check-weight --check` (A&P within 61), `build-apcalc --check`, `build-apmacro --check`,
frame v2 checked with a local copy of `check-tool-use`'s list (the file itself is the collecting branch's).
Sweep: 44 states (8 to 9 per screen) at 10 widths, light and dark: 880 states, clean (no clipping, no overlapping
labels on the picture or the graph, the cue covers no label, the picture is the largest thing on the stage, the cause
line at most two rows on phones with one height, no sideways scroll, no console errors). Contact sheets:
`/mnt/user-data/outputs/anp-graphs-v2/sweep/`.
Playwright at 390, 768 and 1440, light and dark, 167 checks pass: opens on Explore and Heart with the cue and no side
panel; a real mouse drag (desktop) and a real touch drag at the scrolled end of the page (phone, tablet) change the
picture and the cause line mid drag; the cue leaves; Home and the arrow keys; a jump tweens through the moments
between (frame caught mid tween); each screen's words at a landmark; a tab keeps each screen's own setting; Test
yourself opens on the heart graph, a right answer marked right and a wrong one wrong; Read it shows the cursor and
Questions hides it; back to Explore keeps the moment; reduced motion is at once with a cross fade; deep links
(`#oxygen-hemoglobin/explore`, `#explore/axon`, `#frank-starling`, `#ecg/explore` to Read it, `#all`,
`?topic=lung-volumes`, `?chapter=urinary`); the real locked state shows the Premium card as before; no console
errors. Shots: `/mnt/user-data/outputs/anp-graphs-v2/shots/`; preview: `/mnt/user-data/outputs/anp-graphs-v2/index.html`.

## Not done, and what I am not happy with
- No real phone, no screen reader pass, no real students; the independent review is next.
- The heart is a schematic left heart, not a frontal section (see needs-author); the drawings are good but simpler
  than the flagship's lake.
- On a phone the five tab names are tight at 360 px (12.5 px type, no numbers).
- Test yourself is the old layout inside the new frame (its own graph, picker, Read it / Questions); it was not
  redesigned.
- The A&P shell weight budget had to rise by 1 KB.
