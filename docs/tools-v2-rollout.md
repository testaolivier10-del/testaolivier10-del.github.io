# Tools v2 rollout plan (2026-11-17)

Status file for rebuilding every interactive tool to the v2 standard. Plan only: no tool was changed. Read this
before starting a wave; update it when a wave ships or the owner answers a question in section 6.

- The standard: the eleven rules of the Project's tool standard doc (a session cannot open Project docs, so the summary
  below is from the task brief and the flagship brief), worked out on the flagship
  (APES Water pollution, branch `claude/tools-v2-water-pollution`, brief `docs/tools-v2-water-pollution-brief.md` on
  that branch: read its four "Owner round" sections). In short: start from the one idea; the student does the thing;
  obvious in 5 seconds; an immediate visible result; a purpose line, 1 to 3 word labels, one color per idea, a
  takeaway; nothing extra on screen; Explore is free play and Test yourself is the quiz; one control never moves
  another; the same frame everywhere; research the best existing tool of that kind first and use forgiving input;
  one main idea per screen with connected controls kept together.
- The shared kit: `assets/course/tool-kit2.js` and `.css` (on the flagship branch, not on main yet): `K.on`, `tabs`,
  `layer`, `drag`, `tap`, `cue`, `progress` (the time bar with a mark), `scrub`, `player`, `tour`, `readout`,
  `challenges`, `tries`, `timeline`, `predict`, `order`. Every wave below waits for that branch to merge.
- How this was made: every tool page was read from `origin/main` (92fe266f), opened in Chromium at 1440 x 900 with
  Premium unlocked (test only), measured on landing and looked at as a screenshot. Usage from the live database.

## Count

**145 tools, not 137.** 137 are the pages in the fourteen `<course>/tools/` folders. NREMT has 8 more at
`nremt/*.html` (they were in frame round F2). Both are listed; see question 1.

| Course | Tools | Free | Premium | Course layer every tool loads (under `<course>/assets/`) |
|---|---|---|---|---|
| NREMT | 8 | 7 | 1 | `nremt-studio.js`, `tool-results.js` |
| Ochem | 9 | 3 | 6 | `tool-shell.js`, `tools-registry.js`, `tool-state.js`, `tool-quiz.js`, `tool-handoff.js`, `molecule-editor.js`, `mol3d.js` |
| A&P | 8 | 3 | 5 | `tools/tool-kit.js` (`scene.js` for pathways and predict; `../assets/body3d/viewer.js` for 3D) |
| AP Bio | 19 | 10 | 9 | `tools/bio-tools.js`, `bio-tool-math.js` (`bio-skill-stage.js`, `bio-skill-problems.js` for the skill tools; `bio-art.js`) |
| AP Chem | 8 | 5 | 3 | `tools/chem-tools.js`, `chem-tool-math.js`, `live-beaker.js` |
| AP Physics 1 | 11 | 3 | 8 | `tools/phys-tools.js`, `phys-scene.js`, `phys-tool-math.js` |
| AP Calc AB | 10 | 3 | 7 | `tools/calc-tools.js`, `calc-plot.js`, `calc-tool-math.js` |
| AP Calc BC | 6 | 1 | 5 | AB’s `calculus/assets/tools/calc-tools.js`, `calc-plot.js`, `calc-tool-math.js` |
| AP Precalc | 10 | 3 | 7 | `tools/pcalc-tools.js`, `pcalc-plot.js`, `pcalc-tool-math.js` |
| AP Stats | 10 | 3 | 7 | `tools/stat-tools.js`, `stat-plot.js`, `stat-tool-math.js` |
| APES | 12 | 3 | 9 | `tools/env-tools.js`, `env-plot.js`, `env-tool-math.js` |
| AP Psych | 10 | 3 | 7 | `tools/psy-tools.js`, `psy-plot.js`, `psy-tool-math.js` |
| AP Macro | 8 | 3 | 5 | `tools/mac-tools.js`, `mac-plot.js`, `mac-tool-math.js` (`mac-graph.js`) |
| AP Micro | 8 | 3 | 5 | `tools/mic-tools.js`, `mic-plot.js`, `mic-tool-math.js` (`mic-graph.js`, `mic-matrix.js`) |
| AP HuG | 8 | 3 | 5 | `tools/hug-tools.js`, `hug-plot.js`, `hug-tool-math.js` (`hug-map.js`, `hug-model.js`) |
| **All** | **145** | **56** | **89** | all: `assets/course/tool-studio.js` (the frame) |

Free or Premium comes from the page (`data-premium="tools"`), from `FREE_TOOLS` in `ochem/assets/ochem-premium.js`
and, for NREMT, from the plan table in `assets/premium.js` (only the scenario simulator is Premium).

## 1 and 2. Inventory, ranked by use

### Where the numbers come from, and how far to trust them
- **Since 2026-11-17 there is one** (owner approved question 7): `tool-open`, `tool-touch`, `tool-mode` and `tool-use`
  in Umami, from the shared studio, for all 145 tools. How to read them: docs/analytics-plan.md, "Tool use"
  (`scripts/tool-use-report.mjs`). Order later waves by `tool-touch`, and compare each rebuilt tool's `old` and `v2`
  lines. The numbers below are from before it.
- **There was no tool event when this was written.** Nothing recorded a tool being used (no open, first touch, mode or time event in
  `assets/analytics.js`; `question_stats` holds exam and practice answers by course, not tool activity). Umami has
  page views per URL but no API key is reachable from a session, so it was not read.
- **Used here: `page_views` in Supabase** (one row per path per day, written by `track_pageview` on every page load),
  2026-09-18 to 2026-11-17. It is a count of **page opens, not of use**, and it has no visitor identity, so **the
  owner, crawlers and test browsers cannot be taken out exactly.** Two corrections were made:
  1. **CI noise removed.** Twenty tool pages are opened by the accessibility check on every CI run
     (`scripts/check-a11y.mjs`: one or two per course) and each run reached the live counter: those pages show the
     same count as each other every day (up to 51 a day; 130 to 430 each in 30 days). For those pages the day's
     shared CI count (the median of six of them) is subtracted. They are marked † and their numbers are the least
     certain. (F8, 2026-11-16, blocked outside hosts in that check, so this should stop; 2026-11-17 shows none so far.)
  2. **Bursts capped at 10 opens per tool per day**, which removes test and audit bursts (A&P calculators: 1,913 opens
     on one day; A&P predict 170; lab practical 143).
- **Scale: about 1373 corrected tool opens in 30 days across all 145 tools** (2329 in 60). Past the
  first 40 tools the differences are a handful of opens and mean little. Courses launched in the last weeks (AP Macro,
  AP Micro, AP HuG, AP Psych, AP Precalc, AP Calc BC) have had less time to collect any.
- Course level check (`question_stats`, answers since 2026-10-20): AP Bio 421, AP Stats 101, NREMT 95, APES 84,
  AP Calc AB 76, AP Chem 50, A&P 40, AP Physics 33, AP Precalc 33, Ochem 21, AP Calc BC 16, AP Psych 13, AP Macro,
  AP Micro and AP HuG 0. It agrees with the ranking: the older courses carry the use.
- Ranking rule: corrected opens in the last 30 days; ties by 60 days, then by days seen. Links from lessons were not
  used as a proxy (most are written by script at load, so a static count is not reliable).

Columns: **30 d / 60 d** corrected opens; **days** = days in the 60 with at least one open; **raw** = uncorrected 60
day count. Page paths are from the site root; scripts are the tool's own files under `<course>/assets/` (NREMT:
`nremt/assets/`), on top of the course layer above. Group letters are in section 3.

