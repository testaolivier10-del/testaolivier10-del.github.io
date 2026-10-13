# Brief for AP® Calculus AB content authors (Phase 1)

Repo `/home/claude/testaolivier10-del.github.io`, branch `claude/apcalc`. Several authors and tool builders
work in this same folder at the same time. Read: `CLAUDE.md`, `docs/apcalc-spec.md`,
`docs/apcalc-authoring-guide.md` (the rules; follow every one), `docs/apcalc-architecture.md` ("Content
formats"), `docs/apcalc-research/framework.md` (your units' section 3 entries, the exclusions checklist, the
FRQ types and equation sheet, section 8 common errors), `docs/apcalc-dependency-map.json` (your topics'
concepts: teach every concept listed as taught in your topic; never use a concept before the topic that
teaches it). For a model of finished work, look at one AP® Physics 1 topic (the newest course, same formats):
`physics/data/lessons/energy-conservation.json`, `physics/data/notes/energy-conservation.html`, and search (never
read whole) `physics/data/questions/energy-conservation.json`. The placeholder fixture
`scripts/test/fixtures/apcalc-data/` shows every calculus format (math syntax, `expr` items, calculator numerics, `graph`
stimuli, numeric items with units, one FRQ of each type).

## Rules for working in parallel

- Write ONLY your own files: `calculus/data/{lessons,notes,questions,glossary,figures,labels}/<your topic>.*`,
  `calculus/data/frq/<your frq ids>.json`, `calculus/figures/<your figure ids>.svg`, an optional figure generator
  `scripts/apcalc-figures/<your unit>.mjs`, scratch files in your own scratch folder, and your report
  `docs/apcalc-reviews/self-<your units>.md`.
- Do not edit the generator, runtime, checks, pages.json, published.json, other authors' files or docs.
  Exception: if the dependency map is wrong for one of YOUR topics (a concept you must use is taught later,
  or a concept is missing), make the smallest possible Edit to that topic's entry only and list it in your
  report. Never rewrite the whole map file.
- No git commands that change anything (no add, commit, stash, checkout, reset). I commit.
- Never run `node scripts/build-apcalc.mjs` without `--out <your scratch dir>`. Check your work with
  `node scripts/check-apcalc-content.mjs --topic <id>` (until clean) and `node scripts/check-apcalc-map.mjs`.
  To see a page rendered, build to a scratch dir with `APCALC_PUBLISHED=<your units> node scripts/build-apcalc.mjs --out <dir>`.

## What each CED topic needs

- Lesson JSON (hook, prerequisites pointing at earlier topics, figure, cause-and-effect chain, key ideas,
  misconception aimed at a real reader-report error, 5-8 check items, summary). Skill topics in the math
  chapter: same formats, shorter, worked examples that show the algebra or graph skill exactly as calculus will use it.
- Notes HTML: 500+ words, `<h2>` sections, a worked example (`<div class="worked">`) before any calculation
  type is asked, comparison tables where they help. Plain, warm, precise, like a great teacher; build idea to
  idea, explain why before formulas, state the model's assumptions. Short sentences.
- Questions: 15+ items per CED topic (8+ per skill topic), at least 60% apply/analyze, at least 40% in
  stimulus sets of 4-5 items sharing a stimulus (graphs of f or f′, tables of values from real-looking contexts, formulas),
  single items with exactly 4 options and per-option explanations, numeric items with units and sig figs and
  authored `mistakes` for the classic slips (missing chain rule factor, sign errors, forgot +C, wrong
  Riemann widths, degree mode on a calculator, units). Use `expr` items where the answer is an expression
  and calculator items (`calc: true`, three-decimal rule) where the exam would allow a calculator; most items
  are no-calculator, as on the exam.
  Key-length balance (the key is the longest option at most 40% of the time). Original items only.
- Glossary for every concept the topic teaches.
- At least one figure per CED topic, professional quality: a clean, accurate graph or diagram a student could
  learn from without the text (a tangent line touching a curve, shaded Riemann rectangles, a slope field, a
  solid of revolution drawn in perspective, a ladder sliding down a wall), never a rough sketch. Graphs are
  drawn from the actual function (use `ApCalcPlot` / the build-time `plot` spec, or a generator script in
  `scripts/apcalc-figures/<unit>.mjs` that samples the function), standalone SVG, white background,
  `role="img"` with `<title>` and `<desc>`, Arial/Helvetica, ink `#1F2A28`, course crimson `#8C1036` for
  emphasis, a second colour from the Okabe-Ito set for a second curve (`#0072B2` blue, `#009E73` green,
  `#D55E00` vermillion). Label axes and key points; open and closed circles where they matter. Render each
  figure to PNG and look at it before you finish (Playwright is installed), and fix overlaps, cut-off labels,
  wrong scales and curves that do not match the function.
- FRQs: the ones assigned to you below, each faithful to its type (authoring guide section "FRQs"), with
  parts adding up to the type's points, one rubric line per point, a full-credit sample per part, and a
  `drawSpec`/`graphSpec` where the part asks for a drawing or graph.

## Accuracy (non-negotiable)

Mathematics must be right. Recompute every numeric key and every authored mistake in code (a scratch script)
and make sure the runtime grader grades each key right and each mistake wrong (see how apchem reviews did it
in `docs/apchem-reviews/u8.md`). Check every option explanation, every figure (the curve is the function stated; labels, open and closed
points, shading in the right places), units, and the three-decimal rule on calculator items. Grade every
`expr` key and authored mistake through `ApCalcExpr.grade` too. Respect the exclusions. Where the mathematics or scope is
uncertain, add a short entry to your report (I will merge it into needs-author) instead of guessing.

## Report

Write `docs/apcalc-reviews/self-<units>.md`: topics done, item and FRQ counts, figures, the numeric
recheck result, any map edits, and open questions. Reply to me in under 25 lines with the same summary.
