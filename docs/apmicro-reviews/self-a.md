# AP® Microeconomics: author A self-review (Phase 1)

Scope: the "Graph skills you need" chapter (`axes-points`, `slopes-curves`, `shifts-movements`, `curves-crossing`)
and Unit 1 (`scarcity`, `economic-systems`, `production-possibilities`, `comparative-advantage`, `cost-benefit`,
`marginal-analysis`), plus `frq-ppc-trade-short` and `frq-consumer-choice-short`.

## Done

| Topic | Items | Sets | Graph items | Notes words | Glossary |
|---|---|---|---|---|---|
| axes-points | 12 | 1 data | 2 (label, point) | 821 | 3 |
| slopes-curves | 12 | 1 data | 2 (point on a curve) | 687 | 2 |
| shifts-movements | 13 | 1 text | 4 (shift x3, point) | 777 | 3 |
| curves-crossing | 13 | 1 graph | 4 (shift + equilibrium x2, shade x2) | 706 | 2 |
| scarcity | 17 | 1 data, 1 text | none (no graph in 1.1) | 726 | 4 |
| economic-systems | 17 | 1 data, 1 text | none (no graph in 1.2) | 692 | 4 |
| production-possibilities | 19 | 1 data, 1 graph | 5 (label, point inside/outside, shift out/in) | 803 | 4 |
| comparative-advantage | 17 | 2 data | 2 (label, point outside after trade) | 741 | 4 |
| cost-benefit | 16 | 2 data | none | 651 | 2 |
| marginal-analysis | 19 | 2 data, 1 text | none (MU/P table, no graph) | 867 | 6 |

155 items (97 single, 25 numeric, 19 graph, 6 multi, 6 order, 2 "Make it specific"); every concept topic at least
88% apply/analyze and 42-63% in sets. Every numeric key is an `ApMicroCalc` recipe with the reader-report slip as an
authored mistake (run over rise, rectangle for triangle, sum of all alternatives for opportunity cost, output rule
on an input table, MU instead of MU/P, wrong price in MU/P, explicit costs only). Every lesson has a figure, a chain,
a misconception, 5-6 check items and a summary. 11 figures from `scripts/apmicro-figures/author-a.mjs` (every
printed number computed by `ApMicroCalc`; viewed as PNG, no overlapping words). Both FRQs 5 points, one rubric
line per point, full-credit samples; the PPC FRQ's part A is a `ppc` graph part with `auto` labels and point.
`check-apmicro-content --topic` clean for all ten; `check-apmicro-map` clean; the built pages render
(`APMICRO_PUBLISHED=graph-skills,unit-1`, scratch `/tmp/mic-a/site`).

Overlap with AP® Macroeconomics (1.1, 1.3, 1.4, graph skills): written fresh with micro examples (a print shop, a
bike start-up, a farm, two workshops, a taco truck, a bakery); no Macro wording, names or numbers reused.

## Map edits (docs/apmicro-dependency-map.json)

- Concepts added: `ceteris-paribus` (shifts-movements), `incentive` (economic-systems).
- `tools.stimulusThemes`: 10 sets added to unit-1 (data, text) and 1 to graph-skills (slopes-curves data).

## Wording forced by the map (for the lead)

- 1.5 and 1.6 never say "total cost" or "marginal cost"/"MC" (both taught in 3.2): they say "full cost" and
  "additional cost". The MB = MC rule appears once, inside a `mic-preview` box in the 1.6 notes.
- 1.3 never says "technology" (an alias of the supply shifters, 2.2): it says "better methods" and names the
  change (irrigation, a better seed).
- The content never writes "AP®": the scan reads "AP" as average product (3.1).
- Graph skills shade items name the region (consumer and producer surplus) only in a `mic-preview` span.

## Open points

- Generator text trips the ordering scan on built pages (see the requests in my reply): "AP®" in the page chrome
  matches the `average-product` alias "AP" on every page before 3.1, and the no-JavaScript key line of a shade item
  ("Key: shade consumer surplus") names the region before 2.6 on the curves-crossing lesson page.
- `scanPage` looks for previews with the class `psy-preview` (forked from Psychology); undeclared `mic-preview`
  blocks are stripped anyway, so nothing fails today.
- Bank-wide: the select-all share with one key, and other authors' near-duplicates, are outside my topics; my six
  multi items have one or two keys and no absolute words in distractors.
