# AP Macroeconomics tool fixes: build report (task "macro", 2026-11-10)

Branch `claude/tv-macro`, one commit per tool. Screenshots (before, after, phone):
`/home/claude/shots/build/macroeconomics/`. Not touched: AD-AS lab, Reserves lab (LEAVE), `microeconomics/`, shared files.

## Graph studio (bug)
- Foreign exchange, Show me: the mirror market now gets its own E2, XR2 and Q2 (`math/graph-studio.js` `linked()`
  sets `state.eq` when a curve shifts). Test added in `apmacro-tool-graph-studio.test.mjs`.
- Left: the first market still has no title on the stage (pills sit there); the AD-AS + Phillips and forex pairs
  are still drawn at the smaller two-up size.

## Forex lab (fix)
- Under the graphs: "Who trades" (the shock's actors and why, then which curve moves) and the two countries with
  their trade drawn between them: exports and imports as crates (an extra one lit, a lost one dashed), financial
  capital as notes toward the higher real return (policy and interest-rate changes only), and in each country's
  box its currency's new value, net exports (AD left/right) and capital inflow/outflow. Wide stage: the chip strip
  is replaced by the country boxes. Phone: a third tab, Trade (dot when something changed).
- Price-level changes now say the other curve pushes the same way (`also` on `prices-h` and `prices-f`), in the
  stage and in the explanation. New model helper `capital(id)`; tests added.
- Accuracy: standard AP relations only (appreciation lowers net exports, capital follows the higher real rate).

## PPC and trade (fix, Trade view)
- Each country on its own PPC (one scale). Off: "Makes and eats" point. On: production slides to the corner
  (animated; reduced motion jumps), the trade line runs from the corner with slope = the terms of trade, the
  exchange arrow runs from what it makes to what it eats, a green wedge when the trade line is outside the PPC and
  a red one when inside, "on its PPC: no gain" at the boundary. Between the countries: "X ships q, Y pays q x t".
  Phone: countries stacked, arrows up and down, the cost table left to Numbers & rules.
- Numbers unchanged (`PT.trade`); checked Wheat 0.75 (Avalon eats 22 wheat, 13.5 cloth; Brio 18, 16.5), Cars 0.5
  (Corvia gains nothing), Tea 1.05 (Fenna loses). Small fix: slider label "Price of 1 car", not "1 cars".

## Policy chain (fix)
- The stage is the whole chain as a row of stations: one graph per market touched (consecutive links on the same
  market share it), links with no graph as word cards with arrows between. Every station reached stays drawn; the
  current one is wider and outlined; ones not reached are "?". Phone: the chain as a small map on top, the current
  station large under it. Test yourself uses the same stage.
- Not re-flagged: the ample-reserves money market point already in `docs/apmacro-needs-author.md`.

## Multiplier lab (redesign)
- Multiplier: money passing hand to hand. Each round of income splits into spent (falls straight down to become
  the next round) and saved (leaks right into a Saved tank that ends at the injection). A tax change starts with a
  dashed "disposable income, not spending yet" row whose saved part leaks before any spending. Balanced budget:
  the two cascades side by side (stacked on a phone). Rows appear one by one; reduced motion shows them at once.
- Money: banks in a row, each deposit a vault split into the reserve kept (the ratio) and the loan, the loan
  arrowing to the next bank's deposit; a Fed purchase from a bank starts as new reserves; a sale runs backward
  (dashed, less lending). Running total of new money against the most it can reach. T-account and money market
  kept.
- Close a gap: AD starts 4 steps out, so the gap is a fifth of the axis; a band under the axis shows the gap and
  the part closed (green when closed, warm when too far or the wrong way); YF marked.
- Checked: $20B, MPC 0.8: saving 4 + 3.2 + ... = 20, total 100; tax cut 20 at 0.75: 15 spent, 5 saved first,
  total 60; buy bonds from a bank $1,000 at 10%: 1,000, 900, 810, ... up to 10,000.
- Left: Test yourself figures still use the old bar charts (they work; could reuse the new pictures).

## Indicators lab (redesign)
- Jobs: 100 people standing in Employed | Unemployed (frictional, structural, cyclical) | Not in the labor force
  (discouraged, retired, students, others), sized blocks; a "Labor force" bracket over the first two (with
  "unemployment rate U / LF" when there is room) that stretches as people move. Each person keeps its figure, so
  an event is seen as people walking (0.9 s; none with reduced motion). Phone: the events ride in the sticky band
  as one scrolling row (the listener now sits on the events, which move into the band).
- GDP: each transaction drops in as a token sized by its dollars into C, I, G or X; an import lands in C or I
  (warm) with its dashed twin under -M; Not counted is a bin with each item's reason; GDP the sum; empty slots and
  a hint on landing.
- Prices: the basket as two receipts (base-year and this year's prices, same quantities, price rises marked), the
  CPI chips as the ratio of the totals; the CPI and inflation charts kept, side by side.
- Real: the year's goods at its own prices (real part + hatched price part) and at base-year prices, above the
  lines.
- Numbers unchanged (model untouched).

## Checks
`node scripts/build-apmacro.mjs --check`, `node scripts/build-apmicro.mjs --check`, `check-apmacro-content`,
`check-apmacro-map`, `node --test scripts/test/apmacro*` (155 pass), `node scripts/check-site.mjs`: all clean.
