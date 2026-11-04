# AP® Macroeconomics course: architecture

How the course is built and where everything lives. Forked from AP® Psychology as it stands on main
(`docs/appsych-architecture.md`, spec decision 1), with every shared page type (round 3 pages, course and tool
covers, dashboard design F, the textbook plain/interactive toggle, the flashcards tab, video lessons, quick
answers, the "Make it specific" builder, the AI FRQ grader hook, flagging in Review only, analytics hooks, no Beta
label); this file says in one line what is the same and in full what differs. Built in Phase 0 (2026-11-03);
where this file and the code disagree, the code's header comments are newer. Writing rules:
`docs/apmacro-authoring-guide.md`; concept map: `docs/apmacro-phase0.md`; status and decisions: `docs/apmacro-spec.md`.

## Layout

```
macroeconomics/                          the course, at levlprep.com/macroeconomics/
  index.html learn.html glossary.html   as AP® Psychology ("Graph skills you need" in place of
  units/ lessons/ notes/ unit-sheets/   "Research skills you need")                                  generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json          generated
  frq/<id>.html  tools/<slug>.html                                                              generated
  formula-sheet.html unit-tests/<unit>.html   "Graphs and formulas you must know", free unit tests generated
  manifest.json                         "LevlPrep Macroeconomics" (from build-pricing.mjs)
  assets/
    mac-core.js mac-questions.js mac-lesson.js mac-nav.js mac-book.js mac-toc.js mac-home.js
    mac-math.js                         ApMacroTex: TeX to MathML (the same subset)
    mac-calc.js                         ApMacroCalc: the macro calculations (below)
    mac-graph.js                        ApMacroGraph: the nine graphs, model + checker + SVG + DOM (below)
    mac-grade.js                        ApMacroGrade: numbers, "Make it specific", graph grading
    mac.css mac-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css
    tools/mac-tools.js mac-tools.css    tool framework (ApMacroTools; drill steps num, choice, unit)
    tools/mac-tool-math.js              shared tool math (ApMacroMath; Calc() and Graph() reach the libraries)
    tools/mac-plot.js                   ApMacroPlot: data figures (line, bar, scatter)
    tools/math/<slug>.js                ONE TOOL's model (ApMacroMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
    bank/ frq/ tool-data/ exams/ justify.json ...   generated
  data/                                 THE SOURCE: everything authored lives here
```

No served path contains the token "ap". Storage keys `apmacro_progress_v1`, `apmacro_prefs_v1`,
`apmacro_flashcards_v1`, `apmacro_flagged_v1`, `apmacro_frq_drafts_v1`, `apmacro_cram_v1`,
`apmacro_exam_date`; globals `ApMacro*`; question ids `mac-`; CSS classes `mac-`. Pass id `macro-2027`.

Gone from the fork: `psy-stats.js` (replaced by `mac-calc.js`), the study summary stimulus, the AAQ and EBQ FRQ
types and their `readings`/`restricted` fields, the 988 help note (`HELP_*`, `notesWithHelp`, `.psy-help`), the
mental-health language rules and the myth list (replaced by the reader-report slips, `.mac-slip`), the
`histogram` and `normal` plot kinds.

## Calculations: `ApMacroCalc` (`mac-calc.js`, pure, node and browser)

Every number a key, a tool drill or an exam item shows is a recipe `{ fn, args, pick? }`;
`ApMacroCalc.evaluate(recipe)` gives it (12 significant digits), and an argument may itself be a recipe.
MPC, MPS and reserve ratios are decimals (0.8, not 80); rates are percents.

```
gdp(C, I, G, X?, M?)  netExports(X, M)  cpi(now, base)  inflation(old, new)  deflator(nominal, real)
realValue(nominal, index)  nominalValue(real, index)  growth(old, new)  perCapita(total, pop)
laborForce(employed, unemployed)  unemploymentRate(u, lf)  participationRate(lf, adults)
naturalRate(frictional, structural)  cyclicalRate(actual, natural)
realRate(nominal, expectedInflation)  nominalRate(real, expectedInflation)
mps(mpc)  spendingMultiplier(mpc)  taxMultiplier(mpc) [negative]  balancedBudgetMultiplier(mpc) [1]
moneyMultiplier(rr)  requiredReserves(deposits, rr)  excessReserves(reserves, deposits, rr)
maxLoans(excess)  maxMoneyChange(excess, rr)
gapChange(gap, multiplier) [gap / multiplier, sign kept]  totalChange(change, multiplier)
velocity(P, Y, M)  budgetBalance(revenue, outlays)  opportunityCost(gaveUp, gained)
inverseRate(rate)  convert(amount, rate)  pct(part, whole)
add sub mul div pow neg round abs min max
```

