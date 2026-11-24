# Plan: AP® Macroeconomics, Indicators lab (tools v2)

## Tool and page
- Page `macroeconomics/tools/indicators-lab.html`; scripts `macroeconomics/assets/tools/indicators-lab.js` and `.css`,
  model `macroeconomics/assets/tools/math/indicators-lab.js`, data `macroeconomics/data/tools/indicators-lab.json`
  (contexts gdp, jobs, prices, real), validator and test under `scripts/lib/apmacro-tool-checks/` and `scripts/test/`.
- Free. Rollout row 101, group C (calculators and drills), wave 7. Four lessons (rollout "Might be split": 4).

## The one idea (four tabs)
1. GDP: only new, final, domestic production counts, and it lands in C, I, G or NX.
2. Prices: the CPI is the cost of the same basket now over its cost in the base year.
3. Real: real GDP takes out the price change; the goods are the same.
4. Jobs: the unemployment rate is unemployed over the labor force, and leaving the labor force changes it.

## Research
- BLS labor force definitions ([bls.gov/cps/definitions](https://www.bls.gov/cps/definitions.htm), builder to open):
  who is in and out of the labor force. Take: people standing in places, not dots changing color.
- Khan Academy exercises (group C row): forgiving number input and a hint ladder for Test yourself.
- The integrated C tool, AP® Chemistry units and sig figs (`docs/tools-v2-units-sig-figs-brief.md`): how a calculator
  tool got a real picture and what reviewers blocked on.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| View switch GDP, Prices, Real, Jobs (each once its topic is published) | Explore: four tabs (`K.tabs`), same publish rule |
| GDP: Next transaction, tokens sized by dollars into C, I, G, X, imports under −M, Not counted with reason; New economy (seed) | Explore tab 1: tap a transaction in the scene; New economy as a quiet button |
| Prices: two receipts, Year and Base year pickers, CPI by year line, inflation bars, wage in base year dollars | Explore tab 2: Year is the main control; Base year quiet; the wage line to "?" |
| Real: same goods at this year's and base prices, Year picker, nominal and real lines | Explore tab 3 |
| Jobs: 100 adults in three places, three kinds of unemployment, labor force bracket, events | Explore tab 4 |
| Drill kinds gdp-count, gdp-calc, cpi, real, unemp, utype ("Problem type") | Test yourself unchanged, ids `indicators-lab:<context>:<step>` |
| `?seed=`, `#quiz` | Kept |

## Design
- Tab 1 GDP: a drawn town (homes, a store, a factory, a city hall, a port, a used car lot, a broker). Main control:
  tap a transaction on the picture (`K.tap`: "Family buys a new car", "Firm buys a machine", "Road built",
  "Tourist buys a meal", "Phone imported", "Used car sold", "Stock bought"). Its token flies along the street into
  its column (C, I, G, NX) or into Not counted with a 1 to 3 word reason pill. GDP total on the picture.
- Tab 2 Prices: the basket on a shop counter with price tags; main control: drag the year (`K.drag` on a calendar
  on the wall). Tags change, the two receipts total, CPI = this year's total ÷ base total × 100 on the receipt.
- Tab 3 Real: the same goods on two shelves, priced in this year's and base year's prices; drag the year; the gap
  between the shelves' totals is labeled "only prices".
- Tab 4 Jobs: 100 people drawn as figures in three areas (Employed, Unemployed with its three kinds, Not in the labor
  force) under one bracket "Labor force"; tap an event on the scene (factory closes, graduates start looking,
  discouraged worker stops looking, recession ends); people walk; the rate on the bracket updates as they arrive.
- Cause line: per tab ("Used car → not new production → not in GDP"; "Basket $240 now ÷ $200 then → CPI 120").
- Outside the picture: tabs, purpose line, Show me how. About 25 words.

## Science to verify
- GDP rules against the CED Unit 2 and BEA's NIPA handbook: intermediate goods, used goods, transfers, financial
  transactions, imports subtracted, inventory counts as I.
- CPI = cost of the fixed basket ÷ base cost × 100; inflation = percent change of CPI; the deflator formula; real =
  nominal ÷ deflator × 100 (guide traps: never times; a deflator is an index). No PPI calculation (CED 2.4).
- Labor force rules (BLS): discouraged workers and retirees are out; natural = frictional + structural.
- The model's numbers (`IL.economy`, `IL.JOBS0`) are unchanged; check every event against the drawn count.

## Reuse
- First Macro tool on kit2 only if built before policy chain (then add the adapter and build hook as in the policy
  chain plan; check `grep kit2 macroeconomics/data/pages.json`).
- No `K.setup` in the kit: Test yourself keeps `ApMacroTools.drill`. Graph engine not used (data figures: `mac-plot.js`).

## Risks reviewers will likely block on
- Heavy: four scenes. Tokens and reason pills fitting at 360 px; 100 figures must stay one element each (perf at CPU
  x4). Counted figures must match the rate exactly at every frame of a walk.
- A tab that only shows a chart fails the visuals rule: every tab is a drawn scene.
- Byte identical: `build-apmacro --check`; no change to `mac-plot.js` defaults.
