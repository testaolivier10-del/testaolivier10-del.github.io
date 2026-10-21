# AP® Statistics course: spec and status

The source of truth for LevlPrep's eighth course. A fresh session reads this file, `CLAUDE.md`,
`docs/apstat-research/framework.md` and `docs/apstat-research/market.md`, not the chat history. When the
plan changes, update this file in the same commit. Open points for a person go in
`docs/apstat-needs-author.md`. Formats: `docs/apstat-architecture.md`; writing rules:
`docs/apstat-authoring-guide.md`; map and the CED check: `docs/apstat-phase0.md`; briefs for Phases 1, 2
and 4: `docs/apstat-briefs/`.

Course key `apstat` (storage, analytics, registry, SQL). URL path `/statistics/`. Every new browser global
starts with `ApStat`. Question ids start `stat-`, CSS classes `stat-`. Template: the AP® Calculus AB course
(`docs/apcalc-spec.md`, `docs/apcalc-architecture.md`, `docs/apcalc-authoring-guide.md`), the newest fork,
with its build-time math, expression parser and one-set-of-files-per-trainer layout.

## 1. Owner brief (2026-10-17), condensed

- Eighth course. Chosen because about 267,000 students took AP® Statistics in 2025, answers can be checked by
  code (important while no expert has reviewed any course), and simulators fit the site's interactive bar.
- Build it the same way as AP® Calculus AB: research, build everything, independent accuracy reviews, one PR
  the owner reviews.
- Tools at the bar of the NREMT interactive body map: interactive, visual where useful, simple on landing,
  extra detail revealed progressively, professional illustration quality, easy to read on a phone.
- Every course feels the same: shared components and the same page set (glossary, notes/textbook, lessons,
  practice, review, exams, FRQs, justify-style trainer, cram kit, dashboard, flashcards, free unit practice
  tests, formulas page). **No score calculator** (the owner judged those low yield).
- Premium pass $25 one-time through 30 June 2027; the founding discount applies as for the other passes.
- Beta, with "not yet reviewed by an AP® Statistics teacher". Trademark rules as the other AP® courses.

## 2. What the research says (details and URLs in `docs/apstat-research/`)

**The course was revised for 2026-27.** Nine units became five; prerequisite is now Algebra 1. Removed:
the geometric distribution, combining random variables, chi-square goodness of fit, transformations
(departures from linearity) and all inference for regression slope. Added: investigative questions
(Practice 1). Most books, Khan Academy and old practice tests still teach the old course.

**Framework.** 5 units, 55 topics, MCQ weights: U1 Exploring One-Variable Data and Collecting Data 20-30%
(13 topics), U2 Probability, Random Variables, and Probability Distributions 15-25% (12; two-way tables,
probability, binomial, normal, sampling distributions and the CLT), U3 Inference for Categorical Data:
Proportions 15-25% (15; one and two proportions, error types, chi-square homogeneity and independence), U4
Inference for Quantitative Data: Means 10-20% (10; one-sample and paired t, two-sample t), U5 Regression
Analysis 10-20% (5; scatterplots, correlation, LSRL, residuals; no inference). Practices: 1 Formulate
Questions 5-10%, 2 Collect Data 20-30%, 3 Analyze Data 25-35%, 4 Interpret Results 25-35%, with skills
1.A, 2.A-2.E, 3.A-3.E, 4.A-4.G. Checked in Phase 0 against the CED text, the official student page and the
2026 reference sheet: every topic title is official except 4.3, 4.5, 4.9 and 5.4 (three third-party
sites agree); the 10% condition is in the course; pooled two-sample t is not; b = r·s_y/s_x is not on the
sheet; the normal approximation to the binomial was not found (needs-author `ced-text`).

