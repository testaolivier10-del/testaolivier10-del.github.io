# Brief for AP® Statistics content authors (Phase 1)

Repo `/home/claude/wt/stat` (or the main checkout), branch `claude/apstat`. Several authors and tool builders
work in this same folder at the same time. Read: `CLAUDE.md`, `docs/apstat-spec.md` (section 5a gives your
topics and FRQs), `docs/apstat-authoring-guide.md` (the rules; follow every one, especially the conclusion
templates and the scope list), `docs/apstat-architecture.md` ("Content formats"),
`docs/apstat-research/framework.md` (your unit's section 2 entries, the exclusions checklist, section 4 on the
exam and the reference sheet, section 6 on where students lose points), `docs/apstat-dependency-map.json`
(your topics' concepts: teach every concept listed as taught in your topic; never use a concept, or its
notation, before the topic that teaches it). For a model of finished work, look at one AP® Calculus AB topic
(the newest course, same shell): `calculus/data/lessons/ftc-accumulation.json`,
`calculus/data/notes/ftc-accumulation.html`, and search (never read whole)
`calculus/data/questions/ftc-accumulation.json`. The placeholder fixture `scripts/test/fixtures/apstat-data/`
shows every statistics format working (numeric items with `kind`, `from` and `alpha`, an interval, a setup
with `mustUse`, a conclusion with slots and a model, a boxplot stimulus drawn from its data, a probability
set, one FRQ of each type). Its wording is placeholder; never copy it.

## Rules for working in parallel

- Write ONLY your own files: `statistics/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `statistics/data/frq/<your frq ids>.json`, `statistics/figures/<your figure ids>.svg`, an optional figure
  generator `scripts/apstat-figures/<your unit>.mjs`, scratch files in your own scratch folder, and your report
  `docs/apstat-reviews/self-<your units>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later,
  or a concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your
  report. Never rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-apstat.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apstat-content.mjs --topic <id>` (until clean) and `node scripts/check-apstat-map.mjs`.
  To see a page rendered, build to a scratch dir with `APSTAT_PUBLISHED=<your units> node scripts/build-apstat.mjs --out <dir>`.

## What each CED topic needs

- Lesson JSON (hook from a real-looking study, prerequisites pointing at earlier topics, figure, cause-and-effect
  chain, key ideas, a misconception aimed at a reader-report error, 5-8 check items, summary). Skill topics in
  the math chapter: same formats, shorter, worked examples that show the algebra exactly as statistics will use
  it (a proportion as a part over a whole, a formula evaluated in order, "fewer than 3" as X ≤ 2).
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation or
  writing type is asked, with the expression, the substitution and the answer, and every conclusion written
  out in full with the templates. Comparison tables where they help. Plain, warm, precise, like a great
  teacher; build idea to idea, explain why before formulas. Short sentences.
- Questions: 15+ items per CED topic (8+ per skill topic), at least 60% apply/analyze, at least 40% in stimulus
  sets of 4-5 items sharing a data set, plot, table or study description. Single items with exactly 4 options
  and per-option explanations. Numeric items with `kind` and a `from` recipe (never a hand-typed calculated key),
  `alpha` on p-values, and 2-3 authored `mistakes` for the classic slips. `setup` items where the expression
  is the point (test statistics, margins of error, binomial probabilities), with `mustUse` and `mustNotUse` for
  what students drop. `conclude` items for every inference topic and every interpretation. Key-length balance
  (the key is the longest option at most 40% of the time). Original items and invented data only.
- Unit 2 and Unit 5 authors: the exam's sets, a stimulus with `set: "probability"` or `set: "regression"` and
  exactly 3 single-answer items; at least 4 per unit.
- Glossary for every concept the topic teaches.
- At least one figure per CED topic, professional quality and drawn from data: a `plot` spec
  (`kind: dot | hist | box | scatter | resid | bar | density`, `docs/apstat-architecture.md`, "Plot spec") is
  preferred, because the build draws it from the numbers; a standalone SVG from a generator script in
  `scripts/apstat-figures/<unit>.mjs` for diagrams (a sampling frame, an experiment's arrows, a tree). White
  background, `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink `#1F2A28`, course plum `#6E2470`
  for emphasis, a second colour from the Okabe-Ito set (`#0072B2` blue, `#009E73` green, `#D55E00`
  vermillion). Label axes with units. Render each figure to PNG and look at it before you finish (Playwright is
  installed, `CHROMIUM_PATH=/opt/pw-browsers/chromium`), and fix overlaps, cut-off labels and wrong scales.
- FRQs: the ones assigned to you in spec section 5a, each faithful to its type (authoring guide, "FRQs"),
  10 points with one rubric line per point, a full-credit sample per part typed as Bluebook allows, and a
  `check` on a part whose answer is a number or an interval.

## Accuracy (non-negotiable)

Every number must be right. Keys come from `from` recipes, so ApStatDist computes them; still recompute each
one in your own scratch script from the stem (not from the recipe), check that every authored mistake is graded
wrong and the key right (load `statistics/assets/stat-grade.js` and `stat-expr.js` in a vm, as
`scripts/test/apstat-questions.test.mjs` does), and check every plot shows the data the item states. Check
every option explanation and every conclusion against the templates (parameter, direction, context, evidence
wording, never "accept" or "prove"). Respect the scope list (no geometric distribution, no combining random
variables, no goodness of fit, no transformations, no slope inference, no pooled t, no normal approximation to
the binomial). Where the statistics or the scope is uncertain, add a short entry to your report (the lead
merges it into needs-author) instead of guessing.

## Report

Write `docs/apstat-reviews/self-<units>.md`: topics done, item and FRQ counts, figures, the numeric recheck
result, any map edits, and open questions. Reply in under 25 lines with the same summary.
