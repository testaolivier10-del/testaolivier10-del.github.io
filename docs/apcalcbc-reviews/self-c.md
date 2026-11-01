# Author C self-report: polar (math-polar, 9.7-9.9), sequences and 10.1-10.5

Date: 2026-10-31. Brief: `docs/apcalcbc-briefs/c.md`.

## Topics done (10 of 10)

| Topic | Items | In sets | Figures |
|---|---|---|---|
| `math-polar` (skill) | 11 | 4 (table) | `math-polar-coords`, `math-polar-families` |
| `polar-derivatives` (9.7) | 17 | 9 (two tables, one calculator) | `polar-derivatives-tangents` |
| `polar-area` (9.8) | 16 | 9 (graph: petal shaded; calculator table) | `polar-area-sectors`, `polar-area-petal`, `polar-area-frq-region` (FRQ) |
| `polar-area-between` (9.9) | 15 | 9 (graph: crescent; calculator table) | `polar-area-between-region`, `polar-area-between-circles` |
| `math-sequences` (skill) | 13 | 4 (table) | `math-sequences-limits` |
| `series-convergence` (10.1) | 17 | 9 (graph: partial sums with the limit marked; table) | `series-convergence-telescoping` |
| `geometric-series` (10.2) | 17 | 9 (two tables, one with x in the ratio) | `geometric-series-ratios` |
| `nth-term-test` (10.3) | 16 | 8 (table; graph of terms) | `nth-term-test-two-cases` |
| `integral-test` (10.4) | 16 | 9 (table of terms and improper integrals; table for x e^(-x)) | `integral-test-rectangles` |
| `p-series` (10.5) | 16 | 8 (table; graph of harmonic partial sums over ln(x + 1)) | `p-series-partial-sums` |

154 items (single 73, numeric 67, expr 9, interval 5). Each topic has a lesson (hook, 2-3 prerequisites pointing back,
figure, chain, ideas, a misconception from the reader reports, 6 check items, summary, connections), notes of 500+
words with worked examples and comparison tables, and a glossary entry for every concept it teaches. Required
stimulus sets: polar-area graph with the swept petal shaded; series-convergence partial sums against n with the limit
marked; integral-test table of terms and the matching improper integrals.

## FRQs (2)

- `frq-u9-polar-area` (`parametric`, calculator): r = 3 sin θ + cos(2θ), 0 ≤ θ ≤ π. (a) area (5π − 4)/2 ≈ 5.854 [3];
  (b) greatest distance from the y-axis, x = r cos θ, candidates test, 1.737 at θ ≈ 0.480 [2]; (c) toward the origin
  at 5π/6 (r = 2 > 0, dr/dθ ≈ −0.866) [2]; (d) dy/dx at π/3 ≈ −0.439 [2].
- `frq-u10-geometric-tests` (`series`, no calculator): (a) Σ_{n≥2} 3(−2/5)^n = 12/35, first term at n = 2 [2];
  (b) nth term test, limit 1/3 [2]; (c) integral test on n e^(−n²): conditions, limit notation, 1/(2e) [3];
  (d) Σ √n / n^k is a p-series with p = k − ½, converges for k > 3/2 [2]. The brief's "p-series comparison" is done as
  comparing p with 1, so nothing past 10.5 is used.

## Figures

14 SVGs in `calculus-bc/figures/`, from `scripts/apcalcbc-figures/author-c.mjs` (curves, sectors and dots computed
from their functions; stated values asserted in the script). Polar stimuli use figures (the plot spec has no polar
curves); series-convergence-s1, nth-term-test-s2 and p-series-s2 use plot specs.

## Checks

- `check-apcalcbc-content.mjs --topic <id>`: all 10 clean. Full run: 33 topics, 510 items, 0 failing; FRQ 0 failing.
- `check-apcalcbc-map.mjs --check`: nothing used before it is taught (later tests are named only by topic number,
  e.g. "Topic 10.4 settles it").
- Numeric recheck: all 67 numeric keys recomputed independently in Python (Simpson integrals, direct partial sums,
  root finding): no mismatch. Every numeric, expr and interval key graded right and every authored mistake graded
  wrong through `calc-expr.js` + `cbc-interval.js` + `calc-questions.js` in a vm. Interval endpoints checked by hand.
- Scratch build of units 9 and 10 succeeded; notes, lesson and FRQ pages viewed in headless Chrome.

## Map edits

None.

## Open points

- The polar FRQ is type `parametric` (Q2 slot) per the brief; part (b) uses a candidates test (a global argument).
- Σ1/n² = π²/6 is stated as a known fact, not derived; one p-series item gives it in the stem.
- The alternating harmonic series is stated to converge (to ln 2) in 10.5 as a reference series (EK LIM-7.A.7), with
  the proof deferred to 10.7.
- The bank-wide warning on absolute words in distractors comes from other authors' items; mine have none.
