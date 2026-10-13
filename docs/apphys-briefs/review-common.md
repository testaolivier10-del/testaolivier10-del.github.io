# Brief for AP® Physics 1 accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo `/home/claude/testaolivier10-del.github.io`, branch
`claude/apphys`. Other reviewers and one exam builder work in this folder at the same time.

Read: `CLAUDE.md`, `docs/apphys-spec.md`, `docs/apphys-authoring-guide.md`, `docs/apphys-architecture.md`
("Content formats"), `docs/apphys-research/framework.md` (your units' section 3, the exclusions checklist,
section 8 common errors), the author's self-check report for your units in `docs/apphys-reviews/self-*.md`,
and, as the model of a finished review, `docs/apchem-reviews/u8.md`. Try to confirm your units' exclusion
("not assessed") statements against the official CED PDF
(https://apcentral.collegeboard.org/media/pdf/ap-physics-1-course-and-exam-description.pdf, or the course
page's links); if it cannot be downloaded, say so.

## What to check, everything in your scope

- Physics correctness of every lesson, notes page, glossary definition, question stem, option, key,
  explanation, FRQ part, rubric line and sample answer, figure and stimulus picture (arrow directions and
  relative lengths, labels, graphs drawn from the right relation, units on axes).
- Every numeric key and authored mistake recomputed by YOUR OWN code (a scratch script, written from the
  stem, not from the author's numbers), then graded through the runtime grader (`physics/assets/phys-questions.js`,
  load it in a vm the way `scripts/test/apphys-questions.test.mjs` does): every key right, every mistake wrong.
  Sig figs consistent with the data. g stated where used.
- Scope: nothing from a later topic used early (`node scripts/check-apphys-map.mjs`), nothing the CED
  excludes taught as tested content (a clearly labelled "going further" aside is fine).
- Item quality: one defensible key; distractors plausible and each explanation right; no two items
  near-duplicates; key-length balance; stimulus sets coherent; FRQ type faithful (points, rubric, sample).
- Clarity for a student: a hard idea explained before it is used; no wrong-sounding shortcuts.
- Look at every figure rendered (PNG via Playwright, installed) and fix wrong or ugly ones.

## How to work

- Fix problems directly in the data files (`physics/data/...`, `physics/figures/...`, the unit's figure
  generator in `scripts/apphys-figures/` if the figure comes from one, then regenerate only your figures).
  NEVER delete an item or change an item id or FRQ id (exam forms reference them); to retire a bad item,
  rewrite it in place.
- No git commands that change anything. Never run `node scripts/build-apphys.mjs` without `--out <scratch>`.
  Run `node scripts/check-apphys-content.mjs --topic <id>` for each topic you touch and
  `node scripts/check-apphys-map.mjs` at the end.
- Use your own scratch subfolder (the scratchpad root is shared).

## Report

Write `docs/apphys-reviews/<your scope>.md` like `docs/apchem-reviews/u8.md`: what was checked, the
numeric recheck result, every change (item id, old, new, why), keys changed, open questions for a person.
Reply in under 20 lines: counts checked, keys changed, serious problems found, open questions.
