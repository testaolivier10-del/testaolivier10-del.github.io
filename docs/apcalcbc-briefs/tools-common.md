# Brief for AP® Calculus BC trainer builders (Phase 2)

Repo `/home/claude/wt-calcbc`, branch `claude/apcalcbc`. Content authors and other builders work in this folder at the
same time. Read: `CLAUDE.md`, `docs/apcalcbc-spec.md` (sections 3 and 6), `docs/apcalcbc-architecture.md`
("Trainers", "Reuse"), **`docs/apcalc-briefs/tools-common.md` (the bar, the structure of Explore and Test yourself,
the preview routine: all of it holds)**, `docs/apcalc-architecture.md` ("Tools", "Shared math", "Plots"), and the
BC authoring guide's wording and slips (`docs/apcalcbc-authoring-guide.md`, framework.md section 7). Study AB's best
trainers before you design: `calculus/assets/tools/tangent-tracer.js`, `motion-lab.js`, `slope-fields.js`,
`area-volume.js` (and `body-map.html`, the owner's favourite). Yours run on the same framework.

## Your files (Phase 0 made one set per slug)

`calculus-bc/assets/tools/math/<slug>.js` (the model: replace the Phase 0 stub; pure, no DOM; registers
`ApCalcMath.<camelSlug>`), `calculus-bc/assets/tools/<slug>.js` (replace the stub), `calculus-bc/assets/tools/<slug>.css`
(optional; the generator loads it), `calculus-bc/data/tools/<slug>.json`, `scripts/lib/apcalcbc-tool-checks/<slug>.mjs`,
`scripts/test/apcalcbc-tool-<slug>.test.mjs`, and your slug's entry only in `calculus-bc/data/pages.json` (Edit that
entry, never rewrite the file) and its copy in `scripts/test/fixtures/apcalcbc-data/pages.json`.

The page loads AB's framework (`ApCalcTools`, `ApCalcMath` helpers, `ApCalcPlot`, the question engine with
`ApCalcBCInterval` for interval steps) from `/calculus/assets/`, then your model and script. Do not edit AB's
runtime: if you truly need a shared change, put the exact diff in your report and work around it locally. Storage
and events already use the BC key (`window.ApCalcCourse`); add your own keys as `apcalcbc_<slug>_...`.

## Each trainer

Explore (live scene, 1 to 3 primary controls, Why and Details) and Test yourself (seeded step drills via
`ApCalcTools.drill`, contexts per topic so each unlocks with its unit, several problem kinds, first try recorded as
`<slug>:<context>:<step>`), feedback that names the BC slip (the ratio test at an endpoint, radius for interval,
speed as |dy/dx|, r not squared, the ½ dropped, the initial condition subtracted, the wrong error bound). The
validator regenerates 300 problems per context and type with your model and recomputes every key independently
from the givens (never through the model), and the test runs it plus model unit tests (a partial sum against its
closed form, a Taylor polynomial against the function at the center, a polar area against a numeric integral,
Euler against a hand-worked table).

## Working in parallel

No git commands that change anything. Never run `node scripts/build-apcalcbc.mjs` without `--out <scratch>`; to
preview, publish the tool's topic: `APCALCBC_PUBLISHED=unit-10 APCALCBC_DATA=... node scripts/build-apcalcbc.mjs --out <dir>`
(serve your scratch dir with the repo's `calculus/` and `assets/` beside it so `/calculus/assets/` resolves).
Screenshot with Playwright at 1280 and 360 px, light and dark, and look. Run
`node --test scripts/test/apcalcbc-tool-<slug>.test.mjs` until clean.

## Report

Reply in under 25 lines: what each tool does (explore and drill kinds), files, validator and test results,
screenshots checked (paths), any shared change needed.
