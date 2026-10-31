# AP® Precalculus: Phase 0 dependency map

The map is `docs/apprecalc-dependency-map.json`. It is checked by `node scripts/check-apprecalc-map.mjs --check`
(library `scripts/lib/apprecalc-map.mjs`, tests `scripts/test/apprecalc-map.test.mjs`); `--order` prints the course
order. If this file and the JSON disagree, the JSON is right. Unit and topic facts come from
`docs/apprecalc-ced-map.json` (our own words, from `docs/apprecalc-research/framework.md`); no CED text is
reproduced. Open questions are in `docs/apprecalc-needs-author.md`.

## Counts

| | |
|---|---|
| Chapters | 5: Units 1-4 and one skills chapter, "Algebra you need" (`skills-algebra`) |
| Topics | 69: the 58 CED topics in CED order (14, 15, 15, 14) and 11 algebra topics (`alg-*`) |
| Concepts | 124 (algebra 28, Unit 1 36, Unit 2 21, Unit 3 24, Unit 4 15); 13 also carry `notation` |
| Everyday words | 11 (input(s), output(s), parameter(s), range, degree, frequency, vector(s)) |
| Planned tools | 11 simulators (the ten trainers of spec section 6 and "Make it specific"), 19 FRQ themes, 11 stimulus themes, 4 comparison tables, 4 pathways |

## Format

As `docs/apcalc-phase0.md`, with these differences:

- `practices[]` are the three CED practices (1 Procedural and Symbolic Fluency: 1.A-1.C; 2 Multiple
  Representations: 2.A-2.B; 3 Communication and Reasoning: 3.A-3.C). Their exam weights are not published where we
  could read them, so `practicesConfirmed: false` and no weights (needs-author `practice-weights`).
- `topics[].ced` must be a CED number (`CED_TOPICS` in `scripts/lib/apprecalc-map.mjs`, sizes 14/15/15/14).
- **Unit 4** has `beyondExam: true` and `weight: [0, 0]`; the check refuses any other weight on it, an FRQ theme in
  it, and a beyond flag on any other chapter.
- FRQ themes have type `concepts`, `modeling`, `periodic` or `symbolic` (`FRQ_TYPES`) and an `author` (A-F).
- `REQUIRED_SIMULATORS` lists the ten trainers plus `justify` ("Make it specific").

## Notation

`concepts[].notation` is a list of regular expressions matched against the TeX of every formula. Words alone are
not enough: `$\log_2 x$` uses the logarithm without naming it.

| Concept | Taught in | Notation (regex on TeX) |
|---|---|---|
| piecewise-function | algebra | `\begin{cases}` |
| trig-ratio | `alg-right-triangle` | `\sin`, `\cos`, `\tan` |
| binomial-theorem | 1.11 | `\binom` (not in the TeX subset; kept so a later addition is caught) |
| limit | 1.6 | `\lim`, `\to \infty` |
| one-sided-limit | 1.9 | `\to a^-`, `\to a^+` |
| natural-base | 2.3 | `e^` |
| composition | 2.7 | `\circ` |
| inverse-function | 2.8 | `f^{-1}`, `g^{-1}`, ... |
| logarithm | 2.9 | `\log`, `\ln` |
| inverse-trig | 3.9 | `\arcsin`..., `\sin^{-1}`... |
| reciprocal-trig | 3.11 | `\sec`, `\csc`, `\cot` |
| vector | 4.8 | `\vec`, `\langle` (so `\left\langle` too) |
| matrix | 4.10 | `\begin{bmatrix}` / `pmatrix` / `vmatrix` (authors use `\left[ \begin{matrix}`: needs-author `tex-subset`) |

The JSON is authoritative; the check validates every pattern.

## Course order

Units in CED order, Unit 4 last. Each algebra topic sits right before the topic that first needs it (`before`):

| Algebra topic | Before |
|---|---|
| `alg-functions`, `alg-intervals` | `change-in-tandem` (1.1) |
| `alg-lines` | `rates-of-change` (1.2) |
| `alg-quadratics` | `linear-quadratic-rates` (1.3) |
| `alg-polynomial-algebra` | `polynomial-rates` (1.4) |
| `alg-complex-numbers` | `complex-zeros` (1.5) |
| `alg-rational-expressions` | `rational-end-behavior` (1.7) |
| `alg-systems` | `model-construction` (1.14) |
| `alg-exponents` | `sequences` (2.1) |
| `alg-right-triangle`, `alg-circles` | `sine-cosine-tangent` (3.2) |

The prerequisites are the CED's own list (`framework.md` section 8). The chapter is free and has no unit test.

## Tools by chapter

| Chapter | Simulators | FRQ themes (author) |
|---|---|---|
| Unit 1 | `rate-of-change`, `poly-rational`, `function-lab`, `regression-lab`, `justify` | q1-rational-graph (A), q2-cubic-volume (A), q2-quadratic-attendance (B) |
| Unit 2 | `exp-log-lab`, `symbolic-steps` | q2-exponential-depreciation, q1-exponential-justify, q2-cooling-residuals (B); q1-table-composition-inverse, q1-log-function, q2-logarithmic-sales, q4-exp-log-equations, q4-quadratic-in-ex (C) |
| Unit 3 | `unit-circle`, `sinusoid-builder`, `polar-graphs` | q3-ferris-wheel, q3-tide, q3-spring, q3-waterwheel (D); q1-trig-composition, q4-trig-equation-interval, q4-single-tangent, q4-single-sine (E) |
| Unit 4 | `vectors-matrices` | none (beyond the exam) |

By type: 5 concepts, 6 modeling, 4 periodic, 4 symbolic. Two exams need two of each; the rest feed the FRQ page.

## The ordering rule

As AP® Calculus AB: no page may use a concept's term before the topic that teaches it, except everyday words.
`splitMath(html)` separates prose from the TeX of each formula; prose is scanned for terms and TeX for `notation`.
So a 1.4 lesson that writes `$\log_2 x$` fails until 2.9, as one that says "logarithm" does. No pulled-forward
short versions are planned; if a topic needs one, add it to the map with a `preview` box.
