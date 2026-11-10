# Builder T1 self-review: Graph Studio (`graph-studio`)

Brief: `docs/apmicro-briefs/t1.md` and `tools-common.md`. Built 2026-11-09 in `/home/claude/wt-micro` (branch
`claude/apmicro`), scratch build in `/tmp/mic-t1`. No shared file edited, no git command run.

## What it does

**Explore.** Pick one of eleven graphs (a grouped Graph menu, Unit 1 to Unit 6: PPC, supply and demand, surplus and
policy, cost curves, perfect competition market and firm, monopoly, monopolistic competition, labor market and
firm, monopsony, externality, Lorenz curve), then What happens (75 scenarios in four groups: shift a curve, mark a
point or line, shade an area, movement along a curve). The student acts on the graph itself: drags the curve (E2,
the firm's price line and q follow), taps where the point goes, drags a price control, taps the cells of an area.
The verdict lands on the stage at once (caption and pills), with the slip named; Show me animates or draws the key;
Why walks through it; Details lists the axes, what shifts each curve and every named area with its cells. With
nothing picked, the graph is free: drag any curve (the monopoly's profit-maximizing point, the monopsony's hire and
the competitive firm's q follow, with a profit or loss pill), or, on the area graphs, tap any cell to hear what it
is called ("Area b is part of the tax revenue and the buyers' share of the tax").

**Test yourself.** Seeded drills, 13 contexts (one per graph, three for the policy graph: surplus, price controls
and taxes and subsidies, trade), each served when its topic is published, five kinds: draw it from scratch
(labels first), shift it and follow the result, shade the area, mark the point or line, shift or movement along.
Steps: `labels`, `shift`, `equilibrium` (E2), `outcome` (choice), `line`, `point`, `shade`, `move` (choice) and
authored `check-n` choices (four options each: the shutdown rule, a ceiling's shortage, imports, MRP = MP x P,
excess capacity, why not P = MC for a natural monopoly, why MFC is above supply). The graph is remounted for each
rubric point so only that point's controls are live; a rubric strip on the stage ticks each point. First try
recorded as `graph-studio:<context>:<step>`; worked solution in Why; Keep going after the last step. PPC and
supply-and-demand drills free, the rest gated by `ApMicroCore.locked` (checked with a stubbed lock: the gate shows
the graph and a "Practice supply and demand" button). Problem codes carry context and kind.

**Slips named** (the reader-report list): price read from MR (or MC) or at the allocative point, the right quantity
at the wrong height, the wage read from MFC or MRP, the competitive outcome for the monopsony one, market and
efficient quantity swapped, shutdown at the bottom of ATC, the firm's q at the bottom of ATC, the subsidy rectangle
stopped at the old quantity, subsidy cost shaded as deadweight loss, any wrong area named by what it is (total
revenue for profit), a per-unit cost shifting ATC only, a lump-sum fee shifting MC, labor supply shifted for a
product price change, demand shifted for a tax or for entry, the competitive firm's demand labeled as sloping down.

## Files

- `microeconomics/assets/tools/graph-studio.js` (page), `.../graph-studio.css`, `.../math/graph-studio.js` (model,
  pure), `microeconomics/data/tools/graph-studio.json` (11 graphs, 75 scenarios, 13 contexts)
- `scripts/lib/apmicro-tool-checks/graph-studio.mjs` (validator), `scripts/test/apmicro-tool-graph-studio.test.mjs`
- `assets/covers/tools/apmicro/graph-studio.svg` and its entry (first) in `index.json`
- `pages.json` entry unchanged (topic `shifts-movements`, free, studio).

## Checks run

- Validator: its own SHIFTER table (every scenario's curve and direction), its own arithmetic for every outcome
  (straight lines), every named point (closed forms from the cost model's coefficients: MR = MC, P = MC, MRP = MFC,
  MSB = MSC, bottoms of AVC, ATC, LRATC, fair return, revenue maximum) and every shaded area (rectangle, triangle or
  numeric integral) against `ApMicroGraph.areas` cells; planted slips per step; 300 seeds per context and kind:
  clean (about 65 s). `node scripts/check-apmicro-content.mjs`: no graph-studio failure.
- `node --test scripts/test/apmicro-tool-graph-studio.test.mjs`: 9 of 9 pass (shipped data, seeds, slips, 15
  planted data mistakes caught, hand arithmetic against the engine, readouts).
- `node scripts/build-apmacro.mjs --check`: unchanged.
- Browser (Playwright, `/tmp/mic-t1/sweep.mjs`): every one of the 75 Explore scenarios with Show me, and all 40
  context and kind drills answered to the end, at 360 and 1280: no console errors, no horizontal overflow.
- Label overlap scan of every scenario's graph (`/tmp/mic-t1/allover.mjs`): fixed the ones in my data (tax raised to
  3 so the deadweight loss letters separate; competitive price kept at or below 5.5 so AVC's label clears the price
  line); the rest are engine placement (below).
- Screenshots looked at (`/tmp/mic-t1/*.png`): Explore at 1280 light and dark and 360 light and dark (supply and
  demand, perfect competition stacked on a phone, labor, costs, monopoly, monopolistic competition, monopsony,
  externality, tariff, Lorenz, free areas), drills (PPC draw, perfect competition labels, subsidy walk to the named
  rectangle slip, monopoly point, labor shift, trade shade, profit vs total revenue slip, finish with Keep going,
  the Premium gate).

## Requests for the lead (shared files, not edited)

1. **`mic-graph.js`: a per-unit cost lowers fixed cost (bug).** `fixedCost` subtracts MC's offset, so shifting MC
   up 1 lowers AFC and makes ATC fall at low output (ATC at q = 2: 7.82 to 7.32, should be 8.82); MC down raises
   AFC. ATC also never shows as shifted (no faded ATC1) when MC moves. Graph Studio's per-unit cost scenarios and
   free costs graph show it today. Tested on a copy: MC + 1 then lifts MC, AVC and ATC by exactly 1, AFC unchanged,
   min ATC stays at q = 5.6 with MC through it; ATC + 1 is unchanged from today. Diff (also at
   `/tmp/mic-t1/keep-mic-graph.diff`):
   ```
   -  function fixedCost(c){ return Math.max(0.4, c.p.F + ((c.s || 0) - (c.o || 0)) * c.p.Fstep); }
   +  function fixedCost(c){ return Math.max(0.4, c.p.F + (c.s || 0) * c.p.Fstep); }
   -  function atcBase(p, q, o, s){ var F = Math.max(0.4, p.F + (s - o) * p.Fstep); return p.a - p.b * q + p.c * q * q + o + F / q; }
   +  function atcBase(p, q, o, s){ var F = Math.max(0.4, p.F + s * p.Fstep); return p.a - p.b * q + p.c * q * q + o + F / q; }
      in curves(), after the second defs.forEach:
   +    // A per-unit cost moves ATC with MC: drawn as a shift, its old place faded (AFC, a fixed cost, stays).
   +    defs.forEach(function(d){ var o = by[d.id]; if(d.shape === 'atc' && d.costOf && by[d.costOf] && by[d.costOf].steps && !o.steps) o.steps = by[d.costOf].steps; });
   ```
   Then rerun `node --test scripts/test/apmicro-graph.test.mjs` and T2's cost-lab and firm-market tests.
2. **`mic-graph.js` label placement** (found by the overlap scan): the ATC and AVC end labels touch on every short-run
   cost, firm and market graph; AVC's label collides with "d = MR = AR = P" when the price is 6 or more (the line
   label in the right margin is placed without checking curve labels); PPC1 and PPC2 overlap after a one-step
   inward shift; MC1 and MC2 overlap after a vertical shift; a placed point's letter (X, H) can sit on a curve
   (fixed in Graph Studio for the PPC "on" key point only); area letters can sit on a guide or curve (tariff,
   monopsony wage bill). Suggest placing the line label first and passing its box to the curve-label placer, and
   running curve end labels through `place()` with each other's boxes.
3. **`mic-graph.js`, nice to have:** dashed guides and axis marks (P_M, Q_M; W_M, L_M) for a placed named point, so a
   monopoly or monopsony point shows the price read from demand (or supply) on the axis, as the exam draws it.
4. **`mic-tools.js`:** the draft banner says "an microeconomics teacher" (should be "an AP® Microeconomics teacher").
   Graph Studio does not set `status: placeholder`, so it does not show it.

## Open points

- The costs graph's per-unit scenarios look wrong until request 1 is merged (grading is right; only the drawing).
- No `num` or `unit` steps: Graph Studio grades graphs and reasoning; areas in dollars live in surplus-lab and cost
  tables in cost-lab. No `matrix` steps (game-lab).
- Shading after a shift uses the key's shift size (a student who dragged two steps sees one), so every graded area
  is the validated one.
- Content to have an economics teacher read: the 75 scenarios and 13 `check` choices (all written for this tool),
  especially the labor scenarios (DL and the firm's MRP both shift for a product price or productivity change) and
  the monopolistic competition long run (point M on the tangency).
