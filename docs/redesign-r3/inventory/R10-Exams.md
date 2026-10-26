# R10-Exams (nremt/exams.html) placement. Source checklist: docs/redesign-r3/inventory/R3-Exams.md
Board shows a first visit with the free exam unused.
- Pill "NREMT-EMT" and the page name: band kicker "NREMT-EMT · Exams".
- H1 "Exams / the full run.", hand line "on the clock, like test day", lede: band.
- Course cover: band, right.
- Main action: band button "Start timed exam" (scrolls to the setup) and the real #startBtn in the setup card.
- Facts 100 / 2:00:00 / 5 domains: fact strip under the lead (plus "scored by domain").
- Free exam notice "Your free exam. One full exam is free..." with PREMIUM tag: top of the setup card.
- Step 1 Choose an exam, radio "Timed exam" PREMIUM with its description: setup card.
- Step 2 Settings: difficulty select #difficultySelect (all 5 options), Exam-realistic #realisticMode with its line, adaptive note with pool count 2,033 and "Read about exam day": setup card.
- Summary "100 questions, 2:00:00 (about 72 s a question)" and "No feedback until you submit...": setup card.
- Start timed exam #startBtn: setup card. View progress toggle #progressToggle: beside it, opens "Your exam record".
- Readiness card #readinessCard and best score #bestScoreLine: "Your exam record" section (empty texts from the engine).
- Rail "Your numbers" (Answered, Due for review, To fix, Day streak, with the engine's first visit sub lines): navy rail card.
- Review queue card "0 due for another look", note, Open review: rail.
- Rail links Practice and Flashcards with their lines: rail.
- New, built from facts already on the site: "How the exam is built" (the five domains with their shares, which the lede names) and three steps (answer, submit and review, fix misses).
States, not drawn (build notes):
- Resume card #resumeExamCard with #resumeExamText, Resume Exam and Discard (confirm "Discard this in-progress attempt? This cannot be undone."): replaces the band's main action and sits at the top of the setup card when an exam is open.
- Exam gate when the free exam is used (G.gate('exam')): replaces #startBtn in the setup card: "You've used your free timed exam", the first three Premium lines, price, Pass-or-extend line, See Premium.
- Readiness and best score with data, and the progress panel: fill "Your exam record".
