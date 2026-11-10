# Author A: the "Skills you need" chapter, Unit 1

Read `docs/aphug-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (10)

`skills-reading` (skills), `skills-scale` (skills), `skills-frq` (skills), `views-of-the-world` (1.1), `data-sources` (1.2), `data-in-decisions` (1.3), `spatial-concepts` (1.4), `human-environment` (1.5), `scales-of-analysis` (1.6), `regional-analysis` (1.7).

## FRQs (one of each type)

- Q1 type `none` (no stimulus) on `skills-scale`: Regions and scale: formal, functional and perceptual regions at two scales. File `human-geography/data/frq/frq-scale-regions-none.json` (id `frq-scale-regions-none`).
- Q2 type `one` (one stimulus) on `data-in-decisions`: A census map of one country: the scale of the data, the pattern, and what it cannot show. File `human-geography/data/frq/frq-census-data-one.json` (id `frq-census-data-one`).
- Q3 type `two` (two stimuli) on `human-environment`: Two sources on land use in a river valley: determinism, possibilism and sustainability. File `human-geography/data/frq/frq-human-environment-two.json` (id `frq-human-environment-two`).

## Stimulus sets planned in the map

- `map` on `skills-reading`: A choropleth with a misleading legend: what the shades really measure
- `map` on `skills-scale`: One data set at national and provincial scale (Country A)
- `map` on `views-of-the-world`: Reference and thematic maps of the same region
- `data` on `data-in-decisions`: A table of census and satellite data for a growing city
- `image` on `human-environment`: A drawn landscape of terraced fields
- `map` on `regional-analysis`: A perceptual region from a survey (Country A)

Add to your units' `tools.stimulusThemes` in the map (the smallest Edit) any set you add: at least one `map`, one `data` and one `image` or `text` set per unit.

## Files you own

For each topic id above: `human-geography/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `human-geography/figures/` (ids starting with your topic ids; drawn SVG scenes only, no photos); `scripts/aphug-figures/author-a.mjs` if you generate figures; your report `docs/aphug-reviews/self-a.md`.

## Notes for your topics

The skills chapter is free and is the first thing a 9th grader reads: reading a map, a table and a chart (legend, units, source, a pattern named with a place), scale of analysis against map scale (the 38% point), and how the free responses are scored, verb by verb. Unit 1 is free too: every map type in the fixture formats (choropleth, dot, graduated symbol, isoline, reference) on real outlines and on Country A; regions formal, functional and perceptual with fuzzy boundaries; determinism vs possibilism with its colonial misuse named. Projections: teach the trade-off; a named projection is an aside.
