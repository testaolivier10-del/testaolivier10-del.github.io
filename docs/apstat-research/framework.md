# AP Statistics framework research (as of 2026-10-17)

Purpose: source facts for building an online AP Statistics course on LevlPrep. Paraphrased; no exam questions or CED
text reproduced. **The course was revised for 2026-27** (nine units became five, the free-response section was rebuilt,
the exam went fully digital), so most books, Khan Academy and older practice tests describe the old course. Everything
below is the revised course unless marked "old".

Access note: shell egress to collegeboard.org is blocked (proxy 403) and Firecrawl had no credits, so pages were read
through WebFetch text extraction. The CED extraction stops at about 110k characters (read at offsets 0, 40k and 100k):
it covers Units 1 and 2 in full (all 25 topic titles), the Course at a Glance for Unit 3 (all 15 titles) and the
overviews of Units 4 and 5. **Phase 0 check (2026-10-17):** the official student course page
(apstudents.collegeboard.org/courses/ap-statistics) lists a subset of every unit's topic titles, and the reference
sheet PDF was read in full. With those, **every topic title is now official except 4.3, 4.5, 4.9 and 5.4**, which three
third-party sites that follow the 2026-27 course agree on (Fiveable, num8ers, OnePrep). Per-topic sources are in
`docs/apstat-ced-map.json` (`source`); what is still unread is in `docs/apstat-needs-author.md` (`ced-text`).

Key official URLs
- Course page: https://apcentral.collegeboard.org/courses/ap-statistics
- Revisions page (what changed for 2026-27): https://apcentral.collegeboard.org/courses/ap-statistics/future-revisions
- Student exam page ("About the Exam"): https://apstudents.collegeboard.org/courses/ap-statistics/assessment
- Student course page (date, unit weights): https://apstudents.collegeboard.org/courses/ap-statistics
- CED (revised, 4.13 MB): https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-and-exam-description.pdf
- Course overview PDF: https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-overview.pdf
- Course at a Glance: https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-at-a-glance.pdf (not read)
- Reference information (formulas and tables, © 2026): https://apcentral.collegeboard.org/media/pdf/ap-statistics-formula-tables-sheet.pdf
- Digital response guidelines: https://apcentral.collegeboard.org/media/pdf/ap-statistics-digital-response-guidelines.pdf
- Exam dates: https://apcentral.collegeboard.org/exam-administration-ordering-scores/exam-dates
- 2025 Chief Reader Report (old format): https://apcentral.collegeboard.org/media/pdf/ap25-cr-report-statistics.pdf
- 2025 scoring statistics: https://apcentral.collegeboard.org/media/pdf/ap25-statistics-scoring-statistics.pdf
- 2025 score distribution: https://apcentral.collegeboard.org/media/pdf/ap25-statistics-score-distributions.pdf

---

## 1. What changed for 2026-27 (revisions page)

- **Prerequisite**: first-year algebra only (the second-year algebra prerequisite was removed). The course is described
  as equivalent to a one-semester, non-calculus college introductory statistics course.
- **Added**: topics on investigative questions (Practice 1, Formulate Questions; topics 1.1 and 1.10).
- **Removed** (do not teach as assessed content): analyzing departures from linearity (old 2.9, transformations),
  combining random variables (old 4.9), the geometric distribution (old 4.12), the chi-square goodness-of-fit test (old
  8.2-8.3), and all of old Unit 9, inference for the slope of a regression line.
- **Units**: old Units 1-8 consolidated into 5 units (section 2). Rationale given: align with introductory college
  statistics and free time for depth.
- **Exam**: fully digital in Bluebook (no paper free-response booklets); MCQ 40 → 42 questions with 4 options (was 5);
  FRQ 6 → 4 questions, 10 points each (was 4 points each). Section 3.
- AP Classroom has one new practice exam; other resources are being updated during 2026-27.

## 2. Units, weights and topics

Weights are for the multiple-choice section (course page and student page agree). Class periods from the CED.

| Unit | Title | MCQ weight | Periods | Topics |
|---|---|---|---|---|
| 1 | Exploring One-Variable Data and Collecting Data | 20-30% | ~26 | 13 |
| 2 | Probability, Random Variables, and Probability Distributions | 15-25% | ~24 | 12 |
| 3 | Inference for Categorical Data: Proportions | 15-25% | ~30 | 15 |
| 4 | Inference for Quantitative Data: Means | 10-20% | ~18 | 10 |
| 5 | Regression Analysis | 10-20% | ~9 | 5 |

