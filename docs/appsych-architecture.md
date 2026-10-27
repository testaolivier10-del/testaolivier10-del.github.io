# AP® Psychology course: architecture

How the course is built and where everything lives. Forked from AP® Environmental Science as it stands on main
(`docs/apenv-architecture.md`, spec decision 1), with every newer shared page type (round 3 pages, course and tool
covers, dashboard design F, the textbook plain/interactive toggle, the flashcards tab, video lessons, quick
answers, the AI FRQ grader hooks, analytics hooks, no Beta label); this file says in one line what is the same
and in full what differs. Built in Phase 0 (2026-10-27); where this file and the code disagree, the code's header
comments are newer. Writing rules: `docs/appsych-authoring-guide.md`; concept map: `docs/appsych-phase0.md`;
status and decisions: `docs/appsych-spec.md`.

## Layout

```
psychology/                              the course, at levlprep.com/psychology/
  index.html learn.html glossary.html   as AP® Environmental Science ("Research skills you need" in place of
  units/ lessons/ notes/ unit-sheets/   "Math you need")                                            generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json          generated
  frq/<id>.html  tools/<slug>.html                                                              generated
  formula-sheet.html unit-tests/<unit>.html   "Statistics you must know", free unit tests       generated
  manifest.json                         "LevlPrep Psychology" (from build-pricing.mjs)
  assets/
    psy-core.js psy-questions.js psy-lesson.js psy-nav.js psy-book.js psy-toc.js psy-home.js
    psy-math.js                         ApPsychTex: TeX to MathML (the same subset)
    psy-stats.js                        ApPsychStats: descriptive statistics and the normal curve (below)
    psy-grade.js                        ApPsychGrade: numbers (unit optional), "Make it specific" with psychology hints
    psy.css psy-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css
    tools/psy-tools.js psy-tools.css    tool framework (ApPsychTools; drill steps num, choice, unit)
    tools/psy-tool-math.js              shared tool math (ApPsychMath: rng, round, fmt, cell, unitCell,
                                        diagnose, diagnoseUnit; Stats() is ApPsychStats)
    tools/psy-plot.js                   ApPsychPlot: data figures (SVG)
    tools/math/<slug>.js                ONE TOOL's model (ApPsychMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
    bank/ frq/ tool-data/ exams/ justify.json ...   generated
  data/                                 THE SOURCE: everything authored lives here
```

No served path contains the token "ap". Storage keys `appsych_progress_v1`, `appsych_prefs_v1`,
`appsych_flashcards_v1`, `appsych_flagged_v1`, `appsych_frq_drafts_v1`, `appsych_cram_v1`,
`appsych_exam_date`; globals `ApPsych*`; question ids `psy-`; CSS classes `psy-`. Pass id `psy-2027`.

Gone from the fork: `env-expr.js` (the setup parser) and `env-calc.js` (the calculation recipes). The exam has no
calculator and no typed setups (`docs/appsych-research/framework.md` section 5), so there are no `setup` items,
no setup drill steps, no "check my number" on FRQs and no unit-aware conversions.

## Math and notation

As AP® Environmental Science (TeX between dollar signs, MathML at build time). Psychology needs very little:
`\bar{x}`, `\frac`, `z = `, `r = `, `p < .05`, `\%`. The concepts that own notation (`mean`, `z-score`,
`correlation-coefficient`, `statistical-significance`, `standard-deviation`) are taught in the research skills
chapter, so the ordering check refuses `$\bar{x}$` before Descriptive Statistics. The content check refuses
inferential test names (t-test, chi-square, ANOVA, confidence intervals, degrees of freedom) and any mention of a
calculator (`EXCLUDED` in `scripts/check-appsych-content.mjs`).

## Statistics: `ApPsychStats` (`psy-stats.js`, pure, node and browser)

Every number a key, a tool drill or an exam item shows is a recipe `{ fn, args, pick? }`;
`ApPsychStats.evaluate(recipe)` gives it (12 significant digits), and an argument may itself be a recipe.

```
mean(data) median(data) mode(data)  modes(data) [not a recipe]   range(data)
sd(data) sampleSd(data) variance(data) sampleVariance(data)      population divides by n, sample by n - 1
z(x, mean, sd)  fromZ(z, mean, sd)
rulePct(fromZ, toZ)          percent between whole-SD marks by the 68-95-99.7 rule exactly
                             (bands 34, 13.5, 2.35, 0.15; null for an open end): rulePct(-1, 1) = 68, rulePct(1, null) = 16
percentileRule(z)            percent below a whole-SD mark by the rule: percentileRule(1) = 84
cdf(z) percentile(x, mean, sd) between(a, b, mean, sd)    the normal CDF (Zelen and Severo, error < 1e-7)
percentRank(value, data)     percent of the data below (ties count half)
r(points) slope(points) intercept(points)                 Pearson's r and the least-squares line
strength(r) direction(r) describe(r)   words, not recipes: |r| >= .7 strong, >= .4 moderate, >= .1 weak
add sub mul div pow round abs min max count sum
```

