# A&P new pictures: independent accuracy check (2026-11-10)

Reviewer saw only the shipped files on `claude/tool-fixes` (no site file changed). Sources: OpenStax Anatomy and
Physiology 2e (chapters named below), the OpenStax figures themselves for pin placement, GCS 2014 and Apgar terms,
ADA glucose cut points. Scratch renders: `/home/claude/scratch/anp-check/` (calc/, loops/, plate_*.png, pw.txt, pr.txt).

## What was checked

| Tool | Checked | How |
| --- | --- | --- |
| Calculators, 24 new picture families | all 65 calculators that use them (every family, every calculator) | rendered each at its default inputs in Chromium, read the drawing against the calculator's numbers and the science |
| Feedback loop scenes | all 18 drawings, through 30 of the 49 loops (every drawing and every mode: cold, hot, fever, fall, rise, keep, lose, low, high, acid, brake, secretin, cut) | rendered in the acting state; the 5 positive loops run to their end |
| Pathway tracer pins | all 101 pathways with a scene read step by step against their place names (pw.txt); 25 scenes, covering 61 pathways, rendered with every place's pin on the real figure | pins drawn from `scenes.json` onto the figure, looked at, cropped where close |
| Predict the change pins | all 207 scenarios with a scene (1,052 variables) read variable by variable against the place name (pr.txt); the 7 scenes they use most (circulation, nephron, gut, glands, airway, skin, muscle fiber) rendered | as above |

## Errors

### Calculators (0)

No drawing contradicts its calculator or the science. Spot checks that hold: O2 content 1.34 x 15 x 0.97 = 19.5 plus
0.003 x 95; EPSP 3 x 4 minus 3 = -61 mV; 1 m at 50 m/s = 20 ms; reflex 8.6 + 10 + 1 + 3 = 22.6 ms; rule of nines 18 +
4.5 + 4.5 = 27%; Hct and plasma volume; 25 trillion / 120 days; GCS 2014 and Apgar wording; Snellen line values;
55/3.2 x 1.3 = 22.3; Boyle, compliance, PCO2 halving with doubled ventilation; Dalton 149 / 47 / 564; calcium units;
adjusted calcium; Winter's 1.5 x 5 + 8; Tanaka; 600x surface; emulsification x100 and 10^6 droplets; SGLT1 gradients;
free hormone dots; K+ shift 35/14; water load 2/3 and 1/3; gut and kidney water budgets; sarcomere bands (A constant,
I and H shrink); 16,000 sarcomeres; lever 40 x 32/4; Punnett and X-linked; 2^4; 4 spermatids each; half-lives;
palmitate 106 ATP with 7 cuts and 8 acetyl groups; 7,700 kcal/kg; sweat 580 kcal/L; 84 W.

### Feedback loop scenes (0)

Right organ and right direction in all 18 drawings (skin vessels narrow and shivering for cold and fever, widen and
sweat for heat; brown fat between the shoulder blades; baroreflex faster heart and narrower arterioles for a fall,
the reverse for a rise; tubule keeps Na+ and water for RAAS and ADH, lets them go for ANP and pressure natriuresis,
secretes K+ for aldosterone, HCO3- to blood and H+ to urine; afferent arteriole narrows for TGF and myogenic; calcium
into blood from bone, kidney and gut with PTH up, out to bone and kidney with PTH down; insulin glucose into liver and
muscle, glucagon glucose out of liver; deeper breathing for CO2, O2, acid, Hering-Breuer cuts the breath; kidney EPO
to marrow; axes with the right tropic hormone, gland and product; less acid, pylorus tightens, pancreatic bicarbonate;
detrusor, iris sphincter, calf, clot, Wolff's law). The five positive loops (childbirth, labor oxytocin, LH surge,
micturition, thrombin) all build and stop at the far end with their own ending text.

### Pathway tracer pins (9)

1. **Synovial joint scene (os-9-8), all 3 joint pathways** (jt-synovial-layers, jt-cartilage-pump,
   jt-osteoarthritis). Every pin is one layer off. "Fibrous membrane" and "Synovial membrane" both sit in the joint
   cavity, not on the capsule's two layers; "Joint cavity" sits on the upper bone's articular cartilage; "Articular
   cartilage, upper bone" sits inside the spongy bone. Right: fibrous membrane is the outer grey capsule layer,
   synovial membrane the inner red lining, the cavity the gap between the cartilages (OpenStax 9.4, Fig. 9.8).
2. **Skeleton scene (os-7-2), sk-arm-force and sk-weight-path.** "Shoulder joint" is on the middle of the humerus
   shaft; "Humerus" is at the elbow; "Wrist bones" and "Thumb side of the wrist" are on the distal radius; "Back of the
   pelvis" (sacrum) is on the right iliac crest; "Ilium" is beside a lumbar vertebra; "Hip socket" is on the ilium near
   the sacrum; "Femoral neck" is on the edge of the sacrum; "Ankle" is on the metatarsals. Right: glenoid at the top
   of the humerus, acetabulum and femoral neck at the hip joint lateral to the pelvis, talus at the ankle (OpenStax
   7.1, 8.3, 8.4). The weight route as drawn wanders over the pelvis instead of going sacrum, sacroiliac joint, ilium,
   acetabulum, femur.
