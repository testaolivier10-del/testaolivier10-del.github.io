# AP® Precalculus course: architecture

How the course is built and where everything lives. Forked from AP® Calculus AB
(`docs/apcalc-architecture.md`, spec decision 1); this file lists what is the same in one line and what differs
in full. Writing rules are in `docs/apprecalc-authoring-guide.md`; the concept map in `docs/apprecalc-phase0.md`;
status and decisions in `docs/apprecalc-spec.md`; briefs in `docs/apprecalc-briefs/`.

## Layout

```
precalculus/                              the course, at levlprep.com/precalculus/
  index.html learn.html glossary.html     home, textbook (units, then "Algebra you need"), glossary   generated
  units/ lessons/ notes/ unit-sheets/     as AP® Calculus AB                                          generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json          generated
  frq/<id>.html  tools/<slug>.html                                                              generated
  formula-sheet.html unit-tests/<unit>.html   free entry pages (no score calculator)            generated
  manifest.json                           "LevlPrep Precalculus" (no mark), fields from build-pricing
  assets/
    pcalc-core.js pcalc-questions.js pcalc-lesson.js pcalc-nav.js pcalc-book.js pcalc-toc.js pcalc-home.js
    pcalc-expr.js                         ApPrecalcExpr: the expression parser and grader (no eval), domain-aware
    pcalc-math.js                         ApPrecalcTex: TeX subset to MathML (build and preview)
    pcalc.css pcalc-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css   (no pages/score.js)
    tools/pcalc-tools.js pcalc-tools.css  tool framework (ApPrecalcTools)
    tools/pcalc-tool-math.js              shared tool math (ApPrecalcMath: helpers only)
    tools/pcalc-plot.js                   ApPrecalcPlot: SVG plots, draggable points, animation loop
    tools/math/<slug>.js                  ONE TOOL's model (ApPrecalcMath.<camelSlug>); Phase 0 stubs
    tools/<slug>.js                       ONE TOOL's page script; Phase 0 stubs
    bank/ frq/ tool-data/ exams/ justify.json ...   generated, as AP® Calculus AB
  data/                                   THE SOURCE: everything authored lives here
```

No served path contains the token "ap". Storage keys, analytics names and the registry key are `apprecalc`
(`apprecalc_progress_v1`, `apprecalc_flashcards_v1`, `apprecalc_prefs_v1`, `apprecalc_frq_drafts_v1`,
`apprecalc_cram_v1`, `apprecalc_exam_date`); globals start `ApPrecalc`; question ids `pcalc-`; CSS classes
`pcalc-`. URLs name the course `precalculus`. Pass id `pcalc-2027`. The fork was a single-pass rename of the
Calculus AB runtime (`calc-` → `pcalc-`, `ApCalc` → `ApPrecalc`, `apcalc` → `apprecalc`, `calculus` →
`precalculus`), then the changes below; shared files (`assets/`) were only twinned, never forked.

## Math

As AP® Calculus AB: authored math is TeX between dollar signs, rendered to MathML at build time by
`pcalc-math.js` (through `scripts/lib/apprecalc-mathlib.mjs`), the TeX kept in each formula's annotation for
the ordering check. The subset is listed at the top of `pcalc-math.js`. It has what Units 1-3 need (fractions,
roots, powers, `\log_b`, `\ln`, trig names, `\sin^{-1}`, `\lim` with `\to \infty` and one-sided `^-`/`^+`,
`cases`, `\theta`, `\pi`, intervals with `[` `)`). Unit 4 authors write vectors as `\mathbf{v}` with components
`\left\langle 3, 4 \right\rangle` and magnitude `\left\| \mathbf{v} \right\|`, and matrices as
`\left[ \begin{matrix} 1 & 2 \\ 3 & 4 \end{matrix} \right]`. Not in the subset: `\vec`, `\overrightarrow`, a bare
`\langle`, `bmatrix`, `\binom`, `\choose` (needs-author `tex-subset`).

**Expressions a student types** go through `ApPrecalcExpr` (`pcalc-expr.js`), the AB parser unchanged:
`3x^2`, `log_2(x)`, `ln|x|`, `sin^-1(x)` (= arcsin), `sin^2(x)`, `e^(2x)`, `sqrt(x)`, `π`.

