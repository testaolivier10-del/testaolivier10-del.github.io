# AP Microeconomics: second pass, simple and clear (builder "micro", 2026-11-10)

Standard: `docs/tool-review/SIMPLIFY.md`. Every tool opened at 1280x800 and 390x844, Explore landing and the
main action (hire, fill, drag, tap a cell, Both, public goods, each alone, monopsony, a market change).
Screenshots after the work: `/home/claude/shots/pass2/microeconomics/<tool>_land_d.png` and `_land_p.png`;
`_before_d.png` for each changed tool. Counts are on the Explore opening screen (desktop): labels = words on
the picture excluding axis titles and tick values; numbers = live readouts on the stage; controls = visible
dock controls (a chip group or a segmented switch is one; Details counted); words = outside buttons and the title.
No function, data key, saved-progress key or drill was removed; `macroeconomics/` and shared files untouched.

| Tool | The idea | Best way to show it | Verdict | Before (labels / numbers / controls / words) | After | What changed | Moved behind a tap |
|---|---|---|---|---|---|---|---|
| Cost lab | Each worker's row lands on the cost curves; MC crosses AVC and ATC at their lowest points; a fixed cost moves only ATC and AFC | The cost graph with the table beside it; one action, Hire, rows landing as dots | SIMPLIFY | 8 (4 curves, P_SD, P_BE, 2 rings) + 5-item legend / 2 / 6 (hire, fill, 2 sliders, Curves, Details) / ~40, and 45 after a hire | 4 / 0 / 4 (hire, fill, Curves, Details) / ~30 | Legend removed (curves are named on the graph); P_SD and P_BE appear when the table reaches them; the two cost sliders replace the hire buttons once every row is in ("now change a cost"); caption one short line per row; phone row card shows the four curve values | AVC and ATC arithmetic: Explanation. MP, TVC, TC, TFC on the phone: the whole table in Details |
| Elasticity lab | Elastic and inelastic halves of one demand curve and the total revenue test; income and cross-price elasticity name the good | Demand over the TR hill on one quantity axis, A and B dropped straight down; drag A | SIMPLIFY | 13 (Elastic, |Ed|>1, Inelastic, |Ed|<1, Unit elastic, A, B x2, D, TR, Largest TR $500, two "P down" lines) / 2 chips, repeated in the caption / 4 / ~35 | 8 / 2 / 4 (3 in Income and Cross-price: the Method row hides) / ~20 | Sublabels and "P down, TR up/down" removed (tints and Explanation carry them); "Largest TR" is a hover title on the top of the hill; caption says the verdict, the chips carry the numbers | |Ed| ranges and the TR test wording: Explanation |
| Externality lab | Market vs efficient quantity and the deadweight loss; a tax equal to the external cost removes it; public goods are summed benefits and free riders | The exam's externality graph with the loss shaded, one slider (the tax); public goods as stacked MB steps against MC under a drawn street | SIMPLIFY | 8 / 4 (DWL pill, Market, Efficient, DWL) / 5 (view, 4 cases, 2 sliders, Details) / ~55. Public goods: 15 block values + 5 sums + 2 readouts | 8 / 1 / 4 / ~35. Public goods: 5 sums, no readouts | DWL shown once, under the graph; caption gives market vs efficient without the loss; graph-scale sentence off the stage; size slider to Details; public goods: no value inside every block, no readouts repeating "Efficient: 2", definitions in Explanation | Size of the externality slider and the graph scale: Details. Each block's value: hover title and the Details table |
| Factor lab | Hire until MRP = wage (or MFC); a monopsony hires fewer and pays less | Hiring table linked to the market and firm graphs (the wage carried across) | SIMPLIFY (light) | 14 / 1 pill + note / 4 / ~45, "Hire 6" said three times | 14 / 0 / 4 / ~35 | No "Hire n" pill; the note under the table gives only the wage bill | Nothing new (competitive comparison stays in the caption) |
| Firm and market lab | Market price carried to the firm, P = MC, profit box, entry and exit; monopoly; monopolistic competition | Market and firm side by side, one action: choose a change, then Run the long run | SIMPLIFY (light) | 17 (exam labels) / 0 / 6 (3 kinds, select, Run disabled, Start over, Curves, Details) / ~30 | 17 / 0 / 4 at landing; Run and Start over appear after a change | Long-run buttons revealed in time; starting point labeled E, not E2 with no E1 | none |
| Game lab | Test each cell: would either firm switch? Nash equilibria; a tax or subsidy changes the game | A large matrix; tap a cell, an arrow for each switch | SIMPLIFY | 6 / 0, after Both 4 chips + 3-item key + pill / 4 (games, unlabeled best-response switch, a long-labeled tax slider, Details) / ~35, after Both ~75 | 6 / 0, after Both 3 chips + key / 3 (games, labeled "Show best responses", Details) / ~30, after Both ~45 | Tax or subsidy slider moved into Details beside "Who the policy hits" (a pill shows when one is on); no verdict pill for a tested cell; no "Most combined" chip; Both caption explains the arrows instead of repeating the chips; first-run ring is a square on one cell, not an oval cutting the labels | Policy slider and the most combined payoff: Details |
| Graph studio | Draw, label, shift and shade the exam graphs | A large graph; pick what happens, then move a curve | LEAVE (phone fix) | 6 / 0 / 6 (graph, scenario + Show me, D/S shift chips, Start over, Options, Details) / ~25 | same | Phone: the first-run tip's slot sat inside the sticky scenario band and grew it over the caption; hidden there | none |
| Surplus lab | Each policy's areas: who gains, who loses, the deadweight loss | Colored areas with a tappable 4-item key carrying each area's value | SIMPLIFY (light) | 9 / 4 area values + total line / 4 / ~35, revenue and DWL said twice | 9 / 4 / 4 / ~25 | Caption no longer repeats the chips' values; total surplus before and after moved to Details | Total surplus line: Details (its table was already there) |

Totals: LEAVE 1 (graph studio, one phone fix), SIMPLIFY 7 (three of them light), CHANGE 0.

## Graphics quality
- Every picture is the exam's own graph or matrix, drawn by the course engine; no clip art or decoration. The
  public goods street is the one drawn scene and it teaches (lamps built vs bought alone).
- Not fixed, engine-level (shared `mic-graph.js`, which this pass does not edit): on the firm panels of the factor
  lab and firm and market lab, "S = MFC = W" and "d = MR = AR = P" wrap onto a second line over the curve, and the
  dashed wage or price line carried between the two panels shows as short stubs at the panels' edges. Both read
  as untidy; a fix belongs in the engine's link line and label layout.
- Public goods: the $38 sum sits on the MC line at MC $40 (close values); readable but tight.

## Chose not to simplify, and why
- Surplus lab's four area values stay on the stage (above the two-number rule): the key is the answer to "who
  gains, who loses" and each chip focuses its area on tap. Hiding values would separate cause from effect.
- Firm and market lab keeps both panels and every exam label: carrying the price across is the idea, and each
  label is one a student must draw on the exam. On a phone it keeps its Market and Firm tabs; it already flips to
  the firm panel after a market change. Stacking both on a phone would be better but was not done this pass.
- Factor lab keeps table plus two graphs: the market panel sets the wage the firm takes, the table is the MRP
  curve in numbers. Reading them together is the lesson.
- Graph studio's six controls are the engine's (shift chips and Start over are the keyboard route to moving a
  curve); left as they are.