55 topics in all. Note the reordering against the old course: two-way tables (old 2.x) open Unit 2; the normal
distribution (old 1.10) and sampling distributions with the Central Limit Theorem move into Unit 2; regression (old Unit
2) is now the last unit and has no inference.

### Unit 1 (CED text; skills in brackets)
- 1.1 Introducing Statistics: What Can We Learn from Data? [1.A, 2.A]. A study uses a sample to answer a question about
  a population; results are stated in context.
- 1.2 Variables [2.A]. Observational units, variables, parameter vs statistic; categorical vs quantitative; discrete vs
  continuous.
- 1.3 Tabular Representation and Summary Statistics for One Categorical Variable [3.A, 4.A]. Frequency and relative
  frequency tables.
- 1.4 Graphical Representations for One Categorical Variable [3.A, 4.A, 4.B]. Bar charts, pie charts.
- 1.5 Graphical Representations for One Quantitative Variable [3.A]. Histograms (bin width matters), stemplots,
  dotplots.
- 1.6 Descriptions for One Quantitative Variable Distributions [4.A, 4.B]. Shape (skew, symmetric, unimodal, bimodal,
  uniform), center, spread, unusual features (outliers, gaps, clusters), in context.
- 1.7 Summary Statistics for One Quantitative Variable [3.B, 4.A, 4.B]. Mean, median, quartiles, percentiles, range,
  IQR, sample SD and variance. Outlier rules: beyond 1.5 × IQR from the quartiles, or more than 2 SD from the mean.
  Effects of changing units; resistant (median, IQR) vs non-resistant (mean, range, SD).
- 1.8 Graphical Representations of Summary Statistics for One Quantitative Variable [3.A, 4.A]. Five-number summary,
  boxplots with outliers marked; mean vs median and skew.
- 1.9 Comparisons of the Distributions for One Quantitative Variable [3.B, 4.A, 4.B, 4.C]. Comparing groups; z-scores
  (value minus mean, over SD; sample values when parameters are unknown).
- 1.10 The Investigative Question Revisited and Data Collection [1.A, 2.A, 2.B]. A good investigative question names
  the variable, the parameter and analysis type, the population and the kind of conclusion (causal only with random
  assignment). Census, experiment, observational study (prospective, retrospective), survey; confounding.
- 1.11 Random Sampling [2.A, 2.B]. With and without replacement; simple random, stratified, cluster, systematic.
- 1.12 Potential Problems with Sampling [2.A]. Voluntary response, undercoverage, nonresponse, response bias;
  nonrandom methods introduce bias.
- 1.13 Experimental Design [2.A, 2.B]. Two or more treatments (control or placebo allowed), random assignment,
  replication, control of other variables; single and double blind; completely randomized, randomized block, matched
  pairs; volunteers limit generalization.

### Unit 2 (CED titles and skills, all 12 read in the CED text; learning objectives read for 2.1 only)
- 2.1 Tabular and Graphical Representations for the Distributions of Two Categorical Variables [4.A, 4.B]. Two-way
  tables, side-by-side and segmented bar charts, mosaic plots; association.
- 2.2 Summary Statistics for Two Categorical Variables [3.B, 4.A, 4.B]
- 2.3 Estimating Probabilities Using Simulation [3.C]
- 2.4 Introduction to Probability [3.C]
- 2.5 Mutually Exclusive Events [4.B]
- 2.6 Conditional Probability [3.C]
- 2.7 Independent Events and Unions of Events [3.C]
- 2.8 Introduction to Random Variables and Probability Distributions [3.A]
- 2.9 Parameters of Random Variables [3.B, 4.D] (mean and SD of a discrete random variable)
- 2.10 The Binomial Distribution [3.C, 3.D, 4.B, 4.D]
- 2.11 The Normal Distribution [3.C, 3.D, 4.C] (standard normal, empirical rule)
- 2.12 Sampling Distributions and the Central Limit Theorem [4.C]

