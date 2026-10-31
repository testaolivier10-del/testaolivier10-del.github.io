# Author C: polar, sequences, and Unit 10 topics 10.1-10.5

Read `docs/apcalcbc-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (10)

`math-polar` (skill, before 9.7), `polar-derivatives` (9.7), `polar-area` (9.8), `polar-area-between` (9.9), `math-sequences` (skill, before 10.1), `series-convergence` (10.1), `geometric-series` (10.2), `nth-term-test` (10.3), `integral-test` (10.4), `p-series` (10.5).

## FRQs

- `parametric`, `frq-u9-polar-area`: A polar curve (calculator): area of a region (½, r squared, θ limits), distance from the y-axis as r cos θ, whether the point moves toward the origin (dr/dθ), a tangent slope. File `calculus-bc/data/frq/frq-u9-polar-area.json`.
- `series`, `frq-u10-geometric-tests`: A series question: a geometric sum with the right first term, the nth term test, the integral test with its conditions, and a p-series comparison. File `calculus-bc/data/frq/frq-u10-geometric-tests.json`.

## Stimulus sets (at least these, besides your topics' own sets)

- `graph` in `polar-area`: a polar curve with the swept sector shaded.
- `graph` in `series-convergence`: partial sums plotted against n with the limit marked.
- `table` in `integral-test`: terms and the matching improper integral.

## Files you own

For each topic id above: `calculus-bc/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `calculus-bc/figures/` (ids starting with your topic ids); `scripts/apcalcbc-figures/author-c.mjs` if you generate figures; your report `docs/apcalcbc-reviews/self-c.md`.

## Notes for your topics

The 2025 polar question had the lowest mean on the exam (3.09 of 9): the math-polar topic is a real precalculus refresher (plotting polar curves from tables, limaçons, roses, cardioids), placed just before 9.7. Unit 10 starts here: the nth term test only ever shows divergence; say "the series converges", never "the terms converge".
