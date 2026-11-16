# AP Macroeconomics tools in the standard frame (F5b, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. Same kit change in AP Micro (`apmicro.md`) and AP Human Geography (`aphug.md`).
Nothing a tool did before was removed; generated pages are unchanged (`node scripts/build-apmacro.mjs --check` passes).

## The kit (`macroeconomics/assets/tools/mac-tools.js`), so every tool gets it
| Feature | Where now |
|---|---|
| Title, course, back, menu (Start over, Copy link, About, Report, Ask the tutor) | std bar: name, one line (`LEDE`), Explore / Test yourself, Ask the tutor, Share, "?", menu |
| Explore / Test yourself switch (`modes`) | bar (second row on a phone) |
| "Start here" cue | the task's one line on what to do (task kicker Explore, title = the tool's question, `TASK`); follows the cue if the tool rewrites it (MutationObserver), or the view (`sp.todo`) |
| Setup row (opens More options) | menu item named for it ("Shocks and graph marks", ...); More options stays in "?" |
| Numbers, tables, More options, About | "?" (Help and reference, or the tool's own name: Numbers & formulas, Numbers & rules) |
| Drill: kind of problem (in More options) | the stage picker in Test yourself ("Any kind" + kinds); the select stays in the page, hidden |
| Drill step hint (shown under every step) | hint ladder: Hint (instant), then Show the answer after one wrong Check (as before) |
| Drill "Show the answer" button in the feedback | the ladder's answer button (same gate: one real try) |
| Drill end: result, New problem, Keep going, report, worked solution | finished card: "n of m steps right the first time", takeaway (the worked solution's last line), New problem, Worked solution, See your answers (gives the panel back: steps, result, Keep going with glossary, report), Read the lesson |
| Worked solution sheet opening by itself at the end | off (`autoSolution: false`): the card links it, and on a phone it covered the card |
| Locked Premium tool | the shared lock screen now gets the standard bar and the one line (`LevlStudio.stdKit`, small shared change in `tool-studio.js` adopt) |
New helpers: `isStd`, `addMenu`, `selectPicker`, `chipPicker` (a tool's own select or chips become the stage's picker; the control stays hidden and is driven, so handlers, state and links are unchanged), `stepLadder`, `doneCard`; `studioPane` returns `picker`, `chips`, `foot`, `task`, `todo`.

## Per tool
- **AD-AS lab**: shock select -> stage picker (groups kept); Start over -> stage foot; Run the long run stays the dock's action. Graph handles, Phillips tab, stack and marks settings (menu, "?") unchanged.
- **Forex lab**: "What changes?" -> stage picker (rebuilt when the currency pair changes); Start over -> stage foot; it was the phone's pinned control, now the picker is. Currencies and rates: menu and "?".
- **Graph studio**: Graph select -> stage picker (Explore), and in Test yourself too (kind stays in More options). "What happens" and Show me stay in the panel (the task to try). Its own drill got the ladder, task line, finished card (rubric points).
- **Indicators lab**: four views keep their segmented switch (allowed, 2 to 4); the task line follows the view (new lines for Prices, Real, Jobs).
- **Multiplier lab**: three views keep the switch; the task line follows the view; "The gap" settings in menu and "?".
- **Policy chain**: Chain select -> stage picker; version, direction, Back / Next link, Write it out unchanged.
- **PPC and trade**: two views keep the switch; task line follows the view (the cue only fit the first view: a bug in the std frame, fixed).
- **Reserves lab**: Start over was only in More options -> stage foot. Framework, tools and actions unchanged.

## New copy (for an accuracy check)
Bar lines and task questions: `LEDE` and `TASK` in mac-tools.js. View lines: indicators ("Move the year and compare the two baskets.", "Move the year: the same goods at two sets of prices.", "Pick what happens and watch people move."), multiplier ("Slide the change until the gap closes.", "Pick what happens and watch each bank lend."). Finished-card takeaways reuse each problem's authored last solution line.

## Judgment and questions
- Explore views (indicators, multiplier, ppc) stay a segmented control rather than the picker: each view has its own controls, and 2 to 4 short choices may stay segmented.
- No finished card in Explore (policy chain end, AD-AS long run): they are explorations, not problems.
- Question: the "Write it out" row in policy chain is a long label that ends in an ellipsis on a phone (unchanged). Shorten its value?

## Accuracy check (F6b, 2026-11-16)
Checked `LEDE`, `TASK`, the view lines and every drill type's finished card takeaway (generated for each context and
type) against the tools and `docs/apmacro-authoring-guide.md` (causal chains with every link, ample reserves).
- Correct as written: all eight `LEDE` and `TASK` lines; indicators view lines for Real and Jobs; both multiplier lines.
- Changed: indicators Prices view "Move the year and compare the two baskets." to "Move the year and compare what the
  same basket costs then and in the base year." (the CPI prices one fixed basket in two years; "two baskets" is the
  misconception the view teaches against).
- Fixed (content bug seen in a takeaway): AD-AS "a inflationary gap" to "an inflationary gap" (`math/adas-lab.js`,
  two lines).
- Takeaways: the solution's last line reads well alone for adas, forex, policy chain, ppc (point, oc, input, terms),
  reserves (tool, shift), indicators (gdp-calc, unemp, cpi, real), multiplier (multiplier, gap). New own lines
  (`TAKE` in mac-tools.js) where the last line read oddly alone:
  - indicators gdp-count (was the last item of a list): "GDP counts the market value of new final goods and services
    made inside the country this year."
  - indicators utype (same): "Frictional is searching between jobs, structural is a mismatch of skills or place, and
    cyclical comes from a downturn."
  - multiplier total (began "This is the largest change"): "The multiplier gives the largest possible change: rising
    prices and other leakages make the real effect smaller."
  - multiplier money (began "This is the limited-reserves model"): "The money multiplier belongs to the
    limited-reserves model; with ample reserves the Fed sets its rate with administered rates instead."
  - reserves multiplier (began "It is a maximum"): "In the limited-reserves model the money multiplier is a maximum:
    excess reserves banks keep and cash people hold make the real change smaller."
  - ppc output (a caveat about absolute advantage): "Comparative advantage, the lower opportunity cost, decides who
    should make what; absolute advantage does not."
  - graph studio: a last line that starts with This, That or It ("That is economic growth...") gets the shift line in
    front of it ("With better technology, the production possibilities curve shifts out. That is economic growth...").
  - Any takeaway starting "So" drops it.
