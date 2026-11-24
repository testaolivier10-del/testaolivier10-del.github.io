# AP® Environmental Science, Climate change: tools v2 plan

**Tool and page:** `environmental-science/tools/climate-change.html`; scripts `assets/tools/climate-change.js`,
`math/climate-change.js`, `climate-change.css`; data `data/tools/climate-change.json`; test
`scripts/test/apenv-tool-climate-change.test.mjs`. **Premium.** Rollout row 41, group P, wave 10.

**The one idea:** the tool's own intro says it: two problems students mix up. Four tabs, one idea each:
1. Greenhouse: more CO₂ traps more of the heat the ground sends up (CED 9.3, 9.4).
2. Ozone layer: CFCs break ozone high up and let more UV through; CO₂ does not (9.1, 9.2).
3. Ocean pH: the ocean absorbs CO₂ and turns more acidic; shells get harder to build (9.7).
4. Sea level: land ice and warmer water raise the sea; floating ice does not (9.5, 9.6).

**Research:**
- [PhET Greenhouse Effect](https://phet.colorado.edu/en/simulations/greenhouse-effect) (found through the PhET
  climate search): sunlight photons pass, infrared photons are caught by gas molecules, a thermometer climbs.
  Take: the two kinds of light drawn differently; the thermometer on the picture.
- [NASA SVS](https://svs.gsfc.nasa.gov/) ozone hole and sea level visualizations (text and stills): the ozone hole
  over Antarctica by year. Take: real dates on the CFC control (before 1930, 1990s peak, recovering now).
- [En-ROADS (Climate Interactive and MIT Sloan)](https://en-roads.climateinteractive.org/): one change moves the
  temperature graph at once. Take: the instant result of one change and the named "before" value; avoid its many
  sliders in a panel.

**Old tool inventory:**
| Old | v2 |
|---|---|
| View buttons Greenhouse, Ozone layer, Ocean pH, Sea level | Explore: four tabs, `?ch=` deep links |
| "CO₂ in the air" slider (280 to 1200 ppm) | Tab 1: drag the smokestack's plume (main); value pill "420 ppm" |
| "CFC use" slider; presets "Before 1930: none", "1990s peak", "Today: recovering" | Tab 2: drag the spray can and fridge output (main); the three presets as named ticks on its track |
| Ocean CO₂ slider; presets "280 ppm", "Doubled: 560 ppm", the year buttons | Tab 3: drag the CO₂ in the air above the sea (main); presets as ticks |
| "Ocean warming (top 700 m)" and "Greenland ice sheet melted" sliders, "Melt the floating sea ice" | Tab 4: tap an ice to melt (sea ice or Greenland, main); ocean warming a quiet knob on a thermometer in the water |
| Drills gases, co2, ph, sealevel, gwp; contexts `two-systems`, `ozone-class`, `keeling`, `landfill`, `fertilized-farm`, `oyster-farm`, `coral-reef`, `warming-ocean`; partTopic `g2` | Test yourself, unchanged; ids `climate-change:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Greenhouse: a town and a field under the sky; yellow sunlight arrows come down and pass through, red infrared
  arrows go up from the warm ground; CO₂ molecules drawn in the air catch some and send them back down; a
  thermometer on a post. Drag the plume: molecules appear or leave, more red arrows return, the thermometer
  rises to the model's long run warming. Cause line: "560 ppm (×2) → +3.7 W/m² trapped → about +3 °C over time".
  Takeaway: "CO₂ traps outgoing heat; it does not let more sunlight in."
- Ozone: the same sky with the stratosphere drawn high up as a layer of ozone; UV arrows mostly stopped there. Drag
  CFC use: chlorine atoms rise, break ozone molecules (drawn breaking), more UV reaches a person at the beach. A
  small fixed note on the picture: "CO₂ does not change this layer" only if the student came from tab 1 (or "?").
- Ocean pH: a reef and an oyster bed under the sea surface; CO₂ enters the water; a pH dial on a buoy; shells
  thin and corals pale as pH falls (no dead animals drawn suddenly; the change is gradual and named).
- Sea level: a coast with a harbor and a ruler post; an ice sheet on land, floating sea ice, the ocean. Tap sea
  ice: it melts and the ruler does not move (the trap shown); tap Greenland: meltwater runs off and the sea rises
  on the post; the quiet thermometer knob adds thermal expansion.
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify:** forcing 5.35 × ln(C/280) W/m² (Myhre et al. 1998, used by IPCC); equilibrium climate
sensitivity best estimate 3 °C per doubling, likely 2.5 to 4 (IPCC AR6 WG1 SPM); CO₂ now about 420 ppm with its
year (NOAA Mauna Loa annual mean); ozone chemistry Cl + O₃ → ClO + O₂ (NOAA CSL, WMO Ozone Assessment 2022:
Antarctic recovery around 2066); ocean pH about 8.2 preindustrial to about 8.05 now (NOAA PMEL), carbonate
chemistry; Greenland full melt about 7.4 m (IPCC AR6), thermal expansion share; floating ice displaces its own
mass of water (Archimedes; tiny salinity effect, say "almost none"); GWP values (IPCC AR6, 100 year: CH₄ about 27
to 30, N₂O 273). Traps: greenhouse vs ozone vs acid rain gases; melting sea ice does not raise the sea; thermal
expansion is not from dissolved CO₂.

**Reuse:** APES kit2; `K.tabs`, `K.drag` along drawn tracks (plume, spray, CO₂), `K.tap` for the ices, `K.cause`,
`K.cue`. The Water pollution flagship's sky and water art style. Not the first APES tool on kit2.

**Risks reviewers will likely block on:** arrows as the main visual can read as a bare diagram (rule 12: they must
sit in a drawn sky over a real town); the number of drawn photons per frame (perf p95 at CPU x4; one element per
photon, reuse them); the thermometer showing the long run value while the label says "now" (wording must say
"over time"); the ozone and greenhouse tabs using the same color for two ideas (one color per idea: IR red, UV
violet, CO₂ grey, chlorine green); sea level ruler numbers mid melt not matching the drawn water line.
