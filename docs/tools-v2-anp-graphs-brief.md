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
reason is written under them in the colours of the parts.

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
- **Colours, one per idea, from the course's visual language** (`anp.css`): oxygenated blood vermillion
  (`--anp-o2`); the left ventricle and its curve the course ink; the aorta and its curve vermillion; the atrium
  slate (`--anp-lo`); Na+ orange (`--anp-aff`), K+ purple (`--anp-symp`); O2 vermillion; actin and myosin each
  their own; the purpose line and cause line pills use the same colours.

### What is on screen in Explore (to be counted in the browser)
Outside the picture: 5 tabs, the purpose line (about 8 words), "Show me how", the cause line (3 to 5 pills). On the
picture and graph: the drawn part with 3 to 6 labels, one number (the ventricle's volume, the lungs' volume, the
saturation, the inside voltage, the tension), the graph with its axes, curve names and the cursor.

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

## Accuracy
To be checked against the course notes (`anatomy-physiology/data/notes/`: cardiac-cycle, lung-volumes,
oxygen-transport, action-potential-basics, muscle-tension) and OpenStax A&P 2e. Contested points go to
`docs/anp-needs-author.md`.
