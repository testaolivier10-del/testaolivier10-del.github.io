# A&P pins and pictures: fixes for the accuracy check (2026-11-10)

Task anp-pins, branch `claude/tv-anp-pins`. Source of the findings: `docs/tool-review/done/anp-accuracy-check.md`.
Checked against OpenStax Anatomy and Physiology 2e (chapters named in that file) and ADA fasting glucose cut points.
Spec: decision 96 in `docs/anp-spec.md`. Rule used throughout: a step, variable or scenario with no right place on
its figure gets no pin (or no figure); a missing picture is acceptable, a wrong one is not.

Files: `anatomy-physiology/data/scenes.json` (place points), `pathway-scenes.json`, `predict-scenes.json`,
`calc-pictures.json`, `assets/tools/calc-art.js|css`, `assets/tools/feedback-loops.js`, `assets/tools/loop-scenes.js`.

## Pathway tracer pins (9 errors)

| # | Error | Fix |
| --- | --- | --- |
| 1 | Synovial joint: every pin one layer off | Fibrous membrane on the outer grey capsule layer, synovial membrane on the red lining, joint cavity in the fluid between the cartilages, upper and lower articular cartilage on their blue bands |
| 2 | Skeleton: shoulder on humerus shaft, humerus at elbow, wrist on radius, sacrum on iliac crest, ilium by a vertebra, hip socket on ilium, femoral neck on sacrum, ankle on metatarsals | Glenoid at the top of the humerus, humerus on the shaft, carpals and scaphoid (thumb side) on the carpals, sacrum between the hip bones, ilium on the iliac wing, acetabulum at the femoral head, neck between head and trochanter, condyles at the knee, tibia on the shaft, talus at the ankle, foot place renamed "Ball of the foot" on the metatarsal heads. Weight route now runs sacrum, ilium, acetabulum, neck, femur, tibia, talus |
| 3 | Efferent (somatic): DRG in white matter, dorsal root on dorsal horn, dorsal horn on the other side | DRG on the swelling of the dorsal root outside the cord, dorsal root on the root, dorsal horn, ventral horn (motor neuron) and ventral root all on the same side as the roots |
| 4 | Skin: upper dermis in the epidermis, hypodermis in the dermis | All four layer pins on one vertical line of the cut face: epidermis band, papillary dermis under it, reticular dermis, fat of the hypodermis. Also fixes Predict ig-blister and ig-burn-depth |
| 5 | Throat: soft palate pin in the oral cavity | On the soft palate behind the hard palate, above the uvula |
| 6 | Pelvis: ampulla in the bladder | Behind the bladder, beside the seminal vesicle |
| 7 | Muscle fiber: SR pin in sarcoplasm, T tubule pin outside the tubule, sarcolemma in the tubule mouth | Sarcolemma on the surface membrane, T tubule in the invagination, its junction where the tubule meets the SR, SR on the tan sac, "Calcium leaving the SR" on the released calcium below it |
| 8 | Muscle organisation: perimysium in white space, endomysium on perimysium, tendon past the tendon | Endomysium between two fibers, perimysium on the fascicle's sheath, epimysium on the muscle's outer coat, tendon on the white tendon |
| 9 | Respiration: "six carbons split" on the pyruvates, route doubles back | Glucose, early glycolysis (PFK) on the 6-carbon sugar, split where it divides, NADH step on the arrow to pyruvate, glycolysis ATP on the ATP icon; oxidative phosphorylation pins on the e- carriers and ATP icon |

Smaller misplacements fixed: breathing brainstem inside the head, diaphragm on the drawn diaphragm, air in and out on
the arrows, relaxing muscles on the intercostals; nephron glomerulus on the tuft, capsular space, afferent arteriole,
peritubular capillaries and "Blood reaching the kidney" (cortical radiate artery) on their vessels, loop bottom on the
loop; glands brain, hypothalamus, stalk, pituitary, pineal, adrenal, thyroid lobe, testes and ovaries on the organs;
gut pancreas on the pancreas; cell secretory vesicle on the vesicle, exocytosis at the opening, cytoplasm off the
vacuole; lymph thoracic duct on the duct (not the heart), cisterna chyli on the sac; efferent axon ending on the
terminal.

No right place, so no pin: nephron macula densa (the figure never draws the distal tubule at its glomerulus; place
removed, step "Macula densa" unpinned); lymph "Left lumbar trunk" (hidden behind the intestine; place removed). The
dorsal column and spinothalamic routes no longer use the motor pathway figure (sensory routes on motor tracts); they
fall back to the step map alone.

## Predict the change (14 kinds)

