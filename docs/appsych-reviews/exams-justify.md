# Practice exams and "Make it specific" review (Phase 4)

Branch `claude/appsych`, 2026-10-27. Independent accuracy review following `docs/appsych-briefs/review-common.md`.
Scope: the two practice exams (`psychology/data/exams/forms.json`, the 40 exam-only items and 4 stimuli in
`items.json`, form structure, `docs/appsych-reviews/phase3.md`) and the 46 "Make it specific" prompts in
`psychology/data/justify/*.json`. Also played in Chromium (Playwright) at 390 and 1440 px from a scratch build with
every chapter published. The CED PDF was not fetched for this scope: the exam format and practices were checked
against `docs/appsych-research/framework.md` sections 4, 5 and 7, which cite it.

## What was checked

- **Every exam-only item (40)**: stem, four options, key, each option's explanation, `unit`, `topic`, `practice`,
  `level`. Science and research-methods content against the authoring guide's traps: method named exactly, random
  sampling apart from random assignment, cohort effects versus attrition, correlation (direction, strength, not a
  percent, not a cause, third variable), significance versus effect size, placebo and double-blind, debriefing,
  parental consent plus assent, reliability, demand characteristics, the case study's limit, the normal curve and z.
  All keys defensible and unique; every distractor plausible with a correct explanation. No myths, person-first
  language, no self-diagnosis prompts, all four stimuli `invented: true`.
- **Form structure, by my own script** (not `checkForms`): 75 four-option single-answer items per form, all
  distinct; 15 per unit per form (inside 11-19); blocks in course order; Section II is one AAQ then one EBQ, 7 points
  each, the A-F and A-C(ii) parts; no item, stimulus or FRQ in both forms; no lesson check item and no item of the
  built free unit tests (88 ids) in either form; sets 4/3/3 (form 1) and 5/5/2 (form 2) inside `EXAM_SETS`.
  Option order is shuffled at runtime, so the stored key position skew (index 0 for about 60%) is not visible.
  Exam-only keys strictly longest: 14 of 40 (35%).
