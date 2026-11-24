# AP® Environmental Science, Soil texture: tools v2 plan

**Tool and page:** `environmental-science/tools/soil-texture.html`; scripts `assets/tools/soil-texture.js`,
`math/soil-texture.js`, `soil-texture.css`; data `data/tools/soil-texture.json`; test
`scripts/test/apenv-tool-soil-texture.test.mjs`. **Premium.** Rollout row 57, group P, wave 10.

**The one idea:** a soil's mix of sand, silt and clay names it and decides how water moves through it. Two tabs:
1. Texture: drag the mix; the class name, the grains and the water change together (CED 4.2, 4.3).
2. Horizons: soil forms in layers from the top down (4.1).

**Research:**
- [USDA NRCS Soil texture calculator](https://www.nrcs.usda.gov/resources/data-and-reports/soil-texture-calculator):
  type sand and clay, get the class on the triangle. Take: the official class boundaries; improve: drag, not type.
- [The Soil Texture Wizard (soiltexture R package)](https://soiltexture.r-forge.r-project.org/): plots points on
  many national triangles. Take: the reading lines parallel to each side (the tool's own reading rule).
- The classic jar and percolation demos (Soil Science Society of America "K-12 soil" activities, text): a jar of
  soil settles into layers; water poured through sand drains fast, through clay slowly. Take: the column of soil
  with water as the picture beside the triangle.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Texture triangle, Soil horizons | Explore: two tabs |
| Drag the point on the triangle | Tab 1: the main control, unchanged in spirit |
| Three sliders (sand, silt, clay) that move each other and the point | Removed from Explore (they broke "one control never moves another"); typed or picked percentages stay in Test yourself (forgiving input: "40%", "40", "0.4") |
| Presets Beach sand, Garden loam, Pottery clay, River silt | Tab 1: four named ticks on the triangle (quiet taps) |
| Magnified sample and water bars | Tab 1: the soil column and the magnifier on the picture |
| Soil horizons view | Tab 2 |
| Drills classify, missing, porosity, horizons, erosion, percolation; contexts `triangle`, `water`, `profile`; partTopics `h1`, `h2`, `order`, `e1`, `e2` | Test yourself, unchanged; ids `soil-texture:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Texture: left, the texture triangle drawn as a field chart pinned to a board (classes in soft earth colors, names
  inside), the knob on it. Right, a clear column of that soil in the ground with a watering can above it and a
  magnifier circle showing the grains to relative size (sand grains big and round, silt fine, clay as flat flakes).
  Drag the knob: the class name on the board highlights, the grains in the magnifier change in number and size,
  water poured on top sinks fast (sand) or pools and soaks slowly (clay); a small gauge shows water held after
  drainage. Cause line: "40% sand, 40% silt, 20% clay → loam → drains well and holds water". Takeaway: "Clay holds
  the most water but lets it through the slowest."
- Horizons: a road cut through a hillside with grass and a tree on top; drag a soil corer down: O, A, E, B, C and R
  are named as the corer reaches each, with what is in it (leaf litter, humus, leached grey, clay and iron, broken
  rock, bedrock), roots and worms where they live.
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify:** the 12 USDA texture classes and their polygon vertices (NRCS Soil Survey Manual, chapter 3);
particle size limits sand 2 to 0.05 mm, silt 0.05 to 0.002 mm, clay under 0.002 mm (USDA); porosity and
permeability by texture (trap: clay has high porosity but low permeability; check the model's numbers against a
soils text such as Brady and Weil); field capacity and available water by class; horizon names and order O, A, E,
B, C, R (NRCS); the E horizon is not present everywhere (say so in "?").

**Reuse:** APES kit2; `K.handle` for the triangle point (with `pick(x, y)` snapping to whole percents and the
three values read from the drawn point), `K.tap` for presets, `K.drag` for the corer, `K.cause`, `K.cue`. Not the
first APES tool on kit2.

**Risks reviewers will likely block on:** the triangle can read as a bare chart (rule 12): it must be paired with the
drawn soil and water at all widths, stacked on phones with the column above the fold; class names inside the
triangle at 360 px under 11 px (use short names or names on hover cards via `K.spots`); the three percentages must
always add to 100 and be derived from the drawn knob position; water animation must stay inside the column; a
fast drag across several classes must not leave the column showing a past class.