3. **Efferent scene (os-15-6), tack-to-cord and reflex-arc-knee.** "Dorsal root ganglion" pin is inside the cord's
   white matter; "Dorsal root" pin is on the dorsal horn; "Dorsal horn" pin is on the opposite half of the grey matter,
   so the route crosses the cord for an ipsilateral reflex. Right: the DRG is the swelling on the dorsal root outside
   the cord; the withdrawal and stretch reflexes stay on the same side (OpenStax 13.4, 14.5).
4. **Skin scene (os-5-2), ig-burn-depth** (and Predict ig-blister, ig-burn-depth). "Upper dermis" sits in the pale
   epidermis band of the cut face; "Hypodermis" sits in the pink dermis beside the fat lobules. So superficial
   partial-thickness lands on the epidermis and full-thickness lands on the dermis. Right: full-thickness destroys the
   epidermis and the whole dermis (OpenStax 5.4); the pins need to move one layer deeper.
5. **Throat scene (os-22-4), gi-swallowing step 3** "Nose and airway sealed". The "Soft palate" pin is in the oral
   cavity under the hard palate, at the label end of the leader line. Right: the soft palate is the back of the palate
   ending in the uvula (OpenStax 22.1, 23.3).
6. **Pelvis scene (os-25-3), rp-sperm-route step 6** "Ampulla". The "Behind the bladder" pin is in the middle of the
   bladder. Right: the ampulla of the ductus deferens lies behind the bladder, beside the seminal vesicle (OpenStax 27.1).
