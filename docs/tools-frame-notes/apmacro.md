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