| # | Error | Fix |
| --- | --- | --- |
| 1 | Brain ventricles on the heart | aqueduct-blocked and granulations-clogged lose the circulation figure |
| 2 | Non-kidney scenarios on the nephron | acid-buffer, pump-blocked, potassium-rises, breath-hold, gi-repeated-vomiting, gi-cholera-rehydration-l4, fab-insulin-potassium, fab-dka-insulin, fab-cardiac-arrest lose the figure; also any nephron scenario left with only blood-in-capillary pins (fab-iv-saline, fab-d5w, fab-missed-dialysis, fab-hyponatremia-l4, fab-vomiting) |
| 3 | Thirst on peritubular capillaries | Unpinned in all six |
| 4 | CCK and secretin on the pancreas | On the duodenum |
| 5 | Gallbladder bile on the liver | On the gallbladder; "Bile entering the duodenum" on the duodenum |
| 6 | NSAID bicarbonate on the pancreas | On the stomach |
| 7 | Vitamin D in blood and calcitriol on the epidermis | Unpinned; ig-kidney-vitamin-d's start (kidney step) unpinned |
| 8 | Smooth muscle on the skeletal fiber | mt-latch-state and mt-mlck-blocked lose the figure |
| 9 | Retained placenta on the ovary | Start and progesterone unpinned |
| 10 | Follicle and injected hormones on the wrong gland | rp-nsaid-ovulation start on the ovaries; injected or gel androgen starts unpinned; also unpinned: total androgen (steroid-cycle-l4), FSH injections and the combined pill starts (not made by the pituitary or ovary) |
| 11 | Muscle and brain on the liver | Muscle glycogen unpinned; brain glucose and ketones on the head |
| 12 | Portal vein as a systemic vein | Unpinned |
| 13 | Ductus flow on lung capillaries | Shunt flow and pulmonary trunk pressure unpinned |
| 14 | Single variables | Fiber action potentials on the sarcolemma; ACh released on the axon terminal (ache-inhibitor, curare); Na/K pump scenario off the nephron; neutrophils and plasma leak on systemic capillaries; urine bilirubin unpinned; pneumothorax pleural pressure, chest wall and left lung unpinned; apocrine glands unpinned (only an eccrine gland is drawn) |

Also from the "misleading" list: renin release on the afferent arteriole (JG cells), not the blank macula densa
point; "ADH release" and "Mean arterial pressure" unpinned on the nephron; carotid baroreceptor firing unpinned (no
carotid on the figure); arteriole diameter and TPR on a new "Small arteries and arterioles" place; leg and ankle
variables on new lower-body capillary and vein places; maternal and fetal insulin scenario (dv-maternal-glucose)
loses the adult figure. Clear improvements made while re-reading: left atrial and ventricular variables on the LA and
LV, pulmonary vein pressure on "Blood leaving the lungs", inner medulla osmolarity on the loop bottom, peritubular
pressures on the peritubular capillaries, capsular pressure on the capsular space, ADH-blocked and thiazide starts on
the collecting duct and DCT, B12 absorption on the terminal ileum, fecal bile salts on the colon, Graves start on the
thyroid, stalk-cut start on the stalk, burn-depth start on the deep dermis.

Kept on purpose: plasma values (pH, HCO3-, osmolarity, K+) on peritubular capillary blood in kidney and acid-base
scenarios, and arterial PCO2 and pH on the lungs, since that blood is the plasma in question and the lungs set
arterial gases; they are no longer on non-kidney scenarios.

Totals: 207 scenarios had a figure, now 188; the 19 without one keep their dials.

## Calculators and loops ("not wrong but misleading", fixed where the fix was clear)

- Glucose units: 100 to 125 mg/dL (5.6 to 6.9 mmol/L) is now amber "prediabetes", not the diabetes colour, with a
  legend under the rulers (the band is too narrow for its own word) and a caption naming every band.
- Max firing rate: each shaded absolute refractory period holds the spike (rise and most of the fall); no undershoot
  is drawn, and the caption says the next impulse starts in the relative refractory period.
- Conduction time: no cell body or terminal fork; a neutral "start" and "arrives" mark, so the touch (sensory) preset
  is not drawn as a motor axon.
- Positive loops (all five): after the far end and a short pause, the ending comes: the gauge and the body picture
  fall back and the message says so (works with reduced motion as a step).
- Kidney tubule loop drawing: brush border removed (ADH, aldosterone and K+ act in the distal tubule and collecting
  duct).

Not done (a redesign rather than a clear fix): middle ear ossicles drawn as one rope; the stretch reflex figure's
front-on calf; hormone axes not showing the product as a brake; pathway pins elsewhere that sit near a leader-line end
but on the structure.

## Verification

- Every touched figure redrawn with all its places numbered on a grid and read, then cropped and zoomed where close
  (scratch `/home/claude/scratch/anp-pins/plate_*.png`); a pixel check flagged pins on blank background and each was
  moved or confirmed (outline-only figures such as the breathing head are white inside).
- Every changed Predict placement re-read against its variable name after the change.
- In the browser (port 8831): pathway Spot the error and Predict plates, the three calculators at 1280 and 390 wide,
  the LH surge and childbirth loops to their end with and without reduced motion. Before/after shots in
  `/home/claude/shots/build/anp/`.
- `node scripts/build-anp.mjs --check`, `node scripts/check-anp-content.mjs` (0 failing), `node --test
  scripts/test/anp-*.test.mjs` (55 pass), `node scripts/check-site.mjs` (OK). `node scripts/check-weight.mjs`: the two
  budgets over (`nremt/assets`, `nremt/scenario-sim.html`) are over on the base commit too, not from this work.
- `anp-calc-pictures.test.mjs` learns the `legendTitle` word key.
