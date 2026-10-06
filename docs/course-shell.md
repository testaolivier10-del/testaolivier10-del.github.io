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
- [ ] W-A  - [ ] W-B  - [ ] W-C  - [x] W-D
- [ ] Merge, regenerate, bump sw.js CACHE, full CI, before/after screenshots, PR

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

