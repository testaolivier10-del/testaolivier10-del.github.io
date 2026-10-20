# AP® Environmental Science: Phase 0 dependency map

The map is `docs/apenv-dependency-map.json`. It is checked by
`node scripts/check-apenv-map.mjs --check` (library `scripts/lib/apenv-map.mjs`, tests
`scripts/test/apenv-map.test.mjs`); `--order` prints the course order. If this file and the JSON disagree,
the JSON is right. Unit and topic facts come from `docs/apenv-ced-map.json` (our own words, from
`docs/apenv-research/framework.md`); no CED text is reproduced. Open questions are in
`docs/apenv-needs-author.md`.

## The CED check (Phase 0, 2026-10-20)

| Source | What it settled |
|---|---|
| Course at a Glance poster | All 99 topic titles, in order (11, 7, 9, 9, 17, 13, 8, 15, 10) |
| CED PDF, readable to about 112k characters (into Topic 3.7) | Units 1-4 titles again, most of Units 5-9; learning objectives and essential knowledge through 3.7 |
| Course and exam pages | Unit weights, the May 2027 exam format, the calculator rule, no formula sheet |
| Wikipedia, Fiveable (third party, agree) | Practice weights in Section I and Section II |

Every title in the CED map is official (`source` per topic). The `objectives` and `knowledge` lines after 3.7
are our summaries of the titles and the course, not checked against the CED (needs-author `ced-text`). The
practice weights are third party and are not enforced in exam forms until a person confirms them
(`practicesConfirmed`, needs-author `practice-weights`).

## Counts

| | |
|---|---|
| Chapters | 10: Units 1-9 (CED weights) and one skills chapter, "Math you need" (`skills-math`) |
| Topics | 104: the 99 CED topics in order, 5 math topics |
| Concepts | 386, each with its terms and aliases; 4 also carry `notation` (GPP, NPP, LD50, scientific notation) |
| Everyday words | 60 (ecosystem, population, species, habitat, predator, precipitation, carbon dioxide, photosynthesis, fertilizer, percent, rate, climate change ...) |
| Planned tools | 13 simulators (the 12 trainers of spec section 6 and `justify`), 14 FRQ themes (5 calc, 4 design, 5 data, each with its author), 16 stimulus themes (9 quantitative, 5 visual, 2 text), 15 comparison tables, 9 pathways |

Concepts per chapter: math 14, Unit 1 90, Unit 2 25, Unit 3 30, Unit 4 35, Unit 5 58, Unit 6 34, Unit 7 28,
Unit 8 46, Unit 9 26. Authors add a concept, with `taughtIn` and `dependsOn`, whenever a topic teaches a term the
map does not have.

## Format

As `docs/apstat-phase0.md`, with these differences:

- `practices[]` are the seven CED practices (1 Concept Explanation, 2 Visual Representations, 3 Text Analysis, 4
  Scientific Experiments, 5 Data Analysis, 6 Mathematical Routines, 7 Environmental Solutions) with their skills
  (1.A-7.F); 3.D, 3.E and 4.D are not assessed (`NOT_ASSESSED`), and a topic may not focus on them.
- `bigIdeas` are ENG, ERT, EIN, STB; every topic names at least one.
- `topics[].ced` runs without gaps (`ENV_TOPICS` and `UNIT_SIZES` in `scripts/lib/apenv-map.mjs`).
- FRQ themes have type `design`, `data` or `calc` (`FRQ_TYPES`, the May 2027 Q1-Q3), at least 4 of each, and
  name the author of spec section 5a. Stimulus themes have `stimulus`: `quantitative`, `visual` or `text`.
- `REQUIRED_SIMULATORS` lists the twelve trainers plus `justify`.
- Topic slugs avoid the letters "ap" as a token (`island-biogeo`, `evolving-populations`, `carrying-limits`,
  `population-transition`), so no served path carries it.

## Course order

Units in CED order. Each math topic sits right before the topic that first needs it (`before`):

| Math topic | Before |
|---|---|
| `math-sci-notation` (scientific notation, metric prefixes, scale words) | `carbon-cycle` (1.4) |
| `math-rates` (rates and per-capita values) | `primary-productivity` (1.8) |
| `math-units` (unit conversions, dimensional analysis) | `primary-productivity` (1.8) |
| `math-percents` (percents and percent change) | `energy-flow` (1.10) |
| `math-doubling` (growth rates, doubling time, the rule of 70) | `population-growth` (3.5) |

No circular dependencies. Two places to watch in Phase 1: photosynthesis is an everyday word (1.1-1.3 may
name it) but its process and cellular respiration are taught in 1.4, the carbon cycle, before 1.8 builds GPP and
NPP on them; and the growth rate of 3.8 uses the rule of 70 that the math chapter places before 3.5.

## The ordering rule

As AP® Statistics: no page may use a concept's term or notation before the topic that teaches it, except
everyday words. Prose is scanned for terms and TeX for `notation`, so `$\text{NPP}$` before 1.8 fails, as does
"biomagnification" before 8.8.

## The rest of Phase 0

The runtime fork, the item types and the registration are described in `docs/apenv-architecture.md`. What a fresh
session needs to know:

- Build: `node scripts/build-apenv.mjs` (`--check` in CI). Nothing is published
  (`environmental-science/data/published.json` is empty), so the skeleton is 24 files and every page is noindex.
- Test fixture: `scripts/test/fixtures/apenv-data/` holds one placeholder topic (3.8, `human-population`, 16
  items of every type, one quantitative, one visual and one text set) and one FRQ of each type (the calc FRQ
  with a numeric and a setup check); it proves the engine and is never published.
- Identity and free tier live in one place each: `IDENTITY` and `FREE_UNITS` in `scripts/lib/apenv-build.mjs`
  (plus the CSS values in `env.css` and `assets/theme.css`, the ranks in `assets/hub-progress.js` and
  `COURSES.apenv` in `assets/premium.js`, which a test keeps in step), the free trainers in
  `environmental-science/data/pages.json`.
- Accent (decision 5): light `--cink #474A10` on `--ctint #EFF0DA` (8.0:1; 9.3:1 on white, 8.6:1 on the page and as
  button text); dark `--cink #DCDB98` on the card (11.2:1) and on its tint `rgba(200,200,100,0.10)` (9.1:1);
  soft `#D3D27F`; the home path color `#7E8126`.
