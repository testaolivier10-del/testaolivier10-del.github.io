# Plan: AP® Precalculus, Polar graphs

## Tool and page
`precalculus/tools/polar-graphs.html`; scripts `precalculus/assets/tools/polar-graphs.js`,
`precalculus/assets/tools/math/polar-graphs.js` (`ApPrecalcMath.polarGraphs`), `polar-graphs.css`; data
`precalculus/assets/tool-data/polar-graphs.json`. **Premium.** Rollout row 127, group G, wave 23, marked rework (θ
slider in the panel; 20 controls).

## The one idea (two tabs)
1. **r as θ turns:** the curve is drawn by a distance r that changes as the angle θ turns; where |r| grows the point
   moves away from the origin.
2. **Average rate of r:** over an interval of θ, the average rate of change of r is the slope of the secant on the
   graph of r against θ.

## Research
- Desmos polar with a θ max slider (https://www.desmos.com/calculator): the curve drawn up to θ. Take: drawing as θ
  sweeps.
- GeoGebra "Polar graph and r(θ) graph linked" (https://www.geogebra.org, search "polar rectangular linked"): the
  two views side by side. Take: one orange point in both.
- PhET "Trig Tour" (https://phet.colorado.edu/en/simulations/trig-tour): the turning ray. Take: the ray as the
  dragged thing.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Polar grid and r against θ side by side (stacked on a phone), one SVG | kept |
| Sweep θ: drag on either view, the slider, Play (cue key `apprecalc-polar-graphs-play`), arrow keys | main control: the sprinkler arm on the polar view (`K.handle`); the r(θ) view scrubs (`K.scrub`); the slider goes; Play becomes "Sweep" (secondary) |
| Current point and its signed r orange in both views | kept |
| Bands where |r| increases (green) or decreases (pink), both views | kept |
| Parts with r < 0 dashed in both | a second tone, solid, labelled "r < 0: opposite side" |
| Interval: a secant on r against θ gives the average rate; the arc it covers highlighted | tab 2: two knobs on the r(θ) view (one loud, one quiet) |
| Curves rose, limaçon, cardioid, circle; settings a, b, n, cos or sin or none, interval width (in Details) | curve picker beside "Show me how"; a, b, n and cos or sin in "?" (as today) |
| Test yourself: drill, 3 contexts (convert, graph, rates); record ids `polar-graphs:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a lawn sprinkler at the origin of the polar grid: its arm points along θ, its jet reaches r, and the
  jet's tip draws the curve on the grass as a watered line. Beside or below, r against θ on graph paper with the same
  orange point. Green and pink bands on both views where the jet is lengthening or shortening.
- **Main control:** the sprinkler arm (tab 1); the secant's ends (tab 2).
- **Animates:** the arm turns and the curve grows; the jet flips to the opposite side when r < 0 (animated swing); in
  tab 2 the covered arc lights up and the secant tilts.
- **Cause line:** tab 1 (r = 1 + sin θ) "θ = π/4 → r = 1.707 → |r| increasing → moving away from the origin"; tab 2 "r from 2 to 1 over
  π/2 → average rate −0.637 per radian".
- **Takeaway:** "Where r and its rate of change share a sign, the point moves away from the origin."
- **Outside:** 2 tabs, purpose line, curve picker, Show me how, cause line, Sweep: 4 controls, about 22 words.

## Science to verify
Polar to rectangular x = r cos θ, y = r sin θ; r < 0 plots on the opposite ray; rose curves r = a cos(nθ) (n petals
for odd n, 2n for even n), limaçons and cardioids; average rate of change of r over [θ₁, θ₂]; distance from the origin
is |r| (CED 3.13 to 3.15; OpenStax Precalculus §8.3, 8.4). Precalculus words only: say "the rate of change of r", never
"dr/dθ" or "derivative" (content check). Three decimal rule.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.handle`, `K.scrub`, `K.tabs`,
`K.cause`. The BC Polar lab plan (`calcbc-polar-lab.md`) uses the same sprinkler idea; draw each in its own course
(no cross course code). `build-apprecalc --check`.

## Risks reviewers will likely block on
- The old r < 0 parts are dashed in both views: they must become solid in a second tone.
- Two views on a phone: the polar view first, both at least 160 px, the shared orange point visible in both.
- Bands from the drawn curve's |r| at each θ, not a precomputed table that can drift.
