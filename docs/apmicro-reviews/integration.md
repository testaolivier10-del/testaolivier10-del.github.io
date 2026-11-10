# AP® Microeconomics: integration of the review requests (2026-11-09)

The integrator owns the shared layer only. Every request from `self-a` to `self-e`, `self-t1` to `self-t4` and the
unit reviews `u1` to `u5-6` was read; each one that was right is applied in the shared file with a test. Content was
not rewritten (except three early glossary definitions the coordinator asked for, below). Checks after the last
change: `node --test scripts/test/apmicro-*.test.mjs` (all pass except the two that read `microeconomics/data/exams/`,
which Phase 3 is writing now), `check-apmicro-map` clean, `check-apmicro-content` 0 failing outside exams,
`build-apmicro --check` and `build-apmacro --check` byte-identical.

## What changed, by file

### `scripts/lib/apmicro-map.mjs` (ordering scan)
1. "AP®" (also `&reg;`, `&#174;`, `<sup>®</sup>`) is masked before the scan, so the mark no longer reads as the
   average-product alias "AP". A bare "AP" still does. The alias stays.
2. Declared previews are matched by `mic-preview` (was `psy-preview`).
3. New exempt class `mic-noscan`: words the engine writes itself. Used by the no-JavaScript "Key:" line.

### `docs/apmicro-dependency-map.json` (concept placement)
4. Pull-forward `general-cost-words`: `total-cost` taught in 1.5 (dependsOn `explicit-cost`), `marginal-cost` in 1.6
   (dependsOn `marginal`, `total-cost`), both `fullIn` 3.2. `average-costs` now also depends on
   `diminishing-returns` (the U shape). "technology" is an everyday word (it stays an alias of
   `supply-shifter`, so "determinants of supply" is still strict).
5. `lump-sum-tax` is taught in `short-run-costs` (3.2), where the ATC-only shift is first explained (C's notes
   table and items), not in `monopoly`; D and E use it later without defining it.
6. `productive-efficiency` keeps its 1.3 (PPC) sense and gets `fullIn: perfect-competition` (minimum ATC), pull-forward
   `productive-efficiency-two-senses`; `excess-capacity` (4.4) depends on it. `allocative-efficiency` is already
   taught in 3.7, where the content first explains it; nothing earlier uses it.

### Glossary precedence (`scripts/lib/apmicro-build.mjs`, `scripts/check-apmicro-content.mjs`)
The build took the first file with a definition and the check the last, so they could disagree. Both now take the
definition from the glossary file of the topic that teaches the concept, else the first file by name.
`glossaryAll(map)` is exported and tested against the build. Early definitions added (coordinator request):
`glossary/cost-benefit.json` `total-cost`, `glossary/marginal-analysis.json` `marginal-cost`,
`glossary/short-run-costs.json` `lump-sum-tax`.

### `scripts/lib/apmicro-build.mjs`
The shade item's no-JavaScript "Key:" line wraps the region names in `mic-noscan`.

### `microeconomics/assets/mic-graph.js` (engine)
- T1-1, u3-2: `fixedCost` no longer subtracts MC's offset. A per-unit cost lifts MC, AVC and ATC by the same amount
  (min ATC stays at the same q, AFC unchanged), and ATC is drawn as shifted (faded ATC1) when MC moves.
- 7: on `sd-micro` with a tax or subsidy and a `shift` task, the PB, PS and Q_T guides are drawn only with the key.
- 8: `monopoly` with `line: { id: 'Pr', at }` below the monopoly price has regions after the regulation: cs (under
  D above Pr), profit or loss (Pr against ATC), tr, tc, dwl (D against MC out to D = MC); Q is where Pr meets D or
  MC, whichever is smaller. At Pr = P where D = MC there is no dwl (the checker says so).
- 10: `areas()` reads the curves as shown (`start` and `show`) for `sd`, `sd-micro` and `externality`. The
  externality's social curve sits `gap` steps from where its private curve starts (`start`) and stays put. A
  partial corrective tax shades the loss that is left; over-correction shades it on the other side. With no shift
  the cells and regions are exactly as before (tested for the four types).
