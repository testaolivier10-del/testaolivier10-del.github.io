# AP® Calculus BC, Phase 4 accuracy review: Unit 10 and `math-sequences`

Reviewer: independent (not the author). Date: 2026-10-31. Brief: `docs/apcalcbc-briefs/review-common.md`.
Self-reports reviewed against: `docs/apcalcbc-reviews/self-c.md` (math-sequences, 10.1-10.5) and `self-d.md` (10.6-10.15).

## Scope and what was checked

16 topics: `math-sequences`, `series-convergence` (10.1), `geometric-series`, `nth-term-test`, `integral-test`, `p-series`,
`comparison-tests`, `alternating-series-test`, `ratio-test`, `absolute-conditional`, `alternating-error-bound`,
`taylor-polynomials`, `lagrange-error-bound`, `radius-interval-convergence`, `taylor-series`, `power-series-functions` (10.15).

- **Questions: 254 items** (single 140, numeric 80, expr 20, interval 14), every stem, option, key, per-option explanation and
  authored mistake read; all stimulus tables and plot specs recomputed (partial sums, ratio tables, term tables, the
  sin x / P3 / P5 curves, the harmonic sums against ln(n + 1)).
- **Every interval key, endpoints by hand** (14 items): geometric-series 7 and 15, p-series 4 and 14,
  radius-interval-convergence 5, 9, 10, 11, 12, 13, taylor-series 7 and 11, power-series-functions 8 and 11. At each endpoint the
  series there, the deciding test and its conditions were rederived; every `ends` text agrees. All brackets right.
- **16 lessons** (hook, prerequisites, chain, ideas, misconception, summary), **16 notes pages** (every worked example
  recomputed), **24 glossary entries**, **16 figures** rendered to PNG with Playwright and checked against their functions,
  **3 FRQs** (`frq-u10-geometric-tests`, `frq-u10-interval-taylor`, `frq-u10-taylor-error`): every part, rubric line and sample
  recomputed; the taylor-error table, h⁽⁴⁾ and the stated series rederived from h(x) = 8/(x + 1)².
- Scope: only the six assessed tests are taught as tested (no root test); only the four Maclaurin series are presented as
  memorized; ln(1 + x) and arctan x are derived in 10.15. No later topic used early (map check clean).

## Numeric recheck

Scratch script (`recheck.mjs`, values written from the stems: partial sums, limits at large n, Simpson integrals, factorials,
direct series sums) graded through the runtime (`calc-expr.js`, `cbc-interval.js`, `calc-questions.js` in a vm, BC
`smallValues` on): **114 of 114 typed keys graded right, 220 of 220 authored mistakes graded wrong, 0 differences.**
Single-answer keys checked by hand: one item had two defensible keys (below), the rest one.

## Changes (worst first)

| Item / file | Old | New | Why |
|---|---|---|---|
| `cbc-alternating-error-bound-16` | "Which interval must contain S?" with key (S₄, S₄ + 1/25) | "Which interval for S do the alternating series error bound and the sign of the next term give?"; option 3 explanation says it contains S but uses the wrong term | Option 3, (S₄, S₄ + 1/16), also contains S: two defensible keys. Key unchanged. |
| `frq-u10-taylor-error` stem | series "converges to h(x) for 0 < x < 3" | "for −1 < x < 3" | The radius is 2 about x = 1; the stated set hid half the interval and suggested a wrong radius. |
| `cbc-series-convergence-5` mistake | 9/7 | 6/7 | The explanation (subtracting S₅ = 15/7) gives 3 − 15/7 = 6/7; 9/7 matched no slip. |
| `cbc-geometric-series-5` mistake | 76/9 | 52/9 | Adding a₀ through a₃ gives 52/9, as the explanation says; 76/9 matched no slip. |
| `cbc-geometric-series-10` mistake | 27/10 | 3/10 | Ratio 1/10 gives (27/100)/(9/10) = 3/10; explanation now shows the computation. |
| `cbc-nth-term-test-13` mistake | −1/3 | −1 | k + 1 = 0 makes the first term 0 at k = −1, as the explanation says. |
| `cbc-nth-term-test-1` mistake 2/5 why | "compares the constant terms" | "divides the top's coefficient 2 by the bottom's constant 5" | The old reason did not produce 2/5. |
| `cbc-series-convergence-14` mistake 2 why | restated the key | says 2 is the amount subtracted at n = 1 | Explain the slip. |
| `cbc-taylor-series-16` mistake 4/9 why | restated the key | "multiplies by 3; multiply by 3! = 6" | Explain the slip. |
| `cbc-power-series-functions-7` mistake 1 why | spoke of the sum 2 | 1 is Σ(1/2)ⁿ from n = 1, the series without the factor n | Explain the slip. |
| `cbc-math-sequences-13` option 3 why | terms "shrink steadily toward 0" | "after n = 2, shrink toward 0" | n²/eⁿ rises from n = 1 to 2. |
| `lessons/alternating-series-test.json` idea 4 | "The sum always lies between two consecutive partial sums." | "When the conditions hold from the first term on, the sum lies between any two consecutive partial sums." | Not true before the sizes start to decrease (the lesson's own example rises at n = 2). |
| `notes/taylor-series.html` opening | "For the functions in this course ... it equals the function." | names the functions (the four series and those built from them) and adds that this is not true of every function | needs-author `d2`. |
| Figure `geometric-series-ratios` (script `author-c.mjs` line 486, SVG, alt text) | "Each dot is a partial sum Sₙ = 1 + r + ⋯ + rⁿ" | "The dot at n is the sum 1 + r + ⋯ + rⁿ (the first n + 1 terms)" | The course defines Sₙ as the sum of the first n terms; the dot at n holds n + 1 terms. SVG text edited in place, identical to what the script now writes (other author-c figures not regenerated, to avoid touching Unit 9 output). |

**Keys changed: none.** No item or FRQ id changed or deleted.

## Needs-author points settled

- **c3-alternating-harmonic**: resolved. EK LIM-7.A.7 lists the alternating harmonic series among 10.5's reference series, so
  stating its convergence there (sum ln 2, proof deferred to 10.7) follows the CED; 10.5 items (`p-series-9`) test only that
  fact, and the map check is clean.
- **d2-taylor-equals-f**: resolved by the notes sentence above.
- **d3-frq-general-term**: resolved. Giving the Taylor series in the stem is a released BC6 pattern when a later part needs the
  alternating series bound; the stem now also states the right interval (−1 < x < 3).

## Checks

- `node scripts/check-apcalcbc-content.mjs --topic <id>` for all 16 topics: 0 failing items, bank 0, FRQ 0, meta 0.
  The `exams` count on the same line (54-58, moving while other reviewers work) is the exam reviewer's scope, not these topics.
- `node scripts/check-apcalcbc-map.mjs --check`: nothing used before it is taught.
- `node --test scripts/test/apcalcbc-questions.test.mjs`: 7 pass.

## Open points for a person

- Weak but not wrong distractors left as they are: `cbc-nth-term-test-15` mistake 1000 and `cbc-geometric-series-12` mistake 2/3
  match no clear slip; harmless (graded wrong), could be retargeted.
- `cbc-alternating-series-test-12` option 3's explanation says "if Σaₙ converges, the signed series does too", which is 10.9's
  absolute convergence stated one topic early (true, and not flagged by the map check). Fine to leave.