CED work-shown rules quoted in the extraction (they drive our grading): a probability calculation shows an expression
with its structure, the values substituted, and the answer; a distribution calculation names the distribution, labels
the parameters and the boundary value, and shows the direction (for example a labelled sketch or
`P(X ≥ 4)` with X binomial, n = 10, p = 0.3).

### Unit 3 (CED Course at a Glance titles; 7 of 15 also on the official student page)
3.1 Estimators; 3.2 Sampling Distributions for Sample Proportions; 3.3 Constructing a Confidence Interval for a
Population Proportion; 3.4 Justifying a Claim Based on a Confidence Interval for a Population Proportion; 3.5 Setting
Up a Test for a Population Proportion; 3.6 p-Values; 3.7 Carrying Out a Test for a Population Proportion; 3.8 Potential
Errors When Performing Tests (Type I, Type II, power); 3.9 Sampling Distributions for the Difference Between Sample
Proportions; 3.10 Constructing a Confidence Interval for the Difference Between Two Population Proportions; 3.11
Justifying a Claim Based on a Confidence Interval for the Difference Between Two Population Proportions; 3.12 Setting Up
a Test for the Difference Between Two Population Proportions; 3.13 Carrying Out a Test for the Difference Between Two
Population Proportions; 3.14 Setting Up a Chi-Square Test for Homogeneity or Independence; 3.15 Carrying Out a
Chi-Square Test for Homogeneity or Independence.

### Unit 4 [official for 7 of 10: 4.1, 4.2, 4.7 in the CED text; 4.4, 4.6, 4.8, 4.10 on the student page. 4.3, 4.5, 4.9 third party (Fiveable, num8ers, OnePrep agree)]
4.1 Sampling Distributions for Sample Means; 4.2 Constructing a Confidence Interval for a Population Mean or Population
Mean Difference; 4.3 Justifying a Claim Based on a Confidence Interval for a Population Mean or Population Mean
Difference; 4.4 Setting Up a Test for a Population Mean or Population Mean Difference; 4.5 Carrying Out a Test for a
Population Mean or Population Mean Difference; 4.6 Sampling Distributions for the Difference Between Two Sample Means;
4.7 Constructing a Confidence Interval for the Difference Between Two Population Means; 4.8 Justifying a Claim Based on
a Confidence Interval for the Difference Between Two Population Means; 4.9 Setting Up a Test for the Difference Between
Two Population Means; 4.10 Carrying Out a Test for the Difference Between Two Population Means.
(Matched pairs, "population mean difference", are taught with one-sample t procedures in 4.2-4.5.)
https://fiveable.me/ap-stats/unit-4/sampling-distributions-for-sample-means/study-guide/JcwkFAqbdjfLgHUdojkE

### Unit 5 [official for 4 of 5: 5.1, 5.2, 5.3, 5.5 on the student page (5.1, 5.3, 5.5 also in the CED text). 5.4 Residuals third party (Fiveable, num8ers agree)]
5.1 Graphical Representations Between Two Quantitative Variables; 5.2 Correlation; 5.3 Linear Regression Models; 5.4
Residuals; 5.5 Least-Squares Regression. No transformations and no inference for slope.
https://www.lumisource.io/ap/statistics/unit5/review ; https://num8ers.com/?p=20190 ; https://fiveable.me/ap-stats/unit-5/residuals/study-guide/zdTJQZw0UVGswyK6kkEF ;
https://apstudents.collegeboard.org/courses/ap-statistics (official titles for 5.1-5.3, 5.5)

### Exclusions checklist (from the revisions page)
Not assessed, so no item, FRQ or required step uses them (a notes `going-further` aside may mention one): the
geometric distribution; combining random variables (sum and difference rules for means and variances of random
variables, so no question asks for the SD of X + Y); chi-square goodness of fit; transformations to achieve linearity;
inference for regression slope (t interval and test for β); old "departures from linearity" topics. The sampling
distribution formulas for p̂₁ − p̂₂ and x̄₁ − x̄₂ remain (they are on the reference sheet).

Phase 0 findings (2026-10-17):
- **10% condition: in the course.** The CED's Unit 4 overview names "the 10% condition" (confusing it with the
  randomization condition is listed as a common student error). Teach it with large counts in 3.2 and use it in every
  inference topic when sampling without replacement.
