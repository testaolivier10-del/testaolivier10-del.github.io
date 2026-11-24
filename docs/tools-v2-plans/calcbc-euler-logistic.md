# Plan: AP® Calculus BC, Euler and logistic

## Tool and page
`calculus-bc/tools/euler-logistic.html`; scripts `calculus-bc/assets/tools/euler-logistic.js`,
`calculus-bc/assets/tools/math/euler-logistic.js` (`ApCalcMath.eulerLogistic`), `euler-logistic.css`; data
`calculus-bc/assets/tool-data/euler-logistic.json`. **Premium.** Rollout row 125, group G, wave 18, marked restyle
(control on the picture; Euler and logistic growth are two lessons).

## The one idea (two tabs)
1. **Euler's method:** follow the slope at where you are for one step, then look again; smaller steps stay closer
   to the true solution.
2. **Logistic growth:** growth is fastest at half the carrying capacity and levels off at it.

## Research
- GeoGebra "DE, Slope Fields, and Euler's Method" (https://www.geogebra.org/m/gd8f23bn): the Euler polygon over the
  field with a step slider. Take: each step's run and rise drawn.
- Desmos Euler's method (https://desmos.com/calculator/xwhlnodfyt): steps doubling. Take: the error halving shown.
- PhET "Natural Selection" population graph (https://phet.colorado.edu/en/simulations/natural-selection): a real
  population whose count levels off. Take: creatures in the scene that match the curve.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Scenes Euler's method / Logistic growth | the two tabs |
| Euler: slope field, draggable starting point (cue "Drag the starting point") | quiet knob (the boat's start) in tab 1 |
| Number of steps 1, 2, 4, 8, 16 (dock) | tab 1 main control: a steps knob on the picture (`K.drag`, five stops) |
| True solution dashed, from its formula | the leaf's path in a thin solid line (AB Slope fields' river) |
| Euler polygon with each step's run and rise | kept |
| Equation choice (dock) | equation picker beside "Show me how" |
| Why: over or under from the concavity; Details: Euler table (x, y, dy/dx, Δy) and the error for each n | cause line for over or under; table and errors in "?" |
| Logistic: P(t) beside the rate as a parabola in P, one moving point (drag along the curve, or Play), L and L/2 drawn | tab 2: drag the time knob; "Run" (secondary) |
| Logistic dock: L, k, P(0) | quiet knobs on the picture (L the pond's capacity line, P(0) the start), k in "?" |
| Test yourself: drill, 4 kinds (euler, model, overunder, logistic), figure building, a wrong try drawn beside the right one; record ids `euler-logistic:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** AB Slope fields' river (`calc-slope-fields.md`): a leaf floats on the true solution; a small
  boat steers by the current only at the start of each leg and goes straight for Δx, so its wake is the Euler
  polygon. Each leg shows its run and rise (1 to 3 word labels on the first leg only).
- **Tab 2 picture:** a pond whose fish count is P(t): fish fill the water, crowding toward the capacity line; beside
  it, the rate against P as an arch with a marker at the current P; the arch's top at L/2.
- **Main control:** tab 1 the steps knob; tab 2 time.
- **Animates:** with more steps the boat's legs split (each leg breaks into two, animated) and the end gap to the
  leaf shrinks; fish appear or vanish one by one as P changes (count matches P within rounding to the drawn scale).
- **Cause line:** tab 1 "4 steps → ends 0.31 below the true value"; "concave up → each leg falls below → under";
  tab 2 "P = 500 = L/2 → fastest growth"; "P → 1000 → growth → 0".
- **Outside:** 2 tabs, purpose line, picker, Show me how, cause line, Run (tab 2): 4 controls, about 22 words.

## Science to verify
yₙ₊₁ = yₙ + f(xₙ, yₙ)Δx; Euler under where the solution is concave up, over where concave down (for the steps
taken); global error roughly proportional to Δx (halves as steps double, approximately: say "about"); logistic
dP/dt = kP(1 − P/L), largest rate at P = L/2, P → L; logistic models are interpreted, not solved
(`docs/apcalcbc-authoring-guide.md` scope); Euler table columns x, y, dy/dx, Δx (CED 7.5 and 7.9; OpenStax Calculus
Volume 2 §4.2 and §4.4). Check the cause line's example numbers against the model.

## Reuse
`ApCalcTools.studioKit2` (AB's), `"kit2": true` in `calculus-bc/data/pages.json`; `K.drag`, `K.handle`, `K.scrub`,
`K.tabs`, `K.cause`; AB Slope fields' river drawing called, not copied (if it is not yet built when this starts,
build the river in AB's slope fields first or keep this tool's field and log it). AB's build byte-identical, then
`build-apcalcbc --check`.

## Risks reviewers will likely block on
- Fish count vs P: "proportions in the picture match the numbers" (builder brief); one fish per fixed share, stated.
- Fish must stay inside the pond; up to a few hundred nodes: draw as one canvas or capped sprites for perf.
- 16 Euler legs on a phone: leg labels only on the first leg.
- Over or under must be judged on the steps actually taken (concavity can change).
