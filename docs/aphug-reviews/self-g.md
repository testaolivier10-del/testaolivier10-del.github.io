# Author G self-review: Unit 7, Industrial and Economic Development (2026-11-09)

## Done

All eight topics, each with lesson, notes (500+ words, h2 sections, comparison tables, a worked example), questions,
glossary and a drawn figure; the three FRQs. `node scripts/check-aphug-content.mjs --topic <id>` reports ok for every
topic, the FRQs pass the full run, and `node scripts/check-aphug-map.mjs --check` passes. Built clean with
`APHUG_PUBLISHED=unit-7` (and `unit-2,unit-7` for the FRQ pages) into `/tmp/hug-g/`.

| Topic | Items | In sets | Sets (kind) | Model / numeric / specific |
|---|---|---|---|---|
| industrial-revolution (7.1) | 16 | 7 | map (Europe), data | 0 / 1 / 1 |
| economic-sectors (7.2) | 17 | 8 | map (Country A), data | 2 (sectors, least cost) / 1 / 1 |
| development-measures (7.3) | 17 | 8 | data (UNDP 2025, dated), data | 0 / 1 / 1 |
| women-development (7.4) | 17 | 8 | data (bar), text | 0 / 1 / 1 |
| development-theories (7.5) | 17 | 8 | data, map (Country A) | 3 (Rostow, world system, commodity dependence) / 0 / 1 |
| trade-world-economy (7.6) | 18 | 8 | data (comparative advantage), map (Mercosur) | 1 (comparative advantage) / 1 / 1 |
| world-economy-changes (7.7) | 18 | 8 | map (China coast), data | 1 (growth pole multiplier) / 1 / 1 |
| sustainable-development (7.8) | 17 | 8 | text, data | 0 / 1 / 1 |

137 items, 16 sets; every item apply or analyze except one recall item; option lengths balanced (key longest or
shortest well under 40% per topic); no absolute words in distractors.

FRQs: `frq-development-theory-none` (Units 7 and 2: Rostow, world system, dependency theory, Rostow and the DTM, a
scale part, a degree part), `frq-development-table-one` (Units 7 and 2: invented HDI/GII/schooling/TFR table, a
scale limitation, a degree part), `frq-industrial-cluster-two` (Units 7 and 2: Country A high-tech map and research
spending table; agglomeration, growth pole, compare, internal migration, a scale limitation).

Figures: `scripts/aphug-figures/author-g.mjs` writes nine SVGs (`human-geography/figures/<topic>-*.svg`) and
`human-geography/data/figures/<topic>.json`; text 21 px or more on a 640 canvas; rendered and checked at 320 px.

## Map edits (docs/aphug-dependency-map.json)

- Added concept `gender-wage-gap` ("gender wage gap", alias "gender pay gap"), taught in women-development.
- Added concept `imf` ("International Monetary Fund", aliases "IMF", "structural adjustment"), taught in
  trade-world-economy, depends on neoliberalism. Another author who writes "IMF" before 7.6 would now fail ORDER.
- Added 12 unit-7 `tools.stimulusThemes` entries for the sets beyond the four planned.

## Accuracy and neutrality choices

- Real data only where dated: the HDI table uses the values in accuracy-risks.md (UNDP 2025 report, 2023 data) and
  World Bank FY27 groups; FY27 thresholds are given in the stem of the one item that uses them. Every other table,
  chart and Country A map is labeled invented.
- Core, semiperiphery and periphery examples are always "often classed as"; no item keys a country's tier or stage;
  the notes model "consistent with" wording.
- Weber appears only in a `hug-aside`; least cost theory is keyed unnamed.
- Both sides given for structural adjustment, garment work in Bangladesh, microlending, ecotourism and the coal
  and climate debate, with no verdict.
- Originality: the FRQ themes were set by the lead; two resemble released themes (2023 set 2 Q2 development table,
  2023 set 1 Q3 regional map plus R&D table). Ours use invented Country A data, different measures and different
  parts (growth pole, migration, GII, schooling), and copy no wording. A reviewer should still confirm.

## Open points

- Facts written from memory are listed in `docs/aphug-needs-author.md` (`unit-7-facts`). The UNDP site was not
  reachable from this session, so the HDI values were not re-read.
- Country A maps show no province names unless marked; questions name only marked provinces or directions. A
  base-map option to label provinces would help every author (see the report's request).
- Scratch generators for the question files are in `/tmp/hug-g/gen/` (not committed); the JSON files are the source.
