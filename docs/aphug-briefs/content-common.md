# Brief for AP® Human Geography content authors (Phase 1)

Repo: the main checkout, branch `claude/aphug`. Seven authors (A-G) and up to four tool builders work in this same
folder at the same time. Read: `CLAUDE.md`, `docs/aphug-spec.md` (section 5a gives your topics and FRQs; your own
brief `docs/aphug-briefs/<letter>.md` lists them), `docs/aphug-authoring-guide.md` (the rules; follow every one,
especially "Plain words for a first AP® course", "Apply every concept to a named real place", "Scale", "Task
verbs", "Stimulus questions need the stimulus", "Neutral, dated, specific" and "Content traps"),
`docs/aphug-research/accuracy-risks.md` (binding: the rules for real figures, contested places, peoples and
religions), `docs/aphug-architecture.md` ("Content formats": maps, pyramids, images, model items and the three FRQ
types), `docs/aphug-research/framework.md` (your units' section 3 entries, section 5 on the exam, section 7 on
where students lose points, section 8 on the models), and `docs/aphug-dependency-map.json` (your topics' concepts:
teach every concept listed as taught in your topic; never use a concept before the topic that teaches it). For a
model of finished work, look at one AP® Psychology topic (same shell): `psychology/data/lessons/operant-conditioning.json`,
`psychology/data/notes/operant-conditioning.html`, and search (never read whole) its questions file. The placeholder
fixture `scripts/test/fixtures/aphug-data/` shows every format working (maps in all five renderings, a population
pyramid, a table, a line chart, a drawn-scene placeholder, a text passage, numeric items with `from` and
`mistakes`, a `specific` builder, model items in every layout, and one FRQ of each type). Its wording is
placeholder; never copy it.

## Rules for working in parallel

- Write ONLY your own files: `human-geography/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `human-geography/data/frq/<your frq ids>.json`, `human-geography/figures/<your figure ids>.svg`, an optional figure
  generator `scripts/aphug-figures/author-<letter>.mjs`, scratch files in your own scratch folder, and your report
  `docs/aphug-reviews/self-<your letter>.md`.
- Do not edit the generator, runtime, checks, base maps, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later, or a
  concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your report.
  The Phase 0 map holds a starting set of concepts (318); expect to add the terms your topic teaches. Never
  rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-aphug.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-aphug-content.mjs --topic <id>` (until clean) and `node scripts/check-aphug-map.mjs`.
  To see a page rendered: `APHUG_PUBLISHED=<your units> node scripts/build-aphug.mjs --out <dir>`.

## What each topic needs

- Lesson JSON (hook from a real place or a plainly invented one, prerequisites pointing at earlier topics, a
  figure, a cause-and-effect chain with every link, key ideas, a misconception aimed at a reader-report error, 5-8
  check items, summary). Skills topics (author A): same formats, shorter.
- Notes HTML: 500+ words, `<h2>` sections, every term defined in plain words before it is used, each concept
  applied to a named real place with its scale named, every model with its assumptions and at least one limit,
  comparison tables where they help. A model the CED does not name (Lee, Zelinsky, Griffin-Ford, McGee, de Blij,
  heartland, a named projection) appears only inside `<aside class="hug-aside">` headed "Your class may name this".
- Questions: at least 14 per concept topic (spec section 5a), at least 60% apply/analyze, about a third in sets
  of 3-5 sharing a stimulus (`map`, `data`, `image`, `text`), four options in the bank, every option explained.
  Every set question needs its stimulus (the legend, a value, a named place): a question answerable without it
  is a standalone question. Each unit has map sets on real outlines (world or a region) and at least one on
  Country A (subnational scale). Every model the topic teaches gets a `model` item. Every calculation is a
  `numeric` item whose key is an `ApHugCalc` recipe with the reader-report slip as an authored mistake.
- Glossary: every concept your topic teaches, defined in one or two plain sentences.
- FRQs (your brief): seven one-point parts A-G, each with its `verb` and the verb in the prompt; one rubric line
  each, a criterion a reader would check; a full-credit sample that does what its verb demands (an explain with
  its because, a compare speaking of both, a degree stated first). Q1 type `none` has no stimulus, `one` one,
  `two` two. Each FRQ crosses two units and at least one part asks about scale.

## Accuracy (non-negotiable)

- Every real figure has a source and a year; no CIA World Factbook. Invented data and countries are labeled.
- Contested places: who controls, who claims, who recognizes, with a date; both names; no answer hinges on a
  disputed fact. A map never gives a disputed place a value unless the stimulus says why (`disputedOk`).
- Neutral: no country called backward or primitive; groups by their own names; "unauthorized", never "illegal",
  for people; development words as the CED uses them.
- No released question reproduced or adapted (spec decision 4).
- When unsure, add an entry to `docs/aphug-needs-author.md` and keep the claim cautious.

## Report

Write `docs/aphug-reviews/self-<letter>.md` (topics done, counts, map edits, open points) and reply in under 20
lines.