7. **Muscle fiber scene (os-10-8), mt-ec-coupling, mt-relaxation.** The "Sarcoplasmic reticulum" pin is in the
   sarcoplasm above the SR, and the "T tubule" pin is outside the tubule on the leader line (the "Sarcolemma" pin is in
   the tubule's mouth). Right: put SR on the tan SR sac, T tubule in the invagination, sarcolemma on the surface
   membrane (OpenStax 10.3).
8. **Muscle organisation scene (os-10-3), ms-fiber-to-bone, mt-pull-to-bone.** "Perimysium" floats in white space
   off the drawing; "Endomysium" sits at the edge of a fascicle (that is perimysium); "Tendon end of the muscle" floats
   past the tendon. Right: endomysium around each fiber, perimysium around each fascicle (OpenStax 10.2).
9. **Respiration scene, met-glucose-to-atp steps 3 and 4.** "Six carbons split in two" is pinned on the two pyruvates
   (the end of glycolysis) and the next step "Oxidation makes NADH" goes back up to the middle of glycolysis, so the
   route doubles back. Right: the 6-carbon sugar splits into two 3-carbon sugars mid-glycolysis, before the NADH step;
   pyruvate is the end product (OpenStax 24.2).

Also wrong but small: breathing scene "Brainstem" pin floats in front of the forehead, outside the head, and
"Diaphragm" sits on the abdomen below the drawn diaphragm (inspiration, ms-breath-rest); nephron "Where the tubule
passes its own glomerulus" (macula densa) is on blank background, as are "Capillaries around the tubule" and "Blood
reaching the kidney"; glands "Adrenal glands" pin is between the two glands; gut "Pancreas" pin is on the stomach's
lower edge; cell "Secretory vesicle" pin misses the vesicle and "Cytoplasm" is on the vacuole.

### Predict the change pins (14 kinds, about 45 variables)

The rules put many variables on a structure of the wrong organ or wrong system. Worst first:

1. **Brain ventricles on the heart:** aqueduct-blocked ("Size of the lateral ventricles", "Size of the fourth
   ventricle" pinned on the Heart) and granulations-clogged (same). Right: these are CSF spaces in the brain (OpenStax
   13.2); the circulation figure has no place for them, so no pin.
2. **Non-kidney scenarios drawn on the nephron:** acid-buffer (two beakers), pump-blocked and potassium-rises (a
   generic cell's Na+, K+ and membrane potential pinned on peritubular capillary blood), breath-hold (a lung event).
   Right: these are not kidney situations; "Sodium concentration inside the cell" cannot sit on blood.
3. **Thirst on peritubular capillaries:** dehydration, salty-snack, untreated-type-1, ur-adh-blocked, fab-water-fast,
   fab-lost-hiker. Right: thirst is the hypothalamus (OpenStax 26.2); no pin on this figure.
4. **CCK and secretin on the pancreas:** gi-fatty-meal (CCK), gi-pancreatic-duct-blocked and gi-acid-duodenum
   (secretin). Right: both are made by the duodenal mucosa and act on the pancreas (OpenStax 23.5); the gut figure has
   a Duodenum place.
5. **Gallbladder bile on the liver:** gi-fatty-meal "Volume of bile in the gallbladder" pinned on Liver although the
   scene has a Gallbladder place.
6. **NSAID stomach bicarbonate on the pancreas:** gi-daily-nsaid "Bicarbonate secreted into the mucus layer" is
   gastric surface-cell bicarbonate (OpenStax 23.4); pin should be the stomach.
7. **Vitamin D:** ig-kidney-vitamin-d "The active hormone the kidneys make" and "25-hydroxyvitamin D in his blood",
   ig-vitamin-d-winter "25-hydroxyvitamin D in her blood", all on the Epidermis. Right: 25-OH D is made in the liver
   and carried in blood, calcitriol in the kidney (OpenStax 5.3, 26.x).
8. **Smooth muscle on the skeletal fiber figure:** mt-latch-state ("Tension in the vessel wall" on Whole muscle) and
   mt-mlck-blocked. Right: latch and MLCK are smooth muscle (OpenStax 10.8); the figure shows skeletal muscle.
9. **Placenta on the ovary:** dv-retained-placenta start and "Progesterone in her blood" pinned on Ovaries. Right:
   the source is retained placental tissue in the uterus.
10. **Follicle and injected hormones on the wrong gland:** rp-nsaid-ovulation start (prostaglandins in the follicle)
    on Pituitary gland; rp-anabolic-fertility and rp-testosterone-therapy start (hormone injected or from a gel, in
    the blood) on Testes, the organ that shrinks in that case.
11. **Muscle on liver, brain on liver:** met-g6pase-deficiency "Muscle use of its own glycogen" on Liver;
    met-fast-weeks-l4 "brain-ketones" on Liver.
12. **Portal vein as a systemic vein:** gi-cirrhosis "Pressure in the hepatic portal vein" on Systemic veins.
    Right: the portal vein runs gut to liver, not to the heart (OpenStax 20.5).
13. **Ductus flow on lung capillaries:** dv-ibuprofen-ductus "Blood flow from the pulmonary trunk into the aorta" on
    Pulmonary capillaries. Right: that flow goes through the ductus arteriosus and bypasses the lungs (OpenStax 28.4).
14. **Wrong cell or wrong place for one variable:** mt-ache-inhibitor "Action potentials in the muscle fiber" on Motor
    neuron (should be sarcolemma); fab-insulin-potassium "Activity of her sodium-potassium pumps" on peritubular blood
    (pumps are in body cells); splinter-inflammation "Neutrophils at the site" and epinephrine-anaphylaxis "Plasma leak
    into the tissues" on the Aorta; blood-hemolysis "Bilirubin in his urine" on the Aorta; pneumothorax "Right
    intrapleural pressure" and "How far out the right chest wall sits" on the Diaphragm, and "Volume of the left lung"
    on the pin that sits in the right lung; ig-puberty-glands "apocrine sweat glands" on the drawn eccrine gland.

## Not wrong, but misleading

- Glucose calculator: the 100 to 125 mg/dL "raised" band has the same colour as the diabetes band and its label is
  hidden, so 110 mg/dL looks like diabetes.
- Max firing rate: the whole spike, undershoot included, is shaded as the absolute refractory period; the
  undershoot belongs to the relative refractory period.
- Conduction time draws the impulse leaving a cell body toward the ending, while its reference fiber is a touch
  (sensory) fiber, which carries impulses toward the CNS.
- Middle ear: ossicles drawn as one rope; fine for the area ratio, but no malleus, incus and stapes.
- Loop scenes: the kidney tubule drawing has a brush border (proximal tubule) for ADH, aldosterone and K+ loops that
  act in the collecting duct and distal tubule; the stretch reflex figure stands upright and front-on with "calf"
  bulges on both sides of the shin; the hormone axes show the product going back up but never as a brake.
- Positive loops end with the gauge and drawing frozen at the peak while the ending text says the variable falls
  (LH surge: "estradiol falls"; childbirth: "delivery removes the stretch").
- Pathway pins that sit at the end of a figure's label leader line, in blank space next to the structure, rather than
  on it (nephron, glands, muscle organisation, lymph "Lumbar trunk" on the intestine and "Thoracic duct" on the heart).
- Dorsal column and spinothalamic routes on the motor pathway figure: "Spinal cord, dorsal side" is drawn on the
  anterior corticospinal tract fibers, and "just behind the precentral gyrus" sits on a coronal cortex where front and
  back cannot be seen. The builder named this; it still shows sensory fibers on motor tracts.
- Predict: blood values with no blood place get pinned on an organ (airway scenarios put arterial PCO2 and pH on the
  Lungs; acid-base and vomiting cases put plasma values on nephron capillaries; circulation puts arteriole diameter and
  TPR on capillaries; carotid-pressure puts "Baroreceptor firing" on the aorta although the case is the carotid sinus;
  ADH release on capillary blood; maternal and fetal insulin on an adult pancreas).

## Suggested fixes

Re-set the place points for the synovial, skeleton, efferent (somatic panel), skin, throat soft palate, pelvis
ampulla, ec (SR, T tubule, sarcolemma) and muscle-org scenes on a gridded copy, and add a test that each place point
falls on a non-background pixel. For Predict, drop a pin rather than force one: add negative rules (no brain, CSF,
thirst, hypothalamus or smooth muscle variables on these figures; no scenario on the nephron unless its topic is
kidney or acid-base renal handling), map CCK/secretin to Duodenum and gallbladder bile to Gallbladder, and re-run.
