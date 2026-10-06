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
- [ ] W-A  - [x] W-B  - [ ] W-C  - [ ] W-D
- [ ] Merge, regenerate, bump sw.js CACHE, full CI, before/after screenshots, PR

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

