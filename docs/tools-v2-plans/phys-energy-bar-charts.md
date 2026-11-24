# Plan: AP® Physics 1, Energy bar charts (tools v2)

**Tool and page:** `physics/tools/energy-bar-charts.html`; `physics/assets/tools/energy-bar-charts.js` (660 lines)
and `.css`, `physics/assets/tools/math/energy-bar-charts.js`, data `physics/data/tools/energy-bar-charts.json`
(contexts `kinetic`, `work`, `stores`, `conservation`, `power`). Premium. Rollout row 62, group P, wave 17, size
rework.

**The one idea:** energy moves between kinds and the total stays (unless a force from outside the system does work).
Tabs, one idea each: "Skate park" (K and U_g trade), "Spring" (U_s to K to U_g), "Friction" (energy leaves as
thermal energy; who is in the system decides the bars), "Lift" (work by a force and power).

## Research
- PhET Energy Skate Park (known, group row; `phet.colorado.edu/en/simulations/energy-skate-park`): drag the skater
  onto the track, bar charts live; take the drag to start and the live bars beside the skater.
- The Physics Classroom energy bar chart (LOL diagram) pages (known): bars before and after with work in between;
  take the before and after layout for Test yourself.
- Pivot Interactives energy videos (known): real footage. Builder: open the first two.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Scenes Skater, Ramp, Launcher, Lift | Tabs Skate park, Friction (the ramp), Spring (the launcher), Lift |
| Start height slider, Play, Reset, Time slider | Every tab: drag the object to its start (main control); the motion runs at once; time bar and Watch it |
| Masses (skater, block, box), ramp height, spring constant k, compression, friction μ (track, floor), lifting speed | Each tab: one main handle, one quiet (mass chip); the rest in ⋯ settings or Test yourself setups, log each |
| g 9.8 or 10 | ⋯ menu; "?" says which |
| System choice (always in the system: object; cable always outside) | Friction and Lift tabs: one quiet tap to put Earth or the floor in the system; bars change kind |
| Drills Kinetic energy and ΔK, Work by a force, Work by friction, Build the bar charts, Find a speed, Find a height, Power; ids `energy-bar-charts:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture:** a skate park half pipe at dusk (concrete with depth, coping, a skater drawn as a person with a board);
  beside the track, the bar chart drawn as three upright glass tubes filled with coloured liquid (K, U_g, total)
  so energy looks like an amount that flows from tube to tube.
- **Main control:** drag the skater to any point on the track and let go: she rides at once; the tubes empty and fill
  in step with her height and speed. Friction tab: the track roughens, a fourth tube "thermal" fills and the
  skater's highest point drops each pass.
- **Animates:** the ride, the liquids, the spring compressing and releasing, the lift's cable.
- **Cause line:** "at 4.0 m → U_g 2.4 kJ → at the bottom all K → 8.9 m/s".
- **Takeaway:** "With no friction the total tube never changes."
- **Outside the picture:** 4 tabs, purpose line, Show me how, time bar, cause line.

## Science to verify
- K = ½mv², ΔU_g = mgΔy, U_s = ½kx², W = Fd cosθ, P = ΔE/Δt (equations sheet); total energy constant without
  friction to 0.1% in the integrator.
- Thermal energy only qualitative where the CED excludes heat (guide exclusion "heat quantitatively"): show it as
  energy that left the mechanical bars, no temperature.
- Spring and friction values plausible; g stated (9.8 default, 10 accepted). No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.drag` along a track
(`track` option), `K.scrub`, `K.player`, `K.tap`, `K.cue`, `K.cause`, `K.speed`. `ApPhysScene.loop` for the run.

## Risks reviewers will likely block on
- Tube heights must equal the energies at each frame (proportions rule), including during a drag back.
- Four tabs plus tube labels at 360 px: tubes beside the pipe may need to sit under it.
- Perf: the ride at 60 fps with liquid fills at x4 throttle.
- Leaving mid ride must stop the loop (`ApPhysScene.loop.stop`).
