# Builder T3 self-review: surplus-lab, elasticity-lab (2026-11-09)

## What was built

**Surplus and Policy Lab** (`surplus-lab`, Premium, topic `government-intervention`).
- Explore: one market (iced tea, demand from $20, supply from $0, 50 bottles at $10). Policy row: no policy,
  ceiling, floor, tax, subsidy, world price, tariff; one slider for its level (the policy grows in, 550 ms, off
  with reduced motion). ApMicroGraph draws the graph and its area cells; the page colors each cell by the area it
  belongs to (CS blue, PS green, revenue or cost gold, gain teal, DWL red; the subsidy cost outlined because it
  overlaps CS and PS), with value chips in the same colors and total surplus against the no-policy value. Tap a
  chip or an area to show that area alone. Why: the policy's story; Details: before and after table with the
  formula, and "Who pays a tax" (incidence by elasticity on a linear market of its own, split bar).
- Test yourself, 7 kinds in 5 contexts (`surplus` 2.6, `controls`/`taxes`/`subsidies` 2.8, `trade` 2.9): surplus
  at equilibrium, ceilings and floors, taxes, who pays a tax (linear equations, no graph), subsidies, free trade,
  tariffs. Steps: shade (graph `shade` task on the problem's own graph, a fresh graph per shade step), num,
  choice. Slips named: tax revenue or subsidy cost at the old quantity, the subsidy rectangle only out to QE
  ("only part ... NEW, larger quantity"), DWL vs revenue vs transfer, one tariff triangle, a missing one half,
  the shortage measured from QE, "supply is greater than demand", statutory incidence.

**Elasticity Lab** (`elasticity-lab`, free, topic `price-elasticity-demand`).
- Explore, three views: Price (demand with its elastic and inelastic halves and the unit-elastic midpoint; drag A
  or use the slider, B is $2 lower; TR rectangle at A and the TR hill beside it in the same colors; arc |Ed| from
  starting values or the midpoint method from More options), Income (necessity, luxury, inferior; income change
  shifts demand, Q1 to Q2 at $10, signed elasticity), Cross-price (substitute, complement, unrelated).
  Details: the table along the curve (P, Q, TR, point |Ed|).
- Test yourself, 5 kinds in 2 contexts (`ped` 2.3, `other` 2.5): |Ed| from two points (starting values, or
  the midpoint method, labeled; both methods always classify the same), the total revenue test from a schedule,
  elastic and inelastic ranges on a drawn line, income elasticity, cross-price elasticity; the last two end with
  a `shift` graph step (demand, the direction from the sign). Slips: inverted ratio, the other method, the minus
  sign kept on |Ed|, the sign dropped on income or cross elasticity, P + Q for TR, supply shifted.

## Tests and checks
- Validators sweep 300 problems per context and kind, every key recomputed by hand (closed-form market,
  percent changes), every shade region measured on `ApMicroGraph.areas` (polygon area x kP x kQ) and matched to
  the number the next step keys, planted slips graded wrong with a line. Both clean;
  `check-apmicro-content --check`: tools 0 failing.
- `node --test scripts/test/apmicro-tool-surplus-lab.test.mjs` 7/7, `...elasticity-lab.test.mjs` 6/6,
  `apmicro-build.test.mjs` 15/15 (pages fixture equal).
- Screenshots (Playwright, scratch build `/tmp/mic-t3`, port 8813) at 360 and 1280, light and dark: landing,
  every policy, Why and Details sheets, each drill kind, a wrong shade, Show the answer, a wrong shift. Fixed on
  the way: chips over the graph on a phone, the drill graph not using the stage, axis marks touching (QE/QSUB,
  QS1/QS2), the old-curve label on the shift arrow, the Enlarge button over the legend and the Start over button,
  grab strokes swallowing taps on areas. No console errors (only blocked third-party requests in the sandbox).

## Requests for the lead (shared files; worked around locally)
1. `mic-graph.js` `policyLayer` and `marks`: axis marks are centered on their values, so close values touch
   (QE and QSUB or QT for a 1-step policy, QS1/QS2 and QD2/QD1 for a tariff, PE and PW + t). Add the measured
   spread both tools now do after drawing (`spreadMarks` in `surplus-lab.js`): sort each axis's marks and push
   each clear of the last by 3 units. Until then the drills keep taxes and subsidies at 2 or 3 steps and gaps of
   1.5 or more.
2. `mic-graph.js` `svgPanel`: when `do` has no shift, give `.mic-gr-grab` `pointer-events:none` (today the 24 px
   invisible stroke of a curve eats taps on the area cells it crosses; both tools add this in their CSS).
3. `mic-graph.js`: a `demand` kind (D alone; regions `tr` at a named price; named point `unit-elastic`) for the
   Elasticity Lab. It now draws `sd` and strips S, the starting dot, its guides and marks with regular
   expressions (`demandSvg` in `elasticity-lab.js`), which breaks if the SVG markup changes.
4. `mic-graph.js`: a slope option for `sd-micro` (`slopes: { D, S }`, for example 0.5, 1 or 2), so a tax's
   incidence by elasticity can be drawn and shaded; today D and S are always equally steep, the tax always
   splits evenly on the graph, and the lab shows incidence on a linear market in numbers instead.
5. `mic-graph.js` `labelAway`: for a shift under one step the old curve's label sits on the shift arrow (both
   at x near 2); the Elasticity Lab's shift view places its own labels and arrow.

## Open points
- The page's scratch preview needs `APMICRO_PUBLISHED`; both tools build only once their topics are published.
- `pages.json`: elasticity-lab's `kind` changed from `skill` to `simulator` (it has an Explore simulator; the
  Phase 0 validator already expected `simulator`); its desc rewritten. Copied to the fixture.
- Midpoint method: offered and labeled, never the only route (spec section 2, needs-author `ced-text`).
- Goods are generic and invented (kelp bars, bike locks); the trade countries are Kestavia, Orlund and Pellaro
  (searched: not used elsewhere in `microeconomics/data` at build time).
