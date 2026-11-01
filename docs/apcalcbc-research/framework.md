# AP Calculus BC framework research (as of 2026-10-31)

Purpose: source facts for building LevlPrep's AP Calculus BC course on top of the live AB course (`/calculus/`).
This file covers only what BC adds or changes. Everything shared with AB (Units 1-8 AB topics, practices, calculator
rules, general scoring notes, AB error lists) is in `docs/apcalc-research/framework.md` and is not repeated.
Paraphrased throughout; no exam questions reproduced.

Access note: the full CED PDF text was read this session through Firecrawl's PDF parser (all ~287k characters,
including Units 9 and 10 and the exam section), so the BC learning objectives (LO), essential knowledge (EK) and
exclusion statements below are **text-verified**, unlike AB Units 3-8 in the AB file. Chief Reader (CR) reports,
scoring guidelines and statistics were read through WebFetch text extraction (a summarizer), so error lists are
paraphrases of the reports; spot-check wording against the PDFs before quoting. Firecrawl credits ran out midway;
Google autocomplete was blocked (proxy 403), so no BC search-phrase data.

Key official URLs
- BC course page (weights, documents): https://apcentral.collegeboard.org/courses/ap-calculus-bc
- BC exam page (2027 format, date): https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam
- Student assessment page (format, cannot take AB and BC same year): https://apstudents.collegeboard.org/courses/ap-calculus-bc/assessment
- CED (AB and BC; current reprint already shows the 2027 MCQ format):
  https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-and-bc-course-and-exam-description.pdf
- Course at a Glance (BC): https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-at-a-glance.pdf (not read)
- Clarifications (fall 2026): https://apcentral.collegeboard.org/media/pdf/ap-calculus-ab-bc-course-and-exam-description-clarifications.pdf
- Past exam questions: https://apcentral.collegeboard.org/courses/ap-calculus-bc/exam/past-exam-questions
- CR reports: 2025 https://apcentral.collegeboard.org/media/pdf/ap25-cr-report-calculus-ab-bc.pdf ;
  2024 https://apcentral.collegeboard.org/media/pdf/ap24-cr-report-calculus.pdf ;
  2023 https://apcentral.collegeboard.org/media/pdf/ap23-cr-report-calculus.pdf
- 2026 BC scoring guidelines: https://apcentral.collegeboard.org/media/pdf/ap26-sg-calculus-bc.pdf
- 2025 BC scoring statistics: https://apcentral.collegeboard.org/media/pdf/ap25-calculus-bc-scoring-statistics.pdf
- Score distributions: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-calculus-bc
- AB subscore: https://apstudents.collegeboard.org/about-ap-scores/special-score-structure-calculus-bc ;
  2025 distribution https://apcentral.collegeboard.org/media/pdf/ap25-calculus-bc-ab-subscore-score-distributions.pdf
- Exam dates: https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates

---

## 1. What changed for 2026-27 (confirmed for BC)

- **Content: none.** The BC course page says the 2026-27 clarifications are minor and "course content has not
  changed" (course page). The clarifications PDF flags nothing as BC-specific; its only EK edits are FUN-1.C.1 (EVT)
  and FUN-7.B.2 (DE solutions), both shared with AB (clarifications PDF; details in the AB file section 1).
- **Exam timing: same change as AB, confirmed for BC.** The BC exam page and the student assessment page both give
  42 MCQ in 1 h 40 min (Part A 29 / 62 min, Part B 13 / 38 min) and 6 FRQ in 1 h 30 min, total 3 h 10 min. The
  current CED exam overview states the AB and BC exams are "both 3 hours and 10 minutes long" with 42 MCQ and 6 FRQ
  (CED, Exam Information). Old format (2025, 2026 exams): 45 MCQ (30 / 60 min + 15 / 45 min), 3 h 15 min.
- **BC unit weights did not change** in the clarifications; the CED and the course page agree (section 2).
- The BC exam page itself words the MCQ change as "will be updated, effective with the May 2027 exams" (exam page).
- Unconfirmed: whether the 13 removed MCQ slots shift the BC unit mix; the CED gives only ranges.

---

## 2. BC unit weights (MCQ section)

