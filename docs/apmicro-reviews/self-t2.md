# Builder T2 self-review: `cost-lab`, `firm-market` (2026-11-09)

Brief: `docs/apmicro-briefs/t2.md` and `tools-common.md`. Both trainers are built, tested and previewed. No shared
file was edited; the requests for the lead are below.

## What was built

**Cost Curve Lab (`cost-lab`, topic `short-run-costs`).**
- Explore: hire workers one at a time. Each new row of the table (L, Q, MP, TFC, TVC, TC, MC, AFC, AVC, ATC, every
  cell from `ApMicroCalc`) appears, its points land on the `costs` graph (with AFC), and the part of each curve the
  table has reached turns solid. The lowest points of AVC and ATC are ringed, with P<sub>SD</sub> and P<sub>BE</sub> on
  the price axis. Two sliders: fixed cost (ATC and AFC move, MC and AVC do not) and materials per unit (MC, AVC, ATC
  move); the old curves stay faded with an arrow. Tap a row (or arrow up and down) to see its arithmetic in the
  caption and its points on the graph. Table columns and curves share colors. On a phone one row at a time sits
  under the graph; the whole table and every formula are in Details.
- The explore firm is the engine's own `COST.firm` model in dollars (Q = 10x, wage $60): each worker's output is
  within one unit of where the model's variable cost reaches 60 L, picked so MP rises then falls and every row's MC,
  AVC and ATC sit on the drawn curves (the test checks it).
- Test yourself, 5 kinds: `table` (MP, TVC, MC = wage ÷ MP, AVC from a labor table; tap the lowest MC), `mc` (TFC, MC
  with ΔQ of 5, 10 or 20, ATC, AFC; label the axes and every curve), `min` (the outputs with the lowest AVC and ATC,
  why ATC falls; tap where MC crosses ATC), `shutdown` (shutdown and break-even prices, the decision; tap the
  shutdown point), `fixed` (a lump-sum or a per-unit cost: what MC does, shift the curves that move, the new ATC).
  Contexts: `labor`, `output`, `changes` (short-run-costs), `shutdown` (firm-decisions); `mp` step on
  production-function.

**Firm and Market Lab (`firm-market`, topic `perfect-competition`).**
- Explore, one switch for three structures. Perfect competition: the `pc` market beside the firm; a change in demand
  moves the price, carried across as d = MR = AR = P, q where P = MC, the profit or loss box shaded; "Run the long
  run" shifts supply (entry or exit) until P = min ATC (E1, E2, E3; S1 to S2). Monopoly: Q<sub>M</sub> where MR = MC,
  the dashed path up to demand and across to P<sub>M</sub>, the profit box; consumer surplus and deadweight loss
  (with the P = MC point) on request; a demand slider. Monopolistic competition: the short-run profit, then the long
  run animates demand to tangency with ATC, ringed, with the excess capacity bracket. Supply and MC share a color,
  demand and MR another, ATC and AVC a third. On a narrow stage the market and the firm are two tabs (it turns to
  the firm after a change). Market curves also move from buttons in More options, with the arrow keys.
- Test yourself, 5 kinds: `quantity` (MR = P, the output where P = MC from a table, TR, profit; tap q* on the firm at
  a higher price), `shutdown` (profit = (P − ATC) × q, TFC, produce or shut down; shade the profit or loss, or tap the
  shutdown point), `longrun` (the chain link by link: price, profit, entry or exit because of profit, shift supply
  on the graph, P back at min ATC, market quantity), `monopoly` (MR, Q where MR = MC, P from demand, profit; tap
  point M; shade the profit), `monocomp` (shade the profit, entry, shift the firm's demand left, P = ATC and P > MC,
  excess capacity). Contexts unlock with their units (3.5, 3.6, 3.7 in Unit 3; 4.2, 4.4 in Unit 4).
