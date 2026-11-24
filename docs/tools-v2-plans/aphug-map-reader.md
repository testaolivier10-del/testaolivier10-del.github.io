# AP® Human Geography, Map reader: tools v2 plan

**Tool and page:** `human-geography/tools/map-reader.html`; scripts `assets/tools/map-reader.js`,
`math/map-reader.js`, `map-reader.css`; maps `human-geography/assets/hug-map.js` and `figures/base/` (six bases
in `exploreBases`); data `data/tools/map-reader.json`; test `scripts/test/aphug-tool-map-reader.test.mjs`.
**Free.** Rollout row 133, group X, wave 22.

**The one idea:** every map answers some questions and hides others. Two tabs:
1. Map types: the same data look different on each kind of map (CED 1.1, 1.2, skills).
2. Breaks: how you cut a choropleth into classes changes the story, and totals belong on symbol maps, not
   choropleths.

**Research:**
- [Penn State GEOG 160, 3.2 Thematic maps](https://courses.ems.psu.edu/geog160/node/1716): one data set as
  choropleth, proportional symbol, dot density and isarithmic. Take: one data set, many renderings, side by side in
  the reader's head.
- [ArcGIS StoryMaps, Choropleth maps](https://storymaps.arcgis.com/stories/9b08264468ed402cb97870c7dbf4493d) and
  [UCGIS GIS&T BoK, Common thematic map types](https://gistbok-ltb.ucgis.org/30/concept/9295): classification
  methods (equal interval, quantile, natural breaks) change the look. Take: the class breaks as a thing you drag.
- [The True Size Of](https://thetruesize.com/): drag a country on a Mercator map and its size changes. Take: the
  idea that dragging reveals what a map distorts (for "?" on projections; not this tool's screen).

**Old tool inventory:**
| Old | v2 |
|---|---|
| Map type picker (reference, choropleth, dot density, graduated symbol, isoline, cartogram) | Tab 1: tap a map on a "map shelf" of six small maps on the picture (main) |
| Base map picker (six bases) | Tab 1: a quiet tap (Country A by default; the world and a region as the other two in Explore; all six in Test yourself) |
| Steps Legend, Pattern, Limit (chips in the panel) | Test yourself (the kind, legend, pattern and limits drills) and one "what it hides" line per type on the picture |
| Breaks: Even classes, Uneven, Totals | Tab 2: drag the class breaks on the legend bar (main); "Totals" a quiet tap |
| Drill types kind, legend, pattern, breaks, limits, isoline (`R.TYPES`); contexts `breaks-country-a`, `isoline-country-a`, `kind-world`, `legend-choropleth`, `legend-symbol`, `limits-maps`, `pattern-country-a`, `pattern-regions`; partTopics `kind`, `best`, `cannot`, `fill` | Test yourself, unchanged; ids `map-reader:<context>:<step>` |
| `?seed=`, `#quiz` | unchanged |

**Design:**
- Map types: a large map of Country A on a drafting table, with the six map types as small maps pinned along its
  edge. Tap one: the big map morphs (the dot density's dots gather into a choropleth's shaded provinces; the
  provinces shrink or swell into a cartogram; circles grow from province centers into graduated symbols; isolines
  draw across). The legend (HTML, under the map) changes with it. One line on the picture names what this type
  hides ("Dots hide which province is densest per km²"). Cause line: "Choropleth: shades rates per province →
  hides differences inside each province".
- Breaks: the choropleth of Country A with its legend as a bar of five classes; drag a break: provinces recolor at
  once. "Totals" switches the data to raw counts, and the map now shows big provinces as dark only because they
  are big: the line on the picture says "Totals mislead on a choropleth: use symbols". Takeaway: "The same data can
  tell two stories; check the breaks."
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls (the legend under the
map is part of the picture).

**Science to verify:** map type definitions and their best use (choropleth for rates or ratios, graduated symbols
for totals with area proportional to value, dot density with "1 dot = N", isolines for continuous values, cartogram
area by value: Penn State GEOG 160; Slocum et al., Thematic Cartography); classification methods; every value is
invented (the tool says so, and it must stay on the picture); Natural Earth de facto borders with `BORDER_NOTE` on
real outlines; no disputed place used as the answer to anything.

**Reuse:** `ApHugTools.kit2` (added by the first HuG kit2 tool); `ApHugMap` renders (`svg`, `overlay`,
`legendHtml`) drawn inline so morphs animate; `K.spots` on `hug-map.js` (the wave 22 piece) to tap a province for
its value; kit `K.tabs`, `K.tap`, `K.handle` for each break on the legend bar, `K.cause`.

**Risks reviewers will likely block on:** morphing between renderings is the hard part (dots to fills, areas to
cartogram) and must not show impossible in between maps (cross fade per province where a true morph has no
meaning, and say nothing until the new map has landed); six small maps legible at 360 (two rows of three, each a
tap target of 44 px); legend text in HTML at page size (never inside the SVG); colors that work in greyscale
(`PALETTE` already does); the morph's perf at CPU x4 with many dots.
