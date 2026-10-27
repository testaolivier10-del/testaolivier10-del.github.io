# R3-Exams (nremt/exams.html)
Inventory from the live page (desktop and phone), the exam engine (nremt/practice-engine.js) and nremt/exams.html markup. 0 removed.

## Shared chrome (on every page)
- [x] Skip to content link: kept (first focusable element)
- [x] LevlPrep logo link: kept, top bar
- [x] Course name link: kept, beside the logo and in the course bar
- [x] Search button (#searchToggle, opens the / search overlay): kept, top bar
- [x] Log in / account button (#accountBtn): kept, top bar
- [x] Answer sounds toggle (#soundToggle): kept, top bar
- [x] Dark mode toggle (#themeToggle): kept, top bar
- [x] Course tabs Home, Learn, Practice, Review, Exams, Glossary, Tools, Dashboard: kept, course bar with the course cover
- [x] Breadcrumb: kept, under the course bar
- [x] Study assistant button "Ask me anything" (tutor launcher): kept, floating bottom right
- [x] Footer links Privacy, Terms, About, Sources, What’s new, Premium, Account, Contact: kept, footer
- [x] Phone: bottom bar Home, Learn, Practice, Review, More, with More sheet (Exams, Glossary, Tools, Dashboard): kept on phone boards

## Page
- [x] Pill "NREMT-EMT": kept, hero
- [x] H1 "Exams / the full run.": kept, hero, two-tone
- [x] Hand line "on the clock, like test day": kept, hero
- [x] Lede (100 questions, 2025 outline, two-hour clock, scored by domain, leave mid-way): kept, hero
- [x] Course cover: kept, hero right (was in the page head)
- [x] Facts 100 / 2:00:00 / 5 domains: new grouping of facts already on the page (summary line and lede)
- [x] Free exam notice "Your free exam. One full exam is free..." with PREMIUM tag: kept, first card
- [x] Step 1 "Choose an exam", radio nrExam "Timed exam" PREMIUM with its description: kept, step card
- [x] Step 2 "Settings": kept
- [x] Difficulty select #difficultySelect (All levels, Easy only, Medium only, Hard only, Expert only): kept, all 5 options
- [x] Exam-realistic checkbox #realisticMode with "no flagging, no going back, like the real thing": kept
- [x] Adaptive note with pool count #poolCount (2,033) and "Read about exam day" link: kept
- [x] Summary "100 questions, 2:00:00 (about 72 s a question)": kept, summary line
- [x] "No feedback until you submit..." note: kept
- [x] Start timed exam button #startBtn: kept
- [x] Premium notice #premiumNotice / #examGate (list of 3, price, Pass-or-extend line, See Premium): kept, navy Premium card
- [x] Resume card #resumeExamCard with #resumeExamText, Resume Exam #resumeExamBtn, Discard #discardExamBtn (and its confirm "Discard this in-progress attempt? This cannot be undone."): kept, state panel
- [x] Exam gate when the free exam is used: kept, state panel
- [x] Readiness card #readinessCard: kept, state panel "After an exam"
- [x] Best score line #bestScoreLine: kept, same panel
- [x] View progress toggle #progressToggle and #progressPanel: kept, same panel
- [x] Rail "Your numbers" #nrStats: Answered, Due for review, To fix, Day streak with their sub lines: kept
- [x] Review queue card "0 due for another look", note, Open review link: kept, rail
- [x] Rail link Practice "Untimed, with feedback after every answer.": kept
- [x] Rail link Flashcards "Short facts on spaced cards.": kept
