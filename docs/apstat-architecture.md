# AP® Statistics course: architecture

How the course is built and where everything lives. Forked from AP® Calculus AB
(`docs/apcalc-architecture.md`, spec decision 1); this file lists what is the same in one line and what
differs in full. Built in Phase 0 (2026-10-17); where this file and the code disagree, the code's header
comments are newer. Writing rules: `docs/apstat-authoring-guide.md`;
concept map: `docs/apstat-phase0.md` (Phase 0); status and decisions: `docs/apstat-spec.md`.

## Layout

```
statistics/                             the course, at levlprep.com/statistics/
  index.html learn.html glossary.html   home, textbook (units, then "Math you need"), glossary   generated
  units/ lessons/ notes/ unit-sheets/   as AP® Calculus AB                                       generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json        generated
  frq/<id>.html  tools/<slug>.html                                                             generated
  formula-sheet.html unit-tests/<unit>.html            free entry pages (no score-calculator)  generated
  manifest.json                         "LevlPrep Statistics" (description from build-pricing.mjs)
  assets/
    stat-core.js stat-questions.js stat-lesson.js stat-nav.js stat-book.js stat-toc.js stat-home.js
    stat-expr.js                        ApStatExpr: calc-expr.js plus statistics input (below)
    stat-math.js                        ApStatTex: calc-math.js subset plus statistics notation
    stat-dist.js                        ApStatDist: distributions, tests, intervals (below)
    stat-grade.js                       ApStatGrade: numeric kinds, interval and conclude graders
                                        (setup items grade through ApStatExpr.gradeSetup)
    stat.css stat-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css
    tools/stat-tools.js stat-tools.css  tool framework (ApStatTools)
    tools/stat-tool-math.js             shared tool math (ApStatMath: rng, normal, sample, bernoulli,
                                        shuffle, repeat, cell, diagnose; Dist() is ApStatDist)
    tools/stat-plot.js                  ApStatPlot: data plots and density curves (SVG)
    tools/math/<slug>.js                ONE TOOL's model (ApStatMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
    bank/ frq/ tool-data/ exams/ justify.json ...   generated
  data/                                 THE SOURCE: everything authored lives here
```

No served path contains the token "ap". Storage keys `apstat_progress_v1`, `apstat_flashcards_v1`,
`apstat_prefs_v1`, `apstat_frq_drafts_v1`, `apstat_cram_v1`, `apstat_exam_date`; globals `ApStat`; question
ids `stat-`; CSS classes `stat-`. Pass id `stat-2027`.

## Math and notation

As AP® Calculus AB: TeX between dollar signs, rendered to MathML at build time, TeX kept in the annotation
for the ordering check. Additions to the subset (built in `stat-math.js`; `\bar`, `\hat`, `\overline`
and `\binom` are new commands, the rest already rendered):

- `\bar{x}`, `\hat{p}`, `\hat{y}` (accents, also on subscripted symbols: `\hat{p}_1`, `\bar{x}_d`);
- `\mu_{\bar{x}}`, `\sigma_{\hat{p}}`, `p_c`, `H_0`, `H_a`, `\chi^2`, `s_y`, `r^2`, `Q_1`, `Q_3`;
- `\binom{n}{k}` and `{}_nC_k`; `!`; `\sum x_i`; `\sqrt{\frac{\hat{p}(1-\hat{p})}{n}}`;
- `\cap`, `\cup`, `\mid` for P(A ∩ B), P(A | B); `^{c}` for complements;
- `\text{df}`, `\text{SE}`, `\text{IQR}`, `\text{ME}`.

Dropped from the calculus subset: `\int`, `\lim`, `\frac{d}{dx}` and friends stay in the renderer but the
content check refuses them in statistics data (`EXCLUDED` in `scripts/check-apstat-content.mjs`). The
plain-text reading (`ApStatTex.text`, for titles and search) writes accents the way Bluebook types them:
`p-hat_1`, `x-bar`, `(10C3)`.

