# Plan: AP® Physics 1, Scaling (tools v2)

**Tool and page:** `physics/tools/scaling-drills.html`; `physics/assets/tools/scaling-drills.js` (732 lines) and
`.css`, `physics/assets/tools/math/scaling-drills.js`, data `physics/data/tools/scaling-drills.json` (22 contexts from
`math-units` to `torque`, 31 relations). Free. Rollout row 108, group C, wave 7, size rework (247 words on the stage).

**The one idea:** when one quantity is multiplied, the result changes by that factor to the power in the equation.
Two tabs: "One change" and "Two changes".

## Research
- PhET Gravity Force Lab (known): drag the masses or the distance, the force arrows resize at once; take a real
  picture whose arrows are the result.
- Khan Academy proportional reasoning exercises (group C row, known): forgiving factor input ("×4", "4", "four").
- PhET Unit Rates (group row, known). Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Relation picker (31 relations in 22 contexts) | Explore: 8 curated relations as quiet chips (gravity, spring force, KE, centripetal acceleration, momentum, pendulum period, power, torque); all 31 in Test yourself, log it |
| Three sliders in the panel (the scaled quantities) | Explore: one factor handle on the picture per quantity (×½ to ×4, snapping to ×½, ×2, ×3, ×4) |
| Views Picture, Bars | Explore: the picture only; Bars to "?" |
| Reset to × 1 | Start over |
| Drills: One quantity scaled, Two changes at once, Unit check, SI conversions, Relation; ids `scaling-drills:<ctx>:<step>`, `?seed=`, `#quiz` | Test yourself "Problems", unchanged; Unit check and SI conversions stay there |

## Design
- **Picture:** each relation has its own small real scene: two planets with force arrows (gravity), a stretched
  spring with a hand (spring force), a car with a speed arrow (KE), a car on a round track (centripetal), a cart
  (momentum), a pendulum clock (period), a crane lifting (power), a wrench on a bolt (torque).
- **Main control:** drag the factor handle on the quantity in the scene (pull the planets apart, stretch the spring).
  The result grows or shrinks visibly (arrow length, a speedometer, a swing) and a "×¼" pill sits on the result.
- **Two changes tab:** two handles; the result pill shows the product (KE with mass ×2 and speed ×3 → "×18");
  keep relations whose answer is exact.
- **Cause line:** "distance ×2 → force ∝ 1/r² → force ×¼".
- **Takeaway:** "Square in the equation, square the factor."
- **Outside the picture:** 2 tabs, purpose line, Show me how, 8 chips (quiet), cause line. Count the chips as one
  control.

## Science to verify
- Every relation and its exponent against the AP® Physics 1 equations sheet (2024 revision): F_g = Gm₁m₂/r²,
  F_s = kx, K = ½mv², a_c = v²/r, p = mv, T = 2π√(L/g), P = W/Δt, τ = rF sinθ.
- Scenes keep the other quantities fixed and say so; the period of a pendulum does not depend on mass (show it if a
  mass handle exists, or leave mass off).
- Trap: units and significant figures rules in the authoring guide; g stated. No OpenStax.

## Reuse
`ApPhysTools.studioKit2` (added by the first AP® Physics 1 tool on kit2, likely Free body diagrams). Kit: `K.tabs`,
`K.handle` or `K.drag`, `K.cue`, `K.cause`. The forgiving factor input for Test yourself is the group C shared
piece (`K.setup` and one forgiving number input); reuse the chemistry units tool's input if it already exists.

## Risks reviewers will likely block on
- Eight small scenes are eight drawings: weight budget (`check-weight` physics shell) and consistency.
- A ×4 force arrow must still fit the stage at 360 px (cap the scale, never clip).
- "×¼" glyphs and fractions must not break or fall under 11 px.
- 247 words today: the landing count must drop under 30.
