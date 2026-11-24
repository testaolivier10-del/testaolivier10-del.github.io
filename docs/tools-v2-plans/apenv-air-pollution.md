# AP® Environmental Science, Air pollution: tools v2 plan

**Tool and page:** `environmental-science/tools/air-pollution.html`; scripts `assets/tools/air-pollution.js`,
`math/air-pollution.js`, `air-pollution.css`; data `data/tools/air-pollution.json`; test
`scripts/test/apenv-tool-air-pollution.test.mjs`. **Premium.** Rollout row 83, group P, wave 10.

**The one idea:** pollutants are made and moved by what the air is doing. Two tabs, one idea each:
1. Smog day: sunlight turns morning traffic exhaust into afternoon ozone (CED 7.2; inversion 7.3).
2. Acid rain: SO₂ and NOx make rain acidic, and the rock under a lake decides how much it hurts (7.7).

**Research:**
- [Smog City (EPA AirNow and Sacramento AQMD), archived](https://webarchive.library.unt.edu/eot2008/20080916024845/http:/www.cabq.gov/airquality/smogcity.html):
  a city where you set cars, industry, weather and an inversion and watch the ozone level through a day. Take: the
  city drawn, time of day as the main thread, the inversion as a lid.
- [NetLogo community model, Smog](https://ccl.northwestern.edu/netlogo/models/community/Smog): agents for NO, NO₂,
  VOC and O₃ reacting in sunlight. Take: molecules that visibly change from one into another.
- EPA "Effects of acid rain on aquatic ecosystems" (the pH tolerance chart: which animals live down to which pH).
  Take: animals leaving the lake at their own pH limits.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Smog day, Acid rain | Explore: two tabs |
| "Time of day" slider and dragging the clock on the picture; "Play the day" | Tab 1: drag the sun across the sky (main); Play as "Watch it happen" |
| Traffic slider (0.25 to 1.5) | Tab 1: a quiet knob on the road (cars appear or leave) |
| Inversion button | Tab 1: a quiet tap on the warm air lid over the valley |
| NO, NO₂, O₃, VOC curves | Tab 1: one graph strip under the scene, plain title |
| "SO₂ and NOx from the plant" slider | Tab 2: drag the plant's smoke (main) |
| Limestone, Granite bedrock | Tab 2: a quiet tap on the rock under the lake |
| Drills smog, inversion, ph, reduce, pct; contexts `smog`, `inversion`, `reduce`, `acid`, `trend` | Test yourself, unchanged; ids `air-pollution:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Smog day: a valley city with a highway, hills on both sides, the sky from dawn to dusk. Main control: drag the sun
  along its arc. Instant: rush hour cars pour NO (drawn as small grey brown puffs); as the sun climbs, NO₂ browns
  the air and ozone (one color, named) builds into a haze that peaks in the early afternoon; the graph strip's cursor
  follows. The inversion lid, when on, flattens the haze under it and holds it in the valley. Cause line: "2 p.m.:
  strong sun on NO₂ and VOCs → ozone peaks at 110 ppb" (the model's value). Takeaway at dusk: "Ozone is made in the
  air by sunlight; it is not what the cars put out."
- Acid rain: a power plant upwind, clouds drifting over hills, a lake with fish, frogs, snails and mayflies. Drag
  the plant's smoke: the rain's drops shift on a pH scale on the picture (normal rain about 5.6 named), the lake's
  pH dial falls, and each animal leaves when the lake passes its limit. Tap the rock: limestone holds the lake's pH
  up (buffering), granite does not.
Outside the picture: tabs, purpose line, Show me how, time bar and Play (tab 1), cause line: about 28 words, 4
controls.

**Science to verify:** photochemical smog chemistry and timing (NO₂ + sunlight → NO + O; O + O₂ → O₃; VOCs keep
NO from removing ozone; ozone peaks in the early afternoon: EPA "Ground level ozone basics"); thermal inversion
mechanism (NOAA, EPA); pH of clean rain about 5.6 from CO₂ (USGS); acid deposition from SO₂ and NOx (EPA Acid Rain
Program); animal pH limits (EPA chart: check each animal's value before drawing it); limestone buffering (CaCO₃).
Traps: VOCs and particulates do not cause acid rain; SO₂ is not a greenhouse gas; ozone is good high up and harmful
near the ground (keep the climate change tool's ozone color different from this ground level ozone).

**Reuse:** APES kit2; `K.handle` for the sun on its arc, `K.drag` (traffic, smoke), `K.tap` (inversion, rock),
`K.scrub` for the graph strip, `K.player`, `K.cause`. Not the first APES tool on kit2.

**Risks reviewers will likely block on:** smog shown as one grey fog (each pollutant needs its own color, kept
consistent on the graph); the haze outside the valley when the lid is on; animals reappearing on a drag back while
the lake is still acidic (state follows the drawn pH, both ways, smoothly); the graph strip and sky crowding a 360
screen; the cause line naming a ppb value that the haze does not yet show mid drag; the pH dial's numbers under 11 px.
