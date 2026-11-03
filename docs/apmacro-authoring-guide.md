# AP® Macroeconomics authoring guide

Rules for writing AP® Macroeconomics content, adapted from `docs/appsych-authoring-guide.md`. They come from
`docs/apmacro-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/apmacro-architecture.md` ("Content formats", "Graphs"). The research is in
`docs/apmacro-research/framework.md`; every rule below that names an error comes from its section 7 (the 2023-2025
Chief Reader Reports and the 2026 scoring guidelines).

## Before you write a topic

1. Find the topic in `docs/apmacro-dependency-map.json`: its id, CED number, big idea, focus skills and the
   concepts it owns. Read its entry in `docs/apmacro-ced-map.json` (objectives, knowledge) and write it in your
   own words. For 3.7-6.6 the knowledge comes from scoring guidelines and reader reports, not the CED text
   (needs-author `ced-text`): stay inside it, and log anything you are unsure is in scope.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. Add a concept to the map (with
   `taughtIn` and `dependsOn`) for every term your topic teaches that the map lacks.
3. Write `macroeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-apmacro-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apmacro-map.mjs --check`. The placeholder fixture `scripts/test/fixtures/apmacro-data/`
   shows every item type working (numeric with `from` and `mistakes`, graph items of each task, a specific
   builder, the three set kinds, a long and a short FRQ with graph parts); it is placeholder content, never a
   model for wording.

## Originality, sources and the trademark

- **No released questions.** Never reproduce, adapt or closely paraphrase released College Board questions
  (multiple choice or free response, any year, either set), AP Classroom items, the CED's text or any textbook.
  Use the CED, scoring guidelines and Chief Reader Reports for scope and for the errors to target, in your own
  words (decision 4). A scenario that follows the same economic logic as a released FRQ is fine; the same
  country names, numbers, part structure and wording are not.
- **Invented data are labeled.** Every table or chart is `"invented": true` or carries a `source` naming the
  publisher and year ("Bureau of Labor Statistics (2025)") with the numbers as published. Countries in scenarios
  are invented ("Country X", "Arland") unless the point is a real, cited fact.
- **Neutral on politics.** Policy is taught as cause and effect, never as good or bad. No parties, no named
  politicians, no "should" about real policy debates (the content check refuses party names).
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Macroeconomics exam").
  Never "AP" alone, plural, possessive, "AP Macro", or in a URL, id, file name or meta description.

## Spelling and style

- American spelling everywhere (labor, center, defense).
- No em dashes in anything a student reads; use a colon, a comma or two sentences.
- Short sentences, active voice, "you". A concrete situation first (a gas price spike, a bank deciding how much
  to lend), then the model, then its name.

## Graph labeling rules (the graph point is lost more than any other)

Readers score every graph point by point: label every axis and every curve, mark the points the question names,
and show the direction of a change (framework.md section 5, "FRQ scoring rules"). In every graph you draw,
describe or ask for:

- **Axes, exactly.** Product market: Price and Quantity. AD-AS: Price level (PL) and Real GDP (Y, or real
  output). Money market: Nominal interest rate (i) and Quantity of money. Reserve market: Policy rate (the
  federal funds rate) and Quantity of reserves. Loanable funds: Real interest rate (r) and Quantity of loanable
  funds. Phillips curves: Inflation rate and Unemployment rate. PPC: the two goods by name. Never "price" on an
  AD-AS graph, never "real" on the money market, never "nominal" on loanable funds.
- **Curves by name, with subscripts for shifts.** D1 and D2, AD1 and AD2, SRAS1 and SRAS2; LRAS vertical at full
  employment (YF); MS vertical; LRPC vertical at the natural rate of unemployment.
- **Points the question asks for.** PL1, Y1, i1, the expected inflation rate where SRPC meets LRPC; dashed lines
  to both axes.
- **A shift shows its direction** with an arrow, and the new equilibrium is labeled and compared with the old on
  each axis ("the price level rises from PL1 to PL2").
- **A shift is not a movement along a curve.** A change in a variable on an axis moves along the curve; anything
  else shifts it (the `shifts-movements` topic). Name the shifter.
- **The foreign exchange axis ratio.** In the market for currency X, the vertical axis is the price of X in units
  of the other currency per unit of X ("dollars per euro" in the market for euros). Writing the ratio upside down
  loses the graph point. Demand for a currency comes from foreigners buying its goods and assets; supply from its
  own holders buying foreign ones. A change in one currency's market shows as the mirror change in the other's.
- **Graph items must be gradable by code.** Every `graph` item or FRQ graph part names its kind, the curve or
  curves that move and which way, the cause (`because`), and the outcome on both axes when the kind has an
  equilibrium. If an outcome is indeterminate (both curves shift), leave that axis out of `outcome` and ask about
  it in words. The content check runs the grader on your key; a key it cannot score right fails.

## The ample reserves framework (decision 7)

- Teach **ample reserves** as how the Federal Reserve sets rates now: it sets administered rates (interest on
  reserve balances, the overnight reverse repurchase rate) to keep the policy rate in its target range; the
  reserve market graph has reserve demand flat in the ample range and reserve supply vertical, crossing in the
  flat part. To raise the policy rate it raises the administered rates (the flat part shifts up); a change in
  reserve supply in the ample range leaves the rate alone.