| # | Tool | Page | Own scripts | Plan | Group | 30 d | 60 d | Days | Raw |
|---|---|---|---|---|---|---|---|---|---|
| 1 | AP Bio osmosis | `bio/tools/osmosis.html` | `tools/osmosis.js` | Free | P | 50 | 60 | 25 | 60 |
| 2 | Ochem conformations | `ochem/tools/conformations.html` | `tools/conformations.js` | Premium | P | 45 | 85 | 29 | 85 |
| 3 | A&P graphs | `anatomy-physiology/tools/graphs.html` | `tools/graphs.js` | Premium | G | 45 | 60 | 30 | 60 |
| 4 | NREMT mnemonics | `nremt/mnemonics.html` | `mnemonic-check.js` | Free | M | 44 | 65 | 27 | 68 |
| 5 | AP Bio water-potential | `bio/tools/water-potential.html` | `tools/water-potential.js` | Free | P | 44 | 50 | 14 | 139 |
| 6 | A&P pathways | `anatomy-physiology/tools/pathways.html` | `tools/pathways.js` | Premium | F | 41 | 51 | 29 | 51 |
| 7 | A&P lab-practical | `anatomy-physiology/tools/lab-practical.html` | `tools/lab-practical.js` | Premium | X | 38 | 62 | 31 | 195 |
| 8 | A&P predict † | `anatomy-physiology/tools/predict.html` | `tools/predict.js` | Premium | F | 31 | 154 | 38 | 808 |
| 9 | A&P feedback-loops | `anatomy-physiology/tools/feedback-loops.html` | `tools/feedback-loops.js` | Free | F | 30 | 44 | 22 | 44 |
| 10 | AP Chem units-sig-figs | `chem/tools/units-sig-figs.html` | `tools/units-sig-figs.js` | Free | C | 30 | 34 | 9 | 34 |
| 11 | AP Bio simpson-diversity | `bio/tools/simpson-diversity.html` | `tools/simpson-diversity.js` | Free | P | 23 | 28 | 18 | 28 |
| 12 | NREMT body-map | `nremt/body-map.html` | `body-content.js`, `burns.js`, `body-figures.js`, `../assets/body3d/viewer.js` | Free | X | 22 | 50 | 31 | 50 |
| 13 | AP Bio design-drills | `bio/tools/design-drills.html` | `tools/design-drills.js` | Free | R | 21 | 24 | 16 | 24 |
| 14 | AP Calc AB tangent-tracer | `calculus/tools/tangent-tracer.html` | `tools/tangent-tracer.js`, `tools/math/tangent-tracer.js` | Free | G | 21 | 23 | 15 | 23 |
| 15 | NREMT sound-trainer | `nremt/sound-trainer.html` | `sound-bank.js`, `sound-stage.js` | Free | S | 20 | 47 | 23 | 57 |
| 16 | NREMT flowcharts | `nremt/flowcharts.html` | `flow-build.js`, `flow-drill.js` | Free | F | 20 | 43 | 27 | 43 |
| 17 | Ochem resonance | `ochem/tools/resonance.html` | `tools/resonance.js` | Free | B | 19 | 46 | 28 | 46 |
| 18 | Ochem arrow-pusher | `ochem/tools/arrow-pusher.html` | `tools/arrow-pusher.js` | Free | B | 19 | 46 | 24 | 46 |
| 19 | Ochem viewer-3d | `ochem/tools/viewer-3d.html` | `tools/viewer-3d.js` | Free | X | 19 | 44 | 24 | 44 |
| 20 | A&P anatomy-3d † | `anatomy-physiology/tools/anatomy-3d.html` | `tools/anatomy-3d.js` | Premium | X | 18 | 18 | 14 | 344 |
| 21 | APES energy-flow | `environmental-science/tools/energy-flow.html` | `tools/energy-flow.js`, `tools/math/energy-flow.js` | Free | P | 17 | 17 | 12 | 17 |
| 22 | NREMT skillsheets | `nremt/skillsheets.html` | `station-run.js`, `station-patient.js` | Free | N | 16 | 49 | 29 | 51 |
| 23 | NREMT scenario-sim | `nremt/scenario-sim.html` | `scenario-monitor.js`, `premium-gates.js` | Premium | N | 16 | 34 | 24 | 34 |
| 24 | AP Bio chi-square | `bio/tools/chi-square.html` | `tools/chi-square.js` | Free | G | 15 | 25 | 16 | 25 |
| 25 | Ochem reaction-predictor | `ochem/tools/reaction-predictor.html` | `tools/reaction-predictor.js` | Premium | M | 14 | 27 | 17 | 27 |
| 26 | AP Bio rates | `bio/tools/rates.html` | `tools/rates.js` | Free | G | 14 | 21 | 15 | 21 |
| 27 | AP Bio enzyme-activity | `bio/tools/enzyme-activity.html` | `tools/enzyme-activity.js` | Premium | P | 13 | 23 | 15 | 23 |
| 28 | AP Psych brain-map | `psychology/tools/brain-map.html` | `tools/brain-map.js`, `tools/math/brain-map.js` | Free | X | 12 | 12 | 9 | 12 |
| 29 | AP Psych neuron | `psychology/tools/neuron.html` | `tools/neuron.js`, `tools/math/neuron.js` | Free | P | 12 | 12 | 8 | 12 |
| 30 | Ochem acid-base | `ochem/tools/acid-base.html` | `tools/acid-base.js` | Premium | M | 11 | 19 | 13 | 19 |
| 31 | APES cycles | `environmental-science/tools/cycles.html` | `tools/cycles.js`, `tools/math/cycles.js` | Free | X | 11 | 11 | 9 | 11 |
| 32 | APES earth-climate | `environmental-science/tools/earth-climate.html` | `tools/earth-climate.js`, `tools/math/earth-climate.js` | Premium | P | 11 | 11 | 8 | 11 |
| 33 | AP Bio meiosis-nondisjunction | `bio/tools/meiosis-nondisjunction.html` | `tools/meiosis-nondisjunction.js` | Premium | P | 10 | 16 | 14 | 16 |
| 34 | AP Bio tree-reading | `bio/tools/tree-reading.html` | `tools/tree-reading.js` | Premium | B | 10 | 15 | 11 | 15 |
| 35 | AP Calc AB area-volume | `calculus/tools/area-volume.html` | `tools/area-volume.js`, `tools/math/area-volume.js` | Premium | G | 10 | 12 | 11 | 12 |
| 36 | AP Stats sampling-lab | `statistics/tools/sampling-lab.html` | `tools/sampling-lab.js`, `tools/math/sampling-lab.js` | Premium | P | 10 | 10 | 7 | 10 |
| 37 | AP Chem particle-diagrams | `chem/tools/particle-diagrams.html` | `tools/particle-diagrams.js` | Free | B | 9 | 20 | 11 | 20 |
| 38 | AP Bio confidence-intervals | `bio/tools/confidence-intervals.html` | `tools/confidence-intervals.js` | Free | G | 9 | 15 | 14 | 15 |
| 39 | AP Bio population-growth | `bio/tools/population-growth.html` | `tools/population-growth.js` | Premium | P | 9 | 15 | 12 | 15 |
| 40 | AP Calc AB limit-explorer | `calculus/tools/limit-explorer.html` | `tools/limit-explorer.js`, `tools/math/limit-explorer.js` | Free | G | 9 | 11 | 9 | 11 |
| 41 | APES climate-change | `environmental-science/tools/climate-change.html` | `tools/climate-change.js`, `tools/math/climate-change.js` | Premium | P | 9 | 9 | 8 | 9 |
| 42 | APES population-growth | `environmental-science/tools/population-growth.html` | `tools/population-growth.js`, `tools/math/population-growth.js` | Premium | P | 9 | 9 | 8 | 9 |
| 43 | Ochem spectroscopy | `ochem/tools/spectroscopy.html` | `tools/spectroscopy.js` | Premium | S | 8 | 19 | 13 | 19 |
| 44 | NREMT reference-cards | `nremt/reference-cards.html` | `ref-cards.js`, `vitals-check.js` | Free | C | 8 | 18 | 13 | 18 |
| 45 | AP Bio descriptive-stats | `bio/tools/descriptive-stats.html` | `tools/descriptive-stats.js` | Free | G | 8 | 17 | 12 | 17 |
| 46 | AP Bio operons | `bio/tools/operons.html` | `tools/operons.js` | Premium | P | 8 | 15 | 10 | 15 |
| 47 | AP Bio graph-builder | `bio/tools/graph-builder.html` | `tools/graph-builder.js` | Free | B | 8 | 14 | 11 | 14 |
| 48 | AP Bio hardy-weinberg | `bio/tools/hardy-weinberg.html` | `tools/hardy-weinberg.js` | Free | P | 8 | 14 | 10 | 14 |
| 49 | AP Calc AB rule-drills | `calculus/tools/rule-drills.html` | `tools/rule-drills.js`, `tools/math/rule-drills.js` | Free | C | 8 | 9 | 6 | 9 |
| 50 | AP Stats probability-trees | `statistics/tools/probability-trees.html` | `tools/probability-trees.js`, `tools/math/probability-trees.js` | Free | B | 8 | 8 | 8 | 8 |
| 51 | APES water-pollution | `environmental-science/tools/water-pollution.html` | `tools/water-pollution.js`, `tools/math/water-pollution.js` | Premium | P | 8 | 8 | 7 | 8 |
| 52 | AP Stats chi-square-lab † | `statistics/tools/chi-square-lab.html` | `tools/chi-square-lab.js`, `tools/math/chi-square-lab.js` | Premium | G | 8 | 8 | 7 | 433 |
| 53 | AP Stats ci-capture | `statistics/tools/ci-capture.html` | `tools/ci-capture.js`, `tools/math/ci-capture.js` | Premium | G | 8 | 8 | 7 | 8 |
| 54 | AP Stats data-explorer | `statistics/tools/data-explorer.html` | `tools/data-explorer.js`, `tools/math/data-explorer.js` | Free | G | 8 | 8 | 7 | 8 |
| 55 | AP Stats regression-lab | `statistics/tools/regression-lab.html` | `tools/regression-lab.js`, `tools/math/regression-lab.js` | Premium | G | 8 | 8 | 7 | 8 |
| 56 | AP Stats sampling-distributions | `statistics/tools/sampling-distributions.html` | `tools/sampling-distributions.js`, `tools/math/sampling-distributions.js` | Free | G | 8 | 8 | 7 | 8 |
| 57 | APES soil-texture | `environmental-science/tools/soil-texture.html` | `tools/soil-texture.js`, `tools/math/soil-texture.js` | Premium | P | 8 | 8 | 6 | 8 |
| 58 | AP Chem equilibrium-kinetics | `chem/tools/equilibrium-kinetics.html` | `tools/equilibrium-kinetics.js` | Premium | P | 8 | 8 | 5 | 8 |
| 59 | AP Bio hardy-weinberg-drift | `bio/tools/hardy-weinberg-drift.html` | `tools/hardy-weinberg-drift.js` | Premium | P | 7 | 20 | 12 | 20 |
| 60 | AP Chem titration-curve-reader | `chem/tools/titration-curve-reader.html` | `tools/titration-curve-reader.js` | Free | P | 7 | 11 | 9 | 11 |
| 61 | AP Bio energy-flow | `bio/tools/energy-flow.html` | `tools/energy-flow.js` | Premium | P | 7 | 10 | 9 | 10 |
| 62 | AP Physics 1 energy-bar-charts | `physics/tools/energy-bar-charts.html` | `tools/energy-bar-charts.js`, `tools/math/energy-bar-charts.js` | Premium | P | 7 | 9 | 7 | 9 |
| 63 | AP Calc AB accumulation † | `calculus/tools/accumulation.html` | `tools/accumulation.js`, `tools/math/accumulation.js` | Premium | G | 7 | 8 | 8 | 447 |
| 64 | AP Chem periodic-trends-pes | `chem/tools/periodic-trends-pes.html` | `tools/periodic-trends-pes.js` | Free | X | 7 | 7 | 7 | 7 |
| 65 | APES age-structure † | `environmental-science/tools/age-structure.html` | `tools/age-structure.js`, `tools/math/age-structure.js` | Premium | P | 7 | 7 | 6 | 422 |
| 66 | APES dose-response | `environmental-science/tools/dose-response.html` | `tools/dose-response.js`, `tools/math/dose-response.js` | Premium | P | 7 | 7 | 6 | 7 |
| 67 | APES energy-chain | `environmental-science/tools/energy-chain.html` | `tools/energy-chain.js`, `tools/math/energy-chain.js` | Premium | P | 7 | 7 | 6 | 7 |
| 68 | APES calculation-studio | `environmental-science/tools/calculation-studio.html` | `tools/calculation-studio.js`, `tools/math/calculation-studio.js` | Free | C | 7 | 7 | 5 | 7 |
| 69 | Ochem reagent-roadmap † | `ochem/tools/reagent-roadmap.html` | `tools/reagent-roadmap.js`, `tools/reagent-roadmap-data.js`, `tools/synthesis-data.js` | Premium | F | 6 | 132 | 24 | 629 |
| 70 | A&P calculators | `anatomy-physiology/tools/calculators.html` | `tools/calculators.js` | Free | C | 6 | 23 | 12 | 1926 |
| 71 | A&P word-roots | `anatomy-physiology/tools/word-roots.html` | `tools/word-roots.js` | Free | M | 6 | 20 | 10 | 38 |
| 72 | AP Chem ice-table-drills | `chem/tools/ice-table-drills.html` | `tools/ice-table-drills.js` | Free | P | 6 | 17 | 8 | 74 |
| 73 | AP Physics 1 fluids-tank | `physics/tools/fluids-tank.html` | `tools/fluids-tank.js`, `tools/math/fluids-tank.js` | Premium | P | 6 | 10 | 8 | 10 |
| 74 | AP Physics 1 free-body-diagrams | `physics/tools/free-body-diagrams.html` | `tools/free-body-diagrams.js`, `tools/math/free-body-diagrams.js` | Free | B | 6 | 8 | 8 | 8 |
| 75 | AP Physics 1 torque-balance | `physics/tools/torque-balance.html` | `tools/torque-balance.js`, `tools/math/torque-balance.js` | Premium | P | 6 | 8 | 8 | 8 |
| 76 | AP Calc AB riemann-sums | `calculus/tools/riemann-sums.html` | `tools/riemann-sums.js`, `tools/math/riemann-sums.js` | Premium | G | 6 | 8 | 7 | 8 |
| 77 | AP Physics 1 collision-lab † | `physics/tools/collision-lab.html` | `tools/collision-lab.js`, `tools/math/collision-lab.js` | Premium | P | 6 | 7 | 7 | 452 |
| 78 | AP Calc AB slope-fields | `calculus/tools/slope-fields.html` | `tools/slope-fields.js`, `tools/math/slope-fields.js` | Premium | G | 6 | 7 | 6 | 7 |
| 79 | AP Physics 1 oscillator-lab | `physics/tools/oscillator-lab.html` | `tools/oscillator-lab.js`, `tools/math/oscillator-lab.js` | Premium | P | 6 | 7 | 6 | 7 |
| 80 | AP Psych development | `psychology/tools/development.html` | `tools/development.js`, `tools/math/development.js` | Premium | P | 6 | 6 | 6 | 6 |
| 81 | AP Stats distribution-areas | `statistics/tools/distribution-areas.html` | `tools/distribution-areas.js`, `tools/math/distribution-areas.js` | Premium | G | 6 | 6 | 6 | 6 |
| 82 | AP Stats p-value-explorer | `statistics/tools/p-value-explorer.html` | `tools/p-value-explorer.js`, `tools/math/p-value-explorer.js` | Premium | G | 6 | 6 | 6 | 6 |
| 83 | APES air-pollution | `environmental-science/tools/air-pollution.html` | `tools/air-pollution.js`, `tools/math/air-pollution.js` | Premium | P | 6 | 6 | 5 | 6 |
| 84 | AP Psych article-studio | `psychology/tools/article-studio.html` | `tools/article-studio.js`, `tools/math/article-studio.js` | Free | R | 6 | 6 | 5 | 6 |
| 85 | AP Precalc exp-log-lab † | `precalculus/tools/exp-log-lab.html` | `tools/exp-log-lab.js`, `tools/math/exp-log-lab.js` | Premium | G | 6 | 6 | 4 | 313 |
| 86 | AP HuG scale-lab | `human-geography/tools/scale-lab.html` | `tools/scale-lab.js`, `tools/math/scale-lab.js` | Free | X | 6 | 6 | 3 | 6 |
| 87 | AP Bio cell-cycle-checkpoints † | `bio/tools/cell-cycle-checkpoints.html` | `tools/cell-cycle-checkpoints.js` | Premium | P | 5 | 62 | 12 | 518 |
| 88 | AP Bio signal-transduction-amplification | `bio/tools/signal-transduction-amplification.html` | `tools/signal-transduction-amplification.js` | Premium | P | 5 | 15 | 10 | 15 |
| 89 | AP Physics 1 lab-design | `physics/tools/lab-design.html` | `tools/lab-design.js`, `tools/math/lab-design.js` | Premium | P | 5 | 9 | 6 | 9 |
| 90 | AP Physics 1 projectile-lab | `physics/tools/projectile-lab.html` | `tools/projectile-lab.js`, `tools/math/projectile-lab.js` | Premium | P | 5 | 7 | 7 | 7 |
| 91 | AP Physics 1 motion-graphs | `physics/tools/motion-graphs.html` | `tools/motion-graphs.js`, `tools/math/motion-graphs.js` | Free | P | 5 | 7 | 6 | 7 |
| 92 | AP Physics 1 rotation-lab | `physics/tools/rotation-lab.html` | `tools/rotation-lab.js`, `tools/math/rotation-lab.js` | Premium | P | 5 | 6 | 6 | 6 |
| 93 | AP Calc AB curve-analyzer | `calculus/tools/curve-analyzer.html` | `tools/curve-analyzer.js`, `tools/math/curve-analyzer.js` | Premium | G | 5 | 6 | 5 | 6 |
| 94 | AP Calc AB motion-lab | `calculus/tools/motion-lab.html` | `tools/motion-lab.js`, `tools/math/motion-lab.js` | Premium | G | 5 | 6 | 5 | 6 |
| 95 | AP Calc AB related-rates | `calculus/tools/related-rates.html` | `tools/related-rates.js`, `tools/math/related-rates.js` | Premium | G | 5 | 6 | 5 | 6 |
| 96 | AP Macro forex-lab | `macroeconomics/tools/forex-lab.html` | `tools/forex-lab.js`, `tools/math/forex-lab.js` | Premium | E | 5 | 5 | 5 | 5 |
| 97 | AP Psych conditioning-lab | `psychology/tools/conditioning-lab.html` | `tools/conditioning-lab.js`, `tools/math/conditioning-lab.js` | Premium | P | 5 | 5 | 5 | 5 |
| 98 | AP Psych evidence-builder | `psychology/tools/evidence-builder.html` | `tools/evidence-builder.js`, `tools/math/evidence-builder.js` | Premium | R | 5 | 5 | 5 | 5 |
| 99 | AP Psych memory-lab | `psychology/tools/memory-lab.html` | `tools/memory-lab.js`, `tools/math/memory-lab.js` | Premium | P | 5 | 5 | 5 | 5 |
| 100 | AP Stats design-randomizer | `statistics/tools/design-randomizer.html` | `tools/design-randomizer.js`, `tools/math/design-randomizer.js` | Premium | P | 5 | 5 | 5 | 5 |
| 101 | AP Macro indicators-lab | `macroeconomics/tools/indicators-lab.html` | `tools/indicators-lab.js`, `tools/math/indicators-lab.js` | Free | C | 5 | 5 | 4 | 5 |
| 102 | AP Macro ppc-trade | `macroeconomics/tools/ppc-trade.html` | `tools/ppc-trade.js`, `tools/math/ppc-trade.js` | Free | E | 5 | 5 | 4 | 5 |
| 103 | Ochem synthesis † | `ochem/tools/synthesis.html` | `tools/synthesis.js`, `tools/reagent-roadmap-data.js`, `tools/synthesis-data.js` | Premium | F | 5 | 5 | 4 | 331 |
| 104 | AP Precalc symbolic-steps | `precalculus/tools/symbolic-steps.html` | `tools/symbolic-steps.js`, `tools/math/symbolic-steps.js` | Premium | C | 5 | 5 | 3 | 5 |
| 105 | AP Chem buffer-drills † | `chem/tools/buffer-drills.html` | `tools/buffer-drills.js` | Premium | P | 4 | 40 | 10 | 485 |
| 106 | NREMT formulary | `nremt/formulary.html` | `formulary-cards.js`, `formulary-drill.js` | Free | M | 4 | 17 | 11 | 17 |
| 107 | AP Chem q-vs-k | `chem/tools/q-vs-k.html` | `tools/q-vs-k.js` | Premium | P | 4 | 6 | 5 | 6 |
| 108 | AP Physics 1 scaling-drills | `physics/tools/scaling-drills.html` | `tools/scaling-drills.js`, `tools/math/scaling-drills.js` | Free | C | 4 | 5 | 5 | 5 |
| 109 | AP Calc BC integration-methods | `calculus-bc/tools/integration-methods.html` | `tools/integration-methods.js`, `tools/math/integration-methods.js` | Premium | G | 4 | 4 | 4 | 4 |
| 110 | AP Calc BC parametric-motion | `calculus-bc/tools/parametric-motion.html` | `tools/parametric-motion.js`, `tools/math/parametric-motion.js` | Premium | G | 4 | 4 | 4 | 4 |
| 111 | AP Calc BC polar-lab | `calculus-bc/tools/polar-lab.html` | `tools/polar-lab.js`, `tools/math/polar-lab.js` | Premium | G | 4 | 4 | 4 | 4 |
| 112 | AP Calc BC series-lab | `calculus-bc/tools/series-lab.html` | `tools/series-lab.js`, `tools/math/series-lab.js` | Free | G | 4 | 4 | 4 | 4 |
| 113 | AP Calc BC taylor-lab | `calculus-bc/tools/taylor-lab.html` | `tools/taylor-lab.js`, `tools/math/taylor-lab.js` | Premium | G | 4 | 4 | 4 | 4 |
| 114 | AP HuG population-lab | `human-geography/tools/population-lab.html` | `tools/population-lab.js`, `tools/math/population-lab.js` | Premium | P | 4 | 4 | 4 | 4 |
| 115 | AP Macro policy-chain | `macroeconomics/tools/policy-chain.html` | `tools/policy-chain.js`, `tools/math/policy-chain.js` | Premium | F | 4 | 4 | 4 | 4 |
| 116 | AP Macro reserves-lab | `macroeconomics/tools/reserves-lab.html` | `tools/reserves-lab.js`, `tools/math/reserves-lab.js` | Premium | E | 4 | 4 | 4 | 4 |
| 117 | AP Precalc function-lab | `precalculus/tools/function-lab.html` | `tools/function-lab.js`, `tools/math/function-lab.js` | Free | G | 4 | 4 | 4 | 4 |
| 118 | AP Precalc rate-of-change | `precalculus/tools/rate-of-change.html` | `tools/rate-of-change.js`, `tools/math/rate-of-change.js` | Free | G | 4 | 4 | 4 | 4 |
| 119 | AP Precalc regression-lab | `precalculus/tools/regression-lab.html` | `tools/regression-lab.js`, `tools/math/regression-lab.js` | Premium | G | 4 | 4 | 4 | 4 |
| 120 | AP Precalc sinusoid-builder | `precalculus/tools/sinusoid-builder.html` | `tools/sinusoid-builder.js`, `tools/math/sinusoid-builder.js` | Premium | G | 4 | 4 | 4 | 4 |
| 121 | AP Precalc unit-circle | `precalculus/tools/unit-circle.html` | `tools/unit-circle.js`, `tools/math/unit-circle.js` | Free | G | 4 | 4 | 4 | 4 |
| 122 | AP Psych sensation | `psychology/tools/sensation.html` | `tools/sensation.js`, `tools/math/sensation.js` | Premium | P | 4 | 4 | 4 | 4 |
| 123 | AP Psych social-influence | `psychology/tools/social-influence.html` | `tools/social-influence.js`, `tools/math/social-influence.js` | Premium | P | 4 | 4 | 4 | 4 |
| 124 | AP Psych stats-lab | `psychology/tools/stats-lab.html` | `tools/stats-lab.js`, `tools/math/stats-lab.js` | Premium | G | 4 | 4 | 4 | 4 |
| 125 | AP Calc BC euler-logistic † | `calculus-bc/tools/euler-logistic.html` | `tools/euler-logistic.js`, `tools/math/euler-logistic.js` | Premium | G | 3 | 3 | 3 | 307 |
| 126 | AP Macro adas-lab † | `macroeconomics/tools/adas-lab.html` | `tools/adas-lab.js`, `tools/math/adas-lab.js` | Premium | E | 3 | 3 | 3 | 284 |
| 127 | AP Precalc polar-graphs | `precalculus/tools/polar-graphs.html` | `tools/polar-graphs.js`, `tools/math/polar-graphs.js` | Premium | G | 3 | 3 | 3 | 3 |
| 128 | AP Precalc poly-rational | `precalculus/tools/poly-rational.html` | `tools/poly-rational.js`, `tools/math/poly-rational.js` | Premium | G | 3 | 3 | 3 | 3 |
| 129 | AP Precalc vectors-matrices | `precalculus/tools/vectors-matrices.html` | `tools/vectors-matrices.js`, `tools/math/vectors-matrices.js` | Premium | G | 3 | 3 | 3 | 3 |
| 130 | AP HuG diffusion-lab | `human-geography/tools/diffusion-lab.html` | `tools/diffusion-lab.js`, `tools/math/diffusion-lab.js` | Premium | P | 3 | 3 | 2 | 3 |
| 131 | AP HuG model-studio † | `human-geography/tools/model-studio.html` | `tools/model-studio.js`, `tools/math/model-studio.js` | Free | B | 3 | 3 | 2 | 134 |
| 132 | AP Macro multiplier-lab | `macroeconomics/tools/multiplier-lab.html` | `tools/multiplier-lab.js`, `tools/math/multiplier-lab.js` | Premium | P | 3 | 3 | 2 | 3 |
| 133 | AP HuG map-reader † | `human-geography/tools/map-reader.html` | `tools/map-reader.js`, `tools/math/map-reader.js` | Free | X | 2 | 2 | 2 | 134 |
| 134 | AP Macro graph-studio † | `macroeconomics/tools/graph-studio.html` | `tools/graph-studio.js`, `tools/math/graph-studio.js` | Free | E | 2 | 2 | 2 | 283 |
| 135 | AP Micro elasticity-lab | `microeconomics/tools/elasticity-lab.html` | `tools/elasticity-lab.js`, `tools/math/elasticity-lab.js` | Free | E | 2 | 2 | 2 | 2 |
| 136 | AP Micro game-lab † | `microeconomics/tools/game-lab.html` | `tools/game-lab.js`, `tools/math/game-lab.js` | Free | M | 2 | 2 | 2 | 144 |
| 137 | AP HuG borders-lab † | `human-geography/tools/borders-lab.html` | `tools/borders-lab.js`, `tools/math/borders-lab.js` | Premium | P | 1 | 1 | 1 | 132 |
| 138 | AP HuG city-lab | `human-geography/tools/city-lab.html` | `tools/city-lab.js`, `tools/math/city-lab.js` | Premium | P | 1 | 1 | 1 | 1 |
| 139 | AP HuG frq-coach | `human-geography/tools/frq-coach.html` | `tools/frq-coach.js`, `tools/math/frq-coach.js` | Premium | R | 1 | 1 | 1 | 1 |
| 140 | AP Micro cost-lab † | `microeconomics/tools/cost-lab.html` | `tools/cost-lab.js`, `tools/math/cost-lab.js` | Premium | E | 1 | 1 | 1 | 143 |
| 141 | AP Micro externality-lab | `microeconomics/tools/externality-lab.html` | `tools/externality-lab.js`, `tools/math/externality-lab.js` | Premium | E | 1 | 1 | 1 | 1 |
| 142 | AP Micro factor-lab | `microeconomics/tools/factor-lab.html` | `tools/factor-lab.js`, `tools/math/factor-lab.js` | Premium | E | 1 | 1 | 1 | 1 |
| 143 | AP Micro firm-market | `microeconomics/tools/firm-market.html` | `tools/firm-market.js`, `tools/math/firm-market.js` | Premium | E | 1 | 1 | 1 | 1 |
| 144 | AP Micro graph-studio † | `microeconomics/tools/graph-studio.html` | `tools/graph-studio.js`, `tools/math/graph-studio.js` | Free | E | 1 | 1 | 1 | 143 |
| 145 | AP Micro surplus-lab | `microeconomics/tools/surplus-lab.html` | `tools/surplus-lab.js`, `tools/math/surplus-lab.js` | Premium | E | 1 | 1 | 1 | 1 |

