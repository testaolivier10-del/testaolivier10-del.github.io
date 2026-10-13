# Self-report: AP® Calculus AB Unit 5 (Analytical Applications of Differentiation)

Author pass, 2026-10-13. Not yet independently reviewed.

## Topics done (12 of 12)

| CED | Topic id | Items | In sets | Figure |
|---|---|---|---|---|
| 5.1 | mean-value-theorem | 17 | 8 | mvt-parallel-tangents |
| 5.2 | extreme-value-theorem | 18 | 9 | evt-extrema |
| 5.3 | increasing-decreasing | 17 | 9 | incdec-sign-of-fprime |
| 5.4 | first-derivative-test | 16 | 8 | fdt-three-cases |
| 5.5 | candidates-test | 16 | 8 | candidates-check |
| 5.6 | concavity | 17 | 8 | concavity-tangents |
| 5.7 | second-derivative-test | 16 | 8 | sdt-cases |
| 5.8 | sketching-derivatives | 16 | 8 | sketch-f-fprime |
| 5.9 | f-and-its-derivatives | 16 | 9 | f-fp-fpp-sine |
| 5.10 | optimization-intro | 16 | 9 | pen-river-area, pen-river-diagram (stimulus) |
| 5.11 | solving-optimization | 16 | 9 | box-from-sheet, box-sheet-16x10 (stimulus) |
| 5.12 | implicit-relations | 16 | 9 | implicit-tangents |

Each topic: lesson JSON, notes HTML (590-890 words, worked examples, comparison tables), question bank, glossary
for every concept the topic teaches. Totals: **197 items** (120 single, 61 numeric, 8 multi, 8 expr; 15 calculator
items, the rest no-calculator), 102 in stimulus sets of 4-5 (graphs of f′, graphs of f, tables of f, f′, f″,
contexts, two diagrams). Every topic: 94-100% apply/analyze; key strictly longest in at most 40% of singles;
multi-select keys 13 of 32 options, 3 of 8 multis single-key; no absolute words in distractors.

## FRQs (3, 9 points each)

- `frq-u5-graph-fprime` (graph, no calculator): graph of f′ (semicircle + two segments); relative extrema (2),
  concave down (2), inflection points (2), tangent line at x = 2, approximation and over/underestimate (3).
  No integrals (Unit 6 not yet taught).
- `frq-u5-model-greenhouse` (model, calculator): H(t) = 62 + 3te^(−0.15t) + 4 sin(t/2); average rate with units
  (2), H′(5) and interpretation (2), MVT with hypotheses (2), absolute max and min by the Candidates Test (3).
  The absolute minimum is the endpoint value 62, not the relative minimum 64.829 (the scored trap).
- `frq-u5-fg-table` (fg, no calculator): table of f and f′; MVT/Rolle on [1, 3] (2), IVT for f(c) = 4 (2),
  tangent line and f(4.2) (2), MVT applied to f′ giving f″(c) = 5/2 (3).

## Figures

14 standalone SVGs from `scripts/apcalc-figures/unit-5.mjs` (run `node scripts/apcalc-figures/unit-5.mjs`), each
sampled from the stated function. All rendered to PNG with Playwright and inspected; overlaps, clipped shading and
a halo bug that hid italic letters were fixed. Built pages (notes, lesson, FRQ) rendered and checked in a scratch
build with Unit 5 published.

## Numeric recheck

- Every numeric key is recomputed in the authoring source (a `chk` value from the formula: bisection for the
  calculator roots, candidate comparisons for extrema) and must equal the key; every expr key is compared with an
  independent JS function at 25 points. 0 mismatches.
- Through the runtime graders (`calc-questions.js` gradeNumeric, `ApCalcExpr.grade`) in a vm: 69 numeric/expr
  keys graded right (calculator keys both rounded and truncated to three places; every listed unit spelling
  accepted, a wrong unit rejected), 139 authored mistakes graded wrong and matched to their own feedback.
  0 failures.
- FRQ model values recomputed: average rate 0.5551, H′(5) = −1.2480, critical points 3.8637 (72.2348) and 9.7475
  (64.8287), H(14) = 69.7711.
- `check-apcalc-content` (checkTopic for each topic, FRQ checks): clean. `check-apcalc-map.mjs`: nothing used
  before it is taught. Near-duplicate check against the whole current bank: clean.

## Map edits

None.

## Open questions (for needs-author)

1. **Relative extrema at endpoints.** Lessons and glossary define a relative extremum on an open interval around c,
   so endpoints are never relative extrema, and no item keys an endpoint as one. Confirm this matches current CED and
   scoring practice (Unit 5 learning objectives were not text-verified).
2. **Inflection at a corner of f′.** The graph FRQ keys x = 2, where f′ has a corner (f″ undefined), as a point of
   inflection, justified by "f′ changes from increasing to decreasing". This matches released scoring practice as far
   as known; worth a teacher check. The piecewise-linear f′ set in 5.8 deliberately does not ask whether x = 0
   (f″ goes from 2 to 0) is an inflection point, since that is contested.
3. **Rolle's theorem** is named once in notes and accepted in one FRQ rubric line; it is not a CED topic name.
4. Running the full `check-apcalc-content.mjs` takes about 3.5 minutes because of the tool validators, and it
   currently reports failures in the `accumulation` and `motion-lab` tool data (not Unit 5 files).
