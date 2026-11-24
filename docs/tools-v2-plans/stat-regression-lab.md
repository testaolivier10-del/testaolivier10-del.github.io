# Plan: AP® Statistics, Regression lab

## Tool and page
`statistics/tools/regression-lab.html`; scripts `statistics/assets/tools/regression-lab.js`,
`statistics/assets/tools/math/regression-lab.js` (`ApStatMath.regressionLab`, `ApStatDist.lsrl`), `regression-lab.css`;
data `statistics/assets/tool-data/regression-lab.json`. **Premium.** Rollout row 55, group G, wave 13, marked restyle
(control on the picture; 27 controls).

## The one idea (two tabs)
1. **One point moves the line:** the least squares line, r and the residuals follow every point; one point far from
   the rest in x can pull the line hard (influence).
2. **Beat the line:** no other line has a smaller sum of squared residuals than the least squares line.

## Research
- PhET "Least Squares Regression" (https://phet.colorado.edu/en/simulations/least-squares-regression): drag points,
  your line against the best line, the squares drawn. Take: squares as real areas; your line vs the best.
- Seeing Theory "Regression analysis" (https://seeing-theory.brown.edu/regression-analysis/index.html): points dragged,
  residuals and line follow. Take: residuals as vertical segments.
- Wolfram "Correlation and Regression Explorer" (https://demonstrations.wolfram.com/CorrelationAndRegressionExplorer/):
  r changing live. Take: r on the picture by the line.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Data sets: study time and quiz score, car age and price, speed and stopping distance | data picker beside "Show me how" |
| Scatterplot over a residual plot on one x scale | kept |
| Drag any point (arrow keys: left and right x, up and down y; cue "Drag a point") | main control (`K.handle` 2D per point) |
| Tap empty space to add a point | kept (tab 1); a point dragged off the plot removes it (with undo) |
| LSRL, r, r², s and the residual plot following at once | kept: the line and its equation on the picture; r by the line; r² and s in "?" |
| Overlays: residuals as segments, their squares, your own line to beat the least squares sum | residual segments always in tab 1; squares and your own line are tab 2 |
| "Predict at x" slider with its extrapolation warning | Test yourself (its "Predict and interpret the slope" kind) and "?" for the warning; logged |
| A dragged point reports its residual, leverage and the fit without it (influence) | the cause line while dragging |
| Why; second sheet: every number, the point table, the data set chooser | "?" |
| Test yourself: drill, 5 kinds (describe, correlation, predict, residual, lsrl), answers drawing on the points; record ids `regression-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** students as points on a study log page (hours studied against score), each a small face; the
  least squares line is a steel rod held by vertical springs to every point (springs stretched by the residuals:
  equal spring stiffness makes the rod rest exactly at the least squares line, a true model, not decoration). Below,
  the residual plot with the same springs laid on the zero line.
- **Tab 2:** your rod with two handles, its springs drawn as squares of area residual²; the total area of yours
  against the best rod's, as two piles of tiles.
- **Main control:** drag a point (tab 1); your rod's handles (tab 2).
- **Animates:** the rod swings and settles as a point moves (no oscillation overshoot that misstates the line: settle in
  about 150 ms, the line shown is always the current LSRL); springs stretch; squares grow.
- **Cause line:** tab 1 "point at x = 12 (far right) → slope 3.1 → 4.6 → without it the slope is 3.0"; tab 2 "yours
  412 → best 358 → the least squares line wins".
- **Outside:** 2 tabs, purpose line, data picker, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
LSRL ŷ = a + bx with b = r·s_y/s_x (a relationship, not on the 2026 reference sheet: teach it as one,
`docs/apstat-authoring-guide.md`); residual = y − ŷ; r and r² meaning in context; s as the typical residual; outliers,
high leverage and influential points; extrapolation; correlation is not causation (CED revised 2026-27 regression
topics; OpenStax Introductory Statistics 2e §12.3 to 12.6). Inference for slope and transformations are excluded.
The spring picture: vertical springs of equal stiffness minimize the sum of squared vertical distances (verify the
physics claim in "?" wording). Statistics vs parameters: b and r, never β or ρ.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.handle`, `K.tap`, `K.tabs`, `K.cause`;
`ApStatDist.lsrl`. Precalculus Regression lab (`pcalc-regression-lab.md`) shares the plumb line idea, separate code.
`build-apstat --check`.

## Risks reviewers will likely block on
- The rod must equal the LSRL of the drawn points at every frame (no lagging spring animation that disagrees with r).
- Squares in tab 2 can be huge: clip inside the plot, and the piles of tiles carry the totals.
- Adding a point by tap vs starting a drag on a point: act on what is under the pointer.
- r near ±1 and the equation label at 360 px.
