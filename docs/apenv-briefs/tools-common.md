# Brief for AP® Environmental Science trainer builders (Phase 2)

Repo: the main checkout, branch `claude/apenv`. Content authors and other tool builders work in this folder at the
same time. Read: `CLAUDE.md`, `docs/apenv-spec.md` (sections 3, 5a and 6: your slugs and what each trainer does;
section 7: the calculation types and how answers are graded), `docs/apenv-architecture.md` ("Tools",
"Calculations", "Grading", "Plot spec"), `docs/tools-calm.md`, `docs/tools-upgrade.md`, and the authoring guide's
calculation rules and content traps (`docs/apenv-authoring-guide.md`). Study the current best tools before you
design: `body-map.html` (NREMT, the owner's favorite: it just works, very interactive, good information,
interesting), the AP® Statistics trainers (`statistics/assets/tools/sampling-distributions.js`,
`stat-tools.js`), and AP® Biology's `bio/assets/tools/energy-flow.js` (an energy pyramid worth comparing against;
port ideas, never import across courses). Yours must be at least that good,
ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: crisp SVG scenes (a pond, a food web, a power plant, a city under an
  inversion, a population pyramid), smooth curves, labels that never overlap, color linked across views, the
  course olive for emphasis. No placeholder shapes.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), no function removed but
  extra information revealed progressively (More options, Why?, Details).
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Scientifically correct: every number from `ApEnvCalc` (the same recipes the bank uses); units shown with every
  value; the picture agrees with the numbers (the pyramid bars are the population shown, the dissolved oxygen
  curve is the one the model computes).
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control reachable,
  sliders with arrow keys), screen reader text for the scene's state, reduced motion (the `ApEnvPlot.loop` end
  state), no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file):
`environmental-science/assets/tools/<slug>.js`, `environmental-science/assets/tools/math/<slug>.js` (the model,
registers `ApEnvMath.<camelSlug>`; pure, no DOM, so validators and tests can run it; replace the Phase 0 stub,
which has `stub: true`), `environmental-science/data/tools/<slug>.json`,
`scripts/lib/apenv-tool-checks/<slug>.mjs`, `scripts/test/apenv-tool-<slug>.test.mjs`, your tool's entry in
`environmental-science/data/pages.json` (only your own entry's fields, never `premium`; Edit that entry, never
rewrite the file; then copy the same change into `scripts/test/fixtures/apenv-data/pages.json`, which a test
keeps equal), and CSS scoped to your tool in `environmental-science/assets/tools/<slug>.css` if the shared
`env-tools.css` is not enough (the generator links it when it exists).

Each tool: Explore pane (live scene + 1 to 3 primary controls in the dock, Why and Details sheets) and "Test
yourself": seeded step drills (`ApEnvTools.drill`, contexts per topic so each unlocks with its unit, several
problem kinds, steps `num`, `choice`, `setup` (a typed setup graded by `ApEnvExpr.gradeSetup`: brackets, × 100,
units that cancel) and `unit` (a number with its unit, graded by `ApEnvGrade.numeric`), or your own step types),
first try recorded as `<slug>:<context>:<step>`. Feedback names the specific slip (the reader-report errors:
no brackets in percent change, × 100 missing, the 10% rule applied once too often, the doubling time not added
to the year, kW vs W, sea ice raising sea level, ozone vs greenhouse). The validator regenerates 300 problems
per context and kind and recomputes every key independently through `ApEnvCalc`; the test runs it plus model
tests (a seed gives the same problem twice; every model value matches its recipe).

## Working in parallel

- No git commands that change anything. The lead commits.
- Never run `node scripts/build-apenv.mjs` without `--out <your scratch dir>`. To preview a tool, its topic
  must be published: `APENV_PUBLISHED=unit-1,unit-2,unit-3,unit-4,unit-5,unit-6,unit-7,unit-8,unit-9,skills-math
  node scripts/build-apenv.mjs --out <dir>` (content may still be partial; that is fine for tools). Serve and
  screenshot with Playwright at 1280 and 360 px, light and dark, and LOOK at the screenshots; iterate until it
  looks professional. If the scratch build lacks what you need to serve the page, copy the repo's
  `environmental-science/assets/` and `assets/` next to the generated pages in your scratch dir.
- Run your validator and test (`node --test scripts/test/apenv-tool-<slug>.test.mjs`) until clean.
- Shared files (`env-tools.js/.css`, `env-tool-math.js`, `env-plot.js`, `env-calc.js`, `env-grade.js`,
  `env-expr.js`, the generator): do not edit. If you truly need a shared change (a new `ApEnvCalc` recipe, a plot
  kind), put the exact diff in your report and work around it locally.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator and test results,
screenshots you checked (paths), any shared change needed.
