# AP® Calculus AB: Phase 0 dependency map

The map is `docs/apcalc-dependency-map.json`. It is checked by
`node scripts/check-apcalc-map.mjs --check` (library `scripts/lib/apcalc-map.mjs`, tests
`scripts/test/apcalc-map.test.mjs`); `--order` prints the course order. If this file and the JSON
disagree, the JSON is right. Unit and topic facts come from `docs/apcalc-ced-map.json` (our own
words, from `docs/apcalc-research/framework.md`); no CED text is reproduced. Open questions are in
`docs/apcalc-needs-author.md`.

## Counts

| | |
|---|---|
| Chapters | 9: Units 1-8 (CED weights) and one skills chapter, "Math you need" (`skills-math`) |
| Topics | 88: the 81 AB topics in CED order (BC-only 6.11-6.13, 7.5, 7.9 and 8.13 left out, so the numbers skip them), 7 math topics |
| Concepts | 136, each with its terms and aliases; 18 also carry `notation` |
| Pulled-forward short versions | 1 (`concavity-for-linearization`: concave, in 4.6) |
| Everyday words | 9 (speed, speeds, velocity, input, output, continuous, polynomial, polynomials, accumulation) |
| Planned tools | 11 simulators (the 10 trainers of spec section 6 and the justification trainer), 11 FRQ themes, 13 stimulus themes, 8 comparison tables, 8 pathways |

Concepts per chapter: math 25, Unit 1 25, Unit 2 15, Unit 3 6, Unit 4 13, Unit 5 15, Unit 6 16,
Unit 7 8, Unit 8 13. Authors add a concept, with `taughtIn` and `dependsOn`, whenever a topic teaches a
term the map does not have.

## Format

As `docs/apphys-phase0.md`, with these differences:

- `practices[]` are the four Mathematical Practices (1 Implementing Mathematical Processes, 2 Connecting
  Representations, 3 Justification, 4 Communication and Notation) with their skills and weights.
  Practice 4 has `mcqWeight: [0, 0]`: free response only.
- `topics[].ced` must be an AB topic number (`AB_TOPICS` in `scripts/lib/apcalc-map.mjs`); a BC-only
  number is an error.
- FRQ themes have type `table`, `model`, `motion`, `area`, `de`, `graph`, `implicit` or `fg`
  (`FRQ_TYPES`). Stimulus themes are `table`, `graph` or `diagram`.
- `REQUIRED_SIMULATORS` lists the ten trainers plus the justification trainer.
- **`concepts[].notation`**: a list of regular expressions matched against the TeX of every formula
  (the `<annotation>` the build keeps). Words alone are not enough in calculus: `f'(x)` uses the
  derivative and `\int_0^1` the definite integral without naming them. The patterns:

| Concept | Notation (regex on TeX) |
|---|---|
| limit | `\\lim(?![a-z])` |
| one-sided-limit | `\\to` followed by a `^+` or `^-` |
| limit-at-infinity, infinite-limit | `\\to \\infty`; a `\\lim` equal to `\\infty` |
| derivative | `[A-Za-z]'`, `\\prime`, `\\frac{d}{dx}` |
| second-derivative | `[A-Za-z]''`, `\\frac{d^2...` |
| difference-quotient | `f(x + h)` |
| definite-integral | `\\int_` |
| indefinite-integral | `\\int(?!_)`, `+ C` |
| sigma-notation | `\\sum` |
| piecewise-function, composition, indeterminate-form | `cases`, `\\circ`, `\\frac{0}{0}` |
| trig-function, exponential-function, natural-log, inverse-function, inverse-trig | `\\sin`..., `e^`, `\\ln`, `^{-1}`, `\\arcsin`... |

The full list is in the JSON; `node scripts/check-apcalc-map.mjs --check` validates every pattern.

## Course order

Units in CED order. Each math topic sits right before the topic that first needs it (`before`):

| Math topic | Before |
|---|---|
| `math-functions`, `math-exponent-rules` | `change-at-an-instant` (1.1) |
| `math-limit-algebra` | `limit-algebra` |
| `math-trig` | `squeeze-theorem` |
| `math-exp-log` | `continuity-on-intervals` |
| `math-inverse-functions` | `inverse-function-derivatives` |
| `math-geometry` | `related-rates-intro` |

## Pulled-forward short version

Local linearity (4.6) asks whether a tangent-line estimate is too high or too low, which needs the sign of
f″ before 5.6 teaches concavity. 4.6 gives the short version (bends up: the tangent lies below, an
underestimate); 5.6 owns concavity.

## The ordering rule

As AP® Physics 1: no page may use a concept's term before the topic that teaches it, except everyday
words and pulled-forward short versions. Calculus adds notation: `splitMath(html)` separates prose
from the TeX of each formula; prose is scanned for terms and TeX for `notation`. So a Unit 1 lesson
that writes `$f'(2)$` fails until the derivative is taught, as one that says "derivative" does.