**Exam (Tue 11 May 2027, afternoon), fully digital in Bluebook, 3 hours.** Section I: 42 MCQ, 4 options,
90 min, 50%, including two 3-question sets (probability and distributions; regression). Section II: 4 FRQs,
10 points each, 90 min, 50%, analytic rubrics: Q1 formulate and collect (Practices 1-2), Q2 analyze and
interpret (3-4), Q3 inference (a test or an interval), Q4 multi-focus across content (2-4). **No
investigative task** any more. Graphing calculator with statistics functions in both sections plus Desmos
in Bluebook; a reference sheet (formulas, normal, t and χ² tables) is provided. FRQs are typed on a
keyboard (`p-hat`, `x-bar`, `mu`, `H_0`, `sqrt( )`, "from 2.5 to 5.5").

**Scores.** 2025: 267,690 takers, 17.0% fives, 60.2% 3+ (about 62% in 2026), one of the lowest pass rates.
No cut scores, and 2027 is a new format.

**Where students lose points** (2025 Chief Reader Report): every FRQ mean under half credit. Context
missing; parameters not defined; conditions not checked in words; p̂ instead of p₀ in a test's SE; wrong
tail or inequality; "accept H₀", "proves", conclusions about H₀; Type I/II without the conditional clause;
random variable not defined in context and binomial parameters not stated; "fewer than" read as "at most";
boxplots described as normal or unimodal; skew direction; sampling procedures without a process.

**Market.** UWorld $99-169, Fiveable $79/yr, Albert about $79, books $19-30, free Khan (not yet updated),
Math Medic, Skew the Script, free applets (Stapplet, Rossman/Chance, StatKey) that teach well but do not
grade or tie to exam items. Gap: a course built for the 2027 format, feedback on written conclusions, and
graded simulators at phone width.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, formulas page, unit practice
tests. Premium ($25 one-time, through 30 June 2027): unlimited practice, exams, every lesson, analytics,
every trainer.

1. **Sampling distribution machine (flagship).** Pick a population (or draw your own), take samples, watch
   the distribution of x̄ or p̂ build dot by dot; n, shape and the CLT made visible; then graded drills.
2. **Conclusions graded component by component.** Context, parameter, direction, evidence language, and the
   p-value compared with α, checked against a rubric with the reader-report traps named (section 7).
3. **Built for May 2027.** Five units, 4-option MCQ with the two 3-question sets, four 10-point FRQs typed as
   Bluebook expects, the provided reference sheet explained.
4. **Show the expression.** Every calculation item can ask for the formula's structure, the substitution and
   the answer, as the CED requires, and grades each.
5. **Table or technology, both accepted.** Answers from Table A/B/C and from a calculator are both right
   (tolerances in section 7); explanations show both routes.
6. **From Algebra 1, in CED order, nothing used before it is taught**, with a "Math you need" chapter.

## 4. Continuity with the other courses

Built exactly like AP® Calculus AB (decision 1), so every shared page type matches: home, units, lessons,
notes, unit sheets, glossary, flashcards, practice, review, exams, FRQ, justify, dashboard, search, tools,
cram, teachers, formulas page, unit tests. **No score calculator page and no readiness band** (decision 6).
Same shared layer (`assets/`, Tool Studio, flagging, XP, tutor), item formats (plus the statistics types in
section 7), Beta badge, the "not yet reviewed by an AP® Statistics teacher" note, trademark rules. Every
shared-layer fix found at launch goes into the shared file, never a statistics-only copy. Identity: own
accent colour, icon, headline and rank names (decision 5).

Page list (`/statistics/`):

