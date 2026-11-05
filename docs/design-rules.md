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
1 Course sections (done) · 2 Navigation · 3 Header · 4 Titles and banners · 5 Type and color · 6 Cards and lists ·
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
- Proposed: the big cover banner (drawing plus handwritten line) only on the homepage and course homes, about half
  its current height on phones. Every other page gets a one line title row with a breadcrumb. No banner at all
  during a practice or exam session.
- Proposed: no handwritten (Kalam) font inside study content (notes, questions, explanations).
- Proposed: notes read at about 65 characters per line and 17 to 19 px.

## Words
- Agreed: show less at once. Do not explain things people already understand (a button that emails students needs
  no sentence telling them so).
- Agreed: no numbered section headings ("1 What needs you today"). Short headings that carry the meaning.
- Agreed: if a heading needs a sentence under it to make sense, rewrite the heading instead.
- No em dashes or hyphens used as punctuation in any copy.

## Layout and navigation
- Agreed (step 2): on phones the 5 sections sit in a bottom bar with icons and labels, all always visible.
- Agreed: the layout must be intuitive and easy to scan; split long pages (tabs, collapsed "More" menus,
  "More options" in forms) rather than stacking every section.
- Agreed (step 1): every course has 5 sections: Home, Learn, Practice, Exams, Progress. Path lives in Home;
  Review and Flashcards in Practice; Glossary and Tools in Learn. The progress page is called "Progress" (not
  Dashboard or Stats); the reading section is called "Learn" (notes, lessons and videos).
- Proposed: one primary (gold) button per screen.
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
