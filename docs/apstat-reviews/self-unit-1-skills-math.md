# Self-review: Unit 1 and "Math you need" (author A, Phase 1)

Brief: `docs/apstat-briefs/content-common.md`; assignment `docs/apstat-spec.md` section 5a, author A.
Status 2026-10-17: every topic passes `node scripts/check-apstat-content.mjs --topic <id>`; the full
content run reports 0 failing and no bank-level (test-wise or near-duplicate) problems;
`node scripts/check-apstat-map.mjs --check` passes; `node --test scripts/test/apstat-*.test.mjs` 159 pass, 0 fail.

## Topics done (18)

Each has a lesson, notes (concept topics 500+ words, worked examples before every calculation or writing
type), questions, glossary (every concept the map lists for it) and a registered figure.

| Topic | Items | In sets | Figure |
|---|---|---|---|
| 1.1 intro-statistics | 17 | 2 sets, 47% | study-path |
| 1.2 variables | 16 | 2 sets, 50% | data-table-anatomy |
| math-fractions-percents | 11 | (skill) | part-of-whole |
| 1.3 one-categorical-tables | 16 | 2 sets, 50% | counts-to-relative |
| 1.4 one-categorical-displays | 16 | 2 sets, 50% (bar plot; inline SVG of a cut-off axis) | bar-and-pie |
| 1.5 one-quantitative-displays | 16 | 3 sets, 75% (dotplot, stemplot, cumulative chart) | bin-width |
| 1.6 describing-distributions | 16 | 2 sets, 50% (two histograms) | four-shapes |
| math-formulas | 11 | (skill) | distances-from-average |
| 1.7 summary-statistics | 17 | 2 sets, 53% | mean-median-pull |
| 1.8 boxplots | 16 | 2 sets, 56% | box-from-dots |
| 1.9 comparing-distributions | 16 | 2 sets, 50% (parallel boxplots; summary table) | compare-and-z |
| 1.10 investigative-questions | 16 | 2 sets, 50% | question-to-plan |
| 1.11 random-sampling | 16 | 2 sets, 56% | four-samples |
| 1.12 sampling-problems | 16 | 2 sets, 56% | frame-and-response |
| 1.13 experimental-design | 18 | 2 sets, 50% | block-design |
| math-inequality-words | 11 | (skill) | inequality-lines |
| math-counting | 10 | (skill) | choose-two-of-four |
| math-lines | 10 | (skill) | slope-intercept |

**265 items**: 211 single (4 options), 21 numeric, 10 setup, 16 multi, 5 order, 2 conclude (a z-score
interpretation in 1.9, a scope-of-inference statement in 1.13). Every topic is 80% or more apply/analyze.
Key-length balance per topic: the key is strictly the longest in at most 4 and strictly the shortest in at
most 4 single items (numeric options are bare numbers). Distractors avoid absolute words; the one left is
the term "a completely randomized design".

**FRQs (3)**, 10 points, one rubric line per point, a typed full-credit sample per part:
`frq-u1-compare-distributions` (analyze: parallel boxplots and a summary table of clinic wait times;
comparison, 1.5 × IQR fence with a `check`, z-scores, a claim from the medians),
`frq-u1-survey-sampling` (collect: investigative question, stratified sample justified, voluntary response
bias with direction, SRS procedure, scope), `frq-u1-experiment-blocking` (collect: treatments, units,
response; randomized block design with a procedure; why block; cause and scope; control of water).

**Figures (18)**: `scripts/apstat-figures/unit-1.mjs` writes `statistics/figures/<id>.svg` (white
background, `role="img"`, `<title>` and `<desc>`, Arial, ink, plum and Okabe-Ito colors). Data figures are
drawn from the arrays in the script (exported as `DATA`), with quartiles and fences from `ApStatDist`.
Every figure was rendered to PNG with Playwright and checked; overlaps and clipped labels were fixed.
Stimulus plots were rendered at 390 px with the course CSS and checked.

## Numeric recheck

All 31 calculated keys (21 numeric, 10 setup) were recomputed in my own scratch code from the stem, with
my own mean, median, quartile (AP® rule), IQR and SD functions, not from the recipes; every one agrees
with its `from` recipe (or the setup expression) to 1e-9, and each independent value is graded right by
`ApStatGrade`. The FRQ fence check and the FRQ z-scores (table route 1.26 and 0.97, technology 1.27 and
0.97) were recomputed the same way. The content check confirms every authored mistake is graded wrong.
Every plot stimulus draws exactly the values in its `data`, and where the stem lists the values (battery
lives, nurse commutes, bus routes) the listed values equal the data arrays.

## Map edit (one, my topic's concept)

`statistic` (taught in `variables`): term `statistic` → `statistic (number)`, alias `statistics (numbers)`
removed (aliases now `sample statistic`, `sample statistics`). Reason: the scanner adds the plural of a
term, so "statistics" became a term of 1.2 and every use of "statistics" (and "AP® Statistics") in 1.1,
which teaches "statistics (field)", failed the ordering rule. Side effects: bare "statistic" is no longer
scanned before 1.2 (only 1.1 precedes it, and it does not use the word), and the glossary headword reads
"statistic (number)", like "statistics (field)".

## Open points for the lead

1. **Plot renderer (shared, not edited).** `stat-plot.js` draws `xLabel` at the right end just above the
   axis, so it overlaps data at the right end of dotplots and histograms. I widened `x` and used short unit
   labels ("minutes", "hours") with the variable named in the stimulus text. Dotplot y ticks sit between
   the dot rows (dots at 0.5, 1.5, ...), so I set `yTicks: false` on dotplots; that may be a better
   default for `kind: 'dot'`. Boxplot group names overlap the left axis line a little.
2. **Recipes.** `FROM_FNS` has no division or z-score function, so a proportion key is `mean` of a 0/1
   list (k ones out of n) and z-scores are `setup` items. A `prop(k, n)` and `z(x, mean, sd)` recipe would
   read more clearly. Also `numericProblems` refuses a string `answer` ("46/200") that `prepareBank`
   accepts; one of them should change.
3. **Ordering limits that shaped the writing.** "at least", "at most", "fewer than" cannot appear in Unit 1
   (taught in `math-inequality-words` before 2.4), nor "probability", "simulation", "normal",
   "confidence", "mean" before 1.7 (so 1.6 describes center without the median), nor "bias" before 1.12.
   Stems use "30 minutes or more" and the like. Consider whether "at least" belongs in `everydayWords`.
4. The three later math skills (`math-inequality-words`, `math-counting`, `math-lines`) build only when
   the unit of their anchor topic is published (by design in `topicLive`).
5. Figures are 720 px wide (as in other courses), so on a 390 px phone their 12-13 px labels render at
   about 7 px. Readable when zoomed; a larger label size would help if the lead wants it course-wide.
6. FRQ point splits are our estimate (needs-author `frq-scoring`). Rubric lines accept the table route and
   the technology value where they differ.
7. Lesson `connections` to later units say "Next: topic 2.4" (and 2.10, 5.1) instead of the topic title,
   so the link text uses no term taught later.

Scratch builders (not part of the repo): the topic sources, the recheck, plot previews and the length
balance tools live in my scratch folder; the JSON in `statistics/data/` is the source of truth now.
