# Author F self-report: Unit 4 (4.1-4.14), beyond the exam

## Done

All 14 topics: lesson, notes, questions and glossary for `parametric-functions`, `parametric-motion`,
`parametric-rates`, `parametric-circles-lines`, `implicit-functions`, `conic-sections`, `parametrizing-implicit`,
`vectors`, `vector-valued-functions`, `matrices`, `inverse-determinant`, `linear-transformations`,
`matrices-as-functions`, `matrix-modeling`. No FRQs and no `exam: true` items (Unit 4 rule). No map edits.

| Count | Value |
|---|---|
| Items | 226 (16 per topic; 17 in 4.4 and 4.5); every topic 9 or 10 items in two stimulus sets (53-63%) |
| Item types | single, multi, numeric (50), expr (16), order, predict, mixed in every topic |
| Stimulus sets | 28: 13 graph (4 `plot` specs, 9 computed figures), 14 table (data tables or shared matrices), 1 diagram |
| Calculator sets | 2 (4.2 thrown ball, 4.14 weather chain); everything else exact |
| Notes | 14 pages, 650-1000 words each, worked examples before each new calculation, comparison tables |
| Figures | 23 SVGs in `precalculus/figures/`, registered in `precalculus/data/figures/<topic>.json`, drawn by `scripts/apprecalc-figures/f.mjs` from the functions and numbers they show |

The required stimulus "graph in `parametric-functions`: a parametric path with arrows" is
`parametric-functions-s1` (figure `parametric-functions-loop`, the self-crossing path $(t^2 - 4, t^3 - 4t)$
with direction arrows and labeled $t$ values).

## Checks

- `node scripts/check-apprecalc-content.mjs --topic <id>`: all 14 ok, no warnings. Full run: 0 failing.
- `node scripts/check-apprecalc-map.mjs --check`: nothing used before it is taught.
- `node --test scripts/test/apprecalc-*.test.mjs`: 133 pass.
- Recheck (scratch script): all 66 numeric and expr keys recomputed from the stems independently of the item
  text; expr keys evaluated through `ApPrecalcExpr` against the stem's condition (for example, the implicit upper
  half satisfies $x^2 + xy + y^2 = 7$). 0 mismatches. The content check also grades every expr key right and
  every authored mistake wrong. Every option key in the authoring source has an assertion on its numbers.
- Every figure and every `plot` rendered to PNG and inspected; label overlaps fixed. A scan of every authored
  string for TeX outside `$...$` and prose inside math is clean. Unit 4 pages build with the generator
  (`APPRECALC_PUBLISHED=unit-4`), with the "beyond the exam" line added by the build.

## Open questions (for the lead to merge into `docs/apprecalc-needs-author.md`)

1. **Transition matrix convention (4.14).** The course uses "from" columns that add up to 1 and column state
   vectors, $\mathbf{x}_{n+1} = T\mathbf{x}_n$, to match 4.12-4.13 (matrices act on columns). Many texts use
   row vectors and "from" rows. Notes say so; confirm against the CED's examples.
2. **Conic sections scope (4.6).** Taught: standard forms, centers, vertices, axis lengths, hyperbola asymptotes,
   classifying by signs, completing the square. Not taught: foci, directrices, eccentricity. The CED text for
   4.6 was not available in `framework.md`; confirm whether focus/directrix definitions are in scope.
3. **Dot product and angle (4.8)** and the hyperbola parametrization with $\sec$ and $\tan$ (4.7) are included;
   confirm both are in the CED for these topics.
4. **Determinant placement.** The map teaches the determinant in 4.11; the CED may introduce it with
   matrices in 4.10. Content follows the map (4.10 never uses the word).
5. **Tooling.** `pcalc-plot.js` draws only $y = f(x)$, so parametric curves, vectors, transformed squares and
   the state diagram are standalone SVG figures from `f.mjs` (each computed from its function). A parametric
   curve type with direction arrows in the plot spec would let builders and later authors draw these from data.
   Lessons have no `plot` field, so every lesson figure is a registered SVG figure.
6. **Matrix stimuli.** Sets that share matrices (4.10, 4.11, 4.12 s2, 4.13) use `kind: "table"` with an `html`
   block of display math, since there is no "formula" stimulus kind.