The query (read only): per path and day from `public.page_views` for `/<course>/tools/<slug>` and the eight
`/nremt/<slug>` pages, last 60 days; for the † pages `greatest(0, views - median of six † pages that day)`; then
`least(10, …)` per day, summed.

## 3. Groups by kind of interaction

One letter per tool (its main interaction; some tools have a second). "Kit" names are from `tool-kit2.js`.

| Group | Tools | Study first (best of its kind) | Reuses from the kit | New shared piece the group needs |
|---|---|---|---|---|
| **P. Parameter simulators** (50) | AP Bio: osmosis, water-potential, simpson-diversity, enzyme-activity, meiosis-nondisjunction, population-growth, operons, hardy-weinberg, hardy-weinberg-drift, energy-flow, cell-cycle-checkpoints, signal-transduction-amplification; Ochem: conformations; APES: energy-flow, earth-climate, climate-change, population-growth, water-pollution, soil-texture, age-structure, dose-response, energy-chain, air-pollution; AP Psych: neuron, development, conditioning-lab, memory-lab, sensation, social-influence; AP Stats: sampling-lab, design-randomizer; AP Chem: equilibrium-kinetics, titration-curve-reader, ice-table-drills, buffer-drills, q-vs-k; AP Physics 1: energy-bar-charts, fluids-tank, torque-balance, collision-lab, oscillator-lab, lab-design, projectile-lab, motion-graphs, rotation-lab; AP HuG: population-lab, diffusion-lab, borders-lab, city-lab; AP Macro: multiplier-lab | **PhET Interactive Simulations** (e.g. Energy Skate Park, pH Scale, Natural Selection: controls on the picture, instant response, implicit cues). Also HHMI BioInteractive, Concord Consortium, Nicky Case’s explorables | All of it: `tabs`, `layer`, `drag`, `tap`, `cue`, `progress`, `scrub`, `player`, `tour`, the takeaway and cause line pattern | An adapter in each course layer (`bio-tools.js`, `chem-tools.js`, `phys-tools.js`, `psy-tools.js`, `hug-tools.js`, …) that turns the kit on as `env-tools.js` does for the flagship; the "before" ghost line and the cause line lifted out of the flagship page into the kit |
| **G. Graph explorers** (37) | A&P: graphs; AP Calc AB: tangent-tracer, area-volume, limit-explorer, accumulation, riemann-sums, slope-fields, curve-analyzer, motion-lab, related-rates; AP Bio: chi-square, rates, confidence-intervals, descriptive-stats; AP Stats: chi-square-lab, ci-capture, data-explorer, regression-lab, sampling-distributions, distribution-areas, p-value-explorer; AP Precalc: exp-log-lab, function-lab, rate-of-change, regression-lab, sinusoid-builder, unit-circle, polar-graphs, poly-rational, vectors-matrices; AP Calc BC: integration-methods, parametric-motion, polar-lab, series-lab, taylor-lab, euler-logistic; AP Psych: stats-lab | **Desmos** (graphing calculator and Classroom activities: drag a point, the curve follows). Also GeoGebra; for statistics Seeing Theory (Brown), StatKey and the Art of Stat apps | `tabs`, `cue`, `tour`, `scrub`, `progress`, `readout` (one number on the picture), `challenges` | `K.handle`: a draggable point or line on the course plot layers (`calc-plot.js`, `pcalc-plot.js`, `stat-plot.js`, `psy-plot.js`) with the kit’s knob look, keyboard steps and a "before" ghost curve; forgiving math input (accept `x^2`, `x²`, spaces) for the two typing tools |
| **E. Econ graph shifters** (12) | AP Macro: forex-lab, ppc-trade, reserves-lab, adas-lab, graph-studio; AP Micro: elasticity-lab, cost-lab, externality-lab, factor-lab, firm-market, graph-studio, surplus-lab | **EconGraphs** (Chris Makler: grab a curve, areas and labels update). Also Marginal Revolution University practice, Desmos econ activities, and the AP exam’s own graph drawing in Bluebook | `tabs`, `cue`, `tour`, `readout`, `challenges`, `tries` | `K.curve` on `mac-graph.js` / `mic-graph.js`: grab and shift a named curve, the new equilibrium marked, the old one left as a ghost, shaded areas named in their own color. Build once in Macro, reuse in Micro (forked code) |
| **B. Builders and drawers** (8) | Ochem: resonance, arrow-pusher; AP Bio: tree-reading, graph-builder; AP Chem: particle-diagrams; AP Stats: probability-trees; AP Physics 1: free-body-diagrams; AP HuG: model-studio | **Mechanisms** (Alchemie: drag electrons, instant feedback) for arrows; **Ketcher**, MolView, ChemDoodle Sketcher and Marvin JS for drawing molecules; OrgChem101 Mastering the Arrows; PhET Build a Molecule and Forces and Motion; The Physics Classroom free-body interactive | `tap`, `cue`, `tour`, `challenges`, `tries`, `progress` | `K.draw`: draw from one thing to another (arrow, force vector, branch) with snapping, large forgiving targets, undo and feedback on the object; a small palette that sits on the picture |
| **X. Anatomy, 3D and map explorers** (9) | A&P: lab-practical, anatomy-3d; NREMT: body-map; Ochem: viewer-3d; AP Psych: brain-map; APES: cycles; AP Chem: periodic-trends-pes; AP HuG: scale-lab, map-reader | **Complete Anatomy** (3D4Medical: tap a part, a short card, isolate, quiz). Also Visible Body, BioDigital Human; MolView and Mol* for molecules; Ptable for the periodic table; BrainFacts 3D Brain; Seterra and Gapminder for maps | `tabs`, `tap`, `cue`, `tour`, `readout`, `challenges` | `K.spots`: named regions with a label card that opens on the picture (not in a side panel), a "find it" question mode, search by name, and camera presets for the 3D viewers (`assets/body3d/viewer.js`, `mol3d.js`) |
| **F. Step and flow builders** (7) | A&P: pathways, predict, feedback-loops; NREMT: flowcharts; Ochem: reagent-roadmap, synthesis; AP Macro: policy-chain | **Brilliant** (one step per screen, each step is an action, feedback at once). Also OrgChem101, Khan Academy ordering items, AHA algorithm cards for clinical flows | `timeline`, `order`, `progress`, `tap`, `drag`, `cue`, `challenges` | `K.steps`: empty slots and step cards placed by drag or tap, feedback per slot, the built chain kept on the picture; extends the kit’s `order` |
| **S. Sound and recognition trainers** (2) | NREMT: sound-trainer; Ochem: spectroscopy | **3M Littmann Learning** and **Easy Auscultation** (tap the chest, hear it, compare two sounds, then identify). For spectra: SDBS and ChemDoodle’s spectrum viewer | `tabs`, `tap`, `cue`, `tour`, `challenges` | `K.audio`: play and loop on the picture, a beat or wave strip that scrubs, A / B compare; for spectra the same "tap a feature, hear or see what it is" card as `K.spots` |
| **C. Calculators and drills** (8) | AP Chem: units-sig-figs; NREMT: reference-cards; AP Calc AB: rule-drills; APES: calculation-studio; A&P: calculators; AP Macro: indicators-lab; AP Precalc: symbolic-steps; AP Physics 1: scaling-drills | **Khan Academy** exercises (forgiving answer input, a hint ladder, one step shown at a time). Also Symbolab and WolframAlpha step by step; PhET Unit Rates; Desmos (MathQuill) input | `tabs`, `readout`, `cue`, `challenges`, `tries` | `K.setup`: factor tiles that snap into a chain with units striking through (Chem units and APES calculation studio already each have one: make it one); one forgiving number and unit input shared by every course |
| **M. Sorters and matchers** (6) | NREMT: mnemonics, formulary; Ochem: reaction-predictor, acid-base; A&P: word-roots; AP Micro: game-lab | **Duolingo** (tap to match, instant right or wrong on the item, short rounds). Also Quizlet Match, Anki | `tap`, `drag`, `cue`, `challenges` | `K.sort`: bins, ranks and pairs filled by drag or tap, feedback on the item, a free "try any pair" state so Explore is not graded |
| **N. Scenario simulators** (2) | NREMT: skillsheets, scenario-sim | **Full Code Medical Simulation** (a patient, live vitals, an action tray, a debrief). Also Body Interact; NREMT’s own clinical judgment item types | `timeline`, `readout`, `tap`, `challenges` | `K.case`: a patient scene with a vitals readout on it, an action tray, a running log and a debrief card. Fed by the existing scenario and station data |
| **R. Reading and evidence studios** (4) | AP Bio: design-drills; AP Psych: article-studio, evidence-builder; AP HuG: frq-coach | **AP Classroom** FRQ practice and **Albert.io** (passage on one side, one prompt at a time, rubric after a try). Also CommonLit annotation | `tabs`, `tap`, `challenges`, `tries` | `K.passage`: a passage with tappable highlights tied to parts; a Test yourself only frame if the owner agrees these have no Explore (question 4) |

