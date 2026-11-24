# Plan: AP® Macroeconomics, AD-AS lab (tools v2)

## Tool and page
- Page `macroeconomics/tools/adas-lab.html`; scripts `macroeconomics/assets/tools/adas-lab.js` and `.css`, model
  `macroeconomics/assets/tools/math/adas-lab.js`, data `macroeconomics/data/tools/adas-lab.json` (contexts shocks,
  gaps, selfadjust, phillips).
- Premium. Rollout row 126, group E, wave 19. 2026-11-10 review: LEAVE (the graph moves well); v2 adds the scene.

## The one idea (three tabs)
1. Short run: a shock moves AD or SRAS and opens a gap against LRAS.
2. Long run: in a gap, nominal wages adjust, SRAS shifts, and output returns to full employment.
3. Phillips curve: the same move seen as a point on SRPC (only once the `phillips` context is served).

## Research
- EconGraphs short run fluctuations ([econgraphs.org/topics/fluctuations](https://www.econgraphs.org/topics/fluctuations/)).
  Take: drag the curve, the equilibrium follows.
- McGraw Hill AD-AS graphing exercise ([chapter 10](https://highered.mheducation.com/sites/0073273082/student_view0/chapter10/interactive_graphs.html),
  search result only). Take what to avoid: buttons beside the graph.
- PhET (group P row) for how a time process is scrubbed (the flagship's time bar).

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| "Choose a shock…" dropdown, 16 shocks (confidence, government spending up and down, taxes, incomes abroad, expected sales, stock crash, recession abroad, interest rates, oil up and down, wages, inflation expectations, drought, subsidy, raw materials) | Tab 1: quiet event picker that plays the shift; the main control is dragging AD or SRAS |
| AD and SRAS handles under the graph, arrow keys, Home | `K.curve` on the curves (same keys) |
| Gap marked against LRAS, E1, E2, E3, YF, shift arrows | Kept on the graph |
| Run the long run (animates wages and SRAS) | Tab 2: the time bar (`K.progress`) with steps and Play |
| Phillips curves beside AD-AS, tied point for point; AD-AS and Phillips tabs on a phone | Tab 3 |
| Drill kinds shock, gap, selfadjust, phillips; graph step `adas-lab:<context>:graph` | Test yourself unchanged; fix the 2026-11-10 note (the gap figure drew no gap) |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Picture: a city skyline above the graph. Factory chimneys and lit windows scale with real output; a queue at the
  job centre door scales with unemployment; the price board in a shop window shows the price level; a wage board on
  the factory gate shows nominal wages. A dashed free line YF is not used: LRAS is a solid labeled line at YF.
- Tab 1 main control: drag AD or SRAS (`K.curve`). The skyline follows the drawn E2.
- Tab 2: opens in a gap; scrub or Play: the wage board moves, SRAS glides, the queue shrinks or grows back to normal,
  the price board settles at E3.
- Tab 3: AD-AS small and the Phillips curves large; the same drag moves the point along SRPC (AD) or shifts SRPC (SRAS).
- Cause line: "Consumer confidence rises → AD right → output above YF → unemployment below natural".
- Takeaway at the end of tab 2: "The economy returns to YF on its own; only the price level changed."
- Outside the picture: tabs, purpose line, Show me how, time bar on tab 2. About 30 words.

## Science to verify
- Each of the 16 shocks' curve and direction (`math/adas-lab.js`) against CED Unit 3 and the authoring guide.
- Self adjustment: wages and SRAS only, never AD or automatic stabilizers (content check rule). Long run output same
  (`hold: ['output']`).
- Phillips: AD shocks move along SRPC; SRAS shocks and expectations shift SRPC; LRPC vertical at the natural rate.
- Gap words: recessionary when Y below YF, inflationary above.

## Reuse
- `K.curve` from forex lab; `K.progress` and `K.player` (flagship) for the long run; `ApMacroGraph` `adas` and
  `phillips` kinds with `state.n1: '3'`, `marks0: { x: 'F' }`.
- Not the first Macro kit2 tool in rollout order.

## Risks reviewers will likely block on
- Two graphs on tab 3 at phone widths (stack, readable labels).
- SRAS label crowding LRAS at the top (the engine's `pairLabels` rules).
- The skyline must never show the result before the curve reaches it, including on a reversed drag.
- Timers stop when leaving tab 2 mid run.
- Byte identical: `build-apmacro --check`; graph tests.
