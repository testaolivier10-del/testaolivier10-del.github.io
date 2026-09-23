# A&P course: Phase 1 architecture

How the Anatomy & Physiology course is built. `docs/anp-spec.md` says what the course must do; this
file says where each piece lives and what format its data takes. Content authors need only the
"Content formats" section and `docs/anp-authoring-guide.md`.

## Layout

```
anatomy-physiology/                      the course, at levlprep.com/anatomy-physiology/
  index.html                             course home (Beta)                     generated
  learn.html                             every chapter and topic                generated
  chapters/<chapter>.html                one page per chapter (system)          generated
  lessons/<topic>.html                   the interactive lesson                 generated
  notes/<topic>.html                     the prose notes page                   generated
  concepts/<core-concept>.html           one page per core concept              generated
  glossary.html                          every defined term                     generated
  practice.html  review.html  exams.html  flashcards.html  tools.html
  mastery.html  search.html              app pages                              hand-written
  tools/<tool>.html                      one page per tool                      hand-written
  manifest.json
  assets/                                runtime JS and CSS, generated JSON
  figures/                               OpenStax figures (CC BY 4.0) and our SVG diagrams
  data/                                  THE SOURCE: everything authored lives here
    lessons/<topic>.json                 lesson parts (template sections 1-11)
    notes/<topic>.html                   notes prose (an HTML fragment)
    questions/<topic>.json               that topic's question bank
    glossary/<topic>.json                definitions, word roots, pronunciation (one file per topic,
                                         so parallel authors never edit the same file)
    figures/<topic>.json                 figures first used by that topic: file, source, attribution,
                                         label masks
    tools/*.json                         tool content (lab sets, predictions, loops, ...)
    word-roots.json                      prefixes, roots, suffixes
```

Nothing under `lessons/`, `notes/`, `chapters/`, `concepts/`, `index.html`, `learn.html` or
`glossary.html` is edited by hand. `scripts/build-anp.mjs` writes all of it from `data/` and
`docs/anp-dependency-map.json`, and `--check` fails CI when a generated file is stale. That is the
pattern every ochem and NREMT generator already follows.

## Why A&P has its own engines

The spec asks to reuse the ochem structure and shared systems "wherever possible". What is shared:

- **Site-wide modules, used as they are:** the header (`site-chrome.js`), theme, fonts, XP,
  levels, streaks and daily goals (`hub-progress.js`), accounts and sync (`account.js`),
  "Report a problem" (`report-question.js`), analytics (`analytics.js`), the service worker,
  search ranking (`site-search.js`), and the flashcard scheduler's SM-2 logic. A&P is registered
  with each of them as a third course, key `anp`.
- **The generator pattern:** generated pages, `--check` in CI, and the figure helpers in
  `scripts/lib/ochem-figure.mjs`, wrapped by `scripts/lib/anp-figure.mjs`.

What A&P does not reuse: ochem's lesson engine, question engine and mastery engine. The ochem
lesson is a step-by-step card; the spec's A&P lesson is a fixed 11-part page. The ochem engines are
wired to its chemistry concepts, molecule renderer and progress keys in many places.
Generalizing them would mean rewriting working, reviewed ochem code with no gain for ochem, and
the spec says to stop before rewriting reviewed work. So A&P gets its own `anp-*.js` modules,
built on the same ideas: concept strength with decay, SM-2-style review scheduling, tiered XP.
This is logged in the spec's decisions log.

## Runtime modules (`anatomy-physiology/assets/`)

| File | Job |
|---|---|
| `anp-curriculum.js` | generated from the map: chapters, topics, tags, which pages exist |
| `anp-core.js` | progress store `anp_progress_v1`: per-question attempts, topic, chapter and core-concept mastery, the missed-question review queue (SM-2 intervals), XP through `HubProgress.award('anp', …)`, account sync namespace `anp`, analytics helpers |
| `anp-questions.js` | renders and grades every question type, shuffles options, shows per-option explanations, adds the report button, sends misses to the review queue |
| `anp-lesson.js` | lesson page behavior: prerequisite check, label toggle, retrieval check, completion |
| `anp-glossary.js` | hover and tap definitions for tagged terms |
| `anp-nav.js` | the course's tabs, handed to `LevlChrome.render` |
| `anp.css` | course styles and the visual language (figures, arrows, colors) |
| `tools/*.js` | one module per tool |
| `bank-core.json`, `bank-why.json` | generated: the question bank without and with explanations (the split keeps the first question fast, as in ochem) |
| `glossary.json`, `flashcards.json`, `tools-data.json` | generated from `data/` |

## Content formats

### Lesson: `data/lessons/<topic>.json`

```json
{
  "topic": "cardiac-cycle",
  "hook": "<p>Mr. Diaz, 67, ...</p>",
  "prereq": [
    { "q": "...", "options": ["...", "...", "..."], "correct": 0,
      "why": "...", "review": "valve-rule" }
  ],
  "anatomy": { "figure": "heart-internal", "caption": "..." },
  "chain": [
    { "cause": "The ventricles depolarize (the QRS complex).", "effect": "Ventricular muscle contracts and pressure inside rises." }
  ],
  "misconception": { "wrong": "The heart sounds are made by the heart muscle contracting.", "right": "..." },
  "check": ["anp-cardiac-cycle-1", "anp-cardiac-cycle-4", "anp-cardiac-cycle-7", "anp-cardiac-cycle-9", "anp-cardiac-cycle-12"],
  "summary": "<p>...</p>",
  "connections": [ { "href": "/nremt/study-notes.html#...", "label": "NREMT: ..." } ]
}
```

