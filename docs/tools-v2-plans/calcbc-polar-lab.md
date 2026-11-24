# Plan: AP® Calculus BC, Polar lab

## Tool and page
`calculus-bc/tools/polar-lab.html`; scripts `calculus-bc/assets/tools/polar-lab.js`,
`calculus-bc/assets/tools/math/polar-lab.js` (`ApCalcMath.polarLab`), `polar-lab.css`; data
`calculus-bc/assets/tool-data/polar-lab.json`. **Premium.** Rollout row 111, group G, wave 18, marked restyle
(control on the picture; θ slider in the panel; two rows of sub switches).

## The one idea (two tabs)
1. **Sweep the area:** as θ turns, the curve sweeps thin slices ½r²dθ; adding them is the area.
2. **Between two curves:** the area between is ½∫(R² − r²)dθ between the angles where they meet.

## Research
- GeoGebra "Area of a polar region" applets (https://www.geogebra.org, search "polar area sectors"): thin sectors
  shaded as θ grows. Take: sectors, a stretch traced twice drawn darker.
- Desmos polar graphing with a θ restriction slider (https://www.desmos.com/calculator): exact; leave the slider.
- Math Insight polar coordinates applets (https://mathinsight.org): r < 0 drawn on the opposite ray. Take: the point
  on the opposite ray, said in words.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Curves and regions: cardioid (whole), limaçon (inner loop, whole trace), three petals (one, all), four petals (one, all), spiral (first turn), circle and cardioid, cardioid and circle, two circles | curve picker beside "Show me how"; the region choice is a small second picker on the picture; two curve items open tab 2 |
| Play (cue key `apcalcbc-polar-lab-play`) | "Sweep" (secondary) |
| Drag around the curve; drag on the r(θ) graph; θ slider | main control: the sprinkler arm's angle (`K.handle` around the centre); the r(θ) graph under it also scrubs (`K.scrub`); the slider goes |
| Thin sectors shaded, twice traced darker; current slice ½r²Δθ highlighted | kept |
| r < 0 on the opposite ray | kept, labelled "r < 0: opposite side" |
| r(θ) graph tinted where moving away (r and dr/dθ share a sign), hatched where moving toward | two solid tints (no hatching) |
| Remembered pick (`apcalcbc_polar-lab_pick` in localStorage) | kept |
| Test yourself: drill (contexts coords, area, between: points, dr/dθ, toward or away, dy/dx, limits, setup, value); record ids `polar-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a lawn sprinkler at the origin of the polar grid; its arm turns with θ and its jet reaches exactly r;
  the lawn it has watered darkens slice by slice (the swept area), and grass watered twice is darker still. Under it,
  r against θ on graph paper with the same θ. Tab 2: two sprinklers' reach shown together; only the strip between
  them (outer jet wet, inner dry patch) fills.
- **Main control:** the arm's knob; arrows step θ by π/24; Home and End go to the region's limits.
- **Animates:** the jet sweeps, slices darken; when r < 0 the jet flips to the opposite side (animated swing) with
  its label; the area number on the lawn counts up.
- **Cause line:** "θ = π/3 → r = 1.5 → slice ½(1.5)²dθ → area so far" with the number; "r and dr/dθ both + → moving away from
  the sprinkler".
- **Takeaway:** "Area = ½∫ r² dθ over the angles that trace the region once."
- **Outside:** 2 tabs, purpose line, curve picker, Show me how, cause line, Sweep: 4 controls, about 22 words.

## Science to verify
Area ½∫ r² dθ with the ½ and the square in every setup; area between ½∫(R² − r²)dθ; intersection angles; one petal of
r = cos 3θ from −π/6 to π/6; double counting when a region is traced twice; r < 0 plots on the opposite ray; dy/dx =
(dr/dθ sin θ + r cos θ)/(dr/dθ cos θ − r sin θ); moving away when r and dr/dθ share a sign (CED 9.7 to 9.9;
`docs/apcalcbc-authoring-guide.md` polar notation; OpenStax Calculus Volume 2 §7.3, 7.4). θ in radians; polar arc
length is not in the CED.

## Reuse
`ApCalcTools.studioKit2` (AB's), `"kit2": true` in `calculus-bc/data/pages.json`; `K.handle` (a point on a circle,
as Precalculus Unit circle will use), `K.scrub`, `K.tabs`, `K.cause`. Precalculus Polar graphs uses the same
sprinkler idea in its own course (`pcalc-polar-graphs.md`); each course draws its own (no cross course code). AB's
build byte-identical, then `build-apcalcbc --check`.

## Risks reviewers will likely block on
- The water must stay inside the swept sector (particles inside what contains them), including r < 0 flips.
- Thin sectors at CPU x4: draw the swept area as one path rebuilt per frame, not hundreds of nodes.
- "Twice traced darker" must match the region choice, or the darker strip reads as an error.
- Labels around a small rose at 360 px.
