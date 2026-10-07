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
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json        generated
  frq/<id>.html  tools/<slug>.html                                                             generated
  equations-sheet.html score-calculator.html unit-tests/<unit>.html   free entry pages          generated
  figures/<id>.svg                      our own SVGs only (no OpenStax, spec decision 4)
  manifest.json                         "LevlPrep — Chemistry" (no mark), fields from build-pricing
  assets/
    chem-core.js chem-questions.js chem-lesson.js chem-nav.js chem-book.js chem-toc.js chem-home.js
    chem.css chem-home.css og-image.png
    pages/*.js pages/pages.css          app pages (practice, review, exams, frq, frq-kit, dashboard,
                                        flashcards, search, cram, tools, justify, score, sample)
    pages/entry.css                     the trainer and entry pages only (kept out of pages.css)
    tools/chem-tools.js chem-tools.css chem-tool-math.js   tool framework (ApChemTools, ApChemMath)
    chem-curriculum.js glossary.json notes-index.json summaries.json                           generated
    bank/<unit>.json bank/<unit>-why.json bank/index.json frq/index.json frq/<id>.json         generated
    tool-data/<slug>.json                                                                      generated
    exams/forms.json exams/items.json justify.json                                             generated
  data/                                 THE SOURCE: everything authored lives here
    lessons/<topic>.json notes/<topic>.html glossary/<topic>.json figures/<topic>.json
    labels/<figure>.json questions/<topic>.json frq/<id>.json tools/<slug>.json
    exams/forms.json exams/items.json justify/<unit>.json
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
- A lesson with no authored `connections` gets them from the map: the last two topics it builds
  on and the next topic, as navigation (`chem-nav-ref`).
- `scripts/lib/apchem-entry.mjs` writes the entry pages and the exam and trainer data
  ("Exams and entry pages" below); `scripts/lib/apchem-exams.mjs` loads and checks them.
- An app's `css` in `pages.json` may be a list (`justify` loads `pages.css` and `entry.css`).

## Runtime (`chem/assets/`, every global `ApChem*`)

Forked from `bio/assets/` with the names changed. Differences:

| File | What changed |
|---|---|
| `chem-questions.js` | Numeric items graded on **value, units and significant figures separately** (`gradeNumeric`), each with a mark and a line of feedback; `splitNumber` reads powers of ten (`1.8e-5`, `1.8 × 10^-5`, `× 10⁻⁵`) and a typed unit; `normUnit` compares units however typed (`kJ/mol` = `kJ mol^-1` = `kJ·mol⁻¹`, `M` = `mol/L`); targeted feedback for a prefix slip (J for kJ), °C for K, a factor of 1000, 273 or 2.303 (ln vs log), a sign error, and any authored `mistakes`; a unit box when `askUnit`. Exposes `grade`, `splitNumber`, `sigFigs`, `normUnit`, `formatKey`. |
| `pages/exams.js` | Section II is the real one: 7 FRQs in 105 min, 3 long (23 min each) then 4 short (9 min each); distinct questions per slot; readiness band from 50% MCQ + 50% FRQ (the exam's split), labelled "Not calibrated". |
| `pages/frq-kit.js`, `frq.js`, `dashboard.js`, `search.js` | FRQ types long and short. |
| `pages/cram.js` | Default exam date 2027-05-06; plan text says 7 FRQs in 105 min. Exam day *n* opens practice exam *n* (`exams.html?mode=full&form=n`); study and weak-spot days add two justification prompts; review days point at the score calculator. |
| `pages/exams.js` (fixed exams) | The two fixed practice exams from `assets/exams/forms.json` are offered first under Practice exam ("Which exam": exam 1, exam 2, or a new mixed exam); `?mode=full&form=1`. Same clock, sections, self-scoring and band as the mixed exam. Exam-only items count in the score but are not recorded to practice or review (they are not in the bank). |
| `pages/justify.js` | The justification trainer (below). |
| `pages/score.js` | `ApChemScore`: `composite(mcq, frq)`, `band(c)`, `mount(el)`; the method in "Exams and entry pages". |
| `pages/sample.js` | Makes a unit practice test's static questions live (feedback, explanations, recorded). |
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

### Practice exams: `data/exams/forms.json` and `data/exams/items.json`

```json
{ "forms": [ { "id": "form-1", "title": "Practice exam 1",
    "mcq": [["chem-acid-base-titrations-20", "chem-acid-base-titrations-21", "chem-acid-base-titrations-22"],
            ["chem-exam-1-09"], ...],
    "frq": ["frq-weak-acid-titration-lab", "frq-zinc-copper-calorimetry", "frq-chlorite-ion-structure",
            "frq-pes-sodium-magnesium", "frq-peroxide-iodide-rates", "frq-methanol-shift", "frq-dinitrogen-tetroxide-entropy"] } ] }
```

- `mcq` is Section I in the order shown: each block is one stimulus set (3-5 of its single-answer
  items, in authored order) or one standalone question. Exactly 60 four-option single-answer
  items; each unit inside its CED range (`unitRange`: floor of the low % × 60 to ceiling of the
  high %, so 4-6 for a 7-9% unit, 6-9 for Unit 8, 10-14 for Unit 3). No item in both forms.
- `frq` is Section II: 3 `long`, then 4 `short`, none in both forms, none a placeholder.
- `items.json` is `{ stimuli, items }` in the bank format. Ids `chem-exam-<form>-<nn>`, stimuli
  `exam-<form>-s<n>`; an exam-only item belongs to its own form only and never appears in practice
  or on a free page. They follow every bank rule (`checkItem`), and every number they key is
  recomputed in `EXAM_NUMBERS` (`scripts/lib/apchem-exams.mjs`).
- A form is served (`assets/exams/forms.json`) only when every unit its questions and FRQs come
  from is published.

### Justification trainer: `data/justify/<unit>.json`

```json
{ "prompts": [ { "id": "u7-q-vs-k-add-reactant", "unit": "unit-7", "topic": "q-and-le-chatelier",
    "practice": "6.D", "skill": "q-vs-k", "title": "Adding hydrogen to an equilibrium mixture",
    "context": "<p>The situation, with any data.</p>",
    "prompt": "<b>Justify</b> the direction ... using Q and K.",
    "checklist": ["Rubric line the student ticks", "...", "..."],
    "earns": { "answer": "A model answer that earns the point", "why": "Why it earns it" },
    "misses": { "answer": "A plausible answer that does not", "why": "Why it misses (the reader-report error)" } } ] }
```

- Id `u<unit>-<words>`; the prompt lives in its unit's file; `topic` is in that unit; `practice` a
  skill id; `skill` one of `JUSTIFY_SKILLS` (coulomb, imf, q-vs-k, entropy, kinetics, titration,
  electrochem, particle, procedure), the trainer's filter.
- 2-4 checklist lines; a bold task verb in `prompt`; `earns` fuller than `misses`; no "disorder" in
  a model answer; the ordering rule at unit level (nothing taught after the unit's last topic).
- Served as `assets/justify.json` for published units, in course order; the first
  `FREE_JUSTIFY` (3) carry `free: true` and are open to everyone, the rest are Premium
  (`ApChemCore.locked()`). Self-checks: `apchem_prefs_v1.justify`; drafts: `apchem_frq_drafts_v1`
  under `justify:<id>`. The check wants 30+ prompts and one per unit.

## Exams and entry pages (free, indexable, no "ap" in any URL)

- `equations-sheet.html`: every equation and constant on the official sheet, grouped our way, with
  what it is for, when to use it and the topic that teaches it; then what the sheet leaves out
  (reduction potentials, solubility rules, Arrhenius, the zero-order law, strong acids, structure
  rules). Our own words; the equations are the standard ones (`EQ` in `apchem-entry.mjs`).
- `score-calculator.html` + `pages/score.js`: composite = 50 × (MCQ right ÷ 60) + 50 × (FRQ points ÷
  46); bands at 75 / 60 / 45 / 30, the same cut-offs as the practice exam's readiness band (a test
  holds them equal). Labelled an estimate; the page explains the method and why the real cut-offs
  are unknown.
- `unit-tests/<unit>.html`: a fixed 12-question sample per published unit (`unitSample`: up to two
  stimulus sets from different topics, then standalone apply/analyze items across topics, lesson
  check items avoided), readable without JavaScript, live with `pages/sample.js`, linking into
  practice, the timed unit test and the unit sheet.
- The course home links all three; the cram kit links the calculator and the sheet.

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
| `scripts/test/apchem-*.test.mjs` | map, build (against the fixture), core, questions (numeric grading on value, units and sig figs; `ApChemMath`), cram, exams (score estimate, form assembly and its failure modes, recomputed numbers, served data and unit tests) |
| `check-apchem-content.mjs` (exams) | exam-only items, both forms (`checkForms`), the prompts (`checkJustify`), and `checkNumbers`; only when `data/exams` or `data/justify` exists |
| `sql-migration.test.mjs` | `2026-10c-apchem.sql` adds `apchem` everywhere and matches `schema.sql` |
