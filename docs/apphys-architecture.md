# AP® Physics 1 course: architecture

How the AP® Physics 1 course is built. `docs/apphys-spec.md` says what the course must do; this
file says where each piece lives and what format its data takes. Content authors need "Content
formats" and `docs/apphys-authoring-guide.md`; tool authors need "Tools". The course is a fork of
AP® Chemistry (spec decision 1): `docs/apchem-architecture.md` describes the template and still
applies where this file is silent. Only the differences are spelled out here.

## Layout

```
physics/                                the course, at levlprep.com/physics/
  index.html learn.html glossary.html   home, textbook (units, then "Math you need"), glossary   generated
  units/<unit>.html  lessons/<topic>.html  notes/<topic>.html  unit-sheets/<unit>.html       generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html
  cram.html dashboard.html search.html teachers.html   app page shells from pages.json        generated
  frq/<id>.html  tools/<slug>.html                                                             generated
  equations-sheet.html score-calculator.html unit-tests/<unit>.html   free entry pages          generated
  figures/<id>.svg                      our own SVGs only (no OpenStax, spec decision 4)
  manifest.json                         "LevlPrep — Physics" (no mark), fields from build-pricing
  assets/
    phys-core.js phys-questions.js phys-lesson.js phys-nav.js phys-book.js phys-toc.js phys-home.js
    phys.css phys-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css     app pages (as AP® Chemistry)
    tools/phys-tools.js phys-tools.css             tool framework (ApPhysTools)
    tools/phys-tool-math.js                        shared tool math (ApPhysMath: helpers only)
    tools/phys-scene.js                            scene helpers (ApPhysScene: arrows, loop)
    tools/math/<slug>.js                           ONE TOOL's model (ApPhysMath.<camelSlug>)
    tools/<slug>.js                                ONE TOOL's page script
    phys-curriculum.js glossary.json notes-index.json summaries.json                           generated
    bank/<unit>.json bank/<unit>-why.json bank/index.json frq/index.json frq/<id>.json         generated
    tool-data/<slug>.json exams/forms.json exams/items.json justify.json                       generated
  data/                                 THE SOURCE: everything authored lives here
    lessons/<topic>.json notes/<topic>.html glossary/<topic>.json figures/<topic>.json
    labels/<figure>.json questions/<topic>.json frq/<id>.json tools/<slug>.json
    exams/forms.json exams/items.json justify/<unit>.json
    pages.json published.json descriptions.json
```

No path under `physics/` contains the token "ap". Storage keys, analytics names and the registry
key are `apphys`; browser globals start `ApPhys`; question ids start `phys-`; CSS classes start
`phys-`. URLs name the course by its folder, `physics` (site search `?course=physics`, Polar return
`course=physics`). Pass id `phys-2027`.

## Generator: `scripts/build-apphys.mjs` (+ `scripts/lib/apphys-build.mjs`)

As AP® Chemistry's (`node scripts/build-apphys.mjs`, `--check`, `--out <dir>`), plus:

- `APPHYS_PUBLISHED=unit-1,skills-math` overrides `published.json`; `APPHYS_DATA=<dir>` reads
  authored data from another folder (tests use `scripts/test/fixtures/apphys-data`, the placeholder
  sample; it never ships).
- The map is `docs/apphys-dependency-map.json` (`docs/apphys-phase0.md`). A skill topic is placed by
  `before`; it publishes when its own chapter and its anchor's chapter are both published.
- Free lessons: Units 1 and 2 and every "Math you need" topic (`isFreeTopic`; `freeChapters` in
  `assets/premium.js`).
- Home: "AP® Physics 1, one force at a time.", amber part colors, the trainers band with the
  pendulum icon (only when a trainer is live), ranks starting at "Point Particle". `SAMPLE_Q` is
  `phys-motion-quantities-1` (a free Unit 1 single item; until it exists the card is left out).
