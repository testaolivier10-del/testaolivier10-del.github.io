# AP® Statistics: Phase 0 dependency map

The map is `docs/apstat-dependency-map.json`. It is checked by
`node scripts/check-apstat-map.mjs --check` (library `scripts/lib/apstat-map.mjs`, tests
`scripts/test/apstat-map.test.mjs`); `--order` prints the course order. If this file and the JSON
disagree, the JSON is right. Unit and topic facts come from `docs/apstat-ced-map.json` (our own
words, from `docs/apstat-research/framework.md`); no CED text is reproduced. Open questions are in
`docs/apstat-needs-author.md`.

## The CED check (Phase 0, 2026-10-17)

The topic list was checked against what could be read of the official sources (WebFetch text
extraction; the shell cannot reach collegeboard.org):

| Source | What it settled |
|---|---|
| CED PDF, first 110k characters (offsets 0, 40k, 100k) | All 13 Unit 1 and 12 Unit 2 titles; Unit 3's 15 titles (Course at a Glance); 4.1, 4.2, 4.7, 5.1, 5.3, 5.5; the Unit 4 overview names "the 10% condition" |
| Student course page (apstudents) | Official titles for 4.4, 4.6, 4.8, 4.10 and 5.2 (and repeats of others) |
| Reference sheet PDF (2026), read in full | Every formula and table; no pooled t; no b = r·s_y/s_x |
| Revisions page | The removed topics |
| Fiveable, num8ers, OnePrep (third party, agree) | 4.3, 4.5, 4.9 and 5.4 |

What changed: Unit 4 and 5 titles went from "third party" to official for 11 of 15 (each topic's
`source` in the CED map says which); the 10% condition is confirmed in the course; pooled two-sample
t is confirmed out (not on the sheet); the slope formula b = r·s_y/s_x is not on the 2026 sheet. Still
open (`docs/apstat-needs-author.md`): learning objectives beyond 2.1, the normal approximation to the
binomial, and the four third-party titles.

## Counts

| | |
|---|---|
| Chapters | 6: Units 1-5 (CED weights) and one skills chapter, "Math you need" (`skills-math`) |
| Topics | 60: the 55 CED topics in order (13, 12, 15, 10, 5), 5 math topics |
| Concepts | 187, each with its terms and aliases; 33 also carry `notation` |
| Everyday words | 67 (random, chance, outcome, survey, sample, population, average, confident ...) |
| Planned tools | 11 simulators (the 10 trainers of spec section 6 and the justification trainer), 12 FRQ themes (every type), 10 stimulus themes, 8 comparison tables, 5 pathways |

Concepts per chapter: math 10, Unit 1 80, Unit 2 35, Unit 3 37, Unit 4 14, Unit 5 11. Unit 1 is
vocabulary heavy (every display, sampling method and design term). Authors add a concept, with
`taughtIn` and `dependsOn`, whenever a topic teaches a term the map does not have.

## Format

As `docs/apcalc-phase0.md`, with these differences:

- `practices[]` are the four CED practices (1 Formulate Questions 5-10%, 2 Collect Data 20-30%, 3
  Analyze Data 25-35%, 4 Interpret Results 25-35%) with their skills (1.A, 2.A-2.E, 3.A-3.E, 4.A-4.G).
  Every skill is assessed in multiple choice.
- `topics[].ced` runs without gaps (`STAT_TOPICS` in `scripts/lib/apstat-map.mjs`); topics also carry
  `skills`, the CED skill ids they focus on, and the check refuses a skill whose practice is not in
  `practices`.
- FRQ themes have type `collect`, `analyze`, `inference` or `multi` (`FRQ_TYPES`, the May 2027 Q1-Q4).
  Stimulus themes are `table`, `graph` or `diagram`.
- `REQUIRED_SIMULATORS` lists the ten trainers plus the justification trainer.
- **`concepts[].notation`**: regular expressions over the TeX of every formula, as calculus. The ones
  that matter most:

| Concept | Notation (regex on TeX) |
|---|---|
| sample-proportion, mean, regression-line | `\\hat{p`, `\\bar{x`, `\\hat{y` |
| hypotheses, null-value, mu-null | `H_0`, `H_a`; `p_0`; `\\mu_0` |
| significance-level, type-ii | `\\alpha`; `\\beta` |
| conditional-probability, intersection, union, complement | `P( ... \\mid`; `\\cap`; `\\cup`; `^c` |
| combination, factorial | `\\binom`; `n!` |
| sampling-distribution | `\\mu_{\\bar`, `\\sigma_{\\hat` |
| standard-error, critical-value, margin-of-error | `\\text{SE}`; `z^*`; `\\text{ME}` |
| diff-proportions, diff-means, pooled-proportion, paired-data | `\\hat{p}_1 - \\hat`; `\\bar{x}_1 - \\bar`; `p_c`; `\\mu_d` |
| chi-square, degrees-of-freedom, t-distribution, r-squared | `\\chi`; `\\text{df}`; `t^*`; `r^2` |

## Course order

Units in CED order. Each math topic sits right before the topic that first needs it (`before`):

| Math topic | Before |
|---|---|
| `math-fractions-percents` | `one-categorical-tables` (1.3) |
| `math-formulas` (order of operations, square roots, the summation sign) | `summary-statistics` (1.7) |
| `math-inequality-words` ("at least", "fewer than") | `probability-intro` (2.4) |
| `math-counting` (factorials, combinations) | `binomial-distribution` (2.10) |
| `math-lines` (slope, intercept) | `scatterplots` (5.1) |

No circular dependencies were needed. Two places to watch in Phase 1: 1.10 names experiments and
observational studies before 1.13 teaches design in full (the map puts the study types in 1.10 and
the design vocabulary in 1.13), and 2.12 introduces sampling distributions before Unit 3 uses them
for proportions (the map puts the general idea and the CLT in 2.12, the proportion-specific
condition and formulas in 3.2).

## The ordering rule

As AP® Calculus AB: no page may use a concept's term or notation before the topic that teaches it,
except everyday words. `splitMath(html)` separates prose from the TeX of each formula; prose is
scanned for terms and TeX for `notation`. So a Unit 1 lesson that writes `$\hat{p}$` before 1.3, or
`$H_0$` anywhere before 3.5, fails, as one that says "p-value" before 3.6 does.

## The rest of Phase 0

The runtime fork, the item types and the registration are described in `docs/apstat-architecture.md`
(now the real file, not a draft). What a fresh session needs to know:

- Build: `node scripts/build-apstat.mjs` (`--check` in CI). Nothing is published
  (`statistics/data/published.json` is empty), so the skeleton is 24 files and every page is noindex.
- Test fixture: `scripts/test/fixtures/apstat-data/` holds one placeholder topic (4.5,
  `test-one-mean`, 15 items of every type, one probability set) and one FRQ of each type; it proves
  the engine and is never published.
- Identity and free tier live in one place each: `IDENTITY` and `FREE_UNITS` in
  `scripts/lib/apstat-build.mjs` (plus the CSS values and ranks named in its comment), the free
  trainers in `statistics/data/pages.json`.
