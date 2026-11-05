# Design rules (living rulebook)

Read this before any design or page work on LevlPrep, the same way the video pipeline reads its style guide.
Every comment the owner and Claude agree on becomes a rule here, in the same commit as the change it led to.
A rule that turns out badly gets changed or removed, with a line in the log saying why.

Status words: **Agreed** (owner confirmed), **Proposed** (from research, waiting for the owner's comments),
**Retired** (tried, dropped; kept in the log only).

Background: the research report `docs/design-research-2026-11.md` (what the best study sites do, with sources)
and its 14 ranked decisions. Mockup of those decisions: https://claude.ai/artifact/T5YGJSHPjrnsW9EcECLZ54.
Earlier look and covers: `docs/site-redesign.md`.
Every feature the site has today and its new home: `docs/site-feature-inventory.md` (map page:
https://claude.ai/artifact/GbY4t4nHczLZ8JdYkerpZx). Check every options page against it.

## Build order
One piece at a time, biggest decisions first; each step shows every reasonable option inside a real page, with an
honest take and a pick; the owner chooses and the choice is recorded here before the next step.
1 Course sections (done) · 2 Navigation (done) · 3 Header (done) · 4 Titles and banners (done) · 5 Type and color (done) ·
6 Cards, lists and tags (done) · 7 Course home (done) · 8 Learn (done) · 9 Practice (done) · 10 Question screen (done) · 11 Exams (done) · 12 Progress (done) ·
13 Menus and site wide extras · 14 Homepage · 15 Teacher side. (Reordered 2026-11-05 so each section of the course
gets its own step, built from `docs/site-feature-inventory.md`.)

## How we work
- Agreed: Claude does not just do what the owner says. Each idea gets weighed honestly: say if it is good, what it
  costs, and what the evidence says; say when something is only taste. The owner decides.
- Agreed: show designs as real pages that can be commented on element by element (like the teacher mockups),
  never as a screenshot gallery or a home made pin system.
- Before showing anything, Claude checks it at 390 px and 1280 px and in dark mode, against the checklist below;
  for big rounds a separate reviewer who has not seen the reasoning critiques it.
- Prefer building in the real code once a direction is agreed, so what the owner sees is what ships.

## Look
- Agreed: keep the site's own style: Inter Display two tone headlines, Nunito body, gold primary buttons, navy
  buttons, white rounded cards on the faint grid paper, course colours from `[data-cover]`.
- Agreed (step 4): the course home keeps the banner (course color, drawing, handwritten line) at about half today's
  height, so the next step shows on the first screen, phone included.
- Agreed (step 4): every other page inside a course (Learn, Practice, Exams, Progress) gets a one line white title
  row with a breadcrumb and at most one small action; no banner, no drawing, no handwritten line.
- Agreed (step 4): during a practice or exam session there is no banner and no header: only End, a progress bar and
  the question count.
- Agreed (step 5): headlines stay Inter Display 900. Two colors (the green word) only in page titles; section
  headings are one color.
- Agreed (step 5): notes text is Nunito at weight 500, 18 px on computers and 17 px on phones, about 65 letters per
  line (max width about 36em), line height about 1.65. fonts.css must declare Nunito from 400, not 600, or weight
  500 silently shows as 600 (that is what happens today).
- Agreed (step 5): the handwritten Kalam font appears only on the homepage and in course banners (one line each);
  never in notes, questions, explanations, Progress or other pages.
- Agreed (step 5): no code style font (IBM Plex Mono). Numbers, scores and labels use Nunito with even width digits
  (`font-variant-numeric: tabular-nums`); its font files can be dropped.
- Agreed (step 5): course banners keep their dark course color in dark mode; only text and accents lighten.
- Reopened (step 6 restart; was agreed): cards keep today's look: white, 1 px border, soft shadow, 20 px corners (owner's taste over
  Claude's border only pick). No cards inside cards.

## Words
- Agreed: show less at once. Do not explain things people already understand (a button that emails students needs
  no sentence telling them so).
- Agreed: no numbered section headings ("1 What needs you today"). Short headings that carry the meaning.
- Agreed: if a heading needs a sentence under it to make sense, rewrite the heading instead.
- No em dashes or hyphens used as punctuation in any copy.

## Layout and navigation
- Agreed (step 2): on computers the 5 sections sit inside the header row, next to the logo and course name (one
  row, no separate tab bar); below about 1,100 px wide it may fall back to two rows.
- Agreed (step 3): header right side inside a course is search, streak and the account picture only. Answer
  sounds, dark mode and For teachers live in the account menu; For teachers stays visible in the header on the
  homepage and pages outside a course.
- Agreed (step 3): the course name next to the logo ("AP® Biology ▾") opens a course switcher: your courses with
  progress, then "All 13 courses".
- Agreed (step 3): the level is not in the header. It shows as a "+10 XP" pop up right after a correct answer and as
  a full level bar on Progress.
- Agreed (step 3): phone header is the logo mark, the course name with the switcher, search and the account picture.
- Agreed (step 2): on phones the 5 sections sit in a bottom bar with icons and labels, all always visible.
- Reopened (step 6 restart; was agreed): Learn lists the 8 units as rows that open in place; the current unit starts open. Glossary and
  Tools sit as links under the list.
- Reopened (step 6 restart; was agreed): a topic row is number, name and one status circle (done, started, new), plus a small "Premium
  lesson" tag where it applies. The whole row opens the topic; no buttons, times or bars on rows.
- Reopened (step 6 restart; was agreed in 6b, F1): a topic row opens the topic's free notes; an "Interactive lesson" button (Premium tag where
  it applies) is the first thing on the notes page.
- Reopened (step 6 restart; was agreed in 6b, F3): logged out, the header has Log in plus a menu button with the same menu as logged in (Log in,
  Make a free account, answer sounds, dark mode, For teachers). On phones Log in lives inside that menu.
- Reopened (step 6 restart; was agreed in 6b, F5): Copy link, Google Classroom, Print and Print with answer key sit behind one "Share" button,
  which counts as the page's one small action.
- Agreed (step 6): cards keep today's look: white, 1 px border, soft shadow, 20 px corners (owner's taste, chosen twice).
- Agreed (step 6): one row style for every list (topics, tools, FRQs, decks, sets): the name, plus one short muted
  second line only when it helps choose (read time, what a tool does, the FRQ's unit). The whole row is one tap target.
- Agreed (step 6): status is one circle (filled done, half started, empty new). Only fully locked items get a quiet
  outlined "Premium" tag with a lock; free items get no tag; gold is never used for tags. Topic rows get no tag,
  because every topic's notes are free.
- Agreed (step 6): an empty section shows one line saying what is true and one button for what to do next
  ("Nothing to review yet" + Start practice); no pictures or explaining sentences, and sections never hide.
- Agreed (step 7): a new visitor's course home is the half banner, then "Make your path" (3 quick questions: how
  you study, what you know, exam date) as the main action, then the 8 units and 2 skills tracks with exam weight.
