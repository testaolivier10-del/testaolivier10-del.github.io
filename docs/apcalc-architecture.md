# AP® Calculus AB course: architecture

How the course is built and where everything lives. Forked from AP® Physics 1
(`docs/apphys-architecture.md`, spec decision 1); this file lists what is the same in one line and what
differs in full. Writing rules are in `docs/apcalc-authoring-guide.md`; the concept map in
`docs/apcalc-phase0.md`; status and decisions in `docs/apcalc-spec.md`.

## Layout

```
calculus/                               the course, at levlprep.com/calculus/
  index.html learn.html glossary.html   home, textbook (units, then "Math you need"), glossary   generated
  units/ lessons/ notes/ unit-sheets/   as AP® Physics 1                                         generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json        generated
  frq/<id>.html  tools/<slug>.html                                                             generated
  formula-sheet.html score-calculator.html unit-tests/<unit>.html   free entry pages            generated
  manifest.json                         "LevlPrep — Calculus" (no mark), fields from build-pricing
  assets/
    calc-core.js calc-questions.js calc-lesson.js calc-nav.js calc-book.js calc-toc.js calc-home.js
    calc-expr.js                        ApCalcExpr: the expression parser and grader (no eval)
    calc-math.js                        ApCalcTex: TeX subset to MathML (build and preview)
    calc.css calc-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css
    tools/calc-tools.js calc-tools.css  tool framework (ApCalcTools)
    tools/calc-tool-math.js             shared tool math (ApCalcMath: helpers only)
    tools/calc-plot.js                  ApCalcPlot: SVG plots, draggable points, animation loop
    tools/math/<slug>.js                ONE TOOL's model (ApCalcMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
    bank/ frq/ tool-data/ exams/ justify.json ...   generated, as AP® Physics 1
  data/                                 THE SOURCE: everything authored lives here (as AP® Physics 1)
```

No served path contains the token "ap". Storage keys, analytics names and the registry key are
`apcalc` (`apcalc_progress_v1`, `apcalc_flashcards_v1`, `apcalc_prefs_v1`, `apcalc_frq_drafts_v1`,
`apcalc_cram_v1`, `apcalc_exam_date`); globals start `ApCalc`; question ids `calc-`; CSS classes
`calc-`. URLs name the course `calculus`. Pass id `calc-2027`.

## Math

**Authored math is TeX between dollar signs**: `$...$` inline, `$$...$$` display, `\$` a literal
dollar. The subset is listed at the top of `calculus/assets/calc-math.js` (fractions, roots, powers,
`\int_a^b`, `\lim_{x \to a^-}`, `\sum`, `\left( \right)`, evaluation bars `\Big|_a^b`, trig and log
names, `cases`, `aligned`, `\text{}`, Greek, relations). There is no MathJax or KaTeX: the generator
renders every formula to **MathML at build time** (`scripts/lib/apcalc-mathlib.mjs` runs
`calc-math.js` in node), so pages work offline and print. Each `<math class="calc-m">` keeps its TeX
in `<annotation encoding="application/x-tex">`; the ordering check scans that TeX. Anything outside
the subset stops the build (`strict`), with the file and field named.

Fields rendered: every string in lessons, notes, questions (stem, options, `why`, mistakes), stimuli
(titles, table cells), FRQs, glossary, justify prompts and tool data, except the keys in `RAW_KEYS`
(`answer`, `expr`, `fn`, `id`, ...), which stay as authored. Titles that land in `<title>`, `aria-label`
or search use `ApCalcTex.text()` (plain words: "∫ from 0 to 1 of x² dx").

**Expressions a student types** go through `ApCalcExpr` (`calc-expr.js`): tokenizer, recursive
descent parser, tree compiled to closures (no `eval`, no `Function`). Friendly input: `3x^2`, `2(x+1)`,
`sin x`, `sin^2(x)`, `sin^-1(x)`, `log_2(x)`, `|x|`, `√x`, `x²`, `π`, `e`. Implicit multiplication
binds like `*`, so `1/2x` is `(1/2)x`; the live preview (`toTex`, rendered by `ApCalcTex`) shows how an
answer was read. Odd roots of negatives are real (`x^(1/3)` at -8 is -2).

```
ApCalcExpr.parse(str, { vars, allowC }) -> tree      compile(tree) -> f(scope)
ApCalcExpr.fn(str, vars?) -> f                        number(str) -> value or NaN
ApCalcExpr.toTex(tree) -> TeX                         read(str, opts) -> { ok, tree, tex, error }
ApCalcExpr.compare(student, key, { vars, domain, mode, points, seed, tol }) -> { valid, equal, hasC, ... }
ApCalcExpr.grade(item, typed) -> { valid, correct, score, notes, mistake }
ApCalcTex.render(tex, { display, strict })  html(str)  text(tex)  check(str)
```

