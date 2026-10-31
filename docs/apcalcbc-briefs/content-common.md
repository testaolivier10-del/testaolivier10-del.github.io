# Brief for AP® Calculus BC content authors (Phase 1)

Repo `/home/claude/wt-calcbc` (git worktree), branch `claude/apcalcbc`. Several authors and tool builders work in
this same folder at the same time. Read: `CLAUDE.md`, `docs/apcalcbc-spec.md`, **`docs/apcalc-authoring-guide.md`
and then `docs/apcalcbc-authoring-guide.md`** (both apply; follow every rule), `docs/apcalcbc-architecture.md`
("Reuse", "Formats BC adds"), `docs/apcalc-architecture.md` ("Content formats"), `docs/apcalcbc-research/framework.md`
(sections 4, 5 and 7: your topics' objectives, the FRQ task models, where BC students lose points),
`docs/apcalcbc-dependency-map.json` (your topics' concepts: teach every concept taught in your topic; never use one
before the topic that teaches it, in the merged order of `node scripts/check-apcalcbc-map.mjs --order`). Your own
brief (`a.md` ... `d.md` here) lists your topics, FRQs and stimulus sets. For a model of finished work, look at one
AB topic (same formats): `calculus/data/lessons/u-substitution.json`, `calculus/data/notes/u-substitution.html`, and
search (never read whole) `calculus/data/questions/u-substitution.json`. The fixture
`scripts/test/fixtures/apcalcbc-data/` shows BC's new formats: `interval` items, a 10.13 topic, one FRQ of each BC type.

## Rules for working in parallel

- Write ONLY your own files: `calculus-bc/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `calculus-bc/data/frq/<your frq ids>.json`, `calculus-bc/figures/<your figure ids>.svg`, an optional figure
  generator `scripts/apcalcbc-figures/<you>.mjs`, scratch files in your own scratch folder, and your report
  `docs/apcalcbc-reviews/self-<you>.md`. Never copy or write an AB topic's file into `calculus-bc/data/`.
- Do not edit the generator, runtime, checks, `pages.json`, `published.json`, AB's files (author A's
  `calc-ab-only`/`cbc-only` edits excepted, see `a.md`), other authors' files or docs. If the map is wrong for one
  of YOUR topics, make the smallest possible Edit to that topic's or concept's entry in the overlay only and list it
  in your report.
- No git commands that change anything (no add, commit, stash, checkout, reset). I commit.
- Never run `node scripts/build-apcalcbc.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apcalcbc-content.mjs --topic <id>` (until clean) and `node scripts/check-apcalcbc-map.mjs`.
  To see a page: `APCALCBC_PUBLISHED=<your units> node scripts/build-apcalcbc.mjs --out <dir>` (AB units you need
  for context can be listed too; they build from AB's files).

## What each topic needs

As AB (content-common of AB, condensed): lesson JSON (hook, 2-3 prerequisite questions pointing at earlier topics,
figure, a cause-and-effect chain, key ideas, a misconception aimed at a real reader-report error, 5-8 check items,
summary); notes HTML (500+ words for a CED topic, `<h2>` sections, a worked example before any calculation type is
asked, comparison tables where they help); 15+ questions per CED topic (8+ per math topic), 60% apply/analyze, 40%
in stimulus sets of 4-5, four-option singles with per-option explanations, numeric, `expr` and **`interval`** items
with authored `mistakes` for the BC slips (framework.md section 7); a glossary entry for every concept the topic
teaches; at least one figure per CED topic, drawn from the actual function (`plot` specs, or a generator script),
accent emerald `#0A5A34` for emphasis and the Okabe-Ito colours for further curves; your FRQs, faithful to their
type, 9 points, one rubric line per point, a full-credit sample per part. Original items only.

## Accuracy (non-negotiable)

Recompute every numeric key, interval endpoint and authored mistake in your own scratch code (series sums, ratio
test limits, Taylor coefficients, error bounds, polar areas, arc lengths, Euler tables) and grade every key and
mistake through the runtime (`calculus/assets/calc-expr.js`, `calculus-bc/assets/cbc-interval.js`,
`calculus/assets/calc-questions.js` in a vm, as `scripts/test/apcalcbc-questions.test.mjs` does). Check every
endpoint test by hand: the series at that endpoint, the test, and its conditions. Respect the scope list in the BC
authoring guide. Where the mathematics or scope is uncertain, write it in your report (I merge it into
`docs/apcalcbc-needs-author.md`) instead of guessing.

## Report

Write `docs/apcalcbc-reviews/self-<you>.md`: topics done, item and FRQ counts, figures, the numeric recheck
result, any map edits, open questions. Reply in under 25 lines with the same summary.
