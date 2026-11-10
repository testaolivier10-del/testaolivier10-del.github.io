# AP® Microeconomics: independent review of the eight trainers (Phase 4, 2026-11-10)

Reviewer: independent (not a builder). Scope: `graph-studio`, `elasticity-lab`, `surplus-lab`, `cost-lab`,
`firm-market`, `game-lab`, `factor-lab`, `externality-lab`. Read first: `review-common.md`, `tools-common.md`, spec
section 6, `self-t1.md` to `self-t4.md`, `integration.md`. Exams, FRQ and justify data were not touched. No git
command that changes anything was run. Scratch: `/tmp/mic-rv` (scripts in `s/`, screenshots in `png/`).

## Summary

| | |
|---|---|
| Generated drill problems worked independently | 4,000 (40 per context and kind, 100 context and kind pairs, seeds unlike the validators') |
| Keys that disagreed with my own arithmetic | 0 |
| Economics or wording problems fixed | 12 |
| Hands-on bugs fixed (tool files) | 5 |
| Shared engine fixes (`mic-graph.js`) | 3, all cosmetic label placement |
| Integration workarounds removed | 7 (1 kept, 1 restored on purpose, see below) |
| Tests after the last change | `node --test scripts/test/apmicro-*.test.mjs` 187 pass, 0 fail; `check-apmicro-content` 0 failing; `check-apmicro-map` clean; `build-apmacro --check` byte-identical |

## How the economics was checked

`/tmp/mic-rv/s/solve.mjs` regenerates problems with each tool's model and recomputes every key from what the
student sees (the stem text, the table HTML parsed back into numbers, the payoff matrix, the graph legend), with
its own arithmetic, never the model's recipe or the validator:

- game-lab (640): best responses, strict dominance, every Nash cell, the joint cell, best-response gain, payoff after
  a tax or subsidy (sign checked against the stem's words), the "proof" option has both comparisons with the right
  numbers, larger first, and the right conclusion; "stable" and "what moved" choices match before and after Nash sets.
- factor-lab (320): MP, MRP = MP × P, hire while MRP ≥ wage (and MP diminishing), MPL/w and MPK/r and where the next
  dollar goes, derived demand (shift direction from the price change, new MRP, chain names MRP and the direction),
  labor supply variant (SL shift, wage direction, move along MRP), monopsony MFC from total labor cost, hire where
  MRP ≥ MFC, wage from supply, the competitive count.
- externality-lab (560): type, market vs efficient (efficient quantity read from the engine's picture, scaled by the
  problem's units, and the picture's market point matched to the stem), DWL = ½ × gap × external cost, policy
  amount, which curve shifts which way; public goods summed MB and efficient units.
- elasticity-lab (200): midpoint and starting-value percent changes, |Ed| and class, total revenue test from the
  schedule, unit-elastic midpoint and TR maximum, advice, income and cross elasticity with sign, class, shift direction
  (including the unrelated case, no graph step).
- surplus-lab (280): linear market rebuilt from the legend (and the engine's equilibrium checked against the
  legend), CS and PS, shortage or surplus, control DWL, tax revenue, DWL, buyer burden, subsidy cost and DWL, imports
  and gains from trade, tariff imports, revenue and both triangles; incidence by solving the stem's equations.
- cost-lab (200): MP, TVC, MC = w/MP, AVC; TFC, MC = ΔTC/ΔQ, ATC, AFC; every row of the min table recomputed from TC
  and the minimums; ATC after a fixed or per-unit change and which curves move; shutdown and break-even prices.
- firm-market (200): profit-maximizing q by brute-force profit (no ties), TR and profit; (P − ATC) × q, TFC and the
  decision; long-run chain direction by direction; monopoly MR, Q, P and profit by brute force; monopolistic
  competition entry or exit and the shift.
- graph-studio (1,200): every scenario's shift (curve and direction) read against standard comparative statics;
  outcome and shift-or-movement choices recomputed; plus all 75 scenarios and 13 drill contexts read by hand.

Result: 4,000 problems, 0 key errors. Every string in each data and model file was also read (scenarios, Why and
Details text, slips, options and their explanations).

## Fixes, by tool

### graph-studio
- Labels solution printed "the firm's demand curve (d = MR = AR = P) (d = MR = AR = P)" and "demand (marginal
  private benefit) (D = MPB)": `math/graph-studio.js` `solutionOf` now drops a repeated symbol and merges into one
  parenthesis.
- Plural goods broke the grammar: "Incomes rise, and bicycles is a normal good"; "when bike helmets costs more, people
  want less bicycles"; "buyers buy more of it". Reworded in `data/tools/graph-studio.json` (sd-income, sd-comp,
  sd-along-d, sd-along-s) so they read right for every good.
