# AP® Calculus BC course: architecture

How the course is built and where everything lives. BC is built **on** AP® Calculus AB
(`docs/apcalc-architecture.md`, which still describes every shared format: math syntax, `expr` and numeric
items, stimuli, plots, FRQs, tools, exams, justify). This file lists only what BC adds or does differently.
Writing rules: `docs/apcalcbc-authoring-guide.md`; map: `docs/apcalcbc-phase0.md`; status and decisions:
`docs/apcalcbc-spec.md`; open points: `docs/apcalcbc-needs-author.md`.

## Reuse: one source, one generator, one runtime (spec decision 1)

```
calculus-bc/                        the course, at levlprep.com/calculus-bc/        (generated, except below)
  data/                             BC's OWN authored files only (the 30 BC topics, 3 BC math topics,
                                    BC FRQs, BC trainers' data, pages.json, published.json, descriptions.json)
  assets/cbc.css                    the accent (hand-written)
  assets/cbc-interval.js            interval answers, ApCalcBCInterval (hand-written)
  assets/tools/<slug>.js, math/     the six BC trainers (hand-written, Phase 2)
  manifest.json                     fields from build-pricing
  everything else                   written by scripts/build-apcalcbc.mjs
calculus/data/                      AB's authored files: BC reads its AB topics from here, never copies them
calculus/assets/                    the runtime both courses run
```

- **One generator.** `scripts/build-apcalcbc.mjs` sets `APCALC_COURSE=bc` and runs `scripts/build-apcalc.mjs`.
  Every value that differs is in the course profile, `PROFILES` in `scripts/lib/apcalc-build.mjs` (key,
  folder, names, id prefix, free tier, map file, data env vars, runtime folder, score calculator and band
  off), exported as live bindings (`COURSE`, `IS_BC`, `BASE`, `COURSE_KEY`, `RT`, ...). `IDENTITY` in the
  generator holds the home words, part colours, sample question and icon per course. With no `APCALC_COURSE`
  every AB value is the one AB always had: **AB's output is byte-identical** (checked by hashing every file of a
  full AB build before and after; `build-apcalc.mjs --check` is clean and `apcalcbc-reuse.test.mjs` holds it).
- **One source.** `loadCourse` reads each topic from its course's folder (`topic.source`: `ab` →
  `calculus/data/`, `bc` → `calculus-bc/data/`); glossary, figures, labels and FRQs merge from both (BC's win
  on a clash); descriptions merge (BC entries override AB's for a BC page). A fix to an AB topic lands once and
  both courses rebuild it. The BC content check fails on an AB topic's file under `calculus-bc/data/`.
- **One map.** `docs/apcalcbc-dependency-map.json` is an **overlay** (`"overlay": true`): BC's chapters (Units 9,
  10), BC weights for Units 1-8 (`chapterWeights`), BC tool plans for AB units (`chapterTools`), BC topics,
  BC concepts. `mergeBcMap` merges it onto AB's map at load (chapters in course order, topics grouped by chapter
  in CED order, so 6.11-6.13 fall between 6.10 and 6.14, 7.5 between 7.4 and 7.6, 7.9 after 7.8, 8.13 after
  8.12). `readMapRaw(path)` returns the merged map for any loader.
- **One runtime.** BC pages load AB's runtime from `/calculus/assets/` (`RT(depth)` = `<depth>../calculus/assets/`):
  `calc-*.js`, `calc.css`, `calc-home.css`, `pages/*`, `tools/calc-tools.*`, `calc-tool-math.js`,
  `calc-plot.js`. A BC page's own files (`calc-curriculum.js`, `cbc.css`, `cbc-interval.js`, a BC trainer's
  script and model) are `<depth>assets/`. `tail()` writes `window.ApCalcCourse` on every BC page:

  ```
  { key: 'apcalcbc', name: 'AP® Calculus BC', short, dir: 'calculus-bc', pfx: ['calc', 'cbc'],
    frqTypes: {AB's 8 + parametric, techniques, series}, band: false, score: false,
    examDate: '2027-05-10', site, intervals: true, rt: '<depth>../calculus/' }
  ```

  Each shared runtime file starts `var CC = window.ApCalcCourse || {}, CK = CC.key || 'apcalc', CN = CC.name ||
  'AP® Calculus AB'` and uses `CK` for every storage key, event name, flag and report course, so BC's state
  is `apcalcbc_progress_v1`, `apcalcbc_flashcards_v1`, `apcalcbc_prefs_v1`, `apcalcbc_frq_drafts_v1`,
  `apcalcbc_cram_v1`, `apcalcbc_exam_date`, `apcalcbc_step_<topic>`, ... AB pages set no config, so AB's
  runtime behaves exactly as before. `frq-kit.js` and `dashboard.js` take `CC.frqTypes`; `exams.js` shows no
  readiness band when `CC.band === false`; `cram.js` drops the score-calculator line when `CC.score === false`;
  the FRQ kit is fetched from `CC.rt`; `practice.js` adds an "Intervals of convergence" filter when
  `CC.intervals`.
