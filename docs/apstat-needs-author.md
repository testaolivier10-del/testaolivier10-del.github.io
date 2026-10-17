# AP® Statistics: open questions for a person

Things a person (the owner, or an AP® Statistics teacher) should decide or check. Add to this file
instead of guessing; mark an entry resolved with the date and move it to the end.

## ced-text: the CED's Units 2-5 topic pages were not read (open, 2026-10-17)

WebFetch returns only the first 110k characters of the CED PDF (through Unit 2's topic list), and the
shell cannot download it (proxy 403). So:

- **Learning objectives and essential knowledge** were read for Unit 1 and topic 2.1 only. The
  `objectives` and `knowledge` lines for 2.2-5.5 in `docs/apstat-ced-map.json` are our summaries
  from the topic titles and the old course, not checked against the revised CED.
- **Four topic titles** come from third parties that agree with each other (Fiveable, num8ers,
  OnePrep): 4.3 (Justifying a Claim Based on a Confidence Interval for a Population Mean or Population
  Mean Difference), 4.5 (Carrying Out a Test for a Population Mean or Population Mean Difference), 4.9
  (Setting Up a Test for the Difference Between Two Population Means) and 5.4 (Residuals). Every other
  title is official (`source` per topic in the CED map).
- **Normal approximation to the binomial**: not mentioned in any readable official text (CED through
  Unit 2, reference sheet, revisions page, student page). Treated as not tested: the authoring guide
  forbids it in items. A person should check Units 2-3 of the CED.
- **Exclusion statements** in Units 2-5 (the CED marks some content "not assessed"): none could be
  read.
- **Regression output**: whether the exam still expects students to read s (the residual standard
  deviation) and SE of the slope from computer output, now that inference for slope is gone. The map
  teaches s in 5.5; the slope SE is not taught.

Resolved in Phase 0 from official text (2026-10-17): the 10% condition is in the course (the CED's
Unit 4 overview names it); pooled two-sample t is not (the 2026 reference sheet has only the unpooled
SE for means, and p_c only for two proportions); b = r·s_y/s_x is not on the 2026 sheet.

## u1-u2-review: judgment calls left by the Units 1-2 accuracy review (open, 2026-10-17)

From `docs/apstat-reviews/u1-u2.md`. None changes a key; a teacher should confirm.

- **z-scores in 1.9.** The CED's 1.9.D reads "Calculate z-scores with population parameters"; the course
  teaches $z = \frac{x - \bar{x}}{s}$ from sample summaries (with $\frac{x - \mu}{\sigma}$ named as the
  population form), and the FRQ `frq-u1-compare-distributions` part (c) uses sample means and SDs.
  Confirm that sample-based z-scores are fine for 1.9 items.
- **"Statistically significant" in 1.13.** The CED text read has the phrase only in the Unit 1 overview,
  not in topic 1.13's own statements; 1.13 teaches it as "too large to be explained by chance alone" and
  three items and the blocking FRQ use it. Confirm it belongs in 1.13 rather than only in Unit 3.
- **Direction of voluntary response bias.** `stat-sampling-problems-2` keys "overestimates the
  proportion who oppose the fee" (strong objectors are most motivated); the FRQ rubric for
  `frq-u1-survey-sampling` (c) accepts either direction with a reason. Confirm the single key is
  defensible as written.
- **CED 2.2-2.12 still unread** (see `ced-text`): this review could read Unit 1's objectives and 2.1's,
  nothing past the Unit 2 skill list.

## frq-scoring: the 10-point rubric split is an estimate (open)

No released 10-point scoring guideline exists beyond the CED sample. Our FRQs use one rubric line per
point and a part split chosen by the author (architecture, "FRQ"). Revisit when College Board releases
2027 scoring guidelines.

## set-format: other multiple-choice stimulus sets (open)

The two 3-question sets (probability, regression) are confirmed. Whether Section I has other shared
stimuli is not; practice uses 4-5 item sets as the other AP® courses do, and the exam forms use only
the two exam sets plus standalone questions.

## identity: accent, icon, headline, ranks (owner to confirm, 2026-10-17)

Proposed in spec decision 5 and built that way: plum accent (`#6E2470` on `#F5E6F4`), a bell curve
over histogram bars, "AP® Statistics, one idea at a time.", ranks Data Collector to Statistics Legend.
Each lives in one place (`IDENTITY` in `scripts/lib/apstat-build.mjs`, `assets/theme.css`,
`statistics/assets/stat.css`, `TITLES.apstat` in `assets/hub-progress.js`).

## free-tier: Unit 1 and the math chapter (owner to confirm, 2026-10-17)

Decision 10, built as proposed: `FREE_UNITS` in `scripts/lib/apstat-build.mjs` and `freeChapters` in
`assets/premium.js` (keep the two equal).

## tools-premium: which trainers are free (owner to confirm, 2026-10-17)

`sampling-distributions`, `data-explorer` and `probability-trees` are free; the other seven are
Premium (`statistics/data/pages.json`, the only place that says so).

## no-band: no readiness band on exams (owner to confirm, 2026-10-17)

Decision 6 goes further than the other AP® courses: exam results show section percentages and
breakdowns, never an estimated AP® score. Built that way; `statistics/assets/pages/exams.js` has no
band and there is no score calculator page.

## unit3-review: points left open by the Unit 3 accuracy review (open, 2026-10-17)

From `docs/apstat-reviews/u3.md`. The CED's Unit 3 pages are still unread (`ced-text`: WebFetch stops at
character 109,952, before Unit 3; another scraper was out of credits), so these stay with a person:

