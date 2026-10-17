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
