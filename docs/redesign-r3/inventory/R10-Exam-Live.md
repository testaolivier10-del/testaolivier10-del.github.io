# R10-Exam-Live (a running NREMT timed exam) placement. Source: R3-ExamLive.md
Focus mode: the course tabs, footer, search and study assistant are hidden while the clock runs; a slim bar replaces them.
- Exit exam #exitBtn (confirm "Exit for now? Your progress is saved..."): focus bar.
- Submit (top) #submitBtnTop (confirm "Submit now? You can still review all questions and answers after."): focus bar.
- Answer sounds and Dark mode: focus bar (kept, small).
- Practice banner #practiceBanner: hidden in timed exams (the engine hides it); not drawn.
- Domain label #qDomain: pill on the question card. Flag for review #flagBtn: question card.
- Question prompt #qPrompt and options #qOptions (four, letters A to D): question card. Feedback #qFeedback: stays hidden until submit.
- Previous #prevBtn and Next #nextBtn: question card.
- Timer #timerBar with "Time remaining" #timeRemaining, pace line #paceLine: navy rail card.
- Progress #progressText, #answeredText, bar #progressFill: rail. Jump grid #jumpRow 1 to 100 with answered, flagged and current states, plus a legend: rail.
- Submit (side) #submitBtn: rail.
States (build notes): Exam-realistic mode hides Flag and Previous and greys the jump grid; the two confirms are page dialogs in the site's own style.
Example data: question 23, time 1:38:24, pace 59 s.
