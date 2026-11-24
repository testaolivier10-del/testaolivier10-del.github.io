# Plan: AP® Microeconomics, Game lab (tools v2)

## Tool and page
- Page `microeconomics/tools/game-lab.html`; scripts `microeconomics/assets/tools/game-lab.js` and `.css`, model
  `microeconomics/assets/tools/math/game-lab.js`, data `microeconomics/data/tools/game-lab.json` (contexts fares, ads,
  output, launch).
- Free. Rollout row 136, group M (sorters and matchers), wave 6. Restyle (the control is already on the picture).

## The one idea
A cell is a Nash equilibrium when neither firm gains by switching alone. One screen, no tabs.

## Research
- The Evolution of Trust, Nicky Case ([ncase.me/trust](https://ncase.me/trust/); listed at
  [exploring-economics.org](https://www.exploring-economics.org/en/discover/the-evolution-of-trust/)): two players
  drawn as characters, every payoff shown as coins moving. Take: the players are people, payoffs are coins.
- EconGraphs game theory ([econgraphs.org/topics/game](https://www.econgraphs.org/topics/game/)): best responses
  highlighted in the matrix. Take: mark each player's best response, cells marked twice are Nash.
- Duolingo (group M row): tap, instant result on the item.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Payoff matrix (`ApMicroMatrix.html`); tap a cell: would either firm switch, arrow to that cell, one color per firm | Explore: main control, on the drawn board |
| Best responses: one firm's comparisons column by column, then the other's; cells marked twice are Nash | Explore: a quiet button per firm on its side of the board |
| Tax or subsidy slider on one firm's strategy (`change`) | Explore: quiet knob on that firm's building |
| Game picker (four contexts) | Explore: quiet picker beside Show me how |
| Details: edit any payoff, choose whose strategy the policy hits, every comparison in words | "?" |
| Drill kinds dominant, nash, best, change; matrix steps on the stage, `game-lab:<context>:<step>` | Test yourself unchanged |
| `?seed=`, `#quiz` | Kept |

## Design
- Picture: two rival firms facing each other across a street (two airlines at an airport for fares, two soda brands
  for ads, and so on per context), each owner drawn at their shop. Between them the 2 by 2 matrix is a big board on
  the street; each cell shows both payoffs as coin stacks in the firm's color (row firm first, as the exam writes it)
  with the number beside.
- Main control: tap a cell (`K.tap`). Each owner looks at the cell they could switch to in their own line: an arrow
  in their color runs to it if they would gain ("+20"), or a still check if not. A cell with no arrow out glows: Nash.
- Quiet: the tax or subsidy knob on one firm moves its coin stacks on one strategy; arrows and the Nash glow update.
- Cause line: "Row firm at Low: High pays 70 > 50 → switches"; "Neither gains alone → Nash equilibrium".
- Outside the picture: purpose line, game picker, Show me how. About 20 words.

## Science to verify
- Dominant strategy proven by both comparisons with numbers; "no dominant strategy" also needs both (authoring guide
  "Game theory: both comparisons").
- Find every Nash equilibrium; the largest joint payoff cell is not Nash by itself; no ties (`ApMicroMatrix.check`).
- Row player's payoff first in each cell; `unitLabel` when payoffs are in thousands.
- A tax or subsidy changes payoffs on one strategy only; the new equilibria from `ApMicroMatrix` change.

## Reuse
- First Micro tool on kit2 if built in rollout order (wave 6): add `ApMicroTools.studioKit2` to `mic-tools.js` (a fork
  of the Macro adapter; copy, never import Macro files) and the `t.kit2` branch in `scripts/build-apmicro.mjs` tool
  template (line 984; as `build-apcalc.mjs` 1060 to 1061). If the Macro adapter exists, port it line for line.
- No `K.sort` in the kit; `K.tap` is enough. Keep `ApMicroMatrix.html` for Test yourself and the board's semantics
  (scoped headers) under the drawing.

## Risks reviewers will likely block on
- Coin stacks and numbers in a cell at 360 px: two payoffs plus an arrow must fit; text 11 px or more.
- Arrows must not cover numbers or labels; only one cue.
- Coin stack heights proportional to payoffs (negative payoffs drawn honestly as debt, not as small stacks).
- Byte identical: Micro forks Macro; `node scripts/build-apmicro.mjs --check` and `node scripts/build-apmacro.mjs
  --check` (Macro must not change at all).
