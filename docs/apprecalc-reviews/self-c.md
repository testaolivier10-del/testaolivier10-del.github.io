# Self-review: author C (Unit 2, topics 2.7-2.15)

## Done

| Topic | Items | In sets | Sets | Lesson figure |
|---|---|---|---|---|
| `composition` (2.7) | 18 | 9 | table of f and g; graph of a line and a parabola | `composition-shift` |
| `inverse-functions` (2.8) | 18 | 9 | table of f and h (one repeats outputs); graph of g(x) = x³/8 + 1 | `inverse-functions-reflect` |
| `logarithmic-expressions` (2.9) | 19 | 9 | powers of 3; a logarithmic scale (diagram) | `logarithmic-expressions-powers` (+ `-scale`) |
| `exp-log-inverses` (2.10) | 18 | 9 | table of log₄ x; graph of 3ˣ | `exp-log-inverses-reflect` |
| `logarithmic-functions` (2.11) | 18 | 9 | graph of log₂(x + 4) − 1; calculator set on 4 ln(x + 1) − x | `logarithmic-functions-asymptote` |
| `logarithmic-manipulation` (2.12) | 19 | 9 | graphs of log₃ x and log₃ 9x; table of ln 2, 3, 5, 7 | `logarithmic-manipulation-shift` |
| `exp-log-equations` (2.13) | 20 | 9 | graph of log₂(x + 1) and y = 3; a student's worked solution (error analysis) | `exp-log-equations-intersect` |
| `logarithmic-modeling` (2.14) | 18 | 10 | exact log data (typing); calculator log regression (sapling) | `logarithmic-modeling-data` |
| `semi-log-plots` (2.15) | 17 | 10 | semi-log plot of exponential data (figure `semi-log-plots-set1`); table of log y | `semi-log-plots-line` |

165 items (all four item formats plus `order` and `predict` in every topic; 18 stimulus sets). Every topic has its
lesson, notes (500+ words, worked examples before each new calculation, comparison tables), glossary and figure
registry. Every topic passes `check-apprecalc-content.mjs --topic`, and `check-apprecalc-map.mjs --check` reports
nothing used before it is taught. No map edits.

FRQs (all pass the FRQ check): `frq-q1-table-composition-inverse`, `frq-q1-log-function`, `frq-q2-logarithmic-sales`
(2-2-2), `frq-q4-exp-log-equations`, `frq-q4-quadratic-in-ex`.

Figures: 11 SVGs in `precalculus/figures/`, made by `scripts/apprecalc-figures/c.mjs` (plot figures through
`ApPrecalcPlot.svg` with inline style; log-scale number line and semi-log plots drawn with ticks at powers of 10).
All rendered to PNG and looked at; overlapping labels fixed.

## Recheck

A scratch script (outside the repo) recomputed every numeric key from its stem in JS (66 numeric and expr keys,
including the sapling regression by least squares on ln x), compared every expr key with an independent reference
function on its domain, checked each inverse key composes back to the identity, graded every key right and every
authored mistake wrong through `ApPrecalcExpr`, and brute-forced every "every solution" item and FRQ solve: 0
problems. Calculator values: p(x) = 1 at 0.430 and 7.613; g(x) = 2 at −1.675, −0.539, 2.214;
3 ln(x − 1) − 2 = 0.4x at 4.594 and 14.545.

## Open points (for needs-author)

- **`expr-single-form`**: `expr` items grade by value only, so "write as a single logarithm" or "as a single power"
  accepts the unsimplified original. I kept the form tasks to multiple choice and FRQs; two expr items
  (`logarithmic-manipulation-10`, `-12`) still ask for a form a student could skip. A `form` check (count of log or
  power nodes) in `pcalc-expr.js` would close it; the builder of `symbolic-steps` may want it too.
- **`plot-log-axis`**: `ApPrecalcPlot` has no logarithmic axis, so semi-log stimuli are SVG figures (correct but not
  drawn by the shared plot code). `exp-log-lab` (T2) needs a log axis anyway; once it exists the figures can become
  plot specs.
- **Q4 stimulus**: the FRQ format requires a stimulus, but Q4 has none on the exam; my two Q4s carry a small
  "directions" table. The lead may prefer to make `stimulus` optional for `symbolic`.
- **`frq-q1-log-function` part C** asks for the inverse of a transformed logarithm (2.13 content) on an FRQ themed on
  2.11; `topics` lists `exp-log-equations` too. Fine for exams (Unit 2 is complete by then), but a 2.11-only reader
  meets it early.
- **Practice tags**: the map gives `exp-log-equations` only practice 1; one error-analysis item there is tagged 3.C.
- Bank-wide (not only my files): select-all items with one correct key are 7 of 44 (rule wants 20%); mine are 4 of
  10.
