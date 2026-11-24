# Plan: AP® Calculus BC, Taylor lab

## Tool and page
`calculus-bc/tools/taylor-lab.html`; scripts `calculus-bc/assets/tools/taylor-lab.js`,
`calculus-bc/assets/tools/math/taylor-lab.js` (`ApCalcMath.taylorLab`), `taylor-lab.css`; data
`calculus-bc/assets/tool-data/taylor-lab.json`. **Premium.** Rollout row 113, group G, wave 18, marked rework (the
degree, the idea, is a slider in the panel).

## The one idea (two tabs)
1. **More terms:** each added term lets the polynomial match f farther from the center.
2. **How far off:** at a chosen x, the error is at most the Lagrange (or alternating series) bound, and the curve
   stays inside that band.

## Research
- Math Insight "Taylor polynomial" applet (https://mathinsight.org/applet/taylor_polynomial): degree slider, center
  draggable. Take: drag the center on f.
- MAA "Taylor Series" by Stemkoski and Storm (https://www.maa.org/sites/default/files/images/upload_library/47/StemkoskiStorm/TaylorApprox.html):
  terms added one at a time. Take: the new term's bend appearing.
- GeoGebra "Taylor polynomials" (https://www.geogebra.org/m/zeRvKhQm): leave: sliders beside the graph.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| f (crimson) and P_n (blue) | kept |
| Center c: a point on f dragged along the curve | quiet knob on f (`K.handle`) in both tabs |
| Degree n (dock slider; cue "Add terms") | tab 1 main control: a terms knob on the picture (`K.drag`, 0 to 12) |
| Error marker x on the x axis, the gap between f and P_n drawn there | tab 2 main control (`K.handle` on the axis) |
| Shaded band: Lagrange bound, or the alternating series bound where it applies | tab 2, kept (one band, its name on it) |
| Function choice (dock) | function picker beside "Show me how" |
| Band toggle (dock) | gone: the band is tab 2's picture |
| Why: P_n term by term and why the bound is what it is; Details: coefficient table and numbers | "?" |
| Test yourself: drill, 4 kinds (coef, maclaurin, lagrange, altbound; contexts table, known, built, lagrange, altseries, alttaylor), figures growing with the steps, a typed polynomial drawn against f, the bound as a bracket; record ids `taylor-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a curved steel rail (f) and a flexible ruler clamped to it at the center (P_n). With 0 terms the ruler
  is flat at f(c); each added term lets it bend once more, and the stretch where it lies on the rail (within a
  drawn tolerance) grows outward from the clamp, marked by two small brackets. Tab 2: at x, a gauge shows the gap
  between rail and ruler and a band around the ruler (the bound) that the rail never leaves.
- **Main control:** tab 1 the terms knob; tab 2 the gauge's x.
- **Animates:** the ruler bends into its new shape when a term is added (morph from P_{n−1} to P_n); the fitted
  stretch widens; tab 2's band narrows as n grows; moving the clamp slides the ruler along.
- **Cause line:** tab 1 "n = 5 → fits within 0.01 from −1.9 to 1.9"; tab 2 "x = 1 → error 0.0016 ≤ bound 0.0083".
- **Takeaway:** "More terms fit farther from the center (inside the interval of convergence)."
- **Outside:** 2 tabs, purpose line, function picker, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
Taylor coefficients f⁽ⁿ⁾(c)/n!; Maclaurin series of sin, cos, eˣ, 1/(1 − x) by heart, ln(1 + x) and arctan x derived;
Lagrange bound max|f⁽ⁿ⁺¹⁾| |x − c|ⁿ⁺¹/(n + 1)! with the max on the interval between c and x; alternating series
bound where the series alternates with decreasing terms; P_n written out term by term, no "+ ⋯" (CED 10.11 to 10.15;
`docs/apcalcbc-authoring-guide.md`; OpenStax Calculus Volume 2 §6.3). For 1/(1 − x) or ln(1 + x), past the radius
more terms fit worse: the picture must show it, the takeaway names it. Check the example numbers in the cause line
against the model before shipping.

## Reuse
`ApCalcTools.studioKit2` (AB's), `"kit2": true` in `calculus-bc/data/pages.json`; `K.drag`, `K.handle`, `K.tabs`,
`K.cause`. AB's build byte-identical, then `build-apcalcbc --check`.

## Risks reviewers will likely block on
- High degree polynomials explode off the window: clip the ruler at the picture edge with a clean cut, never past it.
- The fitted stretch brackets from the drawn polynomial, not a formula guess.
- The band must be a real bound everywhere it is drawn (check M is the max on the interval, not at x).
- Two knobs (clamp and terms) must never move each other.
