# AP Macroeconomics: second pass, simple and clear (2026-11-10)

Standard: `docs/tool-review/SIMPLIFY.md`. Every tool opened at 1280x800 and 390x844 (Explore, every view, and Test
yourself on the changed tools). Shots: `/home/claude/shots/pass2/macro/` (`<tool>_land_d/_land_p.png` after,
`<tool>_before_d.png` for changed tools, plus before/after pairs for the busiest scenes: indicators Jobs,
multiplier Money, forex after a change).

Counts are measured on the stage by script (labels = visible text on the picture, graph axis words and ticks
included; numbers = text with a value; controls = control groups and lone buttons outside the stage; words =
panel text outside buttons). A chip set counts once in my reading even where the script counts each chip.

| Tool | The idea | Best way to show it | Verdict | Counts before -> after (desktop) | What changed | Behind a tap now |
|---|---|---|---|---|---|---|
| AD-AS lab | A shock moves AD or SRAS, opens a gap, wages bring it back to LRAS; the Phillips point moves with it | The AD-AS graph, one shock picked, the Phillips curve read beside it | LEAVE | labels 16 (all graph labels), 0 live numbers, 3 controls + More, 19 words | Nothing | (already: stacking shocks in More) |
| Forex lab | One currency's demand or supply shifts; it appreciates, the other depreciates, and trade and capital respond | The market and its mirror side by side; what the new rate does appears under them once something changes | SIMPLIFY | landing labels 28 -> 20, panels 3 -> 2; after a change 47 -> 44 labels, the "Who trades" line (a repeat of the explanation) gone | Trade picture hidden until a change on a wide stage; Who trades removed from the stage; country boxes lose "pays in ..." and the repeated rates | Rates are on the graph axes and in Details |
| Graph studio | Draw, label and shift the nine exam graphs | One large graph, pick what happens, Show me | LEAVE | labels 6, 0 numbers, one graph picker + select + Show me + Start over, 36 words | Nothing | (already: practice in More) |
| Indicators lab | What counts in GDP; CPI is a fixed basket's cost; real vs nominal; who is unemployed and who is out of the labor force | GDP: tokens dropping into C, I, G, X. Prices: the two receipts and their ratio. Real: the same goods at two prices. Jobs: 100 people in three places with the labor force bracket | SIMPLIFY | Jobs 19 labels / 9 numbers / 4 rate cards -> 6 / 4 / 1 card; Prices 66 labels -> 36 (charts closed); GDP 7 column totals -> 2 | Jobs: only the three places and the bracket labeled; a kind is named when an event moves it; one rate card, another appears (was -> now) when the last event changed it; four events shown. GDP: totals for GDP and the column just hit. Prices: charts closed. Real: no repeated totals on bars or chart | Tap the people: every kind named. More events: the other four. See every year: CPI and inflation charts. Details: every count and total |
| Multiplier lab | Each round of spending is the last times the MPC, the rest leaks to saving; banks lend excess reserves that come back as deposits | The cascade of rounds pouring into the Saved tank; banks in a row with loans arrowing on | SIMPLIFY | Multiplier 30 labels / 16 numbers -> 16 / 5; Close a gap 19 / 6 -> 14 / 5 (4 cards + header + bar -> 2 numbers); Money 46 / 23 -> 24 / 7 | Equation strip removed (it repeated the explanation line); numbers on the first round and the tank only; "Round" written on rows 1-2, digits after; Money labels on banks 1-2 only; T-account moved; gap meter cut to two numbers | Numbers & formulas: every round, the formulas, Bank 1's balance sheet |
| Policy chain | A policy moves one market, which moves the next, link by link, to output and prices | The current market large, with a small map of the whole chain above it | CHANGE (layout) | 26 labels in a row of small graphs and "?" boxes -> 21, one readable graph | Desktop now uses the phone's design: map strip of thumbnails on top, the current station large; a link with no graph is a short centered card | The expand button shows every station side by side |
| PPC and trade | Points on, inside, outside the PPC; specializing and trading puts both countries outside their PPCs | The PPC, a slider for robots, events that shift it; Trade view with each country on its PPC | LEAVE | labels 7, 2-3 numbers in the pills under the graph, slider + events + tabs, 20 words | Nothing | (already: Numbers & rules) |
| Reserves lab | Ample vs limited reserves: which Fed tool moves the policy rate, and the chain to AD | The reserve market first; the money market, AD-AS and the chain light up when an action moves them | SIMPLIFY | landing labels at full strength 44 -> 9 (the other panels dimmed) | Before any action the money market, AD-AS and the chain are dimmed on a wide stage; they light up with the action | Nothing hidden, only dimmed |

Totals: LEAVE 3 (AD-AS lab, Graph studio, PPC and trade), SIMPLIFY 4 (Forex, Indicators, Multiplier, Reserves),
CHANGE 1 (Policy chain, a layout change only).

## Graphics quality
- Graphs are the shared ApMacroGraph renderer everywhere: consistent, correctly labeled, dark mode checked.
- Indicators people, receipts, GDP tokens and the multiplier cascade and banks (first pass) are real pictures of
  the idea and stay; this pass only took text and numbers off them.
- Policy chain: the old row put six graphs at about 150 px each with "?" boxes; at that size no graph was readable.
  One large graph with thumbnails above fixes it without losing the "whole chain" view (map and expand).

## Chosen not to simplify, and why
- Forex: the two graphs stay side by side (a market and its mirror are read together), and their labels stay
  (curves, XR, Q, E1/E2 are what the exam asks for). The trade panel keeps its arrows and AD line: it is the "so what".
- AD-AS lab: the Phillips curve stays beside AD-AS; its point moves with the shock (one cause, two pictures).
- Multiplier, Money: the money market graph stays beside the new-money total (more money, MS right, rate down).
- Reserves lab: the three graphs stay on one screen (the chain from tool to AD is the lesson); they are dimmed,
  not hidden, until the action.
- Graph studio and PPC show many choice chips, but each is one picker; hiding them would add a step to the one
  thing the student does.
- Multiplier keeps the round 1 split ($16 spent, $4 saved) and the tank total: three numbers, but the split is
  the MPC itself.

## Not done
- Indicators Real: the chart no longer labels the current year's points (the formula under the bars has them);
  the year is not marked on the chart.
- Test yourself figures in the multiplier lab still use the older bar charts (noted in the first pass).
