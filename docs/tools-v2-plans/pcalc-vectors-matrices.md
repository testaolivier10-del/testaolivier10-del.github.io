# Plan: AP® Precalculus, Vectors and matrices

## Tool and page
`precalculus/tools/vectors-matrices.html`; scripts `precalculus/assets/tools/vectors-matrices.js`,
`precalculus/assets/tools/math/vectors-matrices.js` (`ApPrecalcMath.vectorsMatrices`), `vectors-matrices.css`; data
`precalculus/assets/tool-data/vectors-matrices.json`. **Premium**, Unit 4 "beyond the exam" (the build adds the
notice). Rollout row 129, group G, wave 23, marked rework (three lessons; 25 controls).

## The one idea (three tabs)
1. **Moving point:** a parametric path is x(t) and y(t) together; over an interval the displacement has Δx and Δy
   legs, and their average rates.
2. **Adding vectors:** u + v is one trip after the other (tip to tail), the parallelogram's diagonal.
3. **A matrix moves the plane:** its columns are where (1, 0) and (0, 1) land, and |det A| is how areas scale.

## Research
- PhET "Vector Addition" (https://phet.colorado.edu/en/simulations/vector-addition): drag vector tips, the sum
  follows, components shown. Take: tip dragging and tip to tail.
- 3Blue1Brown, Essence of linear algebra ch. 3 and 6 (https://www.3blue1brown.com/topics/linear-algebra): the grid
  carried smoothly by a matrix, area scaled by the determinant. Take: the smooth carry of the whole grid.
- GeoGebra "2×2 matrix transformation" (https://www.geogebra.org): column vectors as draggable. Take: drag the
  columns, not type the entries.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Views Motion / Vectors / Matrices (switch at the top of the dock) | the three tabs |
| Motion: paths line, toss, circle, clock, ellipse; Play (cue key `apprecalc-vectors-matrices-play`), slider, arrow keys on the stage | tab 1: path picker; main control the boat (`K.handle` on the path); "Run" (secondary); the slider goes |
| x(t) and y(t) graphs beside, the point orange in all three | kept, small, under the map |
| Interval: P(t₁) to P(t₂), the displacement arrow, Δx and Δy legs (in the x and y graph colours), secants for the average rates | tab 1, a quiet second knob for t₂ |
| Vectors: drag the tips of u (blue) and v (pink); result u + v (parallelogram), u − v, or k·u (slider) | tab 2: tips dragged (main control); sum, difference, k·u as a three way toggle; k as a quiet knob on u |
| Matrices: presets rotate, reflect, stretch, shear, general, flat, or your own 2 by 2; slider or Play carries every point | tab 3: preset picker; main control the two column tips (blue, pink) dragged; "Carry" (secondary) animates; your own entries in "?" |
| Unit square to parallelogram with area |det A|; "Undo with A⁻¹" | kept; "Undo" (secondary) |
| A draggable point and its image (orange) | kept, quiet |
| Test yourself: drill, 5 contexts (param, prates, vectors, transform, inverse); record ids `vectors-matrices:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** a harbour map: a boat follows the path; its wake is the curve; Δx and Δy legs drawn as an
  east and a north leg of the trip.
- **Tab 2 picture:** a river crossing: the boat's own heading (u) and the current (v) as arrows; the boat's real
  track is u + v, tip to tail, the parallelogram faint behind.
- **Tab 3 picture:** a tiled floor with a small drawn house on it; dragging the column tips carries every tile and the
  house (animated), the unit tile becomes a parallelogram labelled with its area |det A|; "flat" (det 0) squashes the
  house onto a line, shown.
- **Main control:** tab 1 the boat, tab 2 the tips, tab 3 the columns.
- **Animates:** every carry and morph is a smooth interpolation (not a swap); undo plays it back.
- **Cause line:** tab 1 "t from 1 to 3 → Δx = 4, Δy = −2 → average rates 2 and −1"; tab 2 "u ⟨3, 1⟩ + v ⟨0, 2⟩ = ⟨3,
  3⟩"; tab 3 "columns ⟨2, 0⟩ and ⟨1, 1⟩ → det 2 → areas doubled".
- **Outside:** 3 tabs, purpose line, picker, Show me how, cause line, one secondary button: 4 controls, about 22
  words.

## Science to verify
Parametric position and average rates Δx/Δt, Δy/Δt and the slope Δy/Δx; vector sum, difference and scalar multiple;
magnitude and direction; 2×2 matrices as linear transformations, columns as images of the basis vectors, det A as the
signed area factor (negative flips orientation), A⁻¹ exists iff det A ≠ 0, composition order (CED Unit 4, 4.1 to 4.14;
OpenStax Precalculus §8.8 vectors and §9.5 to 9.7 matrices; OpenStax College Algebra §7.5 to 7.7). Unit 4 is beyond the
exam: keep the notice; no exam style claims.

## Reuse
`ApPrecalcTools.studioKit2`, `"kit2": true` in `precalculus/data/pages.json`; `K.handle` (2D tips), `K.tabs`,
`K.tap`, `K.cause`; `ApPrecalcPlot.loop`. `build-apprecalc --check`.

## Risks reviewers will likely block on
- Three tabs with three scenes: weight and the most work of the Precalculus group.
- A reflection matrix (negative det): the house must visibly flip, and the label say "flipped".
- The flat matrix: the irreversible looking squash must undo cleanly with Undo (A⁻¹ does not exist: say "cannot undo:
  det 0" and offer Reset instead).
- Tip handles near each other on a phone (two tips, two columns): 44 px targets, tags clear.
