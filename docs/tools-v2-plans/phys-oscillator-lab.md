# Plan: AP® Physics 1, Oscillator lab (tools v2)

**Tool and page:** `physics/tools/oscillator-lab.html`; `physics/assets/tools/oscillator-lab.js` (456 lines) and
`.css`, `physics/assets/tools/math/oscillator-lab.js`, data `physics/data/tools/oscillator-lab.json` (contexts
`period-spring-pendulum`, `what-changes-period`, `maxima`, `shm-energy`, `read-xt`). Premium. Rollout row 79,
group P, wave 17, size rework (12 panel controls).

**The one idea:** mass and stiffness set the period; how far you pull it does not. Two tabs: "Spring" (cart on a
horizontal spring; the hanging spring as a quiet chip) and "Pendulum" (length and g set the period; mass does not).

## Research
- PhET Masses and Springs and Pendulum Lab (known, group row): pull the mass and let go, period timer, energy bars;
  take drag to set amplitude and the stopwatch.
- The strip chart recorder on a cart (classroom demo, known): a pen on paper tape draws x against t; take it as the
  graph that is part of the picture. Builder: open the two PhET sims.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Systems Spring ↔, Spring ↕, Pendulum | Tabs Spring, Pendulum; the vertical spring as a quiet chip in the Spring tab, log it |
| Drag the cart, the mass or the bob (amplitude, angle) | Main control in both tabs; it oscillates from release at once |
| Variable sliders (mass, k, length, amplitude) | Spring: mass blocks (quiet tap), spring chips soft or stiff (quiet); Pendulum: length handle on the string (quiet) |
| Planet picker (g) | Pendulum: quiet chip (Earth, Moon, Mars) |
| Graphs x, v, a against t | The strip chart (x against t) on the picture; v and a as a quiet toggle on the strip; full graphs in "?" |
| Play, Release again | Release is the drag; Watch it replays; Start over |
| Energy readout (K, U_s, U_g) | "?" and the cause line; bars only in Test yourself |
| Drills Period and frequency, What changes the period, Where speed and acceleration peak, Energy at a point, Read an x against t graph; ids `oscillator-lab:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged |

## Design
- **Picture (Spring):** a cart on a low friction track tied to a coil spring on a wall bracket; a pen on the cart
  draws on a paper tape that scrolls under it (the x against t trace); a stopwatch counts each period.
- **Main control:** drag the cart and let go: it oscillates, the pen draws, the stopwatch shows T. Dragging farther
  draws a taller wave with the same spacing; adding mass widens the spacing.
- **Pendulum:** a bob on a string from a clamp, a trace on a sand tray under it (or the same tape); length handle.
- **Cause line:** "mass ×2 → T ∝ √m → period 1.26 s → 1.78 s; amplitude changes nothing".
- **Takeaway:** "Bigger swings, same period: only mass and stiffness (or length and g) change it."
- **Outside the picture:** 2 tabs, purpose line, Show me how, cause line, Start over.

## Science to verify
- T_s = 2π√(m/k), T_p = 2π√(L/g) (small angle), x = A cos(2πft) (equations sheet, CED 7.3). Large pendulum angles
  break the small angle period: cap the drag at about 15° or show the honest longer period and say so in "?".
- g on Moon 1.62, Mars 3.71 m/s² (NASA fact sheets).
- Energy conserved in the ideal oscillator; no damping unless stated. No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2). Kit: `K.tabs`, `K.drag`, `K.tap`,
`K.player`, `K.cue`, `K.cause`. `ApPhysScene.loop`.

## Risks reviewers will likely block on
- The pen trace must come from the drawn cart position frame by frame.
- The stopwatch and the cause line period must match the trace spacing (measure in the sweep).
- Perf: tape scrolling and the spring coil redraw at x4 throttle; one path updated, not rebuilt.
- The loop stops when the tab hides; a phone run scrolls the cart into view.
