# AP® Physics 1 tools in the standard frame (F3, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. `physics/assets/tools/phys-tools.js` (forked from chem) got the same changes as
`chem-tools.js` (`docs/tools-frame-notes/apchem.md`, "What every chem tool got"): `std: true` with the hero's one
line, modes in the bar, "?" and the menu ("Settings and numbers") open the second sheet, the explore task (question
from `STD_ASK`, the tool's "Start here" cue as the line on what to do), Test yourself with the kind dropdown on the
stage, the problem as the side panel's head, the step hint as the ladder's first rung and Show the answer after one
wrong Check, and the finished card (score, New problem, Full explanation with Keep going, Review your steps, the
lesson). Locked Premium tools open in the standard bar (`data-ls-std` from `phys-core.js`).

## Per tool (Explore, Test yourself unless noted)
- **Scaling drills**: Relation select (31 relations) is now the stage dropdown ("25 of 31"); sliders, Reset to × 1 unchanged.
- **Motion graphs**: Drag / Set v and a / Match segmented switch, Start over, Example run unchanged (three distinct ways to drive the cart).
- **Lab design** (Premium): Take a reading, Take 6, Experiment row unchanged.
- **Projectile lab** (Premium): One ball / Compare / Moving cart switch, sliders, Launch unchanged; barrel drag first-run hint.
- **Free-body diagrams**: Scene select (11 scenes) is the stage dropdown; hand slider, Run, Components unchanged. Test yourself is its own three-step quiz (draw the diagram, pick Newton's second law, solve): Scenes to practice is the stage dropdown; the problem heads the side panel under its scene's name; the numbered marks on the wrong arrows stay on the drawing; finished card added.
- **Energy bar charts** (Premium): Skater / Launcher / Ramp / Lift and the system toggles unchanged.
- **Collision lab** (Premium): Collision / Explosion and the bar views, Crash, Reset unchanged.
- **Torque balance** (Premium): Balance / Inertia race, + masses, Release, Hold level, Tips unchanged.
- **Rotation lab** (Premium): Rolling race / Spinning stool / Orbit, Race, Reset unchanged.
- **Oscillator lab** (Premium): Spring ↔ / Spring ↕ / Pendulum, what to change (m, k, A), graph chips, Play unchanged.
- **Fluids tank** (Premium): Scene select (5 scenes) is the stage dropdown; Fluid and Object selects stay in the dock (settings of the scene; Fluid now has the row to itself), Drop it in, Push it under unchanged.

## Judgment notes
- The 2 to 4 choice segmented switches (scenes of a lab) stay segmented, as the standard allows; only selects of five or more scenarios became the stage dropdown.
- Free-body diagrams Test yourself has no hints to ladder: its Show the answer already appears only after a wrong Check.

## New copy for the accuracy check
Explore questions (`STD_ASK` in `phys-tools.js`): collision-lab "What is conserved when two carts collide?"; energy-bar-charts "Where does the energy go?"; fluids-tank "Why does an object float or sink?"; lab-design "What should you plot to get a straight line?"; free-body-diagrams "Which forces act on the object, and do they balance?"; oscillator-lab "What sets the period of an oscillator?"; motion-graphs "How do the position, velocity and acceleration graphs fit together?"; projectile-lab "How does a launch split into horizontal and vertical motion?"; scaling-drills "If one quantity doubles, what happens to the other?"; rotation-lab "Which shape wins a rolling race, and why?"; torque-balance "Where must a mass hang to balance the stick?".
Free-body diagrams finished card: "Diagram, equation and answer all right on the first try."

## Questions for the owner (nothing removed)
1. Same as chem: the hidden selects behind the new dropdowns stay in the page; delete later?
