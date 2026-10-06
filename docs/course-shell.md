# Course shell: one look for every course

Status file for the cross-course consistency work. Findings: `docs/consistency-audit-2026-10.md`.
Integration branch: `claude/course-consistency` (PR to main; the owner reviews before merging).

## Owner decisions (2026-10-06)

- **Shared components.** Glossary, term popups, textbook layout, review, flashcards, search, tools hub, dashboard
  and page openers are shared. Quiz engines (NREMT `practice-engine.js`, Ochem `session-runner.js`/`exam-core.js`,
  A&P/Bio apps) stay per course but render into the shared layout and classes.
- **Glossary:** a list with every definition visible, a search box, a chapter/unit filter, an A-Z rail and
  "Taught in <topic>" links. Same page in every course.
- **Textbook:** the A&P/Bio reading layout everywhere (site sans font, contents rail on the left, "On this page",
  underlined glossary terms). NREMT's serif/drop-cap book style goes.
- **Ship as a pull request** with before/after screenshots.

## What stays per course (identity)

The `--ctint`/`--cink` tint (theme.css, keyed on `body[data-course]`: nremt default mint, ochem lilac, anp coral,
bio green), the course home headline and hero, rank names, course-only tools (periodic table, body map, molecule
editor, FRQ, cram plan, skill sheets, Classroom sharing for AP), exam formats, Beta pill and reviewer notice.

## Shared layer

| File | What |
| --- | --- |
| `assets/course/base.css` | crumb `.cx-crumb`, Beta pill `.cx-beta`, body grid `.cx-body.has-rail` + `.cx-rail`, `.cx-card`, `.cx-kicker`, empty state `.cx-empty` (+ `.cx-empty-num`, `.cx-actions`), stat tiles `.cx-stats/.cx-stat`, radio choice cards `.cx-choices/.cx-choice`, `.cx-pills/.cx-pill`, `.cx-free`, `.cx-search`, glossary term `.gl` and popup `.cx-tip` |
| `assets/course/glossary.css`, `glossary-page.js`, `glossary-tip.js` | W-A |
| `assets/course/book.css` | W-B |
| `assets/course/study.css` | W-C (practice, review, flashcards, exams) |
| `assets/course/hub.css` | W-D (dashboard, search, tools hub, home row) |

Load order on a course page: `theme.css`, `assets/course/base.css`, the area file(s), then the course's own CSS.

### Conventions every page follows

- Sub-page opener: `<header class="page-head">` with `.eyebrow` = course display name (NREMT-EMT, Organic
  Chemistry, Anatomy &amp; Physiology, AP&reg; Biology) plus `<span class="cx-beta">Beta</span>` for beta
  courses; `<h1>` = the plain page name with no period (Practice, Review, Flashcards, Exams, Glossary, Dashboard,
  Search, Tools); one `<p>` lede. Course homes keep `.hero` and their slogan.
- Breadcrumb `nav.cx-crumb` above the opener on every course sub-page (LevlPrep > Course > Page).
- Glossary data: every course serves `<course>/assets/glossary.json` in the normalized shape
  `{"terms":[{"id","term","def","topic","topicTitle","href","aka":[],"roots":[["root","meaning"]],"say"}]}`.
  `href` is relative to the course root (e.g. `notes/acid-base-regulation.html`), empty if not yet built.
  Generators may keep their old fields alongside while migrating, but the shared scripts read only these.
- Glossary popups: pages load `assets/course/glossary-tip.js` with `data-glossary="<path to glossary.json>"`
  `data-course-root="<path to course root>"` on the script tag. It handles build-time `.gl[data-c]` marks and
  exposes `window.LevlGlossary.mark(rootEl, {topic})` for runtime marking (first use per section, not in
  headings/links/figures/code, not the topic that teaches the term).

## Workstreams (each on `claude/course-consistency-wX`, cut from the integration branch)

