# Plan: AP® Calculus BC, Series lab

## Tool and page
`calculus-bc/tools/series-lab.html`; scripts `calculus-bc/assets/tools/series-lab.js`,
`calculus-bc/assets/tools/math/series-lab.js` (`ApCalcMath.seriesLab`), `series-lab.css`; BC's interval grader
`calculus-bc/assets/cbc-interval.js` (`ApCalcBCInterval`); data `calculus-bc/assets/tool-data/series-lab.json`.
**Free.** Rollout row 112, group G, wave 18, marked rework (terms slider in the panel; 130 words on the stage; number
and power series are two lessons).

## The one idea (two tabs)
1. **Partial sums:** adding terms one by one, the running total settles on a number, or it does not.
2. **Where a power series works:** inside the interval of convergence the partial sums close in on the function;
   outside they run away.

## Research
- Desmos partial sums (https://www.desmos.com/calculator, search "partial sums series"): dots for S_n with an n
  slider. Take: the dots, a level line at the sum.
- GeoGebra "Harmonic series vs p series" (https://www.geogebra.org): slow divergence on a log axis. Take: equal climb
  per ×10 terms for the harmonic series.
- 3Blue1Brown "Summing the infinite" style visuals (https://www.3blue1brown.com): steps toward a wall. Take: a walk
  whose steps are the terms.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Views Number series / Power series (dock switch) | the two tabs |
| Gallery series (geometric, harmonic, p series, alternating, 1/(n ln n) and the rest in the data) | series picker beside "Show me how" |
| Terms slider (cue "Add terms") | main control: the walker's step count on the picture (`K.drag` along the road) |
| Partial sums (dots) and terms (bars) | kept: the road (partial sums) and the step lengths (terms) |
| The sum dashed when there is one | a solid wall labelled "S = 2" |
| Alternating series bound as a bracket at S_N | kept, solid bracket |
| Past N = 40: the slider and "×10 terms" jump by powers of ten to 10⁶; chart turns to S_N against N on a log axis with ln N + γ (harmonic) or ln(ln n) + C dashed as a guide | Page Up and a quiet "×10" on the knob; the log view kept; the guides drawn thin solid |
| Why: what the series does, the board of six tests (settles it, no conclusion, does not apply, each with its reason) | "?" |
| Details: the table of n, a_n, S_n | "?" |
| Power series: number line with the interval (open or closed ends), draggable x, ratio test limit at x, S_N(x) against the function | tab 2: x's knob on the number line (`K.handle`) |
| Test yourself: drill, 5 kinds (partial, sum, test, absolute, interval; contexts partial, geometric, nth, integral, comparison, alternating, ratio, mixed and more), interval step graded by `ApCalcBCInterval` with each try drawn; record ids `series-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** a walker on a long road with distance markers; each step is the next term (forward, or back for
  a negative term), the footprints are the partial sums, and a wall stands at S when the series converges. Past 40
  steps the road's markers compress to a log scale (animated) and the walker keeps going: for the harmonic series
  the wall never appears and the walker gains the same distance for every ×10 steps.
- **Tab 2 picture:** a number line "bridge" over the interval of convergence; outside it the bridge breaks; above it,
  the function's curve and S_N(x) at the chosen x: inside the sums hug the curve, outside they swing away.
- **Main control:** tab 1 the step count; tab 2 x.
- **Animates:** each new step is taken (the walker moves); the axis rescale is a smooth zoom out; tab 2's S_N curves
  grow in term by term.
- **Cause line:** tab 1 "a_n = 1/2ⁿ → S_10 = 0.999 → settles at 1"; "harmonic: +2.3 per ×10 steps → keeps
  climbing → diverges"; tab 2 "x = 0.5 → ratio limit 0.5 < 1 → converges".
- **Outside:** 2 tabs, purpose line, series picker, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
Assessed tests only: nth term (divergence only), integral, direct comparison, limit comparison, alternating series,
ratio (`docs/apcalcbc-authoring-guide.md` scope); harmonic divergence with S_N ≈ ln N + γ; Σ 1/(n ln n) diverges like
ln(ln N) (the picture misleads; say so); alternating series error |S − S_N| ≤ a_{N+1}; endpoints of an interval
checked separately; wording "the series converges", never "the terms converge" (CED Unit 10; OpenStax Calculus Volume
2 Chapter 5 and §6.1). Values at N = 10⁶ computed in double precision with compensated sums.

## Reuse
`ApCalcTools.studioKit2` (AB's), `"kit2": true` in `calculus-bc/data/pages.json`; `K.drag`, `K.handle`, `K.tabs`,
`K.cause`; `ApCalcBCInterval` untouched. AB's build byte-identical, then `build-apcalcbc --check`.

## Risks reviewers will likely block on
- Jumps to 10⁶ terms: compute partial sums once and cache; frame budget at CPU x4.
- The log rescale must not make old footprints jump (rule 13): animate the scale.
- Walker, wall and bracket labels at 360 px; the "S = 2" wall label must not sit on footprints.
- Free tool: no Premium gate to keep, but the page must stay inside the BC weight budget.
