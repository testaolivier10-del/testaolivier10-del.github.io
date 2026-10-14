# AP® Calculus AB authoring guide

Rules for writing AP® Calculus AB content, adapted from `docs/apphys-authoring-guide.md`. They come from
`docs/apcalc-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/apcalc-architecture.md` ("Content formats"). The research is in `docs/apcalc-research/framework.md`
(section 8 lists where students lose points; every rule below that names an error comes from there).

## Before you write a topic

1. Find the topic in `docs/apcalc-dependency-map.json`: its id, CED number, focus practices and the
   concepts it owns. Read its entry in `docs/apcalc-ced-map.json` and write it in your own words.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. **This holds for notation
   too**: `$f'(x)$`, `$\int_0^1$`, `$\lim$` count as using the derivative, the definite integral, the
   limit (`docs/apcalc-phase0.md`, "The ordering rule"). Add a missing concept to the map first.
3. Write `calculus/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-apcalc-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apcalc-map.mjs --check`.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board questions,
  AP Classroom items, the CED's text or any textbook. Use the CED, scoring guidelines and Chief Reader
  Reports for scope and for the errors to target, never as item sources. Invent your own functions,
  tables and contexts.
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Calculus AB
  exam"). Never "AP" alone, plural, possessive, or in a URL, id, file name or meta description.

## Scope: what is NOT tested on AB (exclusions)

Nothing below appears in an item, FRQ or required step. Notes may mention one in a `going-further`
aside. Units 1-2 boundaries are verified; Units 3-8 need a person to check the CED
(`docs/apcalc-needs-author.md`, ced-exclusions).

- Epsilon-delta definitions and proofs of limits.
- BC-only topics: integration by parts (6.11), partial fractions (6.12), improper integrals (6.13),
  Euler's method (7.5), logistic models (7.9), arc length (8.13), and the BC techniques inside 6.14.
- The **shell method** (not a CED topic; needs-author `shell-method`).
- Parametric, polar and vector-valued functions; sequences and series (Units 9-10, BC only).
- Differential equations that are not separable.

## Math syntax

Math is TeX between dollar signs: `$f'(x) = 3x^2$` inline, `$$\int_0^2 3x^2\,dx = 8$$` display, `\$` for a
real dollar sign. In JSON every backslash is doubled (`"$\\int_0^1 x\\,dx$"`). The subset (top of
`calculus/assets/calc-math.js`) covers everything AB needs; anything else stops the build.

- Functions upright: `\sin x`, `\ln(x + 1)`, `e^{2x}` (braces for multi-character exponents).
- Fractions `\frac{a}{b}`; roots `\sqrt{x}`, `\sqrt[3]{x}`; absolute value `|x|` or `\left| ... \right|`.
- Limits `\lim_{x \to 2^-} f(x)`; integrals `\int_0^3 f(t)\,dt` (always `\,dt`, the differential is
  never dropped); evaluation `\Big|_0^3`; sums `\sum_{i=1}^{n}`.
- Primes `f'(x)`, `f''(x)`; Leibniz `\frac{dy}{dx}`, `\frac{d^2y}{dx^2}`, `\left.\frac{dy}{dx}\right|_{x=2}`.
- Piecewise `f(x) = \begin{cases} x^2 & x < 1 \\ 2x - 1 & x \ge 1 \end{cases}`.
- Words inside math with `\text{ft}`; units outside math where possible ("$12$ feet per second").
- Titles (lesson, stimulus, FRQ) may hold `$...$` except FRQ titles; the page title uses plain text.

## Notation the exam rewards

Write it the way the scoring guidelines want, so students copy good habits:

- `=` only between equal things. Never chain a value into the next step (`h'(7) = 3 = h(7)` is a linkage
  error); never write `0/0 = 3`.
- Keep `dy`, `dy/dx`, `dy/dt` and `y'` apart; write `= 0` after differentiating an implicit equation;
  apply `d/dx` to both sides.
- Parentheses when substituting an expression: `f(g(x))`, `(x + h)^2`.
- Name the function: "f′ changes from positive to negative at x = 3", never "it" or "the graph".
- Every integral has its `dx`; every antiderivative has `+ C`.

## Expression answers (`expr` items)

Use an `expr` item when the answer is a formula (a derivative, an antiderivative, a tangent line, a
solution of a differential equation). Format: `docs/apcalc-architecture.md`, "expr items".

- `answer` is written in the **student syntax**, not TeX: `2x*cos(x^2)`, `sin(3x)/3`, `e^(2x)`,
  `ln(abs(x))`, `sqrt(x)`. Check it with `ApCalcExpr.read` (the content check does).
- Give `domain` where the key is defined (`[0.5, 3]` for `ln(x)`). Points where the key is not finite are
  skipped, but at least most of the domain must be defined.
- Antiderivatives use `mode: "constant"`; the student must add `+ C` (the item says so in the note).
  Use `needC: false` only for a definite antiderivative such as `F(x) = \int_2^x ...`.
- `lhs` shows what the box completes (`"F'(x) ="`), in TeX.
- Two to three `mistakes`, each a real slip with a `why` that fixes it: the chain rule's inside factor
  dropped, the sign of the derivative of cosine, the power rule run the wrong way, a missing constant
  factor.
- Expr items are never calculator items.

## Calculator and no-calculator items