## Expressions a student types: `ApStatExpr`

The calculus parser (no eval) plus: `+/-` and `±` (an interval), `nCr` written `10C3`, `C(10,3)` or
`nCr(10,3)`, factorial `!`, and names the item binds to values (`p-hat`, `phat`, `x-bar`, `xbar`, `p_0`,
`p0`, `mu_0`, `n`, `s`, `p-hat_1`). Bluebook spellings from the digital response guidelines are read as
written. The API: `evaluate(str, bind)` gives `{ value }` or `{ interval: [lo, hi] }`; `used(tree)` the
numbers and names that appear (and those inside a square root); `gradeSetup(item, typed)` grades a
`setup` item.

## Distributions: `ApStatDist` (`stat-dist.js`, pure, runs in node and the browser)

```
normCdf(z) normPdf(z) invNorm(p)                  normal (Φ by a 1e-12 accurate approximation)
tCdf(t, df) tPdf(t, df) invT(p, df)               Student t (regularized incomplete beta)
chi2Cdf(x, df) chi2Pdf(x, df) invChi2(p, df)      chi-square (regularized incomplete gamma)
binomPmf(k, n, p) binomCdf(k, n, p)               exact, in log space for large n
z1prop(phat, p0, n) z2prop(x1, n1, x2, n2)        { z, p: { less, greater, two } }
t1(xbar, mu0, s, n) t2(x1, s1, n1, x2, s2, n2)    { t, df (Welch), dfCons (min n − 1), p }
ci1prop ci2prop ci1mean ci2mean(..., level)       { lo, hi, me, crit, se }
chi2table(observed)                               { expected, components, chi2, df, p }
lsrl(xs, ys)                                      { a, b, r, r2, s, residuals }
summary(xs)                                       { n, mean, sd, min, q1, med, q3, max, iqr, fences }
tableRoute(kind, value, df?)                      the Table A/B/C value a student would read
```

Quartiles use the AP® convention (median of each half, excluding the median when n is odd), stated in the notes.
Every function is tested against reference values computed with SciPy 1.18 (stored in
`scripts/test/apstat-dist.test.mjs`, not fetched) to 1e-9; it agrees to about 1e-12. `ApStatDist` is the one place numbers come from: questions, explanations, tool models, validators and
exam keys all call it.

## Content formats

As AP® Calculus AB (lessons, notes, glossary, descriptions, pages, published, stimuli), with these changes.

### Questions: `data/questions/<topic>.json`

`{ stimuli: { id: {...} }, items: [...] }`. Types: `single` (4 options), `multi`, `order`, `numeric`,
**`interval`**, **`setup`**, **`conclude`**. No `calc` flag (calculators are allowed throughout); no `expr`.
Practice is a skill id (`1.A`, `2.A`-`2.E`, `3.A`-`3.E`, `4.A`-`4.G`).

**Sets.** A stimulus with `set: "probability"` or `set: "regression"` and exactly 3 items is an exam set;
the exam forms use one of each. Other stimuli may carry 2-5 items for practice.

**Data.** A stimulus may carry `data: { vars: [{ name, unit, values }] }` or `table: { rows, cols, cells }`;
plots and every numeric key in its items are computed from it (the check recomputes; a key that disagrees
stops the build).

### numeric

`numeric: { answer, kind, places?, tol?, accept?, alpha?, unit?, mistakes?: [{ value, why }], from?: {...} }`.
`kind` is one of `prob`, `z`, `t`, `chi2`, `pvalue`, `stat`, `count`, `df`, `critical` and sets the tolerance
(spec section 7, rule 2; `ApStatGrade.tolerance`). `from` is the recipe: `{ fn, args, pick?, complement? }`,
`fn` one of `FROM_FNS` in `scripts/lib/apstat-build.mjs` (an `ApStatDist` function), `pick` the path to the
number in its result (`"z"`, `"p.greater"`, `"df"`). The build recomputes the key from it (a typed `answer`
that disagrees stops the content check) and adds the table route (Table A z to two places, the Table B
df row, the conservative df) to `alts`. Give `alpha` on a p-value so the wrong side is always wrong. No
`askUnit` (`unit` is shown, not graded).

