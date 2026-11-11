# AP Statistics: tool purpose review (2026-11-10)

Every Explore scene, distribution, design, method and view opened at 1280x800 (Run 100, Draw 100, +1,000 pressed),
landing at 390x844 for all ten, and the first Test yourself item of each tool. Screenshots:
`/home/claude/shots/review/statistics/` (`_p` = phone).

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Sampling distributions | Sample means pile up into a sampling distribution: centered on μ, narrower as n grows, normal by the CLT | LEAVE | The flagship works. Samples fly out of the population into the sample row, and the bottom panel builds up. Small: it opens with 100 samples already drawn, so the first impression is a finished pile; start at 0 with the "Take 1 sample" cue |
| Interval capture | About C% of intervals capture p, and the level trades width for capture | LEAVE | 100 intervals against the true line, with misses marked and arms that stretch when the level changes. Small: "Long run 90%" after only 20 intervals; call it "So far" until there are 100 |
| Sampling lab | Random methods center on μ; bad methods are biased; some vary more | FIX (small) | One dotplot row per method shows bias and spread well. But the houses do not show their water use, so you cannot see *why* cluster splits in two or why convenience and voluntary miss |
| Data explorer | Dotplot, histogram and boxplot are one data set; the mean chases outliers, the median does not | LEAVE | Drag a dot and everything moves on one axis |
| Design randomizer | Random assignment centers on the true effect; blocking and pairing narrow it; choosing by hand confounds | FIX (small) | The greenhouse and "Someone chooses" (every A in the sunny row) are the idea. But the results dotplot, the punchline, is squeezed into a strip about 330 x 80 px under the bench on desktop |
| Distribution areas | A probability is an area (normal) or a sum of bars (binomial) | LEAVE | The graph is the concept. Values checked |
| p-value explorer | The p-value is the tail area beyond the result; α, β and power are areas under two curves | LEAVE | The graph is the concept; the power view with its 2 x 2 error table is good |
| Probability trees | One situation as a tree, a table, a Venn diagram and a simulation; conditioning shrinks the whole | LEAVE | Branch widths and the faded slice for P(A given B) show it. Small: the Venn labels sit in the box corners, away from their circles |
| Regression lab | Least squares minimizes the squared residuals; one point can pull the line | LEAVE | Squares, "Your line" and dragging an influential point are the idea |
| Chi-square lab | χ² adds up each cell's (O - E)²/E; a large sum means a small p-value | LEAVE | Heat table, stacked component bar on the χ² curve, and the expected count step by step. See the accuracy note |

Totals: LEAVE 8, FIX 2, REDESIGN 0.

## Notes

**Design randomizer (FIX, small).** `dr_6_all.png`: after Run 100 for all four designs, the four rows of 100 estimates
fit in about 80 px. The dots become dashes, while the right of the bench holds only a two-item legend. The narrower
rows for blocked and paired and the shifted row for "Someone chooses" are the lesson, so they need room. Put the
results panel beside the bench, about half the stage and full height, with at least 30 px per row. On the phone it
is already readable (`design_run_p.png`). Before the first run (`dr_0_land.png`) the layout is side by side; after a
run it jumps to stacked. Pick one.

**Sampling lab (FIX, small).** `sl_8_all.png`: the rows tell the story: cluster gives two clumps, convenience sits low,
voluntary sits high. But all 100 houses look the same. Nothing shows that Hillside households use different amounts
from Riverside ones, or which houses a convenience sampler reaches. Shade each house (or size its garden or lawn) by
its water use, with a small key, so a student can see the cluster that picked one street land in one clump, and why.
Phone: the houses are a few pixels each and the street names crowd (`sl_land_p.png`). On a phone the population
could be one neighborhood at a time, or houses without the street labels.

**Smaller points, no verdict change.**
- Sampling distributions: the Proportion population is drawn as 100 people and the sample takes n = 25 of them
  (`sd_9_prop1.png`). The Explanation says the population is very large and meets the 10% condition, but the
  picture shows a quarter of it being taken. Add a caption such as "each figure stands for 1% of a large
  population".
- Chi-square lab, homogeneity: the rows are separate samples whose sizes the design fixes, yet changing one count
  changes that row's total (100 becomes 122). Defensible for exploring. For homogeneity it would be truer to move
  a count between cells of the same row, keeping the total.
- Regression lab, "Squares": the squares are drawn on axes with different scales, so they look like rectangles.
  Fine if the Explanation says the areas are in squared points.

No wrong numbers found. Spot checks: normal areas (P(62 < X < 68) = 0.7606), binomial P(X ≤ 5) for n = 10,
p = 0.7 = 0.1503, χ² cutoff 12.59 for df 6, tree and table products, p-value tail areas.
