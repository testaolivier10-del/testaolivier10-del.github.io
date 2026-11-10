# Author E self-review: Unit 5, Agriculture and Rural Land-Use (2026-11-09)

Brief: `docs/aphug-briefs/e.md`. All 12 topics and 3 FRQs written; `node scripts/check-aphug-content.mjs --topic <id>`
is clean for every topic, the three FRQs pass, `node scripts/check-aphug-map.mjs --check` reports nothing used before it
is taught, and `APHUG_PUBLISHED=unit-5 node scripts/build-aphug.mjs --out <scratch>` builds 12 topics.

## What is done

| Topic | Items | Sets (kind) | Models / numeric | Lesson figure |
|---|---|---|---|---|
| agriculture-intro (5.1) | 16 | world map, data | 1 numeric | agriculture-intro-two-kinds |
| settlement-survey (5.2) | 16 | image, text | 1 numeric | settlement-survey-methods (+ patterns, numbered stimulus) |
| agricultural-origins (5.3) | 15 | world map, text | order | agricultural-origins-exchange |
| second-agricultural-revolution (5.4) | 15 | data, text | 1 numeric, order | second-agricultural-revolution-rotation |
| green-revolution (5.5) | 16 | data (line chart), world map | 1 numeric, order | green-revolution-package (+ timeline) |
| production-regions (5.6) | 15 | data (line chart), Country A map | 2 model (bid-rent rings, tiers), 1 numeric | production-regions-bid-rent |
| farm-organization (5.7) | 15 | data (USDA 2017/2022), image | 1 numeric | farm-organization-chain |
| von-thunen (5.8) | 15 | image (rings with a river), data | 2 model (rings, tiers) | von-thunen-rings (+ river stimulus) |
| global-agriculture (5.9) | 15 | image, data | 1 numeric | global-agriculture-banana-chain |
| agriculture-consequences (5.10) | 16 | image, text (Aral Sea) | order | agriculture-consequences-salinization (+ scenes) |
| agriculture-challenges (5.11) | 15 | image (food desert), data | 1 numeric | agriculture-challenges-food-desert |
| women-in-agriculture (5.12) | 15 | data (FAO 2023 bar), text | | women-in-agriculture-jobs |

- 184 bank items, 24 stimulus sets (4 map: three world, one Country A; 9 data; 6 image; 5 text), 7-8 items in sets per
  topic (44-50%), about 90% apply or analyze, 12 "make it specific" builders, 12 select-all items (3 with one key), 4
  model items, 8 numeric items with `ApHugCalc` recipes and the slip as an authored mistake.
- Every lesson: hook, 2 prerequisites, figure, a 3-4 step chain, key ideas, misconception, 6 check items, summary.
- Notes: 600-900 words each, every term defined before use, a named place and scale for each idea, comparison tables,
  models with assumptions and limits; non-CED names (Whittlesey, Sauer) only in `hug-aside` boxes.
- Glossary: every concept the map assigns to Unit 5 (47).
- Figures: 17 LevlPrep SVGs from `scripts/aphug-figures/author-e.mjs` (registry `data/figures/<topic>.json`). The
  text-heavy diagrams are drawn 480 px wide with 17-22 px text so they read on a phone; the three-panel scenes and the
  river map stay 720 wide with 20-22 px labels.
- FRQs: `frq-green-revolution-none` (units 2 and 5), `frq-farm-trade-one` (units 5 and 7; invented Country K coffee
  table), `frq-von-thunen-two` (units 1 and 5; Country A land-use map plus a distance and land-value table). Each has a
  scale part.

## Map edits (`docs/aphug-dependency-map.json`)

- `irrigation` moved from agriculture-consequences to agriculture-intro (5.1 and 5.3 need the word).
- `gmo` moved from agriculture-challenges to green-revolution (5.5 must teach that GMOs are not Green Revolution).
- 20 `tools.stimulusThemes` entries added to unit-5, one per set beyond the four planned.

## Accuracy and neutrality

- Real figures carry a source and year: FAO 2023 women in agrifood systems, FAO SOFIA 2024, UNCTAD 2025, USDA Census
  2017 and 2022 (fetched this session); the rest are listed in `docs/aphug-needs-author.md` under `unit-5-facts`.
- No graded key hinges on a stale figure: real-data sets ask students to read the stimulus. Data that could be guessed
  are invented and labeled (Country A, Country B, Country K, Regions X and Y).
- Contested items are attributed: GMO safety (2016 National Academies review; critics' concerns), causes of
  Sahel desertification (debated), the 2022 invasion and the UN and Türkiye grain deal (dated). The Gulf is given both
  names. Women's productivity gap is tied to access (FAO), never ability.

## Open points

- `frq-farm-trade-one` keys comparative advantage (taught in 7.6), so it lists `trade-world-economy` and unlocks after
  7.6. If the lead wants a Unit 5 FRQ live with Unit 5, part D must change.
- The words "Industrial Revolution", "infrastructure", "tariff", "periphery" and "comparative advantage" are taught in
  Units 6 and 7, so Unit 5 says "the rise of factories", "roads, ports and storage", "taxes on imports". A preview box
  in 5.4 for the Industrial Revolution may read better (needs a map `previews` entry).
- Facts written from memory are listed under `unit-5-facts` in `docs/aphug-needs-author.md` for the accuracy review.
