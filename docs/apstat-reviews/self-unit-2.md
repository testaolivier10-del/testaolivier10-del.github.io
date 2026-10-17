# Self-review: AP® Statistics Unit 2 (author B, Phase 1)

Author B, 2026-10-17. Brief: `docs/apstat-briefs/content-common.md`; assignment: `docs/apstat-spec.md` 5a.

## Done

All 12 CED topics, 2.1 to 2.12: lesson, notes (500+ words each, 8,950 words in all, worked examples before every
new calculation, comparison tables), question bank, glossary (every concept the map teaches in the topic), figures.
Each passes `node scripts/check-apstat-content.mjs --topic <id>`; `check-apstat-map.mjs --check` passes.

| Topic | Items | Types | Exam set |
|---|---|---|---|
| two-categorical-displays (2.1) | 16 | 10 single, 4 numeric, 1 conclude, 1 multi | |
| two-categorical-summaries (2.2) | 16 | 8 single, 5 numeric, 1 setup, 1 conclude, 1 multi | |
| simulation (2.3) | 16 | 10 single, 4 numeric, 1 conclude, 1 order | |
| probability-intro (2.4) | 16 | 7 single, 7 numeric, 1 setup, 1 multi | |
| mutually-exclusive (2.5) | 16 | 9 single, 5 numeric, 1 setup, 1 multi | |
| conditional-probability (2.6) | 16 | 7 single, 6 numeric, 2 setup, 1 conclude | two-way table |
| independence-unions (2.7) | 16 | 9 single, 6 numeric, 1 setup | Venn diagram (union, conditional, independence) |
| random-variables (2.8) | 16 | 8 single, 7 numeric, 1 setup | |
| random-variable-parameters (2.9) | 16 | 9 single, 5 numeric, 1 setup, 1 conclude | discrete distribution |
| binomial-distribution (2.10) | 17 | 9 single, 6 numeric, 1 setup, 1 conclude | binomial |
| normal-distribution (2.11) | 16 | 9 single, 5 numeric, 1 setup, 1 conclude | normal |
| sampling-distributions (2.12) | 16 | 13 single, 2 numeric, 1 conclude | |

193 items; every topic at least 88% apply/analyze and 44% in stimulus sets; key-longest at or under 40% per topic;
no absolute words in any distractor. **5 probability exam sets** (`set: "probability"`, 3 single items each).

**FRQs (2):** `frq-binomial-claim` (multi: define X, binomial with conditions, P(X ≤ 8) = 0.0181 with `check`, the
claim, mean np, a randomized fertilizer experiment; units 2 and 1) and `frq-two-way-conditional` (analyze: both
conditional probabilities and why they differ, the association, an independence check, the addition rule with
`check`, a "more than twice as likely" claim). 10 points each, one rubric line per point, Bluebook-typed samples.

**Figures (13)**, all drawn from the item data by `scripts/apstat-figures/unit-2.mjs` (seeded simulations, ApStatDist
curves), registered in `statistics/data/figures/<topic>.json`, rendered to PNG and inspected (labels, overlaps,
scales fixed): commute and library segmented bars, park table (joint, marginal, conditional), council simulation
dotplot, dice grid, event diagrams, screening tree, clubs Venn, cars probability histogram, tacos balance point,
binomial n = 10, p = 0.3 with X ≥ 4 shaded, empirical rule, CLT panels. Stimuli also use plot specs (dot, bar, box,
hist, density). A scratch build (`APSTAT_PUBLISHED=unit-2`) rendered lessons and notes at 390 px with no horizontal
scroll and no page errors.

## Numeric recheck

A scratch script recomputed 88 keys from the stems with code independent of ApStatDist (exact fractions,
binomial by factorials, normal CDF by Simpson's rule, inverse normal by bisection, simulation counts from the
plotted data), including the numeric keys of the exam-set single items and both FRQ checks, then graded each key
right and each authored mistake wrong in a vm with `stat-grade.js` and `stat-expr.js`. Result: 0 problems.

## Map edit (one)

`probability` (concept) `taughtIn` moved from `probability-intro` (2.4) to `simulation` (2.3): 2.3 is "Estimating
Probabilities Using Simulation" and cannot be written without the word. Nothing else changed; the map check passes.

## Notes for the lead and reviewers

- Ordering forced some wording: no "at least/fewer than" before 2.4 (math-inequality-words sits between 2.3 and
  2.4), no "combination" before 2.10, no "convincing evidence" anywhere in Unit 2 (it is a Unit 3 term), so
  probability-based claims say "gives reason to doubt the claim". 2.12 avoids "standard deviation of the sample
  mean/proportion", "large counts" and "10% condition" (Units 3 and 4); it teaches $\sigma_{\bar{x}} = \sigma/\sqrt{n}$
  and the CLT and leaves the spread of $\hat{p}$ to Unit 3.
- Check script quirk worth knowing: `POS_RE` flags "(A)" and "A and B" in explanations, so event letters in item
  explanations avoid A to E (P(A) inside a why fails). Literal dollars must be written `\$`.
- Probabilities from tables and weighted means have no `from` recipe (no division or weighted-mean fn in
  `FROM_FNS`), so those keys are typed at full precision from scratch code and covered by the recheck above.
- Bank-wide: select-all items with exactly one key were 4 of 31 across the whole bank; three of mine were changed to
  one key (now 7 of 31). The rule fails once published if other authors add many two-key items.
- Open (for needs-author): 2.12's scope is our reading (CED 2.12 objectives unread, `ced-text`): it includes a normal
  probability for $\bar{x}$ by the CLT; move it to 4.1 if the CED keeps calculations out of 2.12. The 2.11 notes say
  Table A runs "from about −3.4 to 3.4".
