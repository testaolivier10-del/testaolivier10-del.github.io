# Author F self-review: Unit 6, Cities and Urban Land-Use (2026-11-09)

## Done

All 11 topics have a lesson, notes (590 to 1,020 words, `<h2>` sections, comparison tables, every model with its
assumptions and a limit, each concept on a named real place with its scale), questions, a glossary entry for every
concept the topic teaches, a LevlPrep original figure and their stimuli. The 3 FRQs are written.
`node scripts/check-aphug-content.mjs --topic <id>` is clean for every topic (no warnings), the full run reports no
failure in my topics or FRQs, and `node scripts/check-aphug-map.mjs` reports "Nothing is used before it is taught".
`APHUG_PUBLISHED=unit-6 node scripts/build-aphug.mjs --out /tmp/hug-f/build` builds all 11 topics; I rendered every
figure and every map file and fixed overlaps.

| Topic | Items | In sets | Apply/analyze | Stimuli | Special items |
|---|---|---|---|---|---|
| urbanization-origins (6.1) | 15 | 7 | 14 | map (world reference, four early hearths), text (invented river town) | specific, select-all (1 key) |
| cities-worldwide (6.2) | 15 | 7 | 14 | map (world symbols, seven very large cities, UN DESA WUP 2025), data (invented metro table) | order, specific, select-all |
| cities-globalization (6.3) | 15 | 7 | 14 | data (four invented cities), text (invented phone shipment) | order, model (urban hierarchy), specific |
| city-size-distribution (6.4) | 15 | 7 | 15 | data (rank-size table, two invented countries), map (Country A city-size symbols, invented) | 2 numeric (`rankSize`, `gravity`, with slips), 2 models (central place, rank-size) |
| city-structure (6.5) | 19 | 8 | 19 | image (drawn numbered zones), text (invented Latin American field notes) | 7 models: concentric, sector, multiple nuclei, galactic, Latin American, Southeast Asian, African |
| density-land-use (6.6) | 15 | 7 | 14 | data (line chart, invented), text (invented infill notice) | specific, select-all |
| infrastructure (6.7) | 15 | 7 | 14 | map (Country A piped water, invented), data (invented rail table) | specific, select-all (1 key) |
| urban-sustainability (6.8) | 15 | 7 | 14 | image (drawn TOD vs sprawl), data (invented neighborhoods) | specific (both sides), select-all |
| urban-data (6.9) | 15 | 8 | 14 | data (invented census tract), text (invented interviews) | specific (compare), select-all (1 key) |
| urban-change-challenges (6.10) | 15 | 7 | 15 | text (invented hearing), data (bar chart, invented) | specific, select-all |
| sustainability-challenges (6.11) | 15 | 7 | 14 | image (drawn metro with growth boundary), map (Country A farmland loss, invented) | specific, select-all (1 key) |

Totals: 169 items, 79 in sets (47%), 161 apply or analyze (95%). Every single-answer item has four options, each
explained; correct options are the longest in at most 4 of a topic's singles; no absolute words in my options.
Unit 6 sets: 5 map (2 on the world, 3 on Country A), 8 data, 3 image, 6 text.

FRQs (all pass `checkFrq`):
- `frq-gentrification-none`: unit-2 `migration-causes` + `urban-change-challenges`; part F asks for the local scale;
  part G (explain the degree) ties push and pull factors to displacement.
- `frq-rail-boundary-one`: unit-1 `regional-analysis` + `urban-sustainability`; one drawn stimulus
  (`urban-sustainability-rail-limits`); part A asks about the regional scale. Its title says "divided local
  government" (fragmented government is a 6.10 idea, explained in plain words in part D).
- `frq-world-cities-two`: unit-3 `diffusion-today` + 6.2, 6.3, 6.4 (it unlocks with 6.4 so it can use rank-size);
  Source 1 a world symbol map (UN DESA WUP 2025, GaWC 2024 marks), Source 2 an invented city table; part F links the
  global and national scales.

