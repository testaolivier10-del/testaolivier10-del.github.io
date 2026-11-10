# Author A self-review: "Skills you need" and Unit 1 (2026-11-09)

## Done

All 10 topics have a lesson, notes, questions, a glossary entry for every concept the topic teaches, a LevlPrep
original figure and their stimuli. The 3 FRQs are written. `node scripts/check-aphug-content.mjs --topic <id>` is
clean for every topic, and `node scripts/check-aphug-map.mjs` reports "Nothing is used before it is taught".
`APHUG_PUBLISHED=geo-skills,unit-1 node scripts/build-aphug.mjs --out /tmp/hug-a/out` builds all 10 topics and the
3 FRQ pages. I checked the FRQ and lesson pages and every map file at 400 px in headless Chrome.

| Topic | Items | In sets | Stimuli |
|---|---|---|---|
| skills-reading | 10 | 6 | map (South Asia, total population, UN WPP 2024), data (line chart, invented) |
| skills-scale | 10 | 3 | map (Country A, internet access by province, invented) |
| skills-frq | 10 | 6 | text x2 (practice parts with student answers) |
| views-of-the-world | 16 | 9 | map: reference (Southeast Asia), choropleth (Southeast Asia, World Bank FY27 income groups), isoline (Country A, invented) |
| data-sources | 15 | 7 | text (field notes), map: dot (Country A, lights at night, invented) |
| data-in-decisions | 15 | 7 | data (census and satellite table, invented), text (flood shelters) |
| spatial-concepts | 15 | 7 | text (Singapore site and situation), data (distance decay line chart, invented) |
| human-environment | 15 | 7 | image (drawn stepped hillside, `human-environment-terraces`), text (Aral Sea) |
| scales-of-analysis | 15 | 7 | map (South Asia, World Bank FY27 income groups), map (Country A, income by province, invented) |
| regional-analysis | 15 | 7 | map: choropleth (Country A, perceptual "North" survey, invented), graduated symbol (Country A commuters, invented) |

Totals: 136 items, 66 of them in sets, 126 of them apply or analyze (93%). Every single-answer item has four options,
each with its own explanation. Numeric items use `ApHugCalc` recipes with the slips students actually make (share,
mapToGround, percentChange). Model items: human-environment (determinism to possibilism, stages) and
scales-of-analysis (the four scales, tiers). Five "Make it specific" builders and three select-all items (two of
them with one key, to help the bank-wide 20% rule).

FRQs: `frq-scale-regions-none` (skills-scale + regional-analysis), `frq-census-data-one` (skills-scale,
data-in-decisions, scales-of-analysis; a Country A census map), `frq-human-environment-two` (skills-reading +
human-environment; an invented planning text and an invented land-use table). Each covers geo-skills and unit-1 and
has at least one scale part.

Figures: 11 SVGs from `scripts/aphug-figures/author-a.mjs`, registered in
`human-geography/data/figures/<topic>.json`. No labels files (no figure has hideable labels).

## Map edits (`docs/aphug-dependency-map.json`)

1. Moved `scale-of-analysis`, `global-scale`, `regional-scale`, `national-scale` and `local-scale` from
   `scales-of-analysis` (1.6) to `skills-scale`. The brief has skills-scale teach the scale of analysis (the 38%
   point), and it comes before 1.1. `scale-of-analysis` now depends on `map-scale` and no longer on `map`, which is
   taught later (in 1.1).
2. Added the concept `aggregation` ("aggregated data"; aliases aggregation and aggregate data), taught in
   `scales-of-analysis`, so that 1.6 still teaches a concept of its own.
3. Added stimulus themes for the sets I wrote beyond the plan: 2 for geo-skills (data and text) and 10 for unit-1.
   Each chapter now has at least one map, one data and one image or text set.

## Choices worth a reviewer's eye

- The colonial misuse of determinism is named in plain words ("used to justify European powers ruling peoples in
  Africa, Asia and the Americas"). The words colonial and colonialism are taught only in Unit 3, so the ordering
  check refuses them in Unit 1.
- Terraces and irrigation are Unit 5 terms, so the drawn scene and its questions say "flat, walled steps" and
  "water channel". The figure id `human-environment-terraces` is not shown to students.
- Real dated data are used where the classes are robust: total population (UN WPP 2024) and World Bank FY27 income
  groups. On 2026-11-09 I checked the FY27 moves of Sri Lanka, Viet Nam and the Philippines to upper-middle income
  against news reports of the July 2026 release. No key depends on outside knowledge of these figures: each is read
  from the dated map.
- Other real facts are stated without exact numbers or with a year: Netherlands land reclaimed from the sea (about
  a sixth), Aral Sea (dam 2005), Newfoundland cod (1992), UN satellite damage maps (Türkiye and Syria, February 2023),
  India's census postponed from 2021, 38% on 2025 set 2 (from framework.md).

## Open points

- No needs-author entries were added.
- The skills topics are kind `skill`, so the 15-item minimum does not apply to them; each has 10 items.
