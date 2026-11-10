# AP® Microeconomics: author C self-review (Unit 3)

Date 2026-11-09. Topics 3.1 to 3.7 and three FRQs, written to `docs/apmicro-briefs/content-common.md` and `c.md`.

## Done

| Topic | Items | In sets | Apply/analyze | Graph items | Notes words | Figure |
|---|---|---|---|---|---|---|
| production-function | 18 | 10 | 16 | (figure set) | 735 | production-function-tp-mp |
| short-run-costs | 18 | 10 | 17 | 5 | 679 | short-run-costs-curves |
| long-run-costs | 18 | 10 | 17 | 2 | 621 | long-run-costs-lratc |
| types-of-profit | 18 | 8 | 16 | none (no graph in the topic) | 512 | types-of-profit-bars |
| profit-maximization | 18 | 8 | 17 | 4 | 623 | profit-maximization-rule |
| firm-decisions | 18 | 10 | 17 | 4 | 622 | firm-decisions-three-prices |
| perfect-competition | 18 | 9 | 17 | 4 | 708 | perfect-competition-side-by-side, -long-run |

126 items, 20 stimulus sets (data, graph and text in every topic but 3.4 and 3.5, which have two kinds each), 25 numeric
items (every key an `ApMicroCalc` recipe, the reader-report slip authored as a mistake: MC without dividing by the change
in output, AVC vs ATC, profit at the wrong q), graph items for label, point, line, shift with equilibrium and shade
(profit, loss, tr) on the `costs` and `pc` kinds. Every topic has a lesson (hook, prereqs, figure, four-link chain,
ideas, misconception, 7 check items, summary), notes with a worked example and a comparison table, and a glossary entry
for every concept it teaches. Eight SVG figures from `scripts/apmicro-figures/author-c.mjs`, which draws the cost
curves from the engine's own `COST.firm` model (MC passes exactly through both minimums; the script throws otherwise).

FRQs: `frq-perfect-competition-long` (10 points, units 2 and 3, three `pc` graph parts: labels, line, point; shift,
line; shade profit; then profit calculation, entry, constant-cost long-run price, cross-price elasticity sign);
`frq-cost-table-short` (5: MC from a table counted by tens, AVC, Q where MR = MC, marginal explanation, profit);
`frq-long-run-short` (5, `pc`: labels and price line between the AVC and ATC minimums, shade loss, why produce, the
exit chain to minimum ATC).

Checks: `check-apmicro-content --topic` clean for all seven; the three FRQs clean; full run shows no bank problem
involving my items; `check-apmicro-map` clean; the scratch build (`APMICRO_PUBLISHED=unit-3`, `/tmp/mic-c/out`) builds
7 topics and its pages scan clean for ordering.

## Map edits

1. `firm-demand` (d = MR = AR = P) moved from `perfect-competition` to `profit-maximization`, `dependsOn` now
   `marginal-revenue` only. Reason: the engine labels every price line on a `costs` or `pc` graph "d = MR = AR = P",
   so 3.5 and 3.6 graphs could not be used without it; 3.5 now teaches the flat demand of a firm selling at one price.
2. Unit 3 `tools.stimulusThemes`: 16 entries added, one per set written.

## Open points

- The map alias `AP` (average product) collides with the trademark check, so the course writes "average product" in
  full; the figure labels the curve APL. Suggest dropping the alias.
- `lump-sum-tax` is taught in 6.2, so Unit 3 says "lump-sum license fee" / "fixed fee" for the ATC-only shift.
- Increasing- and decreasing-cost industries appear only in a `going-further` aside and one glossary sentence, never
  keyed (needs-author `increasing-cost`).
- Knowledge for 3.4-3.7 rests on scoring guidelines and standard economics (needs-author `ced-text`).
- `frq-perfect-competition-long` builds only once unit 2 is published.
