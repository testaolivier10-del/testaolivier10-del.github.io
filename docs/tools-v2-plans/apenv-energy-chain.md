# AP® Environmental Science, Energy chain: tools v2 plan

**Tool and page:** `environmental-science/tools/energy-chain.html`; scripts `assets/tools/energy-chain.js`,
`math/energy-chain.js`, `energy-chain.css`; data `data/tools/energy-chain.json`; test
`scripts/test/apenv-tool-energy-chain.test.mjs`. **Premium.** Rollout row 67, group P, wave 10 (restyle size).

**The one idea:** energy is lost as heat at every conversion step, so the source and the number of steps decide how
much reaches your outlet. Two tabs:
1. Energy flow: follow 100 units from the fuel (or wind, sun, water) to the outlet (CED 6.5 to 6.12,
   6.13).
2. CO₂: the same electricity puts out very different CO₂ by source (6.5, 6.13, 9.4; trap: natural gas is not zero
   emissions).

**Research:**
- [PhET Energy Forms and Changes](https://phet.colorado.edu/nl/simulations/energy-forms-and-changes): energy chunks
  flow from source to converter to user, heat leaves at each step. Take: energy as chunks that physically move and
  peel off as heat.
- [LLNL Energy flow charts](https://flowcharts.llnl.gov/) (Sankey diagrams of US energy): band widths for useful
  and rejected energy. Take: widths to scale and "rejected energy" named.
- EIA Electric Power Annual (table 8.1, heat rates): the numbers the model uses. Take: the per source efficiency.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Energy flow, Compare | Explore: two tabs (Energy flow, CO₂) |
| Power source buttons (coal, natural gas, nuclear, hydro, wind, solar) | Both tabs: tap the plant on the landscape (main on tab 1 is the drag below; the source is a tap) |
| Tap a step of the chain (Boiler, Steam turbine, Generator, Power lines, ...) | Tab 1: drag the energy packet along the chain (main); a tap on a step names it |
| Measure chips CO₂ per kWh, Efficiency, Capacity factor | Tab 2 shows CO₂ per kWh; capacity factor and following demand move to "?" (a table) and Test yourself (logged) |
| "Electricity used at home" slider (100 to 2,000 kWh) | Tab 2: the main control, a meter on the house |
| Appliances (LED and incandescent bulb, TV, laptop, fridge, space heater) | Tab 1: the device at the outlet, a quiet tap |
| Drills chain, fuel, heatrate, co2, power; contexts `chain`, `fuel`, `co2`, `power` | Test yourself, unchanged; ids `energy-chain:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Energy flow: a landscape from a coal pile or gas well (or a dam, wind turbine, solar panel) to the plant, the
  power lines across the hills, and a house with a lamp. Main control: drag a gold packet of 100 units along the
  chain. At each step the packet shrinks and vermillion heat rises off that step, drawn to the same measure as the
  packet (the Energy flow tool's "one measure per step" rule); the step's name and efficiency appear as the packet
  passes. Cause line: "100 units of coal → boiler 88 → turbine and generator 35 → lines 33 → lamp 3 light".
  Takeaway: "Each step keeps only part; the rest leaves as heat."
- CO₂: the six plants on one landscape, each with a stack or none; drag the house's meter: each plant's CO₂ for
  that electricity rises as drawn smoke bags stacked by the plant (lifecycle CO₂ for the clean sources drawn small,
  never zero). Cause line: "900 kWh → coal about 0.9 t CO₂, gas about 0.4 t, wind almost none".
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify:** heat rates (EIA Electric Power Annual 2024 table 8.1: coal 10,777, natural gas 7,754,
nuclear 10,443 BTU/kWh; 3,412 BTU per kWh); transmission and distribution losses about 5% (EIA FAQ); CO₂ per kWh
from combustion (EIA "How much CO₂ is produced per kWh"); lifecycle medians for wind, nuclear, hydro, solar (IPCC
AR5 WGIII Annex III, or NREL LCA harmonization); efficiency of LED vs incandescent bulbs (DOE). Traps: natural gas
is not zero emissions; nuclear fuel is uranium, not steam.

**Reuse:** APES kit2; `K.handle` along the chain path, `K.tap` (sources, devices), `K.drag` (meter), `K.cause`; the
APES Energy flow tool's heat wisp drawing and its sweep check (heat equals what the step loses). Not the first
APES tool on kit2.

**Risks reviewers will likely block on:** a Sankey look can read as a bare chart (rule 12: the chain must run
through drawn plants, lines and a house); heat drawn not to the same measure as the packet; renewable CO₂ drawn as
zero; six plants on a 360 px landscape too small to tap (a horizontal scroll strip is not allowed; use a two row
layout or a source picker on the picture); numbers in the cause line from the target, not the drawn packet, mid
drag.
