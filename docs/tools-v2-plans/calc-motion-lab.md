# Plan: AP® Calculus AB, Motion lab

## Tool and page
`calculus/tools/motion-lab.html`; scripts `calculus/assets/tools/motion-lab.js`,
`calculus/assets/tools/math/motion-lab.js` (`ApCalcMath.motionLab`), `motion-lab.css`; data
`calculus/assets/tool-data/motion-lab.json`. **Premium.** Rollout row 94, group G, wave 16, marked rework (time
slider in the panel; two rows of sub switches).

## The one idea (two tabs)
1. **Speeding up or slowing down:** the car speeds up when v and a have the same sign and turns around where v
   changes sign.
2. **Distance from velocity** (Unit 8): the signed area under v is the displacement; the area under |v| is the
   distance driven.

## Research
- PhET "The Moving Man" (https://phet.colorado.edu/en/simulations/moving-man): a man on a sidewalk with linked x,
  v and a graphs; drag him and the graphs record. Take: the person or car is the control; graphs below share time.
- Desmos "Particle motion" activities (https://www.desmos.com/calculator, search "particle motion"): a dot on a
  line with its v graph. Take: tinting where speeding up.
- 3Blue1Brown, Essence of calculus ch. 2 and 8 (https://www.3blue1brown.com/topics/calculus): distance as area under
  the velocity graph. Take: the area filling as time runs.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Motions: cubic, parabola, back and forth, out and back (position given); velocity graph, velocity a parabola, velocity no antiderivative (velocity given) | motion picker beside "Show me how": position given in tab 1, velocity given in tab 2 |
| "Position given" / "Velocity given" (velocity shown once Unit 8 is published) | tabs 1 and 2; tab 2 appears only once Unit 8 is published (same check) |
| Play (cue "Press Play, or drag across the graphs") | "Drive" (secondary) |
| Drag across the graphs; time slider | main control: the time knob on the graphs' shared axis (`K.scrub`); the slider goes |
| Speeding up tint, slowing down hatch, the same on every graph | speeding up tint kept; the hatch becomes a second solid tint (hatching reads as texture noise at 360 px) |
| Direction changes marked | kept: a turn around flag on the road |
| The car faces its direction, brake lights when slowing, a dot trail for spacing | kept, redrawn at the flagship level |
| Displacement and total distance counted as time runs (velocity given) | tab 2: two odometers on the dashboard: "net" and "driven" |
| Remembered motion (`apcalc_motionlab_motion` in localStorage) | kept |
| Test yourself: drill (contexts deriv, speed, turn, dist, graph); record ids `motion-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a straight road with mile markers (the x axis of position), the car on it with its dot trail, brake
  lights and turn signals; under it, v(t) and a(t) on graph paper with one shared time axis (tab 1), or v(t) with its
  area filling (tab 2). The road and the graphs agree on every frame.
- **Main control:** the time knob dragged along the graphs (and the car itself: dragging the car picks the nearest
  time on the current pass, so it never jumps to another pass).
- **Animates:** the car moves, turns around with a short swing, brake lights fade in; the tint grows behind the time
  knob; tab 2's area fills above and below the axis in two colours while the odometers count.
- **Cause line:** tab 1 "v = −2, a = 3 → opposite signs → slowing down"; tab 2 "area +6, area −2 → displacement 4
  → distance 8".
- **Takeaway:** "Speeding up means v and a share a sign, not a > 0."
- **Outside:** 2 tabs, purpose line, motion picker, Show me how, cause line, Drive: 4 controls, about 22 words.

## Science to verify
v = x′, a = v′; speeding up iff v·a > 0; direction changes where v changes sign (not only where v = 0); displacement
∫ v dt, distance ∫ |v| dt, x(t) = x(0) + ∫₀ᵗ v(s) ds (CED 4.2 and 8.1, 8.2; OpenStax Calculus Volume 1 §3.4 and
§5.4). "No antiderivative" uses a calculator value: the tool's numeric integral must match to the shown places.
Units on every rate.

## Reuse
`ApCalcTools.studioKit2`, `K.scrub` (time on the graphs), `K.tabs`, `K.cause`; the Tangent tracer's car drawing for
the car. Parametric motion in BC reuses the same car idea (`calcbc-parametric-motion.md`). AB build byte-identical.

## Risks reviewers will likely block on
- Dragging the car on a back and forth motion must stay on the current pass (no time jump), tested on fast drags.
- The odometers and the area must come from the drawn frame during Drive and reversed scrubs.
- Brake lights and the "slowing" tint must switch on the same frame as the sign change.
- Three stacked panels on a phone: the road first, graphs at least 120 px each, labels 11 px.
