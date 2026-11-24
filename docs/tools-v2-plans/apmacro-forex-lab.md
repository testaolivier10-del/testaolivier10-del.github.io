# Plan: AP® Macroeconomics, Forex lab (tools v2)

## Tool and page
- Page `macroeconomics/tools/forex-lab.html`; scripts `macroeconomics/assets/tools/forex-lab.js` and `.css`, model
  `macroeconomics/assets/tools/math/forex-lab.js`, data `macroeconomics/data/tools/forex-lab.json` (contexts axis,
  shifts, policy, netexports, flows), validator and test under `scripts/lib/apmacro-tool-checks/` and `scripts/test/`.
- Premium. Rollout row 96, group E (econ graph shifters), wave 19, the most opened E tool in Macro: it is the
  group's pattern and builds `K.curve`.

## The one idea
When the demand or supply of one currency shifts, that currency rises and the other falls, and trade and capital
flows follow. One screen, no tabs.

## Research
- EconGraphs, Chris Makler ([econgraphs.org](https://www.econgraphs.org/), home page fetched; the graphs themselves
  still to open): grab a curve, the equilibrium and labels follow. Take: the curve is the handle.
- McGraw Hill interactive graphs ([chapter 5 example](https://highered.mheducation.com/sites/0073273082/student_view0/chapter5/interactive_graphs.html),
  search result only): shift buttons beside a static graph. Take what not to do: controls off the picture.
- Foundation for Teaching Economics, foreign exchange activity ([fte.org](https://fte.org/teachers/teacher-resources/lesson-plans/rslessons/foreign-currencies-and-foreign-exchange/),
  search result only): students trade currency to buy goods. Take: who is buying which currency, and why.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| "What changes?" dropdown (16 events: tastes, incomes at home and abroad, price levels, real rates, central banks, tourists, borrowing) | Explore: the events become tap spots on the scene (a quiet secondary; each plays its shift) |
| Market for euros beside its mirror, the market for dollars, axes the right way round | Explore: both kept as two panels; the mirror is a drawn result, never a handle |
| Curve drag and arrow key handles under the graphs | Explore: `K.curve` on the first market's D and S |
| Trade panel (crates, capital notes, net exports and AD per country); a third tab on a narrow stage | Explore: drawn in the scene itself, not a panel |
| Colors linking D of X with S of Y | Kept (one color per idea) |
| Drill kinds axis, shift, nx, flows; graph step on the stage, `forex-lab:<context>:graph` | Test yourself unchanged, same ids |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Picture: two countries across a strip of sea, the United States on the left and the euro area on the right, a
  currency exchange board at the harbour between them. Ships carry crates both ways (exports, the count scaled to each
  country's exports at the drawn rate); a stream of paper notes runs toward the country with the higher real return.
  Below the scene: the market for euros (price of the euro in dollars per euro) and the market for dollars (euros per
  dollar), `ApMacroGraph` kind `forex`, two panels side by side on wide screens, stacked on a phone.
- Main control: drag the demand or supply curve for euros (`K.curve`). The rate on the board, the mirror market's
  shift, the ships and the notes all follow the drawn curve.
- Secondary: tap an event on the scene (a Fed sign, tourists at the airport, a shop window) to play that event's shift.
- Cause line: "US tourists visit Europe → demand for euros up → euro appreciates → dollar depreciates → US net exports up".
- Takeaway when a shift settles: "One currency's rise is the other's fall."
- Outside the picture: purpose line, Show me how. About 20 words, 1 control.

## Science to verify
- Axis ratio both markets (authoring guide "The foreign exchange axis ratio"); the two rates are reciprocals at every
  frame (check the board against 1 / the other).
- Who demands and supplies each currency; each of the 16 events' curve and direction against `math/forex-lab.js`
  and the CED Unit 6 (6.4 to 6.6).
- Events the exam accepts either way (relative prices, relative real rates): `key.alt` in Test yourself; the 2026-11-10
  review note on "Prices rise faster" (both pushes) goes in the cause line or "?".
- Net exports direction for each country; capital flows to higher real interest rates (balance of payments signs).

## Reuse
- Builds `K.curve` (group E's shared piece). Put it in `tool-kit2.js` as a generic curve handle on top of `K.handle`
  (grab anywhere on a named path, move along its shift axis, keys, a before tick); the Macro bridge reads geometry
  from `ApMacroGraph.px`, `py`, `BOX` and the model, so `mac-graph.js` changes only by opt in options.
- Old curve: AP convention keeps D1 and D2 both labeled. Draw the old one faint and solid with subscript 1 (not
  dashed: reviewers blocked dashed ghosts elsewhere). `mac-graph.js` draws it dashed today: add an opt in state
  option, default output unchanged. Log the decision in `docs/tools-v2-owner-log.md`.
- Adds the Macro adapter and build hook only if policy chain and indicators lab are not on kit2 yet.

## Risks reviewers will likely block on
- Two panels at 360 to 430: stack them; graph text 11 px or more; the axis title "Dollars per euro" must not wrap
  inside a word.
- Perf: `ApMacroGraph.svg` rebuilds the whole SVG; a drag must move cached paths by transform and re-render only when
  settled (p95 at or under 50 ms at CPU x4).
- Labels: D1, D2, S, E1, E2, XR marks clear of each other by 4 px in both panels and in Test yourself.
- Byte identical: `node scripts/build-apmacro.mjs --check` and `node --test scripts/test/apmacro-graph.test.mjs`
  after any `mac-graph.js` change; every existing spec must render the same SVG. `mac-graph.js` counts against the
  course shell budget: tool only code stays out of it.
