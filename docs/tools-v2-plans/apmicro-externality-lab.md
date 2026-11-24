# Plan: AP® Microeconomics, Externality lab (tools v2)

## Tool and page
- Page `microeconomics/tools/externality-lab.html`; scripts `microeconomics/assets/tools/externality-lab.js` and
  `.css`, model `microeconomics/assets/tools/math/externality-lab.js`, data `microeconomics/data/tools/externality-lab.json`
  (contexts mill, flu, bees, music, lights, fireworks).
- Premium. Rollout row 141, group E, wave 24. Two lessons (rollout "Might be split": 2).

## The one idea (two tabs)
1. Externalities: the market makes the wrong quantity; a tax or subsidy equal to the external cost or benefit per
   unit moves it to the efficient quantity and the deadweight loss disappears.
2. Public goods: the social benefit of a public good is the sum of everyone's benefit, and each alone buys too little.

## Research
- EconGraphs externality graphs ([econgraphs.org/topics/competition](https://www.econgraphs.org/topics/competition/)).
  Take: drag the tax, the loss triangle shrinks.
- Federal Reserve Education, externalities lesson ([federalreserveeducation.org](https://www.federalreserveeducation.org/resources/lessons/lesson--externalities.pdf),
  search result only) for how the exam's story is told.
- PhET (scene style, group P row): the pollution is drawn, not a number.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Externality type (negative and positive, production and consumption; contexts mill, flu, bees, music, fireworks) | Tab 1: quiet context picker |
| External cost per unit slider (moves the social curve) | Tab 1: quiet knob on the smoke or the benefit |
| Corrective tax or subsidy slider (moves the private curve, old one faded), DWL shrinks and reopens past it, "S + tax" label | Tab 1: main control, drag the private curve (`K.curve`) |
| E* marked, DWL shaded by the engine | Kept |
| Public goods: street lights, three residents' MB stacked into MSB steps against MC; together vs each alone (free rider) | Tab 2 |
| Cost of each streetlight slider | Tab 2: quiet |
| Drill kinds quantity, dwl, fix, public | Test yourself unchanged, ids `externality-lab:<context>:<step>` |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Tab 1 (mill): a paper mill on a river upstream of a town. Smoke and dirty water grow with the drawn quantity; the
  town's fishers and swimmers leave as it grows. Graph: `externality` kind with D = MSB, S = MPC, MSC above, E market
  and E* efficient, DWL shaded. Drag the private supply up (the tax): the mill makes less, the river clears to the
  efficient level, the triangle shrinks to nothing at tax = external cost and reopens beyond it. Other contexts get
  their own scene (a clinic for flu shots, an orchard with bees, a speaker for loud music, fireworks over a town).
- Tab 2: a street at night; drag the number of street lights; three residents' benefits stack into the MSB steps
  against MC; a quiet "each alone" switch shows each resident buying for themselves (fewer lights: the free rider).
- Cause line: "Tax $3 = external cost $3 → quantity 6 = efficient → no deadweight loss".
- Outside the picture: tabs, purpose line, Show me how. About 25 words.

## Science to verify
- Market quantity where MPB = MPC, efficient where MSB = MSC; which is larger per type; DWL between them
  (authoring guide "Market vs efficient quantity").
- Pigouvian tax equal to marginal external cost at the efficient quantity (constant gap in the model); subsidy for
  positive externalities on the right side (producer or consumer).
- Public goods: nonrival and nonexcludable; MSB is the vertical sum of individual MB; the free rider.
- The pollution and town response are illustrative: say so in "?" (no invented numbers).

## Reuse
- `K.curve` for the private curve; `ApMicroGraph` `externality` with `showLabel`, `areas()` following the shown shift.
- The 2026-11-10 review: public goods as horizontal bars did not look like the exam's graph; draw the upright steps.
- Not the first Micro kit2 tool in rollout order.

## Risks reviewers will likely block on
- "S + tax" and MSC labels colliding when the tax equals the gap (curves coincide: label once, both names).
- Scene pollution proportional to quantity; never ahead of the drawn curve.
- Five context scenes: weight; draw shared parts once.
- Byte identical: `build-apmicro --check` and `build-apmacro --check`.
