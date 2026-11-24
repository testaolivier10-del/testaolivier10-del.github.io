# Plan: AP® Precalculus, Rate of change

## Tool and page
`precalculus/tools/rate-of-change.html`; scripts `precalculus/assets/tools/rate-of-change.js`,
`precalculus/assets/tools/math/rate-of-change.js` (`ApPrecalcMath.rateOfChange`), `rate-of-change.css`; data
`precalculus/assets/tool-data/rate-of-change.json`. **Free.** Rollout row 118, group G, wave 20, marked restyle
(control on the picture; width slider in the panel).

## The one idea (two tabs)
1. **Rates over equal intervals:** if the average rates over equal intervals keep increasing, the graph is concave
   up; if they keep decreasing, concave down.
2. **Estimate on a secant:** a value read on a secant line is an overestimate or an underestimate depending on the
   concavity on that interval.

## Research
- Desmos "Average rate of change" activities (https://www.desmos.com/calculator): a secant through two dragged
  points. Take: the slope written on the secant.
- GeoGebra "Concavity and rates of change" (https://www.geogebra.org): secants over equal steps with slopes compared.
  Take: the slopes as bars side by side.
- PhET "Graphing Slope Intercept" (https://phet.colorado.edu/en/simulations/graphing-slope-intercept): rise and run
  drawn. Take: rise and run on the secant.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Contexts: taxi, ball, cubic, cooling, growth, learning | context picker beside "Show me how" |
| Secants: 2 to 4 equal intervals, each its own colour and slope; slope bars below; verdict | tab 1 |
| Drag the start point along the curve (cue key `apprecalc-rate-of-change-drag`) | main control, tab 1 (`K.handle` on the curve) |
| Interval width slider (panel) | quiet knob at the first interval's end on the picture |
| Number of intervals (2 to 4) | quiet three way toggle on the picture |
| Estimate: drag the two ends of a secant and the input; estimate on the secant, true value on the curve, the gap shaded and explained by concavity | tab 2: three knobs (two ends quiet, the input loud) |
| Why, Details | "?" |
| Test yourself: drill, 4 contexts (aroc, estimate, concavity, quadratic); record ids `rate-of-change:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the context drawn above its graph: a taxi with its meter, a ball in flight against a building, a mug
  of coffee cooling with a thermometer, a growing plant, a learner's practice log. Equal intervals are marked as
  stopwatch ticks on the time axis; each secant is a coloured ramp with its slope on it; beside the graph, the slopes
  as bars in the same colours.
- **Main control:** tab 1 the start point; tab 2 the input x.
- **Animates:** secants slide and re tilt; bars grow or shrink; in tab 2 the gap between the estimate and the true
  value fills in its colour.
- **Cause line:** tab 1 "slopes 4.9, 2.1, −0.8 → the rate of change is decreasing → concave down"; tab 2 "concave down
  on [2, 5] → the graph lies above the secant → the estimate is an underestimate".
- **Outside:** 2 tabs, purpose line, context picker, Show me how, cause line: 3 controls, about 22 words.

## Science to verify
Average rate of change as the slope of the secant line through (a, f(a)) and (b, f(b)), naming the secant; concavity
from successive rates over equal intervals; over or under from concavity on the stated interval; quadratics' rates
change by a constant 2aw over equal steps w (`docs/apprecalc-authoring-guide.md` "Rates of change and concavity";
CED 1.2 to 1.6; OpenStax Precalculus §1.3). Never "increasing at a decreasing rate" or "instantaneous rate" (the
content check refuses them): say "the rate of change of f is decreasing". Three decimal rule.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.handle`, `K.tabs`, `K.tap`,
`K.cause`. `build-apprecalc --check`.

## Risks reviewers will likely block on
- Precalculus wording in the cause line and every label (content check words).
- Four secant slopes on a phone: slope labels on the bars, not on the ramps, to keep 4 px clear.
- Six context drawings: weight; draw them small and above the graph, never covering it.
