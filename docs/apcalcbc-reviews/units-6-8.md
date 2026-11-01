# Units 6-8 BC review (6.11, 6.12, 6.13, 7.5, 7.9, 8.13, two FRQs, BC wording of 6.10 and 6.14)

Independent accuracy check, Phase 4, branch `claude/apcalcbc`, 2026-10-31. Scope: `integration-by-parts`,
`partial-fractions`, `improper-integrals`, `eulers-method`, `logistic-models`, `arc-length` (lesson, notes, glossary,
96 items in 12 stimulus sets, figure entries and the six SVGs from `scripts/apcalcbc-figures/author-a.mjs`),
`frq-u6-parts-improper`, `frq-u7-euler-arc-length`, the `cbc-only`/`calc-ab-only` wording in AB's
`rewriting-integrands` (6.10) and `choosing-integration-methods` (6.14) notes and lesson, and BC's 6.14 flowchart,
read on a scratch BC build (Units 6-8 published). Needs-author points `a3`, `a4`, `p3-logistic-solution`.

## Numeric recheck

All 51 numeric and `expr` keys recomputed by my own script from the stems (Simpson integrals for arc lengths,
Euler loops, my own antiderivatives typed in a different form, e.g. `(2x^2-2x+1)e^(2x)/4 + C`), then graded through
the runtime (`calc-expr.js`, `cbc-interval.js`, `calc-questions.js` in a vm with BC's `ApCalcCourse`, small-value
guard on): every key right, every authored mistake (typed with `+ C` where the item asks for it) wrong and given
its own note. Also recomputed: the fish table (P = 1200/(1 + 5e^(−0.72t)) rounds to every printed value), every
stimulus plot point, every figure number (chord totals 2.921 and 4.647, arc lengths 2.958, 14/3, 4.647 for x = y²,
logistic inflection near t = 2.75, Euler 2.25/2.441/2.594 for y′ = y), every number in the notes and lessons, and
both FRQs (3 − 5/e, area 3, divergence of ∫2x/(x² + 1), Euler 0.5 and 0.75, f = 2x − 2 + 3e^(−x) so f″ = 3e^(−x) > 0,
59/24). No key was wrong.

## Changes

| File / item | What was wrong | Fix |
|---|---|---|
| `notes/improper-integrals.html`, `cbc-improper-integrals-4` (why of the key) | Said a height going to 0 is **necessary** ("needed") for ∫ₐ^∞ f to converge. False: an integrand can converge without tending to 0 (narrow spikes, sin x²) | "A height that goes to 0 is not enough...: only the limit of the integrals decides"; item why "heights going to 0 do not settle it" |
| `cbc-eulers-method-3` (why, key explanation), `notes/eulers-method.html` | The two-step over/under argument rested on "concave up curves lie above their tangent segments" plus "starting lower only makes it smaller", which is not a reason (needs-author a4) | The argument now names what makes it hold: every step lies below the concave up solution curve through its own start, and that curve stays below f because solution curves do not cross. Notes add the same sentence after worked example 1 |
| Figure alt texts (5 `calculus-bc/data/figures/*.json`), `author-a.mjs` SVG `<desc>`, partial-fractions lesson and notes captions | Said "green" for the emphasis curve, which is violet #5A1E96 since the accent change | "violet"; the six SVGs regenerated (only the descriptions changed); generator header comment updated |
| AB `calculus/data/notes/rewriting-integrands.html` (6.10) | On BC pages the opening read "the two rewrites on the AB exam" | `calc-ab-only` "on the AB exam" / `cbc-only` "of this topic"; AB build byte-identical |
| `notes/integration-by-parts.html` | "appears on the free-response section most years" (framework: 2023 and 2024 only); rule of thumb missed inverse trig for the power-of-x exception | "often appears ... as one part of a question that mixes techniques"; "unless a logarithm or an inverse trigonometric function is present" |
| `cbc-arc-length-7` mistake 63/10 | "Riemann sums of f′ give f(6) − f(0)" (they estimate it) | "estimates f(6) − f(0), the change in height, not the length" |

Keys changed: none.

## Checked and fine

- Scope: parts (tabular accepted), distinct linear factors only (going-further aside for the rest), improper
  integrals in limit notation throughout, Euler tables, logistic interpreted only, arc length of y = f(x) and
  x = g(y). Nothing later used early (ordering scan of the 72 built Unit 6-8 BC pages: 0 problems).
- Every distractor explanation read against its option; one defensible key per item; sets coherent.
- BC 6.14: notes, lesson caption and summary list the six questions; the flowchart on BC pages is BC's
  (`calculus-bc/figures/integration-flowchart.svg`, six questions, two tagged BC); no `cbc-only`/`calc-ab-only`
  class or AB-only sentence left on a BC page. BC 6.10 points to 6.12 "two topics ahead" (true in BC order).
- FRQs: rubric lines and samples agree; part (b) of the Euler FRQ is rigorous (f″ = f − (2x − 2) > 0 from the
  stated fact). Stimulus graphs viewed rendered at 420 px.
- Figures viewed rendered: all correct. Minor: in `partial-fractions-split` the curves cross a few tick labels
  (−2 on the y-axis, −3 to −1 on the x-axis); readable, left.

## Needs-author points

- **a3-split-integral**: resolved, no map change. The AB concept `split-integral` is the 8.6 technique (split at
  every crossing, top minus bottom on each piece), so 8.6 is the right place; 6.13's "write it as two integrals
  that meet there" says the same thing in plain words and is clear.
- **a4-euler-multistep**: resolved. Concavity does decide a multi-step Euler error, provided it holds for every
  solution curve a step starts on (the region the steps travel through), not only for f: induction plus the fact
  that solution curves do not cross. `cbc-eulers-method-3` satisfies it (f″ = 1 + x + y > 0 where every Euler point
  lies); its explanation and the notes now say so. Concavity of f alone is not enough.
- **p3-logistic-solution**: resolved, in scope. `cbc-exam-2-08` gives the solution; the student uses EK FUN-7.H.4
  (fastest at K/2) and solves P(t) = 250 on a calculator item; nothing asks to solve the DE. Numbers rechecked
  (6.641; distractors 7.068, 250, 13.283 and their explanations right).

## Open (outside my files)

- AB's `separation-of-variables` notes (7.6) say "On the AP® Calculus AB exam it is the only solving method you
  need" on the BC page too; true for BC as well, but a `cbc-only` wording would read better.
- The glossary term `convergence` (6.13) defines it for improper integrals only; BC's Unit 10 terms cover series
  convergence under other ids. A BC student searching "convergence" finds only the integral sense.

## Checks

`check-apcalcbc-content.mjs --check`: 33 topics, 510 items, 0 failing (FRQ, exams 0). `check-apcalcbc-map.mjs
--check`: nothing used before it is taught. `build-apcalc.mjs --check`: AB byte-identical (333 files).
`check-apcalc-map.mjs`: clean.
