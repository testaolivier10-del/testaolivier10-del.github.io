# Plan: AP® Calculus BC, Integration methods

## Tool and page
`calculus-bc/tools/integration-methods.html`; scripts `calculus-bc/assets/tools/integration-methods.js`,
`calculus-bc/assets/tools/math/integration-methods.js` (`ApCalcMath.integrationMethods`), `integration-methods.css`;
data `calculus-bc/assets/tool-data/integration-methods.json`. Runs on AB's `calc-tools.js` and `calc-plot.js`.
**Premium.** Rollout row 109, group G, wave 18, marked rework (three lessons; slider in the panel).

## The one idea (three tabs)
1. **Parts:** ∫u dv and ∫v du are two areas that together fill the rectangle uv, so one gives the other.
2. **Partial fractions:** a fraction with two linear factors below is the sum of two simple pieces, each easy to
   integrate.
3. **Improper:** an area that runs out to infinity (or up to a wall) can still be finite; its running total levels
   off, or it keeps climbing.

## Research
- GeoGebra "Integration by parts, geometric" (https://www.geogebra.org, search "integration by parts visual"): the
  u v rectangle split by a curve. Take: the two areas filling one rectangle.
- 3Blue1Brown on Gabriel's horn and improper integrals (https://www.3blue1brown.com): finite paint for an infinite
  length. Take: a real quantity that stays finite.
- Desmos improper integral (https://www.desmos.com/calculator, search "improper integral"): drag b and watch the
  area value. Take: the area against b as its own small graph.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Scenes Parts / Partial fractions / Improper (dock switch) | the three tabs |
| Parts: integrand's area from a to b, drag b (cue "Drag the bound b") | tab 1 main control: b (`K.handle` on the x axis) |
| The uv picture (u against v, ∫u dv and ∫v du as two areas filling uv) | tab 1, the main picture beside the integrand |
| The u, dv, du, v card | on the picture, small, beside the rectangle's sides |
| Tabular table for x²eˣ (Details); More options: what goes wrong with u and dv swapped | "?" |
| Partial fractions: f and its pieces A/(x − a), B/(x − b), a slider moves x, the readout adds the pieces | tab 2: x's knob on the graph (`K.handle`); the pieces' heights stack at x |
| Improper: area from a to b (or b to a down to 0) as b moves toward the trouble, beside the area against b | tab 3: b's knob; the running total graph beside |
| Why, Details | "?" |
| Test yourself: drill, 5 kinds (parts, tabular, partial, improper, choose), the figure building with the answers, "yours against the right one" graph; record ids `integration-methods:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** a garden plot of width v(b) and depth u(b) with a curved path from corner to corner (the curve
  (v(x), u(x))); the plot's two beds (one each side of the path) are ∫u dv and ∫v du, planted in two colours; their
  sum is always the whole plot uv. Beside it, the integrand's area under its graph, tied to the first bed.
- **Tab 2 picture:** the graph of f with its two pieces drawn as two separate curves in their own colours; at x, two
  stacked bars (the pieces' heights) reach exactly f(x). A tap on f "splits" it (the curve peels into its two pieces,
  animated). Honest note: there is no everyday object here; the picture is the graph made tangible (the weakest scene
  of the 35, flagged for the reviewer).
- **Tab 3 picture:** a fence that runs out forever under y = 1/x² being painted from x = 1: the paint can drains as b
  moves right; the can never empties for 1/x² (total 1), but runs out for 1/x (the bill keeps growing).
- **Main control** per tab as listed above; arrows step, Page Up multiplies b by 10 in tab 3.
- **Animates:** beds grow as b moves; the split in tab 2; paint spreading and the can draining in tab 3.
- **Cause line:** tab 1 "uv = ∫u dv + ∫v du" with the three numbers from the model; tab 2 "1/(x − 1) + (−1)/(x − 2) = f(x) at x = 3";
  tab 3 "b = 100 → area 0.99 → levels off at 1".
- **Outside:** 3 tabs, purpose line, picker (integrand), Show me how, cause line: 3 controls, about 20 words.

## Science to verify
∫u dv = uv − ∫v du with the bounds on uv (`docs/apcalcbc-authoring-guide.md`: name u and dv, evaluate uv at both
bounds); tabular method; linear partial fractions with distinct linear factors only (needs-author
`partial-fractions-scope`); improper integrals in limit notation to the end, never arithmetic with ∞; p integrals
∫₁^∞ 1/x^p converges iff p > 1; 1/√x on (0, 1] converges (CED 6.11 to 6.13; OpenStax Calculus Volume 2 §3.1, 3.4,
3.7). The garden picture needs u and v monotone on [a, b]; choose integrands where it holds, or say so.

## Reuse
`ApCalcTools.studioKit2` (exists, AB's); `"kit2": true` in `calculus-bc/data/pages.json`; `K.handle`, `K.tabs`,
`K.tap`, `K.cause`. BC reads AB's runtime, never copies it. If this is the first BC tool on kit2 (wave 18 order puts
it first), confirm the shared generator writes the kit2 links for the BC page and that **AB's build stays
byte-identical** (`build-apcalc --check`), then `build-apcalcbc --check`.

## Risks reviewers will likely block on
- Tab 2's picture is graph only: the reviewer may call it a bare chart (rule 12); the plan accepts the split
  animation and stacked bars as the minimum, and says so in the brief.
- The paint can level and the area number from the drawn frame while b moves fast to large values.
- Small text on the u, dv, du, v card at 360 px.
- Three tabs with three pictures: weight of the BC page.
