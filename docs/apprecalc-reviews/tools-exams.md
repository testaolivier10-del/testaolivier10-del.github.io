# AP® Precalculus Phase 4 review: trainers, practice exams, "Make it specific", formula page

Reviewer: independent (tools-exams scope), 2026-10-31. Brief: `docs/apprecalc-briefs/review-common.md`, adapted.

## What was checked

- **Ten trainers**, built to a scratch site (`APPRECALC_PUBLISHED=unit-1,unit-2,unit-3,unit-4,skills-algebra node
  scripts/build-apprecalc.mjs --out <scratch>`) and served locally. Playwright (Chrome) at 1280 and 360 px: Explore
  screenshots of all ten at both widths, looked at; console errors (none from the tools; only blocked font and
  analytics requests); no horizontal scroll at 360 px. A scripted player opened "Test yourself", picked every
  problem type, and for 2 seeds per type (7 more per type at 360 px for four tools) entered an authored mistake,
  then the key, on every step, recording every feedback line, the "Yours / Right" comparison and the worked
  solution: about 180 problems, every key graded right, every authored mistake given its note, no NaN, Infinity,
  `null` or bare `undefined` on screen. Every drill screenshot (one per type) looked at.
- **Models**: read the generators of all ten; validators recompute every key at 300 seeds per context
  (`scripts/lib/apprecalc-tool-checks/`). Extra scratch scans over every model and context: TeX formatting slips
  (`+ -`, `x - (-2)`, a coefficient 1, `- 0`, a digit run into a numeric base such as `4 3^{x}`), and the unit
  circle's generator plus `recheck` on 40,000 seeds per context.
- **Practice exams**: all 22 exam-only items (`precalculus/data/exams/items.json`) recomputed by my own Python
  (bisection root finder, turning-point scan, `numpy.polyfit`), not by `EXAM_NUMBERS`: every key, and every
  distractor's stated origin (rounded constants, degree mode, wrong order, missed root, sign slip, linear model,
  seventh root, `f(-x)` zeros, `g(f(x))`, `\pi/365` period). Forms rules by `checkForms` (passing).
- **"Make it specific"**: all 30 prompts read (context, prompt, checklist, earns, misses, every builder option and
  note), numbers recomputed (regression, `e^{3.8/1.7}`, tangent values, polar secant, ball domain, cooling value).
- **Formula page**: all 39 `EQ` rows and 8 `NOT_ON` lines in `scripts/lib/apprecalc-entry.mjs`.

## Changes (worst first)

