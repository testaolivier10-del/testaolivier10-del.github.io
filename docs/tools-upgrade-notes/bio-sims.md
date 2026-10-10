# U-Bio-sims notes (tools upgrade Phase 2)

Branch `claude/tools-upgrades-bio-sims`. Ten AP® Biology simulators. Each keeps its questions, mini FRQ, run
buttons, data tables, URL params and recording; the live visual moves to the top of the model card through the
Phase 1 stage slot (`ApBioTools.mount(slug, fn, { stage })`, `ctx.redraw`). New tests:
`scripts/test/apbio-sims-upgrade.test.mjs`. `bio-tools.js` is not changed.

## Tools

### 1. Osmosis (flagship 5)
- **Job:** see which way water moves and why, from ψ inside against ψ outside.
- **Changed:** the stage is a beaker with one potato cell (green wall, brown membrane, vacuole), a red blood cell
  (biconcave dimple, crenates, bursts into a dashed torn outline with its solute spilling) or a dialysis bag on a
  string; outside solute dots at a density from the osmolarity (NaCl ions in two colors), a fixed number of
  inside dots that crowd as it shrinks; four water arrows whose width is |Δψ| right now (thin to dashed "no net"
  lines at equilibrium, moving water drops while playing); a ψ ladder (out and in markers, "downhill" arrow,
  Δψ). Every control redraws the end state at once; "Play from the start" (and picking a system, and Run one
  trial) animates t = 0 → chosen time from `ApBioMath.osmosis.trajectory`. A "why" box explains each end state
  (turgor from ψp, plasmolysis, lysis, not yet at equilibrium). System picker is three buttons. Tap the graph to
  set the beaker concentration; the current point is a square on the curve. Desktop: stage left (sticky),
  controls right.
- **Test-yourself:** "Predict, then run" mode: random clear-cut challenge (system, solute, concentration), the
  student picks direction and end state, runs it, sees both marked and the why; recorded as
  `osmosis:predict-<system>:dir` and `:state` (topic `tonicity-osmoregulation`). `#predict` (or
  `#predict-rbc` etc.) opens in this mode, so Review's "Open the tool" link lands on a challenge.
- **Water potential absorbed:** "Calculate it: ψ practice →" link to `water-potential.html` (its quiz). That page
  is U-Bio-skills'; a back link from it to `osmosis.html` is theirs to add.
- **Owner check:** the arrows show the gap *at that moment*, so the end frame of a settled run has no arrows by
  design; Play shows them.
