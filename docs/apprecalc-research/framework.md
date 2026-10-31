# AP Precalculus framework research (as of 2026-10-31)

Purpose: source facts for building an online AP Precalculus course on LevlPrep, targeting the May 2027 exam.
Paraphrased; no exam questions or CED text reproduced. **Course content did not change for 2026-27; the exam
did.** The CED is reissued "Effective Fall 2026" with a Clarifications and Corrections PDF that rewords about 40
essential knowledge (EK) statements, adds one exclusion statement, and changes the exam: 42 MCQ instead of 40, new
section timing (MCQ Part A 80 to 65 min; both FRQ parts 30 to 35 min) and a restructured FRQ 2 (section 1).

Access note: shell egress to collegeboard.org is blocked (proxy 403) and Firecrawl had no credits, so pages were
read through WebFetch text extraction. The CED PDF extraction stops at about 107k characters, at Topic 2.1 (CED page
~55), so **Unit 1 LO/EK and the one Unit 1 exclusion come from the CED text itself**; the CED pages for Topics 2.2 to
4.14, the Exam Information section and the CED sample questions were not read directly. **All 58 topic titles are
confirmed official** from the Course at a Glance PDF. Unit 2 and 3 EK summaries below combine the official
clarifications PDF (which restates many Unit 2-3 EKs, marked **[CC]**) with third-party topic summaries (Fiveable,
Test Ninjas; marked **[3P]**). Verify Units 2-3 LO codes against the CED before publishing.

Key official URLs
- Course page (units, weights, assessed or not): https://apcentral.collegeboard.org/courses/ap-precalculus/course
- Exam page (2027 format, FRQ types, calculator by part): https://apcentral.collegeboard.org/courses/ap-precalculus/exam
- Student exam page (date, radian mode, 6 points per FRQ): https://apstudents.collegeboard.org/courses/ap-precalculus/assessment
- Student exam tips: https://apstudents.collegeboard.org/courses/ap-precalculus/exam-tips
- CED (cover "Effective Fall 2026"): https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf
- CED clarifications and corrections (2026-27; exam changes on the last page):
  https://apcentral.collegeboard.org/media/pdf/ap-precalculus-ced-clarification-and-guidance.pdf
  (also served as .../ap-precalculus-ced-clarification-and-guidance-effective-fall-2026.pdf, same content)
- Course at a Glance (all topic titles): https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-at-a-glance.pdf
- Course overview (updated July 2026; prerequisites, format): https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-overview.pdf
- Graphing calculator page: https://apcentral.collegeboard.org/courses/ap-precalculus/exam/graphing-calculators
- Calculator policy: https://apstudents.collegeboard.org/exam-policies-guidelines/calculator-policies
- Past exam questions (2024-2026): https://apcentral.collegeboard.org/courses/ap-precalculus/exam/past-exam-questions
- Chief Reader Reports: 2025 https://apcentral.collegeboard.org/media/pdf/ap25-cr-report-precalculus.pdf ;
  2024 https://apcentral.collegeboard.org/media/pdf/ap24-cr-report-precalculus.pdf (no 2026 report posted yet)
- Scoring guidelines: https://apcentral.collegeboard.org/media/pdf/ap24-sg-precalculus.pdf ,
  https://apcentral.collegeboard.org/media/pdf/ap25-sg-precalculus.pdf , https://apcentral.collegeboard.org/media/pdf/ap26-sg-precalculus.pdf
- 2026 FRQs (directions page read): https://apcentral.collegeboard.org/media/pdf/ap26-frq-precalculus.pdf
- Scoring statistics: https://apcentral.collegeboard.org/media/pdf/ap24-precalculus-scoring-statistics.pdf ,
  https://apcentral.collegeboard.org/media/pdf/ap25-precalculus-scoring-statistics.pdf
- Score distributions: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-precalculus
- Exam dates and start times: https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates

---

## 1. What changed for 2026-27 (content no; exam yes)

Sources: course page; exam page; clarifications PDF.
- Course and exam pages: the CED "has been updated to include minor clarifications for the 2026-27 school year";
  "Course content has not changed". The MCQ count, FRQs 1 and 2 and section timing change **effective May 2027**.
- **Exam overview changes (clarifications PDF, official):**

