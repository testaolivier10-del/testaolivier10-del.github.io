# Self-review: Unit 1, topics 1.7-1.16 (author u1b, 2026-10-13)

## Done

| CED | Topic | Items | In sets | Single / numeric / multi / expr / calc | Figure |
|---|---|---|---|---|---|
| 1.7 | choosing-limit-methods | 17 | 9 | 6 / 9 / 1 / 1 / 0 | `limit-method-map` (decision map) |
| 1.8 | squeeze-theorem | 17 | 8 | 8 / 8 / 1 / 0 / 0 | `squeeze-x-sin` |
| 1.9 | limit-representations | 16 | 9 | 9 / 6 / 1 / 0 / 0 | `limit-three-views` |
| 1.10 | discontinuity-types | 16 | 8 | 12 / 3 / 1 / 0 / 0 | `discontinuity-types` |
| 1.11 | continuity-at-a-point | 16 | 8 | 12 / 3 / 1 / 0 / 0 | `continuity-three-conditions` |
| 1.12 | continuity-on-intervals | 16 | 8 | 13 / 2 / 1 / 0 / 0 | `continuity-intervals` |
| 1.13 | removing-discontinuities | 16 | 8 | 6 / 9 / 0 / 1 / 0 | `removing-discontinuity-k` |
| 1.14 | infinite-limits | 16 | 8 | 13 / 2 / 1 / 0 / 0 | `infinite-limits-two-cases` |
| 1.15 | limits-at-infinity | 17 | 8 | 10 / 6 / 1 / 0 / 0 | `end-behavior-growth` |
| 1.16 | intermediate-value-theorem | 17 | 8 | 12 / 4 / 1 / 0 / 2 | `ivt-continuous-vs-jump` |

164 items, 47-56% in stimulus sets per topic (graph stimuli as `plot` specs, tables), 0-1 recall items per topic,
key-longest at most 40% per topic, no absolute words in any of my distractors, 2 of 9 select-all items with one key.
Each topic has lesson (2-3 prereqs, figure, 4-step chain, 5 ideas, misconception, 6-7 checks), notes (600-1,100
words, worked examples before each calculation type, comparison tables), glossary for every concept it teaches.
No FRQs (none assigned).

Files: `calculus/data/{lessons,notes,questions,glossary,figures}/<topic>.*` for the ten topics;
`calculus/figures/<id>.svg` (10); generator `scripts/apcalc-figures/unit-1b.mjs` (run
`node scripts/apcalc-figures/unit-1b.mjs`; every curve sampled from the function its alt text names). Each figure was
rendered to PNG and inspected; overlaps and a too-flat IVT curve were fixed.

## Classic misses targeted

- Continuity: every justification item asks for all three conditions; distractors give a defined value only, limits
  only, "the pieces are polynomials", a value matching one side of a jump, a constant that cannot fix a value/limit
  mismatch (1.13), and one-sided continuity at closed endpoints (1.12, the `(1, 5)` + `[5, 8]` trap).
- IVT: every model answer states "continuous on [a, b]" with a reason and the numbers for "between"; distractors drop
  continuity, drop "between", or claim a location or "exactly one"; a jump graph shows the conclusion failing;
  table items count non-overlapping intervals; a degree-mode calculator mistake is authored.
- Infinite limits vs limits at infinity: a comparison table in 1.15; "= ∞ means the limit does not exist";
  never f(c) = ∞; hole vs asymptote after cancelling; `sqrt(x^2) = |x|` sign trap at -∞; crossing a horizontal asymptote.
- One-sided limits: piecewise and absolute value stimuli, composition f(g(x)) approaching from one side.

## Numeric recheck

Every numeric key, expr key and authored mistake was graded through the runtime (`calc-questions.js`,
`calc-expr.js` via the test harness): keys right, each mistake wrong and matched to its feedback, calculator keys
right at three decimals. Every numeric key (and 52 option keys) was also recomputed independently from the
mathematics (one-sided limits approached numerically, limits at infinity at 1e7/1e8, roots by bisection, sign
changes counted): 106 keyed items, 0 problems. `check-apcalc-content` (per topic): all ten ok; test-wise and
cross-topic duplicate rules clean for my items. `check-apcalc-map`: nothing used before it is taught.

## Map edits

None.

## Open questions (for needs-author)

1. **sin x / x squeeze inequality.** Notes state `cos x <= sin x / x <= 1` near 0 from the unit-circle area argument
   without proof; a reviewer may want the picture added (a trainer or figure).
2. **Degree-mode remark.** Notes say the special limit in degrees would be pi/180; true, but outside the CED. Keep or cut.
3. **"Vertical asymptote" definition.** We use "at least one one-sided limit is infinite" (standard). Some texts
   also call x = 0 for ln x an asymptote with only one side defined; we do.
4. **Oscillating discontinuity** (sin(1/x)) is mentioned as "other kinds exist; the exam names three". Confirm the
   wording is wanted.

## Notes for the coordinator

- The full `node scripts/check-apcalc-content.mjs` hangs (over 2 minutes) after the topic checks, inside another
  author's tool validators; tool checks for limit-explorer, slope-fields, area-volume and motion-lab also print
  FAIL lines. Not mine; I checked my topics through `checkTopic` directly.
- The brief's build command names `APPHYS_PUBLISHED`; the calculus generator reads `APCALC_PUBLISHED`
  (`APCALC_PUBLISHED=unit-1 ... --out <dir>` built 14 topics cleanly).
