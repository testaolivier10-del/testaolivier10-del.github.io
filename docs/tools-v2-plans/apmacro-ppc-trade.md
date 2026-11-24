# Plan: AP® Macroeconomics, PPC and trade (tools v2)

## Tool and page
- Page `macroeconomics/tools/ppc-trade.html`; scripts `macroeconomics/assets/tools/ppc-trade.js` and `.css`, model
  `macroeconomics/assets/tools/math/ppc-trade.js`, data `macroeconomics/data/tools/ppc-trade.json` (contexts ppc, trade).
- Free. Rollout row 102, group E, wave 19. Two lessons (rollout "Might be split": 2).

## The one idea (two tabs)
1. PPC: each extra unit of one good costs more and more of the other.
2. Trade: specializing by comparative advantage and trading at terms between the two opportunity costs lets both
   countries consume outside their own PPC.

## Research
- Ricardian Explorer, SERC Carleton ([serc.carleton.edu](https://serc.carleton.edu/econ/simulations/examples/example5.html),
  search result only): two countries, choose specialization, see gains. Take: the gain shown as consumption outside the PPC.
- Comparative advantage sim, D. McCreary ([dmccreary.github.io](https://dmccreary.github.io/economics-course/sims/comparative-advantage/),
  search result only). Take or avoid whatever its controls do off the picture.
- EconGraphs scarcity topic ([econgraphs.org/topics/scarcity](https://www.econgraphs.org/topics/scarcity/)): a point
  dragged along the PPC with the opportunity cost read off.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| View switch PPC, Trade | Explore: two tabs |
| PPC: Robots made slider in the panel | Explore tab 1: the point dragged on the curve (`K.handle`) |
| PPC: tap the graph to put the economy anywhere (inside, on, outside) | Explore tab 1: a press anywhere moves the point there (`grab`) |
| PPC events: Better technology, More workers, A disaster, A recession, Full employment again | Explore tab 1: quiet tap spots in the scene (each plays its shift or move) |
| Old curve kept faded after a shift | Kept, faint solid with subscript 1 |
| Trade: scenario (wheat and cloth; cars and computers; tea and rice), Specialize and trade Off or On, terms of trade slider | Explore tab 2: specialize is a lever on each country; terms of trade is a knob on the trade line; scenario picker quiet |
| Drill (points and shifts, opportunity cost from a table, comparative advantage from output and input data, terms of trade) | Test yourself unchanged, ids `ppc-trade:<context>:<step>` |
| `?seed=`, `#quiz` | Kept |

## Design
- Tab 1: an island country with a pizza kitchen and a robot factory, workers drawn between them. Dragging the point
  along the PPC walks workers from kitchen to factory; the ones who move last are the best cooks (drawn with chef hats),
  so the pizzas lost per 10 robots grow, shown as a stack of pizzas that leave. A point inside the curve leaves idle
  workers on a bench; outside is unreachable and the knob stops at the curve with a "cannot reach" pill.
- Tab 2: two islands (the scenario's countries) with their PPCs drawn on their own hillsides; the specialize lever on
  each sends production to its corner; ships carry the traded goods; the terms of trade knob turns the trade line;
  each country's consumption point lands on it, outside its PPC only when the terms lie between the two costs.
- Cause line: "10 more robots → 15 fewer pizzas (was 5)"; "1 wheat for 1.5 cloth → between 0.5 and 2 → both gain".
- Takeaway per tab. Outside the picture: tabs, purpose line, Show me how. About 25 words.

## Science to verify
- Bowed out PPC means increasing opportunity cost (resources not equally suited); constant cost straight line in
  trade (CED 1.3, 1.4, 1.5); the model's curve and `ApMacroGraph` `ppc` kind agree.
- Comparative advantage from lower opportunity cost, from output data and input data (the inverse case); terms of
  trade must lie between the two opportunity costs; gains computed from `math/ppc-trade.js`.
- A recession is a point inside, not a shift in; technology and more workers shift out (guide graph rules).

## Reuse
- `K.handle` (tangent tracer) for the point on the curve; `K.curve` from forex lab for the shift glide; `ApMacroGraph`
  `ppc` kind for tab 1's axes; the trade view keeps its own `country()` drawing but on the scene.
- Not the first Macro kit2 tool (unless built before forex lab: then it adds the adapter and build hook).

## Risks reviewers will likely block on
- Two PPCs side by side on a phone: stack; keep labels 11 px or more.
- The drawn number of moved workers and pizzas must match the model exactly at every frame.
- The knob must not cover the point's label; one cue only.
- Byte identical: `build-apmacro --check`; no `mac-graph.js` default changes.