- **W-A Glossary:** shared glossary page + popups for all four courses; NREMT glossary to JSON (sorted, linked to
  chapters); runtime marking on Ochem lessons; Bio "5' end" sorted under F/letters. Owns glossary pages, their
  generators' glossary parts, `anp-glossary*.js`, `bio-glossary*.js`, ochem `glossary-*.js`, ochem lessons'
  script tags.
- **W-B Textbook:** NREMT study notes to the shared layout and marked terms; Ochem notes pages get site header,
  course tabs, bottom bar and the contents rail; Bio figures follow dark mode; one notes action row; Bio unit
  pages match A&P chapter pages (practice + tools sections). Owns `nremt/study-notes.html`, `ochem/notes/*`,
  `build-notes-pages.mjs`, `learn.html` pages, chapter/unit pages, `book.css`.
- **W-C Study pages:** practice, review, flashcards, exams in all four courses on `study.css` + base classes;
  Ochem flashcards overlap fix. Engines keep their logic.
- **W-D Hub pages:** dashboard, search, tools hub in all four; Bio tools hub lists its 19 tools; NREMT home gets
  the Start here / Review queue / Today's goal row.

Each workstream: before/after screenshots at 1280 and 390, light and dark, of every page it touched; run
`scripts/ci-local.sh` with `BROWSER=1 CHROMIUM_PATH=/tmp/chromium`; don't bump `sw.js` (done once at merge).

## Status

- [x] Audit, decisions, base.css, Bio tint tokens moved to theme.css
- [x] W-A  - [x] W-B  - [x] W-C  - [x] W-D
- [x] Merge, regenerate, bump sw.js CACHE (v57), full CI (ALL PASS with BROWSER=1), before/after screenshots, PR
- Merge fixes: base `.cx-card`/`.cx-stat` use `--white` + 2px line like theme `.card`; Beta pill readable in dark; rail link subtitles without opacity (axe); A&P/Bio study feedback keeps the `.anp-verdict`/`.bio-verdict` hook; Bio review reads `ApBioToolList`; one review empty state ("Nothing to review yet" / "You are all caught up"); one search placeholder; no Premium pill in Ochem dashboard opener; `assets/course` budget 17 KB, `/assets` back to 282.
- Still per course (not converged): exam run and results screens; Ochem's daily goal is 5 rounds.

## W-D notes

- **Shared layer:** `assets/course/hub.css` + `assets/course/hub.js` (`window.LevlHub`: `stats`, `row`, `group`,
  `panel`, `next`, `level`, `badges`, `toolCard`/`toolGrid`/`toolStatus`, `nowCard`, `search`). Generators load it
  through `scripts/lib/hub.mjs`, so static hub cards and runtime cards are one function. Status chips use one
  tier scale (Not started/Learning/Developing/Strong/Mastered); Ochem maps its own bands onto the same chip.
- **Dashboard:** every course = page-head, 4 `.cx-stats` tiles, Next up (numbered list when empty, action cards
  with data), exam card, two-column grid (mastery groups left; level card, side panels, badges, the one Premium
  card right). NREMT keeps accuracy (no mastery model). Storage keys untouched.
- **Search:** `LevlHub.search` owns box, index line ("N results. Searching N passages: …"), kind pills, grouped
  rows, keyboard, "Search all courses". Courses only build chunks (`page`, `meta`, `fragment`).
- **Tools hub:** shared `.cx-tool` card and optional `.cx-feat` block (A&P lab practical, NREMT body map). Bio's
  hub is generated by `build-apbio.mjs` from `pages.json` tools (live only), grouped by kind; Ochem's by
  `build-tool-pages.mjs` from `tools-registry.js` (between `<!-- tool-hub:* -->` markers; check-site #9 now
  compares hrefs).
- **Homes:** NREMT has the Start here / Review queue / Today's goal row (practice-engine keys, HubProgress goal);
  the other homes' rows carry `.cx-now-*` too. Ochem's third card still shows Daily Rounds (its model).
