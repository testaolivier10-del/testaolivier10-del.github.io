# AP Macroeconomics: tool purpose review (2026-11-10)

Every tool opened in Chromium at 1280x800 and 390x844 (Premium unlocked), every view, chip, select option and
shock clicked, sliders moved, Show me and Run the long run played, and Test yourself opened. Screenshots:
`/home/claude/shots/review/macroeconomics/` (one folder per tool; `t_*.png` are tiled sheets).

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| AD-AS lab | A shock moves AD or SRAS, opens a gap, and wages bring the economy back to LRAS; the Phillips point moves with it | LEAVE | The graph is the concept and it moves well (shift, E1 to E2, gap marked, long run animates, Phillips tied). Small: the Test yourself figure contradicts its problem (see notes). |
| Forex lab | One currency's demand or supply shifts; it appreciates while the other depreciates, and that changes net exports and capital flows | FIX | The two mirror graphs work. Missing the "why" and the "so what": the strip only says which currency appreciates; the net exports and capital flow line the header promises is not on the stage. |
| Graph studio | Draw, label and shift the nine exam graphs | LEAVE | Graphs are the concept and are large and clear. One bug: Foreign exchange, Show me shifts the mirror market's curve but leaves its equilibrium where it was. |
| Indicators lab | What counts in GDP; CPI is the cost of a fixed basket; real versus nominal; who is unemployed and who is out of the labor force | REDESIGN | Jobs is 100 dots in a box; GDP is bars that grow; Prices and Real are bare line and bar charts. None of the pictures is the thing (a transaction, a basket, people in and out of the labor force). |
| Multiplier lab | Each round of spending is the last round times the MPC, the rest leaks to saving; banks lend excess reserves and loans come back as deposits | REDESIGN | Multiplier and Money views are bars that shrink beside a formula: the leak to saving and the deposit-loan-deposit loop are never drawn. Close a gap: the gap is drawn a few pixels wide, so "50% closed" is invisible. |
| Policy chain | A policy moves one market, which moves the next, link by link, to output and prices | FIX | Cards plus the current link's graph is right. But each graph disappears when the next link comes, and links with no graph leave half the stage empty, so the whole chain is never seen at once. |
| PPC and trade | Points on, inside, outside the PPC and its shifts; specializing by comparative advantage and trading at terms between the two opportunity costs puts both countries outside their PPCs | FIX | PPC view: leave. Trade view: specialization and the trade itself are not drawn; only two tiny "after" dots appear. |
| Reserves lab | Ample vs limited reserves: which Fed tool moves the policy rate, and the chain to AD | LEAVE | Three linked graphs plus a lit chain; the "does nothing in this framework" slips are clear. Phone: chain chips are cryptic abbreviations. |

## Notes

### AD-AS lab (leave, small repairs)
- Test yourself ("Reading a gap": real GDP $1,450 billion vs full employment $1,500 billion): the stage graph shows
  AD, SRAS and LRAS meeting at one point labeled Y, that is, no gap. The figure should show the economy left of LRAS
  (or show no graph until a graph step).
- The graphs sit in the top half of the stage; the lower half is empty on desktop. Could be larger.
- Accuracy checked: AD and SRAS shocks, long-run wage adjustment, Phillips moves (along SRPC for AD, SRPC shifts for
  SRAS and for the long run) are all correct.

### Forex lab (fix)
- After every change the stage says only "Euro depreciates 1.10 to 0.995 / Dollar appreciates". Add one line that
  names who is trading and why (for "The Federal Reserve raises rates": "Europeans sell euros to buy US bonds:
  supply of euros shifts right") and the consequence for each country (US net exports fall, euro-area net exports
  rise; capital flows into the US). This is the part students lose points on and the header says it should be there.
- "Prices rise faster in the United States" moves only the supply of euros (Europeans buy fewer US goods). Not
  wrong, but Americans buying more European goods (demand for euros right) is the more common exam answer; the
  caption could say both push the same way.
- Half the stage is empty below the graphs on desktop.

### Graph studio (leave, one bug)
- Foreign exchange, any scenario, Show me: the mirror market (nells) draws S1 and S2 but the dashed lines and the
  point stay at the old equilibrium; no XR2, no E2, although the caption says "The nell depreciates". The first
  market (garvs) has no title on the stage (the pills take its place). Screenshot `gs2/g3.png`.
- AD-AS with Phillips and Foreign exchange are drawn in the top half of the stage at a smaller size than the
  single graphs.

