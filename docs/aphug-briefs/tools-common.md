# Brief for AP® Human Geography tool builders (Phase 2)

Repo: the main checkout, branch `claude/aphug`. Up to four builders (T1-T4) work in this same folder at the same
time as content authors. Read: `CLAUDE.md`, `docs/aphug-spec.md` (section 6 lists the trainers, section 7 the
grading rules), `docs/aphug-architecture.md` ("Tools", "Map stimulus", "Model items", `ApHugCalc`),
`docs/aphug-authoring-guide.md` (the writing rules apply to every word a trainer shows) and
`docs/aphug-research/accuracy-risks.md` (binding on every map and place a trainer shows).

## The bar

The NREMT body map: interactive, professional illustration quality, simple on landing with detail revealed
progressively, full screen, easy to read on a phone at 360 px. Every visual legible with no crowded or
overlapping words (look at screenshots at 360 and 1280 wide). Each trainer has Explore and Test yourself (seeded
drills, feedback naming the slip), as every course's trainers. Select then Check, always.

## The shared pieces you build on (do not edit them; propose diffs in your report)

- `ApHugCalc` (`hug-calc.js`): every number a drill shows is a recipe it evaluates.
- `ApHugMap` (`hug-map.js`): maps from a data spec on the base maps in `human-geography/figures/base/` (world,
  ten regions, Country A). In a trainer, fetch the base JSON once and call `ApHugMap.svg(spec, base)` into an
  inline `<img src="data:...">` or an `<svg>` element; marks and labels stay HTML (`overlay`), legend HTML
  (`legendHtml`); every real-outline map shows `ApHugMap.note(base)`. `ApHugMap.check` must pass for every map a
  drill can generate (test it over seeds).
- `ApHugModel` (`hug-model.js`): the model item. A drill step `{ kind: 'model', key, label, practice, model }`
  runs in `ApHugTools.drill` with tap, drag and keyboard; `_drills.mjs` checks the model and that its key grades
  right. Model Studio builds on it; other trainers may use it.
- `ApHugTools` (`tools/hug-tools.js`): the frame, Explore and drill runner (steps `num`, `choice`, `unit`, `model`).
- `ApHugPlot` (`tools/hug-plot.js`): line, bar, scatter and the population pyramid.

## Files you own

For each slug in your brief: `human-geography/assets/tools/<slug>.js`, `human-geography/assets/tools/math/<slug>.js`
(replace the Phase 0 stub), `human-geography/assets/tools/<slug>.css` (optional), `human-geography/data/tools/<slug>.json`,
`scripts/lib/aphug-tool-checks/<slug>.mjs`, `scripts/test/aphug-tool-<slug>.test.mjs`, your slug's cover
`assets/covers/tools/aphug/<slug>.svg` and its entry in `assets/covers/tools/aphug/index.json` (create the folder if
it is missing; the lead merges the index), and your slug's entry (only) in `human-geography/data/pages.json` and
its copy in `scripts/test/fixtures/aphug-data/pages.json`.

## Rules for working in parallel

- Write only your own files. No git commands that change anything. Never run `node scripts/build-aphug.mjs`
  without `--out <your scratch dir>`.
- Your validator sweeps 300 seeds per context and type with every key recomputed independently (`recheck`).
- A drill never asks for a real figure that goes stale (spec decision 7): use invented places or dated sources.
- Free or Premium is set only in pages.json (spec section 6: `model-studio` Explore plus the demographic
  transition drills, `scale-lab` and `map-reader` free).

## Report

Write `docs/aphug-reviews/tools-<slug>.md` per trainer (what it does, drills, seeds swept, screenshots checked,
any shared-file diff proposed) and reply in under 20 lines.