Figures: 14 SVGs from `scripts/aphug-figures/author-f.mjs` (run it to regenerate; `--check` for CI), registered in
`human-geography/data/figures/<topic>.json` by the same script. No labels files.

## Map edits (`docs/aphug-dependency-map.json`)

1. `squatter-settlement`: `taughtIn` moved from `urban-change-challenges` to `city-structure` (the Latin American,
   Southeast Asian and African city models need it in 6.5). 6.10 still teaches land tenure with it.
2. New concept `zoning` (aliases "zoning law", "zoning laws", "zoned"), taught in `density-land-use`, depends on
   `land-use`. Removed the alias "zoning" from `inclusionary-zoning` (it blocked the plain word in 6.6 to 6.9) and set
   `inclusionary-zoning.dependsOn` to `zoning`.
3. Unit 6 `tools.stimulusThemes`: replaced the four planned sets with the 22 sets actually written. The planned
   "metro area map with an urban growth boundary" is an `image` (a drawn map), because no base map is at metro scale.

## Requests for the lead

1. A metro-scale map: no base map is finer than Country A's provinces, so the three metro maps (growth boundary,
   rail lines and city limits, TOD) are drawn SVG figures used as `image` stimuli. Either add a `metro` base (an
   invented metro area with a central city, about eight suburban cities, a river, rail and highways as features) or
   allow a `map` stimulus to carry a drawn `figure`; I would then convert `sustainability-challenges-s1` and the
   rail FRQ stimulus to kind `map`.
2. `free` model layout: bank items have no way to carry their figure (`modelFigure` is read by `hug-questions.js`
   but not passed through by `prepareBank`/the item serializer in `scripts/lib/aphug-build.mjs`, about line 679).
   I used `tiers` with named slots for the multiple nuclei and sector items instead; a working `free` layout would
   let them sit on a drawing.
3. Add to `docs/aphug-needs-author.md` (I did not edit it, to avoid clashing with other authors):
   - `metacity-threshold`: we teach 10 million (megacity) and 20 million (metacity) as conventions, attributing
     "metacity" to UN-Habitat (State of the World's Cities 2006/7). Verify the attribution and that the CED or
     scoring guidelines use these thresholds.
   - `wup-2025-figures`: the map values are UN DESA WUP 2025 as reported in November 2025 (Jakarta 41.9, Tokyo 33.4,
     Cairo 32.0, New Delhi 30.2, Shanghai 29.6, Manila 24.7, Sao Paulo 18.9 million; 33 megacities, 19 in Asia).
     Dhaka was left out: UN DESA's own feature says "almost 40 million" while press tables say 36.6 million. Check
     against the WUP 2025 data files before launch.
   - `flint-task-force`: notes and an item say the Michigan governor's Flint Water Advisory Task Force (2016) called
     the crisis a clear case of environmental injustice. Verify the wording in the final report.
   - `released-overlap-world-cities`: the assigned theme of `frq-world-cities-two` (world map of large cities and
     world cities plus a city table) matches the stimulus type of 2024 Set 1 Q3. The parts and data are our own, but
     a person should compare it with the released question (spec decision 4).
4. Dated-figure log (accuracy-risks rule 6) for Unit 6, once the per-course table exists: WUP 2025 city values above;
   GaWC 2024 (785 cities, 49 Alpha, London and New York top); US census 1890 Chicago, 1950 and 2020 Detroit, 2020
   Mesa; Levittown 1947 to 1951.

## Open points

- Source files: I wrote the content as JS modules in my scratch folder (`/tmp/hug-f/src`, emitted by
  `/tmp/hug-f/emit.mjs`). The JSON and HTML under `human-geography/data/` are now the source of truth; the scratch
  folder will not survive the container.
- No Unit 6 item depends on a figure that changes within a year: real values appear only in
  dated stimuli, and items ask students to read them.
- The galactic city model is taught fully (6.5 notes, lesson misconception, a placement model and an applied item on
  Atlanta) because readers found students did not know it.
