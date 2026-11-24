# Plan: AP® Macroeconomics, Policy chain (tools v2)

## Tool and page
- Page `macroeconomics/tools/policy-chain.html`; scripts `macroeconomics/assets/tools/policy-chain.js` and `.css`,
  model `macroeconomics/assets/tools/math/policy-chain.js`, data `macroeconomics/data/tools/policy-chain.json`
  (contexts fiscal, monetary, open, crowding, selfadjust), validator `scripts/lib/apmacro-tool-checks/policy-chain.mjs`,
  test `scripts/test/apmacro-tool-policy-chain.test.mjs`.
- Premium (`premium: 'tools'`). Rollout row 115, group F (step and flow builders), wave 3. Use rank 115, 4 opens in 30 days.

## The one idea
Each link in a policy chain causes the next, all the way to output and prices. One screen, no tabs: the five
chains are one idea seen five ways (a quiet chain picker, as the calculus curve picker).

## Research
- Chair the Fed, Federal Reserve Bank of San Francisco ([frbsf.org](https://frbsf.org/?p=11507), activity notes
  [CTF_Activity_Introduction.pdf](https://www.frbsf.org/education/files/CTF_Activity_Introduction.pdf)): you pull one
  lever (the rate) and watch the economy answer over time. Take: one lever, then the consequences arrive in order.
- Brilliant (group F row): one step per screen, each step an action, feedback at once. Take: each link appears only
  when the one before it has happened, and stays on the picture.
- The integrated F tools on `claude/tools-v2-all`: NREMT flowcharts (`nremt/assets/flow-explore.js`) and A&P pathways
  (`docs/tools-v2-anp-pathways-brief.md`): how a built chain stays on the picture and how reviewers judged it.
- Seen only as search results so far (builder must open them): the Chair the Fed pages above.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Chain picker (Fiscal, Monetary, Open economy, Crowding out, Self adjustment) | Explore: quiet picker beside "Show me how" |
| Version switch (Spending or Taxes; Ample or Limited reserves) | Explore: a small switch on the building that acts (Capitol, Fed) |
| Direction switch (Expansionary or Contractionary; rates rise or fall; deficit bigger or smaller; gap) | Explore: the lever itself (up or down) |
| Next link stepper | Explore: the time bar (`K.progress`) with the link's name; Play beside it |
| Stations row: one ApMacroGraph per market reached, "?" for links not reached, old curve faded and dashed | Explore: the scene's buildings each hold their market's graph; old curve faint solid with subscript 1 |
| "Write it out": the "Make it specific" sentence graded by `ApMacroGrade.specific`, recorded `policy-chain:write:<family>` | Test yourself (it is graded), same record id |
| Own words box with `ApMacroGrade.flags` hints | Test yourself, after the sentence |
| Drill (`ApMacroTools.drill`, type picker "Chain", one problem per family, every link a graded choice, traps) | Test yourself unchanged, ids `policy-chain:<context>:<step>` |
| `?seed=` and `#quiz` deep links | Kept (`ApMacroTools.modes`) |
| Premium gate | Unchanged |

## Design
- Picture: a drawn small economy across the full stage, left to right: the Capitol and the Treasury, the Federal
  Reserve building, a bank with its vault, a building site with a crane (investment), a street of shops and homes
  (consumption), a harbour with ships (net exports), and the economy's skyline with its factory gate (output, jobs)
  and a shop price board (price level). Each market the chain touches is a framed graph hung on its building
  (reserve market on the Fed, money market on the bank, loanable funds on the Treasury, market for dollars at the
  harbour, AD-AS on the skyline), drawn by `ApMacroGraph.svg`.
- Main control: the policy lever on the acting building (`K.drag`, two way: up is the first direction word, down
  the other). Moving it starts the chain at once; the first link's curve shifts on its graph.
- What animates: a flow runs building to building along the street (money, a rate tag, crates); each building lights
  and its graph's curve glides when its link arrives and stays shifted. Unreached buildings are dim, never a "?" card.
  Scrubbing the time bar runs the chain forward and back exactly.
- Cause line (`K.cause`): the links so far with arrows, from the model's `chain(family, variant, dir).links`
  ("Fed raises IORB → policy rate up → borrowing costs up → investment down → AD left").
- Takeaway at the last link: one sentence naming the end on both axes ("Output and the price level fall").
- Outside the picture: purpose line (about 8 words), chain picker, Show me how, time bar with Play. About 25 words,
  3 controls.

## Science to verify
- Every link of all five chains in both directions and both versions against the authoring guide "Causal chains with
  every link" and `docs/apmacro-research/framework.md` section 5 (CED Units 3 to 6).
- Ample reserves: the Fed moves IORB and the ON RRP rate; a change in reserve supply in the flat range leaves the
  rate alone (guide "ample reserves", decision 7; check federalreserve.gov "Policy tools"). Limited reserves keeps
  open market operations on the money market graph; label which framework is on screen.
- Self adjustment: nominal wages and SRAS only, never AD or automatic stabilizers (the content check refuses it).
- Open economy: relative real interest rates, capital flows, demand for the dollar, appreciation, net exports down.
- Crowding out: deficit, DLF right (or SLF left: `key.alt`), real rate up, investment down, capital stock, growth.

## Reuse
- First Macro tool on kit2 if built in rollout order (wave 3): it adds `ApMacroTools.studioKit2` to `mac-tools.js`
  (copy `ApCalcTools.studioKit2`, `calculus/assets/tools/calc-tools.js`, and its call in `modes`) and the `t.kit2`
  branch in `scripts/build-apmacro.mjs` tool page template (lines 984 to 985; copy `build-apcalc.mjs` 1060 to 1061).
  Only this page's output changes.
- No `K.steps` exists in the kit: reuse the flowcharts or pathways step pattern; if lifted into the kit, it is opt in.
- `ApMacroGraph.svg` with `state.n0`, `n1`, `curveN`, `px`, `py`, `BOX` for anything drawn over a graph.

## Risks reviewers will likely block on
- Five small graphs on one stage: text under 11 px at 360 to 430. On a phone show only the current building's graph
  large, the others as lit icons; measure rendered label size in the sweep.
- Labels: every curve named with subscripts, the framework named, axes exact (policy rate, not interest rate).
- The scene and the cause line must never be ahead of the drawn shift (derive from the drawn frame).
- Weight: the scene SVG in the tool's own file, not in `mac-graph.js` (course shell budget, `check-weight.mjs`).
- Byte identical: `node scripts/build-apmacro.mjs --check` clean; other Macro pages unchanged; Micro not touched.