### interval

`interval: { lo, hi, places?, tol?, from? }`, where `from` is a `ci*` recipe (the build picks `lo` and
`hi`). One box: "from a to b", "(a, b)", "a to b" or "a +/- m"; "a-b" is refused, as Bluebook would read
it as a subtraction. Each end is graded as `stat`; a wrong center or a wrong margin gets its own note.

### setup

```json
{ "type": "setup", "q": "Write the expression for the test statistic ...",
  "setup": { "answer": "(0.47 - 0.5)/sqrt(0.5*0.5/400)", "bind": { "phat": 0.47, "p0": 0.5, "n": 400 },
             "mustUse": ["p0"], "mustNotUse": ["phat in sqrt"], "then": { "kind": "z", "answer": -1.2 },
             "mistakes": [{ "expr": "(0.47-0.5)/sqrt(0.47*0.53/400)", "why": "A test's SE uses p0 ..." }] } }
```

Graded by value (relative 1e-6 against the key, both ends of an interval) and structure: every
`mustUse` token (a bound name or a number) appears, typed by name or by its value; no `mustNotUse` token
does, and `"<name> in sqrt"` means not inside a square root. A right value with the work missing scores
half. `then` asks for the value as a second step graded as `numeric`.

### conclude

```json
{ "type": "conclude", "q": "State the conclusion at α = 0.05.",
  "conclude": { "mode": "test", "alpha": 0.05, "p": 0.0123, "ha": "greater",
                "parameter": "the true proportion of all district voters who support the bond",
                "slots": { "decision": [...], "evidence": [...], "direction": [...], "parameter": [...] },
                "write": { "context": ["voters", "bond"], "forbid": ["prove", "accept"] } } }
```

`mode` is `test`, `interval`, `level`, `pvalue`, `error` (Type I/II in context), `slope`, `intercept`,
`r2`, `residual`, `zscore` or `claim`. Slots are authored as `{ options, correct, why?: { index: text } }`;
for `mode: "test"` the build adds a `decision` slot from `p` and `alpha` when the item has none
(`concludeSlots` in `scripts/lib/apstat-build.mjs`). `model` is a full-credit sentence, shown after
checking and required to pass its own `write` flags. `write` turns on the free-text layer with its
flags (spec section 7, rule 5).

### FRQ: `data/frq/<id>.json`

`{ id, type, title, points: 10, units, topics, practices, stimulus?, parts: [{ label, prompt, points,
rubric: [{ point, accept }], sample, check? }] }`. Types (`ApStatFrq.TYPES`): `collect` (Q1),
`analyze` (Q2), `inference` (Q3), `multi` (Q4). Every FRQ is 10 points with one rubric line per point;
`check` optionally attaches a numeric or interval grader to a part. Samples are typed as Bluebook allows
(keyboard notation), shown rendered.

### Plot spec (`ApStatPlot`)

```
{ label: '20+ characters', kind: 'dot'|'hist'|'box'|'scatter'|'bar'|'segbar'|'mosaic'|'density'|'resid',
  data | groups | table, bins: { start, width }, x: [a, b], y, xLabel, yLabel,
  density: { dist: 'normal'|'t'|'chi2'|'binom', params, shade: [{ from, to }], marks: [{ at, label }] },
  line: { a, b }, fences: true, meanMark: true }
```

Every plot is drawn from the data or distribution in the spec. Boxplots use the AP® quartile rule and the
1.5 × IQR fences with outliers as dots.

## Generator: `scripts/build-apstat.mjs` (+ `scripts/lib/apstat-build.mjs`, `apstat-entry.mjs`, `apstat-exams.mjs`)

As AP® Calculus AB (`--check`, `--out <dir>`, `APSTAT_PUBLISHED=unit-1`, `APSTAT_DATA=<dir>`), plus:

