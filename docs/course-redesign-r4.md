# Course redesign round 4 (status file)

Owner: Olivier, 2026-11-05. Approved design canvas: https://claude.ai/artifact/8vv1uRvwhJHzZuL9XQCAgA
(AP® Biology as the template; every course gets the same form). Copies of the approved screens are in
`docs/redesign-r4/mockups/` (`.dc.txt`, read them as HTML; `Main` = course home for a new visitor, `HomeReturning`, `Learn`, `Practice`, `Tools`,
`Progress`; `canvas.json` holds the "WHY" notes). Images in them point at
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
   - Built (part D): markup and per-course config `scripts/lib/practice-panel.mjs` (`practicePage` in the AP® and
     A&P builders; `scripts/build-practice-panel.mjs [--check]` writes the marker blocks in `nremt/practice.html`
     and `ochem/practice.html`), behaviour `assets/course/practice-panel.js`, styles `practice-panel.css`. URL
     contract, each with `go=1`: `review.html?unit=&n=` (ochem `chapter=&n=`: the due concepts that show up in
     that chapter's topics; NREMT `domain=&n=`: an exam domain or `system:<topic area>`), `flashcards.html?deck=&kinds=&new=` (ochem/NREMT
     `chapter|domain=&scope=&types=`), `exams.html?mode=&unit=&len=&n=&timing=` (A&P `mode=&chapter=&course=`,
     custom exam `chapters=&types=&levels=&diffs=` as comma lists, missing = all, and `len=10|20|40|0`;
     ochem `kind=&chapter=&len=&from=&to=`, NREMT `exam=full|cat&diff=&real=`), `frq.html?type=&unit=` (or
     `frq/<id>.html`), `justify.html?unit=&topic=&skill=` (or `?p=`), `cram.html?date=&weeks=&print=1`.
   - **Practice v2 (owner approved 2026-11-06, mockup `docs/redesign-r4/mockups/PracticeAll.dc.txt`) replaces
     the tiles and the per-mode step 2** (the Review tile made the whole card disappear). One card "Build your
     session" with every row always visible: Format (only the course's formats; NREMT adds Adaptive exam and
     Scenarios), Exam (the course's exam kinds), Questions from (new, due with live count, missed with live
     count, weakest; A&P and ochem add studied), Units/Chapters/Domains chips plus Topics, the science practice
     (A&P: Core concept; none in ochem/NREMT), Question type (cards: card types; FRQ: FRQ types; justify:
     skills), Difficulty (A&P plus Level), How many, Timer (off, exam pace, time and a half, double), Explanations,
     Exam date (`LevlExamDate.write`, link to `cram.html?date=`). A row that does not apply is greyed with
     its reason (`why()` in `practice-panel.js`); a single chip that cannot be chosen is disabled with a title.
     Quick picks only fill the settings. Right column: navy summary, one Start, sharing card (Classroom,
     copy link = the Start URL, worksheet + answer key for AP® question sets through the engine).
   - Start contract: question sets in AP® and A&P run on practice.html through `window.<Glob>PracticeHook` (`ApBioPracticeHook`, `AnpPracticeHook`, ...)
     (each `assets/pages/practice.js` and `anatomy-physiology/assets/apps/practice.js`: `run({pick, count,
     mode, order, label, defer})`, `print`, `setup`; `window.<Glob>PracticeMeta` gives the type and difficulty
     lists); URL `practice.html?go=1&from=&units=&topic=&practice=|core=&type=&diff=&level=&n=&timer=&expl=end`.
     Ochem `practice.html?go=1&from=&chapters=&topic=&tier=&type=interactive&n=` (`plan.topics` in
     question-engine.js); NREMT `practice.html?go=1&from=new|weak|missed&area=&diff=&n=`. Due for review in
     ochem/NREMT goes to their Review page. Timer for question sets: the panel's clock (pace from config ×
     session length), it presses End session (NREMT: `window.NremtPanel.submit`). Explanations at the end:
     `pp-defer` hides feedback; answered steps come back in the summary (`.pp-kept`); not offered in
     ochem/NREMT (their runners explain as they go). Exams accept any length 5 to 60 (AP® unit test and mixed
     set, ochem chapter test and midterm, A&P custom); flashcards accept list decks (`deck=unit:a,unit:b`,
     `topic:x,topic:y`) and `new=0` (due only), neither saved to prefs.
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
- [x] A Chrome  - [x] B Home  - [x] C Learn  - [x] D Practice  - [x] E Tools/Progress  - [x] Integration  - [x] Live
  (all parts done, merged in PR #149).
- Follow-up fixes (branch `claude/r4-gaps`, 2026-11-05):
  - Progress pages: `<title>`, og title, JSON-LD name and breadcrumb say "Progress" (was "Dashboard"; "Your
    dashboard" in the title), same title pattern as the other tabs. Source: `h1`/`title` of the
    dashboard entry in each `*/data/pages.json` (and the test fixtures), the nremt/ochem heads by hand,
    `scripts/build-r3-inner.mjs` crumbs. The URL stays `dashboard.html`.
  - A&P custom exam: the panel shows the exam page's own custom choices (chapters, question types, level,
    difficulty, length) and starts it directly; `anatomy-physiology/assets/apps/exams.js` reads them
    (`customFromUrl`). Opening exams.html directly still shows the setup.
  - Ochem and NREMT Review: the panel has Chapter (ochem) or Domain (NREMT: exam domains and topic areas, read
    from `practice-engine.js`) and How many; `ochem/assets/review-page.js` and `nremt/practice-engine.js`
    narrow and cap only the session the panel starts. Review opened directly serves the whole queue as before.
- Practice v2 (branch `claude/practice-v2`, 2026-11-06): decision 5's v2 bullets above. Built in all 13 courses;
  tested in headless Chrome (bio, nremt, ochem, calculus, anatomy-physiology at 1280 and 390). Known limits:
  FRQ and justify run one at a time (How many greyed), the FRQ page has no clock (Timer greyed), AP® exams keep
  the real mix (type, difficulty, practice greyed), justify counts include Premium-locked prompts.
- Practice v2b (branch `claude/practice-v2b`, owner feedback 2026-11-06: look and work exactly like the mockup,
  keep the course's options): greying follows the mockup's `applies` (Questions from greyed only for a timed
  exam, "A practice exam draws from every unit by exam weight"; Question type only for questions and exams;
  Difficulty and Timer kept for flashcards and written answers but greyed with the engine reason where the engine
  has no such option; Explanations only for questions, "Exams explain everything at the end"). The Exam row stays
  (full / unit test / mixed set and each course's kinds), always visible, greyed "Only for a timed exam". A greyed
  row keeps its label colour; its chips fade to .4. The Question type row always shows question types (card,
  free-response and justify types stay on their own pages). Timed exam sets Exam pace, At the end, All; Questions
  sets After each answer; quick picks as the mockup. Summary: title, "From <source>, <units>", type · difficulty,
  timer · explanations, each when its rows apply; Start "Start practice / Start the exam / Study cards / Start
  writing / Start a prompt". An empty source (nothing due) stays choosable; the summary says so and Start waits.
  AP® unit tests and mixed sets honour `type`, `diff`, `practice` (`exams.js`, go=1 only).
