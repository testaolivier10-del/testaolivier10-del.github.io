# Self-review: author A (Unit 1, 1.1-1.11, and the "Math you need" chapter)

Date 2026-10-20. Brief: `docs/apenv-briefs/a.md`. No git commands run; no shared files edited except an append to
`docs/apenv-needs-author.md` (section "Author A").

## Topics done (16 of 16)

Each has a lesson, notes (500+ words for concept topics, `<h2>` sections, a `worked` example before any calculation
or writing type is asked), a question bank, a glossary entry for every concept the map says it teaches, and a figure.

| Topic | Items | Apply/analyze | In sets | Sets (kind) |
|---|---|---|---|---|
| intro-ecosystems (1.1) | 17 | 82% | 41% | text, quantitative |
| terrestrial-biomes (1.2) | 17 | 82% | 41% | visual (dual-axis climatograph), quantitative |
| aquatic-biomes (1.3) | 17 | 82% | 41% | quantitative, visual |
| carbon-cycle (1.4) | 17 | 82% | 41% | quantitative, visual |
| nitrogen-cycle (1.5) | 16 | 94% | 44% | quantitative, text |
| phosphorus-cycle (1.6) | 16 | 88% | 50% | quantitative, visual |
| water-cycle (1.7) | 16 | 88% | 44% | visual (USGS data), quantitative |
| primary-productivity (1.8) | 16 | 94% | 50% | **quantitative: GPP and R for five ecosystems (required)**, visual |
| trophic-levels (1.9) | 15 | 87% | 47% | text, quantitative |
| energy-flow (1.10) | 15 | 87% | 47% | **quantitative: energy at each trophic level (required)**, visual |
| food-webs (1.11) | 15 | 87% | 47% | visual (figure), text |
| math-sci-notation | 11 | 91% | 36% | quantitative |
| math-rates | 11 | 100% | 36% | quantitative |
| math-units | 12 | 92% | 33% | quantitative |
| math-percents | 11 | 100% | 36% | quantitative |
| math-doubling | 11 | 100% | 36% | quantitative |

Totals: **233 items** (158 single, 52 numeric, 10 setup, 10 specific, 2 multi, 1 order), 27 stimuli (15
quantitative, 8 visual, 4 text; 7 drawn from `plot` specs). Every invented stimulus is marked `invented: true`; the one
real-data stimulus (`water-cycle-s1`) cites USGS "Where is Earth's Water?" (after Shiklomanov 1993), rounded.
Key-length tell: the key is the longest option in at most 3 of any topic's single items.

## FRQs (2)

- `frq-energy-flow-calc` (calc, 10 points): NPP from GPP and R (setup check), the 10% rule two steps (setup check),
  scaling to a 3 km² reserve with km² to m² (numeric check), why ~10% passes (explain), removing the top predator
  (describe and explain). Three checks.
- `frq-primary-productivity-design` (design, 10 points): IV, DV, directional hypothesis, control and its purpose,
  constant and why, the dark-bottle oxygen drop, and the plateau in the pilot graph (limiting factor).

## Figures (16, all `LevlPrep original`)

Generator `scripts/apenv-figures/unit-1-skills-math.mjs` writes `environmental-science/figures/<id>.svg` and the
registrations `environmental-science/data/figures/<topic>.json`. Data figures compute their numbers with ApEnvCalc
(10% pyramid, GPP/R/NPP split, per-person water, unit chain, percent change, doubling curve). Diagrams: species
interactions, biome chart, lake zones, prefixes table, carbon/nitrogen/phosphorus/water cycles, trophic levels,
food web. Each rendered to PNG with Playwright and inspected; overlaps fixed. A scratch build
(`APENV_PUBLISHED=unit-1,skills-math`) built 15 topics; pages checked at 390 px wide with no horizontal scroll.

## Numeric recheck

A separate scratch script loads `env-expr.js`, `env-calc.js` and `env-grade.js` in a fresh vm and, for every numeric
key, setup `then` and FRQ check, recomputes the key, compares it with a value computed by hand from the stem,
checks the setup expression evaluates to the key and passes its own rules, and checks every authored mistake is
graded wrong and matched. Result: **65 keys, 0 failures.**

## Checks

`node scripts/check-apenv-content.mjs --topic <id>`: ok for all 16 topics; both FRQs pass in the full run.
`node scripts/check-apenv-map.mjs`: no failures in my topics (it currently fails on another author's
`atmosphere.json`). No em dashes in my files.

## Map edits

None.

## Notes for the lead

- `math-doubling` is anchored `before: population-growth`, so it builds only when Unit 3 is published.
- Ordering kept strictly: e.g. "food chain" is not used before 1.11, "kWh" and "watt" not before math-units,
  "runoff" and "groundwater" not before 1.7, "percent change" not before math-percents.
- Open points (in `docs/apenv-needs-author.md`, "Author A"): NPP vs GPP as the 10% base on the calc FRQ; the
  "roughly doubled" nitrogen fixation wording; the debated wolves-willows example; math-doubling build timing.
