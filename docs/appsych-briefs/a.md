# Author A: the "Research skills you need" chapter and Unit 1 topics 1.1-1.2

Read `docs/appsych-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (9)

`research-methods` (skills), `research-sampling` (skills), `stats-correlation` (skills), `research-ethics` (skills), `stats-descriptive` (skills), `stats-normal` (skills), `stats-significance` (skills), `heredity-environment` (1.1), `nervous-system` (1.2).

## FRQs

- `aaq` on `research-methods`: An experiment on sleep and recall: name the method, operationally define recall, read the group means, apply informed consent and debriefing, judge generalization to high-school students. File `psychology/data/frq/frq-research-methods-aaq.json` (id `frq-research-methods-aaq`).
- `aaq` on `stats-correlation`: A correlational study of screen time and attention: why no cause can be claimed, the third variable, the sample and who the results describe. File `psychology/data/frq/frq-stats-correlation-aaq.json` (id `frq-stats-correlation-aaq`).

## Stimulus sets (at least these, besides your topics' own sets)

- `study` in `research-methods`: A study summary with random assignment and a placebo control: name the design elements.
- `data` in `stats-correlation`: A scatterplot of hours studied against quiz scores: direction, strength and the third-variable question.
- `data` in `stats-descriptive`: A frequency table of reaction times with an outlier: mean versus median.
- `visual` in `stats-normal`: A normal curve of test scores marked at each standard deviation.

## Files you own

For each topic id above: `psychology/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `psychology/figures/` (ids starting with your topic ids); `scripts/appsych-figures/author-a.mjs` if you generate figures; your report `docs/appsych-reviews/self-a.md`.

## Notes for your topics

The research skills chapter is free and carries both free-response questions: every topic models the exam's exact wording (method named, operational definition as measured, statistic read for the groups, safeguard applied, generalization from participants). Keep the statistics small enough to do by hand; every key from `ApPsychStats`. Correlation comes before descriptive statistics on purpose (`docs/appsych-phase0.md`). You also write the stats-lab trainer's content (builder T3 owns its code) only if T3 asks.
