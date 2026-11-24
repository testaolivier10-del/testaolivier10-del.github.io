# Plan: AP® Precalculus, Function lab

## Tool and page
`precalculus/tools/function-lab.html`; scripts `precalculus/assets/tools/function-lab.js`,
`precalculus/assets/tools/math/function-lab.js` (`ApPrecalcMath.functionLab`), `function-lab.css`; data
`precalculus/assets/tool-data/function-lab.json`. **Free.** Rollout row 117, group G, wave 20, marked restyle (control
on the picture; a panel slider repeats it; 20 controls).

## The one idea
g(x) = a·f(b(x − h)) + k: h and k slide the graph, a stretches it up and down, b squeezes it sideways, and every point
moves by the same rule.

## Research
- PhET "Graphing Quadratics" (https://phet.colorado.edu/en/simulations/graphing-quadratics): handles on the vertex
  and a point. Take: two handles, nothing else needed to play.
- Desmos transformations activities (https://www.desmos.com/calculator): sliders for a, b, h, k. Leave the sliders.
- GeoGebra "Transformations of functions" (https://www.geogebra.org): the parent kept for reference. Take: the parent
  as a quiet reference line, labelled.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Parents: linear, quadratic, cubic, absolute, square root, reciprocal, piecewise, exponential, logarithmic, sine | parent picker beside "Show me how" |
| Parent as a ghost | a thin solid grey line labelled "parent" (no dashes) |
| Square handle (h, k): drag to translate | main control, kept (`K.handle` in 2D) |
| Round handle on a key point: up and down for a, sideways for b (cue key `apprecalc-function-lab-drag`) | kept, quiet until the first handle is used |
| "Pick one parameter and slide it" (panel slider) | gone (handles and their keys do it) |
| Formula, a sentence in words, table of key points (same colours on graph and table), features (zeros, asymptotes, domain, range, end behavior in limit notation) | formula as the cause line; the table and features in "?" |
| "Play the steps": the four changes in the order they act | "Show the steps" (secondary) |
| Test yourself: drill, 5 contexts (identify, point-map, describe, rational, exponential); record ids `function-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the graph as a bent steel wire on a pegboard grid (the exact axes); the parent's shape is a thin grey
  wire behind it. Two pins hold the wire: the square pin at (h, k) and the round pin on a key point. Key points are
  small beads on the wire that keep their colours as it moves.
- **Main control:** the square pin; the round pin second.
- **Animates:** the wire slides, stretches and squeezes with the pins; Show the steps plays horizontal shift,
  stretch, reflect, vertical shift in order, each named for a moment on the wire.
- **Cause line:** "k = 2 → every point up 2"; "a = −2 → flipped and twice as tall"; "b = 2 → half as wide".
- **Takeaway:** "Every point moves the same way: (x, y) → (x/b + h, a·y + k)."
- **Outside:** purpose line, parent picker, Show me how, cause line, Show the steps: 3 controls, about 20 words.

## Science to verify
The order of transformations for a·f(b(x − h)) + k and the point map (x, y) → (x/b + h, ay + k); b factored out
first when describing; asymptotes of a/(x − h) + k and of exponentials in limit notation; domain and range of each
parent (OpenStax Precalculus §3.5; CED 1.12 to 1.14 and 2.x). Open vs closed endpoints on increasing intervals are
not graded (`docs/apprecalc-authoring-guide.md`). No calculus words.

## Reuse
`ApPrecalcTools.studioKit2` (from the first Precalculus kit2 tool), `"kit2": true` in `precalculus/data/pages.json`;
`K.handle` on `pcalc-plot.js`'s layer (the rollout's wave 20 piece: "`K.handle` on `pcalc-plot.js`"; if this is the
first Precalculus graph explorer, it wires the handle to the plot's coordinate map, small), `K.cause`.
`build-apprecalc --check`.

## Risks reviewers will likely block on
- The round pin's sideways drag for b near h: b must not jump to huge values (cap |b| and stop at 0).
- Asymptotes (reciprocal, log) drawn as solid thin lines labelled, never dashed.
- Pins never cover the beads' labels; the parent label clear of the wire.