Source: CED "Exam Weighting for the Multiple-Choice Section" table; identical on the BC course page.

| Unit | Title | AB | **BC** | BC class periods (CED) |
|---|---|---|---|---|
| 1 | Limits and Continuity | 10-15% | **5-10%** | not read |
| 2 | Differentiation: Definition and Fundamental Properties | 10-15% | **5-10%** | not read |
| 3 | Differentiation: Composite, Implicit, and Inverse Functions | 5-10% | **5-10%** | not read |
| 4 | Contextual Applications of Differentiation | 10-15% | **5-10%** | not read |
| 5 | Analytical Applications of Differentiation | 15-20% | **10-15%** | not read |
| 6 | Integration and Accumulation of Change | 15-20% | **15-20%** | not read |
| 7 | Differential Equations | 5-10% | **5-10%** | not read |
| 8 | Applications of Integration | 10-15% | **5-10%** | not read |
| 9 | Parametric Equations, Polar Coordinates, and Vector-Valued Functions | n/a | **10-15%** | ~10-11 |
| 10 | Infinite Sequences and Series | n/a | **15-20%** | ~17-18 |

Class periods for Units 9 and 10 are text-verified in the CED unit openers; Units 1-8 BC period counts were not
extracted (the openers list AB and BC counts side by side; read the PDF). Units 9 + 10 together are 25-35% of BC MCQ;
Unit 10 alone ties Unit 6 as the heaviest unit. AP Classroom Progress Checks: Unit 9 ~25 MCQ + 3 FRQ; Unit 10 ~45 MCQ +
3 FRQ; Unit 7 ~20 MCQ for BC vs ~15 for AB (CED unit openers).

CED framing (Course Framework, College Course Equivalent): AB equals a first-semester college calculus course; BC
equals first and second semesters. BC applies AB content to parametric, polar and vector-valued functions, adds
integration techniques and applications, and introduces sequences and series. Prerequisites: BC students are
expected to have "basic familiarity with sequences and series, as well as some exposure to parametric and polar
equations" (CED, Prerequisites). That is a precalculus gap our course must fill (see section 9).

---

## 3. BC-only topics: full list

**30 BC-only topics** (CED topic headers marked "bc only"), plus BC techniques inside 6.14:

| # | Topic | Unit |
|---|---|---|
| 1 | 6.11 Integrating Using Integration by Parts | 6 |
| 2 | 6.12 Integrating Using Linear Partial Fractions | 6 |
| 3 | 6.13 Evaluating Improper Integrals | 6 |
| (part) | 6.14 Selecting Techniques for Antidifferentiation (BC: adds parts and partial fractions to the choice) | 6 |
| 4 | 7.5 Approximating Solutions Using Euler's Method | 7 |
| 5 | 7.9 Logistic Models with Differential Equations | 7 |
| 6 | 8.13 The Arc Length of a Smooth, Planar Curve and Distance Traveled | 8 |
| 7-15 | 9.1-9.9 (nine topics, below) | 9 |
| 16-30 | 10.1-10.15 (fifteen topics, below) | 10 |

Count check: 6 (Units 6-8) + 9 (Unit 9) + 15 (Unit 10) = **30 BC-only topics**. **BC topic total = 81 AB topics
+ 30 = 111 topics.**

Unit 9: 9.1 Defining and Differentiating Parametric Equations; 9.2 Second Derivatives of Parametric Equations;
9.3 Finding Arc Lengths of Curves Given by Parametric Equations; 9.4 Defining and Differentiating Vector-Valued
Functions; 9.5 Integrating Vector-Valued Functions; 9.6 Solving Motion Problems Using Parametric and Vector-Valued
Functions; 9.7 Defining Polar Coordinates and Differentiating in Polar Form; 9.8 Find the Area of a Polar Region or
the Area Bounded by a Single Polar Curve; 9.9 Finding the Area of the Region Bounded by Two Polar Curves.