Tests: `scripts/test/apmacro-calc.test.mjs`.

## Graphs: `ApMacroGraph` (`mac-graph.js`) and the `graph` item format

The exam scores graphs point by point: correctly labeled axes, the right curve shifted the right way, the new
equilibrium shown against the old (framework.md sections 5 and 8). A `graph` item asks for exactly those and is
graded by code, never by a model.

### The graph kinds

| kind | Axes (x, y) | Curves (id: shape, start) | Equilibrium of | Outcome words |
|---|---|---|---|---|
| `ppc` | the two goods (`names.x`, `names.y`) | `PPC`: bowed out, 7 | none | none (points: inside, on, outside) |
| `sd` | Quantity, Price | `D`: down 5, `S`: up 5 | D, S | `quantity`, `price` |
| `adas` | Real GDP, Price level | `AD`: down 5, `SRAS`: up 5, `LRAS`: vertical 5 | AD, SRAS | `output`, `price level` |
| `money` | Quantity of money, Nominal interest rate | `MD`: down 5, `MS`: vertical 5 | MD, MS | `quantity of money`, `nominal interest rate` |
| `reserves` | Quantity of reserves, Policy interest rate | `RD`: ample-reserves demand (steep, then flat) 3, `RS`: vertical 7 | RD, RS | `quantity of reserves`, `policy rate` |
| `lf` | Quantity of loanable funds, Real interest rate | `DLF`: down 5, `SLF`: up 5 | DLF, SLF | `quantity of loanable funds`, `real interest rate` |
| `phillips` | Unemployment rate, Inflation rate | `SRPC`: down 5, `LRPC`: vertical 5 | SRPC, LRPC | `unemployment rate`, `inflation rate` |
| `forex` | Quantity of <currency>s, Price of the <currency> (<other>s per <currency>) | `D`: down 5, `S`: up 5 | D, S | `quantity of the currency`, `value of the currency` |

Coordinates run 0 to 10. Straight curves have slope -1 or +1, so every equilibrium is exact. A shift moves a
curve by whole steps: right or left for `down`, `up` and `vertical` shapes, out or in for the PPC, up or down for
the reserve-demand shape (raising or lowering the administered rate moves its flat part). Magnitude is never
graded. The ninth graph students draw (the bank balance sheet) is a table, not a graph kind.

### Item format

```json
{
  "id": "mac-adas-short-run-changes-2", "unit": "unit-3", "topic": "adas-short-run-changes",
  "type": "graph", "practice": "4.C", "level": "apply", "diff": 2,
  "q": "Input costs rise across the economy. Shift the right curve and mark the new short-run equilibrium.",
  "why": { "correct": "Higher input costs shift SRAS left; the price level rises and real output falls." },
  "graph": {
    "kind": "adas",
    "do": ["shift", "equilibrium"],
    "start": {},
    "movable": ["AD", "SRAS"],
    "key": {
      "shifts": [{ "curve": "SRAS", "dir": "left" }],
      "because": "a rise in input costs",
      "outcome": { "price level": "up", "output": "down" }
    },
    "slips": { "AD": "Input costs change what firms can supply at each price level, so they shift SRAS, not AD." }
  }
}
```

- `do`: the tasks, one rubric point each: `label` (every axis and curve, from dropdowns whose wrong choices are
  the confusions readers report: price for price level, nominal for real, a flipped currency ratio), `shift`
  (drag or arrow-key a curve), `equilibrium` (place E2; needs `shift`), `point` (place one point; not with
  `shift`). `outcome` is scored as its own point whenever `key.outcome` is given.
