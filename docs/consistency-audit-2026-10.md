# Cross-course consistency audit (2026-10-06)

Scope: layout, design and continuity across NREMT, Ochem, A&P and AP® Biology. Checked by screenshotting every
shared page type in all four courses (1280 px and 390 px, light and dark) and comparing the code each loads.
Status of the fix work goes at the bottom of this file.

## Root cause

Every course has its own copy of every page type, all sitting on `assets/theme.css`:

| Page | NREMT | Ochem | A&P | AP Bio |
| --- | --- | --- | --- | --- |
| Practice, review, exams | `practice-engine.js` + `practice.css` | `session-runner.js`, `exam-core.js` | `assets/apps/*.js` + `apps.css` | `assets/pages/*.js` + `pages.css` |
| Glossary | inline 150-term array in the page | `glossary-page.js` | `anp-glossary-page.js` | `bio-glossary-page.js` |
| Term popups in reading | none | `glossary-tip.js` (`.ogl-term`, runtime) | `anp-glossary.js` (`.gl`, build time) | `bio-glossary.js` (`.gl`, build time) |
| Textbook | `study-notes.html` (serif book style) | `learn.html` + `textbook.js` | `learn.html` + `anp-book.js` | `learn.html` + `bio-book.js` |

AP Bio was forked from A&P and the two have already drifted (practice.js 698 differing lines, exams.js 1,013,
flashcards.js 364). Each new course is another fork, so the gap widens with every course.

## Inconsistencies by page

**Glossary.** Three different designs: NREMT is a card list with definitions shown; Ochem is a collapsed
accordion per letter with a chapter filter; A&P and Bio are a wall of underlined terms with "Show definitions".
Hero headline differs ("Terminology, plainly defined." vs "Glossary"). Search box, letter chips and mobile letter
row (wrap vs swipe) all differ.

**Glossary links in reading.** NREMT: none anywhere (0 terms marked on study notes). Ochem: notes pages yes
(37 to 43 per page), interactive lessons none. A&P and Bio: notes, lessons and textbook all marked (27 to 210).
Popup classes and styles differ (`.ogl-tip`, `.anp-tip`, `.bio-tip`).

**Textbook / notes.** NREMT uses a serif book face with a drop cap; the other three use the site sans. Ochem's
123 notes pages have no site header, course tabs or mobile bottom bar at all, and no contents rail; A&P and Bio
notes have both. Bio notes have Share to Classroom / Copy link / Print; the others don't.

**Practice.** Three layouts: NREMT three mode tiles + streak bar; Ochem "recommended diagnostic" + other-ways
tiles + numbers rail; A&P/Bio step-by-step builder + numbers rail (A&P and Bio numbers cards differ).

**Review.** Three empty states for the same "nothing due" moment, three different button sets. A&P/Bio card is
narrower than the hero above it.

**Flashcards.** NREMT and Ochem share one design (`flashcards.css`), A&P and Bio share another. NREMT has no
breadcrumb and its title has a period ("Flashcards.").

**Exams.** Three pickers: NREMT tiles, Ochem selectable cards without radios, A&P/Bio radio cards. The free-exam
notice sits in a different place on each.

**Dashboard.** Four designs. Titles: "Your progress" (no eyebrow), "Mastery, not a readiness score.",
"Dashboard", "Dashboard". Stat tiles, level card position, exam-date control, badges all differ.

**Search.** NREMT and Ochem eyebrow says "Tools" instead of the course; input styles differ (icon vs none,
full width vs narrow).

**Tools hub.** Four designs (tiles with icon panels, cards with tag rows, featured hero + cards, placeholder).

**Home.** A&P, Bio and Ochem share the Start here / Review queue / Today's goal row and the course path; NREMT
has neither (domain wheel instead). Daily goal units differ: Ochem 5 rounds, others 15 questions.

**Chapter / unit pages.** A&P chapter pages list topics plus chapter practice and chapter tools; Bio unit pages
list topics only; Ochem and NREMT have none.

**Copy.** Eyebrows: NREMT alternates "NREMT-EMT", "NREMT-EMT Prep", "EMT terminology glossary", "Tools"; others
use the course name. Headlines mix plain names and slogans with periods.

## Bugs found on the way

1. `bio/tools.html` says the page "arrives with the first published unit" though 19 tools are live in `bio/tools/`.
2. Ochem notes pages (123) have no header or navigation (desktop and mobile).
3. Ochem flashcards hero text is overlapped by the first card at 1280 px.
4. NREMT glossary: terms not sorted within each letter (Ambulatory, Anaphylaxis, Auscultation, Afebrile…); only
   150 terms; no link to where each is taught.
5. Bio glossary opens with a "5" group ("5' end") before A.
6. Bio figures stay white in dark mode; A&P figures adapt.

## What should stay different (identity)

Accent colour and hero tint, home headline, rank names, course-specific tools (periodic table, body map,
molecule editor, FRQ, cram plan, skill sheets), exam formats, Beta badge and reviewer notice.

## Fix status

(filled in as work proceeds)