- Teach **limited reserves** alongside, always labeled as such: open market operations shift the money supply on
  the money market graph, the discount rate, the reserve requirement, and the money multiplier (1 / required
  reserve ratio). The exam tests both (2026 still scored "sell bonds" with a money market graph).
- Every question says which framework it sets, and its key uses that framework's tool and graph. The most common
  reader-report miss is a limited-reserves tool (buy or sell bonds) or a money market graph in an ample-reserves
  question.

## Causal chains with every link

"Explain" earns the point only with the causal link, not the conclusion (framework.md section 5). Every
explanation in a lesson, a key, an FRQ sample or a "Make it specific" answer names each link in order:

- Monetary: the tool, the policy rate (or the money supply), other interest rates, interest-sensitive spending
  (investment, consumption of durables), AD, then real output, the price level and unemployment.
- Fiscal: spending or taxes, disposable income and consumption (for taxes), AD (with the multiplier), then
  output, the price level and unemployment; with a deficit, government borrowing, the demand for loanable funds,
  the real interest rate, private investment (crowding out), the capital stock and long-run growth.
- Open economy: relative real interest rates, financial capital flows (the capital and financial account), the
  demand for the currency, appreciation, net exports, AD.
- Long-run self-adjustment: in a recessionary gap high unemployment pushes nominal wages and input prices down,
  so SRAS shifts right, until output returns to full employment; in an inflationary gap the reverse. **Never AD,
  never automatic stabilizers** (the content check refuses that sentence outside a `.mac-slip` box).

## Multiplier math: divide the gap, direction first

- The routine, every time: find the MPC (or MPS), compute the multiplier, decide the direction (raise or cut
  spending, cut or raise taxes), then **divide the gap by the multiplier**. Multiplying the gap is the most
  common slip (27-40% earn the point); name it in the mistake feedback.
- Spending multiplier 1 / MPS; tax multiplier -MPC / MPS (one smaller in size, negative); balanced-budget
  multiplier 1 (needs-author `balanced-budget`). Money multiplier 1 / required reserve ratio, applied to excess
  reserves (limited reserves), and a cash deposit does not change the money supply at first.
- Every number is an `ApMacroCalc` recipe (`gapChange`, `spendingMultiplier`, `taxMultiplier`,
  `maxMoneyChange` ...); a typed key that disagrees fails the check. Keep arithmetic four-function friendly: MPC
  0.5, 0.75, 0.8, 0.9; reserve ratios 0.1, 0.2, 0.25.

## Content traps to target (distractors and mistake feedback)

- Natural rate = frictional + structural; actual = natural + cyclical. Discouraged workers and retirees are out
  of the labor force.
- Real GDP = nominal / deflator x 100 (not times); a deflator is an index, not a percent or dollars.
- Unexpected inflation helps fixed-rate borrowers and hurts lenders.
- Current account + capital and financial account = 0; a budget deficit is not a trade deficit.
- Higher domestic income raises imports, so net exports fall.
- The PPI calculation is beyond the course (CED 2.4); do not ask for it.
- Demand-pull (AD right) vs cost-push (SRAS left); disinflation is not deflation.

## Writing answers specific enough to score

The "Make it specific" prompts and every FRQ sample state explicitly what is asked ("identify" needs a clear
statement), show work for "calculate" (the formula or steps), and link causes for "explain". Builders (`specific`
slots) match the chain links: `policy`, `rate`, `spending`, `curve`, `direction`, `output`, `price` and the other
slot names in `mac-grade.js`.

## Notation

Math is TeX between dollar signs, rendered at build time; in JSON every backslash is doubled. Keep it light:
`C + I + G + (X - M)`, `\frac{1}{1 - \text{MPC}}`, `\%`, subscripts for curves in text (AD$_2$ only where a
formula needs it; in prose write AD2).

## Questions

- Every item carries `unit`, `topic`, `practice` (a skill id such as `"2.B"`; 4.A-4.C only on `graph` items) and
  its type.
- **Four options** for single-answer items (needs-author `mcq-options`), similar lengths (the key is the longest
  at most 40% of the time), each option's explanation naming the error by content, never by letter.
- At least 60% apply/analyze. At least 40% of a topic's items in stimulus sets of 3-5 items: `data` (a table or
  chart), `graph` (an economics graph as given, `stimulus.graph`), `text` (a scenario).
- `numeric` items for every calculation; `graph` items wherever the topic has a graph (shift, equilibrium, label,
  point); `specific` items for causal chains.
- No `calc` flag (a four-function calculator is allowed throughout), no `setup` items.

## Level and voice

- From middle-school math and everyday experience, for a student whose class moved too fast.
- Every lesson has a figure: an economics graph drawn from its spec, a data chart from its numbers, or a clean
  diagram (the circular flow, a bank balance sheet).
- A worked example, in `<div class="worked">`, before any new calculation or graph, written out in full.

## Contested or uncertain points

Add them to `docs/apmacro-needs-author.md` instead of guessing. Every unit gets an independent accuracy check
before it is published, with every numeric key recomputed by code and every graph key scored by the grader.
