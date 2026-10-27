# AP® Psychology: Phase 0 dependency map

The map is `docs/appsych-dependency-map.json`. It is checked by `node scripts/check-appsych-map.mjs --check`
(library `scripts/lib/appsych-map.mjs`, tests `scripts/test/appsych-map.test.mjs`); `--order` prints the course
order. If this file and the JSON disagree, the JSON is right. Unit and topic facts come from
`docs/appsych-ced-map.json` (our own words, from `docs/appsych-research/framework.md`); no CED text is reproduced.
Open questions are in `docs/appsych-needs-author.md`.

## The CED check (Phase 0, 2026-10-27)

| Source | What it settled |
|---|---|
| Course at a Glance | All 35 topic titles, in order (6, 8, 9, 7, 5) |
| CED PDF, readable into Topic 2.6 | Units 1-2 titles again; learning objectives, essential knowledge and exclusions through 2.6 |
| CED clarifications (October 2025) | AAQ Part D: identify a safeguard the summary describes and how it was applied; effect size and significance in 3.C; "all-or-none principle" |
| Course and exam pages | Unit weights (15-25% each), the May 2027 exam (Fri 14 May, Session 2), 75 four-option MCQ in 90 min, AAQ and EBQ in 70 min, 7 points each, no calculator |
| Lumisource copies of the CED codes, Fiveable (third party) | Objectives, knowledge and exclusions for 2.7-5.5; practice weights in Section I (about 65/25/10) |

Every title in the CED map is official. The `objectives` and `knowledge` lines for 2.7-5.5 come from a third-party
copy and are marked in `source` (needs-author `ced-text`). Practice weights are third party and not enforced in
exam forms until a person confirms them (`practicesConfirmed`, needs-author `practice-weights`).

## Counts

| | |
|---|---|
| Chapters | 6: Units 1-5 (CED weights 15-25% each) and one skills chapter, "Research skills you need" (`skills-research`) |
| Topics | 42: the 35 CED topics in order, 7 research skills topics |
| Concepts | 654, each with its terms and aliases; 5 also carry `notation` (mean, standard deviation, z score, r, p) |
| Everyday words | 45 (brain, memory, learning, emotion, stress, sleep, personality, attention, language, intelligence, depression, anxiety, prejudice ...) |
| Planned tools | 11 simulators (the 10 trainers of spec section 6 and `justify`), 17 FRQ themes (8 AAQ, 9 EBQ, each with its author), 21 stimulus themes (7 study, 10 data, 4 figure), 18 comparison tables, 6 pathways |

Concepts per chapter: research skills 72, Unit 1 153, Unit 2 121, Unit 3 122, Unit 4 101, Unit 5 85. Authors add
a concept, with `taughtIn` and `dependsOn`, whenever a topic teaches a term the map does not have.

## Format

As `docs/apenv-phase0.md`, with these differences:

- `practices[]` are the four CED practices (1 Concept Application, 2 Research Methods and Design, 3 Data
  Interpretation, 4 Argumentation) with their skills (1.A-1.B, 2.A-2.D, 3.A-3.C, 4.A-4.B). Argumentation is
  assessed only in Section II, so no topic's focus skills include 4.A or 4.B (`NOT_ASSESSED`); every topic lists
  at least one focus skill.
- No big ideas (`bigIdeas: []`; the 2024-25 framework organizes by unit and practice).
- `topics[].ced` runs without gaps (`PSY_TOPICS` and `UNIT_SIZES` in `scripts/lib/appsych-map.mjs`).
- FRQ themes have type `aaq` or `ebq` (`FRQ_TYPES`), at least 6 of each, and name their author (spec section
  5a). Stimulus themes have `stimulus`: `study`, `data` or `visual`.
- `REQUIRED_SIMULATORS` lists the ten trainers plus `justify`.
- Topic slugs avoid the letters "ap" (`heredity-environment`, not `nature-nurture-map`), so no served path
  carries the token.

## Course order

