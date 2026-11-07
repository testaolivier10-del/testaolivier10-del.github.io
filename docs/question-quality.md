# Question quality (status file)

Started 2026-11-06 when the owner asked whether the questions are good, verified, shuffled and labelled with the
right difficulty, and asked that every analytics run check how students do on them. This file holds what was
measured, what was fixed and what is still open, so a later session can carry on without the history.

## Measured (2026-11-06, every bank; script in the session, numbers below)

| Course | Questions | Choice items | Right answer stored first | Key strictly longest | Key strictly shortest | Medium share |
|---|---|---|---|---|---|---|
| NREMT | 2,093 | 1,934 | 26% | 24% | 19% | 58% |
| Organic Chemistry | 3,675 bank (+ interactive) | 3,312 | 26% | 23% | 12% | 45% |
| A&P | 3,321 | 1,351 single | 23% | 18% | 13% | 59% |
| AP® Biology | 1,487 | 1,073 | 82% | 17% | 17% | 55% |
| AP® Chemistry | 1,565 | 987 | 66% | 19% | 20% | 67% |
| AP® Physics 1 | 747 | 422 | 73% | 15% | 17% | 76% |
| AP® Calculus AB | 1,392 | 742 | 52% | 21% | 8% | 68% |
| AP® Calculus BC | 1,902 | 1,004 | 44% | 22% | 9% | 65% |
| AP® Statistics | 939 | 644 | 30% | 19% | 8% | 78% |
| AP® Environmental Science | 1,625 | 1,136 | 53% | 14% to 15% | 31%, then 27% after the fix | 81% |
| AP® Psychology | 807 | 702 | 46% | 21% | 17% | 91% |
| AP® Precalculus | 1,046 | 574 | 73% | 14% | 5% | 68% |
| AP® Macroeconomics | 764 | 456 | 29% | 25% | 13% | 73% |

- Every question has an explanation. In the AP® courses and A&P every choice item (single and select-all) also has
  one per option; sequence, find-the-error, missing-step and prediction items explain the whole answer instead, by
  design. NREMT (median about 540 characters) and Organic Chemistry (median about 200, 172 under 60) explain the
  right answer only.
- No "all of the above" or "none of the above"; no exact duplicate questions (A&P's 159 repeated stems are label
  questions on different pins of the same figure).
- Choices are shuffled on screen everywhere: AP® courses and A&P every time a question is drawn (worksheets too),
  ochem through `OchemShuffle`. The stored order (often the key first, from authoring) never reaches a student.
- Verification: every AP® unit had the author's self-check and an independent AI accuracy check against the CED and
  open textbooks (`docs/<course>-reviews/`, about 1,500 fixes logged across the ten AP® courses); AP® Biology and AP®
  Chemistry had a second pass (AP® Biology's found about 18 more after about 140 in the first). No teacher, instructor
  or clinician has reviewed any course yet (open: `docs/site-audit-followup.md` item 8 for NREMT; the A&P instructor
  review in `docs/anp-needs-author.md`). The October site audit read about 2,100 questions and found no wrong key.
- Difficulty labels are the author's judgement. They have never been compared with how students do.

## Fixed (branch claude/question-quality)

- NREMT deals each question's choices afresh on every visit (`nremt/practice-engine.js shuffleQuestionOptions`);
  the saved order is kept only while an exam is in progress, so a resumed exam still grades against its letters.
- "every option explained" on the Practice band only where it is true (AP® courses and A&P); NREMT and ochem say
  "every answer explained" (`explained` in `panelConfig`, `paintCount` in `assets/course/practice-panel.js`).
- Teacher printed tests (`assets/class/teach.js viewPrint`) printed the bank's stored order, so an AP® Biology answer
  key was mostly A. Each bank question's choices are now dealt per question and version (seeded) with the key
  following; `fixed` items and the teacher's own questions keep their order.
- The bank files keep their stored order on purpose: picks are saved as stored indexes (`<course>_picks_v1`, class
  submissions), so re-dealing the files would move old picks onto other choices in teacher reports.
- Environmental Science: 45 of 46 items where the key was clearly the shortest choice now have a fuller key
  (an independent review passed 42 and reworded 3 whose new key gave the answer away in another way: phosphorus
  cycle 2 and 16, endangered species 6); "Wheat" against three other crop names left as is.
- Question tallies (`question_stats`): AP® Precalculus was never counted (course key `apprecalc` has 9 letters;
  `answer()` in `assets/analytics.js` and `track_answers()` allowed 8). Client fixed; the database function needs
  `scripts/sql/migrations/2026-11g-question-stats-course.sql` applied (owner).
- A question left blank in an AP® or A&P exam was sent to the tallies as a wrong answer (equal seconds each), which
  would make questions look harder than they are. Blank ones still count as misses for the student's own review but
  are no longer sent (`skipped` in each exams page's `Core.record` call; each core passes no id to `noteAnswer`).

## Live data (2026-11-06)

About 576 answers in total since 2026-10-20 (owner's signed-in browsers excluded): AP® Biology 387 (330 of them on
the water potential tool's parts), NREMT 58, A&P 35, AP® Chemistry 28 (most from one exam left blank), AP®
Environmental Science 28, AP® Physics 1 20, AP® Statistics 12, AP® Psychology 7, Organic Chemistry 1, none for AP®
Calculus AB and BC, AP® Macroeconomics or AP® Precalculus. No question reports. No question has 30 answers, so no
difficulty label can be checked yet. Answer tracking was tested working in ochem, AP® Calculus AB, AP® Statistics,
AP® Macroeconomics and NREMT.

## Ongoing

The weekly and midweek analytics runs (Project doc `claude/levlprep-ops-analytics.md`, A3.9) check coverage,
possibly wrong questions, difficulty labels against real results once questions have 30+ answers, weak topics and
reports, and propose changes to the owner; they never edit questions.

## Open

- Owner: apply the 2026-11g migration.
- A paid expert spot check per course (about 100 random questions), NREMT first.
- Relabel difficulty from real results once the data allows (analytics run A3.9c).
- Organic Chemistry: 363 true or false items (guessable half the time) and short explanations; NREMT and ochem have no
  per-option explanations.
