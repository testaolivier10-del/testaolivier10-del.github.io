# Brief for AP® Psychology accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo: the main checkout, branch `claude/appsych`. Other reviewers
and one exam builder work in this folder at the same time.

Read: `CLAUDE.md`, `docs/appsych-spec.md`, `docs/appsych-authoring-guide.md`, `docs/appsych-architecture.md`
("Content formats"), `docs/appsych-research/framework.md` (your units' section 3, section 5 on the exam, section 7
on where students lose points), `docs/appsych-needs-author.md` (`ced-text`, `exclusions`, `replication`), the
author's self-check report for your units in `docs/appsych-reviews/self-*.md`, and, as the model of a finished
review, `docs/apchem-reviews/u8.md`. Try to confirm your units' learning objectives and exclusion statements
against the official CED PDF (https://apcentral.collegeboard.org/media/pdf/ap-psychology-course-and-exam-description.pdf;
WebFetch returns only its first part, so say what you could and could not read).

## What to check, everything in your scope

- Science: every lesson, notes page, glossary definition, question stem, option, key, explanation, FRQ part,
  rubric line and sample answer, figure and stimulus, against the CED, the DSM-5-TR and mainstream sources (a
  current introductory text, APA resources, the original papers for named studies). The content traps of the
  authoring guide called out, never taught wrong; no myth taught as fact; no excluded content taught as tested.
- Studies and data: every study or data stimulus is `invented: true` or cites a real study by authors and year;
  a real study's design and findings are described accurately, with its replication status where the guide asks;
  invented studies are plausible and never attributed to a real researcher or journal; every plot is drawn from
  the numbers stated (axes, labels, groups).
- Every numeric key recomputed by YOUR OWN code (a scratch script written from the stem, not from the item's
  `from` recipe), then graded through the runtime graders (`psychology/assets/psy-stats.js`, `psy-grade.js` and
  `psy-questions.js`; load them in a vm the way `scripts/test/appsych-questions.test.mjs` does): every key right,
  every authored mistake wrong. All numbers small enough to do by hand (no calculator on the exam).
- Research methods: the method named exactly, operational definitions as measured, random sampling kept apart
  from random assignment, correlation never read as causation, significance never read as size, ethics as the
  summary describes it, generalization from participant characteristics.
- Written answers: every model, `earns` answer and FRQ sample is specific enough to score and applies the concept
  to the scenario; EBQ samples cite sources, use different sources in C(i) and a different concept in C(ii), and
  never use a restricted term as the concept; every `misses` answer shows a real reader-report miss.
- Mental health: DSM-5-TR names and criteria, person-first language, no self-diagnosis prompts, the help line on
  disorder and treatment pages, treatments presented by their evidence.
- Scope: nothing from a later topic used early (`node scripts/check-appsych-map.mjs`); no inferential test names,
  no calculator steps.
- Item quality: one defensible key; distractors plausible and each explanation right; at least 70%
  apply/analyze; no near-duplicates; key-length balance; stimulus sets coherent (3-5 items); FRQ type faithful
  (7 points, the exam's parts in order, one rubric line per point, a sample per part).
- Clarity for a student starting from middle-school science: a hard idea explained before it is used.
- Look at every figure rendered (PNG via Playwright) and fix wrong or ugly ones; anatomy must be right.

## How to work

- Fix problems directly in the data files (`psychology/data/...`, `psychology/figures/...`, the unit's figure
  generator in `scripts/appsych-figures/` if the figure comes from one, then regenerate only your figures). NEVER
  delete an item or change an item id or FRQ id (exam forms reference them); to retire a bad item, rewrite it in
  place.
- No git commands that change anything. Never run `node scripts/build-appsych.mjs` without `--out <scratch>`.
  Run `node scripts/check-appsych-content.mjs --topic <id>` for each topic you touch and
  `node scripts/check-appsych-map.mjs` at the end.
- Use your own scratch subfolder (the scratchpad root is shared).

## Report

Write `docs/appsych-reviews/<your scope>.md` like `docs/apchem-reviews/u8.md`: what was checked, the numeric
recheck result, every change (item id, old, new, why), keys changed, open questions for a person. Reply in under
20 lines: counts checked, keys changed, serious problems found, open questions.
