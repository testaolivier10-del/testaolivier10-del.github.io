# Plan: AP® Microeconomics, Elasticity lab (tools v2)

## Tool and page
- Page `microeconomics/tools/elasticity-lab.html`; scripts `microeconomics/assets/tools/elasticity-lab.js` and `.css`,
  model `microeconomics/assets/tools/math/elasticity-lab.js`, data `microeconomics/data/tools/elasticity-lab.json`
  (contexts ped, other).
- Free. Rollout row 135, group E, wave 24: the first Micro E tool, so it carries `K.curve` to `mic-graph.js`. Restyle.

## The one idea (three tabs)
1. Price: on the elastic part a price cut raises total revenue; on the inelastic part it lowers it.
2. Income: the sign of income elasticity names the good (normal, luxury, inferior).
3. Cross price: the sign of cross price elasticity names the pair (substitutes, complements, unrelated).

## Research
- EconGraphs elasticity graphs ([econgraphs.org/topics/competition](https://www.econgraphs.org/topics/competition/)):
  drag a point on demand, the revenue rectangle follows. Take: the rectangle is the revenue.
- MRU active learning ([mruniversity.com](https://mruniversity.com/teacher-resources/active-learning/consumer-and-producer-surplus-interactive-practice),
  search result only) for how practice is framed.
- The integrated tangent tracer (`docs/tools-v2-tangent-tracer-brief.md`): `K.handle` on a curve, the ring knob that
  never covers what it moves.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| View switch Price, Income, Cross price | Explore: three tabs |
| Point A dragged on demand; B one $2 step lower; elastic and inelastic halves marked; TR rectangle; TR hill below with A and B dropped | Tab 1, main control `K.handle` |
| Price at A slider in the panel (repeats the drag) | Removed (the drag and keys do it); logged |
| Arc elasticity from A to B; midpoint method in More options | Cause line uses starting values; midpoint switch to "?" |
| Income: kind of good (luxury, necessity, inferior), change income, D1 to D2, Q1 to Q2 at $10 | Tab 2: drag income (a pay slip knob); kind picker quiet |
| Cross price: related good (substitute, complement, unrelated) | Tab 3: drag the other good's price tag |
| Drill kinds coef, trtest, range, income, cross; shift step on the stage | Test yourself unchanged, ids `elasticity-lab:<context>:<step>` |
| `?seed=`, `#quiz` | Kept |

## Design
- Tab 1: a movie theatre box office with a price board and a queue of buyers (the queue length is quantity demanded
  at the drawn price); the till's cash pile is total revenue, drawn as the TR rectangle filled with bills on the
  graph. Dragging A down the demand curve lowers the board price, lengthens the queue, and the cash pile grows on the
  elastic half and shrinks on the inelastic half; the TR hill below has A on it.
- Tab 2: a shopper with a pay slip; drag income, the demand curve shifts, the basket at $10 fills or empties.
- Tab 3: a second shop's price tag; drag it, our demand shifts the right way for the pair.
- Cause line: "Price $8 → $6, quantity 4 → 6 → elasticity 1.5 → elastic → revenue up".
- Outside the picture: tabs, purpose line, Show me how. About 25 words.

## Science to verify
- Elasticity judged by absolute value; the sign of cross price elasticity (substitutes positive); income elasticity
  above 1 luxury, 0 to 1 necessity, negative inferior (authoring guide traps).
- On a straight demand curve elasticity varies; unit elastic at the midpoint where TR peaks (`demand` kind named
  point `unit-elastic`).
- Arc values from starting values match `ApMicroCalc`; the midpoint method matches its formula.

## Reuse
- First Micro E tool: port `K.curve` use from Macro; any `mic-graph.js` change is opt in with byte identical output.
  If game lab has not added the Micro adapter and build hook, this tool adds them.
- `ApMicroGraph` `demand` kind (D, the price line, `tr` and `cs` regions).

## Risks reviewers will likely block on
- The queue length and cash pile must match the drawn point exactly, including fast drags and reversals.
- TR hill and demand on one quantity axis: aligned at every width; stacked on phones without shrinking text below 11 px.
- Removing the panel slider must be logged twice.
- Byte identical: `build-apmicro --check` and `build-apmacro --check`; `node --test scripts/test/apmicro-graph*.test.mjs`.