| Page | Free | Notes |
|---|---|---|
| `index.html` home | yes | hero, units, trainers band, "Try one" sample question |
| `learn.html`, `units/`, `notes/`, `unit-sheets/` | yes | textbook in CED order plus "Math you need" |
| `lessons/` | Unit 1 and math chapter | interactive lessons |
| `glossary.html`, `flashcards.html` | yes | |
| `practice.html`, `review.html` | 15 a day | filters: unit, topic, skill, item type, flagged |
| `exams.html` | one form | two fixed full exams in the 2027 format, plus timed sections |
| `frq.html`, `frq/<id>.html` | sample | four FRQ types, 10-point rubrics, self-scored |
| `justify.html` | sample | the "Say it in context" trainer (section 6) |
| `tools.html`, `tools/<slug>.html` | three trainers | section 6 |
| `cram.html`, `dashboard.html`, `search.html`, `teachers.html` | as other courses | |
| `formula-sheet.html` | yes | "The reference sheet, explained" |
| `unit-tests/<unit>.html` | yes | 12 bank questions per unit |

## 5. Build plan

One branch, `claude/apstat`, one PR at the end. Phases as AP® Calculus AB.

| Phase | What | Parallel split | Status |
|---|---|---|---|
| R | Research: `docs/apstat-research/framework.md`, `market.md`; this spec; architecture and authoring drafts | one session | **done 2026-10-17** |
| 0 | Fork AP® Calculus AB: CED map (55 topics + math chapter), dependency map with notation patterns, generator `scripts/build-apstat.mjs`, runtime `statistics/assets/` (`stat-*`), `ApStatDist` distributions library, statistics TeX additions, numeric/interval/setup/conclusion item types, `ApStatPlot` (dotplot, histogram, boxplot, scatter, density curves), checks, tests, fixture, registration hidden (registry, Premium pass, Worker, SQL migration, hub/pricing, search, sitemap, OG, budgets, theme, sw.js), tool scaffolding, briefs, needs-author | one session (shared files) | **done 2026-10-17** (`docs/apstat-phase0.md`, `docs/apstat-architecture.md`, `docs/apstat-briefs/`); CI passes |
| 1 | Content: lessons, notes, banks (incl. the two set types), FRQs, glossary, figures | 5 authors at once (section 5a). Each writes only its topics' files | |
| 2 | Trainers (section 6) | 4 builders at once, each owning whole slugs (section 5a); runs alongside Phase 1 because contexts unlock per unit | |
| 3 | "Say it in context" trainer, two fixed practice exams, formulas page, unit tests, cram kit | one session (needs the banks) | **done 2026-10-17**: 36 prompts (8, 6, 8, 7, 7 by unit; every skill; 7 with the conclusion builder), two forms (29 bank + 13 exam-only each, one probability and one regression set, unit and practice counts in range, Q1-Q4 FRQs), formulas page held to the 2026 sheet, unit tests, cram kit; every new number recomputed (`EXAM_NUMBERS`, `JUSTIFY_NUMBERS`, distractors too); independent review `docs/apstat-reviews/phase3.md`, all findings applied (decision 14) |
| 4 | Independent accuracy checks per unit and for tools and exams (every key recomputed by code with `ApStatDist`); fixes | reviewers in parallel, one per unit group + tools + exams | |
| Launch | Publish, generators, continuity pass against calculus on every shared page type, "Eight courses" wording, full CI with browser checks, PR | one session | **done 2026-10-17** (decision 15); Premium not on sale until the section 9 checklist |

Quality bar: AP® Calculus AB authoring rules; every number, probability, interval and p-value key recomputed
by code; every plot drawn from the data or distribution it claims to show; independent accuracy review.

### 5a. Authoring split (proposed, Phase 0)

Balanced by work, not by topic count: Unit 1 is long but light on calculation, Unit 3 is heavy, so it is
split in two; Unit 5 is short, so it rides with the second half of Unit 3. Each author owns every file of
its topics (lesson, notes, questions, glossary, figures) and the FRQs listed; the map's FRQ themes give 12
FRQs, two of each type at least, enough for the two practice exams (decision 7).

