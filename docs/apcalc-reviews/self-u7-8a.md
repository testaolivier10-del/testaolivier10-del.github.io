# Self-review: Unit 7 and Unit 8 topics 8.1-8.3 (author pass, 2026-10-13)

Scope: the seven AB topics of Unit 7 (no Euler's method, no logistic) and the first three of Unit 8.
Not yet independently reviewed.

## Topics done

| CED | Topic | Items | Calc items | In sets | Notes words | Figure |
|---|---|---|---|---|---|---|
| 7.1 | modeling-with-des | 16 | 0 | 9 | 853 | cooling-rate-slopes |
| 7.2 | verifying-solutions | 16 | 0 | 9 | 730 | solution-family-check |
| 7.3 | sketching-slope-fields | 16 | 0 | 9 | 687 | slope-field-grid |
| 7.4 | reasoning-with-slope-fields | 16 | 0 | 9 | 838 | slope-field-solutions |
| 7.6 | separation-of-variables | 16 | 0 | 9 | 661 | separation-family |
| 7.7 | particular-solutions | 16 | 0 | 9 | 676 | particular-domain |
| 7.8 | exponential-models | 16 | 4 | 9 | 697 | exponential-growth-decay |
| 8.1 | average-value | 16 | 4 | 8 | 731 | average-value-rectangle |
| 8.2 | motion-with-integrals | 16 | 4 | 9 | 736 | velocity-areas |
| 8.3 | accumulation-in-context | 16 | 5 | 9 | 752 | rate-in-out |

160 items: 81 single, 56 numeric, 13 expr, 10 multi (2 with one key). 159 apply/analyze. Every topic has a lesson
(2 prereqs pointing at earlier topics, figure, 4-5 step chain, misconception, 6 check items), notes with worked
examples and comparison tables, and a glossary entry for every concept it teaches.

Targeted misses: + C missing or added after solving (7.6, 7.7 items and mistakes); initial condition used late or
backwards (7.7); lost absolute value in ln and the sign of the constant (7.6); wrong slopes, swapped coordinates,
product-is-zero rows (7.3); d²y/dx² without the chain rule (7.4, all three DE FRQs); displacement vs total distance and
the missing initial position (8.2); average value vs average rate of change vs endpoint average (8.1); starting
amount dropped, rate out added, "increasing" read from R' (8.3); unequal table widths (8.3).

## FRQs (5, 9 points each)

| Id | Type | Calc | Parts (points) |
|---|---|---|---|
| frq-u7-slope-field-tangent | de | no | slope field at 9 points (1), tangent line and estimate (2), d²y/dx² and over/under (2), separation with f(2) = 3 (4) |
| frq-u7-draining-tank | de | no | tangent-line estimate (2), d²h/dt² by the chain rule and under/over (2), rate with units (1), separation with h(0) = 16 and the time the tank empties (4) |
| frq-u7-equilibrium-cosine | de | no | sketch two solution curves on the given field (2), equilibrium and why curves stay on one side (2), relative max with justification (2), separation with f(0) = 3 (3) |
| frq-u8-particle-calculator | motion | yes | speed increasing/decreasing (2), direction changes (2), position from x(0) (2), total distance and average velocity (3) |
| frq-u8-velocity-graph | motion | no | acceleration and speeding up from the graph (2), direction changes (2), position from x(0) (2), total distance and farthest left by candidates (3) |

Graph parts carry `space: "graph"` and a `graphSpec`. Rubric `accept` lists are plain text on purpose (see open item 1).

## Figures

Ten standalone SVGs in `calculus/figures/`, generated from their functions by `scripts/apcalc-figures/unit-7-8a.mjs`
(run it to regenerate). Each was rendered to PNG and inspected; overlapping labels, clipped segments and hidden tick
labels were fixed (tick labels moved to the frame edge on the slope-field figures).

## Numeric recheck

- Every numeric key recomputed independently in a scratch script (Simpson's rule, bisection, closed forms) and
  compared to the key (tolerance 1e-9): 56/56 agree.
- Every numeric key graded right and every authored mistake graded wrong and matched to its feedback through
  `ApCalcQuestions.grade` (key typed exact or to three decimals with units; calculator keys also truncated).
- Every expr key graded right and every expr mistake graded wrong through `ApCalcExpr.grade`; 12 of 13 keys also compared
  with an independent JS function on a grid (the other, ∫ y⁻² dy, is a constant-mode antiderivative checked by hand).
- Every number in the FRQs recomputed (30 checks: slopes, tangent estimates and the true values beside them, second
  derivatives by finite differences, zeros of v, displacement, distance split at the zeros, positions, candidates).
- Prose approximations (≈) checked by hand against the computed values; two were wrong in the draft and were fixed
  (9.048 → 9.049; total distance 12.187 → 17.430). Three FRQ accept lines that allowed wrong roundings were removed.
- `check-apcalc-content` rules (via `checkTopic`/`checkFrq`): all 10 topics and 5 FRQs clean; no near-duplicates with
  the rest of the bank (one found and reworded); `check-apcalc-map.mjs`: nothing used before it is taught.

## Map edits

None.

## Open questions (for needs-author)

1. **FRQ rubric `accept` lists are escaped, not rendered** (`calculus/assets/pages/frq-kit.js`, `r.accept.map(esc)`),
   while the build renders `$...$` everywhere. Math in an accept line would show raw MathML, so these FRQs keep
   accept lines in plain words. Either render accept lines or document the rule.
2. **"Solution curves do not cross."** Notes, two items and FRQ frq-u7-equilibrium-cosine part (b) use this as the
   reason a curve stays on one side of an equilibrium. True for every equation used here (smooth right sides, so
   solutions are unique), but uniqueness is not stated in the CED. A person should confirm this is the reason the
   scoring guidelines accept.
3. **Domain of a particular solution**: taught as the largest open interval containing x₀ on which the solution is
   defined and differentiable (and the differential equation is defined), so y = √(9 − x²) for dy/dx = −x/y has
   domain −3 < x < 3. Confirm against the CED 7.7 wording.
4. **Separation of variables gets 3-4 points** in these FRQs (College Board FRQs often give it 5), because the 9 points
   are shared with the slope field, tangent line and concavity parts.
5. Not mine, seen while checking: the `slope-fields` tool data names an unknown topic `writing-differential-equations`
   (the map id is `modeling-with-des`), and `node scripts/check-apcalc-content.mjs --topic <id>` can take over 100 s
   because it also runs every tool validator; I checked through `checkTopic`/`checkFrq` directly.
6. Shared scratchpad: other agents in this session use generic names (`site/`, `www/`) in the same scratchpad. I built
   once into `scratchpad/site` before noticing; another builder's `prep.sh` uses that path and should rebuild. My
   scratch work now lives in `scratchpad/u78a/`.
