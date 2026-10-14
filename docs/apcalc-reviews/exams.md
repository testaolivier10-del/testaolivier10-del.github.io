# Accuracy review: practice exams, justification prompts, entry pages (2026-10-13)

Independent review, Phase 4, of Phase 3 (spec decision 11). Scope: the 26 exam-only items and both forms
(`calculus/data/exams/*`), the 33 prompts (`calculus/data/justify/*`), the formulas page rows (`EQ`, `NOT_ON` in
`scripts/lib/apcalc-entry.mjs`), the score calculator (`calculus/assets/pages/score.js`, needs-author
`score-cutoffs`), and the rendered formula sheet, score calculator, unit test sample, exams, justify and cram pages.

## Method

- Every exam-only key and every distractor recomputed in a scratch Python script written from the stems
  (scipy `quad` and `brentq`, not `EXAM_NUMBERS`): roots, candidate values, integrals, sums and each authored
  mistake. All 26 items graded through `ApCalcQuestions.grade` in the test harness's vm: 104 options, every key
  passes, every distractor fails, every option's number matches my value to the printed decimals.
- Forms recounted from the bank files: units, parts, sets, `fixed` flags, keys' authored positions.
- Every number in the 33 prompts recomputed by hand (checklist, earns and misses answers).
- Score cut-offs: the needs-author model rebuilt in my own script from the published inputs, which I checked
  against the College Board pages (2025 FRQ means/SDs from ap25-calculus-ab-scoring-statistics.pdf; 2024-2026
  distributions from the AP Students score-distribution page).
- Scratch site with every unit published (`--out`, own scratchpad folder, own port). In Playwright (chromium 1194)
  at 1280 and 360: formula-sheet, score-calculator, unit-tests/unit-5, justify (all 33 prompts opened and checked,
  model answers shown), cram, and exams.html with both practice exams started and stepped through all 42
  questions, the part breaks, all 6 FRQ views and the results page, at both widths. `node --check` on every
  `calculus/assets/**/*.js`: all parse. The only failed requests were `/sw.js` (no service worker on the scratch
  server) and analytics blocked by the proxy.

## Findings and fixes

### Exam-only items (26) and the forms

Keys recomputed: 1-01 51.891 (zeros of r − 7 at 1.422 and 4.807; A = 49.055 and 55.212 there); 1-02 4.807;
1-03 −1.665 (r(4) = 9.637, average 0.909); 1-04 1.370 (average rate 1.1945 → 1.195); 1-05 v(3) = −2.375,
a(3) = −1.381; 1-06 2.724 (0.417 is the minimum); 1-07 2.170 (x = 0.273, D = 4.709); 1-08 8.230; 1-09 0.895
(g(3) = 0.774, g(√(2π)) = 0.430); 1-10 2.545; 1-11 6.428 (−1.965, 1.058); 1-12 24.150; 1-13 8.579
(displacement −5.438; distance to π/2 is exactly π/2); 2-01 2.958; 2-02 2.996 (2.99647); 2-03 2.957 (right
stretch 2.477); 2-04 2.833; 2-05 0.622; 2-06 −2.472 (f(−0.946) = 3.741 > f(−1) = 3.728); 2-07 0.860;
2-08 (0.715, 4.307); 2-09 9.204; 2-10 10.772 (trapezoid 30.517, integral 16.453, left 3.718); 2-11 3003.893;
2-12 2.466; 2-13 20.931. **No key changed**; every distractor explanation is right.

- Calculator need: every Part B item needs a calculator (roots of transcendental equations, numerical
  integrals or derivatives). The weakest is 2-05 (related rates), where the calculator only evaluates
  20/(π·3.2²); that is normal for a real Part B. Every Part A item was read for hand-doability: all are.
- Forms: 42 four-option single items each, 29 no-calculator then 13 calculator; units U1 5, U2 5, U3 4, U4 5,
  U5 8, U6 8, U7 3, U8 4 in both, inside every CED range; sets 6 (form 1) and 7 (form 2) of 3-4 in Part A, as the
  spec says. Bank sets used as subsets (implicit-differentiation 6/8/9, first-derivative-test 5/6/8,
  separation-of-variables 6/7/9 drop a numeric item); each kept item stands without the dropped one.
- Key position: no item in either form is `fixed`, and the exam view renders through `ApCalcQuestions.hydrate`,
  which shuffles. Confirmed in the browser (calc-exam-1-01, key authored first, showed it third). The
  key-first authoring of the skills chapter and topics 1.1-1.6 therefore does not reach the exams.
- FRQs: Part A (calculator) is table/area in form 1 and model/motion in form 2; the Part B ones are no-calculator
  as filed. `frq-u3-implicit-oval` (d) uses Unit 4 related rates; it sits in a full exam (form 1 Q6), where every
  unit is fair game, and unit tests carry no FRQs, so its placement is fine.
