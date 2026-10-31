# AP® Precalculus authoring guide

Rules for writing AP® Precalculus content, adapted from `docs/apcalc-authoring-guide.md`. They come from
`docs/apprecalc-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/apprecalc-architecture.md` ("Content formats"). The research is in `docs/apprecalc-research/framework.md`
(section 7 lists where students lose points; every rule below that names an error comes from there).

## Before you write a topic

1. Find the topic in `docs/apprecalc-dependency-map.json`: its id, CED number, practices and the concepts it owns.
   Read its entry in `docs/apprecalc-ced-map.json` and write it in your own words.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. **This holds for notation too**:
   `$\lim$`, `$\log$`, `$f^{-1}$`, `$\sin$`, `$e^x$`, `$f \circ g$` count as using the limit, the logarithm, the
   inverse, the trig ratio, the natural base, composition (`docs/apprecalc-phase0.md`, "The ordering rule"). An
   "Algebra you need" topic sits right before the topic that first needs it, so you may use what it teaches. Add a
   missing concept to the map first.
3. Write `precalculus/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-apprecalc-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apprecalc-map.mjs --check`.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board questions, AP
  Classroom items, the CED's text or any textbook. Use the CED, scoring guidelines and Chief Reader Reports for
  scope and for the errors to target, never as item sources. Invent your own functions, tables and contexts; the
  FRQ task models in `framework.md` section 5 are for coverage only (a Ferris wheel is fine; its numbers and part
  wording are ours).
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Precalculus exam"). Never
  "AP" alone, plural, possessive, or in a URL, id, file name or meta description.

## Scope: what is NOT tested (exclusions)

Nothing below appears in an exam item, an FRQ or a required step of a Unit 1-3 item. Notes may mention one in a
`going-further` aside.

- **All of Unit 4.** It is built as "beyond the exam" (spec decision 7): lessons, notes and practice, never FRQs,
  exams or exam-only items. The build adds the one-line notice to its pages; never paste it yourself.
- **Open vs closed endpoints on increasing and decreasing intervals** (new for 2026-27). Either is right; never
  grade the bracket. Endpoints still matter for domains, ranges and the interval of an average rate of change.
- **Calculus.** No derivatives, no `f'`, no "instantaneous rate", no "increasing at a decreasing rate" (the content
  check refuses all three). Say "the rate of change of f is decreasing" or "f is concave down". Limits appear only
  as notation for end behaviour and asymptotes, never as a computation with ε or a limit law.
- **Half-angle identities and the tangent sum and difference formulas** (third-party source; needs-author
  `exclusions-trig`). Sum identities for sine and cosine and the double-angle identities are in.
- Units 2-3 exclusions beyond these are not yet checked against the CED (needs-author `ced-exclusions`); if you
  meet one, add it there.

## Math syntax

Math is TeX between dollar signs: `$f(x) = 2^x$` inline, `$$\log_2 8 = 3$$` display, `\$` for a real dollar sign.
In JSON every backslash is doubled (`"$\\log_2 8$"`). The subset (top of `precalculus/assets/pcalc-math.js`) covers
what Units 1-3 need; anything else stops the build.

- Functions upright: `\sin x`, `\ln(x + 1)`, `\log_b x`, `e^{2x}` (braces for multi-character exponents).
- Inverses: `f^{-1}(x)` for the inverse function, `\sin^{-1} x` or `\arcsin x` for inverse sine (pick one per
  page). Never write `\frac{1}{\sin x}` and `\sin^{-1} x` side by side without saying they differ.
- Limits for behaviour only: `\lim_{x \to \infty} f(x) = 2`, `\lim_{x \to 3^-} f(x) = -\infty`.
- Piecewise `\begin{cases} ... \end{cases}`; intervals `[0, 2\pi)`; angles in radians unless the item says degrees.
- Polar `r = 2 + \cos\theta`; points `(r, \theta)`.
- Unit 4: vectors `\mathbf{v} = \left\langle 3, 4 \right\rangle`, magnitude `\left\| \mathbf{v} \right\|`, matrices
  `\left[ \begin{matrix} 1 & 2 \\ 3 & 4 \end{matrix} \right]`.
- Titles (lesson, stimulus) may hold `$...$`; FRQ titles and page titles use plain text.

## Notation the exam rewards

The scoring guidelines take points for notation. Write it their way so students copy good habits:

- **Limit notation for end behaviour and asymptotes**, written fully: `$\lim_{x \to \infty} f(x) = 3$`, never
  "f → 3" or "as x gets big f is 3". A vertical asymptote at x = 2 needs both one-sided limits, each with its sign
  (`= \infty` or `= -\infty`).
