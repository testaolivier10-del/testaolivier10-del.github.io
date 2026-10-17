# Trainers review (the ten AP® Statistics tools)

Independent accuracy check, 2026-10-17, of the ten trainers in `statistics/assets/tools/` (page scripts),
`statistics/assets/tools/math/` (models), `statistics/data/tools/` (contexts) and their validators in
`scripts/lib/apstat-tool-checks/`, against `docs/apstat-spec.md` section 6 and the conclusion templates.
Unit content was not touched.

## What was checked

- **Every model read in full** (all ten `math/<slug>.js`): the explore statistics and every drill kind,
  each step's key, every authored mistake and its explanation, every option and its feedback, every worked
  solution line.
- **Numeric recheck by my own code.** A scratch dumper generated 120 problems per context and type (16,560
  problems) with the page's own generator; a separate Python script recomputed every key from the stated
  data only (the counts, the summary statistics, the data list, n and p), with SciPy
  (`chi2_contingency(correction=False)`, `norm`, `t`, `binom`, `linregress`, `skew`), never from the
  model's own numbers. Also checked: every decision and conclusion option against p < α, the interval text
  against its endpoints, large counts and expected counts when a problem says "the conditions are met",
  that every choice step has exactly one key and no duplicate options, and that the pictured counts (the
  capture figure, the two-way table html) match the keys. Result: 58,985 keys and choice checks, 0 wrong
  keys. The only remaining differences are 12 half-way roundings of a stated mean or SD (JS rounds 16.925
  up to 16.93, Python's binary float gives 16.92: the page is right) and one simulation tail (below).
- **Runtime graders.** The validators (which grade every key right and every mistake wrong through
  `ApStatMath.diagnose` / `diagnoseExpr`) and all ten tool tests pass; `check-apstat-content --check`
  reports tools 0 failing; `check-apstat-map` "Nothing is used before it is taught."
- **Templates.** Every conclusion option: parameter in context ("the true proportion of all ..."),
  direction matching Hₐ, "convincing evidence" wording, p-value compared with α with the inequality,
  no "accept", "prove", "95% of the data" or a statement about the sample as the key (each appears only as
  a distractor with its slip named). Type I/II sentences carry "when H₀ is true". Interval and level
  interpretations, slope ("predicted"), r², s, residual, z-score and describe sentences follow the course
  wording.
- **Rendered.** Built with `--out` into my scratch folder and served on port 8941; every tool in Explore and
  Test yourself at 390 and 1440 px, light and dark (80 screenshots, external hosts blocked, service workers
  blocked), plus interactions (sampling-distributions +1,000 samples, ci-capture Build 100 twice). No page
  errors, no horizontal overflow. Checked by eye: the 1,000 simulated x̄ (SD 4.68 against σ/√n = 4.61), the
  chi-square table (expected counts, df 6 cutoff 12.59, p 0.1018), the tree/table/Venn (45/5/76/874 from
  0.05, 0.9, 0.08; circle areas 0.05 and 0.121), the data-explorer histogram bins, fences and whisker, the
  binomial bars, the p-value shading, the 100 intervals and their capture count.

## Changes

| Tool | File | What was wrong | Fix |
|---|---|---|---|
| shared | `stat-tools.js` (studio drill caption) | The caption over a drill figure was built with `plainText`, so formulas read "p-hat", "x-bar", "H_0" | New `capHtml`: the caption keeps each formula as its rendered MathML (p̂, x̄, H₀, α = 0.05) plus inline emphasis; tables and controls left out. Radio `aria-label`s keep the plain reading. No `assets/course/` file changed |
| probability-trees | `math/probability-trees.js`, data | An "independent" two-way table set the B column from P(B \| A), so the screening context showed 80% of all patients testing positive with the test independent of the condition | B total from the drawn P(B); new context flag `noIndep` set for the screening test (independence there is absurd) |
| p-value-explorer | `p-value-explorer.js` | Explore pill "p ≥ α" (p is the parameter on this page) | "p-value ≥ α" / "p-value < α" |
| p-value-explorer | `p-value-explorer.js` | Drill figure on a phone: the axis name p̂ ran into the first tick ("p̂0.90") | First tick kept 18 px clear of the axis name |
| p-value-explorer, chi-square-lab | `math/*.js` `P4` | A drill p-value between 0.00005 and 0.0001 printed as "0.0000" ("Because the p-value of 0.0000 is less than α") | Shown to 4 places (0.0001) |
| data-explorer | `math/data-explorer.js` | "but only 132 below it" when the lower reach was the longer one (skewed left) | Neutral "… above the median and 132 seconds below it" |
| data-explorer | model, data, validator | "The battery lifes" | Optional `whats` plural ("battery lives"); validator accepts it |
| ci-capture, sampling-distributions | models, data | "phones … who need a repair", "the sample who have a flaw" (screens) | Optional `rel` ("that") for non-person populations |
| ci-capture | `math/ci-capture.js` | "the method misses 10% of the time" | "intervals built this way miss the parameter about 10% of the time" |
| regression-lab | `math/regression-lab.js` | Extrapolation values 1.5 to 3 ranges beyond the data (153°F, a 37-year-old car) | 0.6 to 1.2 ranges beyond (still clearly outside the data) |
| regression-lab | same | "The actual cups of cocoa sold of a single one varies" | "Actual values of … vary around the line" |
| regression-lab | same | Worked a = ȳ − b x̄ showed b rounded but the key used full b (62.50 − 8.17 × 2.72 printed = 40.26; that arithmetic gives 40.28) | b shown with one more place in that line |
| design-randomizer | `math/design-randomizer.js` | Scope feedback said "Volunteers may differ" for tomato plants; distractor "The tomato plants who want the new fertilizer" | Feedback names the units; non-human contexts get "The first 20 plants on the list get …" with its own reason |
| sampling-lab | `math/sampling-lab.js` | The "repeats" step marked "start the whole sample again" wrong while its own feedback said "not wrong in effect" (it is a valid SRS) | Replaced by a clearly wrong slip: take the next label instead (gives neighbours of chosen units two chances) |
| sampling-lab | data `hospital` | Convenience sample in the hospital lobby on Monday, for a population of patients discharged last month | At the follow-up clinic, where last month's patients return |
| sampling-distributions | `math/sampling-distributions.js` | Estimator drill: with 200 draws an unbiased statistic's picture could sit 3 standard errors off (seed 54: R centered 141.2 against 144) while the key says it centers at the true value | Each simulated row is shifted so its center is exactly the statistic's own center; spread unchanged |

No drill key was wrong; no key changed. Step ids are unchanged, so first-try records keep their meaning.
Problem streams for a given seed changed in probability-trees (table), regression-lab (predict),
sampling-lab (none: text only) and sampling-distributions (estimator values); the validators regenerate them.

## Checked and fine

- Chi-square: expected counts, components, df (r − 1)(c − 1), upper tail, design chooser and hypotheses;
  every table stated "conditions met" has all expected counts ≥ 5; the chooser's small tables are below 5.
- Intervals: z* and t* (two tails), SE, ME, the Table B route accepted for t*, interval text, the claim from
  an interval (p₀ below the whole interval or inside it), 99% wider, 4n halves ME, the 20-interval capture
  count matches the drawn figure; every capture problem meets large counts.
- Data explorer: AP quartiles (median left out when n is odd), sample SD, fences, whiskers, resistance,
  describe sentences (outlier wording matches the 1.5 × IQR result), z-scores from the stated rounded mean
  and SD.
- Distribution areas: normal areas and both z's, inverse normal and x = μ + zσ, every binomial wording to
  its inequality, binomial mean and SD, empirical-rule percents and the exact areas.
- p-value explorer: SE with p₀, z, one- and two-sided p-values, t tests with n − 1, the p-value meaning
  options, doubling/halving, Type I/II, β from the normal model of p̂ at the cutoff, power = 1 − β.
- Probability trees: paths, P(B), P(A | B), table probabilities, independence from counts, addition rule,
  mutually exclusive and independent from P(A), P(B), P(A and B); no impossible probabilities.
- Regression: printed line from the data's LSRL, ŷ, residuals, b = r s_y / s_x and a from the stated
  summaries, r from the data, direction, strength band.
- Sampling distributions and sampling lab: σ/√n, √(p(1 − p)/n), difference SDs from added variances,
  CLT/normal-population and large-counts keys, normal probabilities; systematic k, proportional
  allocation (largest remainder, adds to n), cluster counts.

## Left open

- `docs/apstat-needs-author.md` `tools-review`: rules of thumb used as keys (r strength, skewness), the 2 SD
  outlier rule, the bias name "convenience sampling bias", 0.0000 in Explore for tiny p-values.
- Cosmetic, not fixed: the "Start here" cue stays after the first action in sampling-distributions
  (+100/+1,000) and ci-capture; the ci-capture empty-state text sits on the true-value line; the
  regression residual plot labels its y axis at ± the largest residual (3.73) rather than nice ticks.
- One rare simulation tail: the sampling-distributions shape drill (commute, n = 2, seed 65) draws the
  sampling distribution with SD 8.75 against σ/√n = 10.31 (2.8 standard errors), while the feedback says
  "SD close to σ/√n". The picture is still clearly between the other two; left as chance.
