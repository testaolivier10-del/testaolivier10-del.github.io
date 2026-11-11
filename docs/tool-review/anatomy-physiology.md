# Anatomy & Physiology: tool purpose review (2026-11-10)

Opened in Chromium at 1280x800 and 390x844, Premium on. Screenshots: `/home/claude/shots/review/anatomy-physiology/<tool>/`.
Catalogs are large (89 calculators, 26 loops, 76 graphs, 208 pathways, 100+ predict scenarios), so they were sampled
across systems. Every mode of every tool was opened.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| 3D anatomy | Find, name and place structures on a real body | LEAVE | Quiz zooms to the highlighted organ. Small: going from Quiz to Timed leaves the camera zoomed into the pelvis. |
| Worked-example calculators | See what the formula means while the numbers change | REDESIGN in part | 70 of 89 calculators have no picture: a lone result box in an empty stage. The 19 with pictures (tube, capillary balance, ventricle, pressure wave) are right and stay. |
| Feedback loop builder | Every loop: stimulus, sensor, control center, effector, response | FIX | The same seven boxes for all 26 loops; nothing shows the body doing it. |
| Graph reader | Read values and phases off physiology graphs | FIX | Most graphs are right (the graph is the concept). The Wiggers diagram is squeezed into a third of the width; the hematocrit "tubes" are bar outlines. |
| Virtual lab practical | Name labeled structures on real figures | FIX | Small: the figure uses about 40% of the desktop stage, so the labels are about 6 px. |
| Pathway tracer | The order things happen and where | REDESIGN | 203 of 208 pathways are numbered empty boxes. Missing step shows an empty stage. |
| Predict the change | Up, down or no change, and the chain of causes | REDESIGN | A row of identical dials. "Run it and watch the body" has no body. The chain is text boxes with arrows. |
| Word root builder | Split a term into parts and read its meaning | LEAVE | The split word is the picture. |

## Notes

**Calculators (REDESIGN in part).** Pictures exist only for `flow`, `radius`, `organ-flow`, `tpr` (tube), `sv-ef`,
`cardiac-output` (pump), `pulse-pressure`, `map` (wave), `nfp`, `ur-glomerular-nfp` (balance) and 9 `stack` bars
(`data/calc-pictures.json`). The others show a single result card at the top of an empty stage. Opened examples:
"Will the neuron fire?", "Burn area by the rule of nines", "Hematocrit from a spun tube", "Glasgow Coma Scale total".
What each family should draw, so the student sees the formula happen:
- Summing EPSPs and IPSPs, highest firing rate, conduction time and reflex delay: a membrane trace with bumps adding toward a threshold line; an axon with the impulse moving along it.
- Rule of nines and palm method: the burns body from NREMT's body map (`nremt/assets/burns.js`), painted from the inputs.
- Hematocrit, plasma volume, RBC production: a spun tube with plasma, buffy coat and red cells at the typed heights.
- GCS: the three columns from NREMT's reference cards.
- Snellen, decibels, middle-ear gain, nerve regrowth: the eye chart line, a loudness scale, the drum-to-window area ratio, a limb with the growth front advancing.
- Metabolism and fluid sets: stacked intake and output bars are acceptable there (those are budgets), but they need labels on the bars.
- Oxygen content (a `stack`): one orange bar with the dissolved part invisible. Show Hb-bound and dissolved side by side to scale, with a note that dissolved is tiny.

**Feedback loops (FIX).** Watch it work is good motion: the gauge leaves the set point, the boxes light in order and
the gauge comes back. But the picture is the generic loop for every case, which is what "blocks with arrows" means.
Keep the loop and add a small picture of the place in the body that reacts with it: skin vessels narrowing and a
shivering muscle for cold; the uterus and cervix with the head pressing for childbirth, where the gauge should run
away from the start level instead of coming back; the heart and arteries for the baroreceptor reflex; the
parathyroid, bone and kidney for calcium. On a desktop the diagram fills only the left 60% of the stage. At load the
"Drag the marker" hint covers the set point label.

**Graph reader (FIX).**
- Wiggers diagram: the five panels are drawn in a column about a third of the stage wide, with text about 6 px (`graphs/01_g_wiggers.png`). On the phone the value pills overlap the axis and valve labels. Give it the full stage width and taller panels.
- Reading a hematocrit tube: drawn as bar outlines, and the readout lists eight rows, most saying "not on the graph here". Draw real tubes (plasma yellow, buffy coat, red cells) and show only the rows for the tube under the cursor.
- The same readout noise ("not on the graph here") shows on other multi-series graphs (hair length).
- Leave the rest (pH, action potential, ECG, O2-Hb curve with its shift chips, spirogram, capillary pressures).

**Lab practical (FIX, small).** Heart external figure: the figure is about 400 px wide in an 850 px stage, so the
printed labels are about 6 px until you zoom. Fit the figure to the stage. Covered labels leave leader lines pointing
at white boxes, which looks broken; shorten or hide those lines. Phone: the highlighted label pill covers the label
under it ("Right pulmonary artery").

**Pathway tracer (REDESIGN).** The 5 pathways traced on a real figure (`data/pathway-traces.json`: blood flow,
conduction, CSF, food route, nephron blood) are the model: a drop moves through the drawing. The other 203 are a
grid of numbered dashed boxes that fill with words. Examples: "An enzyme's catalytic cycle" (should be an enzyme and
substrate changing shape), "Action potential: stimulus to repolarization" (an axon membrane with channels opening and
the trace drawing beside it), "A fall on an outstretched hand" (the arm skeleton with the force passing scaphoid,
radius, humerus, clavicle). Since 203 pictures is a lot, start with the most-used topics and give the rest a figure
from the lab-practical set where one exists.
- Bug: Missing step shows an empty stage with only "Read every step in full", although the prompt says "one step is missing from the map" (enzyme cycle and action potential both).
- Spot the error is a plain list of six sentences; it could at least use the map.

**Predict the change (REDESIGN).** Each scenario shows a row of the same gauge icon, one per variable. After Run it
the needles move and a text chain appears. Nothing shows the situation itself: "A tube narrows" should show the tube
(the calculator already draws one), "Choking: blue lips" the child's lips and nail beds turning blue, "Blood pressure
dips for a moment" the heart and arteries. The dials can stay as the answer layer. The chain ("Show the chain") is
labeled boxes joined by bare arrows; drawing it on the scene picture would make it the concept.

**3D anatomy (LEAVE).** Explore, Study, Quiz and Timed all work. Small: after Quiz, Timed opens on the last
zoomed-in pelvis view instead of the whole body.
