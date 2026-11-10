# AP® Human Geography: Phase 0 dependency map

The map is `docs/aphug-dependency-map.json`. It is checked by `node scripts/check-aphug-map.mjs --check` (library
`scripts/lib/aphug-map.mjs`, tests `scripts/test/aphug-map.test.mjs`); `--order` prints the course order. If this file
and the JSON disagree, the JSON is right. Unit and topic facts come from `docs/aphug-ced-map.json` (our own words,
from `docs/aphug-research/framework.md`); no CED text is reproduced. Open questions are in
`docs/aphug-needs-author.md`.

## The CED check (Phase 0, 2026-11-09)

| Source | What it settled |
|---|---|
| Course at a Glance and the CED (framework.md sections 2 and 3) | All 7 unit titles and 68 topic titles in order (7, 12, 8, 10, 12, 11, 8), unit weights, the five skill categories (1.A to 5.D), the three big ideas |
| Exam pages (framework.md section 4) | The May 2027 exam (Mon 3 May): 60 MCQ in 60 min (50%), 3 FRQs in 75 min (50%), 7 points each, Q1 no stimulus, Q2 one, Q3 two; no calculator; five options |
| Scoring guidelines and Chief Reader Reports 2023 to 2025 (framework.md section 5) | The task verbs and what each earns; the common errors (no scale, a name for a describe, an explain with no link, a compare with one side) |

The titles are official. Objectives, knowledge and exclusions are our summaries (needs-author `ced-text`); focus
skills per topic are our choice (`topic-skills`); skill weights are not enforced until `practicesConfirmed`.

## Counts

| | |
|---|---|
| Chapters | 8: Units 1 to 7 and one skills chapter, "Skills you need" (`geo-skills`) |
| Topics | 71: the 68 CED topics in order and 3 skills topics (`skills-reading`, `skills-scale`, `skills-frq`) |
| Concepts | 318 starting concepts, each with its terms and aliases (skills 6, Unit 1 51, Unit 2 51, Unit 3 35, Unit 4 41, Unit 5 47, Unit 6 45, Unit 7 42) |
| Everyday words | 46 (map, population, migration, culture, city, urban, farming, ...) |
| Planned tools | 9 simulators (the 8 trainers of spec section 6 and `justify`), 21 FRQ themes (7 of each type: no stimulus, one, two; each with its author, spec section 5a), 30 stimulus themes, 17 comparison tables |

Authors add a concept, with `taughtIn` and `dependsOn`, whenever a topic teaches a term the map does not have.

## Format

As `docs/appsych-phase0.md`, with these differences:

- `practices[]` are the five CED skill categories (1 Concepts and Processes, 2 Spatial Relationships, 3 Data
  Analysis, 4 Source Analysis, 5 Scale Analysis) with skills 1.A to 5.D. All five are assessed in both sections.
- `bigIdeas` are the CED's three (PSO Patterns and Spatial Organization, IMP Impacts and Interactions, SPS Spatial
  Processes and Societal Change); each topic names one or more.
- `topics[].ced` runs without gaps (`UNIT_SIZES` in `scripts/lib/aphug-map.mjs`).
- FRQ themes have type `none`, `one` or `two` (`FRQ_TYPES`), at least 7 of each; a one or two stimulus theme names
  its stimulus kinds (`map`, `data`, `image`, `text`).
- `REQUIRED_SIMULATORS` lists the eight trainers plus `justify`.
- Topic slugs avoid the letters "ap" (`views-of-the-world` for 1.1, `transition-model` for 2.5,
  `culture-on-the-land` for 3.2), so no served path carries the token.

## Course order

Units in CED order. The three skills topics come first, before 1.1 (`before: views-of-the-world`), because every
unit uses them and both exam sections test them from the first week:

| Skills topic | What it teaches |
|---|---|
| `skills-reading` (Reading Maps and Data) | legends, map types, reading a table and a chart, a pattern stated with where, what and how much |
| `skills-scale` (Scale of Analysis and Map Scale) | local, regional, national, global; map scale as a ratio; why a pattern changes with scale |
| `skills-frq` (How FRQs Are Scored and What Each Task Verb Demands) | the six task verbs, one point per part, the specific answer |

No circular dependencies. Places to watch in Phase 1: "scale" means both map scale and scale of analysis (the
skills topic teaches both and says which is which); "diffusion" and its types stay strict until
3.4 (write "spread" before then); "development" stays everyday until Unit 7 names its measures; "region" is taught in 1.7 and reused
everywhere.

## The ordering rule

As AP® Environmental Science: no page may use a concept's term or notation before the topic that teaches it, except
everyday words. So "physiological density" before 2.2 fails, as does "stimulus diffusion" before 3.4 or "bid-rent
theory" before 5.6.

## The rest of Phase 0

The runtime fork, the maps, the model item, the FRQ format and the registration are in `docs/aphug-architecture.md`.
What a fresh session needs to know:

- Build: `node scripts/build-aphug.mjs` (`--check` in CI). Nothing is published (`human-geography/data/published.json`
  is empty), so the skeleton has no topic pages and every page is noindex.
- Fixture: `scripts/test/fixtures/aphug-data/` holds one placeholder topic (2.3, `population-composition`, 44 items:
  every item type, four model items, every stimulus format and map rendering) and one FRQ of each type; it proves the
  engine and is never published.
- Identity and free tier live in one place each: `IDENTITY`, `FREE_UNITS` and `FREE_TOPICS` in
  `scripts/lib/aphug-build.mjs` (plus the CSS values in `hug.css` and `assets/theme.css`, the ranks in
  `assets/hub-progress.js`, the home words in `scripts/lib/course-homes.json` and `COURSES.aphug` in
  `assets/premium.js`), the free trainers in `human-geography/data/pages.json`.
- Accent (provisional): deep ocean teal, hue 188°, in the gap between NREMT's teal (174°) and Psychology's
  cerulean (202°), clear of every other course including AP® Microeconomics (319°). Light `--cink #094953` on
  `--ctint #E1F1F4` (8.7:1; 9.5:1 on the page); dark `--cink #A8DEE6` on the card (11.5:1) and on its tint
  `rgba(80,190,205,0.10)` (9.6:1); soft `#8CCFD9`. Cover clay `#7A3310` with light teal `#8FE3EE`; the icon is a
  globe with meridians.
- Free tier (spec decision 6): the skills chapter, Unit 1 and Topics 2.1 to 2.5 (15 of 71 topics, 21%).
- Base maps: `human-geography/figures/base/` from Natural Earth 1:110m (`world-atlas` 2.0.2), rebuilt by
  `node scripts/build-aphug-basemaps.mjs --atlas <countries-110m.json>`; the regions are ours (needs-author `regions`).
