# Author C self-review: Unit 4, Earth Systems and Resources (2026-10-20)

## Topics done (9 of 9)

Each has a lesson, notes (750-980 words, `<h2>` sections, worked examples before every calculation, comparison tables), a question bank, a glossary entry for every concept the map lists, and at least one figure.

| Topic | Items | Types | Stimulus sets |
|---|---|---|---|
| plate-tectonics (4.1) | 16 | 12 single, 1 multi, 1 specific, 1 numeric, 1 setup | visual (boundaries diagram), quantitative (seafloor age plot) |
| soil-formation (4.2) | 16 | 13 single, 1 specific, 1 numeric, 1 setup | visual (horizons), quantitative (soil-loss table), text (farmer's account) |
| soil-properties (4.3) | 15 | 10 single, 3 numeric, 1 setup, 1 specific | visual (texture triangle with samples A-D), quantitative (drainage table) |
| atmosphere (4.4) | 15 | 10 single, 4 numeric, 1 multi | quantitative (U.S. Standard Atmosphere plot), quantitative (dry-air table) |
| global-wind-patterns (4.5) | 15 | 12 single, 1 order, 1 numeric, 1 specific | visual (cells diagram), quantitative (rain by latitude bar chart) |
| watersheds (4.6) | 15 | 11 single, 1 multi, 1 setup, 1 numeric, 1 specific | visual (divide and aquifer), quantitative (two-creek table) |
| solar-radiation-seasons (4.7) | 15 | 11 single, 2 numeric, 1 setup, 1 specific | quantitative (insolation curve), quantitative (albedo table) |
| geo-and-climate (4.8) | 15 | 13 single, 1 numeric, 1 specific | visual (rain shadow), quantitative (two-town table) |
| el-nino-la-nina (4.9) | 17 | 15 single, 1 numeric, 1 setup | visual (SST map, El Niño vs La Niña), quantitative (dual-axis SST and anchovy catch), text (forecast bulletin) |

Total 139 items, 21 stimulus sets (6 visual, 13 quantitative, 2 text). Every topic is at least 47% in sets and at least 88% apply/analyze; the key is the longest option in at most 3 single items per topic.

Brief stimulus sets delivered: `visual` texture triangle with marked samples (`soil-properties-s1`), `visual` Pacific SST map in El Niño and La Niña (`el-nino-la-nina-s1`).

## FRQs (2)

- `frq-soil-properties-design` (design, 10 points): soil texture and erosion on tilted trays; IV, DV, directional hypothesis, constant and why, replication, slope change prediction, stream effect chain.
- `frq-el-nino-la-nina-data` (data, 10 points): six winters of SST difference, trade winds and rainfall in Peru and Indonesia; reading values, inverse relationship with numbers, percent change (setup check recomputed), identify La Niña, explain Peru rain, fishery effect chain.

## Figures (11, `scripts/apenv-figures/unit-4.mjs`)

plate-tectonics-boundaries, soil-formation-horizons, soil-properties-texture-triangle, soil-properties-samples, atmosphere-layers, global-wind-patterns-cells, watersheds-divide-aquifer, solar-radiation-seasons-tilt, geo-and-climate-rain-shadow, el-nino-la-nina-compare, el-nino-la-nina-sst-map. All rendered to PNG and inspected; overlaps fixed; ENSO comparison text enlarged for phone width. The texture triangle draws the USDA class polygons, and the sample classes come from the same polygons (point-in-polygon), checked against the USDA rules. The atmosphere figure is drawn from the U.S. Standard Atmosphere, 1976 boundary temperatures. Five plot-spec stimuli and the FRQ chart were rendered and inspected too.

## Numeric recheck

22 calculated keys (21 items plus the FRQ check) recomputed in a scratch script from each stem's numbers, independent of the recipes: all match. Every key is graded right and every authored mistake (46) graded wrong by `ApEnvGrade.numeric` / `ApEnvExpr.gradeSetup` loaded in a vm from the browser files.

## Checks

- `node scripts/check-apenv-content.mjs --topic <id>`: ok for all 9 topics; full run 0 failing, FRQ 0 failing.
- `node scripts/check-apenv-map.mjs --check`: nothing used before it is taught.
- `APENV_PUBLISHED=unit-4 node scripts/build-apenv.mjs --out <scratch>`: 9 topics built; one notes page loaded in a browser with no errors.
- `node --test scripts/test/apenv-*.test.mjs`: 142 pass, 3 fail, all in builder T3's in-progress tool tests (air-pollution, earth-climate, energy-chain), not in content.
- No em dashes; American spelling.

## Map edits

None.

## Open questions (also in `docs/apenv-needs-author.md`, "Author C")

1. FRQ soil erodibility ranking (sand < loam < silt loam); clay left out on purpose as contestable.
2. Shared `env-plot.js`: dual-axis labels and legend collide at default width; worked around with `width`.
3. Real-data stimuli (standard atmosphere, dry-air composition) taken from standard references; the NASA fact-sheet fetch was not answered in this session, so a person should spot-check.
4. Insolation curve is labeled invented but rounded from a computed yearly average.
