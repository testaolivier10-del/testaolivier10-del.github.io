# AP Statistics Phase 3 accuracy review

**Scope and method.** Independent review of `statistics/data/justify/unit-1.json` to `unit-5.json` (36 prompts, with their `conclude` builder slots), `statistics/data/exams/items.json` (26 items and 3 stimuli), and the `EQ`, `NOT_ON` and `TABLES` lists in `scripts/lib/apstat-entry.mjs`. I read each file in full, recomputed every number with `Dist` from `scripts/lib/apstat-mathlib.mjs` (including every distractor value against the slip its explanation names), and checked wording against the "Writing conclusions in context" and "Scope" sections of `docs/apstat-authoring-guide.md`. I also scanned all student-facing strings for em dashes, en dashes and hyphens used as punctuation (none found; the only spaced hyphens are minus signs). No file other than this one was edited.

**Result:** no errors (no wrong key, number or statement). Two fixes and nine optional notes.

## Findings

| id | severity | what is wrong | exact fix |
|---|---|---|---|
| F1 | fix | `u2-simulation-evidence`: the context says "A teacher claims a quiz's 10 true or false questions have random answers", which is muddled. The data are also implausible. A guesser has P(9 or more of 10) = 11/1024 = 0.0107, so 7 of 200 simulated guessers (3.5%) is very unlikely (P(7 or more) is about 0.006). A strong student who computes the exact value will see that the simulation contradicts it. | Rewrite the context: "A student says he guessed on every question of a 10 question true or false quiz, so each answer had probability 0.5 of being right. He got 9 right. A teacher simulates 200 guessers; 2 of the 200 simulated guessers got 9 or more right." Then change 7 to 2, $\frac{7}{200} = 0.035$ to $\frac{2}{200} = 0.01$, and "3.5%" to "1%" in the checklist and earns. Update `JUSTIFY_NUMBERS` in `scripts/lib/apstat-exams.mjs` to match. |
| F2 | fix | `stat-exam-1-10`, option 3 ("A chi-square test that the four news sources are equally popular") is a goodness-of-fit test, and option 3's explanation says "that test is not part of this course". The guide's Scope section bans goodness of fit from items, and the content check refuses its terms. | Replace the distractor with an in-scope one, for example "A two-sample t test for a difference in means", with the explanation "Both variables are categorical, so there are no means to compare." |
| N1 | note | `stat-exam-1-08`, option 2 explanation: 0.0061 is the p-value for z = 2.504, but the text says "$P(z > 2.50)$", which is 0.0062 (and 0.0062 is what Table A gives). | Write "the p-value for this test, about 0.006" and drop the exact z. |
| N2 | note | `stat-exam-1-03`, option 0: "diners who pay with cash do not get a receipt". The explanation says "no group of diners is left out", which the stem does not establish (it says every receipt carries the link, not that every diner gets a receipt). It is defensible, but a student could argue it. | Change the distractor to "Undercoverage: diners who order takeout are not invited, so the estimate is too low", and the explanation to "Nothing in the description says any group is not invited; the problem is who chooses to respond." Alternatively add "every diner receives a receipt" to the stem. |
| N3 | note | `stat-exam-2-08`: the key (1.51, pooled) and the unpooled distractor (1.52) differ by 0.01. Hand rounding of $p_c$ (for example 0.29) gives 1.50 or 1.52, so a correct student can land on the wrong option. | Change the counts so the two values separate, or add a note in the explanation that rounding $p_c$ early can move $z$ by 0.01. Optional. |
| N4 | note | `stat-exam-1-09`, option 3 explanation ends with a confusing parenthetical about homogeneity "but not independence". | Drop the parenthetical; keep "A test for independence uses one sample classified by two variables; here there are two separate samples." |
| N5 | note | `u4-scope-of-inference`: the earns answer and checklist say the gardener "can conclude that fertilizer A causes greater mean height", but the evidence is a p-value of 0.038 (the guide's evidence language). | "...so there is convincing evidence that fertilizer A causes greater mean height." Match the checklist line. |
| N6 | note | `u1-random-assignment-cause`: "generalize only to people like these volunteers" is vague. The conclusion strictly applies to the volunteers in the study. | "...so the conclusion applies only to volunteers like these, not to all adults." Change the same phrase in the checklist. |
| N7 | note | `u4-paired-claim`: the prompt asks whether the program "raises scores", but there is no comparison group, and the population of the 20 students is not named. The earns answer avoids causation correctly, but the checklist never asks for the caveat. | Change the prompt to "...convincing evidence that scores increase on average after the program", and name the population in the context ("Twenty randomly selected students from a school district"). |
| N8 | note | Meta-comments in student-facing "why" text: `u1-boxplot-shape` misses ("readers take this point away every year") and `u3-interval-interpret` earns ("the three parts readers look for"). The first is also unclear (it means readers deduct points). | Replace with "Points are lost for this on the exam every year" and "the three parts an exam answer needs". |
| N9 | note | `u3-type-errors` builder: the correct sentence reads "If the true proportion ... is 0.25, but the office finds convincing evidence..., that is a Type I error." The "but" after "If ..." is ungrammatical. | Use the condition "Suppose the true proportion ... is 0.25." and the claim "If the office finds convincing evidence that it is greater than 0.25, that is a Type I error." |

## Formulas page (`EQ`, `NOT_ON`, `TABLES`)

No errors. Every formula on the 2026 reference sheet is present and correct:

- Descriptive statistics: $\bar{x}$, $s_x$ (with $n-1$), $\hat{y} = a + bx$.
- Probability and distributions: the addition rule, conditional probability, the discrete mean and SD, the binomial $P(X=x)$, and the binomial mean $np$ and SD $\sqrt{np(1-p)}$.
- Inference: the general standardized test statistic, the general confidence interval, and $\chi^2$.
- Sampling distributions for $\hat{p}$ and $\hat{p}_1 - \hat{p}_2$: mean, SD and SE, plus the pooled SE with $p_c = \frac{n_1\hat{p}_1 + n_2\hat{p}_2}{n_1+n_2}$ (equal to the sheet's combined successes over combined size).
- Sampling distributions for $\bar{x}$ and $\bar{x}_1 - \bar{x}_2$: mean, SD and SE, with "never pooled" matching the scope rule.

The tables match: Table A (z from $-3.4$ to $3.4$, area to the left), Table B (df 1 to 30, 40, 50, 60, 80, 100, 1000 and infinity; upper tails 0.25 to 0.0005; confidence 50% to 99.9%; "use the next lower row" is the safe rule), and Table C (df 1 to 30, 40, 50, 60, 80, 100; same tail columns). The `NOT_ON` items are correct: the empirical rule, the $1.5 \times \text{IQR}$ fence, the df rules including the smaller $n-1$ for two-sample t, and the conditions (10 as the large counts threshold, in line with the guide). The `NOT_ON` and `TABLES` text uses no excluded topic.

## Recomputed and confirmed correct

- **Unit 1:** commute IQR 15, range 87, fence 52.5; clinic IQRs 24 and 13, ranges 62 and 36 (and neither clinic's far end passes its fence); bike IQR 120, fence 420.
- **Unit 2:** $P(X \le 3)$ for binomial(10, 0.3) = 0.6496, so 0.3504; $P(X \le 12)$ for binomial(20, 0.8) = 0.0321; $\frac{20}{80}$ and $\frac{20}{120}$; $0.40(0.25) = 0.10$ and $\frac{0.15}{0.40} = 0.375$; $z = 1.40$ with right area 0.0808; $\frac{7}{200} = 0.035$ (the arithmetic is right, the plausibility is F1).
- **Unit 3:** $\hat{p} = 0.302$ with 95% interval 0.2618 to 0.3422; $z = 2.40$, p-value 0.0082; $\chi^2 = 14.6$, df 6, p-value 0.0236 (df = $(3-1)(4-1)$); large counts 75 and 225.
- **Unit 4:** $t^* = 2.110$ (df 17), interval 11.62 to 12.18; $t = -2.222$ (df 24), p-value 0.0180; two-sample $t = 1.823$, Welch df 37.34, p-value 0.038.
- **Unit 5:** $54.3 + 3.2(6) = 73.5$ and residual 7.5; $54.3 + 3.2(25) = 134.3$; the intercept interpretation uses a weight of 0 pounds (x is in thousands of pounds, so $x = 0$ means 0 pounds).
- **Builder slots (all 12 with `conclude`):** each has exactly one correct option, a `why` for every wrong option, and the correct options assemble a correct sentence.
- **Exam items 1-01 to 1-13:** all keys and distractors recomputed. $P(X \ge 3) = 0.2654$ with distractors 0.0959 ($X > 3$), 0.1696 ($X = 3$) and 0.7346; mean 1.8 and SD 1.2586 (variance 1.584, $\sqrt{p(1-p)} = 0.325$); egg $z = 1.556$ with areas 0.0599, 0.0228 (the 0.025 distractor), 0.3648 and 0.9401; $z = 2.504$ against 2.520 (unpooled SE) and 0.112; interval 28.02 to 34.78 with $z^*$ distractors; the mean and difference interval for item 13.
- **Exam items 2-01 to 2-13:** 0.45, 0.225, 0.30, 0.75; union 0.575, 0.80, 0.225, 0.35; interval 0.301 to 0.379 with distractors from $z^* = 1.96$, 1.282 and the misplaced $n$; pooled $z = 1.506$ against unpooled 1.517 and 1.066 (sum of SEs); $t = -1.833$, one-sided p-value 0.0433, two-sided 0.0867, complement 0.957; $24.60 - 1.85(6) = 13.50$ and its distractors; $r = -\sqrt{0.792} = -0.890$; the regression output is internally consistent (SE of the slope 0.22 follows from $S = 1.92$, $R^2 = 0.792$ and $n = 20$).
- **Wording:** every conclusion, interval and level interpretation, p-value interpretation, Type I and Type II statement (conditional clause first), condition check and regression interpretation in the earns answers meets the guide's templates, and every misses answer genuinely misses at least one checklist line. No excluded topic appears in a prompt, except the F2 distractor.

## Fixes applied (by the Phase 3 author, after this review)

All eleven findings were applied as written; the content check and `scripts/test/apstat-exams.test.mjs` pass after them.

- F1: `u2-simulation-evidence` rewritten (the student's claim; 2 of 200 simulated guessers, 0.01, about 1%); `JUSTIFY_NUMBERS` shows 2/200 and checks that the exact binomial P(9 or more of 10) is under 0.02, so the simulated count stays plausible.
- F2: `stat-exam-1-10` distractor is now "A two-sample t test for a difference in means" (both variables categorical).
- N1, N2, N4: explanations and the takeout undercoverage distractor as suggested.
- N3: `stat-exam-2-08` counts changed to 70 of 250 and 30 of 150, so $p_c = 0.25$ exactly; key $z \approx 1.79$, unpooled 1.85, summed SEs 1.28, raw difference 0.08 (all recomputed in `EXAM_NUMBERS`).
- N5 to N9: wording as suggested (evidence language for the causal claim, "volunteers like these", the district population and "increase on average after the program", no reader meta comments, the Type I builder reads "Suppose ... . If ..., that is a Type I error.").
