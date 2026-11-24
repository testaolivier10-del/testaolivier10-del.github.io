# Plan: AP® Precalculus, Symbolic steps

## Tool and page
`precalculus/tools/symbolic-steps.html`; scripts `precalculus/assets/tools/symbolic-steps.js`,
`precalculus/assets/tools/math/symbolic-steps.js` (`ApPrecalcMath.symbolicSteps`), `symbolic-steps.css`; typed input
`precalculus/assets/pcalc-expr.js` (`ApPrecalcExpr`); data `precalculus/assets/tool-data/symbolic-steps.json`.
**Premium.** Rollout row 104, group C, wave 7, marked rework (typing, not manipulating; the free mode is named "Is it
the same?"; rollout question 4 lists it as a typing tool with no picture).

## The one idea
A rewrite is only equal to the original where both are defined: check it everywhere, not at one x.

## Research
- Desmos (https://www.desmos.com/calculator): graph both forms and see whether they overlap. Take: overlap as the
  test; leave: two lines that look identical when they are not (domain loss is invisible there).
- Khan Academy "equivalent expressions" (https://www.khanacademy.org): forgiving input and a hint ladder. Take for
  Test yourself only (already there).
- WolframAlpha "simplify" with conditions (https://www.wolframalpha.com): states "for x > 0". Take: say the domain
  condition in words on the picture.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| "Is it the same?": type an expression and a rewrite (cue "Type a rewrite", key `apprecalc-symbolic-steps-rewrite`) | Explore: the original from the picker or typed (forgiving), the rewrite typed or picked from three suggested rewrites |
| Examples to tap (ln(x²) and 2 ln x and the rest in the data) | example picker beside "Show me how" |
| Both graphed: the first green, the rewrite orange and dashed | both drawn solid: green the original, orange the rewrite, offset as two strands |
| A band, piece by piece: equal, differ, only one defined | the picture's main signal (below) |
| Mode names "Is it the same?" / "Test yourself" | Explore / Test yourself |
| Test yourself: the Q4 drill, 8 contexts (single-power, single-log, exp-eq, log-eq, quad-ex, inv-trig, trig-eq, trig-id), each step graded by value on the domain, figures (trig equation and its line, the parabola in u with u ≤ 0 shaded, unit circle with the principal range); record ids `symbolic-steps:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** two strands of rope laid along the graph (green: the original, orange: the rewrite). Where the two are
  equal they twist together into one braid; where they differ they part; where only one exists, the other rope is
  missing and its end is tied off, with the label "only the original" on that stretch. Under the ropes, a strip of
  the x axis lit green (equal), red (differ), grey (one undefined).
- **Main control:** a magnifying glass knob dragged along x (`K.handle` on the axis) showing both values at that x;
  the typed rewrite is the second control.
- **Animates:** typing a new rewrite re lays the orange rope (it slides into place and braids or parts); the glass
  slides; the strip's colours grow from left to right as they are decided.
- **Cause line:** "x = −2 → ln(x²) = 1.386 → 2 ln x undefined → not the same for x < 0"; "equal for every x > 0".
- **Takeaway:** "ln(x²) = 2 ln|x|; 2 ln x only matches for x > 0."
- **Outside:** purpose line, example picker, the rewrite field, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
Log rules and their domains (ln(x²) = 2 ln|x|); exponent rules with negative bases; inverse trig principal ranges;
trig identities in scope (sum identities for sine and cosine, double angle; no half angle or tangent sum,
`docs/apprecalc-authoring-guide.md` exclusions); three decimal rule for shown values; exact forms on no calculator
items (OpenStax Precalculus §6.5 and §9.1 to 9.3). No calculus words anywhere (the content check refuses
"derivative", "instantaneous rate").

## Reuse
**First Precalculus tool on kit2** (planned): add `ApPrecalcTools.studioKit2` to
`precalculus/assets/tools/pcalc-tools.js` (the calculus adapter's pattern: stage alone in Explore, "?" holds the
reference, the drill untouched) and the `t.kit2` links in `scripts/build-apprecalc.mjs`; `"kit2": true` for this tool
in `precalculus/data/pages.json`; `build-apprecalc --check` shows only this page changed. `K.handle`, `K.cause`;
`ApPrecalcExpr` for forgiving input (x^2, x², spaces, implied ×, ln and log). `K.setup` is not built; do not build it
here.

## Risks reviewers will likely block on
- Two ropes on top of each other must still be seen as two (offset braid), or "equal" reads as one curve.
- The strip's colours must come from the drawn ropes' values at that pixel, not a separate domain guess.
- A typed rewrite the parser rejects: a plain message on the picture, the old rope kept.
- The phone keyboard covers the picture: scroll it into view after Enter.
