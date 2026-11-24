# Plan: AP® Physics 1, Free body diagrams (tools v2)

**Tool and page:** `physics/tools/free-body-diagrams.html`; `physics/assets/tools/free-body-diagrams.js` (863 lines)
and `.css`, `physics/assets/tools/math/free-body-diagrams.js`, data `physics/data/tools/free-body-diagrams.json`
(contexts `basic`, `accel`, `friction`, `spring`, `circular`, `buoyancy`; part topic `fbd`); scene helpers
`phys-scene.js`. Free. Rollout row 74, group B, wave 5, size rebuild (the forces are drawn for the student today).

**The one idea:** each force has an agent that touches the object (or Earth), and the forces' balance decides the
motion. Two tabs: "Push the crate" (change a real push; the drawn forces respond and the crate's motion follows) and
"Draw it" (the student draws every force from the dot, ungraded, and compares).

## Research
- [The Physics Classroom, Free Body Diagrams interactive](https://www.physicsclassroom.com/interactive/newtons-laws/free-body-diagrams):
  pick a situation, add arrows of the right type, feedback per arrow; take one arrow per type and the agent names.
- PhET Forces and Motion: Basics (known, group row): push a crate, friction answers, the crate moves when forces do
  not balance; take tab 1 whole.
- Alchemie Mechanisms (group row, known): draw by dragging from a source to a target with forgiving snapping; take
  the drag gesture for `K.draw`. Builder: open all three.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Explore: scenes with a slider (the forces already drawn), Run, Components toggle | Tab 1: the crate scene with the push as a draggable arrow tip (main control); other scenes as quiet chips (crate on floor, block on ramp, hanging lamp, elevator); Components to "?" (whole forces only on an FBD, guide rule), log it |
| Draw editor: add force by type, rotate ⟲ ⟳ 5°, longer/shorter, remove, done | Tab 2: drag from the dot to draw (direction snaps to 5°, length free), tap the arrow to change type or delete; undo |
| Check my diagram, Show the answer, New problem, Next: Newton's second law, Review your steps, Full explanation | Test yourself "Problems", same grading |
| Scenes to practice / Any scene | Test yourself setting |
| Record ids `free-body-diagrams:<ctx>` items, `?seed=`, `#quiz`, `#fbx-d` | unchanged |

## Design
- **Picture (tab 1):** a wooden crate on a warehouse floor with a worker's gloved hands pushing (or a rope pulling),
  the floor texture showing friction; arrows from the crate's center dot: F_g down, F_N up, push, friction, each
  labelled with type and agent on a pill ("F_N, floor on crate").
- **Main control:** drag the push arrow's tip. Static friction grows to match until its limit, then the crate slides
  and kinetic friction drops to its value; the crate's velocity shows as motion (and a small velocity arrow beside,
  not on the FBD).
- **Tab 2:** the same scene with only the dot; the student drags from it to draw arrows and taps a type chip on the
  picture; the touching surfaces glow when an arrow names them as agent. A quiet "Show the forces" overlay lays the
  real set beside the student's (no grade, no score).
- **Cause line (tab 1):** "push 120 N > friction limit 98 N → net 22 N right → crate speeds up".
- **Takeaway:** "Balanced forces: no change in motion; unbalanced: it speeds up, slows or turns."
- **Outside the picture:** 2 tabs, purpose line, Show me how, cause line, scene chips (quiet).

## Science to verify
- μs and μk values plausible for wood on concrete (Engineering Toolbox or a physics handbook); f_s ≤ μs F_N.
- The authoring guide's FBD rules: a dot, whole forces only, type and agent labels with `ApPhysScene.forceLabel`, no
  net or centripetal arrow, lengths in proportion.
- g: the scene says 9.8 m/s² (equations sheet) and accepts 10 in Test yourself (`gAlt`).
- No OpenStax (AP® Physics 1 spec).

## Reuse
**First AP® Physics 1 tool on kit2 in rollout order: it adds the adapter.** `ApPhysTools.studioKit2` in
`physics/assets/tools/phys-tools.js` on the `ApChemTools.studioKit2` pattern (stage, ref, parts, start, onShow); the
`kit2` flag in `scripts/build-apphys.mjs` (the tool page head and `site` list, as `build-apchem.mjs` does near its
line 965); `"kit2": true` in `physics/data/pages.json`. New kit piece `K.draw` (shared with Graph builder; whoever
starts first builds it). `phys-scene.js` arrows and labels.

## Risks reviewers will likely block on
- Five force pills around one crate at 360 px: labels must clear each other and the arrows by 4 px.
- Arrow lengths must match the magnitudes (measure in the sweep).
- Drawing on touch at the scrolled end of the page must not scroll the page.
- The adapter must leave every other physics tool unchanged (run the physics tests and `check-tool-use`).
