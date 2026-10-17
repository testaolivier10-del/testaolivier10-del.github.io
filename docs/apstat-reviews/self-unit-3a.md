# Self-review: author C, Unit 3 topics 3.1-3.8 (2026-10-17)

## Topics done

All eight pass `node scripts/check-apstat-content.mjs --topic <id>`; `node scripts/check-apstat-map.mjs --check`
reports nothing used before it is taught.

| CED | Topic id | Items | In sets | Apply/analyze | Types beyond single |
|---|---|---|---|---|---|
| 3.1 | `estimators` | 17 | 9 (2 sets) | 15 | 2 multi |
| 3.2 | `sampling-dist-proportion` | 16 | 9 | 16 | 4 numeric, 1 setup, 1 multi, 1 conclude (claim) |
| 3.3 | `ci-one-proportion` | 16 | 9 | 16 | 4 numeric, 1 interval, 1 setup, 1 multi, 1 conclude (interval) |
| 3.4 | `ci-one-proportion-claims` | 15 | 9 | 15 | 1 multi, 3 conclude (claim, level, interval) |
| 3.5 | `test-one-proportion-setup` | 16 | 9 | 15 | 1 multi |
| 3.6 | `p-values` | 17 | 9 | 15 | 4 numeric, 1 setup, 1 multi, 2 conclude (p-value) |
| 3.7 | `test-one-proportion` | 16 | 9 | 15 | 3 numeric, 1 setup, 3 conclude (test), 1 order |
| 3.8 | `errors-and-power` | 16 | 10 | 14 | 1 numeric, 1 multi, 2 conclude (error) |

Total 129 items, 16 stimulus sets (tables, a data dotplot, a histogram, a simulation dotplot, two figure
stimuli, one computer-output table). Every topic has lesson JSON (5-7 check items, prerequisites pointing at
earlier topics, figure, chain, ideas, misconception, summary), notes HTML (500+ words, worked example before
each new calculation or writing type, comparison tables where useful) and glossary entries for every concept
it teaches.

FRQs: `statistics/data/frq/frq-one-proportion-test.json` (`inference`: homework survey, one-proportion z test,
10 points in 4 parts, p-value `check`) and `statistics/data/frq/frq-errors-consequences.json` (`multi`:
airline on-time claim, binomial probability, hypotheses, Type I and II errors with consequences, the
probability as the Type I error rate of a decision rule, sample size and power; 10 points in 6 parts,
binomial `check`).

## Figures

Generator `scripts/apstat-figures/unit-3a.mjs` (writes `statistics/figures/<id>.svg` and registers each in
`statistics/data/figures/<topic>.json` with the same alt text). Every bar and curve comes from `ApStatDist`
(exact binomial pmfs, normal densities) or a seeded simulation: `estimator-bias-variability`,
`phat-sampling-distribution`, `ci-construction`, `ci-capture-25` (25 simulated intervals, 22 capture),
`alternative-directions`, `p-value-tails`, `test-four-steps`, `power-alpha-beta`. Each was rendered to PNG and
inspected; overlaps and clipped bars were fixed. Notes and lesson pages were built to a scratch folder and
checked at 390 px (no horizontal scroll, no script errors).

## Numeric recheck

A scratch script recomputed every numeric, interval, setup and FRQ check key from the stems' own numbers with
an independent normal CDF (Simpson integration of the density, inverse by bisection) and exact binomial sums,
and loaded `stat-grade.js` and `stat-expr.js` in a vm: every key graded right (also at report rounding),
every authored mistake graded wrong, the three typed p-values in test conclusions within 5e-5 and on the
right side of α, and 14 numbers quoted in figures and stems (power 0.887 and β 0.11, cutoff 0.558, interval
ends, sample sizes, exact binomial p-value 0.0287 behind the simulated 0.03). Result: 40 checks, 0 failures.
Simulated plot data are generated with a seeded generator in the authoring scripts, and every count stated in
an item (dots at or beyond a value) is computed from the same data.

## Map edits (docs/apstat-dependency-map.json, my topics' concepts only)

1. `confidence-level` moved from `ci-one-proportion-claims` (3.4) to `ci-one-proportion` (3.3). Building an
   interval needs the confidence level and its critical value; 3.4 still teaches interpreting it.
2. New concept `convincing-evidence` (taught in 3.4, depends on `plausible`), and the alias "convincing
   evidence" removed from `reject` (3.7). The 3.4 claim template ("the interval gives convincing evidence
   that ...") needs the phrase before 3.7.

## Open questions (for needs-author)

- **Power calculations.** 3.8 has one numeric item and a notes worked example computing power from a given
  cutoff (a normal probability with the alternative's mean and SD). The old CED treated power mostly
  conceptually; the revised CED text for 3.8 is unread (`ced-text`). Keep or drop the numeric item.
- **Sample size for a margin of error.** 3.3 notes and one item solve for n (round up, 0.5 when no estimate).
  Confirm it is in the revised 3.3 objectives.
- **3.5 has no conclude item**: the decision and conclusion are taught in 3.7, and no conclude mode fits a
  setup topic. 3.1 has none either (not inference).
- **Bank-wide select-all rule**: the full check reports 3 of 29 select-all items with one correct option
  (needs 20%); 2 of my 8 have one key, the shortfall is in other units' items.
- **Figure text at phone width**: figures are 640 px wide with 15-16 px text, so text renders near 9 px at
  390 px, the same scale as the calculus figures. Owner may want larger type course-wide.

## Notes for the lead

- The bank JSON files were written by scratch authoring scripts (helpers for ids, option and explanation
  pairs, seeded data); the JSON in `statistics/data/questions/` is the source of truth now, so edit it directly.
- No git commands were run.