- **Large counts for the two-proportion test.** 3.12, 3.13 and their items check $n_1 p_c$, $n_1(1 - p_c)$,
  $n_2 p_c$, $n_2(1 - p_c)$ (the old CED's wording, which matches the pooled SE on the reference sheet).
  Scoring guidelines have usually also accepted the observed successes and failures. No item makes the observed
  counts wrong, but `stat-test-two-proportions-setup-4` keys only the pooled check. Confirm against the revised CED.
- **Power as a calculation (3.8).** `stat-errors-and-power-7` and the notes compute power from a stated cutoff.
  Keep if the revised 3.8 still has power only conceptually plus "factors that affect power"; retire the numeric
  item otherwise (rewrite it in place, keep its id).
- **Sample size for a margin of error (3.3).** Notes and `stat-ci-one-proportion-9` solve for $n$. Confirm it is in
  the revised 3.3 objectives.
- **Interval and test agreement (one proportion).** Now taught as "almost always agree" (the test's SD uses
  $p_0$, the interval's SE uses $\hat{p}$), as 3.11-3.13 already did; keep that wording course-wide.

## u4-u5-review: points left open by the Units 4-5 accuracy review (open, 2026-10-17)

From `docs/apstat-reviews/u4-u5.md`. The first two need a change to shared runtime code, which the review
did not touch; content workarounds are in place.

- **The `df` grader rounds to the nearest whole number** (`statistics/assets/stat-grade.js`, `numeric`, the
  `count`/`df` rule `Math.round(v) === Math.round(x)`). Judgment: this does not match the course's own
  convention or the exam. Readers do not score df alone; they accept the technology df (25.58, at any
  sensible rounding) or the conservative df, and judge the $t^*$ or p-value that follows; with Table B the
  course says "round the row down". The rule had two effects in `stat-ci-two-means-3` (key 25.58): the Table B
  row 25 was graded wrong while 26 was graded right, and 26 is also $n_1 + n_2 - 2$, the pooled df the
  course excludes, so that slip cannot be authored as a mistake. Content workaround: the item now lists
  `alts: [25]`. Proposed fix (lead): for `df`, accept a typed value within `tol` of the key, `floor(key)` and
  the `alts`; drop the nearest-integer rule (or keep it only with a note that Table B rows round down).
- **Two-sample intervals cannot accept both df routes without also accepting $z^*$.** The interval grader
  has no `alts`, so `stat-ci-two-means-4`, `-8` and `stat-ci-two-means-claims-11` used a wide `tol`
  (0.3, 0.1, 0.03) to admit the conservative interval, and that band also admitted the $z^* = 1.96$ interval,
  a slip the CED's Unit 4 overview names (confusing t and z). Content workaround: each stem now says "Use the
  technology degrees of freedom" and the `tol` is narrow (0.05, 0.03, 0.01); the explanation names the
  conservative interval as also accepted on the exam. Proposed fix (lead): for an `interval` with
  `from.fn: "ci2mean"`, have `prepareBank` add the conservative interval as an accepted alternative (as
  `fromValue` already does for numeric `lo`/`hi`), then the stems can go back to either df.
- **Residual plots draw the x axis through 0** (`statistics/assets/tools/stat-plot.js`, `kind: "resid"`
  has no `leftAxis`, and the frame puts the x axis at y = 0). Tick labels then sit among the points: in
  the regression exam set `residuals-s2`, the 88°F residual ($-1.0$) lands on the "90" label. Proposed:
  draw the axis at the bottom for `resid` and keep the dashed zero line. Data dotplots also place the
  x-axis label inside the plot at the lower right, where tall stacks can cover it (two stimuli were given
  wider x ranges to clear it).
- **CED Units 4-5 pages still unread** (`ced-text`). WebFetch reached the Unit 4 overview ("students often
  confuse t-tests with z-tests", hypotheses about parameters) and the titles of 4.1, 4.2, 4.7, 5.1, 5.3
  and 5.5, nothing from the topic pages. Still to confirm: whether reading $s$ from output is assessed
  (taught in 5.5 and the regression FRQ), and whether 5.5 still expects $b = r\frac{s_y}{s_x}$ as a
  relationship (taught, one setup item).

## tools-review: points left open by the trainers accuracy review (open, 2026-10-17)

From `docs/apstat-reviews/tools.md`. Every drill key passed an independent SciPy recheck; these are judgment calls.

- **Rules of thumb graded as keys.** `regression-lab` "How strong is it?" keys strong/moderate/weak from
  |r| ≥ 0.8 / 0.5 to 0.8 / below 0.5, and `data-explorer` "What is the shape?" keys skewed or roughly
  symmetric from a skewness rule. Both rules are stated in the feedback and the generators keep every
  problem far from a border (|r| ≥ 0.88, 0.56-0.72, 0.15-0.38; skewness ≥ 0.8, ≤ −0.8, |g| ≤ 0.25), but the
  course has no fixed cutoffs. Confirm this is acceptable, or turn strength into a comparison item.
- **The 2 SD outlier rule.** `data-explorer` z-score drills key "outlier" as |z| > 2 and the solution says
  the course also uses 1.5 × IQR and the two can disagree. Confirm the revised CED (1.8-1.9) still names
  the 2 SD rule.
- **Bias names.** `sampling-lab` offers "Convenience sampling bias" beside undercoverage, nonresponse,
  response and voluntary response bias. Confirm the course term (some texts say only "convenience
  sampling" is the method and the bias is "likely not representative").
- **Very small p-values in Explore.** `chi-square-lab` and `p-value-explorer` show a p-value under
  0.00005 as 0.0000 in the Explore pills and Why sentence ("Because 0.0000 is less than α"). The drills
  never reach it. Consider "less than 0.0001" there.
