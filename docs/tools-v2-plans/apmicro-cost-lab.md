# Plan: AP® Microeconomics, Cost lab (tools v2)

## Tool and page
- Page `microeconomics/tools/cost-lab.html`; scripts `microeconomics/assets/tools/cost-lab.js` and `.css`, model
  `microeconomics/assets/tools/math/cost-lab.js`, data `microeconomics/data/tools/cost-lab.json` (contexts labor,
  output, changes, shutdown).
- Premium. Rollout row 140, group E, wave 24.

## The one idea
As a firm hires, marginal cost falls then rises, and MC crosses AVC and ATC at their lowest points. One screen; the
fixed cost and per unit cost are quiet connected controls (they show what moves which curve).

## Research
- Wolfram Demonstrations, Short Run Cost Curves ([demonstrations.wolfram.com](https://demonstrations.wolfram.com/ShortRunCostCurves/),
  search result only): sliders beside the curves. Take what to avoid.
- Cost curves visualizer, D. McCreary ([dmccreary.github.io](https://dmccreary.github.io/economics-course/sims/cost-curves-visualizer/),
  search result only).
- EconGraphs firm theory ([econgraphs.org/topics/firm](https://www.econgraphs.org/topics/firm/)): curves from one
  cost function, the minimums marked.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Hire worker button, one row at a time (TP, MP, TFC, TVC, TC, MC, AFC, AVC, ATC) | Explore: main control, drag the number of workers |
| Points landing on the curves; reached part of each curve turns solid | Kept |
| Fixed cost (rent, a day) slider; materials per unit slider; old curves faded with an arrow | Explore: quiet knobs on the rent sign and the materials crate |
| Tap or arrow through table rows, row's points light, caption shows its arithmetic | Explore: the row for the current worker count on the picture; full table in "?" |
| Table beside the graph (wide), one row under the graph (phone) | Table to "?"; the current row stays on the picture |
| Drill kinds table, mc, min, shutdown, fixed; table figure on the stage; `cost-lab:<context>:graph` | Test yourself unchanged |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Picture: a small bakery kitchen with one oven (the fixed plant). Drag the staff count (a knob on the kitchen door):
  bakers come in, loaves pile on the counter (total product). The first bakers add many loaves; later ones crowd the
  one oven and add fewer, so diminishing returns is seen. The graph beside it (price and cost on the axis): MC, AVC
  and ATC (and AFC) from `ApMicroGraph` `costs`, the current output's points on each, the curves solid up to it.
- MC is drawn passing through the minimum of AVC and of ATC, with those minimums labeled ("min AVC", "min ATC").
- Quiet: the rent sign (fixed cost): ATC and AFC move, MC and AVC stay; the materials crate (per unit cost): MC, AVC
  and ATC move. The old curve stays faint solid with subscript 1.
- Cause line: "5th baker adds 8 loaves → each loaf's extra cost $2.50 → MC rising".
- Takeaway: "MC cuts the averages at their lowest points."
- Outside the picture: purpose line, Show me how. About 15 words.

## Science to verify
- MC = ΔTC / Δq (not per worker); MP from the table; AFC, AVC, ATC formulas (`ApMicroCalc`).
- MC through minimum AVC and ATC exactly (`costModel` cubic); diminishing marginal returns cause rising MC.
- Fixed cost moves ATC and AFC only; a per unit cost moves MC, AVC and ATC; a lump sum tax changes ATC only (trap).
- Shutdown at minimum AVC, break even at minimum ATC (for the drill text and "?").

## Reuse
- `K.drag` for the staff count and quiet knobs; `ApMicroGraph` `costs` with `oldLabels`; drill unchanged.
- 2026-11-10 review: the graph had no cost numbers and curves ran off the top when materials rose; fix with a dollar
  axis that rescales smoothly (animated, never a jump).
- Not the first Micro kit2 tool in rollout order.

## Risks reviewers will likely block on
- Curve labels MC, ATC, AVC, AFC crowding where the curves meet near the minimums; measured label boxes.
- Loaf count proportional to total product; bakers fit in the kitchen at 360 px (one element each, perf).
- Axis rescale must animate and the labels must agree mid change.
- Byte identical: `build-apmicro --check` and `build-apmacro --check`.
