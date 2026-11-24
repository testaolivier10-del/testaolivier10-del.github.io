# Plan: AP® Calculus AB, Riemann sums

## Tool and page
`calculus/tools/riemann-sums.html`; scripts `calculus/assets/tools/riemann-sums.js` (with its tank SVG),
`calculus/assets/tools/math/riemann-sums.js` (`ApCalcMath.riemannSums`), `riemann-sums.css`; data
`calculus/assets/tool-data/riemann-sums.json`. **Premium.** Rollout row 76, group G, wave 16, marked rework (n slider
in the panel; four kinds of sum on a switch).

## The one idea (two tabs)
1. **More strips:** as the strips get thinner, their total closes in on the true area.
2. **Over or under:** whether a sum is too big or too small follows from f rising or falling, or bending.

## Research
- GeoGebra "Riemann sums" applets (https://www.geogebra.org, search "Riemann sum"): left, right, midpoint, trapezoid
  with an n slider. Take: the error slivers coloured separately from the strips.
- Desmos Riemann sum (https://www.desmos.com/calculator, "Riemann sum"): instant redraw as n changes. Take: no lag
  between n and the drawn strips.
- Math Insight "Calculating the area under a curve using Riemann sums" (https://mathinsight.org): a running total.
  Take: the total as one number on the picture.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| n slider in the panel (cue "Drag n: more strips") | main control in tab 1: the strips' knob on the picture |
| Left / right / midpoint / trapezoid switch | tab 1: quiet four way toggle on the picture; tab 2: the main control (tap a sum) |
| Strips shaded, positive above, negative below, two tones | kept |
| Play adds strips one by one with a running sum | "Fill one by one" (secondary) |
| Exact value beside | the tank's mark line "exact" and in the cause line |
| Over or under explained from increasing/decreasing or concavity | tab 2's cause line |
| Tap a strip to read its term | kept (`K.tap` on the strip): its term in the cause line |
| Picker: 6 functions, 2 tables with unequal widths (inflow, a cyclist slowing), 2 flows (water into a tank, a pump speeding up) | curve picker beside "Show me how"; a table fixes the strips (the knob hides, "a table sets the strips" on the picture) |
| Flow: the tank fills to the amount | the picture itself (below) |
| Why, Details | "?" |
| Test yourself: drill, kinds table, overunder, context, sigma, tosum; record ids `riemann-sums:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** water into a tank. The rate graph's strips are drawn as glass columns of water (each holds rate ×
  time); beside them the tank fills with the columns' total; a thin "exact" line on the tank is the true volume. The
  gap between each column's top and the curve is a sliver: orange where the column overshoots, blue where it falls
  short. A function from the picker keeps the same look with its own axis names.
- **Main control:** the strips' knob on the picture's top edge (drag right for more strips; values 1 to 100; Page Up
  doubles).
- **Animates:** columns split or merge smoothly when n changes; the tank level moves to the new total; slivers
  shrink; Fill one by one pours each column into the tank.
- **Cause line:** tab 1 "n = 8 → left sum 41.3 → exact 40 → off by 1.3"; tab 2 "f decreasing → left columns
  overshoot → overestimate"; "concave up → trapezoids sit above → overestimate".
- **Takeaway:** "Thinner strips: the sum closes in on ∫₀⁶ r(t) dt = 40."
- **Outside:** 2 tabs, purpose line, picker, Show me how, cause line, Fill one by one: 4 controls, about 22 words.

## Science to verify
Left, right, midpoint and trapezoid sums; trapezoid = average of left and right (equal widths); over and under rules
(increasing: left under, right over; concave up: midpoint under, trapezoid over) only when f is monotone or of one
concavity on the whole interval, else "cannot tell" (OpenStax Calculus Volume 1 §5.1 and §3.6 numerical
integration; CED 6.2, 6.3). Unequal widths for tables; the limit of a Riemann sum as a definite integral (6.3). Units
of the sum (rate unit × time unit).

## Reuse
`ApCalcTools.studioKit2`, `K.drag` (strips knob, on a track), `K.tap` (strips and the sum toggle), `K.tabs`,
`K.cause`; the tool's tank SVG and the model's pieces (the strips are drawn from the same pieces the sum adds).
AB build byte-identical.

## Risks reviewers will likely block on
- n = 100 strips at 360 px: columns under 2 px; draw them as one shaded shape with ticks, keep the knob's tag.
- Tank level and the shown sum must come from the drawn columns during a merge or split animation.
- Negative strips (below the axis) must drain the tank, shown, not just tinted.
- A sliver label ("over") must not overlap the curve label at narrow widths.
