# Brief for AP® Physics 1 content authors (Phase 1)

Repo `/home/claude/testaolivier10-del.github.io`, branch `claude/apphys`. Several authors and tool builders
work in this same folder at the same time. Read: `CLAUDE.md`, `docs/apphys-spec.md`,
`docs/apphys-authoring-guide.md` (the rules; follow every one), `docs/apphys-architecture.md` ("Content
formats"), `docs/apphys-research/framework.md` (your units' section 3 entries, the exclusions checklist, the
FRQ types and equation sheet, section 8 common errors), `docs/apphys-dependency-map.json` (your topics'
concepts: teach every concept listed as taught in your topic; never use a concept before the topic that
teaches it). For a model of finished work, look at one AP® Chemistry topic: `chem/data/lessons/calorimetry.json`,
`chem/data/notes/calorimetry.html`, and search (never read whole) `chem/data/questions/calorimetry.json`.
The placeholder fixture `scripts/test/fixtures/apphys-data/` shows every physics format (incl. `diagram`
stimuli, numeric items with units, one FRQ of each type).

## Rules for working in parallel

- Write ONLY your own files: `physics/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `physics/data/frq/<your frq ids>.json`, `physics/figures/<your figure ids>.svg`, an optional figure generator
  `scripts/apphys-figures/<your unit>.mjs`, scratch files in your own scratch folder, and your report
  `docs/apphys-reviews/self-<your units>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later,
  or a concept is missing), make the smallest possible Edit to that topic's entry only and list it in your
  report. Never rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). I commit.
- Never run `node scripts/build-apphys.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apphys-content.mjs --topic <id>` (until clean) and `node scripts/check-apphys-map.mjs`.
  To see a page rendered, build to a scratch dir with `APPHYS_PUBLISHED=<your units> node scripts/build-apphys.mjs --out <dir>`.

## What each CED topic needs

- Lesson JSON (hook, prerequisites pointing at earlier topics, figure, cause-and-effect chain, key ideas,
  misconception aimed at a real reader-report error, 5-8 check items, summary). Skill topics in the math
  chapter: same formats, shorter, worked examples with physics quantities.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation
  type is asked, comparison tables where they help. Plain, warm, precise, like a great teacher; build idea to
  idea, explain why before formulas, state the model's assumptions. Short sentences.
- Questions: 15+ items per CED topic (8+ per skill topic), at least 60% apply/analyze, at least 40% in
  stimulus sets of 4-5 items sharing a stimulus (scene diagrams, data tables, graphs from real-looking lab data),
  single items with exactly 4 options and per-option explanations, numeric items with units and sig figs and
  authored `mistakes` for the classic slips (factor of 2, forgot to square, sign, g, cm vs m, degree mode).
  State g on every item that needs it (or use `gAlt`). Functional-dependence items ("if r doubles, ...").
  Key-length balance (the key is the longest option at most 40% of the time). Original items only.
- Glossary for every concept the topic teaches.
- At least one figure per CED topic, professional quality: a clean, accurate vector illustration that a
  student could learn from without the text (a real scene: carts, ramps, blocks, pulleys, springs, a
  seesaw, a pipe), not boxes and circles standing for things. Standalone SVG, white background,
  `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink `#1F2A28`, course amber `#734200` for
  emphasis, force colours matching the trainers: gravity `#0072B2`, normal `#009E73`, tension `#7A4F9E`,
  friction `#D55E00`, spring `#CC79A7`, applied `#5A6268`, buoyant `#3E9BC8`, velocity `#B07A00`,
  acceleration `#A33B26`. Forces drawn from the object, labelled with type and agent per the guide. Render
  each figure to PNG and look at it before you finish (e.g. `npx playwright` is installed; or
  `python3 -c` with cairosvg if available; or open the scratch build page in Playwright and screenshot), and fix
  overlaps, cut-off labels and wrong proportions.
- FRQs: the ones assigned to you below, each faithful to its type (authoring guide section "FRQs"), with
  parts adding up to the type's points, one rubric line per point, a full-credit sample per part, and a
  `drawSpec`/`graphSpec` where the part asks for a drawing or graph.

## Accuracy (non-negotiable)

Physics must be right. Recompute every numeric key and every authored mistake in code (a scratch script)
and make sure the runtime grader grades each key right and each mistake wrong (see how apchem reviews did it
in `docs/apchem-reviews/u8.md`). Check every option explanation, every figure's physics (arrow directions,
relative lengths, labels), units and sig figs. Respect the exclusions. Where the science or scope is
uncertain, add a short entry to your report (I will merge it into needs-author) instead of guessing.

## Report

Write `docs/apphys-reviews/self-<units>.md`: topics done, item and FRQ counts, figures, the numeric
recheck result, any map edits, and open questions. Reply to me in under 25 lines with the same summary.
