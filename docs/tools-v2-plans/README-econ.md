# Tools v2 plans: group econ (AP® Macroeconomics and AP® Microeconomics)

Sixteen plans, one per tool, written 2026-11-23 from `origin/claude/tools-v2-all` (the econ tools there are the same
as on `origin/main`; none is live, integrated or in progress in `docs/tools-v2-pipeline.md`). Plans only: nothing
was built. Read the plan, then the standard, the builder brief and the course docs, before a build.

## In rollout order
| # | Wave | Tool | Plan | Difficulty |
| --- | --- | --- | --- | --- |
| 1 | 3 (F) | Macro Policy chain | `apmacro-policy-chain.md` | Heavy: five chains, a whole economy scene, five small graphs; first Macro kit2 tool (adapter and build hook) |
| 2 | 6 (M) | Micro Game lab | `apmicro-game-lab.md` | Simple: restyle, the tap is already on the picture; first Micro kit2 tool (adapter and build hook) |
| 3 | 7 (C) | Macro Indicators lab | `apmacro-indicators-lab.md` | Heavy: four tabs, four scenes, 100 walking figures |
| 4 | 19 (E) | Macro Forex lab | `apmacro-forex-lab.md` | Medium: two mirror panels; builds `K.curve` for the whole group |
| 5 | 19 (E) | Macro PPC and trade | `apmacro-ppc-trade.md` | Medium: two tabs, point on a curve (`K.handle` exists) |
| 6 | 19 (E) | Macro Reserves lab | `apmacro-reserves-lab.md` | Medium: two tabs, one graph each; AD-AS moves to "?" |
| 7 | 19 (E) | Macro AD-AS lab | `apmacro-adas-lab.md` | Medium: three tabs; the long run time bar |
| 8 | 19 (P) | Macro Multiplier lab | `apmacro-multiplier-lab.md` | Medium: three tabs of counted motion |
| 9 | 19 (E) | Macro Graph studio | `apmacro-graph-studio.md` | Heavy: eight graphs and scenes; build last in Macro, reuse the scenes |
| 10 | 24 (E) | Micro Elasticity lab | `apmicro-elasticity-lab.md` | Simple: restyle, `K.handle` on demand; first Micro E tool (`K.curve` on `mic-graph.js`) |
| 11 | 24 (E) | Micro Cost lab | `apmicro-cost-lab.md` | Medium: one screen, crowded curve labels |
| 12 | 24 (E) | Micro Externality lab | `apmicro-externality-lab.md` | Medium: two tabs, five context scenes |
| 13 | 24 (E) | Micro Factor lab | `apmicro-factor-lab.md` | Medium: two tabs, two panels |
| 14 | 24 (E) | Micro Firm and market | `apmicro-firm-market.md` | Heavy: three tabs, two panels, two long run animations |
| 15 | 24 (E) | Micro Graph studio | `apmicro-graph-studio.md` | Heavy: eleven graphs and scenes; build last in Micro |
| 16 | 24 (E) | Micro Surplus lab | `apmicro-surplus-lab.md` | Medium: three tabs, counted people, small areas |

Rollout order puts Micro Graph studio (row 144) before Surplus lab (row 145); build Surplus lab first so Graph studio
reuses its scene. The builder brief's speed rule (simpler tools first) favours Game lab and Elasticity lab early.

## Decisions every econ plan shares (log each in `docs/tools-v2-owner-log.md` when built)
- **Macro's build stays byte identical.** Run `node scripts/build-apmacro.mjs --check` after any shared change, and
  for every Micro tool too (Micro must not change Macro at all). Any `mac-graph.js` or `mic-graph.js` change is an opt
  in option whose default output is unchanged; run `node --test scripts/test/apmacro-graph.test.mjs` (and Micro's).
- **Micro forks Macro.** `mic-tools.js`, `mic-graph.js` and the Micro scenes are forked copies; never import a Macro
  file into Micro. The Micro adapter is a copy of the Macro adapter; a fix in one is ported to the other.
- **Adapters.** No econ tool is on kit2 yet. The first Macro tool adds `ApMacroTools.studioKit2` to `mac-tools.js`
  (copy `ApCalcTools.studioKit2` and its call in `modes`) and the `t.kit2` branch in `build-apmacro.mjs` (tool template
  at lines 984 to 985, as `build-apcalc.mjs` 1060 to 1061). The first Micro tool does the same in `mic-tools.js` and
  `build-apmicro.mjs` (line 984). Check with `grep kit2 <course>/data/pages.json` before starting.
- **`K.curve`** (the group's piece): generic in `tool-kit2.js` on top of `K.handle` (grab a named curve anywhere on its
  path, move it along its shift axis, keys, a before tick); a course bridge supplies the geometry from
  `ApMacroGraph.px`, `py`, `BOX` (and Micro's). Drag moves cached paths by transform and re renders on settle (perf).
- **The old curve after a shift** keeps the exam's labels (D1 and D2) but is drawn faint and solid, not dashed:
  reviewers blocked dashed ghosts on other tools, and here the old curve is a real, named exam part.
- **Weight.** `mac-graph.js` and `mic-graph.js` load on every course page (shell budgets in `check-weight.mjs`): tool
  only code and scenes stay in tool files.
- **A drawn scene for every graph** (owner: "a plain graph is just boring"; `docs/tool-visuals-2026-11.md`): the real
  economy drawn (people, shops, ships, banks), tied number for number to the graph, never ahead of the drawn curve.