Numbers in items stay small enough to work by hand (the authoring guide).

## Grading: `ApPsychGrade` (`psy-grade.js`)

- `numeric(N, typed | { value, unit })`: as AP® Environmental Science, but the unit is optional (most keys are
  bare numbers; percents carry `%`). Named slips: × 100 missing or doubled, the sign (a z score below the mean),
  close (rounding). Authored `mistakes` first.
- `specific(S, picks)`: every builder slot exact. Slot names with feedback words: `method`, `iv`, `dv`,
  `variable`, `opdef`, `population`, `sample`, `guideline`, `applied`, `statistic`, `meaning`, `claim`,
  `evidence`, `source`, `citation`, `concept`, `link`, plus the shared ones.
- `flags(S, text)`: hints only, never a score. New rules: `cite` (a "Source n" citation), `concept` [accepted
  concept words], `restricted` [research or statistics words, or the prompt's own topic, that do not count as
  the concept: flagged only when no accepted concept appears]. `mechanism` reads "this shows", "which suggests".

## Content formats

As AP® Environmental Science (lessons, notes, glossary, descriptions, pages, published), with these changes.

### Questions: `data/questions/<topic>.json`

`{ stimuli: { id: {...} }, items: [...] }`. Types: `single` (4 options), `multi`, `order`, `numeric`,
`specific`. No `setup`. `practice` is a skill id: `1.A`-`1.B`, `2.A`-`2.D`, `3.A`-`3.C`; `4.A` and `4.B`
(argumentation) are Section II only and refused on items.

