# AP® Environmental Science course: spec and status

The source of truth for LevlPrep's ninth course. A fresh session reads this file, `CLAUDE.md`,
`docs/apenv-research/framework.md` and `docs/apenv-research/market.md`, not the chat history. When the plan
changes, update this file in the same commit. Open points for a person go in `docs/apenv-needs-author.md`.
Formats: `docs/apenv-architecture.md` (Phase 0); writing rules: `docs/apenv-authoring-guide.md` (Phase 0); map
and the CED check: `docs/apenv-phase0.md`; briefs for Phases 1, 2 and 4: `docs/apenv-briefs/`.

Course key `apenv` (storage, analytics, registry, SQL). URL path `/environmental-science/`. Every new browser
global starts with `ApEnv`. Question ids start `env-`, CSS classes `env-`. Template: the AP® Statistics course
(`docs/apstat-spec.md`, `docs/apstat-architecture.md`, `docs/apstat-authoring-guide.md`), the newest fork, plus
AP® Chemistry's unit-aware numeric grading (`chem-questions.js` `gradeNumeric`, `normUnit`, `splitNumber`).

## 1. Owner brief (2026-10-20), condensed

- Ninth course. Olivier picked AP® Environmental Science from a shortlist (AP Psychology, ATI TEAS 7, AP Calculus
  BC, AP Environmental Science) on 2026-10-20 and asked for it to be researched and built.
- Build it the same way as AP® Statistics: research, build everything, independent accuracy reviews, one PR the
  owner reviews.
- Tools at the bar of the NREMT interactive body map: interactive, visual where useful, simple on landing, extra
  detail revealed progressively, professional illustration quality, easy to read on a phone.
- Every course feels the same: shared components and the same page set. **No score calculator.**
- Premium pass $25 one-time through 30 June 2027; the founding discount applies as for the other passes.
- Beta, with "not yet reviewed by an AP® Environmental Science teacher". Trademark rules as the other AP® courses.

## 2. What the research says (details and URLs in `docs/apenv-research/`)

**Not revised for 2026-27.** The Fall 2026 CED only clarifies wording in a few topics (1.5, 1.6, 1.11, 2.6 LO,
3.8, 4.3, 5.5, 5.7, 6.5). The "AP Environmental Studies" title on the score page is a page label, not a rename.

**Framework.** 9 units, 99 topics, MCQ weights: U1 The Living World: Ecosystems 6-8% (11), U2 The Living World:
Biodiversity 6-8% (7), U3 Populations 10-15% (9), U4 Earth Systems and Resources 10-15% (9), U5 Land and Water Use
10-15% (17), U6 Energy Resources and Consumption 10-15% (13), U7 Atmospheric Pollution 7-10% (8), U8 Aquatic and
Terrestrial Pollution 7-10% (15), U9 Global Change 15-20% (10). Every topic title official (Course at a Glance
poster). Seven practices: 1 Concept Explanation, 2 Visual Representations, 3 Text Analysis, 4 Scientific
Experiments, 5 Data Analysis, 6 Mathematical Routines, 7 Environmental Solutions (skills 1.A-7.F; 3.D, 3.E, 4.D
not assessed). Practice weights are third party (needs-author `practice-weights`). Big ideas ENG, ERT, EIN, STB.

**Exam (Thu 13 May 2027, Session 2), fully digital in Bluebook, 2 h 40 min.** Section I: 80 MCQ, 90 min, 60%,
individual items plus sets with a stimulus (3-5 quantitative data sets, 3-5 visual or model sets, 2 text sets).
Four options per third-party reports (needs-author `mcq-options`). Section II: 3 FRQs, 10 points each, 70 min,
40%: Q1 design an investigation, Q2 analyze and interpret quantitative data (**new title for 2027**), Q3 analyze an
environmental problem with calculations. Calculation parts score one point for the setup and one for the answer
with units. Calculator: four-function (with square root) or scientific, or Bluebook's Desmos scientific;
**graphing calculators banned from 2027**. **No formula sheet**: students memorize every formula.

**Scores.** 2025: 245,371 takers, 69.2% 3+, mean 3.06; 2026: 69% 3+, 13% fives.