- `prepareBank` recomputes each numeric and interval key from its recipe, adds the table route to `alts`,
  renders each setup key, and generates each conclude item's decision slot; bank files split by gzip
  size (`bankFile`, 44 KB) as calculus. The bank index marks the items of an exam set (`p` or `r`), so
  practice can filter the two set types.
- Free lessons: `FREE_UNITS` (Unit 1) and every "Math you need" topic (`isFreeTopic`; spec decision 10).
- Home: from `IDENTITY` in `scripts/lib/apstat-build.mjs` (headline, accent, icon paths, first rank).
- `formula-sheet.html` "The reference sheet, explained": every formula on the official sheet in our own
  layout with what it is, when to use it, the topic and trainers; how to read Tables A, B, C (our own
  generated tables); and "Not on the sheet" lines (1.5 × IQR, z-score, empirical rule, conditions, df rules).
- No `score-calculator.html`.

## Runtime differences from AP® Calculus AB

| File | What changes |
|---|---|
| `stat-questions.js` | Renderers and graders for `interval`, `setup`, `conclude`; numeric by `kind` (`ApStatGrade`); no calculator chip. The answered event is `stat:answered`. |
| `pages/exams.js` | `MCQ_PARTS` one part: 42 in 90 min; `FRQ_PARTS` one part: 4 in 90 min, 10 points each. No calculator split. Results: MCQ %, FRQ self-score, by unit and practice; **no band**. |
| `pages/cram.js` | Default exam date 2027-05-11; 42 + 4 format text; timed sets at about 2 min 9 s a question and 22 min an FRQ. |
| `pages/frq-kit.js`, `frq.js`, `dashboard.js`, `practice.js` | The four FRQ types; practice filters for interval, setup and conclude items and the two set types. |
| `stat.css` | Plum tint on `body.stat`, the same values as `body[data-course="apstat"]` in `assets/theme.css`; bars, boxes and shaded bars for the data plots. |
| `pages/practice.js` | Item-type filters: numeric, interval, setup, conclude, probability sets, regression sets. |
| `tools/stat-plot.js` | `kind` plots (dot, hist, box, scatter, resid, bar, density) expanded from their data by `expand(spec)` before drawing. |

Dropped from the fork: `calc-expr.js` `expr` items, the three-decimal rule, calculator/no-calculator split,
`score.js`, plots of functions, slope fields.

## Tools

Ten trainers (`docs/apstat-spec.md` section 6), registered in `statistics/data/pages.json` with
`studio: true` and scaffolded in Phase 0 (a placeholder model, page script, validator and test per slug;
nothing builds until `statistics/data/tools/<slug>.json` exists and its topic is published).
`sampling-distributions`, `data-explorer` and `probability-trees` free, the rest `premium: 'tools'`. Each slug
owns four files:

```
statistics/assets/tools/math/<slug>.js       the model: ApStatMath.register('<slug>', {...})
statistics/assets/tools/<slug>.js            the page script (ApStatTools.frame ...)
scripts/lib/apstat-tool-checks/<slug>.mjs    the validator for data/tools/<slug>.json
scripts/test/apstat-tool-<slug>.test.mjs     its tests
```

Slugs: `data-explorer`, `sampling-lab`, `design-randomizer`, `probability-trees`, `distribution-areas`,
`sampling-distributions`, `ci-capture`, `p-value-explorer`, `chi-square-lab`, `regression-lab`.
`_shared.mjs` loads `stat-expr.js`, `stat-math.js`, `stat-dist.js`, `stat-grade.js`, `stat-tool-math.js` and
`stat-plot.js` in a vm (`runtime(slug)` returns `{ M, Expr, Tex, Dist, Grade, Plot, model }`). Simulations use a seeded generator (`ApStatMath.rng(seed)`), so a drill's sample is reproducible and the
validator regenerates it. Model tests are statistical: 10,000 simulated 95% intervals capture within 94-96%,
the simulated SD of x̄ matches σ/√n within 3%, simulated Type I rate within 1 point of α.

