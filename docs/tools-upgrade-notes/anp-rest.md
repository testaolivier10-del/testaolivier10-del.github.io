# U-AnP-rest notes (tools upgrade Phase 2)

Graphs, Pathways, Calculators, Lab practical and Word roots (A&P). One line each: what changed, the tool's job,
what the owner should check. Accuracy list at the end.

## Graphs (anatomy-physiology/assets/tools/graphs.js, graphs.css)
- **Job:** read a physiology graph and predict how it moves when something changes.
- **Changed:** each graph now has Explore and Quiz tabs. Explore: drag on the chart (or the slider under it, keyboard
  arrows) to move a cursor along x; every curve is read live at that point with its region (`steep middle`,
  `ejection`). "What if…" chips come from the graph's own shift questions: tapping one slides the base curve into the
  shifted one (0.7 s, reduced motion = end state), fades the old curve, parks the cursor where the change is largest,
  and shows the change (`more CO2, H+, heat: 53% −22`) plus the question's explanation. Quiz = the existing questions,
  same ids and scoring; shift questions whose options are plain directions (12 of 114) become "Place the shifted
  curve": drag a dashed copy (or arrow buttons / arrow keys) and it glides to the real curve after the answer. The
  option buttons stay for every question. `#<graph>/explore` deep link; `#<graph>/<question>` unchanged. A graph
  not yet tried opens in Explore, otherwise in Quiz.
- **Owner check:** the What-if chip labels are the overlay series labels (e.g. "Adapted", "Active"); a few are terse.

## Pathways (pathways.js, pathways.css, data/pathway-traces.json, build-anp.mjs publishedTool)
- **Job:** know the order things happen in, and where in the body each step is.
- **Changed:** five pathways now play on the real OpenStax figure, above the drills: blood through the heart and body
  (Fig 19.4), the conduction system (19.18), CSF flow (13.18), the food route (23.2), the nephron's blood supply
  (25.10). **Watch**: a token (drop of blood that turns from blue to orange in the lung capillaries, an impulse, a drop
  of CSF, a bite of food) travels step to step leaving its path, with each step's text and why. **Trace it**: the token
  waits and the student taps where it goes next (the structure, or its printed label, which are keyboard buttons); a
  wrong tap names what was tapped ("That is the Aorta", "step 13: later in the pathway") and rings the real next spot
  with a dashed line to it. New scored item `pathways:<id>:trace` (right = no wrong taps), via AnpCore.toolResult so
  misses reach Review; Review's link opens the pathway. Order / Missing / Error drills and the after-answer diagram
  are unchanged; pathways without a matching figure keep exactly the old view.
