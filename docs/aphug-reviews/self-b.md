# Author B self-review: Unit 2, Population and Migration (2026-11-09)

## Done

All 12 topics have a lesson, notes (520 to 715 words each, 7,000 in all), questions, a glossary entry for every
concept the topic teaches, a LevlPrep original lesson figure and their stimuli. The 3 FRQs are written.
`node scripts/check-aphug-content.mjs --topic <id>` is clean for every topic, the full run reports 0 failing (bank,
FRQ and test-wise rules included), and `node scripts/check-aphug-map.mjs --check` reports "Nothing is used before it
is taught". `APHUG_PUBLISHED=geo-skills,unit-1,unit-2 node scripts/build-aphug.mjs --out /tmp/hug-b/build2` builds
the 12 topics and the 3 FRQ pages; I checked an FRQ page, a notes page and a lesson in headless Chrome at 400 px.

| Topic | Items | In sets | Stimuli |
|---|---|---|---|
| population-distribution (2.1) | 18 | 8 | map: world reference, four marked places; map: Country A choropleth, people per km² (invented) |
| distribution-consequences (2.2) | 17 | 8 | data: density table for Countries X, Y, Z (invented); text: health office notice (invented) |
| population-composition (2.3) | 16 | 7 | data: expansive pyramid (Country P); data: constrictive pyramid (Country Q) (both invented) |
| population-dynamics (2.4) | 17 | 8 | map: world choropleth of TFR, UN WPP 2024, 2023 estimates, 3 classes; data: CBR, CDR, NMR table (invented) |
| transition-model (2.5) | 16 | 7 | data: line chart of CBR and CDR 1800-2020 (invented); data: rates and causes of death table (invented) |
| malthusian-theory (2.6) | 17 | 7 | text: Malthus 1798 (two sentences, public domain, "[The food supply]" for "Subsistence"); data: food vs population index (invented) |
| population-policies (2.7) | 15 | 7 | text: a minister's speech (invented); data: China's birth policies by year (dated summary) |
| women-population-change (2.8) | 15 | 8 | data: scatter, women's schooling vs TFR (invented); text: Ravenstein's laws summarized |
| aging-populations (2.9) | 15 | 8 | map: Country A choropleth, share 65 and over (invented); data: age-group table (invented) |
| migration-causes (2.10) | 15 | 7 | text: a migrant's story (invented); map: world reference, Syria, Venezuela, Philippines, Germany marked A-D |
| forced-voluntary-migration (2.11) | 16 | 8 | image: flow map of step and chain migration, Mexico to the US (drawn figure, invented flows); data: five cases table (invented) |
| migration-effects (2.12) | 15 | 8 | data: bar chart of the top five remittance receivers, World Bank 2024 (2023 estimates); text: news report from an invented town |

Totals: 192 items (149 single, 11 select-all, 12 numeric, 12 "Make it specific", 6 model, 2 order), 91 in sets
(47%), 179 apply or analyze (93%). Sets: 5 map (3 world, 2 Country A), 12 data, 6 text, 1 image. Numeric items
are `ApHugCalc` recipes (arithmetic, physiological and agricultural density, sex ratio, CBR, RNI in percent,
doubling time by the rule of 70, dependency and elderly dependency, food per person) with the reader-report slips
as mistakes (RNI times 10 or with migration, dividing by the whole population, density on the wrong land, males
under females). Model items: DTM five stages (slips: stage 2 and 3 swapped), epidemiological transition, pyramid
shapes, Malthus's argument (slip: technology as a step), Ravenstein's laws (tiers), push-pull sorting
(Guatemala to Los Angeles, slip: an intervening opportunity as an obstacle). Every country in a stage is
"consistent with", never "in".

FRQs (each crosses unit-1 and unit-2 and ends with a scale part):
- `frq-population-policy-none` (scales-of-analysis, population-dynamics, population-policies): define TFR,
  identify CBR and CDR, explain momentum, describe a pronatalist policy, explain a limited effect, compare China
  1980 and 2021, the degree a national TFR describes India.
- `frq-aging-pyramid-one` (data-in-decisions, population-composition, aging-populations): pyramid of invented
  Country Z.
- `frq-migration-flows-two` (scales-of-analysis, migration-causes, migration-effects): Source 1 a flow map of
  Country A (drawn figure, invented flows, every number repeated in the caption so it reads on a phone); Source 2
  a remittance table by province (invented).

Figures: 14 SVGs from `scripts/aphug-figures/author-b.mjs` (12 lesson figures, the 2.11 flow map, the FRQ 3 flow
map), registered in `human-geography/data/figures/<topic>.json`. The two flow maps draw a base with
`ApHugMap.svg` and add arrows. No labels files. My authoring scripts were scratch (`/tmp/hug-b`); the JSON and HTML
in `human-geography/data/` are the source.

## Map edits (`docs/aphug-dependency-map.json`)

Only unit-2 `tools.stimulusThemes`: the planned flow map entry is now `stimulus: "image"` (flow maps are not a map
rendering yet), and 11 entries were added for the sets above. No concept changes were needed: Ravenstein sits in
2.8 as the CED has it.

## Requests for the lead

1. **Flow maps as a map rendering** (needs-author `map-renders`): a `render: 'flow'` with
   `flows: [{ from, to, value }]` in `hug-map.js` would let the 2.11 set be a `map` set and keep every word in HTML.
   Until then both flow maps are images whose captions carry the numbers.
2. **Figure legibility at 360 px**: 720 px diagrams shrink their 15 px text to about 6 px on a phone (all authors'
   figures). A tap-to-enlarge on `.hug-figimg`, as maps have ("Open the map full size"), would fix it in one place.
3. Please add the open points below to `docs/aphug-needs-author.md` (briefs say authors do not edit shared docs).

## Open points (for `docs/aphug-needs-author.md`)

- **TFR map classes** (`population-dynamics-s1`): written from memory of UN WPP 2024 because the session could not
  reach population.un.org or the World Bank API. Countries near 2.1 or 4.0 are left unshaded (Bangladesh,
  Indonesia, Philippines, Ethiopia, Senegal, Togo, Madagascar and others). Verify every class against WPP 2024
  (2023 estimates) before publish. No question hinges on a borderline country.
- **Remittance chart** (`migration-effects-s1`, notes, hook): India 120, Mexico 66, China 50, Philippines 39,
  Pakistan 27 billion US dollars (World Bank, Migration and Development Brief 40, June 2024): verify.
- Facts to verify once (I am confident, not certain): Bangladesh TFR 2.3 (BDHS 2022); Egypt arable land about
  3 percent (World Bank, 2021); Japan more than a quarter 65+ (2023) and natural decrease every year since the late
  2000s; Italy nearly a quarter 65+ (Istat, 2024); Iran's 2021 law limiting free contraception; China 2021 rule
  wording ("penalties dropped, support for child care"); Romania births nearly doubled in 1967; Ireland's population
  fell about a fifth 1841-1851; Great Migration about 6 million; Trans-Atlantic Slave Trade Database about 12.5
  million; Sudan the largest displacement in 2024 (UNHCR).
- The Malthus passage replaces "Subsistence" with "[The food supply]" because "subsistence" is taught in Unit 5;
  a reviewer may prefer the original word in a preview box.
