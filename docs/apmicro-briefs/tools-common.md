# Brief for AP® Microeconomics trainer builders (Phase 2)

Repo: the main checkout, branch `claude/apmicro`. Content authors and other tool builders work in this folder at
the same time. Read: `CLAUDE.md`, `docs/apmicro-spec.md` (sections 3, 5a and 6: your slugs and what each trainer
does; section 7: how answers are graded), `docs/apmicro-architecture.md` ("Tools", "Calculations", "Graphs", "Payoff matrices"),
`docs/tools-calm.md`, `docs/tools-upgrade.md`, and the authoring guide's graph, marginal and game theory rules (`docs/apmicro-authoring-guide.md`). Study the current best tools before you design: `body-map.html` (NREMT,
the owner's favorite: it just works, very interactive, good information, interesting), the AP® Psychology
trainers (`psychology/assets/tools/conditioning-lab.js`, `psy-tools.js`), AP® Macroeconomics' Graph Studio
(`macroeconomics/assets/tools/graph-studio.js`, the closest relative) and AP® Precalculus'
`precalculus/assets/tools/function-lab.js` (port ideas, never import across courses). Yours must be at least that
good, ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: crisp SVG graphs with every axis and curve labeled, smooth shifts, labels
  that never overlap, the old curve kept faded, color linked across views (the market panel beside the firm
  panel; the cost table beside the cost curves), the course accent for emphasis. No placeholder shapes.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), extra information revealed
  progressively (More options, Why?, Details). Each tool full screen.
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Economically correct: every number from `ApMicroCalc`; every economics graph drawn and graded by
  `ApMicroGraph` and `ApMicroGrade.graph`, every payoff matrix by `ApMicroMatrix` and `ApMicroGrade.matrix` (never a
  second renderer); the picture agrees with the numbers.
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control reachable,
  curves moved with arrow keys), screen reader text for the graph's state, reduced motion, no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file): `microeconomics/assets/tools/<slug>.js`,
`microeconomics/assets/tools/math/<slug>.js` (the model, registers `ApMicroMath.<camelSlug>`; pure, no DOM, so
validators and tests can run it; replace the Phase 0 stub, which has `stub: true`),
`microeconomics/data/tools/<slug>.json`, `scripts/lib/apmicro-tool-checks/<slug>.mjs`,
`scripts/test/apmicro-tool-<slug>.test.mjs`, your tool's entry in `microeconomics/data/pages.json` (only your own
entry's fields, never `premium`; Edit that entry, never rewrite the file; then copy the same change into
`scripts/test/fixtures/apmicro-data/pages.json`, which a test keeps equal), CSS scoped to your tool in
`microeconomics/assets/tools/<slug>.css` if the shared `mic-tools.css` is not enough, and your tool's cover
`assets/covers/tools/apmicro/<slug>.svg` with its entry in `assets/covers/tools/apmicro/index.json` (the first
builder creates the file; add only your own entry).

Each tool: Explore pane (live graph + 1 to 3 primary controls in the dock, Why and Details sheets) and "Test
yourself": seeded step drills (`ApMicroTools.drill`, contexts per topic so each unlocks with its unit, several
problem kinds, steps `num`, `choice`, `unit`, `graph` (with `line` and `shade` tasks) and `matrix`), first try recorded as `<slug>:<context>:<step>`. Feedback names the specific slip (the
reader-report errors: MC not through the minimums, a downward-sloping competitive firm demand, price read from
MR, the wrong area shaded, MRP from the wrong curve, one comparison for a dominant strategy, a missing Nash
equilibrium, market and efficient quantity swapped). The
validator regenerates 300 problems per context and kind and recomputes every key independently (its own
arithmetic; `ApMicroGraph.outcome`, `named` or `areas` for graphs; `ApMicroMatrix` for matrices); the test runs it plus model tests (a seed gives the same
problem twice; every model value matches its recipe).

## Working in parallel

- No git commands that change anything. The lead commits.
- Never run `node scripts/build-apmicro.mjs` without `--out <your scratch dir>`. To preview a tool, its topic
  must be published: `APMACRO_PUBLISHED=graph-skills,unit-1,unit-2,unit-3,unit-4,unit-5,unit-6 node
  scripts/build-apmicro.mjs --out <dir>`. Serve and screenshot with Playwright at 1280 and 360 px, light and
  dark, and LOOK at the screenshots; iterate until it looks professional.
- Run your validator and test (`node --test scripts/test/apmicro-tool-<slug>.test.mjs`) until clean.
- Shared files (`mic-tools.js/.css`, `mic-tool-math.js`, `mic-plot.js`, `mic-calc.js`, `mic-graph.js`,
  `mic-matrix.js`, `mic-grade.js`, the generator): do not edit. If you truly need a shared change (a new `ApMicroCalc` recipe, a
  graph kind or task), put the exact diff in your report and work around it locally. Builder T1 (`graph-studio`)
  is the first user of `ApMicroGraph` and may propose changes to it; the lead merges them.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator and test results,
screenshots you checked (paths), any shared change needed.
