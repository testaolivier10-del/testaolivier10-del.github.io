# AP® Statistics authoring guide

Rules for writing AP® Statistics content, adapted from `docs/apcalc-authoring-guide.md`. They come from
`docs/apstat-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/apstat-architecture.md` ("Content formats"). The research is in `docs/apstat-research/framework.md`
(section 6 lists where students lose points; every rule below that names an error comes from there).

## Before you write a topic

1. Find the topic in `docs/apstat-dependency-map.json`: its id, CED number, skills and the concepts it owns.
   Read its entry in `docs/apstat-ced-map.json` and write it in your own words.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. **This holds for notation**:
   `$\hat{p}$`, `$\bar{x}$`, `$H_0$`, `$\chi^2$`, `$P(A \mid B)$` count as using the sample proportion, the
   sample mean, a null hypothesis, chi-square, conditional probability.
3. Write `statistics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-apstat-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apstat-map.mjs --check`. The placeholder fixture
   `scripts/test/fixtures/apstat-data/questions/test-one-mean.json` shows every item type in working form
   (numeric with `from`, interval, setup, conclude, a probability set); it is placeholder content, never a
   model for wording.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board questions, AP
  Classroom items, the CED's text or any textbook. Use the CED, the reference sheet, scoring guidelines and
  Chief Reader Reports for scope and the errors to target. Invent your own studies, data and contexts.
- **Data.** Invented data must be plausible for its context (heights in a real range, proportions that make
  sense) and say it is invented when it could be mistaken for a real study. Never attribute invented results
  to a real organization.
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Statistics exam").
  Never "AP" alone, plural, possessive, or in a URL, id, file name or meta description.

## Scope: the revised 2026-27 course only

Nothing below appears in an item, FRQ or required step (the content check refuses their terms in items). Notes
may mention one in a `going-further` aside.

- The geometric distribution.
- Combining random variables (mean and SD of X + Y or X − Y, linear transformations of random variables
  beyond a change of units in data).
- The chi-square goodness-of-fit test (homogeneity and independence stay).
- Transformations to achieve linearity (logs, powers).
- Inference for the slope of a regression line.
- Pooled two-sample t procedures (confirmed: the 2026 reference sheet gives only the unpooled SE for
  means); anything requiring calculus.
- The normal approximation to the binomial (not found in any readable official text; needs-author
  `ced-text`). Binomial probabilities are exact (formula or technology).

