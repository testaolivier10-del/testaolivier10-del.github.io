# R3-Dashboard-NREMT (nremt/dashboard.html)
Inventory from the live page (empty), its rendering code in nremt/dashboard.html (every box and its with-data state) and assets/exam-date.js. 0 removed. Level, streak and badge cards kept exactly as they exist.

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

## Page head
- [x] Pill "NREMT-EMT · Dashboard": kept
- [x] H1 "Where you / stand today.": kept, two-tone
- [x] Hand line "worked out in your browser from every answer you give": kept
- [x] Sub line #headSub "Everything this browser knows...": kept
- [x] Course cover: kept, hero right
## Stat tiles #statCards
- [x] Overall accuracy (across every mode): kept
- [x] Topic areas started (n / 6, full exams taken): kept
- [x] Due for review (questions · missed): kept
- [x] Day streak (n of 15 today): kept
## Panels
- [x] Next box #nextBox, empty state "Your dashboard fills in as you study" with intro and 3 steps (domain drill, study notes, flashcards or a tool): kept, navy card
- [x] Next box with data: up to 4 cards (Review N questions, Shore up <weakest>, Take a full timed exam / Continue practicing): kept, state panel
- [x] Exam date card #examDateCard: heading, date input, Save, note: kept, rail
- [x] Exam date set: countdown, per-day target, phase line, Change date, Clear: kept, state panel
- [x] Topic areas #topicBox (6 rows, weakest first, accuracy bar, status, "n of N right", notes link, Practice link, hint text): kept, both states
- [x] Five 2025 exam domains #domainBox, locked with PREMIUM and its sentence: kept
- [x] Five domains unlocked (5 rows with exam share and Practice links, hint): kept, state panel
- [x] Premium box #premiumBox (list, price, Pass-or-extend, See Premium): kept, rail
- [x] Readiness estimate #readinessBox (PREMIUM, average, weakest area, n/100, the "not a chance of passing" note, empty note "Take a full timed exam..."): kept, state panel
- [x] Mastery and review queue #masteryBox (tracked, due, missed, level bars L0 to L5, Start review, Weak-spot practice): kept, state panel
- [x] Recent exams #activityBox (last 6): kept, state panel
- [x] Score over time #historyBox (average, best, exams, chart 0 to 100%): kept, state panel, drawn to scale
- [x] Your level #levelBox (L badge, XP bar, sentence): kept exactly
- [x] Study streak #streakBox (14-day calendar T W T F S S M..., "0 of 14 days studied · today 0 of 15"): kept exactly
- [x] Badges #badgeGrid: 7-day streak, 30-day streak, First exam, 90%+ exam, 500 questions, Level 10, with their emoji and sub lines: kept exactly
- [x] Milestones and certificates #levlMilestones (intro, "Full-length practice exam, 80% or higher" with its line): kept
- [x] "Computed from data in your browser only. Clearing browser data resets it.": kept