- Agreed (step 7): a returning student's course home is the half banner, then Next on your path (Continue), a strip
  of the nearby path steps with "See full path", then Review due and today's goal with the streak.
- Agreed (step 7): the full path (today's Path tab, now opened from Home) keeps today's winding path of circles
  (Read, Skill, Practice set, Review, Unit test), with the Up next card (Start, Already know it?, Mark done) on top.
- Agreed (step 7): every course home ends with Free vs Premium and the common questions, for everyone.
- Agreed (step 7): videos and the tools showcase move to Learn; exam facts move to Exams.
- Agreed (step 8): Learn has four parts, Units, Glossary, Tools and Videos, as small pill tabs. On computers Learn is
  a contents sidebar (search the notes, units with progress, the open unit's topics, "On this page", Unit sheet) with
  the notes beside it, like today. On phones Learn opens the list: units open in place, 2 skills tracks after the 8
  units, and Unit sheet and Read the whole unit under the open unit's topics. Practice this unit and Unit test live
  in Practice and Exams only.
- Agreed (step 8): a topic page has the title row (meta line "12 min read · Practiced", Share icon, Practice 5),
  then a Read / Interactive lesson switch (a Premium lesson shows its lock there), then the quick answer, then the
  video as a slim row (thumbnail, title, length; the player opens when tapped), then the notes.
- Agreed (step 8): the Tools page keeps cards with each tool's drawing; the one exception to the list rows rule.
- Agreed (step 8): kept as today, restyled: glossary (search, unit filter, A to Z, pop ups in notes), notes content
  (figures, worked examples, common mistakes, Report a problem), inside a tool, formula sheets with Tools.
- Agreed (step 9): Practice has five pill tabs like Learn: Questions, Review, Flashcards, Free response,
  Justification. Share (Copy link, Classroom, Print as a worksheet, Print with answer key) is the title row action.
- Agreed (step 9): Questions keeps today's form with everything showing: Choose how (Build a set, My weakest topics,
  Questions I missed), Choose the questions (Unit, Topic, Science practice, Question type, Difficulty), 5, 10, 20 or
  All, then Start practice and the "11 of 15 free questions left today" line.
- Agreed (step 9): Review shows the due count with one Review button, then rows for Flagged questions and Retry my
  misses.
- Agreed (step 9): Flashcards is the Deck menu (each deck shows its progress, e.g. "Unit 1 · 0 of 249"), the three
  card types and Study 20 cards; no unit tiles (owner: they repeat the menu).
- Agreed (step 9): Free response is grouped under the six AP® types with their points, filtered by type and unit;
  Units 1 and 2 are free, later questions carry the quiet Premium tag.
- Agreed (step 10): one question per screen, full width answer rows (letter, then the full choice), Check pinned at
  the bottom of the screen (on computers centred under the question, max 720 px wide). Top strip: End, progress bar,
  "4 of 10", Flag.
- Agreed (step 10): stimulus sets: on computers the data sits beside the questions and stays in view; on phones a
  pinned "Show data" bar opens the data over the question.
- Agreed (step 10): after Check the right choice turns green with a tick, a wrong pick red with a cross, the rest
  fade; one explanation card underneath ("Not quite. The answer is A." plus the why), with "Why not the others?"
  folded and Report a problem; Next question replaces Check. A right answer gets the +10 XP pop up.
- Agreed (step 10): the end of a session shows the score, XP and how many to review, then one Next card chosen by
  the site (e.g. Review the 3 you missed) and small links Practice again and Share result.
- Agreed (step 10): kept: Flag on every question, answer sounds, screen reader announcements, number boxes for
  numeric questions, other course suggestions on the end screen.
- Agreed (step 11): the Exams page has the exam facts in one line on top (Section I, Section II, exam day), then one
  card with three choices (Practice exam, Unit test, Mixed timed set, each with one short line), Timing (standard,
  1.5 times, double, untimed) and one Start; then rows for the Cram plan and, where a course has one, the score
  calculator.
- Agreed (step 11): during an exam: a top strip with the section, the timer (with Hide), a question map button
  ("14 of 60", opens a grid showing answered and flagged) and Flag; Back and Next at the bottom; the flagged list
  before you submit.
- Agreed (step 11): exam results show the estimated 1 to 5 score (labelled not calibrated), Section I, Section II and
  composite, one Next card for the unit that cost the most, unit bars, then every question (Missed first; All and
  Flagged one tap away) with your answer and the right one, opening the explanation view; Section II rows show
  rubric points (owner's idea).
- Agreed (step 11): the cram plan is its own page under Exams (3 or 2 weeks back from the exam date, a tick per day,
  Print in Share), linked from Progress under "Will I be ready".
- Agreed (step 12): Progress keeps design F (`docs/dashboard.md`, owner 2026-10-26): the five questions in order,
  every detail folded under the one it answers, the level bar first. Changed to fit steps 4 and 5: a title row
  instead of the banner, plain headings with no numbers or handwriting, no handwritten notes in the chart.
- Agreed (step 12): "Am I getting better?" stays one line of weekly accuracy with each exam on it; "Where am I
  losing points?" stays units ranked by exam weight not yet Strong, with Science practices as the second view.
- Agreed (step 13): one account menu, in groups: name, Account, Premium; Invite friends, Join a class; Answer sounds,
  Dark mode, Study reminders; For teachers, Log out. Logged out, the header shows Log in plus a menu button with
  Log in, Make a free account, Answer sounds, Dark mode, Join a class, For teachers (on phones Log in is only in
  the menu). This settles the reopened F3.
- Agreed (step 13): the study assistant stays a corner button on every page, above the bottom bar on phones, hidden
  during timed exams. This settles the reopened F6.
- Agreed (step 13): search opens over the current page with results as you type, grouped (Notes, Tools, Glossary,
  Free response), and an "All courses" switch.
- Agreed (step 13): tapping something locked opens a small sheet: what is locked, what one pass gives, the price,
  Unlock, Compare Free and Premium, Keep reading the free notes. No full page paywall, no lock cards on the page.
- Agreed: every design question is shown as pictures of each option before the owner chooses, never as words only.
- Agreed: the layout must be intuitive and easy to scan; split long pages (tabs, collapsed "More" menus,
  "More options" in forms) rather than stacking every section.
- Agreed (step 1): every course has 5 sections: Home, Learn, Practice, Exams, Progress. Path lives in Home;
  Review and Flashcards in Practice; Glossary and Tools in Learn. The progress page is called "Progress" (not
  Dashboard or Stats); the reading section is called "Learn" (notes, lessons and videos).
- Agreed (step 5): the main button is gold, and there is one per screen (the "do this next" action); other
  buttons are outlined.
- Proposed: teacher class view with 4 tabs (Class, Assignments, Students, Settings) plus "+ Assign".

## Checklist before showing a page
1. 390 px, about 700 px (the claude.ai side panel) and 1280 px: nothing scrolls sideways, nothing hidden under
   sticky bars, main action on the first screen. Option pages draw computer examples at a fixed 1100 px and scale
   them down, so a narrow window never hides parts of an option.
2. Dark mode readable; text contrast at least 4.5:1; buttons and tap targets at least 44 px.
3. Every button and link goes somewhere or is clearly a mockup; no invisible or unstyled buttons.
4. Real length text and numbers that agree with each other on the page.
5. One primary button; no sentence that only explains the obvious; no numbered headings.
6. Compare against the rules above and list any rule the page breaks, with the reason.
7. Every feature the page has today is still reachable in every option; say where it went.

## Log
- 2026-11-04: owner feedback on the teacher side: too much on screen, too many explaining words, layout should be
  more intuitive; keep the website's style. Turned into the Agreed rules above.
- 2026-11-04: owner asked for honest pushback instead of a yes man, and for agreed comments to be recorded here and
  reused on every page.
- 2026-11-04: research report and 8 page mockup made; its decisions are Proposed until the owner's comments.
- 2026-11-04: Claude noted it should have pushed back on removing the "try one question" block (research favours a
  real question within one or two taps of arriving). Open for the owner's decision.
- 2026-11-04: step 1 decided: 5 sections (option B), names "Progress" and "Learn". Options page:
  https://claude.ai/artifact/S888mTSAEAMQDzQ3pLFjN3
- 2026-11-04: step 2 phone decided: bottom bar (P1). Owner could not see the tabs in computer option B because the
  options page hid them below 860 px wide; fixed by drawing computer examples at fixed width, and added to the checklist.
- 2026-11-04: step 2 computer decided: one row (B). Options page: https://claude.ai/artifact/Jus9RRrdCwQbgpsK7RcczB
- 2026-11-04: step 3 decided: H2 essentials, course switcher, level as pop up plus Progress (L2), phone PH1.
  Options page: https://claude.ai/artifact/GACSjGjVKyMCn3yePoQgsC
- 2026-11-04: step 4 decided: half height course home banner, one line title row inside courses, nothing but
  progress during sessions. Options page: https://claude.ai/artifact/Ndt5wNS924QjuA6nGktTDN
- 2026-11-04: step 5 decided: Inter Display with two colors on titles only (A), notes 18 px medium at 65 letters (N2),
  gold main button (G), handwriting only on banners (H1), numbers in Nunito (M2). Found that notes ask for weight 500
  but show 600 because fonts.css starts Nunito at 600. Options page: https://claude.ai/artifact/2mnjPAc9PUwaW6kws7JiZi
- 2026-11-05: step 6 decided: units open in place (L1), compact topic rows (R1), cards as today (C1, owner's taste).
  Owner caught that the Practice options hid the practice settings (number of questions and so on); added option P4
  with the settings under the Start button. Lesson: every option must show where each existing feature went.
  Options page: https://claude.ai/artifact/24Au8jxsZmN9NnrUiCo3y3
- 2026-11-05: owner asked whether features were being forgotten or removed: forgotten (mockups were drawn from memory).
  Made the feature inventory from the live site; steps 2, 4 and 5 stand, steps 1, 3 and 6 get small additions (flags F1 to F8).
- 2026-11-05: step 6b (missing features): F1 notes first with a lesson button (A), F3 menu button when logged out (A),
  F5 one Share button (A). Owner asked why unit actions are in Learn at all; agreed Practice this unit and Unit test
  repeat Practice and Exams, options redrawn. Options page: https://claude.ai/artifact/LK6KsKzERvjrtjZQ9ozfju
- 2026-11-05: owner restarted the build right after step 5. Step 6 and 6b decisions reopened (kept above, marked
  Reopened); steps 1 to 5 stand. Build order split so Learn, Practice and Exams each get their own step.
- 2026-11-05: step 6 (restart) decided: cards as today (C1), name plus short second line (R2), circle and quiet
  Premium tag (T1), one line empty states (E1). Options page: https://claude.ai/artifact/DFVNtT8hfT7ABujkFRc5oF
- 2026-11-05: step 7 decided: Make your path first for visitors (N2; Claude preferred a real question first, owner
  chose N2, which closes the open "try one question" item), next step plus path strip for returning students (R1),
  winding path (P2), price and questions for everyone (M2). Options page: https://claude.ai/artifact/6aGe9UHwgCvfACd6fverBf
- 2026-11-05: step 8 decided: contents sidebar on computers (A), Read / Interactive switch (A), slim video row (V1),
  tool cards with drawings (T1). Options page: https://claude.ai/artifact/QgTA1iVbiqyYAj74uiQ7ps
- 2026-11-05: step 9 decided: pill tabs (A), today's settings form (S2), flashcards without unit tiles (F3, owner's
  idea), FRQs grouped by type (R2). Options page: https://claude.ai/artifact/U5tCoafGswGA39WbUdgc2B
- 2026-11-05: step 10 decided: full width choices with Check pinned (A), data beside or pinned (S1), colors plus
  the why (E1), one next step (N1). Options page: https://claude.ai/artifact/FV7vdYFpvAvhX9z3DFkxyR
- 2026-11-05: step 11 decided: three choices and one Start (A), timer and map like the real exam (X1), results with
  every question underneath (R4, owner's idea), cram plan under Exams (C1). Options page: https://claude.ai/artifact/E6hXHtfr6sW22XXik1dFoa
- 2026-11-05: step 12 decided: five questions under the new rules (A), weekly line (L1), units ranked by cost (W1).
  Options page: https://claude.ai/artifact/RFvGeTfv8dKTJPyE6BYLM4
- 2026-11-05: step 13 decided: one grouped account menu (A), corner assistant (A), search over the page (S1), small
  Premium sheet (P1). Options page: https://claude.ai/artifact/MmLpYCz1vgsZDSiWZJMbr9