- **Ids.** AB items keep `calc-<topic>-<n>`; BC's own `cbc-<topic>-<n>` (exam-only `cbc-exam-<form>-<nn>`).
  The curriculum marks a BC topic `pfx: 'cbc'`; `calc-core.js` rebuilds ids from it and reads both prefixes.
- **Globals.** BC's curriculum file publishes `ApCalcBCPages`, `ApCalcBCToolList`, `ApCalcBCCurriculum` and
  hands them to the runtime under AB's names (`Object.assign(window, ...)`); a page loads one course's file,
  and site search reads the BC names. New BC globals start `ApCalcBC` (`ApCalcBCInterval`).
- **Canonicals.** A BC lesson or notes page for an AB topic names the AB page as canonical (`abCanonical`),
  so search engines index one copy; `build-sitemap.mjs` skips a page whose canonical is in another folder.
- **Course-only text.** In authored HTML, an element with class `cbc-only` is dropped from AB pages and one
  with `calc-ab-only` from BC pages (`courseOnly`, not nested); a `<span>` of the course being built is unwrapped
  and any other kept element loses the marker class, so AB's output stays byte-identical. This is how AB notes get
  BC wording (6.10's "partial fractions are BC", 6.14's technique list) without a copy.
- **BC versions of AB figures.** BC's figures win on an id clash, so a BC figure registered under an AB figure's id
  replaces it on BC pages only: 6.14's `integration-flowchart` (six questions) from
  `scripts/apcalcbc-figures/integration-flowchart.mjs`, registered in `calculus-bc/data/figures/choosing-integration-methods.json`.
- **Order on BC pages.** Prev/next and "What comes next" follow the merged map. An AB lesson's authored
  "Next: ..." that names a topic BC has moved further away is relabelled "Later: ..." and, on BC only, the real
  next topic is added before it (`lessonConnections`).
- **Small numeric keys.** `ApCalcCourse.smallValues` (BC) makes the three-decimal rule also require three
  significant digits when the key is below 0.005 (`calc-questions.js`, `decOk`); AB's rule is unchanged.
- **Figures.** An AB figure on a BC page is served from `/calculus/figures/` (`figureDir`); BC's own figures
  live in `calculus-bc/figures/`.

## Formats BC adds

### interval items (`type: "interval"`)

```json
{ "type": "interval", "q": "Give the interval of convergence ...",
  "interval": { "lo": "1", "hi": "5", "loIn": true, "hiIn": false, "center": "3", "var": "x",
                "ends": { "lo": "At x = 1 the series ... converges, so ...", "hi": "..." },
                "mistakes": [{ "answer": "(1, 5)", "why": "Both endpoints left out: ..." }] } }
```

- `lo`, `hi`: numbers or exact values in the student syntax (`"sqrt(3)"`, `"-1/2"`), or `"-inf"`/`"inf"`;
  `loIn`, `hiIn`: whether that endpoint is included. A single point: `{ "point": "0" }`. All reals: `-inf`, `inf`.
- The student types interval notation (`[1, 5)`, `(-inf, inf)`), an inequality (`1 <= x < 5`, `1 ≤ x < 5`,
  `|x - 3| < 2`), `all real numbers`, or `x = 3` / `{3}`. Exact endpoints are read by the expression parser; a
  decimal right to three places counts, with a note asking for the exact value.
- Graded in four parts, each endpoint and each bracket (`parts.lo`, `hi`, `loIn`, `hiIn`); score = parts
  right over parts graded. Named slips, after an authored `mistakes` entry: a bracket wrong at an endpoint (the
  authored `ends` reason, else "check x = 5 on its own; the ratio test cannot decide an endpoint"); a bare
  number equal to the radius; the right width at the wrong center; a squared or unsquared radius; a factor of 2.
