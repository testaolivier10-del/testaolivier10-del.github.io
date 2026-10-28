# Brief for AP® Psychology content authors (Phase 1)

Repo: the main checkout, branch `claude/appsych`. Seven authors (A-G) and up to four tool builders work in this
same folder at the same time. Read: `CLAUDE.md`, `docs/appsych-spec.md` (section 5a gives your topics, FRQs and
stimulus sets; your own brief `docs/appsych-briefs/<letter>.md` lists them), `docs/appsych-authoring-guide.md`
(the rules; follow every one, especially "Apply, do not define", "Research methods and statistics", "The
free-response questions", "Mental health" and "No myths"), `docs/appsych-architecture.md` ("Content formats"),
`docs/appsych-research/framework.md` (your units' section 3 entries, section 5 on the exam, section 7 on where
students lose points), and `docs/appsych-dependency-map.json` (your topics' concepts: teach every concept listed
as taught in your topic; never use a concept, or its notation, before the topic that teaches it). For a model of
finished work, look at one AP® Environmental Science topic (same shell):
`environmental-science/data/lessons/eutrophication.json`, `environmental-science/data/notes/eutrophication.html`,
and search (never read whole) its questions file. The placeholder fixture `scripts/test/fixtures/appsych-data/`
shows every format working (numeric items with `from` and `mistakes`, `specific` builders with psychology slots
and hints, the three set kinds, a study summary in the exam's sections, a normal curve drawn from its numbers, an
AAQ and an EBQ). Its wording is placeholder; never copy it.

## Rules for working in parallel

- Write ONLY your own files: `psychology/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `psychology/data/frq/<your frq ids>.json`, `psychology/figures/<your figure ids>.svg`, an optional figure
  generator `scripts/appsych-figures/author-<letter>.mjs`, scratch files in your own scratch folder, and your
  report `docs/appsych-reviews/self-<your letter>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later, or a
  concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your report.
  Never rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-appsych.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-appsych-content.mjs --topic <id>` (until clean) and `node scripts/check-appsych-map.mjs`.
  To see a page rendered: `APPSYCH_PUBLISHED=<your units> node scripts/build-appsych.mjs --out <dir>`.

## What each topic needs

- Lesson JSON (hook from a real-looking situation, prerequisites pointing at earlier topics, a figure, a
  cause-and-effect chain, key ideas, a misconception aimed at a reader-report error or a common myth, 5-8 check
  items, summary). Research skills topics (author A): same formats, shorter, with worked examples that read a
  study exactly as the AAQ asks.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation or
  writing type is asked, comparison tables where they help (conditioning, attribution biases, therapies). Plain,
  warm, precise; explain why before how. Short sentences. American spelling, no em dashes. Disorder and
  treatment pages carry the help line (authoring guide).
- Questions: 15+ items per CED topic (8+ per research skills topic), at least 70% apply/analyze (a scenario,
  then the concept that explains it), at least 40% in stimulus sets of 3-5 items. Single items with exactly 4
  options and per-option explanations. Descriptive statistics as `numeric` items with a `from` recipe and 2-3
  authored `mistakes`, small enough to do by hand. `specific` items for methods, operational definitions,
  claims, citations and links. Key-length balance (the key is the longest option at most 40% of the time).
- Stimulus sets: the kinds your brief lists (`study`, `data`, `visual`); every study or data stimulus
  `"invented": true` or with a `source` citing the real study by authors and year (authoring guide).
- Glossary for every concept the topic teaches.
- At least one figure per CED topic: a `plot` spec (`kind: line | bar | scatter | histogram | normal`,
  `docs/appsych-architecture.md`, "Plot spec") where it shows data, so the build draws it from the numbers; a
  standalone SVG from a generator script for diagrams (a neuron, the brain, the eye, a conditioning sequence).
  White background, `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink `#1F2A28`, course cerulean
  `#084F78` for emphasis, a second color from the Okabe-Ito set (`#D55E00` vermillion, `#009E73` green,
  `#CC79A7` reddish purple). Label axes. Render each figure to PNG and look at it before you finish (Playwright
  is installed, `CHROMIUM_PATH=/opt/pw-browsers/chromium`); fix overlaps and cut-off labels. Brain and body
  diagrams must be anatomically right (no cartoon lobes in the wrong place).
- FRQs: the ones in your brief, each faithful to its type (authoring guide, "The free-response questions"):
  7 points, the exam's parts in order, one rubric line per point, a full-credit sample per part; an AAQ's study
  lists its `ethics` safeguards; an EBQ has three sources, `claimTopic` and `restricted`.

## Accuracy (non-negotiable)

Every number must be right and every science claim must match the CED, the DSM-5-TR and mainstream sources (a
current introductory text, APA resources). Keys come from `from` recipes, so ApPsychStats computes them; still
recompute each one in your own scratch script from the stem (not from the recipe), check that every authored
mistake is graded wrong and the key right (load `psychology/assets/psy-stats.js` and `psy-grade.js` in a vm, as
`scripts/test/appsych-questions.test.mjs` does), and check every plot shows the data the item states. Real studies
described accurately and cited, or invented and labeled. Replication status stated honestly. Where the science is
contested or uncertain, add a short entry to your report (the lead merges it into needs-author) instead of
guessing.

## Report

Write `docs/appsych-reviews/self-<letter>.md`: topics done, item and FRQ counts, figures, the numeric recheck
result, any map edits, and open questions. Reply in under 25 lines with the same summary.
