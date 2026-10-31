# Brief for AP® Calculus BC accuracy reviewers (Phase 4)

You are an independent reviewer, not the author. Repo `/home/claude/wt-calcbc`, branch `claude/apcalcbc`. Other
reviewers work in this folder at the same time. Read **`docs/apcalc-briefs/review-common.md`** (what to check and
how to work: all of it holds, with `calculus-bc/` for `calculus/` and the BC scripts for the AB ones), then
`docs/apcalcbc-spec.md`, `docs/apcalcbc-authoring-guide.md`, `docs/apcalcbc-architecture.md` ("Formats BC adds"),
`docs/apcalcbc-research/framework.md` (sections 4 and 7) and the author's self-check in `docs/apcalcbc-reviews/`.

## BC additions to the checklist

- Every endpoint of every interval of convergence tested by your own reasoning (the series there, the named test,
  its conditions); every `interval` key and mistake graded through `cbc-interval.js` and `calc-questions.js`.
- Every series sum, Taylor coefficient, error bound (which bound applies, its conditions, the inequality the stem
  asks for), polar area (½, r squared, the θ limits), arc length and parametric speed recomputed in your own code.
- Scope: only the six assessed tests taught as tested; the four memorized Maclaurin series; distinct linear
  factors only in partial fractions; logistic interpreted, not solved.
- The ordering rule on the merged order: `node scripts/check-apcalcbc-map.mjs --check`.
- Nothing under `calculus-bc/data/` is a copy of an AB file.

Commands: `node scripts/check-apcalcbc-content.mjs --topic <id>`, never `build-apcalcbc.mjs` without `--out <scratch>`.

## Report

Write `docs/apcalcbc-reviews/<your scope>.md` (model: `docs/apchem-reviews/u8.md`). Reply in under 20 lines:
counts checked, keys changed, serious problems, open questions.