**Where students lose points** (Chief Reader Reports 2023-2025). FRQ 3 (calculations) is usually the lowest
(2025 set 2 mean 3.84 of 10): percent change without parentheses or without ×100, units missing, setup not shown,
"million" and scientific-notation slips, doubling time not added to the start year. Solutions vague, not fitted to
the scenario, a technology given when a policy was asked, "other than" constraints ignored, a benefit named
without how it works. Hypotheses written as questions or with "affects"; the wrong dependent variable; a control
named without its purpose. Cause-and-effect chains left incomplete. Content mix-ups: greenhouse gases vs ozone
depleters vs acid-rain gases; thermal pollution blamed on chemicals; sea ice melt raising sea level; El Niño vs La
Niña; watershed vs aquifer; r/K vs survivorship curves; primary vs secondary succession.

**Market.** UWorld $99-169, Fiveable $79/yr, Albert $79, Barron's $27, free Khan Academy and Cognito, YouTube
review channels. Almost no interactive simulators for APES (one free population-dynamics simulation found).
Gap: graded calculation practice that checks setup, units and the answer separately, and simulators tied to exam
items. Risk: a 69% pass rate and an "easy AP" reputation mean lower willingness to pay; lead with calculations.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, the "Formulas you must memorize"
page, unit practice tests. Premium ($25 one-time, through 30 June 2027): unlimited practice, exams, every lesson,
analytics, every trainer.

1. **Calculation Studio (flagship).** FRQ 3 made drillable: every calculation type on the exam (section 7),
   graded the way readers grade it: the setup (typed as Bluebook expects, with parentheses and units), then the
   answer, then its units, each marked separately with the slip named.
2. **No formula sheet, so we give the one to memorize.** A formulas page with every equation the exam expects you
   to know, when to use it and the classic trap, plus a spaced flashcard deck of them.
3. **Built for May 2027.** 80 four-option MCQ with quantitative, visual and text sets; the three 2027 FRQ types
   (with the new "analyze and interpret quantitative data" Q2), 10-point rubrics, typed answers.
4. **Answers specific enough to score.** A "Make it specific" trainer for written parts: hypotheses (directional,
   testable), variables and controls, cause-and-effect chains, and solutions that fit the scenario.
5. **The systems you can see.** Simulators for the parts students mix up: cycles, energy flow, population growth,
   pollution chains, the greenhouse effect vs the ozone layer.
6. **In CED order, nothing used before it is taught**, with a short "Math you need" chapter placed right before
   the topic that first needs each skill.

## 4. Continuity with the other courses

Built exactly like AP® Statistics (decision 1), so every shared page type matches: home, units, lessons, notes,
unit sheets, glossary, flashcards, practice, review, exams, FRQ, justify-style trainer, dashboard, search, tools,
cram, teachers, formulas page, unit tests. **No score calculator page and no readiness band** (decision 6). Same
shared layer (`assets/`, Tool Studio, flagging, XP, tutor), item formats, Beta badge, the "not yet reviewed by an
AP® Environmental Science teacher" note, trademark rules. Every shared-layer fix goes into the shared file, never
an environmental-only copy. Identity: own accent colour, icon, headline and rank names (decision 5).

Page list (`/environmental-science/`):

| Page | Free | Notes |
|---|---|---|
| `index.html` home | yes | hero, units, trainers band, "Try one" sample question |
| `learn.html`, `units/`, `notes/`, `unit-sheets/` | yes | textbook in CED order plus "Math you need" |
| `lessons/` | Units 1-2 and math chapter | interactive lessons |
| `glossary.html`, `flashcards.html` | yes | includes a "Formulas" deck |
| `practice.html`, `review.html` | 15 a day | filters: unit, topic, practice/skill, item type, flagged |
| `exams.html` | one form | two fixed full exams in the 2027 format, plus timed sections |
| `frq.html`, `frq/<id>.html` | sample | three FRQ types, 10-point rubrics, self-scored, "check my number" on calculations |
| `justify.html` | sample | "Make it specific" (section 6) |
| `tools.html`, `tools/<slug>.html` | three trainers | section 6 |
| `cram.html`, `dashboard.html`, `search.html`, `teachers.html` | as other courses | |
| `formula-sheet.html` | yes | "Formulas you must memorize" (no official sheet exists) |
| `unit-tests/<unit>.html` | yes | 12 bank questions per unit |

## 5. Build plan

One branch, `claude/apenv`, one PR at the end. Phases as AP® Statistics.

