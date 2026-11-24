# Plan: AP® Precalculus, Sinusoid builder

## Tool and page
`precalculus/tools/sinusoid-builder.html`; scripts `precalculus/assets/tools/sinusoid-builder.js`,
`precalculus/assets/tools/math/sinusoid-builder.js` (`ApPrecalcMath.sinusoidBuilder`), `sinusoid-builder.css`; data
`precalculus/assets/tool-data/sinusoid-builder.json`. **Premium.** Rollout row 120, group G, wave 20, marked rework (20
controls; the panel slider repeats the handles).

## The one idea
A sinusoid that fits a periodic situation is set by four things you can read off the data: the midline, the
amplitude, the period and the shift.

## Research
- Desmos "Ferris wheel" modelling activities (https://www.desmos.com/calculator, search "Ferris wheel sinusoid"):
  a rider's height beside its graph. Take: the scene beside the graph on the same vertical scale.
- PhET "Trig Tour" (https://phet.colorado.edu/en/simulations/trig-tour): the circle unrolled into the graph. Take:
  time running in the scene and on the graph together.
- GeoGebra "Fit a sinusoid to data" (https://www.geogebra.org): handles at the peak and midline. Take: handles only,
  no sliders.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Scenes: Ferris wheel, tide, spring, temperature table | scene picker beside "Show me how" |
| Model a sin(b(t + c)) + d, or cos | kept; sine or cosine as a quiet toggle on the formula |
| One slider plus a segmented choice of which parameter (cue key `apprecalc-sinusoid-builder-fit`) | gone (the handles do it; keys on each handle) |
| Handles on the graph: the peak (a and the shift), the midline (d), the next peak (the period) | main controls: the peak first (loud), then the midline and next peak (quiet until the peak is used) |
| Data points turning green when the curve passes through | kept |
| Brackets for the amplitude and the period; the formula coloured part by part | kept (solid brackets) |
| Play runs time: the scene moves and a cursor walks the graph | "Run" (secondary) |
| Why (each parameter from the data), Details (the five key points, sine or cosine, the answer) | "?" |
| Test yourself: drill, 5 contexts (transform, context, points, rate, table), exact values, no calculator; record ids `sinusoid-builder:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the scene beside its graph on one vertical scale: a Ferris wheel with a rider (height in m), a harbour
  wall with the tide line, a weight on a spring, a thermometer through a day. The data are measured points; the
  student's green curve runs over them.
- **Main control:** the peak handle (drags a and the shift together); then the midline handle and the next peak
  (period).
- **Animates:** the curve follows the handles; points turn green as the curve passes within the drawn tolerance;
  Run moves the rider, tide or spring and walks a cursor along the graph in step.
- **Cause line:** "midline at 30 m → d = 30"; "peak 25 above the midline → a = 25"; "next peak 8 min later → period 8 →
  b = 2π/8".
- **Takeaway:** "h(t) = 25 sin(2π/8 (t − 2)) + 30 fits all the points."
- **Outside:** purpose line, scene picker, Show me how, cause line, Run: 3 controls, about 20 words.

## Science to verify
b = 2π/period; the period is the reciprocal of the frequency; the phase shift sign in a sin(b(t + c)) + d (shift left
by c); the five labelled points of one cycle; rate and concavity on an interval in Precalculus words ("h is
decreasing and the rate of change of h is increasing on (2, 4)") (`docs/apprecalc-authoring-guide.md` Periodic
modeling; CED 3.7 to 3.9; OpenStax Precalculus §6.1 and §6.2; the modelling section of the same chapter). Exact values, no calculator in Test
yourself. Check the takeaway's numbers against the scene's data before shipping.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.handle` (three), `K.tap`, `K.cause`;
`ApPrecalcPlot.loop` for Run. `build-apprecalc --check`.

## Risks reviewers will likely block on
- Three handles close together on a phone (peak, next peak, midline): minimum 44 px targets, tags clear of each other.
- Dragging the peak must not change the period (rule 8: one control never moves another).
- The amplitude and period brackets from the drawn curve during a drag.
- Four scenes at flagship level: weight.
