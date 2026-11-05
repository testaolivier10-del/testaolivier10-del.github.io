# Guided study path (status file)

Approved 2026-11-03: Olivier went through the clickable prototype on the real AP® Biology page
(https://claude.ai/artifact/RUMefAKiLoKZ2qG2VX7fdQ) and said "build it", for every course at once.
Decisions behind it are in the Project doc `levlprep-guided-path.md` and below.

## What it is
A personal path through a course, built from three quick questions, that only uses what the course already has
(notes, lessons, practice, review, exams). It is there to follow, never a lock: every unit stays open, and jumping
around never undoes anything.

## The three ways to study (first question)
1. **On my own.** The course order, a solid line. Start from the beginning or tick what you already know.
2. **Alongside a class.** The student says what the class is on. The path is: covered (done), the missing
   prerequisites, the class topic, a review, then faded stops marked "if your class follows the usual order".
3. **Cramming.** A class test (pick topics and a date) or the whole exam (weakest first). Ends on the date, then asks
   what is next.
Skipping the questions gives "on my own" from the beginning. Changing mode keeps everything.

**Class mode is off for now (owner, 2026-11-04):** it comes back once teacher classes exist. The setup offers only
"On my own" and "Cramming"; a saved class path loads as "on my own" (what it marked covered still counts as done).
The class code in path.js (anchor, prerequisites, picker, check-in) is kept, unused, for that return.

## Redesign (owner, 2026-11-04; design canvas https://claude.ai/artifact/1nEhGFgYb2XEX2bF3wCdd9)
- **Path page, one view** (no "this stretch / whole course" toggle). Left: title, a one-line meta with Change, the
  selected stop's card (Start, Already know it?, Mark done) and the course map: every unit with its topics as small
  numbered squares (S for a skill, a star for the unit test). Tapping a square scrolls the path to it and selects it.
  Sticky on desktop, stacked above the path on phones. Right: the whole course drawn as one winding path, a section
  per course unit: its topics in order (skills woven in), a practice set every 4 topics, a review, the unit test,
  and a full practice exam at the very end. Finished part solid in the course color, the rest gray dashes.
- A practice, review or test stop is done once marked, or once any later topic is done. The current stop is the
  first one not done. Stop keys: a topic's id, else `x:p<unit>-<n>`, `x:r<unit>`, `x:t<unit>`, `x:exam`.
- Cramming draws its own stops on the same path, as one section.
- **Home card:** before a path exists, "Create your personalized path" (the three questions as chips, Create my
  path, Open full path). After: "Up next" with Continue and Open full path over a small path of the last two stops
  done, the current one and the next three. No "you are here" label: the current stop is the large yellow one.
- Without a path, the Path page still draws the course-order path, with a "Create my path" card on top.

## Rules (so no student gets stuck)
- The class is the boss: the path never claims to know the teacher's next topic.
- One tap to re-center ("My class is on…", or any topic in the whole course view). Progress belongs to topics, not to
  places on the path, so re-centering costs nothing.
- The path asks instead of assuming: after the class topic is done, after a few days away, when the student opens a
  topic that is not on the path.
- Covered is not known: a "3 question check" can skip a stop; misses come back through Review as always.
- No dead ends: a Premium lesson stop shows that the notes and practice finish it for free ("Mark this stop done").
- No guilt: a missed day changes the pace line only.
- Wording follows the mode ("your class" only in class mode).

## Files
- `scripts/build-paths.mjs` writes `assets/path/<course>.json` for all 12 courses (`--check` in CI): units, topics in
  course order with their pages, free flags, prerequisites and search words. Sources, never copied by hand:
  - AP® courses: `<dir>/assets/<pfx>-curriculum.js` (order, free) and `docs/<ap>-dependency-map.json` (concepts).
  - A&P: `anatomy-physiology/assets/anp-curriculum.js`, `docs/anp-dependency-map.json`, free chapters from premium.js.
  - Ochem: `ochem/assets/curriculum.js` (topic `dependsOn`), free modules from premium.js.
  - NREMT: `nremt/assets/study-notes.json` chapters (no prerequisite map yet, so no "before this" stops).
- Prerequisites are derived, not written: topic B is a prerequisite of A when a concept taught in A depends on a
  concept taught in B, B comes earlier in the course, and B is not already implied by another prerequisite of A
  (transitive reduction). At most 3 per topic, with the concept that links them as the reason.
- `scripts/build-path-pages.mjs` writes `<dir>/path.html` for every course from that course's `review.html` shell.
- `assets/course/path.js` (`window.LevlPath`) and `assets/course/path.css`: the setup, the Path page (this stretch and
  whole course), the course home card, the end-of-page card on lessons and notes, and a small card at the end of each
  topic in the textbook (`renderBook`, `.lp-secend`: Mark done while it is to do, Done and Continue once done; NREMT
  after a chapter's last section). Loaded lazily by `assets/site-chrome.js` (`mountPath`) on the Path page and course
  home, and on lessons, notes, `learn.html` and NREMT `study-notes.html` once a path exists, so no page needs a new tag.
- Read vs Interactive (consistency audit 2026-11, section A): `assets/course/read-toggle.js` puts the switch on the
  textbook, every notes page and every lesson, and the "← Previous topic" / "Next topic →" strip (`.rt-end`) at the
  end of each textbook topic; the path card goes in that strip. A student who chose Read
  (`levl_book_mode_<dir>.mode === 'read'`) is sent by the path to `learn.html#<topic>` (NREMT
  `study-notes.html#chapter-N`). A locked lesson is never remembered or opened on its own: the book scripts mark it
  `data-lesson-premium` from the course's own lock rule, and the textbook pages load premium.js for that.
- Shared labels: "Mark done" / "Done" (path cards, ochem's textbook toggle), "← Previous topic" / "Next topic →"
  (notes pages and textbook), "Next lesson →" (end of a lesson; ochem and NREMT lessons gained it).
- Mark done on the path fires `levl:pathchange`; the textbook rails (`*-toc.js`, ochem `textbook.js`) tick a topic
  done when the course or the path has it done, so done looks the same in every view.
- `assets/site-chrome.js`: the Path tab after Home in every course's tabs and the phone bar.
- State: `<storagePrefix>path_v1` per course (`{ v:1, mode, anchor, covered:{}, done:{}, cram, seen }`). On this
  device only, like the exam date (`<course>_exam_date`, which the path reads and writes). Lessons and answers come
  from each course's own progress, which syncs as before, so what a student finishes shows on every device.

## Stretches
A stretch (now: one section of the path) is one course unit in course order. AP® skills units are spread through the year, so their topics belong to
the course unit they sit in (`courseUnits()` and `stretchOf()` in path.js); before 2026-11-04 the path showed a whole
skills unit as the stretch (owner report: AP® Bio started on every stats skill after 1.1).

## Done means
A topic stop is done when the course records its lesson as finished (AP® and A&P `lessons`, ochem
`ochem_progress[id].completed` or `ochem_textbook_read`, NREMT `nremt_lessons_v1`: any lesson of that chapter;
`courseDone()` covers NREMT since 2026-11-04), or the student marked it done (passed the check, "I already know
this", or "Mark done" on a path card, in a lesson, notes page or the textbook). Practice answers do not move the path
(the Path page says so in its note line). The textbook rails show the same done set.

## Checks
- CI: `build-paths.mjs --check` and `build-path-pages.mjs --check` (checks.yml and scripts/ci-local.sh).
- The shared `/assets` budget went 341 -> 341.5 for the tab and loader in site-chrome.js (scripts/check-weight.mjs).
- Clicked through on every course (2026-11-03): Path page, setup in each mode, whole course view, home card, a
  notes page's end card, mark done, cramming with searched topics, the check-in after 5 days away, phone width
  (390px, no sideways scroll) and dark mode.

## Open
- NREMT has no prerequisite map; its class mode re-centers but adds no "before this" stops.
- Ochem has no per-topic accuracy, so cramming orders its topics by course order.
- The prototype's Learn tab merge into the whole-course view is left for later (owner to decide).
