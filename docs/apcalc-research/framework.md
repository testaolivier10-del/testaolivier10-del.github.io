# AP Calculus AB framework research (as of 2026-10-13)

Purpose: source facts for building an online AP Calculus AB prep course on LevlPrep. Paraphrased; no exam questions
reproduced. AB and BC share one Course and Exam Description (CED); this file covers AB only and lists what is BC only so
we can leave it out.

Access note: shell egress to collegeboard.org is blocked (proxy 403), and Firecrawl had no credits, so College Board
PDFs were read through WebFetch text extraction. The CED extraction stops at about 112k characters, at the Unit 3
opener (framework page ~70). **Units 1 and 2 learning objectives, essential knowledge and the exclusion statement below
come from the CED text itself.** The Course at a Glance PDF would not load. For Units 3 to 8, topic names were confirmed
from two sources (partial CED extraction plus Fiveable's per-unit CED alignment lists, which agree), but the per-topic LO
and EK summaries come from knowledge of the CED, not from text read this session. They are marked **[CED, not
text-verified]** and a person should check them against the PDF, especially the LO/EK id numbers and whether any
exclusion statements exist in Units 3 to 8.

Key official URLs
- Course page: https://apcentral.collegeboard.org/courses/ap-calculus-ab
- Exam page: https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam
- CED (AB and BC, "Effective Fall 2020", current reprint carries a 2026 copyright):
  https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf
- CED clarifications and corrections (to be implemented fall 2026, includes the May 2027 MCQ change):
  https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications.pdf
  (also listed as .../ap-calculus-ab-bc-course-and-exam-description-clarifications-effective-fall-2026.pdf)
- Course at a Glance: https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-course-at-a-glance.pdf (did not load)
- Past exam questions: https://apcentral.collegeboard.org/courses/ap-calculus-ab/exam/past-exam-questions
- Chief Reader Reports: 2025 https://apcentral.collegeboard.org/media/pdf/ap25-cr-report-calculus-ab-bc.pdf ;
  2024 https://apcentral.collegeboard.org/media/pdf/ap24-cr-report-calculus.pdf ;
  2023 https://apcentral.collegeboard.org/media/pdf/ap23-cr-report-calculus.pdf
- Scoring guidelines: https://apcentral.collegeboard.org/media/pdf/ap25-sg-calculus-ab.pdf ,
  https://apcentral.collegeboard.org/media/pdf/ap26-sg-calculus-ab.pdf
- 2025 scoring statistics: https://apcentral.collegeboard.org/media/pdf/ap25-calculus-ab-scoring-statistics.pdf
- Score distributions: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-calculus-ab
- Calculator policy: https://apstudents.collegeboard.org/exam-policies-guidelines/calculator-policies
- Exam dates: https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates

---

## 1. What is current (no content change; exam timing change for 2027)

Sources: course page; exam page; clarifications PDF.
- The framework is the 2019 CED (first used 2019-20), reissued "Effective Fall 2020". No new framework announced for 2027
  or 2028. The course page says the 2026-27 clarifications are minor and "course content has not changed".
- 2026-27 clarifications that touch content (wording only):
  - EK FUN-1.C.1 (Topic 5.2) now reads: if f is continuous on [a, b], the Extreme Value Theorem guarantees at least one
    minimum value and at least one maximum value on [a, b].
  - EK FUN-7.B.2 (Topic 7.2) now reads: there may be infinitely many solutions to a differential equation.
  - Other edits: resource labels, "Reports" replaces the Progress Dashboard, the technology and graphing calculator
    sections were merged, an accessibility paragraph was added.
- **Exam change effective May 2027:** MCQ Part A 30 to 29 questions, 60 to 62 minutes; Part B 15 to 13 questions, 45 to
  38 minutes. FRQ section unchanged.
- **Unit weight ranges differ between versions [flag for a person].** The current course page and the current CED
  extraction show the wider ranges in section 2. Older copies of the CED as summarized by third parties show narrower
  ranges (10-12, 10-12, 9-13, 10-15, 15-18, 17-20, 6-12, 10-15%; https://cognito.org/blog/ap-calculus-ab-ced-breakdown).
  The clarifications PDF does not mention a weight change. Use the current official figures.

---

## 2. The 8 units (CED; course page)

| Unit | Title | MCQ weight (current) | Big ideas |
|---|---|---|---|
| 1 | Limits and Continuity | 10-15% | CHA, LIM, FUN |
| 2 | Differentiation: Definition and Fundamental Properties | 10-15% | CHA, LIM, FUN |
| 3 | Differentiation: Composite, Implicit, and Inverse Functions | 5-10% | FUN |
| 4 | Contextual Applications of Differentiation | 10-15% | CHA, LIM |
| 5 | Analytical Applications of Differentiation | 15-20% | FUN |
| 6 | Integration and Accumulation of Change | 15-20% | CHA, LIM, FUN |
| 7 | Differential Equations | 5-10% | FUN |
| 8 | Applications of Integration | 10-15% | CHA |

Big ideas (CED): CHA = Change (derivatives as rates; integrals as accumulation; the link between them), LIM = Limits
(start from a discrete model and take the limiting case), FUN = Analysis of Functions (behavior of functions via limits,
derivatives, integrals). The CED says the unit order is one possible sequence.
The big-idea column above is from knowledge of the CED [not text-verified].

### Topic lists (official names)

**Unit 1 Limits and Continuity (16):** 1.1 Introducing Calculus: Can Change Occur at an Instant?; 1.2 Defining Limits and
Using Limit Notation; 1.3 Estimating Limit Values from Graphs; 1.4 Estimating Limit Values from Tables; 1.5 Determining
Limits Using Algebraic Properties of Limits; 1.6 Determining Limits Using Algebraic Manipulation; 1.7 Selecting Procedures
for Determining Limits; 1.8 Determining Limits Using the Squeeze Theorem; 1.9 Connecting Multiple Representations of
Limits; 1.10 Exploring Types of Discontinuities; 1.11 Defining Continuity at a Point; 1.12 Confirming Continuity over an
Interval; 1.13 Removing Discontinuities; 1.14 Connecting Infinite Limits and Vertical Asymptotes; 1.15 Connecting Limits
at Infinity and Horizontal Asymptotes; 1.16 Working with the Intermediate Value Theorem (IVT).

**Unit 2 Differentiation: Definition and Fundamental Properties (10):** 2.1 Defining Average and Instantaneous Rates of
Change at a Point; 2.2 Defining the Derivative of a Function and Using Derivative Notation; 2.3 Estimating Derivatives of a
Function at a Point; 2.4 Connecting Differentiability and Continuity: Determining When Derivatives Do and Do Not Exist;
2.5 Applying the Power Rule; 2.6 Derivative Rules: Constant, Sum, Difference, and Constant Multiple; 2.7 Derivatives of
cos x, sin x, eˣ, and ln x; 2.8 The Product Rule; 2.9 The Quotient Rule; 2.10 Finding the Derivatives of Tangent,
Cotangent, Secant, and/or Cosecant Functions.

**Unit 3 Differentiation: Composite, Implicit, and Inverse Functions (6):** 3.1 The Chain Rule; 3.2 Implicit
Differentiation; 3.3 Differentiating Inverse Functions; 3.4 Differentiating Inverse Trigonometric Functions; 3.5 Selecting
Procedures for Calculating Derivatives; 3.6 Calculating Higher-Order Derivatives.
(3.1, 3.2, 3.4 names from https://fiveable.me/ap-calc/unit-3.md; the rest also in the CED extraction.)

**Unit 4 Contextual Applications of Differentiation (7):** 4.1 Interpreting the Meaning of the Derivative in Context;
4.2 Straight-Line Motion: Connecting Position, Velocity, and Acceleration; 4.3 Rates of Change in Applied Contexts Other
Than Motion; 4.4 Introduction to Related Rates; 4.5 Solving Related Rates Problems; 4.6 Approximating Values of a Function
Using Local Linearity and Linearization; 4.7 Using L'Hospital's Rule for Determining Limits of Indeterminate Forms.
(4.2, 4.4 from https://fiveable.me/ap-calc/unit-4.md.) **L'Hospital's rule is AB content.**

**Unit 5 Analytical Applications of Differentiation (12):** 5.1 Using the Mean Value Theorem; 5.2 Extreme Value Theorem,
Global Versus Local Extrema, and Critical Points; 5.3 Determining Intervals on Which a Function Is Increasing or
Decreasing; 5.4 Using the First Derivative Test to Determine Relative (Local) Extrema; 5.5 Using the Candidates Test to
Determine Absolute (Global) Extrema; 5.6 Determining Concavity of Functions over Their Domains; 5.7 Using the Second
Derivative Test to Determine Extrema; 5.8 Sketching Graphs of Functions and Their Derivatives; 5.9 Connecting a Function,
Its First Derivative, and Its Second Derivative; 5.10 Introduction to Optimization Problems; 5.11 Solving Optimization
Problems; 5.12 Exploring Behaviors of Implicit Relations. (5.10, 5.12 from https://fiveable.me/ap-calc/unit-5.md.)

**Unit 6 Integration and Accumulation of Change (14, of which 11 AB):** 6.1 Exploring Accumulations of Change;
6.2 Approximating Areas with Riemann Sums; 6.3 Riemann Sums, Summation Notation, and Definite Integral Notation; 6.4 The
Fundamental Theorem of Calculus and Accumulation Functions; 6.5 Interpreting the Behavior of Accumulation Functions
Involving Area; 6.6 Applying Properties of Definite Integrals; 6.7 The Fundamental Theorem of Calculus and Definite
Integrals; 6.8 Finding Antiderivatives and Indefinite Integrals: Basic Rules and Notation; 6.9 Integrating Using
Substitution; 6.10 Integrating Functions Using Long Division and Completing the Square; ~~6.11 Integrating Using
Integration by Parts~~ (BC ONLY); ~~6.12 Integrating Using Linear Partial Fractions~~ (BC ONLY); ~~6.13 Evaluating Improper
Integrals~~ (BC ONLY, marked in the CED extraction); 6.14 Selecting Techniques for Antidifferentiation (AB and BC; the BC
techniques inside it are BC only). (6.10-6.12 names from https://fiveable.me/ap-calc/unit-6.md.)

**Unit 7 Differential Equations (9, of which 7 AB):** 7.1 Modeling Situations with Differential Equations; 7.2 Verifying
Solutions for Differential Equations; 7.3 Sketching Slope Fields; 7.4 Reasoning Using Slope Fields; ~~7.5 Approximating
Solutions Using Euler's Method~~ (BC ONLY, marked in the CED extraction); 7.6 Finding General Solutions Using Separation of
Variables; 7.7 Finding Particular Solutions Using Initial Conditions and Separation of Variables; 7.8 Exponential Models
with Differential Equations; ~~7.9 Logistic Models with Differential Equations~~ (BC ONLY).
(7.1, 7.3, 7.8, 7.9 from https://fiveable.me/ap-calc/unit-7.md.)

**Unit 8 Applications of Integration (13, of which 12 AB):** 8.1 Finding the Average Value of a Function on an Interval;
8.2 Connecting Position, Velocity, and Acceleration of Functions Using Integrals; 8.3 Using Accumulation Functions and
Definite Integrals in Applied Contexts; 8.4 Finding the Area Between Curves Expressed as Functions of x; 8.5 Finding the
Area Between Curves Expressed as Functions of y; 8.6 Finding the Area Between Curves That Intersect at More Than Two
Points; 8.7 Volumes with Cross Sections: Squares and Rectangles; 8.8 Volumes with Cross Sections: Triangles and
Semicircles; 8.9 Volume with Disc Method: Revolving Around the x- or y-Axis; 8.10 Volume with Disc Method: Revolving Around
Other Axes; 8.11 Volume with Washer Method: Revolving Around the x- or y-Axis; 8.12 Volume with Washer Method: Revolving
Around Other Axes; ~~8.13 The Arc Length of a Smooth, Planar Curve and Distance Traveled~~ (BC ONLY).
(8.10, 8.11, 8.13 from https://fiveable.me/ap-calc/unit-8.md.)

**Units 9 and 10 are BC only in full** (Parametric Equations, Polar Coordinates, and Vector-Valued Functions; Infinite
Sequences and Series).

**AB topic count:** 16 + 10 + 6 + 7 + 12 + 11 + 7 + 12 = **81 topics**. BC-only topics inside Units 1-8: 6.11, 6.12,
6.13, 7.5, 7.9, 8.13 (six), plus BC-only techniques within 6.14.

---

## 3. Per-topic learning objectives, essential knowledge, exclusions

Format: LO ids with a short paraphrase; key EK points; **Boundary** = exclusion or limit statements. "None" = none seen.

### Unit 1 Limits and Continuity (from CED text)
- **1.1** CHA-1.A interpret an instantaneous rate as the limit of average rates over shrinking intervals; an average rate
  is undefined over a zero-length interval; limits make "change at an instant" precise. Boundary: none.
- **1.2** LIM-1.A write limits in correct notation; LIM-1.B interpret limit notation; a limit can be shown graphically,
  numerically, analytically. **Boundary (verbatim core): "The epsilon-delta definition of a limit is not assessed on the
  AP Calculus AB or BC Exam."** Teachers may include it if time permits.
- **1.3** LIM-1.C estimate limits: one-sided limits; reading limits from graphs; scale can hide behavior; a limit may
  fail to exist because of unbounded behavior, oscillation, or unequal one-sided limits. Boundary: none.
- **1.4** LIM-1.C.5 estimate limits from tables. Boundary: none.
- **1.5** LIM-1.D one-sided limits analytically or graphically; limit laws for sums, differences, products, quotients,
  compositions. Boundary: none.
- **1.6** LIM-1.E.1 rewrite into equivalent forms (factor, rationalize, simplify) before evaluating. Boundary: none.
- **1.7** No new LO; skill 1.C (choose the right procedure). Boundary: none.
- **1.8** LIM-1.E.2 squeeze theorem. Boundary: none.
- **1.9** No new LO; skill 2.C (move between graph, table, expression). Boundary: none.
- **1.10** LIM-2.A justify continuity conclusions from the definition; discontinuity types: removable, jump, vertical
  asymptote. Boundary: none.
- **1.11** LIM-2.A.2 continuous at c when f(c) exists, the limit exists, and they are equal (three-part check).
- **1.12** LIM-2.B continuous on an interval = continuous at each point; polynomial, rational, power, exponential, log,
  trig functions are continuous on their domains.
- **1.13** LIM-2.C choose a value or parameter to make a function continuous: redefine a removable point to equal the
  limit; for piecewise functions, both pieces and the value must agree at the boundary.
- **1.14** LIM-2.D.1-2 infinite limits; vertical asymptotes described with limits.
- **1.15** LIM-2.D.3-5 limits at infinity give end behavior (horizontal asymptotes); compare relative growth of functions
  with limits.
- **1.16** FUN-1.A IVT: f continuous on [a, b] and d between f(a) and f(b) gives some c in (a, b) with f(c) = d.
  Boundary: none (justification must state continuity on the closed interval; see section 8).

### Unit 2 Differentiation: Definition and Fundamental Properties (from CED text)
- **2.1** CHA-2.A average rate of change as a difference quotient; CHA-2.B instantaneous rate at a point as the limit
  of a difference quotient, written f′(a).
- **2.2** CHA-2.B.2-4 the derivative function; notations dy/dx, f′(x), y′; representations graphical, numerical,
  analytical, verbal. CHA-2.C tangent line equation: derivative at a point = slope of the tangent line.
- **2.3** CHA-2.D estimate derivatives at a point from tables or graphs; technology can compute or estimate them.
- **2.4** FUN-2.A differentiable implies continuous; continuous does not imply differentiable (corners, cusps, vertical
  tangents).
- **2.5** FUN-3.A.1 power rule for x^r.
- **2.6** FUN-3.A.2-3 sum, difference, constant multiple rules; differentiate polynomials.
- **2.7** FUN-3.A.4 derivatives of sin, cos, eˣ, ln x. LIM-3.A recognize a limit as a derivative definition and evaluate
  it that way (e.g. a difference quotient limit that is f′(a) for a known f).
- **2.8** FUN-3.B.1 product rule. **2.9** FUN-3.B.2 quotient rule.
- **2.10** FUN-3.B.3 tan, cot, sec, csc derivatives by rewriting with identities and using rules.
Boundary: none seen in Unit 2.

### Unit 3 Differentiation: Composite, Implicit, and Inverse Functions [CED, not text-verified]
- **3.1** FUN-3.C chain rule for compositions.
- **3.2** FUN-3.D implicit differentiation (chain rule applied to y terms); dy/dx may depend on both x and y.
- **3.3** FUN-3.E.1 derivative of an inverse function: (f⁻¹)′(a) = 1 / f′(f⁻¹(a)); uses tables/graphs of f.
- **3.4** FUN-3.E.2 derivatives of inverse trig functions (arcsin, arccos, arctan and the others).
- **3.5** No new LO; skill 1.C, choose among product/quotient/chain/implicit/inverse rules.
- **3.6** FUN-3.F second and higher derivatives; notation f″, d²y/dx², y⁽ⁿ⁾; second derivatives of implicit relations.
Boundary: none known.

### Unit 4 Contextual Applications of Differentiation [CED, not text-verified]
- **4.1** CHA-3.A interpret the derivative in context with units (units of output per unit of input).
- **4.2** CHA-3.B straight-line motion: v = x′, a = v′ = x″; speed; speeding up when v and a share a sign, slowing down when
  they differ (taught here and tested every year in FRQs).
- **4.3** CHA-3.C rates of change in non-motion contexts (population, temperature, volume, etc.).
- **4.4** CHA-3.D related rates: use the chain rule to differentiate a relation with respect to time.
- **4.5** CHA-3.E solve and interpret related rates (geometry relations; substitute values only after differentiating).
- **4.6** CHA-3.F tangent line approximation (local linearity); whether the approximation over- or under-estimates follows
  from concavity.
- **4.7** LIM-4.A indeterminate forms 0/0 and ∞/∞; L'Hospital's rule. CR reports expect students to show that numerator and
  denominator limits are both 0 (or both infinite) before applying it.
Boundary: none known. Other indeterminate forms (0·∞, 1^∞, ∞ - ∞) are not named in the AB topics.

### Unit 5 Analytical Applications of Differentiation [CED, not text-verified except the clarified EK]
- **5.1** FUN-1.B MVT: f continuous on [a, b] and differentiable on (a, b) gives c with f′(c) equal to the average rate of
  change. Justification must check both hypotheses.
- **5.2** FUN-1.C EVT (2026 wording above); global extrema occur at critical points or endpoints; critical point =
  interior point where f′ = 0 or f′ is undefined.
- **5.3** FUN-4.A f increasing where f′ > 0, decreasing where f′ < 0.
- **5.4** FUN-4.A first derivative test: relative extremum where f′ changes sign (not merely where f′ = 0).
- **5.5** FUN-4.A candidates test: compare f at critical points and endpoints on a closed interval.
- **5.6** FUN-4.A concave up where f′ is increasing (f″ > 0), down where f′ is decreasing (f″ < 0); point of inflection
  where f″ changes sign (equivalently f′ changes from increasing to decreasing or back).
- **5.7** FUN-4.A second derivative test; if a continuous function has exactly one critical point on an interval and it
  is a relative extremum, it is also the absolute extremum there.
- **5.8** FUN-4.A sketch f, f′, f″ from one another; key features from the derivative.
- **5.9** FUN-4.A connect features of f, f′, f″ in any representation (graph of f′ is the classic FRQ).
- **5.10, 5.11** FUN-4.B optimization in applied contexts: model, find critical points, justify the absolute extremum.
- **5.12** FUN-4.C/4.D critical points and behavior of implicit relations: horizontal tangent where dy/dx = 0 (numerator
  zero, point on curve), vertical tangent where the denominator is zero and the numerator is not.
Boundary: none known.

### Unit 6 Integration and Accumulation of Change [CED, not text-verified]
- **6.1** CHA-4.A area under a rate-of-change graph = accumulated change; units are rate units times input units.
- **6.2** LIM-5.A left, right, midpoint Riemann sums and trapezoidal sums from graphs, tables, or formulas, **with uniform
  or nonuniform partitions** (tables usually have unequal widths); for increasing or decreasing f, say whether left/right
  sums over- or under-estimate.
- **6.3** LIM-5.B/5.C the definite integral as the limit of Riemann sums; sigma notation; translate between a limit of a sum
  and a definite integral.
- **6.4** FUN-5.A accumulation functions; FTC part 1: d/dx ∫ₐˣ f(t) dt = f(x); with a function upper limit, use the chain
  rule.
- **6.5** FUN-5.A interpret g(x) = ∫ₐˣ f(t) dt from the graph of f: g increasing where f > 0, extrema where f changes sign,
  concavity from whether f is increasing or decreasing.
- **6.6** FUN-6.A properties: reversing limits, ∫ₐᵃ = 0, additivity over adjacent intervals, linearity; integrals from
  geometry (areas of triangles, semicircles); functions with removable or jump discontinuities can be integrated.
- **6.7** FUN-6.B FTC part 2: ∫ₐᵇ f(x) dx = F(b) - F(a); net change ∫ₐᵇ f′(x) dx = f(b) - f(a).
- **6.8** FUN-6.C antiderivatives from known derivatives; indefinite integral notation with + C; some functions have no
  closed-form antiderivative.
- **6.9** FUN-6.D u-substitution, including changing the limits of a definite integral.
- **6.10** FUN-6.D rewriting before integrating: long division of rational functions, completing the square (arctan
  forms).
- **6.14** choosing a technique among those above (AB scope: basic rules, substitution, rewriting).
BC only, excluded: 6.11 integration by parts, 6.12 linear partial fractions, 6.13 improper integrals.
Boundary: none known for AB topics.

### Unit 7 Differential Equations [CED, not text-verified except the clarified EK]
- **7.1** FUN-7.A turn a verbal statement ("rate of change is proportional to ...") into a differential equation.
- **7.2** FUN-7.B verify a proposed solution by differentiating and substituting; a DE may have infinitely many solutions
  (2026 wording).
- **7.3** FUN-7.C sketch slope fields at given points.
- **7.4** FUN-7.C reason from slope fields: sketch the solution through a point, match DEs to fields, reason about
  equilibrium and behavior.
- **7.6** FUN-7.D general solutions by separation of variables.
- **7.7** FUN-7.E particular solutions from an initial condition; solutions may have domain restrictions.
- **7.8** FUN-7.F exponential models: dy/dt = ky gives y = y₀e^(kt); interpret k and the model in context.
BC only, excluded: 7.5 Euler's method, 7.9 logistic models.
Boundary: none known. Only separable DEs are solved analytically in AB.

### Unit 8 Applications of Integration [CED, not text-verified]
- **8.1** CHA-4.B average value: (1/(b - a)) ∫ₐᵇ f(x) dx (the integrand is f itself; 2025 CR report flags using f′).
- **8.2** CHA-4.C motion with integrals: displacement = ∫ v dt; total distance = ∫ |v| dt; position from x(t₀) plus the
  integral of v.
- **8.3** CHA-4.D/4.E accumulation in context: amount = initial amount + ∫ of (rate in - rate out); interpret integrals
  with units and interval.
- **8.4-8.6** CHA-5.A area between curves as functions of x or of y; split at intersections when curves cross more than
  once.
- **8.7-8.8** CHA-5.B volumes with known cross sections (squares, rectangles, equilateral and right triangles,
  semicircles).
- **8.9-8.12** CHA-5.C solids of revolution with discs and washers about the axes and about other horizontal or vertical
  lines; radii must be measured from the axis of rotation.
BC only, excluded: 8.13 arc length.
Boundary: none known. **The shell method is not a CED topic** (no topic covers it; students and teachers on Reddit say it
is not tested, e.g. https://redlib.hackliberty.org/r/apcalculus/comments/1br06qu/shell_method_on_bc ). An exclusion
statement for it was not found in the text read.

### Exclusions checklist (what the course must NOT teach as assessed AB content)
Epsilon-delta proofs (1.2, verified); integration by parts; partial fractions; improper integrals; Euler's method;
logistic DEs; arc length; shell method (not in CED); parametric, polar, vector-valued functions; sequences and series;
non-separable DEs. Any additional exclusion statements in Units 3-8 could not be read and need a person to check the PDF.

---

## 4. Mathematical practices

Source: CED extraction (practice and skill names); course page (weights).

| # | Practice | Skills |
|---|---|---|
| 1 | Implementing Mathematical Processes | 1.A identify the question (not assessed); 1.B identify key information (not assessed); 1.C choose a rule/procedure from the form of an expression; 1.D choose a rule/procedure from relationships between concepts; 1.E apply rules or procedures, with and without technology; 1.F explain how an approximation relates to the actual value |
| 2 | Connecting Representations | 2.A common structure across contexts; 2.B read information from graphs, tables, formulas, words; 2.C re-express information in another representation; 2.D relate function properties across representations; 2.E describe relationships among representations of a function and its derivatives |
| 3 | Justification | 3.A use technology to form conjectures (not assessed); 3.B pick the right definition/theorem/test; 3.C confirm its hypotheses or conditions hold; 3.D apply it; 3.E give reasons for solutions and conclusions; 3.F explain meaning in context; 3.G confirm a solution is accurate and appropriate |
| 4 | Communication and Notation | 4.A precise mathematical language; 4.B units of measure; 4.C symbols and notation; 4.D graphing techniques; 4.E rounding procedures |

Exam weighting (current course page, verbatim ranges):

| Practice | MCQ | FRQ |
|---|---|---|
| 1 Determine expressions and values using procedures and rules | 50-70% | 35-60% |
| 2 Translate information across representations | 15-30% | 10-20% |
| 3 Justify reasoning and solutions | 10-20% | 35-60% |
| 4 Use correct notation, language, conventions | not assessed in MCQ | 10-25% |

Takeaway: MCQ is mostly procedures; FRQ points split roughly evenly between procedures and justification, and
notation/units are FRQ-only points.

---

## 5. Exam format

Sources: exam page; clarifications PDF; mathmedic digital-exam post (third party,
https://mathmedic.com/blog/all-the-details-about-the-digital-ap-exam-experience-calc-precalc/).

| | 2025 and 2026 exams | **May 2027 exam** |
|---|---|---|
| Section I Part A (no calculator) | 30 MCQ, 60 min | **29 MCQ, 62 min** |
| Section I Part B (graphing calculator required) | 15 MCQ, 45 min | **13 MCQ, 38 min** |
| Section I total | 45 MCQ, 105 min, 50% | **42 MCQ, 100 min, 50%** |
| Section II Part A (graphing calculator required) | 2 FRQ, 30 min | 2 FRQ, 30 min |
| Section II Part B (no calculator) | 4 FRQ, 60 min | 4 FRQ, 60 min |
| Section II total | 6 FRQ, 90 min, 50% | 6 FRQ, 90 min, 50% |
| Exam total | 3 h 15 min | **3 h 10 min** (plus break) |

- **Hybrid digital (since May 2025):** MCQs answered in Bluebook; FRQs read in Bluebook but **handwritten** in a paper
  booklet that is returned for scoring. Bluebook tools: mark for review, highlight/notes, answer eliminator, line reader.
- **MCQ:** single-select, 4 choices; algebraic, exponential, log, trig and general functions in analytical, graphical,
  tabular, verbal forms; no penalty for wrong answers.
- **FRQ:** about equal mix of procedural and conceptual tasks; at least 2 questions in a real-world context. Each of the 6
  FRQs is worth **9 points (54 total)** (2025 scoring statistics and 2026 scoring guidelines both show 9 per question).
- Historical composite (2025-26 format): 45 MCQ scaled to 54 + 54 FRQ = 108
  (https://collegeprep.uworld.com/ap/ap-calculus-ab/scores-and-calculator/ ; third party). How the 42-item MCQ is scaled
  in 2027 is not published.
- Whether students may return to FRQ Part A during Part B without a calculator (allowed on the paper exam) was not
  confirmed for the hybrid format.

### Calculator policy
- Graphing calculator required for MCQ Part B and FRQ Part A; not permitted in the other two parts. Students may use
  Bluebook's built-in Desmos graphing calculator plus up to 2 approved handheld graphing calculators (only approved models;
  only the Bluebook Desmos, not web or app Desmos). Source: calculator policy page.
- **Four required capabilities (CED wording):** plot the graph of a function within an arbitrary viewing window; find the
  zeros of functions (solve equations numerically); numerically calculate the derivative of a function; numerically
  calculate the value of a definite integral.
- **Answer rules (CED):** when a result comes from one of these four capabilities, students must write the setup (the
  equation, derivative, or integral) not just the number; using other built-in features or programs requires showing the
  mathematical steps. Calculator syntax is not accepted as a setup (long-standing scoring practice; the general scoring
  notes below confirm "bald" answers lose setup points). Decimal answers must be correct to three places after the decimal
  point (round or truncate); at most one point per question is lost for rounding. Radian mode.

### FRQ types (what recurs, 2023-2026 AB)

| Type | Usually in | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|
| Rate in context from a **table** (difference quotient with units, Riemann/trapezoid sum, interpret integral, IVT/MVT, model function) | Q1 (calc) or Part B | AB1 gas pump | AB1 coffee temp | AB3 reading rate (no calc) | Q1 bird arrivals |
| Modeling with a given function (average value, average rate, limits, absolute max) | Q1 (calc) | | | AB1 invasive species | |
| **Particle motion** (velocity/acceleration, speeding up, direction changes, position from initial value, total distance) | calc Q2 or Part B | AB2 swimmer (calc) | AB2 (calc) | AB5 (no calc) | Q5 toy car (no calc) |
| **Area and volume** (area between curves, cross sections, disc/washer about a line) | calc Q2 or Part B | | AB6 (no calc) | AB2 (calc) | Q2 (calc) |
| **Differential equation with slope field** (sketch solution curve, tangent line approx and over/under, concavity via chain rule, separation of variables) | Part B | AB3 milk warming | AB3 seawater | | Q3 cooling pie |
| **Graph of f′ or graphical FTC** (g(x) = ∫ f, extrema, inflection, candidates test, values from geometry) | Part B | AB4 graph of f′ (+ L'Hospital) | AB4 graphical FTC | AB4 graphical FTC | Q4 graph of f′ |
| **Implicit differentiation / related rates** (verify dy/dx, horizontal/vertical tangents, tangent line, dy/dt) | Part B | AB6 | AB5 | AB6 | |
| Table of f, g, f′, g′ (chain/product rule, limits, FTC with composite, accumulation) | Part B | AB5 | | | Q6 |

Sources: 2023, 2024, 2025 Chief Reader Reports; 2026 scoring guidelines.

### General scoring notes (2026 scoring guidelines)
- Three-decimal accuracy; at most one rounding point lost per question.
- Answers need not be simplified, but a simplification error can cost a point.
- A "bald" answer (no supporting work) usually earns only the answer point, not setup/method points.
- Justifications must refer to the given graph, table, or function by name; "the slope changes sign" without saying
  which function earns nothing.
- Ambiguous or unmatched expressions do not bank points.
- Units are scored only where the question asks for them.
- Interpretations of integrals must name the quantity, units, and the time interval.

---

## 6. Exam date

- **2027:** **Monday, May 10, 2027, Session 1 (morning)**, Calculus AB and Calculus BC together. The 2027 window is May 3-7
  and May 10-14. (https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates ; exam page.)
- Pattern: calculus lands on Monday of week 2 (2025 was also Monday May 12, per a dated r/apcalculus exam-day thread:
  https://redlib.hackliberty.org/r/apcalculus/comments/1kl0sas/i_took_bc_how_was_the_ab_test). Students cram through
  early May; late testing dates are on a separate CB page (not checked).

---

## 7. Score distributions

Source: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-calculus-ab

| Year | 5 | 4 | 3 | 2 | 1 | 3+ | Takers | Mean |
|---|---|---|---|---|---|---|---|---|
| 2026 | 20% | 28% | 17% | 24% | 11% | 65% | n/a | n/a |
| 2025 | 20.3% | 28.9% | 15.0% | 22.8% | 13.0% | 64.2% | 285,891 | 3.21 |
| 2024 | 21.4% | 27.8% | 15.3% | 22.7% | 12.9% | 64.4% | 278,657 | 3.22 |
| 2023 | 22.4% | 16.2% | 19.4% | 21.7% | 20.3% | 58.0% | 273,987 | 2.99 |
| 2022 | 20.4% | 16.1% | 19.1% | 22.6% | 21.7% | 55.6% | 268,352 | 2.91 |
| 2021 | 17.6% | 14.1% | 19.3% | 25.3% | 23.7% | 51.0% | 251,639 | 2.77 |
| 2020 | 19.5% | 20.9% | 21.0% | 24.1% | 14.5% | 61.4% | 266,430 | 3.07 |
| 2019 | 19.1% | 18.7% | 20.6% | 23.3% | 18.3% | 58.4% | 300,659 | 2.97 |
| 2018 | 19.4% | 17.3% | 21.0% | 22.4% | 20.0% | 57.6% | 308,538 | 2.94 |
| 2017 | 18.7% | 18.0% | 20.8% | 22.0% | 20.4% | 57.5% | 316,099 | 2.93 |
| 2016 | 24.8% | 17.3% | 17.4% | 9.7% | 30.7% | 59.5% | 308,215 | 2.96 |
| 2015 | 21.8% | 17.0% | 18.6% | 10.3% | 32.3% | 57.4% | 302,532 | 2.86 |

(2026 is preliminary and rounded. 2020 was the shortened online exam. Older years back to 2002 are on the same page.)
Story: ~280-290k takers a year, about 1.6 times AP Physics 1. Pass rate
jumped from ~58% to ~64% in 2024, mostly by moving students from 5/3 into 4 (4s went from ~16% to ~28%), consistent with
CB's move to evidence-based standard setting. 1s fell to ~11-13%. The 2025 BC exam gave an AB subscore to ~161k
students (mean 4.11), per the 2025 CR report.

**Cut scores:** College Board does not publish raw-to-AP conversions for current exams; UWorld says the conversion is
confidential (https://collegeprep.uworld.com/ap/ap-calculus-ab/scores-and-calculator/). Third-party calculators are
estimates; do not present any cut table as official. 2027 composite scaling with 42 MCQs is unknown.

FRQ means (out of 9):
- 2025 (https://apcentral.collegeboard.org/media/pdf/ap25-calculus-ab-scoring-statistics.pdf): Q1 3.26, Q2 4.06,
  Q3 4.82, Q4 3.91, Q5 3.60, Q6 4.12.
- 2024 (CR report): Q1 4.71, Q2 4.24, Q3 3.55, Q4 3.86, Q5 3.14, Q6 3.59.
- 2023 (CR report): Q1 3.79, Q2 4.62, Q3 **2.07** (DE/slope field, lowest), Q4 2.70, Q5 4.46, Q6 2.77.
- No 2026 statistics or CR report posted yet (only FRQs and scoring guidelines).

---

## 8. Common student errors (Chief Reader Reports 2023-2025)

### Cross-year themes (all three reports)
1. **Communication and notation are the biggest point losers.** Linkage errors (writing "=" between unequal things, e.g.
   h′(7) = ... chained to h(7), or "0/0 = 3"), mixing dy, dy/dx, dy/dt, y′, dropping "= 0" after differentiating an
   implicit equation, d/dx on one side only, missing dx, missing parentheses when substituting expressions for f and g.
2. **Vague references:** "it", "the graph", "the slope", "the function" instead of naming f, f′, g′, or the context
   quantity. Justifications must name which function changes sign.
3. **Theorem hypotheses not checked:** IVT and MVT used without stating continuity on [a, b] (and differentiability on
   (a, b) for MVT), or asserting continuity with no reason ("differentiable implies continuous" must be said); using EVT
   or MVT where IVT is needed; L'Hospital applied without first showing both limits are 0 (or both infinite).
4. **Local vs global arguments:** absolute extrema justified with a sign change (local) instead of a candidates test or a
   global argument; candidates test missing endpoints or critical points.
5. **Sign charts alone do not justify.** They must be explained in words tied to f′ (2025 AB4).
6. **Calculator work:** missing setups (bald numbers), wrong rounding (fewer than three decimals), using TRACE instead of
   a solver, trying CAS antiderivatives instead of numeric integration; radian mode.
7. **Units:** "degrees per minute" vs "degrees per minute per minute"; integral of a rate has the accumulated unit, not a
   rate unit.
8. **Reading the question:** net vs total distance, speed vs velocity, which interval, which variable.
9. **Algebra and precalculus:** product rule with three factors, chain rule on e^u and ln y, log/exponential simplification,
   factoring with non-unit leading coefficient, end behavior. Simplifying unnecessarily introduces errors.

### By FRQ type (concrete)
- **Table/rate (2023 AB1, 2024 AB1, 2025 AB3, 2026 Q1):** a difference quotient boxed as the function value instead of the
  rate; using an interval that does not straddle the point; reversed subtraction; Riemann sum using a common width when
  table widths differ, left instead of right, or products put inside an integral sign; listing numbers without the sum
  form; weak interpretations (must name the quantity, units, and interval); trapezoid formula errors; integrating the model
  outside its stated domain; for "increasing or decreasing rate", deciding from the wrong derivative.
- **Particle motion (2023 AB2, 2024 AB2, 2025 AB5):** claiming a direction change because v = 0 without a sign change;
  "slowing down because a < 0" without comparing with the sign of v; displacement given as total distance; ignoring the
  initial position (integrating from 0 instead of from the given time); product/chain rule slips on (t² - 4)e^(t - 4);
  checking only integer times for zeros of v; not splitting at zeros of v for total distance without a calculator.
- **Area/volume (2024 AB6, 2025 AB2):** squaring (g - f) for an area; dropping parentheses when substituting; for square
  cross sections, forgetting to square or adding a third factor; revolving about y = 0 instead of the given line; radii
  written as 20² - g² or (20 - g)² wrongly, inner/outer swapped; radii not defined; **missing π** or dx; indefinite
  integral instead of definite.
- **Slope field / DE (2023 AB3, 2024 AB3, 2026 Q3):** solution curve not extended across the field, crossing an
  equilibrium line, or drawn through (5, 0) instead of (0, 5); tangent line built at the wrong point; second derivative
  without the chain rule (d²M/dt² must be in terms of M); separation errors (constants or variables on the wrong side),
  antiderivative of 1/(M - 40) sign errors, missing + C, solving for the dependent variable before using the initial
  condition, substituting the initial condition the wrong way round; critical point justified with "H goes from
  increasing to decreasing" instead of "dH/dt changes sign"; answering t = 3.14 instead of π.
- **Graph of f′ / graphical FTC (2023 AB4, 2024 AB4, 2025 AB4):** g′(x) = f(x) - f(a) (mishandled lower limit); sign of
  g(-6) when limits are reversed; using the wrong lower limit; f′ = g instead of g′ = f; inflection points from zeros of
  f′ instead of where f changes from increasing to decreasing; forgetting to halve a semicircle area; "f″ < 0" not tied to
  "f′ is decreasing" on the graph; including an endpoint as an inflection point.
- **Implicit / related rates (2023 AB6, 2024 AB5, 2025 AB6):** dy/dx = 0 used for a vertical tangent (must be denominator
  = 0 with numerator not 0, and the point must be on the curve); not substituting back into the curve; differentiating with
  respect to x instead of t; "decreasing" rate entered as positive; product rule on 6xy or 2xy missed; solving for y
  explicitly and then misusing the quotient rule.
- **Table of f, g, derivatives (2023 AB5, 2026 Q6):** chain/product rule combinations; k″ via only one rule; accumulation
  function derivative given as just the integrand without the chain factor; writing m(x) equal to a number.
- **Accumulation with initial condition:** amount = initial value + integral; students drop the initial value or use the
  wrong lower limit (2024 AB2c, 2025 AB5d, 2026 Q6c).

### CR advice worth building into the course
- Teach task verbs and model full-sentence justifications that name the function and the interval.
- Make students state and check hypotheses before using IVT/MVT/EVT/L'Hospital.
- Use named functions (f, g, A) in setups instead of retyping expressions.
- Vary lower limits of accumulation functions, including ones greater than the upper limit.
- Have students classify separations as correct, poor, or not separated; apply the initial condition as soon as C appears.
- Show implicit curves graphically so students see where tangents are horizontal or vertical.
- Use hands-on activities or simulations for rotation and cross sections (2024 AB6 advice).
- Error analysis of sample responses (CED pages referenced: 206, 208, 212, 219, 220).
