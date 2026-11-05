# Teacher classes (status file)

Free classes for teachers (AP®, EMT, organic chemistry, A&P): a teacher makes a class for one course, students join with a code, the teacher
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
- Student side: `assets/class/class-student.js`, lazy loaded by `assets/site-chrome.js` on every class course page for
  signed-in visitors; pushes the summary (at most once a minute, only on change) and draws "From your teacher" on
  the course home. Join page: `join.html` + `assets/class/join.js`. Answer picks: one line in each
  `*-questions.js` writes `<course>_picks_v1` (this device; read into the summary).
- Sample class: `/teach/?demo=1` ("See a sample class" on the teacher landing). `assets/class/teach-demo.js` builds 18
  made-up students mid-term from real AP® Bio question ids, in the browser; edits stay in memory. No sign-in.
- Teacher app: `teach/index.html` + `assets/class/teach.js` + `assets/class/teach.css` (hash routes: home, work,
  a/<id>, assign, students, s/<id>, grades, settings, topic/<id>; v2 adds skills, live, bank, print/<id>, and
  `?dept=1`). Student live page: `live.html` + `assets/class/live.js`.

## Not in v1 (said honestly in the UI or left out)

- Time limits, answer reveal timing and shuffle per assignment (v2: set in the builder; enforced by stream A2).
- Reminder emails to students; teachers copy names instead.
- Class Premium checkout; Google Classroom import; LTI (v2 stream C). Co-teachers: done in v2 (A1).

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
| B other courses | `class-model.js` readers, `COURSES`, site-chrome boot list, SQL course check | NREMT, organic chemistry, A&P classes (shipped on `teach-v2-b`, see below) |
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
- Answer release for teacher questions (A1, after review): `class_questions_for(p_assignment)` returns `correct`
  and `why` only when the answers may show: `controls.release` is `'now'` or missing, the student's own due date
  (with their extra days) has passed, or they have submitted and release is `'after_submit'` (or `'after_due'`
  with no due date). Otherwise each question is `{ id, course, topic, unit, type, q, options }`.
  The engine hands in the picks with `class_submit(p_assignment, p_picks)`, `p_picks = { <teacher question id>:
  <option index> }` (only ids in `controls.questions`, at most 8 KB). It is recorded once (table
  `class_submissions`, one row per student and assignment; later calls change nothing) and returns
  `{ recorded: true, at, answers: [{ id, correct, why }] }` when the answers may show, else `{ recorded: true, at }`
  (`'after_due'` before the due date); `null` when the assignment is not the student's. Bank questions are graded on
  the device as before.
- Mastery: the builder saves `spec.qn = { <topic>: questions for full mastery }`, so `status(a, sum, now)` without
  a curriculum (class-student.js) gives the same answer as the teacher's page.
- Live mode: tables `class_live` (one open session per class, current question) and `class_live_answers`; teacher
  polls `teach_live_state` every 2 s, students poll `class_live_state`; no Realtime dependency.
- Integrations UI: `teach.js` loads `assets/class/teach-integrations.js` and, on Settings and on an assignment page,
  renders whatever `window.LevlTeachIntegrations.settings(ctx)` / `.assignment(ctx)` returns (HTML string) and calls
  `.wire(ctx)` after render.

### Stream A1 status (teacher app + SQL), 2026-11-04

Shipped on branch `teach-v2-a1` (all in the sample class, `/teach/?demo=1`):

- [x] Assign to several classes at once: "Also assign to" in the builder (same course, whole class only; one
  `teach_save_assignment` per class).
- [x] Copy a class: Settings, `teach_copy_class` (same course and order, assignments shifted by N days, no students,
  new code).
- [x] Announcements: Class page section 4; `teach_post_announcement` / `teach_delete_announcement`. Students get the
  5 newest in `class_mine().announcements` (A2: draw them in "From your teacher").
- [x] Mastery assignments: builder tile, `spec = { topics, target, min }`; `status(a, sum, now, cur)` rule in
  class-model.js (every topic at `target`, at least `min` answers in them since it opened) + tests.
- [x] Exam controls in the builder, written to `spec.controls` per the contract; extra time per student on the
  student page (1, 1.25, 1.5, 2, 3).
- [x] Teacher question bank: `#bank`, table `class_questions`, `teach_questions` / `teach_save_question` /
  `teach_delete_question`; picked in the builder into `spec.controls.questions`; students read them with
  `class_questions_for(p_assignment)` (member, opened, meant for them, written by a teacher of that class).