## Content formats

As AP® Physics 1 (lessons, notes, glossary, descriptions, pages, published), with these changes.

### Questions: `data/questions/<topic>.json`

`{ stimuli: { id: {...} }, items: [...] }`. Types: `single` (4 options, as the exam), `multi`, `order`,
`predict`, `numeric`, **`expr`**. Every item may carry **`calc: true`** (a calculator item; default
no calculator); items sharing a stimulus share `calc`. Practice is a skill id `1.A`-`4.E`
(Mathematical Practices); 1.A, 1.B and 3.A are not assessed by multiple choice, practice 4 not by
single or multi.

### Numeric items

`numeric: { answer, unit?, askUnit?, units?, answerTex?, mistakes?: [{ value, why }] }`.

- `answer` is a number, or an exact expression string (`"1/3"`, `"pi/4"`, `"sqrt(2)/2"`, `"ln(3)"`).
- **Calculator items** (`calc: true`): the three-decimal rule. A decimal answer is right when it matches
  the key rounded or truncated to three places (`threeOk`); fewer places gets a note.
- **No-calculator items**: the exact value. A student may type an expression (`pi/4`) or a fraction;
  a decimal right to three places is accepted with a note asking for the exact form. The checker
  refuses a no-calculator key that looks rounded.
- Units are optional. `askUnit: true` makes the unit part of the answer (in-context questions); `unit`
  is the canonical one and `units` other accepted spellings. Words are read loosely (`liters per hour`,
  `L/hr`).
- No `tol`, `sigfigs` or `gAlt` (physics only; the checker refuses them).

### expr items

```json
{ "type": "expr", "q": "Find $\\int \\cos(3x)\\,dx$.",
  "expr": { "answer": "sin(3x)/3", "vars": ["x"], "domain": [-2, 2], "mode": "constant",
            "lhs": "\\int \\cos(3x)\\,dx =", "answerTex": "...", "needC": true,
            "mistakes": [{ "expr": "sin(3x)", "why": "Differentiate $\\sin(3x)$ ..." }] } }
```

- `answer` is the key in the student syntax. Grading evaluates both expressions at 40 seeded points in
  `domain` (default [-2, 2]; points where the key is not finite are skipped) and compares with a
  relative tolerance.
- `mode: "exact"` (default) or `"constant"` (antiderivatives: equal up to an added constant). In
  `constant` mode the student must write `+ C` unless `needC: false`.
- `lhs` is TeX shown before the box; `answerTex` overrides the key's display (else `toTex`).
- `mistakes` are graded wrong by the checker and matched first; otherwise the note names a sign, a
  constant factor or a missing constant.
- An `expr` item is never `calc: true`, and has no `options` or `correct`.

### Stimuli

`kind` is `table`, `graph` or `diagram`. A `graph` stimulus carries a `plot` spec (below) and is drawn
at build time by `ApCalcPlot.svg` from the function it shows. Tables: `{ caption, cols, rows }`, cells
may hold math.

### FRQ: `data/frq/<id>.json`

`{ id, type, title, calc, points: 9, units, topics, practices, stimulus?, parts: [{ label, prompt,
points, rubric: [{ point, accept }], sample }] }`. Types (`ApCalcFrq.TYPES`): `table` (rate in context
from a table), `model` (a modeling function), `motion` (particle motion), `area` (area and volume),
`de` (differential equation), `graph` (analysis of a graph of f′), `implicit` (implicit
differentiation), `fg` (functions given by table and formula). Each FRQ is 9 points with one rubric
line per point. No drawing parts; a graph part gets a plot on the FRQ page. Titles have no `$`.

### Plot spec (`ApCalcPlot`)

```
{ label: '20+ characters, read by screen readers', width, height, x: [a, b], y: [c, d], xStep, yStep,
  piX, xLabel, yLabel, grid, axes,
  curves: [{ fn: 'x^2 - 1', domain, cls: 's1'..'s5', dashed, label, ends: ['open'|'closed', ...] }],
  shade: [{ fn, fn2, domain }], points: [{ at: [x, y], open, label }], asymptotes: [{ x } | { y }],
  lines: [{ point, slope } | { through: [[x1, y1], [x2, y2]] }], field: { dydx, step, len },
  labels: [{ at, text, anchor }] }
```

Curves break at jumps and asymptotes (found by bisection). The SVG has no ids, so many plots can
share a page.

## Generator: `scripts/build-apcalc.mjs` (+ `scripts/lib/apcalc-build.mjs`, `apcalc-entry.mjs`)

As AP® Physics 1 (`--check`, `--out <dir>`, `APCALC_PUBLISHED=unit-6`, `APCALC_DATA=<dir>`), plus:

- `loadCourse` renders math into every authored field (`renderMath`); problems in a published topic
  stop the build. `prepareBank` adds each expr item's `answerHtml` and `lhsHtml` and each numeric
  item's `value` and `answerHtml`.
