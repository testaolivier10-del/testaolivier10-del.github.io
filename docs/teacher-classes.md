# Teacher classes (status file)

Free classes for teachers: a teacher makes a class for one course (the ten AP® courses, EMT (NREMT), organic
chemistry, A&P), students join with a code, the teacher assigns work and sees where every student struggles.
Research report and owner decisions: the Claude doc "LevlPrep Teacher Interface: Research Report"; approved look: the
"LevlPrep Teacher Mockups" artifact (2026-11-04), built with the real course styles (r3 band, dashboard design F,
path card).

## Status (2026-11-04)

- v1 is live (migration 2026-11b applied 2026-11-04).
- v2 is built and integrated on branch `teach-v2` (one PR, "Teacher classes v2", superseding #137 #139 #140 #141).
  Not merged, SQL 2026-11c/d/e NOT applied, Worker NOT deployed. Everything that needs the Worker or a new flag is
  off until the owner steps at the end of this file.
- Sample class without signing in: `/teach/?demo=1` (AP® Biology) and `/teach/?demo=1&course=nremt`; department
  view `/teach/?demo=1&dept=1`.

## Simplified pages (owner 2026-11-08)

Owner asked to simplify the teacher interface while keeping every feature, approved the mockup ("LevlPrep teacher
pages, simplified", https://claude.ai/artifact/3ojuisZySxXq63uRJpJHk1) and asked for it live. The live pages must look
and work like that mockup.
- Inner pages use the course inner tabs' short band (`sband()` in `teach.js`, `.tm-sb`), content pulled up over it
  (`.tm-body`). Only the signed-out landing keeps the big band (`band()`, `frame(..., true)`).
- Tabs 7 to 5: Class, Assignments, Students, Live, Settings (+ Assign). Gradebook and AP® skills are views of Students
  (`#students/gradebook`, `#students/skills`); old `#grades` and `#skills` links redirect.
- Class home: today list, mastery by unit; rail with Students to check on and Tell the class (posted ones folded).
  "Where the work stands" and the hero Assign/Gradebook buttons are gone (they repeated the Assignments tab and the
  tabs). Join code is a small card in the band.
- One assignment: action row Edit, Remind N students, Send grades, More (Print worksheet, Export CSV, Delete); views
  Students (with the integrity table and free-response scoring under it), Questions, Topics (`#a/<id>/questions`,
  `/topics`). `teach-integrations.js` `place()` moves its cards into slots: `#lvtSlotRemind`, `#lvtSlotGrades` (both
  in drop-down panels; a button shows only when its card is there and not hidden), `#lvtSlotFrq`.
- Questions (assignment and topic pages) fold to one line: stem, % wrong, flags, the wrong answer most picked.
- Assign: the student Practice panel's layout (`practice-panel.css`): kind tiles, the kind's settings, a summary with
  the title and one button. Topics and "your questions" are drop-downs of checkboxes that stay open while picking
  (`B.openMs`). Every earlier setting is kept.
- Student page: mastery and assignments, weakest topics and flags, then one card with accommodations, the family
  progress report (`LevlTeachIntegrations.student(ctx)`, moved here from Settings) and Remove from class.
- Settings: side menu, one section at a time (`#settings`, `/join`, `/class`, `/people`, `/connect` owner only,
  `/school`); `settings(ctx)` takes `part: 'connect' | 'school'`.

## Owner decisions (2026-11-04)

- Teachers free, no verification at launch. Students stay on the free tier with its limits unless the teacher buys
  Class Premium at a discount (checkout not built; the quote form and settings page say to email).
- Pilot AP® Biology; the code works for every course above. v2: "build all of that" (everything competitors have
  or teachers ask for).
- Teacher sees scores, mastery, completion, last active, misses, flags and the answers picked. No streaks, no minutes.
- Teacher entry: footer link and a line on Premium; nothing on the homepage (changed 2026-11-04: a "For teachers" header link and a homepage strip).
- Assignments: practice, review, mastery, exam, free response; required or optional; due dates, late window, chosen
  students. Parents are never emailed; reminders are only sent when the teacher presses Send.

## Files

- Database: `scripts/sql/migrations/2026-11b-classes.sql` (v1), `2026-11c-classes-v2.sql` (A1: co-teachers,
  announcements, mastery, teacher questions, submissions, live mode, departments, copy class),
  `2026-11d-classes-integrations.sql` (C: mail log, report links, Google and LTI links, quotes, FRQ scoring, purge),
  `2026-11e-classes-courses.sql` (B: course check accepts `nremt|ochem|anp`), `2026-11f-classes-google-ids.sql`
  (Google Classroom without Classroom emails: `class_google_matches`, `class_announce_take`,
  `class_ext_links.announced_at`). `schema.sql` carries all five, in that order, word for word apart from comments. Tables are reached only through functions; `teach_*` for teachers,
  `class_*` for students. Codes are 8 characters from pgcrypto; code lookups capped at 30 an hour per account;
  summaries at 120 KB.
- Model: `assets/class/class-model.js`: `COURSES` (flags `ap`, `frq`, `unitExams`, `unitWord`, `need`, `bank`), one
  reader per progress shape (`READ`), `summarize` (progress, mastery, picks, flags, exams, lessons, `done`, `att`),
  `status` (grading rules below), `curriculum`, `href`, bank lookups. NREMT topic map: `assets/class/nremt-map.js`
  (built by `scripts/build-class-maps.mjs`; rerun after an NREMT bank change, `--check` and the test fail otherwise).
- Student side: `assets/class/class-student.js`, lazy loaded by `assets/site-chrome.js` (`CLASS_DIRS`) on class
  course pages for signed-in visitors; pushes the summary (at most once a minute, only on change) and draws "From
  your teacher" on the course home (assignments, newest 5 announcements, live link). Join page: `join.html` +
  `assets/class/join.js` (also "Your classes" and sending FRQ drafts). Answer picks: one line in each course's
  question code writes `<course>_picks_v1`.
- Assignment runner (AP® courses): `assets/class/class-run.js` + `class-run.css`, fetched only when the address has
  `la=<assignment id>`; small hooks (`LA`, `CLS`, `classBoot`) in each AP® course's `practice.js` and `exams.js`.
- Teacher app: `teach/index.html` + `assets/class/teach.js` + `teach.css`. Hash routes: home, work, a/<id>, assign,
  students, s/<id>, grades, settings, topic/<id>, skills (AP® only), live, bank, print/<id>; `?dept=1` department.
  Sample data: `assets/class/teach-demo.js` (18 made-up students mid-term from real question ids, in memory).
- Integrations: `assets/class/teach-integrations.js` (cards on Settings and the assignment page),
  `assets/class/class-frq.js`, `assets/class/report.js`; pages `teach/report.html`, `teach/quote.html`,
  `teach/lms.html`, `teach/lti.html`, `teach/privacy-agreement.html`; Worker `worker/src/class-mail.js`,
  `class-google.js`, `class-lti.js`, `class-frq.js`. Live mode: `live.html` + `assets/class/live.js`.

## Contract between the parts

- `teach.js` loads `teach-integrations.js` and on Settings and each assignment page renders
  `LevlTeachIntegrations.settings(ctx)` / `.assignment(ctx)` (HTML) into its box, then calls `.wire(ctx)`. ctx:
  `{ where, demo, classId, cls, role, box, call, members: [{id, name}], rep, assignment }`; `rep` is the report the
  page already holds (members with summaries), so no second fetch. The integrations also accept ctx without `rep`
  (they then load `teach_class_report` through `ctx.call`). `role: 'co'` hides Google, LMS and grade passback.
- Assignment kinds: `practice`, `review`, `mastery` (`spec = { topics, target: 0.8, min: 10, qn }`; `qn` = questions
  per topic for full mastery, saved by the builder so the student's page and the teacher's agree), `exam`, `frq`.
- Controls (practice, review, mastery, exam; optional) in `spec.controls`: `{ timeLimit: minutes|null, shuffle,
  release: 'now'|'after_due'|'after_submit', questions: [teacher question ids] }`. `class_mine` returns
  `extra_time` per class (multiplier). Controls run only on the ten AP® courses for now; the builder says so for
  NREMT, ochem and A&P, whose students do the work on the course's usual pages.
- Student links (`class-student.js` `href`): every course uses `LevlClassModel.href` (table below). On the AP®
  courses practice, review, mastery and exam links also carry `la=<id>`, and review and mastery go to
  `practice.html?la=<id>`. FRQ links and all NREMT, ochem and A&P links stay plain.
- Attempts on the student's device: `levlprep_class_att_v1 = { <aid>: { start, end, n, c, tabs, answers, graded } }`;
  `summarize` copies it into `summary.att` (40 newest, 60 answers each); `status` prefers it when
  `spec.controls.timeLimit` is set.
- Teacher questions: `class_questions` (teacher-owned, single choice). Students read them with
  `class_questions_for(p_assignment)`; `correct` and `why` only when answers may show (release `now` or missing, the
  student's due date with extra days passed, or submitted with `after_submit`). Picks go in once with
  `class_submit(p_assignment, p_picks)` (table `class_submissions`), which returns the keys when they may show.
- Live mode: `class_live` (one open session per class) and `class_live_answers`; teacher polls `teach_live_state`
  every 2 s, students `class_live_state`; no Realtime.

## Grading rules (`class-model.js` `status`)

- Practice: N answers in the assignment's topics since it opened. Review: questions missed at some point and redone
  since it opened (no answers at all is not done; answers with nothing to redo is done). Mastery: every listed topic
  at `target` with at least `min` answers in them since it opened; `doneAt` is when the target was first reached.
  Exam: a non-partial unit test of that unit, or a full exam. Free response: a score saved since it opened.
- Done after the due date: late inside the late window, missing when late work is not accepted or the window closed.
- The student's browser records when it first saw each assignment done (`levlprep_class_done_v1`), so a later redo
  never makes finished work late. Teacher numbers come from the student's own browser (by design, like the rest of
  the site's progress).

## What v2 adds

Teacher app (A1):
- Assign to several classes at once (same course, whole class). Copy a class (same order, assignments shifted by N
  days, new code, no students; teacher questions it uses are copied into the copier's bank).
- Announcements (5 newest to students). Mastery assignments. Exam controls in the builder; extra time per student
  (1, 1.25, 1.5, 2, 3).
- Teacher question bank (`#bank`), picked into assignments. Printable worksheet or test with versions A/B and an
  answer key (`#print/<id>`; single choice only, graph stimuli left out).
- AP® skill report and predicted score band (`#skills`, AP® only): each unit's mastery weighted by the midpoint of
  its exam weight range over the units reached; under 20% is 1 to 2, under 40% 2 to 3, under 60% 3 to 4, under 80%
  4 to 5, else 5; under 30 answers gives no band. Labelled "Estimate" and "Not a College Board score".
- Integrity: time used against limit times extra time and tab leaves, on the assignment page and in the gradebook.
- Live mode (`#live` projector view; students on `live.html`).
- Co-teachers by code: same rights minus deleting the class or assignments, removing students, archiving, sharing
  with the department and managing co-teachers. Department view (`?dept=1`): counts and averages only, no names.
- Fixed: the join page took 6-character codes while the database makes 8.

Course engines (A2, AP® courses):
- Start card and sticky strip (teacher, title, clock, tab leaves, mastery progress). Practice clock = timeLimit x
  extra_time, runs from the first Start, survives reloads, hands in at zero. Exams: the exam's own clock scaled to the
  limit; no pause in a class exam. Tab leaves counted while timed work runs.
- Held answers grade silently and stay out of `<course>_progress_v1` until release (`levlprep_class_hold_v1`);
  `after_due` shows "See your answers" after the due date. Mastery always gives feedback.
- Shuffle of question order (stimulus sets kept whole) and teacher options. Teacher questions are marked `own` and
  never enter progress, review, mastery or the free allowance.
- A failed load re-enables Start; a free-plan student who used the course's free exam is told so on the start card.

Other courses (B): NREMT, organic chemistry and A&P classes. Readers for `anp_progress_v1` (+ `anp_prefs_v1.examHistory`,
now written by `assets/apps/exams.js`), `nremt_mastery` / `nremt_exam100_*` / `nremt_cat_history` (topics from
the NREMT map: six areas as units, 25 topics, filed by each question's own area), ochem `ochem_items_v1` (new, written
by `diagnostic-engine.js applyResult`, 1500 newest) plus older misses from `ochem_mastery_v1`. Pick hooks in each.
`nremt:progress` fires once per finished session after the exam history is saved; `class-student.js` carries on
without topics if the NREMT map fails to load. No Skills tab, score band or AP® wording; no FRQ tile; NREMT has no
unit exams.

Links (`LevlClassModel.href`, relative to the course home; AP® links add `la=` as above):

| Course | Practice | Review | Exam |
| --- | --- | --- | --- |
| AP® | `practice.html?topic=` | `practice.html?la=` | `exams.html?unit=` / `?mode=full` |
| A&P | `practice.html?topic=` (first topic) | `review.html` | `exams.html?mode=system&chapter=` / `?mode=final` |
| Ochem | `practice.html?topic=&count=` | `practice.html?mode=mistakes` | `exams.html?kind=chapter&chapter=` / `?kind=final` |
| NREMT | `practice.html?system=<area>` (no sub-topic filter; the builder says so) | `review.html?start=review` | `exams.html` (full only) |

Integrations (C), all behind the Worker and flags:

| Item | What it does | Where |
| --- | --- | --- |
| Reminder emails | Teacher ticks missing / not started students and presses Send; Worker checks ownership, looks up addresses (teacher never sees them), plain text through Resend. 1 per student per 20 h, 200 a day per teacher, 60 per request; one-click stop link. | `worker/src/class-mail.js`, `class_mail_take` |
| Family progress report | Printable page (`?c=&s=`) and an expiring share link (1 to 30 days, SHA-256 stored, dies with the membership). No parent emails. | `teach/report.html`, `class_report_get` |
| Google Classroom | `CLASS_GOOGLE` (`"on"` in `wrangler.toml`). Non-sensitive scopes only, no app verification: `openid`, `email`, `classroom.courses.readonly`, `classroom.rosters.readonly`, `classroom.coursework.students`, `classroom.announcements` (no `classroom.profile.emails`, so Classroom gives no addresses). OAuth (refresh token AES-GCM under `CLASS_SECRET`), link a course, roster match by Google account id: a member matches when their Supabase `auth.identities` row (provider `google`) has `provider_id` (or `identity_data->>'sub'`) equal to the Classroom `userId` (`class_google_matches`, service role only; nothing about identities or emails reaches the browser). Matches are stored in `class_ext_members`; unmatched roster students are listed by name with a note that they join with the class code (no matching by name). "Post the join link in Classroom" creates a Classroom announcement (class name, `join.html?c=<code>`, one line of instructions), owner only, once per 10 minutes per class (`class_announce_take`), with a "Copy join link" fallback. No invite emails (the `invite` mail kind and its stop rows are left in the tables, no longer written). Post coursework; grade passback on Send, matched students only. | `worker/src/class-google.js` |
| Canvas / Schoology (LTI 1.3) | `CLASS_LTI`. OIDC login and launch (RS256, single-use nonce), deep linking, AGS score passback, Canvas JSON config, JWKS. Registrations start `pending`; the owner activates each from an emailed 14-day `/lti/activate` link. Not yet tried against a real Canvas or Schoology. | `worker/src/class-lti.js`, `teach/lms.html`, `teach/lti.html` |
| Quote / purchase order | Signed-in form, emailed to `CLASS_SALES_TO` (default hello@), receipt to the account. Polar only invoices paid orders, so POs are answered by email. | `teach/quote.html` |
| Privacy for districts + DPA | Data table, FERPA, COPPA (13+), retention, deletion, subprocessors; fillable DPA in the SDPC NDPA structure, marked unsigned. | `teach/privacy-agreement.html` |
| Teacher FRQ scoring | Student sends a draft from "Your classes"; teacher ticks rubric points and comments. AI first pass only with `FRQ_GRADER` on and a model in `CLASS_FRQ_PASSED_MODELS`, 60 a day per teacher, a suggestion the teacher must save. | `class_frq_*`, `teach_frq_*`, `worker/src/class-frq.js` |

The mail log, expired report links and used launch nonces are cleared hourly (`class_purge`, from the Worker cron).
Co-teachers may send reminders, make report links and score free responses; Google, LTI and grade passback stay with
the owner.

## Checks (integration of `teach-v2`, 2026-11-04)

- `node --test scripts/test/*.test.mjs` with `PGLITE` set: 2101 pass, 0 fail, 0 skipped (includes
  `class-model`, `class-run`, `classes-v2-sql` on PGlite, `worker-classes`, `sql-migration`).
- PGlite: `scripts/test/pglite/classes-integrations.mjs` 70 pass. From scratch, 11b -> 11c -> 11d -> 11e applies and
  re-applies cleanly, and `schema.sql` alone applies cleanly; both give the same 53 class functions (same bodies) and
  22 tables (same columns); a class can be made for apbio, nremt, ochem and anp and a bad course is refused.
- `build-class-maps`, `build-apcalc`, `build-apcalcbc` and every other `--check` in `scripts/ci-local.sh` (worker
  build, sitemap, weight, pricing) pass; `check-site` passes. Fixed here: the Premium FAQ line for the new courses was
  edited in `premium.html` only, now in `scripts/build-pricing.mjs`.
- Playwright (Chrome): `scripts/class-browser/run.py` 270 pass (all ten AP® courses), `held-resume-start.py` 39
  pass, `submit-card.py` 6 pass. Every teacher view, every assignment page and print view of `?demo=1`,
  `?demo=1&course=nremt` and `?demo=1&dept=1` at 1280 and 390 px: no page errors, no horizontal scroll, integration
  cards drawn on every assignment page. Student card on AP® Bio and Chem homes: `la=` links; on NREMT, ochem and
  A&P homes: plain links equal to `LevlClassModel.href`.
- Earlier per-stream reviews (no XSS or ownership holes; fixes in) are in the git history of the four branches.
- Classroom without emails (branch `classroom-no-emails`, 2026-11-04): `worker-classes` covers the exact scope list,
  matching by Google id (`provider_id` and `sub`; a same-named student is not matched), no email lookup, the
  announcement text and its 10-minute limit (given back when Google refuses), owner only; `sql-migration` checks 11f
  against `schema.sql` and its service-role grants. PGlite: `classes-integrations.mjs` 82 pass (11f grants, matches,
  announce limit); 11b -> 11f applies twice cleanly and `schema.sql` alone gives the same two functions and
  `class_ext_links` columns.

## Gaps (said in the UI or left out)

- Controls (time limits, shuffle, held answers, teacher questions) only on the AP® courses; FRQ assignments take no
  controls; teacher questions are single choice only, and in a full exam with calculator parts they sit in the
  no-calculator part.
- Print: no graph stimuli or non single-choice items.
- NREMT practice links drill a whole area; ochem has per-question history only from this change on; NREMT and ochem
  picks, `ochem_items_v1` and the NREMT map are per device; no skills report or score band outside AP®.
- Class Premium checkout. LTI not yet tried on a real Canvas or Schoology.
- Google Classroom matches only students who signed in to LevlPrep with Google (the account in the roster); a
  student who signed in with an emailed code shows as not matched and gets no Classroom grade. Not yet tried against
  a real Classroom course.

## Owner steps, in order

Done 2026-11-04: steps 1 and 2 (PR #142 merged, Worker deployed, 11c/11d/11e applied and checked: 53 functions,
24 tables, all RLS on, nothing granted to the browser on tables); step 3 Google part (project `levlprep-classroom`
under testaolivier10@gmail.com, Classroom API on, consent screen in Testing with the six scopes and the owner as test
user, Web client "LevlPrep Classroom", secrets `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `CLASS_SECRET` set,
`CLASS_GOOGLE = "owner"` in wrangler.toml). Left: try Connect Google Classroom, Search Console + Google verification,
LTI (step 4), DPA/SDPC (step 5).

1. Review and merge the PR "Teacher classes v2" into main. Merging also deploys the Worker (step 6); with no new
   secrets or flags set, every new Worker feature stays off, so this is safe. Do step 2 the same day: until then
   v2 teacher pages call functions that do not exist yet (they show errors, nothing breaks for students).
2. Supabase SQL editor, in this order: `scripts/sql/migrations/2026-11c-classes-v2.sql`, then
   `2026-11d-classes-integrations.sql`, then `2026-11e-classes-courses.sql`, then `2026-11f-classes-google-ids.sql`
   (2026-11b is already applied). Each is
   idempotent; rerunning is safe.
3. Worker secrets and flags (Cloudflare dashboard, Worker, Settings, Variables; or `wrangler secret put`):
   - `CLASS_SECRET` = `openssl rand -base64 48`. Reminders, report links and stop links need it plus the existing
     `RESEND_API_KEY` / `REMINDER_FROM`.
   - Google Classroom: signed in as testaolivier10@gmail.com, Google Cloud project `levlprep-classroom`; Google
     Classroom API enabled; OAuth consent screen (External) with exactly the scopes in `GC_SCOPES`: openid, email,
     classroom.courses.readonly, classroom.rosters.readonly, classroom.coursework.students,
     classroom.announcements (all non-sensitive, so no Google verification; done 2026-11-04). A Web OAuth client
     with redirect URI `https://api.levlprep.com/class/google/callback`. Secrets `GOOGLE_CLIENT_ID`,
     `GOOGLE_CLIENT_SECRET`. `CLASS_GOOGLE = "on"` is in `wrangler.toml`; it stays off until the secrets and
     `CLASS_SECRET` are set. Run `2026-11f-classes-google-ids.sql` (step 2) before teachers check a roster.
   - Optional: `CLASS_SALES_TO` if quotes should go somewhere other than hello@levlprep.com.
   - The AI first pass on FRQ scoring needs nothing extra: it follows `FRQ_GRADER` and the eval results.
4. LTI (Canvas / Schoology): `node scripts/lti-keygen.mjs` -> secret `LTI_PRIVATE_KEY`; `CLASS_LTI = "owner"`;
   try it on a Canvas where you can add a developer key (a school test instance or an Instructure sandbox); activate
   each school's registration from the emailed `/lti/activate` link after checking it with the school; then `"on"`.
5. DPA and SDPC: read and approve `teach/privacy-agreement.html` and the district privacy text; sign each school's
   DPA; list LevlPrep on the SDPC registry. When the first integration goes live, bump "Last updated" on
   `privacy.html` and `terms.html` together (check-site wants them equal). Decide Class Premium pricing for quotes.
6. Deploy the Worker: the merge in step 1 runs `.github/workflows/deploy-worker.yml`; check it succeeded in Actions
   (or run it by hand there) after the secrets in steps 3 and 4 are in. Flag changes in the dashboard take effect
   without a redeploy.
