# Plan: AP® Macroeconomics, Graph studio (tools v2)

## Tool and page
- Page `macroeconomics/tools/graph-studio.html`; scripts `macroeconomics/assets/tools/graph-studio.js` and `.css`,
  model `macroeconomics/assets/tools/math/graph-studio.js`, data `macroeconomics/data/tools/graph-studio.json`
  (8 graphs; 62 scenarios; contexts ppc, sd, move, adas, money, reserves, lf, phillips, forex).
- Free, with the PPC, supply and demand and shift or movement drills free and the other graphs Premium inside Test
  yourself. Rollout row 134, group E, wave 19. Same tool as Micro's Graph studio (forked code): build Macro first.

## The one idea
Each event shifts one curve (or moves along it), and the new equilibrium follows. One screen; the eight graphs are
a quiet graph picker, not tabs (same idea on each).

## Research
- EconGraphs ([econgraphs.org](https://www.econgraphs.org/)): grab any curve. Take: free drag first, prompts second.
- Columbia econpractice ([econpractice.ctl.columbia.edu](https://econpractice.ctl.columbia.edu/course/1/?topic=5),
  search result only): practice graphs with feedback. Take for Test yourself, not Explore.
- The AP exam's own graph drawing in Bluebook (group E row): labels and the point by point rubric.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Graph select (8 graphs) | Explore: quiet picker beside Show me how |
| "What happens" select (scenarios per graph, or free draw) and Show me | Explore: events as tap spots in each graph's scene; Show me plays it; free drag needs no pick |
| A picked scenario says at once whether the right curve moved the right way | Test yourself (it is grading) |
| Linked graph: AD-AS beside Phillips, the currency market beside its mirror; phone switch | Explore: kept as a second panel for those two graphs |
| Why (cause, curve, direction, result, chain); Details (axes, shifters, shift vs movement) | "?" |
| Drill: graph select, kind (draw from scratch, shift and read, shift or movement), rubric strip, codes encoding context and kind, `graph-studio:<context>:<step>`, Premium gate per graph | Test yourself unchanged |
| "Practise this graph" from Explore into Test yourself on the same graph | Kept |
| `?seed=`, `#quiz` | Kept |

## Design
- Picture: each graph sits under a small drawn scene of its market, reused from the other Macro tools where they
  exist: a market stall street (supply and demand), the island (PPC, from ppc-trade), the skyline (AD-AS and Phillips,
  from adas-lab), the bank and Fed (money and reserves, from reserves-lab), the Treasury and a building site
  (loanable funds), the harbour (forex, from forex-lab). The scene answers the drawn equilibrium (more buyers, a new
  price tag) so every graph shows the real thing.
- Main control: drag any curve (`K.curve`). Events are tap spots in the scene (a tax notice, a tech lab, a holiday crowd)
  that play their shift; a movement along a curve shows the point sliding with the curve still.
- Cause line: "Incomes rise → demand right → price up, quantity up" (from the scenario's `say`, or the drag in free play).
- Takeaway: "Shift: something other than price changed. Move along: the price changed."
- Outside the picture: purpose line, graph picker, Show me how. About 20 words.

## Science to verify
- All 62 scenarios' curve, direction and outcome against `math/graph-studio.js` and the authoring guide (axes exact
  per graph, subscripts, `key.alt` cases, ample reserves).
- The 2026-11-10 bug: forex Show me left the mirror market's equilibrium behind. Fix and test.
- Shift vs movement wording; normal vs inferior goods; LRAS and LRPC vertical.

## Reuse
- Build last in Macro: `K.curve` (forex lab) and the scenes of ppc-trade, adas-lab, reserves-lab and forex-lab exist
  then; lift shared scenes into one Macro tool only file (for example `macroeconomics/assets/tools/mac-scenes.js`), not
  into `mac-graph.js`.
- Micro's Graph studio forks this design: keep the structure easy to copy.

## Risks reviewers will likely block on
- Heavy: eight graphs and scenes. Weight: lazy load a graph's scene; check `check-weight.mjs` for the tool bucket.
- Two panel graphs (AD-AS with Phillips, forex mirror) small on phones: stack.
- One cue at a time across graph switches; labels never overlap in any of the eight graphs at any width.
- Byte identical: `build-apmacro --check`; graph tests; Micro untouched.
