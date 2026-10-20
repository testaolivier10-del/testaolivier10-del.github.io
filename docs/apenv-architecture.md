# AP® Environmental Science course: architecture

How the course is built and where everything lives. Forked from AP® Statistics
(`docs/apstat-architecture.md`, spec decision 1); this file says in one line what is the same and in full what
differs. Built in Phase 0 (2026-10-20); where this file and the code disagree, the code's header comments are
newer. Writing rules: `docs/apenv-authoring-guide.md`; concept map: `docs/apenv-phase0.md`; status and decisions:
`docs/apenv-spec.md`.

## Layout

```
environmental-science/                  the course, at levlprep.com/environmental-science/
  index.html learn.html glossary.html   home, textbook (units, then "Math you need"), glossary   generated
  units/ lessons/ notes/ unit-sheets/   as AP® Statistics                                        generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json        generated
  frq/<id>.html  tools/<slug>.html                                                             generated
  formula-sheet.html unit-tests/<unit>.html            free entry pages (no score calculator)  generated
  manifest.json                         "LevlPrep Environmental Science" (description from build-pricing.mjs)
  assets/
    env-core.js env-questions.js env-lesson.js env-nav.js env-book.js env-toc.js env-home.js
    env-expr.js                         ApEnvExpr: the setup parser, with units (below)
    env-math.js                         ApEnvTex: TeX to MathML (the statistics subset, unchanged)
    env-calc.js                         ApEnvCalc: every calculation recipe (below)
    env-grade.js                        ApEnvGrade: numbers with units, the named slips, "Make it specific"
    env.css env-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css
    tools/env-tools.js env-tools.css    tool framework (ApEnvTools; drill steps num, choice, setup, unit)
    tools/env-tool-math.js              shared tool math (ApEnvMath: rng, round, fmt, cell, unitCell,
                                        setupCell, diagnose, diagnoseUnit, diagnoseSetup; Calc() is ApEnvCalc)
    tools/env-plot.js                   ApEnvPlot: data figures (SVG)
    tools/math/<slug>.js                ONE TOOL's model (ApEnvMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
    bank/ frq/ tool-data/ exams/ justify.json ...   generated
  data/                                 THE SOURCE: everything authored lives here
```

No served path contains the token "ap". Storage keys `apenv_progress_v1`, `apenv_prefs_v1`,
`apenv_flashcards_v1`, `apenv_flagged_v1`, `apenv_frq_drafts_v1`, `apenv_cram_v1`, `apenv_exam_date`; globals
`ApEnv*`; question ids `env-`; CSS classes `env-`. Pass id `env-2027`.

## Math and notation

As AP® Statistics: TeX between dollar signs, rendered to MathML at build time, TeX kept in the annotation for the
ordering check. Environmental science needs little notation: `\frac`, `\times`, powers of ten (`2.5 \times
10^{6}`), `\text{...}` for words and units (`\text{kWh}`), subscripts (`\text{LD}_{50}`, `t_{1/2}`), `\%`.
The content check refuses calculus and inferential statistics in items (`EXCLUDED` in
`scripts/check-apenv-content.mjs`: integrals, limits, p-values, t-tests, confidence intervals, graphing-calculator
steps).

## Calculations: `ApEnvCalc` (`env-calc.js`, pure, node and browser)

Every calculation type in spec section 7 is a recipe `{ fn, args, pick? }`; `ApEnvCalc.evaluate(recipe)` gives
the number (12 significant digits, so no float noise reaches a key), and an argument may itself be a recipe.

```
percentChange(old, new)  percentOf(pct, q)  fractionOf(part, whole)
ruleOf70(rate)  doublingYear(start, rate)  naturalIncrease(cbr, cdr)  growthRate(b, d, imm, emig, N)
exponential(n0, rate, t)  continuous(n0, rate, t)  afterDoublings(n0, t, Td)  tfr(asfr[])  aboveReplacement(tfr)
tenPercent(E, steps, eff?)  trophicEnergy(E, from, to, eff?)  npp(gpp, r)  gpp(npp, r)
halfLifeLeft(amount, halfLife, t)  halfLives(t, halfLife)  timeToFraction(fraction, halfLife)
convert(v, from, to)  chain(v, unit, [[num, numUnit, den, denUnit], ...]) -> { value, unit }
perCapita(total, N)  density(n, area)  efficiency(out, in)  chainEfficiency(e1, e2, ...)  inputNeeded(out, eff%)
cost(q, price)  savings(before, after, price?)  emissions(q, factor)
doseAt(points, response)  ld50(points)  doseFor(mgPerKg, kg)  biomagnify(c, factor, steps)  magnification(hi, lo)
waterVolume(depth, area)  waterPerArea(volume, area)  add sub mul div pow round min max
```

