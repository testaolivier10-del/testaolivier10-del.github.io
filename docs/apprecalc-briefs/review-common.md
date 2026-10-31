# Brief for AP® Precalculus accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo: the worktree on branch `claude/apprecalc`. Other reviewers
and one exam builder work in this folder at the same time.

Read: `CLAUDE.md`, `docs/apprecalc-spec.md`, `docs/apprecalc-authoring-guide.md`, `docs/apprecalc-architecture.md`
("Math", "Content formats"), `docs/apprecalc-research/framework.md` (your units' section 3, section 5 on the exam,
section 7 on where students lose points), `docs/apprecalc-needs-author.md` (`ced-text`, `ced-exclusions`,
`exclusions-trig`), the author's self-check report for your units in `docs/apprecalc-reviews/self-*.md`, and, as
the model of a finished review, one of `docs/apcalc-reviews/`. Try to confirm your units' learning objectives and
any "outside the scope" statements against the official CED PDF
(https://apcentral.collegeboard.org/media/pdf/ap-precalculus-course-and-exam-description.pdf; WebFetch may return
only its first part, so say what you could and could not read).

## What to check, everything in your scope

- Math: every lesson, notes page, glossary definition, question stem, option, key, explanation, FRQ part, rubric
  line and sample answer, figure and stimulus. Definitions as the CED uses them (average rate of change, concavity
  from rates over equal intervals, the principal ranges of inverse trig, polar conversions).
- Every numeric key recomputed by YOUR OWN code (a scratch script written from the stem), then graded through the
  runtime (`precalculus/assets/pcalc-expr.js`, `pcalc-questions.js`; load them in a vm the way
  `scripts/test/apprecalc-questions.test.mjs` does): every key right, the three-decimal rule on calculator items,
  exact keys on the others. Every `expr` key compared on its domain, every authored mistake graded wrong, and the
  domain chosen so a log or inverse-trig slip is caught. Every "all solutions" item brute-forced over its interval.
- Plots: every plot is the function stated (zeros, holes, asymptotes, period, midline, amplitude).
- Written answers: every `earns` answer, model answer and FRQ sample ties its reason to the given values, uses
  limit notation where the exam wants it, names the secant for an average rate, reads concavity on the stated
  interval, and uses no calculus wording; every `misses` answer shows a real reader-report miss.
- Scope: nothing from a later topic used early (`node scripts/check-apprecalc-map.mjs`); no calculus; nothing from
  the exclusions in an exam item; Unit 4 never in an FRQ or an exam.
- Item quality: one defensible key; distractors plausible and each explanation right; no near-duplicates;
  key-length balance; stimulus sets coherent (4-5 items); FRQ type faithful (6 points, one rubric line per point,
  a sample per part, the calculator flag by type).
- Clarity for a student fresh from Algebra 2: a hard idea explained before it is used.
- Look at every figure rendered (PNG via Playwright) and fix wrong or ugly ones.

## How to work

- Fix problems directly in the data files (`precalculus/data/...`, `precalculus/figures/...`, the figure generator
  in `scripts/apprecalc-figures/` if the figure comes from one, then regenerate only your figures). NEVER delete an
  item or change an item id or FRQ id (exam forms reference them); to retire a bad item, rewrite it in place.
- No git commands that change anything. Never run `node scripts/build-apprecalc.mjs` without `--out <scratch>`.
  Run `node scripts/check-apprecalc-content.mjs --topic <id>` for each topic you touch and
  `node scripts/check-apprecalc-map.mjs` at the end.
- Use your own scratch subfolder (the scratchpad root is shared).

## Report

Write `docs/apprecalc-reviews/<your scope>.md`: what was checked, the recheck result, every change (item id, old,
new, why), keys changed, open questions for a person. Reply in under 20 lines: counts checked, keys changed,
serious problems found, open questions.