**Stimuli and sets.** `kind` is the set kind: `study` (a `study` summary), `data` (a `table`, `plot` or `chart`)
or `visual` (a `figure`, a `plot` or an inline SVG). A `study` is `{ introduction, participants, method, results,
discussion?, reference? }` (HTML strings), laid out as the exam's summaries (`studyHtml` in
`scripts/lib/appsych-build.mjs`). Every study or data stimulus is `invented: true` (shown as "Invented study for
practice") or has a `source` citing the real published study (authors and a year, `CITATION`); never invented
data presented as real (decision 4). The bank index marks each item's set kind (`s`, `d`, `v`).

### numeric

`numeric: { from, unit?, places?, tol?, rel?, mistakes?: [{ value | from, why }] }`; `from` is required (an
`ApPsychStats` recipe; a typed `answer` that disagrees fails the content check).

### specific

As AP® Environmental Science; `write` may add `cite`, `concept` and `restricted` (above).

### FRQ: `data/frq/<id>.json`

`{ id, type, title, points: 7, units, topics, practices, parts: [{ label, prompt, points, rubric: [{ point,
accept }], sample, write? }] }` plus, by type:

- `aaq` (Q1, Article Analysis Question): `study` `{ title, invented | source, study: {...}, plot | table,
  ethics: [the safeguards the summary describes, two or more] }`; parts exactly `A:1 B:1 C:1 D:1 E:1 F:2`
  (method, operational definition, statistic, ethical guideline applied, generalizability, argumentation).
- `ebq` (Q2, Evidence-Based Question): `sources` (exactly three, each as the AAQ's study with a graph or table),
  `claimTopic` (what the claim must answer), `restricted` (terms that cannot earn the concept point); parts
  exactly `A:1 B(i):1 B(ii):2 C(i):1 C(ii):2`.

A part's `write` (for example `{ cite: true }` on B(i), `{ concept: [...] }` on B(ii)) turns on the live hints
under its answer box (`frq-kit.js`); the EBQ's `restricted` list feeds them. No `check`, `graphSpec`, `calc` or
`stimulus` fields. The build serves `readings` (one study, or three sources titled "Source 1-3") in each FRQ's JSON.

### Plot spec (`ApPsychPlot`)

```
{ label: '20+ characters', x, y, xLabel, yLabel,
  kind: 'line'      series: [{ name, points: [[x, y], ...], dashed? }]
      | 'bar'       categories, values | series: [{ name, values }]
      | 'scatter'   points, trend?             least-squares line; expand() also gives r (ApPsychStats)
      | 'histogram' bins: [[lo, hi, count], ...]   bins must touch; edges ticked
      | 'normal'    mean, sd, bands?, region?: { from, to }   ticks at the mean and each SD; bands label
                    34%, 13.5%, 2.35%; region shades between two values (null = open) and expand() gives its share }
```

Curves in tools are JavaScript functions (no expression strings). Colors: course cerulean `#084F78` (dark
`#8CC8E8`), then vermillion `#C24E00`, green `#009E73`, reddish purple `#A8508A`, purple `#7A4F9E`.

## Generator: `scripts/build-appsych.mjs` (+ `scripts/lib/appsych-build.mjs`, `appsych-entry.mjs`, `appsych-exams.mjs`, `appsych-mathlib.mjs`)

As AP® Environmental Science (`--check`, `--out <dir>`, `APPSYCH_PUBLISHED=unit-1`, `APPSYCH_DATA=<dir>`), plus:

- `prepareBank` recomputes every numeric key and mistake value from its recipe; prepares specific slots.
- Free lessons: `FREE_UNITS` (Unit 1) and every "Research skills you need" topic (spec decision 9).
- Home: from `IDENTITY` (headline "from neuron to society.", the cerulean accent, the head-with-a-spark icon,
  first rank Curious Observer) and `scripts/lib/course-homes.json` `appsych`.
- `formula-sheet.html` "Statistics you must know": `EQ` in `appsych-entry.mjs` (central tendency, variation, the
  normal curve, correlation and inference), each row naming its `ApPsychStats` recipe with a worked line computed
  at build time; the same rows are the "Statistics" flashcard deck (`assets/formulas.json`, ids `eq:<recipe>`).
- FRQ pages show the study or the three sources in the exam's sections, "no calculator", the suggested time
  (25 or 45 minutes) and lined space per part.
- No `score-calculator.html`, no readiness band (decision 6).

## Runtime differences from AP® Environmental Science

| File | What changes |
|---|---|
| `psy-questions.js` | No setup items; numeric hint "worked out by hand"; stimulus kinds labeled Study, Data, Figure. Answered event `psy:answered`. |
| `pages/exams.js` | `MCQ_PARTS` 75 in 90 min; `FRQ_PARTS` 2 in 70 min, 7 points each; the notice says "No calculator" and links the statistics page; **no band**. |
| `pages/cram.js` | Default exam 2027-05-14; the 75 + 2 format; timed sets at 90/75 min a question; no calculator on exam day. |
| `pages/frq-kit.js` | The AAQ and EBQ; readings (study or three sources); live `write` hints in place of "check my number". |
| `pages/practice.js`, `dashboard.js`, `flashcards.js`, `search.js` | Filters for numeric, specific and the three set kinds; FRQ type names; the "Statistics" deck. |
| `psy.css` | Cerulean tint on `body.psy` (the same values as `body[data-course="appsych"]` in `assets/theme.css`, contrast in its comment); study summary, myth box and help-line styles; the setup styles are gone. |
| `tools/psy-plot.js` | `histogram` and `normal` added; `dual`, `pyramid`, `curve` and the slope field removed. |

## Tools

Ten trainers (`docs/appsych-spec.md` section 6) plus the written-answer trainer (`justify`), registered in
`psychology/data/pages.json` with `studio: true` and scaffolded in Phase 0: a stub model (`stub: true`), page
script, validator and test per slug; nothing builds until `psychology/data/tools/<slug>.json` exists and its topic
is published. Free: `article-studio`, `neuron`, `brain-map`; the rest `premium: 'tools'`. Each slug owns four files:

```
psychology/assets/tools/math/<slug>.js      the model: ApPsychMath.register('<camelSlug>', {...})
psychology/assets/tools/<slug>.js           the page script (ApPsychTools.frame ...)
scripts/lib/appsych-tool-checks/<slug>.mjs  the validator for data/tools/<slug>.json
scripts/test/appsych-tool-<slug>.test.mjs   its tests
```

Slugs and topics: `article-studio` and `evidence-builder` (research-methods), `stats-lab` (stats-normal),
`neuron` (neural-firing), `brain-map` (brain), `sensation` (sensation), `memory-lab` (memory-intro),
`conditioning-lab` (classical-conditioning), `development` (cognitive-development), `social-influence`
(social-situations). `_shared.mjs` loads `psy-math.js`, `psy-stats.js`, `psy-grade.js`, `psy-tool-math.js` and
`psy-plot.js` in a vm (`runtime(slug)` returns `{ M, Tex, Stats, Grade, Plot, model }`). Drill steps: `num`,
`choice` and `unit` (a setup step is refused by `_drills.mjs`).

## Practice exams: `data/exams/forms.json`

Checked by `checkForms` (`scripts/lib/appsych-exams.mjs`): at least two forms; Section I is 75 four-option
questions, whole sets in authored order, set counts within `EXAM_SETS` (study 2-6, data 2-6, figure 0-4: the
official counts are not published, needs-author `mcq-sets`), each unit within 15-25% of 75 (11 to 19); Section II
is the AAQ then the EBQ, 7 points each; no question or FRQ in two forms. Practice weights checked only when the
map sets `practicesConfirmed`. `EXAM_NUMBERS` recomputes every exam-only number (Phase 3); `JUSTIFY_NUMBERS` is
empty until the prompts exist. An FRQ unlocks with the latest of its `topics` in course order: `checkFrq` scans
everything in it but the restricted-term lists against that topic (the exams are exempt).

## Help note

A lesson with `"help": true` gets the shared 988 line (`HELP_LINE` in `scripts/lib/appsych-build.mjs`) after its
summary and on its notes page (at `<div data-psy-help></div>` if the notes place it, else at the top). Required on
`HELP_TOPICS` (5.3-5.5); elsewhere only for a topic `HELP_EXTRA` lists with its reason. Pasting the line fails the
content check.

## "Make it specific": `data/justify/<unit>.json`

As AP® Environmental Science; `skill` is one of `method`, `opdef`, `statistic`, `ethics`, `generalize`, `argue`,
`claim`, `evidence`, `reasoning` (one per AAQ and EBQ part). The checker refuses a claim that is a question,
evidence that cites no source, reasoning that does not link, a builder slot without a `why`, and anything taught
after the unit.

## Registration

Registered hidden in Phase 0 (2026-10-27), Premium `onSale: false` until the owner checklist. Hidden means: no hub
card, 404 card, premium.html entry, search scope or sitemap entry; the generated course lists include it. Files:
`assets/courses.js` (key `appsych`, order 10, short "Psychology", aliases `psychology`, `psych`, `psy`) and the
generated blocks (`node scripts/build-courses.mjs`); `assets/premium.js` (`COURSES.appsych`, pass `psy-2027`,
$25 through 2027-06-30, `freeChapters: ['unit-1']`, `onSale: false`); `assets/exam-date.js` (2027-05-14);
`assets/hub-progress.js` ranks; `assets/site-search-all.js` (source); `assets/tutor.js` (pages, starters,
greeting); `assets/course/flags.js`, `study.js`; `assets/theme.css`; the cover CSS in `assets/course/hub.css`,
`r3.css`, `book.css`, `glossary.css`, `reading.css`, `r3-reading.css`; `assets/covers/appsych.svg`,
`assets/covers/art/appsych.svg`; `index.html` and `404.html` markers (`hub-psy`, `nf-psy`); `sw.js`
(`COURSE_URLS['psychology']`, cache v93); `worker/src/premium.js` (`PASSES['psy-2027']`, `URL_COURSE`,
`COURSE_NAMES`), `worker/src/index.js` (`COURSE_RULES.appsych`), `worker/dist/worker.js` rebuilt;
`scripts/sql/migrations/2026-10l-appsych.sql` (NOT applied) with `schema.sql`, `reports.sql`, `pageviews.sql`;
`scripts/build-pricing.mjs` (hub and 404 cards, manifest), `lib/premium-data.mjs` (counts), `lib/course-homes.json`,
`lib/covers.mjs`, `lib/r3-home.mjs`, `lib/r3-inner.mjs`, `lib/r3-tools.mjs`, `lib/r3-reading.mjs`,
`lib/dashboard-page.mjs`, `lib/videos.mjs`, `add-video.mjs`, `build-from-video.mjs`, `build-og-images.mjs`
(`psychology/assets/og-image.png`), `build-og-tags.mjs`, `build-sitemap.mjs`, `check-console.mjs`,
`check-weight.mjs`. Not yet: `check-a11y.mjs` pages, `app-pages.mjs`, `sources.html`, the AI FRQ grader's
`FRQ_COURSES` (it grades 10-point rubrics; the AAQ/EBQ shape needs its own calibration, needs-author
`frq-grader`); all at launch.

## Checks

```
node scripts/build-appsych.mjs --check
node scripts/check-appsych-map.mjs --check         nothing used before it is taught (prose and notation)
node scripts/check-appsych-content.mjs --check     formats, recomputed keys, sets, studies cited or invented, myths, language, FRQs, forms
node --test scripts/test/appsych-*.test.mjs        map, build, stats, core, cram, exams, math, plot, questions, syntax, tools
scripts/ci-local.sh                                all of the above (also .github/workflows/checks.yml)
```