- `prereq` holds 2 or 3 quick questions. `review` is the topic id a wrong answer links to. The
  generator shows it as a link only if that topic's page exists; otherwise the term is plain
  text with its glossary hover (spec section 7).
- `anatomy` may be `null` for a topic with no structure to label. Otherwise it names a figure id from any
  `data/figures/*.json` file.
- `chain` holds numbered cause-and-effect steps. Each step's effect should be the next step's
  cause.
- `check` lists 5 to 8 ids from this topic's question file.
- "What this builds on", core concept tags and "What comes next" are not written here: the
  generator takes them from the map.

### Notes: `data/notes/<topic>.html`

An HTML fragment: `<h2>` sections in the same order as the lesson. It may contain
`<figure data-fig="id">`, `<table class="compare">`, `<div class="worked">` (worked examples),
`<aside class="going-further">`, `<aside class="anp-preview" data-concept="id">` (only for the
topic's declared previews), and `<aside class="for-your-exam">` (contested science only). The
generator adds the head, title, description, breadcrumbs, JSON-LD, glossary markup, attribution
and prev/next.

### Questions: `data/questions/<topic>.json`

An array. Ids are permanent and never reused: `anp-<topic>-<n>`.

```json
{
  "id": "anp-cardiac-cycle-3",
  "type": "single",
  "level": "apply",
  "diff": 2,
  "core": ["gradients"],
  "misconception": "valves are pushed open by muscle",
  "q": "...",
  "options": ["...", "...", "...", "..."],
  "correct": 1,
  "why": { "correct": "...", "options": ["...", "...", "...", "..."] }
}
```

- **`type`:**
  - `single`, `vignette` (single best answer with a patient scenario) and `graph` (one of
    these with `"figure"`): `correct` is an index.
  - `multi`: `correct` is an array of indices ("select all that apply").
  - `order`: `options` are the steps in the correct order. The engine shuffles them for display.
  - `missing`: `options` are the choices for the blank; `q` shows the sequence with a gap.
  - `error`: `options` are the steps of a pathway with one wrong step; `correct` is its index.
  - `image`: `figure` names a figure and `pin` names a mask; the answer is typed (synonyms
    come from the figure data).
  - `predict`: `variables: [{ "name": "...", "answer": "up|down|none", "why": "..." }]` instead of
    options.
- **`why`:** `why.options[i]` explains why option `i` is right or wrong. It never mentions a
  letter or position.
- **Tags:** system, course (I/II) and TEAS area come from the map through the topic.
  `core`, `level`, `diff` and `misconception` are written per question.

### Glossary: `data/glossary/<topic>.json`

`{ "<concept-id>": { "def": "one or two plain sentences", "roots": [["cardi/o","heart"],["-ac","pertaining to"]], "say": "KAR-dee-ak" } }`.
`say` is optional. Every concept used on a built page must have a definition. That includes
concepts from chapters not built yet, which appear as plain text with a hover.

### Figures: `data/figures/<topic>.json`

`{ "<id>": { "file": "figures/openstax/19-2-heart-internal.jpg", "w": 1000, "h": 940,
"source": "openstax", "credit": "OpenStax Anatomy and Physiology 2e, Figure 19.9", "url": "...",
"alt": "...", "labels": [ { "id": "left-ventricle", "name": "left ventricle",
"accept": ["LV"], "box": [x, y, w, h], "at": [x, y], "concept": "chambers" } ] } }`.
`box` is the label's own text box in the image, which gets masked; `at` is the structure the label
points to. Our own SVG diagrams use `"source": "levlprep"` and carry their labels as SVG text.

The named labels live apart from the figure entry, in `data/labels/<figure id>.json` as
`{ "figure": "<id>", "labels": [ ... ] }`, and the generator merges them in. That way the people
naming labels and the people editing captions never write the same file. A label whose `concept`
is taught after the page's topic is covered for good on that page (decision 30).

## Visual language

`anatomy-physiology/assets/anp.css` defines one set of tokens for every figure, in light and dark
mode:

- oxygenated and deoxygenated blood
- sympathetic and parasympathetic
- afferent and efferent
- "causes" arrows (solid, filled head) and "flows to" arrows (dashed, open head)

The colors are an Okabe–Ito based, colorblind-safe palette. `scripts/lib/anp-figure.mjs` draws
SVG with those classes only, so no figure picks its own color.

## Checks

| Check | What it enforces |
|---|---|
| `check-anp-map.mjs` | the map's ordering, plus every A&P page, and every question's text against its topic |
| `build-anp.mjs --check` | generated pages are up to date |
| `check-anp-content.mjs` | content formats; 15+ questions per topic; 60% apply/analyze on physiology topics; no option letters in explanations; the site's wording tells; glossary coverage; figure references |
| `audit-anp-originality.mjs` | local audit, not in CI because it needs the OpenStax text: flags any notes passage whose 8-word sequences overlap OpenStax more than a threshold |
| site-wide | the existing `check-site`, `check-a11y`, `check-console`, `check-weight`, OG and sitemap checks, each taught about the new course |
