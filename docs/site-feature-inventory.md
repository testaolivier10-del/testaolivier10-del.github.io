# Site feature inventory

Every feature on the live site (AP® Biology checked page by page on 2026-11-05, plus site wide features and pages
only some courses have), and where it lives under the agreed design in `docs/design-rules.md`. Every options page
must account for these (checklist item 7). Update this file when a feature is added or removed.

Status: **Shown** (in the mockups), **Fits** (has a home, mockups left it out), **Decision** (see the flags).

## Header and site wide

| Feature | Today | New home | Status |
|---|---|---|---|
| Logo and course name | Header | Header, course name opens the switcher | Shown |
| Search (course and all courses) | Header icon, search pages | Header icon | Shown |
| For teachers link | Header | Account menu inside courses; header elsewhere | Shown |
| Log in | Header button | Header, in place of the account picture | Decision F3 |
| Answer sounds on or off | Header icon | Account menu | Decision F3 |
| Dark mode | Header icon | Account menu | Decision F3 |
| Streak chip | Header, once you have progress | Header | Shown |
| Level chip and XP | Header, once you have progress | +10 XP pop up; level bar on Progress | Shown |
| Study assistant (AI tutor), corner button with "Ask me anything" tip | Bottom right of every page | Bottom right; above the bottom bar on phones | Decision F6 |
| Level up and XP animations | Every page | Same | Fits |
| Footer: Sources, Privacy, Terms, About, Premium, Account, Contact, Report a problem, review note, AP® trademark | Footer | Footer, unchanged | Fits |

## Home (course home and Path)

| Feature | Today | New home | Status |
|---|---|---|---|
| Banner with Start the first lesson and All units | Course home | Half height banner (step 4) | Shown (Step 7) |
| Create your personalized path (3 questions: how you study, what you know, exam date) | Course home and Path | Home | Fits (Step 7) |
| Full path: every topic in order, Mark done, Already know it? | Path tab | Home (step 1) | Fits (Step 7) |
| Next step on your path | Path, dashboard | Home, first card | Shown |
| Units with exam weight and Free lessons tag | Course home | Learn list; Home shows a short version | Shown (Step 7) |
| Ways to study: Practice, Review, Exams | Course home | Replaced by the 5 sections | Shown (Step 7) |
| Exam facts (60 multiple choice, 90 minutes...) | Course home | Exams page | Fits (Step 7) |
| Video lessons | Course home, notes | Learn, and inside notes | Fits |
| Free vs Premium box with price and Unlock | Course home | Home, lower down | Fits (Step 7) |
| Questions (FAQ) | Course home | Home, bottom | Fits (Step 7) |

## Learn

| Feature | Today | New home | Status |
|---|---|---|---|
| 8 units plus 2 skills tracks (Statistics and math; Experimental design) | Course home, units | Learn list: 8 unit rows, then 2 skills rows | Fits |
| Unit page: topics with Notes and Lesson links, Practice this unit, Unit test, unit tools and FRQs | Unit pages | Inside each open unit | Decision F2 |
| Notes page per topic (free): quick answer, video, figures, glossary pop ups, Report a problem | Notes pages | Learn, opened from a topic row | Decision F1 |
| Interactive lesson per topic (free in Units 1 and 2, then Premium) | Lesson pages | Learn, opened from the topic | Decision F1 |
| Textbook view: a whole unit as one long read | Learn tab | Learn, "Read the whole unit" in each open unit | Decision F2 |
| Unit sheet: one page summary, Print, Copy link, Google Classroom | Unit sheets | Inside each open unit | Decision F2 |
| Glossary: search, unit filter, A to Z | Glossary tab | Learn, link under the list | Shown |
| Tools: 10 simulators and 7 calculators, Free or Premium tags | Tools tab | Learn, link under the list | Shown |
| Inside a tool: Explore, Predict, Questions, Explanation, data and settings, Ask the tutor | Tool pages | Unchanged | Fits |

## Practice

| Feature | Today | New home | Status |
|---|---|---|---|
| Build a set: unit, topic, science practice, question type (standalone, stimulus sets, numeric), difficulty | Practice page | Practice settings panel | Decision F7 |
| My weakest topics | Practice page | Practice settings panel | Decision F7 |
| Questions I missed | Practice page | Practice settings panel | Decision F7 |
| Number of questions: 5, 10, 20 or All | Practice page | Practice settings panel | Decision F7 |
| Print as a worksheet, with answer key option; Copy link; Google Classroom | Practice page | One Share button | Decision F5 |
| 15 free questions a day counter | Practice, dashboard | Under Start | Shown |
| Review: spaced review, what you missed comes back before you forget | Review tab | Practice row with how many are due | Shown |
| Flashcards: decks (all, missed terms, by unit, skills), card types, Study 20 cards | Flashcards tab | Practice row; its own page | Shown |
| Free response practice: 37 questions, filter by type and unit, rubrics | FRQ page | Practice row | Shown |
| Justification trainer: 32 written prompts, Check my answer, Ask the tutor | Justify page | Practice row | Fits |

## Question screen (during a session)

