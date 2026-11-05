# Teacher classes (status file)

Free classes for AP® teachers: a teacher makes a class for one course, students join with a code, the teacher
assigns work and sees where every student struggles. Research report and owner decisions live in the Claude doc
"LevlPrep Teacher Interface: Research Report"; approved look: the "LevlPrep Teacher Mockups" artifact (2026-11-04),
built with the real course styles (r3 band, dashboard design F, path card).

## Owner decisions (2026-11-04)

- Teachers free, no verification at launch. Students stay on the free tier with its limits unless the teacher buys
  Class Premium at a discount (not built yet; the settings page says to email for now).
- Pilot AP® Biology; the code works for all ten AP® courses on the shared engine.
- Teacher sees scores, mastery, completion, last active, misses, flags and the answers picked. No streaks, no minutes.
- Teacher entry: footer link and a line on Premium; nothing on the homepage.
- Assignments: practice, review, exam, free response; required or optional; due dates, late window, chosen students.

## How it works

- Database: `scripts/sql/migrations/2026-11b-classes.sql` (also in `schema.sql`). Tables reached only through
  functions; `teach_*` for teachers, `class_*` for students. Checked against PGlite (21 checks, see git history).
  Codes are 8 characters from pgcrypto; code lookups are capped at 30 an hour per account (`class_code_tries`);
  summaries at 120 KB. Migration applied to the live database 2026-11-04.
- Model: `assets/class/class-model.js` (summary of a student's course progress, mastery, assignment status, item
  stats). Tests: `scripts/test/class-model.test.mjs`.
- Student side: `assets/class/class-student.js`, lazy loaded by `assets/site-chrome.js` on AP® course pages for
  signed-in visitors; pushes the summary (at most once a minute, only on change) and draws "From your teacher" on
  the course home. Join page: `join.html` + `assets/class/join.js`. Answer picks: one line in each
  `*-questions.js` writes `<course>_picks_v1` (this device; read into the summary).
- Sample class: `/teach/?demo=1` ("See a sample class" on the teacher landing). `assets/class/teach-demo.js` builds 18
  made-up students mid-term from real AP® Bio question ids, in the browser; edits stay in memory. No sign-in.
- Teacher app: `teach/index.html` + `assets/class/teach.js` + `assets/class/teach.css` (hash routes: home, work,
  a/<id>, assign, students, s/<id>, grades, settings, topic/<id>).

## Not in v1 (said honestly in the UI or left out)

