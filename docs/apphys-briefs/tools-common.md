# Brief for AP® Physics 1 trainer builders (Phase 2)

Repo `/home/claude/testaolivier10-del.github.io`, branch `claude/apphys`. Content authors and other tool
builders work in this folder at the same time. Read: `CLAUDE.md`, `docs/apphys-spec.md` (sections 3 and 6),
`docs/apphys-architecture.md` ("Tools", "Shared math", "Scene helpers"), `docs/tools-calm.md`,
`docs/tools-upgrade.md`, apchem decisions 20-23 in `docs/apchem-spec.md`, and the authoring guide's FBD
conventions and common errors (`docs/apphys-authoring-guide.md`, `docs/apphys-research/framework.md`
section 8). Study the current best tools before you design: `body-map.html` (NREMT, the owner's favourite:
it just works, very interactive, good information, interesting) and the AP® Chemistry trainers
(`chem/assets/tools/titration-curve-reader.js`, `buffer-drills.js`, `chem-tools.js`; open
`levlprep.com/chem/tools/titration-curve-reader.html`-style pages from a local build). Yours must be at
least that good, ideally better.

## The bar (owner's words, condensed)

- Interactive, visual, interesting; a real simulation, not a quiz with a picture. It "just works".
- Professional illustration quality: real-looking objects (carts with wheels, a ramp with a surface,
  a pulley, a spring that stretches, water with a surface line, a pendulum bob on a string), drawn cleanly
  in SVG (or canvas where a live sim needs it), consistent with the course style. No placeholder shapes.
- Simple on landing: clear what it is for and what to do first (one "Start here" cue), no function removed
  but extra information revealed progressively (More options, Why?, Details).
- Never a dead end: after a graded step, the Keep going strip (lesson, notes, glossary).
- Physically correct: integrate motion with a stable method; energy and momentum bookkeeping that adds
  up; numbers shown to sensible precision with units; the drawn picture agrees with the numbers
  (arrow lengths to scale, graphs from the same model). State g (9.8 m/s² by default; see the guide).
- Works on a phone at 360 px and on desktop at 1280 px, light and dark theme, keyboard (every control
  reachable, sliders with arrow keys), screen reader text for the scene's state, reduced motion (the
  `ApPhysScene.loop` end state), no console errors.

## Structure (per tool)

Your files only (Phase 0 made the layout so builders never share a file):
`physics/assets/tools/<slug>.js`, `physics/assets/tools/math/<slug>.js` (the model, registers
`ApPhysMath.<camelSlug>`; pure, no DOM, so validators and tests can run it), `physics/data/tools/<slug>.json`,
`scripts/lib/apphys-tool-checks/<slug>.mjs`, `scripts/test/apphys-tool-<slug>.test.mjs`, your tool's
entry in `physics/data/pages.json` (only your own entry's fields; Edit that entry, never rewrite the file),
and CSS scoped to your tool in your own file `physics/assets/tools/<slug>.css` if the shared
`phys-tools.css` is not enough (make sure the generator loads it; if it does not, list the needed
one-line change in your report instead of editing the generator).

Each tool: Explore pane (live scene + 1 to 3 primary controls in the dock, Why and Details sheets) and
"Test yourself": seeded step drills (`ApPhysTools.drill`, contexts per topic so each unlocks with its unit,
several problem kinds, steps that are `num`/`choice`/your own step types if you need them, e.g. a
draw-the-forces step graded force by force), first try recorded as `<slug>:<context>:<step>`. Feedback names
the specific slip (the common errors). The validator regenerates 300 problems per context and type and
recomputes every key independently; the test runs it plus model unit tests (e.g. energy conserved within
0.1% in a frictionless run, momentum conserved in every collision, period matches 2π√(m/k)).

## Working in parallel

- No git commands that change anything. I commit.
- Never run `node scripts/build-apphys.mjs` without `--out <your scratch dir>`. To preview a tool, its
  context topic must be published: `APPHYS_PUBLISHED=unit-1,unit-2,...,skills-math node scripts/build-apphys.mjs --out <dir>`
  (content may still be partial; that is fine for tools). Serve and screenshot with Playwright (installed) at
  1280 and 360 px, light and dark, and LOOK at the screenshots; iterate until it looks professional.
  If the scratch build does not include what you need to serve the page, work out the smallest way to
  preview (for example copy the repo's `physics/` and `assets/` next to the generated pages in your
  scratch dir) rather than writing into the repo.
- Run your validator and test (`node --test scripts/test/apphys-tool-<slug>.test.mjs`) until clean.
- Shared files (`phys-tools.js/.css`, `phys-tool-math.js`, `phys-scene.js`, generator): do not edit. If you
  truly need a shared change, put the exact diff in your report and work around it locally.

## Report

Reply in under 25 lines: what each tool does (explore + drill kinds), files, validator/test results,
screenshots you checked (paths), any shared change needed.
