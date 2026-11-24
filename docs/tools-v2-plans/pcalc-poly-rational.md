# Plan: AP® Precalculus, Polynomials and rationals

## Tool and page
`precalculus/tools/poly-rational.html`; scripts `precalculus/assets/tools/poly-rational.js`,
`precalculus/assets/tools/math/poly-rational.js` (`ApPrecalcMath.polyRational`), `poly-rational.css`; data
`precalculus/assets/tool-data/poly-rational.json`. **Premium.** Rollout row 128, group G, wave 23, marked restyle
(control on the picture; 81 words on the stage).

## The one idea
Each factor leaves its own mark on the graph: a zero (crossing or touching), a vertical asymptote, or a hole, and
the leading terms decide the ends.

## Research
- Desmos "Polynomial Graphing" / "Card sort: rational functions" (https://www.desmos.com/calculator): zeros dragged on
  the axis. Take: the zero as a point on the axis you drag.
- GeoGebra "Multiplicity of zeros" (https://www.geogebra.org): cross vs touch vs flatten. Take: the local shape
  drawn bigger at the zero.
- PhET "Graphing Quadratics" (https://phet.colorado.edu/en/simulations/graphing-quadratics): root markers on the
  axis. Take: labels on the point itself.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Factors each with a colour (formula, pin, dock, tables) | kept |
| Drag a pin along the x axis or arrow keys (cue key `apprecalc-poly-rational-pin`) | main control (`K.handle` per pin; the first loud) |
| Tap a factor in the dock: Zero / Asymptote / Hole, multiplicity − and +, Remove | tap the pin itself: a small ring of four choices on the picture (zero, asymptote, hole, remove) and − / + for multiplicity beside the pin while it is selected |
| "+ factor" chip (add a factor, up to the model's maximum) | a "+ stake" button at the end of the ground (quiet) |
| Leading coefficient a slider (behind "More") | quiet knob at the right end of the curve |
| Presets: hole, cubic, touch, quartic, ha, asym, double, slant ("Start from") | preset picker beside "Show me how" |
| Curve broken at asymptotes; zeros cross or touch; VA arrows for both one sided limits; holes as open circles; horizontal or slant asymptote; sign chart under the graph | kept (all solid lines; the sign chart a strip under the axis) |
| Caption (the chosen factor in words and limit notation), Why (every feature), Formulas and tables | cause line for the chosen factor; the rest in "?" |
| Test yourself: drill, 6 contexts (zeros, end, ha, rzeros, va, hole), the figure building, a wrong x drawn where you put it; record ids `poly-rational:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the x axis is the ground with coloured stakes (the factors); the curve is a rope. A zero stake holds
  the rope to the ground (it crosses, or for an even multiplicity bounces back); an asymptote stake is a tall pole the
  rope climbs and never reaches, both sides arrowed; a hole stake leaves a ring in the rope (an open circle). The
  sign strip under the ground is green above, red below, in step with the rope.
- **Main control:** drag a stake; tap it for its kind.
- **Animates:** the rope re hangs smoothly when a stake moves or changes kind (morph of the curve); the ring appears
  or closes; poles rise from the ground.
- **Cause line:** "(x − 2)² → double zero at 2 → touches and turns"; "(x + 1) below → vertical asymptote at −1 →
  f(x) → −∞ as x → −1⁻".
- **Takeaway:** "Top factors make zeros, bottom factors make asymptotes, shared factors make holes."
- **Outside:** purpose line, preset picker, Show me how, cause line: 2 controls, about 20 words.

## Science to verify
Zeros and multiplicity (odd crosses, even touches); end behaviour of polynomials from the leading term; rational
functions: zeros from numerator factors not cancelled, vertical asymptotes from denominator factors not cancelled,
holes from common factors with the hole's y value; horizontal asymptote by degrees; slant asymptote when the
numerator's degree is one more (CED 1.5 to 1.11; OpenStax Precalculus §5.3 to 5.6). Limit
notation for end behaviour and asymptotes, never a limit computation (`docs/apprecalc-authoring-guide.md`). No
calculus words.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.handle`, `K.tap`, `K.cause`. The
model already builds every feature. `build-apprecalc --check`.

## Risks reviewers will likely block on
- Two stakes at the same x (a hole on a zero): the model's rule decides; the picture must show the same thing.
- The kind ring around a stake on a phone: 44 px targets that stay inside the picture.
- Pole labels and their one sided limit arrows clear of the curve label at 360 px.
- The rope near a pole at CPU x4: sample adaptively, clip at the picture edge.
