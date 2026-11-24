# AP® Human Geography, Model studio: tools v2 plan

**Tool and page:** `human-geography/tools/model-studio.html`; scripts `assets/tools/model-studio.js`,
`math/model-studio.js` (72 KB raw: the 21 models' pieces, cases and limits), `model-studio.css`; the shared model
item `human-geography/assets/hug-model.js` (`ApHugModel`: rings, sectors, stages, tiers, free layouts; also used by
the bank and lessons); data `data/tools/model-studio.json`; test `scripts/test/aphug-tool-model-studio.test.mjs`.
**Free.** Rollout row 131, group B (builders and drawers), wave 5. In rollout order this is the first HuG tool on
kit2, so it adds the course adapter (see Reuse).

**The one idea:** a model is a picture of where things go and why; build it and each piece's place explains itself.
One screen, with the model chosen on the picture. The visuals review (`docs/tool-visuals-2026-11.md`) found five
models drawn as blank numbered boxes and every model in a quarter of the stage: both are fixed here.

**Research:**
- [swilliams APHUG interactive visuals, von Thünen](https://swilliams9151.github.io/APHUG_Interactive_Visuals/5.8.html)
  (seen): drag land uses onto rings, then a "Check order" button. Take: drag onto the real figure; improve: each
  piece says why it belongs as it lands, no Check in Explore.
- PhET Build a Molecule and the Mechanisms app (group B's reference products in the rollout): pieces snap where they
  fit, instant feedback on the object. Take: snapping with a short reason.
- The Gemini second opinion for the five blank models (in `docs/tool-visuals-2026-11.md`): Rostow as a rising
  staircase with the mix of farm, factory and service work; epidemiological transition as two lines (infectious
  falling, degenerative rising) over the stages; world system as core, semi periphery and periphery rings with
  flows; gravity as two city circles joined by a band whose width is the interaction; rank-size as bars against 1/n
  with a primate switch. Take all five.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Model picker (21 models: dtm, epidemiological, malthus, ravenstein, diffusion, boundaries, von-thunen, bid-rent, rank-size, gravity, central-place, burgess, hoyt, multiple-nuclei, galactic, latin-american, southeast-asian, african, least-cost, rostow, world-system) | Explore: a model shelf on the picture (small drawn thumbnails grouped by unit, a quiet picker; the full list also searchable in "?") |
| "See it" stepper (Back, Next place, Show all) | Explore: "Show me how" plays the build once; the pieces themselves are the steps |
| "Build it": tap a piece then its place (or drag), Check, Start over | Explore: drag or tap a piece onto the figure (main), it snaps to its place with its reason; no Check. Graded building: Test yourself |
| "Full explanation" | "?" |
| "Test yourself on this model": build, apply to a case, pick a limit | Test yourself, unchanged (it opens on the current model) |
| Contexts: one per model (21), drill type from each context; record ids `model-studio:<model>:<step>` | Test yourself, unchanged |
| `?seed=`, `#quiz`; any `?model=` style link the hub uses | unchanged (check `model-studio.js` and `human-geography/models.html` links before changing the picker) |

**Design:** the chosen model fills the stage as a drawn figure at flagship depth: von Thünen as a market town on a
plain with fields, woods and pastures; Burgess and Hoyt as a city from above with streets and a river; the DTM as
the population road (shared art with Population lab if built first); Rostow as a staircase of a country's economy;
gravity as two cities with a road whose traffic band widens. The pieces wait in a tray drawn on the same picture
(a toolbox on the table). Main control: drag a piece onto the figure. It snaps to its true place (the nearest slot
that accepts it), the area fills with its drawing (a ring of dairy cows, a sector of factories), and the reason
shows on the cause line ("Dairy near the market: milk spoils fast"). A piece dropped on a wrong slot slides to its
place showing the reason, so Explore is never graded. When every piece is placed, the takeaway names one limit of
the model ("Assumes one market and a flat, uniform plain."). Outside the picture: purpose line, Show me how, Start
over, cause line: about 22 words, 3 controls.

**Science to verify:** every model's pieces and their order against the CED and the course's model pages
(`human-geography/models.html`); each model's assumptions and at least one limit (accuracy risks section 6;
authoring guide "Models are models"); world system country examples only "often classed as" (never a fixed list;
rings, not a world map, as the second opinion advised); DTM stage 5 debated; Rostow and Wallerstein critiques named
neutrally; the gravity model formula (population × population / distance²) in "?".

**Reuse:** this is the first HuG tool on kit2 in rollout order, so it adds `ApHugTools.kit2(app, { slug, explore,
quiz })` in `human-geography/assets/tools/hug-tools.js` (a copy of the AP Psych adapter from the Brain map branch),
kit loading for `"kit2": true` pages in `scripts/build-aphug.mjs` (as `build-appsych.mjs` gained), and the opt in in
`human-geography/data/pages.json`. The group B shared piece the rollout names is `K.draw` (draw from one thing to
another); this tool needs snapping drop targets instead: extend `ApHugModel.mount` with a snap and reason mode, or
use `K.drag` per piece; do not fork the kit. Test yourself keeps `ApHugModel` grading.

**Risks reviewers will likely block on:** 21 figures is the biggest art job in this group (build the five missing
ones and a drawn base for the layouts; reuse rings and sectors generically); the shared `hug-model.js` is used by
the bank and lessons, so any change must keep their behavior and pass `check-aphug-content`; drag on phones (tap a
piece, then a place, as forgiving input); the tray and figure both at 360 without shrinking text under 11 px; weight
(the HuG shell budget is 80 KB; the model data may need its own bucket); the picker must not become a side panel.
