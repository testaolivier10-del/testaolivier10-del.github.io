# Phase 4 accuracy review: Unit 1 (1.1-1.14) and "Algebra you need"

Independent reviewer, 2026-10-31, brief `docs/apprecalc-briefs/review-common.md`.

## Scope and what was checked

- 25 topics: the 14 Unit 1 topics and the 11 `alg-*` topics (`skills-algebra` chapter). For each one: lesson
  (hook, prereqs, figure caption, chain, ideas, misconception, summary), notes page, glossary entries and every
  question (stem, options, key, each option's explanation, numeric and expr mistakes), 365 items in all.
- FRQs with Unit 1 topics: `frq-q1-rational-graph`, `frq-q2-cubic-volume`, `frq-q2-quadratic-attendance` (every
  part, rubric line and sample). `frq-q1-exponential-justify` lists `unit-1`, but its topics are 2.2 and 2.6, so it
  was left to the Unit 2 reviewer.
- Figures: all 26 lesson SVGs of these topics and all 16 stimulus plots (15 bank, 1 FRQ), rendered to PNG with
  Playwright and checked against their functions (zeros, holes, asymptotes, extrema, labels).
- CED: the official PDF was readable through Unit 1 and the Unit 2 opener (pp. 25-52); the rest was cut off.
  Unit 1 has one "outside the scope" statement (1.1, open vs closed endpoints of increasing/decreasing intervals),
  which the course already follows. 1.3.A.3 (secant), 1.4.A.2 (included endpoint), 1.7.A.3 (slant asymptote),
  1.10.A.1 (hole by multiplicity), 1.11.B-C (division, Pascal) and 1.12.A.3-4 (dilations) are all required
  content, as the course teaches them.

## Recheck

- Every numeric key (80) recomputed by my own script from the stems (`numpy` solves, bisection for every root,
  ternary search for extrema, least squares for the regression; scratch `rev-u1/mine.py`), then graded through
  `pcalc-questions.js` in a vm: 0 mismatches, every key graded right at full precision and, on calculator items,
  at three decimals; every authored numeric mistake graded wrong, matched to its own note and different from the key
  at three decimals.
- Every `expr` key (23) compared with my own expression on its domain through `ApPrecalcExpr.compare`, and graded
  through the runtime with its form: all equal; every authored mistake graded wrong.
- "All solutions" items brute-forced on a fine grid with sign changes: `rational-zeros-6/7/9`,
  `vertical-asymptotes-9` (and no solution left of the asymptote), FRQ Q1 C(i) (3 solutions: -3.125, 0.363,
  1.762; -1 and -2 not solutions). FRQ constants and values recomputed: Q2 cubic maximum (3.924, 1056.306),
  attendance system (-0.366667, 3.633333, 0.933333; zero 10.160, vertex 4.955), Q1 rates 8/27 and 4/27.
- `node scripts/check-apprecalc-content.mjs --topic <id>`: 0 failing for every topic touched (the "exams N
  failing" line comes from the exam forms, outside this scope, being rebuilt in parallel).
  `node scripts/check-apprecalc-map.mjs --check`: nothing used before it is taught.
  `node --test scripts/test/apprecalc-*.test.mjs`: 143 pass.

No key was wrong. The problems were in explanations, distractors, one implausible context, notation in figures and
glossary formatting.

## Changes (worst first)

| Where | Old | New | Why |
|---|---|---|---|
| `model-selection-s1` and items 1, 2, 4; notes worked example 1 | beanbag heights 2, 17, 22, 17, 2 m at 0.5 s steps | 6, 18, 22, 18, 6 ft, released 6 ft above the ground; first differences 12, 4, -4, -12; second difference -8 | the old data fit h = -20t² + 40t + 2, a gravity of 40 m/s²; the new data fit h = -16t² + 32t + 6, real gravity in feet. **Key of `model-selection-2` changed -10 → -8** (mistakes 8 and -4) |
| `polynomial-end-behavior-14` option D | "Its non-real zeros come in pairs, so after pairing them off the zeros cancel out" | "Its graph always passes through the origin" (why: $x^3 + 1$) | the distractor's first clause is a valid proof that odd degree forces a real zero, so the item had two defensible answers |
| `alg-rational-expressions-5` options A, B, D | three distractors whose values did not match their explanations | the reciprocal (first fraction flipped), the product without flipping, and $x^2 - 9$ factored as $(x - 3)^2$ | each now comes from the error its note names |
| `alg-lines-1` option D | $-\frac{1}{3}$ (note said $-12/2$) | $-6$ | option did not match its explanation |
| `polynomial-rates-14` key | "Between $x = 2$ and $x = 3.5$" | "Between $x = 2$ and $x = 3$" | matches the explanation and the notes ("around $[2, 3]$") |
| `polynomial-rates-1` note on D | at $x = \pm 1$ "the graph is still falling" | rising at $-1$, falling at $1$ | wrong at $x = -1$ |
| `model-construction-7` mistake | 8.0, "$\frac{42 - 18}{3}$" | $\frac{23}{3}$, "$\frac{41 - 18}{3}$" | the table says $C(4) = 41$ |
| `model-construction-3` mistake 168 note | "$(-2 \cdot 6)^2 = 144$" | "$168 = 72 + 96$ loses the sign" | the old arithmetic did not give 168 |
| `alg-complex-numbers-2` note on C ($3 - 8i$) | "multiplies only first and last terms" (that gives 11) | real parts times real parts, imaginary coefficients times each other | note did not produce the option |
| `alg-systems-8` mistake -0.184 note | "drops $b$ from $25a + 5b = 6.9$" | "divides $-4.6$ by $25$ instead of $15$" | note did not produce the value |
| `alg-lines-9`, `alg-quadratics-8` (D), `alg-intervals-2` (B) notes | unclear or wrong reasons | rewritten to name the slip | |
| `rational-end-behavior-8` note | $-0.4750$ | $-0.4752$ | the table value |
| `transformations-9` key wording | "compressed horizontally by a factor of $\frac{1}{2}$" | "a horizontal dilation by a factor of $\frac{1}{2}$" (note: compressed toward the $y$-axis) | the CED's 1.12.A.4 wording |
| `vertical-asymptotes-3` options | key twice as long as any distractor | distractors lengthened, key shortened | length cue |
| `equivalent-representations-s1` plot | right branch drawn blue like the dashed asymptote | both branches `cls: s1` | looked like a second function |
| figures `polynomial-end-behavior-ends`, `vertical-asymptotes-sides` (`scripts/apprecalc-figures/a.mjs`) | labels "as x → ∞, p(x) → −∞", "x → 1⁻: r(x) → −∞" (the latter placed far from $x = 1$) | "lim x→∞ p(x) = −∞", "lim x→1⁻ r(x) = −∞" beside the asymptote | the course teaches that arrow notation loses the point |
| figure `complex-zeros-touch` | "touches at 1 (double zero)" ran into "crosses at 3" | "touches at 1", raised | overlap |
| lesson `complex-zeros` misconception | "$p$ in the stimulus ... because $-1$ counts twice" | "$p$ in the figure ... because the zero $1$ counts twice" | the lesson shows the figure, whose double zero is 1 |
| glossary `alg-intervals` `inequality` | "An inequality such as ..." | a real definition, then the linear-inequality rule | circular |
| glossary `equivalent-representations`, `transformations`, `model-selection`, `model-construction`, `alg-exponents` (11 entries) | plain-text math (`g(x) = 2f(x - 3) + 1`, `b^(m/n)`) | TeX | every other glossary renders math |

Regenerated: only author A's figures (`node scripts/apprecalc-figures/a.mjs`; 3 SVGs changed, registries unchanged).
No item or FRQ id changed; no item deleted.

## Read and found right (no change)

All lessons and notes pages (worked examples recomputed: covariation tables, secant estimates, 1.4 extrema,
multiplicity, difference tables, sign charts, one-sided limits, holes, long division, Pascal expansions,
transformations, regression constants, inverse-square model), all three FRQs (6 points each, one rubric line per
point, a sample per part, calculator flag right, secant named, concavity on the stated interval, domain from
context with its reason, limit notation in full), every other figure and plot. No calculus wording; Unit 4 not
used.

## Open points (added to `docs/apprecalc-needs-author.md`, "Phase 4 review: Unit 1")

1. **slant-1-7 (CED read).** 1.7.A.3 says the linear quotient of leading terms gives a slant asymptote "parallel
   to" that line and names no division; exact slant lines come with 1.11.B.2. The course's 1.7 items
   (`rational-end-behavior-11`, `-12`) and 1.9's `vertical-asymptotes-8` ask for the exact line by rewriting the
   numerator. Correct math, a little beyond 1.7's statement; a teacher may prefer to move them to 1.11.
2. **Cosmetic, author B's lesson figures** (`equivalent-representations-forms`, `transformations-parent`,
   `alg-systems-lines`, `alg-exponents-roots`, `model-selection-symmetric`): the axis letters sit outside the plot
   frame and `alg-exponents-roots` writes `x^(1/2)` with a caret. Readable and correct; not changed.
3. Glossary math in the four author-B Unit 1 topics was plain text; worth a bank-wide grep in other units.

## Notes for whoever continues

Scratch scripts (own values, grader, renders) are in the session scratchpad `rev-u1/`; they are not needed again.
