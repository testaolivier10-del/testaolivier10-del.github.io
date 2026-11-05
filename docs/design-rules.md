# Design rules (living rulebook)

Read this before any design or page work on LevlPrep, the same way the video pipeline reads its style guide.
Every comment the owner and Claude agree on becomes a rule here, in the same commit as the change it led to.
A rule that turns out badly gets changed or removed, with a line in the log saying why.

Status words: **Agreed** (owner confirmed), **Proposed** (from research, waiting for the owner's comments),
**Retired** (tried, dropped; kept in the log only).

Background: the research report `docs/design-research-2026-11.md` (what the best study sites do, with sources)
and its 14 ranked decisions. Mockup of those decisions: https://claude.ai/artifact/T5YGJSHPjrnsW9EcECLZ54.
Earlier look and covers: `docs/site-redesign.md`.

## Build order
One piece at a time, biggest decisions first; each step shows every reasonable option inside a real page, with an
honest take and a pick; the owner chooses and the choice is recorded here before the next step.
1 Course sections (done) · 2 Navigation (done) · 3 Header (done) · 4 Titles and banners (done) · 5 Type and color (done) · 6 Cards and lists ·
7 Course home · 8 Question screen · 9 Notes page · 10 Progress · 11 Homepage · 12 Teacher side.

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