- The bank index (`bank/index.json`) carries a seventh field, the calculator flag.
- Free lessons: Units 1 and 2 and every "Math you need" topic (`isFreeTopic`).
- Home: "AP® Calculus AB, one idea at a time.", crimson part colours, the integral icon, ranks starting
  at "Limit Seeker". `SAMPLE_Q` is `calc-limit-notation-1` (left out until it exists).
- Every page loads `calc-expr.js` and `calc-math.js` before `calc-questions.js`.
- **Bank files** (`assets/bank/`): a unit's questions go in `<unit>.json`, or, when they would pass 44 KB
  gzipped, in `<unit>-a`, `-b`, ... packed in course order (`bankFile`, `BANK_GZ`); `topics[].bank` tells the
  runtime; explanations (`-why.json`) follow the same split.
- **Tools** build only when `data/tools/<slug>.json` exists and the tool's topic is published. A tool
  page loads `calc-questions.js`, `tools/calc-tool-math.js`, `tools/math/<slug>.js`,
  `tools/calc-tools.js`, `tools/calc-plot.js`, `tools/<slug>.js`.
- `formula-sheet.html`: the exam gives no formula sheet, so this page lists the formulas to know
  (`EQ` in `apcalc-entry.mjs`).

## Runtime differences from AP® Physics 1

| File | What changed |
|---|---|
| `calc-questions.js` | `gradeNumeric` (three-decimal rule for calculator items, exact otherwise, optional units), `expr` renderer with a live preview, a "Calculator" chip on calculator items outside exams, graph stimuli. Exports `readNumber`, `splitNumber`, `threeOk`, `normUnit`, `formatKey`. |
| `pages/exams.js` | `MCQ_PARTS` (A: 29 in 62 min, no calculator; B: 13 in 38 min, calculator) and `FRQ_PARTS` (A: 2 in 30 min, calculator; B: 4 in 60 min, no calculator), 9 points each. A calculator notice opens each part, with a link to a free graphing calculator (Desmos); nothing third party is embedded. Readiness is 50% MCQ + 50% FRQ, labelled "Not calibrated". |
| `pages/score.js` | `ApCalcScore`: composite = 50 × (MCQ ÷ 42) + 50 × (FRQ points ÷ 54); estimated bands 66/49/40/23 (needs-author `score-cutoffs`); a test holds them equal to the practice exam's band. |
| `pages/cram.js` | Default exam date 2027-05-10; 29 + 13 and 2 + 4 format text; timed sets at 100/42 min a question. |
| `pages/frq-kit.js`, `frq.js`, `dashboard.js`, `practice.js` | The eight FRQ types; practice filters for expr, calculator and no-calculator items. |
| `calc.css` | Crimson tint (`--ctint` `#FCE8EE`, `--cink` `#8C1036`, 9.4:1 on white and 8.0:1 on the tint; dark `rgba(232,80,122,0.10)` / `#F7B8CA`), the same values as `body[data-course="apcalc"]` in `assets/theme.css`; MathML, plot and expr styles. |

Dropped from the fork: the physics scene helper, free-body and drawing parts, SI unit reduction, the
g = 9.8 / 10 rule, significant figures, the equations sheet.

## Tools

Ten trainers (`docs/apcalc-spec.md` section 6), registered in `data/pages.json` with `studio: true`;
`limit-explorer`, `tangent-tracer` and `rule-drills` free, the rest `premium: 'tools'`. Each slug owns
four files, so authors work in parallel:

```
calculus/assets/tools/math/<slug>.js         the model: ApCalcMath.register('<slug>', {...})
calculus/assets/tools/<slug>.js              the page script (ApCalcTools.frame ...)
scripts/lib/apcalc-tool-checks/<slug>.mjs    the validator for data/tools/<slug>.json
scripts/test/apcalc-tool-<slug>.test.mjs     its tests
```

Slugs: `limit-explorer`, `tangent-tracer`, `rule-drills`, `related-rates`, `motion-lab`,
`curve-analyzer`, `riemann-sums`, `accumulation`, `slope-fields`, `area-volume`.
`_shared.mjs` loads `calc-expr.js`, `calc-math.js`, `calc-tool-math.js` and `calc-plot.js` in a vm so
the validators recompute every number with the code students run.

`ApCalcTools` (`tools/calc-tools.js`) is the physics framework (frame, modes, `studioPane`, `drill`,
`keepGoing`, `cue`, `explain`, `slider`, `questions`, `frq`), plus an **`expr` drill step**: a step
`{ expr: { answer, vars, domain, mode, mistakes } }` gets a text box with the live preview and is graded
by `ApCalcMath.diagnoseExpr`.

### Shared math: `ApCalcMath` (`tools/calc-tool-math.js`)

