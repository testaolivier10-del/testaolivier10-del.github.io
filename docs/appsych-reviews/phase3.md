# AP® Psychology Phase 3: build report

Built 2026-10-27 by the Phase 3 builder, as AP® Environmental Science's Phase 3 (`docs/apenv-spec.md` decision 11),
adapted to psychology (spec sections 5, 8 and 10). The independent accuracy review of the new content is Phase 4
(this report lists what to check). Status and the decision: `docs/appsych-spec.md` (Phase 3 row, decision 12).

## What was built

| Part | Where | What |
|---|---|---|
| Practice exams | `psychology/data/exams/forms.json`, `items.json` | Two forms, 75 four-option MCQ each, in course order, 15 per unit (range 11-19). 20 exam-only items per form and 55 bank items (never a lesson check item or a free unit-test item; nothing in both forms). Form 1: exam-only sets `exam-1-s1` (study: afternoon caffeine and sleep onset, method, operational definition, generalizing, the statistic) and `exam-1-s2` (data: recall after deep or shallow processing; mean, median, range by hand), plus 12 standalones; bank sets neural-firing s2, sensation s2, perception s2, development-methods s2, social-emotional-development s3, psychodynamic-humanistic s1, health-psychology s2, treatment s2. Form 2: `exam-2-s1` (study: social loafing with deception and debriefing; IV, operational definition, ethics applied, generalizing) and `exam-2-s2` (data: symptom counts with an outlier; mean, median, which measure, range), plus 12 standalones; bank sets brain s3, sleep s2, thinking s2, storing-memories s2, physical-development s2 and s3, social-situations s3, psychodynamic-humanistic s3, treatment s3, disorders s4. Sets per form: form 1 4 study, 3 data, 3 figure (35 questions); form 2 5 study, 5 data, 2 figure (37). Practices: form 1 43/21/11, form 2 36/26/13 (not enforced: `practicesConfirmed` false). Section II: form 1 `frq-forgetting-aaq`, `frq-social-cognitive-trait-ebq`; form 2 `frq-social-situations-aaq`, `frq-treatment-anxiety-ebq`. |
| Reader-report traps | exam-only standalones | Random assignment versus random sampling, cohort effects in cross-sectional designs, attrition in longitudinal ones, operational definitions, a placebo control, double-blind, self-report bias, self-selected samples, a testable hypothesis, demand characteristics, reliability, a third variable, correlation direction and strength (not a percent, not a cause), significance versus effect size, debriefing after deception, parental consent plus assent, the case study's limit, the normal curve (percentiles, the 68% band) and z scores. |
| Recomputed numbers | `scripts/lib/appsych-exams.mjs` `EXAM_NUMBERS` (13) | Every exam-only key and its named-slip distractors (median for mean, the sum, the range, the list's printed middle, 34% or 68% for the 84th percentile, 95% or 2.5% for "below +2 SD", raw points for z, the swapped tests) recomputed by `ApPsychStats`; side checks (means 15 and 7; mean above median with mode 3). Tests show the check bites on a changed key and a changed distractor. |
| Timed sections, unit tests, cram kit, statistics page | Phase 0 code, unchanged | `exams.html?form=<n>&section=1|2`; 12-question free unit tests; cram kit default 2027-05-14 in the 75 + 2 format; "Statistics you must know" and its flashcard deck. Verified on a full scratch build (all chapters published): both forms served, 5 unit tests. |
| Research terms | no new page | Decided against a separate "Research terms and statistics" sheet: the glossary already defines all research vocabulary, the "Research skills you need" chapter is a flashcard deck (`flashcards.html?unit=skills-research`, now linked from the statistics page), and the statistics page and deck hold the descriptive statistics. A third page would repeat them. |

## Lead notes (spec section 10)

- **(a) FRQ teaching order.** `checkFrq` (`scripts/check-appsych-content.mjs`) scans every string of an FRQ except
  its restricted-term lists against the latest of its `topics` in course order, and requires each topic's unit in
  `units`. Exams are exempt. Failing and fixed: `frq-heredity-environment-aaq` (+ `research-ethics`, unit
  `skills-research`), `frq-research-methods-aaq` (+ `research-sampling`, `research-ethics`, `stats-significance`),
  `frq-stats-correlation-aaq` (+ `research-ethics`), `frq-forgetting-aaq` (+ `stats-descriptive`,
  `stats-significance`), `frq-retrieving-memories-ebq` (+ `forgetting`); `frq-health-psychology-ebq` claim topic
  reworded ("physical or mental health"). `frq-development-methods-aaq` already listed 3.6 and passes.
- **(b) `ApPsychPlot` margin.** The left pad is the widest y tick label (measured with the plot's text width
  estimate) plus 12 px, at least 38. The hypnogram (`sleep-s1`) now reads Awake, REM, N1, N2, N3.
- **(c) Shared tool helpers.** `ApPsychTools.hintSlot(s, target, text, { before, cls })` (also takes a `before` node
  as the fourth argument, as the builders' copies do) and, in `psy-tools.css`, `body.ls-on .psy-crumb{display:none;}`
  and `.psy-tipslot`. The trainers keep their own copies until review (none edited).
- **(d) Help note.** Lesson field `"help": true`; the generator prints `HELP_LINE` after the lesson summary and on the
  notes page (top, or at `<div data-psy-help></div>`). Required on 5.3-5.5; pasted copies refused. 5.1 dropped (not
  a disorder topic); 3.6 kept beside its ACEs section via `HELP_EXTRA` (needs-author `help-scope`).
- **(e) Heritability.** 1.1 and 2.8 now say the same thing: twin and adoption studies usually estimate the
  heritability of intelligence test scores at about 0.5 in adults (lower in childhood), mostly from wealthier
  countries; it describes differences within a group.

## Needs-author

Every open point in `docs/appsych-reviews/self-*.md` is in `docs/appsych-needs-author.md`: the replication entry
gained every author's study; new entries `help-scope`, `justify-prompts`, `milgram-detail`, `poll-1936`,
`effect-size`, `wording-cautious`, `numbers-secondary`, `sensitive-scope`, `figures-schematic`, `page-title-dash`;
`frq-order` added as resolved; `mental-health-line` (resolved) records the Phase 3 field; `mcq-sets` records the
set counts chosen and stays open. Author A's tool test failure and author G's map failure no longer occur.

## Not done

- The "Make it specific" prompts (`data/justify/`) were not in this phase's brief and are not written; the
  40-prompt content rule waits until the folder exists (needs-author `justify-prompts`).

## Checks run

`node scripts/check-appsych-content.mjs --check`: 42 topics, 807 items, 0 failing; 2 exams, 40 exam-only items, 0
failing. `check-appsych-map --check`: nothing used before it is taught. `build-appsych --check`: up to date. Full
scratch build with every chapter published: 42 topics, 192 files, both forms served. `node --test
scripts/test/appsych-*.test.mjs`: 151 pass, 0 fail (new: the real forms and recomputed numbers, timed sections, FRQ
order, the help field, the measured margin, the shared helpers). `scripts/ci-local.sh`: see the spec's Phase 3 row.

## For Phase 4

Check every exam-only item and its explanations (40), the two exam studies and data tables, the refiled FRQs'
listed topics, and the reworded heritability sentence.
