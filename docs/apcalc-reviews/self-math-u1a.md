# Self-report: "Math you need" (skills-math) and Unit 1 topics 1.1-1.6

Author pass, 2026-10-13. Not yet independently reviewed.

## Topics done

Every topic has lesson, notes, questions, glossary (every concept the map lists for it) and figures.

| Topic | Kind | Items | In sets | Notes words (approx.) | Figures |
|---|---|---|---|---|---|
| math-functions | skill | 12 | 4 | 1,150 | fn-reading-graph, fn-shifts |
| math-exponent-rules | skill | 12 | 0 | 800 | powers-of-x |
| math-limit-algebra | skill | 11 | 0 | 900 | rationalize-hole |
| math-trig | skill | 13 | 0 | 1,050 | unit-circle, sin-cos-graphs |
| math-exp-log | skill | 13 | 0 | 950 | exp-log-mirror |
| math-inverse-functions | skill | 13 | 4 | 900 | inverse-reflect |
| math-geometry | skill | 11 | 0 | 900 | ladder-and-cone |
| change-at-an-instant (1.1) | concept | 16 | 8 | 1,000 | instant-chords |
| limit-notation (1.2) | concept | 16 | 8 | 950 | limit-vs-value |
| limits-from-plots (1.3) | concept | 16 | 9 | 850 | limit-four-cases |
| limits-from-tables (1.4) | concept | 16 | 8 | 800 | table-zoom |
| limit-laws (1.5) | concept | 16 | 9 | 1,000 | limit-laws-sum |
| limit-algebra (1.6) | concept | 16 | 8 | 1,000 | factor-hole |

Totals: 181 items (116 single, 58 numeric, 7 expr), 15 figures, no FRQs (none assigned). Calculator items: 3 (a table estimate in 1.4, `cos(1)` in radians,
a population solve), each keyed to full precision. Every check passes `checkTopic` (lengths, sets, levels,
practices, ordering, math) and the bank-level test-wise and near-duplicate rules against the whole current bank.

## Figures

`scripts/apcalc-figures/math-u1a.mjs` draws all 15 SVGs into `calculus/figures/` by sampling the stated
functions (each figure's function is written beside it in the script). White background, `role="img"`,
`<title>`/`<desc>`, Arial, ink #1F2A28, crimson #8C1036, Okabe-Ito second colours. Each was rendered to PNG with
Playwright and inspected; overlaps and cut-off labels fixed. Graph stimuli use build-time `plot` specs (one colour
per function, open/closed ends), also rendered and inspected.

## Numeric recheck

A scratch verifier (not in the repo) imported every item's authoring source, recomputed each numeric key from an
independent formula, compared each expr key with an independent function at 50 points of its domain, and graded
through the runtime (`ApCalcQuestions.grade`, `ApCalcExpr.grade`): every key graded right (calculator keys also at
three decimals, every accepted unit spelling accepted), every authored mistake graded wrong and matched to its
feedback. Result: 65 numeric/expr keys, 132 authored mistakes, 0 failures. Single items whose correct option is a
computed number were also checked against their computation. Figure and notes values (table entries, average
speeds, the misleading-table function) were recomputed in code.

## Map edit (my topic's concept only)

`inverse-function` (taught in `math-inverse-functions`) had notation patterns `\^\{-1\}` and `\^-1`, which
flagged every negative exponent `x^{-1}` as inverse-function notation, so exponent rules (and Unit 2's power rule)
could not write `x^{-1}`. Changed to `(?<![\\A-Za-z])[fghFGH]\^\{?-1\}?` (a function letter f, g, h) and
`\\(?:sin|cos|tan|sec|csc|cot)\^\{?-1\}?`. `check-apcalc-map.mjs --check` passes.

## Open questions for needs-author

1. **Composition limit law wording (1.5).** Notes say `lim f(g(x)) = f(lim g(x))` "if f is continuous at b",
   using "continuous" in its everyday sense, since continuity is taught in 1.10-1.12. A teacher may prefer a
   preview box or a later placement.
2. **Unbounded behavior before 1.14.** Topics 1.3-1.6 describe unbounded outputs in words ("no finite limit;
   grows without bound") because `= \infty` notation belongs to `infinite-limits`. Confirm that wording matches
   what the exam accepts at that stage.
3. **Skill topics without stimulus sets.** Five skill topics have no sets (not required by the checker for
   `kind: skill`); fine as drill pages, flag if the owner wants sets everywhere.
4. Inverse-function and geometry pages sit late in course order (before 3.3 and 4.4) but are in the free "Math
   you need" chapter that students may read first; they avoid calculus words anyway (slopes, not derivatives).
