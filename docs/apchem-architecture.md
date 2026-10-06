# AP® Chemistry course: architecture

How the AP® Chemistry course is built. `docs/apchem-spec.md` says what the course must do; this
file says where each piece lives and what format its data takes. Content authors need "Content
formats" and `docs/apchem-authoring-guide.md`. The course is a fork of AP® Biology (spec decision
1): `docs/apbio-architecture.md` describes the template and still applies where this file is
silent. Only the differences are spelled out here.

## Layout

```
chem/                                   the course, at levlprep.com/chem/
  index.html learn.html glossary.html   home, textbook (units, then "Math you need"), glossary   generated
  units/<unit>.html  lessons/<topic>.html  notes/<topic>.html  unit-sheets/<unit>.html       generated
  practice.html review.html exams.html frq.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json        generated
  frq/<id>.html  tools/<slug>.html                                                             generated
  figures/<id>.svg                      our own SVGs only (no OpenStax, spec decision 4)
  manifest.json                         "LevlPrep — Chemistry" (no mark), fields from build-pricing
  assets/
    chem-core.js chem-questions.js chem-lesson.js chem-nav.js chem-book.js chem-toc.js chem-home.js
    chem.css chem-home.css og-image.png
    pages/*.js pages/pages.css          app pages (practice, review, exams, frq, frq-kit, dashboard,
                                        flashcards, search, cram, tools)
    tools/chem-tools.js chem-tools.css chem-tool-math.js   tool framework (ApChemTools, ApChemMath)
    chem-curriculum.js glossary.json notes-index.json summaries.json                           generated
    bank/<unit>.json bank/<unit>-why.json bank/index.json frq/index.json frq/<id>.json         generated
    tool-data/<slug>.json                                                                      generated
  data/                                 THE SOURCE: everything authored lives here
    lessons/<topic>.json notes/<topic>.html glossary/<topic>.json figures/<topic>.json
    labels/<figure>.json questions/<topic>.json frq/<id>.json tools/<slug>.json
    pages.json published.json descriptions.json
```

No path under `chem/` contains the token "ap", "apchem" or "apbio". Storage keys, analytics names
and the registry key are `apchem`; browser globals start `ApChem`; question ids start `chem-`;
CSS classes start `chem-`. URLs name the course by its folder, `chem` (site search `?course=chem`,
Polar return `course=chem`). Pass id `chem-2027`.

## Generator: `scripts/build-apchem.mjs` (+ `scripts/lib/apchem-build.mjs`)

As AP® Biology's (`node scripts/build-apchem.mjs`, `--check`, `--out <dir>`), plus:

- `APCHEM_PUBLISHED=unit-1,skills-math` overrides `published.json`; `APCHEM_DATA=<dir>` reads
  authored data from another folder (tests use `scripts/test/fixtures/apchem-data`, the
  placeholder sample; it never ships).
- The map is `docs/apchem-dependency-map.json` (`docs/apchem-phase0.md`). A skill topic is placed
  by `before` or `after`; it publishes when its own chapter and its anchor's chapter are both in
  `published.json`.
- Free lessons: Units 1 and 2 and every math-skills topic (`isFreeTopic`; `freeChapters` in
  `assets/premium.js`).
- Home: "AP® Chemistry, one particle at a time.", cobalt part colors, the trainers band with the
  flask icon (only when a trainer is live), "Try a step." from `SAMPLE_Q` (a free Unit 1 single
  item, chosen when Unit 1 is written; until then the card is left out).
- FRQ types are `long` (10 points) and `short` (4 points). A `graphSpec` gives the graphing part
  a blank grid on paper.
- Numeric keys in static HTML are written with the item's significant figures (`formatKey`).
- Stimulus kind `particle` is labelled "Particle view".

## Runtime (`chem/assets/`, every global `ApChem*`)

Forked from `bio/assets/` with the names changed. Differences:

