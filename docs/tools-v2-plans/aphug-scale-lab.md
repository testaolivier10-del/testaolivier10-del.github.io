# AP® Human Geography, Scale lab: tools v2 plan

**Tool and page:** `human-geography/tools/scale-lab.html`; scripts `human-geography/assets/tools/scale-lab.js`,
`math/scale-lab.js`, `scale-lab.css`; maps `human-geography/assets/hug-map.js` with the base files in
`human-geography/figures/base/` (world, the regions, `country-a.json`); data `human-geography/data/tools/scale-lab.json`;
test `scripts/test/aphug-tool-scale-lab.test.mjs`. **Free.** Rollout row 86, group X (map explorers), wave 22.
The 2026-11-10 visuals review called it "just blocks" and asked for a redesign (`docs/tool-visuals-2026-11.md`).

**The one idea:** geographers use "scale" two ways. Two tabs:
1. Scale of analysis: the same data shown for smaller units reveal what the larger average hides (CED 1.6).
2. Map scale: a large scale map shows a small area in detail; a small scale map shows a large area with little
   detail (1.6, skills).

**Research:**
- [Wikipedia, Modifiable areal unit problem](https://en.wikipedia.org/wiki/Modifiable_areal_unit_problem) and
  [IEEE VIS 2023, Visualizing scalar effects of urban data aggregation](https://virtual.ieeevis.org/year/2023/paper_w-cityvis-1013.html):
  the same values aggregated at different units give different patterns. Take: the units split in place, the values
  recolor (the Gemini second opinion already chose "a change of units, not a camera move").
- [swilliams APHUG interactive visuals](https://swilliams9151.github.io/APHUG_Interactive_Visuals/5.8.html) (a
  teacher's set, the von Thünen page seen): drag and compare in plain pages. Take: the AP framing and words.
- Google Maps style zoom with a scale bar (common knowledge): the ruler changes as you zoom. Take: the scale bar and
  the ratio together on the picture.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Two parts: "Scale of analysis" and "Map scale" | Explore: two tabs |
| Scale chips (global, regional, national, local) in the panel | Tab 1: a knob with four stops on the picture (main) |
| The range line (every unit's value 0 to 100% with the span filled in, "the spread inside it is hidden") | Tab 1: kept on the picture under the map |
| "New data set" | Tab 1: a quiet tap ("Other data") |
| Map scale ladder (ratios like 1:10,000 to 1:50,000,000) and the drawn scenes (streets, neighborhood, city, region) | Tab 2: drag the ratio knob (main); the scenes are the map |
| Drill types identify, across, chain, limit, mapscale (`S.TYPES`); contexts `chain-brasilia`, `chain-eu-workers`, `chain-factory`, `chain-palm-oil`, `chain-sea-level`, `country-a`, `identify-maps`, `limits`, `map-scale` | Test yourself, unchanged; ids `scale-lab:<context>:<step>` |
| `?seed=`, `#quiz` | unchanged |

**Design:**
- Scale of analysis: Country A drawn as a country (coast, rivers, hills, neighbors) on the world's edge. Main
  control: the units knob. Global: the world map, Country A one shape with one color. Regional: its region splits
  from the world. National: Country A alone, one value. Local: it cracks into its eight provinces (the split
  animates in place, each piece recoloring to its own value). The range line under the map spreads from one dot to
  the full span. Cause line: "National: 42% urban → local: 12% to 88% → the average hid the gap". Takeaway: "A
  pattern at one scale can vanish or appear at another."
- Map scale: a real looking map of a town (streets, houses, a river) with a ruler bar; drag the ratio knob from
  1:5,000 to 1:5,000,000: the map zooms out (streets merge into a city patch, then the region), the ruler and the
  ratio change together, and the words "large scale" and "small scale" sit at the ends of the knob's track with an
  arrow saying "more detail". Takeaway: "Large scale means a big fraction: a small area in detail."
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify:** the CED 1.6 definitions (scale of analysis: global, regional, national, local; map scale as
a ratio; the trap: students swap large and small scale); the invented data stay invented ("Country A" note on the
picture, `INVENTED_NOTE`); the real chains (Brasília, EU workers, palm oil, sea level) checked for dated, neutral
facts (accuracy risks doc sections 0, 2 and 4); the world base uses Natural Earth de facto borders with
`BORDER_NOTE`.

**Reuse:** this is likely the first HuG tool built in wave 22, but not necessarily the first on kit2 (Model studio
in wave 5 and FRQ coach in wave 9 come earlier in the rollout). Whichever HuG tool is first adds the adapter:
`ApHugTools.kit2(app, { slug, explore, quiz })` in `human-geography/assets/tools/hug-tools.js`, a copy of the AP
Psych one (HuG forked Psych's runtime; the brain map brief documents it), kit loading in `scripts/build-aphug.mjs`
for `"kit2": true` pages, and `"kit2": true` in `human-geography/data/pages.json`. Kit `K.tabs`, `K.drag` with
stops, `K.cause`, `K.cue`. The rollout's wave 22 piece is `K.spots` on `hug-map.js`; this tool does not need it.

**Risks reviewers will likely block on:** the maps are drawn today as `<img>` SVGs, which cannot animate units
splitting: draw the base's paths inline (keep `ApHugMap`'s rule that text never goes inside the SVG: labels are
kit HTML at page size); the world map at 360 px is tiny (zoom to the region around Country A); the range line's
dots must match the drawn colors; the zoom animation in tab 2 must keep the ruler honest on every frame; the
course shell budget (HUG_SHELL 80 KB) if hug-map is newly loaded by more pages.