| Where | Old | New | Why |
|---|---|---|---|
| `scripts/lib/apprecalc-entry.mjs` (formula page, inverse trig row) | `\tan^{-1}x \in [-\pi/2, \pi/2]` | `\tan^{-1}x \in (-\pi/2, \pi/2)`, with a note that the endpoints are left out | Math error: the range of inverse tangent is open. |
| `precalculus/data/justify/unit-3.json` `u3-rate-increasing-interval` | Earns answer and checklist read concavity from the graph's look ("leveling off") | Rates over equal intervals with values: $h(3) \approx 6.464$, rates $-3.536$ on $[2,3]$ and $-1.464$ on $[3,4]$, increasing, so concave up | The course rule (CED 1.3, authoring guide): concavity from average rates over equal intervals, tied to values. Numbers added to `JUSTIFY_NUMBERS` (`scripts/lib/apprecalc-exams.mjs`). |
| `precalculus/assets/tools/pcalc-tools.js` (`markSvg`, shared) | Drill curve marks ran past the plot frame (a rational branch through the axis labels) | Curves and paths clipped to the plot area | Visual bug in every trainer drawing curve marks. |
| `precalculus/assets/tools/function-lab.css` | Asymptote marks in the drill drawn as solid lines, looking like part of the graph | Dashed | An asymptote is not part of the graph. |
| `precalculus/assets/tools/math/function-lab.js` | Texts such as "Solve $-1(x - (4)) = -3$, so $x = -3 \div -1 + (4)$", "$x - (-2)$ is small", "$2^{x-h}$" with the letters left in, "factor first, $x + 2 = (x + 2)$" | Real numbers: "$-(x - 4) = -3$, so $x = -3 \div (-1) + 4$", "$x + 2$ is small", "$2^{x - 2}$", "$x + 2 = x - (-2)$, so $h = -2$"; a mistake note that would have said "add 0" is dropped when $h = 0$ | Readability of feedback and worked solutions. |
| `precalculus/assets/tools/math/unit-circle.js` (graphs drill solution) | "decreasing on $(\pi/2, \pi)$ and $(\pi, 3\pi/2)$", cosine "decreasing on $(0, \pi/2)$ and $(\pi/2, \pi)$" | One interval each: sine decreasing on $(\pi/2, 3\pi/2)$; cosine decreasing on $(0, \pi)$, increasing on $(\pi, 2\pi)$ | Split intervals suggested a change at $\pi$. |
| `precalculus/assets/tools/unit-circle.js` | "secant slopes on the two halves" cut off at the right edge when the interval is the last quarter | Anchored inside the plot | Clipped label. |
| `precalculus/assets/tools/math/symbolic-steps.js` (exp-eq) | "Solve $43^{3x} + 1 = 49$" (reads as 43 to a power) | "Solve $4 \cdot 3^{3x} + 1 = 49$" (dot only for a numeric base) | Ambiguous problem text. |
| `precalculus/assets/tools/math/poly-rational.js` (ha drill solution) | $\frac{1x^{5}}{3x^{3}}$ | $\frac{x^{5}}{3x^{3}}$ | Coefficient 1 printed. |
| `precalculus/assets/tools/math/exp-log-lab.js` (inverse drill) | "Right 27.0000" for a whole-number key | "Right 27" | Four decimals shown for whole keys. |
| `precalculus/assets/tools/math/rate-of-change.js` (quadratic drill) | "By how much does the average rate of change go up…?" with a negative key | "Find the later rate minus the earlier one: by how much does the average rate of change change…?" | "Go up by −8" confused the sign. |
| `precalculus/assets/tools/exp-log-lab.css` | "Semi-log" view tab cut to "Semi-l…" at 1280 px | Tighter tab padding for this tool | Truncated label. |
| `precalculus/assets/tools/unit-circle.js` | View tab "sin and cos" cut to "sin an…" at 360 px | "sin, cos" | Truncated label. |
| `undefined-t2`: `symbolic-steps.js`, `math/symbolic-steps.js`, `math/poly-rational.js` | "not defined" (legend, band labels, hole notes, log-equation notes) | "undefined" (log notes phrased "the term $\log_2 x$ is undefined" so the drill checker's word rule passes) | Spec decision 17. |
| `precalculus/data/exams/items.json` `pcalc-exam-2-01` | "(Either bracket at a turning point is accepted.)" | "(Open or closed brackets at the turning points are both correct.)" | Clearer in an MCQ explanation. |

**Keys changed: none.** All 22 exam-only keys and every distractor's stated origin match my recomputation (for
example 1-01 9.355 at $x \approx 3.633$; 1-03 $a = -3.429$; 1-04 33.714 vs 33.685 from rounded constants; 1-10
5.922 h; 2-05 three roots $-1.383, 0.284, 5.100$; 2-09 120.561 and 221.939; 2-11 0.207 and 1.167). Every trainer
key in the playthrough was graded right; no model math error was found (regression least squares match `numpy`,
reference angles, tangent at the axes, polar and parametric rates, determinants and dot products checked by hand
in the transcripts).

## The unit-circle validator failure ("seed 7932 prints NaN")

Not reproducible: six full validator runs clean, generator plus `recheck` clean on 40,000 seeds per context, no
randomness or state in the model or the sweep. Seed 7932 is `seedOf(1)`, the first seed of a context, so a whole
context failed at once; the likely cause is the validator running while the unit circle was being switched from
"not defined" to "undefined" before `_drills.mjs` allowed the word (the message is "prints NaN, undefined or
Infinity"). Recorded in needs-author `tools-exams-uc-nan` (closed; reopen with the full message if it recurs).

## The bar (interactive, professional, simple first, full screen, phone)

All ten meet it after the fixes above: each lands on one picture with one cue ("Drag P around the circle", "Try
each model and watch the residual plot"), detail behind "Why?" and a details drawer, a full-screen button, linked
representations (circle and unrolled graph, secants and the rate bar chart, factor chips and the sign strip, polar
curve and $r(\theta)$ with away/toward bands). At 360 px the stage stacks above the dock, text stays legible, no
horizontal scroll.

## Check results

- `node scripts/check-apprecalc-content.mjs --check`: 69 topics, 1046 items, 0 failing; exams 2 forms, 22
  exam-only items, 30 prompts, 0 failing.
- `node scripts/check-apprecalc-map.mjs --check`: nothing used before it is taught.
- `node --test scripts/test/apprecalc-*.test.mjs`: 143 pass, 0 fail.

## Open points (in `docs/apprecalc-needs-author.md`)

- `tools-exams-hint-labels`: cosmetic label wording in two drills.
- Still open from Phase 3 and in my scope, no change made: `phase3-exam-only-share` (now checked by hand, all
  sound), `phase3-unit-split`, `phase3-frq-choice`, `phase3-formula-page` (a teacher should confirm the page; the
  slant asymptote is folded into the horizontal asymptote row).
- Could not read the CED PDF in this pass; scope statements were taken from `docs/apprecalc-research/framework.md`.