- **Pooled two-sample t: not in the course.** The 2026 reference sheet gives only the unpooled SE for x̄₁ − x̄₂; the
  only pooled quantity on the sheet is p_c for the two-proportion test. Two-sample t procedures are unpooled
  (technology df, conservative df accepted).
- **Normal approximation to the binomial: not found.** No mention in the readable CED text, the reference sheet, the
  revisions page or the student page. Still unverified (needs-author `ced-text`); do not test it.
- **b = r·s_y/s_x is not on the 2026 reference sheet** (only ŷ = a + bx), and neither is a formula for r.

## 3. Practices and skills (CED)

| Practice | MCQ weight | Skills |
|---|---|---|
| 1 Formulate Questions | 5-10% | 1.A determine a valid investigative question |
| 2 Collect Data | 20-30% | 2.A identify information to answer a question; 2.B justify an ethical method for gathering and representing data; 2.C identify appropriate inference methods; 2.D identify types of errors and relationships among components of inference; 2.E identify null and alternative hypotheses |
| 3 Analyze Data | 25-35% | 3.A construct tables and graphs; 3.B summary statistics, relative position, predicted responses; 3.C expected counts, percentages, probabilities, intervals; 3.D means, SDs and parameters of distributions; 3.E inference method results |
| 4 Interpret Results | 25-35% | 4.A describe and compare representations and summaries; 4.B justify a claim from calculations; 4.C describe distributions and relative positions; 4.D interpret calculations to assess meaning or a claim; 4.E justify a method by verifying conditions; 4.F interpret inference results; 4.G justify a claim from inference results |

## 4. Exam format, May 2027

Date: **Tuesday, May 11, 2027, Session 2 (afternoon)** (exam dates page; student course page). Total 3 hours, fully
digital in Bluebook, responses submitted automatically at the end.

| Section | Questions | Time | Weight | Notes |
|---|---|---|---|---|
| I Multiple choice | 42, 4 options each | 90 min | 50% | Discrete questions plus **two sets of 3 questions**: one on probability, random variables and distributions, one on regression analysis. All 5 units, all 4 practices. |
| II Free response | 4, 10 points each, equal weight | 90 min | 50% | Scored on an analytic scale with question-specific guidelines (replaces the old 0-4 E/P/I holistic scoring). |

The four free-response questions, in exam order (student exam page and course overview):
1. Multi-part, primarily Practices 1 and 2 (formulate a question, collect data: sampling methods, generalizability,
   design). The CED sample is a commuter survey with three regional sampling methods that also asks for an
   investigative question.
2. Multi-part, primarily Practices 3 and 4 (analyze and interpret data).
3. Inference: a hypothesis test or a confidence interval (Practices 2, 3, 4).
4. Multi-part across several content areas (Practices 2, 3, 4).

**The investigative task is gone** as a separate question: the old exam's Question 6 (investigative task, 25% of the FRQ
section) has no counterpart; Question 4 is the multi-focus question. No official per-question timing; third parties
suggest about 20-22 minutes each.

### Calculators and technology
- Calculators are permitted in both sections; students are expected to have a graphing calculator with statistical
  capabilities. The Bluebook app also has the built-in Desmos graphing calculator. Scratch paper is provided.
- FRQs minimize symbolic entry. Students type notation on a keyboard using the digital response guidelines: `mu`,
  `sigma`, `x-bar`, `p-hat`, subscripts with `_` (`p-hat_1`, `H_0`, `H_a`), `sqrt( )`, `^`, `/`, `+/-`, `<=`, `>=`,
  `!=`; write an interval as "from 2.5 to 5.5", never "2.5-5.5". Bluebook has no autocorrect; its symbols menu now
  includes common statistical symbols.
- Work shown: hypotheses with parameters defined in context, conditions checked, test statistic and p-value reported,
  conclusion in context; calculations shown as an expression (`(0)(0.04) + (1)(0.13) + ...`), not only a result.

### Reference information (provided in print and in Bluebook, © 2026)
- Digital entry tables: statistical notation, mathematical operations, sample inference results typed on a keyboard.
- Formulas: mean, sample SD, ŷ = a + bx; addition rule, conditional probability, mean and SD of a discrete random
  variable, binomial probability, mean np and SD √(np(1 − p)); standardized test statistic and confidence interval in
  general form; χ² statistic; sampling distributions for p̂, p̂₁ − p̂₂ (with the pooled SE using p_c), x̄ and x̄₁ − x̄₂
  (each with mean, SD and SE).