- **Weight budgets raised** (documented in check-weight.mjs): site shell 282 -> 293.5, nremt/index 9.2 -> 10.4,
  bio/tools 3 -> 5.
- **Left for others:** `bio/assets/pages/review.js` reads `window.ApBioTools` (the tool runtime) as if it were the
  tool list; it should read `window.ApBioToolList` (W-C owns review). base.css `.cx-card`/`.cx-stat` use an
  undefined `--surface` token; hub.css works around it on hub pages.


## W-C notes

- Shared layer: `assets/course/study.css` (layout, builder, rail, review queue, flashcard deck + card, in-session card;
  absorbed and replaces `assets/flashcards.css`) and `assets/course/study.js` (`LevlStudy.rail/stat/empty/actions/free`,
  one markup source for the rail, review empty state and the `.cx-free` line). Both precached in `sw.js` (CACHE not bumped).
- All 16 pages: `.page-head` opener (course eyebrow, Beta pill on A&P/Bio, plain h1), crumb, `.cx-body.has-rail` with
  Answered / Due for review / To fix / (streak or topics studied), review-queue card and sibling links. A&P/Bio via
  `build-anp.mjs`/`build-apbio.mjs` (`STUDY_PAGES`); NREMT crumb names now plain (Practice, Review, Exams, Flashcards).
- NREMT practice: builder maps onto the engine's existing buttons and length selects (`nremt/practice-study.js`; no engine
  logic changed). Modes: weak spots, one domain/area, missed, flagged. Timed exam stays on Exams.
- Ochem practice: modes adaptive/diagnostic (default), one topic, quick 5, cumulative, missed, flagged; Review/Flashcards
  moved to the rail. Ochem flashcards overlap fixed (old stub hero replaced by `.page-head`).
- In-session: engines add `.cx-q`, `.cx-opt`, `.cx-fb` (+ `.cx-fb-head` icon + word), `.cx-progress`, `.cx-sbar`,
  `.cx-next-row` beside their own classes; state classes accepted as is (`is-right/is-wrong`, `correct/incorrect`,
  `correct/wrong`). A&P/Bio renderers emit the new feedback only on study pages (`.cx-study`), lessons unchanged.
- Not converged: exam run screens (clock, question map) and results/summary screens keep per-course chrome.
- Weight budgets raised with reasons in `check-weight.mjs` (site 290, nremt 11.4, ochem 111, nremt/practice 48,
  ochem exams-page.js 12). Screenshots: `/home/claude/shots/wc/{before,after}/`.

## W-A notes

- **Data.** `scripts/lib/glossary.mjs` writes every `<course>/assets/glossary.json` (shape above, plus `chapters`
  for the filter, `chapter` per term and `pop: 0` for words kept off runtime marking) and the shared page body. Old
  shapes are gone; A&P/Bio search, flashcards and word-roots adapt the new file with a small `glossMap()`.
  Site search and the tutor read every course's JSON. Ochem `#g-<id>` links are mapped to `#t-<id>`.
- **NREMT.** Source `nremt/data/glossary.json` (A-Z, checked); `scripts/build-nremt-glossary.mjs` (`--check` in
  ci-local and checks.yml). 85 of 150 terms link to the study-notes section that defines or teaches them (picked by
  reading each section); the rest have an empty `href`. Domains stay in `GLOSSARY_DOMAIN`; the flashcard deck reads
  the source file. Everyday words (Sign, Acute, Prone…) have `pop: false`.