`chain` refuses a factor whose denominator unit is not there to cancel; `convert` knows energy (J, kWh, BTU,
kcal, quad), mass (kg, g, mg, metric ton, short ton, lb), length, area (m², km², ha, acre), volume (L, gal,
m³), time and power. Questions, explanations, tool models, validators and exam keys all call `ApEnvCalc`: it is
the one place numbers come from.

## Grading: `ApEnvGrade` (`env-grade.js`) and `ApEnvExpr.gradeSetup` (`env-expr.js`)

- `readNumber(typed)`: "2.5 million people", "2.5e6", "2.5 × 10^6 kWh", "2.5x10⁶", "1,250 kg", "−3.4 %".
- `normUnit(u)`: kWh = kW·h = kW h = kW*h; people/km^2 = people per km² = persons/square kilometer; % = percent;
  yr = year = years. `unitIs(typed, list)`.
- `numeric(N, typed | { value, unit })` grades the value and the unit as two parts (the reader's point is "with
  units"), tolerance `tol`, `rel` or the default (1% of the key or half a unit in its last shown place, whichever
  is larger). Authored `mistakes` first, then the named slips: ×100 missing or doubled, a factor of 1000 or a
  million (a prefix or a scale word), the sign, a right number in the wrong prefix ("right in MWh, but the
  question asks for kWh"). No significant figures.
- `specific(S, picks)`: every builder slot exact. `flags(S, text)`: hints only, never a score (`directional`,
  `vague`, `noQuestion`, `variable`, `otherThan`, `mechanism`, `context`, `forbid`).
- `ApEnvExpr.evaluate(str)`: no eval; `x` between numbers and `×` multiply, thousands commas, a unit after a
  number binds to it (never into an exponent), so `5000 kWh * 0.9 kg/kWh` has value 4500 and unit kg.
  `gradeSetup(item, typed)` grades value and structure: brackets around a difference before a division (the
  percent-change rule), `× 100` for a percent, `mustUse`, `mustNotUse`, `unit` and `requireUnits` (units shown
  and cancelling to the answer's unit). A right value with the structure missing is `valueOk` without `correct`.

## Content formats

As AP® Statistics (lessons, notes, glossary, descriptions, pages, published), with these changes.

### Questions: `data/questions/<topic>.json`

`{ stimuli: { id: {...} }, items: [...] }`. Types: `single` (4 options), `multi`, `order`, **`numeric`**,
**`setup`**, **`specific`**. No `interval`, no `conclude`, no `expr`, no `calc` flag. `practice` is a skill id
(`1.A` ... `7.F`; `3.D`, `3.E`, `4.D` are not assessed and refused).

**Stimuli and sets.** A stimulus has `kind`: `quantitative` (a `table` or `data`), `visual` (a `plot`, a
`figure` or a model diagram) or `text` (a `passage` with its `source`). Data must say where it comes from:
`invented: true` (shown as "Invented data for practice") or `source` naming a public source (NOAA, EPA, USGS,
UN, IPCC, NASA, the World Bank, the EIA ...), never invented data presented as real (decision 4). A set is 3-5
items sharing a stimulus; the bank index marks each item's set kind (`q`, `v`, `x`) so practice can filter them.

### numeric

`numeric: { from, unit?, units?, askUnit?, places?, tol?, rel?, mistakes?: [{ value | from, why }] }`. `from`
is required: the build recomputes `answer` with `ApEnvCalc` (a typed `answer` that disagrees fails the content
check), and each mistake's `from` gives its value. `units` lists other accepted spellings beyond the
equivalences `normUnit` already knows.

### setup

```json
{ "type": "setup", "q": "Write the setup for the percent change in population from 120 to 150 ...",
  "setup": { "answer": "(150 - 120) / 120 * 100", "mustUse": ["150", "120"], "mustNotUse": ["0.25"],
             "unit": "", "requireUnits": false,
             "then": { "unit": "%", "from": { "fn": "percentChange", "args": [120, 150] } },
             "mistakes": [{ "expr": "(150 - 120) / 150 * 100", "why": "Divide by the old value ..." }] } }
```

`then` is required (the reader's second point: the answer with its unit), graded as `numeric` and recomputed from
its recipe. The item is right only when both steps are.

### specific

```json
{ "type": "specific", "q": "Complete the hypothesis ...", "specific": {
    "frame": "If ___, then ___ will ___, because ___.",
    "slots": { "change": { "label": "Change", "options": ["..."], "correct": 0, "why": { "1": "..." } }, ... },
    "write": { "directional": true, "mechanism": true, "context": ["nitrate", "algae"] },
    "model": "If more nitrate is added, then algae growth will increase, because nitrate is a limiting nutrient." } }
```

Slots graded exactly (2-4 options each, a `why` for every wrong option); `write` turns on the free-text box with
its hint flags; `model` must pass its own flags.

### FRQ: `data/frq/<id>.json`

`{ id, type, title, points: 10, units, topics, practices, stimulus?, parts: [{ label, prompt, points, rubric:
[{ point, accept }], sample, check? }] }`. Types: `design` (Q1, design an investigation), `data` (Q2, analyze
and interpret quantitative data), `calc` (Q3, an environmental problem with calculations). A `calc` FRQ needs at
least one `check`: `{ type: "numeric", numeric }` or `{ type: "setup", setup }` ("check my number" and "check my
setup"), recomputed by the build.

### Plot spec (`ApEnvPlot`)

```
{ label: '20+ characters', x, y, xLabel, yLabel,
  kind: 'line'    series: [{ name, points: [[x, y], ...], dashed? }]
      | 'bar'     categories, values | series: [{ name, values }]
      | 'scatter' points, trend?        (least-squares line)
      | 'dual'    series: [{ name, points, axis: 'left'|'right' }], yRight, yRightLabel
      | 'pyramid' groups, left, right, leftLabel, rightLabel
      | 'curve'   points, mark: { y: 50, label: 'LD50' } | { x }   (read off by interpolation, dashed guides) }
```

Every figure is drawn from the numbers in its spec, with `role="img"` and a real label; legends sit inside the
SVG. Colors: course olive `#474A10` and soft `#D3D27F`, then the Okabe-Ito set.

## Generator: `scripts/build-apenv.mjs` (+ `scripts/lib/apenv-build.mjs`, `apenv-entry.mjs`, `apenv-exams.mjs`, `apenv-mathlib.mjs`)

As AP® Statistics (`--check`, `--out <dir>`, `APENV_PUBLISHED=unit-1`, `APENV_DATA=<dir>`), plus:

- `prepareBank` recomputes every numeric and setup key (`then`) and every mistake value from its recipe,
  renders setup keys, prepares specific slots; bank files split by gzip size; the index carries set kinds.
- Free lessons: `FREE_UNITS` (Units 1 and 2) and every "Math you need" topic (spec decision 9).
- Home: from `IDENTITY` (headline "one system at a time.", the olive accent, the leaf-over-globe icon, first
  rank Field Observer).
- `formula-sheet.html` "Formulas you must memorize" (there is no official sheet): `EQ` in `apenv-entry.mjs`,
  each row naming its `ApEnvCalc` recipe (a test holds every spec section 7 type to a row), what it is, when to
  use it, the trap, the topic and trainers; then scale words, prefixes, dimensional analysis and exam-day rules.
- `justify.html` "Make it specific": prompts from `data/justify/<unit>.json` with `specific` builders.
- No `score-calculator.html`, no readiness band (decision 6).

## Runtime differences from AP® Statistics

| File | What changes |
|---|---|
| `env-questions.js` | `numeric` with a unit box, `setup` with its answer-and-unit step, `specific` builders; stimulus kinds labeled Data, Model or diagram, Passage. Answered event `env:answered`. |
| `pages/exams.js` | `MCQ_PARTS` 80 in 90 min; `FRQ_PARTS` 3 in 70 min, 10 points each; the calculator notice links the Desmos scientific calculator; **no band**. |
| `pages/cram.js` | Default exam 2027-05-13; the 80 + 3 format; timed sets at 90/80 min a question. |
| `pages/frq-kit.js`, `frq.js`, `dashboard.js`, `practice.js` | The three FRQ types; practice filters for numeric, setup, specific and the three set kinds. |
| `env.css` | Olive tint on `body.env` (the same values as `body[data-course="apenv"]` in `assets/theme.css`, contrast in its comment); plot, legend and pyramid styles. |
| `tools/env-plot.js` | The six data kinds above, drawn from their numbers. |

Dropped from the fork: `stat-dist.js`, `interval` and `conclude` items, the table route, statistics plots.

## Tools

Twelve trainers (`docs/apenv-spec.md` section 6), registered in `environmental-science/data/pages.json` with
`studio: true` and scaffolded in Phase 0 (a stub model, page script, validator and test per slug; nothing builds
until `environmental-science/data/tools/<slug>.json` exists and its topic is published).
`calculation-studio`, `energy-flow` and `cycles` free, the rest `premium: 'tools'`. Each slug owns four files:

```
environmental-science/assets/tools/math/<slug>.js     the model: ApEnvMath.register('<slug>', {...})
environmental-science/assets/tools/<slug>.js          the page script (ApEnvTools.frame ...)
scripts/lib/apenv-tool-checks/<slug>.mjs              the validator for data/tools/<slug>.json
scripts/test/apenv-tool-<slug>.test.mjs               its tests
```

Slugs and topics: `calculation-studio` (math-percents), `energy-flow`, `cycles` (carbon-cycle),
`population-growth`, `age-structure`, `soil-texture` (soil-properties), `earth-climate` (el-nino-la-nina),
`energy-chain` (fossil-fuels), `air-pollution` (photochemical-smog), `water-pollution` (eutrophication),
`dose-response` (dose-response-curve), `climate-change` (greenhouse-effect). `_shared.mjs` loads `env-expr.js`,
`env-math.js`, `env-calc.js`, `env-grade.js`, `env-tool-math.js` and `env-plot.js` in a vm (`runtime(slug)`
returns `{ M, Expr, Tex, Calc, Grade, Plot, model }`). Drill steps: `num`, `choice`, `setup` (graded by
`gradeSetup`) and `unit` (a number with its unit, graded by `ApEnvGrade.numeric`). The validator regenerates
problems per context and recomputes every key through `ApEnvCalc`.

## Practice exams: `data/exams/forms.json`

Checked by `checkForms` (`scripts/lib/apenv-exams.mjs`): at least two forms; Section I is 80 four-option
questions with 3-5 quantitative, 3-5 visual and exactly 2 text sets (whole sets, in authored order); each unit's
count within its weight range of 80 (6-8% gives 4-7, 10-15% 8-12, 7-10% 5-8, 15-20% 12-16); Section II is 3
FRQs in the order `design`, `data`, `calc`, 10 points each; no question or FRQ in two forms. Practice weights are
checked only when the map sets `practicesConfirmed` (they are third party: needs-author `practice-weights`).
`EXAM_NUMBERS` and `JUSTIFY_NUMBERS` recompute every exam-only key and prompt number (empty until Phase 3).

## "Make it specific": `data/justify/<unit>.json`

`{ prompts: [{ id: 'u<n>-<words>', unit, topic, practice, skill, title, context?, prompt, checklist, earns,
misses, specific? }] }`. `skill` is one of `hypothesis`, `variables`, `control`, `chain`, `trend`, `solution`,
`policy`, `tradeoff`. The checker refuses a hypothesis that earns the point but is a question or has no
direction, a solution that does not say how it works, a builder slot without a `why` for each wrong option, and
anything taught after the unit.

## Registration

Registered hidden in Phase 0 (2026-10-20), `beta` at launch, Premium `onSale: false` until the owner checklist.
Hidden means: no hub card, 404 card, premium.html entry, search scope or sitemap entry; the generated course
lists include it. Files: `assets/courses.js` (key `apenv`, order 9, short "Env Science", aliases
`environmental`, `envsci`, `apes`) and the 12 generated blocks (`node scripts/build-courses.mjs`);
`assets/premium.js` (`COURSES.apenv`, pass `env-2027`, $25 through 2027-06-30, `freeChapters`); `assets/exam-date.js`
(2027-05-13); `assets/hub-progress.js` ranks; `assets/site-search-all.js` (source); `assets/tutor.js` (pages,
starters, greeting); `assets/course/flags.js`; `assets/theme.css`; `index.html` and `404.html` markers
(`hub-env`, `nf-env`); `robots.txt`; `sw.js` (`COURSE_URLS['environmental-science']`, cache v84);
`worker/src/premium.js` (`PASSES['env-2027']`, `URL_COURSE`, `COURSE_NAMES`), `worker/src/index.js`
(`COURSE_RULES.apenv`), `worker/dist/worker.js` rebuilt; `scripts/sql/migrations/2026-10j-apenv.sql` (NOT
applied) with `schema.sql`, `reports.sql`, `pageviews.sql`; `scripts/build-pricing.mjs` (hub and 404 cards,
manifest), `lib/premium-data.mjs` (counts), `build-og-images.mjs` (`environmental-science/assets/og-image.png`),
`build-og-tags.mjs`, `build-sitemap.mjs`, `lib/app-pages.mjs`, `check-site.mjs`, `check-a11y.mjs`,
`check-console.mjs`, `check-weight.mjs`, `lib/spelling.mjs` ("generalist" is American).

## Checks

```
node scripts/build-apenv.mjs --check
node scripts/check-apenv-map.mjs --check         nothing used before it is taught (prose and notation)
node scripts/check-apenv-content.mjs --check     formats, math, recomputed keys, units, sets, data sources, forms
node --test scripts/test/apenv-*.test.mjs        map, build, calc, core, cram, exams, expr, math, plot, questions, syntax, tools
scripts/ci-local.sh                              all of the above (also .github/workflows/checks.yml)
```
