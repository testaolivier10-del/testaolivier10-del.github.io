# Brief for AP® Precalculus trainer builders (Phase 2)

Repo: the worktree on branch `claude/apprecalc`. Content authors and other tool builders work in this folder at the
same time. Read: `CLAUDE.md`, `docs/apprecalc-spec.md` (sections 3, 5a and 6: your slugs and what each trainer
does; section 7: how answers are graded), `docs/apprecalc-architecture.md` ("Math", "Tools"),
`docs/apcalc-architecture.md` ("Tools", "Plots": the framework you inherit, renamed), `docs/tools-calm.md`,
`docs/tools-upgrade.md`, and the authoring guide's rules on rates, concavity, Q4 and decimals
(`docs/apprecalc-authoring-guide.md`). Study the current best tools before you design: `body-map.html` (NREMT, the
owner's favorite: it just works, very interactive, good information, interesting), AP® Calculus AB's
`calculus/assets/tools/curve-analyzer.js`, `riemann-sums.js` and `rule-drills.js` (same framework; port ideas,
never import across courses). Yours must be at least that good, ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: crisp SVG scenes (a graph with its table, the unit circle unrolling into a
  sine curve, a Ferris wheel, a polar rose drawing itself), smooth curves broken at asymptotes, labels that never
  overlap, color linked across views (the same point the same color in the graph, the table and the formula), the
  course green for emphasis. No placeholder shapes.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), no function removed but
  extra information revealed progressively (More options, Why?, Details).
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Mathematically correct: every number from your model (`ApPrecalcMath.<camelSlug>`), the picture agrees with the
  numbers, radians, the three-decimal rule on calculator-style answers, exact forms on symbolic ones.
- Precalculus words only: no derivative, no "instantaneous rate", no "increasing at a decreasing rate".
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control reachable,
  sliders and draggable points with arrow keys), screen reader text for the scene's state, reduced motion (the
  `ApPrecalcPlot.loop` end state), no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file):
`precalculus/assets/tools/<slug>.js` (the page script), `precalculus/assets/tools/math/<slug>.js` (the model,
registers `ApPrecalcMath.<camelSlug>`; pure, no DOM, so validators and tests can run it; replace the Phase 0 stub,
which has `stub: true`), `precalculus/data/tools/<slug>.json`, `scripts/lib/apprecalc-tool-checks/<slug>.mjs`,
`scripts/test/apprecalc-tool-<slug>.test.mjs`, your tool's entry in `precalculus/data/pages.json` (only your own
entry's fields, never `premium`; Edit that entry, never rewrite the file; then copy the same change into
`scripts/test/fixtures/apprecalc-data/pages.json`, which a test keeps equal), and CSS scoped to your tool in
`precalculus/assets/tools/<slug>.css` if the shared `pcalc-tools.css` is not enough (the generator links it when it
exists).

Each tool: Explore pane (live scene + 1 to 3 primary controls in the dock, Why and Details sheets) and "Test
yourself": seeded step drills (`ApPrecalcTools.drill`, contexts per topic so each unlocks with its unit, several
problem kinds, steps `num`, `choice` and `expr` (graded by `ApPrecalcExpr.compare` on a domain, so a log rule run
the wrong way is caught), or your own step types), first try recorded as `<slug>:<context>:<step>`. Feedback names
the specific slip (the reader-report errors: a rounded intermediate value, the secant through a point not on it,
concavity read from the function's direction, b as the period, tan⁻¹ as 1/tan, a missed second solution, the
impossible root of a quadratic in eˣ, an end behavior without limit notation). The validator regenerates 300
problems per context and kind and recomputes every key independently (its own formula, not the model's); the test
runs it plus model tests (a seed gives the same problem twice; every model value matches an independent
computation).

## Working in parallel

- No git commands that change anything. The lead commits.
- Never run `node scripts/build-apprecalc.mjs` without `--out <your scratch dir>`. To preview a tool, its topic
  must be published: `APPRECALC_PUBLISHED=unit-1,unit-2,unit-3,unit-4,skills-algebra node
  scripts/build-apprecalc.mjs --out <dir>` (content may still be partial; that is fine for tools). Serve and
  screenshot with Playwright at 1280 and 360 px, light and dark, and LOOK at the screenshots; iterate until it looks
  professional. If the scratch build lacks what you need to serve the page, copy the repo's `precalculus/assets/`
  and `assets/` next to the generated pages in your scratch dir.
- Run your validator and test (`node --test scripts/test/apprecalc-tool-<slug>.test.mjs`) until clean.
- Shared files (`pcalc-tools.js/.css`, `pcalc-tool-math.js`, `pcalc-plot.js`, `pcalc-expr.js`, `pcalc-math.js`,
  the generator): do not edit. If you truly need a shared change (a plot kind, a helper), put the exact diff in your
  report and work around it locally.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator and test results,
screenshots you checked (paths), any shared change needed.
