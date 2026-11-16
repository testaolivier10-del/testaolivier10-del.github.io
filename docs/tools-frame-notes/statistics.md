# AP Statistics tools in the standard frame (F4, 2026-11-16)

Same kit changes as calculus, in `statistics/assets/tools/stat-tools.js` (see `docs/tools-frame-notes/calculus.md`),
plus `radioPick` for a scenario chosen by radio buttons (interval capture's populations). Nothing was removed.

| Tool | Features | Where now | Judgment |
|---|---|---|---|
| Chi-square lab | study select, cells, count slider, Chance table, Step by step, Reset, homogeneity / independence, drill | study dropdown | |
| Interval capture | population radios, level, n, Build 100, Start over, critical value, drill | population dropdown | |
| Data explorer | data set select, drag dots, mean ± SD, fences, bin width, add / remove, drill | data set dropdown | |
| Design randomizer | experiment select, Randomized / Blocked / Matched pairs, Not random, Randomize and run, Run 100, blinding, drill | experiment dropdown | |
| Distribution areas | normal and binomial study selects, Normal / Binomial, region, 68-95-99.7, inverse normal, drill | one dropdown grouped Normal / Binomial (a pick sets the distribution) | |
| p-value explorer | study select, observed result, Hₐ, p-value / errors and power, drill | study dropdown | |
| Probability trees | events select, probability buttons, tree / table / Venn / simulation, drill | events dropdown | |
| Regression lab | data set select, drag and add points, residual plot, drill | data set dropdown | |
| Sampling distributions | population, sample size, one / hundreds, drill | unchanged layout | |
| Sampling lab | population select, Simple / Stratified / Cluster / Systematic, Draw a sample, Draw 100, drill | population dropdown | |

## New copy for an accuracy check
Takeaways in `STD` in stat-tools.js (all ten).

## Accuracy check (F6b, 2026-11-16)
Checked the ten takeaways and task questions against the tools and the conclusion templates in
`docs/apstat-authoring-guide.md`.
- Correct as written: all task questions; the takeaways for chi-square, data explorer, design, distribution areas,
  p-value (conditions on H₀), probability trees, regression, sampling distributions and sampling lab.
- Changed: ci-capture now uses the guide's level template: "If we took many random samples and built a C% interval from
  each, about C% of the intervals would capture the true parameter."
- Per problem type (each tool had one line for every kind its drill deals): chi-square chooser; ci-capture claim (the
  template "convincing evidence ... only when every value in it agrees"); data-explorer describe, zscore;
  design-randomizer scope (the scope of inference template), confound, variables; distribution-areas inverse,
  empirical; p-value errors (Type I, Type II, power); probability-trees table, rules (the general addition rule);
  regression describe, correlation, predict (extrapolation), residual (actual minus predicted), lsrl (through (x̄, ȳ),
  b = r × s_y ÷ s_x); sampling-distributions estimator; sampling-lab bias. Each kind not listed keeps the tool's line.
