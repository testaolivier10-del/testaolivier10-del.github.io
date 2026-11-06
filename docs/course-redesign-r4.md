# Course redesign round 4 (status file)

Owner: Olivier, 2026-11-05. Approved design canvas: https://claude.ai/artifact/8vv1uRvwhJHzZuL9XQCAgA
(AP® Biology as the template; every course gets the same form). Copies of the approved screens are in
`docs/redesign-r4/mockups/` (`Main` = course home for a new visitor, `HomeReturning`, `Learn`, `Practice`, `Tools`,
`Progress`; `.dc.html` files, read them as HTML; `canvas.json` holds the "WHY" notes). Images in them point at
`/_blob/...`; on the site use the real files (`assets/covers/`, `assets/covers/tools/`, `assets/video/thumbs/`).

## Owner's rule for this work
Every change needs a reason: Olivier's own decision or an outside source. Anything not listed below stays exactly as
it is on the live site. Keep every feature (nothing a student can do today may disappear). Same visual system as now
(`docs/site-redesign.md`): theme tokens only (dark mode must work), Inter Display headlines, Kalam hand line, Nunito
body, no em dashes, no example data shipped (real progress or nothing).

## Decisions (all Olivier's unless a source is named)
1. **Five course tabs in every course: Home, Learn, Practice, Tools, Progress.** Was 10 (Home, Path, Learn, Practice,
   Review, Flashcards, Exams, Glossary, Tools, Dashboard). Nav research: 5 to 7 top items. Active tab: Practice for
   practice, review, flashcards, exams, frq, justify, cram, unit tests, mixed sets and any session page; Learn for
   learn, notes, lessons, units, unit sheets, glossary, videos; Progress for dashboard/mastery; Tools for tools and
   tool pages. "Dashboard" is labelled "Progress". Phone bottom bar: the same 5 tabs, no More sheet.
