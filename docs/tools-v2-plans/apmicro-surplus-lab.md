# Plan: AP® Microeconomics, Surplus lab (tools v2)

## Tool and page
- Page `microeconomics/tools/surplus-lab.html`; scripts `microeconomics/assets/tools/surplus-lab.js` and `.css`, model
  `microeconomics/assets/tools/math/surplus-lab.js`, data `microeconomics/data/tools/surplus-lab.json` (contexts
  surplus, controls, taxes, subsidies, trade).
- Premium. Rollout row 145, group E, wave 24. 2026-11-10 review: LEAVE (areas and chips correct); v2 puts the policy on
  the picture and draws the market.

## The one idea (three tabs)
1. Price controls: a binding ceiling or floor moves surplus between buyers and sellers and leaves a deadweight loss.
2. Tax and subsidy: a wedge between the price buyers pay and sellers receive shrinks (or overshoots) the efficient
   quantity, with a deadweight loss.
3. Trade: a world price below the domestic price helps buyers more than it hurts sellers; a tariff takes part back.

## Research
- MRU consumer and producer surplus interactive practice ([mruniversity.com](https://mruniversity.com/teacher-resources/active-learning/consumer-and-producer-surplus-interactive-practice),
  search result only). Take: the areas named in their own color.
- EconGraphs surplus graphs ([econgraphs.org/topics/competition](https://www.econgraphs.org/topics/competition/)):
  drag the tax or price line, the areas follow.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Policy picker (no policy, ceiling, floor, tax, subsidy, world price, tariff) and one level slider | Explore: three tabs; in each, the policy line or wedge dragged on the graph is the main control; a quiet switch picks ceiling or floor, tax or subsidy, free trade or tariff |
| Areas colored by the model's partition; value chips under the graph; tap a chip or area to show it alone | Explore: tap an area to show it alone; the value sits on the area (no chips row) |
| Numbers in chips, caption and Details | On the areas, the cause line, and "?" |
| "Who pays a tax" (incidence by elasticity, a linear market of its own) | Tab 2: quiet "steepness of demand" knob (a connected control: incidence follows elasticity) |
| Drill kinds surplus, control, tax, incidence, subsidy, trade, tariff; shade steps on the stage | Test yourself unchanged, ids `surplus-lab:<context>:<step>` |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Picture: an iced tea stand market (a bottle a unit, $2 a graph step): buyers in a line ordered by what they would pay
  (each holding a sign with their top price), sellers' stands ordered by cost. Buyers who buy hold a bottle; those
  priced out walk away; a buyer's surplus is drawn as change in hand (their sign minus the price). The graph's CS, PS,
  revenue and DWL areas use the same colors as the scene's people.
- Tab 1: drag the price line (ceiling below equilibrium or floor above): shortage or surplus drawn as empty hands or
  unsold bottles; DWL triangle shaded.
- Tab 2: drag the tax wedge (the shifted supply): the tax collector's jar fills with revenue (the rectangle); quiet
  steepness knob shows who pays more.
- Tab 3: drag the world price: imported bottles arrive by truck; quiet tariff knob.
- Cause line: "Tax $2 → buyers pay $7, sellers get $5 → 4 fewer bottles → DWL $4".
- Outside the picture: tabs, purpose line, Show me how. About 25 words.

## Science to verify
- Every area's edges (authoring guide "Shade the right region"): subsidy cost is the whole rectangle out to the new
  larger quantity; DWL after a subsidy beyond the efficient quantity; tax revenue at the after tax quantity.
- Binding ceiling below and floor above equilibrium only; nonbinding ones change nothing.
- Incidence: the less elastic side pays more; the engine's equal slopes vs the incidence market (`slopes` option).
- Tariff revenue and DWL triangles; world price gains (`world`, `tariff` policies).

## Reuse
- `K.curve` (line and wedge drags), `ApMicroGraph` `sd-micro` with `policy` and `areas()`; the model's partition.
- Not the first Micro kit2 tool in rollout order.

## Risks reviewers will likely block on
- Area values on small areas at 360 px (a DWL triangle too small for its label: place the value outside with a leader).
- People counts equal to the drawn quantities at every frame.
- Every area's color the same in the scene and the graph (one color per idea).
- Byte identical: `build-apmicro --check` and `build-apmacro --check`.
