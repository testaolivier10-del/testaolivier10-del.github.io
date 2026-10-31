# Brief for AP® Precalculus content authors (Phase 1)

Repo: the worktree on branch `claude/apprecalc`. Six authors (A-F) and up to four tool builders work in this same
folder at the same time. Read: `CLAUDE.md`, `docs/apprecalc-spec.md` (section 5a gives your topics and FRQs; your
own brief `docs/apprecalc-briefs/<letter>.md` lists them), `docs/apprecalc-authoring-guide.md` (the rules; follow
every one, especially "Notation the exam rewards", "Decimals", "Rates of change and concavity", "Justifying a
model type and invertibility" and "Q4"), `docs/apprecalc-architecture.md` ("Math", "Content formats"),
`docs/apprecalc-research/framework.md` (your units' section 3 entries, section 5 on the exam, section 7 on where
students lose points), and `docs/apprecalc-dependency-map.json` (your topics' concepts: teach every concept listed
as taught in your topic; never use a concept, or its notation, before the topic that teaches it). For a model of
finished work, look at one AP® Calculus AB topic (same shell): `calculus/data/lessons/increasing-decreasing.json`,
`calculus/data/notes/increasing-decreasing.html`, and search (never read whole) its questions file. The fixture
`scripts/test/fixtures/apprecalc-data/` shows every format working (a graph set and a calculator table set,
`expr`, `numeric`, `single`, `multi`, `order`, `predict`, one FRQ of each type). Its wording is placeholder; never
copy it.

## Rules for working in parallel

- Write ONLY your own files: `precalculus/data/{lessons,notes,questions,glossary}/<your topic>.*`,
  `precalculus/data/frq/<your frq ids>.json`, your figures in `precalculus/figures/` (ids starting with your topic
  ids) and an optional generator `scripts/apprecalc-figures/<your letter>.mjs`, scratch files in your own scratch
  folder, and your report `docs/apprecalc-reviews/self-<your letter>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later, or a
  concept is missing), make the smallest possible Edit to that topic's concepts only and list it in your report.
  Never rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). The lead commits.
- Never run `node scripts/build-apprecalc.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apprecalc-content.mjs --topic <id>` (until clean) and `node scripts/check-apprecalc-map.mjs`.
  To see pages rendered: `APPRECALC_PUBLISHED=<your chapters> node scripts/build-apprecalc.mjs --out <dir>`.

## What each CED topic needs

- Lesson JSON: a hook from a real-looking context, prerequisites pointing at earlier topics, a `plot` drawn from the
  topic's function, key ideas, a misconception aimed at a reader-report error, 5-8 check items, a summary.
  "Algebra you need" topics (`kind: "skill"`): the same formats, shorter, with worked examples that show every
  algebra step, aimed at the step the next CED topic needs.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any new calculation or
  writing type is asked, a comparison table where it helps (function families, log rules, identities). Plain,
  warm, precise; explain why before how. Short sentences. American spelling, no em dashes.
- Questions: 15+ items per CED topic (8+ per algebra topic), at least 60% apply/analyze, at least 40% in stimulus
  sets of 4-5 items sharing one table or graph. Single items with exactly 4 options and per-option explanations;
  key-length balance (the key is the longest option at most 40% of the time). Formulas as `expr` items with a
  `domain` and 2-3 `mistakes`; decimals as `numeric` with the full-precision key on `calc: true` items, exact keys
  otherwise. Mix graph, table, formula and words in every topic.
- Glossary for every concept the topic teaches.
- Figures from data: a `plot` spec (`docs/apprecalc-architecture.md`, "Content formats") is preferred, because the
  build draws it from the function; a standalone SVG from a generator script for diagrams (the unit circle with a
  triangle, a Ferris wheel). White background, `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink
  `#1F2A28`, course green `#11592F` for emphasis, a second color from the Okabe-Ito set (`#0072B2` blue,
  `#D55E00` vermillion). Label axes; dashed asymptotes; open dots at holes. Render each figure to PNG and look at it
  (Playwright, `CHROMIUM_PATH=/opt/pw-browsers/chromium`); fix overlaps and cut-off labels.
- Unit 4 (author F): the same formats; the build adds the "beyond the exam" line. No FRQs, no `exam: true` items.
- FRQs: the ones in your brief, each faithful to its type (authoring guide, "FRQs"), 6 points with one rubric line
  per point, a full-credit sample per part, `calc` set by the type (Q1 and Q2 true, Q3 and Q4 false).

## Accuracy (non-negotiable)

Every number and formula must be right. Recompute every numeric key in your own scratch script from the stem (not
from the item), grade every `expr` key and every authored mistake through `precalculus/assets/pcalc-expr.js` in a
vm (as `scripts/test/apprecalc-expr.test.mjs` does): the key right on its domain, each mistake wrong, the three
decimal rule applied. Check every plot shows the function the item states (zeros, asymptotes, period). Solve every
"all solutions" item by brute force over the interval in your script. Where the math or the scope is uncertain,
add a short entry to your report (the lead merges it into needs-author) instead of guessing.

## Report

Write `docs/apprecalc-reviews/self-<letter>.md`: topics done, item and FRQ counts, figures, the recheck result, any
map edits, and open questions. Reply in under 25 lines with the same summary.
