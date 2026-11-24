# Plan: AP® Microeconomics, Graph studio (tools v2)

## Tool and page
- Page `microeconomics/tools/graph-studio.html`; scripts `microeconomics/assets/tools/graph-studio.js` and `.css`,
  model `microeconomics/assets/tools/math/graph-studio.js`, data `microeconomics/data/tools/graph-studio.json`
  (11 graphs: ppc, sd, policy, costs, pc, monopoly, monocomp, labor, monopsony, externality, lorenz; 75 scenarios;
  13 contexts).
- Free, with the PPC and supply and demand drills free and the other graphs Premium inside Test yourself. Rollout
  row 144, group E, wave 24. A fork of Macro's Graph studio: follow `docs/tools-v2-plans/apmacro-graph-studio.md`.

## The one idea
Each event shifts one curve, moves a line or a point, or changes an area, and the picture answers. One screen; the
11 graphs are a quiet picker.

## Research
- Same as Macro's plan (EconGraphs, Columbia econpractice, the AP exam's graph drawing).
- MRU surplus practice ([mruniversity.com](https://mruniversity.com/teacher-resources/active-learning/consumer-and-producer-surplus-interactive-practice))
  for areas tapped and named.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Graph chips (11) | Explore: quiet picker beside Show me how |
| What happens (shifts, a point or line to mark, an area to shade) and Show me | Explore: events as tap spots in each graph's scene; Show me plays it |
| A picked scenario answered at once (pills, caption) | Test yourself (grading) |
| Free graph: drag any curve (the firm's line, the monopoly point and the market follow), tap any area to hear its name | Explore: the main mode |
| `refine` rewording of known slips | Test yourself |
| Why, Details (axes, shifters, named areas) | "?" |
| Drill with rubric strip (labels, shift, E2, line, point, shade), codes, `graph-studio:<context>:<step>`, Premium gate per graph | Test yourself unchanged |
| `?seed=`, `#quiz` | Kept |

## Design
- As Macro: each graph under a small drawn scene, reused from the Micro tools built before it (the iced tea market
  from surplus lab for sd and policy; the bakery from cost lab for costs; the farmers' market from firm market for pc,
  monopoly and monocomp; the bakery door and mill town from factor lab for labor and monopsony; the mill river from
  externality lab; a town's income ladder for the Lorenz curve, drawn as households, not bars).
- Main control: drag any curve or line (`K.curve`); tap an area to name it (on the area, in its color).
- Cause line from the scenario's words or the free drag. Outside the picture: purpose line, graph picker, Show me how.

## Science to verify
- All 75 scenarios against `math/graph-studio.js` and the authoring guide (labels on every axis and curve, MC through
  the minimums, price from demand, the right region, market vs efficient quantity, shutdown at minimum AVC).
- Lorenz curve and Gini area (CED Unit 6): equality line fixed, area between them.

## Reuse
- Build last in Micro: the scenes and `K.curve` exist. Shared scenes go in one Micro tool only file (for example
  `microeconomics/assets/tools/mic-scenes.js`), a fork of Macro's, never imported from Macro.
- Port Macro Graph studio's structure line for line where the code is the same.

## Risks reviewers will likely block on
- Heavy: 11 graphs and scenes, two panel kinds (pc, labor) small on phones; lazy load scenes; weight bucket.
- Area labels in tiny cells; one cue across picker switches.
- Byte identical: `build-apmicro --check` and `build-apmacro --check` (Macro unchanged); graph tests for both engines.
