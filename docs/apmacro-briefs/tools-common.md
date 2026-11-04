# Brief for AP® Macroeconomics trainer builders (Phase 2)

Repo: the main checkout, branch `claude/apmacro`. Content authors and other tool builders work in this folder at
the same time. Read: `CLAUDE.md`, `docs/apmacro-spec.md` (sections 3, 5a and 6: your slugs and what each trainer
does; section 7: how answers are graded), `docs/apmacro-architecture.md` ("Tools", "Calculations", "Graphs"),
`docs/tools-calm.md`, `docs/tools-upgrade.md`, and the authoring guide's graph, reserves, chain and multiplier
rules (`docs/apmacro-authoring-guide.md`). Study the current best tools before you design: `body-map.html` (NREMT,
the owner's favorite: it just works, very interactive, good information, interesting), the AP® Psychology
trainers (`psychology/assets/tools/conditioning-lab.js`, `psy-tools.js`) and AP® Precalculus'
`precalculus/assets/tools/function-lab.js` (port ideas, never import across courses). Yours must be at least that
good, ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: crisp SVG graphs with every axis and curve labeled, smooth shifts, labels
  that never overlap, the old curve kept faded, color linked across views (the reserve market beside the money
  market; AD-AS beside the Phillips curves), the course accent for emphasis. No placeholder shapes.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), extra information revealed
  progressively (More options, Why?, Details). Each tool full screen.
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Economically correct: every number from `ApMacroCalc`; every economics graph drawn and graded by
  `ApMacroGraph` and `ApMacroGrade.graph` (never a second graph renderer); the picture agrees with the numbers.
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control reachable,
  curves moved with arrow keys), screen reader text for the graph's state, reduced motion, no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file): `macroeconomics/assets/tools/<slug>.js`,
`macroeconomics/assets/tools/math/<slug>.js` (the model, registers `ApMacroMath.<camelSlug>`; pure, no DOM, so
validators and tests can run it; replace the Phase 0 stub, which has `stub: true`),
`macroeconomics/data/tools/<slug>.json`, `scripts/lib/apmacro-tool-checks/<slug>.mjs`,
`scripts/test/apmacro-tool-<slug>.test.mjs`, your tool's entry in `macroeconomics/data/pages.json` (only your own
entry's fields, never `premium`; Edit that entry, never rewrite the file; then copy the same change into
`scripts/test/fixtures/apmacro-data/pages.json`, which a test keeps equal), CSS scoped to your tool in
`macroeconomics/assets/tools/<slug>.css` if the shared `mac-tools.css` is not enough, and your tool's cover
`assets/covers/tools/apmacro/<slug>.svg` with its entry in `assets/covers/tools/apmacro/index.json` (the first
builder creates the file; add only your own entry).

Each tool: Explore pane (live graph + 1 to 3 primary controls in the dock, Why and Details sheets) and "Test
yourself": seeded step drills (`ApMacroTools.drill`, contexts per topic so each unlocks with its unit, several
problem kinds, steps `num`, `choice` and `unit`, or your own step types such as a graph step built on
`ApMacroGraph.mount`), first try recorded as `<slug>:<context>:<step>`. Feedback names the specific slip (the
reader-report errors: the wrong curve, the wrong direction, multiplying the gap, a limited-reserves tool in an
ample-reserves question, the flipped currency ratio, self-adjustment through AD, a skipped chain link). The
validator regenerates 300 problems per context and kind and recomputes every key independently (its own
arithmetic, or `ApMacroGraph.outcome` for graphs); the test runs it plus model tests (a seed gives the same
problem twice; every model value matches its recipe).

## Working in parallel

- No git commands that change anything. The lead commits.
- Never run `node scripts/build-apmacro.mjs` without `--out <your scratch dir>`. To preview a tool, its topic
  must be published: `APMACRO_PUBLISHED=graph-skills,unit-1,unit-2,unit-3,unit-4,unit-5,unit-6 node
  scripts/build-apmacro.mjs --out <dir>`. Serve and screenshot with Playwright at 1280 and 360 px, light and
  dark, and LOOK at the screenshots; iterate until it looks professional.
- Run your validator and test (`node --test scripts/test/apmacro-tool-<slug>.test.mjs`) until clean.
- Shared files (`mac-tools.js/.css`, `mac-tool-math.js`, `mac-plot.js`, `mac-calc.js`, `mac-graph.js`,
  `mac-grade.js`, the generator): do not edit. If you truly need a shared change (a new `ApMacroCalc` recipe, a
  graph kind or task), put the exact diff in your report and work around it locally. Builder T1 (`graph-studio`)
  is the first user of `ApMacroGraph` and may propose changes to it; the lead merges them.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator and test results,
screenshots you checked (paths), any shared change needed.
