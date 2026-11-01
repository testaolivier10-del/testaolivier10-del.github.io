# Unit 9 review (9.1-9.9, math-parametric-vectors, math-polar, three FRQs)

Branch `claude/apcalcbc`, 2026-10-31. Independent accuracy check (Phase 4) against `docs/apcalcbc-briefs/review-common.md`
and `docs/apcalc-briefs/review-common.md`. Scope: `math-parametric-vectors`, `parametric-derivatives`,
`parametric-second-derivatives`, `parametric-arc-length`, `vector-derivatives`, `vector-integrals`, `planar-motion`,
`math-polar`, `polar-derivatives`, `polar-area`, `polar-area-between` (lesson, notes, questions, glossary, figure
entries; 165 items, 18 stimulus sets), their 18 figures (`scripts/apcalcbc-figures/author-b.mjs`, `author-c.mjs`),
and `frq-u9-motion-speed`, `frq-u9-motion-tangent`, `frq-u9-polar-area`. The CED PDF was not downloaded again;
scope statements were checked against `docs/apcalcbc-research/framework.md` sections 3, 4 and 7, which quote it.

## Changes

| File / item | What was wrong | Fix |
|---|---|---|
| `frq-u9-motion-speed` (c) | Rubric accepted `7.066` for x(5) = 7.06547: neither the rounded nor the truncated value, so a wrong answer earned the point | Accept list is `7.065` only |
| `frq-u9-polar-area` (b) | Rubric accepted "1.737 (or 1.738)" for the maximum 1.737497: 1.738 is wrong under the three-decimal rule | "1.737" only |
| `frq-u9-motion-tangent` (b) | Rubric silent on a sign chart (needs-author b3) | Accepts a sign chart of dy/dt with a sentence citing dy/dt < 0; a chart alone does not earn it |
| `cbc-polar-derivatives-13` mistake | Mistake `-1` explained as "uses sin(π/3) = 1/2", but that slip gives −1/2, not −1 | Mistake value `-1/2` (key −√3/2 unchanged) |
| `cbc-math-polar-9` option A why | "Six would be right for 2n with an even n" (6 = 2n here with n = 3, odd): muddled | Says a rose sin(nθ) has 2n petals only for even n; n = 3 is odd, so π to 2π retraces |
| `cbc-math-parametric-vectors-10` option D why | "y/x = tan t, so t is not x" read garbled | Rewritten: dividing gives y/x = tan t; t is the parameter, not x |
| glossary `polar-derivative` | dr/dθ called the rate of change of "the distance from the pole" (r can be negative) | "the rate of change of r, the signed distance from the pole" |
| figure `vector-integrals-shift` | "same velocity at t = 2" overlapped by the blue path's velocity arrow; "start (0, 0)" on the x-axis tick 1 | Labels moved (below the axis; left of the start) |
| figure `math-polar-coords` | Dashed ray ran through the "P (r = 3, θ = π/3)" label | Label raised |
| figure `polar-area-between-region` | "(3, −π/3)" crossed by the dashed ray and the y-axis | Label moved right of the point |

Changed keys: none. Needs-author b2, b3, c1 resolved (see that file).

## Checked and fine

- **Numeric and `expr` keys.** Scratch script (`recheck.mjs`, outside the repo) computed every one of the 83
  numeric and `expr` keys from the stem with its own formulas (Simpson integration, bisection, central
  differences; the `expr` keys compared with my own functions at 9 points of each domain). Then each key was graded
  right through `calc-expr.js` + `cbc-interval.js` + `calc-questions.js` in a vm with BC's config (exact form, and
  for calculator items the rounded and the truncated three-decimal value), and all 178 authored mistakes graded
  wrong (calculator mistakes also at three decimals). 0 failures. Calculator distractor values recomputed too:
  e.g. 8.361 (displacement) and 16.318 (|x′| + |y′|) for 9.6 item 10, 0.595 (|dy/dx|), 1.827 and 2.380 (9.4 item 15),
  π (½∫r) for 9.8 item 9, 0.898 and 0.537 (9.7 item 17), −2.049 (9.2 item 13).
- **Single-answer items** (82): every option and explanation read and checked by hand; one defensible key each.
  Paths, crossings and directions recomputed (9.1 path crosses itself at (0, 1) at t = ±√3; 9.6 loop closes at the
  origin; collision at t = 2, paths also crossing at (8, 15) at t = 4 and 6); polar regions recomputed (inner loop
  π − 3√3/2, outer loop 2π + 3√3/2, crescent 4π/3 + 2√3, lens π/8 − 1/4, region inside r = 2 outside 4 sin θ equal
  to the crescent).
- **FRQs**, all values recomputed: motion-speed 1.032, ⟨−2.638, −0.811⟩, t = 1.462 and 2.507 (the only two in
  (0, 5)), (7.065, 4.970), 11.863; motion-tangent −1.855, zeros of dy/dt 1.026 and 4.210, ⟨0.289, −2.432⟩,
  14.322, x(5) = 9.334; polar r = 3 sin θ + cos 2θ ≥ 1 on [0, π] (so R is exactly the swept region), area
  (5π − 4)/2 = 5.854, max of x = r cos θ 1.737 at θ = 0.480 against endpoints 1 and 0, r(5π/6) = 2 with
  dr/dθ = −√3/2, slope −0.439 (0.848 / −1.933). Rounded and truncated alternatives in the accept lists are now all
  valid. 9 points each, one rubric line per point, samples complete.
- **Notes and lessons** (all 11 read in full): every worked example recomputed (9.3 26/3 and 5.147; 9.4 speed
  √(4 + π²) = 3.724; 9.5 ⟨10, 8⟩ and (12.5, 7.5); 9.6 3.012, (6.547, 10.450), 7.900, 11.83; 9.7 cardioid tangent
  y = x + 2 and top at θ = π/3; 9.8 6π, (3π + 8)/2, inner loop; 9.9 (9√3 − 2π)/2 = 4.653). The polar "toward /
  away" sign table, horizontal/vertical tangent conditions, d²y/dx² method and position-adds-the-start rule are
  right and stated before use. Glossary (12 entries) right.
- **b2** (both rates zero): in scope; the CED gives the slope only where dx/dt ≠ 0, and the notes' "corner or smooth
  tangent, the test does not apply" is correct.
- **Figures**: all 18 rendered to PNG in headless Chromium and inspected (curves from their functions, direction
  arrows checked against dx/dt and dy/dt, marked points and labels against the text). Apart from the three label
  fixes above, all clean. Regenerated with `author-b.mjs` and `author-c.mjs`; only the three SVGs changed.
- **Scope**: no polar arc length, dot or cross product, unit tangent or curvature; the one "length of the curve"
  mention (9.8 item 15) is a distractor saying it is a different integral. Notation per the guide (⟨ ⟩ vectors,
  speed never |dy/dx|, the ½ and r² in every polar setup, dt kept, position adds the initial value).
- **Checks**: `check-apcalcbc-content.mjs --topic <id>` 0 failing for all 11 topics (bank, FRQ, meta). With
  `--topic`, the exams line reports failures only because the forms reference topics outside the filter; the full
  run is clean: 33 topics, 510 items, 0 failing, exams 0 failing. `check-apcalcbc-map.mjs --check`: nothing used
  before it is taught. `node --test scripts/test/apcalcbc-*.test.mjs` 71/71. `build-apcalc.mjs --check` passes
  (AB byte-identical).

## Open (left for a person)

None from this scope. b4 (a two-particle FRQ part) stays an author's option for a later exam form.
