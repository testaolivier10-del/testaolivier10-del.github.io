# Author B self-report (Phase 1): Unit 1 (1.11-1.14), Unit 2 (2.1-2.6), alg-systems, alg-exponents

Date 2026-10-31. Brief: `docs/apprecalc-briefs/b.md`.

## Topics done (12 of 12)

Each has a lesson (hook, 2 prereqs, figure, chain, ideas, misconception, 5-6 check items, summary), notes
(500+ words for CED topics, worked examples in `div.worked`, comparison tables), a question file and a glossary entry
for every concept the map says the topic teaches.

| Topic | Items | In sets | Stimulus sets |
|---|---|---|---|
| `equivalent-representations` (1.11) | 18 | 8 | graph of a rational function with slant asymptote; Pascal's triangle table |
| `transformations` (1.12) | 17 | 8 | graph: parent $x^2$ and two transformations (brief's set); table of $k$ |
| `model-selection` (1.13) | 15 | 8 | beanbag height table; box-volume scatter plot |
| `alg-systems` (algebra) | 9 | 0 | none (skill topic) |
| `model-construction` (1.14) | 15 | 8 | plant-sales table (3 points); cafe table (quadratic regression, calculator) |
| `alg-exponents` (algebra) | 9 | 0 | none (skill topic) |
| `sequences` (2.1) | 16 | 9 | table of an arithmetic and a geometric sequence; dot graph of a geometric sequence |
| `linear-vs-exponential` (2.2) | 15 | 9 | table with outputs tripling over equal steps (brief's set); unequal-step trap table |
| `exponential-functions` (2.3) | 15 | 9 | graph of $2(1/2)^x + 1$; table of a shifted exponential |
| `exponential-manipulation` (2.4) | 15 | 8 | graph of $2^x$ and $2^{x+3}$; table of $5(4)^x$ |
| `exponential-modeling` (2.5) | 15 | 9 | medicine table (exponential regression, calculator); two-point gym table |
| `model-validation` (2.6) | 15 | 9 | residual plot of two competing models (brief's set, calculator); two-model table |

174 items in all: every CED topic 15+ (algebra 9), 87-100% apply/analyze, 53-60% in sets, the key the longest option
in at most 3 of a topic's single-answer items, no absolute words in distractors. Types used: single, multi, numeric
(exact keys off calculator, full-precision keys on `calc: true`), expr (24, each with a domain and 2-3 mistakes),
order, predict.

## FRQs (4)

- `frq-q2-quadratic-attendance` (modeling, on 1.14): system from three points, constants, AROC on [1, 7], secant
  estimate at d = 5, domain bound where A(d) = 0 (d = 10.160) with the reason.
- `frq-q2-exponential-depreciation` (modeling, on 2.5): two equations from (1, 24000) and (4, 14500), a and b,
  AROC, secant estimate at t = 3, overestimate from concave up on [1, 4] (C, 2 points).
- `frq-q1-exponential-justify` (concepts, on 2.6/2.2): AROCs from a table, concavity from them, a cubic solved for
  all three solutions with the calculator, end behavior in limit notation, linear vs exponential justified with
  both halves, the exponential expression.
- `frq-q2-cooling-residuals` (modeling, on 2.6): linear regression, residuals of two models at t = 10, the better
  model from the residual pattern, a prediction, solving E(t) = 40, why the line fails (falls below room
  temperature after t = 30.959).

Q2 parts are A(i), A(ii), B(i), B(ii) at 1 point and C at 2 (the guide's 2-2-2 until `frq2-2027` is settled).

## Figures (12)

One lesson figure per topic, generated from the functions by `scripts/apprecalc-figures/b.mjs`
(`node scripts/apprecalc-figures/b.mjs` writes `precalculus/figures/<topic>-*.svg`), registered in
`precalculus/data/figures/<topic>.json`. Rendered to PNG with Playwright and checked; label overlaps fixed (white
halo on labels). The format has no lesson `plot` field, so lessons use these figures; question stimuli use `plot`
specs.

## Recheck

- `node scripts/check-apprecalc-content.mjs --topic <id>`: ok for all 12; full run 0 failing (bank and FRQ 0).
- `node scripts/check-apprecalc-map.mjs --check`: nothing used before it is taught.
- `node --test scripts/test/apprecalc-*.test.mjs`: 126 pass.
- Scratch build `APPRECALC_PUBLISHED=unit-1,unit-2,skills-algebra ... --out <scratch>`: 35 topics, no errors.
- Independent key recheck (scratch `recheck.py`): all 61 numeric keys recomputed from the stems by a second route
  (hand normal equations for every regression, Horner, fractions): 0 mismatches. FRQ constants, estimates and
  roots recomputed the same way. Expr keys and every authored mistake are graded through `pcalc-expr.js` by the
  content check (key right on its domain, each mistake wrong).

## Map edits

None.

## Open questions (for needs-author)

1. **residual-sign.** Items, notes, glossary and the cooling FRQ use residual = actual − predicted (the usual
   convention and, as far as I know, the CED's), but `framework.md` section 3 says "residuals (predicted minus
   actual)" and EK 2.6.B.1-2 were reworded for 2026-27. Confirm against the CED. Every item where the sign matters
   states the definition in the stem or prompt, so a switch is a wording change plus sign flips in about 8 keys
   (`model-validation` 2, 3, 6, 7, 9, 10, 12, 14, the cooling FRQ A(ii)).
2. **frq2-2027 split.** My three Q2s put the former B(iii) concavity reasoning (depreciation) or the domain bound
   (attendance) or a solve plus domain reason (cooling) in a 2-point Part C. Confirm when the CED sample scoring is
   readable.
3. **Q1 without composition.** Q1 normally opens with a composite value; composition is taught in 2.7, after my
   topics, so `frq-q1-exponential-justify` opens with average rates and concavity from a table instead. The lead may
   want the exam forms to pair it with a Q1 that covers composition.
4. **Growth factor in 2.3.** The map teaches `growth-factor` (percent change) in 2.3; `framework.md` puts "base as
   growth factor and percent change" in 2.5. I followed the map (taught in 2.3, used again in 2.5).
5. **Process note.** My first scratch folder (`scratchpad/b`) was emptied by another agent's `build --out`; I moved
   to `scratchpad/authorB-src-k9`. Generators for 1.11-1.13 and alg-systems were lost with it; their JSON is final
   and passed every check and the recheck, so edits to those four go straight into the JSON.
6. Bank-wide test-wise rule: select-all items with one key were under 20% across all authors; I changed two of mine
   (`linear-vs-exponential-12`, `model-validation-11`) to one key, which brought the bank to 0 failing.
