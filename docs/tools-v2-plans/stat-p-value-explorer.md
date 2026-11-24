# Plan: AP® Statistics, p-value explorer

## Tool and page
`statistics/tools/p-value-explorer.html`; scripts `statistics/assets/tools/p-value-explorer.js`,
`statistics/assets/tools/math/p-value-explorer.js` (`ApStatMath.pValueExplorer`, through `ApStatDist`),
`p-value-explorer.css`; data `statistics/assets/tool-data/p-value-explorer.json`. **Premium.** Rollout row 82, group G,
wave 13, marked restyle (control on the picture; a panel slider repeats it; Errors and power is a second lesson).

## The one idea (two tabs)
1. **p-value:** assuming H₀ is true, the p-value is the share of samples at least as extreme as ours, in the
   direction of Hₐ.
2. **Errors and power:** if the truth is different from H₀, power is the chance our test catches it; α and β trade off.

## Research
- Rossman/Chance "One proportion inference" applet (https://www.rossmanchance.com/applets/index2021.html): simulated
  samples under H₀ as dots, count those as extreme. Take: the null as a pile of simulated samples.
- Art of Stat "Errors and power" app (https://artofstat.com/web-apps): two curves, α, β, power shaded. Take: power in
  green on the true curve.
- StatKey "Randomization test for a proportion" (https://www.lock5stat.com/StatKey): tails by direction. Take: the
  tail(s) lit from Hₐ's sign.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Scenarios: library bond (a proportion), recycling habit (a proportion), battery life (a mean) | scenario picker beside "Show me how" |
| p-value view: the null distribution (blue), the observed statistic as a handle or the slider (cue "Drag the observed result") | tab 1; main control the observed poll flag (`K.handle` on the axis); the slider goes |
| p-value shaded in Hₐ's direction (one tail or both); α cutoff dashed | kept; the α cutoff a thin solid line labelled "α = 0.05" |
| Axis in the statistic's units with z (or t) under it | kept |
| Dock: Hₐ (<, ≠, >) and the observed result | Hₐ as a quiet three way toggle on the picture |
| Errors and power: the null curve and the curve if the true p is the dragged value (vermillion); rejection region; α, β, power (green); a 2 × 2 table of decision against truth | tab 2; main control the true p (`K.handle`); the 2 × 2 table in "?" |
| Dock: true p, n, α | n and α as quiet knobs in tab 2 |
| Why (the reasoning with the current numbers), Details (the study, n and α, every number with its formula) | "?" |
| Test yourself: drill on `pValueExplorer.generate`, 4 kinds (pvalue z test, tmean t test, meaning, errors); record ids `p-value-explorer:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** the library bond poll: a pile of many simulated polls of 400 voters under H₀ (each a small ballot
  dropped onto a heap that is the null distribution, the smooth curve over it), and our poll as a flag on the axis.
  The ballots at least as extreme as the flag (by Hₐ's direction) are lit; their share is the p-value.
- **Tab 2 picture:** two heaps: the H₀ world (blue) and the true world (vermillion) set by the true p; the rejection
  region a coloured band on the axis; ballots of the true world inside it (green) are the power.
- **Main control:** the flag (tab 1); the true world's centre (tab 2).
- **Animates:** lit ballots grow or shrink as the flag moves; switching Hₐ swings the lit tail; in tab 2 the true heap
  slides and its green part grows.
- **Cause line:** tab 1 "p̂ = 0.56 → z = 2.40 → p-value 0.008 < α = 0.05 → reject H₀"; tab 2 "true p 0.55 → power 0.64 →
  β 0.36" (one sided, α = 0.05, n = 400).
- **Outside:** 2 tabs, purpose line, scenario picker, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
One proportion z test with p₀ in the SE; one sample t test with df n − 1; one or two tails by Hₐ; Type I = α, Type II
β, power = 1 − β, power rising with n, α and the distance from p₀ (CED revised 2026-27 inference units; OpenStax
Introductory Statistics 2e §9.2 to 9.6). Wording templates for a p-value and for the conclusion
(`docs/apstat-authoring-guide.md`): "Assuming the true proportion is 0.5, there is a 0.008 probability of a sample
proportion of 0.56 or more by chance"; never "accept H₀". Hypotheses about parameters, never statistics. Check the
cause line's numbers with ApStatDist against R.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.handle`, `K.tap`, `K.tabs`, `K.cause`.
`build-apstat --check`.

## Risks reviewers will likely block on
- The heap of ballots must match the null density (counts from the model), and the lit share must equal the shown
  p-value at every frame.
- A two sided Hₐ lights both tails: both labelled, clear of the flag's tag.
- Very small p-values: "p < 0.001" with the lit tail still visible (a minimum drawn width, said in "?").
