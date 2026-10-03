# AP® Biology course: architecture

How the AP® Biology course is built. `docs/apbio-spec.md` says what the course must do; this file
says where each piece lives and what format its data takes. Content authors need only "Content
formats" and `docs/apbio-authoring-guide.md`. The course is a fork of the A&P course (spec
decision 1); `docs/anp-phase1-architecture.md` and `docs/anp-tools-contract.md` describe the
template and still apply where this file is silent.

## Layout

```
bio/                                    the course, at levlprep.com/bio/
  index.html                            course home (Beta)                         generated
  learn.html                            units, then the Skills section (textbook)  generated
  units/<unit>.html                     one page per unit or skills chapter        generated
  lessons/<topic>.html                  the interactive, stepped lesson            generated
  notes/<topic>.html                    the notes page (free)                      generated
  unit-sheets/<unit>.html               one-page printable unit summary            generated
  glossary.html                         every defined term                         generated
  practice.html review.html exams.html frq.html flashcards.html tools.html
  dashboard.html search.html                 app page shells from pages.json       generated
  teachers.html                         for teachers (not an app; "static" in pages.json) generated
  frq/<id>.html                         one FRQ: stable, shareable, printable page generated
  figures/<id>.svg|jpg                  OpenStax Biology 2e (CC BY 4.0), public domain, our SVGs
  assets/                               runtime JS and CSS (hand-written) + generated JSON
    bio-curriculum.js                   window.ApBioCurriculum, window.ApBioPages  generated
    glossary.json  notes-index.json                                                generated
    bank/<unit>.json  bank/<unit>-why.json  bank/index.json                        generated
    frq/index.json  frq/<id>.json  summaries.json                                  generated
    pages/<page>.js, pages/pages.css    app page scripts (see "App pages" below)
  data/                                 THE SOURCE: everything authored lives here
    lessons/<topic>.json   notes/<topic>.html   glossary/<topic>.json
    figures/<topic>.json   labels/<figure>.json questions/<topic>.json
    frq/<id>.json          tools/<slug>.json    pages.json  published.json  descriptions.json
```

No path under `bio/` contains the token "ap" or "apbio" (spec decision 2; checked by the
generator, `check-apbio-content` and site rule `apbio-trademark`). Storage keys, analytics names
and the registry key stay `apbio`; globals start `ApBio`; question ids start `bio-`.

## Generator: `scripts/build-apbio.mjs` (+ `scripts/lib/apbio-build.mjs`)

- `node scripts/build-apbio.mjs` writes everything; `--check` exits 1 when a generated file is
  stale or a generated file is left that should not exist. `--out <dir>` writes the `bio/` tree
  elsewhere (tests); `APBIO_PUBLISHED=unit-1,...` overrides `published.json` (tests, proof runs).
- **The map.** `loadMap()` in `apbio-build.mjs` reads `docs/apbio-dependency-map.json` (format:
  spec section 4). Without it, and only when `APBIO_MAP_STUB=1`, it reads the fixture
  `scripts/test/fixtures/apbio-map-stub.json`. With no map nothing is generated (the state of
  this branch until the map lands). The loader is a stand-in for `scripts/lib/apbio-map.mjs`;
  its interface is `{ chapters, topics (course order), concepts, practices, parts, order(),
  topicById(id), chapterById(id) }`, so the swap is one import. Course order: unit topics by
  unit then CED number; each skill or drill topic right after its `after` topic.
- **Published.** A topic is built when its lesson, notes and question file exist and its chapter
  is in `data/published.json`. It starts `[]`, so nothing ships. While no chapter is published,
  every generated page carries `noindex` (pre-launch); dashboard, review and search always do.
  Only published chapters' glossary definitions go out (A&P decision 63).
- **Every page** has: the title from `scripts/lib/page-title.mjs` with the label "AP® Biology"
  (lessons "… — AP® Biology Lesson", notes "… Notes", unit sheets "… Unit Sheet"); meta
  descriptions with no "AP" (the generator strips the mark as a safety net, the content check
  and site rule fail it); the footer with the Beta pill and "This course has not yet been
  reviewed by an AP® Biology teacher.", the disclaimer "AP® is a trademark registered by the
  College Board, which is not affiliated with, and does not endorse, this site." and a Report a
  problem button (`data-report-course="apbio"`, page ids `notes:<topic>`, `lesson:<topic>`,
  `unit:<unit>`, `glossary`, ...). Tables sit in keyboard-scrollable regions.
- **Structured data** (A&P decision 80): lessons in Units 1 and 2 and every skills lesson (one
  lesson per skills topic) say `isAccessibleForFree: true`; others say false with
  `hasPart.cssSelector: ".bio-ls-card"`. Notes, unit sheets and the glossary are free. The home
  page's Course lists the passes from `premium-data.mjs` once `apbio` is registered there.
