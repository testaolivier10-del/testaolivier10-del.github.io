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