| Feature | Today | New home | Status |
|---|---|---|---|
| End session, progress, count | Session | Same (step 4) | Shown |
| Flag a question | Session | Same | Fits (Step 8) |
| Stimulus sets: several questions on one data set | Session | Same | Fits (Step 8) |
| Check, explanation for every option, answer sounds | Session | Same | Fits (Step 8) |
| Report a problem with a question | Session | Same | Fits (Step 8) |
| One clear next step at the end, share a result, other course suggestions | Session end | Same | Fits (Step 8) |

## Exams

| Feature | Today | New home | Status |
|---|---|---|---|
| Practice exam (multiple choice then free response, scored) | Exams tab | Exams | Shown |
| Unit test (one unit, weighted by topic); static unit test pages | Exams tab, unit pages | Exams; also linked in each open unit | Shown |
| Mixed timed set: 10, 20 or 30 questions | Exams tab | Exams | Fits |
| Timing: standard, 1.5 times, double, untimed (accommodations) | Exams tab | Exams settings | Fits |
| Cram kit: 3 or 2 week plan from your exam date, checkboxes, Print | Cram page, linked from dashboard | Exams, linked from Progress | Decision F4 |

## Progress (today: Dashboard)

| Feature | Today | New home | Status |
|---|---|---|---|
| What should I do now | Dashboard | Progress (and Home next step) | Shown (Step 10) |
| Am I getting better: weekly line, exam history | Dashboard | Progress | Fits (Step 10) |
| Will I be ready: percent at Strong, days left, what closes the gap, exam date and daily target, FRQ scores | Dashboard | Progress | Fits (Step 10) |
| Where am I losing points: weakest topics, mastery by unit, topic and science practice, deeper analytics (Premium) | Dashboard | Progress | Fits (Step 10) |
| What have I built: level, mastery count, work done, milestones and certificates | Dashboard | Progress | Fits (Step 10) |
| Kept in this browser: sign in to sync, download or import a backup | Dashboard | Progress footer and account menu | Fits |
| Study reminders | Account | Account menu | Fits |

## Account and Premium

| Feature | Today | New home | Status |
|---|---|---|---|
| Account and Premium page, Premium passes, Unlock buttons | Account, premium pages | Account menu; Unlock where a lock shows | Fits |
| Free and Premium tags on lessons and tools | Lists | Small "Premium" tag (step 6) | Shown |
| Invite friends (3 days for them, 7 days for you) | Account | Account menu | Fits |
| Join a class (student code) | Join page | Account menu | Fits |

## Teachers

| Feature | Today | New home | Status |
|---|---|---|---|
| Course teacher page: assign with a link, alignment, FRQ list | teachers.html per course | For teachers area (step 12) | Shown (Step 12) |
| Teacher portal: classes, LMS and LTI, report, quote, privacy agreement, live question | teach/ and live.html | For teachers area (step 12) | Shown (Step 12) |

## Only in some courses

| Feature | Today | New home | Status |
|---|---|---|---|
| Formula or equations sheet (AP math and science) | Course pages | Learn, link under the list | Fits |
| Score calculator (AP Chemistry, Physics 1, Calculus AB) | Course pages | Exams | Fits |
| NREMT: body map, flowcharts, mnemonics, scenario simulator, skill sheets, sound trainer, formulary, reference cards, exam day guide, study plan | NREMT pages | Learn tools, Practice and Exams | Decision F8 |
| Organic chemistry and A&P: mastery page, how to study, figure credits | Course pages | Progress and Learn | Fits |

## Open flags

- **F1 Where a topic row goes.** Each topic has free notes and an interactive lesson. The compact row (step 6) has one tap. Recommendation: The row opens the notes. An "Interactive lesson" button sits at the top of the notes, with a Premium tag where it applies.
- **F2 Unit actions in the open unit.** Today each unit has its own page with Practice this unit, Unit test, unit sheet, textbook view, tools and FRQs. The open in place list (step 6) showed only topics. Recommendation: One short line at the bottom of each open unit: Practice this unit · Unit test · Unit sheet · Read the whole unit. Unit tools and FRQs live in Tools and Practice.
- **F3 Header when logged out.** Step 3 moved sounds and dark mode into the account menu, but a visitor who is not logged in has no account menu. Recommendation: Logged out, the header shows a small menu button next to Log in with the same menu (sounds, dark mode, For teachers).
- **F4 Where the cram kit lives.** A study plan counted back from the exam date. Today it is reached from the dashboard. Recommendation: Exams, since it is exam prep, with a link from Progress under "Will I be ready".
- **F5 Share, print and Google Classroom.** Practice, lessons, unit sheets and FRQs each have Copy link, Print and Classroom buttons. The title row allows one small action. Recommendation: One "Share" button that opens Copy link, Google Classroom and Print. It is the page's one small action where the page has nothing more important.
- **F6 The study assistant button.** A corner button on every page. Not placed in any step yet; on phones it collides with the bottom bar. Recommendation: Keep it on every page except timed exams; on phones it sits just above the bottom bar.
- **F7 Practice settings.** The real page has far more settings than my P4 mockup: three modes, five filters and a count that includes All. Recommendation: Redo P4 with all of them: the mode as three choices, the filters folded under "More filters", Start always visible.
- **F8 NREMT has its own tools.** NREMT has ten pages no other course has. Recommendation: Settle it when we apply the design to NREMT; each one fits under Learn, Practice or Exams.