- **Popups.** `assets/course/glossary-tip.js` replaces `anp-glossary.js`, `bio-glossary.js` and ochem
  `glossary-tip.js` (all removed). It loads `base.css` itself if the page lacks it. Any element with
  `data-glossary-topic` is marked after load; `data-glossary-live` re-marks when its content changes (the 119
  ochem lessons' `#card`). **For W-B (NREMT study notes):** load
  `<script src="../assets/course/glossary-tip.js" data-glossary="assets/glossary.json" data-course-root="" defer>`
  and call `LevlGlossary.mark(sectionEl)` per rendered section (no topic needed; tested), or put
  `data-glossary-topic=""` on the container if it is in the HTML at load.
- **Touched outside W-A's files (one line each):** `scripts/build-notes-pages.mjs` and `ochem/learn.html` script tag,
  `ochem/assets/textbook.js` call (`OchemGlossary` to `LevlGlossary`), `sw.js` precache list (no CACHE bump),
  `base.css` (`.gl:focus-visible`, dark `.cx-tip`, `.cx-tip-say`), `check-weight.mjs` (new `assets/course` shell
  budget 14 KB; A&P glossary.json 150 to 190 KB because it now carries aliases, topic titles and links the page HTML
  used to; the page fell from 43 to 16 KB), `site-rules/ochem-long-pages.mjs` (now guards content-visibility).
- `base.css` `.cx-card` uses `var(--surface)`, which theme.css does not define; glossary.css sets the card
  background itself. Worth a fix in base.css at merge.

## W-B notes

- `assets/course/book.css` (`.bk-*`) is the one reading layout: add `bk` plus `bk-notes`, `bk-book` (Learn) or
  `bk-chapter` (chapter/unit page) to the `.tb-shell`. Rail: `.bk-rail`, `.bk-toc-chap/-other/-list/-n/-onpage`.
  Header: `.bk-head/.bk-eyebrow/.bk-title/.bk-meta`, action row `.bk-actions > .bk-action` (Copy link, Print;
  Bio adds Share to Google Classroom first). Prose `.bk-prose`. Chapter page: `.bk-chap-head/-acts`, `.bk-h`,
  `.bk-list/.bk-row`, `.bk-cards/.bk-card`, `.bk-tools/.bk-toolset`. anp.css/bio.css lost their `.anp-tb`/`.bio-tb`
  copies; generators load base.css + book.css through `head({ book: true })`.
- `assets/course/book.js`: `[data-print]`, `[data-copy]` (empty = canonical URL), drawer toggle
  `.tb-toc-btn[data-bk-toggle]`, `article[data-bk-ids]` heading ids, `[data-bk-read]` read progress,
  `[data-bk-chapter]` chapter number from curriculum (ochem's no-typed-chapter-numbers rule). Bio pages use
  bio-nav.js for print/copy instead.
- Ochem notes (`build-notes-pages.mjs`) now have site header, tabs, bottom bar, footer, rail with "On this page"
  (ids applied at runtime, the prose between the markers is untouched) and the shared header/action row.
  `<article data-glossary-topic>` kept; they still load `ochem/assets/glossary-tip.js` until W-A swaps it.
- NREMT study notes: serif, drop cap, chapter-number display, running head and "In this chapter" box gone;
  sections render as `.bk-sec` with `.bk-prose`; crumb moved into main (build-crumbs skips `IN_PAGE` pages).
  `build-nremt-notes-toc.mjs` writes the glossary-tip tag between `<!-- glossary-tip:* -->` markers only once
  `assets/course/glossary-tip.js` and `nremt/assets/glossary.json` exist: rerun it after W-A merges.
  `markTerms()` calls `LevlGlossary.mark(el, {})` per section after render.
- Bio unit pages: "Practice this unit" cards (question set, unit test or unit sheet, tools) and the unit's tools
  (simulators, skills tools, drills by topic, plus FRQs), prev/next unit; Bio rails gained progress, search and
  neighbouring units like A&P.
- Bio figures in dark mode: CSS filter on `.bio-figimg img` (the SVGs are external `<img>` files, so tokens can't
  reach them; inlining would add 2-4 KB per page). Hues stay put; check new figures by eye in dark.
- Ochem has no chapter deep link for practice, so its Learn chapter head offers "Chapter flashcards".