Unit 10: 10.1 Defining Convergent and Divergent Infinite Series; 10.2 Working with Geometric Series; 10.3 The nth
Term Test for Divergence; 10.4 Integral Test for Convergence; 10.5 Harmonic Series and p-Series; 10.6 Comparison
Tests for Convergence; 10.7 Alternating Series Test for Convergence; 10.8 Ratio Test for Convergence; 10.9
Determining Absolute or Conditional Convergence; 10.10 Alternating Series Error Bound; 10.11 Finding Taylor
Polynomial Approximations of Functions; 10.12 Lagrange Error Bound; 10.13 Radius and Interval of Convergence of Power
Series; 10.14 Finding Taylor or Maclaurin Series for a Function; 10.15 Representing Functions as Power Series.

(All names from the CED Unit at a Glance tables and topic headers, text-verified.)

---

## 4. Learning objectives and essential knowledge (our words, CED text-verified)

### Unit 6 additions (BC)
- **6.11** FUN-6.E: find indefinite and evaluate definite integrals that need integration by parts. EK FUN-6.E.1:
  parts is an antiderivative technique. (Tabular method not named in the CED; the 2024 CR report accepts it.)
- **6.12** FUN-6.F: indefinite and definite integrals by **linear** partial fractions. EK FUN-6.F.1: some rational
  functions split into sums of fractions over **linear, nonrepeating** factors, then basic rules apply. Boundary
  (implied by the EK wording): repeated linear and irreducible quadratic factors are outside scope.
- **6.13** LIM-6.A: evaluate an improper integral or show it diverges. EK LIM-6.A.1: improper = one or both limits
  infinite, or integrand unbounded on the interval. EK LIM-6.A.2: evaluate as a limit of definite integrals.
- **6.14** Skill topic, no new LO: choose the technique (CED says practice when and how to apply all
  antidifferentiation LOs). For BC this includes parts and partial fractions.

### Unit 7 additions (BC)
- **7.5** FUN-7.C (shared LO "estimate solutions to differential equations"): EK FUN-7.C.4, Euler's method gives a
  step procedure to approximate a solution or a point on a solution curve.
- **7.9** FUN-7.H: interpret the logistic model in context. EK FUN-7.H.1: "rate jointly proportional to the quantity
  and to (carrying capacity minus quantity)" gives dy/dt = ky(a - y). EK FUN-7.H.2: the logistic DE and initial
  conditions can be interpreted **without solving** it. EK FUN-7.H.3: the limiting value (carrying capacity) as
  t grows can be found from the model and initial condition. EK FUN-7.H.4: the value of y where it grows fastest
  (half the carrying capacity) can be found from the model. Boundary: solving the logistic DE explicitly is not in
  the EK (CED gives only interpretation); partial fractions would allow it but no EK requires it.

### Unit 8 addition (BC)
- **8.13** CHA-6.A: length of a planar curve y = f(x) as a definite integral (EK CHA-6.A.1). The topic title also
  says "distance traveled"; the CED links this to 9.3 for parametric curves.

### Unit 9 Parametric, polar, vector-valued (10-15%)
CED unit guidance: build on straight-line motion; use Leibniz notation; dy/dx = (dy/dt)/(dx/dt) when dx/dt is not 0;
extra care with d²y/dx²; polar area comes from the same Riemann-sum idea; algebra, trig and chain-rule errors
are "often even more problematic" than the polar ideas; sign charts help but a justification must cite a
definition or theorem; account for initial values; watch subscripts when two particles appear.
- **9.1** CHA-3.G: derivatives of parametric functions. EK CHA-3.G.1: real-function methods extend. EK CHA-3.G.2:
  dy/dx at a point is the tangent slope, found as dy/dt divided by dx/dt, provided dx/dt is not 0.
- **9.2** CHA-3.G (cont.): EK CHA-3.G.3, d²y/dx² = [d/dt (dy/dx)] divided by dx/dt (not the derivative of dy/dx
  with respect to t alone).
- **9.3** CHA-6.B: arc length of a parametric curve as a definite integral (EK CHA-6.B.1).
- **9.4** CHA-3.H: derivatives of vector-valued functions (EK CHA-3.H.1, real-function methods extend).
- **9.5** FUN-8.A: particular solution (position) from a rate vector and an initial condition. EK FUN-8.A.1:
  integration methods extend to parametric and vector-valued functions.
- **9.6** FUN-8.B: positions and rates in planar motion. EK FUN-8.B.1: derivatives give velocity, **speed** and
  acceleration along a curve. EK FUN-8.B.2: the integral of the velocity vector is displacement (gives position);
  the integral of speed is total distance traveled.
