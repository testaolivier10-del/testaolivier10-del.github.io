# Self-review: author F (Unit 7, 7.1-7.8, and Unit 8, 8.1-8.11)

Written 2026-10-20. Every topic below passes `node scripts/check-apenv-content.mjs --topic <id>` with no failures or
warnings; the full run reports 0 failing, with no bank-wide or FRQ findings; `node scripts/check-apenv-map.mjs --check`
reports "Nothing is used before it is taught." `node --test scripts/test/apenv-questions.test.mjs
scripts/test/apenv-map.test.mjs`: 30 pass, 0 fail. A scratch build (`APENV_PUBLISHED=unit-7,unit-8 node
scripts/build-apenv.mjs --out <scratch>`) built 23 topics (92 files); built notes and lesson pages loaded in Chromium at
390 px wide with no page errors, no failed requests and no horizontal scroll.

## Topics done (19 of 19)

| Topic | CED | Items | In sets | Sets (kind) | Figure |
|---|---|---|---|---|---|
| `air-pollution` | 7.1 | 16 | 7 | quantitative (city emissions by source), visual (airborne lead, bar plot) | `air-pollution-primary-secondary` |
| `photochemical-smog` | 7.2 | 16 | 7 | **visual (NO, NO2 and ozone through a day, line plot)**, quantitative (ozone and weather) | `photochemical-smog-day` |
| `thermal-inversion` | 7.3 | 16 | 8 | quantitative (temperature by height), visual (PM2.5 over three days, line plot) | `thermal-inversion-profile` |
| `co2-particulates` | 7.4 | 15 | 7 | visual (PM2.5 and visibility, dual plot), quantitative (PM10 by source) | `co2-particulates-natural-sources` |
| `indoor-air` | 7.5 | 16 | 8 | quantitative (radon by bedrock), visual (formaldehyde off-gassing, line plot) | `indoor-air-house` |
| `reducing-air-pollutants` | 7.6 | 15 | 8 | quantitative (coal plant before and after controls), text (SO2 cap-and-trade passage) | `reducing-air-pollutants-devices` |
| `acid-rain` | 7.7 | 15 | 8 | visual (SO2 and rain pH, dual plot), quantitative (four lakes, buffering) | `acid-rain-pathway` |
| `noise-pollution` | 7.8 | 15 | 8 | visual (sound levels, bar plot), quantitative (songbirds by highway distance) | `noise-pollution-decibels` |
| `pollution-sources` | 8.1 | 15 | 7 | quantitative (river nitrogen by source), visual (nitrate after a storm, line plot) | `pollution-sources-point-nonpoint` |
| `human-impacts-ecosystems` | 8.2 | 15 | 7 | quantitative (indicator insects below a pipe), visual (coral cover and temperature, dual plot) | `human-impacts-ecosystems-indicators` |
| `endocrine-disruptors` | 8.3 | 15 | 8 | quantitative (intersex fish by site), visual (frog dose study, bar plot) | `endocrine-disruptors-receptor` |
| `wetlands-mangroves` | 8.4 | 15 | 8 | **text (proposed wetland development)**, quantitative (mangrove width and storm damage) | `wetlands-mangroves-services` |
| `eutrophication` | 8.5 | 16 | 8 | visual (algae and bottom DO through a summer, dual plot), quantitative (five lakes) | `eutrophication-chain` |
| `thermal-pollution` | 8.6 | 15 | 8 | visual (DO saturation by temperature, USGS, line plot), quantitative (river below an outlet) | `thermal-pollution-plant` |
| `persistent-organic-pollutants` | 8.7 | 15 | 7 | quantitative (pesticide in Arctic seals), visual (persistence in soil, line plot) | `persistent-organic-pollutants-transport` |
| `bioaccumulation-biomagnification` | 8.8 | 15 | 9 | quantitative (pesticide up a food chain), quantitative (mercury by fish age) | `bioaccumulation-biomagnification-chain` |
| `solid-waste` | 8.9 | 15 | 8 | quantitative (EPA 2018 MSW management), visual (landfill methane captured, bar plot) | `solid-waste-landfill` |
| `waste-reduction` | 8.10 | 15 | 7 | quantitative (pay-as-you-throw), text (plastic bag fee passage) | `waste-reduction-hierarchy` |
| `sewage-treatment` | 8.11 | 15 | 8 | quantitative (water quality through a plant), visual (DO sag below an outfall, line plot) | `sewage-treatment-stages` |