| Part | Before (2024-2026 exams) | May 2027 |
|---|---|---|
| Section I Part A (no calc) | 28 MCQ, 80 min | **29 MCQ, 65 min** |
| Section I Part B (calc) | 12 MCQ, 40 min | **13 MCQ, 40 min** |
| Section II Part A (calc, FRQ 1-2) | 2 FRQ, 30 min | **2 FRQ, 35 min** |
| Section II Part B (no calc, FRQ 3-4) | 2 FRQ, 30 min | **2 FRQ, 35 min** |
| Total | 40 MCQ + 4 FRQ, 3 h 00 | 42 MCQ + 4 FRQ, **2 h 55** |

  Old values confirmed by the 2026 FRQ booklet (30 min per FRQ part) and Break the Test's summary
  (https://breakthetest.app/blog/ap-precalculus-2027-what-is-assessed/, [3P]). Section weights stay 62.5% / 37.5%.
- **FRQ changes (clarifications PDF, sample FRQ section):** Q2 sample: Part B(iii) removed; Part C modified "to
  expand the scope"; scoring guidelines for B(iii) and C updated. Q1 sample: minor change to C(i), scoring
  unchanged. Q2 had six 1-point parts in 2024-2026 (A(i), A(ii), B(i), B(ii), B(iii), C). **Inference, not
  confirmed:** with B(iii) gone and still 6 points, the new Part C is probably worth 2 points. The hybrid sample
  booklet shows Q2 as A(i), A(ii), B(i), B(ii), then a Part C page labelled "iii"
  (https://apcentral.collegeboard.org/media/pdf/ap-precalculus-hybrid-sample-free-response-booklet.pdf). The CED
  sample Q2 and its updated scoring were not readable. **Flag for a person.** Note B(iii) (explain the secant
  estimate vs the model using concavity) was the part students failed most (means 0.04 in 2024), so this concavity
  reasoning may move into Part C rather than disappear.
- **EK wording changes (all official, clarifications PDF):** 1.1.A.1-2 (function, domain, range, image/preimage),
  1.3.A.3, 1.4.A.1/2/4, 1.12.A.5; 2.1.B.1-3, 2.2.A.3-4, 2.2.B.1, 2.3.A.4, 2.5.B.3, 2.6.B.1-2 (residuals), 2.7.A.4,
  2.13.B.1-2, 2.14.A.6, 2.15.A.1-2; 3.2.A.2, 3.4.A.2/4, 3.6.A.1, 3.7.A.5, 3.13.A.1, 3.14.A.3, 3.15.A.1/2/4. Each is
  summarized under its topic in section 3. **New exclusion:** open vs closed endpoints of increasing/decreasing
  intervals (1.1.A.3-4).
- **Unit 2 weight [flag].** Current official range is 25-40% (course page, student tips page, CaaG). Some older
  third-party summaries quote 27-40%; use the official figure.

---

## 2. Units, weights and topics

Course page and CaaG (official). Weights are for the MCQ section.

| Unit | Title | MCQ weight | Topics | Assessed? | Pacing (CaaG) |
|---|---|---|---|---|---|
| 1 | Polynomial and Rational Functions | 30-40% | 14 | Yes | ~6-8 weeks |
| 2 | Exponential and Logarithmic Functions | 25-40% | 15 | Yes | ~6-9 weeks |
| 3 | Trigonometric and Polar Functions | 30-35% | 15 | Yes | ~7-10 weeks |
| 4 | Functions Involving Parameters, Vectors, and Matrices | 0% | 14 | **No** | ~7 weeks |

58 topics; **44 assessed (Units 1-3)**. Unit 4 is "not assessed on the AP Exam"; schools may teach it for state or
local requirements or as calculus/college preparation (course overview PDF). The CaaG marks no single topic in Units
1-3 as unassessed.

**Unit 1 (14):** 1.1 Change in Tandem; 1.2 Rates of Change; 1.3 Rates of Change in Linear and Quadratic Functions;
1.4 Polynomial Functions and Rates of Change; 1.5 Polynomial Functions and Complex Zeros; 1.6 Polynomial Functions and
End Behavior; 1.7 Rational Functions and End Behavior; 1.8 Rational Functions and Zeros; 1.9 Rational Functions and
Vertical Asymptotes; 1.10 Rational Functions and Holes; 1.11 Equivalent Representations of Polynomial and Rational
Expressions; 1.12 Transformations of Functions; 1.13 Function Model Selection and Assumption Articulation;
1.14 Function Model Construction and Application.

**Unit 2 (15):** 2.1 Change in Arithmetic and Geometric Sequences; 2.2 Change in Linear and Exponential Functions;
2.3 Exponential Functions; 2.4 Exponential Function Manipulation; 2.5 Exponential Function Context and Data Modeling;
2.6 Competing Function Model Validation; 2.7 Composition of Functions; 2.8 Inverse Functions; 2.9 Logarithmic
Expressions; 2.10 Inverses of Exponential Functions; 2.11 Logarithmic Functions; 2.12 Logarithmic Function
Manipulation; 2.13 Exponential and Logarithmic Equations and Inequalities; 2.14 Logarithmic Function Context and Data
Modeling; 2.15 Semi-log Plots.

**Unit 3 (15):** 3.1 Periodic Phenomena; 3.2 Sine, Cosine, and Tangent; 3.3 Sine and Cosine Function Values; 3.4 Sine
and Cosine Function Graphs; 3.5 Sinusoidal Functions; 3.6 Sinusoidal Function Transformations; 3.7 Sinusoidal Function
Context and Data Modeling; 3.8 The Tangent Function; 3.9 Inverse Trigonometric Functions; 3.10 Trigonometric Equations
and Inequalities; 3.11 The Secant, Cosecant, and Cotangent Functions; 3.12 Equivalent Representations of
Trigonometric Functions; 3.13 Trigonometry and Polar Coordinates; 3.14 Polar Function Graphs; 3.15 Rates of Change in
Polar Functions.

**Unit 4 (14, not assessed):** 4.1 Parametric Functions; 4.2 Parametric Functions Modeling Planar Motion;
4.3 Parametric Functions and Rates of Change; 4.4 Parametrically Defined Circles and Lines; 4.5 Implicitly Defined
Functions; 4.6 Conic Sections; 4.7 Parametrization of Implicitly Defined Functions; 4.8 Vectors; 4.9 Vector-Valued
Functions; 4.10 Matrices; 4.11 The Inverse and Determinant of a Matrix; 4.12 Linear Transformations and Matrices;
4.13 Matrices as Functions; 4.14 Matrices Modeling Contexts.

---

## 3. Learning objectives, essential knowledge and exclusions per topic

LO codes follow the pattern topic.letter (1.1.A); EK codes add a number (1.1.A.1).

### Unit 1 Polynomial and Rational Functions (from CED text plus [CC])

- **1.1** A: describe how inputs and outputs vary together by comparing values. EK: a function maps each input to
  exactly one output; domain, range, independent/dependent variable, equal functions, image/preimage [CC]; increasing
  / decreasing on an interval defined by output comparisons. **Exclusion [CC, official]: distinguishing open vs
  closed intervals for increasing/decreasing is outside the scope of the course and exam.** B: sketch a graph of two
  co-varying quantities from a verbal description; concave up/down = rate of change increasing/decreasing; zeros
  are x-intercepts.
- **1.2** A: compare rates of change at two points using average rates over small nearby intervals. B: describe
  co-variation at points and over intervals; positive rate = both move the same way, negative = opposite ways.
- **1.3** A: average rate of change (AROC) for sequences, linear and quadratic functions; linear AROC constant;
  quadratic AROCs over equal-length consecutive intervals change linearly (constant second differences); AROC on
  [a, b] is the slope of the secant through (a, f(a)) and (b, f(b)) [CC]. B: how AROC changes; increasing AROCs =
  concave up.
- **1.4** A: polynomial vocabulary (degree n, leading term and coefficient; a nonzero constant has degree 0 [CC]);
  local extrema where the function switches increasing/decreasing or at an included endpoint of a restricted domain
  [CC]; global extrema; an extremum lies between two distinct real zeros; even degree has a global max or min, a
  quadratic's is at its vertex [CC]; inflection points where concavity switches.
- **1.5** A: zeros from factors; multiplicity; degree n has n complex zeros counting multiplicity; non-real zeros
  come in conjugate pairs; even multiplicity touches without crossing; degree from constant nth differences of
  equally spaced outputs. B: even (y-axis symmetry) and odd (origin symmetry) functions.
- **1.6** A: end behavior with limit notation as x → ±∞, set by the sign and degree of the leading term.
- **1.7** A: rational end behavior from the quotient of leading terms; horizontal asymptote (constant quotient,
  y = 0 when the denominator dominates); slant asymptote when the quotient is linear; limit notation.
- **1.8** A: real zeros of a rational function are numerator zeros in the domain; zeros and vertical asymptotes split
  the line into sign intervals for rational inequalities.
- **1.9** A: vertical asymptote at a denominator zero with higher multiplicity than in the numerator; one-sided
  limits describe unbounded behavior.
- **1.10** A: hole where the numerator zero's multiplicity is at least the denominator's; locate it with a limit.
- **1.11** A: factored form shows zeros, intercepts, asymptotes, holes, domain; standard form shows end behavior.
  B: polynomial long division (dividend = divisor x quotient + remainder) and slant asymptotes. C: binomial
  theorem via Pascal's triangle.
- **1.12** A: additive and multiplicative transformations (vertical/horizontal translations and dilations,
  reflections), combined transformations, how domain and range change; image/preimage terms [CC].
- **1.13** A: choose a model type from rates or data (linear = constant rate; quadratic = linear rate or symmetric
  data with one extremum; area/volume contexts suggest quadratic/cubic; degree n or less fits n+1 points; piecewise
  for different behaviors). B: state assumptions and domain/range restrictions from context or data.
- **1.14** A: build linear, quadratic, cubic, quartic, polynomial or piecewise models, by transformations or
  regression. B: rational models for inverse-proportion contexts (e.g. inverse-square). C: use a model to predict,
  find rates and interpret with context units.

### Unit 2 Exponential and Logarithmic Functions ([CC] where marked; rest [3P] Fiveable unit 2 page
https://fiveable.me/ap-pre-calc/unit-2.md; 2.1 from CED text)

- **2.1** Sequences are functions of whole numbers (discrete graphs). Arithmetic: common difference, a_n = a_0 + dn
  or a_k + d(n − k). Geometric: common ratio, g_n = g_0·r^n or g_k·r^(n−k) [CC]. Arithmetic grows by equal
  amounts, increasing geometric by increasing amounts [CC].
- **2.2** Linear and exponential functions extend these to real inputs; equal input steps with constant difference =
  linear, constant ratio (not 0 or 1) = exponential [CC]; exponential through a point with a known ratio,
  f(x) = y_i·b^(x − x_i) [CC].
- **2.3** f(x) = ab^x: always increasing or decreasing, one concavity, no extrema or inflection, horizontal
  asymptote, limit notation for end behavior; additive transformation of an exponential when shifted outputs are
  proportional [CC].
- **2.4** Exponent rules (product, power, negative, rational exponents); horizontal translation of an exponential =
  vertical dilation; horizontal dilation = change of base.
- **2.5** Build exponential models from a ratio and initial value, two points, or regression; base as growth
  factor and percent change; equivalent forms for other time units (e.g. monthly from yearly); models predict
  outputs and find inputs within the contextual domain [CC].
- **2.6** Compare models via residuals (predicted minus actual) and residual plots; no pattern = appropriate model
  [CC]; error as signed or absolute residual; over/underestimates on an interval [CC].
- **2.7** Composition f(g(x)), not commutative; domain of a composite; read compositions from tables/graphs; identity
  function behaves like 0 for addition and 1 for multiplication [CC]; decompose functions.
- **2.8** Inverse exists when one-to-one (or after restricting the domain); swap input/output; reflect over y = x;
  f(f⁻¹(x)) = x.
- **2.9** log_b c = a means b^a = c; common and natural logs; log scales for multiplicative quantities.
- **2.10** Exponential and log with the same base are inverses; additive input change multiplies exponential output,
  multiplicative input change adds to log output.
- **2.11** f(x) = a log_b x: domain x > 0, vertical asymptote, monotonic, one concavity, no extrema; limit notation
  near the asymptote.
- **2.12** Product, quotient, power rules; change of base, so all log functions are vertical dilations of each
  other; graphical meaning of each rule.
- **2.13** Solve exponential and log equations and inequalities with properties and inverses; reject extraneous
  solutions; inverses of transformed exponentials and logs [CC].
- **2.14** Log models for data where inputs grow proportionally over equal output steps; from two points or log
  regression; predict and find inputs [CC].
- **2.15** Semi-log plots: one axis on a log scale (base n > 1); exponential data looks linear on a log y-axis
  [CC]; slope and intercept give log of b and of a [3P]; no vertical shift needed [CC].

### Unit 3 Trigonometric and Polar Functions ([CC] where marked; rest [3P] Fiveable unit 3 page
https://fiveable.me/ap-pre-calc/unit-3.md and Test Ninjas https://test-ninjas.com/ap/precalculus/unit-3)

- **3.1** Periodic functions; period as the smallest repeating input interval; build a graph from one cycle.
- **3.2** Radian measure = arc length / radius; on the unit circle one radian subtends an arc of length 1 [CC]; sine,
  cosine as unit-circle coordinates, tangent as slope of the terminal ray.
- **3.3** Exact values at multiples of π/6 and π/4 via special triangles; coordinates on a circle of radius r are
  (r cos θ, r sin θ).
- **3.4** Graphs of sine and cosine from unit-circle tracing; outputs oscillate between −1 and 1 (vertical and
  horizontal displacement respectively) [CC].
- **3.5** Amplitude, period, frequency, midline; sine odd, cosine even.
- **3.6** a·sin(bθ + c) + d and a·cos(bθ + c) + d with a, b ≠ 0 [CC]; amplitude |a|, period 2π/|b|, phase shift,
  midline; cosine is sine phase-shifted by −π/2 [CC].
- **3.7** Sinusoidal models from max, min, cycle length and a landmark point, or sinusoidal regression; valid over
  a contextual domain; predict and find inputs [CC].
- **3.8** Tangent: period π, asymptotes where cosine is 0, transformations.
- **3.9** Inverse sine, cosine, tangent on restricted domains (principal ranges [−π/2, π/2], [0, π], (−π/2, π/2));
  outputs are angles; sin⁻¹ is not a reciprocal.
- **3.10** Solve trig equations and inequalities: principal solution, then all solutions in an interval or all reals
  using periodicity.
- **3.11** Secant, cosecant, cotangent as reciprocals; asymptotes at zeros of the denominator; ranges.
- **3.12** Identities: Pythagorean (and its tan/sec and cot/csc forms), sum and difference for sine and cosine,
  double-angle for sine and cosine [3P]. **Excluded per Break the Test [3P, not verified]: half-angle and tangent
  sum/difference identities.** Complex numbers in polar form also appear in this topic in some summaries [3P].
- **3.13** Polar coordinates (r, θ), polar axis, negative r, many representations per point [CC]; conversions with
  x = r cos θ, y = r sin θ, r² = x² + y².
- **3.14** Graph r = f(θ) from a rectangular graph of r vs θ; input change = angle change, output change = signed
  radial change [CC]; circles, cardioids, limaçons, roses.
- **3.15** Distance from origin increases where r is positive and increasing or negative and decreasing; decreases
  where r is positive and decreasing or negative and increasing [CC]; AROC of r with respect to θ is signed radius
  change per radian [CC]; extrema of r = closest/farthest points.

### Unit 4 (not assessed; teach optionally or skip)

Parametric functions and planar motion, rates of change; parametric circles and lines; implicit functions and conic
sections (parabola, ellipse, hyperbola); vectors and vector-valued functions; matrices, inverse and determinant (2x2),
linear transformations, matrices as functions, Markov-style transition models. Calculator page still lists matrix
operations among expected capabilities (CED technology section).

### Exclusions checklist (what the course must NOT assess as exam content)

1. **All of Unit 4** (course page, CaaG, course overview; official).
2. **Open vs closed endpoints when stating increasing/decreasing intervals** (clarifications PDF, EK 1.1.A.3-4;
   official). Still mark endpoints correctly for domains and closed-interval AROC.
3. **Calculus language.** The 2024 CR report treats "increasing at a decreasing rate" as calculus-level; the expected
   precalculus answer is just "the rate of change is decreasing". No derivatives notation (dr/dθ appears only in
   third-party notes). Official.
4. **Half-angle identities and tangent sum/difference** [3P, Break the Test; verify in CED Topic 3.12].
5. Not found anywhere: exclusion statements in Topics 2.2-3.15 (CED pages unread). **A person should scan the CED for
   "outside the scope" in Units 2-3.**

---

## 4. Mathematical practices and skills (CED text, official)

| Practice | Skills |
|---|---|
| 1 Procedural and Symbolic Fluency | 1.A solve equations and inequalities (with and without technology); 1.B rewrite functions/expressions in equivalent forms useful for a context; 1.C construct new functions by transformation, composition, inverse or regression |
| 2 Multiple Representations | 2.A pull information from graphical, numerical, analytical and verbal representations; 2.B build equivalent representations |
| 3 Communication and Reasoning | 3.A describe function characteristics with the precision the representation allows; 3.B apply numerical results in context; 3.C support conclusions with a rationale or data |

The CaaG tags every topic with practices 1-3. Exam weighting by practice was not readable (CED exam section).
CR reports tie FRQ 4 to skills 1.A and 1.B, and FRQ 2 reasoning parts to 3.A and 3.C. The CED says most of the exam
is done without technology, and that technology should not replace symbolic manipulation (graphing calculator page).

---

## 5. Exam format, May 2027

- **Date: Tuesday, May 11, 2027, Session 1** (8 a.m. local time in most US schools) (exam page, student page,
  exam-dates page). Late-testing dates are on a separate page, not checked.
- **Mode: hybrid digital.** MCQ answered in Bluebook; FRQs displayed in Bluebook and **handwritten in a paper
  booklet** that is returned for scoring (exam page). Only work in the booklet boxes is scored; crossed-out work is
  not (sample booklet).
- **Total 2 h 55 min** (student page).
- **Section I MCQ: 42 questions, 1 h 45 min, 62.5%.**
  - Part A: 29 questions, 65 min, **no calculator**, 43.75%.
  - Part B: 13 questions, 40 min, **graphing calculator required** (for some questions), radian mode, 18.75%.
  - Answer choices: 4 (A-D) [not verified this session; standard for current AP math].
- **Section II FRQ: 4 questions, 1 h 10 min, 37.5%, 6 points each (24 raw), analytic scoring** (student page;
  course overview).
  - Part A, 35 min, **graphing calculator required**, radian mode: **Q1 Function Concepts**, **Q2 Modeling a
    Non-Periodic Context**.
  - Part B, 35 min, **no calculator**: **Q3 Modeling a Periodic Context**, **Q4 Symbolic Manipulations**.
  - Within a part students may move between the two questions (2026 FRQ directions).

### Calculator rules

- Graphing calculator **required** for MCQ Part B and FRQ Part A; not allowed in MCQ Part A and FRQ Part B (exam page).
- Bluebook has a built-in **Desmos** graphing calculator, available only in the calculator parts; the web or app
  Desmos is not allowed on exam day. Students may also bring up to 2 approved handhelds (calculator policy page).
  CAS: the policy page does not address CAS for Precalculus; some TI-Nspire CAS models are on the general approved
  list [unconfirmed for this exam].
- **Expected capabilities** (graphing calculator page and CED): compute exponents, roots, trig values, logs; graph
  and analyze (increasing/decreasing, concavity, extrema, zeros, asymptotes); tables of values; real zeros;
  intersections; min/max; numerical solutions of one-variable equations; **regressions (linear, quadratic, cubic,
  quartic, exponential, logarithmic, sinusoidal) and residual plots**; matrix operations (Unit 4 only, CED).
- **Radian mode** required (student page; 2026 FRQ directions).

### FRQ directions and scoring rules (2026 FRQ booklet; 2024-2026 scoring guidelines; CR reports)

- Show all supporting work; answers without required work may get no credit.
- **Decimal answers must be accurate to three places after the decimal point** (round or truncate) unless told
  otherwise; **do not round intermediate values**, store them in the calculator. Trailing zeros optional. In 2026 SG
  Q1-Q2, the first decimal presentation error is not penalized, later ones are (2026 SG).
- Default domain: all real inputs giving real outputs, unless stated.
- **Q4 directions:** angles in radians; real solutions only; **exact values** for anything evaluable without a
  calculator; combine terms and apply exponent and log rules unless told otherwise; work for each part. Answers not
  meeting the simplification rules lose the point (2026 SG).
- Q3 parts A-C need no supporting work in 2026 and accept any valid equivalent form (2026 SG).
- Use task verbs (CED p. 151 per 2024 CR report): explain, justify, give a reason, provide a rationale.
- Never write "=" between unequal expressions; use precise limit notation (both CR reports).

### Recurring FRQ task models (2024-2026, paraphrased; for coverage, not reproduction)

| Q | 2024 | 2025 | 2026 | Recurring parts |
|---|---|---|---|---|
| 1 Function Concepts (calc) | f by graph, g analytic | f by table, g analytic | f increasing graph, g logarithmic | A: composition value and solving f(x) = k from the graph/table; B: solve g(x) = k with the calculator (3 decimals, all solutions) and end behavior or one-sided behavior **in limit notation**; C: invertibility yes/no plus a reason **using specific values of f**, or justify a model type from input/output changes |
| 2 Non-Periodic Modeling (calc) | logarithmic sales model | quadratic plays model from 3 points | exponential depreciation | A: write the system from data, solve for constants (decimals); B: AROC, use it (secant line) to estimate, explain over/underestimate via concavity; C: explain how context limits the domain or why model error grows. **2027: B(iii) removed, C expanded** |
| 3 Periodic Modeling (no calc) | rolling tire height | oscillating height, frequency given | waterwheel point | A: coordinates of 5 labeled points on an unscaled sinusoid; B: a, b, c, d for a·sin(b(t + c)) + d; C: sign/direction of h on an interval, then concavity and whether the rate of change is increasing or decreasing |
| 4 Symbolic Manipulations (no calc) | exp, inverse trig, single log, single tan, solve cos⁻¹(tan 2x) | log and trig equations, single log, single tan, quadratic in eˣ | exponential and log equations, rewrite as 7^(…), single sin x, tan²(3x) = 1 on an interval | A: solve exp/log (and inverse-trig) equations with work; B: rewrite to a single log, base power or single trig function using identities; C: trig equation with all solutions in an interval, or exponential equation quadratic in form |

Sources: 2024 and 2025 CR reports; 2026 SG; past exam questions page.

---

## 6. Score distributions

Official score page; global PDFs for 2024-2025. 2026 is rounded with no count or mean on the page.

| Year | 5 | 4 | 3 | 2 | 1 | 3+ | Takers | Mean |
|---|---|---|---|---|---|---|---|---|
| 2026 | 29 | 29 | 24 | 11 | 7 | 82 | ~300,000 (Wikipedia citing Total Registration, [3P], unverified) | n/a |
| 2025 | 28.1 | 25.8 | 26.8 | 11.2 | 8.0 | 80.8 | 253,596 (US page); 254,469 global, SD 1.23 | 3.55 |
| 2024 | 25.9 | 23.9 | 25.9 | 14.6 | 9.8 | 75.6 | 184,394; SD 1.28 | 3.42 |

Sources: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-precalculus ;
https://apcentral.collegeboard.org/media/pdf/ap25-precalculus-score-distributions.pdf ;
https://apcentral.collegeboard.org/media/pdf/ap24-precalculus-score-distributions.pdf ; 2026 takers
https://en.wikipedia.org/wiki/AP_Precalculus. Cognito notes AP Precalc's 3+ rate (82%) equals Calc BC's but with far
fewer 5s (29% vs 46%) (https://cognito.org/blog/ap-score-distribution-2026, [3P]). First exam was May 2024; takers
grew ~38% in year two. The 2026 global PDF did not load.

FRQ means out of 6 (scoring statistics PDFs, official):

| Q | 2024 mean (SD) | 2025 mean (SD) |
|---|---|---|
| 1 Function Concepts | 2.95 (1.98) | 3.51 (1.89) |
| 2 Non-Periodic Modeling | 2.03 (1.68) | 2.16 (1.64) |
| 3 Periodic Modeling | 2.96 (1.89) | 3.13 (1.84) |
| 4 Symbolic Manipulations | **1.28 (1.60)** | **1.93 (1.86)** |

**Q4 is the weakest every year, then Q2.** 2024 part means (CR report): Q1 C(ii) 0.15; Q2 B(iii) 0.04, C 0.08;
Q3 B(ii) 0.20; Q4 B(i) 0.16, C(i) 0.15, C(ii) 0.04. 2025 lows: Q2 C 0.05; Q3 B(ii) second point 0.18; Q4 B(ii) 0.14,
C 0.10. (The 2025 CR gives Q2 mean 2.17; statistics PDF 2.16.)

---

## 7. Where students lose points (2024 and 2025 Chief Reader Reports; 2026 SG)

2026 has FRQs and scoring guidelines only (no CR report or statistics yet).

### Cross-cutting (both reports)
1. **Rounding:** decimals not accurate to three places, or rounding/truncating intermediate values (e.g. model
   constants in Q2), which spoils later answers. Store values.
2. **Limit notation** for end behavior and asymptotes written wrongly (Topics 1.6, 1.7, 1.9, 1.10, 2.3, 2.11).
3. **Vague or general reasoning:** stating a rule ("not one-to-one", "fails the horizontal line test") without
   citing specific values from the given function; 2026 SG explicitly gives no credit for the bare phrase.
4. **"=" linking unequal expressions**, and misused function notation (input/output confusion).
5. **Calculator use:** missing one of several solutions (window too small), not using technology when it was enough.

### By question
- **Q1 Function Concepts:** composition value given without showing the inner value; for "find x where f(x) = k"
  giving "0 and no solution" or missing that several inputs share an output; missing one of three calculator
  solutions or reporting their negatives; ambiguous wording ("f is not an inverse" vs "f has no inverse"); in the
  model-justification part, leaving out either the **equal-length input intervals** or the **proportional outputs
  (common ratio)**.
- **Q2 Non-Periodic Modeling:** trouble solving the 2- or 3-equation system (technology was allowed); not saying
  **AROC = slope of the secant line**; using the right slope through a point not on the secant line; failing to tie
  "secant below/above the graph" to **concavity on the stated interval**; confusing how a function changes with how
  its rate of change changes; for the domain part, not explaining that the model's maximum (or the time a value
  is reached) bounds the domain because the model then behaves impossibly for the context (e.g. a cumulative total
  decreasing); vague explanations of why error grows after the last data point. Units (thousands) acceptable if
  consistent.
- **Q3 Periodic Modeling:** turning the verbal context into coordinates; **phase shift and b** (period vs frequency:
  period is the reciprocal of frequency; b = 2π/period); in C(ii), unclear concavity or rate statements, or the
  calculus phrase "increasing at a decreasing rate" instead of "the rate of change is decreasing/increasing".
- **Q4 Symbolic Manipulations:** missing the second solution of an equation; weak **inverse trig** (principal
  ranges; treating tan⁻¹x as 1/tan x); log property errors; not reducing to **one** log term or **one** tan/sin term
  (stopping at cos x / sin x); not using Pythagorean identities; not seeing an equation as **quadratic in eˣ** and
  not rejecting the impossible root (eˣ = negative); in "all solutions" parts, not removing the inverse function
  first and not listing all solutions in the interval (or all reals) with no extras.

### Reader advice to build into the course
- Practice composition and inverses in all representations (graph, table, formula), revisit at Topic 3.9.
- Practice finding every calculator solution and adjusting windows; keep full precision.
- Teach the AROC/secant/concavity link early (Topics 1.2-1.4) and reuse it in every model type.
- Compare vague, confused and correct written explanations; use the CED task verbs from day one.
- Drill exponent, log and trig identities without technology; show every step; no guess-and-check on MCQ.
- Share the Q4 directions in advance (exact values, single-term forms).

---

## 8. Prerequisites and dependency note (CED; course overview)

The course assumes the Algebra 1-Geometry-Algebra 2 sequence:
- linear and quadratic functions: manipulation, solving equations and inequalities;
- polynomial operations, factoring quadratic trinomials, quadratic formula;
- right-triangle trigonometry; systems of equations in 2 and 3 variables;
- familiarity with piecewise functions, exponential functions and exponent rules, radicals, complex numbers, and
  moving among graphical, numerical, analytical and verbal representations.

Course dependency chain (from the topic order; our analysis): rates of change and concavity (1.1-1.4) feed every
modeling topic and Q2/Q3 part C; transformations (1.12) feed 2.3-2.4, 2.11 and 3.5-3.6; composition and inverses
(2.7-2.8) feed logs (2.9-2.13) and inverse trig (3.9-3.10); exact unit-circle values (3.3) feed 3.9-3.12 and all of
Q4's trig parts; limits notation (1.6-1.10) recurs in 2.3, 2.11 and 3.8. Khan Academy opens its course with an
Algebra 2 review for the same reason (https://blog.khanacademy.org/?p=22180, [3P]).

---

## 9. Not confirmed

- New FRQ 2 structure and point split for 2027 (CED sample Q2 and scoring not readable; Part C likely 2 points).
- CED topic pages 2.2-4.14: LO codes, EK text and any exclusion statements (only [CC] restatements and [3P]
  summaries read). Half-angle / tangent-sum exclusion is third party.
- Exam weighting by practice; number of MCQ answer options; CAS permission for Precalculus.
- 2026 taker count and mean; 2026 CR report and scoring statistics (not posted).
- Blocked: totalregistration.net 2026 distribution page (permission not answered); the 2026 global score PDF.
