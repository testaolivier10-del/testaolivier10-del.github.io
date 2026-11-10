# AP® Human Geography: open questions for a person

Things a person (the owner, or an AP® Human Geography teacher) should decide or check. Add to this file instead of
guessing; mark an entry resolved with the date and move it to the end.

## ced-text: the CED text in the map is our summary (open, 2026-11-09)

All 68 topic titles and the seven unit titles in `docs/aphug-dependency-map.json` are the official ones
(framework.md, Course at a Glance). The `objectives`, `knowledge` and `exclusions` in `docs/aphug-ced-map.json`
are our summaries of the CED (framework.md section 3), not its words, and some essential knowledge statements were
read only in part. A person with the CED should check every topic's entry before its lessons are written, and
the exclusions above all (the content check refuses only models the map does not name).

## mcq-options: five options on the exam, four in the bank (open, 2026-11-09)

The exam has five options per question (framework.md section 4). Bank singles have four (house style, spec
decision 5); a fixed exam form gives a bank item its fifth option from the form's `fifth` map. Confirm the split,
or decide that bank items carry five options too (then `MCQ_OPTIONS.bank` in `scripts/lib/aphug-exams.mjs`
becomes 5 and every bank item needs a fifth option).

## mcq-sets: how many questions use each stimulus kind (open, 2026-11-09)

The CED says Section I has sets and single questions with maps, data, images and text, but gives no counts.
`EXAM_SETS` (map 1 to 4 sets, data 1 to 4, image 0 to 3, text 0 to 3) is a guess from released practice exams'
shape. Check against the CED's exam description and the latest practice exam (without copying it).

## practice-weights: Section I skill weights (open, 2026-11-09)

The map's skill categories carry the CED's weight ranges as read; `checkForms` uses them only when the map sets
`"practicesConfirmed": true`. Confirm the ranges, then set it.

## topic-skills: focus skills per topic (open, 2026-11-09)

Each topic's `practices` in the map are our choice (two or three skills, spread so every skill appears in every
unit). The CED does not list skills by topic. Confirm or change them before authors start.

## regions: the ten base map regions (open, 2026-11-09)

`REGIONS` in `scripts/build-aphug-basemaps.mjs` puts each country in one of ten world regions (North America,
Latin America, Europe, Russia and Central Asia, North Africa and Southwest Asia, Sub-Saharan Africa, South Asia, East
Asia, Southeast Asia, Oceania) [ours, verify]. Textbooks differ (where Afghanistan, Sudan, the Caucasus and
Mexico go). Pick one scheme, then rebuild the bases. The CED itself names no fixed set of world regions.

## borders: the base map's disputed places (open, 2026-11-09)

The bases use Natural Earth's de facto lines, and every map caption says they show no position on any dispute.
Marked `disputed` (a value on them needs `disputedOk`): Western Sahara, Northern Cyprus, Somaliland, Kosovo,
Taiwan, Palestine, Falkland Islands / Islas Malvinas. Kashmir, Crimea and the South China Sea are not separate
features at 1:110m, so a map cannot color them apart. Confirm the list and the caption wording.

## map-renders: flow maps and cartograms (open, 2026-11-09)

`hug-map.js` draws reference, choropleth, dot, graduated symbol and isoline maps. Flow maps (migration, trade) and
cartograms are drawn as figures for now. Decide whether to add them as renderings before Unit 2 authoring (flow maps
appear on released exams).

## frq-grader: the AI grader for seven one-point parts (open, 2026-11-09)

The AI FRQ grader (`docs/frq-grader.md`) is calibrated on other courses' rubrics. HUG's three 7-point FRQs need
their own eval set before the course joins `FRQ_COURSES`.

## identity: provisional accent, cover and ranks (open, 2026-11-09)

The berry accent (hue 320, `#741B56` on `#F8E7F3`), the cover art (a globe with meridians), the headline "from local
to global." and the ranks (Map Reader, Scale Shifter, Pattern Spotter, Region Builder, Model Maker, World Analyst,
Geography Legend) are provisional. The owner approves them at launch. Tool covers come with each trainer.

## Facts marked [ours, verify] in the research

From `docs/aphug-research/accuracy-risks.md`; check each against its source before any lesson uses it.

- India passed China as the most populous country in 2023 (UN WPP); recheck in WPP 2024.
- China's policy dates: one child 1980 to 2015, two children 2016, three children 2021, later incentives.
- Megacity 10 million and metacity 20 million: teach as a convention with a source; the CED states no threshold.
- The UN's "Least Developed Countries" list is a separate category from "less developed" in AP usage.
- BRICS and other group memberships change; test functions, not counts.
- EU and NATO membership changes (UK left the EU 2020; Finland joined NATO 2023, Sweden 2024).
- Western Sahara: claimed and largely administered by Morocco, on the UN list of non-self-governing territories.
- South China Sea: the 2016 arbitral ruling and China's rejection of it.
- South Sudan's independence in 2011.
- Naming forms: Türkiye, Czechia, Eswatini, North Macedonia, Myanmar, Kyiv, Côte d'Ivoire, Timor-Leste, Cabo Verde,
  Viet Nam.
- 193 UN member states and two observer states (Holy See, State of Palestine).
- Group names: "Native American" (CED 4.1), "Hispanic or Latino" in census data, "tribe" avoided.
- Religion: universalizing and ethnic as the AP classification; adherents may not use these labels.
- Language families: avoid contested families (Altaic).
- Map projections: the trade-off examples (Mercator, Robinson, Peters, and others) in framework.md section 7.
