# Self-review: AP® Calculus AB Units 3 and 4 (content author, 2026-10-13)

Brief: `docs/apcalc-briefs/content-common.md`. Scope: Unit 3 (3.1-3.6) and Unit 4 (4.1-4.7), four FRQs.
Not yet independently reviewed; every number below was rechecked by code (see "Numeric recheck").

## Topics done (13 of 13)

Each topic has a lesson (hook, 2-3 prereqs pointing at earlier topics, figure, 4-step cause-and-effect chain,
key ideas, misconception aimed at a reader-report error, 6 check items, summary), notes (`<h2>` sections,
2-3 worked examples in `<div class="worked">` before each calculation type, comparison tables), questions,
glossary for every concept the map assigns to the topic, and a figure.

| Topic | Items | In stimulus sets | Apply/analyze | Types | Calculator |
|---|---|---|---|---|---|
| chain-rule | 17 | 53% | 100% | expr 4, multi 1, numeric 5, single 7 | 0 |
| implicit-differentiation | 16 | 56% | 88% | expr 3, multi 1, numeric 3, single 9 | 0 |
| inverse-function-derivatives | 16 | 56% | 100% | expr 2, numeric 6, single 8 | 0 |
| inverse-trig-derivatives | 16 | 50% | 88% | expr 4, numeric 4, single 8 | 0 |
| choosing-derivative-rules | 16 | 56% | 94% | expr 3, numeric 7, single 6 | 0 |
| higher-order-derivatives | 16 | 50% | 94% | expr 4, numeric 6, single 6 | 0 |
| derivative-in-context | 15 | 53% | 93% | numeric 5, single 10 | 0 |
| straight-line-motion | 16 | 62% | 100% | expr 2, multi 1, numeric 5, single 8 | 0 |
| rates-in-context | 15 | 53% | 87% | numeric 8, single 7 | 4 |
| related-rates-intro | 16 | 50% | 94% | expr 2, numeric 6, single 8 | 0 |
| solving-related-rates | 16 | 62% | 94% | numeric 8, single 8 | 0 |
| local-linearity | 16 | 56% | 94% | expr 2, numeric 6, single 8 | 0 |
| lhospitals-rule | 16 | 56% | 94% | numeric 6, single 10 | 0 |
| **Total** | **207** | | | 26 expr, 75 numeric | 4 |

Notes total about 9,150 words (all above 500). Stimuli mix representations: tables of f, g, f′, g′ (chain,
inverse, choosing, L'Hospital), graphs of g, f′, v, P(t), ln x and implicit curves (plotted from the
function by `ApCalcPlot`), formulas, context tables with unequal widths (snow depth, roasting cost), and
diagrams (ladder, cone tank). Classic misses targeted with authored `mistakes`: the inside derivative,
f′ read at x instead of g(x), dy/dx missing on y-terms and the product rule on xy, 1/f′(a) instead of
1/f′(f⁻¹(a)), units and rates of rates, speed vs velocity, "a < 0 means slowing down", substituting
before differentiating, decreasing rates entered as positive, L'Hospital without checking the form,
over/under from concavity (not from the sign of f′). Key-length balance, absolute words and
near-duplicates against the whole bank were checked and fixed.

## FRQs (4, 9 points each, one rubric line per point, full-credit sample per part)

| Id | Type | Calc | Parts (points) |
|---|---|---|---|
| `frq-u3-implicit-oval` | implicit | no | x² − xy + y² + 2x − y = 2: show dy/dx (2), tangent line at (0, −1) (1), horizontal tangents (0, 2) and (−2, −2) with denominator check (3), particle at (1, 1) with dy/dt = 3 gives dx/dt = 0, vertical tangent (3) |
| `frq-u4-implicit-cubic` | implicit | no | y³ − xy = 6: show dy/dx (2), tangent line at (1, 2) and approximation 112/55 (2), no horizontal tangent (2), particle at (7, 3) with dx/dt = −2 gives dy/dt = −3/10, decreasing (3) |
| `frq-u4-motion-two-particles` | motion | no | x_P = 2t³ − 15t² + 24t + 5: v_P(2) = −12, left (2); a_P(2) = −6, speeding up with both signs (2); direction changes at t = 1, 4 by sign change (2); v_Q for (t − 2)e^(−t/2) by product and chain rules, opposite directions at t = 3 (3). Derivatives only |
| `frq-u4-table-medicine` | table | yes | difference quotient −1.05 mg/L per hour with units (2), interpretation (1), IVT with continuity for C = 10 on (1, 3) (2), model M(t) = 10te^(−0.3t): M′(5) ≈ −1.116 (2), M″(6) ≈ −0.099 so the rate is decreasing (2) |

