# Plan: AP® Calculus AB, Area and volume

## Tool and page
`calculus/tools/area-volume.html`; scripts `calculus/assets/tools/area-volume.js` (with its canvas solid renderer),
`calculus/assets/tools/math/area-volume.js` (`ApCalcMath.areaVolume`), `area-volume.css`; data
`calculus/assets/tool-data/area-volume.json`. **Premium.** Rollout row 35, group G, wave 4, marked restyle (control
already on the picture; three lessons on one screen).

## The one idea (three tabs, one each)
1. **Area:** a thin strip, top minus bottom, added across the region is the area.
2. **Spin it:** the same strip spun about a line becomes a disc or a washer; adding them is the volume.
3. **Cross sections:** the strip is the base of a square, triangle or semicircle standing on the region.

## Research
- GeoGebra "Disk/washer method for finding volume of solid of revolution" (https://www.geogebra.org/m/fd9kfvrh) and
  "Volumes of Revolution with Disks/Washers" (https://www.geogebra.org/m/acdsdq8g): the slice spins into a washer
  in 3D beside the region. Take: the spin of ONE slice before the whole solid, R and r drawn on the washer.
- CalcPlot3D (https://c3d.libretexts.org/CalcPlot3D/index.html): free rotation of a solid. Take: a turntable that
  is easy to grab; leave: its control panel.
- Desmos 3D (https://www.desmos.com/3d): cross sections stacked on a base. Take: slabs standing on the base region.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Lessons Area / Discs and washers / Cross sections (dock switch) | the three tabs |
| Representative slice dragged on the region (cue "Drag the slice") | main control in every tab (`K.handle` on the x or y axis) |
| 3D solid, drag to turn, arrow keys when focused | Explore tabs 2 and 3 (turntable drag on the solid, keys kept) |
| Axis choice and the line's position (y = k, x = h) | tab 2, a quiet knob on the axis line itself (drag the line) plus "x axis / y axis" toggle beside it |
| Cross section shape (square, equilateral triangle, semicircle) | tab 3, three small tappable shape icons on the picture |
| Setup: the region list (6 regions: √x and x², under √x, 4 − x² and x + 2, x³ − 3x and x, 2cos x and x² − 1, x = y² and x = y + 2) | region picker beside "Show me how" |
| Integral caption with numbers | the takeaway after "Sweep"; the live strip formula is the cause line |
| Why (setup step by step), Details (numbers) | "?" |
| Test yourself: drill, 9 kinds (contexts area-x, area-y, area-cross, cross-squares, cross-triangles, disc-axes, disc-other, washer-axes, washer-other), steps drawn on the region, solid at the end; record ids `area-volume:<context>:<step>`; `?seed=`, `#quiz` | Test yourself unchanged |

## Design
- **Picture:** a woodworker's bench. Tab 1: the region is a board cut between the two curves (wood grain, edge
  shading, on the graph's exact axes and grid); the slice is one thin slat of it. Tab 2: the board is clamped on a
  lathe along the chosen axis; the slat spins (animated sweep of 360°) into a disc or a washer (a wooden ring, the
  hole visible), then "Sweep" turns the whole solid as the slice runs across. Tab 3: slabs (square, triangle,
  half round) stand on the board like cut cheese; the slice's slab is lit.
- **Main control:** the slice's knob on the axis; arrows step, Shift ten.
- **Animates on change:** the slat slides; in tab 2 a change of axis re clamps the board (slide and turn); the ring's
  hole grows or closes as r changes; a new region cross fades.
- **Cause line:** tab 1 "x = 0.5 → top 0.71 − bottom 0.25 → strip 0.46·dx"; tab 2 "R = 2.5, r = 1 → washer
  π(2.5² − 1²)·dx"; tab 3 "side 0.46 → square 0.21·dx".
- **Takeaway** (after Sweep): "Add every strip: ∫₀¹ (√x − x²) dx = 1/3."
- **Outside the picture:** 3 tabs, purpose line (about 9 words), region picker, Show me how, cause line, Sweep:
  4 controls and about 22 words.

## Science to verify
Area as ∫(top − bottom) dx and ∫(right − left) dy; split at crossings for three crossings (OpenStax Calculus Volume 1
§6.1). Disc πR² and washer π(R² − r²) with R and r measured from the axis of revolution, including y = k and x = h
(OpenStax §6.2; CED Unit 8 topics 8.9 to 8.12). Cross sections: square s², equilateral triangle (√3/4)s², semicircle
(π/8)s² with s the diameter (CED 8.7, 8.8; the model's own why lines). The **shell method** is not in the CED
(`docs/apcalc-authoring-guide.md` exclusions, needs-author `shell-method`): no shell picture, even in "?". Every
integral keeps its dx.

## Reuse
`ApCalcTools.studioKit2` (exists), `K.handle`, `K.tabs`, `K.head`, `K.cause`, `K.cue`; keep the tool's canvas
renderer (no WebGL) and the model's quads. Not the first AB tool on kit2. AB build byte-identical; BC unaffected
but run both checks.

## Risks reviewers will likely block on
- Two pictures (board and solid) on a phone: stack them, the board first; the slice knob must not sit under the
  solid's turntable grab area; one drag gesture per area.
- Canvas solid perf at CPU x4 during Sweep and turning (sort and light fewer quads while moving).
- R and r labels on a turning solid must stay 11 px and clear of each other at every angle.
- A washer whose hole closes (r = 0) must say "disc", in the label and the cause line, on the same frame.
