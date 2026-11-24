# Plan: AP® Precalculus, Unit circle

## Tool and page
`precalculus/tools/unit-circle.html`; scripts `precalculus/assets/tools/unit-circle.js`,
`precalculus/assets/tools/math/unit-circle.js` (`ApPrecalcMath.unitCircle`), `unit-circle.css`; data
`precalculus/assets/tool-data/unit-circle.json`. **Free.** Rollout row 121, group G, wave 23, marked restyle (control on
the picture; a panel slider repeats it).

## The one idea (two tabs)
1. **Sine and cosine:** as P turns through θ radians (the arc length), its height is sin θ and its across is cos θ,
   and unrolling the turn draws their graphs.
2. **Tangent:** tan θ is the slope of OP, read where OP's line meets x = 1.

## Research
- PhET "Trig Tour" (https://phet.colorado.edu/en/simulations/trig-tour): drag a point on the circle, the graph of
  sin, cos or tan traces beside it. Take: the drag on the circle and the trace beside.
- Desmos unit circle (https://www.desmos.com/calculator, search "unit circle"): the reference triangle. Take: the
  legs coloured as the two functions.
- 3Blue1Brown / Mathigon "Circles and Pi" (https://mathigon.org/course/circles): a wheel rolling to unroll its arc.
  Take: the rolling wheel that lays the arc flat.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Drag P (cue key `apprecalc-unit-circle-drag`), the slider, arrow keys | main control P (`K.handle` on the circle, keys snapping to multiples of π/12 with Shift); the slider goes |
| Arc from (1, 0) to P in green (radians are arc length) | kept |
| Reference triangle: cos θ blue leg, sin θ red leg | kept |
| Graphs of sin and cos unrolling up to θ, the arc laid flat on the θ axis | kept |
| "tan" view: slope of OP, the line x = 1, the tangent graph | tab 2 |
| Play unrolls one full turn (reduced motion: the end state) | "Roll one turn" (secondary) |
| Table of special angles (tap a row to go there), labels, degrees | "?" (rows still jump P there) |
| Why | "?" |
| Test yourself: drill, 5 contexts (radian, coords, ray, values, graphs), the figure filling in, a wrong number drawn; record ids `unit-circle:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a bicycle wheel of radius 1 with its valve at P, standing on the θ axis. As P turns, the wheel rolls
  along the axis so the arc it has turned lies flat (green) on the ground; the valve's height above the hub is sin θ
  (red) and its across from the hub cos θ (blue), and both graphs grow behind the wheel as it rolls. Tab 2: a light
  beam from the hub through the valve hits a signpost at x = 1; its height there is tan θ.
- **Main control:** P on the rim.
- **Animates:** the wheel rolls as P moves; the arc unrolls; the graphs extend; at θ = π/2 in tab 2 the beam runs
  parallel to the post and the label says "undefined".
- **Cause line:** "θ = π/6 → arc length 0.524 → sin 1/2, cos √3/2"; tab 2 "slope of OP = sin/cos = 0.577 = tan θ".
- **Takeaway:** "Sine is the height, cosine the across, for an arc of θ on a circle of radius 1."
- **Outside:** 2 tabs, purpose line, Show me how, cause line, Roll one turn: 4 controls, about 20 words.

## Science to verify
Radian measure as arc length on the unit circle; (cos θ, sin θ) coordinates; reference angles and exact values;
tan θ = sin θ / cos θ as the slope of the terminal ray, undefined at π/2 + kπ; sine and cosine graphs as the unrolled
coordinates (CED 3.2 to 3.5, 3.8; OpenStax Precalculus §5.1 to 5.4). Exact values in labels; decimals to three places.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.handle` (a point on a circle; BC
Polar lab uses the same pattern in its own course), `K.tabs`, `K.cause`; `ApPrecalcPlot.loop`. `build-apprecalc
--check`.

## Risks reviewers will likely block on
- The rolling wheel must not leave the picture after one turn (the graph scrolls, or the window holds 0 to 2π).
- Leg labels (sin, cos) and the angle label inside a small circle on a phone.
- tan near π/2: the post height clamps at the picture edge, label "→ ∞".
