# AP® Microeconomics course: architecture

How the course is built and where everything lives. Forked from AP® Macroeconomics as it stands on main
(`docs/apmacro-architecture.md`, spec decision 1), so every shared page type matches (round 3 pages, covers,
dashboard design F, the textbook toggle, flashcards, video lessons, quick answers, "Make it specific", the AI FRQ
grader hook, flagging in Review only, analytics hooks, score card, teacher classes, the guided path). This file says
in one line what is the same as Macro and in full what differs. Built in Phase 0 (2026-11-09); where this file and
the code disagree, the code's header comments are newer. Writing rules: `docs/apmicro-authoring-guide.md`; concept
map: `docs/apmicro-phase0.md`; status and decisions: `docs/apmicro-spec.md`; open points: `docs/apmicro-needs-author.md`.

## Layout

```
microeconomics/                          the course, at levlprep.com/microeconomics/
  index.html learn.html glossary.html units/ lessons/ notes/ unit-sheets/                       generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html path.html                                  generated
  frq/<id>.html  tools/<slug>.html  formula-sheet.html  unit-tests/<unit>.html                  generated
  manifest.json                         "LevlPrep Microeconomics" (build-pricing.mjs)
  assets/
    mic-core.js mic-questions.js mic-lesson.js mic-nav.js mic-book.js mic-toc.js mic-home.js
    mic-math.js                         ApMicroTex: TeX to MathML (Macro's subset)
    mic-calc.js                         ApMicroCalc: the micro calculations (below)
    mic-graph.js                        ApMicroGraph: the graphs, with areas, curves, lines and panels (below)
    mic-matrix.js                       ApMicroMatrix: payoff matrices (below)
    mic-grade.js                        ApMicroGrade: numbers, "Make it specific", graph and matrix grading
    mic.css mic-home.css og-image.png pages/*.js pages/*.css
    tools/mic-tools.js mic-tools.css    tool framework (ApMicroTools; drill steps num, choice, unit, graph, matrix)
    tools/mic-tool-math.js              shared tool math (ApMicroMath; Calc(), Graph(), Matrix())
    tools/mic-plot.js                   ApMicroPlot: data figures
    tools/math/<slug>.js                ONE TOOL's model (ApMicroMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
  data/                                 THE SOURCE: pages.json, descriptions.json, published.json, and from
                                        Phase 1 questions/ lessons/ notes/ glossary/ frq/ tools/ exams/ justify/
```

No served path contains the token "ap". Storage keys `apmicro_progress_v1`, `apmicro_prefs_v1` and the rest as Macro
with `apmicro_`. Ids: bank `mic-<topic>-<n>`, exam-only `mic-exam-<form>-<nn>`, CSS classes `mic-`, events
`micgraph:change` and `micmatrix:change`.

## Calculations: `ApMicroCalc` (`mic-calc.js`)

Same contract as `ApMacroCalc`: `evaluate({ fn, args, pick })`, `FNS` lists every recipe, the content check
recomputes every `numeric.from` and every `mistakes[].from`. Recipes: percent change and midpoint percent;
`priceElasticity`, `midpointElasticity`, `incomeElasticity`, `crossElasticity`, `totalRevenue`; `marginalProduct`,
`averageProduct`, `productTable`; `totalCost`, `variableCost`, `afc`, `avc`, `atc`, `marginalCost`, `costTable`;
`marginalRevenue`, `profit`, `unitProfit`, `accountingProfit`, `economicProfit`, `profitMaxQ`; `mrp`, `mrc`,
`wageBill`, `hireCount`, `perDollar`, `leastCost`, `muPerDollar`, `utilityMax`; areas `triangle`, `rectangle`,
`trapezoid`, `consumerSurplus`, `producerSurplus`, `taxRevenue`, `subsidyCost`, `tariffRevenue`, `dwl`,
`incidence`; `shortage`, `surplusQty`, `imports`, `exports`, `linearMarket`; `lorenz`, `share`, `gini`;
`opportunityCost`, `pct` and the arithmetic helpers. Every elasticity returns the absolute value except income and
cross (the sign is the answer). Tests: `scripts/test/apmicro-calc.test.mjs`.

## Graphs: `ApMicroGraph` (`mic-graph.js`) and the `graph` item

Macro's spec format, checker, renderer and grading contract, extended (spec section 5b). The file header lists the
pure API. Coordinates 0-10 on both axes of each panel. Straight curves have slope -1 or +1 (MR and MFC twice
that). Cost curves come from one cubic total-cost model (`costModel`), so MC passes exactly through the minimum
of AVC and of ATC; `COST.firm`, `COST.monopoly`, `COST.natural`.

### The kinds