- Code: `calculus-bc/assets/cbc-interval.js` (`ApCalcBCInterval.parse/key/text/grade`), loaded on BC question
  pages before `calc-questions.js`, whose `grade` and renderer call it (no interval code in AB's shell). The
  build renders the key as math (`intervalTex`, `interval.answerHtml`); the content check
  (`intervalProblems`) checks the key, that it is graded right as typed and that every `mistakes` entry is
  graded wrong. An interval item is never `calc: true`.

### FRQ types and Section II slots

BC's FRQ list is AB's eight types plus `parametric` (Q2: parametric, vector or polar functions, calculator),
`techniques` (Q5: parts, partial fractions, improper integrals, Euler, arc length, no calculator) and `series`
(Q6, no calculator). BC serves AB's FRQs too (Q1, Q3, Q4 are shared questions). `checkForms(forms, { ...,
slots: BC_FRQ_SLOTS })` (`scripts/lib/apcalc-exams.mjs`) holds a BC practice exam to `[AB, parametric, AB,
AB, techniques, series]` on top of AB's rules (29 + 13 MCQ, 2 calculator then 4 no-calculator FRQs, 9 points,
unit weights from the BC map: 5-10% gives 2-5 of 42, 10-15% 4-7, 15-20% 6-9).

### Phase 3: exams, prompts, formula rows, unit tests (spec decision 10)

- **Practice exams**: `calculus-bc/data/exams/forms.json` and `items.json` in AB's format, checked by the same
  `checkForms` with `BC_FRQ_SLOTS` and AB's form rules (12-14 exam-only items, no lesson checks). Exam-only ids
  `cbc-exam-<form>-<nn>`. Keys: `CBC_EXAM_NUMBERS` in `scripts/lib/apcalcbc-exams.mjs`; `checkNumbers(items,
  prompts, lists)` takes BC's lists (AB's default unchanged).
- **Justification**: `loadJustify([AB data, BC data], map)` on BC, so the trainer serves AB's prompts and BC's
  (`calculus-bc/data/justify/<unit>.json`, ids `u<unit>-...`, `u10-` allowed). `JUSTIFY_SKILLS` gains
  `BC_JUSTIFY_SKILLS` (`series`, `error`, `polar`) only when `APCALC_COURSE=bc`. The BC check wants 3-5 prompts
  for Units 9 and 10 and 10+ of BC's own; numbers in `CBC_JUSTIFY_NUMBERS`.
- **Formula page**: `mergeEq(EQ, NOT_ON)` adds `BC_EQ` rows to AB's groups by id and appends `BC_GROUPS` and
  `BC_NOT_ON`; rows have AB's shape `[TeX, what, when, 'Unit N', topic, trainers?]`.
- **Unit tests**: `calculus-bc/data/unit-tests.json` (`{ units: { "unit-9": [12 ids], ... } }`) replaces the
  automatic sample for the units it lists, once every listed topic is built; `checkUnitTests` (12 items, single
  or numeric, no calculator, no lesson check or practice-exam item, sets together in order, two thirds of the
  unit's topics).

### No score calculator, no readiness band

`PROFILES.bc.scoreCalculator` and `band` are false: no `score-calculator.html`, no "Estimate your score"
link, no band on exam results or the dashboard. AB keeps its score calculator (`calculus/score-calculator.html`,
untouched).

## Generator, checks and tests

```
node scripts/build-apcalcbc.mjs [--check] [--out <dir>]     APCALCBC_PUBLISHED=..., APCALCBC_DATA=..., APCALC_DATA=...
node scripts/check-apcalcbc-map.mjs --check [--order]        the ordering rule on the merged map; scans BC pages
                                                             and the question files BC serves (AB's and BC's)
