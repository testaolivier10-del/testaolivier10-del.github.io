# Review: "Research skills you need" and Unit 1 topics 1.1-1.2

Independent accuracy check, 2026-10-27, branch `claude/appsych`, against the reviewer brief
(`docs/appsych-briefs/review-common.md`), the authoring guide, `docs/appsych-ced-map.json`, framework.md sections
3, 5 and 7, and mainstream sources (introductory-text content on methods, statistics, ethics, heredity and the
nervous system; Bickel, Gerrard & Hickmans, 1953, for PKU; APA ethics code). Scope: `research-methods`,
`research-sampling`, `stats-correlation`, `research-ethics`, `stats-descriptive`, `stats-normal`,
`stats-significance`, `heredity-environment`, `nervous-system` (lesson, notes, glossary, figure entries,
questions: 131 items, 18 stimuli), the 9 figures from `scripts/appsych-figures/author-a.mjs`, the 7 plot
stimuli, and `frq-research-methods-aaq`, `frq-stats-correlation-aaq`.

**CED:** WebFetch of the CED PDF returned only binary data this time, so nothing could be read directly. Objectives,
knowledge and the 1.1 exclusion (genetics vocabulary) were checked against `docs/appsych-ced-map.json` and
framework.md section 3, which record the earlier CED extract for Unit 1. No genotype, phenotype, DNA, chromosome,
dominant or recessive appears anywhere in 1.1 or 1.2.

## Numeric recheck

All 16 numeric keys were recomputed by my own scratch script from the stems (not from the `from` recipes), then
graded through `psy-stats.js`, `psy-grade.js` and `psy-questions.js` in the test harness. All 16 keys are graded right, and
all 32 authored mistakes are graded wrong. Examples: means 6 and 362 ms; medians 7, 7.5 and 300; mode 9; ranges 14
and 620; z 2, -1 and -2; rule shares 95%, 16%, 68% and 2.5%; percentile 84. Also recomputed:

- the scatter stimulus `stats-correlation-s1`: r = .877, printed .88; the line gives 70.2 at 4 hours, keyed "about 70"
- the FRQ scatter: r = -.522, printed -.52
- the skew figure: n 25, mean 4.32, median 4, mode 3
- `stats-descriptive-14`: 2720 / 9 = 302

Every number in the stems can be worked by hand.

## Changes

