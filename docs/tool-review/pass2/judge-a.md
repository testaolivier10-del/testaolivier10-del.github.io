# Fresh-eyes judge a: NREMT, Anatomy & Physiology, AP® Biology, Organic Chemistry (2026-11-11)

How: own server on port 8861, Playwright at 1280x800 and 390x844, every tool opened cold (first-run coach showing),
then the first action and two more. Screens in /home/claude/scratch/judge-a/ (shots, act, tiles).

Counts are for the desktop opening screen: pics = main pictures or panels; lab = text labels on the picture;
num = live numbers; ctl = controls showing (measured; it includes mode tabs, the fullscreen button and tappable
parts of the picture, so it reads high; the shared header is left out); w = words outside buttons (measured,
title left out). Standard: 1 / 5-7 / 2 / about 4 / about 40.

Totals: NREMT 4 PASS, 4 TOUCH UP, 0 FAIL. A&P 2 PASS, 6 TOUCH UP, 0 FAIL. AP Bio 8 PASS, 10 TOUCH UP, 1 FAIL.
Ochem 6 PASS, 2 TOUCH UP, 1 FAIL.

## NREMT

| Tool | Verdict | pics/lab/num/ctl/w | Problem, and the fix |
|---|---|---|---|
| body-map | PASS | 1/0/0/8/21 | Still the bar: tap a part, it turns green, the dock names it. Only nit: the 6-item legend wraps to two lines on the phone; cut to 4 or put it behind a tap. |
| scenario-sim | TOUCH UP | 0/0/0/20/15 (menu) | Opens on 25 call cards plus 8 filter chips; in a call the monitor, the body, 4 assess tabs and a 50-word story all show at once, and tapping Mental status only adds one line under the body. Fix: show 6 calls with "All calls" behind a tap; in a call put the story first and reveal the monitor when the student checks vitals. |
| flowcharts | TOUCH UP | 1/0/0/17/110 | Opens on a whole flowchart (110 words) plus 10 protocol chips; Build it shows 19 empty slots and 19 cards at once. Fix: protocols in one select; Read reveals the chart a branch at a time; Build works one section (about 5 slots) at a time. |
| mnemonics | PASS | 1/0/0/6/85 | The card is the content and it is clean. Nit: "Show the answers" marks every letter "blank" in red, which reads as a fail when the student only peeked; say "not tried". |
| skillsheets | TOUCH UP | 0/0/0/12/19 (menu) | After picking a station, a large blank mannequin fills the stage and never changes (pure decoration); the checklist is good. Fix: light the body area the current phase is about (head for airway, leg for splinting) or drop the mannequin and give the checklist the stage. |
| sound-trainer | TOUCH UP | 1/11/0/28/22 | Chest picture is excellent, but 9 sound chips, Play, a waveform and Front/Back all show at once; on the phone the coach bubble covers the chest. Fix: show Normal plus 3 sounds, the rest under "Every sound"; place the coach below the picture on the phone. |
| formulary | PASS | 1/0/2/6/52 | One patient card, Withhold / Give, the verdict stamps the card. Calm and clear. |
| reference-cards | PASS | 1/5/0/11/20 | Age slider with growing figures, typed vital lands on the range bar in red. Nit: the newborn figure is a shapeless blob; draw a swaddled baby. |

## Anatomy & Physiology

| Tool | Verdict | pics/lab/num/ctl/w | Problem, and the fix |
|---|---|---|---|
| anatomy-3d | PASS | 1/0/0/10/15 | Real 3D body, click names the part on the model and in the dock. |
| calculators | TOUCH UP | 1/6/3/12/41 | Tube and gauges respond well, but the flow is said twice (on the tube and again in a "Flow" card under it), and 3 sliders plus 3 number boxes show. Fix: drop the bottom Flow card; keep the number boxes behind the slider (tap the value to type). |
| feedback-loops | TOUCH UP | 2/14/1/10/18 | Six empty loop boxes on landing read as a blank form; the skin scene's blood vessel is a red horseshoe that reads as a magnet. Fix: show the stimulus box filled and the rest dimmed; redraw the vessel as a labeled tube that visibly narrows or widens with the response. |
| graphs | TOUCH UP | 1/16/2/9/33 | The graph is the concept and the slider works, but after "pH falls to 7.1" the "7.4: 40" label sits under the "39.8 nmol/L" bubble, and the marker line runs through "normal blood pH". Fix: move point labels clear of the readout bubble and the band label off the marker line. |
| lab-practical | TOUCH UP | 1/30/0/34/29 | Explore shows both heart views with about 30 labels at once; on the phone the labels are about 6 px and unreadable. Fix: one view per screen (anterior, then posterior), zoomed to fit; on the phone open at 150% or label on tap. |
| pathways | TOUCH UP | 2/8/0/17/61 | The OpenStax figure lighting up step by step is right, but it sits small in the top left corner with tiny labels and the rest of the stage is empty; on the phone the step chips are below the fold. Fix: make the figure fill the stage width and put the 6 slots under it. |
| predict | TOUCH UP | 1/10/0/13/120 | Gauges that swing to "your call" are good, but gauge names are cut off ("Pressure in the lower esophageal sphincte..."), the scenario text is 40+ words, and scenarios without a figure leave half the stage empty. Fix: two lines for gauge names, shorter scenario lead, larger gauges when there is no figure. |
| word-roots | PASS | 1/2/0/10/25 | Word split into colored parts, pick meanings in order. Nit: the coach bubble covers the question line ("What does the...") on both sizes. |

