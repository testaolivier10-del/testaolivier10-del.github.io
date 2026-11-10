# AP® Human Geography course: architecture

How the course is built and where everything lives. Forked from AP® Psychology as it stands on main
(`docs/appsych-architecture.md`, spec decision 1), with every shared page type (round 3 pages, course and tool
covers, dashboard design F, the textbook plain/interactive toggle, the flashcards tab, video lessons, quick
answers, the guided path, teacher classes, the score card, the vault markers, analytics hooks, no Beta label);
this file says in one line what is the same and in full what differs. Built in Phase 0 (2026-11-09); where this
file and the code disagree, the code's header comments are newer. Writing rules: `docs/aphug-authoring-guide.md`;
concept map: `docs/aphug-phase0.md`; status and decisions: `docs/aphug-spec.md`.

## Layout

```
human-geography/                         the course, at levlprep.com/human-geography/
  index.html learn.html glossary.html   as AP® Psychology ("Skills you need" in place of
  units/ lessons/ notes/ unit-sheets/   "Research skills you need")                                  generated
  practice.html review.html exams.html frq.html justify.html flashcards.html tools.html path.html
  cram.html dashboard.html search.html teachers.html videos.html   app page shells from pages.json   generated
  frq/<id>.html  tools/<slug>.html                                                                  generated
  formula-sheet.html unit-tests/<unit>.html   "Formulas you must know", free unit tests             generated
  models.html                           "Models you must know" (data/models.json + Model Studio)    generated
  figures/maps/<stimulus id>.svg        every map a page shows, drawn at build time (hug-map.js)    generated
  figures/base/*.json                   base maps: world, ten regions, Country A (build-aphug-basemaps.mjs)
  manifest.json                         "LevlPrep Human Geography" (from build-pricing.mjs)
  assets/
    hug-core.js hug-questions.js hug-lesson.js hug-nav.js hug-book.js hug-toc.js hug-home.js
    hug-math.js                         ApHugTex: TeX to MathML (the same subset)
    hug-calc.js                         ApHugCalc: the course's arithmetic (below)
    hug-grade.js                        ApHugGrade: numbers (unit optional), "Make it specific" with geography hints
    hug-map.js                          ApHugMap: maps from a data spec (below)
    hug-model.js                        ApHugModel: the model item (below)
    hug.css hug-home.css og-image.png
    pages/*.js pages/pages.css pages/entry.css
    tools/hug-tools.js hug-tools.css    tool framework (ApHugTools; drill steps num, choice, unit, model)
    tools/hug-tool-math.js              shared tool math (ApHugMath: rng, round, fmt, cell, unitCell,
                                        diagnose, diagnoseUnit; Calc() is ApHugCalc)
    tools/hug-plot.js                   ApHugPlot: data figures (SVG): line, bar, scatter, pyramid
    tools/math/<slug>.js                ONE TOOL's model (ApHugMath.<camelSlug>)
    tools/<slug>.js                     ONE TOOL's page script
    bank/ frq/ tool-data/ exams/ justify.json ...   generated
  data/                                 THE SOURCE: everything authored lives here
```

No served path contains the token "ap" (topic slugs avoid even the letters: `views-of-the-world` for 1.1, not
"maps", `transition-model` for 2.5, not "demographic"). Storage keys `aphug_progress_v1`, `aphug_prefs_v1`,
`aphug_flashcards_v1`, `aphug_flagged_v1`, `aphug_frq_drafts_v1`, `aphug_cram_v1`, `aphug_exam_date`; globals
`ApHug*`; question ids `hug-`; CSS classes `hug-`. Pass id `hug-2027`.

Gone from the fork: Psychology's statistics library (`psy-stats.js`), study summaries (the `study` stimulus and
`studyHtml`), the AAQ and EBQ (readings, restricted terms, cite hints), the 988 help note (`HELP_*`, the `help`
lesson field), the myth and mental-health language rules, the histogram and normal plots, the inferential-test
exclusions. Nothing in this course uses them.

## Math and notation

As AP® Psychology (TeX between dollar signs, MathML at build time). `\$` is the literal dollar sign: never math,
printed as `$`, read as prose by the order check (in JSON `"\\$25"`, in notes HTML `\$25`). Human geography needs only fractions, `\times`,
`\%`, `\approx` and `\text{}`: no concept owns notation in Phase 0 (an author may add a `notation` pattern to a
concept, as the map test shows for doubling time).