node scripts/check-apcalcbc-content.mjs --check [--topic <id>] [--tools]   BC's own files in calculus-bc/data/
node --test scripts/test/apcalcbc-*.test.mjs
```

- The content check is AB's (`check-apcalc-content.mjs`) with the BC profile: ids `cbc-`, `interval` items,
  BC FRQ types, BC tool validators, BC's FRQ slots on practice exams, and every BC item checked for
  near-duplicates against AB's bank. AB's justification counts (32+ prompts, 3-5 per unit) do not apply; BC's
  are set in Phase 3.
- Tests: `apcalcbc-map` (merged map, 111 topics, order, weights, overlay copies nothing), `apcalcbc-questions`
  (interval grading), `apcalcbc-exams` (format, slots), `apcalcbc-build` (fixture build: AB Unit 6 from
  `calculus/data` and the 10.13 fixture topic, runtime paths, config, canonicals, ids, no score calculator, BC
  site rules), `apcalcbc-reuse` (AB build unchanged, runtime keyed by course), `apcalcbc-tool-<slug>` (six).
- Fixture: `scripts/test/fixtures/apcalcbc-data/` (topic `radius-interval-convergence` with three interval
  items, an `expr`, a numeric and two stimulus sets; one FRQ of each BC type; a copy of `pages.json`).
- Site rules: `scripts/site-rules/apcalcbc-trademark.mjs`, `apcalcbc-beta-and-report.mjs`.

## Trainers

Six BC trainers, pre-registered in `calculus-bc/data/pages.json` (`studio: true`; `series-lab` free, the rest
`premium: 'tools'`). Each slug owns, as in AB:

```
calculus-bc/assets/tools/math/<slug>.js        the model: ApCalcMath.register('<camelSlug>', {...}) (Phase 0 stub)
calculus-bc/assets/tools/<slug>.js             the page script (Phase 0 stub)
calculus-bc/data/tools/<slug>.json             the content (none yet: nothing builds)
scripts/lib/apcalcbc-tool-checks/<slug>.mjs    the validator (frame now; refuses the stub)
scripts/test/apcalcbc-tool-<slug>.test.mjs     its tests
```

A BC trainer page loads AB's framework (`calc-questions.js`, `tools/calc-tool-math.js`, `tools/calc-tools.js`,
`tools/calc-plot.js`) and its own model and script (`OWN_TOOL`). `apcalcbc-tool-checks/_shared.mjs` runs the
same files in a vm (AB's runtime plus the BC model); AB's `_drills.mjs` frame and step checks are reused.

**AB's ten trainers** are listed in BC's `pages.json` as `{ "slug": "...", "from": "ab" }`: the build fills
them from AB's `pages.json` and links them to `/calculus/tools/<slug>.html` (tools hub group "Calculus AB
trainers", unit pages, home, formula page) once that page exists and the topic is published in BC. They are
never built under `calculus-bc/`; what a student answers there counts in Calculus AB (needs-author `ab-trainers`).

## Registration (hidden until launch)

Twinned with every AB point: `assets/courses.js` (order 12, `status: 'hidden'`) and every generated course list
(`node scripts/build-courses.mjs`); `assets/premium.js` (`cbc-2027`, $25 through 2027-06-30, `onSale: false`,
free tier, rows); `assets/exam-date.js` (2027-05-10); `assets/hub-progress.js` ranks; `assets/tutor.js`
(pages, fallback, starters, greeting); `assets/site-search-all.js` source; `assets/theme.css` accent and
tint; `assets/course/{hub,r3,book,reading,glossary,r3-reading}.css` cover colours; `assets/course/flags.js`,
`study.js` folder maps; `assets/covers/apcalcbc.svg`, `art/`, `thumb/`; `search.html` chip colours; `sw.js`
`COURSE_URLS['calculus-bc']` (BC's own files and AB's runtime); `worker/src/premium.js` (pass, URL folder, name)
and `index.js` (`COURSE_RULES`), `worker/dist/worker.js`; `scripts/build-pricing.mjs` (hub card
`hub-cbc`, 404 card `nf-cbc`, both empty until launch; manifest); `scripts/lib/premium-data.mjs` bank count;
`scripts/lib/{covers,course-homes.json,r3-inner,r3-tools,r3-home,r3-reading,dashboard-page,videos,app-pages}`;
`scripts/build-og-images.mjs` (+ `calculus-bc/assets/og-image.png`), `build-og-tags.mjs`, `build-sitemap.mjs`,
`check-site.mjs`, `check-a11y.mjs`, `check-console.mjs`, `check-weight.mjs`; `robots.txt`; `add-video.mjs`,
`build-from-video.mjs`; `.github/workflows/checks.yml`, `scripts/ci-local.sh`;
`scripts/sql/migrations/2026-10o-apcalcbc.sql` (**not applied**) with `schema.sql` and `reports.sql`.