- Time limits, answer reveal timing and shuffle per assignment (need changes in each course's practice engine).
- Reminder emails to students; teachers copy names instead.
- Class Premium checkout; Google Classroom import; LTI; co-teachers.
- NREMT, ochem and A&P classes (different progress stores). Owner asked 2026-11-04 for all courses; plan sent, waiting on OK.

## Grading rules (class-model.js `status`)

- Practice: N answers in the assignment's topics since it opened. Review: questions missed at some point and redone
  since it opened (no answers at all is not done; answers with nothing to redo is done). Exam: a non-partial unit test
  of that unit, or a full exam. Free response: a score saved since it opened.
- Done after the due date: late inside the late window, missing when late work is not accepted or the window closed.
- The student's browser records when it first saw each assignment done (`levlprep_class_done_v1`), so a later redo
  never makes finished work late. Teacher numbers come from the student's own browser (by design, like the rest of
  the site's progress).

## Checks done (2026-11-04)

- PGlite: 24 checks on the SQL (ownership, targeted assignments, leaving, codes, guess limit, grants).
- Browser: every teacher view and the student card rendered with fake class data built from real AP® Bio questions.
- Independent review: no XSS or ownership holes; its fixes are in (summary size, listener duplication, sign-out
  clearing via `levlprep_` keys, code guessing, grading edge cases, builder edits, CSV formula guard).

## v2 build (owner 2026-11-04: "build all of that")

Everything competitors have or teachers ask for, in four workstreams. Each lands on its own branch and PR; the
owner merges. Tick items here as they ship.

| Stream | Owner of files | Items |
| --- | --- | --- |
| A1 teacher app + SQL | `assets/class/teach.js`, `teach.css`, `class-model.js` (status rules only), new migration `2026-11c-classes-v2.sql` | assign to several classes at once; copy a class (to another period or next year, assignments shifted); class announcements; mastery assignments; exam controls in the builder (time limit, shuffle, answer release, per-student extra time); teacher-written questions (bank per teacher, added to practice/exam assignments); printable worksheet/test with answer key; AP skill report (CED science practices / skills where the bank tags them) and a predicted AP score band; integrity column (tab leaves during timed work); live mode (projector view: question by question, answers arrive as students submit); co-teachers (invite by code, same rights minus delete); department view (a teacher sees classes shared with their department code) |
| A2 course engines | each course's `pages/practice.js` and `pages/exams.js` (or equivalent), `assets/class/class-student.js` | read the assignment from `?la=<assignment id>`; enforce time limit times the member's `extra_time`; shuffle questions and options; hold answers and explanations until release; mastery runs until the target; teacher questions mixed in; record attempts and tab leaves |
| B other courses | `class-model.js` readers, `COURSES`, site-chrome boot list, SQL course check | NREMT, organic chemistry, A&P classes (after A1 merges) |
| C integrations | `worker/`, new `assets/class/teach-integrations.js`, new pages | reminder emails to students (Resend, through the Worker, teacher clicks send; never automatic to minors' parents); parent/guardian progress report (a printable or share link the student or teacher hands over: no parent emails stored); Google Classroom (OAuth, roster import, post assignment links, grade passback); Canvas and Schoology (LTI 1.3 launch, deep linking, grade passback); purchase order / invoice request for Class Premium; student data privacy page and a fillable DPA (SDPC style) for districts; teacher FRQ scoring with comments, AI first pass only when the FRQ grader launch rule in `docs/frq-grader.md` is met |

### Contract between the streams

- New assignment kind `mastery`: `spec = { topics: [...], target: 0.8, min: 10 }`. Done when the student's
  mastery on every listed topic is at least `target` with at least `min` answers since it opened.
- Controls on practice, review, mastery and exam assignments, all optional, in `spec.controls`:
  `{ timeLimit: minutes|null, shuffle: bool, release: 'now'|'after_due'|'after_submit', questions: [teacher question ids] }`.
  `class_mine` already returns `extra_time` per class (a multiplier, 1 = none).
- Student links from the card carry `la=<assignment id>`; the engine reads the assignment from
  `levlprep_classes_v1` (cached by `class-student.js`, `LevlClassStudent.list()`).
- Attempts recorded on the student's device in `levlprep_class_att_v1`:
  `{ <assignment id>: { start, end, n, c, tabs, answers: { <question id>: pick } } }`; `summarize` puts it in
  `summary.att`, and `status` prefers it for timed assignments.
- Teacher questions: table `class_questions` (teacher-owned, `{ id, course, topic, unit, type:'single', q, options,
  correct, why }`), read by students through `class_questions_for(p_assignment)` only for assignments they have.
- Live mode: tables `class_live` (one open session per class, current question) and `class_live_answers`; teacher
  polls `teach_live_state` every 2 s, students poll `class_live_state`; no Realtime dependency.
- Integrations UI: `teach.js` loads `assets/class/teach-integrations.js` and, on Settings and on an assignment page,
  renders whatever `window.LevlTeachIntegrations.settings(ctx)` / `.assignment(ctx)` returns (HTML string) and calls
  `.wire(ctx)` after render.

### A2 course engines: built (2026-11-04, branch `teach-v2-a2`)

- `assets/class/class-run.js` (+ `class-run.css`), loaded only when the address has `la=`, runs the assignment
  on the course's own practice or exam engine. All ten courses: the nine `<course>/assets/pages/practice.js` and
  `exams.js` (BC runs calculus's) carry small hooks (`LA`, `CLS`, `classBoot`); `review.js` sends `?la=` on to
  `practice.html`. Without `la=` the hooks are inert (`CLS` stays null) and class-run.js is never fetched.
- Start card (what the set is, time, release, due, teacher questions) and a sticky strip (teacher, title, clock,
  tab leaves, mastery progress). Practice kinds: practice (spec.count in topics/unit), review (questions missed in
  the topics), mastery (serves the topics until every one is at `target` with `min` answers since it opened,
  refilling, then ends) — all on practice.js. Exam: unit test (spec.unit, spec.count as its length) or full exam.
- Time: practice gets a class clock (timeLimit × extra_time) that runs from the first Start, survives reloads,
  and hands in at zero; a timed hand-in is final. Exams: the exam's own clock, its pace scaled so Section I takes
  the limit (Section II keeps the same pace); no limit means the standard pace × extra_time. No pause in a class
  exam. The attempt starts only once the questions load (`att.limit` keeps the budget), so a reload resumes the same
  clock with new questions and the same free exam. Tab leaves count from page load while an attempt runs (leaving
  the page itself is not counted). A failed load re-enables Start with a message; a free-plan student who has used
  the course's free exam gets a message on the start card and no attempt.
- Release: held runs grade silently (the engines' `exam` mode; "Answer saved"). `after_submit`: the normal summary
  or exam results after hand-in. `after_due`: a "Handed in" card until the due date; then the start card offers
  "See your answers" (each question, the pick, the key, the why). Mastery always gives feedback. While answers are
  held nothing goes into `<course>_progress_v1` (so review and missed mode show nothing early): held answers wait in
  `levlprep_class_hold_v1` and are recorded at release (hand-in for `after_submit`, the first open after the due date
  for `after_due`).
- Shuffle: question order (stimulus sets whole) and the teacher's options; bank options are shuffled on every page
  already, except items whose order matters.
- Teacher questions: `class_questions_for` via `StudyHubAccount.rpcData`, quiet when missing. Text escaped; shown as
  single-choice items marked `own`, so they never enter `<course>_progress_v1`, review, mastery or the free-tier
  allowance. Their topic and unit are used only when they are ids in the course's curriculum (else the assignment's
  first topic), because pages put them in links. A row without `correct` (held release) runs ungraded; at hand-in
  the picks go to `class_submit(p_assignment, p_picks)` (quiet when missing). Its `{ recorded, at, answers: [{ id,
  correct, why }] }` (a bare list or an id map also read) adds the right ones to the attempt's `c` once each (`graded`
  map in the attempt); after the due date the keys `class_questions_for` then returns grade them on the next open.
  Ungraded items stay out of the page's own score and review. Picks live in `levlprep_class_att_v1[aid].answers`
  (pick = option index).
- Attempt record as in the contract: `start` (first Start), `end` (last hand-in), `n`/`c` (practice: distinct
  questions answered and right first try, across runs; exam: questions in the exam and score), `tabs`
  (`visibilitychange` to hidden while timed work runs: any assignment with a limit, every exam), `answers` (first pick,
  at most 300). Hand-in forces `LevlClassStudent.push` (now exports `noteDone`; its change hash includes `sum.att`, so
  A1's `summary.att` is pushed when only the attempt changed).
- `class-student.js` `href()`: practice, review, mastery and exam links carry `la=`; review and mastery go to
  `practice.html`; KIND has `mastery`. The card also draws `class_mine().announcements` (newest 5; `body`, `text` or
  `message`, dated by `created_at` or `at`) and, when `live` is true, a "Join the live session" link to
  `/live.html?c=<class id>`.
- Checks: `scripts/test/class-run.test.mjs` (pure parts); Playwright on all ten courses with a seeded class (clock,
  auto hand-in, held answers, tab count, teacher question escaped and shuffled and kept out of progress, mastery
  strip, exam clock without pause, exam record and results; pages without `la=` unchanged and never fetch
  class-run.js). `check-weight.mjs`: five course shells raised 0.3-0.4 KB for the hooks (commented there).
- Left: FRQ assignments take no controls; teacher questions are single choice only, and in a full exam with calculator parts they sit in the no-calculator
  part.

### Needs the owner (code ships behind flags until done)

- Google Classroom: a Google Cloud project, OAuth consent screen with Classroom scopes, app verification.
- Canvas / Schoology: LTI 1.3 developer keys are made per school; a setup page explains the steps.
- Signing DPAs and listing on the SDPC registry; reminder emails need the Resend domain already used by the site.