Rule 10 in practice: each wave opens with one page of notes on the "study first" product for its group (what the
student touches first, how feedback shows, what input it forgives), saved under `docs/tools-v2-notes/`.

## 4. Every tool: its idea, its control, what is wrong, how big the job is

### Wrong on every tool today (not repeated in the tables)
Measured on the landing screen at 1440 x 900:
- **A side panel in Explore.** All 145 show the 360 px panel beside the stage. v2 Explore has none.
- **Words.** Median 55 words in the panel and 48 on the stage (limit: about 30 outside the picture).
  29 tools show more than 150 words.
- **Controls.** Median 16 controls visible, counting the frame bar and those on the picture (limit: about 3
  outside the picture). 75 tools keep at least one slider
  in the panel, away from the thing it changes; 24 of those also have a slider handle on the picture.
- **Purpose line.** The task is a question or sentence of up to 14 words, then one or two more sentences; v2 wants one line of
  about 8 words that says what to see.
- **Nothing from the kit yet:** no single cue on the first control, no 1 to 3 word labels attached to controls, no
  "before" ghost, no cause line, no takeaway, "?" opens a third column.
- **Mode names.** 98 tools already use Explore / Test yourself; 47 use other names or more than two modes.

Size: **restyle** = the control is already on the picture and there is one idea: move to the v2 frame (no panel,
labels, cue, takeaway). **rework** = the control has to move onto the picture, respond at once, or lessons have to
become tabs. **rebuild** = the interaction or the picture has to be thought out again.
Totals: restyle 44, rework 90, rebuild 10, in progress 1.

"Landing" column: words on stage / words in panel · controls visible · sliders on the picture + in the panel.

