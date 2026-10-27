# Site redesign: the light channel look (status file)

Owner brief (2026-10-25): make the site look like the LevlPrep YouTube and TikTok channels, but not in your face,
keeping a lighter look; every course gets its own cover art (never a reused video thumbnail); carry the same style to
every page; lay pages out from research and earlier owner decisions. Approved design: the canvas artifact
https://claude.ai/artifact/5fmnuUYa5ZodTEsagNPQg2 (top row: Home, Course page, Practice, Notes, Pricing, plus Home and
Practice at phone width). The full rationale and sources are in the Project doc `claude/levlprep-site-redesign.md`.

## System
- Page: the theme's paper colour with a faint 44 px grid. Headlines in Inter 800 to 900 (end of `assets/fonts/fonts.css`,
  family `'Inter Display'`), two-tone (ink, then `--accent`). One handwritten line in Kalam 700 in `--amber-text`
  (`#F2C14E` in dark). Body text stays Nunito. Buttons: channel navy `#0B1A33` (dark theme: teal `#2EE6D6`).
- Course covers: `assets/covers/<course key>.svg`, 640 x 320, background, grid, glow and the drawing; the two-tone
  title and handwritten line are HTML over it (`.cover`, `.cv-t`, colours per `[data-cover]`). Drawings: ambulance on
  an ECG line, benzene resonance, heart, cell, flask and beaker, block on a ramp (mg, N, f), tangent line with dy/dx,
  histogram with a normal curve, leaf with sun and water drop. Source: Project doc `claude/levlprep-redesign/covers.py`.

## Status
| Part | What | Status |
|---|---|---|
| 1 | Covers, display fonts, homepage (`index.html`; AP® cards and pricing from `scripts/build-pricing.mjs` `courseCard`) | PR #86 |
| 2 | Course home pages: cover banner over each hero (`scripts/lib/covers.mjs` `courseBanner`, styles in `assets/course/hub.css`) | PR #87 |
| 3 | Display headlines on every course page (`assets/course/base.css`), question card restyle (`study.css` section 8), cover per course on `premium.html` (`courseSection` in build-pricing) | PR #88 |

Merge order: #86, then #87, then part 3 (each stacked on the one before). #85 and #86 both edit the site budget line in
`scripts/check-weight.mjs`; whichever merges second keeps the higher number.
Not done yet: the course home layout changes from the canvas (Start here steps, practice by domain) are left for a
later pass; existing course homes already have practice, notes and Premium cards.

## Homepage decisions
- Keeps every generated block and script: from-video card, Continue card, hero facts (now a strip, hidden on phones),
  progress card, AP® cards, pricing, FAQ, structured data.
- The try-one question is plain HTML with a 300-byte script (no :has needed).
- Free-claims rule: say "free to start" / "notes free forever", never "no account needed".