- **Every "Make it specific" prompt (46)**: context, prompt verb, checklist, `earns` (specific, applied, scorable),
  `misses` (each shows a real reader-report miss from framework.md section 7: method mislabeled, concept defined
  instead of measured, numbers restated, safeguard not in the summary or a design feature, sample size or design
  used for generalizing, topic sentence or question or hedge as claim, method detail or uncited result as
  evidence, dropped-in definition, restricted term, reused source or concept), every builder slot, its options and
  each wrong option's why. Concepts come only from topics of the prompt's unit (and the checker's scan agrees); no
  EBQ reasoning prompt keys a restricted term (testing effect, attribution, placebo, modeling all appear only as the
  wrong slot with the reason).
- **Play-through**: both forms, whole exam, at 1440 and 390: Setup, Section I timed (clock runs, all 75 answered),
  break, Section II (6 and 5 answer boxes, live hints), rubric scoring (14 boxes), results with unit and part
  breakdowns and a 75-row review. Section I alone and Section II alone also open on their own clocks. Justify page:
  the list shows 46 of 46 prompts at both widths; every prompt was played at both widths (answer typed, checklist
  boxes match its lines, builder graded wrong then right, the right feedback per slot). No console errors, no
  horizontal overflow at 390 (a full-page capture shows the mobile "More" sheet over the page; the real viewport
  does not).

## Numeric recheck

`scratchpad/ej/recompute.py` (own code: data parsed from the stimulus tables and contexts, statistics by hand rules,
68-95-99.7 percentiles from a table of its own) recomputes all 13 numeric exam items (means 15, 7 and 6; medians 14
and 4; ranges 12, 4 and 17; 31 - 14 = 17; 84th percentile; 97.5%; 68%; z 2 and 0.5) and their named-slip
distractors, and every number in the prompts (18 fewer, 7 more, 26 points, 37 minutes, 40 points, half as long,
8 points, 2 points, the gratitude gains, mean 484 / median 310 with four of five below the mean, z 2 and the
97.5th percentile, the correlation words for r = .70, .35, .40, -.45 by the course's own thresholds). Result: all
keys right; one stimulus inconsistency (below). After the fixes: 0 failures, the content check's `EXAM_NUMBERS`
and `JUSTIFY_NUMBERS` pass, `node --test scripts/test/appsych-*.test.mjs` 152 pass, 0 fail.

## Changes

| File | Item | What was wrong | Fix |
|---|---|---|---|
| exams/items.json | stimulus `exam-1-s2` (items 1-05 to 1-08) | "Ten students studied the same 20 words", "Words recalled out of 20", but meaning-group student 2 recalled 21: impossible data | 30 words, "out of 30"; scores, keys and distractors unchanged (comment in `appsych-exams.mjs` updated) |
| exams/items.json | `psy-exam-1-01` why (option 3) | "two groups of 30": the summary gives 60 students but never the group sizes | "two groups of students" |
| exams/items.json | `psy-exam-1-03` key | "Healthy young adults who drink little caffeine": health was not described, and "young adults" drops the defining trait (university students) | "Young adult students who drink little caffeine" |
| exams/items.json | stimulus `exam-1-s1` discussion | "caffeine ... blocking adenosine" (caffeine blocks adenosine receptors, not adenosine) | "blocking receptors for adenosine" |
| exams/forms.json | form 2, set `treatment-s3` | Not whole: 4 of its 5 single-answer items (`psy-treatment-37`, not a lesson check or unit-test item, was left out) | `psy-treatment-37` added to the block; standalone `psy-health-psychology-21` removed so Unit 5 stays 15 and the total 75 (form 2 practices now 35/26/14) |
| justify/unit-5.json, scripts/lib/appsych-exams.mjs | `u5-gratitude-statistic` | 80 adults with a gain 1.0 point larger on a 1-10 scale, called a "small effect size": with typical spread that is a moderate-to-large effect, so the prompt taught a wrong reading of effect size | 800 adults; gratitude group 5.1 to 5.6 (rose 0.5) against control 0.2, a gain 0.3 point larger, small; checklist, earns answer, builder options and `JUSTIFY_NUMBERS` recomputed |
| justify/unit-2.json | `u2-spacing-opdef` builder why | "Study time is the independent variable": both groups studied 60 minutes; the spacing is the variable | "Both groups studied for 60 minutes in all; how that time was spaced ... is the independent variable" |

Keys changed: one option text (`psy-exam-1-03`, same position, same meaning). No item id changed, none deleted.

## Follow-up (same day, coordinator's request)

| File | What | Change |
|---|---|---|
| justify/unit-1.json | `u1-plasticity-reasoning` keyed neuroplasticity, the claim's own topic | Prompt asks for a concept other than neuroplasticity; checklist, earns and builder key hemispheric specialization (speech not yet fully lateralized before age 6, so the right hemisphere took it over); neuroplasticity is now the wrong slot ("the claim's own topic, a restricted term") and the `misses` answer shows that slip |
| exams/forms.json, form 2 | Two 2-question sets (`storing-memories-s2`, `physical-development-s2`) | Replaced by standalones `psy-perception-14`, `psy-storing-memories-14`, `psy-cognitive-development-16`, `psy-social-emotional-development-16` |
| exams/forms.json, form 2 | Concept Application 35/75 | Swapped methods-heavy blocks for Practice 1 items: `heredity-environment-7` to `-6`, `classical-conditioning-11` to `-3`, sets `thinking-s2`, `sleep-s2`, `psychodynamic-humanistic-s3`, `social-situations-s3` to standalones `thinking-13/15/16`, `sleep-13/14/15`, `psychodynamic-humanistic-5/6/7`, `social-situations-7/8/9`. Now 47/16/12; sets 3 study, 2 data, 1 figure, all of 3 or more |
| exams/forms.json, form 1 | Concept Application 43/75 | Set `treatment-s2` to standalones `treatment-5/6/7`. Now 46/19/10; sets 4 study, 2 data, 3 figure |
| lib/appsych-exams.mjs + test | No rule for a set that skips a usable item | `checkForms` now refuses a set block that leaves out a four-option single-answer item of its stimulus, unless `ctx.lessonChecks` lists it; test covers the catch, the lesson-check exception and a numeric sibling. The content check does not pass `lessonChecks` yet (outside this scope); no current set needs it |

All swapped-in items checked: four-option single answer, not a lesson check or unit-test item, in neither form before,
course order kept, 15 per unit. Practice 1 is now 46 and 47 of 75 (61% and 63%),
inside the third-party 60-70%; needs-author `practice-weights` stays open. Exam test file 9/9 pass;
`appsych-build.test.mjs` fails on a `pages.json` description edited by another session (not in this scope).

## Kept, with reasons

- Sets used in part: the forms keep every single-answer item of a set except numeric or specific items (not
  four-option). Kept items do not refer to an omitted one.
- r = .35 described as "weak" in `u1-twins-statistic` and `psy-exam-2-09`: follows `ApPsychStats.strength`
  (0.1-0.4 weak), the course's single rule.

## Open questions for a person

1. Practice weights (needs-author `practice-weights`): Practice 1 is 46 and 47 of 75 (61% and 63%), inside the
   third-party 60-70%, but the official weights are unpublished.
2. Pass `lessonChecks` to `checkForms` from `scripts/check-appsych-content.mjs` and the real-forms test, so a set whose
   lesson-check item is left out is accepted (none today).