- `start`: steps each curve starts away from its default (-2 to 2), for "the economy is in a recessionary gap".
- `movable`: the curves the student may move (default all). The key's curves must be in it.
- `key.shifts`: each curve that moves and its direction (`left`/`right`, `up`/`down`, `out`/`in`); one step
  each. `key.because`: the cause in a few words, used in the slip line. `key.outcome`: `up`, `down` or `same`
  per outcome word; the checker refuses an outcome the key's shifts do not give. With two or more curves shifting,
  an axis whose direction depends on the sizes (`ApMacroGraph.indeterminate(spec, set)`: the directions at half
  and whole steps disagree) must be left out of `key.outcome`, and the grader never grades it, whether the key's or
  the student's shifts make it so (integrator, 2026-11-03; before, equal steps made it "same" and unequal ones lost
  the point). `key.hold` (a list of outcome words the key gives as `same`) is the one exception: a long-run story
  that returns to full employment (AD right, then SRAS left) pins output, so "output same" is graded there.
  `key.alt` (builder T1): other accepted shift sets, each a list of `{ curve, dir }`; the grader scores
  the response against the key and every alt and keeps the best (an alt's outcome is read off its own shifts, on
  the words `key.outcome` names, without the axes that alt leaves to the sizes),
  and the content check (`graphProblems`) and the drill check (`stepsSound`) grade every alt drawn
  (`ApMacroGraph.keyResponse`). Used where the exam accepts either shift (authoring guide).
- `key.point` (with `do: ["point"]`): `region` (`inside`, `on`, `outside` a PPC), `on` (a curve id), `x`/`y`
  (`up`/`down` from the starting equilibrium); any combination.
- `slips`: per wrong curve, the sentence shown when the student moves it instead of the key's.
- `names`: the goods of a PPC (`x`, `y`), the two currencies of a forex graph (`currency`, `other`).
- `linear: true` (PPC only, added 2026-11-03): a straight-line PPC, constant opportunity cost (comparative
  advantage, CED 1.3); `ends: { x, y }` (with `linear`) gives the most of each good in the problem's units, sets
  the line's slope (the larger intercept reaches 7) and is printed on the axes at the starting line. Shifts,
  `region` (inside, on, outside the line), the grader and the checker work as for the bowed curve. A bowed PPC
  is unchanged (no `linear`).
- `pointLabel`: the placed point's label (default `X`).

A graph stimulus (`kind: "graph"`) carries `graph: { kind, names?, show: { curve: steps }, showEq? }` and is drawn
as given at build time; set items then ask about it. `showEq: true` (integrator, 2026-11-03) also marks the new
crossing, E2 with its axis marks (r1 and r2, PL1 and PL2), for a stimulus "after the shift" whose items read the new
equilibrium (`policy-short-run-s2`, `crowding-out-s1`); without it only the old equilibrium is marked. The content
check refuses it on a graph with no shift.

### Response and grading (`ApMacroGrade.graph(spec, response)`)

The response is `{ shifts: { curve: steps }, eq: [x, y] | null, point: [x, y] | null, labels: { x, y, <curve>:
<curve> } }` (what `mount().get()` returns). The grader returns `{ valid, correct, score, points: [{ id, ok, note
}], notes, slip }`, one point per task in this order: `labels`, `shift`, `equilibrium`, `outcome`, `point`.

- shift: every key curve moved its way and nothing else. The slip names it in the reader's terms: "You shifted
  aggregate demand; a rise in input costs shifts short-run aggregate supply." (or the authored `slips` line), "…
  is the right curve, but it shifts left, not right.", "… shifts too", "… stays put".
- equilibrium: E2 within 0.3 of where the curves *as drawn* cross (consistent with the student's own shift, as
  readers score it). E2 snaps to quarter steps; one shift moves the crossing half a step.
