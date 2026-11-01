# Self-report, author D: Unit 3 (3.1-3.7), `alg-right-triangle`, `alg-circles`

Written 2026-10-31. Brief: `docs/apprecalc-briefs/d.md`.

## Done

| Topic | Items | In sets | Notes words (approx.) |
|---|---|---|---|
| `periodic-phenomena` (3.1) | 16 | 8 (graph s1, table s2) | 900 |
| `alg-right-triangle` | 10 | 0 | 500 |
| `alg-circles` | 10 | 0 | 650 |
| `sine-cosine-tangent` (3.2) | 16 | 9 (diagram s1: unit circle with $P(-3/5, 4/5)$; table s2) | 1000 |
| `sine-cosine-values` (3.3) | 16 | 8 (graph s1, table s2) | 800 |
| `sine-cosine-curves` (3.4) | 16 | 9 (graph s1, table s2) | 950 |
| `sinusoidal-functions` (3.5) | 16 | 9 (graph s1, table s2) | 900 |
| `sinusoidal-transformations` (3.6) | 16 | 9 (graph s1, table s2) | 950 |
| `sinusoidal-modeling` (3.7) | 18 | 9 (unscaled graph with five labeled points s1; tide table s2) | 1000 |

134 items. Every topic has a lesson (5-7 check items, a figure), notes with worked examples and a comparison table,
and a glossary entry for each concept it teaches (15 concepts).

FRQs (type `periodic`, 6 points, `calc: false`, split A 2, B 2, C(i) 1, C(ii) 1):
`frq-q3-ferris-wheel`, `frq-q3-tide`, `frq-q3-spring` (on `sinusoidal-modeling`), `frq-q3-waterwheel` (on
`sinusoidal-transformations`).

Figures: 15 SVGs in `precalculus/figures/` from `scripts/apprecalc-figures/d.mjs`, which also writes their
registry entries to `precalculus/data/figures/<topic>.json` (needed by the check; one file per topic of mine).
Each was rendered to PNG and inspected; overlaps fixed. Stimulus plots (plot specs) rendered and checked.

## Checks

- `node scripts/check-apprecalc-content.mjs --topic <id>`: all nine topics ok; full run shows my FRQs and topics
  clean, bank 0 failing.
- `node scripts/check-apprecalc-map.mjs --check`: nothing used before it is taught.
- Recheck: 44 numeric keys recomputed from the stems and 6 `expr` keys compared with independently written
  functions at 51 points (scratch script); 0 mismatches. Tables of $k$, $D$ and the greenhouse landmarks
  recomputed from their models. The calculator solve ($T(t) = 25$) was cross-checked by brute force on [0, 24].
- Bank: I changed two of my select-all items to one correct option to help the bank-wide 20% rule.

## Map edits

None.

## Open points (for the lead to merge into needs-author)

1. **Unscaled graphs.** `ApPrecalcPlot` cannot hide tick labels, so the Q3-style unscaled graphs (greenhouse set,
   four FRQs) are standalone SVG figures, not plot specs. A `ticks: false` option would let them be drawn from the
   spec.
2. **Sinusoidal regression items.** No item keys the output of a sinusoidal regression: results depend on the
   calculator's algorithm and on rounded table values, so a three-decimal key is not safe. The calculator items in
   3.7 solve a given model instead (every solution in an interval). Regression practice is better placed in
   `regression-lab`, or needs data that fit a sinusoid exactly.
3. **Q3 point split and work.** 2-2-1-1 with a reason required in C(i) and C(ii) is our own reading of the task
   models; the 2026 guidelines say parts A-C need no supporting work. A teacher should confirm whether the reason
   points match current scoring. `frq-q3-spring` C(ii) asks for concavity and the rate in one point.
4. **Tide period.** The tide contexts use a 12-hour cycle "in this model" (real semidiurnal tides are about 12.4
   hours); item `pcalc-sinusoidal-modeling-14` uses that drift as the reason predictions degrade.
5. **"Radians from the first topic"** (brief): the map teaches `radian` in 3.2 and puts 3.1 before the two algebra
   topics, so 3.1 is written with no trig notation or radians. Fine by the map; noted in case the lead wanted 3.1
   to preview radians.
