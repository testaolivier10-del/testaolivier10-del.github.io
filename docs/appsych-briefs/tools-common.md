# Brief for AP® Psychology trainer builders (Phase 2)

Repo: the main checkout, branch `claude/appsych`. Content authors and other tool builders work in this folder at
the same time. Read: `CLAUDE.md`, `docs/appsych-spec.md` (sections 3, 5a and 6: your slugs and what each trainer
does; section 7: how answers are graded), `docs/appsych-architecture.md` ("Tools", "Statistics", "Grading", "Plot
spec"), `docs/tools-calm.md`, `docs/tools-upgrade.md`, and the authoring guide's research methods rules, FRQ rules
and content traps (`docs/appsych-authoring-guide.md`). Study the current best tools before you design:
`body-map.html` (NREMT, the owner's favorite: it just works, very interactive, good information, interesting),
the AP® Environmental Science trainers (`environmental-science/assets/tools/water-pollution.js`, `env-tools.js`)
and AP® Statistics' `statistics/assets/tools/sampling-distributions.js` (port ideas, never import across
courses). Yours must be at least that good, ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: crisp SVG scenes (a neuron and synapse, a brain in two views, an eye, a
  Skinner box and a cumulative record, a lifespan timeline, a study summary laid out like the exam's), smooth
  curves, labels that never overlap, color linked across views, the course cerulean for emphasis. No
  placeholder shapes; anatomy right.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), no function removed but
  extra information revealed progressively (More options, Why?, Details).
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Scientifically correct: every number from `ApPsychStats`; the picture agrees with the numbers (the normal curve
  is the one the model computes, the cumulative record is the schedule's).
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control reachable,
  sliders with arrow keys), screen reader text for the scene's state, reduced motion (the `ApPsychPlot.loop` end
  state), no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file): `psychology/assets/tools/<slug>.js`,
`psychology/assets/tools/math/<slug>.js` (the model, registers `ApPsychMath.<camelSlug>`; pure, no DOM, so
validators and tests can run it; replace the Phase 0 stub, which has `stub: true`),
`psychology/data/tools/<slug>.json`, `scripts/lib/appsych-tool-checks/<slug>.mjs`,
`scripts/test/appsych-tool-<slug>.test.mjs`, your tool's entry in `psychology/data/pages.json` (only your own
entry's fields, never `premium`; Edit that entry, never rewrite the file; then copy the same change into
`scripts/test/fixtures/appsych-data/pages.json`, which a test keeps equal), and CSS scoped to your tool in
`psychology/assets/tools/<slug>.css` if the shared `psy-tools.css` is not enough (the generator links it when it
exists).

Each tool: Explore pane (live scene + 1 to 3 primary controls in the dock, Why and Details sheets) and "Test
yourself": seeded step drills (`ApPsychTools.drill`, contexts per topic so each unlocks with its unit, several
problem kinds, steps `num`, `choice` and `unit`, or your own step types; no `setup` steps), first try recorded as
`<slug>:<context>:<step>`. Feedback names the specific slip (the reader-report errors: the wrong method,
an operational definition that restates the concept, a statistic not read for the groups, a safeguard the
study did not use, generalizing from sample size, uncited evidence, a restricted term as the concept,
negative reinforcement read as punishment). Scenarios are invented and say so, or cite a real study. The
validator regenerates 300 problems per context and kind and recomputes every key independently through
`ApPsychStats` or the model's own tables; the test runs it plus model tests (a seed gives the same problem twice;
every model value matches its recipe).

## Working in parallel

- No git commands that change anything. The lead commits.
- Never run `node scripts/build-appsych.mjs` without `--out <your scratch dir>`. To preview a tool, its topic must
  be published: `APPSYCH_PUBLISHED=unit-1,unit-2,unit-3,unit-4,unit-5,skills-research node
  scripts/build-appsych.mjs --out <dir>` (content may still be partial; that is fine for tools). Serve and
  screenshot with Playwright at 1280 and 360 px, light and dark, and LOOK at the screenshots; iterate until it
  looks professional. If the scratch build lacks what you need to serve the page, copy the repo's
  `psychology/assets/` and `assets/` next to the generated pages in your scratch dir.
- Run your validator and test (`node --test scripts/test/appsych-tool-<slug>.test.mjs`) until clean.
- Shared files (`psy-tools.js/.css`, `psy-tool-math.js`, `psy-plot.js`, `psy-stats.js`, `psy-grade.js`, the
  generator): do not edit. If you truly need a shared change (a new `ApPsychStats` recipe, a plot kind), put the
  exact diff in your report and work around it locally.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator and test results,
screenshots you checked (paths), any shared change needed.