- Workaround removed: the local PPC "on" point move in `keyResponse` (the engine places point labels now). The test's
  "on the curve" check still passes.

### surplus-lab
- Bug: Explore threw `ApMicroCalc.incidence: buyers must pay more than sellers keep` while the tax animation grew
  from $0 (console error). `math/surplus-lab.js` skips the split until the tax is above zero.
- Bug: the policy chips never showed which policy was on once the studio moved them into the dock (Tax stayed
  highlighted while a tariff was drawn; `aria-pressed` wrong for screen readers). Now queried in the dock too.
- Bug: no "Start here" cue on landing (the hint looked for the policy row where it no longer was). Fixed.
- Incidence drill: hints and wrong-answer notes printed "Qs = 0 + 3(P − 8)", "−40" as "-40", "84 − 1P". Equations
  now written as the stem writes them.
- Workaround removed: `spreadMarks` and its MutationObserver (engine spreads marks).

### elasticity-lab
- Bug: the Price, Income, Cross-price chips kept "Price" pressed after switching view (same dock cause). Fixed.
- Workarounds removed: `demandSvg` regular expressions (now the engine's `demand` kind) and the hand-placed D1, D2
  labels and arrow in the shift view (engine labels; looked at, clean).
- Kept on purpose: `spreadMarks`. The marks it spreads ($ and Q for A, B and the intercepts) are drawn by this tool,
  not the engine, so the engine's spreading does not reach them.
- The "Elastic / |Ed| > 1" two-line labels touched at 360: line gap 14 to 16.

### cost-lab
- The "fixed" drill stems read badly: "The town adds a yearly license fee, the same whatever the firm makes, of
  $20", "puts a per-unit tax on each item the firm sells of $3 a phone case", "buys insurance it must pay whatever it
  makes, costing $40". Rewritten (`LUMP`, `PER` in `math/cost-lab.js`).
- Phone layout: in Test yourself the graph (380 px basis) sat beside the table and the centered row overflowed the
  360 px stage to the left, cutting off the graph. `cost-lab.css` stacks them under 640 px.

### firm-market
- Same phone layout bug as cost-lab (graph off the left edge, area buttons unreachable). `firm-market.css` stacks.
- Workarounds removed: `declutter()` (line label is placed first by the engine), the S relabel regex (now
  `curveN0: '1'`), the MR1 removal regex (now `followerOld: false`).
- Kept: the long-run D2 relabel regex. Demand is drawn unshifted in the long-run view and the engine has no number
  for an unshifted curve. A `state.curveNs: { D: '2' }` option would remove it.

### game-lab
- No problems found. Explore games re-derived by hand (price war a dilemma, advertising one dominant strategy,
  standard two Nash, sale week none, and with the tax or subsidy slider).

### factor-lab
- Least-cost drill could say "the last worker hired adds 62.5 loaves": marginal products are now whole numbers.
- Monopsony drill allowed the competitive hire to be the last table row (8 of 8), so "a competitive market would
  hire 8" could not be checked from the table (12 of 40 problems). Now the competitive count is inside the table.
- Workaround removed: the blank monopsony point label. It reads "Hire", with W_M and L_M marked on the axes (marks
  left off when a binding minimum wage sets the wage).

### externality-lab
- Economics: "Which policy moves the market to the efficient quantity?" had two defensible answers (a per-unit tax
  on consumers of a negative production externality also reaches the efficient quantity; incidence does not depend
  on who pays). Now asks for the policy "aimed at the side of the market that creates the externality", and the
  other-side option's explanation says it would also work but is not what was asked.
- "gives an external benefit of $8 on people" is now "to".
- DWL drill: the graph has no tick numbers, so the efficient quantity could not be read; the stem now states it.
- Public goods Explore said "Efficient: 0 streetlights, the last one whose summed benefit covers its $80 cost". Now
  "none. Even the first streetlight's summed benefit is below its $80 cost."
- Workaround removed: E* hidden when a policy is on (engine keeps point labels apart).

### Shared engine `microeconomics/assets/mic-graph.js` (real bugs, cosmetic)
1. Label width was estimated at 7.4 px a character; measured 9 (MC 20 px, AVC 27 px at 13 px bold), so curve labels
   could touch (cost-lab MC2 and ATC2). `box()` now uses 9 and 6 for subscripts.
2. Area letters ignored a curve drawn across their cell (letter d sat on S + tax inside the tax revenue rectangle).
   Shifted curves are now obstacles for letters, and each placed letter is one for the next.
3. Vertical axis marks were spread 13 px apart while a mark with a subscript is about 15 px tall (PW + t on PE).
   Now 15.

After these: `apmicro-graph.test` passes, content check 0 failing, the 75 Graph Studio scenarios and 11 free graphs
show no overlapping label (Playwright text-box scan), Macro byte-identical.

## Hands-on (Playwright, Chromium, build in `/tmp/mic-tr` with every chapter published, port 8850)

Scripts: `s/walk.mjs` (landing, Tab sweep, every Explore control and select option, sliders, Why and Details,
every drill kind walked to the end with a wrong first try and Show the answer, a text-box overlap and clipping scan
after each action, console errors, horizontal scroll, Keep going at the end), `s/gate.mjs` (Premium stub),
`s/land.mjs`, `s/act.mjs`.

- 1280 light and dark, all eight tools: every drill kind reached the end (Graph Studio all 40 context and kind
  pairs), Keep going present, no console error after the fixes, no horizontal scroll, every visible control reached
  by Tab.
- 360 light and dark: landing, Explore sweep and sheets for all eight, no horizontal page scroll (chip rows scroll
  inside themselves); drills finished for game-lab, elasticity-lab, surplus-lab, graph-studio. In cost-lab and
  firm-market the walker could not finish later kinds because the Explanation bottom sheet opens over the step after
  Show the answer; the steps themselves were checked at 1280 and the phone layout bug above was found and fixed here.
- Remaining small overlaps the scan reports at 360 are text boxes touching, not ink (QSUB and QE, QD2 and QD1 in a
  tariff, E1 and E2 when the long run returns to the same point); looked at, readable.
- Start here: present on landing for all eight (on a phone it appears when the control scrolls into view, by
  design).
- Premium (stubbed `LevlPremium`, course locked): surplus-lab, cost-lab, firm-market, factor-lab, externality-lab
  show the gate; graph-studio Explore and the PPC and supply-and-demand drills free, other graphs' drills gated with
  "Practice supply and demand"; elasticity-lab and game-lab free. Matches spec section 6.
- Covers: eight SVGs in `assets/covers/tools/apmicro/`, all listed in `index.json` and shown on `tools.html`.

Screenshots looked at (in `/tmp/mic-rv/png/`): `r2/game-lab-*` (landing, Explore with subsidy, drill ends),
`r3/surplus-lab-1280-light-01,04,13`, `r3/cost-lab-1280-light-05`, `r3/externality-lab-1280-dark-03`,
`r3/externality-lab-1280-light-10`, `r3/graph-studio-1280-light-20`, `land-factor-lab-1280-light`,
`land-surplus-lab-*`, `act-el-income`, `gate-graph-studio`, `gate-surplus-lab`, `dbg-3`,
`r5/surplus-lab-360-light-12`, `r5/elasticity-lab-360-light-01`, `r7/firm-market-360-light-07,09`.

## For the lead (shared, not changed)
- `assets/course/tool-studio.js`: the Why and Details sheet is `aria-modal` but focus stays on the button that
  opened it, so Escape does not close it (its keydown listener is on the sheet). Same in Macro. Focus the sheet (or
  its close button) on open.
- Page titles say "Surplus lab", "Cost lab" while covers and `index.json` say "Surplus and Policy Lab", "Cost Curve
  Lab": pick one.
- `firm-market` long run: an engine option to number an unshifted curve would retire the last relabel regex.

## For a teacher to read
- firm-market long run assumes a constant-cost industry ("the same price as before"); the right-answer explanation
  says so, the question does not.
- externality-lab policy question now names the side that creates the externality; check the wording suits you.
- Graph Studio's 75 scenarios and 13 check questions, and the game-lab stories (payoffs in thousands of dollars), were
  all written for the tools and read as correct here.
