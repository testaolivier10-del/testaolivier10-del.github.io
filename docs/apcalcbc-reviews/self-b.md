# Author B self-report: parametric equations and vectors, Unit 9 topics 9.1-9.6

Phase 1 content, brief `docs/apcalcbc-briefs/b.md`. Written 2026-10-31.

## Topics done (7)

| Topic | Items | Types | Apply/analyze | In sets | Calc | Notes words |
|---|---|---|---|---|---|---|
| `math-parametric-vectors` (skill) | 10 | 7 single, 2 numeric, 1 expr | 100% | 40% (1 table set) | 0 | ~850 |
| `parametric-derivatives` (9.1) | 16 | 8 single, 5 numeric, 3 expr | 93% | 56% (graph set + table set) | 1 | ~780 |
| `parametric-second-derivatives` (9.2) | 15 | 7 single, 5 numeric, 3 expr | 93% | 53% (2 sets) | 1 | ~610 |
| `parametric-arc-length` (9.3) | 15 | 5 single, 10 numeric | 100% | 53% (graph set + table set) | 1 | ~660 |
| `vector-derivatives` (9.4) | 15 | 8 single, 5 numeric, 2 expr | 93% | 60% (2 table sets) | 1 | ~620 |
| `vector-integrals` (9.5) | 15 | 7 single, 6 numeric, 2 expr | 100% | 53% (2 table sets) | 1 | ~670 |
| `planar-motion` (9.6) | 15 | 8 single, 7 numeric | 100% | 66% (graph set + calculator set) | 5 | ~700 |

Total 101 items, 13 stimulus sets. Each topic has a lesson (hook, 2-3 prerequisite questions pointing back, figure,
cause-and-effect chain, key ideas, a misconception from a reader-report error, 6-7 check items, summary), a notes
page with worked examples before every calculation type and comparison tables, and glossary entries for every
concept it teaches (9: `parametric-equation`, `vector`, `parametric-derivative`, `parametric-second-derivative`,
`parametric-arc-length`, `vector-valued-function`, `velocity-vector`, `vector-antiderivative`, `planar-motion`).

Required stimulus sets: `parametric-derivatives-s1` (graph: path with direction arrows, t = -1 and t = 2 marked),
`vector-integrals-s1` (table: x'(t), y'(t) at t = 0, 2, 5, 8 with the start (3, -1)), `planar-motion-s1` (graph:
closed loop with the velocity vector drawn at t = 1).

BC misses targeted (framework.md section 7): speed as |dy/dx| (9.6 items 2, 6, 11, misconception), initial value
dropped or subtracted (9.5 items 1, 2, 6, 9, 10, 13, 14, 15; 9.6 item 8; misconception), y decreasing read from
dy/dx instead of dy/dt (9.6 item 12, FRQ 2b), the extra division in d2y/dx2 (every 9.2 item), solving speed = k
rather than evaluating (9.6 item 7, FRQ 1b), velocity given for acceleration, components swapped, distance
integrand miscopied, displacement versus distance, collision versus crossing paths (two particles).

## FRQs (2, type `parametric`, calculator, 9 points each)

- `frq-u9-motion-speed`: a robot on a gym floor. (a) speed and acceleration vector at t = 4 (2); (b) both times
  speed = 3 (2); (c) position at t = 5 from the start (1, 2) (3); (d) total distance (2).
- `frq-u9-motion-tangent`: a particle with x' = sqrt(t + 1), y' = 3cos(1.2t) - 1, at (3, -1) when t = 2.
  (a) slope and tangent line (2); (b) where y is decreasing, from dy/dt (2); (c) acceleration vector (2);
  (d) distance and x(5) from the position at t = 2 (3).

One rubric line per point with accepted wordings (rounded and truncated three-decimal values), a full-credit
sample per part.

## Figures (10, `scripts/apcalcbc-figures/author-b.mjs`)

All drawn by sampling the parametric functions shown; emerald `#0A5A34` emphasis, Okabe-Ito blue and vermillion.
Lesson figures: `math-parametric-vectors-path`, `parametric-derivatives-tangents` (one point, two slopes),
`parametric-second-derivatives-circle` (why the division by dx/dt matters), `parametric-arc-length-pieces`,
`vector-derivatives-ellipse`, `vector-integrals-shift` (same velocity, two starts), `planar-motion-parabola`
(displacement 8 vs distance 11.83). Stimulus figures: `parametric-derivatives-path`, `parametric-arc-length-cycloid`,
`planar-motion-loop`. The AB `plot` spec has no parametric curves, so these are SVG figures, not plot specs.
Rendered to PNG and checked by eye for overlap and clipping.

## Numeric recheck

A scratch script recomputed every numeric key from its own formula (Simpson integration, bisection for roots,
central differences for derivatives) and every `expr` key against an independent function at 29 points, then
graded every key right and every authored mistake wrong through the runtime (`calc-expr.js`, `cbc-interval.js`,
`calc-questions.js` in a vm), calculator keys also at three decimals. It also rechecked every calculator value
quoted in the two FRQs (both roots of each equation, signs on each interval) and in the notes worked examples.
Result: 101 items, 78 keys and quoted values recomputed, 112 mistakes graded wrong, 0 failures. Two notes values
were wrong in my first draft and fixed by this check (9.3 worked example 3: 5.147, not 4.709; 9.6 worked example 1:
speed 3.012 and distance 7.900).

## Checks

- `node scripts/check-apcalcbc-content.mjs --topic <id>`: all 7 topics ok; `--check`: 28 topics, 430 items,
  0 failing, FRQ 0 failing.
- `node scripts/check-apcalcbc-map.mjs --check`: nothing used before it is taught. A preview build
  (`APCALCBC_PUBLISHED=unit-9,skills-math`, scratch out dir) scanned with `scanPages`: 22 pages, no problems.

## Map edits

None.

## Open questions (for `docs/apcalcbc-needs-author.md`)

1. **Meta descriptions.** `calculus-bc/data/descriptions.json` is not mine, and the fallback picks an odd sentence
   (planar-motion lesson: "Direction questions read the signs of ..."). Suggested entries:
   - lessons: math-parametric-vectors "Parametric equations and vectors for Calculus BC: plot a path from t, eliminate the parameter, and find a vector and its length."; parametric-derivatives "Find dy/dx for a parametric curve, tangent lines, and horizontal and vertical tangents, with the slips that cost points."; parametric-second-derivatives "Second derivatives of parametric curves: differentiate dy/dx, then divide by dx/dt, and read concavity."; parametric-arc-length "Arc length of a parametric curve as the integral of speed, exact and calculator lengths, traced once or twice."; vector-derivatives "Vector-valued functions: velocity and acceleration vectors, speed, and velocity estimated from a table."; vector-integrals "Position from velocity in the plane: integrate each component and add the starting point."; planar-motion "Motion in the plane: speed, position, displacement and distance traveled, as the BC free response asks them."
   - notes: same wording works.
2. **Both rates zero (9.1).** The notes say the slope test does not apply when dx/dt = dy/dt = 0 and stop there
   (no limit of dy/dx taught); no item depends on it. Confirm that is the intended scope.
3. **FRQ 2(b) wording.** The rubric gives the interval-with-reason point only for a reason based on dy/dt, per the
   2024 report; confirm that a sign chart of dy/dt with a sentence earns it (AB's rule: a sign chart alone does not).
4. **Two particles.** The CED Unit 9 note asks for care with subscripts when two particles appear; I wrote one
   collision item (9.6 item 15). A two-particle FRQ part could be added in Phase 3 if the exams need one.