- 11: `showLabel: { S: 'S + tax' }` labels a curve drawn shifted by `show`, unnumbered; its old curve is unnumbered too.
- 12, T1-3, T4-4: a placed point's label goes to the first clear corner (no curve, no label); `pointMarks:
  { x: 'L_M', y: 'W_M' }` adds dashed guides and axis marks.
- T1-2, T2-2, T3-5, u2, u5-6 (placement): the long line label (d = MR = AR = P) is placed before the curve labels;
  labels keep 2 px apart; an old curve's label has several places to try; shift arrows and equilibrium guides are
  soft obstacles for labels; cell letters keep clear of arrows and guides.
- T3-1: axis marks close in value are spread along their axis (13 px apart vertically, 3 px between boxes across).
- T3-2: grab strokes get `pointer-events="none"` when there is no shift (curves) or line (line) task.
- T2-1: the checker accepts `slips.point`.
- T2-3: `state.curveN0` numbers the faded curves (default `n0`). T2-4: `state.followerOld: false` drops a
  follower's old label (MR1).
- T3-3: new kind `demand` (D alone; `line: { id: 'P', at }` gives regions `tr` and `cs`, the Q mark; named points
  `unit-elastic`, `at-price`). Added to the formulas page and to the map's `GRAPH_KINDS`.
- T3-4, u2-3: `slopes: { D, S }` (0.5, 1 or 2) on `sd` and `sd-micro`; a per-unit tax moves S up by its amount
  (`amount / slope` steps sideways), so incidence follows elasticity on the graph. Slope 1 draws exactly as before.
- u3-1: a `costs` graph with a price line reads "Price and cost", marks the line "P" (not the whole name) and has the
  line as a label slot.
- u3-3: below the minimum of AVC the named point `firm` is [0, P] (shutdown); no qF guide, a "q = 0" mark, no
  profit or loss cells.
- u4: `start` allows 3 steps (was 2), so a loss rectangle can be made taller.
- u1: the "on" band of a straight PPC (already a perpendicular distance) is 8% of the shorter intercept, between 0.2
  and 0.4, so a real gain from trade on a flat PPC no longer grades "on".

### CSS
- 9: `mic.css` used tokens the theme does not define: `--surface` (now `--white`, so payoff cells are dark in dark
  mode), `--ink-2`, `--ink-3` (now `--ink`, `--muted`), `--paper-2` (`--surface2`), `--good-tint`, `--bad-tint`
  (`--tint-good`, `--tint-bad`), `--font-body` (inherit). Every other `var()` in the micro CSS is defined (theme,
  course CSS, `mic.css`'s `--mic-s*`, or set inline by `mic-home.js`). Macro's `mac.css` has the same seven
  undefined tokens; left alone (Macro stays byte-identical), for the lead.
- 13: `mic-tools.css`: on a phone a graph on the Tool Studio stage keeps the bottom-right corner of its control row
  free for Enlarge. Root cause, for the lead: `enlClear()` in `assets/course/tool-studio.js` tests text in `p, span,
  label ...` but not `button`; adding `button` there would fix it for every course.

### Other shared files
- `mic-tools.js`: the draft banner reads "an AP® Microeconomics teacher" (Macro's `mac-tools.js` has the same "an
  macroeconomics teacher"; not changed).
- `microeconomics/data/pages.json` (and the fixture): `cost-lab` is kind `simulator`, as its data file; the content
  check now fails when the two kinds differ.
- `docs/apmicro-needs-author.md`: `land-resources` added.

### Tool files changed to drop workarounds (coordinator allowed it after the builders finished)
- externality-lab: `specB` is now the picture as a shading spec; the tool draws one SVG with `showLabel` and
  `state.shade` (the stacked second SVG, its regex relabel and its CSS are gone); validator and test follow.
- cost-lab: `offsets()` no longer adds the per-unit cost to ATC's offset (it compensated the fixedCost bug).
- game-lab.css: the dark-mode cell override is gone. elasticity-lab.css: `--surface` replaced.
  surplus-lab.css: the grab-stroke override is gone (the engine does it).

## Decisions on the open questions
- 14 (select-all with one key): 11 of 35 select-all items now have one key (31.4%), above the 20% minimum; no topic
  needs to convert. They are in cost-benefit, disequilibrium-changes, government-intervention, long-run-costs,
  market-efficiency, other-elasticities, price-elasticity-supply, public-goods, scarcity, trade-policy,
  types-of-profit.
- 15 (`frq-tax-surplus-long`, "perfectly competitive"): the rule stays as Macro's. An FRQ unlocks with the latest
  of its listed topics; a multi-unit FRQ lists every topic it uses, and the practice exams are exempt. "Perfectly
  competitive" is the 3.7 model, not a pull-forward: listing 3.7 would lock a Unit 2 FRQ until Unit 3. B's current
  wording ("competitive: many ferry companies and many riders, each too small to set the price") is the fix and is
  already in the file.

## What authors could now restore (not done; content is theirs)
- Author A (1.5, 1.6): "full cost" can read "total cost" and "additional cost" can read "marginal cost" or "MC" in
  1.6 (1.5 may say "total cost" but not "marginal cost"). The MB = MC preview box in the 1.6 notes can become plain
  text. 1.3 may say "technology". Pages may write "AP®". The graph-skills shade items need no preview span for the
  key line (the stem still does if it names a region before 2.6). `glossary/cost-benefit.json` `total-benefit`
  says "full cost": may say "total cost".
- Author B: "AP®" may be used in Unit 2. Tax and subsidy shift items may use `sd-micro` with `policy` again. A tax
  graph may use `slopes` to show unequal incidence (then the letter items need not say the burden is shared evenly).
- Author C: "average product" may be written as "AP" in Unit 3 and later; "lump-sum license fee" may say "lump-sum
  tax" (taught in 3.2 now); `glossary/short-run-costs.json` `total-cost` and `marginal-cost` are no longer read
  (the 1.5 and 1.6 entries win): keep the TFC + TVC wording in `fixed-cost` and `variable-cost`, or delete them.
- Author D: `frq-monopoly-long` and other regulated-price graphs may now ask to shade cs or dwl under Pr. 4.4's
  "productive efficiency" needs no inline gloss beyond the reminder. `mic-monopoly-15` and
  `mic-monopolistic-competition-15` may use `start` of 3 for a taller loss.
- Author E: delete the duplicate `lump-sum-tax` entry in `glossary/externalities.json` (the 3.2 entry wins; the
  monopoly one is unused too, so author D may delete it).
- Unit 3 review (u3): `profit-maximization-s2` and `firm-decisions-s1` now read "Price and cost" with a "P" mark;
  `firm-decisions-11` shows the shutdown (q = 0).

## What builders can now simplify (not done unless listed above)
- T1 graph-studio: the local fix for the PPC "on" point label can go (placement and `pointMarks`); the costs
  scenarios now lift ATC with a per-unit cost (re-read any copy that described ATC as unchanged).
- T2 firm-market: drop the S and D relabel regex in the long run (pass `curveN0`); drop `declutter()` (the line
  label is placed first); drop the local MR1 removal (pass `followerOld: false`); use `slips.point` if wanted.
- T3 surplus-lab: `spreadMarks` (DOM) and its MutationObserver can go (the engine spreads marks); keep taxes of any
  size. elasticity-lab: `demandSvg` and its regular expressions can become the `demand` kind; its own `spreadMarks`
  can go; its shift view can use the engine's labels (old labels avoid arrows). Unequal-slope incidence can be
  drawn with `slopes`.
- T4 factor-lab: the blank monopsony point label can be "Hire" with `pointMarks: { x: 'L_M', y: 'W_M' }`;
  externality-lab: "E*" can show with an E2 (labels now avoid each other).