### NREMT

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| mnemonics (4) | M | What each letter of a mnemonic stands for | Next, then Fill the letters | A text card; nothing to change in the free view. No mode switch. | 109 / 29 · 9 · 0 + 0 | rebuild |
| body-map (12) | X | Where each structure is and what it does | Tap a part of the 3D body | Control is on the picture. Burns (Rule of Nines) is a second lesson behind a mode. Legend and picker text on the stage. Modes: 3D anatomy / Burns. | 156 / 33 · 11 · 0 + 0 | restyle |
| sound-trainer (15) | S | What each heart and lung sound is and where it is loudest | Tap a spot on the chest | Control is on the picture. Play sits in the side panel, away from the chest. | 31 / 28 · 23 · 0 + 0 | restyle |
| flowcharts (16) | F | The order of decisions in a protocol | Next part of the chart button | The free mode is reading a text chart; the doing is in Build it. Modes: Read / Build it / Drill me. | 109 / 25 · 12 · 0 + 0 | rework |
| skillsheets (22) | N | The steps of a skill station, in order, on the clock | Tick each step as you say it | Lands on ten station cards; no picture; a timed checklist. No mode switch. | 134 / 23 · 15 · 0 + 0 | rework |
| scenario-sim (23) | N | Each choice on a call changes the patient | Pick the next action | Lands on a list of call cards with no picture. No mode switch. | 159 / 17 · 12 · 0 + 0 | rework |
| reference-cards (44) | C | Normal vital signs change with age | Drag the age slider on the picture | Slider is on the picture. Four lessons behind tabs (Vitals, GCS, APGAR, Triangle); a type-in box under it. Modes: Vitals / GCS / APGAR / Triangle. | 31 / 20 · 14 · 1 + 0 | restyle |
| formulary (106) | M | When to give and when to withhold each EMT drug | Swipe or tap Give / Withhold | No free play: the landing is graded; stage is mostly empty. Modes: Give or withhold? / Question drill. | 39 / 23 · 9 · 0 + 0 | rework |

### Ochem

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| conformations (2) | P | Turning a bond changes the energy | Dihedral slider in the side panel | Slider is far from the Newman projection and the energy curve it moves; chairs are a second lesson behind a mode. Modes: Newman & torsion / Cyclohexane chairs. | 19 / 47 · 16 · 0 + 1 | rework |
| resonance (17) | B | Moving electrons gives another valid structure | Tap a lone pair or pi bond, then where it goes | Control is on the molecule. Landing is a task (find the forms), not free play; 26 controls. Modes: Find the forms / Compare two. | 51 / 35 · 26 · 0 + 0 | restyle |
| arrow-pusher (18) | B | Electrons move from a source to a sink | Tap a lone pair or bond, then where it goes | Control is on the molecule. 29 controls visible. Modes: Explore / Build / Challenge. | 42 / 32 · 29 · 0 + 0 | restyle |
| viewer-3d (19) | X | Electron groups set the shape and the bond angle | Drag to turn the molecule; tap an atom | Control is on the picture. Side panel text; Build your own behind a switch. Modes: Explore / Predict shape. | 48 / 30 · 15 · 0 + 0 | restyle |
| reaction-predictor (25) | M | Substrate, reagent and conditions decide SN1, SN2, E1 or E2 | Tap the path you think wins | Lands in Predict first (graded) before Explore; 37 controls; three dropdowns in the panel. Modes: Predict first / Explore. | 36 / 30 · 37 · 0 + 0 | rework |
| acid-base (30) | M | Which acid gives up its proton more easily, and why | Tap the stronger of two acids | No free play: the landing is a graded pick; two still structures. Modes: Compare two / Rank four / Which proton?. | 10 / 33 · 13 · 0 + 0 | rework |
| spectroscopy (43) | S | Each peak points to a functional group | Tap a peak on the spectrum | Control is on the picture. IR and NMR are two lessons behind a switch; Reference is a mode. Modes: Read a spectrum / Identify it / Reference. | 47 / 24 · 18 · 0 + 0 | restyle |
| reagent-roadmap (69) | F | Which reagents turn one functional group into another | Start and target dropdowns in the panel | 233 words in the side panel; the route picture cannot be touched. Modes: Route / Reagent / Groups / Puzzle. | 42 / 233 · 15 · 0 + 0 | rework |
| synthesis (103) | F | Build a route one reagent at a time | Pick a reagent card in the panel | No free play: the landing is a graded problem; 153 words on the stage. Modes: Forward / Backward. | 153 / 39 · 13 · 0 + 0 | rework |

### A&P

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| graphs (3) | G | How to read one physiology curve | Slider in the side panel (or drag on the graph) | 76 graphs; the panel slider repeats the on-graph drag; the picture is a bare chart. Modes: Explore / Quiz. | 496 / 35 · 11 · 0 + 1 | rework |
| pathways (6) | F | The order of the steps in a body pathway | Tap the steps in order, then Check order | No free play: all three modes are graded; 208 pathways; 1,186 words in the stage area. Modes: Order / Missing step / Spot the error. | 1186 / 46 · 20 · 0 + 0 | rebuild |
| lab-practical (7) | X | Naming structures on a real figure | Tap a label on the figure | Control is on the picture. 83 figures. Modes: Explore / Study / Quiz / Timed. | 343 / 20 · 28 · 0 + 0 | restyle |
| predict (8) | F | One change spreads through linked variables | Call each variable up, down or no change | No free play: the landing is a graded prediction; 377 scenarios; 2,308 words in the stage area. No mode switch. | 2308 / 39 · 16 · 0 + 0 | rebuild |
| feedback-loops (9) | F | A feedback loop pulls a variable back to its set point | Drag the marker off the set point | 49 loops; six boxes, a gauge and a scene compete; the Stimulus button repeats the drag. Modes: Watch it work / Test yourself. | 370 / 37 · 18 · 1 + 0 | rework |
| anatomy-3d (20) | X | Where each structure is in the body | Tap a part of the 3D body | Control is on the picture. The stage is empty while the model loads. Modes: Explore / Study / Quiz / Timed. | 5 / 26 · 12 · 0 + 0 | restyle |
| calculators (70) | C | How one formula in the body responds when an input changes | Three sliders in the side panel | 89 calculators in one tool; sliders are away from the picture they change. Modes: Calculate / Practice. | 470 / 39 · 14 · 0 + 3 | rework |
| word-roots (71) | M | Medical words are built from parts | Pick what each part means | The free mode (Decode) is a multiple choice quiz. Modes: Decode / Build / Part bank. | 7 / 36 · 12 · 0 + 0 | rework |

### AP Bio

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| osmosis (1) | P | Water moves toward the lower water potential | Beaker concentration slider in the panel | Slider in the panel; nothing moves until Play. Modes: Explore / Predict / Questions. | 33 / 73 · 18 · 0 + 1 | rework |
| water-potential (5) | P | Water moves from higher to lower water potential | Two sliders in the panel | Sliders in the panel. Same idea as Osmosis (the calculation version). Modes: Explore / Practice. | 47 / 59 · 15 · 0 + 2 | rework |
| simpson-diversity (11) | P | More species in more even numbers means more diversity | Tap the quadrat to plant a tree | Control is on the picture. Modes: Explore / Practice. | 26 / 45 · 16 · 0 + 0 | restyle |
| design-drills (13) | R | Naming the variables, controls and claims of an experiment | Tap an answer choice | No free play: a drill with Check on landing; 118 words in the panel. No mode switch. | 143 / 118 · 18 · 0 + 0 | rework |
| chi-square (24) | G | How far the observed counts are from the expected ones | Drag a bar | Control is on the picture. 110 words on the stage. Modes: Explore / Practice. | 110 / 52 · 15 · 3 + 0 | restyle |
| rates (26) | G | A rate is the slope between two points | Tap two points on the graph | Control is on the picture. Rate and percent change are two lessons. Modes: Explore / Practice. | 30 / 48 · 19 · 1 + 0 | restyle |
| enzyme-activity (27) | P | What limits how fast an enzyme works | Substrate slider in the panel | Three sliders in the panel; four variables on one screen. Modes: Explore / Predict / Questions. | 13 / 49 · 22 · 0 + 3 | rework |
| meiosis-nondisjunction (33) | P | Extra or missing chromosomes come from a failed separation | Next step button in the panel | Nothing to grab on the cell; the error is picked from a dropdown. Modes: Explore / Challenge / Questions. | 16 / 68 · 13 · 0 + 0 | rework |
| tree-reading (34) | B | Relatedness is read from the most recent common ancestor | Tap names on the tree | Control is on the picture. 27 controls; question buttons in the panel. Modes: Read a tree / Build a tree / Questions. | 23 / 46 · 27 · 0 + 0 | restyle |
| confidence-intervals (38) | G | Overlapping error bars mean the groups may not differ | Drag a bar | Control is on the picture. Two more sliders in the panel. Modes: Explore / Practice. | 19 / 59 · 19 · 4 + 2 | restyle |
| population-growth (39) | P | Limited resources slow growth near K | Play the years; r and K sliders in the panel | Nothing moves until Play; sliders in the panel. Same idea as the APES Population growth tool. Modes: Explore / Questions. | 27 / 69 · 19 · 0 + 2 | rework |
| descriptive-stats (45) | G | One point moves the mean more than the median | Drag a dot | Control is on the picture. Modes: Explore / Practice. | 34 / 49 · 18 · 7 + 0 | restyle |
| operons (46) | P | Sugar in the medium switches the genes on or off | Tap a sugar under the picture | Lac and trp are two lessons behind radio buttons; 74 words in the panel. Modes: Explore / Mutant quiz / Questions. | 32 / 74 · 17 · 0 + 0 | rework |
| graph-builder (47) | B | Turning a data table into a correct graph | Answer a step; the graph builds itself | The student never draws: a graded step list builds the graph; 68 words in the panel. Modes: Plot the data / Free plot. | 78 / 68 · 12 · 0 + 0 | rebuild |
| hardy-weinberg (48) | P | p and q set the genotype frequencies | Drag the corner of the square | Control is on the picture. A panel slider repeats it. Modes: Explore / Practice. | 34 / 46 · 12 · 1 + 1 | restyle |
| hardy-weinberg-drift (59) | P | Chance alone changes allele frequencies in a small population | Draw generations button | Nothing changes until the button is pressed; slider and dropdown in the panel; drift, selection and migration share one screen. Modes: Explore / Guess N / Questions. | 15 / 70 · 17 · 0 + 1 | rework |
| energy-flow (61) | P | About 10% of the energy passes up each level | Tap a level; a slider in the panel | Slider in the panel. Same idea as the APES Energy flow tool. Modes: Explore / Questions. | 21 / 53 · 17 · 0 + 1 | rework |
| cell-cycle-checkpoints (87) | P | Checkpoints stop damaged cells from dividing | Tap a checkpoint on the ring | Two sliders in the panel; 24 controls. Modes: Explore / Diagnose / Questions. | 22 / 54 · 24 · 0 + 2 | rework |
| signal-transduction-amplification (88) | P | One signal is amplified at every step | Play button; hormone slider in the panel | Nothing moves until Play; dense cascade with small labels. Modes: Explore / Questions. | 39 / 55 · 21 · 0 + 1 | rework |

### AP Chem

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| units-sig-figs (10) | C | Set up a calculation so the units cancel | Tap a quantity to place it | Control is on the picture. The landing is a task with Answer one for credit. Modes: Set it up / Test yourself. | 41 / 64 · 15 · 0 + 0 | restyle |
| particle-diagrams (37) | B | What a reaction looks like particle by particle | Tap or drag particles into the box | 12 controls in the panel (+/- per species); Check on landing; 82 words in the panel. Modes: Build it / Pick the picture. | 50 / 82 · 19 · 0 + 0 | rework |
| equilibrium-kinetics (58) | P | A stressed equilibrium shifts until Q = K again | Temperature slider in the panel | Two ideas in one tool (which way it shifts, how fast); slider and +/- buttons in the panel. | 28 / 54 · 16 · 0 + 1 | rework |
| titration-curve-reader (60) | P | The pH jumps at the equivalence point | NaOH volume slider in the panel | Slider in the panel (the burette is the natural control); flask, particle view and graph compete. | 83 / 47 · 14 · 0 + 1 | rework |
| periodic-trends-pes (64) | X | Coulomb’s law explains each periodic trend | Tap an element | Control is on the picture. 313 words on the stage; trends and PES are two lessons. | 313 / 45 · 104 · 0 + 0 | rework |
| ice-table-drills (72) | P | A reaction runs until Q = K | x slider in the panel | Slider in the panel; table, beaker and chart compete; the name says drills. | 87 / 57 · 13 · 0 + 1 | rework |
| buffer-drills (105) | P | A buffer soaks up added acid or base | Tap + OH⁻ or + H₃O⁺ in the panel | Buttons are in the panel, not on the beaker; the name says drills but it is a simulator. | 85 / 54 · 11 · 0 + 0 | rework |
| q-vs-k (107) | P | Compare Q with K to see which way it shifts | +/- particles in the panel, then Let it react | Controls in the panel; nothing happens until the button. Overlaps Equilibrium and ICE table. | 71 / 57 · 16 · 0 + 0 | rework |