| kind | curves (movable) | regions to shade | named points | line |
|---|---|---|---|---|
| `ppc` (`bow: 'in'` for constant or decreasing cost) | PPC | | | |
| `sd` | D, S | cs, ps, ts | eq | |
| `sd-micro` with `policy` | D, S | per policy, below | eq | the policy line |
| `costs` (`set: short\|long`, `afc`) | MC, ATC (AVC follows MC, AFC follows ATC); LRATC | | min-atc, min-avc, min-mc, mes | |
| `pc` (panels market, firm) | D, S; MC, ATC | profit or loss, tr, tc | market, firm, min-atc, min-avc | P, carried from market to firm |
| `monopoly` (`natural`) | D (MR follows), MC, ATC | cs, dwl, profit, tr, tc | profit-max, mr=mc, allocative, fair-return, revenue-max | Pr |
| `monocomp` (`run: short\|long`) | D (MR follows), MC, ATC | cs, dwl, profit (short run), tr, tc | profit-max, mr=mc, allocative, min-atc | |
| `labor` (panels market, firm) | DL, SL; MRP | | market, firm | W, carried to the firm |
| `monopsony` | SL (MFC follows), MRP | wage-bill, dwl | hire, mrp=mfc, competitive, min-wage | MW |
| `externality` (`ext: { type: neg-prod\|pos-prod\|pos-cons\|neg-cons, gap }`) | D, S (the social curve is fixed) | dwl, ext-cost or ext-benefit | market, efficient | |
| `lorenz` | LC (EQ fixed) | gini, below | | |

`sd-micro` regions by `policy.type`: `ceiling` and `floor` (`at`): cs, ps, dwl, ts, transfer, cs-before,
ps-before; `tax` (`amount`): cs, ps, tax-revenue, buyer-burden, seller-burden, dwl; `subsidy` (`amount`): cs, ps,
subsidy-cost, dwl; `world` (`at`): cs, ps, gain, ts; `tariff` (`at`, `amount`): cs, ps, tariff-revenue, dwl. A tax
draws S shifted up by `amount` and a subsidy S shifted down (fixed offsets, not a student shift).

### Item format (additions to Macro's)

```
graph: { kind, panels?, start?, show?, policy?, ext?, natural?, run?, set?, afc?, bow?, names?, line?,
  do: ['label' | 'shift' | 'equilibrium' | 'point' | 'line' | 'shade'],
  key: {
    shifts?: [{ curve, dir, steps? }], because?, outcome?,          as Macro
    point?: { at: <named point> } | { region: 'on'|'inside'|'outside' } | { on: <curve>, x?, y? },
    line?: { to: <named point> } | { at: <height> } | { side: 'above'|'below', of: <named point> },
    shade?: <region> | [<region>, ...]                              graded by cell identity
  },
  letters?: true          print a letter in each cell (a stimulus asks "which area is ...")
  slips?: { <curve or region>: sentence } }
```

The checker refuses a region the graph does not have (the message lists the regions it has), a named point the
kind does not have, a line key with no height, an unknown curve or task, and a key that leaves `outcome` unsaid.

### Response and grading (`ApMicroGrade.graph(spec, response)`)

Response `{ shifts, eq, point, labels, line, shade: [cell ids] }`. Each task is one rubric point, as Macro: labels
(every axis and curve slot), shift (curve and direction; magnitude never graded), equilibrium, point (within the
snap distance of the key), line (height within half a step, or the side asked), shade (exactly the key's cells:
one cell too many or too few is wrong, and the feedback names what the extra or missing cells are, from
`REGION`/`REGION_HINT`). `valid` is false for an untouched task.

### Renderer (`ApMicroGraph.mount`)

viewBox 360 by 300 per panel. Two panels sit side by side when there is room (each at least 320 px) and wrap one
above the other on a phone; the line in a two-panel kind is drawn dashed across the gap. Shading: tap or click a
cell (letters a, b, c ... mark the cells), or use the "Area a" toggle buttons under the graph (keyboard and screen
reader); a second tap clears it. Labels use candidate positions so they do not overlap; long line labels (d = MR = AR = P) wrap in the
right margin. Every graph has an `aria-label` from `describe(spec)`, so a screen reader hears the policy, the
shift and the outcome.

### FRQ graph parts

As Macro: a part with `type: 'graph'` and `graph`, its rubric lines carrying `auto: labels|shift|equilibrium|point|
line|shade` (one per task). A long FRQ needs at least one graph part.

## Payoff matrices: `ApMicroMatrix` (`mic-matrix.js`) and the `matrix` item

A separate format (not a graph), used four ways: a bank item (`type: 'matrix'`), a lesson check item, an FRQ part
(`type: 'matrix'`, rubric `auto: dominant|nash|best|joint`) and a drill step (`kind: 'matrix'`). Spec and response
are in the file header. Player 0 picks the row and is paid first in each cell, as the exam writes it.

