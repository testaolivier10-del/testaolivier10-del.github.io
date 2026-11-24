# Plan: AP® Calculus AB, Related rates

## Tool and page
`calculus/tools/related-rates.html`; scripts `calculus/assets/tools/related-rates.js`,
`calculus/assets/tools/math/related-rates.js` (`ApCalcMath.relatedRates`), `related-rates.css`; data
`calculus/assets/tool-data/related-rates.json`. **Premium.** Rollout row 95, group G, wave 16, marked restyle
(control on the picture; a panel slider and Play repeat it).

## The one idea
When two quantities are linked by an equation, their rates are linked too: move one, and the other's rate follows
from the equation at that moment.

## Research
- GeoGebra "Related Rates: Sliding Ladder" (https://www.geogebra.org/m/PAfhK4Zd): drag the foot, the top slides
  down. Take: the drag on the real object.
- dmccreary "Ladder problem explorer" MicroSim (https://dmccreary.github.io/calculus/sims/ladder-problem-explorer):
  the top's speed grows as it nears the floor. Take: arrows whose length is the rate.
- UW "Sliding ladder" Curiosity Lab (https://sites.math.washington.edu/~aloveles/CuriosityLab/projects/math124-sliding-ladder.html):
  predict first. Leave it for Test yourself.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Five scenes: sliding ladder, filling cone, streetlight shadow, spreading ripple, rising balloon | scene picker beside "Show me how" |
| Drag the moving part (or arrow keys on it) to choose the moment (cue key `apcalc-related-rates-drag`) | main control (`K.handle` on the scene's moving part) |
| Driver rate slider (bottom moves out at, water flows in at, walks away at, radius grows at, balloon rises at) | the given rate arrow's own knob on the picture: drag the arrow longer or shorter (quiet) |
| Play lets time run | "Run" (secondary) |
| Watched quantities per scene (height of the top, angle with the ground, depth, radius of the surface, length of the shadow, tip of the shadow to the post, area, circumference, height, angle of elevation, distance from the observer) | tap a labelled quantity on the picture to watch it (`K.tap`); one watched at a time |
| Every quantity and its rate read live beside the scene | on the picture, beside what they name (1 to 3 word labels), only the driver and the watched one |
| Blue arrow for the given rate, crimson for the caused rate | kept |
| Why (the chain of equations with this moment's numbers), Details (watched rate against the driver, a graph; every number) | "?" |
| Test yourself: drill (contexts ladder, ripple, shadow, cone, balloon: relation, d/dt, values, rate with sign, meaning), each with the scene drawn; record ids `related-rates:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** each scene drawn as the real thing at the flagship level: a wooden ladder against a brick wall on a
  floor; a cone shaped tank filling with water; a person walking from a streetlight with the shadow on the pavement;
  a stone's ripple spreading on a pond; a balloon rising over a field with an observer. One given rate arrow (blue)
  on the driver, one caused rate arrow (crimson) on the watched quantity; arrow lengths are the rates' sizes.
- **Main control:** the driver part (the ladder's foot, the water level, the walker, the ripple's edge, the balloon).
- **Animates:** the scene moves with the drag; the crimson arrow grows or shrinks; Run lets time pass at the given
  rate; changing the watched quantity moves the crimson arrow to it.
- **Cause line:** "x = 6 ft → y = 8 ft → dy/dt = −(x/y)·dx/dt = −1.5 ft/s"; "the top falls faster as it nears the
  floor".
- **Takeaway:** "The rates are linked by the equation, not by a fixed ratio."
- **Outside:** purpose line, scene picker, Show me how, cause line, Run: 3 controls, about 20 words.

## Science to verify
Ladder x² + y² = L², x dx/dt + y dy/dt = 0; cone V = (1/3)πr²h with r/h fixed by similar triangles; shadow by
similar triangles (the tip's rate vs the shadow's length rate); ripple A = πr², C = 2πr; balloon tan θ = h/d and the
distance √(h² + d²) (CED 4.4 and 4.5; OpenStax Calculus Volume 1 §4.1). Signs: a decreasing quantity has a negative
rate, stated with "is decreasing at". Units on every rate. The ladder top's speed has no finite limit as y → 0: stop
the scene before y = 0 and say so in "?".

## Reuse
`ApCalcTools.studioKit2`, `K.handle`, `K.tap`, `K.drag` (rate arrow), `K.cause`; the model's scenes and numbers. AB
build byte-identical.

## Risks reviewers will likely block on
- Five drawn scenes at flagship level: the main cost; weight budget for the course page (measure each).
- Arrow lengths must equal the shown rates at every frame, including Run and reversed drags.
- Labels on small scenes (cone, ripple) at 360 px: at most two numbers on the picture.
- The ladder near the floor: the knob stops before y = 0 (the rate grows without bound) and the label says why.
