# Plan: AP® Statistics, Sampling distributions

## Tool and page
`statistics/tools/sampling-distributions.html`; scripts `statistics/assets/tools/sampling-distributions.js`,
`statistics/assets/tools/math/sampling-distributions.js` (`ApStatMath.samplingDistributions`, `ApStatDist`),
`sampling-distributions.css`; data `statistics/assets/tool-data/sampling-distributions.json`. **Free**; the course's
flagship tool (`docs/apstat-spec.md` section 6). Rollout row 56, group G, wave 15, marked rework (13 controls in the
panel; three stacked plots).

## The one idea (three tabs)
1. **Sample means:** each sample gives a different x̄; together they pile up around μ, narrower for larger n and close
   to normal for large n even from a skewed population.
2. **Sample proportions:** the same for p̂, normal when the large counts condition holds.
3. **Differences:** the difference of two groups' statistics has its own distribution, centred on the true
   difference.

## Research
- Online Statistics Education "Sampling distribution simulation" (https://onlinestatbook.com/stat_sim/sampling_dist/instructions.html):
  the classic three panels, a drawable population. Take: draw your own population; sample means falling into a
  histogram.
- Seeing Theory "Central limit theorem" (https://seeing-theory.brown.edu/probability-distributions/index.html#section3):
  draws dropping into a pile. Take: the drop animation.
- StatKey "Sampling distribution for a mean" (https://www.lock5stat.com/StatKey): generate 1, 10, 100, 1000. Take:
  the buttons; leave: the panel layout.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Populations: commute times, waiting times, geyser eruptions, heights, left handers, bond support; "Draw your own" (drag the bars, arrow keys); two groups (two commute cities; two towns for a proportion) | tab 1 picker (means, with Draw your own); tab 2 picker (left handers, bond support); tab 3 the two group pairs |
| Population panel: histogram with μ and σ marked, or 100 people for a proportion | the population jar (below) |
| One sample panel: the last sample's values, its statistic | the scoop (below) |
| Sampling distribution panel: dots while they fit, histogram after; the formula's normal model on top; μ line through every panel | kept, as the pile; the normal model a thin solid curve |
| Take 1 (animated draw; cue "Take one more sample"), +100, +1,000 (quick burst) | Take 1 is the main action button; +100 and +1,000 secondary |
| Sample size n | main control between draws: the scoop's size knob (`K.drag`) |
| CLT and large counts conditions shown failing and passing | the cause line names the condition and whether it holds |
| Reduced motion: the end state at once (`ApStatPlot.loop`) | kept |
| Test yourself: drill over the model's generate(), kinds mean, prop, diff, shape (CLT), estimator (bias and variability), the stage figure from the problem's numbers; record ids `sampling-distributions:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a big glass jar of tickets (each ticket a commute time, or for a proportion a red or blue marble),
  the population's histogram drawn as the jar's layers; a scoop takes n tickets (they fly out and sit on a tray: the
  one sample); its mean is a ball that rolls down a chute and lands on the pile below (the sampling distribution).
  The μ line runs from the jar's label down through the pile. Tab 3: two jars and two scoops, the ball is the
  difference.
- **Main control:** Take 1 (and the scoop size between runs).
- **Animates:** tickets fly to the tray; the ball rolls and lands; +1,000 pours balls quickly and the pile switches
  from dots to a histogram smoothly once dots no longer fit; changing n clears the pile with a sweep.
- **Cause line:** "n = 5 → the pile is skewed and wide (SD 4.5)"; "n = 40 → nearly normal, SD 1.6 = σ/√n"; tab 2
  "np = 9 < 10 → large counts fails → not normal yet".
- **Takeaway:** "Larger samples: the means pile up tighter around μ, and nearly normal."
- **Outside:** 3 tabs, purpose line, picker, Show me how, cause line, +100, +1,000: 5 controls, about 22 words (the
  most of the group; Take 1 is on the picture).

## Science to verify
Mean and SD of x̄ (μ, σ/√n), of p̂ (p, √(p(1 − p)/n)), of differences (√(σ₁²/n₁ + σ₂²/n₂)), with the 10% condition for
sampling without replacement; the CLT (n ≥ 30 as the usual guide, said as a guide); large counts np ≥ 10 and n(1 − p) ≥
10; unbiased vs biased estimators (CED revised 2026-27 sampling distribution topics, `docs/apstat-spec.md` row for this
tool; OpenStax Introductory Statistics 2e §7.1 to 7.3). Combining random variables is excluded from the revised course
(`docs/apstat-authoring-guide.md`): tab 3 states the SD of a difference as a sampling distribution result, without
the "variances add" rule for random variables; check this against the spec and add a needs-author line if unsure.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.drag`, `K.tabs`, `K.cause`, `K.player`
for bursts; `ApStatPlot.loop`. The "take a sample" button pattern shared with Sampling lab and Interval capture.
`build-apstat --check`.

## Risks reviewers will likely block on
- +1,000 at CPU x4: draw the pile as one canvas or one path, animate a sample of the balls, keep the counts exact.
- The pile switching from dots to a histogram must not jump (rule 13): cross fade with the same heights.
- Three tabs and two jars on a phone: the jar, the tray and the pile stacked, each readable.
- Draw your own: dragging bars is a second interaction; keep it quiet and in the picker item only.