- outcome: needs the right shift and E2 placed; then each outcome word compared.
- labels: every slot right; the first wrong one is named ("The vertical axis of the aggregate demand and
  aggregate supply graph is Price level, not Price.").
- point: region, curve (within 0.3) and direction checked.

### Renderer (`ApMacroGraph.mount(host, spec, opts)`)

SVG (viewBox 320 x 300, scales to the column; readable at 360 px), `role="img"` with the graph's state in words
as its name (and a polite live region on every change). Controls are real buttons under the picture, one per
movable curve and one per point, each a 44-px target: arrow keys move a curve one step (Home puts it back) or a
point half a step; pointer drag (mouse, pen, touch; `touch-action: none` on the stage) moves a curve along its
shift axis in whole steps or a point in quarter steps; a tap places the point. Labels are `<select>`s under the
graph. The starting curve stays drawn, faded and dashed, with subscript 1; the moved one gets subscript 2. After
Check, `showKey()` draws the key's curves dashed in the success color, labeled as the new curve (SRAS2). Colors
are theme tokens (`--cink`, `--muted`, `--good-text`, `--ink`; `--good-text` replaced the undefined `--ok`), so
light and dark follow the site theme.

`svg(spec, state)` options added by the integrator (2026-11-03), all optional: `state.n0`/`state.n1` name the
start and the current point (default 1 and 2: E1/E2 and the axis marks P1/P2; a long-run story passes `n1: '3'`
for E3, PL3, Y3), `state.curveN` the moved curves' subscript (default 2), `state.marks0` the start's own axis-mark
subscripts (`{ x: 'F' }` gives YF on AD-AS, `{ x: 'N' }` uN on the Phillips curves); a mark both points share
(the same output at E1 and E3) is printed once. E1 and E2 are drawn with subscripts. Curve labels are placed in
one pass: a label that would overlap another label or cross another curve's line moves a line down or up, the
old curve of a shift smaller than a step is labeled away from the new one, and E2's label goes left if it would
sit on a curve label. A whole-step shift labels the pair on their outer sides (`pairLabels`, integrator
2026-11-03, after the Unit 3 and 5 reviews): the right-hand curve keeps the right-hand place, the other takes the
left-hand side of its line (SRAS1 below and right of its line when SRAS2 is left of it, AD2 below and left of its
line), and a vertical pair puts the new label at the top on its outer side and the old one at its foot (LRAS1 low,
LRAS2 high, so they no longer crowd SRAS at the top). E labels sit level with the point on the right, or on the
left in the wedge between the guide and the down curve (below it when the other point is straight above, as in
the long run on LRAS); on the flat part of reserve demand they stay above the line. The key's label is left out
where the student's curve already lies on the key's. `ApMacroGraph.px`, `py` and `BOX` give the plot box in viewBox units, so a page draws on
top of the SVG without copying its numbers; `plural()` keeps yen, yuan, won, rand and baht unchanged. The AD-AS,
forex, reserves and policy-chain pages dropped their own arrows, axis marks, relabels and coordinates for these. Styles: `macroeconomics/assets/mac.css`,
section "Graphs". `opts.onChange(response)`, `opts.readonly`; `lock()` after answering.

Tests: `scripts/test/apmacro-graph.test.mjs` (model, checker, grader, SVG); `apmacro-questions.test.mjs` (the
engine grades graph items). The DOM half is exercised in a browser by `check-console.mjs` once a unit is
published (to add with the first published unit).

### FRQ graph parts

An FRQ part with `"type": "graph"` carries a `graph` spec (as a graph item's, checked the same way) and the
student draws it on the page (`frq-kit.js` mounts it; the draft is saved with the written answers): in exams
through `questionHtml(f, { write: true })`, and on the stable page `frq/<id>.html` through `ApMacroFrq.track(f)`
(added 2026-11-03; before it that page offered only text boxes, so "Check my graph" had nothing to check). Each rubric
line may name `auto` (`labels`, `shift`, `equilibrium`, `outcome`, `point`): "Check my graph" ticks those boxes
from `ApMacroGrade.graph` as an estimate the student can change; the self-score stays the student's. Paper gets
a grid (`.mac-frq-grid`). Example (the long placeholder FRQ's part A, 4 points):

```json
{ "label": "A", "points": 4, "type": "graph",
  "prompt": "<b>Draw</b> a correctly labeled AD-AS graph and <b>show</b> the effect of a rise in input costs.",
  "graph": { "kind": "adas", "do": ["label", "shift", "equilibrium"], "movable": ["AD", "SRAS"],
    "key": { "shifts": [{ "curve": "SRAS", "dir": "left" }], "because": "a rise in input costs",
             "outcome": { "price level": "up", "output": "down" } } },
  "rubric": [ { "point": "Correctly labeled axes and curves", "accept": [], "auto": "labels" },
              { "point": "SRAS shifted left", "accept": [], "auto": "shift" },
              { "point": "New equilibrium where AD meets SRAS2", "accept": [], "auto": "equilibrium" },
              { "point": "Higher price level and lower real output shown", "accept": [], "auto": "outcome" } ],
  "sample": "…" }
```

## Content formats

As AP® Psychology (lessons, notes, glossary, descriptions, pages, published), with these changes.

### Questions: `data/questions/<topic>.json`

`{ stimuli: { id: {...} }, items: [...] }`. Types: `single` (4 options in the bank; exam forms serve 5, see "Practice exams"), `multi`,
`order`, `numeric`, `specific`, `graph`. `practice` is a skill id `1.A`-`1.D`, `2.A`-`2.C`, `3.A`-`3.C`, or
`4.A`-`4.C` on a graph item only (graphing is assessed only in Section II).

**Stimuli and sets.** `kind` is `data` (a `table`, `plot` or `chart`), `graph` (a `graph` spec) or `text` (a
scenario in `text`). Data are `invented: true` or carry a `source` with a publisher and a year ("Bureau of Labor
Statistics (2025)"). The bank index marks each item's set kind (`d`, `g`, `t`).

### numeric

`numeric: { from, unit?, places?, tol?, rel?, mistakes?: [{ value | from, why }] }`; `from` is required (an
`ApMacroCalc` recipe; a typed `answer` that disagrees fails the content check).

### FRQ: `data/frq/<id>.json`

`{ id, type: "long" | "short", title, points: 10 | 5, units, topics, practices, scenario?, stimulus?, parts: [{ label,
prompt, points, rubric: [{ point, accept, auto? }], sample, type?, graph?, write? }] }`. Labels `A`-`H`, sub-parts
`A(i)`. A long question has at least one graph part. `scenario` (optional, added 2026-11-03) is the text that sets
the question up, shown before the data and the parts as the exam lays it out (plain text with inline emphasis
only; no task verbs, which belong to the parts); `stimulus` (optional) is a data table or chart shown above the
parts. Both go out in `assets/frq/<id>.json`, the FRQ page and `frq-kit.js` (practice, exams, print). No `study`,
`sources` or `restricted`.

## Generator: `scripts/build-apmacro.mjs` (+ `scripts/lib/apmacro-build.mjs`, `apmacro-entry.mjs`, `apmacro-exams.mjs`, `apmacro-mathlib.mjs`)

As AP® Psychology (`--check`, `--out <dir>`, `APMACRO_PUBLISHED=unit-1`, `APMACRO_DATA=<dir>`), plus:

- `prepareBank` recomputes every numeric key and mistake value from its recipe; graph items pass through with
  their spec (graded in the browser); `questionHtml` draws a graph item's start state for no-JavaScript readers.
- Free lessons: `FREE_UNITS` (Units 1 and 2) and every "Graph skills you need" topic (spec decision 6).
- Home: from `IDENTITY` (provisional: headline "every graph, every shift.", yellow-green accent, a supply and
  demand cross icon, first rank Scarcity Spotter) and `scripts/lib/course-homes.json` `apmacro`.
- `formula-sheet.html` "Graphs and formulas you must know": `EQ` in `apmacro-entry.mjs` (output and prices,
  unemployment, multipliers, interest rates and money), each row naming its `ApMacroCalc` recipe with a worked
  line computed at build time; the same rows are the "Formulas" flashcard deck (`assets/formulas.json`); then the
  nine graphs drawn by `ApMacroGraph` (`GRAPHS`) with the trap for each.
- FRQ pages show the data, "four-function calculator", the suggested time (25 or 12 minutes), lined space per
  part and a grid for each graph part.
- No `score-calculator.html`, no readiness band.

## Exam config (May 2027)

One place in node (`scripts/lib/apmacro-exams.mjs`) and one in the browser (`pages/exams.js`), compared by
`scripts/test/apmacro-exams.test.mjs`: Section I `MCQ_PARTS` 60 in 70 minutes (66%); Section II `FRQ_PARTS` 3 in
60 minutes with a 10-minute reading period (33%), `FRQ_ORDER` long, short, short, `FRQ_POINTS` { long: 10, short:
5 }; four-function calculator in both; `EXAM_DATE` 2027-05-07 (also `assets/exam-date.js`, `pages/cram.js`
`DEFAULT_EXAM`). `MCQ_OPTIONS` 5 (the bank's `BANK_OPTIONS` 4); Section I questions stand alone, one stimulus per
question (`EXAM_SETS`, `EXAM_STIMULI`, `EXAM_ONLY`). Results show the two sections apart with their weights; no
composite, no band.

### Practice exams (Phase 3)

`data/exams/forms.json` (two forms; `mcq` is 60 one-question blocks in course order, `frq` long, short, short),
`items.json` (exam-only five-option items `mac-exam-<form>-<nn>` and their stimuli `exam-<form>-s<n>`) and
`fifth.json` (`options: { <bank id>: { option, why } }`, the fifth choice of each bank question a form uses).
`checkForms`, `checkFifth`, `checkNumbers` (`EXAM_NUMBERS`, `JUSTIFY_NUMBERS`) and `checkGraphs` (`EXAM_GRAPHS`)
run in the content check and the tests. The generator writes `assets/exams/forms.json` and `items.json` with every
question of the live forms as served (`examVersion`: four bank options plus the fifth at `fifthAt(id)`, a fixed position from the id, the key moving with its option, explanations inline, the
stimuli they need); `pages/exams.js` uses those copies and marks only `mac-exam-*` items as exam-only. The formula
page's `EQ` rows take an optional tenth field, `true` for "Easy to forget"; `GRAPHS` a fourth; `BALANCE_SHEET` is
the T-account card.

## Runtime differences from AP® Psychology

| File | What changes |
|---|---|
| `mac-questions.js` | `graph` items (mount, Check, every point marked, the key drawn); set labels Data, Graph, Scenario; numeric hint "four-function calculator". |
| `mac-grade.js` | `graph(spec, response)`; macro slot names for "Make it specific"; the sign slip names a decrease or a tax multiplier. |
| `mac-core.js` | Bank index set codes `d`, `g`, `t`. |
| `pages/exams.js` | The config above; `pickFrqs` draws one long then two short; the calculator notice. |
| `pages/cram.js` | Default exam 2027-05-07; the 60 + 3 format; timed sets at 70/60 min a question. |
| `pages/frq-kit.js` | Types long and short; graph parts mounted and "Check my graph"; no readings or restricted terms. |
| `pages/practice.js`, `dashboard.js`, `flashcards.js`, `search.js` | A "Graphs" filter, the FRQ type names, the "Formulas" deck. |
| `mac.css` | Provisional yellow-green tint on `body.mac`; the graph styles; the study, myth and help styles gone. |
| `tools/mac-plot.js` | `histogram` and `normal` removed (and `r` on scatter). |

## Tools

Eight trainers (`docs/apmacro-spec.md` section 6) plus the written-answer trainer (`justify`), registered in
`macroeconomics/data/pages.json` with `studio: true` and scaffolded in Phase 0: a stub model (`stub: true`), page
script, validator and test per slug; nothing builds until `macroeconomics/data/tools/<slug>.json` exists and its
topic is published. Free: `graph-studio`, `ppc-trade`, `indicators-lab`; the rest `premium: 'tools'`. Each slug
owns four files:

```
macroeconomics/assets/tools/math/<slug>.js      the model: ApMacroMath.register('<camelSlug>', {...})
macroeconomics/assets/tools/<slug>.js           the page script (ApMacroTools.frame ...)
scripts/lib/apmacro-tool-checks/<slug>.mjs      the validator for data/tools/<slug>.json
scripts/test/apmacro-tool-<slug>.test.mjs       its tests
```

**Graph steps in drills.** `ApMacroTools.drill` has a step kind `graph` (`{ key, kind: 'graph', spec, label,
explain?, practice }`, added by the integrator 2026-11-03): the spec is a graph item's, mounted with
`ApMacroGraph.mount` in the step or wherever the page's `o.graphHost(step, api)` points (an element, or a mount the
page made on its stage figure; drill hears it through the `macgraph:change` event every mount now fires on its
host). Check stays disabled until something on the graph moved; `ApMacroGrade.graph` grades it (correct is right,
the slip is the note, each rubric point is marked under it); "Show the answer" draws the key (`showKey(true)`) and
locks the graph; `api.graph` is the mount, for `o.onStep`. `_drills.mjs` `stepsSound` checks that the spec passes
`ApMacroGraph.check`, that its key and every `key.alt` drawn (`ApMacroGraph.keyResponse`) grade right and that an
untouched graph does not. `reserves-lab` (step `shift`), `adas-lab` and `forex-lab` (step `graph`) use it in place
of their hidden-choice bridges, with the same recorded step ids; Graph Studio keeps its own drill (its graph steps
carry `task`, checked by its validator); `policy-chain`'s drill has no graph step (its graphs follow the links).

Slugs and topics: `graph-studio` (shifts-movements), `ppc-trade` (comparative-advantage), `indicators-lab`
(price-indices-inflation), `multiplier-lab` (multipliers), `adas-lab` (long-run-self-adjustment), `reserves-lab`
(monetary-policy), `policy-chain` (policy-short-run), `forex-lab` (foreign-exchange-market). `_shared.mjs` loads
`mac-math.js`, `mac-calc.js`, `mac-graph.js`, `mac-grade.js`, `mac-tool-math.js` and `mac-plot.js` in a vm
(`runtime(slug)` returns `{ M, Tex, Calc, Graph, Grade, Plot, model }`). Tool covers
(`assets/covers/tools/apmacro/`) come with the builders. Every trainer that draws an economics graph uses
`ApMacroGraph` (no second graph renderer).

## "Make it specific": `data/justify/<unit>.json`

As AP® Psychology; `skill` is one of `chain`, `tool`, `graph`, `multiplier`, `selfadjust`, `currency`,
`calculate`, `identify` (`JUSTIFY_SKILLS`). The checker refuses a chain with fewer than three links,
self-adjustment that does not name SRAS, a gap answer that does not divide, a builder slot without a `why`, and
anything taught after the unit. Ids `u<n>-<words>`, `gs-<words>` for the graph skills chapter.

## Registration

Registered hidden in Phase 0 (2026-11-03), Premium `onSale: false` until the owner checklist. Hidden means: no hub
card, 404 card, premium.html entry, search scope or sitemap entry; the generated course lists include it. Files:
`assets/courses.js` (key `apmacro`, order 13, short "Macroeconomics", aliases `macroeconomics`, `macro`, `mac`,
status `hidden`) and the generated blocks (`node scripts/build-courses.mjs`); `assets/premium.js`
(`COURSES.apmacro`, pass `macro-2027`, $25 through 2027-06-30, `freeChapters: ['unit-1', 'unit-2']`, `onSale:
false`); `assets/exam-date.js` (2027-05-07); `assets/hub-progress.js` ranks; `assets/site-search-all.js` (source,
`urlKey`); `assets/tutor.js` (pages, starters, greeting); `assets/course/flags.js`, `study.js`; `assets/theme.css`;
the cover CSS in `assets/course/hub.css`, `r3.css`, `book.css`, `glossary.css`, `reading.css`, `r3-reading.css`;
`tool-studio.css` (`.mac-crumb`); `assets/covers/apmacro.svg`, `art/apmacro.svg`, `thumb/apmacro.svg`
(provisional); `index.html` and `404.html` markers (`hub-mac`, `nf-mac`); `sw.js` (`COURSE_URLS['macroeconomics']`,
cache v104); `worker/src/premium.js` (`PASSES['macro-2027']`, `URL_COURSE`, `COURSE_NAMES`), `worker/src/index.js`
(`COURSE_RULES.apmacro`), `worker/dist/worker.js` rebuilt; `scripts/sql/migrations/2026-11a-apmacro.sql` (NOT
applied) with `schema.sql`, `reports.sql`; `scripts/build-pricing.mjs` (hub and 404 cards, manifest),
`lib/premium-data.mjs` (counts), `lib/course-homes.json`, `lib/covers.mjs`, `lib/r3-home.mjs`, `lib/r3-inner.mjs`,
`lib/r3-tools.mjs`, `lib/r3-reading.mjs`, `lib/dashboard-page.mjs`, `lib/videos.mjs`, `add-video.mjs`,
`build-from-video.mjs`, `build-og-images.mjs` (`macroeconomics/assets/og-image.png`), `build-og-tags.mjs`,
`build-sitemap.mjs`, `check-console.mjs`, `check-site.mjs`, `check-weight.mjs` (site shell 341 -> 342, course
shell 83), `.github/workflows/checks.yml`, `scripts/ci-local.sh`. Not yet: `check-a11y.mjs` pages,
`check-console.mjs` flow, `app-pages.mjs`, `sources.html`, the AI FRQ grader's `FRQ_COURSES`; all at launch.

## Checks

```
node scripts/build-apmacro.mjs --check
node scripts/check-apmacro-map.mjs --check         nothing used before it is taught
node scripts/check-apmacro-content.mjs --check     formats, recomputed keys, graph specs the grader scores, sets, FRQs, forms
node --test scripts/test/apmacro-*.test.mjs        map, build, calc, graph, core, cram, exams, math, plot, questions, syntax, tools
scripts/ci-local.sh                                all of the above (also .github/workflows/checks.yml)
```