| Author | Topics | Count | FRQs | Exam sets |
|---|---|---|---|---|
| A | Unit 1 (1.1-1.13) and the whole "Math you need" chapter (5 skills) | 13 + 5 | `analyze` comparing distributions; `collect` survey and bias; `collect` experiment with blocking | none |
| B | Unit 2 (2.1-2.12) | 12 | `multi` binomial random variable and a claim; `analyze` conditional probability from a two-way table | at least 4 probability sets of 3 (two-way tables, a discrete distribution, binomial, normal) |
| C | Unit 3, 3.1-3.8 (one proportion, p-values, errors and power) | 8 | `inference` one-proportion z test; `multi` Type I and II errors in context | none |
| D | Unit 3, 3.9-3.15 (two proportions, chi-square) and Unit 5 (5.1-5.5) | 7 + 5 | `inference` two-proportion interval and claim; `inference` chi-square test for independence; `analyze` regression output | at least 4 regression sets of 3 |
| E | Unit 4 (4.1-4.10, one-sample and paired t, two-sample t) | 10 | `inference` paired t interval; `inference` two-sample t test | none |

The "Say it in context" prompts (5-8 per unit) are written in Phase 3 from the banks, not by these
authors.

Trainer builders (Phase 2), four at once, each owning whole slugs (four files per slug, nothing shared):

| Builder | Trainers | Why together |
|---|---|---|
| T1 | `sampling-distributions` (flagship), `ci-capture` | the same sampling engine: repeated samples from a population, then intervals built from them |
| T2 | `p-value-explorer`, `distribution-areas`, `chi-square-lab` | shaded areas under density curves from `ApStatDist` (normal, t, chi-square, binomial) |
| T3 | `data-explorer`, `regression-lab` | drag-a-point data plots: summaries and fences, then the least-squares line and residuals |
| T4 | `sampling-lab`, `design-randomizer`, `probability-trees` | illustrated populations and units, seeded random selection and assignment, linked tree, table and Venn views |

Each trainer's context topics must be published before its page builds, so T3 and T4 can start on Unit 1
contexts first and T1 and T2 on Unit 2-3 contexts as those authors finish.

## 6. Trainers

Ten simulators plus the justification trainer. Each has an Explore pane (live scene, one to three primary
controls, Why and Details sheets) and Test yourself (seeded drills, contexts unlocking with their unit,
feedback naming the slip, first try recorded as `<slug>:<context>:<step>`).

| Slug | Unit | What |
|---|---|---|
| `data-explorer` | 1 | One data set as dotplot, histogram (bin width slider) and boxplot at once; drag a point and watch mean vs median, SD vs IQR; 1.5 × IQR fences; z-scores; describe shape, center, spread, outliers in context (graded parts) |
| `sampling-lab` | 1 | A population of illustrated units on a grid (households, plots of a field, students in classrooms): draw SRS, stratified, cluster, systematic samples; see bias from convenience and voluntary response; write a procedure with label, generate, skip repeats, select steps (graded slot by slot) |
| `design-randomizer` | 1 | Experimental units, treatments, blocks and matched pairs; randomize with a seeded generator and see balance; confounding and blinding scenarios; name the design, the explanatory and response variables, what random assignment allows (causal) vs random sampling (generalize) |
| `probability-trees` | 2 | Tree diagram, two-way table and Venn diagram of the same events, linked; conditional probability by "slicing" a row; independence check; simulation estimate converging to the exact value |
| `distribution-areas` | 2 | Normal and binomial: shade a region, read the probability; the CED work-shown rule (name the distribution, parameters, boundary, direction); empirical rule; z and inverse normal; table vs technology; binomial histogram with the normal shape over it for comparison |
| `sampling-distributions` | 2-4 | Flagship. Population (skewed, uniform, bimodal, proportion, draw your own), sample size n, "take 1 / 100 / 1000 samples"; the distribution of x̄ or p̂ builds live with its mean and SD against the formula; CLT and large-counts conditions shown failing and passing; the difference of two statistics |
| `ci-capture` | 3-4 | 100 intervals from the same population, colour by whether they capture the parameter; confidence level and n sliders; margin of error parts (critical value × SE); interpret "95% confident" vs the wrong readings (graded choice of wording) |
| `p-value-explorer` | 3-4 | Null distribution with the observed statistic; one or two-sided; shaded p-value; α line; then Type I, Type II and power with the alternative distribution overlaid, as a 2 × 2 table; drag the effect size and n |
| `chi-square-lab` | 3 | Two-way table: expected counts filled cell by cell (row total × column total / grand total), components (O − E)²/E as a heat map, χ² on its distribution with df and p-value; homogeneity vs independence chooser with the matching hypotheses |
| `regression-lab` | 5 | Drag points on a scatterplot; the LSRL, r, r², residuals as segments and a live residual plot; influential points and outliers; interpret slope, intercept, r² and s in context (graded slot wording); extrapolation warning |

