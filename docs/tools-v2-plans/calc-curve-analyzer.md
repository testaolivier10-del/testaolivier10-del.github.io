# Plan: AP® Calculus AB, Curve analyzer

## Tool and page
`calculus/tools/curve-analyzer.html`; scripts `calculus/assets/tools/curve-analyzer.js`,
`calculus/assets/tools/math/curve-analyzer.js` (`ApCalcMath.curveAnalyzer`), `curve-analyzer.css`; data
`calculus/assets/tool-data/curve-analyzer.json`. **Premium.** Rollout row 93, group G, wave 16, marked rework (cursor
slider in the panel; Curves and Optimize are two lessons; 18 controls).

## The one idea (two tabs)
1. **Read f from f′:** where f′ is positive f rises, where f′ changes sign f turns, where f″ changes sign f bends the
   other way.
2. **Best size:** the best design is where the objective stops rising and starts falling (its derivative is 0),
   checked at the ends.

## Research
- PhET Calculus Grapher (https://phet.colorado.edu/en/simulations/calculus-grapher): f, f′, f″ stacked with one
  reference line. Take: one vertical cursor through all three, one colour each.
- GeoGebra "open box optimization" (https://www.geogebra.org, search "open box problem"): a sheet with corner squares
  that folds into a box as the cut grows. Take: the fold animation; leave: separate sliders.
- Desmos "first derivative test" activities: sign charts built from the graph. Take: signs placed only where the
  cursor has been.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Curves: f, f′, f″ stacked on one x axis (crimson, blue, green) | tab 1 |
| Vertical cursor: drag across the graphs, the slider, arrow keys (cue "Move the cursor, or drag across the graphs") | the hiker's knob on the road (`K.handle`); the slider goes |
| Sign charts of f′ and f″ building left to right | kept: trail markers placed where the hiker has walked |
| Critical points and inflection points marked on f, each with its justification sentence | marked on the road as they are reached; the sentence in the cause line |
| Candidates test on a closed interval (in "Formulas & numbers") | "?" |
| Curves: cubic, quartic, x·e⁻ˣ, cusp, 2 sin x − x, 4x/(x² + 1) | curve picker beside "Show me how" (tab 1) |
| Optimize: open box from a sheet, fence along a river, soda can, each with a slider for the one quantity | tab 2: scene picker; the quantity dragged on the scene |
| Objective and its derivative graphed under the scene | kept, small, under the scene |
| Test yourself: drill (contexts incdec, extrema, candidates, concavity, fgraph, optimize); record ids `curve-analyzer:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** the Tangent tracer's road over hills (f), a hiker walking it. Under it, two thin strips on the
  same x: "uphill / downhill" (the sign of f′, blue) and "bowl / cap" (the sign of f″, green), filled in only where
  the hiker has been, with f′ and f″ drawn as faint curves on them. A summit flag at a maximum, a valley flag at a
  minimum, a bend marker at an inflection; a cusp is a sharp ridge.
- **Tab 1 main control:** the hiker (`K.handle` on the road, keys; stops at critical points).
- **Tab 2 picture:** the real scene drawn: a sheet of card whose corners are cut and folded into an open box; a
  fence along a river bank; a soda can that grows taller and thinner. The objective (volume, area, metal used) on
  the small graph below with a point at the current size.
- **Tab 2 main control:** the cut size (drag the corner square), the fence's depth (drag the fence), the can's
  radius (drag its rim).
- **Animates:** the hiker walks, markers drop in; the box folds as the cut changes; the can morphs; the point moves on
  the objective graph.
- **Cause line:** tab 1 "f′ changes from + to − at x = 1 → f has a relative maximum at 1"; tab 2 "cut x → V′(x) = 0 →
  largest volume" (numbers from the model).
- **Outside:** 2 tabs, purpose line, picker, Show me how, cause line, "Walk across" (tab 1): 4 controls, about 22
  words.

## Science to verify
First and second derivative tests, candidates test on a closed interval, inflection where f″ changes sign (not where
f″ = 0 alone), a cusp is a critical point where f′ does not exist (CED 5.3 to 5.12; OpenStax Calculus Volume 1 §4.3
to 4.7). Box V = x(L − 2x)(W − 2x) on 0 < x < W/2; fence area with one side on the river; the can's least metal at
h = 2r for a fixed volume. Name the function in every justification ("f′ changes from positive to negative").

## Reuse
`ApCalcTools.studioKit2`, `K.handle`, `K.tabs`, `K.cause`; the Tangent tracer's road and car (the car becomes a
hiker); the model's critical point list. AB build byte-identical.

## Risks reviewers will likely block on
- Sign strips must never show a sign where the hiker has not been, and must match f′ exactly at the stop points.
- The box fold must keep the volume shown equal to the drawn box at every frame of the fold.
- Labels "max", "min", "inflection" on a phone: one per marker, clear of the hiker's tag.
- Optimize scenes are three drawings: weight budget for the course page (measure).