**Domain-aware grading** (spec section 7). `compare` evaluates key and answer at 40 seeded points in `domain`:
points where the key is not a finite real number (outside its domain) are skipped; a point where the key is
defined and the answer is not is a difference. So `2ln(x)` is wrong for the key `ln(x^2)` on [-3, 3] (the note
names the log rule, `res.domainOnly`) and right on [0.1, 3]; `arcsin(x)` keys are compared on [-1, 1]. Authors set
`domain` to the interval the question means. Fewer than 8 defined points is `tooFew` (refused by the content
check). The seed is `20270511`.

## Content formats

As AP® Calculus AB (lessons, notes, glossary, descriptions, pages, published, questions with `single`, `multi`,
`order`, `predict`, `numeric`, `expr`; stimuli `table`, `graph`, `diagram` with `plot` specs), with these changes:

- **Skills** are `1.A`-`1.C`, `2.A`-`2.B`, `3.A`-`3.C` (the CED's three practices); none is marked not assessed.
  Practice weights are unknown (`practicesConfirmed: false`; needs-author `practice-weights`).
- **`expr` items** use `mode: "exact"` only (no antiderivatives; the shared engine keeps `constant` mode).
- **Calculus wording** is refused in every authored string (`CALCULUS_WORDS` in
  `scripts/check-apprecalc-content.mjs`): "increasing at a decreasing rate", "derivative", "instantaneous rate".
  A page may name the trap inside `<span class="pcalc-trap">` (exempt).
- **Unit 4** ("beyond the exam", spec decision 7) builds like any unit; its chapter has `beyondExam: true` and
  weight `[0, 0]`. The generator adds one line to its unit page, lessons, notes and unit sheet ("Beyond the exam.
  The AP® Precalculus exam does not test this unit. Many classes teach it, and it prepares you for calculus.",
  `BEYOND_LINE`); authors never paste it (the check refuses it). The curriculum carries `beyond: true`; exams,
  unit tests, mixed sets and cram plans skip it; FRQs and exam-only items never come from it.

### FRQ: `data/frq/<id>.json`

`{ id, type, title, calc, points: 6, units, topics, practices, stimulus, parts: [{ label, prompt, points,
rubric: [{ point, accept }], sample, space? }], graphSpec? }`. Types (`ApPrecalcFrq.TYPES`, `FRQ_TYPE_NAME`):

| Type | Question | Part | `calc` |
|---|---|---|---|
| `concepts` | Q1 Function Concepts | A (35 min) | true |
| `modeling` | Q2 Modeling a Non-Periodic Context | A | true |
| `periodic` | Q3 Modeling a Periodic Context | B (35 min) | false |
| `symbolic` | Q4 Symbolic Manipulations | B | false |

`calc` must match the type (`FRQ_CALC`). Units 1-3 only. Parts are labelled as the exam does (`A(i)`, `A(ii)`,
`B(i)`, `B(ii)`, `C`, ...); one rubric line per point; 6 points in all. FRQ ids are `frq-q<n>-<words>`, planned in
the map (`frqThemes`, with their author).

### "Make it specific": `data/justify/<unit>.json`

As AP® Calculus AB's justification trainer, renamed and with the builder carried from AP® Psychology (spec
decision 11). `{ prompts: [{ id, unit, topic, practice, skill, title, context?, prompt, checklist, earns: {
answer, why }, misses: { answer, why }, specific? }] }`. Ids `u1-<words>` to `u3-<words>` (`al-<words>` for the
algebra chapter); no Unit 4 prompts. Skills (`JUSTIFY_SKILLS`): `values`, `limits`, `rates`, `concavity`,
`domain`, `model`, `invertible`, `periodic`, `symbolic`, `decimals`. Optional `specific: { slots: { name: {
label, options: [2-4], correct, why: { index: note } } } }` adds the "Now build it part by part" selects, graded
exactly by `ApPrecalcQuestions.specific` (every wrong option needs a `why`). The checker refuses calculus wording
in a model answer, an invertibility answer with no values, and a `rates` answer that does not name the secant
line. Phase 3: 30+ prompts, 8-12 per exam unit, every skill used, numbers in `JUSTIFY_NUMBERS`; the first 3 free.

## Generator: `scripts/build-apprecalc.mjs` (+ `scripts/lib/apprecalc-build.mjs`, `apprecalc-entry.mjs`)

As AP® Calculus AB (`--check`, `--out <dir>`, `APPRECALC_PUBLISHED=unit-1`, `APPRECALC_DATA=<dir>`), plus:

- `IDENTITY` (headline, accent, icon paths, first rank) in `apprecalc-build.mjs`, one place.
- Free lessons: Unit 1 and every "Algebra you need" topic (`FREE_UNITS`, `isFreeTopic`), the same as
  `freeChapters` in `assets/premium.js` (a test compares them).
- Home: "AP® Precalculus, every function in motion.", forest green part colours, the unit-circle icon, ranks from
  "Function Explorer". `SAMPLE_Q` is `pcalc-rates-of-change-1` (left out until it exists; Phase 3 picks it).
- No `score-calculator.html` (entry pages: formula sheet and unit tests only; no unit test for Unit 4).
- **Tools** build only when `data/tools/<slug>.json` exists and the tool's topic is published (as AB).

## Runtime differences from AP® Calculus AB

| File | What changed |
|---|---|
| `pcalc-expr.js` | Domain-aware notes (`domainOnly`: a log or root rule), precalculus wording, seed 20270511. |
| `pcalc-questions.js` | `specific(S, picks)` (the builder grader); precalculus slip notes (no antiderivative). |
| `pages/exams.js` | `MCQ_PARTS` (A: 29 in 65 min, no calculator; B: 13 in 40 min, calculator), `FRQ_PARTS` (A: Q1 + Q2 in 35 min, calculator; B: Q3 + Q4 in 35 min, no calculator), 6 points each; a part draws one FRQ of each of its types in exam order (`pickFrqs`). **No composite, no band**: results show the two sections apart and say they are 62.5% and 37.5% of the exam. Exam units only (`!u.beyond`). |
| `pages/cram.js` | Default exam date 2027-05-11; 105/42 min pace; Unit 4 left out of plans; "Make it specific" prompts on study days. |
| `pages/frq-kit.js`, `dashboard.js` | The four FRQ types; dashboard `band: false`. |
| `pages/justify.js` | "Make it specific" with the builder (from AP® Psychology). |
| `pages/practice.js`, `review.js`, `search.js` | Free tier wording; precalculus search examples. |
| `pcalc.css` | Forest green tint (`--ctint` `#E3F3E8`, `--cink` `#11592F`; dark `rgba(80,200,130,0.10)` / `#ACE4BF`), the same values as `body[data-course="apprecalc"]` in `assets/theme.css`; `.pcalc-beyond`. |

Dropped from the fork: `pages/score.js`, the readiness band, the AB formula rows and justification prompts, the
AB tools.

## Tools

Ten trainers (`docs/apprecalc-spec.md` section 6), registered in `data/pages.json` with `studio: true`;
`function-lab`, `rate-of-change` and `unit-circle` free, the rest `premium: 'tools'`. Each slug owns four files,
so builders work in parallel; Phase 0 wrote each as a stub:

```
precalculus/assets/tools/math/<slug>.js         the model: ApPrecalcMath.register('<camelSlug>', {...}); stub: true
precalculus/assets/tools/<slug>.js              the page script; returns while the model is a stub
scripts/lib/apprecalc-tool-checks/<slug>.mjs    the validator for data/tools/<slug>.json; refuses data while the model is a stub
scripts/test/apprecalc-tool-<slug>.test.mjs     its test (Phase 0: the scaffold is wired)
```

| Slug | Topic (context) | Kind | Builder |
|---|---|---|---|
| `function-lab` | `transformations` (1.12) | simulator, free | T1 |
| `rate-of-change` | `rates-of-change` (1.2) | simulator, free | T1 |
| `regression-lab` | `model-construction` (1.14) | simulator | T1 |
| `poly-rational` | `rational-holes` (1.10) | simulator | T2 |
| `exp-log-lab` | `linear-vs-exponential` (2.2) | simulator | T2 |
| `symbolic-steps` | `exp-log-equations` (2.13) | drill | T2 |
| `unit-circle` | `sine-cosine-tangent` (3.2) | simulator, free | T3 |
| `sinusoid-builder` | `sinusoidal-transformations` (3.6) | simulator | T3 |
| `polar-graphs` | `polar-curves` (3.14) | simulator | T4 |
| `vectors-matrices` | `parametric-functions` (4.1) | simulator | T4 |

