# Self-review: Unit 8, topics 8.4-8.12 (area and volume)

Author pass, 2026-10-13. AB scope only: no shells, no arc length.

## Topics done

| Topic | CED | Items | In sets | Calculator | Figure(s) |
|---|---|---|---|---|---|
| `area-between-curves-x` | 8.4 | 16 | 9 (5 + 4) | 4 | `area-between-x-strip` |
| `area-between-curves-y` | 8.5 | 16 | 9 | 4 | `area-between-y-strip`, `area-y-sine-region` (calculator stimulus) |
| `area-multiple-crossings` | 8.6 | 16 | 9 | 4 | `area-three-crossings` |
| `cross-sections-squares` | 8.7 | 16 | 9 | 4 | `square-sections-solid` |
| `cross-sections-triangles` | 8.8 | 16 | 9 | 4 | `triangle-sections-solid`, `semicircle-sections-solid` |
| `disc-method-axes` | 8.9 | 16 | 9 | 4 | `disc-solid-x-axis` |
| `disc-method-other-axes` | 8.10 | 16 | 9 | 4 | `disc-solid-line` |
| `washer-method-axes` | 8.11 | 16 | 9 | 4 | `washer-solid-x-axis` |
| `washer-method-other-axes` | 8.12 | 16 | 9 | 4 | `washer-solid-line` |

Totals: 144 items (75 numeric, 10 `expr`, 59 single or select-all), 164 authored mistakes, 18 stimulus sets
(one no-calculator graph set of 5 and one calculator set of 4 per topic, the calculator sets with crossings found
numerically), every topic at least 60% apply/analyze and 56% in sets. Each topic has a lesson (6-7 check items),
notes (500+ words, 2-3 worked examples, a comparison table), glossary for the concept it owns, and figure
registrations. `node scripts/check-apcalc-content.mjs --topic <id>`: ok for all nine;
`node scripts/check-apcalc-map.mjs --check`: clean; built pages (`APCALC_PUBLISHED=unit-8`) rescanned for the
ordering rule: clean.

Misses targeted (each has items with authored mistakes and a notes section): top minus bottom and dropped
parentheses; limits from solving f = g (not zeros, not the other variable); right minus left with y-limits;
net integral vs split area, absolute value outside the integral; square of the difference vs difference of
squares (cross sections and washers); missing π; radius not squared; term-by-term squaring; radius measured
from the axis (k - f, f - k, negative k, far edge flips when the axis is above or to the right); equilateral
√3/4 s², semicircle π/8 s² (diameter vs radius), right isosceles s²/2 vs s²/4; degree mode; three decimals;
units of volume and area in context.

## FRQs (type `area`, 9 points each)

| Id | Calc | Parts (points) |
|---|---|---|
| `frq-u8-region-exponential` | yes | f = 5 - x², g = e^(x/2), crossings numerical. (a) area 10.309 (2); (b) washers about y = -2, 297.437 (3); (c) squares, 33.467 (2); (d) integral expression about y = 6 (2) |
| `frq-u8-region-log-line` | yes | y = ln x, y = 4 - x, x-axis; crossing c = 2.926. (a) area 1.792, in y or split in x (2); (b) washers about x = 5 in dy, 27.403 (3); (c) semicircles, split at c, 0.532 (2); (d) equation for y = k halving the area (2) |
| `frq-u8-region-two-parabolas` | no | f = 6x - x², g = x². (a) area 9 (2); (b) washers about y = -1, 99π (3); (c) semicircle cross sections, expression only (2); (d) washers about x = -1 in dy, expression only (2) |

## Figures

`scripts/apcalc-figures/unit-8b.mjs` (run `node scripts/apcalc-figures/unit-8b.mjs`) writes 11 SVGs to
`calculus/figures/`. 2D panels sample the stated functions; the solids are real 3D meshes (surface of
revolution, or prisms standing on the base) under a perspective camera, drawn back to front with the far wall
opaque, the highlighted slice opaque and the near wall translucent, outlined by the convex hull of the rings.
Each was rendered to PNG with Playwright and checked: curves match their functions, shading is exactly
between the stated curves, slices sit inside the solid, labels clear of curves. Named `unit-8b` because
another author owns 8.1-8.3.

## Numeric recheck

A scratch script recomputed all 75 numeric keys from their own integrals (10-point Gauss-Legendre, crossings
by bisection; it does not read the keys) and matched every key. Through the runtime grader
(`calc-questions.js` in the test harness), every key typed exactly, and for calculator items rounded and
truncated to three places, with its unit where `askUnit`, grades right. All 140 numeric mistakes grade wrong,
are matched to their own feedback, and are reproduced by recomputing the slip they describe. All 10 `expr` keys
grade right through `ApCalcExpr.grade`, and their 24 mistakes grade wrong. Every FRQ value was recomputed the
same way. FRQ 3(d) was also cross-checked with a shell-method integral (45π); that is a check only, and no
shells appear in the content. Result: ALL OK.

## Map edits

None.

## Open questions for a person

1. **No-calculator FRQ 3(d)** asks for washers about x = -1 in y, which needs x = 3 - √(9 - y) from
   y = 6x - x². This is within scope (inverse functions), but it is hard for a no-calculator part. A reviewer
   may prefer a horizontal line here.
2. **Isosceles right triangles with the hypotenuse in the base** (area s²/4) are included in 8.8 beside
   equilateral triangles, legs in the base, and semicircles. They are common in released-style practice, but
   the CED text for 8.8 was not read (needs-author ced-exclusions).
3. **Dark mode**: `calc.css` inverts figure images in dark mode. The shaded 3D solids were checked in light
   mode only.
4. **One shared value in 8.12, item 8**: two different slips (squaring R - r, or measuring from y = +1) give
   the same number for that region, since ∫ h·h′ = 0 between the crossings. The feedback names both.
5. Lesson "Next" links use the CED number only ("Next: 8.7"), so a page never names a later topic's concept.
