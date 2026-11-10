# Author D self-review: Unit 4, Political Patterns and Processes (2026-11-09)

All ten topics and three FRQs are written. `node scripts/check-aphug-content.mjs --topic <id>` reports nothing for
each Unit 4 topic, the three FRQs pass `checkFrq`, and `node scripts/check-aphug-map.mjs --check` passes. A scratch
build (`APHUG_PUBLISHED=unit-4 node scripts/build-aphug.mjs --out /tmp/hug-d/build`) wrote all 10 topics and 6 maps.
Nothing is published.

## Topics

| Topic | Items | Sets (kind: base) | In sets | Recall | Typed items | Notes words | Glossary |
|---|---|---|---|---|---|---|---|
| political-intro (4.1) | 16 | map: world; data | 7 | 1 | multi, specific | 711 | 7 |
| political-processes (4.2) | 16 | map: sub-saharan-africa (choropleth, dated); text (UN Res. 1514, 1960) | 7 | 1 | numeric, order, specific | 690 | 3 |
| power-territoriality (4.3) | 16 | map: north-africa-sw-asia (choke points); text (Suez 2021) | 7 | 1 | multi, specific | 740 | 4 |
| defining-boundaries (4.4) | 16 | map: world (six boundaries A-F); data | 8 | 1 | model (tiers), multi, specific | 735 | 7 |
| boundary-functions (4.5) | 15 | image (lettered sea zones); text | 7 | 0 | numeric x2, model (rings) | 691 | 8 |
| internal-boundaries (4.6) | 16 | image (two districting plans); data | 7 | 2 | numeric x2, multi, specific | 640 | 2 |
| forms-of-governance (4.7) | 15 | data; text (Tenth Amendment, 1791) | 7 | 1 | multi, model (tiers), specific | 579 | 2 |
| devolution-factors (4.8) | 16 | data (three referendums, sourced); map: country-a | 7 | 1 | numeric, multi, specific | 668 | 5 |
| sovereignty-challenges (4.9) | 16 | data (supranational functions, sourced); map: world | 7 | 1 | multi, specific | 699 | 3 |
| centrifugal-centripetal (4.10) | 16 | text; data | 7 | 1 | model (tiers), multi, specific | 596 | 2 |

158 items, 20 stimulus sets (5 map on real outlines, 1 map on Country A, 7 data, 2 image, 5 text), 6 numeric items
(each an `ApHugCalc` recipe with the slip as an authored mistake), 4 model items (boundary types, sea zones,
US levels of government, Canada's forces). Every lesson has a figure, a 3-step chain, a misconception aimed at a
reader-report error (nation vs state, territoriality vs sovereignty, one boundary one type, EEZ as full rule,
seats follow votes, federal without a national level, devolution means independence) and 6 check items.

## Figures

11 LevlPrep original SVGs from `scripts/aphug-figures/author-d.mjs` (480 wide, text 14 px or more; `--check` mode):
`political-intro-nations`, `political-processes-waves`, `power-territoriality-choke`, `defining-boundaries-types`,
`boundary-functions-zones` (labeled) and `-zones-lettered` (stimulus), `internal-boundaries-plans`,
`forms-of-governance-power`, `devolution-factors-wheel`, `sovereignty-challenges-updown`,
`centrifugal-centripetal-forces`. Entries in `human-geography/data/figures/<topic>.json`. Rendered and looked at.

## FRQs

| Id | Type | Units | Scale part | Stimuli |
|---|---|---|---|---|
| frq-supranational-none | none | 2, 4 | F (compare national and subnational) | none |
| frq-boundary-map-one | one | 2, 4 | G (degree a world map shows the local scale) | world map: 49° N, Korean DMZ, Andes, South China Sea |
| frq-devolution-two | two | 3, 4 | A (scale of the provincial data) | Country A language choropleth; invented vote table |

Each crosses two units (migration as an intervening obstacle and pull factor; language as a centrifugal force).

## Map edits (`docs/aphug-dependency-map.json`)

- Added two concepts taught in `boundary-functions`: `contiguous-zone` and `international-waters` (alias "high seas"),
  both on `unclos`. The borders-lab brief (T4) uses them.
- Unit 4 `tools.stimulusThemes`: the planned districting `map` became an `image` (a drawn grid; Country A has only
  eight provinces, too few for two plans), and the 18 other sets above were added.

## Accuracy and neutrality

- Contested cases use control, claim and recognition with a date and never decide a key: Kashmir avoided; Taiwan and
  Kosovo only as examples of disputed recognition; Crimea in notes only ("as of 2026, Russia controls it, while the UN
  General Assembly and most states treat it as part of Ukraine"); South China Sea claimants listed with the 2016
  ruling and China's rejection; Persian Gulf with "Arabian Gulf in many Arab states"; Somaliland left unvalued on the
  map. Ethnic cleansing and genocide attributed to the ICTY and ICJ. Catalan, Scottish and Quebec views described as
  divided; the CFA franc as "critics call it".
- No graded item hinges on a membership count or a figure that changes within a year; real figures are historical
  (referendums, dates) and sourced. Invented data are labeled.
- No non-CED model is keyed; state shapes appear only in a `hug-aside` ("your class may name this").
- Every fact written from memory is listed in `docs/aphug-needs-author.md` under `unit-4-facts` for a source check.

## Open points

1. `unit-4-facts` in needs-author: the referendum figures, the Africa independence classes and the supranational
   table need a source check before Unit 4 is published.
2. The CED's 4.9 names "economies of scale" and "trade deals" as drivers of supranationalism, but the map teaches
   economies of scale and trade agreements in Units 5 and 7, so Unit 4 paraphrases them ("a larger market lets firms
   sell to more people at lower cost"). The lead may want a preview box or to move `economies-of-scale` earlier.
   Likewise 4.10's "infrastructure" is written as "roads, rail and power lines" (infrastructure is taught in 6.x).
3. Bank-wide test-wise rule: select-all items with one correct option were 4 of 42 across the course; two of mine now
   have one correct option (6 of 43). Other authors' multis set the rest.
4. Full-course check shows other authors' and builders' failures (missing figures for Unit 2, borders-lab and
   model-studio data); none are in Unit 4 files.
