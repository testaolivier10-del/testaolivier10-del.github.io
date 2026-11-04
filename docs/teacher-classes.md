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
  summaries at 120 KB. **Owner step: run the migration in the Supabase SQL editor.** Until then the pages say
  classes are not open.
- Model: `assets/class/class-model.js` (summary of a student's course progress, mastery, assignment status, item
  stats). Tests: `scripts/test/class-model.test.mjs`.
- Student side: `assets/class/class-student.js`, lazy loaded by `assets/site-chrome.js` on AP® course pages for
  signed-in visitors; pushes the summary (at most once a minute, only on change) and draws "From your teacher" on
  the course home. Join page: `join.html` + `assets/class/join.js`. Answer picks: one line in each
  `*-questions.js` writes `<course>_picks_v1` (this device; read into the summary).
- Teacher app: `teach/index.html` + `assets/class/teach.js` + `assets/class/teach.css` (hash routes: home, work,
  a/<id>, assign, students, s/<id>, grades, settings, topic/<id>).

## Not in v1 (said honestly in the UI or left out)

- Time limits, answer reveal timing and shuffle per assignment (need changes in each course's practice engine).
- Reminder emails to students; teachers copy names instead.
- Class Premium checkout; Google Classroom import; LTI; co-teachers.
- NREMT, ochem and A&P classes (different progress stores).

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