## `ApHugCalc` (`hug-calc.js`, pure, node and browser)

Every number a key, a tool drill or an exam item shows is a recipe `{ fn, args, pick? }`;
`ApHugCalc.evaluate(recipe)` gives it (12 significant digits), and an argument may itself be a recipe.

```
cbr(births, pop) cdr(deaths, pop)          per 1,000 people a year
rni(cbr, cdr)                               PERCENT: (CBR - CDR) / 10 (no migration in it)
rniPer1000(cbr, cdr)  growthRate(cbr, cdr, nmr)
doublingTime(rniPct)                        70 / RNI%; null (an error as a key) when RNI <= 0
netMigrationRate(in, out, pop)              per 1,000
dependency(young, old, working)  youthDependency(young, working)  elderlyDependency(old, working)   per 100 aged 15-64
sexRatio(males, females)                    males per 100 females
arithmeticDensity(pop, land)  physiologicalDensity(pop, arable)  agriculturalDensity(farmers, arable)
percentChange(old, new)  share(part, whole)
rankSize(largest, rank)                     largest / rank
gravity(p1, p2, d, k?)                      k x P1 x P2 / d^2
mapToGround(cm, denom) -> km  groundToMap(km, denom) -> cm  scaleDenominator(cm, km)
add sub mul div pow round abs min max sum mean
transitionStage({ cbr, cdr })               words, not a recipe: the DTM stage the rates are CONSISTENT with
```

Numbers in items stay small enough to work by hand (the authoring guide).

## Grading: `ApHugGrade` (`hug-grade.js`)

- `numeric(N, typed | { value, unit })`: as AP® Psychology (unit optional; named slips: × 100 missing or doubled,
  the sign, a factor of 1,000, close). Authored `mistakes` first.
- `specific(S, picks)`: every builder slot exact. Slot names with feedback words: `concept`, `place`, `scale`,
  `cause`, `link`, `effect`, `pattern`, `model`, `limit`, `sideA`, `sideB`, `degree`, `evidence`, `source`, `data`,
  `trend`, `outcome`, `kind`, plus the shared ones.
- `flags(S, text)`: hints only, never a score. Rules: `mechanism` (an explain has its link: because, so,
  therefore), `both` (a compare speaks of both sides), `degree` (explain the degree states it first), `scale` (a
  scale of analysis named), `cite` ("Source 1" or "Source 2"), `concept`, `restricted`, `context`, `forbid`,
  `directional`, `variable`, `otherThan`. The FRQ kit turns `mechanism`, `both` and `degree` on by the part's verb.

## Content formats

As AP® Psychology (lessons, notes, glossary, descriptions, pages, published), with these changes.

### Questions: `data/questions/<topic>.json`

`{ stimuli: { id: {...} }, items: [...] }`. Types: `single` (4 options in the bank), `multi`, `order`, `numeric`,
`specific`, `model`. `practice` is a skill id `1.A`-`5.D` (five categories; every skill is assessed in both
sections). Stimulus ids start with the topic (`<topic>-s<n>`): a map's picture is `figures/maps/<id>.svg`.

**Stimuli and sets.** `kind` is the set kind: `map` (a `map` spec), `data` (a `table`, a `plot` of kind line, bar,
scatter or pyramid, or a `chart`), `image` (a drawn scene: `image: { figure?, alt, caption? }`; until it is drawn,
a placeholder box carries the alt text; a figure is a LevlPrep original SVG, never a photo) or `text` (`text`, the
passage). Every table, plot or chart is `invented: true` ("Invented data for practice") or has a `source` with a
year ("UN WPP 2024, 2024 estimates"); the content check refuses a source with no year. The bank index marks each
item's set kind (`m`, `d`, `i`, `t`).

### Map stimulus (`ApHugMap`, `hug-map.js`)