- **Lesson** parts, in order (empty ones are left out): Why this matters (hook), What this
  builds on (from concept dependencies), Quick check (prereq), See it first (figure, with
  hide-labels when the figure has labels), How it works step by step (chain), Key ideas,
  A common mistake, Check yourself (items, sets under their panel), Summary, What comes next,
  Connections. Stepped view as A&P decisions 67 and 81.

- **FRQs.** An FRQ goes out when every unit it lists is published: `assets/frq/index.json` (id, type,
  points, title, units, topics, practices, placeholder), `assets/frq/<id>.json` (the whole question,
  stimulus rendered) and `frq/<id>.html`: prompt and data as static HTML, a print-only answer sheet
  (name line, lined space, about six lines a point; a blank grid for the graphing part), and the
  workspace mount. The rubric and the sample answer are NOT in the page HTML; `frq-kit.js` fetches
  them when asked.
- **Share bar** (`shareBar` in the generator) on every lesson, notes page, unit sheet and FRQ:
  "Share to Google Classroom" (`https://classroom.google.com/share?url=<encoded>&title=<encoded>`,
  title without the mark), Copy link (`data-copy`, wired by `bio-nav.js`) and Print (`data-print`).
  Lessons also link their question set, `practice.html?topic=<id>`. The lesson print CSS already
  prints every step in one run.
- **teachers.html** (`teachersPage`): how to assign (stable links, question sets, FRQs, printing,
  Classroom), no login for students, a privacy summary linking `privacy.html#schools`, access by
  email (no instructor flow exists), the framework order mapped to lessons. Indexable once launched.
- `assets/summaries.json`: `{ topic: lesson summary text }` for the flashcards.

## Runtime (`bio/assets/`, every global `ApBio*`)

