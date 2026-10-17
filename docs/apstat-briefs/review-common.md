# Brief for AP® Statistics accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo `/home/claude/wt/stat` (or the main checkout), branch
`claude/apstat`. Other reviewers and one exam builder work in this folder at the same time.

Read: `CLAUDE.md`, `docs/apstat-spec.md`, `docs/apstat-authoring-guide.md`, `docs/apstat-architecture.md`
("Content formats"), `docs/apstat-research/framework.md` (your units' section 2, the exclusions checklist,
section 4 on the reference sheet, section 6 on where students lose points), `docs/apstat-needs-author.md`
(`ced-text`), the author's self-check report for your units in `docs/apstat-reviews/self-*.md`, and, as the
model of a finished review, `docs/apchem-reviews/u8.md`. Try to confirm your units' learning objectives and any
exclusion ("not assessed") statements against the official CED PDF
(https://apcentral.collegeboard.org/media/pdf/ap-statistics-course-and-exam-description.pdf; WebFetch returns
only its first 110k characters, so say what you could and could not read).

## What to check, everything in your scope

- Statistical correctness of every lesson, notes page, glossary definition, question stem, option, key,
  explanation, FRQ part, rubric line and sample answer, figure and stimulus plot (drawn from the data stated;
  axes, labels and units; the shaded region is the probability asked for).
- Every numeric, interval and setup key recomputed by YOUR OWN code (a scratch script written from the stem,
  not from the item's `from` recipe; SciPy is installed for an independent check), then graded through the
  runtime graders (`statistics/assets/stat-grade.js`, `stat-expr.js` `gradeSetup` and
  `stat-questions.js`; load them in a vm the way `scripts/test/apstat-questions.test.mjs` does): every key
  right, every authored mistake wrong, the table route accepted where it should be.
- Every conclusion, interpretation and model answer against the templates: parameter defined in context,
  direction matching the alternative, "convincing evidence" language, p-value compared with alpha with the
  inequality, conditions in words with numbers, never "accept", "prove", "95% of the data" or a statement
  about the sample.
- Scope: nothing from a later topic used early (`node scripts/check-apstat-map.mjs`); nothing the revised
  course removed taught as tested content (a clearly labelled `going-further` aside is fine); no pooled t and no
  normal approximation to the binomial.
- Item quality: one defensible key; distractors plausible and each explanation right; no two items
  near-duplicates; key-length balance; stimulus sets coherent; the exam sets exactly 3 items; FRQ type faithful
  (10 points, one rubric line per point, sample).
- Clarity for a student starting from Algebra 1: a hard idea explained before it is used; no wrong-sounding
  shortcuts.
- Look at every figure rendered (PNG via Playwright) and fix wrong or ugly ones.

## How to work

- Fix problems directly in the data files (`statistics/data/...`, `statistics/figures/...`, the unit's figure
  generator in `scripts/apstat-figures/` if the figure comes from one, then regenerate only your figures).
  NEVER delete an item or change an item id or FRQ id (exam forms reference them); to retire a bad item,
  rewrite it in place.
- No git commands that change anything. Never run `node scripts/build-apstat.mjs` without `--out <scratch>`.
  Run `node scripts/check-apstat-content.mjs --topic <id>` for each topic you touch and
  `node scripts/check-apstat-map.mjs` at the end.
- Use your own scratch subfolder (the scratchpad root is shared).

## Report

Write `docs/apstat-reviews/<your scope>.md` like `docs/apchem-reviews/u8.md`: what was checked, the numeric
recheck result, every change (item id, old, new, why), keys changed, open questions for a person. Reply in
under 20 lines: counts checked, keys changed, serious problems found, open questions.
