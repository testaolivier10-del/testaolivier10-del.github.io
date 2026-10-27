# R6-SiteChrome: shared pieces from site-chrome.js, the course nav scripts and the helpers they load

Every item on the live page and where it lives in the mockup. Nothing is removed.


## Top bar (assets/site-chrome.js headerHtml)
- [x] Brand link LevlPrep home: panel 1 and 2
- [x] Course name link (full on desktop, short on phone): panel 2 and phone panel
- [x] Search toggle #searchToggle, title Search (press /): panels 1, 2, phone
- [x] Daily streak pill #navStreak with count: panel 2
- [x] Your level badge #levelBadge: panel 2
- [x] Account and settings button #chromeMenuBtn (phone): phone panel
- [x] Chrome menu #chromeMenu: account slot, sound toggle, Dark mode: phone panel; desktop shows them inline
- [x] Account slot: Log in or your name: panels
- [x] Sound toggle #soundToggle (pages with sounds): panel 2
- [x] Theme toggle #themeToggle: all bars

## Course tabs (each */assets/*nav*.js)
- [x] Home, Learn, Practice, Review, Exams, Glossary, Tools, Dashboard with current marked: panel 2
- [x] Flashcards count as Practice: note, unchanged

## Phone tab bar (renderBottomNav)
- [x] Home, Learn, Practice, Review, More with icons: phone tab panel
- [x] More sheet: grab handle, Exams, Glossary, Tools, Dashboard, Esc closes, scrim: phone tab panel

## Search overlay (openSearchOverlay)
- [x] Search title, Open the search page, Esc close, embedded search, scrim: overlay panel

## Study assistant (tutor-launcher.js, tutor.js)
- [x] Launcher Ask me anything + button: assistant panel
- [x] Panel: Ask LevlPrep, mode lines, intro per course, suggestion chips per course, conversation with sources and Also relevant, question input, general-answer warning, error line, settings with address, Save, Turn off, close: assistant panel

## Account (account.js)
- [x] Account menu: Signed in, email, level, Account & Premium, Sync now with status, Sign out, Delete account: account panel (full set on R6-Account)
- [x] Save your progress nudge with Keep my streak / Keep my level variants, streak freeze, goal done: nudge panel

## Toasts and prompts
- [x] Level-up toast + confetti + Share (motion.js): toasts panel
- [x] Streak toast at 7, 30, 100 days + Share: toasts panel
- [x] Update toast: A new version is ready, Reload, Dismiss: toasts panel
- [x] Install prompt: Install, Not now, iPhone wording, frequency rules: install panel

## Helpers fetched on demand
- [x] Study reminders (reminders.js): question, time, Remind me, No thanks, done and error lines: reminders panel
- [x] Milestones (milestones.js): chapter, course, exam certificates, View certificate, Share, dashboard list: milestone panel
- [x] Next step card (next-step.js) with every reason line: next step panel
- [x] Cross-course card (cross-course.js): cross panel
- [x] Report a problem dialog (report-question.js) with reasons, note, Send report, thanks, sent state, page version: report panel
- [x] Share (share.js): native share, copy link, copied message: share panel
- [x] From our videos card (from-video.js), home only: video panel
- [x] How did you find LevlPrep (heard-from.js): 7 options, thanks: heard panel
- [x] Exam date countdown (exam-date.js): date, days, plan line per phase, change, cancel, passed date, AP® default dates: exam panel

## Invisible or structural
- [x] Skip to content link: misc panel
- [x] Screen reader announcer (announce.js): misc panel
- [x] Service worker and offline cache: misc panel
- [x] Analytics (cookieless): misc panel
- [x] Cookie or consent banner: does not exist today; noted in misc panel
- [x] Footer moved outside main: misc panel