### AP Physics 1

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| energy-bar-charts (62) | P | Energy changes form, the total stays | Start height slider in the panel; Play | Slider in the panel; nothing moves until Play; four scenes. | 55 / 37 · 18 · 0 + 1 | rework |
| fluids-tank (73) | P | An object floats when the buoyant force matches its weight | Drag the object into the fluid | Two dropdowns and two buttons in the panel; five scenes. | 39 / 59 · 13 · 0 + 0 | rework |
| free-body-diagrams (74) | B | Which forces act on an object, and whether they balance | A slider in the panel | The forces are already drawn: the student does not draw them in Explore. | 81 / 47 · 16 · 0 + 1 | rebuild |
| torque-balance (75) | P | Torque is force times distance from the pivot | Drag a mass along the stick | Control is on the picture. Needs Release; a second scene (inertia race). | 33 / 54 · 18 · 3 + 0 | restyle |
| collision-lab (77) | P | Momentum is conserved in every collision | Drag a cart; Crash button | Nothing happens until Crash; bounce slider in the panel. | 32 / 51 · 15 · 0 + 1 | rework |
| oscillator-lab (79) | P | Mass and stiffness set the period; amplitude does not | Mass slider in the panel; Play | 12 controls in the panel; nothing moves until Play; three systems. | 32 / 51 · 23 · 1 + 1 | rework |
| lab-design (89) | P | Plot the right quantities to get a straight line | Time slider in the panel; Take a reading | Slider and button in the panel; the graph is empty on landing. | 30 / 57 · 14 · 0 + 1 | rework |
| projectile-lab (90) | P | Horizontal and vertical motion are independent | Drag the barrel; Launch | Two panel sliders repeat the barrel; nothing moves until Launch; three sub-modes. | 24 / 51 · 20 · 2 + 2 | rework |
| motion-graphs (91) | P | The x, v and a graphs describe one motion | Drag the cart | Control is on the picture. Graphs are empty until the cart moves; three sub-modes. | 61 / 37 · 15 · 2 + 0 | restyle |
| rotation-lab (92) | P | How mass is spread decides the rolling race | Race button | Nothing to change, only Race; three unrelated scenes (race, stool, orbit). | 13 / 41 · 13 · 0 + 0 | rebuild |
| scaling-drills (108) | C | How one quantity scales when another changes | Three sliders in the panel | 31 formulas; 247 words on the stage; sliders in the panel. | 247 / 62 · 19 · 0 + 3 | rework |

### AP Calc AB

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| tangent-tracer (14) | G | The secant becomes the tangent as h goes to 0 | Drag P on the curve; h slider in the panel | H (the idea) is a slider in the panel; 91 words on the stage. | 91 / 63 · 15 · 2 + 1 | rework |
| area-volume (35) | G | A slice adds up to an area or a volume | Drag the slice | Control is on the picture. Three lessons (Area, Revolve, Cross sections). | 52 / 56 · 15 · 1 + 0 | restyle |
| limit-explorer (40) | G | The value f(x) approaches | Zoom slider in the panel | Slider in the panel, not on the graph; Play beside it. | 34 / 46 · 13 · 0 + 1 | rework |
| rule-drills (49) | C | Which derivative rule comes first | Type a function | Typing, not manipulating; 106 words on the stage; the free mode is called Rule picker. Modes: Rule picker / Test yourself. | 106 / 78 · 13 · 0 + 0 | rework |
| accumulation (63) | G | g(x) is the area under f so far | Drag x along the axis | Control is on the picture. A panel slider repeats it; 91 words on the stage; two sub-modes. | 91 / 53 · 16 · 1 + 1 | restyle |
| riemann-sums (76) | G | More strips close in on the area | n slider in the panel | Slider in the panel; four kinds of sum on a switch. | 64 / 57 · 17 · 0 + 1 | rework |
| slope-fields (78) | G | The field picks out one solution | Drag the starting point | Control is on the picture. | 42 / 50 · 12 · 1 + 0 | restyle |
| curve-analyzer (93) | G | f′ and f″ shape the graph of f | Drag across the graphs | Cursor slider in the panel; Curves and Optimize are two lessons; 18 controls. | 60 / 58 · 18 · 1 + 1 | rework |
| motion-lab (94) | G | x, v and a describe one particle | Play, or drag across the graphs | Time slider in the panel; two rows of sub-switches. | 64 / 62 · 17 · 1 + 1 | rework |
| related-rates (95) | G | Linked quantities have linked rates | Drag the moving part of the scene | Control is on the picture. A panel slider and Play. | 67 / 54 · 15 · 1 + 1 | restyle |

### AP Calc BC

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| integration-methods (109) | G | How each method breaks an integral down | Drag the bound b | Three lessons (Parts, Partial fractions, Improper); slider in the panel. | 69 / 55 · 16 · 1 + 1 | rework |
| parametric-motion (110) | G | x(t) and y(t) move the particle | Drag the particle; Play | Control is on the picture. Time slider in the panel; three overlays. | 51 / 47 · 15 · 1 + 1 | restyle |
| polar-lab (111) | G | Sweeping θ builds the area | Drag around the curve; Play | Control is on the picture. θ slider in the panel; two rows of sub-switches. | 46 / 47 · 16 · 1 + 1 | restyle |
| series-lab (112) | G | Partial sums settle, or they do not | Terms slider in the panel | Slider in the panel; 130 words on the stage; number and power series are two lessons. | 130 / 65 · 15 · 0 + 1 | rework |
| taylor-lab (113) | G | More terms fit farther from the center | Degree slider in the panel; drag the center | Degree (the idea) is a slider in the panel. | 53 / 52 · 17 · 2 + 1 | rework |
| euler-logistic (125) | G | Smaller Euler steps get closer to the true curve | Drag the starting point; pick the number of steps | Control is on the picture. Euler and logistic growth are two lessons. | 54 / 52 · 17 · 1 + 0 | restyle |

### AP Precalc

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| exp-log-lab (85) | G | Exponentials multiply by a factor; lines add an amount | Two sliders in the panel | Four lessons (Ratios, Inverse, Rules, Semi-log); sliders in the panel. | 63 / 64 · 18 · 0 + 2 | rework |
| symbolic-steps (104) | C | Is the rewrite equal to the original | Type two expressions | Typing, not manipulating; the free mode is called Is it the same?. Modes: Is it the same? / Test yourself. | 23 / 79 · 14 · 0 + 0 | rework |
| function-lab (117) | G | What a, b, h and k do to a graph | Drag the handle on the graph | Control is on the picture. A panel slider repeats it. | 45 / 66 · 20 · 2 + 1 | restyle |
| rate-of-change (118) | G | Secant slopes show concavity | Drag a point on the curve | Control is on the picture. Width slider in the panel. | 74 / 59 · 18 · 1 + 1 | restyle |
| regression-lab (119) | G | The residuals tell you whether a model fits | Tap a model in the panel | Model chips and the prediction slider are in the panel. | 43 / 69 · 18 · 1 + 1 | rework |
| sinusoid-builder (120) | G | Amplitude, midline, period and shift fit a sinusoid to points | Drag a handle on the graph; a slider in the panel | 20 controls; the panel slider repeats the handle. | 56 / 72 · 20 · 3 + 1 | rework |
| unit-circle (121) | G | Sine and cosine come from the circle | Drag P around the circle | Control is on the picture. A panel slider repeats it. | 42 / 70 · 15 · 1 + 1 | restyle |
| polar-graphs (127) | G | r changes as θ turns | Play; θ slider in the panel | Slider in the panel; 20 controls. | 45 / 64 · 20 · 1 + 1 | rework |
| poly-rational (128) | G | Each factor makes a zero, a hole or an asymptote | Drag a pin along the x-axis | Control is on the picture. | 81 / 77 · 15 · 3 + 0 | restyle |
| vectors-matrices (129) | G | Parameters and matrices move points | Play; t slider in the panel | Three lessons (Motion, Vectors, Matrices); 25 controls; marked beyond the exam. | 32 / 68 · 25 · 1 + 1 | rework |

### AP Stats

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| sampling-lab (36) | P | Each sampling method picks its sample differently | Pick a method; Draw a sample | Dense scene (100 houses, 150 words); 12 controls in the panel. | 150 / 54 · 20 · 0 + 1 | rework |
| probability-trees (50) | B | A tree, a table and a Venn diagram show the same events | Tap a branch, a cell or a region | Four pictures at once; 33 controls; 142 words on the stage; three sliders in the panel. | 142 / 75 · 33 · 0 + 3 | rebuild |
| chi-square-lab (52) | G | Which cells drive χ² | Tap a cell, then change its count | 30 controls; 118 words on the stage; the count slider is in the panel. | 118 / 78 · 30 · 0 + 1 | rework |
| ci-capture (53) | G | About C% of intervals capture the true value | Build 100 intervals button | Button driven by nature (sampling). Level and n controls in the panel. | 70 / 65 · 18 · 0 + 1 | restyle |
| data-explorer (54) | G | The mean follows an outlier; the median resists | Drag a dot | Control is on the picture. Three plots at once. | 48 / 54 · 34 · 20 + 1 | restyle |
| regression-lab (55) | G | One point moves the line and r | Drag a point | Control is on the picture. 27 controls. | 56 / 65 · 27 · 12 + 1 | restyle |
| sampling-distributions (56) | G | A statistic varies from sample to sample | Take 1 sample button | 13 controls in the panel; three stacked plots. | 54 / 59 · 20 · 0 + 1 | rework |
| distribution-areas (81) | G | Probability is the shaded area | Drag the boundary | Control is on the picture. Normal and Binomial are two lessons. | 60 / 58 · 17 · 1 + 0 | restyle |
| p-value-explorer (82) | G | A p-value is a tail area | Drag the observed result | Control is on the picture. A panel slider repeats it; Errors and power is a second lesson. | 73 / 68 · 18 · 1 + 1 | restyle |
| design-randomizer (100) | P | Random assignment balances the groups | Randomize and run button | Button driven by nature. Good scene; four designs on chips in the panel. | 36 / 46 · 15 · 0 + 0 | restyle |

### APES

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| energy-flow (21) | P | About 10% of the energy passes up each level | Tap a level; GPP slider in the panel | Slider in the panel; 22 controls; four views. | 70 / 56 · 22 · 0 + 1 | rework |
| cycles (31) | X | An element moves between reservoirs | Tap a dot on an arrow | Control is on the picture. Four cycles as chips in the panel; 106 words on the stage. | 106 / 57 · 22 · 0 + 0 | restyle |
| earth-climate (32) | P | Tilt causes the seasons | Date slider in the panel | Four lessons (Seasons, Winds, Rain shadow, El Niño); two sliders in the panel. | 25 / 58 · 18 · 0 + 2 | rework |
| climate-change (41) | P | Greenhouse gases trap heat | CO₂ slider in the panel | Four lessons (Greenhouse, Ozone layer, Ocean pH, Sea level); slider in the panel. | 10 / 70 · 16 · 0 + 1 | rework |
| population-growth (42) | P | A population grows toward what its habitat can hold | Play; growth rate slider in the panel | Nothing moves until Play; the picture is a bare graph with a small inset; three views. | 41 / 70 · 17 · 0 + 1 | rework |
| water-pollution (51) | P | Fertilizer runoff leads, step by step, to a dead zone | On the picture (v2) | Flagship: being rebuilt on branch claude/tools-v2-water-pollution. | 47 / 60 · 19 · 0 + 2 | in progress |
| soil-texture (57) | P | Sand, silt and clay name a soil | Drag the point on the triangle | Three panel sliders move each other and the point (breaks one control never moves another). | 87 / 61 · 19 · 0 + 3 | rework |
| age-structure (65) | P | Births and deaths shape the age pyramid | Fertility slider and stage chips in the panel | Slider in the panel. Same idea as the Human Geography Population lab. | 54 / 63 · 15 · 0 + 1 | rework |
| dose-response (66) | P | LD50 is the dose where half die | Drag along the curve | Three lessons (Dose, Food chain, One fish); a panel slider repeats the drag. | 49 / 61 · 18 · 0 + 1 | rework |
| energy-chain (67) | P | Energy is lost at every conversion step | Pick a source; tap a step | Control is on the picture. Compare is a second view. | 36 / 61 · 15 · 0 + 0 | restyle |
| calculation-studio (68) | C | Cancel units to set up a calculation | Tap a factor | Control is on the picture. Overlaps Chem Units and sig figs. | 65 / 39 · 12 · 0 + 0 | restyle |
| air-pollution (83) | P | Smog builds through the day | Drag the clock across the picture | Two lessons (Smog day, Acid rain); a panel slider repeats the drag. | 21 / 72 · 15 · 0 + 1 | rework |