- **Data:** `data/pathway-traces.json` (points placed by eye on each figure in image pixels, checked against an
  overlay; label ids per step; `jump` for the blood route's move between the heart inset and the body drawing).
  The build copies it into `assets/tool-data/pathways.json` as `p.trace` with figure size, AVIF srcset, credit and
  label boxes (later-concept labels covered, decision 30). Test: `scripts/test/anp-pathway-traces.test.mjs`.
- **Not traced, and why:** air route (15 steps; figures stop at the main bronchi or start at terminal bronchioles),
  filtrate through the nephron (25.10 labels only the capsule, PCT and loop), urine route, fetal shunts (heart
  chambers unlabeled in 20.44), sound, vision. Each could be added later with a better figure or a two-figure trace.
- **Owner check:** the step points on the five figures (screenshots `p4-*.png`); conduction's "Atria depolarize" is
  placed on the right atrium label, and the AV delay step shares the AV node point (the trace passes through it).

## Calculators (calculators.js, calculators.css, data/calc-pictures.json)
- **Job:** see what each formula does to the body as the numbers change, then work it by hand.
- **Changed:** 19 calculators across 5 picture families get a live picture above the inputs, and every input gets a
  slider beside its number box (both stay in sync; typing still works; presets move both). Families: **tube** (flow,
  radius rule, organ flow, TPR): a vessel with in/out pressure gauges, its width following the radius (or resistance,
  as r ∝ R^-1/4), dots moving at flow ÷ area, a dashed outline of the normal width; **wave** (MAP, pulse pressure):
  two schematic arterial beats between DBP and SBP with SBP, DBP, MAP lines and the plain average dashed; **balance**
  (capillary NFP, glomerular NFP): pressures as arrows out above / in below and the net arrow; **pump** (SV/EF: a
  ventricle beating between EDV and ESV; cardiac output: a heart beating at HR filling a one-minute jug); **stack**
  (lung capacities, ventilation dead space, FEV1/FVC, filtration fraction, clearance vs GFR, glucose load vs Tm, body
  water compartments, O2 content, meal energy): parts of a whole on one scale. Numbers in every picture are the
  calculator's own computed values (test: `scripts/test/anp-calc-pictures.test.mjs`). Practice mode is unchanged and
  shows the picture with the worked solution after an answer. An invalid input dims the picture.
- **Also fixed:** the calculators page scrolled sideways on phones (the picker's long title widened the grid);
  `.calc` now has a `minmax(0,1fr)` column.
- **Not given a picture (70):** unit conversions, counts and scores (GCS, Apgar, Punnett, etc.) where a picture would
  add nothing; A-a gradient and Fick were in the brief but the data has no such calculators.
- **Owner check:** the arterial wave shape is drawn schematically (labelled so in its caption).

## Lab practical and Word roots (lab-practical.js, word-roots.js, tool-kit.js/.css)
- **Jobs:** lab practical: name and find structures on real figures. Word roots: decode a term from its parts.
- **Changed:** a "See it in 3D" button beside the structure's name, for the 55 lab label names (and the word-root
  terms) that are exact body map Browse-by-name labels or listed aliases (`AnpToolKit.body3d`, same rule as the
  P1 strip, no synonyms). It appears in Explore and Study info, in quiz feedback, and in the timed practical's
  review; the Keep going strip no longer repeats it there. Only 2 word-root terms match (diaphragm, clavicle):
  word roots are mostly prefixes/suffixes and non-structure terms. Nothing else in either tool changed.
- **Also fixed:** `scripts/test/anp-tool-kit.test.mjs` read the body map labels from `nremt/body-map.html`, but
  P1-NREMT moved them to `nremt/assets/body-viewer.js`; the test now reads the module (and falls back to the page).

## For accuracy review
1. **Graph readings (Explore):** values between data points are read off the same monotone cubic the chart draws
   (Fritsch–Carlson), never outside the neighbouring points (tested). A "What if" condition swaps the base curve for
   the question's existing overlay curve; the 0.7 s slide between them is animation only, and the readout shows only
   the two data curves' values. No new curves or numbers.
2. **Place-the-curve:** an option counts as a direction only when its text starts with one (left/right/up/down/no
   change); 12 questions qualify. Check that "up/down" and "left/right" in those 12 option texts mean the curve's
   movement on the chart's own axes (e.g. audiogram's y axis is reversed: "moves down" = worse hearing, and a
   downward drag on screen means down on that chart, which is right).
3. **Pathway trace points** (data/pathway-traces.json) are where each step happens on the OpenStax drawing, placed by
   eye: worth a look on blood-flow (pulmonary arteries placed on the left pulmonary arteries; the systemic loop on
   the upper-body capillaries and veins), conduction ("Atria depolarize" on the right atrium) and CSF (the
   median-aperture point stands for "median and lateral apertures"). Blood token color follows each step's existing
   `blood` field (deoxygenated blue, oxygenated orange, exchange purple).
4. **Calculator pictures:** tube width from resistance uses r = (R0/R)^(1/4) (Poiseuille, other factors equal) and
   particle speed = flow / r², relative to the defaults; the arterial wave is schematic (stated in its caption);
   the cardiac-output jug fills at 10x speed (stated). Every number shown is the calculator's own (tested).
