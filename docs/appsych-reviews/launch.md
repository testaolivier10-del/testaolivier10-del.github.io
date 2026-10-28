# AP® Psychology launch: running log

A restart picks up from the last line. Steps: (1) continuity pass, psychology vs environmental science, every
shared page type, 390 and 1440, light and dark, Playwright Chromium; (2) full CI with browser checks plus every
course's checks; (3) spec, CLAUDE.md, owner checklist.

## Done before the restart (commits 8ba5dfa8, 082ef38d, 0e7a8be3)

- Published, ten courses wording, sources, changelog, `sw.js` v94, Premium not on sale.
- Tool Studio (shared): sticky row unpins on a phone, Skip to content hidden until focus, 44 px controls,
  `hintSlot` and crumb hide.
- Cover tagline no longer repeats the headline; environmental science search placeholder; notes rebuilt.

## Step 1: continuity pass

- 16 lesson and notes `<title>`s were cut with an ellipsis (environmental science has none): short names in
  `psychology/data/descriptions.json` `titles`, as env decision 12.
- Home "free response questions on the exam" tile was cut in its 92 px phone column on every course home
  (shared `r3.css`): number above words at a smaller size.
- Make it specific on a phone: the coach ring around a tall answer box spilled over the dock below the stage;
  the ring is now clipped to the stage (shared `tool-studio.js` hint).
- Teachers page said the AP® trademark line twice (body and footer) in all seven AP® courses: body line keeps
  only "Questions are original..." (seven build scripts).
- FRQ page: the cite hint always said "Source 2" (now "by its number: (Source 1) or According to Source 3");
  "Also accept" lists joined full sentences as ".;" (trailing period dropped); five AAQs had no live hint at
  all: part F now has the shared "Link it" (`mechanism`) rule, as the research-methods and correlation AAQs.
- Checked, same in both courses, no change: lesson Read | Interactive toggle and Skills eyebrow, help line on
  5.3-5.5 and 3.6 (not 5.1), justify topic pill ellipsis (one line by design), cram and teachers wrapped links,
  neuron diagram parts. No console errors on the swept pages (home, learn, unit, glossary, flashcards,
  practice, review, exams, frq, justify, tools, dashboard, cram, search, teachers, unit test, statistics page,
  a lesson, notes, two FRQs, two tools, a unit sheet) at 390/1440 light/dark.
- Practice said "Every mathematical practice" and "All four types" (forked from statistics): psychology and
  environmental science now say "science practice" (selector, results table, search blurbs, core comments)
  and "Both types (AAQ and EBQ)" / "All three types".
- Phone header with a level badge cut the course name ("Psychol…", "Env Scie…") on every course: under 430 px
  with a badge showing, the wordmark gives way as it already did under 360 px (shared `theme.css`).
- Review, empty queue: "due now" ran together ("duenow") under the big 0 in every course (shared
  `r3-study.css`); Flashcards was offered twice (button and link card) in all seven AP® review pages: button
  removed.
- Course search (every course, shared `hub.js` + `site-search.js`): result titles were cut at the first match
  ("… Memory" for "Introduction to Memory"): titles are now marked in full (`highlight` option `whole`).
- Checked, same in both courses, no change: dashboard design F (flagged count there by design,
  polish 2026-10-17 D1), exams timed Section I with the no-calculator note, flashcards deck panel, tools list
  (1440 dark), FRQ rubric hints.
- Exam results: "No AP® score is estimated: May 2027 is the first exam in this format" was wrong for psychology
  (the format was first examined in May 2025): now says a practice form is not the real exam and the raw-to-1-5
  conversion is unpublished. The save prompt said "74 missed questions queued" while the page said 54 (it
  counted exam-only questions, which never enter the queue): six AP® courses now count queued misses only.
- MathML text lost its edge spaces in Chromium ("68% within1SD, 95% within2" on the statistics page, and any
  `\text{ ... }` with spaces on any course): `mtext{white-space:pre}` in shared `theme.css`.
- Checked, no change: tool full screen (stats lab, 390 and 1440 dark; the "turn your phone sideways" toast is
  shared and leaves after 3 s), unit test page, exam results breakdowns.
- Checked, no change: unit page (contents list scrolls to the current unit, same in both), learn (Read |
  Interactive on the textbook), glossary 1440 dark.

**Step 1 done.** Next: step 2, full CI.

## Step 2: CI
- `BROWSER=1` CI: check-a11y passes (91 page shapes, no serious or critical). check-console failed twice on the
  environmental-science practice flow: the shuffled set sometimes opens on a "Make it specific" item (selects
  only), which the flow never answered, so no verdict came. The flow now picks an option in every blank, and the
  same flow runs for psychology (it had none).
- `BROWSER=1 scripts/ci-local.sh`: **ALL PASS** (every course's map, build, content and generator checks, all
  tests, check-a11y, check-console over 2270 pages and the flows) after commit 269ff6f0.

**Step 2 done.** Step 3 (spec decision 13, section 9 owner checklist and teacher list, CLAUDE.md) committed in
328c5df5. Launch phase complete; PR not opened (owner's call).

## After the merge of main (#116)

- Merged main (tools audit): `tool-studio.js` takes main's phone layout (the launch's `paintPins` and `.ls-unpin`
  removed; a leftover call threw on every tool until e4c7eca9), `sw.js` v95, home question count regenerated.
- `BROWSER=1 scripts/ci-local.sh` after the merge: **ALL PASS** (commit e4c7eca9).
