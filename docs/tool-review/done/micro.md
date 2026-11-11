# Tool fixes: AP Microeconomics (builder "micro", 2026-11-10)

Tools given: the four marked FIX in `docs/tool-review/microeconomics.md`. Factor lab, firm and market lab, graph
studio and surplus lab (LEAVE) and `macroeconomics/` untouched. No shared file edited (`mic-graph.js`,
`mic-matrix.js`, `mic.css`, `assets/*` unchanged); every change is in the tool's own js and css.
Screenshots: `/home/claude/shots/build/microeconomics/<tool>_before.png`, `_after.png`, `_after_p.png`.

Accuracy flags: none were raised for these tools (the review checked every number). No model, data or number was
changed; the drawings read the same models (ApMicroGraph's cost curves, ApMicroMath tables) as before.

## Cost lab
- The graph is now drawn by the tool from the engine's `costs` model (`G.curves`, `G.y`, `G.named`), so the table's
  rows still land on the curves (the cost lab test checks this). It takes the larger column beside the table
  (desktop about 470 x 520) with dollar ticks and output ticks.
- The price axis grows with the sliders (to cover every row of the whole table, so it never jumps while hiring);
  materials $2 with fixed cost $160 no longer clips MC and ATC. The scale animates with the curves.
- P_SD and P_BE carry their prices on the axis; curve names are spread so ATC and AVC no longer collide; the
  selected row's output is a tag on the quantity axis; old curves stay faded with arrows.
- Phone: a shorter, wider version of the same graph over the row card.

## Elasticity lab (price view)
- One large figure: demand on top, the total revenue hill under it on the same quantity axis. Elastic and
  inelastic halves tinted through both panels, a unit elastic line through both, A and B dropped straight down
  onto the hill with their prices, quantities and revenues on the axes. Drag, slider and keys work as before.
- The phone used Demand / Total revenue tabs; the stacked figure fits, so the tabs are hidden in the price view
  (nothing a student could do is lost). Income and cross-price views unchanged (the review said fine).
- Checked: $14 to $12, 30 to 40, |Ed| 2.33, TR $420 to $480 (unchanged).

## Externality lab (public goods view)
- Upright, the way the exam draws it: each light's marginal benefits stacked (Ana, Ben, Cy) into the MSB steps,
  the MC line, the efficient number where they meet. Each alone: each neighbor's own steps against the same MC
  beside the summed panel. A drawn street lights the lamps that get built (efficient, or the most anyone buys
  alone). The marginal benefit table moved to Details. Externalities view untouched.
- Not done: the Test yourself flu shots shading step (area a is a sliver) is drawn by the shared graph engine;
  the area buttons still work. Left for an engine change.

## Game lab
- The matrix is much larger (cells about 200 x 128 on desktop, 118 x 84 on a phone) and each firm's switch is an
  arrow from the tested cell to the cell it would move to, one color per firm (the column firm's payoffs and
  headings are blue to match). Best responses draw every switch as it is revealed: a cell with no arrow leaving
  it is a Nash equilibrium; Sale week shows a circle of arrows. A key names the colors. Reduced motion shows the
  end state. Payoffs, verdicts and the tax case unchanged.

## Checks
`build-apmicro.mjs --check`, `build-apmacro.mjs --check` (byte-identical), `check-apmicro-content.mjs`,
`check-apmicro-map.mjs`, `node --test scripts/test/apmicro-*` (190 pass), `check-site.mjs`: all clean.