- `=` only between equal things. Never chain a value into the next step; never write `f(2) = 4 = g(4)`.
- Function notation with inputs and outputs kept apart: "f(3) = 7 means the input 3 gives the output 7".
- Name the function and the interval: "the average rate of change of f on [1, 4] is 2", never "it" or "the slope".
- Parentheses when substituting: `f(g(2))`, `2(x - 1)^2`.

## Decimals: the three-decimal rule

- A decimal answer is right when it matches the true value rounded or truncated to three places. Key the
  full-precision value (`1.4142135623730951`); the grader applies the rule.
- **Never round partway.** Model constants (Q2's system, Q3's period) are stored, not rounded; an explanation that
  rounds a constant and then uses it is wrong. Explanations say "store the value" at the step where it matters.
- No-calculator answers are exact: key `"ln(3)/2"`, `"pi/6"`, `"sqrt(3)/2"`, a fraction. The content check refuses a
  rounded-looking key on a no-calculator item. Students may type the exact form or a value right to three decimals.

## Calculator and no-calculator items

- `calc: true` only when a graphing calculator is needed: solving an equation with no algebraic route, every
  intersection or zero, a regression (linear, quadratic, cubic, quartic, exponential, logarithmic, sinusoidal), a
  residual plot, a decimal value of a model. Section I Part B and FRQ Part A are calculator; the rest is not.
- **Find every solution.** Calculator solves ask for all solutions in a stated interval; explanations say how to
  widen the window, and distractors include the answer that misses one.
- **Radian mode** always; say so in every trig calculator explanation.
- Show the setup in every calculator explanation (the equation solved, the regression type and its constants),
  never a bald number.

## Expression answers (`expr` items)

Use an `expr` item when the answer is a formula: an inverse, a composite, a rewritten log or exponential, a single
trig function, a model. Format: `docs/apprecalc-architecture.md`.

- `answer` is in the **student syntax**: `log_2(x) + 3`, `ln(x^2)`, `e^(2x)`, `sin^-1(x)`, `sqrt(x - 1)`. The
  content check reads it with `ApPrecalcExpr.read`.
- **`domain` is where the question lives.** Logs and roots: inside their domain (`[0.1, 5]` for `ln(x)`); inverse
  trig: `[-1, 1]` for `arcsin`; trig identities: a range that avoids the asymptotes is not needed (undefined
  points are skipped), but at least 8 of 40 points must be defined. Use a two-sided domain on purpose when the
  rule changes the domain (`ln(x^2)` vs `2 ln(x)`): the grader then marks `2ln(x)` wrong and names the log rule.
- `mode: "exact"` only.
- `lhs` shows what the box completes (`"f^{-1}(x) ="`), in TeX.
- Two to three `mistakes`, each a real slip with a `why`: a log rule run backward (`log(a + b)`), `tan^{-1}` read as
  `1/tan`, the inside and outside of a composite swapped, a sign lost when reflecting.
- Expr items are never calculator items.

## Rates of change and concavity (the Q2 and Q3 reasoning)

The weakest FRQ reasoning, so every topic from 1.2 on rehearses it in the same words:

- **Average rate of change = slope of the secant line**, with the interval: "The average rate of change of f on
  [2, 5] is (f(5) − f(2))/(5 − 2) = ..., the slope of the secant line through (2, f(2)) and (5, f(5))." The justify
  checker refuses a `rates` answer that does not name the secant.
- An estimate from a secant uses a point **on** that secant line.
- **Over- or underestimate from concavity on the stated interval**: "f is concave down on [2, 5], so the graph lies
  above the secant line there and the estimate is an underestimate."
- **How f changes vs how its rate of change changes.** "f is increasing" is about f; "the rate of change of f is
  decreasing" is about the rates. Never merge them into "increasing at a decreasing rate" (calculus wording; refused
  outside a `.pcalc-trap` callout).