- [x] Printable worksheet or test with answer key: `#print/<id>` (versions A/B, key on its own page, print CSS).
  Single-choice items only; graph stimuli are left out (they need the course page's styles).
- [x] AP skill report and predicted score band: `#skills`. Skills from each bank item's `practice` tag. Band method:
  each unit's mastery weighted by the midpoint of the unit's exam `weight` range, over the units reached (all units
  if no current unit); under 20% is 1 to 2, under 40% 2 to 3, under 60% 3 to 4, under 80% 4 to 5, else 5; fewer
  than 30 answers in those units gives no band. Labelled "Estimate" and "Not a College Board score" everywhere.
- [x] Integrity column: assignment page "Timed work and integrity" (time used against limit times extra time, tab
  leaves from `summary.att`), and a tab-leave mark in the gradebook. `summarize` now copies `levlprep_class_att_v1`
  into `summary.att` (40 newest, 60 answers each); `status` prefers it when `spec.controls.timeLimit` is set.
- [x] Live mode: `#live` (projector view, polls `teach_live_state` every 2 s), student page `live.html` +
  `assets/class/live.js` (polls `class_live_state`, answers with `class_live_answer`, changeable until the reveal).
  `class_mine()` also carries `live: true` while a session is open (A2 may link to /live from the card).
- [x] Co-teachers: owner makes a code in Settings (`teach_coteach_code`), the other teacher enters it on Your classes
  (`teach_coteach_join`). Same rights minus deleting the class or assignments, removing students, archiving,
  sharing with the department and managing co-teachers (`class_role` in SQL, `isOwner()` in the UI).
- [x] Department view: `/teach/?dept=1`; create or join with a code (`teach_dept_*`), one department per teacher.
  The owner shares a class in Settings; its own page writes `dept_stats` (counts and averages, no names) at most
  hourly; the server keeps only whitelisted numbers and unit keys (`class_clean_stats`). Leaving or switching
  departments unshares the teacher's classes.
- Review fixes: assignment student lists are capped at 200 ids (`class_students_ok`); copying a class copies the
  teacher questions its assignments use (written by its other teachers) into the copier's bank; the print view
  includes co-teachers' questions (`teach_class_questions`); mastery `doneAt` is when the target was first reached.
- [x] Integrations hook: teach.js loads `assets/class/teach-integrations.js` if present and renders
  `.settings(ctx)` / `.assignment(ctx)` into Settings and the assignment page, then `.wire(ctx)`. ctx:
  `{ where, demo, classId, cls, role, box, call, members: [{id, name}], assignment }`. Until C ships the file the
  page logs one 404 for it and carries on.
- [x] Fixed on the way: the join page only took 6-character codes while the database makes 8 (joining could never
  work); `join.js` / `join.html` now take 8.

Database: `scripts/sql/migrations/2026-11c-classes-v2.sql` (appended to `schema.sql`), NOT APPLIED. Tested with
PGlite in `scripts/test/classes-v2-sql.test.mjs` (set `PGLITE` to the package folder; it skips without it).

Left for later: printing non single-choice items and graph stimuli; reminders and integrations (stream C);
the course engines enforcing controls and recording attempts (stream A2).

### Stream B status (other courses), 2026-11-04

Shipped on branch `teach-v2-b` (built on `teach-v2-a1`, PR #137). Teachers can make classes for EMT (NREMT), Organic
Chemistry and Anatomy & Physiology; every teacher view works for them. Sample: `/teach/?demo=1&course=nremt`.

- [x] `COURSES` gains `nremt`, `ochem`, `anp` with flags (`ap: false`: no Skills tab, score band or AP® wording;
  `frq: false`: no free-response tile; `unitExams: false` for NREMT; `unitWord` Chapter/Area; `need`; `bank`).
- [x] One reader per progress shape (`READ` in class-model.js), all giving the same summary:
  - A&P: `anp_progress_v1` (AP® record without the unit; the unit comes from the curriculum's topic -> chapter),
    `anp_flagged_v1`, `anp_picks_v1`, and `anp_prefs_v1.examHistory`, which A&P's exams page did not keep before:
    `assets/apps/exams.js` now writes it in the AP® shape (unit quiz on some topics is `partial`; final is `full`).
  - NREMT: `nremt_mastery` `{ level, timesCorrect, timesWrong, lastSeen }` per id (latest right = level > 0),
    `nremt_exam100_flagged` (list of ids), `nremt_exam100_history` and `nremt_cat_history` (both count as the full
    exam), `nremt_lessons_v1`, `nremt_picks_v1`. Records carry no topic, so `assets/class/nremt-map.js`
    (`scripts/build-class-maps.mjs`; `--check`; rerun after a bank change, the test fails otherwise) maps each id to
    its topic and difficulty: units are the six topic areas, topics the bank's `topic` labels per area (25; a label found in two areas is two topics).
  - Ochem: the mastery engine stores concepts, not questions, so `diagnostic-engine.js applyResult` now also writes
    `ochem_items_v1` (per question, AP® shape, 1500 newest) and `ochem_picks_v1`. Older answers: unfixed and fixed
    misses from `ochem_mastery_v1.mistakes`. Exams: `ochem_exam_history_v1` (chapter test = that chapter's unit test,
    cumulative final = full). Lessons: `ochem_progress` entries with `completed`.
- [x] Curriculum adapter `curriculum(course, raw)`: A&P chapters, ochem `MODULES`, the NREMT map, as `{ units, topics }`.
  Teacher bank lookups through `bankUrl` / `bankItems` / `whyUrl` (A&P per chapter like AP®; NREMT
  `questions-core.json`, ochem `practice-bank-core.json` with ids `lb:<topic>:<index>`, one fetch each; no
  explanations for those two in live mode and print).
- [x] Answer-pick hooks: `anp-questions.js` (one line, as AP®), A&P exams page, NREMT `updateMastery` (bank index via
  `nremt_option_order`; also fires `nremt:progress` so the card and push update), ochem `applyResult` (fires `ochem:progress`).
- [x] Picker, landing copy ("AP® Biology through AP® Macroeconomics ..., EMT (NREMT), organic chemistry, and anatomy
  and physiology"), `teach/index.html` description, Premium FAQ line, site-chrome `CLASS_DIRS`.
- [x] Migration `scripts/sql/migrations/2026-11e-classes-courses.sql` (+ `schema.sql`): course check in
  `teach_create_class` and `teach_save_question` accepts `nremt|ochem|anp`. NOT APPLIED.
- Checks: `scripts/test/class-model.test.mjs` (readers from real-shaped fixtures, adapters on the real curricula,
  links against the pages' own parameter code, banks, hooks), `sql-migration.test.mjs`, check-site, check-weight
  (A&P shell 56 -> 56.4, nremt practice 55.2 -> 55.6), Playwright: every teacher view of the NREMT sample, the AP®
  Bio sample unchanged, the student card and `class_push` summary on the NREMT, ochem and A&P homes.

Links (`LevlClassModel.href`, relative to the course home):

| Course | Practice | Review | Exam |
| --- | --- | --- | --- |
| A&P | `practice.html?topic=` (first topic; chips for the rest) | `review.html` | `exams.html?mode=system&chapter=` / `?mode=final` |
| Ochem | `practice.html?topic=&count=` | `practice.html?mode=mistakes` (closest: Review is the concept queue) | `exams.html?kind=chapter&chapter=` / `?kind=final` |
| NREMT | `practice.html?system=<area>`: no sub-topic filter, so the closest is the area drill; the builder says so | `review.html?start=review` (missed queue) | `exams.html` (full only; no unit exams) |

Gaps: ochem has per-question history only from this change on (plus its logged misses); NREMT and ochem picks,
`ochem_items_v1` and the NREMT map are this device's (not synced, like AP® picks); ochem interactive questions and
NREMT multi/table items show as "Question <id>" text-less in the most missed list when they are not in the core file
(NREMT TEI items are in it; ochem interactive are not); no skills report or score band outside AP®.

### Needs the owner (code ships behind flags until done)

- Apply `2026-11c-classes-v2.sql` in the Supabase SQL editor after reviewing the PR (after 2026-11b).
- Apply `2026-11e-classes-courses.sql` after 2026-11c (stream B: classes for NREMT, ochem and A&P).

- Google Classroom: a Google Cloud project, OAuth consent screen with Classroom scopes, app verification.
- Canvas / Schoology: LTI 1.3 developer keys are made per school; a setup page explains the steps.
- Signing DPAs and listing on the SDPC registry; reminder emails need the Resend domain already used by the site.