## Round 2: every page (approved 2026-10-26)
Olivier saw parts 1 to 3 and said they still looked like the old site. He approved 27 new mockups (canvas rows
"Every page, 1 of 4" to "4 of 4", files `S01` to `S22`, in the design canvas linked at the top) and said "do all".
Six PRs, each stacked on `claude/redesign-study` (#88), built in parallel:

| Step | Branch | Owns (only edit these, plus new files) | Mockups | PR |
|---|---|---|---|---|
| 1 Shared parts | `claude/redesign-r2-chrome` | `assets/theme.css` token values incl. dark, `assets/course/base.css`, `assets/site-chrome.js`, every `*/assets/*nav*.js`, footer | top bar, course tab bar, footer on all | #89 |
| 2 Course homes | `claude/redesign-r2-courses` | `assets/course/hub.css`, `hub.js`, course home builders, `nremt/index.html`, `ochem/index.html` | S01, S02 | #94 |
| 3 Practice and study | `claude/redesign-r2-study` | `assets/course/study.css`, `study.js`, each course's practice/exam/review/flashcard CSS and pages | S03 to S09 | #90 |
| 4 Progress | `claude/redesign-r2-progress` | dashboard pages and their CSS/JS | S10 | #91 |
| 5 Reading | `claude/redesign-r2-reading` | `book.css`, `glossary.css`, `lesson.css`, notes/learn/glossary/tools/FRQ pages and builders | S11 to S16 | #92 |
| 6 Site pages | `claude/redesign-r2-site` | `premium` section of build-pricing, `about`, `account`, `search`, `changelog`, `privacy`, `terms`, `404` | S17 to S22 | #93 |

Rules for every step: colors only through theme tokens (dark mode must work); display face `'Inter Display'` 900
for headlines, Kalam for the one hand line; no example data ships (real progress or nothing); copy rules from
`scripts/site-rules/`; no em dashes. The integration pass (after all six) bumps `sw.js`, writes the changelog entry,
and resolves `scripts/check-weight.mjs` budgets.
Open for Olivier: is "No human expert has reviewed it yet" on About still true; a photo for About (none ships until
he sends one).

### Combined branch and status (2026-10-26)
All six steps are merged, without conflicts, on `claude/redesign-r2-all` (the branch to review and merge as one;
the six PRs show each step alone). The integration pass on it: cache `levlprep-v90` with `assets/site-pages.css`
and `assets/site-toc.js` precached, the changelog entry "A new look for every page", site budget 333 KB, and:
- Learn reader chapter header (ochem, A&P, AP®) and unit/chapter overview pages: no white card, course cover beside
  the headline (band above it on a phone), `assets/course/book.css`.
- Ochem tool pages: opener without the tinted panel, cover on the right (`ochem/assets/tools.css #tool-top`).
- Study pages (Practice, Review, Exams, Flashcards on the shared engines): two-tone headline added by
  `assets/course/study.js` (`TONE`), beside step 3's cover and hand line.
- NREMT mnemonics letters in the display face instead of mono.
- Text on navy cards: the old green-gray tints (#DCEFEA, #9FB5AE, #C7DED8, #D0DED9) became cool tints site-wide.
- Checked, no change needed: course stylesheets' remaining literal colors are var() fallbacks or the Okabe-Ito
  figure palettes (deliberate, light and dark pairs); Flashcards marking the Practice tab is deliberate (nav.js and
  ochem-nav.js: flashcards are a Practice mode); AP® Biology numeric inputs render correctly in light, dark and on
  a phone; no level/XP copy left on course homes; the NREMT home start card switches with real progress (Keep
  drilling, then Shore up your weakest area once an area has 5 answers; Pick up where you left off with a session open).

### Still open
- Olivier: dashboards' level, streak and badge cards (ochem, AP®) kept; not in the S10 mockup, his call.
- Olivier: About review wording, About photo.
- Results wording in the S05 style ("11 right. 4 to fix.") needs each engine's results screen; not done.
- Studio tool pages (AP®, A&P, NREMT reference pages) keep the calm studio layout (`docs/tools-calm.md`); only the
  ochem tool pages got the S15 opener.
- `--font-mono` (IBM Plex Mono) is still used for data labels on many pages (about 5,500 uses); a site-wide switch
  to the display face with tabular numbers would finish the look, but is a separate decision.
- NREMT home founder line wording on the course home ("an EMT who studied with this course and passed the NREMT")
  differs from the homepage's FTC wording; check-site accepts it.

## Round 3: rebuild every page to its mockup, nothing removed (2026-10-26)
Round 2 shipped (#95) but kept old layouts with new paint, and dropped some course home items (level and goal
cards, NREMT topic bars, ochem Daily Rounds, A&P chapter path and link grid, AP® simulators and link grid, among
others). Olivier asked for every page redesigned again, keeping everything that exists. 73 mockups (R1 to R6) are on
the design canvas page "Every page, nothing removed". `docs/redesign-r3/inventory/<board>.md` lists every element of
the live page and where it lives in the mockup; the rebuild must satisfy those checklists. Brief: `docs/redesign-r3/brief.md`.
Known live bug: AP® Biology Learn topic headings number 1, 4, 5, 7 (counter bug), fix in the rebuild.
Waiting on Olivier: approval of the R mockups; level/streak/badge cards (kept for now); About review wording and photo.

## Round 3, chosen system (2026-10-26)
Olivier picked course home V09b (cover band, contents list beside the try-one question, no full course directory)
and asked for every course page built from it, cohesive. Rules he set: the "Who makes this / How the questions are
written / What changes" block only on course homes (and site home, About); no "Other states" panels; inner pages
open with a short cover band. 41 boards are on the canvas page "The whole course, one system"; copies and the shared
markup are in `docs/redesign-r3/r10/` (`R10-SYSTEM.md` is the class and markup reference), placement lists in
`docs/redesign-r3/inventory/R10-*.md`. Open: ochem chapter count (home says 23, textbook 25).

## Round 3 build (approved 2026-10-26: "center the images ... and then you can go ahead")
Tool covers are centered (`assets/covers/tools/<course>/<slug>.svg`, `index.json` per course). Course covers stay
as they are (the course name sits over their left side).
Build in stacked PRs from `claude/redesign-r3`, each judged against its boards in `docs/redesign-r3/r10/boards/`
(render a board with `node docs/redesign-r3/render-board.mjs <board> <out.png> [width]`) and its placement list in
`docs/redesign-r3/inventory/R10-*.md`. Every PR ships side by side images (board | built page) for every board it
covers; no PR without them.
| Step | Branch | Boards |
|---|---|---|
| B1 shared system and course homes | `claude/r3-homes` | R10-Home-* (all nine), R10-SYSTEM.md |
| B2 practice, review, flashcards | `claude/r3-practice` | R10-Practice-*, R10-Review, R10-Flashcards* |
| B3 exams and progress | `claude/r3-exams` | R10-Exams, R10-Exam-*, R10-AP-Exams, R10-AP-UnitTest, R10-Progress*, R10-ExamDay |
| B4 reading | `claude/r3-reading` | R10-Learn, R10-Notes*, R10-Lesson, R10-Unit, R10-Glossary, R10-Search |
| B5 tools and AP® pages | `claude/r3-tools` | R10-Tools*, R10-Tool*, R10-ToolCovers, R10-AP-FRQ*, R10-AP-Cram, R10-AP-Teachers |
B1 goes first; B2 to B5 branch from it and run in parallel, each owning only its pages' files.

### B1 built (claude/r3-homes)
All nine course homes are the R10-Home board layout, from one module:
- `scripts/lib/r3-home.mjs`: `r3HomeMain(key, ctx)` renders the whole `<main id="main" class="r3 r3-home" data-cover>`;
  `homeData(key)` and `parseSample(html)` are exported too. Words come from `scripts/lib/course-homes.json`
  (exported from the board generator); prices and the free and Premium lists from `assets/premium.js`; NREMT counts,
  the ochem path and the ochem sample from their data (`scripts/build-course-homes.mjs`).
- Callers: `apHomeMain` / `apHomeCtx` in `scripts/lib/course-home.mjs` (the six AP® builders), `build-anp.mjs`
  `homePage`, and `build-course-homes.mjs` (the `<!-- course-home:main -->` block in `nremt/index.html` and
  `ochem/index.html`). `build-ochem-home.mjs` now keeps only the JSON-LD (the path and sample markers are gone).
- Styles: `assets/course/r3.css`, everything scoped to `.r3` (the page's `<main>`), course colour per
  `data-cover` (`--accent`, `--ctint`, `--bbg`, `--bac`) with dark values. Later steps load the same file and reuse:
  `.band` / `.band.short` (kicker `.issue`, `.mast`, `.deck`, `.hand`, `.lede`, `.hero-ctas`, `.art`), `.lead`,
  `.contents` + `.toc`, `.tryq`, `.fact-row`, `.kicker`, `.ruled-h`, `.story`, `.ccard` (`.cover`, `.cmeta`, `.cname`,
  `.tag free|prem|beta`, `.cdesc`, `.chiprow`), `.step`, `.dept` (rows with `.tc` tool covers), `.feat`, `.else-x`,
  `.home-deal` (`.plan`, `.plan--premium`, `.plan__amt`, `.plan__sure`), `.home-faq` (`.hub-faq`), `.about-row`
  (homes only), `.btn-chan`, `.btn-ghost`, `.btn-gold`, `.sticky-cta`.
- Band art: `assets/covers/art/<key>.svg` (the course drawing alone). Tool covers: `assets/covers/tools/<key>/`.
- The site's own top bar, course tabs and footer stay (site-chrome.js, the nav scripts); only `<main>` changed.
- Proof: board | built images for every home board, light, phone and dark, in the B1 PR.

### B3 built (claude/r3-exams)
Exams, the running exam and its results, AP® unit tests, progress and exam day, every course:
- `scripts/lib/r3-inner.mjs`: `shortBand()` (the short cover band) and `r3Inner(html, { key, slug })`, which turns a
  built page into `<main class="r3 r3-inner r3-<slug>" data-cover>` + band + `<div class="xshell r3-body" id="r3Body">`.
  Built pages call it through `dashboardPage(html, key)` and `examsPage(html, key, map)`
  (`scripts/lib/dashboard-page.mjs`) and, for unit tests, from each `scripts/lib/ap*-entry.mjs`.
- Hand pages (`nremt/exams.html`, `nremt/dashboard.html`, `nremt/exam-day.html`, `ochem/exams.html`,
  `ochem/dashboard.html`) carry `<!-- r3-band -->` (and on NREMT exams `r3-exams-built`, on exam day `r3-toc`) blocks
  written by `scripts/build-r3-inner.mjs` (`--check` in CI and ci-local).
- Styles: `assets/course/r3-inner.css` (frame, setup card and numbers rail, progress kicker sections, exam day,
  unit test rail, the running exam's focus bar, the results band). The built courses' progress panels are moved
  into the kicker sections by `assets/course/r3-db.js` after each render; NREMT's running exam bar and results
  band are `nremt/assets/r3-exam.js`. Every exams script's setup card got its heading and holds the free notice.
- Compare images (board left, built right): scratchpad `b3-compare/`.
