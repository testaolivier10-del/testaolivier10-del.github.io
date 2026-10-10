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