```
round(x, d) fixed(x, d) sig(x, n) fmt(x, n)
r3(x) t3(x) three(x, a)                three-decimal rule
rng(seed): r() r.int r.pick r.between r.nonzero
near(x, a, rel, abs) cell(answer, rel, mistakes, abs) diagnose(cell, x)
parse fn toTex read compare gradeExpr exprCell(answer, opts) diagnoseExpr(cell, typed)
deriv(f, x, h?) deriv2(f, x, h?) integral(f, a, b, tol?)   (adaptive Simpson)
riemann(f, a, b, n, 'left'|'right'|'mid'|'trap') riemannTable(xs, ys, kind)
root(f, a, b) roots(f, a, b, n?) extrema(f, a, b) -> { min, max, critical }
register(slug, model) camel(slug)
```

`diagnose` names, after an authored slip: sign, factor of 2, missing π, degrees vs radians, not to three
decimal places.

### Plots: `ApCalcPlot` (`tools/calc-plot.js`)

```
svg(spec) -> string      frame(spec) -> { sx, sy, ix, iy, ... }      ticks(a, b, n) piTicks(a, b)
sample(f, a, b, frame, n) -> runs broken at jumps                     tangent(f, a) secant(f, a, b)
mount(host, spec) -> { el, frame, update(spec) }                      (browser)
draggable(svg, frame, { x, y, label, step, onMove, constrain, axis }) keyboard: arrows, Shift, Home/End
loop(step, { duration, still, onEnd })   draws the end state under reduced motion;  reduced()
```

`svg` throws on a label under 20 characters. Slope-field segments keep one length on screen.

## Practice exams: `data/exams/forms.json`, `items.json`

As AP® Physics 1, checked by `checkForms` (`scripts/lib/apcalc-exams.mjs`): at least two forms; Section
I is 42 questions, Part A's 29 no-calculator questions before Part B's 13 calculator ones; a block
never mixes calculator and no-calculator items; each unit's count inside its weight range
(`unitRange`: 5-10% gives 2-5, 10-15% 4-7, 15-20% 6-9 of 42); Section II is 6 FRQs, 2 calculator then
4 no-calculator, 9 points each, no type more than twice; no question in two forms. Exam-only items
(`items.json`, `calc-exam-<form>-<nn>`, stimuli `exam-<form>-s<n>`) are four-option calculator items in
the bank format; their options show three decimals, rounded, and `EXAM_NUMBERS` recomputes each key.

## Justification trainer: `data/justify/<unit>.json`

As AP® Physics 1. Skills (`JUSTIFY_SKILLS`): `theorems`, `limits`, `extrema`, `behavior`,
`accumulation`, `motion`, `context`, `de`, `rules` (derivative steps shown), `setup` (area and volume).
The checker refuses a model answer that names the Intermediate, Mean or Extreme Value Theorem without
saying the function is continuous. A context table uses `<table class="calc-data">`. `answer` is a raw key
elsewhere, so the generator renders `earns.answer` and `misses.answer` itself.

## Exams and entry pages

`score-calculator.html` (54 FRQ points, estimated cut-offs), `formula-sheet.html` ("Formulas and theorems
to know": `EQ` rows `[TeX, what, when, 'Unit N', topic, trainers?]` in groups, plus `NOT_ON` "easy to
forget" lines `[title, text, topic]`; trainers link only when live), `unit-tests/<unit>.html` (built once a
unit is published).

## Registration

Registered hidden in Phase 0; **status `beta` since the launch** (spec decision 12), Premium `onSale: false`
until the owner checklist (spec section 8). `assets/courses.js` (order 7); `assets/premium.js` pass `calc-2027`, $25 through
2027-06-30, `onSale: false`; `assets/exam-date.js` 2027-05-10; `assets/hub-progress.js` ranks;
`assets/site-search-all.js`, `assets/tutor.js`, `assets/theme.css`, `search.html`; `index.html` and
`404.html` markers (filled by `build-pricing.mjs`; the home's course count is generated); `scripts/build-pricing.mjs`,
`build-og-images.mjs`, `check-site.mjs`, `check-a11y.mjs`, `check-console.mjs`, `check-weight.mjs`;
`worker/src/premium.js` and `index.js`; `sw.js` `COURSE_URLS.calculus`;
`scripts/sql/migrations/2026-10g-apcalc.sql` (**not applied**), with `schema.sql`, `reports.sql` and
`pageviews.sql` updated.

## Checks

```
node scripts/build-apcalc.mjs --check
node scripts/check-apcalc-map.mjs --check        nothing used before it is taught (prose and notation)
node scripts/check-apcalc-content.mjs --check    formats, math, numeric and expr keys, plots, forms
node --test scripts/test/apcalc-*.test.mjs
scripts/ci-local.sh                              everything CI runs
```
