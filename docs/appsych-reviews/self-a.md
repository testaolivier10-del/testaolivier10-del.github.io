# Author A self-report: "Research skills you need" and Unit 1 topics 1.1-1.2

Written 2026-10-27, Phase 1 content. For each of the 9 topics: lesson, notes, questions and glossary (every concept the map lists for the topic is defined). Every topic passes `node scripts/check-appsych-content.mjs --topic <id>` with nothing reported, and `node scripts/check-appsych-map.mjs --check` reports nothing used before it is taught.

## Topics and items

| Topic | Items | In sets | Sets (kind) | Figure |
|---|---|---|---|---|
| research-methods | 24 | 10 | study (energy drink: random assignment, placebo, double-blind), data (practice testing), study (survey) | research-methods-experiment |
| research-sampling | 12 | 6 | study (walking and mood), data (survey respondents by age) | research-sampling-steps |
| stats-correlation | 14 | 7 | data (scatterplot of hours studied and quiz score), data (table of r values) | stats-correlation-three |
| research-ethics | 12 | 5 | study (stress and recall with deception and debriefing) | research-ethics-timeline |
| stats-descriptive | 17 | 8 | data (reaction-time frequency table with an outlier), data (skewed histogram) | stats-descriptive-skew |
| stats-normal | 12 | 5 | visual (normal curve of test scores, mean 100, SD 15) | stats-normal-curve |
| stats-significance | 10 | 4 | data (bar graph, walk before a test) | stats-significance-effect |
| heredity-environment (1.1) | 15 | 8 | data (twin and adoption correlations), study (PKU, real: Bickel, Gerrard & Hickmans, 1953) | heredity-environment-designs |
| nervous-system (1.2) | 15 | 8 | visual (divisions diagram), data (heart-rate line graph) | nervous-system-divisions |

131 items in all: 61 in stimulus sets (47%), 16 numeric, 7 "Make it specific". Every study or data stimulus is invented and labeled, except the PKU set, which cites the real study. Each topic is at least 92% apply/analyze, and the key is the longest option in no more than 4 of a topic's single-answer items. No distractor uses an absolute word.

## FRQs

- `frq-research-methods-aaq`: an experiment on short sleep and word recall (invented). Ethics: IRB approval, informed consent, right to withdraw, debriefing. Part E asks about high-school students.
- `frq-stats-correlation-aaq`: a correlational study of screen time and attention (invented, r = -.52 computed by ApPsychStats from the 20 plotted points). Ethics: parental consent with student assent, right to withdraw, confidentiality. Part F asks why no cause can be claimed (third variable, direction).

Both FRQs pass `checkFrq`: 7 points, parts A-F in exam order, one rubric line per point, and a full-credit sample for every part.

## Figures

There are 9 diagrams from `scripts/appsych-figures/author-a.mjs`, written to `psychology/figures/` and registered in `psychology/data/figures/<topic>.json`. The three data figures (the scatterplots, the skewed histogram and the normal curve) are drawn from numbers in the script, and every value they print (r, mean, median, mode, percentiles) comes from ApPsychStats. Five plot stimuli and the AAQ bar graph are plot specs. I rendered every figure and plot to PNG and checked it, and fixed one label overlap (the mode, median and mean labels now sit in a legend) and two cramped bar labels.

## Numeric recheck

I recomputed all 16 numeric keys by hand from their stems, not from the recipes, in a scratch script. All 16 match the recipe values. In a vm, `psy-grade.js` grades every key right, and every authored mistake (32 in all) is graded wrong with its own feedback. The skewed histogram figure was rechecked the same way (n 25, mean 4.32, median 4, mode 3).

## Map edits

None.

## Open questions for needs-author

- **Milgram on the ethics notes page.** I name Milgram as history and note that later reviews of his records found the debriefing was not always complete or immediate, plus Burger's (2009) partial replication. A reviewer should confirm this level of detail is wanted, since the CED names no researchers.
- **The 1936 poll in the research-sampling hook and notes.** I describe it as about ten million ballots mailed and more than two million returned. Accounts disagree on whether the main cause was the mailing list or who chose to reply, so I name both.
- **Heritability figure.** The heredity-environment notes say adult intelligence test scores "usually show heritability estimates around 0.5 or higher in studies of well-off countries". This is mainstream, but intelligence belongs to author C's 2.8 topic, so it is worth a cross-check there.
- **Effect size benchmarks.** stats-significance gives about 0.2, 0.5 and 0.8 standard deviations as small, medium and large (Cohen's conventions), with the caveat that importance depends on the question. Cohen is not named.
- **Slow breathing.** One nervous-system item and the notes say slow breathing is "associated with" a shift toward parasympathetic activity. I kept the wording cautious, because evidence on the size of the effect varies.
- **Unrelated test failure.** `appsych-tool-conditioning-lab.test.mjs` fails ("a text prints NaN, undefined or Infinity", context c1, seed 7932). It belongs to T3's trainer, not to these files.