2. **The path is the course Home.** The Path tab goes away; `path.html` redirects to the course home (keep the URL
   working). Home layout (mockup `Main` and `HomeReturning`):
   - Big course band as today (issue line, two-tone title, hand line, the course lead line, cover art). No hero buttons.
   - Two columns: LEFT a side column with, in order, Up next (Start/Continue, "Already know it?", "Mark done"),
     "Create your personalized path" card (before a path exists) or a "Your path" card with the setup and Change
     (after), the Course progress card (the live Path page's sidebar parts), then the "Ways to study" card (Practice,
     Review, Exams). RIGHT the path itself: one section per unit with a unit header (number, "Unit n · x to y% of the
     exam", name, "n topics" or "k of n topics"); only the unit holding the current stop is open, others open on tap,
     plus a "Show every unit" toggle (progressive disclosure, Nielsen Norman Group). Stops keep the live path's look
     (read, skill, practice, unit test; done green with a green trail; current gold).
   - Below both columns: the existing Video lessons and Tools sections (tool cards without descriptions).
   - Non-Premium visitors only (Premium users never see these): the 4 exam fact chips, the course's Premium card
     copied from the live Premium page (`courseSection` in `scripts/build-pricing.mjs`, shown open: cover + title,
     the Free/Premium table, the buy area with founding price, per-day price, Unlock + Start free, refund line,
     competitor comparison, Fine print and terms) and the FAQ cut to 4 questions (Is this course free? What's on the
     exam? Has it been reviewed? Is LevlPrep affiliated with the College Board?) with a link to the rest on About.
   - The separate "In this course" list and the hero path card are removed (the path's unit sections replace them;
     Olivier's no-repeat rule, 2026-10-26).
   - Phone: path first, side cards after it.
3. **Inner tabs (Learn, Practice, Tools, Progress, and pages under them) get a smaller version of the course band**:
   same colour and grid, issue line with the course name, title, one sub line, small cover art on the right (hidden on
   phones); the first cards underneath overlap its bottom edge by about 38 px. No buttons in it.
4. **Learn = the textbook.** Opens on the reader at the student's current topic (last opened, else the path's
   current stop, else the first topic), with the live Contents sidebar. A switch in the band: Textbook, Glossary,
   Videos (Glossary and Videos keep their own URLs; the switch links between them). Read/Interactive toggle, Mark this
   completed, Practice this lesson, next topic stay. In Read mode, a topic that has a video starts with a small
   preview strip (thumbnail with play button and length, title, "Watch it here, or keep reading"); tapping it opens
   the click-to-load player in place, with "Close video". The separate topic list page duplicating the path is not
   added. Share, copy link and print go into a "⋯" menu (overflow menus for secondary actions, NN/g).
5. **Practice is one panel** (Olivier, comment on the canvas): no separate Review/Flashcards cards.
   - Step 1 "What do you want to do?": tiles for every mode the course has: Practice set, Review (n due), Flashcards
     (n new today), Exam, Free response, Justify, Cram plan (plus a course's own modes, e.g. NREMT adaptive exam,
     scenarios; only show what exists).
   - Step 2 "Set it up": every setting visible, nothing behind "More options" (Olivier). Practice set: questions from
     (Any / My weakest / I missed), unit, topic, how many, science practice (or the course's equivalent), question
     type, difficulty, then Share to Google Classroom, Copy link, Print as worksheet, answer key checkbox. Review: unit,
     how many. Flashcards: deck, card types, new cards today. Exam: kind (full practice exam / unit test / mixed timed
     set), unit, timing; the exam breakdown stays behind "What's in the full exam" (information, not a setting).
     Free response: type, unit, question. Justify: topic, skill, prompt. Cram: exam date, plan length, print.
   - Step 3: one navy bar summing up the choice with one Start button whose label fits the mode.
   - The free daily limit shows once, in the band (dark text on the pale yellow box).
   - Start opens the existing engine for that mode (keep every engine and page; pass the settings in the URL and
     have the engine read them). The old mode pages stay reachable by URL.
6. **Tools**: tool cards without the description line (Olivier). Keep the Free and Premium groups, the tried status
   and Open. Each group sits in a card so it can overlap the band.
7. **Progress (dashboard design F)**: five questions kept; Q1 "What should I do now?" points to the path's Up next
   (Home owns "what next"), with the streak, today count and daily reminder row kept.
8. **Header**: dark mode and sound move into one settings menu (settings menu pattern, PatternFly; overflow for
   secondary actions, NN/g). Course name stays a plain label. **Tutor**: icon-only button, because the
   "Ask me anything" label covered page content (seen on Flashcards and the unit page).

## Build plan (parallel, one branch each off `claude/course-redesign-r4`, then combined)
| Part | Owns (edit only these, plus new files) |
|---|---|
| A Chrome | `assets/site-chrome.js`, every `*/assets/*nav*.js`, `assets/course/r3.css` and `r3-inner.css` band rules (`.r3 .band.short`, new `.r3 .lap`) |
| B Home = path | `scripts/build-course-homes.mjs`, ochem and nremt home builders/pages, `assets/course/hub.css`, `hub.js`, `assets/course/path.js`, `path.css`, `scripts/build-path-pages.mjs`, each course `index.html` and `path.html` |
| C Learn | learn/study-notes pages and their builders, `assets/course/book.css`, `glossary.css`, glossary pages, the videos page, `scripts/build-videos.mjs` |
| D Practice | each course's `practice.html` and the engines' URL handling (`assets/course/study.js`, `study.css`, course practice/review/flashcards/exams/frq/justify/cram scripts) |
| E Tools + Progress | tools pages and `scripts/build-r3-tools.mjs`/`build-tool-pages.mjs`, `assets/course/r3-tools.css`, dashboard pages and `assets/course/dash*.css/js` |

Shared names: inner pages use `<section class="band short">` for the small band and put `lap` on the first content
container; Part A owns those CSS rules. Integration pass after all parts: bump `sw.js` cache, changelog entry, weight
budgets in `scripts/check-weight.mjs`, `scripts/ci-local.sh` (with `BROWSER=1`), screenshots desktop and phone.

## Status
- [ ] A Chrome  - [ ] B Home  - [ ] C Learn  - [ ] D Practice  - [ ] E Tools/Progress  - [ ] Integration  - [ ] Live
