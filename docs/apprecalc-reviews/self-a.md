# Author A self-report: Unit 1 (1.1-1.10) and seven "Algebra you need" topics

Written 2026-10-31 by content author A (brief `docs/apprecalc-briefs/a.md`).

## Done

All 17 topics have a lesson, notes page, question file and glossary; both FRQs are written.

| Topic | Items | Stimulus sets (items in sets) | Calculator | expr |
|---|---|---|---|---|
| `alg-functions` | 12 | 1 graph (4) | 0 | 1 |
| `alg-intervals` | 9 | 0 | 0 | 0 |
| `change-in-tandem` (1.1) | 15 | graph, table (9) | 0 | 0 |
| `alg-lines` | 9 | 0 | 0 | 1 |
| `rates-of-change` (1.2) | 15 | table with unequal steps, graph (10) | 5 | 1 |
| `alg-quadratics` | 9 | 0 | 0 | 1 |
| `linear-quadratic-rates` (1.3) | 15 | table with first and second differences (required), graph with a secant (9) | 0 | 2 |
| `alg-polynomial-algebra` | 9 | 0 | 0 | 2 |
| `polynomial-rates` (1.4) | 16 | graph on a closed interval, calculator graph (9) | 5 | 0 |
| `alg-complex-numbers` | 8 | 0 | 0 | 0 |
| `complex-zeros` (1.5) | 15 | graph, table with constant third differences (9) | 0 | 1 |
| `polynomial-end-behavior` (1.6) | 15 | graph, table (9) | 0 | 1 |
| `alg-rational-expressions` | 9 | 0 | 0 | 3 |
| `rational-end-behavior` (1.7) | 16 | graph, table (9) | 0 | 1 |
| `rational-zeros` (1.8) | 16 | sign-chart table, calculator graph (9) | 4 | 0 |
| `vertical-asymptotes` (1.9) | 15 | graph, calculator table (9) | 4 | 0 |
| `rational-holes` (1.10) | 15 | graph with a hole and two asymptotes (required), table (9) | 0 | 0 |

218 items in all. FRQs: `frq-q1-rational-graph` (concepts, calculator, on `vertical-asymptotes`) and
`frq-q2-cubic-volume` (modeling, calculator, on `polynomial-rates`), 6 points each, one rubric line per point and a
full-credit sample per part.

Figures: 17 lesson figures, `scripts/apprecalc-figures/a.mjs` (curves sampled from the same function strings the
course's parser compiles), written to `precalculus/figures/` with registries in `precalculus/data/figures/<topic>.json`.
Each was rendered to PNG and checked for overlaps and cut-off labels.

## Recheck

- Every numeric key recomputed in the scratch build from the stem's function (assertions per item); every `expr`
  key and mistake graded through `ApPrecalcExpr` by the content check; calculator keys at full precision, each
  calculator mistake checked to differ at three decimals; all-solutions items solved by a sign-change scan.
- `node scripts/check-apprecalc-content.mjs`: 0 failing (each topic `--topic` clean); FRQs clean.
- `node scripts/check-apprecalc-map.mjs --check`: nothing used before it is taught.
- Built with `APPRECALC_PUBLISHED=unit-1,skills-algebra` to a scratch folder; notes and lesson pages render.
- No map edits.

## Open points for the lead (for needs-author)

1. **Secant wording in 1.2.** The guide says every topic from 1.2 names the secant line, but the map teaches
   `secant-line` in 1.3 (as the CED does). 1.2 says "the slope of the line through $(a, f(a))$ and $(b, f(b))$";
   1.3 onward says "secant line". Either keep this or move the concept to 1.2 in the map.
2. **Endpoint extrema in 1.4.** The CED's "restricted domain" is the map's 1.13 term, so 1.4 says "a domain limited
   to a closed interval".
3. **Slant asymptotes in 1.7 without division.** Long division is 1.11, so 1.7 finds slant asymptotes only by
   rewriting the numerator around the denominator ($x^2 + 2x + 3 = (x + 1)^2 + 2$). Items avoid cases that need
   division.
4. **Q1 without composition or invertibility.** Those are taught in 2.7-2.8, so `frq-q1-rational-graph` keeps to
   Unit 1: zeros and the hole, one-sided and end-behavior limits, a three-solution calculator solve, and a
   rate-of-change reason with values for its sixth point.
5. **Q2 point split.** `frq-q2-cubic-volume` uses 2-2-2 (A model and maximum; B secant rate and estimate; C
   over/under and domain from context), pending needs-author `frq2-2027`. Its model comes from geometry, not a
   system from data.
