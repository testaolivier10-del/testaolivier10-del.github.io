# AP® Calculus BC, author D self-report (Unit 10, topics 10.6-10.15)

## Done

Ten topics, each with a lesson, a notes page (560-690 words, worked examples, comparison tables), a question bank,
a glossary entry for every concept the topic teaches, and one figure:
`comparison-tests`, `alternating-series-test`, `ratio-test`, `absolute-conditional`, `alternating-error-bound`,
`taylor-polynomials`, `lagrange-error-bound`, `radius-interval-convergence`, `taylor-series`,
`power-series-functions` (files in `calculus-bc/data/{lessons,notes,questions,glossary,figures}/`).

| Topic | Items | Types | Sets (items in sets) |
|---|---|---|---|
| 10.6 comparison-tests | 17 | 14 single, 3 numeric | 2 tables (8) |
| 10.7 alternating-series-test | 15 | 13 single, 2 numeric | graph of partial sums, table (8) |
| 10.8 ratio-test | 15 | 10 single, 4 numeric, 1 expr | 2 ratio tables (8) |
| 10.9 absolute-conditional | 16 | 13 single, 3 numeric | 2 tables (9) |
| 10.10 alternating-error-bound | 16 | 11 single, 5 numeric | 2 tables (9) |
| 10.11 taylor-polynomials | 16 | 4 single, 8 numeric, 4 expr | derivatives at the center, derivatives of $e^{2x}$ (8) |
| 10.12 lagrange-error-bound | 16 | 11 single, 5 numeric | derivatives and a bound, values of $e^z$ (8) |
| 10.13 radius-interval-convergence | 16 | 7 single, 2 numeric, 6 interval, 1 expr | 2 ratio-test tables (9) |
| 10.14 taylor-series | 16 | 6 single, 6 numeric, 2 expr, 2 interval | graph of sin x with P3 and P5, derivative table (8) |
| 10.15 power-series-functions | 16 | 2 single, 6 numeric, 6 expr, 2 interval | substitution/integration table, differentiation table (9) |

Total 159 items (91 single, 44 numeric, 14 expr, 10 interval). The stimulus sets the brief asked for are there
(table in taylor-polynomials, ratio table in ratio-test, ratio-test steps in radius-interval-convergence, graph in taylor-series).

FRQs (type `series`, no calculator, 9 points, one rubric line per point, a full-credit sample per part):
- `calculus-bc/data/frq/frq-u10-interval-taylor.json`: ratio test and radius (2), interval with both endpoints (3),
  f'''(2) from a coefficient (2), the series for f' and a related geometric sum (2).
- `calculus-bc/data/frq/frq-u10-taylor-error.json`: table of derivatives at x = 0 and x = 1 (the center trap), P3 about 1 (2),
  estimate (1), Lagrange bound with the maximum justified (3), alternating series bound at x = 1.2 and why it does not
  apply at x = 0.8 (3). Built on h(x) = 8/(x + 1)², so the table, h⁽⁴⁾ and the stated series agree.

Figures: `scripts/apcalcbc-figures/author-d.mjs` writes 10 SVGs to `calculus-bc/figures/` (comparison-partial-sums,
alt-partial-sums, ratio-test-ratios, abs-cond-sums, alt-error-band, taylor-cos-wrap, lagrange-error-cos,
interval-number-line, taylor-series-exp, geometric-wrap), each computed from its series or function, emerald accent
with Okabe-Ito colours. I checked each one as a PNG.

## Checks

- `node scripts/check-apcalcbc-content.mjs`: 33 topics, 510 items, 0 failing; FRQ 0 failing.
- `node scripts/check-apcalcbc-map.mjs --check`: nothing used before it is taught (2,129 questions scanned).
- `APCALCBC_PUBLISHED=unit-10 node scripts/build-apcalcbc.mjs --out <scratch>`: 15 topics built. Notes, lesson and
  FRQ pages checked at phone width.
- Independent recheck (scratch `verify.mjs`): all 68 numeric, expr and interval keys graded right through the runtime
  (calc-expr, cbc-interval, calc-questions in a vm), every authored mistake graded wrong, and all 58 numeric/expr keys
  recomputed from first principles (partial sums, ratio limits, Taylor coefficients, error bounds, series sums). 0 differences.
- Every interval endpoint checked by hand: the series at that endpoint, its test and the test's conditions (written in `ends`).

## Choices to note

- Error bounds smaller than about 0.005 are asked as single-answer items, not numeric ones. The three-decimal rule
  would accept 0 or a wrong fraction (1/729 for 1/1000) as right.
- Ordering: 10.6-10.12 never say "power series", "Taylor series", "absolutely" and so on before their topics.
  10.12's "the alternating series bound may apply instead" is phrased as a given alternating sum (cos 0.1 = 1 − ...).
- No map edits.

## Open points (for needs-author)

1. 10.9 notes mention Riemann's rearrangement theorem in a `going-further` aside only; items test only LIM-7.A.14
   (absolutely convergent series keep their sum).
2. 10.14 notes say that for "the functions in this course" the Taylor series equals the function on its interval. This
   is true for the four memorized series and the ones derived from them, but not for every function. A teacher may want
   a sentence on that.
3. The FRQ `frq-u10-taylor-error` gives the general term of the Taylor series in the stem, since part (d) needs it.
   A reviewer should confirm this matches the BC6 style.