| Phase | What | Parallel split | Status |
|---|---|---|---|
| R | Research: `docs/apenv-research/framework.md`, `market.md`; this spec | one session | **done 2026-10-20** |
| 0 | Fork AP® Statistics: CED map (99 topics + math chapter), dependency map, generator `scripts/build-apenv.mjs`, runtime `environmental-science/assets/` (`env-*`), `ApEnvCalc` (calculation recipes) and unit-aware numeric + setup grading, `ApEnvPlot` (line, bar, scatter, pyramid, dual-axis data figures), checks, tests, fixture, registration hidden (registry, Premium pass, Worker, SQL migration, hub/pricing, search, sitemap, OG, budgets, theme, sw.js), tool scaffolding, architecture and authoring guide, briefs, needs-author | one session (shared files) | **done 2026-10-20** (decision 10) |
| 1 | Content: lessons, notes, banks (incl. stimulus sets), FRQs, glossary, figures | 7 authors at once (section 5a) | |
| 2 | Trainers (section 6) | 4 builders at once, each owning whole slugs | |
| 3 | "Make it specific" trainer, two fixed practice exams, formulas page, unit tests, cram kit | one session | **built 2026-10-20**: 45 prompts (5 per unit, every skill, 21 with builders), two forms (22 exam-only + 58 bank each, 3 quantitative, 4 visual, 2 text sets, units in range, design/data/calc FRQs), timed sections, formulas page with worked lines and a Formulas deck, unit tests, cram kit; every new number recomputed; shared engine fixes (dual plots, units, sources, hint); report `docs/apenv-reviews/phase3.md`; accuracy review in Phase 4 (decision 11) |
| 4 | Independent accuracy checks per unit group, tools and exams (every calculation key recomputed by code) | reviewers in parallel | |
| Launch | Publish, generators, continuity pass against statistics on every shared page type, "Nine courses" wording, full CI with browser checks, PR | one session | |

Quality bar: AP® Statistics authoring rules; every calculation key recomputed by code from a recipe; every data
figure drawn from the numbers it claims to show; independent accuracy review; science claims match the CED and
mainstream sources (contested points go to needs-author, never guessed).

### 5a. Authoring split

Balanced by work. Each author owns every file of its topics (lesson, notes, questions, glossary, figures) and the
FRQs listed; 14 FRQs in all, at least four of each type, enough for two exams and the free samples.

| Author | Topics | Count | FRQs | Stimulus sets |
|---|---|---|---|---|
| A | Unit 1 (1.1-1.11) and the whole "Math you need" chapter | 11 + 5 | `calc` energy flow and NPP; `design` productivity experiment | 2 quantitative |
| B | Unit 2 (2.1-2.7) and Unit 3 (3.1-3.9) | 16 | `calc` population growth and rule of 70 to a year; `data` age structure and survivorship | 2 quantitative, 1 visual |
| C | Unit 4 (4.1-4.9) | 9 | `design` soil and erosion; `data` climate and ENSO data | 2 visual |
| D | Unit 5 (5.1-5.17) | 17 | `calc` irrigation water use and cost; `design` agricultural practice | 1 quantitative, 1 text |
| E | Unit 6 (6.1-6.13) | 13 | `calc` energy, kWh, efficiency and CO2; `data` energy consumption trends | 2 quantitative |
| F | Unit 7 (7.1-7.8) and Unit 8 (8.1-8.11) | 19 | `design` eutrophication or thermal pollution; `data` air quality and smog | 1 visual, 1 text |
| G | Unit 8 (8.12-8.15) and Unit 9 (9.1-9.10) | 14 | `calc` LD50/dose and half-life; `data` CO2, temperature and pH records | 2 quantitative, 1 visual |

Trainer builders (Phase 2), four at once, each owning whole slugs (one set of files per slug, nothing shared):

| Builder | Trainers |
|---|---|
| T1 | `calculation-studio` (flagship), `population-growth`, `age-structure` |
| T2 | `energy-flow`, `cycles`, `soil-texture` |
| T3 | `earth-climate`, `energy-chain`, `air-pollution` |
| T4 | `water-pollution`, `dose-response`, `climate-change` |

## 6. Trainers

Twelve simulators plus the written-answer trainer. Each has an Explore pane (live scene, one to three primary
controls, Why and Details sheets) and Test yourself (seeded drills, contexts unlocking with their unit, feedback
naming the slip, first try recorded as `<slug>:<context>:<step>`).

