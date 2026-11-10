# AP® Microeconomics Phase 3: practice exams, unit tests, prompts, formula page, cram kit (2026-11-09)

Builder's report. Status and numbers: `docs/apmicro-spec.md` section 5c and decision 11. Open points:
`docs/apmicro-needs-author.md` `phase3` (and `mcq-options`).

## What was built

| Piece | Files | Checked by |
|---|---|---|
| Two forms, May 2027 format | `microeconomics/data/exams/forms.json` | `checkForms` (content check, tests) |
| 100 fifth options | `microeconomics/data/exams/fifth.json` | `checkFifth`, plus math, language, trademark, position words, absolutes |
| 20 exam-only items, 20 stimuli | `microeconomics/data/exams/items.json` | `checkItem` as five-option items, `EXAM_NUMBERS`, `EXAM_GRAPHS`, `EXAM_MATRICES` |
| 64 "Make it specific" prompts | `microeconomics/data/justify/*.json` | `checkJustify`, `JUSTIFY_NUMBERS`, builder graded by `ApMicroGrade.specific` |
| Formula page rows (29) | `scripts/lib/apmicro-entry.mjs` `EQ` | every worked line an `ApMicroCalc` recipe; flashcards from the same rows |
| Checks | `scripts/lib/apmicro-exams.mjs` (`checkMatrices` new; `checkGraphs` reads lettered regions and named points), `scripts/check-apmicro-content.mjs` | |
| Tests | `scripts/test/apmicro-exams.test.mjs`, `scripts/test/apmicro-cram.test.mjs` (Phase 0 placeholders replaced) | 187 micro tests pass |

## How the forms were assembled

1. Bank pool: single-answer items with four options, not lesson check items, not fixed, not leaning on another
   question. Standalone items first (the `EXAM_STIMULI` cap of 22 a form, with 10 exam-only items carrying their own
   stimuli, leaves room for about 12 bank set questions), then one question per stimulus, graph stimuli first, for
   the units that run short (Units 3 to 6).
2. Split across the forms by topic so each form covers every topic it can; sorted into course order.
3. Exam-only items placed in their topic's position: U2 2, U3 3, U4 3, U5 1, U6 1 a form.
4. Every fifth option written for the slip a student would make (a ratio upside down, a sunk cost added, the wrong
   region, the competitive outcome in a monopsony, the joint-payoff cell as Nash) and checked to repeat no option and
   use no absolute word.

## Accuracy notes (exam-only items)

- Numbers: every key and every named distractor is recomputed (e.g. 1-01 elasticity 2 from 20% over 10%, the
  inverted 0.5 and the slope 20; 1-06 MR from TR, Q where MR = MC, price from demand; 2-09 MFC 8, 12, 16, 20, hire 3,
  wage 12, competitive slip 4 at 14). A changed key fails `checkNumbers` (tested).
- Graphs: the lettered areas each option names are read from `ApMicroGraph.areas` (1-02 ceiling DWL c, e, transfer
  d, CS a, b, d; 2-02 floor PS b, d, f; 1-05 and 2-05 profit and loss area a; 2-07 monopolistic competition profit
  b; 1-10 positive consumption externality DWL a, external benefit a, b, c, market quantity below the efficient one);
  1-07 checks that the fair-return quantity lies between MR = MC and P = MC with the price above P = MC. A changed
  graph fails `checkGraphs` (tested).
- Matrices: 1-08 Altura dominant (30 > 20, 50 > 45), Bexley none (25 > 15, 45 > 40), one Nash cell (Ads, Ads); 2-08
  no dominant strategy, two Nash cells, joint-payoff cell (Late, Early). A changed payoff fails `checkMatrices`
  (tested).
- One draft item reproduced a bank question (the negative production externality DWL read, `mic-externalities-9`,
  which the reselection put in form 1); it was replaced by the positive consumption externality item. A draft
  monopoly DWL read next to the bank's monopoly total-revenue read (same picture) was replaced by the natural
  monopoly fair-return item.
- No released exam question was reproduced or adapted; firms, places and numbers are invented.

## Walk (Chromium, preview on port 8840, scratch build `/tmp/mic-p3`)

Form 1 whole at 1280 light and 360 dark, form 2 whole at 1280 light: start, graph MCQ 21 (ceiling with lettered
areas), matrix MCQ 47, Section II break, FRQ 1 part A graph (two panels, market and mill), end, self-score, results.
Results show Section I (30/60) and Section II (self score) apart on the shared score card; no score calculator, no
band, no Beta label; the "not yet reviewed" note is on the exams page (tested). No page errors; the only console
error is the analytics call the sandbox network blocks. No horizontal overflow on the exam, formula, justify, cram
and unit test pages at 360 after one bank fix (needs-author `phase3` item 5).

Found and handled: payoff-matrix row headers broke "Advertise" inside the word at 360, so the strategy names are
short. Left for the integrator: graph stimulus text renders at about 8 px at 360 (needs-author `phase3` item 1).
