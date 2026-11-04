# Brief for AP® Macroeconomics content authors (Phase 1)

Repo: the main checkout, branch `claude/apmacro`. Six authors (A-F) and up to four tool builders work in this
same folder at the same time. Read: `CLAUDE.md`, `docs/apmacro-spec.md` (section 5a gives your topics and FRQs;
your own brief `docs/apmacro-briefs/<letter>.md` lists them), `docs/apmacro-authoring-guide.md` (the rules; follow
every one, especially "Graph labeling rules", "The ample reserves framework", "Causal chains with every link",
"Multiplier math" and "Content traps"), `docs/apmacro-architecture.md` ("Content formats" and "Graphs": the
`graph` item and FRQ graph part formats), `docs/apmacro-research/framework.md` (your units' section 3 entries,
section 5 on the exam, section 7 on where students lose points, section 8 on the graphs, section 9 on the
formulas), and `docs/apmacro-dependency-map.json` (your topics' concepts: teach every concept listed as taught in
your topic; never use a concept before the topic that teaches it). For a model of finished work, look at one AP®
Psychology topic (same shell): `psychology/data/lessons/operant-conditioning.json`,
`psychology/data/notes/operant-conditioning.html`, and search (never read whole) its questions file. The
placeholder fixture `scripts/test/fixtures/apmacro-data/` shows every format working (numeric items with `from`
and `mistakes`, graph items for shift, equilibrium, label and point, a `specific` chain builder, the data, graph
and scenario set kinds, a long and a short FRQ with a graph part and `auto` rubric points). Its wording is
placeholder; never copy it.

## Rules for working in parallel

- Write ONLY your own files: `macroeconomics/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `macroeconomics/data/frq/<your frq ids>.json`, `macroeconomics/figures/<your figure ids>.svg`, an optional figure
  generator `scripts/apmacro-figures/author-<letter>.mjs`, scratch files in your own scratch folder, and your
  report `docs/apmacro-reviews/self-<your letter>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later, or a
  concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your report.
  The Phase 0 map holds a starting set of concepts; expect to add the terms your topic teaches. Never rewrite the
  whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-apmacro.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apmacro-content.mjs --topic <id>` (until clean) and `node scripts/check-apmacro-map.mjs`.
  To see a page rendered: `APMACRO_PUBLISHED=<your units> node scripts/build-apmacro.mjs --out <dir>`.

## What each topic needs

- Lesson JSON (hook from a real-looking situation, prerequisites pointing at earlier topics, a figure, a
  cause-and-effect chain with every link, key ideas, a misconception aimed at a reader-report error, 5-8 check
  items, summary). Graph skills topics (author A): same formats, shorter, every idea on a graph.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation or
  graph is asked, every graph drawn and labeled as the guide says, comparison tables where they help (limited vs
  ample reserves, demand-pull vs cost-push, the three multipliers).
- Questions: at least 15 per concept topic, at least 60% apply/analyze, at least 40% in sets of 3-5 (data, graph,
  scenario), four options, every option explained. Every topic with a graph has graph items (shift and
  equilibrium; labels; a point), and every calculation a `numeric` item whose key is an `ApMacroCalc` recipe with
  the reader-report slip as an authored mistake.
- Glossary: every concept your topic teaches, defined in one or two plain sentences.
- FRQs (your brief): the exam's shape (long 10 points or short 5), labels A, B, A(i); one rubric line per point,
  each a criterion a reader would check; a full-credit sample per part; each graph part a `graph` spec with
  `auto` on the rubric points the graph check can tick. A long question spans units and has a graph part.

## Accuracy (non-negotiable)

- Every number from `ApMacroCalc`; every graph key scored right by `ApMacroGrade.graph` (the check runs it).
- The framework stated in every monetary question (ample or limited reserves) and its tool and graph used.
- No released question reproduced or adapted (decision 4); invented data and countries labeled.
- Politically neutral; no "should" on real policy debates.
- When unsure, add an entry to `docs/apmacro-needs-author.md` and keep the claim cautious.

## Report

Write `docs/apmacro-reviews/self-<letter>.md` (topics done, counts, map edits, open points) and reply in under 20
lines.