| File | Job |
|---|---|
| `bio-core.js` | `window.ApBioCore`: store `apbio_progress_v1` (records carry topic, unit and practice skill); `record`; `topicMastery`, `unitMastery`, `practiceMastery` ("4" or "4.B"), `overallMastery`, `weakest`, `weakestPractice`; SM-2 `reviewQueue`, `missed`; `lessonComplete`; `toolResult`/`toolStats`; XP via `HubProgress.award('apbio', …)` (guarded); account sync namespace `apbio`; lazy bank `loadIndex` / `loadQuestions` (attaches `q.stim`) / `loadWhy`; premium hooks `locked(unit, topic)`, `allowed`, `quota`, `serve`, `freeExam`, `badge`, `gate` mirroring AnpCore, all open until premium.js knows the course `apbio` |
| `bio-questions.js` | `window.ApBioQuestions`: `render`, `hydrate(container, items, opts, stimuli)` (one panel per run of items sharing a stimulus), pure `grade(q, response)`, `parseNumber`, `group`, `displayOrder`, `orderStart`. Types single, multi, numeric, order, predict; radio and checkbox roles, word marks, per-option explanations, Report via `LevlReport.button('apbio', id)` |
| `bio-lesson.js` | lesson page: stepped view, prereq, check questions, completion, label toggle |
| `bio-book.js`, `bio-toc.js` | Learn textbook (one unit's notes at a time); rails, ticks, mastery chips |
| `bio-glossary.js` | hover/tap definitions for `.gl` terms; the glossary page filter |
| `bio-nav.js` | tabs Home, Learn, Practice, Review, Exams, Glossary, Tools, Dashboard (A&P decision 70) through `LevlChrome.render({ subject: 'apbio' })`; `[data-print]` buttons |
| `bio.css` | the A&P visual language tokens renamed `--bio-*`, dark mode, the course green, 44 px targets, stimulus panels, charts, numeric input, unit sheet print CSS |

Pages set `window.ApBioBase` (path back to `bio/`) and `window.ApBioSection`.

## App pages (`bio/assets/pages/`, forked from `anatomy-physiology/assets/apps/`)

| File | Job |
|---|---|
| `practice.js` | set builder: unit, topic, science practice (1-6), type (standalone, stimulus sets, numeric), difficulty, count; modes weakest topics and missed (retried until right). A *step* is one standalone item or one whole set (authored order, one panel). Lazy: `loadIndex`, then only the units drawn from, `loadWhy` after each answer. `ApBioCore.serve` per item. The address bar follows the builder (`?unit= &topic= &practice= &type= &diff= &mode=`); share bar for the set and "Print as a worksheet" (answer key optional, on its own page; locked units left out). Summary ends with `LevlPremium.card('apbio','summary')`. **Skills hook:** `window.ApBioSkills.practiceItems(filters)` returns a Promise of full items (bank item format); they join as standalone steps |
| `review.js` | SM-2 due queue, oldest first; a set item comes back alone under its stimulus; tool items (`<tool>:<content>:<item>`) link to `tools/<slug>.html` via `window.ApBioTools` |
| `exams.js` | unit test (equal share per published topic of the unit, sets whole; 15, 25 or all) and practice exam (Section I: 60 MCQ in 90 min, per unit by the midpoint of its weight range, largest remainder, sets whole; Section II: one FRQ per type, 25 min per long and 10 per short = 90 min, no pause, printable booklet; then rubric self-scoring; results by unit and practice; readiness band 1-5 from 60% MCQ + 40% FRQ with cut-offs 75/60/45/30, labelled "Not calibrated: a rough guide, not a predicted score."). When the bank cannot fill a full exam the setup says so per unit and per FRQ type and offers a "shorter practice exam" (each built unit keeps its full-exam share, capped by what exists). Timing standard, 1.5x, 2x, untimed. Answers recorded at the end (A&P decision 42); one free exam via `ApBioCore.freeExam` |
| `frq-kit.js` | `window.ApBioFrq`: load, question and rubric HTML, self-score, the printable booklet, `printOnly` (`#bio-print`, `body.bio-printing`), drafts, scores |
| `frq.js` | `frq.html`: list by type and unit, best self-scores, the types not written yet. `frq/<id>.html`: write (a textarea per part), reveal the rubric, check points, sample answers, save; "print the rubric on a separate page" option. An FRQ in a locked unit shows the Premium card instead of the workspace |
| `dashboard.js` | mastery by unit and topic and by science practice, weakest topics linked to their lesson and notes, FRQ self-scores, exam history, the exam-date card; Premium (`allowed('analytics')`): mastery by skill (4.B), tool accuracy |
| `flashcards.js` | glossary both ways + one summary card per topic; decks all, unit, topic, missed terms; SM-2 as A&P |
| `search.js` | lessons, notes passages, glossary, FRQs, tools, pages with `LevlSearch`; `?q=` |
| `pages.css` | A&P `apps.css` renamed `bio-`, plus filters, FRQ workspace, Section II, print (lined space, grid, worksheet, booklet) |

Storage besides `apbio_progress_v1` and `apbio_flashcards_v1`: `apbio_prefs_v1` (synced) holds
`examTiming`, `examHistory` (last 30: `{ ts, kind, label, unit, mcq: {c, n}, frq: {got, of}, band,
partial }`), `frqScores` (`{ id: { got, of, parts, best, tries, ts, title, type, units } }`),
`flashcards` (deck prefs); `apbio_frq_drafts_v1` holds typed FRQ answers on
this device only, never synced; `apbio_exam_date` is the shared exam-date card's key (unset, the
card counts down to `assets/exam-date.js`'s course default, 2027-05-03; cleared, it holds "none").
Analytics events
added: `apbio-session-finish`, `apbio-exam-finish`, `apbio-frq-score`.

## Content formats

### Lesson: `data/lessons/<topic>.json`

As A&P (`docs/anp-phase1-architecture.md`), with `figure` in place of `anatomy`:
`{ topic, hook, prereq: [{ q, options, correct, why, review }], figure: { figure, caption } | null,
chain: [{ cause, effect }], ideas: [html], misconception: { wrong, right }, check: [5-8 item ids],
summary, connections: [{ href, label }] }`. `prereq` is 2-3 items except on the first topic.
Check items from one stimulus are listed together.

### Notes: `data/notes/<topic>.html`

An HTML fragment of `<h2>` sections (no `<h1>`), 500+ words for a concept topic. May contain
`<figure data-fig="id" id="..."><figcaption>…</figcaption></figure>`, `<a class="figref"
href="#id">`, `<table class="compare">`, `<div class="worked">`, `<aside class="going-further">`,
`<aside class="bio-preview">` (declared previews only).

### Questions: `data/questions/<topic>.json`

```json
{ "stimuli": { "<topic>-s1": { "kind": "table|graph|setup|model", "title": "...", "text": "<p>…</p>",
                                "table": { "caption", "cols": [], "rows": [[]] }
                                | "chart": { "type": "line|bar", "x": { "label", "unit", "min", "max", "step", "categories" },
                                             "y": { "label", "unit", "min", "max", "step" },
                                             "series": [{ "name", "points": [[x, y, err?]] }] }
                                | "figure": "<figure id>" | "html": "<svg…>" } },
  "items": [ { "id": "bio-<topic>-<n>", "type": "single|multi|numeric|order|predict",
               "unit": "unit-1", "topic": "<topic>", "practice": "4.B", "level": "recall|apply|analyze",
               "diff": 1, "stimulus": "<topic>-s1", "fixed": false,
               "q": "...", "options": [], "correct": 0 | [0, 2],
               "numeric": { "answer": 11.3, "tol": 0.1, "unit": "kJ", "decimals": 1 },
               "variables": [{ "name", "answer": "up|down|none", "why" }],
               "why": { "correct": "...", "options": ["one per option"] } } ] }
```

- `unit`, `topic` and `practice` (a skill id: practice number and letter) are required on every
  item and never inferred. Ids are permanent and never reused.
- A **stimulus set** is the 4-5 consecutive items sharing one `stimulus`; they render under one
  panel in authored order. A concept topic has 15+ items, 60%+ apply/analyze and 40%+ of items in
  sets. A `chart` is drawn at build time as an accessible SVG with its data table.
- `numeric`: `tol` is absolute, in the answer's unit, inclusive; `decimals` is the rounding the
  student is told and the key is shown with; the answer has no more decimals than that. Typed
  answers may carry the unit, thousands commas or a decimal comma.
- `order`: options in the correct order; shuffled for display, graded against that order.
  `fixed: true` keeps a single/multi item's options in authored order (find-the-error, scales).
- `why.options[i]` explains option i, never by letter or position.

### FRQ: `data/frq/<id>.json`

`{ id, type: "iee|iee-graph|investigation|conceptual|model|data", points (9 for iee/iee-graph, 4
otherwise), units, topics, practices, stimulus (a stimulus object, as above, or a stimulus id),
parts: [{ label, prompt, points, rubric: [{ point, accept: [] }] (one line per point), sample }],
graphSpec? (iee-graph: the graph the student builds) }`. Parts' points add up to `points`.
Optional: `title` (else the stimulus title) and `placeholder: true` (labelled "placeholder" on
every page). `graphSpec`: `{ type: "line|bar", x: { label }, y: { label }, errorBars? }`; the part
whose prompt says graph, plot or construct gets the blank grid on paper.

### Glossary, figures, labels

- `data/glossary/<topic>.json`: `{ "<concept-id>": { "def": "…" } }`; every concept the topic
  teaches is defined.
- `data/figures/<topic>.json`: `{ "<id>": { file, ext, w, h, source: "openstax|public-domain|levlprep",
  license: "CC BY 4.0|Public domain|LevlPrep original", credit, alt, openstax?: { figure, page, url },
  url? } }`. OpenStax figures come from *Biology 2e* and are credited "Figure N from Mary Ann Clark,
  Matthew Douglas and Jung Choi, Biology 2e, OpenStax, © Rice University, CC BY 4.0" (+ "Adapted:
  labels hidden." when masked). Our SVGs live at `bio/figures/<id>.svg`.
- `data/labels/<figure>.json`: `{ figure, labels: [{ id, name, box, concept }] }`, merged in.

### Pages, published, descriptions, tools

- `pages.json`: `{ apps: [{ slug, premium?, section, h1, title, desc, lede?, card?, script, css,
  siteScripts? }], tools: [] }`. Until `bio/assets/<script>` exists, the shell says the page
  arrives with the first published unit.
- `published.json`: `{ chapters: [] }`. `descriptions.json`: `{ lessons, notes, units }` overrides.
- `tools/<slug>.json`: each needs `scripts/lib/apbio-tool-checks/<slug>.mjs` exporting
  `check(data, map)` (as A&P's tool contract).

## Checks

| Check | What it enforces |
|---|---|
| `build-apbio.mjs --check` | generated files up to date; none left over |
| `check-apbio-content.mjs --check` | the formats above; tags; per-option why with no letter/position; 15+ items, 60% apply/analyze, 40% in sets, sets of 4-5; numeric well-formed; length tells (correct option longest ≤40% per topic); test-wise balance (A&P decision 79, count rules scaled for a small bank); cross-topic duplicates (75%); ordering (later terms outside previews); figure licenses; FRQ rubrics and samples; trademark wording; no "AP" in authored meta text. Only published chapters fail; the rest print |
| site rule `apbio-trademark` | pages with "AP" carry the disclaimer; every "AP" is "AP®" as an adjective; no "ap" token in paths under `bio/` or links into it; no "AP" in meta description/keywords/og:description |
| site rule `apbio-beta-and-report` | Beta note and pill, Report a problem, report-question.js on every page; page reports on notes and the glossary |
| `scripts/test/apbio-core.test.mjs`, `apbio-questions.test.mjs`, `apbio-build.test.mjs` | store, mastery, SM-2, XP guard, premium tolerance, lazy bank; grading; a stub build passing the course rules, noindex before launch |

## Placeholder sample content

The topic `water-hydrogen-bonding` (lesson, notes, 15 items in two stimulus sets including two
numeric items, glossary, the figure `water-hbond`, and `frq/frq-water-cooling.json`) is
**placeholder** written to prove the engine in Phase 0 against the stub map. It has had no
accuracy check. Three more FRQs, `frq-placeholder-*.json` (iee-graph, investigation,
conceptual; `"placeholder": true`), exist only to exercise the FRQ and exam pages. Content authors replace them and it (and its topic id must match the real map's) before
Unit 1 is published.
