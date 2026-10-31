# AP® Calculus BC, author A self-report (Phase 1)

Brief: `docs/apcalcbc-briefs/a.md`. Scratch work (topic scripts, verifier, AB edit script, test builds):
`/tmp/claude-0/-home-claude/21429af2-a07e-573a-a9e9-94d30a4ce057/scratchpad/bc-a/`.

## Done

| Topic | CED | Items | Types | Sets | Notes words | Figure |
|---|---|---|---|---|---|---|
| `integration-by-parts` | 6.11 | 16 | 8 single, 4 numeric, 4 expr | tabular table (5), values of f and f′ (4) | 676 | `integration-by-parts-areas` |
| `partial-fractions` | 6.12 | 16 | 6 single, 6 numeric, 4 expr | decomposition steps (5), graph of 6/(x² + 2x) (4) | 726 | `partial-fractions-split` |
| `improper-integrals` | 6.13 | 16 | 9 single, 7 numeric | graph of 6/(x + 2)² (5), table of two p-integrals (4) | 624 | `improper-integrals-two-tails` |
| `eulers-method` | 7.5 | 16 | 6 single, 10 numeric | slope field with two Euler steps (5), Euler table (4) | 655 | `eulers-method-steps` |
| `logistic-models` | 7.9 | 16 | 9 single, 7 numeric | fish table with K to read (5), graph of dP/dt against P (4) | 617 | `logistic-models-curve` |
| `arc-length` | 8.13 | 16 | 7 single, 9 numeric (2 calculator) | graph with chords (4), table of f′ (4) | 643 | `arc-length-chords` |

96 items (45 single, 43 numeric, 8 expr), 12 stimulus sets (50-56% of each topic's items), 94-100% apply/analyze,
correct option longest in at most 2 of a topic's singles, no absolute words in distractors. Each topic has a lesson
(hook, 2 prerequisite questions, figure, 4-5 step chain, 4 key ideas, misconception, 6 check items, summary),
notes with worked examples before every calculation type, a glossary entry for each concept it teaches (8 in all:
`integration-by-parts`, `partial-fractions`, `improper-integral`, `convergence`, `eulers-method`, `logistic-model`,
`carrying-capacity`, `arc-length`) and a figure registered in `calculus-bc/data/figures/<topic>.json`.

FRQs (type `techniques`, no calculator, 9 points, one rubric line per point, full-credit sample per part):
- `frq-u6-parts-improper`: (a) 3 parts on a definite integral, (b) 4 improper integral with limit notation and
  L'Hospital, converges to 3, (c) 2 a divergent improper integral.
- `frq-u7-euler-arc-length`: (a) 3 Euler, two steps, labeled table, (b) 2 d²y/dx² and under/over for the first step
  (a tangent line, so the concavity argument is rigorous), (c) 1 arc length setup in terms of x and f(x), (d) 3 an
  exact arc length, 59/24.

Figures: six SVGs in `calculus-bc/figures/`, drawn from the functions by `scripts/apcalcbc-figures/author-a.mjs`
(emerald `#0A5A34`, Okabe-Ito blue and vermillion), each with checks inside the generator (the partial fraction
identity, the Euler table, the logistic curve solves its equation, the exact arc length against a numerical integral).
The two two-panel figures are stacked for phone width.

## Checks

- `node scripts/check-apcalcbc-content.mjs --topic <id>`: all six ok; `--check`: 0 failing (FRQs included).
- `node scripts/check-apcalcbc-map.mjs --check`: nothing used before it is taught.
- Scratch BC build with Units 6-8 published (`APCALCBC_PUBLISHED=unit-6,unit-7,unit-8 ... --out <scratch>`), its 72
  pages scanned with the map check's `scanPages`: clean, with the AB edits below applied to a scratch copy of AB's data;
  without them `calculus-bc/notes/rewriting-integrands.html` fails (6.10 names partial fractions, taught at 6.12).
- Numeric recheck (`verify.mjs` in the scratch folder): all 51 numeric and expr keys graded right and every authored
  mistake graded wrong through the runtime (`calc-expr.js`, `cbc-interval.js`, `calc-questions.js` in a vm; the
  in-context item graded wrong without its unit); every numeric key recomputed independently (Simpson integrals,
  Euler loops, chord lengths) and every antiderivative key differentiated numerically against its integrand. The
  FRQ numbers are rechecked the same way (`frq.mjs`).
- Pages viewed at 400 px in headless Chrome: wide display math split, two tables narrowed.
- `node scripts/build-apcalc.mjs --check`: AB untouched by me (no AB file changed).

## Not done: the BC wording in AB's 6.10 and 6.14 (needs the lead)

The brief asks for `calc-ab-only`/`cbc-only` edits in AB's `rewriting-integrands` and `choosing-integration-methods`
with AB's build byte-identical. That is not possible with the generator as it is: `courseOnly` drops `cbc-only`
elements from AB pages but **keeps the `<span class="calc-ab-only">` wrapper in AB's output**, so AB's two notes pages
change. Tested on a scratch copy of AB's data:

- the `cbc-only` additions alone are byte-neutral for AB (each sits directly against its neighbour, no new whitespace);
- with the `calc-ab-only` wrappers unwrapped at load, a full AB build is **byte-identical** to the current one.

Fix (generator, not mine): in `courseOnly` for AB, replace each `calc-ab-only` element by its inner text instead of
keeping it (and, optionally, unwrap `cbc-only` on BC). Then apply the edits with
`python3 <scratch>/ab-edits.py calculus/data`. They: wrap 6.10's going-further aside and give BC a version that does
not name partial fractions (points to 6.12); in 6.14 change "every technique on the AB exam" to the BC list, the
flowchart caption, add two list items (parts; distinct linear factors), two look-alike rows and a BC closing aside,
and append the two BC questions to the lesson summary. I left AB's files unchanged so `build-apcalc.mjs --check`
stays clean for everyone; until this lands, a BC build with Unit 6 published fails the map check on 6.10.

## Open points (for `docs/apcalcbc-needs-author.md`)

1. **6.10 lesson's "Next" link** points at 6.14; on BC the next topic is 6.11. A connection's `href` cannot be made
   course-specific with `cbc-only`; the generator's own prev/next nav is right, so this only affects that one link.
2. **6.14's flowchart figure** (AB's `integration-flowchart`) shows four questions; the BC text adds two. A BC variant
   of the figure would match.
3. **Map: `split-integral`** ("split the integral") is taught at 8.6 in AB's map, although splitting an integral at a
   point is 6.6's additivity. 6.13 had to avoid the phrase ("write it as two integrals that meet there"). Consider
   moving the concept to `integral-properties`.
4. **Euler over/under with several steps.** Concavity alone does not always fix the sign of a multi-step Euler error
   (it also depends on how the slope changes with y). The one multi-step item (`cbc-eulers-method-3`, dy/dx = x + y)
   holds because all solution curves in the region are concave up and the slope increases with y; the FRQ asks only
   about the first step. Other authors' items should follow the same care.
5. **Logistic scope.** Items interpret only; the fish table's values and the figure's curve come from the closed-form
   solution, but no item or note asks for or shows it (the notes say a formula is not needed).
6. **Figures on phones.** The single-panel figures are 760 px wide with 13-15 px labels, like AB's; on a phone the
   labels are small. The two-panel ones were stacked. A site-wide rule on figure text size would help both courses.

No map edits.