## Figures (17, `scripts/apcalc-figures/units-3-4.mjs`, every curve sampled from its function)

Lessons: `chain-sin-squeeze`, `implicit-tilted-ellipse`, `inverse-reciprocal-slopes`, `arcsin-steepening`,
`derivative-rule-chooser` (diagram), `f-first-second-derivatives`, `cooling-tangent-units`,
`motion-speeding-up`, `warming-rate-panels`, `ripple-related-rates` (diagram), `ladder-sliding-wall`,
`sqrt-tangent-overestimate`, `lhospital-tangent-ratio`. Stimuli and notes: `ladder-sliding-question` and
`cone-tank-question` (the givens only, so the stimulus does not show the answer), `cone-tank-similar`,
`implicit-cubic-curve` (inlined into the cubic FRQ, see open question 1). All rendered to PNG with
Playwright and inspected; overlapping labels were moved.

## Numeric recheck

Scratch script (`verify.mjs`, not committed): every numeric key and every authored mistake value was
recomputed from its definition (tables, formulas, finite-difference derivatives), and every expr key was
compared at 10-19 points with a numerical derivative of the stated function (or −F_x/F_y for implicit
curves). Then the runtime grader graded each key right (with each listed unit when `askUnit`) and each
mistake wrong and matched to its feedback. Result: 75 numeric, 26 expr, 198 mistakes, all pass. One
authored mistake was wrong and fixed (local-linearity, f(4.8) from the line at x = 2 is −17/5). FRQ values
(points on the curves, slopes, dx/dt = 0 at (1, 1), Newton check of the cubic approximation 2.0364 vs
2.0363, v_Q(3), M′(5), M″(6)) were rechecked the same way.
`node scripts/check-apcalc-content.mjs`: all 13 topics and 4 FRQs clean. `node scripts/check-apcalc-map.mjs`:
nothing used before it is taught. `APCALC_PUBLISHED=unit-3,unit-4 node scripts/build-apcalc.mjs --out <scratch>`
builds 13 topics.

## Map edits

None.

## Open questions (for needs-author)

1. **FRQ figure stimuli cannot pass the check.** `checkFrq` calls `checkStimulus('(frq)', f.stimulus, {}, err)`
   with an empty figure registry, so any `"figure"` stimulus fails as unknown. I inlined the cubic curve SVG
   (role="img", aria-label, unique clip id). Suggest passing `figuresAll()` there.
2. **L'Hospital from a table.** Evaluating lim f′(x)/g′(x) as f′(a)/g′(a) needs f′ and g′ continuous at a;
   the table stimulus says "twice-differentiable" to cover it. A reviewer may prefer the exam's wording.
3. **Inverse trig scope (3.4).** I teach arcsin, arccos and arctan and mention the other three only as
   derivable; items use the three. Unit 3 is not text-verified against the CED (framework.md).
4. **Concavity in 4.6.** The map makes local-linearity teach "concave up/down" (full treatment in 5.6), so
   the notes define it by the sign of f″ only. Some items offer the right conclusion with a wrong reason
   (for example "an overestimate, because f′(5) > 0"); this mirrors the exam's reason-based options but is
   worth a reviewer's look.
5. **Unit words in the grader.** `UNIT_WORDS` has no kilogram, mg, ticket or bacteria, and "°C" normalizes
   differently from "degrees Celsius"; I listed the common spellings in `units`. Adding these words would
   make typed units more forgiving.
6. **Calculator items.** Only one calculator set (4 items, soup temperature) plus the calculator FRQ; Units 3-4
   are mostly no-calculator on the exam. More calculator items could come from the practice exams.
