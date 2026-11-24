# Tools v2 plans: the math group (AP® Calculus AB, AP® Calculus BC, AP® Precalculus, AP® Statistics)

Written 2026-11-23 (owner decision: a ready plan for every remaining tool, so each build starts from it). Plans only:
nothing here was built, run in a browser or swept. Each plan is `docs/tools-v2-plans/<course>-<tool>.md`. Read the
plan, then the standard (`docs/tools-v2-standard.md`), the builder brief (`docs/tools-v2-builder-brief.md`) and
the course spec before building. The Tangent tracer (`docs/tools-v2-tangent-tracer-brief.md`) is the integrated
math tool to copy from: its road and car, its magnifier, `K.handle` and every review lesson.

Skipped because they are live, integrated or in progress (`docs/tools-v2-pipeline.md`): AP® Calculus AB Tangent
tracer (integrated). Nothing else of these four courses is in the pipeline.

## Rollout order and difficulty (35 tools)

Order is the wave in `docs/tools-v2-rollout.md` section 5, then use rank inside a wave.

| # | Wave | Tool | Plan | Difficulty |
|---|---|---|---|---|
| 1 | 4 | AP® Calculus AB Area and volume (rank 35, Premium) | `calc-area-volume.md` | heavy: three tabs and the 3D solid renderer |
| 2 | 4 | AP® Calculus AB Limit explorer (40, Free) | `calc-limit-explorer.md` | medium: reuses the tracer's road and magnifier |
| 3 | 5 | AP® Statistics Probability trees (50, Free) | `stat-probability-trees.md` | heavy: a rebuild; first Statistics tool on kit2 |
| 4 | 7 | AP® Calculus AB Rule drills (49, Free) | `calc-rule-drills.md` | heavy: a typing tool given a picture to act on |
| 5 | 7 | AP® Precalculus Symbolic steps (104, Premium) | `pcalc-symbolic-steps.md` | medium: first Precalculus tool on kit2 |
| 6 | 13 | AP® Statistics Chi-square lab (52, Premium) | `stat-chi-square-lab.md` | medium: sibling of the integrated AP® Biology chi-square |
| 7 | 13 | AP® Statistics Data explorer (54, Free) | `stat-data-explorer.md` | medium |
| 8 | 13 | AP® Statistics Regression lab (55, Premium) | `stat-regression-lab.md` | medium |
| 9 | 13 | AP® Statistics Distribution areas (81, Premium) | `stat-distribution-areas.md` | medium: one science question for the author |
| 10 | 13 | AP® Statistics p-value explorer (82, Premium) | `stat-p-value-explorer.md` | medium |
| 11 | 15 | AP® Statistics Sampling lab (36, Premium) | `stat-sampling-lab.md` | medium |
| 12 | 15 | AP® Statistics Interval capture (53, Premium) | `stat-ci-capture.md` | simple |
| 13 | 15 | AP® Statistics Sampling distributions (56, Free) | `stat-sampling-distributions.md` | heavy: three tabs and bursts of 1,000 draws |
| 14 | 15 | AP® Statistics Design randomizer (100, Premium) | `stat-design-randomizer.md` | simple: the scene is already good |
| 15 | 16 | AP® Calculus AB Accumulation (63, Premium) | `calc-accumulation.md` | medium |
| 16 | 16 | AP® Calculus AB Riemann sums (76, Premium) | `calc-riemann-sums.md` | medium |
| 17 | 16 | AP® Calculus AB Slope fields (78, Premium) | `calc-slope-fields.md` | medium |
| 18 | 16 | AP® Calculus AB Curve analyzer (93, Premium) | `calc-curve-analyzer.md` | heavy: two tabs, three optimization scenes |
| 19 | 16 | AP® Calculus AB Motion lab (94, Premium) | `calc-motion-lab.md` | medium |
| 20 | 16 | AP® Calculus AB Related rates (95, Premium) | `calc-related-rates.md` | medium: five scenes to bring to the flagship level |
| 21 | 18 | AP® Calculus BC Integration methods (109, Premium) | `calcbc-integration-methods.md` | heavy: three tabs, partial fractions hard to make concrete |
| 22 | 18 | AP® Calculus BC Parametric motion (110, Premium) | `calcbc-parametric-motion.md` | medium |
| 23 | 18 | AP® Calculus BC Polar lab (111, Premium) | `calcbc-polar-lab.md` | medium |
| 24 | 18 | AP® Calculus BC Series lab (112, Free) | `calcbc-series-lab.md` | heavy: log jumps to 10⁶ and the power series tab |
| 25 | 18 | AP® Calculus BC Taylor lab (113, Premium) | `calcbc-taylor-lab.md` | medium |
| 26 | 18 | AP® Calculus BC Euler and logistic (125, Premium) | `calcbc-euler-logistic.md` | medium |
| 27 | 20 | AP® Precalculus Exponential and log lab (85, Premium) | `pcalc-exp-log-lab.md` | heavy: four tabs (four ideas) |
| 28 | 20 | AP® Precalculus Function lab (117, Free) | `pcalc-function-lab.md` | simple |
| 29 | 20 | AP® Precalculus Rate of change (118, Free) | `pcalc-rate-of-change.md` | medium |
| 30 | 20 | AP® Precalculus Regression lab (119, Premium) | `pcalc-regression-lab.md` | medium |
| 31 | 20 | AP® Precalculus Sinusoid builder (120, Premium) | `pcalc-sinusoid-builder.md` | medium |
| 32 | 23 | AP® Precalculus Unit circle (121, Free) | `pcalc-unit-circle.md` | simple |
| 33 | 23 | AP® Precalculus Polar graphs (127, Premium) | `pcalc-polar-graphs.md` | medium |
| 34 | 23 | AP® Precalculus Polynomials and rationals (128, Premium) | `pcalc-poly-rational.md` | medium |
| 35 | 23 | AP® Precalculus Vectors and matrices (129, Premium) | `pcalc-vectors-matrices.md` | heavy: three tabs, beyond the exam |

