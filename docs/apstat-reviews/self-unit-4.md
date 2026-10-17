# Self-review: Unit 4 (author E), 2026-10-17

Unit 4, Inference for Quantitative Data: Means, topics 4.1-4.10, and the two FRQs assigned to author E in
`docs/apstat-spec.md` section 5a. Every topic passes `node scripts/check-apstat-content.mjs --topic <id>` and
`node scripts/check-apstat-map.mjs` reports nothing used before it is taught. A scratch build
(`APSTAT_PUBLISHED=unit-4`) builds all 10 topics, and the map's page scan of the built lessons and notes is clean.

## Topics done

| CED | Topic | Items | Types | In sets | Apply/analyze | Notes words | Figure |
|---|---|---|---|---|---|---|---|
| 4.1 | `sampling-dist-mean` | 16 | 10 single, 4 numeric, 1 setup, 1 multi | 56% | 94% | 1000 | `xbar-sampling-panels` |
| 4.2 | `ci-one-mean` | 17 | 7 single, 5 numeric, 2 interval, 1 setup, 2 conclude | 59% | 94% | 1049 | `t-vs-normal` |
| 4.3 | `ci-one-mean-claims` | 17 | 11 single, 1 numeric, 1 interval, 3 conclude, 1 multi | 53% | 100% | 786 | `mean-interval-claims` |
| 4.4 | `test-one-mean-setup` | 16 | 14 single, 1 conclude (Type I), 1 multi | 56% | 94% | 892 | `paired-before-after` |
| 4.5 | `test-one-mean` | 16 | 5 single, 5 numeric, 1 setup, 4 conclude, 1 multi | 56% | 100% | 861 | `t-test-pvalue` |
| 4.6 | `sampling-dist-two-means` | 16 | 10 single, 4 numeric, 1 setup, 1 multi | 56% | 88% | 736 | `diff-means-normal` |
| 4.7 | `ci-two-means` | 16 | 7 single, 3 numeric, 2 interval, 1 setup, 2 conclude, 1 multi | 56% | 100% | 825 | `two-sample-interval` |
| 4.8 | `ci-two-means-claims` | 16 | 11 single, 1 interval, 3 conclude, 1 multi | 50% | 100% | 763 | `diff-interval-claims` |
| 4.9 | `test-two-means-setup` | 16 | 14 single, 1 conclude (Type II), 1 multi | 56% | 100% | 787 | `paired-vs-two-sample` |
| 4.10 | `test-two-means` | 16 | 7 single, 4 numeric, 1 setup, 3 conclude, 1 multi | 56% | 100% | 818 | `two-sample-t-pvalue` |

Total 162 items: 96 single, 26 numeric, 6 interval, 6 setup, 19 conclude, 9 multi. Each topic has two
stimulus sets (4-5 items) built on a data display (dotplot, side-by-side boxplots, paired table) or a study
description with a summary table; keys are the strict longest option in at most 40% of a topic's singles; no
absolute words in any distractor. Every topic has a lesson (hook, prereqs to earlier topics, figure, chain,
ideas, misconception, 6-7 check items, summary), notes with worked examples before each new calculation or
writing type and the conclusion templates written out, and a glossary entry for every concept it teaches.
Comparison tables from the map are in the notes: z versus t (4.2), paired versus two-sample (4.9), and the
"Choosing the inference procedure" pathway (4.10).

## FRQs

- `frq-paired-interval` (inference, Q3): a fuel additive tested on 12 randomly chosen buses, each run with and
  without it. Parts: procedure and parameter (2), conditions (3), the 95% paired t interval with work (3,
  `check` interval 0.43 to 0.87 mpg), interpretation and the "more than 0.5 mpg" claim (2).
- `frq-two-sample-test` (inference, Q3): weekly homework hours in online and in-person sections from two
  random samples. Parts: hypotheses and parameters (2), procedure and conditions (3), t and p-value with work
  (3, `check` p-value 0.0251, conservative 0.0270 accepted), conclusion and scope (no causation, 2).

## Figures

Ten SVGs drawn by `scripts/apstat-figures/unit-4.mjs` (writes `statistics/figures/<id>.svg` and
`statistics/data/figures/<topic>.json`): every curve from `ApStatDist`, every histogram from a seeded
simulation, boxplots with the AP quartile rule. White background, `role="img"` with `<title>` and `<desc>`,
Arial, ink `#1F2A28`, plum `#6E2470`, Okabe-Ito blue, green and vermillion. All ten rendered to PNG with
Playwright and inspected; overlaps fixed (label halos, legend placement). Item stimuli use `plot` specs
(dotplots, side-by-side boxplots) drawn from the stated data.

## Numeric recheck

Every numeric, interval and setup key (38 items, plus the 2 FRQ checks) was recomputed in a separate SciPy
script from the numbers in each stem, not from the recipes: 40 of 40 agree to 1e-6. With the build's
`prepareBank` applied (so the table-route `alts` are present), every key and alt is graded right by
`ApStatGrade` and every authored mistake is graded wrong, for numeric and setup items. Each plotted data set
was checked against the summary its stem states (means and SDs to the stated places, no outliers where the
text says none). Two-sample intervals carry a `tol` wide enough to accept the conservative-df route (said in
each explanation).

## Map edits (`docs/apstat-dependency-map.json`, my topics only)

1. `conservative-df` moved from `test-two-means` (4.10) to `ci-two-means` (4.7), depending on
   `two-sample-t-interval` instead of `two-sample-t-test`: the two-sample t interval in 4.7 already needs the
   technology versus conservative df choice (authoring guide, "Tables and technology").
2. That left 4.10 teaching nothing, so a new concept `two-sample-t-statistic` ("two-sample t statistic",
   taught in `test-two-means`, depends on `two-sample-t-test` and `t-statistic`), parallel to Unit 3's
   `two-sample-z-statistic`. The concept count in `docs/apstat-phase0.md` (187) is now out of date by one.

## Open points for the lead (for needs-author or the shared code)

- **Builder bug, shared file `scripts/lib/apstat-build.mjs` `fromValue`:** for `normCdf` with
  `complement: true`, the Table A route added to `alts` is not complemented, so the runtime would accept the
  wrong-tail answer (for example 0.965 for a key of 0.035). The content check misses it because
  `numericProblems` grades without `alts`. I avoided `complement` on normal recipes (using
  `normCdf(2μ − a, μ, σ)` by symmetry); other units' items may be affected. The fix is to apply the
  complement to `out.table` too.
- The `df` kind grades a typed whole number right when it rounds to the technology df (26 is accepted for
  25.58). Probably intended; it means "n1 + n2 − 2" cannot be authored as a df mistake when it happens to
  round to the Welch df.
- 4.3 and 4.9 titles are third-party (needs-author `ced-text`); content follows the topic titles as listed.
- Whether the exam expects the Welch df formula itself: not taught (technology gives it); only the conservative
  rule is taught by hand.
