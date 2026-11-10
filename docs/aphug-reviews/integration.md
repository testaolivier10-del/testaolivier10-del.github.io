# AP® Human Geography: integration pass (shared layer), 2026-11-09

Every "Requests for the lead" and open-points section in `self-a.md` to `self-g.md`, `self-t1.md` to `self-t4.md`,
and the lead notes in `u1.md` to `u7.md` and `originality.md`, applied in the shared files with a test each
(`scripts/test/aphug-integration.test.mjs`, `aphug-maps.test.mjs`, `aphug-model.test.mjs`, `aphug-map.test.mjs`,
`aphug-calc.test.mjs`). After the pass: 151 aphug tests pass, `check-aphug-content` and `check-aphug-map` report 0
failing, `build-appsych.mjs --check` (and Macro, Micro, Statistics, Environmental Science) byte-identical,
`build-paths.mjs --check` and `build-aphug-basemaps.mjs --invented --check` clean, course shell 79.2 of 80 KB.
The generated pages are stale until `node scripts/build-aphug.mjs` runs (left for the lead's commit).

Screenshots (Playwright at 360 and 1280 px, a fixture copy in `/tmp/hug-int`): a world flow map, a Country A flow
map with province codes, the metro base as a choropleth, a free-layout model item, a figure with Enlarge and the
enlarged dialog. Fixes made from them: arrow heads capped at a third of a short arrow; arrows stop short of area
labels; the Enlarge button sits under the drawing (it covered the bottom-right words).

## What changed, by file

| File | Change | Request |
|---|---|---|
| `assets/tools/hug-tools.js` | drill(): `fb` declared before `ApHugModel.mount` (every model step threw); the step's `figureHtml` passed to `ApHugModel.html`; `o.mixedLabel` names the picker's first option | T1 1, 3, 5; T4 1 |
| `assets/tools/hug-tools.css` | `.ls-root .hug-model-grid` one column, art 220 px (260 for stages) in the Studio dock | T4 3 |
| `assets/tools/hug-tool-math.js`, `assets/hug-grade.js` | sign slip "The size is right but the sign is wrong." (no z score); the `noQuestion` hint no longer says "hypothesis"; comments cleaned. Grep of the runtime for z score, study, participants, psy-: nothing else | T1 4, T2 2, T3 2, T4 4 |
| `scripts/build-aphug.mjs` | tool pages load `hug-map.js`; an FRQ page's Premium gate follows its latest topic in course order (it followed `units[0]`, so a Unit 1 + Unit 6 FRQ was free) | T1 2, T2 1, T3 1, T4 2; lead 10 |
| `assets/hug-model.js`, `hug.css` | `free` layout: numbered badges centered in each box on the figure, the places listed under it with the same numbers (nothing laid over the drawing; no figure, list only); `groups` of interchangeable slots, graded in any order, slip "X belongs with A or B, not C"; `accepts()` exported | T1 3, 6; F 2 |
| `scripts/lib/aphug-build.mjs` | a bank model item with `layout: 'free'` needs `model.figure`; the build turns it into `modelFigure` (passed to pages and to the static HTML, re-rooted); a missing figure is a listed problem. `figureImg` adds Enlarge (not on labeled figures or model drawings) | F 2; lead 4, 7 |
| `assets/hug-nav.js`, `hug.css` | Enlarge: on screens under 760 px a button under each figure, and a tap on a drawing shown under 85% of its width, open a full-screen dialog with the drawing at its own width (Close, Esc, focus kept in the dialog and returned). Macro and Psychology have no such feature; maps keep "Open the map full size" | B 2; lead 7 |
| `assets/hug-map.js`, `hug.css` | `render: 'flow'` (curved arrows, width from the value, opposite flows bend apart, heads capped, a legend of three sample widths at the map's scale; 1 to 12 arrows); `labels: 'codes' \| 'names'` and `labelOnly` (codes get a key in the legend; overlapping names are refused); metro lines, stations and the central city limit drawn and always in the legend; `num()` thousands separators in symbol and flow legends; `note()` reads a base's own note | B 1; F 1; G; T3 3 |
| `scripts/build-aphug-basemaps.mjs`, `figures/base/metro.json`, `country-a.json` | new `metro` base (600 x 420, invented: Central City inside its limit, eight suburbs, rural fringe, river, rail line with six stations, a ring highway and a western highway); Country A areas get two-letter codes; `--invented` rewrites or checks the two invented bases with no atlas | F 1; G; lead 6 |
| `hug.css` | the plot legend rule is `p.hug-legend` (it hit map legends) | T3 4 |
| `assets/tools/hug-plot.js` | the y-axis name has its own band above the plot (it sat on the data); one 0 at a shared corner; the x-axis name 3 px lower | T4 5 |
| `docs/aphug-dependency-map.json`, `scripts/lib/aphug-map.mjs` | placements below; a pulled-forward concept counts for its `fullIn` topic too | lead 9 |
| Tool workarounds removed | `model-studio.js` (mount wrapper, map loader, Any model label added), `map-reader.js`, `scale-lab.js`, `borders-lab.js` and `city-lab.js` (mount wrappers, map loader), the dock grid rules in `borders-lab.css`, `city-lab.css`, the free-slot overrides in `model-studio.css`; every tool's validator and test pass | lead 2 |
| `assets/tools/model-studio.js` | only contexts marked `free` (the demographic transition) are free drills; the gate no longer follows the free topic 2.5, which also holds the epidemiological drills | T1 open point; lead 14 |
| `docs/aphug-needs-author.md` | `map-renders` updated; new `scale-words`, `publish-order`, `tools-facts`; Unit 2 items 12 and 13 updated. Authors B, C and F's points were already copied by the reviewers | B 3, C, F 3; lead 12 |
| `docs/aphug-briefs/e.md`, `g.md` | the FRQ lines match the rewritten `frq-farm-trade-one` and `frq-industrial-cluster-two` | u5, originality |

## Decisions on ordering (lead item 9)

| Word | Where wanted | Decision |
|---|---|---|
| colonialism | 1.7 (determinism's history) | pull-forward into `human-environment`, full in 3.6 |
| terraces, irrigation | 1.7 (possibilism) | pull-forward into `human-environment`, full in 5.1 and 5.10 (they no longer depend on "agriculture") |
| economies of scale, tariff | 4.9 (CED names them; Unit 4 FRQ) and Unit 5 | pull-forward into `sovereignty-challenges`, full in 5.7 and 7.6 |
| trade deals | 4.9 | nothing needed: not a course term. "trade agreement" and "trade bloc" stay in 7.6 |
| infrastructure | 4.10 (CED: fairer infrastructure), 5.9 | pull-forward into `centrifugal-centripetal`, full in 6.7; no longer depends on "city" |
| Industrial Revolution | 5.4 | preview box (`class="hug-preview" data-concept="industrialization"`), the map's first |
| periphery | Unit 5 | no change: the world-system terms stay in Unit 7, Unit 5's "lower-income countries" is right for it |
| IMF | earlier topics | no change: no topic before 7.6 needs it |
| subsistence (Malthus) | 2.6 | the bare word is no longer an alias of subsistence agriculture |

Self-e's map edits (irrigation to 5.1, GMO to 5.5) confirmed (u5 asked).

## What content should now change (for the authors or reviewers; not edited here)

- 1.7 `human-environment`: one-line definitions of colonialism, terraces and irrigation, then the natural wording
  can return (u1's "colonial" note in the determinism figure is fine now).
- 4.9 `sovereignty-challenges`: define economies of scale and tariff in a line; restore the CED's "economies of
  scale" and "trade deals" (self-d 2); `frq-supranational-none` may say "tariffs" for "taxes on imports".
- 4.10 `centrifugal-centripetal`: define infrastructure; "roads, rail and power lines" may become
  "infrastructure".
- Unit 5: "taxes on imports" may say "tariffs" (`global-agriculture`), "roads, ports and storage" may say
  "infrastructure"; 5.4 may add the Industrial Revolution preview box and use the name inside it.
- 2.6: the Malthus passage may restore "Subsistence" with a gloss (owner's choice).
- Flow maps that can become `map` stimuli (list only): `forced-voluntary-migration-s1` (step migration from
  Oaxaca to the US; arrows on [lon, lat] points, marks for the steps), `frq-migration-flows-two` Source 1 (Country A
  migrants a year: `labels: 'codes'` plus flows). Metro: `frq-rail-boundary-one` Source 1 (the base has the
  central city limit, suburbs and a rail line with six stations); `sustainability-challenges-s1` only if a growth
  boundary line is added to the spec (the base has no such line). Not maps: `farm-organization-s2` and
  `global-agriculture-s1` (chains of boxes), `city-structure-s1`, `urban-sustainability-s1`, `settlement-survey-s1`,
  `human-environment-s1`, `culture-on-the-land-s2` (drawings).
- Country A maps may now show province codes (`labels: 'codes'`, self-g).
- Scale words in notes prose (not keyed; all keys, the glossary, the skills topic and scale-lab already say
  "local (subnational)" for province data): `development-measures` (Kerala "at the regional scale"),
  `second-agricultural-revolution` (inside Britain), `cultural-patterns` (inside Quebec), `culture-intro` (Bali),
  `centrifugal-centripetal` ("provincial scale"), `defining-boundaries` and `forms-of-governance` ("subnational
  scale" is acceptable; the house words are "local (subnational)"); `settlement-survey` and `agricultural-origins`
  (US Midwest, Great Plains: needs-author `scale-words`).
- Model Studio may use `groups` for centripetal and centrifugal forces (T1 6) and `free` items on drawings;
  Unit 6's multiple nuclei and sector items may move from `tiers` to `free` (self-f 2).

## Confirmed, no change

- Select-all items with exactly one key: 16 of 53 (30.2%, rule at least 20%; the content check enforces it). u5's
  three one-key items may stay.
- FRQ unlock (lead 10): an FRQ is live when every unit it lists is published; `frq-language-map-one` unlocks with
  Unit 4, and `frq-farm-trade-one` no longer lists 7.6 (comparative advantage dropped), so it unlocks with Unit 5.
  Each unit published alone has no FRQ except Unit 1 (needs-author `publish-order`).
- `\$` is the literal dollar sign: `renderMath` prints it as `$` and never starts math with it; the order check
  reads it as prose (in JSON write `"\\$25"`, in notes HTML `\$25`). Tested.

## Still open

- Cartogram rendering (needs-author `map-renders`).
- A sticky piece tray on phones (T1 6) was not built.
- hug-plot: T4's two-series bar legend overlap did not reproduce at 300 or 360 px after the band fix; recheck in
  city-lab on a phone.
