# Plan: AP® Physics 1, Fluids (tools v2)

**Tool and page:** `physics/tools/fluids-tank.html`; `physics/assets/tools/fluids-tank.js` (628 lines) and `.css`,
`physics/assets/tools/math/fluids-tank.js`, data `physics/data/tools/fluids-tank.json` (scenes `float`, `scale`,
`pressure`, `pipe`, `hole`; contexts `density`, `pressure`, `buoyancy`, `flow`). Premium. Rollout row 73, group P,
wave 17, size rework.

**The one idea:** an object floats when the buoyant force (the weight of fluid it pushes aside) matches its weight.
Tabs, one idea each: "Buoyancy" (float, sink, and the spring scale that reads less under water), "Pressure" (pressure
grows with depth; a hole lower down squirts faster), "Flow" (a narrower pipe makes the fluid faster).

## Research
- PhET Buoyancy and Density (known, group row): drag blocks into a pool, the force arrows and the water level answer;
  take the drag in.
- PhET Under Pressure and Fluid Pressure and Flow (known): a pressure gauge on a probe, a pipe with a narrowing; take
  the gauge to drag and the pipe handle.
- The Physics Classroom fluids pages (known). Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Scenes float, scale, pressure, pipe, hole (Scene picker) | Tabs: Buoyancy (float and scale), Pressure (pressure and hole), Flow (pipe); log the grouping |
| Drag the object into the fluid; Drop it in, Push it under; Lower the object (depth of its bottom) | Buoyancy: main control, drag the block down into the tank (it floats where forces balance on release; a held block reads on a spring scale) |
| Object and fluid dropdowns | Buoyancy: quiet chips (wood, ice, aluminium; water, oil, salt water) |
| Depth of the probe | Pressure: main control, drag the gauge |
| Water level, depth and height of the hole | Pressure: quiet handle on the hole |
| Speed in the wide part, diameter of the narrow end, rise of the narrow end | Flow: main handle on the narrow end's diameter; quiet rise |
| Views Tank, Forces, Graph | Picture with force arrows on the object; graphs to "?" |
| Drills Density, Pressure at depth, Buoyant force, Floating fraction, Scale reading, Continuity, Bernoulli, Exit speed; ids `fluids-tank:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a glass tank of water on a lab bench (meniscus, light caustics, depth tint), a block hanging from a
  spring scale on a stand; force arrows on the block (F_g, F_b from `phys-scene.js`); the water level rises by the
  displaced volume.
- **Main control:** drag the block down. The submerged part grows, F_b grows, the scale reading falls; a lighter
  block let go bobs and floats at the depth where F_b = F_g.
- **Pressure:** a gauge on a rod; dragging deeper turns its needle; a hole squirts a stream whose range grows with
  depth. **Flow:** a transparent pipe with dye streaks; squeeze the narrow end, the streaks speed up there.
- **Cause line:** "block 60% under → F_b 5.9 N = F_g 5.9 N → floats".
- **Takeaway:** "It floats once it has pushed aside its own weight of water."
- **Outside the picture:** 3 tabs, purpose line, Show me how, cause line, quiet chips.

## Science to verify
- F_b = ρ_fluid V g, P = P₀ + ρgh, A₁v₁ = A₂v₂, Bernoulli, Torricelli v = √(2gh) (equations sheet; ideal fluid only:
  guide exclusion "nonideal fluids").
- Densities: water 1000, salt water about 1025, oil about 900, ice 917, wood 500 to 700, aluminium 2700 kg/m³
  (CRC or Engineering Toolbox).
- Water level rise equals displaced volume over tank area. g stated. No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.drag`, `K.handle`,
`K.tap`, `K.cue`, `K.cause`. `phys-scene.js` arrows and force labels.

## Risks reviewers will likely block on
- Arrow lengths match the forces; the water level matches the displaced volume (measure).
- The block must stay inside the tank and the stream inside the stage at 360 px.
- Bobbing must settle (no endless oscillation) and stop when the tab hides.
- Five old scenes into three tabs: list every moved control in the brief and owner log.