- Tables: A standard normal probabilities (z from −3.4 to 3.4, area below z); B t critical values (df 1-30, 40, 50, 60,
  80, 100, 1000, ∞; tail probabilities 0.25 to 0.0005, confidence levels 50% to 99.9%); C χ² critical values (df 1-30,
  40, 50, 60, 80, 100; the same twelve tail probabilities as Table B). Read in full 2026-10-17.
- No pooled t: the means formulas are unpooled only; the one pooled SE is p_c (two proportions, p₁ = p₂ assumed).
- Not on the sheet (students must know): formulas for b and r and r² (old sheets had b = r·s_y/s_x; the 2026 sheet
  does not), the 1.5 × IQR rule, z-score, the empirical rule, conditions (random, 10%, large counts, normal/large sample),
  degrees of freedom rules, interpretation wording.

## 5. Scores

- 2025 (old format): **267,690 students**; 5: 17.0%, 4: 21.4%, 3: 21.8%, 2: 15.9%, 1: 23.8% (3+ 60.2%).
  https://apcentral.collegeboard.org/media/pdf/ap25-statistics-score-distributions.pdf
- 2026 (old format): 17% fives, 62% 3+ [third party, Cognito; the official page was not read].
  https://cognito.org/blog/ap-score-distribution-2026
- No published cut scores; 2027 is the first year of the new format, so any composite-to-score mapping is a guess.

## 6. Where students lose points (2025 Chief Reader Report, old format)

Every 2025 FRQ mean was under half credit (scoring statistics: Q1 1.75, Q2 2.10, Q3 1.55, Q4 1.65, Q5 1.43, Q6 1.78, out
of 4). Errors named in the report, grouped by what the course must drill:

- **Describing and comparing distributions**: comparing centers without saying which is lower; calling a boxplot's
  center the mean; claiming "normal" or "unimodal" from a boxplot (it cannot show modality); wrong skew direction;
  range given as an interval; combined median found by averaging medians; IQR and range used without naming which.
- **Sampling language**: extraneous reasons (small sample, confounding) instead of "nonrandom, so not representative";
  procedures that say "use random numbers" with no process (label, generate, skip repeats, select).
- **Probability**: using dependent-event rules for independent selections; random variable defined as a thing ("rock
  songs") not a count in context; distribution and parameters not stated (n, p labelled); P(X ≥ 4) vs P(X = 4) slips;
  "fewer than 3" read as "3 or fewer"; expected value without weighting by probabilities; probability not tied back to
  the claim (likely or unlikely).
- **Inference**: nonstandard hypothesis notation; parameter not defined in context ("the true proportion of all ...");
  incomplete test names; conditions incomplete (no "random sample" in words, large counts with thresholds other than 5
  or 10, comparing n to 30 for proportions); p̂ instead of p₀ in the test's SE; wrong tail; wrong inequality comparing
  p to α; definitive conclusions ("proves", "accept H₀"); conclusion about H₀ instead of Hₐ; a two-sample setup for a
  one-sample question; a right-tailed Hₐ chosen because of the sample result; Type I error defined without the
  conditional clause ("when H₀ is true") or confused with Type II; interpreting a p-value inside the test; using a
  confidence interval as if it were the test's conclusion.
- **Communication**: missing context, unlabeled work, answers not checked for reasonableness.

Report recommendations worth building in: "convincing evidence for Hₐ" language; a 2 × 2 table for error types;
writing events in words before computing; peers following a written sampling procedure exactly; linking confidence
intervals to tests.

## 7. URLs not read (permission timeouts or blocked)

https://apcentral.collegeboard.org/courses/ap-statistics/exam ;
https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-at-a-glance.pdf (permission timeout again in Phase 0;
the printable poster too);
https://apstudents.collegeboard.org/about-ap-scores/score-distributions/ap-statistics ; fiveable.me/ap-stats ;
lumisource Units 1 and 4; oneprep.co Units 3 and 5. The CED PDF text past about 110k characters (Units 2-5 topic pages)
is out of WebFetch's reach. A person should read the CED Units 2-5 topic pages for learning objectives and any
exclusion statements before content authoring (needs-author `ced-text`).
