# Author B self-review: Unit 2 (Supply and Demand)

Phase 1 content for Topics 2.1 to 2.9 and five FRQs (2026-11-09, resumed after the session restart; the lead's
checkpoint commit held demand and supply, the rest was written after it).

## Done

| Topic | Items | In sets | Graph | Numeric | Lesson checks | Figure(s) |
|---|---|---|---|---|---|---|
| demand (2.1) | 18 | 8 (data, text) | 5 | 1 | 6 | demand-movement-shift |
| supply (2.2) | 18 | 8 (data, text) | 5 | 1 | 6 | supply-movement-shift |
| price-elasticity-demand (2.3) | 17 | 8 (data, text) | 0 | 4 | 5 | price-elasticity-demand-ranges |
| price-elasticity-supply (2.4) | 17 | 7 (data, text) | 0 | 3 | 5 | price-elasticity-supply-curves |
| other-elasticities (2.5) | 16 | 8 (data, data) | 2 | 3 | 5 | other-elasticities-signs |
| equilibrium-surplus (2.6) | 17 | 7 (data, graph) | 5 | 4 | 5 | equilibrium-surplus-areas |
| disequilibrium-changes (2.7) | 17 | 7 (data, text) | 4 | 4 | 5 | disequilibrium-changes-gaps, -double |
| government-intervention (2.8) | 25 | 12 (graph, text, data) | 6 | 6 | 7 | government-intervention-tax, -controls |
| trade-policy (2.9) | 20 | 11 (graph, data, text) | 5 | 4 | 6 | trade-policy-tariff |
| **Total** | **165** | **76 (19 sets)** | **32** | **30** | | **11 SVGs** |

Every topic: lesson JSON, notes HTML (500+ words, worked example before each calculation or graph, comparison
tables), question bank (every option explained, 94%+ apply/analyze), glossary for every concept taught.
`node scripts/check-apmicro-content.mjs --topic <id>` is clean for all nine; `check-apmicro-map.mjs --check` is clean;
the full content run reports 0 failing and no bank-wide warnings. A scratch build with `APMICRO_PUBLISHED=unit-1,unit-2`
built all 15 topics and the FRQ pages; notes, lesson and FRQ pages were checked in Chrome.

Graph items cover label, shift, shift with equilibrium (including a double shift with only the certain axis in
`outcome`), point, line (binding ceiling and floor, world price) and shade (CS, PS, TS, CS after a shift, subsidy
cost, subsidy DWL, ceiling DWL, CS under a floor, CS at the world price, PS when exporting, tariff revenue, tariff
DWL). Letter stimuli: the tax graph (a-f), the tariff graph (a-g), the plain market (a, b); explanations name each
region's edges. Every numeric key is an `ApMicroCalc` recipe with the reader-report slips as authored mistakes
(rectangle for triangle, old quantity for tax revenue and subsidy cost, unit changes for percent changes, the
inverted ratio, dropped sign on income elasticity).

FRQs (all clean in the full run): `frq-tax-surplus-long` (units 1 and 2: graph, shade revenue, revenue and DWL,
incidence, MU per dollar, subsidy cost and its shading), `frq-trade-tariff-long` (units 1 and 2: comparative
advantage, world price graph, CS shading, imports, tariff revenue, DWL shading, surplus effects),
`frq-elasticity-short`, `frq-price-control-short`, `frq-surplus-short`.

Figures: `scripts/apmicro-figures/author-b.mjs` writes the 11 SVGs and `microeconomics/data/figures/<topic>.json`;
every number drawn is computed from the same invented markets the notes use, and each figure was rendered and
checked for overlapping labels.

## Map edits (docs/apmicro-dependency-map.json)

- New concept `market-supply` ("market supply", alias "individual supply"), taught in `supply`.
- Unit 2 `tools.stimulusThemes`: 16 entries added for the sets written (the four already listed match sets too).

## Requests for the lead (not changed by me)

1. **"AP®" scans as average product.** `scanPage` matches the "AP" in "AP®" as the `average-product` alias, so any
   page before 3.1 that writes "the AP® exam" fails ORDER. Strip "AP®" (or `AP` followed by ®) before scanning in
   `scripts/lib/apmicro-map.mjs`. I avoided the mark in Unit 2 content.
2. **Preview boxes never match.** `scanPage` tests `class="...psy-preview..."` (forked from Psychology); it should
   test `mic-preview`, as its header comment says.
3. **Tax and subsidy shift items show the answer.** On an `sd-micro` graph with `policy` tax or subsidy and a `shift`
   task, `policyLayer` draws the PB, PS and QT guides at the post-tax crossing before the student moves S. Suggest
   skipping the tax/subsidy guides when `do` includes `shift` (until the key is shown). My shift items use
   `sd-micro` without `policy`, which grades the same.

## Open points

- `midpoint` (needs-author, existing entry): taught in the 2.3 notes as one labeled route; one numeric item asks for
  it by name, and every other elasticity key uses starting values.
- FRQ and item graphs are schematic (engine coordinates 0-10); the dollar values live in the stems and tables, as in
  Macro. The tax graphs have equal slopes, so the letter items say the burden is shared evenly there; the unequal
  incidence case is taught with the kombucha table.
- Proper names used once each: Porthaven, Larkfield, Tallis Island, Wexmoor, Port Ancel, Dunmore, Teralia, Halden,
  Ostley, Dornia, Varrow (bank); Kesh, Castrel, Ostavia, Ridgeway Pottery, Lake Mirren, Corlin (FRQs).
- The checkpoint lost my scratch source for `supply`; the committed JSON is the source of truth for all topics.