- **9.7** FUN-3.G: derivatives of polar functions. EK FUN-3.G.1: methods extend. EK FUN-3.G.2: for r = f(θ),
  derivatives of r, x and y with respect to θ, and first and second derivatives of y with respect to x, describe the
  curve (x = r cos θ, y = r sin θ; dr/dθ sign tells whether the point moves away from or toward the origin).
- **9.8** CHA-5.D: polar area. EK CHA-5.D.1: area ideas extend to polar coordinates (area = ½ ∫ r² dθ, a
  standard result; the formula itself is not printed in the extracted EK text).
- **9.9** CHA-5.D (cont.): EK CHA-5.D.2, areas between two polar curves by definite integrals.
Boundary: no exclusion statement in Unit 9. Not named in the CED (do not teach as assessed): polar arc length,
dot and cross products, unit tangent vectors, curvature.

### Unit 10 Infinite sequences and series (15-20%)
CED unit guidance: memorizing a list of tests "typically" fails; stress notation, precise language and **explicitly
verifying every condition of a test**; ratio-test algebra must be clean; "determining that a given number is an
error bound requires calculating an appropriate value and communicating that the value is less than the given
number"; connect improper integrals to the integral test and power series to differentiation and integration.
- **10.1** LIM-7.A: decide convergence. EK LIM-7.A.1 nth partial sum = sum of first n terms; LIM-7.A.2 a series
  converges to S if and only if the sequence of partial sums has limit S.
- **10.2** EK LIM-7.A.3 geometric = constant ratio; LIM-7.A.4 if |r| < 1, sum from n = 0 of ar^n is a/(1 - r).
- **10.3** EK LIM-7.A.5 the nth term test is a test for **divergence** only.
- **10.4** EK LIM-7.A.6 integral test.
- **10.5** EK LIM-7.A.7 reference series: harmonic, alternating harmonic, p-series (plus geometric).
- **10.6** EK LIM-7.A.8 comparison test; LIM-7.A.9 limit comparison test.
- **10.7** EK LIM-7.A.10 alternating series test (for convergence of alternating series).
- **10.8** EK LIM-7.A.11 ratio test. **Exclusion statement (CED, text-verified):** the nth term test for divergence
  and the integral, comparison, limit comparison, alternating series and ratio tests are assessed; **other methods
  (e.g. root test) are not assessed**, though teachers may include them.
- **10.9** EK LIM-7.A.12 a series is absolutely convergent, conditionally convergent or divergent; LIM-7.A.13
  absolute convergence implies convergence; LIM-7.A.14 rearranging an absolutely convergent series keeps its sum.
- **10.10** LIM-7.B: approximate a series sum. EK LIM-7.B.1: if the alternating series test applies, the
  alternating series error bound limits how far a partial sum is from the sum (first omitted term).
- **10.11** LIM-8.A represent a function at a point as a Taylor polynomial; LIM-8.B approximate values. EK
  LIM-8.A.1 nth coefficient is f⁽ⁿ⁾(a)/n!; LIM-8.A.2 higher degree often approaches f on some interval; LIM-8.B.1
  Taylor polynomials approximate f near x = a.
- **10.12** LIM-8.C error bound for a Taylor approximation. EK LIM-8.C.1 Lagrange error bound gives a maximum error;
  LIM-8.C.2 sometimes the alternating series error bound works instead.
- **10.13** LIM-8.D radius and interval of convergence. EK LIM-8.D.1 power series form Σ aₙ(x - r)ⁿ; LIM-8.D.2 a
  power series converges at one point, or on an interval (or all reals); LIM-8.D.3 the ratio test finds the radius;
  **LIM-8.D.4 both endpoints must be tested separately**; LIM-8.D.5 a power series with positive radius is the Taylor
  series of its sum on the open interval; LIM-8.D.6 term-by-term derivatives and integrals keep the same radius
  (endpoint behavior can change).
