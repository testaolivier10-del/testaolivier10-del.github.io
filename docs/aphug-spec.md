# AP® Human Geography course: spec and status

The source of truth for LevlPrep's fifteenth course. A fresh session reads this file, `CLAUDE.md`,
`docs/aphug-research/framework.md`, `market.md` and `accuracy-risks.md`, not the chat history. When the plan changes,
update this file in the same commit. Open points for a person go in `docs/aphug-needs-author.md`.

Course key `aphug` (storage, analytics, registry, SQL). URL path `/human-geography/`. Pass `hug-2027`. Every new
browser global starts with `ApHug`; question ids `hug-`; CSS classes `hug-`; files `hug-*.js`. Template: the AP®
Psychology course as it stands on main (the content-heavy fork: stimulus sets, "Make it specific" prompts, apply
the concept items, every shared page type), with `ApHugCalc` in place of `ApPsychStats`, map and model stimuli in
place of study summaries, and the three-question FRQ format below.

## 1. Owner brief (2026-11-09), condensed

- Olivier asked to "plan and build 2 more courses, do everything from start to finish by yourself". The lead chose
  AP® Microeconomics (`docs/apmicro-spec.md`, branch `claude/apmicro`, merges first) and AP® Human Geography: the
  largest AP® Exam LevlPrep does not cover (about 283,000 exams in 2025), the runner-up in the last three course
  choices, most takers 9th graders on their first AP® course, and no free Khan Academy course exists for it.
- Build it like the other courses: research, build everything, independent accuracy reviews, one PR; the lead does
  the launch steps it can and stops him only where a sign in or a payment setting needs his hands.
- Standing rules from earlier courses all apply: tools at the bar of the NREMT body map (interactive, professional
  illustration quality, simple on landing, detail revealed progressively, full screen, easy to read on a phone);
  every visual legible with no crowded or overlapping words; every course feels the same with its own identity and
  cover art; **no score calculator, no readiness band, no Beta label**; the "not yet reviewed by an AP® Human
  Geography teacher" note stays; every question is select then Check; the shared score card; the guided path;
  teacher classes cover every course.
- His earlier worry about courses not yet reviewed by experts applies most here (real-world facts, contested
  places and peoples): `docs/aphug-research/accuracy-risks.md` is binding on every author and reviewer.
- Premium pass one-time through 30 June 2027 at the AP® price ($25), founding discount as the other passes.

## 2. What the research says (details and URLs in `docs/aphug-research/`, done 2026-11-09)

**Content.** No change for 2026-27 (the CED effective fall 2020 is in force). 7 units, 68 topics: U1 Thinking
Geographically (7, 8-10%), U2 Population and Migration Patterns and Processes (12), U3 Cultural Patterns and
Processes (8), U4 Political Patterns and Processes (10), U5 Agriculture and Rural Land-Use Patterns and Processes
(12), U6 Cities and Urban Land-Use Patterns and Processes (11), U7 Industrial and Economic Development Patterns and
Processes (8); Units 2-7 are 12-17% each. Five skills: concepts and processes, spatial relationships, data
analysis, source analysis, scale analysis.

**Models the CED names** (teach, apply, give limits): environmental determinism vs possibilism; demographic and
epidemiological transition; Malthus; Ravenstein; diffusion types; centripetal and centrifugal forces; boundary
types; von Thünen; bid-rent; rank-size and primate city; gravity; Christaller; Burgess, Hoyt, Harris-Ullman,
galactic; Latin American, Southeast Asian and African city models; least cost theory; Rostow; Wallerstein;
dependency theory; commodity dependence; complementarity and comparative advantage. The CED names no map
projections and no Weber, Lee, Zelinsky, Griffin-Ford, McGee, de Blij, heartland or organic state theory: these may
appear as a labeled aside ("your class may name this"), never as the only route to a keyed answer.

**Exam (Mon 3 May 2027, morning).** Fully digital in Bluebook, 2 h 15 min. Section I: 60 MCQ in 60 min, 50%, about
30-40% with a stimulus (map, table, chart, image, text), some in sets. Section II: 3 FRQs in 75 min, 50%, each 7
one-point parts (A to G): Q1 no stimulus, Q2 one stimulus, Q3 two stimuli. No calculator.