Free: `sampling-distributions` (flagship), `data-explorer`, `probability-trees`; the rest Premium. Owner to
confirm. Inference procedures as a whole (choose the procedure, hypotheses, conditions, compute, conclude)
are drilled in practice and the "Say it in context" trainer rather than an eleventh tool.

**"Say it in context" (the justify page).** 35+ prompts, 5-8 per unit, on the reader-report misses:
describing a distribution, comparing two, sampling bias named and explained, a randomization procedure, a
random variable defined, a probability tied to a claim, interpreting a confidence interval and the level,
a p-value's meaning, a test conclusion, Type I and II in context, conditions, slope and r² and residual
interpretations. Each prompt has a rubric checklist, an answer that earns the point and a plausible one that
misses (as AP® Calculus AB), plus the conclusion builder (section 7) where the answer has components.

## 7. How answers are graded

All grading is code; nothing is graded by an AI model. Formats in `docs/apstat-architecture.md`.

1. **Choice items** (`single` with 4 options, `multi`, `order`): exact.
2. **Numbers with tolerance** (`numeric`). Each item names a `kind`, which sets the default tolerance; an
   item may override with `tol` (absolute) or `accept: [lo, hi]`:
   - `prob` (a probability or proportion): within 0.002 absolute, or 1% relative when smaller than 0.1;
   - `z`, `t`, `chi2` (a test statistic): within 0.02 (0.05 for χ² above 10);
   - `pvalue`: within 0.005, or 10% relative under 0.05; a value on the wrong side of the item's α is always
     wrong; a Table B or C bracket ("between 0.02 and 0.025") typed as a range is accepted when it contains
     the key;
   - `stat` (mean, SD, slope, prediction): within half a unit of the item's `places` (default 2) or 0.5%
     relative;
   - `count`: exact integer; `df`: exact, accepting the conservative df where the item allows it;
   - `critical` (z*, t*): within 0.005, accepting the table's df row (rounded down) for t*.
   Keys are the full-precision technology value; the checker recomputes them with `ApStatDist` from the
   item's data and also computes the table route (z rounded to two decimals for Table A, the df row for Table
   B) and widens the band to accept it. Mistakes are authored values (p̂ in the SE of a test, n instead of
   n − 1, wrong tail, one-sided vs two-sided doubling) matched first, each with its fix.
3. **Intervals** (`interval`): two numbers, lower and upper, each graded as `stat`; "from a to b" or "(a, b)"
   typed in one box is read too; a reversed or symmetric-about-the-wrong-center interval gets its own note.
4. **Typed expressions** (`setup`): the student types the expression as on the exam (`0.42 +/- 1.96 *
   sqrt(0.42*0.58/200)`, `(0.47 - 0.5)/sqrt(0.5*0.5/400)`, `10C3 * 0.3^3 * 0.7^7`), parsed by `ApStatExpr`
   (the calculus parser plus `+/-`, `nCr`/`C(n, k)`, `!`, `p-hat`, `x-bar` and `mu` names bound to the item's
   values). Graded by value and by structure: the evaluated value must match, and the numbers the item marks
   `mustUse` (p₀ in a test's SE, n − 1 for df) must appear while `mustNotUse` ones (p̂ in a test's SE) must not.
   This is the CED's "expression, substitution, answer" rule made checkable.
