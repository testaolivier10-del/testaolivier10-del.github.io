# Plan: AP® Calculus AB, Limit explorer

## Tool and page
`calculus/tools/limit-explorer.html`; scripts `calculus/assets/tools/limit-explorer.js`,
`calculus/assets/tools/math/limit-explorer.js` (`ApCalcMath.limitExplorer`), `limit-explorer.css`; data
`calculus/assets/tool-data/limit-explorer.json`. **Free.** Rollout row 40, group G, wave 4, marked rework (the zoom
slider and Play sit in the panel, not on the graph).

## The one idea (two tabs)
1. **Close in on a point:** walk toward x = a from each side; the limit is the height both sides head for, whatever
   happens at a itself.
2. **Out to infinity:** walk far out; the height levels off at a horizontal asymptote, or does not.

## Research
- Desmos (https://www.desmos.com/calculator), a point on the curve with a slider for x: exact, but the control is
  beside the graph. Take: the point riding the curve.
- GeoGebra limit applets (search "one sided limits" on https://www.geogebra.org): two points approach a from each
  side with their y values shown. Take: two tracers in two colours, values on the tracers, not in a table.
- 3Blue1Brown, Essence of calculus ch. 7 "Limits" (https://www.3blue1brown.com/topics/calculus): zooming in on a
  hole. Take: the zoom as a magnifier that follows the tracers (as the Tangent tracer's tab 2).

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Gallery select (A hole, A jump, A point out of place, A vertical asymptote, Limits at infinity, The squeeze theorem, sin(1/x) oscillates) | curve picker beside "Show me how" (Limits at infinity opens tab 2) |
| Zoom slider, its − and + buttons, mouse wheel, pinch | replaced by the two tracers dragged toward a, with the magnifier following them (wheel and pinch go) |
| Play the zoom | "Close in" (secondary, small): both tracers slide to a, the magnifier zooming |
| Two tracers riding the curve with arrows | main controls: left and right travellers (`K.handle` each, one loud, one quiet until the first is used) |
| Table of values gaining a row per power of ten | "?" (live, for the current curve) |
| Continuity checklist (three conditions) | the takeaway after Close in ("f(1) not defined → not continuous at 1"); the full checklist in "?" |
| "Fill the hole" (redefine f(a) as the limit) | kept, quiet, on the picture beside the hole, only when a removable point exists; animated patch |
| Limits at infinity zoom out | tab 2 (drag the traveller outward; the x axis compresses smoothly) |
| Caption, Why, Details (formula, every row, the limits, the sentence) | cause line; "?" |
| Test yourself: drill, 12 kinds (graph, table, onesided, laws, algebra, squeeze, classify, continuity, remove, vertical, infinity, ivt); record ids `limit-explorer:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the Tangent tracer's road through a landscape, drawn on the exact grid. Two cars (purple from the
  left, orange from the right) drive toward x = a. A hole is a missing slab with a hazard cone; a jump is a step in
  the road; a point out of place is a lamp post standing off the road at f(a); a vertical asymptote is the road
  climbing a cliff out of sight; the squeeze is the road between two guard rails y = |x| and y = −|x|; sin(1/x) is a
  road that buckles faster and faster. Each car carries a height flag reading f(x).
- **Main control:** the left car's knob (`K.handle` on the road, keys); the right car becomes loud once the left
  one is used. Within a few millimetres of a, the magnifier opens and keeps both cars visible (×10, ×100, ×1000).
- **Animates:** cars follow the finger; the magnifier grows in and zooms; Fill the hole lays a slab in; a new curve
  cross fades.
- **Cause line:** "from the left 2.01 → from the right 1.99 → both head for 2 → limit 2"; at a jump "1 from the left
  + 3 from the right → they disagree → no limit"; tab 2 "x = 1000 → f = 2.003 → levels off at 2".
- **Takeaway:** "The limit is 2, even though f(1) is not defined."
- **Outside:** 2 tabs, purpose line (about 9 words), curve picker, Show me how, cause line, Close in: 4 controls,
  about 22 words.

## Science to verify
One sided limits; the limit exists only when both one sided limits exist and are equal and finite; infinite limits
are described as "does not exist, grows without bound" with ∞ notation as the CED uses it; continuity's three
conditions; squeeze theorem with the |x| bounds; sin(1/x) has no limit at 0; horizontal asymptotes as limits at
±∞ (CED Unit 1, 1.2 to 1.16; OpenStax Calculus Volume 1 §2.2 to 2.4 and §4.6). Epsilon delta is excluded (authoring
guide). Indeterminate forms stay 0/0 and ∞/∞; never write "0/0 = 2".

## Reuse
Not the first AB tool on kit2: `ApCalcTools.studioKit2`, `K.handle`, `K.tabs`, `K.cause`. Reuse the Tangent tracer's
road, car and magnifier: lift them from `calculus/assets/tools/tangent-tracer.js` into a shared calculus piece only
if both tools then load it (the tracer must still pass its sweep, `scripts/tools-v2/tangent-tracer-sweep.mjs`).
AB build byte-identical.

## Risks reviewers will likely block on
- Two cars and two flags converging on a: flags and numbers must stay 4 px apart even at the hole (stack flags
  above and below).
- A car at an asymptote must never leave the picture (the window clamps and the flag says "→ ∞").
- sin(1/x) near 0 at CPU x4: sample adaptively, cap the drawn wiggles, label "too many swings to draw".
- The lamp post (point out of place) must not read as a second car.
