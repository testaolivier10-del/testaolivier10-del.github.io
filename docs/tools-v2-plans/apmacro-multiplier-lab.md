# Plan: AP® Macroeconomics, Multiplier lab (tools v2)

## Tool and page
- Page `macroeconomics/tools/multiplier-lab.html`; scripts `macroeconomics/assets/tools/multiplier-lab.js` and `.css`,
  model `macroeconomics/assets/tools/math/multiplier-lab.js`, data `macroeconomics/data/tools/multiplier-lab.json`
  (contexts spending, gap, money).
- Premium. Rollout row 132, group P (parameter simulator), wave 19 (rides with the Macro E wave). Three lessons.

## The one idea (three tabs)
1. Multiplier: each round of spending is the last round times the MPC; the rest leaks to saving.
2. Close a gap: divide the gap by the multiplier, direction first.
3. Money: a bank lends its excess reserves and the loan comes back as the next bank's deposit.

## Research
- Money multiplier sim, D. McCreary ([dmccreary.github.io](https://dmccreary.github.io/economics-course/sims/money-multiplier/))
  and the money creation tool ([ihelfrich.github.io](https://ihelfrich.github.io/macroprep/interactive/money-creation-tool.html)),
  search results only: banks in a row. Take: the deposit, reserve, loan loop drawn as movement.
- PhET style (group P row): the setting on the picture, instant response.
- Nicky Case explorables (group P row): a chain of rounds you can watch and replay.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| View switch Multiplier, Close a gap, Money | Explore: three tabs |
| MPC chips (`ML.MPCS`) | Tab 1: main control, drag the split on the first banknote (MPC) |
| The change: purchases rise or fall, tax cut or rise, both rise; Purchases or Taxes; size ($ billion) | Tab 1: quiet change picker and size knob |
| Cascade: rounds of income split into spent and saved, Saved tank | Tab 1 picture |
| Gap kind (recessionary, inflationary), gap size, policy tool and amount; AD-AS graph and gap meter | Tab 2 |
| Money: scenario (buy from a bank and others), reserve ratio, banks in a row, balance sheet, money market | Tab 3; balance sheet to "?" |
| Drill kinds multiplier, total, gap, money | Test yourself unchanged, ids `multiplier-lab:<context>:<step>` |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Tab 1: a street of shops and people. The first government purchase is a banknote handed to a builder; the builder
  spends the MPC share at the next shop and drops the rest into a savings jar; the shopkeeper passes on the MPC share,
  and so on down the street, each note visibly smaller. The jars fill; the running total of new spending is on a
  banner. Drag the split on the first note to change the MPC; every round changes. A tax change starts with income
  that is not yet spent (the first round only MPC of it).
- Tab 2: AD-AS with a visible gap (the gap drawn wide enough to read: scale the stage so 50% closed is plain).
  Drag the policy amount (a lever on the Capitol); AD shifts by amount × multiplier; the gap meter closes exactly at
  gap ÷ multiplier and overshoots past it.
- Tab 3: banks in a row; a deposit lands, the reserve stays in the vault, the loan walks to the next bank; drag the
  reserve ratio on the first vault; the total new money banner follows.
- Cause line: "MPC 0.8 → multiplier 5 → $20B → $100B of spending". Outside the picture: tabs, purpose line, Show me how.

## Science to verify
- Spending multiplier 1 / MPS; tax multiplier −MPC / MPS; balanced budget 1 (needs-author `balanced-budget`); money
  multiplier 1 / rrr applied to excess reserves; limited reserves only (label it).
- Divide the gap, direction first (guide "Multiplier math"); the overshoot shown when multiplying.
- The cascade's rounds sum to the multiplier times the injection (finite rounds drawn; "and on" label honest).
- Four function friendly values: MPC 0.5, 0.75, 0.8, 0.9; rrr 0.1, 0.2, 0.25 (`ApMacroCalc` recipes).

## Reuse
- `K.drag` (flagship) for the split, lever and ratio; `ApMacroGraph` `adas` and `money` kinds; drill unchanged.
- Not the first Macro kit2 tool in rollout order.

## Risks reviewers will likely block on
- Drawn note sizes, jar levels and totals must match the model frame by frame; small late rounds must stay readable
  or be grouped honestly.
- Three tabs of motion: every timer stops on a tab switch.
- Phone: the street wraps into two rows without clipping.
- Byte identical: `build-apmacro --check`.
