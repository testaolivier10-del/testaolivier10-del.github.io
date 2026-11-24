# Plan: AP® Physics 1, Lab design and linearizing (tools v2)

**Tool and page:** `physics/tools/lab-design.html`; `physics/assets/tools/lab-design.js` (407 lines) and `.css`,
`physics/assets/tools/math/lab-design.js`, data `physics/data/tools/lab-design.json` (contexts `ramp`, `spring`,
`atwood`, `pulley`, `pendulum`, `buoyancy`). Premium. Rollout row 89, group P, wave 21, size rework (the graph is
empty on landing).

**The one idea:** plot the right quantities and a curve becomes a straight line whose slope means something. One
screen; the apparatus is a quiet choice.

## Research
- [QuarkNet, how to linearize a curved data plot](https://quarknet.org/node/1782): the T against √L and T² against L
  moves; take the two axis choices.
- Pivot Interactives (known; real video with measurement tools): take the "take a reading off the real apparatus".
- PhET Curve Fitting (known): a best fit line that updates as points move. Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Experiment picker (6 apparatus) | Explore: three quiet chips (pendulum, ramp, spring); atwood, pulley and buoyancy in Test yourself, log it |
| Variable slider (length L and others), Change | Explore: main control, drag the apparatus variable on the picture (string length, ramp release point, mass) |
| Take a reading, Take 6, Clear data | Explore: each drag stop takes a reading at once (a point lands); quiet "Take 6"; Start over |
| Views Bench, Graph | One screen: bench left, graph right (stacked on phones) |
| Graph axis choices | Explore: tap the axis name to cycle (L, √L, L²; T, T²); the points slide to their new places |
| Best fit line | Appears once 3 points exist; its slope pill names what it means ("slope = 4π²/g") |
| New apparatus; drills (6 contexts), ids `lab-design:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a lab bench with a pendulum on a clamp stand, a meter stick behind it and a photogate at the bottom of
  the swing with its timer display; beside it a sheet of graph paper on a clipboard.
- **Main control:** drag the bob's clamp up or down to change L; on release the pendulum swings, the photogate reads
  T and a point flies to the graph.
- **Second control (same idea, stays beside it):** tap the x axis name: L → √L → L². The points slide (animated)
  from a curve into a line; the best fit line draws through them and its slope is named.
- **Cause line:** "T against √L → points on a line → slope 2.01 s/m^½ → g = 9.8 m/s²".
- **Takeaway:** "Square the period, plot against length, and the slope gives g."
- **Outside the picture:** purpose line, Show me how, 3 chips, cause line, Start over.

## Science to verify
- The linearizations for each apparatus: pendulum T² = (4π²/g)L; spring T² = (4π²/k)m; ramp d = ½at² (d against t²);
  check the other three contexts in Test yourself (Atwood a = g(m₁ − m₂)/(m₁ + m₂)).
- Measurement noise realistic (photogate to 1 ms) and the best fit by least squares; slope uncertainty in "?".
- AP® Physics 1 science practices on linearization (CED 2024). No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.drag`, `K.tap`, `K.cue`, `K.cause`.
The axis cycling is a `K.tap` on the axis label.

## Risks reviewers will likely block on
- Graph and bench side by side at 768: neither may shrink text under 11 px.
- Points sliding between axis choices must keep each point's identity (the same reading).
- Axis labels with exponents (L², √L, s/m^½) must not break.
- Readings must come from the drawn swing's timing, not an unrelated model value.
