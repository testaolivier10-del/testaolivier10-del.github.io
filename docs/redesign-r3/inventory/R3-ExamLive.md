# R3-ExamLive (running NREMT exam, end screen)
Inventory from a real started exam on nremt/exams.html, and the quiz and results screens in nremt/practice-engine.js. 0 removed.

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

## Quiz screen (#quizScreen)
- [x] Practice banner #practiceBanner: kept, top line of the question card
- [x] Exit exam #exitBtn (with confirm "Exit for now? Your progress is saved..."): kept, button and dialog panel
- [x] Submit (top) #submitBtnTop (with confirm "Submit now? You can still review all questions and answers after."): kept, button and dialog panel
- [x] Domain label #qDomain: kept, tag
- [x] Flag for review #flagBtn: kept
- [x] Question prompt #qPrompt (heading): kept
- [x] Options #qOptions: kept, four options
- [x] Feedback #qFeedback (hidden in exam mode): kept hidden, unchanged
- [x] Previous #prevBtn and Next #nextBtn: kept
- [x] Timer #timerBar: "Time remaining" and #timeRemaining: kept, rail
- [x] Pace line #paceLine: kept, under the timer
- [x] Progress #progressText "Question n of 100" and #answeredText "n answered": kept
- [x] Progress bar #progressFill: kept
- [x] Jump grid #jumpRow, buttons 1 to 100 with answered and flagged states: kept, rail, with a legend
- [x] Submit (side) #submitBtn: kept, rail
- [x] Exam-realistic mode hides flagging and going back: kept, state panel
## Results screen (#resultsScreen)
- [x] Back to Start #retryBtnTop: kept
- [x] Print or save as PDF #printResultBtn: kept
- [x] Score #scoreBig and #scoreSub: kept, score card
- [x] Domain breakdown #domainBreakdown: kept, bars per domain
- [x] Readiness update #readinessUpdate: kept
- [x] Next step #nextStep: kept, navy next card
- [x] Cleared note #clearedNote, #nextSlot, #premiumSlot: kept, listed in place under the next card
- [x] Filter row All / Incorrect only / Unanswered only: kept
- [x] Review list #reviewList with each question, answer and explanation: kept
- [x] Back to Start #retryBtn: kept