| File | What changed |
|---|---|
| `chem-questions.js` | Numeric items graded on **value, units and significant figures separately** (`gradeNumeric`), each with a mark and a line of feedback; `splitNumber` reads powers of ten (`1.8e-5`, `1.8 × 10^-5`, `× 10⁻⁵`) and a typed unit; `normUnit` compares units however typed (`kJ/mol` = `kJ mol^-1` = `kJ·mol⁻¹`, `M` = `mol/L`); targeted feedback for a prefix slip (J for kJ), °C for K, a factor of 1000, 273 or 2.303 (ln vs log), a sign error, and any authored `mistakes`; a unit box when `askUnit`. Exposes `grade`, `splitNumber`, `sigFigs`, `normUnit`, `formatKey`. |
| `pages/exams.js` | Section II is the real one: 7 FRQs in 105 min, 3 long (23 min each) then 4 short (9 min each); distinct questions per slot; readiness band from 50% MCQ + 50% FRQ (the exam's split), labelled "Not calibrated". |
| `pages/frq-kit.js`, `frq.js`, `dashboard.js`, `search.js` | FRQ types long and short. |
| `pages/cram.js` | Default exam date 2027-05-06; plan text says 7 FRQs in 105 min. |
| `tools/chem-tool-math.js` | `ApChemMath`: equations-sheet constants, `round`, `fixed`, `sig`, seeded `rng`, `pH`, `weakAcid` (exact), `hh`, `dG`, `KfromDG`, `dGfromE`. Drills add their models here. |
| `chem.css` | The cobalt tint (`--ctint` `#E3EAFA`, `--cink` `#1D44A6`; dark `rgba(90,130,230,.12)` / `#B3C8F7`), the same values as `body[data-course="apchem"]` in `assets/theme.css`; numeric part marks. |

Storage: `apchem_progress_v1`, `apchem_flashcards_v1`, `apchem_prefs_v1`, `apchem_frq_drafts_v1`,
`apchem_cram_v1`, `apchem_exam_date` (default 2027-05-06 in `assets/exam-date.js`).

## Content formats

### Lesson: `data/lessons/<topic>.json`

```json
{ "topic": "moles-molar-mass",
  "hook": "A bakery buys eggs by the dozen ... (80+ characters)",
  "prereq": [{ "q": "...", "options": ["...", "...", "...", "..."], "correct": 0, "why": "...", "review": "math-sig-figs" }],
  "figure": { "figure": "<figure id>", "caption": "..." },
  "chain": [{ "cause": "Atoms are too small to count", "effect": "chemists count them in moles" }],
  "ideas": ["<= 70 words of HTML each"],
  "misconception": { "wrong": "...", "right": "..." },
  "check": ["chem-moles-molar-mass-1", "chem-moles-molar-mass-2"],
  "summary": "...", "connections": [{ "href": "...", "label": "..." }] }
```

`prereq` is 2-3 items pointing `review` at an earlier topic (the first topic in course order may
have none); `figure` may be `null` (the check warns); `chain` 3+ steps; `check` 5-8 item ids, a
set's items listed together.

### Notes: `data/notes/<topic>.html`

As AP® Biology: an HTML fragment of `<h2>` sections, no `<h1>`, 500+ words for a CED topic. May
contain `<figure data-fig="id">`, `<table class="compare">`, `<div class="worked">` (a worked
example, required before any calculation type is asked), `<aside class="going-further">`,
`<aside class="chem-preview" data-concept="…">` (declared previews only).

### Questions: `data/questions/<topic>.json`

```json
{ "stimuli": {
    "<topic>-s1": { "kind": "table", "title": "Four weighed samples", "text": "<p>...</p>",
                    "table": { "caption": "...", "cols": ["Sample", "Mass (g)"], "rows": [["1", "36.0"]] } },
    "<topic>-s2": { "kind": "particle", "title": "A box of molecules",
                    "html": "<svg role=\"img\" aria-label=\"What each box shows, 20+ characters\" ...>...</svg><p>Key: ...</p>" },
    "<topic>-s3": { "kind": "graph", "title": "...", "chart": { "type": "line", "x": { "label": "Time", "unit": "s" },
                    "y": { "label": "[A]", "unit": "M" }, "series": [{ "name": "Trial 1", "points": [[0, 0.5], [10, 0.3]] }] } } },
  "items": [
    { "id": "chem-<topic>-1", "type": "single", "unit": "unit-1", "topic": "<topic>", "practice": "6.D",
      "level": "analyze", "diff": 2, "stimulus": "<topic>-s1",
      "q": "...", "options": ["A", "B", "C", "D"], "correct": 0,
      "why": { "correct": "...", "options": ["why A", "why B", "why C", "why D"] } },
    { "id": "chem-<topic>-2", "type": "numeric", "unit": "unit-1", "topic": "<topic>", "practice": "5.F",
      "level": "apply", "diff": 2, "q": "What is the mass of 0.0450 mol of water (18.02 g/mol)?",
      "numeric": { "answer": 0.811, "tol": 0.001, "unit": "g", "askUnit": true, "sigfigs": 3,
                   "mistakes": [{ "value": 0.0025, "rel": 0.01, "why": "Value: you divided by the molar mass. Multiply instead." }] },
      "why": { "correct": "0.0450 mol × 18.02 g/mol = 0.8109 g, which is 0.811 g to three significant figures." } } ] }
```

- Types: `single` (**exactly 4 options**, as the exam), `multi`, `numeric`, `order`, `predict`.
- `unit`, `topic`, `practice` required on every item and never inferred. `practice` is a CED
  skill id (`1.A`-`6.G`, the list in `docs/apchem-ced-map.json`); practice 3 never on a single or
  multi item (it is free response only).
- Stimulus kinds: `table`, `graph` (chart drawn at build time), `setup`, `model`, `particle` (an
  inline SVG with `role="img"` and an `aria-label` of 20+ characters, or a registered figure).
- Sets: 4-5 consecutive items sharing one stimulus; a CED topic has 15+ items, 60%+ apply/analyze,
  40%+ in sets; the key is the longest option at most 40% of the time; test-wise balance as AP®
  Biology.

**Numeric** (`numeric`):

| Field | Meaning |
|---|---|
| `answer` | the key, written to its significant figures (`0.811`, `3.0e23`) |
| `tol` or `rel` | exactly one: absolute tolerance in the unit, or a fraction of the answer (≤ 0.05). At most two units in the last digit. |
| `unit` | the answer's unit (`""` for none, e.g. pH); `units` lists other accepted spellings |
| `askUnit` | `true`: the student types the unit too and it is graded on its own |
| `sigfigs` / `places` / `decimals` | exactly one: significant figures of a measured result; decimal places of a logarithm (pH, pKa); decimals of an exact count (only `decimals` is not graded as a part) |
| `mistakes` | `[{ value, why, tol?, rel?, unit? }]`: a known wrong answer (ln for log, pOH for pH, not squaring [OH⁻], J for kJ) and the targeted feedback shown when the student lands on it; outside the answer's tolerance |

Grading: value right within the tolerance (or the key rounded to the student's own precision,
which is then a significant-figures miss, reported once); unit right if `askUnit`; sig figs or
places right if given. The item is right when every graded part is; the score is the share of
parts. The feedback lists each part and every matching note.

### FRQ: `data/frq/<id>.json`

```json
{ "id": "frq-weak-acid-titration", "type": "long", "points": 10,
  "title": "Titrating a weak acid", "units": ["unit-8"], "topics": ["acid-base-titrations"],
  "practices": ["5.F", "6.D"], "stimulus": { "kind": "graph", "title": "...", "chart": { ... } } ,
  "graphSpec": { "type": "line", "x": { "label": "Volume of NaOH (mL)" }, "y": { "label": "pH" } },
  "parts": [{ "label": "a", "prompt": "<b>Calculate</b> ...", "points": 2,
              "rubric": [{ "point": "...", "accept": ["..."] }, { "point": "...", "accept": ["..."] }],
              "sample": "A full-credit answer." }] }
```

`type` `long` (10 points) or `short` (4 points); parts add up to `points`; one rubric line per
point; a sample for every part; `stimulus` an object or a stimulus id from a question file;
`graphSpec` optional; `placeholder: true` labels a test question on every page.

### Glossary, figures, labels

- `data/glossary/<topic>.json`: `{ "<concept-id>": { "def": "..." } }`, every concept the topic
  teaches (`concepts[].taughtIn` in the map). The shared glossary page, popups, search and
  flashcards read the generated `assets/glossary.json`; there is no separate flashcard file
  (flashcards are the glossary both ways plus one summary card per topic from `summaries.json`).
- `data/figures/<topic>.json`: `{ "<id>": { "file", "ext": "svg", "w", "h", "source": "levlprep" | "public-domain", "license": "LevlPrep original" | "Public domain", "credit", "alt", "url"? } }`.
  Our own SVG lives at `chem/figures/<id>.svg`. No OpenStax.
- `data/labels/<figure>.json`: `{ figure, labels: [{ id, name, box, concept }] }`.

### Pages, published, descriptions, tools

- `pages.json`: `{ apps: [...], tools: [] }`, as AP® Biology. `tools[]` is empty until a trainer
  is built.
- `published.json`: `{ "chapters": [] }`.
- `descriptions.json`: `{ lessons, notes, units }` meta-description overrides; never "AP".
- A tool is one `pages.json` `tools[]` entry `{ slug, kind: simulator|skill|drill, name, title,
  desc, blurb, premium? }` + `chem/assets/tools/<slug>.js` (mounts with `ApChemTools.mount`) +
  `chem/data/tools/<slug>.json` (`slug`, `kind`, `topic`, `intro`, `howItWorks`, `questions[]`
  in the bank item format with `chem-` ids replaced by `<slug>:<content>:<item>`, …) + a validator
  `scripts/lib/apchem-tool-checks/<slug>.mjs` exporting `check(data, map)` that recomputes every
  number through `runtime()` (`_shared.mjs`). "simulator" is shown as "Trainers" in the course.

## Publishing a unit

1. Write every topic of the unit in `chem/data/` and its glossary; run
   `node scripts/check-apchem-content.mjs --topic <id>` per topic until clean.
2. Independent accuracy check (spec section 6); record it in `docs/apchem-reviews/<unit>.md`.
3. Add the unit to `chem/data/published.json` (and `skills-math` with Unit 1).
4. `node scripts/build-apchem.mjs`, then `node scripts/build-pricing.mjs`,
   `node scripts/build-og-tags.mjs`, `node scripts/build-sitemap.mjs` (the hub card, 404 card,
   premium.html section and sitemap appear once a unit is published). `APCHEM_PUBLISHED=unit-1`
   previews the launched state without editing the file.
5. `scripts/ci-local.sh` (with `BROWSER=1` for a11y and console checks).

## Checks

| Check | What it enforces |
|---|---|
| `check-apchem-map.mjs --check` | the map (`docs/apchem-phase0.md`) and the ordering rule on pages and questions |
| `build-apchem.mjs --check` | generated files up to date; none left over |
| `check-apchem-content.mjs --check` | the formats above (4-option single items, numeric fields, particle stimuli, long/short FRQs, no OpenStax figures, skill ids, practice 3 not in MCQ), plus every AP® Biology rule. Only published chapters fail. |
| site rules `apchem-trademark`, `apchem-beta-and-report` | as AP® Biology's, for `chem/` |
| `scripts/test/apchem-*.test.mjs` | map, build (against the fixture), core, questions (numeric grading on value, units and sig figs; `ApChemMath`), cram |
| `sql-migration.test.mjs` | `2026-10c-apchem.sql` adds `apchem` everywhere and matches `schema.sql` |