### AP Psych

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| brain-map (28) | X | What each part of the brain does | Tap a region | Control is on the picture. Two rows of sub-switches (Map / Split brain, Outside / Inside). | 14 / 64 · 20 · 0 + 0 | restyle |
| neuron (29) | P | A neuron fires only past threshold | Stimulus slider and Stimulate in the panel | Slider and button in the panel; Fire and Synapse are two lessons. | 29 / 54 · 19 · 0 + 1 | rework |
| development (80) | P | The stages of development across a life | Drag the age marker | Control is on the picture. A panel slider repeats it; four theory lanes at once. | 30 / 46 · 17 · 0 + 1 | restyle |
| article-studio (84) | R | The parts of a research study | Tap a part, A to F | No free play: Explore lands on a scored part; 340 words on the stage, 97 in the panel. | 340 / 97 · 25 · 0 + 0 | rebuild |
| conditioning-lab (97) | P | Pairing a tone with food makes the tone a signal | Tone + food button in the panel | Buttons in the panel, not on the scene; three lessons (Classical, Schedules, Consequences). | 14 / 57 · 15 · 0 + 0 | rework |
| evidence-builder (98) | R | Back a claim with evidence from two sources | Pick a claim | No free play: Explore is the scored task; 156 words on the stage, 114 in the panel. | 156 / 114 · 24 · 0 + 0 | rebuild |
| memory-lab (99) | P | Where a word sits in a list changes recall | Start, then type what you recall | Three lessons; lands on Ready? and an empty chart. | 45 / 56 · 15 · 0 + 0 | rework |
| sensation (122) | P | Your criterion sets your hits and false alarms | Criterion slider in the panel | Four lessons (Detect, Weber, Color, Perceive); the slider repeats a handle on the curve. | 29 / 60 · 17 · 0 + 1 | rework |
| social-influence (123) | P | The situation changes what people do | People slider in the panel | Four lessons (Conformity, Obedience, Bystanders, Groups); slider in the panel. | 56 / 66 · 18 · 0 + 1 | rework |
| stats-lab (124) | G | Where a score sits on the normal curve | Drag the score along the curve | Control is on the picture. Three lessons (Curve, Center, Correlation); 23 controls. | 62 / 66 · 23 · 1 + 1 | restyle |

### AP Macro

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| forex-lab (96) | E | When one currency rises, the other falls | Pick what changes from a dropdown | A dropdown, not the curve; 179 words on the stage. | 179 / 35 · 12 · 0 + 0 | rework |
| indicators-lab (101) | C | What counts in GDP, and what does not | Next transaction button | Four lessons (GDP, Prices, Real, Jobs); a stepper, nothing to drag. | 45 / 56 · 14 · 0 + 0 | rework |
| ppc-trade (102) | E | Each extra unit costs more along the PPC | Robots slider in the panel | Slider in the panel (the point on the curve is the natural control); PPC and Trade are two lessons. | 14 / 70 · 18 · 0 + 1 | rework |
| policy-chain (115) | F | Each link in a policy chain causes the next | Next link button | A stepper in the panel; two rows of switches; small graph. | 44 / 57 · 16 · 0 + 0 | rework |
| reserves-lab (116) | E | Fed tools set the policy rate | Tap a tool, then raise or lower | 10 buttons in the panel. Overlaps Policy chain. | 20 / 55 · 18 · 0 + 0 | rework |
| adas-lab (126) | E | A shock moves AD or SRAS, then the economy corrects itself | Pick a shock from a dropdown | The student does not move a curve; 123 words on the stage; two graphs. | 123 / 51 · 13 · 0 + 0 | rework |
| multiplier-lab (132) | P | Each round of spending is spent again | Tap an MPC | Three lessons; 83 words and 12 controls in the panel. | 44 / 83 · 19 · 0 + 1 | rework |
| graph-studio (134) | E | Each event shifts one curve | Pick an event, then drag the curve | 126 words in the panel; a dropdown and Show me come before the graph. | 23 / 126 · 14 · 0 + 0 | rework |

### AP Micro

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| elasticity-lab (135) | E | Elasticity decides whether a price cut raises revenue | Drag point A on the demand curve | Control is on the picture. A panel slider repeats it; three kinds. | 67 / 52 · 14 · 0 + 1 | restyle |
| game-lab (136) | M | A Nash equilibrium: no one gains by switching alone | Tap a cell of the matrix | Control is on the picture. A bare matrix. | 58 / 31 · 15 · 0 + 0 | restyle |
| cost-lab (140) | E | MC crosses AVC and ATC at their lowest points | Hire worker button | A stepper; curves are faint until built. | 80 / 50 · 11 · 0 + 0 | rework |
| externality-lab (141) | E | A tax or subsidy moves the market to the efficient quantity | Tax slider in the panel | Slider in the panel; Public goods is a second lesson. | 32 / 48 · 17 · 0 + 1 | rework |
| factor-lab (142) | E | A firm hires until MRP = MRC | Two sliders in the panel | Sliders in the panel; graph or table, competitive or monopsony. | 26 / 47 · 18 · 0 + 2 | rework |
| firm-market (143) | E | Entry and exit erase profit in the long run | Choose a change dropdown | A dropdown in the panel; nothing to grab on the graphs; 70 words in the panel. | 43 / 70 · 12 · 0 + 0 | rework |
| graph-studio (144) | E | Each event shifts one curve | Pick an event, then act on the graph | 106 words in the panel; a dropdown and Show me come before the graph. | 31 / 106 · 14 · 0 + 0 | rework |
| surplus-lab (145) | E | A tax, price control or tariff changes surplus and leaves a deadweight loss | Tax slider in the panel | Slider in the panel; the shading is good. | 50 / 42 · 16 · 0 + 1 | rework |

### AP HuG

| Tool (use rank) | Grp | One idea | Main control today | Wrong today | Landing | Size |
|---|---|---|---|---|---|---|
| scale-lab (86) | X | The scale of analysis changes what the data show | Scale chips in the panel | Chips in the panel; the map fills a third of the stage; two lessons. | 68 / 50 · 14 · 0 + 0 | rework |
| population-lab (114) | P | Birth and death rates reshape the pyramid | Stage chips and a fertility slider in the panel | Slider in the panel. Same idea as the APES Age structure tool. | 75 / 52 · 16 · 0 + 1 | rework |
| diffusion-lab (130) | P | How a trait spreads out from its hearth | Play; type dropdown in the panel | Nothing moves until Play; dropdown and step slider in the panel. | 18 / 48 · 14 · 0 + 1 | rework |
| model-studio (131) | B | Where each part of a model goes | A stepper: Start: the first stage | See it is a stepper; the real building (Build it) is the second switch. | 89 / 80 · 14 · 0 + 0 | rework |
| map-reader (133) | X | What a kind of map shows, and what it hides | Step chips in the panel (Legend, Pattern, Limit) | The map itself is barely interactive; chips in the panel. | 44 / 36 · 15 · 0 + 0 | rework |
| borders-lab (137) | P | Whether a border came before or after the people | Play the years | Slider, dropdown and Play are all in the panel; the picture is mostly empty. | 23 / 66 · 14 · 0 + 1 | rework |
| city-lab (138) | P | Bid rent sets the land-use rings | Transport cost slider in the panel | Slider in the panel; 73 words in the panel. | 62 / 73 · 19 · 0 + 2 | rework |
| frq-coach (139) | R | What each task verb asks you to write | Write an answer | No free play: reading and writing; 160 words on the stage, 95 in the panel. | 160 / 95 · 19 · 0 + 0 | rebuild |

## 5. Proposed order

Rules used: (1) the nine waves that each pioneer a group go first, most opened first, so every shared piece is built
once, on the tools people open most (wave order checked by 30 day opens); (2) then the rest, course by course, most opened first, each reusing a piece that
exists by then; (3) waves of 4 to 8 tools; (4) inside a wave, do the most opened tool first as that group's pattern,
check it against the eleven rules, then the others.

