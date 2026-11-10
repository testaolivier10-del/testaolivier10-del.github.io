# Builder T3 self-review: map-reader and population-lab (2026-11-09)

Brief: `docs/aphug-briefs/t3.md` and `tools-common.md`. Both trainers are built, checked and screenshot-tested.
Nothing committed (the lead commits).

## Files (all owned by T3)

- `human-geography/assets/tools/math/map-reader.js`, `map-reader.js`, `map-reader.css`, `human-geography/data/tools/map-reader.json`
- `human-geography/assets/tools/math/population-lab.js`, `population-lab.js`, `population-lab.css`, `human-geography/data/tools/population-lab.json`
- `scripts/lib/aphug-tool-checks/map-reader.mjs`, `population-lab.mjs`; `scripts/test/aphug-tool-map-reader.test.mjs`, `aphug-tool-population-lab.test.mjs`
- `assets/covers/tools/aphug/map-reader.svg`, `population-lab.svg` and their two entries in `assets/covers/tools/aphug/index.json`
- `pages.json` (and the fixture copy): map-reader `desc` and `blurb` now name cartograms and what a map cannot show

## Map reader (free, topic views-of-the-world)

- **Explore.** One invented data set drawn six ways: reference, choropleth, dot density, graduated symbol, isoline,
  cartogram. Read chips: Legend, Pattern (letters on the places at each end, the pattern named with a direction and
  places), Limit. Choropleth class breaks: Even, Uneven, Totals (the two misleading maps). Tap a place to read its
  invented value. Base in More options: Country A, the world, Sub-Saharan Africa, Europe, Latin America, South Asia;
  isoline and cartogram are drawn on Country A (the cartogram is a drawn block figure, needs-author `map-renders`).
- **Test yourself** (6 kinds): name the map type and what it shows best; read a choropleth legend at marked places,
  or compare graduated circles by area; name the pattern with its place (distractors: "clustered" with no place, the
  legend read backwards, a big place mistaken for a high value); spot a misleading map on Country A (totals on a
  choropleth with a density step from the table, lumped classes, a legend gap); what the map cannot show and what
  data would fill it; read an isoline map (range at a point, fastest change).
- **Accuracy.** Every value is invented and labeled ("Invented data for practice", "(invented)" in each legend
  title); the pattern changes with every problem code. Disputed places get no value and are never marked or named
  (the validator checks the text). Every real-outline map carries `ApHugMap.note` and "Base map: Natural Earth".

## Population lab (Premium, topic population-composition)

- **Explore.** Port of AP® Environmental Science's age-structure trainer: Country P (invented) through five stages
  of the DTM (teaching values; each pair of rates gives its own stage by `transitionStage`), TFR and life
  expectancy sliders, morphing pyramid with under-15 and 65+ brackets, the DTM chart (monotone curves, gap
  shaded, marker), tap a bar to read it. Why: the stage, the shape, RNI and doubling time worked by hand, the
  dependency ratios, schools / jobs / care, the model's limits. On a phone a switch shows one chart at a time.
  The pyramid model grows births by the net reproduction rate, so a stage 1 pyramid is young but slow-growing.
- **Test yourself** (6 kinds): counts to CBR, CDR, RNI % and doubling time; RNI, doubling time and growth with
  migration; total, youth and elderly dependency from a pyramid in millions plus what it means; the stage the rates
  are "consistent with" plus what moves a country on; pyramid shape plus needs; bulge, notch or male-heavy working
  ages with birth years and the sex ratio. Pyramids drawn by `ApHugPlot` (kind pyramid). All countries invented; no
  real country is placed in a stage (no UN WPP 2024 figure was needed, so none is quoted).

## What was tested

- Validators: 300 seeds per context and type, every key recomputed independently (plain arithmetic for rates and
  ratios; own stage bands; shape read off the figure's bars; class of a marked place from the spec; pattern places
  against the median position; density from the table; isoline range from the lines' own points). Every map
  passes `ApHugMap.check` (labels apart at 360 px), every pyramid draws. `check-aphug-content.mjs`: tools 0 failing.
- Tests: 10 new (registration, full sweep, reproducible problem codes, planted mistakes caught); all 125
  `aphug-*` tests pass.
- Screenshots (scratch build, port 8823, Playwright) at 360 and 1280, light and dark: both Explore views (every map
  type, three real bases, class-break modes, all five stages, the phone chart switch) and every drill kind;
  crowded labels fixed (birth and death rate labels, stage chips, corner button, symbol legend scale, map height).
  A run through the drills (wrong answer, feedback, Show the answer, worked solution) and a tap on a province: no
  console errors (only the sandbox's blocked outside requests).

## Requests for the lead (shared files, not edited)

1. `scripts/build-aphug.mjs` `toolShell`: add `hug-map.js` to the tool page scripts, e.g.
   `const extra = ['hug-questions.js', ...lib('hug-map.js'), ...lib('tools/hug-tool-math.js'), ...]`. Until then
   `map-reader.js` loads `../assets/hug-map.js` itself (it skips this when `window.ApHugMap` exists).
2. `tools/hug-tool-math.js` `diagnose`: the sign slip says "Below the mean, a z score is negative." (left from
   Psychology). Suggest "The size is right but the sign is wrong." Both my trainers add that as an authored mistake
   on every number step as a workaround.
3. `hug-map.js` `legendHtml`: graduated symbol legend values print as `String(v)` (20000); suggest thousands
   separators (`v.toLocaleString('en-US')`). My maps keep symbol values under 1,000 meanwhile.
4. `hug.css` has two `.hug-legend` rules (line 73 for maps, line 473 for plots, `display:flex`); the second also
   hits map legends. Suggest scoping the plot one (for example `.hug-plot-wrap .hug-legend`).

## Open points

- Phone drills: the Tool Studio stage is about 230 px tall at 360 x 780, so a tall map or a 17-group pyramid scrolls
  inside the stage (labels stay full size; the full-screen button shows it whole). Same as other courses' tall figures.
- The trainers use no real-country data. If the owner wants real pyramids (spec: "real countries only with a dated
  source"), add them as Explore presets with UN WPP 2024 values checked against the UN site and logged per
  `accuracy-risks.md` rule 6.
- Cartograms stay a drawn figure of Country A (needs-author `map-renders`).
