# Self-review: author D, Unit 3 topics 3.9-3.15 and Unit 5 (5.1-5.5)

Date 2026-10-17. Brief: `docs/apstat-briefs/content-common.md`; split: `docs/apstat-spec.md` section 5a.

## Topics done (12), all clean on `check-apstat-content.mjs --topic` and `check-apstat-map.mjs --check`

| Topic | CED | Items | In sets | Types | Figure |
|---|---|---|---|---|---|
| sampling-dist-two-proportions | 3.9 | 17 | 9 | single, numeric, setup | `diff-props-sim` (1,000 seeded simulations + normal curve) |
| ci-two-proportions | 3.10 | 17 | 10 | single, numeric, interval, setup, conclude | `two-prop-interval` |
| ci-two-proportions-claims | 3.11 | 15 | 8 | single, interval, conclude (3) | `intervals-vs-zero` |
| test-two-proportions-setup | 3.12 | 16 | 9 | single, numeric, setup, conclude | `pooled-proportion` |
| test-two-proportions | 3.13 | 16 | 9 | single, numeric, setup, conclude (3) | `two-prop-pvalue` |
| chi-square-setup | 3.14 | 16 | 10 | single, numeric, setup | `expected-counts-table` |
| chi-square-test | 3.15 | 16 | 9 | single, numeric, setup, conclude (2) | `chi-square-tail` |
| scatterplots | 5.1 | 16 | 12 | single, conclude | `sleep-reaction` |
| correlation | 5.2 | 15 | 9 | single, numeric, setup | `correlation-gallery` |
| linear-models | 5.3 | 15 | 8 | single, setup, conclude (slope, intercept) | `regression-line-predict` |
| residuals | 5.4 | 15 | 8 | single, numeric, setup | `residual-plot-pair` |
| least-squares-regression | 5.5 | 16 | 11 | single, numeric, setup, conclude (r2) | `influential-point` |

190 items in all; every topic is at least 80% apply/analyze and at least 50% in stimulus sets; the key is
strictly the longest option in at most 38% of single items per topic; no absolute words in any distractor.
Every lesson has 2-3 prerequisite checks pointing at earlier topics, a 4-step chain, a misconception and 6-7
check items; every notes page is 500+ words with worked examples written out in full; every taught concept
has a glossary entry.

**Regression exam sets (4, exactly 3 MC items each):** `linear-models-s1` (scatter with line: predict,
slope, extrapolation), `residuals-s2` (residual plot: fit, residual, interpretation), `least-squares-regression-s1`
(computer output: slope, r², s), `least-squares-regression-s2` (influential point: leverage, slope, r).

**FRQs (3, 10 points, one rubric line per point, full-credit samples, checks):**
`frq-two-proportion-interval` (inference; check: interval), `frq-chi-square-independence` (inference; checks:
expected count, p-value), `frq-regression-output` (analyze; check: residual).

**Figures:** 12 standalone SVGs from `scripts/apstat-figures/unit-3b.mjs` and `scripts/apstat-figures/unit-5.mjs`
(the drawing helpers live in unit-5.mjs; unit-3b imports them). Every number is computed there with
ApStatDist (simulations from a seeded generator, `ci2prop`, `z2prop`, `chi2table`, `lsrl`, densities).
All rendered to PNG and inspected; label overlaps, clipped lines and a stray tick label were fixed.

## Numeric recheck

Every numeric, interval and setup key was recomputed independently with SciPy 1.18 from the stem (author
scripts in my scratch folder) and compared with the build's recipe value (`fromValue`) and the ApStatExpr
value: 34 keyed items, 0 disagreements; every key graded right and every authored mistake graded wrong by
ApStatGrade / gradeSetup. FRQ checks (4) agree with SciPy. Conclude items carry `p` rounded from the recipe
value (checked within 1%). Plot stimuli are drawn from the `data` they carry.

## Map edits

None.

## Open points for the lead

1. **Lesson and notes figures overflow at phone width** (shell, not content): at 375 px, `.stat-figimg img`
   keeps its `width` attribute (620-700 px) and the page scrolls sideways (scrollWidth 638-698). Author C's
   `ci-one-proportion` lesson and notes do the same, so it is the figure wrapper's CSS (likely a flex/grid
   child without `min-width: 0`, or `display: inline-block` with no width cap). Stimulus plots are fine
   since I dropped explicit plot widths.
2. **Large counts for the two-proportion test**: taught with the pooled p_c (n1 p_c, n1(1 - p_c), ...), as
   the reference sheet's pooled SE suggests; whether readers also accept the observed counts is not
   confirmed (needs-author).
3. **Interval vs test agreement** for two proportions is taught as "nearly always" (pooled SE in the test,
   unpooled in the interval); reviewers please keep that wording.
4. **s from output** (needs-author `ced-text`): taught and assessed in 5.5 and the regression FRQ;
   output tables show only Coef, S and R-Sq (no SE Coef / T / P, to stay clear of slope inference).
5. `b = r s_y/s_x` is taught in 5.5 as a relationship and used in one setup item from summary statistics.
6. Literal dollar signs had to be written out ("95 dollars"): `$` is read as math in items and notes.