| Wave | What | Group | Tools (use rank) | 30 d opens | Restyle / rework / rebuild | New shared piece, notes |
|---|---|---|---|---|---|---|
| 0 | Flagship | P | APES water-pollution (51) | 8 | in progress | The kit itself. Merge first. |
| 1 | Parameter simulators on a second course (AP Bio, with the APES twin) | P | AP Bio osmosis (1), AP Bio water-potential (5), AP Bio simpson-diversity (11), APES energy-flow (21), AP Bio enzyme-activity (27), AP Bio hardy-weinberg (48), AP Bio energy-flow (61) | 162 | 2 / 5 / 0 | Kit adapter in `bio-tools.js`; ghost and cause line into the kit. Decide the Osmosis / Water potential and the two Energy flow merges first (question 2) |
| 2 | Explorers: anatomy, 3D, molecules | X | Ochem conformations (2), A&P lab-practical (7), NREMT body-map (12), Ochem viewer-3d (19), A&P anatomy-3d (20), AP Psych brain-map (28), APES cycles (31) | 165 | 6 / 1 / 0 | `K.spots`; camera presets for both 3D viewers. Conformations (group P) rides along because it shares the molecule viewer and is the second most opened tool |
| 3 | Step and flow builders | F | A&P pathways (6), A&P predict (8), A&P feedback-loops (9), NREMT flowcharts (16), Ochem reagent-roadmap (69), Ochem synthesis (103), AP Macro policy-chain (115) | 137 | 0 / 5 / 2 | `K.steps`. Holds two of the ten rebuilds (pathways, predict): needs the answer to question 4 (can a tool be Test yourself only) and question 5 (big item banks) |
| 4 | Graph explorers | G | A&P graphs (3), AP Calc AB tangent-tracer (14), AP Bio chi-square (24), AP Bio rates (26), AP Calc AB area-volume (35), AP Bio confidence-intervals (38), AP Calc AB limit-explorer (40), AP Bio descriptive-stats (45) | 131 | 5 / 3 / 0 | `K.handle` on the plot layers, first in `calc-plot.js` and the AP Bio skill stage |
| 5 | Builders and drawers | B | Ochem resonance (17), Ochem arrow-pusher (18), AP Bio tree-reading (34), AP Chem particle-diagrams (37), AP Bio graph-builder (47), AP Stats probability-trees (50), AP Physics 1 free-body-diagrams (74), AP HuG model-studio (131) | 82 | 3 / 2 / 3 | `K.draw`. Three rebuilds (graph builder, free-body diagrams, probability trees) |
| 6 | Sorters and matchers | M | NREMT mnemonics (4), Ochem reaction-predictor (25), Ochem acid-base (30), A&P word-roots (71), NREMT formulary (106), AP Micro game-lab (136) | 81 | 1 / 4 / 1 | `K.sort`. Mnemonics is the fourth most opened page and a rebuild |
| 7 | Calculators and drills | C | AP Chem units-sig-figs (10), NREMT reference-cards (44), AP Calc AB rule-drills (49), APES calculation-studio (68), A&P calculators (70), AP Macro indicators-lab (101), AP Precalc symbolic-steps (104), AP Physics 1 scaling-drills (108) | 73 | 3 / 5 / 0 | `K.setup`, the shared forgiving input |
| 8 | Sound trainers and scenario simulators (two small groups) | S, N | NREMT sound-trainer (15), NREMT skillsheets (22), NREMT scenario-sim (23), Ochem spectroscopy (43) | 60 | 2 / 2 / 0 | `K.audio`, `K.case`. With waves 2, 3, 6 and 7 this finishes NREMT |
| 9 | Reading and evidence studios | R | AP Bio design-drills (13), AP Psych article-studio (84), AP Psych evidence-builder (98), AP HuG frq-coach (139) | 33 | 0 / 1 / 3 | `K.passage`. Only after question 4: these may not be "tools" under v2 |
| 10 | APES, the rest | P | APES earth-climate (32), APES climate-change (41), APES population-growth (42), APES soil-texture (57), APES age-structure (65), APES dose-response (66), APES energy-chain (67), APES air-pollution (83) | 64 | 1 / 7 / 0 | No new piece (same layer as the flagship). Cheapest wave per tool |
| 11 | AP Bio, the rest | P | AP Bio meiosis-nondisjunction (33), AP Bio population-growth (39), AP Bio operons (46), AP Bio hardy-weinberg-drift (59), AP Bio cell-cycle-checkpoints (87), AP Bio signal-transduction-amplification (88) | 44 | 0 / 6 / 0 | No new piece |
| 12 | AP Chem | P, X | AP Chem equilibrium-kinetics (58), AP Chem titration-curve-reader (60), AP Chem periodic-trends-pes (64), AP Chem ice-table-drills (72), AP Chem buffer-drills (105), AP Chem q-vs-k (107) | 36 | 0 / 6 / 0 | Adapter in `chem-tools.js`; decide the equilibrium merge first (question 2) |
| 13 | AP Stats, first half | G | AP Stats chi-square-lab (52), AP Stats data-explorer (54), AP Stats regression-lab (55), AP Stats distribution-areas (81), AP Stats p-value-explorer (82) | 36 | 4 / 1 / 0 | `K.handle` on `stat-plot.js` |
| 14 | AP Psych | P | AP Psych neuron (29), AP Psych development (80), AP Psych conditioning-lab (97), AP Psych memory-lab (99), AP Psych sensation (122), AP Psych social-influence (123) | 36 | 1 / 5 / 0 | Adapter in `psy-tools.js`; four tools hold 3 or 4 lessons each (question 3) |
| 15 | AP Stats, second half, and Psych stats | G, P | AP Stats sampling-lab (36), AP Stats ci-capture (53), AP Stats sampling-distributions (56), AP Stats design-randomizer (100), AP Psych stats-lab (124) | 35 | 3 / 2 / 0 | A "take a sample" button pattern (button driven on purpose) |
| 16 | AP Calc AB, the rest | G | AP Calc AB accumulation (63), AP Calc AB riemann-sums (76), AP Calc AB slope-fields (78), AP Calc AB curve-analyzer (93), AP Calc AB motion-lab (94), AP Calc AB related-rates (95) | 34 | 3 / 3 / 0 | No new piece. AB build must stay byte-identical for BC |
| 17 | AP Physics 1, first half | P | AP Physics 1 energy-bar-charts (62), AP Physics 1 fluids-tank (73), AP Physics 1 torque-balance (75), AP Physics 1 collision-lab (77), AP Physics 1 oscillator-lab (79) | 31 | 1 / 4 / 0 | Adapter in `phys-tools.js` |
| 18 | AP Calc BC | G | AP Calc BC integration-methods (109), AP Calc BC parametric-motion (110), AP Calc BC polar-lab (111), AP Calc BC series-lab (112), AP Calc BC taylor-lab (113), AP Calc BC euler-logistic (125) | 23 | 3 / 3 / 0 | No new piece |
| 19 | Econ graph shifters, Macro | E | AP Macro forex-lab (96), AP Macro ppc-trade (102), AP Macro reserves-lab (116), AP Macro adas-lab (126), AP Macro multiplier-lab (132), AP Macro graph-studio (134) | 22 | 0 / 6 / 0 | `K.curve` on `mac-graph.js` |
| 20 | AP Precalc, first half | G | AP Precalc exp-log-lab (85), AP Precalc function-lab (117), AP Precalc rate-of-change (118), AP Precalc regression-lab (119), AP Precalc sinusoid-builder (120) | 22 | 2 / 3 / 0 | `K.handle` on `pcalc-plot.js` |
| 21 | AP Physics 1, second half | P | AP Physics 1 lab-design (89), AP Physics 1 projectile-lab (90), AP Physics 1 motion-graphs (91), AP Physics 1 rotation-lab (92) | 20 | 1 / 2 / 1 | One rebuild (rotation lab) |
| 22 | AP Human Geography | P, X | AP HuG scale-lab (86), AP HuG population-lab (114), AP HuG diffusion-lab (130), AP HuG map-reader (133), AP HuG borders-lab (137), AP HuG city-lab (138) | 17 | 0 / 6 / 0 | Adapter in `hug-tools.js`; `K.spots` on `hug-map.js` |
| 23 | AP Precalc, second half | G | AP Precalc unit-circle (121), AP Precalc polar-graphs (127), AP Precalc poly-rational (128), AP Precalc vectors-matrices (129) | 13 | 2 / 2 / 0 | No new piece |
| 24 | Econ graph shifters, Micro | E | AP Micro elasticity-lab (135), AP Micro cost-lab (140), AP Micro externality-lab (141), AP Micro factor-lab (142), AP Micro firm-market (143), AP Micro graph-studio (144), AP Micro surplus-lab (145) | 8 | 1 / 6 / 0 | `K.curve` carried to `mic-graph.js`. Macro build must stay byte-identical |

Waves 1 to 9 cover 59 tools and 67% of the corrected opens of the last 30 days; 14 of the 15 most opened tools are in waves 1 to 8 (AP Bio design-drills waits in wave 9 for question 4).
Ranks 15 and 16 (NREMT sound-trainer and flowcharts) are tied. Waves 1 and 2 are tied on opens; the simulators go first because they reuse the flagship as it is.
The ten rebuilds: NREMT mnemonics, A&P pathways, A&P predict, AP Bio graph-builder, AP Stats probability-trees, AP Physics 1 free-body-diagrams, AP Psych article-studio, AP Physics 1 rotation-lab, AP Psych evidence-builder, AP HuG frq-coach.

### Might be merged (questions, not decisions: see question 2)
| Candidates | Why |
|---|---|
| AP Bio osmosis + water-potential | The same idea (water moves to lower water potential); one is the picture, one the calculation. Ranks 1 and 5 |
| AP Bio energy-flow and APES energy-flow | The same 10% pyramid in two course layers; could share one scene |
| AP Bio population-growth and APES population-growth | The same logistic curve |
| APES age-structure and AP HuG population-lab | The same pyramid and transition chart, almost the same screen |
| AP Chem q-vs-k + ice-table-drills (+ the equilibrium half of equilibrium-kinetics) | Three tools on "the reaction runs until Q = K" |
| AP Macro reserves-lab + policy-chain | Both walk a Fed action through the reserve market |
| AP Macro graph-studio and AP Micro graph-studio | The same tool with a different graph list (forked code) |
| AP Chem units-sig-figs and APES calculation-studio | The same unit cancelling chain, built twice |
| NREMT mnemonics + reference-cards | Both are recall cards; small scripts |

### Might be split (see question 3)
Tools that hold more than one lesson behind a switch; v2 allows one main idea per screen, as tabs on the stage.
| Lessons | Tools |
|---|---|
| 4 | APES climate-change (Greenhouse, Ozone layer, Ocean pH, Sea level), APES earth-climate (Seasons, Winds, Rain shadow, El Niño), AP Psych sensation (Detect, Weber, Color, Perceive), AP Psych social-influence (Conformity, Obedience, Bystanders, Groups), AP Precalc exp-log-lab (Ratios, Inverse, Rules, Semi-log), AP Macro indicators-lab (GDP, Prices, Real, Jobs), NREMT reference-cards (Vitals, GCS, APGAR, Triangle) |
| 3 | APES dose-response, AP Psych conditioning-lab, memory-lab and stats-lab, AP Macro multiplier-lab, AP Precalc vectors-matrices, AP Calc AB area-volume, AP Calc BC integration-methods, AP Physics rotation-lab (race, stool, orbit), AP Bio hardy-weinberg-drift (drift, selection, migration) |
| 2 | NREMT body-map (3D anatomy, Burns), Ochem conformations (Newman, chairs) and spectroscopy (IR, NMR), AP Bio operons (lac, trp) and rates, AP Chem equilibrium-kinetics and periodic-trends-pes, APES air-pollution, AP Psych neuron, AP Macro ppc-trade, AP Micro externality-lab, AP Calc AB curve-analyzer, AP Calc BC euler-logistic and series-lab, AP Stats distribution-areas and p-value-explorer, AP HuG scale-lab |
| many items, one screen | A&P calculators (89), graphs (76), lab-practical (83), feedback-loops (49), pathways (208), predict (377); AP Physics scaling-drills (31): see question 5 |

### Might be retired or moved out of "tools" (see question 4)
Listed for the owner to decide; nothing here is decided.
- No free play is possible today (the landing is graded or is reading): AP Bio design-drills, AP Psych
  article-studio and evidence-builder, AP HuG frq-coach, A&P pathways and predict, Ochem synthesis and acid-base,
  NREMT formulary. They could become Test yourself only tools, move to the practice or FRQ sections, or get a real
  Explore built.
- Reference pages more than tools: NREMT mnemonics, reference-cards and formulary (cards to read).
- Typing tools with no picture to manipulate: AP Calc AB rule-drills, AP Precalc symbolic-steps.
- Marked "beyond the exam": AP Precalc vectors-matrices.

## 6. Open questions for the owner
1. **137 or 145?** The 8 NREMT tools are outside the 137 `tools/` pages. This plan includes them (4 of the 16 most
   opened are NREMT). OK?
2. **Merges.** For each pair in the merge table: one tool, or keep both and share the scene? The first one (Osmosis
   and Water potential) blocks wave 1.
3. **Splits.** When a tool holds 3 or 4 lessons, are tabs on the stage enough (as in the flagship's three chapters),
   or should a lesson get its own page past some number? Is there a largest number of tabs?
4. **Tools with no free play.** May a tool be Test yourself only, or must every tool have an Explore? If not, do the
   nine listed above move out of "tools" (to practice or FRQ) or get an Explore designed?
5. **Big item banks.** A&P tools hold 49 to 377 items each behind a picker. Is a picker allowed on a v2 Explore
   screen (it is a control outside the picture), and should Explore show a short curated set with the full bank in
   Test yourself?
6. **Order.** This plan goes by opens, which favors the older courses (AP Bio, A&P, Ochem, NREMT). Alternatives:
   the rest of APES next (cheapest: same code layer as the flagship, wave 10 here), or the AP courses with Premium on
   sale first, or free tools first (56 of 145: what a visitor sees before paying). Which?
7. **Measure real use.** ANSWERED 2026-11-17: yes, built (docs/analytics-plan.md, "Tool use"). Was: May a `tool-use` event be added (tool, first touch, mode, seconds band; no identity) so
   later waves are ordered by use and each rebuilt tool can be compared before and after? Today only page opens exist.
8. **Body map.** It was "framed only" in round F2 as the owner's favorite. Does v2 change it (wave 2), or is it left
   alone apart from the frame?
9. **Review.** Per wave, does the owner approve the first tool of each new group (nine approvals) before the rest of
   that wave is built, or only see finished waves?
10. **Old tools during the rollout.** Tools in later waves keep today's frame for weeks. OK that the site shows both
    looks meanwhile?

## Left out of this plan
- Phone (390) was not measured here; the frame round checked it and the flagship brief has the phone rules.
- No tool was opened past its landing screen: sizes are estimates from the landing, the code layout and the frame
  notes (`docs/tools-frame-notes/`), to be confirmed by the "list everything it can do" step of each wave.
- Screenshots are not committed (145 files); `scripts` to remake them are not part of the repo either. To remake:
  serve the repo, open each page at 1440 x 900 with service workers blocked, outside hosts aborted and
  `function has(course) {` in `assets/premium.js` answered `true`.
