# Self-review: builder T4 (game-lab, factor-lab, externality-lab)

Date 2026-11-09. Scratch build `/tmp/mic-t4` (`APMICRO_PUBLISHED=graph-skills,unit-1,...,unit-6`), served on port 8814,
checked with Playwright at 360 and 1280 px, light and dark.

## What was built

| Tool | Explore | Test yourself (drill kinds) |
|---|---|---|
| `game-lab` (free) | Four games (price war, advertising, pick a standard, sale week). Tap any cell: would either firm switch alone, and to what (the target cell marked). Best responses lights one firm's two comparisons column by column; with both firms marked the Nash cells are tagged. A tax or subsidy slider changes one firm's payoffs on one strategy (`change`) and the verdicts and equilibria follow. Details: choose the firm and strategy the policy hits, edit any payoff (ties flagged), every comparison in words. | `dominant` (matrix, then the argument a reader scores: both comparisons vs one comparison, the largest payoff, comparing across players), `nash` (every Nash cell incl. two or none, the joint cell, is the joint cell stable), `best` (best response, its gain, dominant strategies), `change` (new payoff, new Nash cells, what moved) |
| `factor-lab` (Premium) | Competitive: a bakery's hiring table (TP, MP, MRP = MP x P, wage) beside the two-panel `labor` graph; price and wage sliders shift MRP and S_L (the old curve kept faded), hired rows light up. Monopsony: wage from supply, labor cost, MFC, MRP; hire where MRP = MFC, wage read from supply, wage bill shaded and DWL hatched on the `monopsony` graph, drawn to scale (workers = 2x, dollars = 4y); a minimum wage slider draws W_min and moves the hiring point. Details: the least-cost rule worked. | `hire` (MP, MRP, how many), `derived` (product price shifts MRP on the graph + the new MRP + the chain with every link; or labor supply shifts and the firm moves along MRP), `monopsony` (MFC, workers, wage from supply, then the hiring point or the wage bill on the graph), `leastcost` (MPL/w, MPK/r, where the next dollar goes; a two-card figure fills in) |
| `externality-lab` (Premium) | All four externality types; size slider moves the social curve; a corrective tax or subsidy slider shifts the private curve (relabeled "S + tax", "D + subsidy" ...), the shaded DWL shrinks to none at the right size and reopens past it. E* marked, market / efficient / DWL readout. Public goods: three residents' stacked marginal benefits against the cost line, Together vs Each alone (free rider). Details: the four externalities, goods by rivalry and excludability. | `quantity` (name the type, place the efficient or market point, compare), `dwl` (shade it, its size, which way it points), `fix` (which policy, how much per unit, draw the shift), `public` (summed MB, efficient units, free rider) |

Files: `microeconomics/assets/tools/{slug}.js|.css`, `.../math/{slug}.js`, `microeconomics/data/tools/{slug}.json`,
`scripts/lib/apmicro-tool-checks/{slug}.mjs`, `scripts/test/apmicro-tool-{slug}.test.mjs`,
`assets/covers/tools/apmicro/{slug}.svg` and `index.json` (created with my three entries). The pages.json entries
were already right (studio, topics, premium) and were not changed.

## Tested

- `node --test scripts/test/apmicro-tool-{game,factor,externality}-lab.test.mjs`: 15 pass. Each runs the full sweep
  (300 seeds per context and type, every key recomputed with the validator's own arithmetic: own best responses,
  dominance, Nash and joint cells; own MP, MRP, hiring, MFC, wage; own market/efficient quantities, DWL, policy and
  public-good sums), the Explore models against recipes and the graph, seed reproducibility and planted mistakes.
- `node scripts/check-apmicro-content.mjs --check`: tools 0 failing. `build-apmacro.mjs --check` unchanged.
- Browser: every drill walked to the end for 4 seeds per tool (matrix, graph point, shade and shift steps, Show the
  answer): no console errors (only the sandbox's blocked external requests). Screenshots in `/tmp/mic-t4/png/`
  (landing, tapped cell, Both, quiz, monopsony with minimum wage, the four externality types, public goods).

## Requests for the lead (shared files; worked around locally)

1. **`mic.css` dark mode**: `.mic-mx-cell`, `.mic-mx-cell.is-on`, `.mic-gr-eq` stroke and `.mic-gr-card` use
   `var(--surface,#fff)`, a token theme.css does not define, so payoff cells are white with pale pink text in dark
   mode (unreadable). Replace `var(--surface,#fff)` with `var(--white,#fff)` in those rules. Local override in
   `game-lab.css`.
2. **`mic-graph.js` areas() and shown shifts**: `areas()` cuts cells from the base curves (`cs0`), so a `show`
   offset (a corrective tax drawn as a shift) does not change the shaded deadweight loss; and the externality's
   social curve is placed at `5 + sign * gap`, ignoring `start` of its private curve. Proposed: in the externality
   branch take D and S from `cs` (the curves with offsets) for the market quantity, keep the social curve fixed,
   and pick the band orientation by which side of the efficient quantity the market lands on. Workaround: a second
   `ApMicroGraph.svg` of an equivalent market (model `specB`, checked in the validator for every type, size and
   policy) stacked under the picture with only its shaded cells shown.
3. **Policy shift labels**: a shown shift of `S` on an externality graph is labeled `S = MPC` with subscript 2;
   after a tax it is `S + tax`. Suggest `spec.showLabel: { S: 'S + tax' }`. Workaround: the label text is replaced
   in the svg string.
4. **Point labels and marks**: the `point` label sits at a fixed offset and can cross a curve (monopsony "Hire",
   externality "E*"); a placed or named point gets no axis marks (W_M, Q_M, Q*). Suggest candidate placement and
   optional `marks` for the point. Workaround: blank label on the monopsony point, E* only when no E2.
5. Tool Studio at 360 px: the graph's "Start over" button sits under the stage's Enlarge button (shared
   `.ls-enl` position).

## Open points

- The Lorenz curve is not in Externality Lab (Explore closes with public goods); the brief said "if it fits". It
  would fit as a third view with the `lorenz` kind and `ApMicroCalc.lorenz/gini` if wanted.
- The competitive labor graph in Factor Lab shows directions (the engine's MRP is a straight parallel shift; MP x P
  rotates); Details says so. The monopsony graph is to scale.
- Payoffs are stated as thousands of dollars in each story; cells show plain numbers (caption "A first, B second").
- Content authors' lessons for these topics drive the Keep going strip (it only links built pages).
