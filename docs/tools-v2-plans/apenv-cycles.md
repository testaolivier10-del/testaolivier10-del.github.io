# AP® Environmental Science, Biogeochemical cycles: tools v2 plan

**Tool and page:** `environmental-science/tools/cycles.html`; scripts `environmental-science/assets/tools/cycles.js`,
`math/cycles.js`, `cycles.css`; data `environmental-science/data/tools/cycles.json` (served copy
`assets/tool-data/cycles.json`); test `scripts/test/apenv-tool-cycles.test.mjs`. **Free.** Rollout row 31, group X
(explorers), wave 2 in the rollout order; the cheapest course layer (the flagship's).

**The one idea:** an atom is never used up: it moves between reservoirs by named processes, and people speed some
flows. One idea per tab, one tab per cycle (each is its own CED topic, 1.4 to 1.7):
1. Carbon: burning stored carbon moves it to the air faster than plants and the ocean take it back.
2. Nitrogen: bacteria turn N₂ step by step into forms plants can use, and back.
3. Phosphorus: no gas phase, so it moves slowly from rock to soil to water and sediment.
4. Water: the sun lifts water up, gravity brings it back down.

**Research:**
- [dmccreary, Carbon cycle sim](https://dmccreary.github.io/ecology/sims/carbon-cycle/) and
  [Biogeochemical cycles](https://dmccreary.github.io/biology/sims/biogeochemical-cycles): reservoirs as boxes with
  flux arrows and sliders in a panel. Take: flux numbers on the arrows; improve: reservoirs drawn as the real places.
- [Lawrence Hall of Science, Simulating changes in the carbon cycle](https://lawrencehallofscience.org/environmental-learning/instructional-library/climate-simulation-activities-simulating-changes-in-the-carbon-cycle/):
  students move tokens between reservoirs and change a human flow. Take: the atom as a token that travels.
- [CLEAN carbon cycle activity (Excel model)](https://serc.carleton.edu/clean/community/activities/carboncycle_excel.html):
  years run forward after a change. Take: the time bar after a human change, read in GtC and ppm.

**Old tool inventory (origin/main):**
| Old | v2 |
|---|---|
| Four cycle chips (Carbon, Nitrogen, Phosphorus, Water) | Explore: four tabs (`K.tabs`) |
| Tap a process dot on an arrow: what moves, where, who does it | Explore: the main control (tap the arrow on the picture) |
| Human changes per cycle (Burn fossil fuels, Clear forests, Plant forests, Add fertilizer, Plant legumes, Mine phosphate fertilizer, Release sewage, Pave land, Pump groundwater, and the rest in `math/cycles.js`) | Explore: the actor drawn on the picture (power plant, chainsaw, fertilizer bag, pump), a quiet tap; at most two per tab, the rest in "?" and Test yourself |
| "Years since the change" slider (0 to 100), Pause, "Undo every change" | Explore: the kit time bar (`K.progress`) and Play; "Undo every change" stays as a small reset |
| More options (carbon budget in GtC and ppm) | "?" (the numbers table) |
| Drills: process, nitrogen, reservoir, human, budget, residence | Test yourself, unchanged |
| Contexts `carbon-proc`, `carbon-budget`, `nitrogen-order`, `nitrogen-proc`, `phosphorus-proc`, `water-proc`; partTopics `n2` to `n5`, `who` | Test yourself; record ids `cycles:<context>:<step>` unchanged |
| `?seed=`, `#quiz`, Report (`tool:cycles`) | unchanged; add `?ch=nitrogen` etc. for the tabs |

**Design:** each tab is one landscape cut open, at flagship depth: sky band (the atmosphere), a forest and a field,
soil in cross section, a river to the ocean, sediments and rock layers (coal seam on the carbon tab, phosphate
rock on the phosphorus tab, an aquifer on the water tab). Reservoirs are the things themselves, each sized by its
amount (the air band's haze, tree canopy, soil darkness, ocean depth tint), named with 1 to 3 word pills.
Main control: tap a process arrow. A few drawn atoms (C, N, P or water drops, one color per element) leave the
source along the arrow and enter the sink; the source shrinks and the sink grows by the flow while they travel.
Nitrogen tab: the arrows run in order (fixation, ammonification, nitrification, assimilation, denitrification)
and the bacteria doing each are drawn at the root nodules and in the soil. Quiet second control: the human actor
on the picture; tapping it starts the time bar, and the air band (carbon), the lake's algae (nitrogen and
phosphorus) or the aquifer level (water) change over the years. Cause line, from the model's own numbers: "Combustion: fossil fuel → air, N GtC a year →
air rises to M ppm". Takeaway at the end of a run: "Carbon stored for millions of years
returns to the air in decades." Outside the picture: tabs, purpose line (about 8 words), Show me how, time bar
and Play, cause line: about 25 words, 4 controls.

**Science to verify:** reservoir sizes and flows (IPCC AR6 WG1 figure 5.12; Global Carbon Budget 2024 at
globalcarbonbudget.org), ppm per GtC (2.12 GtC per ppm), residence times (water: USGS Water Science School;
carbon: IPCC), the nitrogen steps and the bacteria (Nitrosomonas, Nitrobacter, Rhizobium, denitrifiers: OpenStax
Biology 2e 46.3), lightning fixation, phosphorus has no significant gas phase. Traps from the authoring guide:
"trees store carbon, not CO₂"; nitrogen fixation vs nitrification; a watershed vs an aquifer. Contested points go
in `docs/apenv-needs-author.md`.

**Reuse:** APES is already on kit2 (`"kit2": true` per page in `environmental-science/data/pages.json`; the tool
calls `K.on(s)` in its studio hook after `T.studioPane`, as `energy-flow.js` does). `K.tabs`, `K.head`, `K.cause`,
`K.progress`, `K.player`, `K.cue`; `K.spots` with `under(x, y)` (added on the brain map branch) for the arrows,
so a tap names the process drawn under the finger. Not the first APES tool on kit2.

**Risks reviewers will likely block on:** many arrows on a phone (keep at most 6 tappable processes per tab and
44 px targets; the rest in "?"); atom tokens leaving the drawn arrow or the reservoir (builder brief: particles
stay inside what contains them); reservoir sizes not matching the numbers in the cause line during a run; labels
under 11 px on the soil and rock layers at 360; the cause line growing to three rows with GtC numbers; four tabs of
scene code pushing the APES shell budget (86.7 KB) over: if so, its own weight bucket like A&P
`predict-explore`; every timer stopped when a tab or mode changes mid flow.
