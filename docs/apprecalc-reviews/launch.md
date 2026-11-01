# AP® Precalculus launch: running log

A restart picks up from the last line. Steps, as the AP® Psychology launch (`docs/appsych-reviews/launch.md`):
(1) publish and register live, every generator; (2) site-wide wording, sources, changelog, social card and trainer
covers; (3) continuity pass against the other courses at 1280 and 360 px, light and dark (Playwright Chromium);
(4) full CI with browser checks; (5) spec, CLAUDE.md, owner checklist, PR.

## 1. Published and live (decision 20)

- `precalculus/data/published.json`: `skills-algebra`, `unit-1`..`unit-4` (69 topics, 1,046 bank questions).
- `assets/courses.js`: `status: 'live'`; `node scripts/build-courses.mjs` and every generator rerun (course pages,
  notes, figures, flashcards, question bank, lesson meta, crumbs, tool pages, homes, pricing, sitemap, og tags).
- Generated as a result: hub card and 404 card, premium.html block (Premium still "not on sale"), terms "passes with
  an end date" list, structured data (eleventh course), home facts ("18,697 practice questions", "11 courses"),
  manifest description, search scope, sitemap (191 precalculus URLs).
- Premium stays `onSale: false` (owner checklist, spec section 9). The "not yet reviewed by an AP® Precalculus
  teacher" note stays; no score calculator, readiness band or Beta label (checked on the home, exams and dashboard).

## 2. Site-wide

- "Eleven courses": home meta description and hero lede (now also names Psychology and Precalculus), search page
  (meta, lede, noscript links), sources meta, `cross-course.js`, `r3-home.mjs`, `r3-reading.mjs` comments.
- `sources.html`: an AP® Precalculus section (written originally, checked twice by code and an independent review,
  not yet reviewed by a teacher). `changelog.html`: "New course: AP® Precalculus" (31 October 2026).
- `robots.txt` hides `precalculus/data/notes/`; `sw.js` cache v100.
- Social card `precalculus/assets/og-image.png` rendered (was AB's copy); title shortened to fit three lines.
- Trainer covers: `assets/covers/tools/apprecalc/` had an empty index, so the course home and tools page showed no
  trainer art (every other course has a cover per trainer). Ten covers drawn in the course palette (deep green,
  mint, yellow), one per trainer, with `index.json`.

## 3. Continuity pass

Swept home, learn, a lesson (1.2 Rates of Change), its notes page, practice, review, flashcards, glossary, exams,
dashboard, tools and three trainers (function lab, unit circle, symbolic steps) at 1280 and 360, light and dark,
next to AP® Psychology. No horizontal overflow on any page.

- Course home eyebrow said "2026 exam" (carried from AB); now "2027 exam" as Psychology. The older AP® homes still
  say "2026 exam": needs-author `home-exam-year`.
- Unit circle trainer: the "sin, cos" view toggle was cut to "sin, c..." beside "Unroll one turn" at 1280; the two
  labels now keep their width (`unit-circle.css`).
- Checked, same as the other courses, no change: Read | Interactive toggle on lessons, glossary, flashcards tab,
  review (flagged questions only in Review; empty state), exams setup (practice exam, unit test, mixed timed set;
  29 + 13 multiple choice then the four FRQs), dashboard design F (no band), Tool Studio full screen with Explore
  and Test yourself on every trainer, course search, tutor. The lesson hero summary shows math as plain text, as
  AB's does (shared behaviour). The tools page lists nine trainers and one drill (vectors and matrices, beyond the
  exam), from `pages.json` kinds.

## 4. CI

(see below)