**Scores.** 3+: 54.4% (2023), 56.1% (2024), 64.7% (2025), 66% (2026). FRQ means 2.1-4.4 of 7; the no-stimulus Q1 is
usually the lowest.

**Where students lose points.** Task verbs (naming when asked to describe, describing with no cause and effect when
asked to explain, comparing one side only, no stated degree for "to what degree"); scale of analysis (38% named a
subnational map's scale); vague patterns with no place named; misread legends and tables; confusions (carrying
capacity vs density, GMOs as Green Revolution, edge cities, site vs situation, the galactic city model).

**Market.** No Khan Academy course. UWorld $99-169, Fiveable about $79/yr, books $23-28. Nobody has a graded model
builder, a scale-of-analysis trainer or a part-by-part task-verb FRQ trainer.

**Not verified** (needs-author `ced-text`, `mcq-options`): CED text of Topics 4.9-7.8 and the skill weights were read
only through a paraphrasing tool; five MCQ choices assumed from the CED samples (five on the exam forms, four in
the bank, as Macro); 2026 taker count and grade split.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, the models page, unit practice tests.
Premium: unlimited practice, exams, every lesson, analytics, every trainer.

1. **Model Studio (flagship).** Every model the exam names, built by hand (drag the rings, sectors, stages and
   arrows into place), then applied to a real case, then its limits picked out; graded piece by piece.
2. **Task verbs, part by part.** FRQs answered one lettered part at a time with the verb's demand shown (identify,
   define, describe, explain, compare, explain the degree), a builder that makes sure an "explain" has its because,
   and one rubric line per point.
3. **Scale, finally clear.** Scale of analysis vs map scale, drilled on real-looking maps at global, regional,
   national and local scale: the 38% point.
4. **Read the stimulus first.** Maps, population pyramids, tables and photos like the exam's, with questions that
   need the legend and a named place, never "clustered" alone.
5. **Built for a first AP® course.** Short lessons, plain words, every term defined before it is used, and a
   "Skills you need" chapter (reading maps and data, scale, how FRQs are scored) before Unit 1.
6. **Built for May 2027**: 60 MCQ in 60 min, three 7-point FRQs (no stimulus, one, two), two full timed exams.

## 4. Continuity with the other courses

Built like AP® Psychology, so every shared page type matches. Same shared layer (`assets/`, Tool Studio, flagging,
XP, tutor, dashboard, covers, path, score card, teacher classes), item formats, the "not yet reviewed" note,
trademark rules. Every shared-layer fix goes into the shared file. Psychology's build must stay byte-identical: run
`node scripts/build-appsych.mjs --check` after any shared change. Identity: own accent (a hue clear of the other
fifteen; final at launch, decision 11), icon, headline, cover art (a globe), ranks.

**Maps.** World and regional base maps are drawn from Natural Earth public domain data (the `world-atlas` npm
package, 110m), simplified at build time into small SVG paths under `human-geography/figures/`; no map tiles, no
external requests. Country borders follow Natural Earth's de facto lines and every map that shows borders carries
the note required by `accuracy-risks.md`. Thematic maps in questions use invented data on real outlines, or real
data with a dated source line (UN 2024 revision, World Bank, PRB).

## 5. Build plan