- No periodic table: the head and `tail()` load nothing from `ochem/`.
- FRQ types are `mr`, `tbr`, `lab`, `qqt` (below); the FRQ page gives each part its paper space.
- Stimulus kind `diagram` is labeled "Diagram".
- **Tools** are built only when `data/tools/<slug>.json` exists AND the tool's context `topic`
  (in `pages.json`) is published; until then nothing is written for the tool and the curriculum's
  `ApPhysToolList` lists it with `arrives: "Unit N"`. The tool page loads, in order:
  `phys-questions.js`, `tools/phys-tool-math.js`, `tools/math/<slug>.js`, `tools/phys-tools.js`,
  `tools/phys-scene.js`, `tools/<slug>.js`.

## Runtime (`physics/assets/`, every global `ApPhys*`)

Forked from `chem/assets/` with the names changed. Differences:

| File | What changed |
|---|---|
| `phys-questions.js` | Numeric grading as AP® Chemistry (value, units, sig figs, each a mark) with **physics units**: `normUnit` reduces to SI base units, so N = kg·m/s², J = N·m = kg·m²/s², W = J/s, Pa = N/m², Hz = 1/s, rad is dimensionless (rad/s = 1/s), and words (newtons, meters, joules, degrees) are read. A prefixed unit stays itself (cm is not m), so `scaleTo` names a cm-for-m or kJ-for-J slip. An angle asked in rad needs "rad". **`gAlt`** (below). Targeted feedback, in this order after authored `mistakes`: g = 9.8 vs 10 (the key times 10/9.8, its square or square root, within 0.4%), factor of 100 (cm and m), 1000 (kilo, milli), sign, factor of 2 (½mv², ½kx²), a missing square, a missing square root, degrees vs radians. |
| `pages/exams.js` | Section I 42 MCQ in 85 min (`MCQ_SEC` = 85·60/42); Section II 4 FRQs in 95 min, one of each type in the order mr, tbr, lab, qqt, with suggested times in proportion to points (23.75, 28.5, 23.75, 19 min); readiness band 50% MCQ + 50% FRQ, "Not calibrated". |
| `pages/frq-kit.js`, `frq.js`, `dashboard.js`, `search.js` | The four FRQ types (`ApPhysFrq.TYPES`, `ORDER`); drawing parts (`drawSpec`) as well as graph parts. |
| `pages/cram.js` | Default exam date 2027-05-05; 42 + 4 format text; timed sets at the exam pace (85/42 min a question); justification prompts on study and weak-spot days. |
| `pages/score.js` | `ApPhysScore`: composite = 50 × (MCQ ÷ 42) + 50 × (FRQ points ÷ 40); bands **70/55/41/31**, estimates fitted to the 2025-2026 score distributions (needs-author `score-cutoffs`); a test holds them equal to the practice exam's band. |
| `tools/phys-tools.js` | `ApPhysTools`, forked from `ApChemTools` (frame, `modes` Explore / Test yourself, `studioPane`, `drill`, `keepGoing`, `cue`, `moreHtml`, `explain`, `plot`, `slider`, `questions`, `frq`); no ICE rows or live beaker. The Details tab title comes from `#app[data-details-title]`. |
| `phys.css` | The amber tint (`--ctint` `#FBEED5`, `--cink` `#734200`; dark `rgba(235,165,50,0.10)` / `#F5CF8A`), the same values as `body[data-course="apphys"]` in `assets/theme.css`. |

Storage: `apphys_progress_v1`, `apphys_flashcards_v1`, `apphys_prefs_v1`, `apphys_frq_drafts_v1`,
`apphys_cram_v1`, `apphys_exam_date` (default 2027-05-05 in `assets/exam-date.js`).

## Content formats

As `docs/apchem-architecture.md` ("Content formats"), with these differences.

### Questions

- `practice` is a physics skill id: `1.A`-`1.C`, `2.A`-`2.D`, `3.A`-`3.C`. **Practice 1 (Creating
  Representations) never on a single or multi item** (it is free response only); MCQ is mostly
  practice 2.
- Stimulus kinds: `table`, `graph` (chart drawn at build time), `setup`, `model`, **`diagram`**: a
  physics scene (a block on an incline, two carts, a beam on a pivot), as an inline SVG with
  `role="img"` and an `aria-label` of 20+ characters, or a registered figure (`"figure": "<id>"`).
  Tool authors can build the SVG with `ApPhysScene` at authoring time.

**Numeric** (`numeric`), the fields of AP® Chemistry plus:

| Field | Meaning |
|---|---|
| `unit` | SI unit as the answer is reported (`"m/s"`, `"m/s^2"`, `"N"`, `"J"`, `"W"`, `"Pa"`, `"kg·m/s"`, `"rad/s"`, `"kg·m^2"`); any equivalent SI spelling is accepted |
| `gAlt` | optional: the key worked with the **other** value of g (10 m/s² for an item that uses 9.8, or the reverse). A value within the item's tolerance of `gAlt` is graded right, with the note "you used the other value of g". Must be within 6% of `answer` and written to the same sig figs. Use it whenever the item does not state g; leave it out when the item states the value to use (then a g slip gets feedback, not credit). |

Policy for g (needs-author `g-policy`): every item that uses g either states the value in the stem
("Use g = 9.8 m/s².") or carries `gAlt`. The equations sheet prints 9.8; the CED accepts 10.

### FRQ: `data/frq/<id>.json`

```json
{ "id": "frq-cart-ramp-energy", "type": "tbr", "points": 12,
  "title": "A cart on a ramp", "units": ["unit-3"], "topics": ["energy-conservation"],
  "practices": ["1.A", "2.A", "3.C"], "stimulus": { "kind": "diagram", "title": "...", "html": "<svg ...>" },
  "drawSpec": { "kind": "bars", "label": "Energy bar chart at the top and the bottom", "bars": ["K", "U_g", "U_s"] },
  "graphSpec": { "type": "line", "x": { "label": "Position", "unit": "m" }, "y": { "label": "Energy", "unit": "J" } },
  "parts": [{ "label": "a", "prompt": "<b>Draw</b> ...", "points": 3, "space": "draw",
              "rubric": [{ "point": "...", "accept": ["..."] }], "sample": "..." }] }
```

| `type` | Name | Points | Must have |
|---|---|---|---|
| `mr` | Mathematical Routines | 10 | |
| `tbr` | Translation Between Representations | 12 | a `drawSpec` or a `graphSpec` |
| `lab` | Experimental Design and Analysis | 10 | a `graphSpec` (the student plots data) |
| `qqt` | Qualitative/Quantitative Translation | 8 | |