5. **Conclusions and interpretations** (`conclude`), in two layers:
   - **Builder** (graded exactly): the student assembles the sentence from slots: decision (p compared with α
     with the inequality), evidence phrase ("is / is not convincing evidence"), direction (greater than, less
     than, different from), parameter ("the true proportion of all ..."), context noun. Every slot is checked
     against the key; the feedback names the slot that is wrong. This covers every test conclusion, interval
     interpretation and Type I/II statement.
   - **Write it yourself** (rubric with automatic flags plus a self-check): a free-text box checked by rules
     the item carries: `context` (one of the item's context words), `parameter` (true/population + proportion
     /mean/difference), `direction` (words matching Hₐ), `evidence` (convincing evidence language), `compare`
     (p-value and α with a correct inequality), and forbidden phrases (`prove`, `accept H0`, `H0 is true`,
     "probability that the null", "95% of the data"). Flags are shown as hints ("no parameter named"); the
     score is the student's own tick per rubric line, as on the FRQ page, because keyword rules can miss
     a correct paraphrase. Only builder answers count toward mastery.
6. **FRQs**: four types (`collect`, `analyze`, `inference`, `multi`), 10 points, one rubric line per point,
   self-scored with full-credit samples; numeric parts also offer a "check my number" box using rule 2.

## 8. Decisions log

1. (2026-10-17) **Fork the AP® Calculus AB runtime**, as calculus forked physics: build-time TeX to MathML,
   the expression parser, one set of files per trainer.
2. (2026-10-17) **No "ap" in any served path.** Folder `/statistics/`, files `stat-*.js`, ids `stat-`.
   Registry and storage key `apstat`, order 8, aliases `statistics`, `stats`, `stat`.
3. (2026-10-17) **Pass and price mirror the other AP® courses:** `stat-2027`, $25 one-time, through
   30 June 2027 (founding discount applies through the shared `FOUNDING` rule), registered `onSale: false`
   until the owner checklist is done.
4. (2026-10-17) **Sources:** College Board CED, revisions page, reference sheet, scoring guidelines and Chief
   Reader Reports for scope and common errors only, in our own words. No released exam questions reproduced
   or adapted. Our own distribution tables, generated by code, on the formulas page.
5. (2026-10-17) **Identity (proposed, owner to confirm).** Plum accent: light `--ctint` `#F5E6F4`, `--cink`
   `#6E2470` (9.8:1 on white, 8.2:1 on the tint); dark `rgba(214,120,206,0.10)` / `#F0BCEB` (10.0:1 on the
   dark card). Icon: a bell curve over a few histogram bars. Headline "AP® Statistics, one idea at a time."
   Ranks: Data Collector, Pattern Spotter, Chance Reader, Sample Builder, Interval Maker, Evidence Weigher,
   Statistics Legend. Manifest and OG "Statistics".
6. (2026-10-17) **No score calculator and no readiness band.** Owner rule (score calculators are low yield);
   2027 is a new format with no score data, so exam results show section percentages, unit and skill
   breakdowns and the misses, nothing labelled as an AP® score.
7. (2026-10-17) **Exam format is the May 2027 one**: 42 four-option MCQ in 90 min with exactly one
   probability set and one regression set of 3; 4 FRQs of 10 points in 90 min in the Q1-Q4 order. Default
   exam date Tue 2027-05-11.
8. (2026-10-17) **Revised course only.** The removed topics (section 2) appear only as `going-further`
   asides, never in an item; the content check refuses their terms in items (geometric, goodness of fit,
   slope t-test, `\mu_{X+Y}`, log transformations).
9. (2026-10-17) **Technology rule.** Calculator use is assumed everywhere (the exam allows it in both
   sections); items never require a specific calculator. Explanations show the formula route and name the
   calculator command in words ("a 1-proportion z test"); a link to the free Desmos calculator opens in a new
   tab, nothing embedded (as AP® Calculus AB decision 9).
