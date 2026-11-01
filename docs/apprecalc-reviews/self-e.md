# Self-review: author E (Unit 3, topics 3.8-3.15)

## Done

| Topic | Items | Stimulus sets (items) | Lesson check | Notes | Lesson figure |
|---|---|---|---|---|---|
| `tangent-function` (3.8) | 16 | graph of 2tan(x/2) (5); lighthouse table (4) | 7 | yes, comparison table sin/cos/tan | `tangent-function-slope` |
| `inverse-trig` (3.9) | 16 | graph of cos⁻¹ x (5); ramp table, calculator (4) | 7 | yes, domain/range comparison table | `inverse-trig-restrict` |
| `trig-equations` (3.10) | 17 | 2sin x and y = 1 (5); spring y = 4 + 3cos(2t), calculator (4) | 6 | yes, the isolate/principal/symmetry/period pathway | `trig-equations-circle` |
| `sec-csc-cot` (3.11) | 16 | graph of sec x (5); sin/cos value table (4) | 5 | yes, six-function table | `sec-csc-cot-graphs` |
| `trig-identities` (3.12) | 16 | graph of 1 − 2sin²x (5); angles α, β table (4) | 6 | yes, identity families table | `trig-identities-double` |
| `polar-coordinates` (3.13) | 16 | polar grid diagram (4); rectangular points table (4) | 5 | yes, conversion table, complex polar form | `polar-coordinates-points` |
| `polar-curves` (3.14) | 16 | **rose r = 3sin(2θ) with its graph of r against θ** (5); limaçon r = 1 + 2cos θ (4) | 5 | yes, r-graph vs polar-curve table, families table | `polar-curves-rose` |
| `polar-rates` (3.15) | 16 | r = 1 + 2sin θ with r-graph (5); sprinkler table, calculator (4) | 6 | yes, the four sign cases table | `polar-rates-curve` |

129 items, 16 stimulus sets (every topic at least 50% in sets), every topic at least 60% apply/analyze. Each topic
mixes graph, table, formula and words. Types across the eight topics: 77 single, 28 numeric, 9 `expr` (tangent 2, inverse trig 1, sec/csc/cot 2,
identities 3, polar coordinates 1; none in 3.10, 3.14 or 3.15, where the answers are angles, sets or readings), 8
select-all, 5 predict, 2 order. Glossary:
all 11 concepts the eight topics teach.

FRQs (4): `frq-q1-trig-composition` (concepts, calc, 1+1+2+1+1), `frq-q4-trig-equation-interval`,
`frq-q4-single-tangent`, `frq-q4-single-sine` (symbolic, no calc, 1+1+2+2 each). Every part has one rubric line per
point and a full-credit sample.

Figures (9, `scripts/apprecalc-figures/e.mjs`, registered in `precalculus/data/figures/<topic>.json`): drawn from
the stated functions, rendered to PNG with Playwright and checked for overlaps and cut-off labels. The two limaçon
figures deliberately carry no point labels, so they do not give away the set's answers.

## Recheck

`scratchpad/e/verify.mjs` (author scratch, not committed): every numeric key recomputed from its stem, every
`expr` key and authored mistake graded through `ApPrecalcExpr`, each `expr` key also compared with the stem's original
expression at 51 points, and every "all solutions" item and FRQ part solved by brute force over its stated
interval. Result: all pass. `check-apprecalc-content.mjs --topic <id>`: all eight ok, no warnings. Full run: no
failure in these topics or FRQs. `check-apprecalc-map.mjs --check`: nothing used before it is taught. Unit 3 built
to a scratch folder with `APPRECALC_PUBLISHED=unit-3` without errors.

## Map edits

None.

## Open questions (for needs-author)

1. **Lesson `plot`.** The brief asks for a `plot` in each lesson, but the lesson format and page have no plot slot
   (only `figure`). Each lesson uses a figure and its check items include a plotted graph stimulus. Should the
   generator gain a lesson `plot` field?
2. **Calculator flag in mixed sets.** A set must be all calculator or all not. In `polar-rates-s2` the secant
   estimate (5.85) and in `inverse-trig-s2` the "steepest ramp" comparison could be done by hand, but they carry
   `calc: true` to stay in the set.
3. **Q4 stimuli.** Q4 has no natural stimulus. Each Q4 FRQ uses a table listing the expression or equation for each
   part. Please check that this looks right on the FRQ page.
4. **Q1 without a limit part.** `frq-q1-trig-composition` puts its points on an inverse (C(ii)) instead of
   end-behavior limit notation, to match its theme. The other Q1s cover limits.
5. **Notation.** All eight topics use `\sin^{-1}` (the exam's form); `arcsin` appears only in the glossary and notes as
   the other name.
6. **Bank-wide (not only E).** In the full run, select-all items with one correct option are 7 of 41 (the rule needs
   20%). E has 2 of 8. There is also a near-duplicate pair in the logarithmic topics (author C).
