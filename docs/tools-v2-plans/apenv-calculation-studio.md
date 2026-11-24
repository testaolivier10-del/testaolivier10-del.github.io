# AP® Environmental Science, Calculation studio: tools v2 plan

**Tool and page:** `environmental-science/tools/calculation-studio.html`; scripts
`assets/tools/calculation-studio.js`, `math/calculation-studio.js`, `calculation-studio.css`; graders in
`environmental-science/assets/env-grade.js` and `env-tool-math.js`; data `data/tools/calculation-studio.json`; test
`scripts/test/apenv-tool-calculation-studio.test.mjs`. **Free.** Rollout row 68, group C (calculators and drills),
wave 7.

**The one idea:** set up a calculation by cancelling units step by step until only the unit you want is left. One
screen, no tabs (the exam's setup point; CED math skills). Twin of AP Chem Units and significant figures, which is
integrated: same mechanism, different scenes (owner: similar tools stay separate).

**Research:**
- AP Chem Units and sig figs v2 (`docs/tools-v2-units-sig-figs-brief.md`, integrated): cards on a bench fly onto a
  whiteboard chain, cancelled units strike through. Take: the whole mechanism, and its review fixes.
- [dmccreary, Dimensional analysis practice](https://dmccreary.github.io/chemistry/sims/dimensional-analysis-practice):
  tray of factor tiles, cancelled units turn green with a strike. Take: tiles from a tray; improve: real scenes.
- [The Physics Classroom, Factor label method](https://www.physicsclassroom.com/Chemistry-Tutorial/Measurement-and-Units/Factor-Label-Method):
  worked chains, one factor at a time. Take: the order of factors written left to right as the exam setup.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Scenario buttons Power plant, Commute, Household water, Lighting (`S.CHAINS`) | Explore: four scenes, a quiet tap on the picture (a strip of four small scene icons); not tabs, since they teach the same idea |
| "Start" slider per scenario (kWh, mi/yr, gal/day, bulbs) | Explore: a quiet knob on the starting thing (the meter, the odometer, the tap, the bulbs) |
| Tap a factor tile to snap it on the chain; × to remove; Undo; Start over | Explore: the main control (tap a card); Undo and Start over stay as small controls |
| Setup box typed in Bluebook style (numbers, × ÷, units) with forgiving parse | Test yourself, unchanged |
| 18 calculation types (`S.TYPES`: percent change, percent of, rule of 70, growth, projection, 10% rule, NPP, half life, conversions, per capita, efficiency, cost, emissions, LD50, biomagnification, TFR, water per area, scale words) and 39 contexts | Test yourself, unchanged; ids `calculation-studio:<context>:<step>` |
| `?seed=`, `#quiz` | unchanged |

**Design:** each scene is the real situation at flagship depth: a coal plant with its coal train and stack (from kWh
to tons of coal to tons of CO₂), a commuter car on a road (miles to gallons to pounds of CO₂ to dollars), a house
with a water meter and a garden (gallons per day to liters per year), a ceiling of bulbs (incandescent to LED:
watts, hours, kWh, dollars saved). The chain board sits on the picture (a clipboard on the plant's fence, a sticky
note on the car's dashboard). Main control: tap a factor card from the small deck on the picture; it flies onto the
chain, the matching units strike through as it lands, and the scene shows the quantity reached so far (the coal
pile grows to the tons computed, the CO₂ cloud fills to its mass). A card that cannot cancel lands tilted and its
unit stays bold (an honest, ungraded result; no Check in Explore). Cause line: "5,000,000 kWh × 10,777 BTU/kWh ÷
24,000,000 BTU/ton → about 2,200 tons of coal". Takeaway when only the wanted unit is left: "Only tons are left:
the setup is done." Outside the picture: purpose line, Show me how, Undo, Start over, cause line: about 25 words,
4 controls.

**Science to verify:** every factor in `S.CHAINS` with its source in "?": heat rates (EIA Electric Power Annual
2024 table 8.1), BTU per ton of coal (EIA), lb CO₂ per gallon of gasoline (EIA: about 19.6), CO₂ per kWh, gallons
to liters 3.785, kWh per bulb hours and electricity price (EIA average residential price with its year). Every
calculation key recomputed by code (spec rule). Authoring guide: thousands commas, units after a space, scale words
spelled out, no em dashes.

**Reuse:** APES kit2; the chain mechanism from AP Chem Units and sig figs. The rollout plan names this the moment to
lift the chain into the kit as `K.setup` (cards that snap into a chain, units striking through, forgiving number and
unit input) so both tools share it; doing that touches the Chem tool, so its sweep and `scripts/check-weight.mjs`
(kit2 bucket 34 KB, about 1 KB headroom) must pass again. If the lift costs too much weight, keep a course copy and
log it. Not the first APES tool on kit2.

**Risks reviewers will likely block on:** long chains (four factors) not fitting one row at 360 (wrap to two rows,
never shrink text under 11 px); unit strikes on the wrong unit when a card is flipped; the scene quantity drawn
from the final answer instead of the chain so far; a wrong card in Explore reading as "graded" (no red, no cross:
just the unit left standing); the shared kit change breaking the Chem tool; the kit2 weight budget.