## AP Biology

| Tool | Verdict | pics/lab/num/ctl/w | Problem, and the fix |
|---|---|---|---|
| cell-cycle-checkpoints | TOUCH UP | 1/9/2/21/38 | The ring of cells is a strong picture and "p53 lost" visibly opens the G1 gate, but 2 sliders and 4 mutation checkboxes show on landing; the coach covers the ring on the phone. Fix: put the 4 mutations behind "Mutations" and open it after the first checkpoint tap. |
| chi-square | PASS | 2/20/2/12/23 | Bars and the chi-square curve read as one thing; drag a bar and the statistic walks along the curve. |
| confidence-intervals | TOUCH UP | 1/11/1/16/29 | Bars and error bars teach overlap well, but "10.93 / overlap / 8.07" stack into one cramped block and on the phone "overlap" runs into "9.43". Fix: put "overlap" inside the shaded band, values beside the caps only. |
| descriptive-stats | TOUCH UP | 1/13/3/15/38 | Dots and the SD band work, but -1 SD, +1 SD, ±1 SE, median and mean are piled into one small area over the dots; unreadable on the phone. Fix: label only mean and median on the plot, SD and SE on tap or in the legend. |
| design-drills | TOUCH UP | 1/11/0/12/164 | The flasks picture is good, but a 70-word paragraph sits under it, the dock adds a long question, and the coach bubble covers the first answer and question. Fix: put the paragraph behind "Read the setup"; keep the coach off the answer list. |
| energy-flow | TOUCH UP | 1/10/2/14/24 | The ladder of levels is right, but the pink heat squiggles read as worms, the coach covers "GPP 20,000", and on the phone the labels are about 6 px. Fix: draw heat as wavy arrows leaving each box; on the phone stack the ladder full width. |
| enzyme-activity | TOUCH UP | 1/0/2/19/31 | Animated enzymes and substrates are clear, but 3 sliders and an inhibitor select show at once. Fix: substrate slider only; temperature, pH and inhibitor under "Change conditions". |
| graph-builder | TOUCH UP | 2/14/0/10/91 | Opens on a blank grid plus a data table plus 90 words; close to "a blank chart with a line of text". On the phone the table comes first and the grid is off screen. Fix: draw the data as faint ghost points on the grid from the start so the empty chart already shows what will be built. |
| hardy-weinberg-drift | TOUCH UP | 1/1/2/14/34 | The jar of alleles is a great picture, but it opens at "Generation 100 of 100" with a summary of 10 populations the student never saw run. Fix: open at generation 0 and reveal the summary after Draw generations. |
| hardy-weinberg | PASS | 2/14/1/9/30 | Punnett square sized by p and q next to 100 people; drag the corner and both move together. |
| meiosis-nondisjunction | PASS | 1/7/1/10/22 | Clean cell, Next step, chromosomes clearly colored by parent. Nit: on the phone the coach floats over empty stage while its button is below the fold. |
| operons | TOUCH UP | 1/15/1/14/44 | The operon drawing is real and the sugars drive it, but about 15 labels show, and on the phone the gene row wraps so the repressor, CAP and RNA pol float far from the operator. Fix: dim lacI, lacY, lacA labels; keep the regulatory region on one row on the phone. |
| osmosis | PASS | 1/10/2/15/39 | Potato cell, red blood cell and bag all react to the slider with a mass readout. Phone text in the picture is small but legible at zoom. |
| population-growth | TOUCH UP | 2/8/1/16/39 | The green creatures in the field are unidentifiable sprites, "Year 25 · 1 drawn = 2" is overprinted by them, and after switching to Exponential the dock says N = 1,001,554 while the graph still shows the old logistic curve under 600. Fix: draw a named organism; keep the year label clear; redraw or clear the graph when the model changes. |
| rates | PASS | 1/16/1/16/16 | Tap two points, the slope triangle appears; tangent with its rise over run. Percent change bar is clear. |
| signal-transduction-amplification | FAIL | 1/7/1/18/18 | The cascade rows are unlabeled dot strips (names only on tap), so a student cannot tell what each row is; the pill says "Glucose out 1,540/s" while the box in the picture says "Glucose released per second 1,050,000" (one is the read time, one the current time), and before Play the receptors read 0 while glucose already flows. Fix: name each row at its left (receptor, G protein, adenylyl cyclase, cAMP, PKA, kinase, phosphorylase); make the pill and the box show the same moment. |
| simpson-diversity | PASS | 1/5/1/13/28 | Quadrat with real leaf icons, tap to plant, the D bar fills next to it. |
| tree-reading | PASS | 1/13/0/24/19 | Clean tree with drawn animals; picking two names marks the MRCA node. |
| water-potential | PASS | 1/12/2/12/45 | Cell and beaker placed on a ψ scale with the water arrow between them; NaCl doubles the drop as it should. |