10. (2026-10-17) **Free tier (owner decided):** Unit 1 and the "Math you need" lessons free, about 24% of topics,
    matching the share the other AP® courses give free (16 to 33%; Units 1 and 2 would be 45% here). The
    free/Premium model is unchanged from the other courses: notes free forever, early lessons free, Premium
    adds every lesson, unlimited practice, exams, all tools and the full dashboard (Olivier, 2026-10-17).
    Accent plum confirmed.
11. (2026-10-17) **Phase 0 built as proposed, each choice in one place** so the owner can change it: the
    identity in `IDENTITY` (`scripts/lib/apstat-build.mjs`) with its CSS values in `assets/theme.css` and
    `statistics/assets/stat.css` and the ranks in `assets/hub-progress.js`; the free tier in `FREE_UNITS`
    and `assets/premium.js` `freeChapters`; the free trainers in `statistics/data/pages.json`. Registered
    `status: 'hidden'`, `onSale: false`, pass `stat-2027`, SQL migration `2026-10h-apstat.sql` not applied.
12. (2026-10-17) **CED check outcome.** The 10% condition is taught in 3.2 and used in every inference
    topic; two-sample t is unpooled (technology df, conservative df accepted); the normal approximation to
    the binomial is not tested; the slope is read from output (b = r·s_y/s_x is taught as a relationship,
    not on the sheet). The formulas page lists exactly the 2026 sheet (a test holds it to that).
13. (2026-10-17) **Graders are code and live in two files.** `ApStatGrade` (`stat-grade.js`) for numeric
    kinds, intervals and conclusions; `ApStatExpr.gradeSetup` (`stat-expr.js`) for setups. Every numeric
    and interval key carries a recipe (`from`) the build recomputes with `ApStatDist`, which matches SciPy
    to about 1e-12; the table route is added as an accepted alternative at build time.

14. (2026-10-17) **Phase 3 as built.** Practice exams: each form is 29 bank questions (standalone four-option
    items that are neither lesson check items nor on the free unit tests) plus 13 exam-only questions
    (`data/exams/items.json`: investigative questions, choosing the procedure, calculations and interpretations,
    and the exam sets), in course order. The bank's exam sets are almost all lesson check items, so form 1 uses the
    bank regression set `residuals-s2` and exam-only probability set; form 2 uses exam-only sets for both. FRQs:
    form 1 survey sampling, comparing distributions, two-sample t test, binomial claim; form 2 experiment with
    blocking, regression output, two-proportion interval, errors and consequences. "Say it in context": the first
    3 prompts free (`FREE_JUSTIFY`); a prompt may carry a `conclude` builder (slots graded by
    `ApStatGrade.conclude`, first try saved in `apstat_prefs_v1.justify[id].built`). Every exam-only key, its
    named-slip distractors and every number a prompt shows are recomputed with `ApStatDist`
    (`scripts/lib/apstat-exams.mjs`). Formulas page: the sheet's three section headings, `s_x`, the means of the
    two difference distributions and the Table B and C ranges as on the 2026 sheet.

