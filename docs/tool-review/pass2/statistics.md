# AP Statistics: second pass, simple and clear (2026-11-10)

Task math2 (pass 2), branch `claude/tv2-math2`. Every tool opened at 1280x800 and 390x844. Screenshots:
`/home/claude/shots/pass2/statistics/` (`_land_d`, `_land_p`, and `_before_d` for changed tools).

| Tool | The idea | Best way to show it | Verdict | Before | After | What changed; what moved behind a tap |
|---|---|---|---|---|---|---|
| Sampling distributions | sample means pile up into a distribution centered on μ, narrower as n grows | population, one sample, the pile, stacked on one axis | SIMPLIFY | opened with 100 samples already drawn; caption 40 words repeating the plot's mean and SD | opens on 1 sample; caption at 100 samples 20 words | The pile builds when the student takes samples; centers and SDs stay printed on the plot and in Numbers & setup |
| Interval capture | about C% of intervals capture p | the stack of intervals against the true line | SIMPLIFY | 2 panels (intervals + capture-rate strip), "Long run 90%" after 20 intervals, the capture count twice | 1 panel, 1 chip | The capture-rate strip and the Long run chip appear after Build 100; the duplicate header count is gone in the studio |
| Sampling lab | random methods center on μ, bad ones are biased | the colored neighborhood and the dotplot of means | LEAVE | 1 chip, 2 short keys, caption 13 words | same | First pass already made the houses carry their values |
| Data explorer | one data set, three plots; the mean chases outliers | dotplot, histogram and boxplot on one axis | SIMPLIFY | 4 chips (mean, median, SD, IQR), caption repeated mean and median | 2 chips, caption 10 words | SD shows when Mean ± 1 SD is on, IQR when Outlier fences is on; all summaries in Data & numbers |
| Design randomizer | random assignment centers on the true effect | the bench and the results beside it | LEAVE | 1 chip, caption 16 words | same | Calm since the first pass |
| Distribution areas | a probability is an area | the shaded curve, drag the boundary | LEAVE | 2 chips | same | The graph is the concept |
| p-value explorer | the p-value is the tail area | the null curve with the shaded tail | LEAVE | 2 chips | same | The graph is the concept |
| Probability trees | one situation as tree, table, Venn, simulation | branch widths | LEAVE | 1 chip, caption 30 words | same | Tree is the picture; the probability chips are the main action |
| Regression lab | least squares minimizes squared residuals | scatter, line and residual plot | SIMPLIFY | 3 chips (equation, r, r²), caption repeated equation and r | 2 chips, caption 12 words | r² is in Data & numbers |
| Chi-square lab | χ² adds each cell's (O - E)²/E | heat table above the χ² curve | SIMPLIFY | 3 chips (χ², df, p-value), caption 30 words repeating them | 2 chips, caption 18 words | df stays on the curve label and in the Explanation; the caption names the cell with the biggest share |

Totals: LEAVE 5, SIMPLIFY 5, CHANGE 0.

## Graphics
Drawn plots in one style; the sampling lab's houses and the greenhouse bench look like the real things. No clip art.

## Chose not to simplify
- Chi-square lab: the table and the curve stay on one screen (cause and effect). Each cell keeps its expected count:
  O against E is the lesson. The dock still has six controls (slider, type a count, Chance table, Step by step,
  Reset, which test); each is a separate action the explanation leans on, so they stay.
- Sampling distributions: the three stacked panels are one picture (population to sample to pile), not a dashboard.
- Interval capture, 100 rows after Build 100: dense on purpose; the share of misses is what the student counts.