- **10.14** LIM-8.E represent a function as a Taylor or Maclaurin series; LIM-8.F interpret them. EK LIM-8.E.1 a
  Taylor polynomial is a partial sum of the Taylor series; LIM-8.F.1 the Maclaurin series for 1/(1 - x) is geometric;
  LIM-8.F.2 the Maclaurin series for sin x, cos x and eˣ are the base for building others (students must know these
  four by heart; the CED names exactly these).
- **10.15** LIM-8.G derive a power series for a function from a known series by term-by-term differentiation or
  integration, substitution, algebra or geometric-series properties (EK LIM-8.G.1).
Boundary: the 10.8 exclusion above. Sequences are not a separate topic; sequence limits appear only inside series
work. Not named: Taylor's theorem proofs, binomial series, ln(1 + x) and arctan series are derived (10.15), not
listed as must-memorize (CED names only 1/(1 - x), sin, cos, eˣ).

### Shared exclusions that also bind BC (CED, text-verified)
- Epsilon-delta definition of a limit not assessed on AB or BC (Topic 1.2).
- Indeterminate forms other than 0/0 and ∞/∞ (e.g. ∞ - ∞) "will not be assessed on either the AP Calculus AB or BC
  Exam" (Topic 4.7 exclusion). Note: BC students sometimes see 1^∞ or 0·∞ in textbooks; keep them out of graded items.
- Shell method: no CED topic (see AB file).

---

## 5. BC exam format for May 2027

Sources: BC exam page; assessment page; CED Exam Information; AB file section 5 for calculator rules (identical).

| | 2025 and 2026 exams | **May 2027** | Weight |
|---|---|---|---|
| Section I Part A, no calculator | 30 MCQ, 60 min | **29 MCQ, 62 min** | 35% |
| Section I Part B, graphing calculator required | 15 MCQ, 45 min | **13 MCQ, 38 min** | 15% |
| Section II Part A, graphing calculator required | 2 FRQ, 30 min | 2 FRQ, 30 min | 16.7% |
| Section II Part B, no calculator | 4 FRQ, 60 min | 4 FRQ, 60 min | 33.3% |
| Total | 45 MCQ + 6 FRQ, 3 h 15 min | **42 MCQ + 6 FRQ, 3 h 10 min** | |

(Section weights from the CED table and the assessment page.)
- Hybrid digital: MCQ in Bluebook; FRQs viewed in Bluebook and **handwritten** in a paper booklet (exam page).
- Each FRQ is 9 points (2025 BC scoring statistics show max 9 for all six; 2026 BC scoring guidelines).
- **Shared FRQs:** the CED says the AB and BC exams include **three common FRQs** assessing AB content (CED Section
  II). 2023-2026 pattern: BC1, BC3, BC4 are the shared questions (AB1/AB3/AB4 numbers vary; 2026 SG labels Q1, Q3,
  Q4 "AB or BC"). So **BC2 (calculator), BC5 and BC6 (no calculator) are BC-only** (2026 SG; 2023-2025 CR reports).
