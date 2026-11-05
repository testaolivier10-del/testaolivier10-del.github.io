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
  a/<id>, assign, students, s/<id>, grades, settings, topic/<id>; v2 adds skills, live, bank, print/<id>, and
  `?dept=1`). Student live page: `live.html` + `assets/class/live.js`.

## Not in v1 (said honestly in the UI or left out)

- Time limits, answer reveal timing and shuffle per assignment (v2: set in the builder; enforced by stream A2).
- Reminder emails to students; teachers copy names instead.
- Class Premium checkout; Google Classroom import; LTI (v2 stream C). Co-teachers: done in v2 (A1).
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
  exam. A reload of an exam with a limit keeps the time left but draws new questions.
- Release: held runs grade silently (the engines' `exam` mode; "Answer saved"). `after_submit`: the normal summary
  or exam results after hand-in. `after_due`: a "Handed in" card until the due date; then the start card offers
  "See your answers" (each question, the pick, the key, the why). Mastery always gives feedback. Bank items are
  still recorded as they are answered (so a held set's misses reach the student's review queue at once).
- Shuffle: question order (stimulus sets whole) and the teacher's options; bank options are shuffled on every page
  already, except items whose order matters.
- Teacher questions: `class_questions_for` via `StudyHubAccount.rpcData`, quiet when missing. Text escaped; shown as
  single-choice items marked `own`, so they never enter `<course>_progress_v1`, review, mastery or the free-tier
  allowance. A row without `correct` (held release) runs ungraded; at hand-in the picks go to
  `class_submit(p_assignment, p_picks)` (quiet when missing), its `[{ id, correct, why }]` (or `{ id: {...} }`) adds
  the right ones to the attempt's `c` once each (`graded` map in the attempt), and ungraded items stay out of the
  page's own score and review. Picks live in `levlprep_class_att_v1[aid].answers` (pick = option index).
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
- Left: FRQ assignments take no controls; an exam that fails to load stays on the start card (reload works);
  teacher questions are single choice only, and in a full exam with calculator parts they sit in the no-calculator
  part.

### Stream C (integrations): status, 2026-11-04

Built, tested, not deployed (Worker not deployed, `2026-11d` not applied). Everything is off until the owner steps below.

| Item | Status | Where |
| --- | --- | --- |
| C1 Reminder emails | Built. Teacher ticks missing / not started students on an assignment page and presses Send; Worker checks ownership, looks up addresses (teacher never sees them), sends plain text through Resend. Limits in SQL: 1 per student per 20 h (any teacher), 200 a day per teacher, 60 per request; one-click "stop teacher reminders" (GET asks, POST acts). No automatic sends. | `worker/src/class-mail.js`, `class_mail_take` |
| C2 Family progress report | Built. Printable page for the teacher (`?c=&s=`) and an expiring share link (1-30 days, made by the teacher or the student, only a SHA-256 stored, dies when the membership ends). No parent emails anywhere. | `teach/report.html`, `assets/class/report.js`, `class_report_get` |
| C3 Google Classroom | Built behind `CLASS_GOOGLE`. OAuth (refresh token AES-GCM encrypted under `CLASS_SECRET`, stored only when the signed-in teacher who started it claims it), link a course, roster match by email (stores Classroom user ids, not emails), invite non-members by email with the join link, post an assignment as coursework with the course link, grade passback for required assignments (teacher presses Send; teacher returns grades in Classroom). | `worker/src/class-google.js` |
| C4 Canvas / Schoology (LTI 1.3) | Built behind `CLASS_LTI`. OIDC login and launch (RS256 against the platform JWKS, nonce signed in the state and single-use), deep linking to a class assignment (line item for required ones), AGS score passback from the assignment page, Canvas JSON config, JWKS. Setup guide with the registration form for admins. Not yet tried against a real Canvas or Schoology. | `worker/src/class-lti.js`, `teach/lms.html`, `teach/lti.html` |
| C5 Quote / purchase order | Built. Signed-in form, stored, emailed to `CLASS_SALES_TO` (default hello@) with Reply-To, receipt to the teacher. Polar invoices only paid orders (a PDF per paid order); no unpaid invoice or net-30, so purchase orders are answered by email. | `teach/quote.html`, `classQuote` |
| C6 Privacy for districts + DPA | Built. Data table, FERPA (school official only under a signed agreement), COPPA (13+, no school consent relied on), retention, deletion, security (no certification claimed), subprocessors; fillable DPA following the SDPC NDPA structure, marked unsigned, owner signs. `privacy.html` mentions the new tools. | `teach/privacy-agreement.html` |
| C7 Teacher FRQ scoring | Built. Student sends the draft from "Your classes" (join.html); teacher ticks rubric points, comments, saves; student sees score and comment. AI first pass: Claude only, only with `FRQ_GRADER` on (or owner) and a model in the launch rule's Results table (`CLASS_FRQ_PASSED_MODELS`), 60 a day per teacher, a suggestion the teacher must save. | `class_frq_*`, `teach_frq_*`, `worker/src/class-frq.js`, `assets/class/class-frq.js` |

Tests: `scripts/test/worker-classes.test.mjs` (21), `sql-migration.test.mjs` (2026-11d grants, RLS, Worker-only), PGlite
`scripts/test/pglite/classes-integrations.mjs` (70 checks), browser render of every new page at 390 px and the cards on the sample class.

Independent review fixes (2026-11-04):
- LTI registrations start `pending`; the Worker emails the owner (`CLASS_SALES_TO`, default hello@) a 14-day link to
  `/lti/activate` (GET shows the addresses and flags any not where Canvas or Schoology publish them, POST activates,
  refused if the row changed since). Login, launch and grades use active platforms only. A launch binds only when its
  platform and LMS course match the class's `class_ext_links` row (written by the owner's deep link); line items and
  scores go only to the registered token URL's host.