| Slug | Unit | What |
|---|---|---|
| `calculation-studio` | all | Flagship. Every exam calculation type (section 7) as seeded problems with real-looking scenarios. Three graded boxes per step: setup (typed expression, structure checked: parentheses in percent change, ×100, conversion factors that cancel), answer, units. A dimensional-analysis chain where factors snap together and units visibly cancel. Scale words ("2.5 million", "×10⁶") and "in what year" follow-ups drilled. Calculator-free mental math tips. |
| `energy-flow` | 1 | Trophic pyramid and food web: energy, biomass and number pyramids from one ecosystem; 10% rule live as you change producer energy; GPP, respiration and NPP; remove a species and see the web respond |
| `cycles` | 1 | Carbon, nitrogen, phosphorus and water cycles as illustrated reservoir-and-flux diagrams; tap a process to see what moves where; perturb (burn fossil fuels, add fertilizer, clear forest) and watch reservoirs shift; nitrogen fixation, nitrification, assimilation, ammonification, denitrification in order |
| `population-growth` | 3 | Exponential vs logistic growth with r and K; overshoot and dieback; r- vs K-selected traits; survivorship curves I, II, III (kept separate from r/K, the common mix-up); doubling time by the rule of 70 |
| `age-structure` | 3 | Build a population pyramid; total fertility rate and replacement level; birth and death rates to growth rate; the demographic transition's four stages linked to the pyramid shapes |
| `soil-texture` | 4 | The soil texture triangle: drag sand, silt and clay percentages, read the class; porosity, permeability and water-holding capacity; soil horizons; erosion and conservation practices |
| `earth-climate` | 4 | Seasons from axial tilt and sun angle; insolation by latitude; Hadley, Ferrel and polar cells with surface winds; rain shadow; El Niño vs La Niña side by side (trade winds, upwelling, rainfall) |
| `energy-chain` | 6 | A power plant from fuel to outlet with efficiency at each step; compare coal, natural gas, nuclear, hydro, wind, solar on emissions, land, cost and intermittency; kWh, BTU and CO2 calculations |
| `air-pollution` | 7 | Photochemical smog through a day (NO, NO2, O3, VOC curves with traffic and sunlight); thermal inversion on and off; acid rain from NOx and SOx with pH; primary vs secondary pollutants; reduction methods matched to pollutants |
| `water-pollution` | 8 | The eutrophication chain step by step (nutrients, algal bloom, die-off, decomposition, dissolved oxygen drop, dead zone) with a DO graph; thermal pollution and DO vs temperature; sewage treatment stages |
| `dose-response` | 8 | Dose-response curves with LD50 and threshold read off; compare toxicity; bioaccumulation in one organism vs biomagnification up a food chain (ppm multiplying per level) |
| `climate-change` | 9 | Greenhouse effect energy balance (gases absorb IR) side by side with the ozone layer (CFC chlorine cycle absorbs UV), so the two are never confused; ocean acidification carbonate chemistry with pH; sea level from thermal expansion and land ice (not sea ice) |

Free: `calculation-studio` (flagship), `energy-flow`, `cycles`; the rest Premium. Owner to confirm.

**"Make it specific" (the justify page).** 40+ prompts, 4-6 per unit, on the reader-report misses: a testable
directional hypothesis, the independent and dependent variable, a control and its purpose, a constant, a
complete cause-and-effect chain, an explanation of a data trend, a solution fitted to the scenario's scale and
constraints with how it works, a policy vs a technology, pros and cons. Each prompt has a rubric checklist, an
answer that earns the point and a plausible one that misses (as AP® Statistics), plus slot builders where the
answer has components (hypothesis builder: if [IV change], then [DV] will [increase/decrease], because ...).

## 7. How answers are graded

All grading is code; nothing is graded by an AI model.

1. **Choice items** (`single` with 4 options, `multi`, `order`): exact.
2. **Numbers with units** (`numeric`): value within the item's tolerance (default 1% relative or half a unit in
   the last shown place, whichever is larger), then units compared however typed (`kWh`, `kW·h`, `kW h`;
   `people/km^2`; `%`; `years`), with scale words read (`2.5 million`, `2.5e6`, `2.5 × 10^6`). Sig figs are not
   graded (APES readers do not). Mistakes are authored values (forgot ×100, divided by the new value, 10% applied
   twice, doubling time not added to the year, a factor of 1000 from a prefix) matched first, each with its fix.
