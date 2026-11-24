# AP® Environmental Science, Earth and climate: tools v2 plan

**Tool and page:** `environmental-science/tools/earth-climate.html`; scripts `assets/tools/earth-climate.js`,
`math/earth-climate.js`, `earth-climate.css`; data `data/tools/earth-climate.json`; test
`scripts/test/apenv-tool-earth-climate.test.mjs`. **Premium** (`data-premium="tools"`). Rollout row 32, group P,
wave 10 (APES, the rest).

**The one idea:** the sun's uneven heating drives Earth's climate. Four lessons, four tabs, one idea each:
1. Seasons: tilt, not distance, makes the seasons (CED 4.8).
2. Winds: air rises at the equator and near 60°, sinks near 30° and the poles (4.6).
3. Rain shadow: rising air cools and rains; sinking air warms and dries (4.7).
4. El Niño: weaker trade winds let the warm water slosh east (4.9).

**Research:**
- [NAAP Seasons and Ecliptic Simulator (UNL)](https://cleanet.org/resources/43148.html): orbit view, side view and
  the sun's path linked; drag Earth round its orbit. Take: one drag moves every view; the beam spreading on the
  ground. Improve: one view at a time, the town drawn.
- [PALS MountainSim (Iowa State)](https://pals.agron.iastate.edu/simulations/library/Mtnsim/instructions.html) and
  [dmccreary rain shadow](https://dmccreary.github.io/ecology/sims/rain-shadow/): a parcel crosses a ridge with
  temperature read at each height. Take: the parcel's temperature on it; improve: clouds and the dry side drawn.
- [NOAA CPC, ENSO cycle](https://cpc.ncep.noaa.gov/products/analysis_monitoring/ensocycle/cycle_winds.shtml) and
  [NASA SVS La Niña to El Niño](https://svs.gsfc.nasa.gov/5213/): the Pacific cross section with the thermocline
  tilt. Take: winds, warm pool, thermocline and rain clouds in one section.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Scene chips Seasons, Winds, Rain shadow, El Niño; deep link `#scene=sun|winds|shadow|enso` | Explore: four tabs; the old hash keeps working and maps to `?ch=` |
| Date slider (1 to 365), Latitude slider, Jump to a date (two equinoxes, two solstices) | Tab 1: drag Earth round the orbit (main); the town pin on the globe (quiet); the four dates as ticks on the orbit |
| Balloon latitude slider | Tab 2: drag the balloon on the globe (main) |
| Mountain height, Humidity sliders, "Send the air over", Starting temperature (More options) | Tab 3: drag the peak up or down (main, instant run); humidity a quiet knob on the sea; starting temperature in "?" |
| Niño 3.4 anomaly slider, La Niña / Neutral / El Niño chips, Side by side | Tab 4: drag the trade wind arrow (main); the three states as ticks on its track; Side by side in "?" |
| Drills sun, seasons, cells, shadow, enso; contexts `sun-angle`, `seasons`, `cells`, `rain-shadow` (with its ranges), `enso` | Test yourself, unchanged; record ids `earth-climate:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Seasons: space view with the sun at left and Earth on its orbit, axis drawn tilted the same way all year; a
  close view of your town at noon (the sun's height over a house, the shadow length, a beam of light spread over
  the ground). Main control: drag Earth along the orbit. Animates: the sun climbs or sinks over the town, the beam
  widens or narrows, day length on a small sun clock. Cause line: "June: north tilted toward the sun → noon sun
  73° at 40° N → 15 h of daylight". Takeaway: "Earth is closest to the sun in January: distance does not make
  summer."
- Winds: a globe in side view with the three cells drawn as rolling air, rain clouds at the equator and 60°, deserts
  at 30°; trade winds and westerlies as curved arrows bent by rotation. Main control: drag the balloon in latitude.
- Rain shadow: ocean, a mountain range, a town on each side. Drag the peak; the parcel (a drawn air bubble with its
  thermometer) climbs, a cloud forms at the cloud base, rain falls on the windward side, the lee side turns brown.
- El Niño: Pacific cross section, Australia to Peru: warm pool, thermocline, rain clouds, upwelling and fish off
  Peru. Drag the trade wind arrow from strong (La Niña) to weak (El Niño): the warm water and the clouds move east,
  the upwelling stops, the fish thin.
Outside the picture: tabs, purpose line, Show me how, cause line (about 25 words, 3 controls); Play only on
Seasons (a year).

**Science to verify:** declination 23.44° × sin(360° × (284 + day) / 365) (Cooper 1969); noon angle 90° minus the
latitude gap; day length 24/π × arccos(−tan φ tan δ); solar constant 1,361 W/m² (NASA); perihelion in early
January (NASA); cell edges about 0°, 30°, 60° and the Coriolis direction per hemisphere (NOAA JetStream); dry
adiabatic 10 °C/km, moist about 6 °C/km, cloud base 125 m per °C of dew point spread (course rounding, check
against a meteorology text such as Ahrens); ONI thresholds ±0.5 °C (NOAA CPC). Traps: seasons from distance; El
Niño vs La Niña (which side gets rain); Southern Hemisphere seasons reversed.

**Reuse:** APES kit2 opt in per page; `K.tabs`, `K.handle` (orbit, balloon on a curve, wind arrow) as the
Tangent tracer uses it, `K.drag` for the peak, `K.player` for the year, `K.cause`, `K.cue`. Existing drawers in
`earth-climate.js` (`earthSide`, `orbit`, `windScene`, `shadowScene`, the ENSO section) are the starting art and
stay for the drills. Not the first APES tool on kit2.

**Risks reviewers will likely block on:** four scenes in one file (weight: the file is already 65 KB raw; watch the
APES shell); the orbit drag on a phone where the orbit is small (make the handle the Earth itself, 44 px); the
Seasons close view and space view both readable at 360 (stack them); labels on the globe colliding with the cell
arrows; the cause line's degrees and hours derived from the drawn Earth position, not the target day, mid drag;
the parcel's thermometer text under 11 px; El Niño clouds and the thermocline must move together on every frame.
