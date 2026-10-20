# Self-review: author E (Unit 6, 6.1-6.13)

Written 2026-10-20. Every file below passes `node scripts/check-apenv-content.mjs --topic <id>` with no failures or
warnings; the full run reports 0 failing with no bank-wide or FRQ findings; `node scripts/check-apenv-map.mjs --check`
reports "Nothing is used before it is taught." `node --test scripts/test/apenv-questions.test.mjs
scripts/test/apenv-map.test.mjs`: 30 pass, 0 fail. A scratch build (`APENV_PUBLISHED=unit-6 node
scripts/build-apenv.mjs --out <scratch>`) built 13 topics (61 files); built notes, a lesson and the calc FRQ were
loaded in Chromium with no page errors and no broken images.

## Topics done (13 of 13)

| Topic | CED | Items | In sets | Sets (kind) | Figure |
|---|---|---|---|---|---|
| `renewable-nonrenewable` | 6.1 | 18 | 8 | text (island energy), quantitative (woodlot harvest) | `renewable-nonrenewable-sorting` |
| `global-energy-consumption` | 6.2 | 18 | 8 | quantitative (use by fuel 1980-2020, line plot), visual (per person, bar plot) | `global-energy-consumption-per-person` |
| `fuel-types` | 6.3 | 18 | 8 | quantitative (fuel energy and CO2), visual (coal ranks) | `fuel-types-coal-ranks` |
| `energy-resources-distribution` | 6.4 | 17 | 8 | quantitative (reserves, production, use), visual (landscape) | `energy-resources-distribution-landscape` |
| `fossil-fuels` | 6.5 | 18 | 9 | quantitative (power plant step efficiencies), visual (plant) | `fossil-fuels-power-plant` |
| `nuclear-power` | 6.6 | 17 | 8 | visual (decay curve plot), visual (reactor) | `nuclear-power-reactor` |
| `biomass-energy` | 6.7 | 17 | 8 | quantitative (biofuel crops), visual (carbon cycle) | `biomass-energy-carbon` |
| `solar-energy` | 6.8 | 16 | 7 | quantitative (monthly PV output, bar plot), visual (three ways) | `solar-energy-three-ways` |
| `hydroelectric` | 6.9 | 16 | 7 | quantitative (dam output), visual (dam) | `hydroelectric-dam` |
| `geothermal` | 6.10 | 16 | 7 | quantitative (furnace vs heat pump), visual (plant and heat pump) | `geothermal-plant-heat-pump` |
| `hydrogen-fuel-cell` | 6.11 | 16 | 8 | quantitative (fuel cell vs battery paths), visual (fuel cell) | `hydrogen-fuel-cell-diagram` |
| `wind-energy` | 6.12 | 16 | 8 | quantitative (sources compared), visual (turbine) | `wind-energy-turbine` |
| `energy-conservation` | 6.13 | 16 | 8 | quantitative (home lighting audit), visual (home) | `energy-conservation-home` |

Totals: 219 items (163 single, 5 multi, 2 order, 21 numeric, 15 setup, 13 specific); 204 apply/analyze (93%); 102 in
sets (47%). 26 stimuli: 12 quantitative, 13 visual, 1 text. Every stimulus with numbers is `invented: true`. The
brief's required sets are present: energy use by fuel over decades (`global-energy-consumption-s1`) and efficiency at
each step of a power plant (`fossil-fuels-s1`). Notes: 13 pages, 7,410 words (516-677 each), each with `<h2>`
sections, a worked example before any calculation, and a comparison table. Lessons: hook, 2-3 prerequisites pointing
to earlier topics, figure, a 4-step chain, key ideas, a misconception, 6 check items, summary. Glossary: every
concept the map teaches in Unit 6 (34 definitions).

## FRQs (2)

- `frq-energy-conservation-calc` (calc, 10 points: 2+2+2+1+1+2): refrigerator percent decrease (setup check),
  carbon dioxide avoided (numeric check), therms for a 95% furnace to match an 80% furnace (setup check), money
  saved (numeric check), why natural gas still adds carbon dioxide, a solution other than the two appliances.
- `frq-global-energy-consumption-data` (data, 10 points: 2+2+2+2+2): per-person trends in a developing and a
  developed country (line plot), percent change (setup check), a claim about totals justified by per person ×
  population (numeric check), reasons for each trend, a consequence and a solution.

## Figures (13)

All standalone SVGs from `scripts/apenv-figures/unit-6.mjs` (white background, `role="img"` with `<title>` and
`<desc>`, Arial/Helvetica, ink #1F2A28, olive #474A10, Okabe-Ito second colors), registered in
`environmental-science/data/figures/<topic>.json`. Each was rendered to PNG with Playwright and inspected; overlaps
and cut-off labels were fixed (legend placement, label positions, wrapped text). The five plot stimuli (two line, two
bar, one decay curve) and the data FRQ plot were also rendered and checked against their data.

## Numeric recheck

`scratchpad/e/recheck.mjs` loads `env-calc.js`, `env-grade.js` and `env-expr.js` in a vm, compares each of the 42
calculated keys (36 bank items and 6 FRQ checks) with a value computed by hand from the stem, not the recipe, and
grades every key right and every authored mistake wrong: 42 keys, 104 mistakes, 0 problems. The authoring script also
checked each recipe against an independent hand value as items were written.

## Map edit

`tar-sands` moved from `fossil-fuels` (6.5) to `fuel-types` (6.3): the CED lists tar sands among the fuel types of
6.3, and 6.3 needed the term. One-line change to that concept's `taughtIn`; the map check passes.

## Ordering decisions

Terms taught later were kept out or paraphrased: in 6.1-6.4 "solar panels", "wind turbines", "hydroelectric" and
"geothermal" are described in plain words; "VOCs" (7.1) is "volatile chemicals" in 6.5; "carbon monoxide", "acid
rain", "greenhouse gas", "thermal pollution", "habitat loss" and "e-waste" are paraphrased throughout Unit 6.

## Open questions (added to `docs/apenv-needs-author.md` under "Author E")

CED objectives for Unit 6 unread; the tar sands map edit; typical values used in invented tables (step efficiencies,
IPCC life-cycle emissions, capacity factors, fuel energy contents, biofuel yields, hydrogen path efficiencies); rough
shares stated in notes (fossil fuels about 80%, US about 4% of people and one sixth of energy, about 2 billion people
without clean cooking fuel, Iceland and Iowa shares, LED savings); how much the CED expects on peat; the data FRQ's
solution part. Note for the lead: the generator puts an em dash in each page's `<title>` and og:title ("Fossil Fuels — AP® ..."); no authored Unit 6 file contains one.