## Organic Chemistry

| Tool | Verdict | pics/lab/num/ctl/w | Problem, and the fix |
|---|---|---|---|
| acid-base | PASS | 2/5/0/10/28 | Two structures, two big buttons; the answer shows each conjugate base with δ- spread. Nit: the coach covers "Pick your own pair". |
| arrow-pusher | PASS | 1/11/1/31/29 | Tap a lone pair, then a target; a bad arrow gets "C ends up with 10 electrons". Clear. |
| conformations | TOUCH UP | 2/15/2/19/28 | Newman plus energy curve read together and the slider drives both, but 9 molecule chips, 3 jump chips and 2 mode rows show at once. Fix: molecules in one select; keep the slider and the 3 jumps. |
| reaction-predictor | TOUCH UP | 1/7/0/30/40 | The predict-first flow is excellent (tiles, then the product with curved arrows), but 8 substrate chips, 12 reagent chips and two strength bars all show. Fix: two pickers (substrate, reagent) that open on tap; show the strength bars only after a reagent is picked. |
| reagent-roadmap | FAIL | 2/52/0/42/72 | Opens on a map of about 20 group tiles with crossing arrows plus a molecule strip below (52 labels); on the phone the map is tiny and the strip is clipped. The Reagent tab is a wall of text cards plus about 20 chips. Fix: show only the route (start, steps, target as molecules with reagents on the arrows) as the hero; the full map behind "Whole map"; Reagent tab shows one reaction card at a time. |
| resonance | PASS | 2/16/1/29/41 | Draw an arrow, the new form appears in "Forms found"; wrong arrows get a reason. Nit: the dashed tap rings around every atom (also in arrow-pusher, spectroscopy, synthesis) read as clutter; show them only on hover or focus. |
| spectroscopy | PASS | 2/16/1/21/17 | Molecule above its IR spectrum; tap a peak, the band and the bond light up. |
| synthesis | PASS | 2/8/1/10/25 | Start, ?, target, four reagent tiles; a correct pick fills the step and names the reaction. |
| viewer-3d | PASS | 1/5/1/19/32 | Real 3D ball model with the bond angle. Nit: lone pairs on water are two tiny grey dots; draw them as lobes so "bent" has a reason on screen. |

## Across the four courses
- The first-run coach bubble often covers the thing it points to or the question beside it (design-drills,
  energy-flow, word-roots, acid-base, sound-trainer phone, cell-cycle phone). Rule: never over the target or the
  prompt; below the fold on a phone, wait.
- Phone pictures in the two-panel Bio tools (energy-flow, osmosis, operons, signal) shrink their labels to about
  6 px. Give the picture full width on the phone.
- Several tools show results before the student acts (hardy-weinberg-drift at generation 100, osmosis mid-run,
  signal glucose already flowing). Open at time zero.
- Nothing looked scientifically wrong apart from the signal-transduction number mismatch and the stale
  population graph above (both are display bugs, not wrong science).