- Concavity from rates over equal intervals: successive average rates increasing → concave up.
- **Domain from context** (Q2's hardest part): name the bound and why the model fails past it ("after t = 8 the
  model's total decreases, which a running total cannot do").
- **Error growth**: past the last data point the model is not supported by data, and say what changes in context.

## Justifying a model type and invertibility

- **Linear or exponential from a table**: say both halves, **equal-length input intervals** and **constant
  differences** (linear) or **constant ratios / proportional outputs** (exponential), with the numbers.
- **Invertible or not**: use specific values of the given function: "f(1) = f(4) = 3, so two inputs share the
  output 3 and f is not invertible." The bare phrase "fails the horizontal line test" or "not one-to-one" earns
  nothing (the checker refuses an invertibility answer with no values).
- Say "f has no inverse", not "f is not an inverse".

## Q4: symbolic manipulations

- Exact values; real solutions only; radians; work on every step.
- **Single-term forms mean one term**: one log (`log_2(x^3/5)`), one base power (`7^(2x - 1)`), one trig function
  (`tan x`, not `sin x / cos x`). Stopping at a quotient loses the point; items say "as a single ..." and grade by
  evaluation plus the form.
- **Quadratic in eˣ**: substitute `u = e^x`, solve, and reject the root where `e^x` would be negative or zero, saying
  why.
- **Inverse trig ranges**: arcsin and arctan give [−π/2, π/2], arccos [0, π]. `tan^{-1} x` is not `1/tan x`.
- **All solutions in an interval**: undo the outer function first, list every solution in the interval, and no
  extras; distractors include the missed second solution and an extra outside the interval.
- Pythagorean identities, sum identities for sine and cosine, double-angle identities. No half-angle, no tangent
  sum.

## Periodic modeling (Q3)

- Five labeled points on an unscaled sinusoid: say which point is a maximum, minimum or midline crossing, then its
  coordinates from the context.
- **b from the period**: `b = 2π / period`; period is the reciprocal of frequency. Phase shift with its sign:
  `a sin(b(t + c)) + d` shifts left by c.
- Rate and concavity on an interval in precalculus words: "h is decreasing and the rate of change of h is
  increasing on (2, 4)."

## Units

Units are optional unless the question is in context. In context, set `askUnit: true` with the canonical `unit` and
other spellings in `units`. An average rate of change has "output units per input unit" ("dollars per year").
Thousands are fine if used consistently.

## Level and voice

- High school, from scratch, for a student whose class moved too fast. Short sentences, active voice, "you". A
  concrete picture first (a graph, a table, a context), then the rule.
- Every lesson has a plot drawn from its function (`plot` spec), never a hand-drawn approximation.
- Use all four representations (graph, table, formula, words) for the same function in every unit.
- A worked example before any new calculation type, in `<div class="worked">`, with words beside the math.
- Algebra slips cost most points: show the algebra one step at a time (factoring, exponent rules, log rules),
  and use the "Algebra you need" topic's wording when you reuse it.

## Questions

- Every item carries `unit`, `topic`, `practice` (`"2.A"`, one of 1.A-1.C, 2.A-2.B, 3.A-3.C) and, if needed,
  `calc: true`. Practice weights are not confirmed: spread items across the topic's practices.
- **Four options** for single-answer items, similar lengths, distractors from real errors, each option's
  explanation naming the error by content, never by letter.
- At least 60% apply/analyze, and at least 40% of a topic's items in **stimulus sets** of 4-5 items sharing one
  table or graph (`plot`). Tables have units in every heading; some have unequal input steps (the trap for
  linear/exponential).
- Graph stimuli: `plot.label` says what the graph shows (20+ characters); open and closed dots mark holes and
  endpoints; asymptotes dashed.
- Unit 4 items are practice only; never `exam: true`.

## "Make it specific" prompts

A model answer names the reason with the values (`docs/apprecalc-architecture.md`, "Make it specific"). Skills:
`values`, `limits`, `rates`, `concavity`, `domain`, `model`, `invertible`, `periodic`, `symbolic`, `decimals`. The
`misses` answer is the vague or calculus-worded one the reader reports describe; `earns` uses the given numbers.
Builder slots offer 2-4 choices; every wrong choice has a `why`.

## FRQs: the 6-point rubric style

Four types, one per exam question, 6 points each. One rubric line per point with accepted wordings; a full-credit
sample for every part; task verbs in bold (Find, Determine, Explain, Justify, Write, Rewrite, Solve, Give a reason).

| Type | Question, part | Points go to |
|---|---|---|
| `concepts` | Q1, calculator | a composite value showing the inner value; every input with f(x) = k from a graph or table; a calculator solve with every solution to three decimals; end or one-sided behaviour in limit notation; invertibility or a model type justified with specific values |
| `modeling` | Q2, calculator | the system from data and its constants (stored, not rounded); the average rate of change as a secant slope; an estimate on the secant line; over/under from concavity on the interval; the domain the context allows or why error grows |
| `periodic` | Q3, no calculator | coordinates of five labeled points; a, b, c, d of the sinusoid; the sign of the change on an interval; whether the rate of change is increasing or decreasing |
| `symbolic` | Q4, no calculator | exp and log equations solved exactly; a single log, base power or trig function; a trig equation with every solution in an interval; inverse trig in its range |

Typical split: one point for the answer, one for its work or reason. A reason point needs the reason with values,
not only the right conclusion. FRQ 2 for 2027 has a removed part B(iii) and an expanded part C; the point split is
not confirmed (needs-author `frq2-2027`): write 2-2-2 until it is.

## Contested or uncertain math

Add it to `docs/apprecalc-needs-author.md` instead of guessing. Every unit gets an independent accuracy check before
it is published, with every numeric and expression key recomputed by code.