15. (2026-10-17, launch) **Published, Premium not on sale**, as AP® Calculus AB decision 12.
    - All five units and `skills-math` in `statistics/data/published.json`; registry `status: 'beta'`; every
      generator rerun (course, courses, pricing with the plum hub card and the 404 card, OG tags, sitemap, crumbs).
      `onSale: false` stays. `sw.js` cache v82. Changelog entry 2026-10-17. Eight courses: hub hero count and facts
      (generated), lede, meta descriptions (no "AP"), manifest, `search.html`, `sources.html` (new section),
      Premium rules and `terms.html#fixed-date` (generated), cross-course comment.
    - Shared fixes from the reviews: the `setup.then` value step is prepared from its recipe and graded as a second
      box; FRQ `check` answers are computed in the build (`prepareFrqCheck`) and the FRQ page has a "Check my number"
      box; `df` accepts the technology df or the Table B row rounded down, never rounded up or pooled; t intervals
      carry the conservative-df and Table B row intervals as `interval.alts` (`intervalAlts`), so the three
      ci-two-means items went back to either df; `stat-plot.js` puts the x-axis name under the ticks, dotplot counts
      on their rows and the residual axis at the bottom; tiny p-values read "< 0.0001" in Explore.
    - Phase 3 note kept: most bank probability and regression 3-question sets are lesson check items, so the exam
      forms use exam-only sets (decision 14). Left as is.
    - Polish 2026-10-17 brought over from calculus: flagging (`apstat_flagged_v1`, practice mode, exam list, the
      dashboard card via `flags.js` DIRS), lesson step toggle and share at the end, the after-check prompt, one Next,
      the level card zero state, the short hero with one Beta note, no lone card in Practice and study, the "Try a
      step" sample (`stat-sampling-problems-11`), dashboard plural and folded units. Shared CSS/JS lists now know
      `.stat-crumb`, `.stat-mark`, `.stat-foot`.
    - Publishing turned on site checks: British spellings in data and runtime strings, 22 cut titles that read the
      same (`descriptions.json` `titles`), two notes descriptions pointing at the last topic, seven trainer
      descriptions over 160 characters.
    - Continuity pass (statistics vs calculus, every shared page type, 390/1440, light/dark, Playwright; practice
      answered on a numeric, an interval, a setup with its value step and a conclude item; Enlarge on a phone for
      three trainers; the FRQ page with "Check my number"; the dashboard seeded with progress and flags). Fixes: a
      build-time `<wbr>` inside a definition showed as text in the glossary page, its tooltips and both
      flashcard decks (calculus had it too; `glossary-page.js`, `glossary-tip.js`, both `flashcards.js`); the
      formulas page printed raw `$...$` in a habit line; plain text read `z^*` as "z^(*)" (now "z*").
16. (2026-10-20, `docs/frq-grader.md`) **AI FRQ grader, built and OFF.** "Grade my answer" beside the rubric self-score on each FRQ page (shared `assets/course/frq-grader.js`, Worker `/frq/grade`): Premium only, 10 a day, Claude then the Workers AI backup then the self-score, each point quoting the student's words. Self-scoring stays the default and is never removed; the grader is an estimate the student can overrule. Turned on only after its accuracy eval passes.

## 9. Open items for the owner

Before Phase 1 (built as proposed in Phase 0, each easy to change; decision 11):
- Confirm the accent, icon, headline and ranks (decision 5), the free trainers (section 6) and the free tier
  (decision 10).
- Confirm no readiness band on exams (decision 6), stricter than the other AP® courses.
- Confirm the authoring split (section 5a).

Uncertain research: `docs/apstat-needs-author.md` (`ced-text`: Units 2-5 objectives, four third-party titles
and the normal approximation to the binomial; `frq-scoring`; `set-format`).

**Launch checklist (after the PR is ready, owner):**
- [ ] Apply SQL migration `2026-10h-apstat.sql` in Supabase (check live function bodies match apart from
      `apstat`).
- [ ] Create the Polar product "AP® Statistics Premium (through June 30, 2027)", $25 one-time; add
      `"stat-2027"` with its product id to `POLAR_PRODUCTS` in the Cloudflare Worker settings; deploy the Worker
      (PASSES, `URL_COURSE`, `COURSE_NAMES`, tutor `COURSE_RULES.apstat`).
- [ ] Check the founding discount shows on the statistics pass at checkout.
- [ ] Remove `onSale: false` from `COURSES.apstat`; bump the `sw.js` cache (v82 at launch, so v83); grant owner access.
- [ ] Merge the PR (this puts AP® Statistics Premium on sale).
- [ ] Optional: an AP® Statistics teacher reviews the course (the Beta note stays until then).