| File / item | What was wrong | Fix |
|---|---|---|
| `psy-stats-correlation-12` why (option 0) | "0.62 is strong": the course's own scale (notes, `ApPsychStats.strength`) calls 0.4-0.7 moderate | "Its size, 0.62, is moderate and smaller than 0.71" |
| `psy-stats-correlation-12` why (option 2) | 0.31 called "weak to moderate"; it is weak by the course scale | "0.31 is a weak relationship" |
| `psy-stats-correlation-13` why (option 3) | -0.62 called "fairly strong" (contradicts the item's own correct-why, "moderately strong", and the scale) | "a moderate relationship, well away from zero" |
| `psy-stats-correlation-6` why (option 3) | The experimenter-bias distractor explanation ("records kept for other purposes") did not say why the concept fails | Now says experimenter bias is researchers' expectations shaping data; here the error is the nurse's memory |
| `psy-stats-significance-3` key text | "small ones miss big ones" read as a rule; small samples *can* miss large effects | "small ones can miss big ones" (key unchanged) |
| `psy-stats-significance-3` why (option 1) | Distractor explanation half-agreed with the distractor ("caution is reasonable") | Says nothing points to an error; chance alone can produce a large gap in 40 people |
| `psy-stats-significance-9` key | "reliably lowered worry" overstates what p < .05 shows | "probably lowered worry" (key unchanged) |
| `psy-research-methods-19` stem | Key "give both groups equal study time" assumed a confound the table never showed (no study times given) | Stem now says the table does not report how long each group studied (key unchanged) |
| `psy-heredity-environment-13` why (option 2) | Explanation spoke of "always", a word not in the option | Says the study concerns one condition and shows nothing about how often disability is inherited |
| `psy-heredity-environment-6` why (option 3) | Refuted a phrase ("fully inherited") not in the option | Explains that both genes and environment matter and a heritable trait is not fixed |
| `heredity-environment` lesson misconception | "A highly heritable condition such as PKU": PKU is a single-gene inherited disorder; calling it "highly heritable" mixes the population statistic with the individual condition the box is warning about | "An inherited condition such as PKU" |
| `nervous-system` notes table | Parasympathetic "Sweating: decreases": sweat glands have almost no parasympathetic supply; sweating falls because sympathetic activity fades | "back to normal as sympathetic activity fades" |
| glossary `irb` | "approves them only if risks are minimal": IRBs approve studies with more than minimal risk when the risk is justified | "risks are kept as low as possible and justified by what the study can learn" |
| glossary `self-report-bias` | Called self-report bias and social desirability bias the same thing; self-report bias is broader (memory errors too, as `psy-research-methods-22` teaches) | Social desirability bias named as the main form of self-report bias |
| `frq-stats-correlation-aaq` participants, E rubric and sample | "Middle schools" with ages 13-15 in Canada: Canadian 13-15-year-olds are mostly in grades 7-9 (junior high), and US "middle school" ends at grade 8 | "junior high schools (grades 7 to 9)" in all four places |

Changed keys: none. The three single-answer items whose key text changed keep the same correct option.

## Checked and fine

- **Methods.** Every method is named exactly:
  - The experiments use manipulation plus random assignment.
  - Pet owners, screen time and twins are correlational. PKU is a case study.
  - The school form is a survey: anonymous, with a Likert item and self-report caveats.
  - Operational definitions are given as measured (ms over 20 trials; words in 3 minutes; X's out of 30).
  - Random sampling and random assignment stay apart everywhere: the figure, a table, sampling items 4, 9 and 12, and the FRQs.
  - Correlation is never read as cause, and a third variable is named each time.
  - Significance is never read as size.
  - Generalizability is argued from participant traits, with "partly" giving both sides.
- **Ethics.** The safeguards match the summaries. Random assignment is rejected as an ethics answer. The animal care
  committee is covered. Milgram's history is accurate, including Burger's (2009) lower 150-volt cutoff and screening, and
  later archival work by Perry on incomplete debriefing.
- **Statistics.**
  - The skew direction and the mean-follows-tail rule are right.
  - The 68-95-99.7 bands are 34 / 13.5 / 2.35 / 0.15.
  - Percentiles: 16, 84 and 97.5.
  - z examples are right.
  - Effect-size benchmarks of 0.2 / 0.5 / 0.8 come with the caveat.
  - "Not significant" is not taken as proof of no effect.
- **Heredity.**
  - Heritability is a population statistic, within groups only, and can change with the environment. The 0.5 for adult IQ matches `intelligence.html`.
  - The PKU study is described accurately: the 2-year-old girl, the low-phenylalanine diet and the challenge with phenylalanine added back.
  - Eugenics and US sterilization are put at "tens of thousands" (about 60,000 is the usual figure).
  - The Jim twins hook is hedged.
- **Nervous system.**
  - CNS and PNS, somatic and autonomic, and the sympathetic and parasympathetic effects are correct.
  - The spinal-injury example is right.
  - The slow-breathing claim is kept cautious.
- **Figures.** All 9 SVGs and the 7 plot stimuli were rendered in Chromium and inspected. Labels, values and anatomy are
  correct, with no overlaps; every plot is drawn from its stated numbers.
- **FRQs.**
  - Both have 7 points, parts A-F in order (F worth 2), one rubric line per point and a sample for every part.
  - Part D lists only the safeguards the summary describes. Samples apply the concept to the study's own numbers.
  - The `frq-research-methods-aaq` design is a true experiment with a blind scorer.
- **Item quality.**
  - At least 90% of items in every topic are apply or analyze.
  - The key is strictly the longest option in at most 40% of single items (the check passes).
  - Stimulus sets have 3-5 items. There are no near-duplicates and no absolute-word distractors.
- **Checks.**
  - `check-appsych-content --topic` reports 0 failing for all 9 topics.
  - `check-appsych-map --check` passes.
  - Exam-form failures (unit counts in form-2) belong to the exam builder's in-progress `forms.json`, not to this scope.
  - Nothing was removed, so no form references are affected.

## Open (for a person)

- **The CED could not be read this session** (WebFetch returned binary). Confirm the 1.1 and 1.2 objectives and the 1.1
  exclusion against the PDF.
- **Needs-author items are still open, and I agree with the author's wording:**
  - `milgram-detail`: accurate, and kept as history.
  - `poll-1936`: the figures of about 10 million mailed and about 2.4 million returned are right. Naming both causes is fair.
  - `effect-size`: keep the benchmarks with the caveat.
  - `wording-cautious`: slow breathing.
- **The research-methods notes use "Around 2015"** for the replication projects. This is accurate (the Open Science
  Collaboration, 2015). The CED's mention of the replication crisis wording is unverified.