Units in CED order. Each research skills topic sits right before the topic that first needs it (`before`), as
the CED requires them to be taught in context:

| Skills topic | Before | Why there |
|---|---|---|
| `research-methods` (methods, variables, operational definitions, controls, replication) | `heredity-environment` (1.1) | the first topic's twin, family and adoption studies |
| `research-sampling` (random sampling, representativeness, generalizability) | `heredity-environment` (1.1) | the same studies' samples |
| `stats-correlation` (r, scatterplots, third variables) | `heredity-environment` (1.1) | twin studies report correlations |
| `research-ethics` (IRB, consent, debriefing, animal research) | `brain` (1.4) | lesioning and animal research first appear there |
| `stats-descriptive` (mean, median, mode, range, SD, skew) | `intelligence` (2.8) | test scores and their spread |
| `stats-normal` (the normal curve, 68-95-99.7, z, percentile rank) | `intelligence` (2.8) | IQ on the normal curve |
| `stats-significance` (significance, effect size) | `intelligence` (2.8) | stereotype threat and group differences |

Correlation comes before descriptive statistics on purpose: Unit 1 needs the direction and strength of a
relationship (twin studies) long before it needs a standard deviation (2.8). The descriptive statistics topic
names the correlation chapter as a preview of r's link to spread only in prose; no concept depends on a later one.

No circular dependencies. Places to watch in Phase 1: "neuron" is taught in 1.2 (the nervous system's cells) and
built on in 1.3; "cognition" is taught in 2.1 (perception) before 2.2 deepens it; "schema" appears in 2.1 and is
reused in 2.2 (assimilation and accommodation) and 3.4 (Piaget); "memory" is an everyday word, but "working
memory", "encoding" and the rest stay strict until 2.3.

## The ordering rule

As AP® Environmental Science: no page may use a concept's term or notation before the topic that teaches it,
except everyday words. Prose is scanned for terms and TeX for `notation`, so `$\bar{x}$` before Descriptive
Statistics fails, as does "operant conditioning" before 3.8 or "fundamental attribution error" before 4.1.

## The rest of Phase 0

The runtime fork, the item types and the registration are described in `docs/appsych-architecture.md`. What a
fresh session needs to know:

- Build: `node scripts/build-appsych.mjs` (`--check` in CI). Nothing is published
  (`psychology/data/published.json` is empty), so the skeleton is 25 files and every page is noindex.
- Test fixture: `scripts/test/fixtures/appsych-data/` holds one placeholder topic (3.8, `operant-conditioning`,
  16 items of every type, one study, one data and one figure set: a normal curve drawn from its numbers) and one
  AAQ and one EBQ; it proves the engine and is never published.
- Identity and free tier live in one place each: `IDENTITY` and `FREE_UNITS` in `scripts/lib/appsych-build.mjs`
  (plus the CSS values in `psy.css` and `assets/theme.css`, the ranks in `assets/hub-progress.js`, the home words
  in `scripts/lib/course-homes.json` and `COURSES.appsych` in `assets/premium.js`, which a test keeps in step),
  the free trainers in `psychology/data/pages.json`.
- Accent (decision 5): deep cerulean, hue 202°, between NREMT's teal (171°) and Chemistry's cobalt (223°). Light
  `--cink #084F78` on `--ctint #E3F0F8` (7.5:1; 8.8:1 on white, 8.3:1 on the page and as button text); dark
  `--cink #A8D8F0` on the card (11.1:1) and on its tint `rgba(80,170,220,0.10)` (9.4:1); soft `#8CC8E8`. The cover
  is a deep purple (`#33184A`, accent `#D99CFF`, hue 290°, the one cover hue no course uses) so the course reads
  apart from Statistics' blue cover; the icon is a head in profile with a spark.
- Free tier (decision 9, proposed): Unit 1 and the seven research skills topics, 13 of 42 topics (31%), inside
  the 16-33% the other AP® courses give. The research skills lessons are free because both free-response
  questions are built on them.