Reuse from AP® Biology (`bio/assets/tools/`): the drag-a-dot interaction of `descriptive-stats.js`, the χ²
stacked-component meter and shaded tail of `chi-square.js`, the variable/control drills of `design-drills.js`
(adapted for sampling and experiments). Code is ported into `stat-*` files (no cross-course imports); biology's
math (`ApBioMath.chiSquare`, `CHI_CRIT` at 0.05 only, SE ≈ 2 rule) is too coarse for AP® Statistics and is
replaced by `ApStatDist`.

## Practice exams: `data/exams/forms.json`

Checked by `checkForms` (`scripts/lib/apstat-exams.mjs`): at least two forms; Section I is 42 bank questions,
4 options each, containing exactly one `probability` set and one `regression` set of 3; each unit's count
within its weight range (20-30% gives 9-12, 15-25% 7-10, 10-20% 5-8 of 42); practice counts within the
practice weights; Section II is 4 FRQs in the order `collect`, `analyze`, `inference`, `multi`, 10 points each;
no question in two forms; every key recomputed in `EXAM_NUMBERS`.

## Justification trainer ("Say it in context"): `data/justify/<unit>.json`

As AP® Calculus AB, with `skill` one of `JUSTIFY_SKILLS`: `describe`, `compare`, `sampling`, `design`,
`probability`, `interval`, `test`, `errors`, `conditions`, `regression`. A prompt may add a `conclude` block
(the builder) after the checklist. The checker refuses a model answer that says "accept", "prove", "H0 is
true", gives a test conclusion without the parameter or context, or a confidence interpretation that talks
about the sample or "95% of the data".

## Registration

Registered hidden in Phase 0 (done 2026-10-17), `beta` at launch, Premium `onSale: false` until the owner
checklist. Hidden means: no hub card, 404 card, premium.html entry, site-search source listing or sitemap
entry; the generated course lists in `index.html` and `offline.html` include it (as calculus did), but
nothing on the homepage shows it.
`assets/courses.js` (key `apstat`, order 8, path `/statistics/`, short "Statistics", aliases `statistics`,
`stats`, `stat`); `assets/premium.js` (`COURSES.apstat`, pass `stat-2027`, $25 through 2027-06-30,
`freeChapters: ['unit-1']`, `COURSE_LIST`, the trademark line's course test); `assets/exam-date.js`
2027-05-11; `assets/hub-progress.js` ranks; `assets/site-search-all.js`, `assets/tutor.js`,
`assets/theme.css`, `search.html`; `index.html` and `404.html` markers; `scripts/build-pricing.mjs`,
`build-courses.mjs`, `build-og-images.mjs`, `check-site.mjs`, `check-a11y.mjs`, `check-console.mjs`,
`check-weight.mjs`; `worker/src/premium.js` (`PASSES['stat-2027']`, `URL_COURSE.apstat = 'statistics'`,
`COURSE_NAMES`) and `index.js` (`COURSE_RULES.apstat`); `sw.js` `COURSE_URLS.statistics`;
`scripts/sql/migrations/2026-10h-apstat.sql` (not applied) with `schema.sql`, `reports.sql`, `pageviews.sql`;
`scripts/build-og-images.mjs` (`statistics/assets/og-image.png`), `build-og-tags.mjs`, `build-sitemap.mjs`,
`lib/app-pages.mjs`, `lib/premium-data.mjs`; `worker/dist/worker.js` rebuilt.

## Checks

```
node scripts/build-apstat.mjs --check
node scripts/check-apstat-map.mjs --check        nothing used before it is taught (prose and notation)
node scripts/check-apstat-content.mjs --check    formats, math, recomputed keys, plots, sets, forms, excluded topics
node --test scripts/test/apstat-*.test.mjs       map, build, core, cram, dist, exams, expr, math, plot, questions, syntax, tools
scripts/ci-local.sh                              all of the above, wired in like apcalc (also .github/workflows/checks.yml)
```
