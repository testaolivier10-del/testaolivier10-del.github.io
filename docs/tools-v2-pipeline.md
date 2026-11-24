# Tools v2 pipeline status

Where every tool in the rebuild stands, so a fresh session (or the hourly check) can continue without the chat.
Rules and process: `docs/tools-v2-standard.md`, `docs/tools-v2-builder-brief.md`. Order: `docs/tools-v2-rollout.md`.
Owner decisions: all 145 tools; no per tool owner review; nothing merges to `main` until every tool is done
(one merge at the end, owner approves it); finished tools collect on `claude/tools-v2-all` after an independent
review PASS; builders run on Opus when the Fable limit is reached.

States: building, review, fixing, recheck, PASS (waiting to integrate), integrated.

| Tool | Branch | Worktree | State | Notes |
|---|---|---|---|---|
| APES water pollution | (on main) | | live | flagship |
| AP Bio osmosis | claude/tools-v2-osmosis | wt-osmosis-v2 | integrated | |
| AP Bio Simpson diversity | claude/tools-v2-simpson-diversity | wt-simpson-diversity | integrated | |
| AP Bio water potential | claude/tools-v2-water-potential | wt-water-potential | integrated | |
| Ochem conformations | claude/tools-v2-conformations | wt-conf-v2 | integrated | |
| AP Bio energy flow | claude/tools-v2-bio-energy-flow | wt-bio-energy-flow | integrated | |
| AP Bio Hardy Weinberg | claude/tools-v2-hardy-weinberg | wt-hardy-weinberg | integrated | its practice part folded onto the Simpson mechanism (one dropdown) |
| AP Bio enzyme activity | claude/tools-v2-enzyme-activity | wt-enzyme-activity | integrated | |
| A&P graphs | claude/tools-v2-anp-graphs | wt-anp-graphs | integrated | |
| AP Calc tangent tracer | claude/tools-v2-tangent-tracer | wt-tangent-tracer | integrated | |
| AP Chem units and sig figs | claude/tools-v2-units-sig-figs | wt-units-sig-figs | integrated | |
| APES energy flow | claude/tools-v2-apenv-energy-flow | wt-apenv-energy-flow | integrated | |
| NREMT mnemonics | claude/tools-v2-nremt-mnemonics | wt-nremt-mnemonics | integrated | first NREMT tool on the kit; adapter `nremt/assets/nremt-kit2.js`, loaded only by this page |
| Ochem resonance | claude/tools-v2-resonance | wt-resonance | integrated | |
| AP Bio design drills | claude/tools-v2-design-drills | wt-design-drills | integrated | adapter: a part can carry its own stage (`stage` on a part) |
| A&P pathways | claude/tools-v2-anp-pathways | wt-anp-pathways | integrated | |
| A&P lab practical | claude/tools-v2-anp-lab-practical | wt-anp-lab-practical | integrated | first explorer: kit `K.spots`; kit2 weight bucket `assets/course/kit2` |
| Ochem arrow pusher | claude/tools-v2-arrow-pusher | wt-arrow-pusher | integrated | shares `ochem/assets/push-board.js` and `.css` with Resonance; registry `css` field (build-tool-pages) |
| NREMT sound trainer | claude/tools-v2-nremt-sound-trainer | wt-nremt-sound-trainer | integrated | second NREMT tool on `nremt/assets/nremt-kit2.js` (unchanged) |
| A&P feedback loops | claude/tools-v2-anp-feedback-loops | wt-anp-feedback-loops | integrated | |
| A&P predict | claude/tools-v2-anp-predict | wt-anp-predict | integrated | Explore in its own weight bucket `anatomy-physiology/predict-explore` (34 KB); anp spec decision 104 (103 was taken) |
| NREMT skill sheets | claude/tools-v2-nremt-skillsheets | wt-nremt-skillsheets | integrated | third NREMT tool on `nremt-kit2.js` (unchanged); Explore `nremt/assets/skill-explore.js`, the run is Test yourself |
| Ochem 3D viewer | claude/tools-v2-viewer-3d | wt-viewer-3d | integrated | second explorer (`K.spots` over a turning molecule); Handedness opens with the H in front and reads R or S after "H to the back" (brief rule 8) |
| NREMT flowcharts | claude/tools-v2-nremt-flowcharts | wt-nremt-flowcharts | integrated | fourth NREMT tool on `nremt-kit2.js`; Explore `nremt/assets/flow-explore.js` (two drawn calls); Read, Build it and Drill me are Test yourself |
| NREMT body map | claude/tools-v2-nremt-body-map | wt-nremt-body-map | integrated | Explore `nremt/assets/body-map-v2.js` (The body, Burns); four additive hooks in `assets/body3d/viewer.js` (budget 17 KB); A&P 3D anatomy and lab practical still pass |
| AP Bio chi square | claude/tools-v2-chi-square | wt-chi-square | integrated | choice chamber of pill bugs; kept sweep, frames, perf and interact scripts in `scripts/tools-v2/chi-square-*` |
| AP Bio rates | claude/tools-v2-rates | wt-rates | integrated | three tabs (rate over time, at a moment, percent change); sweep `scripts/tools-v2/rates-sweep.mjs` (`--frames`, `--perf`) |

2026-11-19: `main` merged in after PR #228 (ochem frame cleanup: chipPicker, scrollChips and .ls-chips-hidden gone; the v2
conformations, resonance and arrow pusher kept, kit2 kept). Ochem viewer 3d had `main` merged
into it before integration (PR #228 rewrote `viewer-3d.js` and `viewer-3d.html` on main). Its sweep (and the reaction predictor's) needs playwright 1.63 (`/opt/npm-tools`); the 1.49 under the repo's
`node_modules` fails `waitForFunction` under the page CSP (no unsafe-eval), so run it without that link.

Owner 2026-11-19: the hidden legacy controls cleanup for the other 13 course kits (NREMT, A&P, Bio/Chem/Physics,
Calc/BC/Precalc/Stats, APES/Psych, Macro/Micro/HuG; plan in `docs/tools-frame-2026-11.md` "Cleanup (2026-11-19)")
is folded into the final merge: do it on `claude/tools-v2-all` (after each course's rebuilds, to avoid conflicts),
never straight to `main`. Nothing else goes live before the one final merge.

Before the final merge:
- Time the skill sheets bleeding station's Blanket and Transport taps on a quiet machine or a real phone (p95 is
  above budget under load). If still over 50 ms, find the cause.
- Time flowcharts after the glove polish on a quiet machine (p95 at CPU x4 was 66 to 133 ms under load).

Plans (owner 2026-11-23): every remaining tool has a ready plan in `docs/tools-v2-plans/<course>-<tool>.md`
(113 plans; difficulty lists in `README-core.md`, `README-econ.md`, `README-sci.md`, `README-soc.md`,
`README-math.md`). A builder starts from its tool's plan and still opens the research links before building.
Simpler tools first; Psych waits for the brain map's adapter; the first tool of a course without kit2 adds its adapter.

Next by use (rollout table):
A&P anatomy 3d, NREMT scenario sim, Ochem reaction
predictor (rollout rows 20 to 26).