- `check(spec)` refuses ties (a player paid the same by two strategies against one choice leaves "better"
  undecided), unknown tasks, and a `best` task without `ask.best`.
- Grading is exact. Slips named: a dominant strategy claimed from the single largest payoff, "none" when one
  exists, a dominant strategy claimed when there is none, a missing Nash cell, the joint-payoff cell picked as
  Nash, "no Nash equilibrium" when there is one, the payoffs summed for a best response.
- `html(spec)` writes a captioned table with scoped headers; buttons per cell when the student taps Nash cells,
  two selects for the dominant strategies, a "No cell is a Nash equilibrium" box.

## Content formats

As Macro (`docs/apmacro-architecture.md`, "Content formats"), with `matrix` added to the item types: `single`,
`multi`, `numeric`, `specific`, `order`, `graph`, `matrix`. Bank single-answer items have four options; exam forms
add a fifth (decision 5). Stimulus kinds `data`, `graph` (a spec, drawn at build time, `letters` allowed) and
`text`; a stimulus may also carry a `matrix`. The fixture `scripts/test/fixtures/apmicro-data/` has one of every
format, including the new graph kinds, a shade item, a two-panel FRQ part and a matrix FRQ part.

## Generator: `scripts/build-apmicro.mjs` (+ `scripts/lib/apmicro-*.mjs`)

As Macro's. `apmicro-build.mjs` holds `IDENTITY`, `FREE_UNITS` (`['unit-1']`) and `FREE_TOPICS` (Topics 2.1 to 2.4:
`demand`, `supply`, `price-elasticity-demand`, `price-elasticity-supply`); every graph-skills lesson is free.
`apmicro-entry.mjs` writes the "Graphs and formulas you must know" page (sections choices, elasticity, areas,
costs, factors; every graph kind drawn; the payoff matrix card in place of Macro's balance sheet).
`apmicro-exams.mjs` holds the exam config, the form checker and the "Make it specific" checker. Every page loads
`mic-matrix.js` between `mic-graph.js` and `mic-grade.js`. `APMICRO_DATA` and `APMICRO_PUBLISHED` point the build at
another data folder and chapter list (tests); never run it with `--out` at the repository root.

## Exam config (May 2027)

Tue 2027-05-04 (`assets/exam-date.js`, cram `DEFAULT_EXAM`). Section I: 60 questions, 70 minutes, 66%, five choices
on forms, four in the bank. Section II: 3 questions in 60 minutes including a 10-minute reading period, 33%: one
long (10 points) then two short (5 points). Four-function calculator in both sections. No composite score, no band.
"Make it specific" skills: graph, marginal, price, area, compare, longrun, derived, efficiency, calculate, identify;
the checker enforces the reader-report rules (a chain with three links, entry or exit in a long-run chain, MRP in a
derived-demand chain, both comparisons for a dominant strategy, price from demand, the marginal rule stated).

## Tools

Eight trainers (spec section 6), registered in `microeconomics/data/pages.json`, each four files owned by one
builder: `assets/tools/<slug>.js`, `assets/tools/math/<slug>.js`, `scripts/lib/apmicro-tool-checks/<slug>.mjs`,
`scripts/test/apmicro-tool-<slug>.test.mjs`. Phase 0 stubs register `{ stub: true }` and pass the frame check; a
tool page is built only when `data/tools/<slug>.json` exists and its topic is published. Drill steps: `num`,
`choice`, `unit`, `graph` (with `line` and `shade` tasks) and `matrix`; `_drills.mjs` sweeps 300 seeds a context and
type and checks every graph and matrix step against its own key and an untouched response.

## Registration (hidden, decision 3)

Every point Macro is registered at, with `status: 'hidden'`: `assets/courses.js` (+ `build-courses`), Worker
(`premium.js` pass `micro-2027`, `URL_COURSE`, `COURSE_NAMES`; `index.js` `COURSE_RULES`), `assets/premium.js`
(`onSale: false`), path, teacher classes (`class-model` COURSES; ORDER at launch), score card, vault rules, app
pages, og tags and images, weight budgets, a11y samples, tutor, search, sw.js, theme.css and the course CSS twins,
hub and 404 card slots (empty while hidden). SQL: `scripts/sql/migrations/2026-11i-apmicro.sql` and `schema.sql`,
written, not applied (launch step).

## Checks

`node scripts/build-apmicro.mjs --check`, `node scripts/check-apmicro-map.mjs`, `node scripts/check-apmicro-content.mjs
--check`, `node --test scripts/test/apmicro-*.test.mjs`, then `bash scripts/ci-local.sh`.