```
map: { base: 'world' | <region> | 'country-a' | 'metro', render: 'reference' | 'choropleth' | 'dot' | 'symbol' | 'isoline' | 'flow',
       label: 'alt text, 20+ characters', source: 'dated' | invented: true, legendTitle,
       classes: [...2-6, low to high], values: { featureId: classIndex }, noData?, disputedOk?: 'reason',
       dots: { each, points: [[lon, lat], ...] },
       symbols: { unit, items: [{ at: featureId | [lon, lat], value }], legend?: [values] },   circle AREA ~ value
       isolines: { unit, lines: [{ value, points: [[lon, lat], ...], labelAt?: 0..1 }] },
       flows: { unit, items: [{ from, to, value, bend? }], legend?: [values] },   1 to 12 arrows, width ~ value
       labels?: 'codes' | 'names', labelOnly?: [featureId],                    area names or codes at centers
       focus?: [featureId], marks?: [{ at, text }] }
```

Bases (`human-geography/figures/base/`, from Natural Earth 1:110m via the `world-atlas` package, projected with
Equal Earth and simplified by `scripts/build-aphug-basemaps.mjs`; committed, never fetched from outside): `world`
(1000 x 437, Antarctica left off), the regions `north-america`, `latin-america`, `europe`, `russia-central-asia`,
`north-africa-sw-asia`, `sub-saharan-africa`, `south-asia`, `east-asia`, `southeast-asia`, `oceania` (600 wide;
neighbors drawn as grey context), and `country-a` (an invented country of eight provinces, for the local scale).
Feature ids are slugs of the official short names (`turkiye`, `viet-nam`, `cote-d-ivoire`); Western Sahara,
Northern Cyprus, Somaliland, Kosovo, Taiwan, Palestine and the Falkland Islands (Islas Malvinas) carry
`disputed: true`. Invented bases: `country-a` (eight provinces, two-letter `code`s: NH, LD, EP, CR, WU, CV, SF,
SC) and `metro` (600 x 420: `central-city` inside its bold city limit, eight suburbs `northfield` ... `fairview`,
the grey `rural` fringe, `river`, `rail` with `station-1` to `station-6`, `ring-road`, `highway-west`; lines and
stations are features a mark can point at, never areas a choropleth may color, and always listed in the legend).
`node scripts/build-aphug-basemaps.mjs --invented [--check]` rewrites or checks those two without the atlas. A flow
map's arrows bend to one side (opposite flows bend apart), take their width from the value (legend: three sample
widths drawn at the map's scale), keep heads within a third of a short arrow, and stop short of area labels.
Legend numbers carry thousands separators (`ApHugMap.num`). To list ids: `node -e "console.log(require('./human-geography/figures/base/world.json').features.map(f=>f.id).join(' '))"`.

