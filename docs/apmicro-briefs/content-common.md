# Brief for AP® Microeconomics content authors (Phase 1)

Repo: the main checkout, branch `claude/apmicro`. Five authors (A-E) and up to four tool builders work in this
same folder at the same time. Read: `CLAUDE.md`, `docs/apmicro-spec.md` (section 5a gives your topics and FRQs;
your own brief `docs/apmicro-briefs/<letter>.md` lists them), `docs/apmicro-authoring-guide.md` (the rules; follow
every one, especially "Graph rules", "Marginal rules", "Game theory: both comparisons" and "Content traps"), `docs/apmicro-architecture.md` ("Content formats", "Graphs" and "Payoff matrices":
the `graph` and `matrix` items and FRQ graph and matrix parts), `docs/apmicro-research/framework.md` (your units' section 3 entries,
section 5 on the exam, section 7 on where students lose points, section 10 on the graphs), and `docs/apmicro-dependency-map.json` (your topics' concepts: teach every concept listed as taught in
your topic; never use a concept before the topic that teaches it). For a model of finished work, look at one AP®
Macroeconomics topic (same shell, same item formats): `macroeconomics/data/lessons/market-equilibrium.json`,
`macroeconomics/data/notes/market-equilibrium.html`, and search (never read whole) its questions file. Never copy
its wording: overlap topics are written fresh (spec section 4). The
placeholder fixture `scripts/test/fixtures/apmicro-data/` shows every format working (numeric items with `from`
and `mistakes`, graph items for shade, point, line, shift and label on the new kinds, a two-panel graph, a `matrix` item,
a `specific` builder, the data, graph and scenario set kinds, a long FRQ with graph parts and a short FRQ with a
matrix part, each with `auto` rubric points). Its wording is
placeholder; never copy it.

## Rules for working in parallel

- Write ONLY your own files: `microeconomics/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `microeconomics/data/frq/<your frq ids>.json`, `microeconomics/figures/<your figure ids>.svg`, an optional figure
  generator `scripts/apmicro-figures/author-<letter>.mjs`, scratch files in your own scratch folder, and your
  report `docs/apmicro-reviews/self-<your letter>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later, or a
  concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your report.
  The Phase 0 map holds a starting set of concepts; expect to add the terms your topic teaches. Never rewrite the
  whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-apmicro.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apmicro-content.mjs --topic <id>` (until clean) and `node scripts/check-apmicro-map.mjs`.
  To see a page rendered: `APMACRO_PUBLISHED=<your units> node scripts/build-apmicro.mjs --out <dir>`.

## What each topic needs

- Lesson JSON (hook from a real-looking situation, prerequisites pointing at earlier topics, a figure, a
  cause-and-effect chain with every link (the long-run chain, derived demand), key ideas, a misconception aimed at a reader-report error, 5-8 check
  items, summary). Graph skills topics (author A): same formats, shorter, every idea on a graph.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation or
  graph is asked, every graph drawn and labeled as the guide says, comparison tables where they help (the four market
  structures, accounting vs economic profit, the four externality types).
- Questions: at least 15 per concept topic, at least 60% apply/analyze, at least 40% in sets of 3-5 (data, graph,
  scenario), four options, every option explained. Every topic with a graph has graph items (shift and
  equilibrium; labels; a point; a line; a shaded area), game theory has `matrix` items, and every calculation a `numeric` item whose key is an `ApMicroCalc` recipe with
  the reader-report slip as an authored mistake.
- Glossary: every concept your topic teaches, defined in one or two plain sentences.
- FRQs (your brief): the exam's shape (long 10 points or short 5), labels A, B, A(i); one rubric line per point,
  each a criterion a reader would check; a full-credit sample per part; each graph part a `graph` spec (and each matrix
  part a `matrix` spec) with `auto` on the rubric points the check can tick. A long question spans units and has a graph part.

## Accuracy (non-negotiable)

- Every number from `ApMicroCalc`; every graph key scored right by `ApMicroGrade.graph` and every matrix key by
  `ApMicroGrade.matrix` (the check runs both).
- Every shaded region named with the engine's region name and its edges stated in the explanation.
- No released question reproduced or adapted (decision 4); invented firms, goods and data labeled (decision 7).
- Politically neutral; no "should" on real policy debates.
- When unsure, add an entry to `docs/apmicro-needs-author.md` and keep the claim cautious.

## Report

Write `docs/apmicro-reviews/self-<letter>.md` (topics done, counts, map edits, open points) and reply in under 20
lines.