- MCQ: the CED sample questions label items "AB or BC" and "BC only"; the share of BC-only MCQs is not published.
  Official: the AB-topic portion is "about 60%" of the BC exam (CB special-score-structure page,
  https://apstudents.collegeboard.org/about-ap-scores/special-score-structure-calculus-bc).
- **Exam date: Monday, May 10, 2027, Session 1 (morning)**, same session as Calculus AB (BC exam page; assessment
  page; exam dates page). Students cannot take both AB and BC in the same year (assessment page).

### AB subscore
- Every BC taker gets a Calculus AB subscore (1-5) based on the AB-topic portion (about 60% of the exam). CB
  recommends colleges treat it like an AB score (special-score-structure page). Calculation method not published.
- 2025: 160,953 students; 5: 47.7%, 4: 30.5%, 3: 9.8%, 2: 9.0%, 1: 3.0%; **88.0% 3+**, mean 4.11 (AB subscore PDF;
  2025 CR report). 2026 subscore distribution not yet posted (past-exam-questions page lists none for 2026).

### Recurring BC FRQ task models (2023-2026)

| Slot | Type | 2023 | 2024 | 2025 | 2026 |
|---|---|---|---|---|---|
| BC1 (calc, shared) | Rate/table or modeling | gas pump rates, Riemann, MVT | coffee temp, Riemann, avg value | invasive species model, avg value, EVT | bird arrivals, midpoint sum, IVT |
| **BC2 (calc, BC only)** | **Parametric/vector motion or polar** | parametric motion: acceleration vector, speed equation, tangent line, distance | parametric motion: speed, distance, position, direction | **polar**: rates, area, distance from y-axis, related rate | **polar**: area, tangent slope, critical point, average distance from origin |
| BC3 (no calc, shared) | DE / slope field | milk warming DE | seawater depth DE | table: IVT, trapezoid, accumulation | cooling pie DE |
| BC4 (no calc, shared) | Graph of f′ / FTC | graph of f′ + L'Hospital | graphical FTC | graphical FTC | graph of f′ |
| **BC5 (no calc, BC only)** | **Mixed BC technique** | area + improper integral + parts | arc length + Euler + parts | implicit DE + Taylor + Lagrange bound + Euler | area/volume + arc length + improper integral |
| **BC6 (no calc, BC only)** | **Series** | Taylor polynomial + Lagrange bound | Maclaurin: endpoints, alternating error bound, radius | ratio test, interval, Taylor coefficients, geometric sum | Maclaurin manipulation, geometric sum, alternating error bound |

Sources: 2023, 2024, 2025 CR reports; 2026 BC scoring guidelines.
Takeaways: BC6 is always series/Taylor; BC2 alternates parametric motion and polar (polar two years running);
BC5 is a grab-bag of Unit 6-8 BC techniques (parts appeared 2023 and 2024, improper integrals 2023 and 2026,
Euler 2024 and 2025, arc length 2024 and 2026). Logistic models and partial fractions did not appear as FRQ parts
2023-2026 (they remain MCQ-eligible). Vector-valued notation appears inside parametric BC2.

### 2026 BC scoring notes specific to BC (2026 SG)
- Polar critical-point classification: a candidates test alone does not earn the point (a sign-change or second
  derivative argument is needed for a local classification).
- Average distance from the origin needs division by the interval length.
- Improper integral: the point requires correct limit notation throughout.
- Arc length: the integrand must be in the correct form.
- Alternating series error bound: the point requires justifying the series is alternating with terms decreasing
  to 0 (i.e. that the alternating series error bound applies); just stating a size earns nothing.

---

## 6. Score distributions

Source: https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-calculus-bc

| Year | 5 | 4 | 3 | 2 | 1 | 3+ | Takers | Mean |
|---|---|---|---|---|---|---|---|---|
| 2026 | 46% | 22% | 14% | 14% | 4% | 82% | ~171,000 (third party) | n/a |
| 2025 | 44.0% | 21.9% | 12.8% | 15.2% | 6.2% | 78.6% | 160,436 | 3.82 |
| 2024 | 47.7% | 21.1% | 12.1% | 13.9% | 5.2% | 80.9% | 148,191 | 3.92 |
| 2023 | 43.5% | 15.9% | 19.0% | 15.2% | 6.3% | 78.5% | 135,458 | 3.75 |

- 2026 figures are preliminary and rounded; the CB page lists no taker count. ~171,000 is from Total Registration
  (third party, preliminary): https://www.totalregistration.net/AP-Exam-Registration-Service/AP-Exam-Score-Distributions.php?year=2026
- The 2025 CR report gives 160,954 students scored (vs 160,436 on the distribution page; small administration
  differences).
- Growth: ~135k (2023) to ~160k (2025) to ~171k (2026, unconfirmed), about +8%/yr; AB is ~286-292k.
- BC has the highest 5 rate of the STEM APs (46% in 2026, per Cognito, third party:
  https://cognito.org/blog/ap-score-distribution-2026), largely a cohort effect (stronger students).
- No published raw-to-score cuts (as for AB). 2027 scaling with 42 MCQ unknown.

FRQ means out of 9 (BC takers)
- 2025 (scoring statistics): Q1 5.22, **Q2 3.09 (polar, lowest)**, Q3 6.27, Q4 5.46, Q5 5.21, Q6 4.32.
- 2024 (CR report): Q1 6.45, Q2 5.56, Q3 5.57, Q4 5.84, Q5 5.92, **Q6 3.38 (series, lowest)**.
- 2023 (CR report): Q1 5.26, Q2 5.20, Q3 3.74, Q4 4.03, Q5 4.71, Q6 4.21.
- 2026: not published yet (scoring statistics PDF and 2026 CR report URLs returned errors; past-exam page lists
  only FRQs and scoring guidelines).
- Shared-question comparison (same question, BC vs AB takers): 2025 Q1 5.22 vs 3.26, Q4 5.46 vs 3.91; 2024 Q3 5.57
  vs 3.55; 2023 Q3 3.74 vs 2.07 (AB means from the AB file). BC students do better on AB content but still lose
  3-5 of 9 points on shared questions, so AB review is real for BC students (see market.md).
- Lowest BC means are always BC-only: polar (2025), series (2024), and series/Taylor stays in the bottom two.

---

## 7. Where BC students lose points (BC-only questions, CR reports 2023-2025 and 2026 SG)

### Series and Taylor (BC6 every year; BC5 2025)
1. **Interval of convergence endpoints**: not testing an endpoint at all (2024 BC6a); using the ratio test at an
   endpoint, where it is inconclusive (2025 advice: practice choosing a test at endpoints, explain why the ratio test
   cannot decide them); interval not centered at the right point (2025 BC6a); answering the radius when the interval
   was asked, or the reverse (2024, 2025); radius slips such as reporting 3 or 1/3 instead of √3 from x² < 3, missing
   absolute values in the ratio (2024 BC6d).
2. **Comparison/limit comparison misuse**: comparing with an alternating series, calling a series "harmonic" when it
   is not, limit notation in x instead of n (2025 BC6a); saying a term "diverges" rather than the series (2024).
3. **Error bounds**: using the Lagrange bound where the alternating series bound was intended (2024 BC6b); not
   showing the series is alternating with terms decreasing to 0 (2026 SG); not linking the bound to |approximation -
   actual|; strict vs non-strict inequality errors; claiming "error equals 0.01" when only "at most" is supported
   (2025 BC5c, 2023 BC6b); not justifying the maximum of the (n+1)th derivative on the interval for Lagrange (2025);
   confusing "error" with "error bound" (2024, 2023).
4. **Taylor polynomial construction**: chain/product-rule errors in higher derivatives (2023 BC6a); wrong center
   (x = 0 instead of x = 1, 2025 BC5b); writing a series ("+ ...") when a polynomial was asked, which can forfeit the
   point (2025, 2023); wrong number of terms; equating f⁽⁴⁾(x) with f⁽⁴⁾(0) (linkage, 2023).
5. **Manipulating known series**: differentiating with respect to n, quotient rule on the general term, integrating
   instead of differentiating; not knowing f′ keeps the radius (2024 BC6c); geometric sum with the wrong first term
   (2025 BC6c); simplifying coefficients wrongly (2025 BC6b).

### Polar (BC2 2025, 2026)
6. **Polar area setup**: forgetting to square r(θ), dropping the ½, wrong θ limits (2025 BC2b; mean 3.09, lowest of
   the exam). CR advice: just-in-time review of precalculus polar (students forget it).
7. **Polar to rectangular**: not knowing x = r cos θ (distance from the y-axis) (2025 BC2c); rates in polar: using
   dr/dθ or dx/dt where the chain rule needs a different derivative (2025 BC2d); bald calculator answers without a
   setup (2025 BC2a).
8. **Classification**: candidates test used where a local classification was needed, or local argument where a
   global one was needed (2025 BC2c; 2026 SG).

### Parametric and vector motion (BC2 2023, 2024)
9. **Speed** written as |dy/dx| (2024 BC2), or speed evaluated when the task was to solve speed = k for t (2023);
   velocity given when acceleration was asked; x and y components swapped (2023).
10. **Position from velocity**: initial condition subtracted instead of added, reversed or wrong limits, missing dt,
    indefinite integral (2023, 2024); distance integrand miscopied (missing squares or parentheses) (2024).
11. **Direction/monotonicity**: using the sign of dy/dx instead of dy/dt to say y is decreasing (2024 BC2d);
    tangent line without stating its slope or at the wrong t (2023); TRACE instead of a solver, rounding to fewer
    than three decimals (2023, 2024).

### Units 6-8 BC techniques (BC5)
12. **Improper integrals**: dropping limit notation mid-solution, "arithmetic with infinity" (2023 BC5b; 2026 SG
    requires correct notation); negative-exponent antiderivative errors (2023).
13. **Integration by parts**: wrong u/dv, sign errors, bounds missing on uv or ∫v du, multiplying two
    antiderivatives (2023 BC5c, 2024 BC5d). CR advice: label u and dv explicitly; tabular allowed.
14. **Euler's method**: wrong step size or slope formula, wrong starting value, a third step added, unclear table
    (2024 BC5c, 2025 BC5d). Simplification is not required, so arithmetic simplification only costs points.
15. **Arc length**: interpretation missing the interval or the graph reference (2024 BC5b); integrand form wrong
    (2026 SG). CR advice: compare the y = f(x) and parametric arc length formulas side by side.

### Cross-cutting (shared with AB, still the top losers for BC)
Linkage errors (= between unequal things), vague "it"/"the function", missing hypotheses for IVT/MVT/EVT, local vs
global extrema, missing setups on calculator work. Full list in the AB file section 8; 2023-2025 BC1/BC3/BC4
reports repeat them for BC takers.

**Five biggest BC-specific point losers (judgment from means and repetition):** (1) interval of convergence
endpoints and radius vs interval; (2) error bounds (which bound, conditions, inequality wording); (3) polar area
setup (square, ½, limits) and polar-to-rectangular conversions; (4) parametric speed/position (|dy/dx|, initial
condition, dt); (5) Taylor coefficients from messy derivatives and center errors.

---

## 8. CR advice worth building into the BC course

- Series-test graphic organizer built by the student, with each test's conditions (CED 10.2-10.8 activity; 2025 CR).
- Endpoint drills where the ratio test is deliberately inconclusive and students must pick another test.
- Side-by-side "alternating series error bound vs Lagrange error bound" practice, with when each applies (2025, 2024).
- Model sentences: "error ≤ (value) < (given number)" with the conditions stated (CED Unit 10 exam prep note).
- Just-in-time precalculus polar review before 9.7 (2025 CR); students draw polar curves from tables (CED 9.8
  activity, including limaçons, roses, cardioids).
- Leibniz notation for parametric derivatives; second derivative as d/dt(dy/dx) ÷ dx/dt (CED Unit 9 opener).
- Euler tables with labeled columns (x, y, slope, Δx) (2024 CR).
- Require explicit u and dv (2024 CR); limit notation carried to the end for improper integrals (2023 CR).

---

## 9. Implications for a course built on AB (for the spec)

- Reuse: all 81 AB topics; add 30 BC topics. BC weights cut Units 1-5 and 8 relative to AB, so BC students need
  AB review compressed, not dropped (AB content is ~60% of the BC exam).
- New "Math you need" items: polar coordinates and polar graphs, parametric equations, vectors (components,
  magnitude), sequences and summation notation, factorials (CED prerequisites sentence).
- New FRQ trainers: series/Taylor (BC6), parametric/vector motion and polar (BC2), BC5 mixed technique.
- New `expr`-style grading needs: power series general terms, intervals with open/closed endpoints, vectors as
  ordered pairs, polar area integrals.
- Exam mock: 42 MCQ (29/13) with a BC mix; FRQs Q1/Q3/Q4 can reuse AB FRQ stock written to BC difficulty.

---

## 10. Open uncertainties

1. Share of BC-only vs AB-content MCQs in 2027 (only "about 60% AB" overall is official).
2. 2026 BC taker count (official page lists none; ~171k is third party) and 2026 FRQ means and CR report (not
   posted; URLs errored on 2026-10-31).
3. 2026 AB subscore distribution (not posted).
4. Raw-score cut points and 2027 scaling with 42 MCQs (never published).
5. Course at a Glance (BC) PDF not read; BC class periods for Units 1-8 not individually re-read.
6. CR error lists were read through a summarizing fetch tool; check exact wording in the PDFs before quoting.
7. Whether "linear partial fractions" excludes repeated linear factors is our reading of EK FUN-6.F.1 ("linear,
   nonrepeating"), not a separate exclusion statement.