The build (`mapHtml` in `scripts/lib/aphug-build.mjs`) writes the picture as an SVG file with fixed colors (an
`<img>`, on a white card in both themes) and puts every word in HTML at the page's size: the marks and isoline
values laid over the picture by percent (`overlay`, a mark near the top edge drops below its point), the legend
under it (`legendHtml`: swatches, the no-data hatch, graduated circles drawn at the map's scale), and a caption
with the source line, the border note ("Borders follow Natural Earth's de facto lines (public domain data); they
show no position on any disputed territory." or, on Country A, "An invented country for practice."), "Base map:
Natural Earth" and "Open the map full size". `ApHugMap.check` refuses a map that cannot be read at 360 px: a label
under 20 characters, a thematic map with no dated source or `invented`, a value on a disputed place without
`disputedOk`, marks or values whose 360 px label boxes touch, a mark longer than 3 characters on the world map (22
on a region), bad classes. Cartograms are not a rendering yet: draw them as figures (needs-author `map-renders`).

**Enlarge.** `figureImg` adds an Enlarge button to every figure without hidden labels (not to model drawings);
under 760 px it shows under the drawing, and a tap on a drawing shown under 85% of its own width does the same:
`hug-nav.js` opens a full-screen dialog with the drawing at its own width (scroll or pinch; Close or Esc).

### Population pyramid (`ApHugPlot` kind `pyramid`)

`{ kind: 'pyramid', label, groups: ['0-4', ...], left: [...], right: [...], max?, leftLabel?, rightLabel?, xLabel }`:
males left, females right, youngest at the bottom, the age groups in a gutter between the halves (no label on a
bar), ticks reading outward from 0 on each side. Data figures draw at 300 px wide so their text stays near full
size in a card on a phone.

### Model items (`ApHugModel`, `hug-model.js`)

```
{ type: 'model', ..., model: { layout: 'rings' | 'sectors' | 'stages' | 'tiers' | 'free', title?, center?,
    unit?, slots: [{ id, name?, box?: [x%, y%, w%, h%] }], pieces: [{ id, text }], key: { slotId: pieceId },
    slips?: [{ piece, slot, why }], groups?: [[slotId, ...]], figure?: 'figure id (free)' } }
```

A bank item with `layout: 'free'` names its drawing in `model.figure` (a `data/figures` id); the build adds
`modelFigure` (the figure's markup) for pages and the static HTML, and lists a missing figure as a problem. A free
layout draws a numbered badge centered in each slot's box on the drawing and lists the places under it with the
same numbers (no place sits on the drawing); with no figure (a trainer drawing on its stage) only the list shows.
`groups` makes slots interchangeable: a piece keyed to any slot of a group is right in any of them (the slip names
the group). Rings count from the center out; sectors clockwise from the top; stages first to last; tiers top to bottom. The
drawing shows only numbers; the places are a list of buttons beside it (below it on a phone) with their names
("Ring 1 (innermost)", or the authored `name`), and the pieces a tray of buttons: tap or click a piece, then its
place (Enter and Space work on both), or drag a piece onto a place with a mouse or a finger; a filled place
tapped again sends its piece back. Graded by piece and position: `grade(model, placed)` gives
`{ valid, correct, right, total, score, results, slip }`; the first wrong place names its slip (an authored
`slips` entry, else "A and B are swapped", "X is one ring off: it belongs in Ring 2", "X belongs in Ring 4, not
Ring 2", "X is not part of this model", "Nothing is placed in Ring 3"). The check refuses fewer than two or more
than eight slots, a slot without a key, a piece keyed twice, more than three distractors, a piece over 40
characters, a slip that is the right answer. Used the same way by bank items, lesson check items
(`hug-questions.js` `modelItem`) and drill steps (`{ kind: 'model', model, figureHtml? }` in `ApHugTools.drill`;
`o.mixedLabel` names the kind picker's first option, "Any kind" by default).

### numeric

`numeric: { from, unit?, places?, tol?, rel?, mistakes?: [{ value | from, why }] }`; `from` is required (an
`ApHugCalc` recipe; a typed `answer` that disagrees fails the content check).

### specific

As AP® Psychology; `write` takes the flags above.

### FRQ: `data/frq/<id>.json`

```
{ id, type: 'none' | 'one' | 'two', title, points: 7, units, topics, practices,
  stimuli: [ 0, 1 or 2 stimuli, each as a bank stimulus (kind map | data | image | text) ],
  parts: [{ label: 'A'..'G', verb: 'identify' | 'define' | 'describe' | 'explain' | 'compare' | 'explain-degree',
            prompt, points: 1, rubric: [{ point, accept: [...] }], sample, write? }] }
```

Exactly seven one-point parts A to G; the prompt uses its verb; one rubric line; the sample does what the verb
demands (the content check reads it: an explain with its link, a compare with both sides, a degree stated first, a
describe longer than a name). The build serves `readings` (titled "Source 1" and "Source 2" when there are two) and,
per part, `verbName` and `demand` from `VERBS` in `scripts/lib/aphug-exams.mjs`. The FRQ page shows each part's
verb as a pill and its demand under the prompt, lined space for print, then (on request) one rubric line per point
and the full-credit sample; the answer box gives the verb's live hints. An FRQ unlocks with the latest of its
topics in course order and may use nothing taught after it: it is live when every unit it lists is published, and
its page's Premium gate (`data-unit`, `data-topic`) is that latest topic and its unit (`units[0]` stays its main
unit for lists and tallies).

### Plot spec (`ApHugPlot`)

As AP® Psychology's `line`, `bar` and `scatter` (with `trend`), plus `pyramid` (above). Colors: course teal
`#094953` (dark `#8CCFD9`), then vermillion `#C24E00`, green `#009E73`, reddish purple `#A8508A`, purple `#7A4F9E`.

## Generator: `scripts/build-aphug.mjs` (+ `scripts/lib/aphug-build.mjs`, `aphug-entry.mjs`, `aphug-exams.mjs`, `aphug-mathlib.mjs`)

As AP® Psychology (`--check`, `--out <dir>`, `APHUG_PUBLISHED=unit-1`, `APHUG_DATA=<dir>`), plus:

- `prepareBank` recomputes every numeric key and mistake value from its recipe, prepares specific slots and checks
  every model.
- Maps: `loadCourse` reads the base maps (`loadBases`); `stimulusBody` draws every map once into `C.maps`; the build
  writes them last as `figures/maps/<id>.svg` (an owned directory: a map no page uses is removed).
- Free lessons: `FREE_UNITS` (`geo-skills`, `unit-1`) and `FREE_TOPICS` (2.1 to 2.5), spec decision 6.
- Home: from `IDENTITY` (headline "from local to global.", the teal accent, the globe icon, first rank Map Reader)
  and `scripts/lib/course-homes.json` `aphug`.
- `formula-sheet.html` "Formulas you must know": `EQ` in `aphug-entry.mjs` (births, deaths and growth; age and
  sex; density; cities and interaction; map scale), each row naming its `ApHugCalc` recipe with a worked line
  computed at build time; the same rows are the "Formulas" flashcard deck (`assets/formulas.json`, ids `eq:<recipe>`).
- FRQ pages: the type ("Q1: No stimulus", "Q2: One stimulus", "Q3: Two stimuli"), "no calculator", about 25 minutes,
  the stimuli, every part's verb and demand, lined space per part.
- No `score-calculator.html`, no readiness band.

## Runtime differences from AP® Psychology

| File | What changes |
|---|---|
| `hug-questions.js` | The `model` type (render, grade, review); stimulus kinds labeled Map, Data, Image, Text. Answered event `hug:answered`. |
| `hug-core.js` | Set codes `m`, `d`, `i`, `t` in the lazy index; mastery by skill category. |
| `pages/exams.js` | `MCQ_PARTS` 60 in 60 min; `FRQ_PARTS` 3 in 75 min, 7 points each; a fixed form's bank items get their fifth option from the form's `fifth` map; model items reviewed; **no band**. |
| `pages/cram.js` | Default exam 2027-05-03; the 60 + 3 format; timed sets at 1 minute a question. |
| `pages/frq-kit.js` | The three types; 0-2 stimuli titled by kind; the verb pill and demand on every part; the verb's live hints. |
| `pages/practice.js`, `dashboard.js`, `flashcards.js`, `search.js` | Filters for numeric, specific, model and the four set kinds; FRQ type names; skill categories; the "Formulas" deck. |
| `hug.css` | Teal tint on `body.hug`; maps (picture card, marks, legend, caption), drawn-scene placeholder, the verb pill, the model item; the study, myth and help styles are gone. |
| `tools/hug-plot.js` | `pyramid` added (gutter labels, outward ticks, no vertical axis); `histogram` and `normal` removed; data figures default to 300 px wide; the y-axis name in its own band above the plot; one 0 at a shared corner. |
| `tools/hug-tools.js` | The `model` drill step (with `figureHtml`); `mixedLabel`. `hug-tools.css`: the model item one column in the Studio dock. |

## Tools

Eight trainers (`docs/aphug-spec.md` section 6) plus the written-answer trainer (`justify`), registered in
`human-geography/data/pages.json` with `studio: true` and scaffolded in Phase 0: a stub model (`stub: true`), page
script, validator and test per slug; nothing builds until `human-geography/data/tools/<slug>.json` exists and its
topic is published. Free: `model-studio` (it gates its own Premium parts: free is Explore plus the demographic
transition drills), `scale-lab`, `map-reader`; the rest `premium: 'tools'`. Each slug owns four files:

```
human-geography/assets/tools/math/<slug>.js   the model: ApHugMath.register('<camelSlug>', {...})
human-geography/assets/tools/<slug>.js        the page script (ApHugTools.frame ...)
scripts/lib/aphug-tool-checks/<slug>.mjs      the validator for data/tools/<slug>.json
scripts/test/aphug-tool-<slug>.test.mjs       its tests
```

Slugs and topics: `model-studio` (transition-model), `frq-coach` (skills-frq), `scale-lab` (scales-of-analysis),
`map-reader` (views-of-the-world), `population-lab` (population-composition), `diffusion-lab` (diffusion-types),
`borders-lab` (defining-boundaries), `city-lab` (von-thunen). `_shared.mjs` loads `hug-math.js`, `hug-calc.js`,
`hug-grade.js`, `hug-map.js`, `hug-model.js`, `hug-tool-math.js` and `hug-plot.js` in a vm (`runtime(slug)` returns
`{ M, Tex, Calc, Grade, Plot, Map, Model, model }`). Tool pages load `hug-map.js` with the shared scripts. Drill steps: `num`, `choice`, `unit` and `model` (a setup step
is refused by `_drills.mjs`; a model step is checked and its key must grade right). Tool covers
(`assets/covers/tools/aphug/`) come with each trainer in Phase 2.

## Practice exams: `data/exams/forms.json`

Checked by `checkForms` (`scripts/lib/aphug-exams.mjs`): at least two forms; Section I is 60 single-answer
questions of five options (an exam-only item has five; a bank item gets its fifth from the form's
`fifth: { id: { text, why } }`, put in at `fifthAt(id)` by `examVersion`, the key moving with it), whole sets in
authored order, set counts within `EXAM_SETS` (map 1-4, data 1-4, image 0-3, text 0-3: the official counts are
not published, needs-author `mcq-sets`), 30 to 40 percent of questions with a stimulus (`EXAM_STIMULI`), 6 to 16
exam-only questions (`EXAM_ONLY`), each unit within its weight range of 60 (Unit 1 4 to 6, the others 7 to 11);
Section II is the three FRQs in the order none, one, two, 7 points each, sharing no unit; no question or FRQ in
two forms. Skill weights checked only when the map sets `practicesConfirmed`. Also checked: `checkFifth` (one
fifth per bank question of the form, none elsewhere, no repeat, never on a fixed item), `checkReads` with
`EXAM_READS` (every exam-only map, pyramid or symbol read recomputed from its data), `checkNumbers` with
`EXAM_NUMBERS` and `JUSTIFY_NUMBERS` (ApHugCalc), and, in `check-aphug-content.mjs`, each form as served
(`servedForm`): the length tell, the key position (`keyPositionTell`), the test-wise limits and `keyRisks` (no
key that names a disputed place or is an undated real figure).

Exam-only items live in `data/exams/items.json` (`hug-exam-<form>-<nn>`, stimuli `exam-<form>-s<n>`, any stimulus
kind, maps drawn like bank maps). The build serves, for each published form, every question it uses in
`assets/exams/items.json` with five options and explanations inline (a bank question in its exam version) and
every stimulus they read; `assets/exams/forms.json` carries only ids, titles and FRQs. `pages/exams.js` treats
only `hug-exam-*` as exam-only (kept out of Review). Results show Section I and Section II apart, each 50% of the
exam; no composite, no band. The free unit tests (`unitSample`) never show a form question or a set one of them
belongs to.

## "Make it specific": `data/justify/<unit>.json`

As AP® Psychology; `skill` is one of `describe`, `explain`, `compare`, `degree`, `place`, `scale`, `limitation`,
`model`, `legend` (read the legend: class, unit, what a shade or symbol stands for). The checker refuses an explain
whose model answer has no link, a compare with one side, a degree not stated first, a scale answer with no scale
named, a builder slot without a `why`, and anything taught after the unit (the ordering scan is strict: "city",
"map", "farm", "survey" and "population" belong to the topics that teach them). Files: one per chapter
(`geo-skills.json`, `unit-1.json` to `unit-7.json`), 8 to 12 prompts a unit and 3 to 6 in the skills chapter
(`JUSTIFY_PER_CHAPTER`, `JUSTIFY_PER_SKILLS_CHAPTER`); ids `u<n>-<words>`, `gs-<words>` for the skills chapter;
the first 3 in course order are free.

## Models you must know: `models.html`

Built by `entryPages` (`modelEntries` and `modelPicture` in `scripts/lib/aphug-entry.mjs`) from Model Studio's
contexts (`data/tools/model-studio.json`: picture, claim, assumptions, first limit) and `data/models.json`
(`order`, `studio.<id>`: a dated `example` and `confuse: [[modelId | null, how]]`; `extra.<id>`: a model written
in full, with its own `model` spec). The Model Studio math (`assets/tools/math/model-studio.js`) runs at build
time through `aphug-tool-checks/_shared.mjs` `runtime`; free layouts use its figures, the others
`ApHugModel.artSvg`; the page loads `assets/tools/model-studio.css` for the figure styles and `pages/entry.css`
for its own. Free, indexable once the course is.

## Registration

Registered hidden in Phase 0 (2026-11-09), Premium `onSale: false` until the launch steps. Hidden means: no hub
card, 404 card, premium.html entry, search scope or sitemap entry; the generated course lists include it. Files:
`assets/courses.js` (key `aphug`, order 15, short "Human Geography", aliases `human-geography`, `geography`,
`humangeo`, `hug`, status `hidden`) and the generated blocks (`node scripts/build-courses.mjs`); `assets/premium.js`
(`COURSES.aphug`, pass `hug-2027`, $25 through 2027-06-30, `freeChapters: ['geo-skills', 'unit-1']`, `onSale:
false`); `assets/exam-date.js` (2027-05-03); `assets/hub-progress.js` ranks; `assets/site-search-all.js` (source,
`urlKey`); `assets/tutor.js` (pages, starters, greeting); `assets/course/flags.js`, `study.js`; `assets/theme.css`;
the cover CSS in `assets/course/hub.css`, `r3.css`, `book.css`, `glossary.css`, `reading.css`, `r3-reading.css`,
`study.css`, `path.css`, `assets/class/class.css`; `tool-studio.css` (`.hug-crumb`); `assets/covers/aphug.svg`,
`art/aphug.svg`, `thumb/aphug.svg` (provisional); `index.html` and `404.html` markers (`hub-hug`, `nf-hug`);
`search.html` tints; `sw.js` (`COURSE_URLS['human-geography']`, cache v118); `worker/src/premium.js`
(`PASSES['hug-2027']`, `URL_COURSE`, `COURSE_NAMES`), `worker/src/index.js` (`COURSE_RULES.aphug`),
`worker/dist/worker.js` rebuilt; teacher classes (`assets/class/class-model.js` `COURSES` and `ORDER`,
`class-run.js` `PREFIX`, the class functions' course patterns in the SQL); the guided path
(`scripts/build-paths.mjs` `AP`, `assets/path/aphug.json`, `human-geography/path.html`; `r3-home.mjs` draws no path
skeleton for a course with nothing published); `assets/milestones.js`; `scripts/vault/rules.mjs` (`AP`:
human-geography lessons outside the free tier are vaulted by their `free` marker); `scripts/sql/migrations/2026-11j-aphug.sql`
(NOT applied) with `schema.sql` and `reports.sql`; `scripts/build-pricing.mjs` (hub and 404 cards, manifest,
`count:` exemption), `lib/premium-data.mjs` (counts), `lib/pricing-section.mjs`, `lib/course-homes.json`,
`lib/covers.mjs`, `lib/r3-home.mjs`, `lib/r3-inner.mjs`, `lib/r3-tools.mjs`, `lib/r3-reading.mjs`,
`lib/dashboard-page.mjs`, `lib/practice-panel.mjs`, `lib/videos.mjs`, `lib/app-pages.mjs` (noindex app pages),
`add-video.mjs`, `build-from-video.mjs`, `build-og-images.mjs` (`human-geography/assets/og-image.png`),
`build-og-tags.mjs`, `build-sitemap.mjs`, `check-console.mjs`, `check-site.mjs`, `check-overlap.mjs`,
`check-weight.mjs` (site shell 349 -> 349.8 after AP® Microeconomics, course shell 80, page and data budgets, every map file),
`check-a11y.mjs` sample pages, `.github/workflows/checks.yml`, `scripts/ci-local.sh`. Not yet: `sources.html`, the
AI FRQ grader's `FRQ_COURSES` (it grades 10-point rubrics; seven one-point parts need their own calibration,
needs-author `frq-grader`), the `check-console.mjs` practice flow; all at launch.

## Checks

```
node scripts/build-aphug.mjs --check
node scripts/check-aphug-map.mjs --check            nothing used before it is taught
node scripts/check-aphug-content.mjs --check        formats, recomputed keys, maps, models, sets, FRQ verbs, language, forms
node scripts/build-aphug-basemaps.mjs --atlas <countries-110m.json> --check   the base maps (needs world-atlas 2.0.2)
node --test scripts/test/aphug-*.test.mjs           map, build, calc, core, cram, exams, integration, maps, math, model, plot, questions, syntax, tools
scripts/ci-local.sh                                 all of the above (also .github/workflows/checks.yml)
```