`ApPrecalcTools`, `ApPrecalcMath` and `ApPrecalcPlot` are the AB framework renamed (`docs/apcalc-architecture.md`,
"Tools": `drill`, `expr` steps, `onTry` drawing, `draggable`, `loop`). The calculus helpers in `ApPrecalcMath`
(`deriv`, `integral`, `riemann`) stay for numerics (a model may use `root`, `roots`, `extrema` to find zeros and
turning points) but no trainer teaches them. `_shared.mjs` runs the browser code in a vm so validators recompute
every number with the code students run; `SKILLS` is the precalculus skill list.

## Practice exams: `data/exams/forms.json`, `items.json` (Phase 3)

Checked by `checkForms` (`scripts/lib/apprecalc-exams.mjs`): at least two forms; Section I is 42 four-option
questions, Part A's 29 no-calculator before Part B's 13 calculator ones; a block is one set or one question and
never mixes the parts; Units 1-3 each inside their weight range (`unitRange`: 30-40% gives 12-17, 25-40% 10-17,
30-35% 12-15 of 42); nothing from Unit 4 or the algebra chapter; Section II is Q1, Q2, Q3, Q4 in order, 6 points
each, the calculator flag by type; no question or FRQ in two forms; at most 20 exam-only items per form
(`pcalc-exam-<form>-<nn>`), every key recomputed in `EXAM_NUMBERS` (helpers `bisect`, `zeros`, `r3` exported).

## Registration (hidden until launch)

Every AB registration point twinned (spec decision 3), with `status: 'hidden'` (no hub card, 404 card,
premium.html entry, search scope or sitemap entry; generated course lists include it):
`assets/courses.js` (order 11, aliases `precalculus`, `precalc`, `pcalc`) and the generated blocks
(`node scripts/build-courses.mjs`); `assets/premium.js` (`COURSES.apprecalc`, `onSale: false`, pass `pcalc-2027`,
$25 through 2027-06-30, `freeChapters: ['unit-1']`); `assets/exam-date.js` (2027-05-11); `assets/hub-progress.js`
ranks; `assets/site-search-all.js` (source, URL key, MathML reading); `assets/tutor.js` (pages, starters,
greeting, fallback link); `assets/theme.css`; `assets/course/flags.js`, `study.js`, `study.css`, `book.css`,
`tool-studio.css`, `tool-studio.js` (selector twins of `calc-`); cover CSS in `hub.css`, `r3.css`, `book.css`,
`glossary.css`, `reading.css`, `r3-reading.css`; `assets/covers/apprecalc.svg`, `art/`, `thumb/`,
`tools/apprecalc/index.json` (empty until Phase 2); `index.html` and `404.html` markers (`hub-pcalc`,
`nf-pcalc`); `search.html` tints; `sw.js` (`COURSE_URLS['precalculus']`, cache v99); `worker/src/premium.js`
(`PASSES['pcalc-2027']`, `URL_COURSE`, `COURSE_NAMES`), `worker/src/index.js` (`COURSE_RULES.apprecalc`),
`worker/dist/worker.js` rebuilt; `scripts/sql/migrations/2026-10n-apprecalc.sql` (**not applied**) with
`schema.sql`, `reports.sql`, `pageviews.sql`; `scripts/build-pricing.mjs` (hub and 404 cards, manifest),
`lib/premium-data.mjs` (counts), `lib/course-homes.json`, `lib/covers.mjs`, `lib/r3-home.mjs`, `lib/r3-inner.mjs`,
`lib/r3-tools.mjs`, `lib/r3-reading.mjs`, `lib/dashboard-page.mjs`, `lib/videos.mjs`, `lib/app-pages.mjs`,
`add-video.mjs`, `build-from-video.mjs`, `build-og-images.mjs` (card defined; the PNG is a copy of AB's until
rendered: needs-author `og-image`), `build-og-tags.mjs`, `build-sitemap.mjs`, `check-site.mjs`, `check-a11y.mjs`,
`check-console.mjs`, `check-weight.mjs` (site 340 → 341; `precalculus` 68.5); `.github/workflows/checks.yml` and
`scripts/ci-local.sh`. Not yet: `sources.html`, the "eleven courses" wording, the AI FRQ grader's `FRQ_COURSES`
(6-point rubrics need their own calibration); all at launch.

## Checks

```
node scripts/build-apprecalc.mjs --check
node scripts/check-apprecalc-map.mjs --check        nothing used before it is taught (prose and notation)
node scripts/check-apprecalc-content.mjs --check    formats, math, numeric and expr keys, plots, FRQs, calculus wording
node --test scripts/test/apprecalc-*.test.mjs
scripts/ci-local.sh                                  everything CI runs
```
