# Plan: AP® Calculus AB, Accumulation

## Tool and page
`calculus/tools/accumulation.html`; scripts `calculus/assets/tools/accumulation.js` (with its tank SVG),
`calculus/assets/tools/math/accumulation.js` (`ApCalcMath.accumulation`), `accumulation.css`; data
`calculus/assets/tool-data/accumulation.json`. **Premium.** Rollout row 63, group G, wave 16, marked restyle (control
on the picture; a panel slider repeats it; 91 words on the stage; two sub modes).

## The one idea (two tabs)
1. **Area so far:** g(x) is the signed area under f from a to x, so g grows where f is above the axis and its slope
   is f(x).
2. **Net change:** the area between a and b equals how much g rose from a to b.

## Research
- PhET Calculus Grapher (https://phet.colorado.edu/en/simulations/calculus-grapher): draw f, see its integral grow
  with a moving cursor. Take: one cursor across linked graphs, area tinted as it is swept.
- Math Insight "The fundamental theorem of calculus" applets (https://mathinsight.org): a point dragged along x fills
  the area and draws the accumulation function. Take: the pen that draws g only where x has been (as the Tangent
  tracer draws f′).
- Desmos accumulation activities (https://www.desmos.com/calculator, "accumulation function"): leave the slider.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Drag x along the axis of f (cue "Drag x along the axis") | main control, tab 1 (`K.handle` on the x axis) |
| Panel slider repeating x | gone (keys on the knob) |
| Two tone signed area | kept: water above the axis fills, below drains (two colours) |
| Graph of g drawing itself; tangent to g with slope f(x) | the pen on the lower graph paper; the tangent tick at the pen |
| View switch Build g(x) / Net change | the two tabs |
| Net change: two limits, area = rise of g, shown as a bar | tab 2: two knobs a and b; the rise drawn on g as a vertical bracket |
| Lower limit a | quiet knob in tab 1 |
| Graph picker: 3 graphs (segments and a semicircle, a semicircle below the axis, line segments only), 2 formulas (cosine, a parabola), your own formula | curve picker beside "Show me how"; your own formula behind "Type your own…" in the picker (opens "?", forgiving input) |
| Unit 8 tank: rate in R(t), rate out D(t), A(0) + ∫(R − D) | picker item "Water tank" (shown when Unit 8 is published), same two tabs |
| Why, Details (exact areas, values of g) | "?" |
| Test yourself: drill, kinds values, behavior, derivs, chain, netgraph, tank; record ids `accumulation:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a rain barrel story. f is the flow rate of a pipe drawn as the graph's ink line; the region swept
  between the axis and f fills with water (blue above the axis: flowing in; brown tinted below: draining out). Beside
  it, a drawn barrel whose water level is g(x), and under the rate graph the graph paper where a pen draws g. The
  barrel, the pen height and the swept area agree on every frame.
- **Main control:** x's knob on the axis; arrows step by 0.1, Shift by 1; a corner of f is a stop.
- **Animates:** the water front follows the knob; the barrel level rises or falls; the pen draws; changing the curve
  drains and refills (cross fade under reduced motion). Tab 2: the area between a and b fills, then a bracket on g
  grows from g(a) to g(b).
- **Cause line:** "f(3) = 2 > 0 → filling → g rising, slope 2"; "f(5) = −1 < 0 → draining → g falling"; tab 2
  "area from 1 to 4 = 3.5 → g(4) − g(1) = 3.5".
- **Takeaway** (after the secondary "Sweep across"): "g′(x) = f(x): the area grows at the rate of f."
- **Outside:** 2 tabs, purpose line, curve picker, Show me how, cause line, Sweep across: 4 controls, about 22 words.

## Science to verify
FTC part 1: g′(x) = f(x) for continuous f; g″ = f′; g has a maximum where f changes from positive to negative;
FTC part 2: ∫ₐᵇ f = F(b) − F(a); exact areas of segments and semicircles (πr²/2) on equal axis scales; the variable
upper limit d/dx ∫ₐ^{h(x)} f(t) dt = f(h(x)) h′(x) (drill only); the tank A(t) = A(0) + ∫₀ᵗ (R − D) dt with its
units (CED 6.4 to 6.7 and 8.3; OpenStax Calculus Volume 1 §5.3). Every integral keeps its dt.

## Reuse
`ApCalcTools.studioKit2`, `K.handle` (x, a, b), `K.tabs`, `K.cause`; the Tangent tracer's pen and graph paper
pattern; the tool's own tank SVG (redrawn as a barrel). AB build byte-identical.

## Risks reviewers will likely block on
- The water front must stop exactly at the knob and never spill above f or below the axis (particles inside).
- Barrel level, pen height and the swept area derived from the drawn frame, including fast drags back past a.
- Two knobs a and b crossing in tab 2: the area turns negative and says so; the knobs never swap silently.
- Equal axis scales make some windows tall; on a phone keep the semicircle round without labels under 11 px.