- Slips named: price read from MR or MC, q at the bottom of ATC, profit with AVC or without × q, the sign, demand
  shifted again by entry, costs moved by entry in monopolistic competition, consumer surplus or TR shaded for profit,
  "firms enter because demand rose", MC without dividing by ΔQ, a fixed cost moving MC, shutdown at min ATC.

**Covers**: `assets/covers/tools/apmicro/cost-lab.svg`, `firm-market.svg` (course plum and pink, drawn from the
engine's own curves), entries added to `index.json`.

## Files
`microeconomics/assets/tools/{cost-lab,firm-market}.{js,css}`, `microeconomics/assets/tools/math/{cost-lab,firm-market}.js`,
`microeconomics/data/tools/{cost-lab,firm-market}.json`, `scripts/lib/apmicro-tool-checks/{cost-lab,firm-market}.mjs`,
`scripts/test/apmicro-tool-{cost-lab,firm-market}.test.mjs`, the two covers and their `index.json` entries.
`pages.json` entries unchanged (the Phase 0 text already fits).

## What was tested
- Validators: 300 problems per context and kind, every key recomputed with the validators' own arithmetic, every graph
  key graded right and planted slips graded wrong with a feedback line. `check-apmicro-content.mjs --check`: tools 0
  failing. `node --test scripts/test/apmicro-tool-{cost-lab,firm-market}.test.mjs`: 10 of 10 pass (sweep, seeds
  repeat, explore table on the engine's curves and MC through the minimums, fixed vs per-unit cost columns, pc
  price carried across, long run at min ATC, MR = MC with P from demand, monopolistic long run at zero profit with
  excess capacity, planted mistakes caught).
- Preview at 1280 and 360, light and dark (scratch build in `/tmp/mic-t2`, port 8812): first load, all rows hired,
  a row selected, fixed cost and materials changed, demand up and down, the long run, monopoly with CS and DWL,
  monopolistic long run, and drills walked to the end (wrong answers, Show the answer, worked solution, Keep going).
  No console errors, no horizontal scroll. Fixed on the way: phone stage overflow (graph sized to leave the row
  card), table cut off at 1280, curve labels not matching curve colors, the d = MR = AR = P label over AVC, the
  excess capacity text over D2 and MR2, the drill's long-run graph not showing the demand change (now `show`).

## Requests for the lead (shared files; worked around locally)
1. **`mic-graph.js` check() refuses `slips.point`** ("not a curve, line or region") although `mic-grade.js` reads
   `spec.slips.point` for a misplaced point. Allow it in check(): in the slips loop add `c === 'point' ||` to the
   accepted names. Workaround: I rely on `POINT_HINT` (the `firm` hint is good).
2. **The line label of a two-panel kind can sit on the curve labels in the right margin** (pc firm panel: "d = MR =
   AR = P" over "AVC" when the price is near 6). In `svgPanel`, place the line label through `place()` (or push its
   box into `placed` before the curve labels are placed, so the curve labels avoid it). Workaround: `declutter()` in
   `firm-market.js` moves the line label to the nearest clear height.
3. **Old curve numbers follow the old point's number** (`n0` is used for E and for the faded curve labels), so a long
   run drawn as E2 to E3 labels the original supply "S2". Add `state.curveN0` (default `n0`) for faded curve labels.
   Workaround: a regex in `firm-market.js` relabels S and D in the long run.
4. Nice to have: an option to leave a follower's old label out (the faded MR1 crowds the axis in monopolistic
   competition; I drop it locally).

## Open points
- The explore graphs on a 1280 stage are about 400 px wide beside the table (cost-lab) or 380 px per panel
  (firm-market): readable, Enlarge works, but the stage has spare height. A taller stacked layout could come later.
- Firm-market explore stays within two demand steps, so the pc price never falls below min AVC there; shutdown is
  taught in its drill and in cost-lab (the engine's pc steps cannot draw P below min AVC).
- `pages.json` lists `cost-lab` as kind `skill` (hub group "Skills tools") while its data file is `simulator` (what the
  Phase 0 frame check expects); left as Phase 0 set it.
