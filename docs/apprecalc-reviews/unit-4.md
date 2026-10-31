# Unit 4 review (topics 4.1-4.14, beyond the exam)

Branch `claude/apprecalc`, 2026-10-31. Independent accuracy review following `docs/apprecalc-briefs/review-common.md`.
Scope: `parametric-functions`, `parametric-motion`, `parametric-rates`, `parametric-circles-lines`,
`implicit-functions`, `conic-sections`, `parametrizing-implicit`, `vectors`, `vector-valued-functions`, `matrices`,
`inverse-determinant`, `linear-transformations`, `matrices-as-functions`, `matrix-modeling`: lesson, notes, glossary
and figure entries for each, 226 items in 28 stimulus sets, the 23 SVG figures from `scripts/apprecalc-figures/f.mjs`
and the 4 `plot` stimuli.

## What was checked

- Every lesson (hook, prereq, chain, ideas, misconception, summary), notes page, glossary entry, stem, option, key
  and explanation read against the math.
- Every numeric key (50) recomputed by a scratch script from the stem (my own arithmetic: quadratic formula for the
  thrown ball, the weather chain stepped five times, steady states from the flow balance), then graded through
  `pcalc-questions.js` in a vm: key right, calculator keys right when truncated to three places, every authored
  mistake graded wrong with its note shown. All 16 `expr` keys graded against an equal expression I wrote in another
  form; every authored expr mistake graded wrong; the implicit upper half checked to satisfy $x^2 + xy + y^2 = 7$.
- Every single and multi option recomputed by hand (matrix products, inverses, determinants, rotations, transition
  steps, conic vertices and asymptotes, parametric points and directions).
- All 23 figures and the 4 `plot` stimuli rendered to PNG in Chrome and compared with the functions and numbers
  they show (points, arrows and direction of travel, centers, radii, vertices, asymptotes, parallelograms, images of
  the unit square, the bike-share diagram).
- Scope: no item is `exam: true`, no FRQ or exam form references a Unit 4 item, no calculus words (content check).
- CED: the PDF text read through WebFetch stops at Topic 2.10, so no Unit 4 topic page was read (the front matter
  confirms "The Unit 4 topics are additional and excluded from the AP Exam", 0% weighting, and the topic titles).
  Third-party CED-aligned guides were used for the two open points (below).

## Recheck result

0 key errors, 0 mismatches between my values and the keys, 0 authored mistakes graded right. Keys changed: none.

## Changes

| File | Item / place | What was wrong | Fix |
|---|---|---|---|
| questions/parametric-motion | 16 (order) | Steps 1 and 2 ($x(t)$, then $y(t)$) could be done in either order, so a right answer could be graded wrong | Steps rewritten so the order is forced (both coordinates; mark turnarounds; split; combine) |
| questions/vector-valued-functions | 16 (order) | "Subtract" and "find the elapsed time" interchangeable | Steps: positions, subtract, divide by elapsed time, read units |
| questions/inverse-determinant | 16 (order) | "Swap the diagonal" and "change the signs" interchangeable | Swap-and-negate merged; last step is the check $AA^{-1} = I$ |
| questions/matrix-modeling | 16 (order) | "Write $T$" and "write the state" interchangeable | Steps: write $T$, check columns add to 1, $\mathbf{x}_1$, $\mathbf{x}_2$ |
| questions/conic-sections | 9, option 3 | "No: no points with $x$ near 0 because $a = 2$" is true (no points for $|x| < 2$), a second defensible key | Option is now "a hyperbola never crosses either axis" (false: it meets the $x$-axis at $(\pm 2, 0)$) |
| questions/matrices | 14, option 2 | $\left[4, 19\right]$ with the why "uses columns instead of rows"; that slip gives $\left[2, 6\right]$ | Option is $\left[2, 6\right]$ |
| questions/vectors | 9, why | `$30^circ$` (missing backslash) rendered wrong | `$30^\circ$` |
| questions/parametric-functions | 1, option 3 why | Said the slip was $t^3 - 4$, which gives $-3$, not $-4$ | The slip is keeping only $-4t$ |
| questions/inverse-determinant | 5, why | "$B[1, -2] = [0, 0] = [0, 0]$" (second product missing) | "$B[1, -2] = [0, 0]$ and $B[0, 0] = [0, 0]$" |
| questions/inverse-determinant | 13, option 2 why | Said "negate only the off-diagonal entries"; the option is $-1$ times the inverse | Names the real slip |
| questions/matrices-as-functions | 7, option 2 why | Same as above | Same fix |
| questions/inverse-determinant | 6, mistake 20 why | "four corner triangles"; the rectangle minus the parallelogram is four triangles and two unit squares | "covers the pieces outside the parallelogram" |
| questions/parametrizing-implicit | 11, option 3 why | Said $(t + 1, t^2)$ gives "$x = \sqrt{y} + 1$ on part of the curve" | It traces $y = (x - 1)^2$, a parabola opening up |
| questions/vector-valued-functions | 4, option 3 why | "divides 3 by 6" did not explain $\langle \frac{1}{2}, 1 \rangle$ | Time divided by each component |
| questions/vectors | 4, mistake 7 why | Did not name the slip | Names the dropped sign |
| questions/matrix-modeling | 14, option 2 why | "for this $T$" with no $T$ in the item | General statement: columns of $T^{-1}$ add to 1 |
| questions/implicit-functions | 2, option 2 why | "two points above and below $x = 1$" unclear | Names $(1, -3)$ |
| questions/conic-sections | 10, option 0 | "3 units across" reads as width 3 | "An ellipse with vertices $(\pm 3, 0)$" |
| lessons | parametrizing-implicit misconception; chains in 4.7, 4.9, 4.11, 4.14 | "3 wide and 2 tall from the center"; bare letters (t, p, x, y, A, T, 1) outside math | Reworded; letters in `$...$` |
| notes/parametric-circles-lines | last line | "a vertical line when $a = 0$" (needs $b \ne 0$) | Added "and $b \ne 0$" |
| glossary | vector; transition-matrix | "a moves a across"; "T" used before it is named | Reworded |
| figures (f.mjs) | `parametric-circles-lines-segment`, `vectors-grid` | "t = 4 (6, 1)" ran into the $x$ axis label; "(2, 1)" sat on the arrow $\mathbf{u}$ | Labels moved; both figures regenerated (no other figure changed) |

No ids changed, nothing deleted, no key values changed.

## Checks after the fixes

- `node scripts/check-apprecalc-content.mjs --topic <id>` for all 14 topics: 0 failing. Full run: 69 topics,
  1046 items, 0 failing.
- `node scripts/check-apprecalc-map.mjs`: nothing used before it is taught.
- Scratch recheck rerun: 66 numeric and expr items, 0 problems.

## Open points for a person

- `unit4-transition-matrix`: marked resolved. Two CED-aligned 4.14 guides (Albert, Fiveable) use column state
  vectors, "from" columns adding to 1, $T$ on the left and $T^{-1}$ for the previous state, as the course does.
  The CED page itself was not read.
- `unit4-scope`: still open (needs-author `unit4-scope-review`). Third-party 4.6 material mentions a parabola's focus
  and directrix and an ellipse's foci, which 4.6 does not teach; confirm against the CED's 4.6.
- Minor, not changed: a few figure labels still touch a tick label (`parametric-functions-trace` "t = 0" near
  $-1$, `parametric-circles-lines-both` "t = 0" near the tick 2, `inverse-determinant-s2` "(1, 3)" on an edge);
  readable as drawn.
