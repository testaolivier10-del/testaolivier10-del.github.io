# A&P tools: second independent accuracy check (2026-11-11)

Reviewer saw only the shipped files on `claude/tool-fixes` (no site file changed, no git command run that changes
anything). Read first: `docs/tool-review/pass2/anatomy-physiology.md`, `pass3/anatomy-physiology.md`,
`done/anp-pins.md`, `done/anp-accuracy-check.md`. Sources: OpenStax Anatomy and Physiology 2e (chapters named
below) and the OpenStax figures themselves for placement. Tools opened at 1280x800 on a static server at port 8891,
Premium on. Scratch: `/home/claude/scratch/anp-check2/` (plate_*.png, loops/, calc/, lab/, graphs/, scripts).

## Counts checked

| Part | Checked | How |
| --- | --- | --- |
| 1. Pins from the first check | all 9 pathway errors, all 11 "small" pathway misplacements, all 14 Predict kinds (37 scenarios, every variable) | 15 scenes redrawn with every place numbered on the real figure, cropped and zoomed where close; pins read from the built `assets/tool-data/pathways.json` and `predict.json` (what the page loads); two plates also opened in the browser to confirm the drawn pins match |
| 2. Feedback loop drawings | 29 loops covering 17 of the 18 drawings, all 5 positive loops run to the end, the fever loop through both buttons | each run sampled every 0.3 to 1 s: which ring parts are lit or dimmed, which drawing labels are showing, `is-on` / `is-act`, the vessel width |
| 3. Middle ear | the one calculator that draws it (middle-ear-boost) | rendered, drawing read against OpenStax 14.1 |
| 4. Lab practical view split | all 20 figures the page splits (465 labels), every view of each | each view screenshotted, labels counted per view, each crop compared with the full OpenStax figure |
| 5. Calculators with the result card row removed | all 25 that hide a row, at default inputs, plus 9 of them at 4 other slider settings (36 more states) | the picture's number and unit read against my own arithmetic and the hidden row |
| 6. Graph reader labels | 8 graphs by eye (ph-scale, enzyme-ph, fab-ph-pco2, dv-pregnancy-hormones, fab-potassium-rmp, fab-adh-osmolality, frank-starling, wiggers), with and without a What if; plus a scripted sweep of all 76 graphs at 25 cursor positions | region names checked against their shaded band, marked-point labels against their point, value pills against their dot |

## 1. Pins from the first check: fixed

All 9 pathway errors are fixed in the shipped data:

- Synovial joint (os-9-8): fibrous membrane on the grey outer capsule, synovial membrane on the red lining, cavity
  in the fluid, both articular cartilages on their blue bands (OpenStax 9.4).
- Skeleton (os-7-2): glenoid at the top of the humerus, sacrum between the hip bones, ilium on the wing, acetabulum
  and femoral neck at the hip, talus at the ankle; the weight route now runs sacrum, ilium, acetabulum, neck, femur,
  tibia, talus (7.1, 8.3, 8.4).
- Efferent (os-15-6): DRG on the root's swelling outside the cord, dorsal root, dorsal horn, ventral horn and ventral
  root all on the same side (13.4, 14.5).
- Skin (os-5-2): epidermis, papillary dermis, reticular dermis and fat in one column, each in its own layer (5.1, 5.4).
- Throat soft palate behind the hard palate; pelvis ampulla behind the bladder beside the seminal vesicle; muscle
  fiber sarcolemma, T tubule and SR on their structures; muscle organisation endomysium, perimysium, epimysium and
  tendon on theirs; respiration glucose, PFK and the split on the 6-carbon sugar and the NADH step after it, so the
  route no longer doubles back (10.2, 10.3, 22.1, 24.2, 27.1).
- The small ones: breathing brainstem inside the head and diaphragm on the drawn diaphragm; nephron glomerulus,
  afferent arteriole, peritubular capillaries and cortical radiate artery on their vessels (macula densa unpinned);
  glands adrenal, pancreas, ovary, testis on the organs; gut pancreas; cell secretory vesicle and cytoplasm; lymph
  thoracic duct and cisterna chyli.