### Indicators lab (redesign)
- Jobs: 100 dots in a 10x10 grid in reading order, colored by status. The labor force is not a place on the
  picture, so "discouraged workers leave the labor force and the rate falls" cannot be seen; a dot just changes
  color. Should show: people (figures) standing in three labeled areas, Employed | Unemployed (looking; frictional,
  structural, cyclical sub-groups) | Not in the labor force (retired, students, discouraged), with a bracket over
  the first two labeled "labor force" and the rate as unemployed over that bracket. Each event walks people from one
  area to another; the bracket stretches or shrinks. The numbers are right (checked every event).
- GDP: on landing the stage is an empty row of $0 bars. Each transaction should drop in as a labeled token
  ("Laptops from China $15") onto its column, so C, I, G, X are stacks of the transactions that made them; an
  import lands in C and the same token appears under -M; a transfer or used good falls into "Not counted" with its
  reason. Then the column is the idea, not a bar.
- Prices: CPI line and inflation bars only. The basket is never shown. Show the basket (its items with this year's
  and the base year's prices, the two totals) and the CPI as the ratio of the two totals; the charts can stay below.
- Real: two lines. Acceptable as a graph, but it would teach more as "same goods, this year's prices vs base-year
  prices" beside the lines.
- Phone: in Jobs the event chips sit below the picture, so the dots are off screen when you tap an event. With
  Numbers & formulas open on desktop, the caption at the top of the panel is cut off.

### Multiplier lab (redesign two views, fix one)
- Multiplier: rounds 1 to 8 as falling bars and a Total bar. Nothing shows why each round is smaller. Should show
  each round as the income someone receives, split into a spent part (passed on, becomes the next round) and a saved
  part (leaks out), with the saved parts piling into a "saved" column that ends equal to the original change (the
  point of the multiplier: spending stops when saving has absorbed the injection). Changing the MPC visibly changes
  the split in every round. For a tax change, round 1 should show the household saving part of the tax cut before
  any spending, which is why the tax multiplier is smaller.
- Money: bars labeled Bank 1 to Bank 8 (tiny next to the $10,000 axis), Bank 1's T-account, and a small money
  market. The idea is the loop: a deposit, the required part kept, the excess lent, the loan spent and deposited at
  the next bank. Should show the banks in a row with the money moving: each bank's deposit, its reserve kept (a
  slice) and its loan arrow to the next bank's deposit, the reserve ratio chips changing the slice. The running
  total of new deposits can stay. The cash deposit and bond cases are worked correctly (checked: $9,000 vs $10,000).
- Close a gap: the recessionary gap on the AD-AS graph is a few pixels (Y1 just left of LRAS), so moving the slider
  from 0% to 50% closed barely moves anything; the meter beside it carries the whole idea. Draw the gap wide, with
  the gap labeled on the axis and the multiplied change drawn as the AD shift. Numbers correct ($16 billion x 5,
  -$20 billion x -4).

### Policy chain (fix)
- Fiscal link 1, Open economy links 1 and 2, Crowding out link 1: one text card and an empty right half.
  Monetary links 4 to 5 and later links keep the previous graph with no mark of which link it belongs to.
- Should show the chain as a row (or column) of small graphs, one per market touched (reserve market, money
  market, AD-AS; loanable funds; foreign exchange), each lighting and shifting when its link arrives and staying
  visible after, so at the last link the student sees the whole chain of shifts at once. Links with no graph
  (investment rises, net exports fall) can be arrows between the graphs.
- Phone: after Next link the page scroll cuts off the top of the graph.
- Accuracy: Monetary, ample reserves, link 3 shows MS shifting in the money market after an IORB cut. This is the
  open point already in `docs/apmacro-needs-author.md` ("Money market under ample reserves"); not re-flagged.

### PPC and trade (fix the Trade view)
- With Specialize and trade On, the only change is "Brio after" and "Avalon after" points with a short dashed line
  from each pre-trade point. Neither country's production moving to its corner (specialization) is drawn, nor what
  is shipped. Should show: each production point slides to its corner, the trade drawn as a line from the corner
  with slope equal to the terms of trade (the consumption possibilities line), the goods exchanged labeled ("Avalon
  ships 20 wheat, gets 15 cloth"), and the consumption point on that line outside the PPC. Moving the price slider
  outside 0.5 to 1 should visibly put one country's line inside its PPC.
- Numbers checked for Tea and Rice at 0.65 (Estra 18 tea and 3.9 rice, Fenna 6 tea and 6.1 rice): correct.

### Reserves lab (leave)
- Phone: the chain under the graph shrinks to chips "PR, i, I, AD, Y, PL" with arrows; spell them or add a legend.
  The tool chip row is cut off at the right edge (Discount rate hidden until scrolled).
- Same ample-reserves money market point as the policy chain (already in needs-author).
