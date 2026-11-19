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
| APES energy flow | claude/tools-v2-apenv-energy-flow | wt-apenv-energy-flow | building | |
| NREMT mnemonics | claude/tools-v2-nremt-mnemonics | wt-nremt-mnemonics | building | first NREMT tool on the kit |

Next by use (rollout table): A&P pathways, A&P lab practical, A&P predict, A&P feedback loops, AP Bio design drills,
NREMT body map, NREMT sound trainer, NREMT flowcharts, Ochem resonance, Ochem arrow pusher, Ochem viewer 3d.