- Quote receipts go to the signed-in account only; typed text loses links and bare domains (`clsText`, `clsLine`).
- Classroom invites: once a week per address (SHA-256 in `class_mail_log.recipient`), a stop link that blocks that
  address (`class_email_optout_addr`, which also blocks teacher reminders to it); the roster answer carries names and
  counts, never Classroom addresses.
- The mail log, expired report links and used launch nonces are cleared hourly by the cron (`class_purge`); quote
  requests are deleted with the account. The district page and `privacy.html` say so.
- Co-teachers (`class_coteachers`, A1's table; also created by 2026-11d so either order works) may send reminders,
  make report links and score free responses (Worker `clsTeachClass`, SQL `teach_frq_*`). Google, LTI and grade
  passback stay with the owner.

Contract notes for A1 / A2 (no edits to their files):
- `teach.js` passes A1's `ctx = { where, demo, classId, cls, role, box, call, members, assignment }`; teach-integrations
  loads `teach_class_report` through `ctx.call` for what needs summaries and draws into `ctx.box`. The older
  `{ rep, assignment, demo }` shape works too. `role: 'co'` hides the Google, LMS and grade passback cards.
  `LevlTeachIntegrations.gradeList(ctx, zeroMissing, frqScores)` is the score list the grade buttons send.
- A teacher's FRQ score (`teach_frq_work` → `score.got / score.of`) could replace the self-score in `status` for `frq` (A1's call).
- Classroom and LMS links open `/<course dir>/?la=<id>` (the course home with the card); A2 may scroll to or open that assignment.
- `window.LevlClassFrq.submit(assignmentId, course, frqId)` is ready for a "Send to my teacher" button on FRQ pages (A2).

Owner steps for stream C:
1. Supabase SQL editor: run `scripts/sql/migrations/2026-11d-classes-integrations.sql` (after 2026-11b; independent of 2026-11c).
2. Worker secret `CLASS_SECRET` (`openssl rand -base64 48`). Reminders, report links and stop links need it plus the existing `RESEND_API_KEY` / `REMINDER_FROM`; merge to main deploys.
3. Google Classroom: Google Cloud project, enable the Classroom API, OAuth consent screen with the scopes in `GC_SCOPES`
   (classroom.courses.readonly, rosters.readonly, profile.emails, coursework.students, openid, email), a Web client with redirect URI
   `https://api.levlprep.com/class/google/callback`; secrets `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`; `CLASS_GOOGLE = "owner"` to try,
   then app verification by Google (sensitive scopes) before `"on"`.
4. LTI: `node scripts/lti-keygen.mjs` → secret `LTI_PRIVATE_KEY`; `CLASS_LTI = "owner"`; activate each school's
   registration from the emailed `/lti/activate` link after checking it with the school; try it on a Canvas instance where you
   can add a developer key (a school's test instance or an Instructure sandbox), then `"on"`.
5. AI first pass on teacher scoring: nothing extra; it follows `FRQ_GRADER` and the eval results.
6. Read and approve the DPA draft and the district page before sending them to a school; sign each DPA; list on the SDPC registry.
   When the first integration goes live, bump "Last updated" on `privacy.html` and `terms.html` together (check-site wants them equal).
7. Optional: set `CLASS_SALES_TO` if quotes should go elsewhere; decide Class Premium pricing for quotes.

### Needs the owner (code ships behind flags until done)

- Apply `2026-11c-classes-v2.sql` in the Supabase SQL editor after reviewing the PR (after 2026-11b).

- Google Classroom: a Google Cloud project, OAuth consent screen with Classroom scopes, app verification.
- Canvas / Schoology: LTI 1.3 developer keys are made per school; a setup page explains the steps.
- Signing DPAs and listing on the SDPC registry; reminder emails need the Resend domain already used by the site.