- Mark a calculator item `calc: true`. Use it only when a calculator is needed: a numerical integral, a
  numerical derivative, an intersection, a solution of an equation, graphing. The exam's four calculator
  skills are exactly those.
- **The three-decimal rule.** A calculator answer is correct when it matches the true value rounded or
  truncated to three decimal places. Key the full-precision value (`0.7468241328124271`), not a rounded
  one; the grader applies the rule. Explanations remind students to store values and round only at the
  end.
- **No-calculator answers are exact.** Key `"pi/4"`, `"ln(3)"`, `"sqrt(2)/2"` or a fraction `"1/3"`.
  The content check refuses a rounded-looking key on a no-calculator item. Students may type the exact
  form or a value right to three decimals (accepted with a note).
- Show the setup in every calculator explanation (`$\int_0^9 r(t)\,dt$`), never a bald number.
- Radians always; say so in trigonometry calculator explanations.

## Units

Units are optional unless the question is in context. In context, set `askUnit: true` with the canonical
`unit` and other spellings in `units`. Get them right: a rate of a rate is "degrees per minute per
minute"; the integral of a rate has the accumulated unit (liters), not the rate's (liters per hour).

## Level and voice

- High school, from scratch, for a student whose class moved too fast. Short sentences, active voice,
  "you". A concrete picture first (a graph, a table, a moving car), then the rule.
- Every lesson has a plot drawn from its function (`plot` spec), never a hand-drawn approximation.
- A worked example before any new calculation type, in `<div class="worked">`, with words beside the
  math.
- Precalculus slips cause most lost points: show the algebra (product rule with three factors, chain rule
  on `e^u` and `ln y`, factoring) one step at a time, and do not simplify more than the question needs.

## Questions

- Every item carries `unit`, `topic`, `practice` (`"2.B"`) and, if needed, `calc: true`. 1.A, 1.B and 3.A
  are not assessed by multiple choice; practice 4 (Communication and Notation) is free response only.
- **Four options** for single-answer items, similar lengths, distractors from real errors, each option's
  explanation naming the error by content, never by letter.
- At least 60% apply/analyze, and at least 40% of a topic's items in **stimulus sets** of 4-5 items
  sharing one table or graph (`plot`). Tables have units in every heading and unequal widths sometimes.
- Graph stimuli: the `plot.label` says what the graph shows (20+ characters); open and closed dots mark
  endpoints and jumps; a graph of f′ is titled as one ("The graph of $f'$"), never left to guess.
- Every unit mixes representations: graph, table, formula and words for the same function.

## Justifications

A justification names the reason with its condition (the scoring guidelines' language):

- **Theorems with hypotheses.** "f is differentiable, so it is continuous on [1, 4]. By the Intermediate
  Value Theorem ..." The checker refuses a model answer that names the IVT, MVT or EVT without saying
  continuous. The MVT also needs differentiable on the open interval. L'Hospital's rule needs both limits
  shown to be 0 (or both infinite) first.
- **Extrema.** A relative extremum: f′ changes sign at the point, saying from what to what. An absolute
  extremum on a closed interval: the candidates test (endpoints and critical points, a table of values)
  or a global argument, never a single sign change.
- **Sign charts alone do not justify**: say in words what changes sign and what that means.
- **Motion.** Direction changes only where v changes sign, not where v = 0. Speeding up when v and a have
  the same sign; say both signs. Displacement is ∫v; total distance is ∫|v|.
- **Concavity and inflection**: f″ changes sign (or f′ changes from increasing to decreasing).
- **Over- or underestimates**: from concavity for tangent lines; from monotonicity for left and right
  Riemann sums.
- **Interpretations** name the quantity, its units, and the interval or time.

## FRQs: the 9-point rubric style

Six types in a full exam, 9 points each (two calculator, four no-calculator). One rubric line per point,
each with accepted wordings; a full-credit sample for every part; task verbs in bold (Find, Estimate,
Explain, Justify, Write, Determine, Show).

| Type | Shape | Points go to |
|---|---|---|
| `table` | a rate in context from a table | a difference quotient with units; a Riemann or trapezoid sum with the table's widths; the meaning of an integral in context; a justification with the right theorem |
| `model` | a modeling function (calculator) | an integral setup; the numerical value to three decimals; a rate comparison; an extremum by the candidates test |
| `motion` | a particle on a line | velocity and acceleration signs; speeding up or slowing down; displacement vs total distance; position from an initial value |
| `area` | area and volume | the integrand and limits; discs or washers about the given line with π; cross sections squared |
| `de` | a differential equation | a slope field; a tangent-line approximation; separation of variables with + C and the initial condition |
| `graph` | the graph of f′ | increasing, decreasing, extrema and concavity read from f′; g(x) = ∫ f; values from geometric areas |
| `implicit` | implicit differentiation | d/dx on both sides; dy/dx; horizontal and vertical tangents; a second derivative |
| `fg` | functions given by a table and a formula | product, quotient and chain rules on table values; the MVT or IVT with hypotheses; limits with L'Hospital's rule |

Typical split: one point for an answer, one for its setup, one for a justification. The answer point
needs the setup; a justification point needs the right reason, not just the right conclusion.

## Contested or uncertain math

Add it to `docs/apcalc-needs-author.md` instead of guessing. Every unit gets an independent accuracy
check before it is published, with every numeric and expression key recomputed by code.
