# Plan: AP® Calculus AB, Rule drills

## Tool and page
`calculus/tools/rule-drills.html`; scripts `calculus/assets/tools/rule-drills.js`,
`calculus/assets/tools/math/rule-drills.js` (`ApCalcMath.ruleDrills`, with `EXAMPLES`), `rule-drills.css`; typed input
through `calculus/assets/calc-expr.js` (`ApCalcExpr`). **Free.** Rollout row 49, group C, wave 7, marked rework
(typing, not manipulating; 106 words on the stage; free mode named "Rule picker"; listed in rollout question 4 as a
typing tool with no picture).

## The one idea
The rule you use first is the last thing done to x: open the function from the outside in.

## Research
- Khan Academy derivative exercises (https://www.khanacademy.org/math/ap-calculus-ab/ab-differentiation-2-new):
  forgiving input, a hint ladder, one step at a time. Take: one layer per step, hints that name the layer.
- Symbolab step by step (https://www.symbolab.com/solver/derivative-calculator): names the rule at each line. Take:
  the rule's name on the layer, short; leave: the wall of steps.
- Desmos input (MathQuill, https://www.desmos.com/calculator): typing x^2 shows x². Take: live pretty print while
  typing, never a strict format.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Type any function of x (cue "Type any function of x") | kept as the secondary "Your own" field (forgiving: x^2, x², spaces, implied ×) |
| 8 example chips (x² sin(3x), e^(2x)/(x² + 1), √(1 + x³), ln(cos x), arctan(x²), (3x − 1)⁵, x eˣ sin x, tan(x)/x) | function picker beside "Show me how" (the default the first example) |
| Structure tree (outer rule on top, pieces, u purple, v green, each piece's rule and derivative, f′ assembled) | the picture itself, drawn as nested machines (below) |
| Graphs of f (crimson) and f′ (blue) on a wide stage | "?" ("Check it on the graph"), with the course colours |
| Mode names "Rule picker" / "Test yourself" | Explore / Test yourself |
| Test yourself: drill, 13 kinds (rewrite, power, sum, trigexp, product, quotient, trig, chain, implicit, inverse, invtrig, mixed, higher), the figure building as you answer (tree, implicit curve with tangent, inverse mirror, f, f′, f″); record ids `rule-drills:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** a small assembly line drawn with material: x enters on a belt at the left and passes through one
  machine per operation, innermost first (a "square it" press, a "×3" stamp, a "sin" winder), out to f(x) at the
  right. A product is two belts meeting at a "×" press; a quotient a "÷" press. Each machine shows its own rule's
  name on its plate (1 to 3 words: "power", "chain", "product").
- **Main control:** tap the last machine (the one nearest the output): it opens (lid lifts, animated), shows its
  rule and its derivative piece, and the next machine in lights up as the next tap. Keys: Tab to a machine, Enter
  to open. A second tap closes it.
- **Animates:** machines open and close; the derivative assembles on a ticket under the belt, piece by piece, in
  the machine's colour (outer purple, inner green, as today); a new function rebuilds the line (machines slide in).
- **Cause line:** "last step: sin( ) → chain rule → cos(3x²) · (derivative of 3x²)"; then "3x² → power rule → 6x".
- **Takeaway:** "Outside in: f′(x) = cos(3x²) · 6x."
- **Outside:** purpose line (about 9 words), function picker, Your own field, Show me how, cause line: 3 controls,
  about 20 words.

## Science to verify
Every rule and every example derivative (OpenStax Calculus Volume 1 §3.3 to 3.9; CED Unit 2 and 3, 2.5 to 3.6); the
model's tree must match the true order of operations (sin(3x²) is chain of sin over 3x²; x eˣ sin x is a product of
three); implicit, inverse and inverse trig derivatives (CED 3.2 to 3.3); second derivatives. Notation: keep dy/dx and
y′ apart; "= 0" after differentiating an implicit equation (authoring guide). A typed function the parser cannot
read gets a plain message, never a silent fail.

## Reuse
`ApCalcTools.studioKit2`, `K.tap` for the machines, `K.cause`, `K.cue`; `ApCalcExpr` for the forgiving input and
`ApCalcMath.ruleDrills` for the tree (the picture is drawn from the same tree the old stage drew). Rollout names a
shared `K.setup` and one forgiving input for group C; it is not built (the Units and sig figs tool kept its own
chain). Do not build `K.setup` here; if a forgiving input piece is lifted into the kit, it is its own reviewed
change. AB build byte-identical.

## Risks reviewers will likely block on
- Picture vs blocks: machines must read as drawn machines (metal, shadow), not coloured boxes (rule 12); this is the
  main design risk.
- Long functions (x eˣ sin x, a quotient with a chain inside) on a 360 px phone: the line wraps into two rows or
  scrolls inside the picture; labels never under 11 px.
- The derivative ticket's math text must stay one line per piece and clear of the belt labels.
- Typed input on a phone keyboard must not hide the picture (scroll the picture into view after Enter).