Totals: 290 items (203 single, 2 multi, 4 order, 42 numeric, 19 setup, 20 specific). Each topic has at least 93%
apply/analyze and at least 43% of its items in sets of 3-5 (the rule is 40%). 38 stimuli: 20 quantitative, 15 visual, 3 text. The brief's
two required sets are in bold above, and the extra text set on a pollution policy is the SO2 cap-and-trade passage in
7.6. Every lesson has a hook, two prerequisite questions pointing at earlier topics, a figure, a chain of 4-5 named
links, four key ideas, a misconception, 7 check items (including a calculation) and a summary. Notes are 500-750 words
with `<h2>` sections, at least one worked example (setup with brackets and units, then the answer with its unit) and
comparison tables where they help. Glossary: 62 entries, one for every concept the map assigns to these topics.

Data: stimuli are `invented: true` except two cited sets, the EPA 2018 MSW table (8.9) and the USGS dissolved-oxygen
saturation curve (8.6). The noise lesson figure uses the CDC decibel ranges with the credit in its caption.

## FRQs (2)

- `frq-photochemical-smog-data` (`data`, Unit 7): a table of hourly NO2 and ozone on a clear and a cloudy day. Parts:
  read both peaks (2), percent change with a setup check (2), explain NO2 photolysis to ozone (2), a claim on sunlight
  justified with paired values (2), and a solution other than cutting traffic with how it works (2).
- `frq-eutrophication-design` (`design`, Unit 8): a dual plot of algae and dawn dissolved oxygen in tanks given
  different phosphate doses. Parts: a directional hypothesis (1), the independent and dependent variables (2), the
  control and its purpose (2), a constant (1), a complete decomposition-and-oxygen explanation (2), a design change to
  test thermal pollution with its predicted effect (1), and a farm practice with how it works (1).

## Figures (19)

All are drawn by `scripts/apenv-figures/unit-7-unit-8.mjs` (run with no arguments to rewrite them all) as standalone
SVGs: white background, `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink `#1F2A28`, olive `#474A10`, and
Okabe-Ito blue, green and vermillion. Each is registered in `environmental-science/data/figures/<topic>.json` as a
LevlPrep original. The two data figures (`photochemical-smog-day`, `noise-pollution-decibels`) are drawn from the
numbers in the script; the smog day uses the same numbers as the 7.2 visual set. Each figure and each plot stimulus was
rendered to PNG in Chromium and checked; overlaps and clipped labels were fixed. No `labels/` files (none of the figures
use hidden labels).

## Numeric recheck

Every numeric key, setup key (and its `then` step) and FRQ check, 82 in all, was recomputed in a scratch script from a
value I derived by hand from the stem (not from the recipe) and compared with the `ApEnvCalc` recipe. With
`env-calc.js`, `env-grade.js` and `env-expr.js` loaded in a vm (via `scripts/lib/apenv-mathlib.mjs`), every key is
graded right and every authored mistake is graded wrong. Result: 82 checked, 0 failures. Real data were checked against
the sources: the EPA 2018 table and the 4.9 lb per person per day (reproduced from 292.4 million tons and about 327
million people), and the dissolved-oxygen values (recomputed from the Benson-Krause equation; 7.56 mg/L at 30 °C).

## Map edits

None.

## Open questions

Added to `docs/apenv-needs-author.md` under "Author F": the real-data sources and roughly stated facts to confirm;
atrazine as an endocrine-disruptor example (the evidence is debated, so the wording says "in some studies"); mercury
sources (coal and small-scale gold mining); ordering workarounds ("germs" before 8.15 teaches "pathogen", DDT kept out
of 8.3, malaria not named in 8.7); runtime limits I worked around without changing shared files (`ApEnvExpr` cannot read
`ng`, a bare `s` after a rate, or `m2 × m`; `ApEnvPlot` bars are linear only); CDC is missing from `PUBLIC_SOURCES`;
and the FRQ point splits.

The full map check (no `--check`) also printed one failure in another author's file at one point during this session
(`atmosphere.json`, stimulus s2, "CO" used before 7.1); it was not in my files, and the run at the end of this session
was clean.