Simple 4, medium 22, heavy 9.

## Shared for every plan (read once; each plan names only what differs)

**What every old tool here has, and keeps.** All 35 run on their course's Tool Studio frame through
`<Course>Tools.modes` (Explore, then Test yourself). Test yourself is the course's shared drill
(`ApCalcTools.drill`, `ApPrecalcTools.drill`, `ApStatTools.drill`) and stays untouched: every kind, every
context in `<course>/assets/tool-data/<slug>.json`, the hint ladder, Show the answer, the problem code, and first
tries recorded as `<slug>:<context>:<step>` (and `<slug>` question records). Deep links: `?seed=` (a problem
link, opens Test yourself on that problem) and `#quiz` (opens Test yourself) are handled by the shared `modes()`
and must keep working; the "Problem link" copy button stays. Premium: a Premium tool's whole page is replaced by
the gate card when locked (`mountPremium` in `<course>/assets/<core>.js`, `data-premium="tools"` from
`data/pages.json`); unchanged. Kinds whose unit is not published stay hidden as today ("contexts unlock with their
units"). Each tool's first visit cue key (`apcalc-<slug>-...`, `apprecalc-<slug>-...`) is replaced by the kit's cue
(once per device), and any old per tool localStorage key is listed in its plan.

**Course mechanics.**
- AP® Calculus AB: the adapter exists (`ApCalcTools.studioKit2` in `calculus/assets/tools/calc-tools.js`, from the
  Tangent tracer); a tool opts in with `"kit2": true` on its entry in `calculus/data/pages.json`. **AB's build must
  stay byte-identical**: only the opted in page may change; run `node scripts/build-apcalc.mjs --check` and
  `node scripts/build-apcalcbc.mjs --check` after any change to `calc-tools.js`, `calc-plot.js`, the kit or the
  generator, because BC pages run the same runtime.
- AP® Calculus BC: BC trainers live in `calculus-bc/assets/tools/` but run on AB's `calc-tools.js`, `calc-plot.js`
  and `calc-math.js` with `window.ApCalcCourse` (`docs/apcalcbc-architecture.md`); one generator
  (`build-apcalcbc.mjs` runs `build-apcalc.mjs`). A BC tool opts in with `"kit2": true` in
  `calculus-bc/data/pages.json` and uses the same `ApCalcTools.studioKit2`; it never copies AB code into BC. The
  first BC tool on kit2 must confirm the generator writes the kit2 links for a BC page and that every AB page stays
  byte-identical (`build-apcalc --check`), then `build-apcalcbc --check`.
- AP® Precalculus: no kit2 yet. The first Precalculus tool to land (planned: Symbolic steps, wave 7; if another lands
  first, it does this) adds `ApPrecalcTools.studioKit2` to `precalculus/assets/tools/pcalc-tools.js` (the same small
  adapter as calculus: stage alone full width in Explore, reference behind "?", drill untouched) and the `t.kit2`
  links in `scripts/build-apprecalc.mjs` (the two lines `build-apcalc.mjs` has at its tool page), then
  `"kit2": true` per tool in `precalculus/data/pages.json`. Every later Precalculus tool checks
  `claude/tools-v2-all` first and extends, never forks. `node scripts/build-apprecalc.mjs --check`.
- AP® Statistics: no kit2 yet. The first Statistics tool to land (planned: Probability trees, wave 5) adds
  `ApStatTools.studioKit2` to `statistics/assets/tools/stat-tools.js` and the `t.kit2` links in
  `scripts/build-apstat.mjs`, then `"kit2": true` per tool in `statistics/data/pages.json`.
  `node scripts/build-apstat.mjs --check`. The integrated AP® Biology Chi-square (`docs/tools-v2-chi-square-brief.md`)
  is the nearest statistics picture on the kit.
- Any kit change (`assets/course/tool-kit2.js`): also `node scripts/build-apmacro.mjs --check` and the other
  courses' checks the builder brief lists, and the kit2 weight bucket (`['assets/course/kit2', 34]` in
  `scripts/check-weight.mjs`, measured 33.0 KB): a kit addition needs its budget raised with a measured comment.

**Research.** Links below were found by search on 2026-11-23 and not opened; the builder must actually open or run
the two or three named in the plan (rule 10) and say in the brief which were seen. Group G reference: Desmos
(https://www.desmos.com/calculator) and GeoGebra (https://www.geogebra.org); for statistics Seeing Theory
(https://seeing-theory.brown.edu/), StatKey (https://www.lock5stat.com/StatKey), the Art of Stat apps
(https://artofstat.com/web-apps) and the Rossman/Chance applets (https://www.rossmanchance.com/applets/index2021.html).

**Cause line examples** in the plans show the format; their numbers are illustrations and must be recomputed from
the model (and the tool's data) before they appear anywhere.

**Risks every plan carries** (from "Caught in reviews"; each plan adds its own): numbers, labels and the cause line
derived from what is drawn at that frame; labels at least 11 px and 4 px clear of every number and label in
Explore and Test yourself; the cause line in two rows at 360 px; one cue at a time; no dashed shapes (the old
tools here draw many dashed curves: every one becomes a thin solid line in its own colour, or goes); the knob
never covers the main object; median frame about 16 ms and p95 at or under 50 ms with CPU x4 at 390 and 1440;
every timer and loop stops when its stage hides; reduced motion gets a short cross fade and the full result; deep
links `?seed=` and `#quiz` then back to Explore show a laid out scene (the AP® Biology chi-square blocked on this).
