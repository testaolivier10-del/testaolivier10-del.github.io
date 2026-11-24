# Plan: AP® Precalculus, Exponential and log lab

## Tool and page
`precalculus/tools/exp-log-lab.html`; scripts `precalculus/assets/tools/exp-log-lab.js`,
`precalculus/assets/tools/math/exp-log-lab.js` (`ApPrecalcMath.expLogLab`), `exp-log-lab.css`; data
`precalculus/assets/tool-data/exp-log-lab.json`. **Premium.** Rollout row 85, group G, wave 20, marked rework (four
lessons; two sliders in the panel; listed in rollout question 3 as a tool with four lessons).

## The one idea (four tabs, one each; each tab appears with its topic as today)
1. **Add or multiply:** a linear function adds the same amount each step; an exponential multiplies by the same
   factor.
2. **Inverse:** y = log_b x undoes y = bˣ: every point (a, c) becomes (c, a), a mirror in y = x.
3. **Log rules:** logs turn multiplying into adding lengths.
4. **Semi-log:** exponential data plotted as log y against x fall on a line, and the line gives a and b.

## Research
- PhET "Graphing Lines" and Desmos activity "Exponential vs linear" (https://www.desmos.com/calculator): step tables
  under a graph. Take: the step arrows on the table and the graph together.
- A real slide rule simulator (search "slide rule simulator", e.g. https://www.antiquark.com/sliderule/sim/): log
  scales that add lengths to multiply. Take: the slide itself as the control for tab 3.
- GeoGebra "Inverse functions reflection" (https://www.geogebra.org): fold across y = x. Take: the fold.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Four views in a dock switch, each unlocking with its topic | four tabs, each shown once its topic unlocks (same check) |
| Ratios: L(x) = a + mx (blue) and E(x) = a·bˣ (green) from one start; two sliders (cue key `apprecalc-exp-log-lab-slider`) | tab 1: m and b as quiet knobs on the two jars; the main control is the step (below) |
| Step table under the graph; tap a step on the graph or the table, marked in both | the jars' step labels; the table in "?" |
| Inverse: bˣ and log_b x mirrored in y = x; drag the point and its mirror swaps coordinates; Reflect folds one graph onto the other | tab 2: drag the point (`K.handle` on the curve); "Fold" (secondary) |
| Log rules: bars at u and v stack to uv (product), subtract (quotient), k copies (power) | tab 3: the slide rule (below); product, quotient, power as a three way toggle |
| Semi-log: data sets bacteria, drug, savings, linear; y against x then log₁₀ y against x (animated) | tab 4: data picker; "Straighten" (main control: a two state switch on the axis) |
| Why, Details | "?" |
| Test yourself: drill, 5 contexts (table, model, inverse, rules, semilog), figure building, a wrong value drawn; record ids `exp-log-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** two glass jars on a shelf filling with coins, step by step: the left jar gains the same handful
  each step (+m), the right jar's pile is multiplied (×b) and soon towers over it; behind them the two graphs with
  the same steps. **Main control:** the step knob x (`K.drag` along the shelf).
- **Tab 2 picture:** the graph on a sheet of tracing paper folded along y = x; the point and its mirror are two pins
  through the paper. **Main control:** the point on bˣ.
- **Tab 3 picture:** a slide rule drawn in wood and brass: slide the middle scale so its 1 sits over u; read uv under
  v. Lengths on the scales are log values. **Main control:** the slide.
- **Tab 4 picture:** data on graph paper; Straighten re scales the y axis to log₁₀ y (animated), the points swing onto
  a line, and the line's slope and intercept read log b and log a.
- **Animates:** coins drop; the fold; the slide; the axis re scale.
- **Cause line:** tab 1 "step 4 → L = 2 + 4·3 = 14 → E = 2·2⁴ = 32"; tab 3 "log 2 + log 3 = log 6"; tab 4 "slope 0.301
  → b = 10^0.301 = 2.000".
- **Outside:** 4 tabs, purpose line, one picker (tab 4), Show me how, cause line: 3 to 4 controls, about 22 words.

## Science to verify
Arithmetic vs geometric change over equal steps; inverse of bˣ is log_b x, b > 0, b ≠ 1; product, quotient and power
rules for logs; semi-log linearization log y = log a + x log b (OpenStax Precalculus §4.1 to 4.7; CED Unit 2, 2.1 to
2.15). Three decimal rule for every shown decimal; constants stored, never rounded partway
(`docs/apprecalc-authoring-guide.md`). A slide rule multiplies by adding log lengths: check the drawn scale positions
against log₁₀ to the pixel. No calculus words.

## Reuse
`ApPrecalcTools.studioKit2` (added by the first Precalculus tool; check `claude/tools-v2-all`), `"kit2": true` in
`precalculus/data/pages.json`; `K.tabs`, `K.drag`, `K.handle`, `K.tap`, `K.cause`; `ApPrecalcPlot.loop` for the
animations. `build-apprecalc --check`.

## Risks reviewers will likely block on
- Four tabs, four pictures: the weight of the course page and of this tool (measure).
- Coins in the exponential jar outgrow the jar: switch to stacked bags of 10 or a scale, shown, never overflowing.
- Slide rule numbers at 360 px: only the marks for u, v and uv labelled.
- The topic gating must still hide a tab whose topic is not published.
