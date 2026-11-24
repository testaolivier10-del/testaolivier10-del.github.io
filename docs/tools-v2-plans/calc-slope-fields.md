# Plan: AP® Calculus AB, Slope fields

## Tool and page
`calculus/tools/slope-fields.html`; scripts `calculus/assets/tools/slope-fields.js`,
`calculus/assets/tools/math/slope-fields.js` (`ApCalcMath.slopeFields`, adaptive Runge Kutta, `sketchGrade`),
`slope-fields.css`; data `calculus/assets/tool-data/slope-fields.json`. **Premium.** Rollout row 78, group G, wave 16,
marked restyle (control on the picture).

## The one idea
The slope field shows the direction at every point; one starting point picks out one solution, which follows it.

## Research
- GeoGebra "DE, Slope Fields, and Euler's Method" (https://www.geogebra.org/m/gd8f23bn): drag the initial point,
  the solution follows. Take: the drag, instant redraw.
- Desmos slope field (https://desmos.com/calculator/xwhlnodfyt): a clean field with an initial point. Take: short
  even segments that never crowd the curve.
- Ximera "Slope fields and Euler's method" (https://ximera.osu.edu/mooculus/calculus2/numericalMethods/digInSlopeFieldsAndEulersMethod):
  predict then reveal. Take for Test yourself only (already the sketch step).

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Draggable starting point (cue "Drag the starting point") | main control: the leaf (`K.handle` in 2D, `pick(x, y)`) |
| Solution traced both ways (adaptive RK) | kept: the leaf floats forward, its path upstream drawn in the same ink |
| Exact particular solution dashed over it | "Check with the formula" (quiet): a thin solid line in its own colour, labelled with its formula; no dashes |
| Tap a grid point: its slope worked out | kept (`K.tap` on the field point): the slope in the cause line |
| Equation chips: xy, y − 2, ky (growth and decay), Cooling | equation picker beside "Show me how" |
| k for growth and decay and cooling | quiet knob on the picture (only for ky and Cooling) |
| "Start over" | the kit's reset |
| Why (what the curve does), Details (separation of variables through the point, numbers, field density, T_a) | "?" |
| Test yourself: drill, 6 kinds (slopes, match, sketch, separate, concavity, exp; contexts include bacteria, isotope, drug), the sketch step graded by `sketchGrade`; record ids `slope-fields:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a river seen from above on the exact grid. Each field segment is a short current streak in the water
  (its slope the segment's slope); an equilibrium solution (y = 2 for y′ = y − 2) is a calm line drawn as still
  water. The student drops a leaf; it floats along the solution, leaving a thin wake behind and showing its path
  upstream in the same ink. Cooling adds a small mug on the bank with the temperature on its side, the y axis read as
  degrees.
- **Main control:** the leaf's knob (drop anywhere, drag, arrows move it on the grid).
- **Animates:** on drop the leaf floats out along the curve (about 1 s); a new equation re flows the streaks (cross
  fade); k changes the current's strength and the streaks turn.
- **Cause line:** "at (1, 3): y′ = 3 − 2 = 1 → heading up 1 for 1 across"; "starts above 2 → moves away from 2";
  Cooling "T above the room → T falls toward 20".
- **Takeaway:** "One starting point, one solution: y = 2 + e^(x − 1)."
- **Outside:** purpose line, equation picker, Show me how, cause line, Check with the formula: 3 controls, about 20
  words.

## Science to verify
Slope fields of y′ = xy, y − 2, ky, −k(T − T_a); solution curves and equilibria (stable vs unstable for y − 2);
separation of variables and the particular solution through the point (CED 7.3 to 7.8; OpenStax Calculus Volume 2
§4.2 and §4.3 for separable equations and Newton's law of cooling); the RK curve and the exact solution must agree
to the drawn pixel. Only separable equations on AB (authoring guide exclusions).

## Reuse
`ApCalcTools.studioKit2`, `K.handle` (2D with `pick`), `K.tap`, `K.drag` (quiet k), `K.cause`; the model's RK
tracer. AB build byte-identical. BC Euler and logistic reuses this picture's river for its Euler tab
(`calcbc-euler-logistic.md`): draw it so BC can call it, without copying.

## Risks reviewers will likely block on
- Streaks must not read as arrows or particles that move by themselves (motion only while the leaf floats).
- The leaf path near an equilibrium or off the window must stop at the edge, never leave the picture.
- The old exact solution is dashed: it must become a thin solid line or it is blocked (ghost rule).
- Field density on a phone: fewer streaks, each at least 10 px, labels clear of them.