3. **Setups** (`setup`): the student types the expression as on the exam (`(150 - 120) / 120 * 100`,
   `70 / 2`, `5000 kWh * 0.9 kg/kWh`), parsed without eval; graded by value and by structure (`mustUse`,
   `mustNotUse`, required parentheses around a difference before a division). The answer and its units are a
   second box (the reader's one point for setup, one for answer).
4. **Written parts** (`specific`): builder slots graded exactly (hypothesis direction, the variable named, a
   solution matched to the stated constraint); a free-text box with rule flags (`directional`, no question mark,
   a named variable, "other than" respected, mechanism words) shown as hints, scored by the student's own tick per
   rubric line. Only builder answers count toward mastery.
5. **FRQs**: three types (`design`, `data`, `calc`), 10 points, one rubric line per point, self-scored with
   full-credit samples; calculation parts offer a "check my number" box using rules 2 and 3.

**Calculation types (every one has a recipe in `ApEnvCalc` that the build recomputes):** percent change; percent
of a quantity; rule of 70 doubling time and the resulting year; growth rate from CBR and CDR (per 1000 to
percent); exponential growth projection; 10% rule across trophic levels; GPP, respiration and NPP; half-life
(amount after n half-lives, time to a fraction); unit conversions and dimensional analysis (metric prefixes, kWh,
BTU, acres/hectares, gallons/liters, tons/kg); per-capita and density; efficiency and energy chains; cost and
emissions savings; LD50 read from a curve; biomagnification factors; TFR and replacement; water use per area.

## 8. Decisions log

1. (2026-10-20) **Fork the AP® Statistics runtime** (newest: build-time TeX to MathML, the expression parser,
   one set of files per trainer, data plots), replace its distributions library with `ApEnvCalc`, and port AP®
   Chemistry's unit-aware numeric grading (without sig figs). Drop interval and conclude item types; add
   `specific`.
2. (2026-10-20) **No "ap" in any served path.** Folder `/environmental-science/`, files `env-*.js`, ids `env-`.
   Registry and storage key `apenv`, order 9, aliases `environmental`, `envsci`, `apes`.
3. (2026-10-20) **Pass and price mirror the other AP® courses:** `env-2027`, $25 one-time, through 30 June 2027
   (founding discount through the shared `FOUNDING` rule), registered `onSale: false` until the owner checklist.
4. (2026-10-20) **Sources:** College Board CED, course and exam pages, scoring guidelines and Chief Reader Reports
   for scope and common errors only, in our own words. No released exam questions reproduced or adapted. Data in
   items is either clearly invented for practice or from a public source cited on the page (NOAA, EPA, USGS,
   UN, IPCC, NASA), never presented as real if invented.
5. (2026-10-20) **Identity (proposed, owner to confirm).** Olive/earth accent, distinct from Biology's green and
   NREMT's teal; Phase 0 sets exact values with contrast ≥ 7:1 light and dark. Icon: a leaf over a globe line.
   Headline "AP® Environmental Science, one system at a time." Ranks: Field Observer, Cycle Tracer, Systems
   Thinker, Resource Steward, Data Reader, Solution Builder, Environmental Science Legend. Manifest and OG
   "Environmental Science".
6. (2026-10-20) **No score calculator and no readiness band**, as AP® Statistics decision 6.
7. (2026-10-20) **Exam format is May 2027**: 80 four-option MCQ in 90 min (individual plus 3-5 quantitative, 3-5
   visual and 2 text sets), 3 FRQs of 10 points in 70 min in the Q1 design, Q2 data, Q3 calc order. Default exam
   date Thu 2027-05-13.
8. (2026-10-20) **Calculator rule.** Scientific or four-function only (graphing banned from 2027). Items never
   need more than a scientific calculator; explanations show the setup by hand; a link to the free Desmos
   scientific calculator opens in a new tab.
9. (2026-10-20) **Free tier (proposed):** Units 1-2 and the "Math you need" lessons free (23 of 104 topics, 22%,
   within the 16-33% the other AP® courses give). Notes free forever. Owner to confirm.
10. (2026-10-20) **Phase 0 done, as built** (`docs/apenv-phase0.md`, `docs/apenv-architecture.md`). Accent: light
    `--cink #474A10` on `--ctint #EFF0DA` (8.0:1; 9.3:1 on white, 8.6:1 as button text on the page), dark
    `--cink #DCDB98` (11.2:1 on the card) on `rgba(200,200,100,0.10)` (9.1:1); soft `#D3D27F`; header short name
    "Env Science". Choices the spec left open or that differ from it: (a) a `calc` FRQ's "check my number" may
    also be a setup check (`check.type: "setup"`), so the setup point is drillable on FRQs too; (b) stimulus
    `kind` is the exam's set kind (`quantitative`, `visual`, `text`), so one field drives the label, the bank
    index and the form checker; (c) practice weights are not enforced in exam forms until a person confirms them
    (`practicesConfirmed`, needs-author `practice-weights`); (d) four topic slugs avoid the letters "ap" as a
    token (`island-biogeo`, `evolving-populations`, `carrying-limits`, `population-transition`); (e) the
    written-answer trainer is the simulator id `justify` in the map, as AP® Statistics; (f) `EXAM_NUMBERS` and
    `JUSTIFY_NUMBERS` are empty until Phase 3 writes the exams and prompts; (g) `ApEnvCalc.evaluate` rounds to 12
    significant digits so float noise never reaches a key; (h) the site shell budget went from 291 to 292 KB
    (registration measured 291.4 KB) and "generalist" was added to the spelling checker's American words. SQL
    migration `2026-10j-apenv.sql` written, not applied.
11. (2026-10-20) **Phase 3 as built** (`docs/apenv-reviews/phase3.md`). Practice exams: each form is 80 questions in
    course order, 22 exam-only (`data/exams/items.json`: three quantitative sets per form built on calculations, plus
    standalone items on the reader-report traps) and 58 bank questions (six bank sets, four visual and two text, and
    40 standalones), never a lesson check item or a free unit-test item, unit counts 6, 6, 10, 9, 10, 10, 7, 8, 14.
    FRQs: form 1 primary-productivity design, age-structure data, human-population calc; form 2 eutrophication design,
    ocean-acidification data, energy-conservation calc. Timed sections: one section of a fixed form alone
    (`exams.html?form=<n>&section=1|2`). "Make it specific": 45 prompts, first 3 free; builders reuse
    `ApEnvGrade.specific`. Every exam-only key, its named-slip distractors and every prompt number are recomputed with
    `ApEnvCalc` (`EXAM_NUMBERS`, `JUSTIFY_NUMBERS`). Formulas page: four columns (formula with a worked line computed by
    `ApEnvCalc` under it, what and when, the trap, where taught); the same rows are the "Formulas" flashcard deck
    (`assets/formulas.json`, ids `eq:<recipe>`, free). Shared engine (lead-owned files): dual-axis names above the
    plot and a wrapping legend; unit parser and normaliser extended (seconds, ng, kL, °C, decades, t and MT for metric
    tons, m² × m = m³, compound-unit divisors, "per" = "/", numbers in a denominator, powers of ten and scale words for
    "how many times", scale words in a key's unit cancel the typed one); a content-check warning for a rate asked with
    a unit that has no "/"; CDC and other US and UN agencies accepted as sources; the Tool Studio hint clamped to the
    viewport.

## 9. Open items for the owner

- Confirm the accent, icon, headline and ranks (decision 5), the free trainers (section 6) and the free tier
  (decision 9).
- Uncertain research: `docs/apenv-needs-author.md`.

**Launch checklist (after the PR is ready, owner):**
- [ ] Apply SQL migration `2026-10j-apenv.sql` in Supabase (check live function bodies match apart from `apenv`).
- [ ] Create the Polar product "AP® Environmental Science Premium (through June 30, 2027)", $25 one-time; add
      `"env-2027"` with its product id to `POLAR_PRODUCTS` in the Cloudflare Worker settings; deploy the Worker.
- [ ] Check the founding discount shows on the pass at checkout.
- [ ] Remove `onSale: false` from `COURSES.apenv`; bump the `sw.js` cache; grant owner access.
- [ ] Merge the PR (this puts AP® Environmental Science Premium on sale).
- [ ] Optional: an AP® Environmental Science teacher reviews the course (the Beta note stays until then).
