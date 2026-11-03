# Brief for AP® Macroeconomics accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo: the main checkout, branch `claude/apmacro`. Other reviewers
and one exam builder work in this folder at the same time.

Read: `CLAUDE.md`, `docs/apmacro-spec.md`, `docs/apmacro-authoring-guide.md`, `docs/apmacro-architecture.md`
("Content formats", "Graphs"), `docs/apmacro-research/framework.md` (your units' section 3, section 5 on the exam,
sections 7-9), `docs/apmacro-needs-author.md` (`ced-text`, `topic-skills`, `balanced-budget`), the author's
self-check report for your units in `docs/apmacro-reviews/self-*.md`, and, as the model of a finished review,
`docs/apchem-reviews/u8.md`. Try to confirm your units' content against the official CED PDF
(https://apcentral.collegeboard.org/media/pdf/ap-macroeconomics-course-and-exam-description.pdf; say what you could
and could not read).

## What to check, everything in your scope

- Economics: every lesson, notes page, glossary definition, question stem, option, key, explanation, FRQ part,
  rubric line and sample answer, figure and stimulus, against the CED, the scoring guidelines and a current
  introductory macroeconomics text. The content traps of the authoring guide called out, never taught wrong.
- Graphs: every graph item and FRQ graph part against the labeling rules (axes exactly, curves named, the
  foreign exchange ratio the right way round, LRAS and LRPC vertical, ample reserves on the reserve market); every
  key scored by `ApMacroGrade.graph` and by YOUR OWN reasoning about which curve moves and why; every outcome on
  both axes right, and an indeterminate axis left out.
- Every numeric key recomputed by YOUR OWN code (a scratch script written from the stem, not from the item's
  `from` recipe), then graded through the runtime graders (`macroeconomics/assets/mac-calc.js`, `mac-grade.js`
  and `mac-questions.js`; load them in a vm the way `scripts/test/apmacro-questions.test.mjs` does): every key
  right, every authored mistake wrong. Arithmetic four-function friendly.
- Monetary policy: the framework stated and its tool used; the policy rate moved by administered rates with ample
  reserves; open market operations, the reserve requirement and the money multiplier only with limited reserves.
- Written answers: every chain has every link; self-adjustment through SRAS with its cause; gaps divided by the
  right multiplier with the direction first; "calculate" samples show work.
- Scope: nothing from a later topic used early (`node scripts/check-apmacro-map.mjs`); no PPI calculation; no
  microeconomics market structures; no released question reproduced or adapted.
- Item quality: one defensible key; distractors plausible and each explanation right; at least 60%
  apply/analyze; no near-duplicates; key-length balance; stimulus sets coherent (3-5 items); FRQ type faithful
  (10 or 5 points, one rubric line per point, a sample per part, a long question with a graph part).
- Clarity for a student starting from middle-school math: a hard idea explained before it is used.
- Look at every graph and figure rendered (PNG via Playwright) and fix wrong or ugly ones.

## How to work

- Fix problems directly in the data files (`macroeconomics/data/...`, `macroeconomics/figures/...`). NEVER delete
  an item or change an item id or FRQ id (exam forms reference them); to retire a bad item, rewrite it in place.
- No git commands that change anything. Never run `node scripts/build-apmacro.mjs` without `--out <scratch>`.
  Run `node scripts/check-apmacro-content.mjs --topic <id>` for each topic you touch and
  `node scripts/check-apmacro-map.mjs` at the end.
- Use your own scratch subfolder (the scratchpad root is shared).

## Report

Write `docs/apmacro-reviews/<your scope>.md` like `docs/apchem-reviews/u8.md`: what was checked, the numeric and
graph recheck results, every change (item id, old, new, why), keys changed, open questions for a person. Reply in
under 20 lines: counts checked, keys changed, serious problems found, open questions.
