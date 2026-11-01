# Independent accuracy review: Unit 3 (topics 3.1-3.15)

Reviewer: independent (not the author), 2026-10-31. Brief: `docs/apprecalc-briefs/review-common.md`.
Self-checks read: `self-d.md` (3.1-3.7), `self-e.md` (3.8-3.15).

## Scope and what was checked

- **15 topics**, every item read in full: 247 bank items (stems, options, keys, every option explanation, every
  numeric and `expr` mistake, predict variables, order steps), 30 stimuli.
- **15 lessons** (hook, prerequisites, figure caption, chain, ideas, misconception, summary; check items are bank
  references), **15 notes pages** (every worked example recomputed by hand), **24 glossary definitions**.
- **8 FRQs**: `frq-q1-trig-composition`, `frq-q3-ferris-wheel`, `frq-q3-tide`, `frq-q3-spring`,
  `frq-q3-waterwheel`, `frq-q4-trig-equation-interval`, `frq-q4-single-tangent`, `frq-q4-single-sine`: every part,
  rubric line, accept list and sample; every alternative (a, c) pair in the Q3 rubrics checked to reproduce the
  stated starting point.
- **10 "Make it specific" prompts** in `justify/unit-3.json` (values recomputed; earns/misses read).
- **Figures**: all 21 Unit 3 SVGs and all 23 plot-spec stimuli (plus the Q1 FRQ plot) rendered to PNG with
  Playwright and the site CSS, and checked against the stated functions (landmarks, asymptotes, unscaled Q3 graphs
  measured for the right proportions: waterline at 1/3 radius, midline heights, quarter-period spacing).
- **CED**: the Unit 3 pages could not be read (WebFetch stops in Unit 2; direct download 403 at the proxy; scraper
  out of credits). Learning objectives were checked against `framework.md` section 3 only. See `u3-ced-unread`.

## Recheck by code

Scratch scripts (reviewer's own, not committed): `verify.mjs`, `brute.mjs`, `render.mjs`.

- **64 numeric keys** recomputed from the stems with independently written code and graded through the runtime
  (`pcalc-expr.js`, `pcalc-math.js`, `pcalc-questions.js` in the test harness): 64/64 match. Every calculator key
  (8) accepts the value rounded and truncated to three decimals; no no-calculator key is a rounded decimal. Every
  authored numeric mistake (about 150) grades wrong.
- **14 `expr` keys** compared with independent functions at 81 points across each domain: 14/14 equal. Every
  authored `expr` mistake grades wrong and shows its own `why`, after one fix (below). Form items (`trig`, `only`)
  checked.
- **"All solutions" items brute-forced** over their intervals (3.10 items 1-4, 7-11, 13, 15-17; 3.12 items 4, 14;
  3.14 items 4, 6; the 3.15 zero set; the spring and greenhouse calculator solves; inequalities 3.10-2, -9, -17;
  `polar-rates-12` distance intervals): all keys right, no missed or extra solution, every distractor wrong for
  the reason its explanation gives.
- FRQs recomputed: Q1 B ($\sin^{-1}0.75$ route: 1.07979, 2.92021, no third root on [0, 8]), Q1 C(ii) inverse,
  Q4 parts (all solution sets brute-forced), Q3 points and constants.
- Checks: `check-apprecalc-content.mjs --topic` ok for all 15 topics; full run 0 failing (bank, FRQ, meta, tools,
  exams); `check-apprecalc-map.mjs --check`: nothing used before it is taught; `node --test` on the questions,
  plot and syntax suites: 20 pass, 0 fail.

## Changes (worst first)

| Item / file | Old | New | Why |
|---|---|---|---|
| `pcalc-sinusoidal-transformations-1` (expr mistakes) | third mistake `3cos(theta) + 1` | `3sin(theta) + 1`, with its own why | `3cos(theta) + 1` equals the second mistake `3sin(theta + pi/2) + 1`, so its explanation could never show; the no-shift slip was not caught by name |
| `pcalc-tangent-function-13` (rewritten in place, id kept) | "terminal ray through (−3, 4): what is tan θ?" | where the line of that ray meets $x = 1$, key $(1, -\frac{4}{3})$, four new explanations | near-duplicate of `pcalc-sine-cosine-tangent-13` (same task, same skill) with the same answer as `sine-cosine-tangent-3`; the new stem drills the 3.8 lesson idea (tan θ as the height on $x = 1$). Still a lesson check item |
| `pcalc-sine-cosine-tangent-7`, explanation of the Quadrant IV option | "this reads 3 as degrees or miscounts the quarter turns" | "this counts three quarter turns where 3 radians is less than half a turn" | 3 degrees is in Quadrant I, so the stated reason was wrong |
| Lesson `sine-cosine-values`, idea 3 | "For a multiple of π/6, the larger coordinate is √3/2" | "For a reference angle of π/6 or π/3, ..." | false for π/2, π, ... (multiples of π/6 with coordinates 0 and ±1) |
| Stimulus `sec-csc-cot-s1` plot | curve labels "sec" and "cos" drawn on top of each other at (2π, 1) | labels "y = sec x" and "y = cos x (dashed)" placed in the empty middle region | illegible |
| Stimulus `inverse-trig-s1` plot | curve label "y = cos^-1 x" over the endpoint dot and the x-axis label | "y = cos⁻¹ x" placed at (−1.4, 0.6) | overlapped, and the plain "^-1" looked raw |
| Stimulus `trig-equations-s1` plot | curve label at (4π, 0) on top of the x-axis label and the 4π tick | "y = 2 sin x" placed at (2, 2.5) | overlapped |
| Stimulus `tangent-function-s1` plot | curve label "f" on top of the x-axis label at (2π, 0) | "f" beside the middle branch at (1.75, 4.5) | overlapped |
| Stimulus `sinusoidal-transformations-s1` plot | curve label "g" over the end dot at (2π, −2) | "g" at (4.75, 2.6) | overlapped |

**Keys changed: 0** (the `tangent-function-13` rewrite has a new key for a new stem; no existing key was wrong).
No item or FRQ id changed or deleted. Plot labels move only text; every plotted function is unchanged.

## Verified correct, no change

- All Q3 FRQs: five points, both (a, c) sign choices, C(i)/C(ii) reasons; the unscaled figures have the right
  proportions. Q4s: exact keys, every solution, ranges of inverse trig; Q4 FRQs have no stimulus and use `intro`.
  Q1 point split 1+1+2+1+1; Q3/Q4 1+1+2+2 or 2+2+1+1; one rubric line per point; a sample for every part.
- Inverse-trig ranges, radian definition, polar conversions and the four distance cases (3.15) match
  `framework.md`; no half-angle or tangent-sum identity anywhere; no calculus wording outside the trap span in the
  3.7 notes.
- Key-length balance: the correct option is strictly the longest in 18 of 135 single items.
- Two candidate problems were checked and found fine: `periodic-phenomena-s2` and `sinusoidal-modeling-s2` state the
  24-hour repeat and "hours after midnight" in their table captions.

## Open questions for a person (added to `docs/apprecalc-needs-author.md`, "Unit 3 review")

1. `u3-ced-unread`: Unit 3 CED pages and exclusions not readable here; `exclusions-trig` stays open.
2. `u3-rate-at-a-point`: a few explanations (and the spring FRQ's C(ii) rubric) speak of the rate of change at a
   point ("0 at the peak"). Not refused wording, but a teacher should confirm Q3 readers accept it.
3. Already open and unchanged: `frq3-split` (reason points in Q3 C), `q1-coverage` (the trig Q1 has no limit
   part), `calc-in-sets`, `sinreg-items`, tide period of 12 hours.