One branch, `claude/aphug`, one PR at the end. `claude/apmicro` merges to main first; this branch merges it in
before registration so the course lists and the SQL migration (`2026-11j-aphug.sql`) carry both new courses.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/aphug-research/`; this spec | **done 2026-11-09** |
| 0 | Fork AP® Psychology: runtime `human-geography/assets/` (`hug-*`), `ApHugCalc`, map and model stimuli, the three FRQ types, generator, checks, tests, fixture, base maps, registration hidden, SQL migration; CED and dependency maps, exam config, tool scaffolding, architecture, authoring guide, briefs, needs-author || **done 2026-11-09** (decision 9; `docs/aphug-phase0.md`, `docs/aphug-architecture.md`) |
| 1 | Content: lessons, notes, banks (with stimulus sets), FRQs, glossary, figures | |
| 2 | Trainers (section 6) | |
| 3 | Two practice exams, unit tests, "Make it specific" prompts, models page, cram kit | **done 2026-11-09** (section 5b, decision 10; `docs/aphug-reviews/phase3.md`) |
| 4 | Independent accuracy checks per unit, tools and exams, plus one neutrality and currency pass over everything | **done 2026-11-09** (`docs/aphug-reviews/u1.md`-`u7.md`, `tools.md`, `exams.md`, `originality.md`) |
| Launch | Publish, generators (paths included), continuity pass, course-count wording (count `assets/courses.js`), full CI with browser checks, PR, launch steps | **done 2026-11-10** (decision 11; `docs/aphug-reviews/launch.md`); PR and merge by the lead after AP® Microeconomics |

### 5b. Phase 3 as built (2026-11-09)

- **Forms** (`human-geography/data/exams/forms.json`, checked by `checkForms` in `scripts/lib/aphug-exams.mjs`):
  two forms of 60 five-option questions in course order, by unit weight (Unit 1 six, Units 2 to 7 nine each),
  23 questions with a stimulus in each (38%; the check holds 18 to 24, `EXAM_STIMULI`). Each form: 52 reviewed
  bank questions, never a lesson check item, plus 8 exam-only questions (`items.json`, `hug-exam-<form>-<nn>`,
  `EXAM_ONLY` 6 to 16). Sets of two or three only: form 1 has 4 map blocks (2 bank sets, an exam-only map and an
  exam-only set of two on one map), 3 data (2 bank sets, an exam-only pyramid), 1 image set, 2 text sets; form 2
  has 3 map, 3 data, 1 image, 3 text. Each bank question's fifth option is in the form's `fifth` map
  (`{ text, why }`) and is put in at `fifthAt(id)` (a fixed position from the id, so the fifth is not always (E));
  `examVersion` moves the key with it. The build serves every form question in `assets/exams/items.json` with
  five options and its explanations inline, with every stimulus they read; `pages/exams.js` marks only
  `hug-exam-*` as exam-only, so a missed bank question still reaches Review.
- **Exam-only questions** (16): the stimuli the bank has no whole set for and the reader report traps. Form 1: the
  scale of analysis of a province map (the 38% point), the share under 15 read from an invented pyramid, the
  rank-size rule and the primate city on one symbol map (a set of two), physiological density vs carrying
  capacity, GMOs are not the Green Revolution, the semiperiphery is Wallerstein's, HDI vs income. Form 2: site vs
  situation (Singapore), doubling time by the rule of 70, an intervening opportunity, acculturation (an invented
  interview text in Little Saigon), the Strait of Hormuz on a region map, an edge city (Tysons), least cost theory
  (copper), comparative advantage. Every number recomputed by ApHugCalc in `EXAM_NUMBERS` (3 items, distractors
  from the slips) and every map, pyramid and symbol read checked against its data in `EXAM_READS` (5 items,
  `checkReads`; an exam-only map or data item without a read check fails).
- **Section II**: form 1 `frq-gentrification-none`, `frq-language-map-one`, `frq-human-environment-two`; form 2
  `frq-development-theory-none`, `frq-rail-boundary-one`, `frq-devolution-two`. Each form's three FRQs share no
  unit (now a `checkForms` rule), no FRQ is in both forms, and the six were chosen to overlap the form's MCQ
  topics least (one topic each). The cram kit never assigns these six on study days.
- **Content checks on the forms** (`check-aphug-content.mjs`): exam-only items as five-option items; the fifth
  options as text (language, dates, models, trademark, position words) and by `checkFifth` (one per bank
  question, none for anything else, never a repeat or on a fixed item); each form as served: the length tell
  (key longest at most 40%; 4 and 7 of 60), the key position (at most 40%, each position used; counts 20, 9, 10,
  9, 12 and 12, 19, 11, 9, 8), the test-wise limits (absolute words in distractors), and `keyRisks` (no key names
  a disputed place, no key is an undated real figure).
- **Results**: the score card shows Section I and Section II apart, each "50% of the exam", in its chips and in a
  two-part block; no composite, no band (`estimate: null`), no Beta label; the "No AP® score is estimated" line
  stays. Leftover AP® Psychology text fixed (75 questions, 90 and 70 minutes, two FRQs).
- **Unit tests**: `unitSample` skips every form question and every set one of them belongs to (tested on the
  built site); the lede says four options in practice, five on the exams.
- **"Make it specific"** (`human-geography/data/justify/*.json`): 73 prompts, 10 per unit and 3 in "Skills you
  need", each with a two-slot builder; skills describe 7, explain 14, compare 8, degree 7, place 7, scale 8,
  limitation 7, model 7, legend 8 (a new skill, "read the legend"); the first 3 in course order free. Every real
  fact named and dated; numbers in `JUSTIFY_NUMBERS` (Lima's rank-size second city, Province X's change).
  `JUSTIFY_PER_CHAPTER` 8 to 12, `JUSTIFY_PER_SKILLS_CHAPTER` 3 to 6, at least 60 in all.
- **Models you must know** (`models.html`, `modelEntries` in `scripts/lib/aphug-entry.mjs`, data
  `human-geography/data/models.json`): all 26 models the CED names, in course order by unit. The 21 Model Studio
  builds bring their picture (Model Studio's figure for the free layouts, `ApHugModel.artSvg` for rings, sectors,
  stages and tiers; rank-size and gravity built from a fixed seed), claim, assumptions and first limit; the file
  adds a dated real example for each and the easy-to-confuse partners (22 models flagged with a partner, 2 more
  with the slip inside the model). Five are written there
  in full with their own model spec: determinism and possibilism, centripetal and centrifugal forces, commodity
  dependence, dependency theory, complementarity and comparative advantage. Free, indexable once published;
  linked from the formulas page and the cram kit. Weight budget 26 KB (measured 22.7).
- **Cram kit**: loads the forms and the prompts with the FRQ index; study days get only FRQs no form uses; exam
  days link the form's own title, or a bank exam if the form is not published; prompts link to the day's first
  unit that has some; study days and the eve point to the models page. Tested with the real course.

### 5a. Authors and builders (Phase 1 and 2)

| Author | Topics | FRQs (7 points each: one no-stimulus, one one-stimulus, one two-stimulus) |
|---|---|---|
| A | "Skills you need" (3) and Unit 1 (7) | 3 |
| B | Unit 2 (12) | 3 |
| C | Unit 3 (8) | 3 |
| D | Unit 4 (10) | 3 |
| E | Unit 5 (12) | 3 |
| F | Unit 6 (11) | 3 |
| G | Unit 7 (8) | 3 |

21 FRQs; two exams need six. Target about 14 bank questions a topic, a third with a stimulus. Builders: T1
`model-studio`; T2 `frq-coach`, `scale-lab`; T3 `map-reader`, `population-lab`; T4 `diffusion-lab`, `borders-lab`,
`city-lab`.

## 6. Trainers

Each has Explore and Test yourself (seeded drills, feedback naming the slip), as the other courses.

| Slug | Unit | What |
|---|---|---|
| `model-studio` | 2-7 | Flagship. Build, apply and critique every named model |
| `frq-coach` | 1-7 | Task verbs: answer FRQ parts one at a time with the verb's demand checked |
| `scale-lab` | 1 | Scale of analysis vs map scale; the same data at four scales tells different stories |
| `map-reader` | 1 | Map types (choropleth, dot, graduated symbol, isoline, cartogram), patterns, legends, named places |
| `population-lab` | 2 | Population pyramids, the transition stages, rates, doubling time, dependency ratio (`ApHugCalc`) |
| `diffusion-lab` | 2, 3 | Diffusion types and migration: push and pull, Ravenstein, step and chain, on a map |
| `borders-lab` | 4 | Boundary types, state shapes, centripetal and centrifugal forces, devolution, the law of the sea zones |
| `city-lab` | 5, 6 | Bid-rent and von Thünen rings, the city models side by side, central place and rank-size |

Free: `model-studio` (Explore plus the demographic transition drills), `scale-lab`, `map-reader`.

## 7. How answers are graded

All grading is code. Choice items exact; numbers with `ApHugCalc`; model builds by piece and order against the
key, the slip named; FRQs self-scored with one rubric line per point, the verb's demand and a full-credit sample
(the AI grader hook only when its eval passes).

## 8. Decisions log

1. (2026-11-09) **Fork AP® Psychology as it is on main**, keeping every shared page type.
2. (2026-11-09) **No "ap" in any served path.** Folder `/human-geography/`, files `hug-*.js`, ids `hug-`. Registry
   and storage key `aphug`.
3. (2026-11-09) **Pass and price mirror the other AP® courses:** `hug-2027`, $25 one-time, through 30 June 2027,
   registered `onSale: false` until the launch steps.
4. (2026-11-09) **Sources:** College Board CED, exam pages, scoring guidelines and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted. Real-world figures carry
   a dated source (UN, World Bank, PRB); the CIA World Factbook is not cited (closed February 2026).
5. (2026-11-09) **Exam format as researched** (section 2). Default exam date Mon 2027-05-03. Results show the two
   sections apart with their weights (50% each); no composite, no band.
6. (2026-11-09) **Free tier:** "Skills you need", Unit 1 and Unit 2 topics 2.1 to 2.5 as lessons (notes always free).
7. (2026-11-09) **Neutral, dated, specific.** Contested places get both names or the UN usage as
   `accuracy-risks.md` says; peoples and religions are described in the terms their members use; no country is
   called backward or primitive; development terms follow the CED (core, semiperiphery, periphery; more and less
   developed only when quoting a model). Graded questions never hinge on a figure that goes stale within a year.
8. (2026-11-09) **Only CED-named models are keyed**; others are labeled asides (section 2).
9. (2026-11-09) **Phase 0 done, as built** (`docs/aphug-phase0.md`, `docs/aphug-architecture.md`). Accent
   (provisional, needs-author `identity`): deep ocean teal, hue 188° (between NREMT 174° and Psychology 202°;
   AP® Microeconomics, merged in, took 319°), light `--cink #094953` on `--ctint #E1F1F4` (8.7:1; 9.5:1 on the
   page), dark `--cink #A8DEE6` (11.5:1 on the card) on `rgba(80,190,205,0.10)` (9.6:1); soft `#8CCFD9`; header
   short name "Human Geography". Cover clay `#7A3310` with light teal `#8FE3EE` (6.2:1), a globe with
   meridians. Choices the spec left open or that differ from it: (a) a "Skills you need" chapter of 3 topics
   (reading maps and data, scale, FRQ task verbs) placed before 1.1, 71 topics in all; (b) `ApHugCalc` recipes
   `{fn, args, pick}` to 12 significant digits, RNI as a percent, doubling time by the rule of 70 (an error when
   RNI is 0 or less); (c) maps are drawn at build time into `figures/maps/<stimulus id>.svg` from committed Natural
   Earth 1:110m bases (world, ten regions of our choosing, invented Country A), Equal Earth projection, with every
   word (marks, isoline values, legend, source, border note) in HTML so it stays legible at 360 px; flow maps and
   cartograms are not renderings yet (needs-author `map-renders`); (d) the `model` item (rings, sectors, stages,
   tiers, free) graded by piece and position, with named slips, used by banks, lessons and drills; (e) FRQ parts
   carry a `verb`, and the page shows its demand; the content check reads each sample against its verb; (f) bank
   singles have four options and exam forms five, the fifth from the form's `fifth` map (needs-author
   `mcq-options`); set counts per kind are a guess (`mcq-sets`); skill weights not enforced until
   `practicesConfirmed`; (g) the content check refuses non-neutral words for people, undated "currently" claims,
   a dated source without a year, keyed models the CED does not name (outside `.hug-aside`) and verb-demand
   misses; (h) the AI FRQ grader is not wired (`frq-grader`); (i) the site shell budget went from 349 (after AP®
   Microeconomics) to 349.8 KB. Registered hidden, `onSale: false`, after merging `claude/apmicro` (both courses in every list). SQL migration
   `2026-11j-aphug.sql` (runs after `2026-11i-apmicro.sql`) written, not applied.

10. (2026-11-09) **Integration pass** (`docs/aphug-reviews/integration.md`): every builder and author request in
   the shared layer. Flow maps are a map rendering (`render: 'flow'`) and an invented `metro` base exists (needs-author
   `map-renders` now covers cartograms only); invented bases carry area codes (`labels`); the `model` item's `free`
   layout draws numbered badges on its figure with the places listed under it, and `groups` make slots
   interchangeable; figures enlarge to full size on a phone (Enlarge); tool pages load `hug-map.js`; an FRQ page's
   Premium gate follows its latest topic; Model Studio's free drills are the demographic transition's only. Map
   placements: colonialism, terraces and irrigation pulled forward into 1.7; economies of scale and tariff into
   4.9; infrastructure into 4.10; the Industrial Revolution is a preview box in 5.4; periphery and the IMF stay in
   Unit 7. House scale words: "local (subnational)" for data on parts of a country (needs-author `scale-words`).
   Publish units in course order or together (`publish-order`).

10. (2026-11-09) **Phase 3 as built** (section 5b, `docs/aphug-reviews/phase3.md`). Choices the spec left
    open: sets of two or three in the forms (the bank's sets of three to five are used only where two or three of
    their questions are not lesson checks); 8 exam-only questions a form; FRQs from fully different units; the
    fifth option at a position fixed by the id; the "legend" skill added to "Make it specific"; models.html
    built from Model Studio's data plus `data/models.json`, not a second copy of each model. Generated files at
    the repo root (`models.html`, `formula-sheet.html`, `assets/justify.json`) are left for the integrator's
    rebuild (`node scripts/build-aphug.mjs`), since the shared runtime was changing during this phase.

11. (2026-11-10, launch) **Published and live, Premium not on sale.** All eight chapters in
    `human-geography/data/published.json` (`geo-skills`, `unit-1`..`unit-7`: 71 topics, 1,107 bank questions, 21
    FRQs), `status: 'live'` in `assets/courses.js`, every generator rerun (hub and 404 cards, premium page, terms
    "passes with an end date", manifest, sitemap, search, pricing, home facts "14 courses" until AP® Microeconomics
    goes live, course homes, og tags, paths, vault rules: 56 lessons vaulted), `models.html` linked from the course
    home (beside "All 8 tools") and from Learn (a fourth "Models" switch, AP® Human Geography only), hand-written
    course counts "fifteen courses" and "twelve AP® Exams" (with AP® Microeconomics, merged here at its Phase 0),
    `sources.html` section with the dated sources, changelog entry, `robots.txt`, `sw.js` v119, social card
    rendered, eight tool covers, course home "May 2027 exam". Before publishing: Model Studio's phone plots, the EEZ
    slot, the exams review's three author items and `scale-words` settled ("local (subnational)" for data on parts
    of one country in keys and notes; "regional" only for groups of countries). Identity: accent, headline "from
    local to global.", hand line "every model, every scale" and ranks (Map Reader to Geography Legend) kept; the
    cover's wire globe (it read as a ball) redrawn as an Earth with land, its grid, and a gold migration path to a
    gold pin, from one source for cover, thumb and band art; the icon is the common globe sign; the hub's course
    names take their accent color (Precalculus, Calculus BC, Macro, Micro and Human Geography had none). `aphug` in
    the FRQ grader's `FRQ_COURSES` with conventions, a calibration example and four eval cases (still shipped off).
    SQL `2026-11j-aphug.sql` lists every course, apmicro included, not applied. `onSale: false` stays until the
    owner checklist below.

## 9. Open items for the owner

- Confirm the identity (decision 11: teal accent `#094953`, the clay cover with an Earth and a migration path, the
  globe icon, headline "from local to global.", ranks Map Reader to Geography Legend; needs-author `identity`), the
  free tier (decision 6) and the free trainers (section 6), now live.
- The rest is in `docs/aphug-needs-author.md` (teacher questions: `ced-text`, `mcq-options`, `mcq-sets`,
  `scale-words` as settled, `tools-facts`, the fifth options, contested-topic prompts).

**Launch checklist (owner), to put AP® Human Geography Premium on sale** (as AP® Macroeconomics, its spec section 9):
- [ ] Apply migration `scripts/sql/migrations/2026-11j-aphug.sql` in Supabase (after `2026-11i-apmicro.sql`): adds
      `aphug` to the three course checks and the nine functions with a course list. Check the live function bodies
      match `2026-11i-apmicro.sql` first. Then grant owner access (`grant`, as for the other courses).
- [ ] Create the Polar product "AP® Human Geography Premium (through June 30, 2027)", one-time, at the AP® price
      ($25), with the Founding member discount (it has no product list, so it covers every product).
- [ ] Add `"hug-2027": "<Polar product id>"` to `POLAR_PRODUCTS` (Cloudflare Worker levlprep-ask settings; deploy;
      `keep_vars = true` keeps it on the merge deploy).
- [ ] Remove `onSale: false` from `COURSES.aphug` in `assets/premium.js`; bump `sw.js`.
- [ ] Merge the PR (the lead opens it after AP® Microeconomics merges, merging main in first).
- [ ] Optional: an AP® Human Geography teacher reviews the course (the "not yet reviewed" note stays until then).