The 10% condition **is** in the course (the CED's Unit 4 overview names it): check it whenever sampling
is without replacement, and keep it apart from the random condition (confusing the two is a common
error the CED names). The slope formula $b = r\frac{s_y}{s_x}$ is not on the 2026 reference sheet; teach
it in 5.5 as a relationship, and give slope and intercept from computer output in items.

## Notation

Math is TeX between dollar signs, as AP® Calculus AB; in JSON every backslash is doubled.

- Statistics vs parameters, always kept apart: $\bar{x}$, $s$, $\hat{p}$, $r$, $b$ for samples; $\mu$,
  $\sigma$, $p$, $\rho$, $\beta$ only for populations (and $\beta$ only as P(Type II error) in this course).
- Subscripts name the group: $\hat{p}_1$, $\mu_{\text{new}}$, $\mu_d$ for a mean difference (paired).
- Hypotheses: $H_0: p = 0.5$, $H_a: p > 0.5$, with "where $p$ is the true proportion of all ..." right after.
  Never hypotheses about statistics ($H_0: \hat{p} = 0.5$ is wrong).
- Probability: $P(A \cap B)$, $P(A \cup B)$, $P(A \mid B)$, $P(A^c)$; a random variable is a capital letter
  defined in words ("Let $X$ = the number of ...").
- Intervals are written "from 0.41 to 0.53" or "(0.41, 0.53)", never "0.41-0.53" (Bluebook reads the hyphen
  as subtraction).
- Words and units inside math with `\text{}`; units outside math where possible.

## Showing work: expression, substitution, answer

The CED asks every calculation to show the formula's structure, the values substituted and the answer.
Every worked example and every explanation of a computed key does all three:

- $\text{SE} = \sqrt{\frac{p_0(1 - p_0)}{n}} = \sqrt{\frac{0.5(0.5)}{400}} = 0.025$, then $z = \frac{0.47 - 0.5}{0.025} = -1.2$.
- Distributions: name it, give its parameters, mark the boundary and direction. "X is binomial with
  $n = 10$, $p = 0.3$; $P(X \ge 4) = 1 - P(X \le 3) = 0.350$." For the normal, a labelled sketch with the
  shaded region.
- Use `setup` items when the expression is the point (a test statistic, a margin of error, a binomial
  probability); set `mustUse` to what the reader reports say students drop (p₀ in a test's SE, n − 1).

## Tables and technology

The exam allows a graphing calculator in both sections and gives Tables A (normal), B (t) and C (χ²).

- Key every numeric answer at full technology precision (the generator stores the value from `ApStatDist`
  through `from`; never type a rounded key by hand). The grader accepts the table route too.
- Explanations show the formula route first and then name the technology route in words ("a 1-proportion z
  test gives z = −1.20, p = 0.115"), never a brand's key sequence. Calculator output alone ("normalcdf(...)")
  is not work: label the distribution, parameters and bounds in words, as the CED asks.
- t procedures: use technology df (Welch) for two samples and say the conservative df (smaller n − 1) is
  also accepted; Table B rows are rounded down.
- Rounding: carry full precision; report probabilities and p-values to 3-4 decimals, test statistics to 2,
  intervals to the data's precision plus one place.
- Simulation: when a question uses simulation, show the dotplot of simulated results and count the dots at or
  beyond the observed value; the estimated probability is that count over the number of trials.

## Writing conclusions in context

This is where students lose the most points. Every conclusion, interpretation and explanation in lessons,
notes, explanations, FRQ samples and model answers follows these templates exactly, so students copy good
habits.

**A significance test (four parts).**
1. Compare: "Because the p-value of 0.012 is less than α = 0.05, we reject $H_0$." (Name both numbers and the
   inequality; for p > α, "fail to reject $H_0$".)
2. Evidence: "There **is convincing evidence** that ..." or "There **is not convincing evidence** that ...".
3. Direction and parameter: "... **the true proportion of all** district voters who support the bond **is
   greater than** 0.5." Match $H_a$'s direction word.
4. Context: the population and variable named in the question's words.
Never: "accept $H_0$", "prove", "$H_0$ is true", "there is no difference", a conclusion about $H_0$'s truth, or
a conclusion about the sample ("the sample proportion is greater").

**A confidence interval.** "We are 95% confident that the interval from 0.41 to 0.53 captures the true
proportion of all ... ." **The level:** "If we took many random samples of this size and built a 95%
interval from each, about 95% of the intervals would capture the true proportion." Never "95% of the data",
"95% chance the true proportion is in this interval", or anything about the sample mean.

**A claim from an interval.** "Because every value in the interval is greater than 0.5 (or: 0.5 is in the
interval), the interval gives (does not give) convincing evidence that ..."

**A p-value.** "Assuming the true proportion is 0.5, there is a 0.012 probability of getting a sample
proportion of 0.56 or more by chance in a random sample of 400." Condition on $H_0$, name the statistic,
direction, sample size and context.

**Type I and Type II errors.** Conditional clause first: "A Type I error would occur if the true proportion is
0.5 but we find convincing evidence that it is greater than 0.5", then the consequence in context.

**Conditions (in words, with numbers).** Random: "The problem says a random sample of 400 voters." 10%:
"400 is less than 10% of all voters in the district." Large counts: "$n p_0 = 200 \ge 10$ and
$n(1 - p_0) = 200 \ge 10$" (use $p_0$ for a test, $\hat{p}$ for an interval; 10 as the threshold, and say 5 is
also seen). Normal for means: the population is normal, or $n \ge 30$ by the CLT, or a graph of the sample
shows no strong skew or outliers (say which graph and what it shows). Never "n ≥ 30" for proportions.

**Describing a distribution.** Shape, center, spread, unusual features, all in context with numbers: "The
distribution of commute times is skewed right with a median of 22 minutes, an IQR of 15 minutes, and one high
outlier at 95 minutes." Comparisons use comparative words ("greater median", "more variable") for every
feature. A boxplot cannot show modality or gaps; never call a boxplot "normal".

**Regression.** Slope: "For each additional hour of study, the predicted score increases by about 3.2 points."
Intercept only when x = 0 makes sense. $r^2$: "About 64% of the variation in score is accounted for by the
linear model using hours." Residual: actual minus predicted, with its sign meaning. $s$: the typical prediction
error, in the response's units. Correlation is not causation unless the data come from a randomized
experiment.

**Scope of inference.** Random sampling allows generalizing to the population; random assignment allows a
cause-and-effect conclusion. Say which one the study has, and so what it allows.

## Questions

- Every item carries `unit`, `topic`, `practice` (`"4.F"`) and its type.
- **Four options** for single-answer items, similar lengths, distractors from real errors (the reader-report
  list), each option's explanation naming the error by content, never by letter.
- At least 60% apply/analyze. At least 40% of a topic's items in stimulus sets sharing a data display or study
  description. Units 2 and 5 also write **exam sets** of exactly 3 items (`set: "probability"`,
  `set: "regression"`), at least 4 sets per relevant unit.
- Every unit mixes representations: tables, dotplots, histograms, boxplots, scatterplots, two-way tables,
  written study descriptions.
- Numeric items use `kind` and `from` (the key is recomputed by `ApStatDist`; a typed key that disagrees fails
  the check). Give `alpha` on every p-value item. Add 2-3 `mistakes` from real slips: p̂ instead of
  p₀ in a test's SE; dividing by n instead of n − 1; one-sided p doubled or not; using z* for means; P(X = 4)
  for P(X ≥ 4); "fewer than 3" as P(X ≤ 3).
- Conclusion items (`conclude`) for every inference topic and every interpretation skill (4.C, 4.D, 4.F, 4.G);
  builder distractors are the forbidden wordings above, each with its `why`; every one has a `model` sentence
  that follows the templates above (the check runs its own flags on it).
- No `calc` flag (a calculator is allowed everywhere) and no `expr` items (use `setup`).

## FRQs: the 10-point analytic style

Four types, in exam order, 10 points each with one rubric line per point, accepted wordings for each line, a
full-credit sample typed as Bluebook allows, task verbs in bold (Identify, Describe, Calculate, Construct,
Justify, Interpret, Explain, Determine).

| Type | Shape | Points go to |
|---|---|---|
| `collect` (Q1) | a study described in words | an investigative question; sampling method named and justified; bias with its direction; a randomization or sampling procedure that someone else could follow; scope of inference |
| `analyze` (Q2) | data displays and summaries | a display built or read; summary statistics; describing and comparing distributions in context; z-scores or relative position; a claim justified from the numbers |
| `inference` (Q3) | one complete test or interval | procedure named; parameter defined in context; hypotheses; conditions in words; the statistic and p-value (or interval) with the expression shown; conclusion in context |
| `multi` (Q4) | several content areas, one context | probability or distribution work; a regression or two-way table piece; an inference or design idea extended to a new situation |

The 10-point line split is our estimate until scoring guidelines are released (needs-author `frq-scoring`).

## Level and voice

- From Algebra 1, for a student whose class moved too fast. Short sentences, active voice, "you". A concrete
  study first (real-looking context, a picture of the data), then the idea, then the formula.
- Every lesson has a plot drawn from its data (`plot` spec), never an approximation.
- A worked example, in `<div class="worked">`, before any new calculation or writing type, with words beside
  the math and the conclusion written out in full.
- Explain why before how: why n − 1, why p₀ in a test, why random assignment lets you claim cause.

## Contested or uncertain points

Add them to `docs/apstat-needs-author.md` instead of guessing. Every unit gets an independent accuracy check
before it is published, with every numeric key recomputed by code.
