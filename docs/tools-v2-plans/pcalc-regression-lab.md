# Plan: AP® Precalculus, Regression lab

## Tool and page
`precalculus/tools/regression-lab.html`; scripts `precalculus/assets/tools/regression-lab.js`,
`precalculus/assets/tools/math/regression-lab.js` (`ApPrecalcMath.regressionLab`, `MODELS`), `regression-lab.css`; data
`precalculus/assets/tool-data/regression-lab.json`. **Premium.** Rollout row 119, group G, wave 20, marked rework (model
chips and the prediction slider in the panel).

## The one idea
A model fits when its residuals look like random scatter; a pattern in the residuals says try another model.

## Research
- PhET "Curve Fitting" (https://phet.colorado.edu/en/simulations/curve-fitting): pick linear, quadratic, cubic; drag
  points; residuals shown. Take: the model choice as the main act, instant refit.
- Desmos regressions with residuals (https://www.desmos.com/calculator, `y1 ~ a x1 + b`, plot e1): Take: the residual
  plot right under the scatter on the same x.
- Art of Stat: Regression (https://apps.apple.com/app/1613497223): residual plot verdicts. Take: one plain verdict.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Data sets: crickets, stopping, box, caffeine, practice, daylight | data picker beside "Show me how" |
| Model chips (linear, quadratic, cubic, quartic, exponential, logarithmic, sinusoidal, as the data allow; cue key `apprecalc-regression-lab-models`) | main control: model cards on the picture (`K.tap`) |
| Least squares fit in the course green | kept |
| Residual stems (blue above, orange below) | kept, as plumb lines |
| Residual plot with a verdict (scattered, or a pattern) | kept under the scatter |
| Prediction line drag (or its slider), value to three decimals | quiet knob on the x axis (`K.handle`); the slider goes |
| Constants stored, never rounded; Details: constants in full, data, predictions, residuals | "?" |
| Test yourself: drill, 5 contexts (linear, quadratic, choose, exponential, residual), the rounded constants slip named; record ids `regression-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the data's own setting drawn small above the field notebook page that holds the scatter: a cricket on
  a thermometer, a car braking with skid marks, a box being folded, a coffee cup, a practice log, a sunrise. Each
  residual is a plumb line from the point to the curve; the residual plot below shows the same plumb lines laid
  along zero, so a curve shape there is seen at once.
- **Main control:** tap a model card; the curve re fits.
- **Animates:** the curve morphs from the old model to the new; plumb lines stretch or shrink; the residual dots
  move to their new places.
- **Cause line:** "linear → residuals bend in a U → a pattern → not a good fit"; "exponential → residuals scattered →
  a good fit".
- **Takeaway:** "The exponential model fits: its residuals show no pattern" (its formula with the stored constants in "?").
- **Outside:** purpose line, data picker, Show me how, cause line: 2 controls, about 18 words.

## Science to verify
Least squares fits for each model (exponential and logarithmic fits as the course's technology does them: check the
model's transform matches a TI 84 style ExpReg, not a direct nonlinear fit, or say which); residual = actual −
predicted; a residual plot pattern means a poor model choice; predictions to three decimals with stored constants
(`docs/apprecalc-authoring-guide.md` three decimal rule; CED 1.14, 2.6, 2.15, 3.x for sinusoidal; OpenStax
Precalculus §4.8). Model justification wording from the authoring guide.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.tap`, `K.handle`, `K.cause`. Same
residual picture as AP® Statistics Regression lab (`stat-regression-lab.md`) in spirit; separate courses, no shared
code. `build-apprecalc --check`.

## Risks reviewers will likely block on
- The model cards hold formulas: text at 11 px or more at 360 px (wrap to two rows of cards).
- The curve morph between unlike models (linear to sinusoidal): cross fade the curve, but plumb lines and numbers from
  the drawn curve.
- Six setting drawings: weight.
- A model the data cannot support (too few points for quartic) is not offered, as today.
