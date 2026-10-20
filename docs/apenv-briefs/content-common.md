# Brief for AP® Environmental Science content authors (Phase 1)

Repo: the main checkout, branch `claude/apenv`. Seven authors (A-G) and up to four tool builders work in this
same folder at the same time. Read: `CLAUDE.md`, `docs/apenv-spec.md` (section 5a gives your topics, FRQs and
stimulus sets; your own brief `docs/apenv-briefs/<letter>.md` lists them), `docs/apenv-authoring-guide.md` (the
rules; follow every one, especially "Calculations", "Writing answers specific enough to score" and "Content
traps"), `docs/apenv-architecture.md` ("Content formats"), `docs/apenv-research/framework.md` (your units'
section 2 entries, section 4 on the exam, section 6 on where students lose points, section 7 on calculations),
and `docs/apenv-dependency-map.json` (your topics' concepts: teach every concept listed as taught in your topic;
never use a concept, or its notation, before the topic that teaches it). For a model of finished work, look at
one AP® Statistics topic (same shell): `statistics/data/lessons/experimental-design.json`,
`statistics/data/notes/experimental-design.html`, and search (never read whole) its questions file. The
placeholder fixture `scripts/test/fixtures/apenv-data/` shows every format working (numeric items with `from`,
`unit` and `mistakes`, a setup with `then`, a `specific` builder, the three set kinds, a pyramid drawn from its
data, one FRQ of each type with a numeric and a setup check). Its wording is placeholder; never copy it.

## Rules for working in parallel

- Write ONLY your own files: `environmental-science/data/{lessons,notes,questions,glossary,figures,labels}/<your
  topic>.*`, `environmental-science/data/frq/<your frq ids>.json`, `environmental-science/figures/<your figure
  ids>.svg`, an optional figure generator `scripts/apenv-figures/<your unit>.mjs`, scratch files in your own
  scratch folder, and your report `docs/apenv-reviews/self-<your letter>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later, or
  a concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your
  report. Never rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-apenv.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apenv-content.mjs --topic <id>` (until clean) and `node scripts/check-apenv-map.mjs`. To see
  a page rendered: `APENV_PUBLISHED=<your units> node scripts/build-apenv.mjs --out <dir>`.

## What each CED topic needs

- Lesson JSON (hook from a real-looking system, prerequisites pointing at earlier topics, a figure, a
  cause-and-effect chain, key ideas, a misconception aimed at a reader-report error, 5-8 check items, summary).
  Math-chapter topics (author A): same formats, shorter, worked examples that show the arithmetic exactly as the
  exam uses it, with brackets and units.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation or
  writing type is asked, comparison tables where they help (cycles, pollutants, energy sources). Plain, warm,
  precise; explain why before how. Short sentences. American spelling, no em dashes.
- Questions: 15+ items per CED topic (8+ per math topic), at least 60% apply/analyze, at least 40% in stimulus
  sets of 3-5 items. Single items with exactly 4 options and per-option explanations. Every calculation as a
  `numeric` item with a `from` recipe and a `unit` (never a hand-typed key) and 2-3 authored `mistakes`, or a
  `setup` item (brackets, units, `mustUse`, a `then` step with its recipe). `specific` items for hypotheses,
  variables, controls, chains, solutions and policies. Key-length balance (the key is the longest option at most
  40% of the time).
- Stimulus sets: the kinds your brief lists (`quantitative`, `visual`, `text`), each stimulus marked
  `"invented": true` or with a `source` naming the public source (authoring guide, "Data").
- Glossary for every concept the topic teaches.
- At least one figure per CED topic, drawn from data where it shows data: a `plot` spec (`kind: line | bar |
  scatter | dual | pyramid | curve`, `docs/apenv-architecture.md`, "Plot spec") is preferred, because the build
  draws it from the numbers; a standalone SVG from a generator script for diagrams (a cycle, a watershed, a
  power plant). White background, `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink `#1F2A28`,
  course olive `#474A10` for emphasis, a second color from the Okabe-Ito set (`#0072B2` blue, `#009E73` green,
  `#D55E00` vermillion). Label axes with units. Render each figure to PNG and look at it before you finish
  (Playwright is installed, `CHROMIUM_PATH=/opt/pw-browsers/chromium`); fix overlaps and cut-off labels.
- FRQs: the ones in your brief, each faithful to its type (authoring guide, "FRQs"), 10 points with one rubric
  line per point, a full-credit sample per part, and on every `calc` FRQ at least one `check` (numeric or setup).

## Accuracy (non-negotiable)

Every number must be right and every science claim must match the CED and mainstream sources. Keys come from
`from` recipes, so ApEnvCalc computes them; still recompute each one in your own scratch script from the stem
(not from the recipe), check that every authored mistake is graded wrong and the key right (load
`environmental-science/assets/env-calc.js`, `env-grade.js` and `env-expr.js` in a vm, as
`scripts/test/apenv-questions.test.mjs` does), and check every plot shows the data the item states. Real data
quoted exactly from its source, or labeled invented. Where the science is contested or uncertain, add a short
entry to your report (the lead merges it into needs-author) instead of guessing.

## Report

Write `docs/apenv-reviews/self-<letter>.md`: topics done, item and FRQ counts, figures, the numeric recheck
result, any map edits, and open questions. Reply in under 25 lines with the same summary.