- **`drawSpec`** (a drawing on paper; the exam's booklet is handwritten): `{ kind, label, bars? }`
  with `kind` `fbd` (a blank box with a dot for the object), `bars` (a bar chart with the named
  columns and a zero line) or `box` (a blank box). `label` (10+ characters) is the box's text
  alternative. On screen the student is told to draw it on paper or in the printed booklet.
- **`graphSpec`** as AP® Chemistry: a blank grid on paper.
- A part's **`space`**: `"draw"` (needs `drawSpec`), `"graph"` (needs `graphSpec`) or `"lines"`. If
  left out, a part whose prompt says graph/plot/construct gets the grid when there is a graphSpec,
  else lines.
- One rubric line per point; a sample for every part; `placeholder: true` labels a test question.

### Glossary, figures, labels, descriptions

As AP® Chemistry, under `physics/data/` and `physics/figures/`.

### Pages and published

- `pages.json`: `{ apps: [...], tools: [...] }`. **All eleven trainers are pre-registered** in
  `tools[]` (Phase 0): `{ slug, kind, topic, name, title, desc, blurb, lede, premium?, studio: true }`.
  `topic` is the tool's context topic (the check wants it in the map). Free (spec section 6):
  `free-body-diagrams`, `motion-graphs`, `scaling-drills`; the rest carry `"premium": "tools"`.
- `published.json`: `{ "chapters": [] }` until Unit 1 is written and checked.

## Tools

Built so **four tool authors can work in parallel without touching the same file**. A tool is six
files, all named after its slug and owned by that tool alone:

| File | What |
|---|---|
| `physics/data/pages.json` `tools[]` | the registration (already written in Phase 0; edit only your entry) |
| `physics/assets/tools/<slug>.js` | the page script: `ApPhysTools.mount('<slug>', (app, data) => ...)` |
| `physics/assets/tools/math/<slug>.js` | the model: `ApPhysMath.register('<camelSlug>', { generate, ... })`, pure, SI units |
| `physics/data/tools/<slug>.json` | the content: `{ slug, kind, topic, intro, howItWorks, contexts: [{ id, topic, ... }], ... }` |
| `scripts/lib/apphys-tool-checks/<slug>.mjs` | the validator: `export function check(data, map) -> problems` |
| `scripts/test/apphys-tool-<slug>.test.mjs` | the tests |

Phase 0 wrote all of them as placeholders except the data file; the generator builds a tool only
once its data file exists and its context topic is published, so a half-made tool never ships.
The slugs: `motion-graphs`, `projectile-lab`, `free-body-diagrams`, `energy-bar-charts`,
`collision-lab`, `torque-balance`, `rotation-lab`, `oscillator-lab`, `fluids-tank`, `lab-design`,
`scaling-drills` (camel names `motionGraphs` … `scalingDrills`).

**Shared, edit only by agreement** (no tool needs to): `phys-tools.js/.css`, `phys-tool-math.js`,
`phys-scene.js`, `_shared.mjs`, `_drills.mjs`.

### Shared math: `ApPhysMath` (`tools/phys-tool-math.js`)

| API | |
|---|---|
| `C` | `{ g: 9.8, G_ALT: 10, G: 6.67e-11, ATM: 1.0e5 }` (the equations sheet) |
| `g(item)` | the item's or context's `g` (9.8 or 10), else 9.8 |
| `round(x, d)`, `fixed(x, d)`, `sig(x, n)`, `fmt(x, n)` | rounding; `fmt` writes a × 10ⁿ and a real minus |
| `rng(seed)` | seeded (mulberry32): `r()`, `r.int(a, b)`, `r.pick(list)`, `r.between(a, b, sigfigs)` |
| `near(x, a, rel, abs)`, `cell(answer, rel, mistakes, abs)` | a drill step's number; mistakes graded right are dropped |
| `diagnose(cell, x)` | `{ ok, why? }`: authored slip, else sign, g 9.8/10, factor 2, missing square / root, 100 (cm), 1000, degrees/radians |
| `vec.add/sub/scale/len/angle/fromPolar/components/sum` | 2D vectors, angles in degrees from +x |
| `deg(r)`, `rad(d)` | angle conversions |
| `register(name, model)` | how a model file adds itself; throws if the name is taken |
| `camel(slug)` | `"free-body-diagrams"` → `"freeBodyDiagrams"` |

### Scene helpers: `ApPhysScene` (`tools/phys-scene.js`)

| API | |
|---|---|
| `svg(w, h, label, inner)` | an `<svg class="phys-scene">` string with `role="img"` and the label (20+ characters, or it throws) |
| `arrow(x, y, dx, dy, { cls, label, width, dashed, head })` | an arrow string from (x, y) to (x+dx, y+dy) in SVG pixels; a zero arrow is a dot. `cls`: `f-grav`, `f-normal`, `f-tension`, `f-friction`, `f-spring`, `f-applied`, `f-buoy`, `vel`, `acc`, `net` (colors in `phys-tools.css`, light and dark). `label` `"F_g"` renders F with subscript g |
| `vector(origin, v, scale, o)` | `arrow` from a physics vector (y up) at `scale` px per unit |
| `toSvg(x, y, { x0, y0, ppm })` | physics meters (y up) to SVG pixels |
| `forceLabel(type, agent, on)` | `"F_g, Earth on block"`, the authoring guide's FBD label |
| `el(tag, attrs, parent)` | a live SVG element, for redraws |
| `loop(step, { duration, still, onEnd })` | `{ start, stop, reset, running, once, time }`; `step(dt, t)` per frame, dt in s (max 0.05). **Reduced motion** (site toggle or OS): `start()` draws the end state (`still(duration)`) instead of animating |
| `reduced()` | whether motion is off |

Every trainer: opens on Explore (a live scene, one "Start here" cue, depth behind "More options"
and "Why?"), with a seeded "Test yourself" drill (`ApPhysTools.drill`) whose first try is recorded
as `<slug>:<context>:<step>`; `studio: true` (Tool Studio: stage, dock with 1 to 3 controls, Why
and Details sheets via `studioPane`). See apchem decisions 20-23 and `docs/tools-calm.md`.

Validators use `runtime('<slug>')` from `_shared.mjs` (shared math plus that tool's model, in a
vm, cached per slug) and `frame`, `stepsSound`, `sweep` from `_drills.mjs` (300 seeds per context
and type; every key graded right, no mistake graded right, no NaN in any text).

## Practice exams: `data/exams/forms.json`, `items.json`

As AP® Chemistry with the 2027 format: Section I exactly **42** four-option single-answer items,
each unit inside `unitRange` of 42 (5-8% → 2-4, 10-15% → 4-7, 18-23% → 7-10); no practice-1 item;
Section II is exactly `["mr", "tbr", "lab", "qqt"]` in that order, none a placeholder, none in
both forms. Exam-only item ids `phys-exam-<form>-<nn>`, 12 to 14 per form, stimuli `exam-<form>-s<n>`;
every number they key goes in `EXAM_NUMBERS` (`scripts/lib/apphys-exams.mjs`), and the test grades
each one through `ApPhysQuestions.grade`. Bank items in a form are never lesson-check items (the
content check). Phase 3 forms: spec decision 10.

## Justification trainer: `data/justify/<unit>.json`

As AP® Chemistry with `practice` a physics skill id and `skill` one of `JUSTIFY_SKILLS`: `forces`,
`conservation`, `energy-momentum`, `functional-dependence`, `graphs`, `procedure`, `fluids` (the
runtime reads their names from `assets/justify.json`). 3 to 5 prompts per unit, 32 or more in all,
every skill used; every number in a prompt is listed in `JUSTIFY_NUMBERS`. The check refuses a
circular model answer ("conserved because of conservation").

## Exams and entry pages

As AP® Chemistry. The equations sheet page (`EQ` in `scripts/lib/apphys-entry.mjs`): groups
`{ h, id, rows }`, each row `[equation, what it is, when you use it, 'Unit N', topic id,
[trainer slugs]?]`; a trainer is linked only when live. Every equation, constant and the
conventions of the official sheet appear (the exams test lists them). Then the three habits (state
g, SI units, degree mode) and `NOT_ON`, what the sheet leaves out (I of shapes, escape speed,
Torricelli, Kepler's third law, minimum loop speed, the oscillator's greatest speed). The score
calculator states that its cut-offs are estimates and how they were chosen.

## Publishing a unit

1. Write every topic in `physics/data/`; `node scripts/check-apphys-content.mjs --topic <id>` until clean.
2. Independent accuracy check; record it in `docs/apphys-reviews/<unit>.md`.
3. Add the unit to `physics/data/published.json` (and `skills-math` with Unit 1). With the first unit, also set
   `status: 'beta'` on `apphys` in `assets/courses.js` (registered `'hidden'` until then, so site
   search and the hub's Continue links leave the empty course out) and run `node scripts/build-courses.mjs`.
4. `node scripts/build-apphys.mjs`, `node scripts/build-pricing.mjs`, `node scripts/build-og-tags.mjs`,
   `node scripts/build-sitemap.mjs` (hub card, 404 card, premium.html section and sitemap appear
   once a unit is published). `APPHYS_PUBLISHED=unit-1` previews without editing the file.
5. `scripts/ci-local.sh` (with `BROWSER=1` for a11y and console checks).

## Checks

| Check | What it enforces |
|---|---|
| `check-apphys-map.mjs --check` | the map (`docs/apphys-phase0.md`) and the ordering rule on pages and questions |
| `build-apphys.mjs --check` | generated files up to date; none left over |
| `check-apphys-content.mjs --check` | the formats above (4-option single items, numeric fields incl. `gAlt`, diagram stimuli, the four FRQ types with drawSpec/graphSpec rules, physics skill ids, practice 1 not in MCQ, every registered tool with `studio`, a map `topic`, and once it has data its script, model and validator), plus every AP® Chemistry rule. Only published chapters fail. |
| site rules `apphys-trademark`, `apphys-beta-and-report` | as AP® Chemistry's, for `physics/` |
| `scripts/test/apphys-*.test.mjs` | map, build (against the fixture; tool gating), core, questions (physics units, gAlt, slip feedback, `ApPhysMath`), scene, cram, exams (score estimate, 2027 format, form rules on synthetic forms), and one test per tool |
| `sql-migration.test.mjs` | `2026-10f-apphys.sql` adds `apphys` everywhere and matches `schema.sql` |
