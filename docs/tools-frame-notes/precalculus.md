# AP Precalculus tools in the standard frame (F4, 2026-11-16)

Same kit changes as AB and BC, in `precalculus/assets/tools/pcalc-tools.js`: see the table in
`docs/tools-frame-notes/calculus.md` (bar lede, Explore question over the cue, stage dropdown for the scenario,
problem type dropdown, hint ladder, finished card with per problem type takeaways). Nothing was removed.

| Tool | Features | Where now | Judgment, fixes |
|---|---|---|---|
| Exponential and log lab | Ratios / Inverse / Rules / Semi-log, sliders, Reflect, rule segments, data chips, table, drill (5 kinds) | views stay; takeaway per problem kind | Bug: the Ratios cue showed in every view; each view has its own line now |
| Function lab | parent function select, a b h k, drag handles, Play the steps, Reset, drill | parent function is the stage dropdown | |
| Polar graphs | curve chips (4), angle, Play, Point / Interval, curve settings row, drill | 4 chips stay (the spec allows 2 to 4); settings row stays | |
| Polynomials and rationals | factor chips, pins, sign chart, drill (6 kinds) | unchanged layout (factors are the activity) | |
| Rate of change | situation select, point drag, bars, drill | situation dropdown | |
| Regression lab | data select, model chips, prediction slider, residual plot, drill | data dropdown; model chips stay (choosing the model is the task) | |
| Sinusoid builder | situation select, a d period shift, handles, drill | situation dropdown | |
| Symbolic steps | expression and rewrite boxes, examples, equality band, drill (8 kinds) | unchanged layout; takeaway per kind | Bug: the trig identity step's hint gave the power and log rules; it now names the identities |
| Unit circle | P drag, angle, Unroll one turn, sin cos / tan, drill | unchanged layout | |
| Vectors and matrices | Motion / Vectors / Matrices, path chips, Play, Point / Interval, settings row, drill | unchanged layout; takeaway per kind | |

## New copy for an accuracy check (`STD` in pcalc-tools.js)
- Takeaways, including per kind: exp-log-lab (table, model, inverse, rules, semilog), function-lab (rational,
  exponential), symbolic-steps (all 8 kinds), vectors-matrices (5 kinds), unit-circle (radian).
- Symbolic steps `METHOD.idA` (trig identity hint).
- Exp-log lab cues: inverse, rules, semilog.

## Accuracy check (F6b, 2026-11-16)
Checked every `STD` takeaway, `METHOD.idA` and the exp-log cues against the tools and `docs/apprecalc-authoring-guide.md`
(limit notation, rate and concavity wording, no calculus words).
- Correct as written: all task questions, `METHOD.idA`, the exp-log cues, and the takeaways not listed here.
- Changed: function-lab rational used "f(x) → ±∞ as x → a" and "f(x) → c", the shorthand the guide forbids. Now: "x = a
  is a vertical asymptote when a one-sided limit of f(x) as x approaches a is ∞ or −∞; y = c is a horizontal asymptote
  when the limit of f(x) as x → ∞ or x → −∞ is c."
- Changed: poly-rational "A numerator factor gives a zero" to "A numerator factor that does not cancel gives a zero" (a
  cancelled factor gives a hole, as the same line says).
- Changed: symbolic-steps inv-trig "arcsin and arctan give angles in [−π/2, π/2]" to "arcsin gives angles in [−π/2,
  π/2], arctan in (−π/2, π/2), and arccos in [0, π]" (arctan never reaches ±π/2).
