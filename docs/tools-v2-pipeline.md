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

2026-11-19: `main` merged in after PR #228 (ochem frame cleanup: chipPicker, scrollChips and .ls-chips-hidden gone; the v2
conformations, resonance and arrow pusher kept, kit2 kept). Ochem viewer 3d (`claude/tools-v2-viewer-3d`, in review) needs
`main` merged into it before integration: PR #228 rewrote `viewer-3d.js` and `viewer-3d.html` on main.

Next by use (rollout table):
NREMT body map, NREMT flowcharts, Ochem viewer 3d.