- Closeness to released questions (from memory of released FRQs, not a web search): the tank set (rate in
  minus a constant drain, amount, candidates test) is the 2007/2015 AB1 genre with different functions and
  questions; 2-11 (people entering a park) shares only the setting with 2002 AB2. Nothing is a copy.
- **Results page overflow at 360 (fixed).** After an exam the review list was 423-441 px wide on a 360 px
  screen. Two causes: (1) `.calc-ex-review` is a grid with an auto column, so a wide stimulus (form 2's 8-column
  sign table) stretched every item; `calculus/assets/pages/pages.css` now gives it
  `grid-template-columns:minmax(0,1fr)` and `.calc-ex-ritem` `min-width:0` (the table scrolls in its own box).
  (2) Three explanations had one long inline formula that cannot wrap:
  - **calc-exam-1-08** why.correct: "$F(3) = F(1) + \int_1^3 \sqrt{1 + x^3}\,dx \approx 2 + 6.230 = 8.230$" →
    "$F(3) = F(1) + \int_1^3 \sqrt{1 + x^3}\,dx$, which is about $2 + 6.230 = 8.230$".
  - **calc-exam-2-09** why.correct: same split ("..., which is about $3 + 6.204 = 9.204$").
  - **calc-exam-1-12** why.correct: "...dx \approx 24.150$" → "...dx$, about $24.150$".
  Rechecked: no horizontal scroll on either results page at 360.

### Justification prompts (33)

Every number recomputed: 3 °C/min (miss 1.5); p'(1) = 2 from both sides; −10 (miss −8); 1/4 (miss 1/28);
−25/y³ (miss −1/y); v(2.5) = −0.75, a = 1; direction change at 5 only; L'Hospital 3; MVT 5 m/min; candidates
−4, 0, −4, 16; inflection at 3 only; vertical tangents (−4, 2), (4, −2) with numerators −6, 6 (miss (2, −4),
(−2, 4)); left sum 65 L (miss 60); g(1) = −1 (miss 11); y = √(2x² + 9); 2.6 and d²y/dx² = 3; distance 5 m
(displacement 3); x(6) = −2; washer 832π/15; 70 °F. Each "earns" answer would earn its checklist points and each
"misses" answer is a miss the Chief Reader reports name, with a right "why".

- **u4-lhospital-form-first**, earns.why: the JSON had `\frac` with one backslash, which JSON reads as a
  form-feed character followed by "rac", so the page showed broken math. Now `\\frac`. A scan of every string
  in `calculus/data` found no other control character. The content check does not catch this; suggest a rule
  that rejects control characters (form feed, backspace, tab) in parsed strings.

### Formulas page (56 rows, 6 easy-to-forget lines)

Every row checked for correctness, hypotheses and AB scope: cross-section areas (√3/4·s², π/8·s², ½s²,
¼s² on the hypotenuse), disc radius |f(x) − k|, washers, average value, FTC with a chain factor, inverse
derivative at a point, L'Hospital conditions, first/second derivative tests, candidates test, trapezoid
widths. All right; no change. 7 groups, 56 rows, as the spec says.

### Score calculator

Method 50 × MCQ/42 + 50 × FRQ/54 matches the exam's equal section weights. My rebuild of the model (324
choices) gives medians 66.0 / 48.9 / 40.1 / 22.9 (10th-90th percentile 62.9-69.2, 45.9-51.5, 37.3-42.9,
19.3-26.7), matching needs-author. Inputs verified: 2025 FRQ means 3.26, 4.06, 4.82, 3.91, 3.60, 4.12 and SDs
2.58, 3.01, 2.83, 2.65, 2.39, 3.10; distributions 2024 21.4/27.8/15.3/22.7/12.9, 2025 20.3/28.9/15.0/22.8/13.0,
2026 20/28/17/24/11. The page's "next band" arithmetic checked (28 right, 0 FRQ: 33.3, needs 6 MCQ or 8 points
for a 3). Labelled as estimates. No change.

### Rendered pages

No script errors on any page at either width (the past apphys parse failure does not recur). Formula sheet,
score calculator, unit-5 sample, cram and justify: no overflow, no raw TeX. Graphs in both stimulus sets match
their functions (r peaks at 10 near t = 3.54 and ends near 2.09; drain line at 7; v between −0.73 and 1.52).

## Open questions for a person

1. **Form 2 tests particle motion twice in a calculator setting**: the Part B set (v = e^{sin t} − 1.2: turn,
   position, total distance) and Section II Part A `frq-u8-particle-calculator` (turns, position, total
   distance). Real exams sometimes do this, but it overweights one skill. Option: swap that FRQ with a
   calculator FRQ of another type (changes spec decision 11's list).
2. On the justify page at 360, the first-visit "Write your answer here" hint (tool-studio) covers the end of the
   prompt line until dismissed. Shared tool-studio behaviour, not changed here.
3. Add a content-check rule for control characters in JSON strings (see u4-lhospital-form-first).
