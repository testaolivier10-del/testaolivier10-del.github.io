# Brief for AP® Environmental Science accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo: the main checkout, branch `claude/apenv`. Other reviewers
and one exam builder work in this folder at the same time.

Read: `CLAUDE.md`, `docs/apenv-spec.md`, `docs/apenv-authoring-guide.md`, `docs/apenv-architecture.md` ("Content
formats"), `docs/apenv-research/framework.md` (your units' section 2, section 4 on the exam, section 6 on where
students lose points, section 7 on calculations), `docs/apenv-needs-author.md` (`ced-text`), the author's
self-check report for your units in `docs/apenv-reviews/self-*.md`, and, as the model of a finished review,
`docs/apchem-reviews/u8.md`. Try to confirm your units' learning objectives and any "not assessed" statements
against the official CED PDF (https://apcentral.collegeboard.org/media/pdf/ap-environmental-science-course-and-exam-description.pdf;
WebFetch returns only its first part, so say what you could and could not read).

## What to check, everything in your scope

- Science: every lesson, notes page, glossary definition, question stem, option, key, explanation, FRQ part,
  rubric line and sample answer, figure and stimulus, against the CED and mainstream sources (EPA, NOAA, USGS,
  IPCC, a current college text). The content traps of the authoring guide called out, never taught wrong.
- Data: every stimulus is `invented: true` or names a public source; real numbers match that source; invented
  numbers are plausible; every plot is drawn from the numbers stated (axes, labels, units).
- Every numeric and setup key recomputed by YOUR OWN code (a scratch script written from the stem, not from the
  item's `from` recipe), then graded through the runtime graders (`environmental-science/assets/env-calc.js`,
  `env-grade.js`, `env-expr.js` `gradeSetup` and `env-questions.js`; load them in a vm the way
  `scripts/test/apenv-questions.test.mjs` does): every key right with its unit, every authored mistake wrong,
  equivalent unit spellings accepted, the setup brackets rule applied.
- Written answers: every model, `earns` answer and FRQ sample is specific enough to score (a directional
  hypothesis, the measured variable, a control with its purpose, a complete chain, a fitted solution that says
  how it works, a policy that is a law); every `misses` answer shows a real reader-report miss.
- Scope: nothing from a later topic used early (`node scripts/check-apenv-map.mjs`); no graphing-calculator
  steps, statistics tests or calculus.
- Item quality: one defensible key; distractors plausible and each explanation right; no near-duplicates;
  key-length balance; stimulus sets coherent (3-5 items); FRQ type faithful (10 points, one rubric line per
  point, sample; a `check` on calc FRQs).
- Clarity for a student starting from middle-school science: a hard idea explained before it is used.
- Look at every figure rendered (PNG via Playwright) and fix wrong or ugly ones.

## How to work

- Fix problems directly in the data files (`environmental-science/data/...`, `environmental-science/figures/...`,
  the unit's figure generator in `scripts/apenv-figures/` if the figure comes from one, then regenerate only your
  figures). NEVER delete an item or change an item id or FRQ id (exam forms reference them); to retire a bad
  item, rewrite it in place.
- No git commands that change anything. Never run `node scripts/build-apenv.mjs` without `--out <scratch>`. Run
  `node scripts/check-apenv-content.mjs --topic <id>` for each topic you touch and
  `node scripts/check-apenv-map.mjs` at the end.
- Use your own scratch subfolder (the scratchpad root is shared).

## Report

Write `docs/apenv-reviews/<your scope>.md` like `docs/apchem-reviews/u8.md`: what was checked, the numeric
recheck result, every change (item id, old, new, why), keys changed, open questions for a person. Reply in under
20 lines: counts checked, keys changed, serious problems found, open questions.