All 14 Predict kinds are fixed: brain ventricle, smooth muscle, non-kidney nephron and maternal/fetal insulin
scenarios lost their figure; thirst, vitamin D in blood, calcitriol, portal vein pressure, ductus flow, urine
bilirubin, placenta, injected androgen and pneumothorax pleural variables are unpinned; CCK and secretin are on the
duodenum, gallbladder bile on the gallbladder, NSAID bicarbonate on the stomach, brain fuel on the head, fiber action
potentials on the sarcolemma, neutrophils and plasma leak on systemic capillaries, renin on the afferent arteriole.

## Errors

### Scene pins (1 new)

1. **Skin scene (os-5-2), place "Blood vessels of the skin"** (Predict ig-hot-day and ig-cold-exposure "skin blood
   flow", ig-sunburn redness). The pin (330, 690) sits on the pale hair root, on a nerve fiber, not on a vessel.
   Right: on the dermal vessels, for example the red arteriole just below at about (320, 733) or the upper dermal
   plexus (OpenStax 5.1, 5.3: skin blood flow is in the dermal vessels). Not in the first check's list; found while
   redrawing this plate.

### Feedback loops (0)

Right organ, direction and timing of every action label in all 29 loops: the arteriole runs up from the hypodermis
and under the epidermis, narrows with "less warm blood near the surface" for cold and fever and widens for heat
(OpenStax 5.3); "heat lost from the skin" appears with the stimulus; "narrows", "widens", "muscle shivers", "sweat"
appear only when the signal reaches the effector. The ring shows the stimulus at full strength and the six other part
names dimmed (0.30), each brightening in order as the signal reaches it, and every part's words name the right part.
All five positive loops build to the far end, pause about 2.6 s, then the gauge and drawing fall back and the message
names the ending (delivery removes the stretch, the hole is sealed, the bladder is empty, the corpus luteum forms).

### Middle ear (1)

2. **Calculator middle-ear-boost, ossicle drawing.** Order and position are right (malleus handle on the eardrum
   with its head up in the middle ear, incus body on the malleus head with its long process down to the stapes,
   stapes head, two crura, footplate), checked against OpenStax 14.1. But the stapes footplate is drawn about 10
   units to the side of the oval window, not in it, and it is drawn taller (32 units) than the window (about 25
   units) under the line "areas drawn to scale with each other". Right: the footplate sits in the oval window and is
   the area the window shows (the caption says so: "the small stapes footplate in the oval window").

### Lab practical view split (2)

No label was dropped or duplicated: in all 20 split figures the views together hold every label exactly once
(465 labels), and every label sits on its own printed spot. But the side crop is set by the label columns of each
view, so a drawing that lies beyond the last label column is cut off, and two labels lose their structure:

3. **Upper-limb muscles, figure 2 (OpenStax 11.23), upper view.** The printed "Deltoid" label points right into
   panel (b) (left deltoid, posterior view). The crop ends just after the label column, so panel (b) is gone except
   a sliver at the edge: "Deltoid" points at almost nothing. Right: the upper view must keep panel (b) (full width
   for this figure).
4. **Body movements, figure 2 (OpenStax 9.13), lower view.** "Opposition" points at panel (l), the hand; the crop
   ends at the label, so the hand and the caption "(l) Opposition" are cut away and only an arrow tip shows. Right:
   keep panel (l) in the lower view.

### Calculators with the card row removed (0)

In all 25 the picture prints the hidden value with the right number and unit, and the arithmetic holds: flow
(90 - 10) / 2 = 40.0 mL/min; radius 1/16 of 40 = 2.5 mL/min; organ flow 88/80 x 0.9^4 = 0.72 L/min; VC 4,700,
TLC 5,900, FRC 2,400 mL; filtered load 125 mL/min x 100 mg/dL = 125 mg/min; TBW 30.0 L, ICF 20.0 L; meal 160 +
100 + 108 = 368 kcal; red cells 2.21 L and plasma 2.70 L of 4.90 L; 25 trillion / 120 days = 208 billion a day,
2.4 million a second; Boyle 759.0 mm Hg; calcium 2.50 mmol/L and 5.00 mEq/L; pregnancy CO 6.80 L/min (MAP 87.4);
day 200 = 28 weeks 4 days, fetal age about 26 weeks; 10^6 droplets, surface x 100; 16,000 sarcomeres x 0.50 um =
0.80 cm; lever 8.0 cm; Punnett and X-linked shares; 31.0 and 2.00 glucose; palmitate 106 ATP; 35.0 g; 0.97 kg;
2,214 L; 348 kcal; ATP-CP 10.0 s. At the 36 other slider settings the hidden rows were still printed, correctly.

### Graph reader (2)

Values are right on all 8 (for example [H+] 10^-7.34 M = 45.7 nmol/L; Henderson-Hasselbalch 7.53, 7.40, 7.30 at
PCO2 30, 40, 50 with HCO3- 24; Wiggers at 0.3 s in ejection with LV just above aortic). Marked-point labels stay
within 30 px of their point in all 76 graphs and wait when the cursor sits on the point; value pills stay on their
dot's row. The new region-name slide is the problem: when a region is narrower than its name, the name slides by its
own width and leaves the band.

5. **pH scale, "normal blood pH"** (band 7.35 to 7.45). With the cursor anywhere from pH 7.30 to 7.47 the name
   moves left and sits under about pH 7.15 to 7.35, the acidosis range, while the reading beside it says
   "acidosis" (cursor 7.34). Right: the name stays over 7.35 to 7.45 (step it up a line instead of sideways).
6. **Pregnancy hormones, "progesterone source shifts"** (band weeks 7 to 9). With the cursor anywhere from week 0
   to 17 the name slides right of the cursor, ending under weeks 17 to 36; at week 3 the 9.84% value pill also sits
   on top of it (the pill check runs before the slide). Right: the name stays at weeks 7 to 9.

## Not wrong, but misleading

- Loops, every negative loop: between correction pulses the effector state is cleared, so the arteriole widens
  again, shivering stops and the action labels vanish for about 0.6 to 0.9 s while the variable is still off its
  set point and the caption still reads "Response". The body keeps the vessels narrowed throughout.
- Loops: some hormone labels drawn as "stimulus" labels show at step 1, before the signal reaches the gland: "PTH up"
  (calcium loops), "islet: insulin" / "islet: glucagon", "EPO" (marrow loops).
- LH surge ending: "Estradiol falls back to where it started." Estradiol does dip after the surge, but the corpus
  luteum then makes estradiol and progesterone again; "falls" is fine, "to where it started" overstates it.
- Lab practical crops that cut drawing but keep the label's structure: "Latissimus dorsi" (11.23) keeps its bracket
  in (a) but its second leader points into the cropped panel (b); vessel walls (20.7) middle view cuts the
  lengthwise vein, so two of the "Valves (closed)" leaders end in blank; sarcomere (10.5) upper view cuts the left
  third of the thick filament, its bracket and arrow; cell junctions (4.5) cut the right edge of the gap junction
  panel and the adherens junction; blastocyst (28.9) cuts the explanatory text mid-word. Trunk muscles (11.15):
  the captions of the two upper drawings fall below the split, so they print at the top of the lower view, over the
  deep back muscles ("Superficial and deep muscles of the neck and upper back").
- Calculators: organ-flow prints "Flow 0.72 L/min" without "after" while the card keeps "Flow before 1.10 L/min".
  The Punnett row "chance a child with the dominant phenotype is a carrier" is hidden whenever its number happens to
  equal a printed share (AA x aa: 100%; AA x Aa: 50%); the number is right but the conditional chance is not drawn
  as such. The hide rule matches a unit as plain text, so the unit "L" matches any word with an "l" (it matched
  "intracellular 20.0"); right today, but it could hide a row whose value appears under another name.
- Calculators, middle ear: the picture is otherwise clear; see error 2.
- Graph reader, enzyme-ph with "pH 7.0": the left value pill covers part of the "stomach enzyme" curve label.

## Notes

- The pass 3 report says 21 figures split; the page splits 20 of the stations (the SVG dermatome map is one view).
- Fix suggestions: give the skin vessels place a point on a vessel; put the stapes footplate inside the oval window
  ellipse and size it from the same area; in `lab-fit.js` `viewOf`, widen a view's crop to the ink of its band (or
  to the full width when ink lies past the label columns); in `graphs.js`, keep a sliding region name inside its
  band (or step it up instead) and run the pill check after the slide; in `feedback-loops.js`, keep `is-act` on
  between pulses of a negative loop until it finishes.
