# Brief for AP® Statistics trainer builders (Phase 2)

Repo `/home/claude/wt/stat` (or the main checkout), branch `claude/apstat`. Content authors and other tool
builders work in this folder at the same time. Read: `CLAUDE.md`, `docs/apstat-spec.md` (sections 3, 5a and 6:
your slugs and what each trainer does), `docs/apstat-architecture.md` ("Tools", "Distributions", "Plot spec"),
`docs/tools-calm.md`, `docs/tools-upgrade.md`, and the authoring guide's conclusion templates and where students
lose points (`docs/apstat-authoring-guide.md`, `docs/apstat-research/framework.md` section 6). Study the current
best tools before you design: `body-map.html` (NREMT, the owner's favourite: it just works, very interactive,
good information, interesting), the AP® Calculus AB trainers (`calculus/assets/tools/tangent-tracer.js`,
`riemann-sums.js`, `calc-tools.js`), and AP® Biology's `bio/assets/tools/descriptive-stats.js` and
`chi-square.js` (drag-a-dot and stacked chi-square components worth porting; their math is too coarse, use
`ApStatDist`). Yours must be at least that good, ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: crisp plots with nice ticks and labels, dots that stack cleanly, smooth
  density curves, shaded areas exactly where the probability is, colour linked across views (the population,
  one sample, and the sampling distribution always the same colours), illustrated populations where a context
  appears (households on a street, plots in a field, students in classrooms), drawn cleanly in SVG (or canvas
  where a live simulation with thousands of draws needs it). No placeholder shapes.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), no function removed but
  extra information revealed progressively (More options, Why?, Details).
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Statistically correct: every probability, interval, p-value and test statistic from `ApStatDist`; simulations
  from the seeded generator (`ApStatMath.rng(seed)`, `normal`, `sample`, `bernoulli`, `shuffle`); numbers shown
  to sensible precision (probabilities and p-values to 4 places, statistics to 2) with units in context; the
  picture agrees with the numbers (the dotplot is the samples drawn, the shaded area is the probability shown).
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control
  reachable, sliders with arrow keys), screen reader text for the scene's state, reduced motion (the
  `ApStatPlot.loop` end state), no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file):
`statistics/assets/tools/<slug>.js`, `statistics/assets/tools/math/<slug>.js` (the model, registers
`ApStatMath.<camelSlug>`; pure, no DOM, so validators and tests can run it), `statistics/data/tools/<slug>.json`,
`scripts/lib/apstat-tool-checks/<slug>.mjs`, `scripts/test/apstat-tool-<slug>.test.mjs`, your tool's entry in
`statistics/data/pages.json` (only your own entry's fields, never `premium`; Edit that entry, never rewrite the
file; then copy the same change into `scripts/test/fixtures/apstat-data/pages.json`, which a test keeps equal),
and CSS scoped to your tool in your own file `statistics/assets/tools/<slug>.css` if the shared
`stat-tools.css` is not enough (the generator links it when it exists).

Each tool: Explore pane (live scene + 1 to 3 primary controls in the dock, Why and Details sheets) and "Test
yourself": seeded step drills (`ApStatTools.drill`, contexts per topic so each unlocks with its unit, several
problem kinds, steps that are `num`/`choice`/your own step types if you need them, such as a conclusion built
slot by slot with `ApStatGrade.conclude`), first try recorded as `<slug>:<context>:<step>`. Feedback names the
specific slip (the reader-report errors: p-hat in a test's SE, the wrong tail, "95% of the data", Type I
without "when H0 is true"). The validator regenerates 300 problems per context and type and recomputes every
key independently through `ApStatDist`; the test runs it plus statistical model tests (10,000 simulated 95%
intervals capture within 94-96%; the simulated SD of x-bar within 3% of sigma over root n; the simulated Type I
rate within 1 point of alpha; a seed gives the same sample twice).

## Working in parallel

- No git commands that change anything. The lead commits.
- Never run `node scripts/build-apstat.mjs` without `--out <your scratch dir>`. To preview a tool, its context
  topic must be published: `APSTAT_PUBLISHED=unit-1,unit-2,unit-3,unit-4,unit-5,skills-math node scripts/build-apstat.mjs --out <dir>`
  (content may still be partial; that is fine for tools). Serve and screenshot with Playwright at 1280 and
  360 px, light and dark, and LOOK at the screenshots; iterate until it looks professional. If the scratch
  build does not include what you need to serve the page, copy the repo's `statistics/assets/` and `assets/`
  next to the generated pages in your scratch dir rather than writing into the repo.
- Run your validator and test (`node --test scripts/test/apstat-tool-<slug>.test.mjs`) until clean.
- Shared files (`stat-tools.js/.css`, `stat-tool-math.js`, `stat-plot.js`, `stat-dist.js`, `stat-grade.js`,
  the generator): do not edit. If you truly need a shared change, put the exact diff in your report and work
  around it locally.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator and test results,
screenshots you checked (paths), any shared change needed.
