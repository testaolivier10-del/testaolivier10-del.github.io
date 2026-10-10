# AP® Chemistry course: spec and status

The source of truth for LevlPrep's fifth course. A fresh session reads this file, `CLAUDE.md`,
`docs/apchem-research/framework.md` and `docs/apchem-research/market.md`, not the chat history. When the
plan changes, update this file in the same commit. Open points for a person go in
`docs/apchem-needs-author.md`. Formats: `docs/apchem-architecture.md`; writing rules: `docs/apchem-authoring-guide.md`; map: `docs/apchem-phase0.md`.

Course key `apchem` (storage, analytics, registry, SQL). URL path `/chem/`. Every new browser global
starts with `ApChem`. Template: the AP® Biology course (`docs/apbio-spec.md`,
`docs/apbio-architecture.md`, `docs/apbio-authoring-guide.md`), which inherits its rules from A&P.

## 1. Owner brief (2026-10-06), condensed

- Fifth course, about one week of building. Research first, make it as good as possible.
- Continuity: it must feel like the other four (shared glossary, textbook, practice/review/exams,
  dashboard and hub components from the 2026-10 consistency work) while keeping its own identity.
- AP Bio and the other courses have been accuracy-checked; AP Chem gets the same treatment.
- Site changes ship as a pull request the owner reviews before merging.

## 2. What the research says (details and URLs in `docs/apchem-research/`)

**Framework.** CED revised Fall 2024 (renamed units, "big ideas" removed, a few topics renumbered),
unchanged for 2025-26 and 2026-27. 9 units, 91 topics. Unit 3 (IMFs, gases, solutions,
spectroscopy) is the heaviest at 18-22%; Unit 8 (acids and bases) 11-15%; every other unit 7-9%.
Six science practices; Mathematical Routines is the largest share on both sections and Argumentation
is a big part of the free response. Do not copy numbering or unit names from pre-2024 resources.

**Exam (May 6, 2027, afternoon).** 60 four-option MCQ in 90 min (50%), 7 FRQs in 105 min (50%):
3 long at 10 points, 4 short at 4 points. Calculator allowed throughout (Desmos built in).
Hybrid digital since 2025: MCQ on screen, FRQs read on screen but handwritten. Students get a
periodic table and the equations and constants sheet; no reduction-potential table, no solubility
rules, no Arrhenius equation.

**Not tested (CED exclusions, confirmed for Units 1-2):** quantum numbers, aufbau-exception
configurations, molecular orbital theory, d-orbital hybridization, specific crystal structures,
mass spectra beyond singly charged monatomic ions. Reported but unverified for Units 3-9: molality
and colligative properties, solubility-vs-pH calculations, electrode sign labels, quantitative
Nernst. Photoelectron spectroscopy and Beer-Lambert are tested. Needs-author: verify 3-9 exclusions.

**Scores.** About 169,000 takers in 2025 and growing every year; roughly 18% get a 5, mean about 3.3.
2026 preliminary: about 15% fives.

**Where students lose points (Chief Reader Reports 2022-2025).** Sig figs and units (J vs kJ, °C
vs K, wrong R); ln vs log in Henderson-Hasselbalch; equivalence vs half-equivalence; multiplying E°
by coefficients; "K changes with concentration" and rate language instead of Q vs K; not squaring
[OH⁻] in Ksp; water dipoles and H-bonds drawn backwards in particle diagrams; entropy as "disorder";
IMF comparisons by molar mass alone; "the graph is linear" without naming the plot; catalyst vs
intermediate; vague lab procedures and glassware. Hardest recent FRQs: galvanic cells and buffer
preparation (well under half the points on average).

**Students say.** Units 7-8 (equilibrium, acid-base, buffers, titrations) are the wall. The jump
from regular chemistry is large and the math (logs, exponents) trips people more than the
chemistry. FRQ justifications lose points for vagueness. Particle diagrams are unfamiliar. Unit 9
feels rushed. Favourite free resource is Jeremy Krug's videos; Khan Academy reads as surface level.

**Competitors.** Fiveable ($79/yr or $29/mo, AI FRQ grading), Knowt (free notes, about $12-25/mo
paid), UWorld (about $39, strong explanations), Albert (about $79, little teaching), Princeton
Review and Barron's books (about $28-30), Chad's Prep ($9.99/mo, general chem). Free: Khan, AP
Classroom, Simple Studies, OnePrep, Adrian Dingle (teacher-facing), Krug, Tyler DeWitt (intro),
Bozeman (pre-2019, outdated). Good free videos and notes exist; good free *practice with
feedback* on justifications, particle diagrams and data does not.

**Demand timing.** Searches are "unit N practice test", the reference sheet, the score calculator,
and released FRQs. Students study unit by unit all year (Units 1-3 now) and cram April to early
May. A smaller summer group comes from regular chem.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets. Premium ($25 one-time,
through 30 June 2027, same as AP® Biology; founding price applies): unlimited practice, exams,
every lesson, analytics, the trainers below.

Differentiators, each answering a research finding:

1. **Justification trainer.** FRQ "explain/justify" prompts with a rubric checklist and paired
   model answers: one that earns the point, one that doesn't, and why. Built around the reader
   reports' recurring misses (Q vs K, Coulombic reasoning with both species, particle-level entropy,
   naming the linear plot).
2. **Particle diagram practice.** Pick or build the correct particulate picture: ions in water
   with correct dipole orientation, equilibrium particle counts, solutions vs mixtures, the
   species present at each point on a titration curve.
3. **Units 7-8 depth.** Seeded, unlimited ICE-table, buffer, Henderson-Hasselbalch and titration
   drills (numbers regenerate, math rechecked by the same code students run), plus a titration
   curve reader (equivalence, half-equivalence, pKa, indicator choice).
4. **Calculation habit checks.** Numeric items grade value, units and sig figs separately, with
   the specific feedback the reader reports call out (kJ vs J, K vs °C, ln vs log).
5. **Exam-faithful practice.** 4-option MCQ in stimulus sets with real-style data (PES spectra,
   mass spectra, rate tables, titration curves, Beer's-law plots); full-length timed exams in the
   real 60/90 + 7/105 split; a page that walks through the official equations sheet.
6. **Lab and procedure items.** Glassware choice, precise steps, error analysis (Practice 2).
7. **Search entry pages (free):** unit practice tests, equations-sheet walkthrough, score
   calculator. These match the top searches.
8. **From zero, in CED order, nothing used before it is taught** (dependency map), with a short
   "math you need" refresher (logs, exponents, scientific notation) for students coming from
   regular chemistry.

## 4. Continuity with the other courses

Built exactly like AP® Biology (decision 1 below), so every shared page type matches:

- Shared layer used as is: `assets/course/*` (glossary list with definitions, book/textbook
  layout, study pages, hub), `scripts/lib/glossary.mjs`, `hub.mjs`, `page-title.mjs`,
  `crumbs.mjs`, site header, XP, accounts, Premium, report, analytics, service worker.
- Same page set and names as AP® Biology: home, units, lessons, notes, unit sheets, glossary,
  flashcards, practice, review, exams, FRQ, dashboard, search, tools, cram, teachers.
- Same lesson format (hook, prerequisites, figure, cause-and-effect chain, key ideas,
  misconception, check, summary, connections) and the same item formats (single, multi, numeric,
  order, predict; stimulus sets), so practice and review feel identical.
- Same wording for empty states, search placeholders, Beta badge and "not yet reviewed by an AP®
  teacher" note; same trademark rules ("AP®" as an adjective, never in URLs or meta tags other
  than the title).
- Identity: own accent colour (proposed cobalt blue; must not be ochem's lilac, AP® Biology's
  green, A&P's coral or NREMT's mint), own hub icon (a flask), own home headline, own rank names,
  own chemistry trainers above.

## 5. Reuse from existing code

- AP® Biology: generator `scripts/build-apbio.mjs` and helpers, runtime `bio/assets/*`, map and
  content checks, stimulus rendering (`chartSvg`, `tableHtml`), numeric items, seeded problem
  generators (`bio-skill-problems.js`), tool math validator (`apbio-tool-checks/_shared.mjs`).
- Ochem: build-time structure SVGs (`scripts/lib/ochem-figure.mjs`, `ochem-skeletal.mjs`) for Lewis
  structures, resonance and VSEPR figures; runtime `molecules.js`, `mol3d.js` (VSEPR shapes),
  `resonance-engine.js`, `periodic-table.js` (electronegativity, trends).

## 6. Build plan (one week)

All on one branch, `claude/apchem` (decision 5), one PR at the end.

| Phase | What | Status |
|---|---|---|
| 0 | CED topic map (own words, 91 topics), dependency map, fork generator and runtime, checks, registration (registry, Premium pass, Worker, SQL migration, hub/pricing hidden until published, search, sitemap, OG card, budgets, theme colour) | **done 2026-10-06** (decisions 6-12): `docs/apchem-ced-map.json`, `docs/apchem-dependency-map.json` (96 topics, 285 concepts; `docs/apchem-phase0.md`), `scripts/build-apchem.mjs`, `check-apchem-map.mjs`, `check-apchem-content.mjs`, runtime `chem/assets/`, formats in `docs/apchem-architecture.md`, rules in `docs/apchem-authoring-guide.md` |
| 1 | Units 1-3 with the math refresher (`skills-math`, 5 topics), notes, lessons, banks, FRQs, particle-diagram practice | **done 2026-10-06**; independent accuracy check per unit: `docs/apchem-reviews/u1.md`, `u2.md`, `u3.md` |
| 2 | Units 4-9, with the drills and titration reader | **done 2026-10-06**: all units written (96 topics, 1,565 bank items, 38 FRQs, figures in `chem/figures/`); accuracy checks `docs/apchem-reviews/u4.md`-`u9.md` (decisions 13-14) |
| 2b | Trainers and drills: particle diagrams, ICE tables, Q vs K, buffers, titration curve reader, units and sig figs | **done 2026-10-06** (decision 16); seeded generators with independent validators |
| 3 | Justification trainer (37 prompts), two fixed practice exams (32 exam-only items), equations-sheet page, score calculator, 9 unit practice tests, cram kit | **done 2026-10-06** (decision 17); reviewed: `docs/apchem-reviews/tools-exams.md` (score cut-offs 72/58/42/27, labelled estimates) |
| Launch review | Phase 3 content findings fixed, 36 fixed-order items no longer show the key first, published, continuity pass, full CI | **done 2026-10-06** (decision 18). **Published**: `chem/data/published.json` lists `skills-math` and `unit-1`…`unit-9`; Beta badge and "not yet reviewed by an AP® teacher" note stay; Premium stays `onSale: false` until section 8 is done |
| 4 | Second accuracy pass on the whole course (incl. exam-only items and justify prompts); PR to owner | **done 2026-10-07**: `docs/apchem-reviews/second-pass/u1-3.md`, `u4-6.md`, `u7-9.md` (12 fixes, 2 keys changed); plain-text helper keeps bare `<`/`>`; full CI with browser checks passes; PR opened |

Quality bar per unit: AP® Biology authoring guide rules (original items only, never adapted from
released exams; at least 60% apply/analyze; stimulus sets; per-option explanations; key-length
balance; worked example before any calculation type). Every numeric key recomputed by code.
Chemistry science gets an independent accuracy check, as A&P and ochem do.

## 7. Decisions log

1. (2026-10-06) **Fork the AP® Biology runtime**, as AP® Biology forked A&P (apbio-spec decision 1).
   Shared site modules used through the registry.
2. (2026-10-06) **No "ap" in any served path.** Folder `/chem/`, files `chem-*.js`, question ids
   `chem-`. Registry/storage key `apchem`.
3. (2026-10-06) **Pass and price mirror AP® Biology:** $25 one-time, valid through 30 June 2027.
   Confirmed by the owner 2026-10-06.
4. (2026-10-06) **Sources:** College Board CED, equations sheet and Chief Reader Reports for scope
   and common errors only, in our own words. No released exam questions are reproduced or adapted.
   No OpenStax material (as apbio decision 24).

5. (2026-10-06, owner) **Confirmed:** name "AP® Chemistry", path `/chem/`, $25 pass through 30 June
   2027, cobalt-blue accent. Build everything in one go without check-ins unless really needed; one
   branch `claude/apchem`, one PR at the end.

6. (2026-10-06, Phase 0) **Fork shape.** Everything AP® Biology has, renamed `chem`/`ApChem`/
   `apchem`, and built the same way (`docs/apchem-architecture.md`). Inherited rules are cited by
   their AP® Biology decision number in code comments. Free: every notes page, glossary,
   flashcards, unit sheets, Units 1-2 lessons and every math lesson, 15 questions a day, one
   exam; the pass `chem-2027` ($25, through 2027-06-30, the Worker's end of day in Hawaii) is
   registered but `onSale: false` until the owner checklist is done.
7. (2026-10-06) **Math refresher placed *before* its first use.** A skills topic takes
   `before: <topic>` (or `after`). Units, exponents, scientific notation and sig figs come before
   1.1; logs before 5.3 (the first ln). They form the "Math you need" chapter (`skills-math`),
   free, published with Unit 1 (logs with Unit 5).
8. (2026-10-06) **Item formats.** Single-answer MCQ has exactly 4 options. Numeric items grade
   value, units (`askUnit`) and significant figures (`sigfigs`, or `places` for logarithms)
   separately, with targeted feedback (prefix, °C/K, 1000, 273, 2.303 ln/log, sign) and authored
   `mistakes`; tolerance at most two units in the last digit. New stimulus kind `particle` (our
   SVG with a text alternative). Practice 3 is free response only. Grader tests in
   `scripts/test/apchem-questions.test.mjs`.
9. (2026-10-06) **Exams as the real split.** Section I 60 MCQ / 90 min; Section II 7 FRQs /
   105 min, 3 long (10 points, 23 min) then 4 short (4 points, 9 min); readiness band from 50% MCQ +
   50% FRQ, "Not calibrated". FRQ types are `long` and `short`. Exam-date default Thu 2027-05-06.
10. (2026-10-06) **Identity.** Cobalt `--ctint #E3EAFA` / `--cink #1D44A6` (7.2:1), dark
   `rgba(90,130,230,.12)` / `#B3C8F7` (8.7:1); flask icon on the hub card and trainers band; home
   headline "AP® Chemistry, one particle at a time."; ranks Mole Counter → Chemistry Legend;
   manifest and OG card "Chemistry" without the mark. "Simulators" are called trainers.
11. (2026-10-06) **Registered, hidden until published** exactly as AP® Biology (apbio decision 11):
   registry, every generated course list, Worker `PASSES`/`COURSE_NAMES`/`COURSE_RULES`, SQL
   (`schema.sql`, `reports.sql`, `pageviews.sql`, migration `2026-10c-apchem.sql`, **not
   applied**), premium.js, hub/404 cards and premium.html section (empty until a unit is
   published), site search, tutor pages, sitemap, OG tags and card, manifest, noindex app pages,
   weight budgets, a11y and console samples, CI and `ci-local.sh`, site rules
   `apchem-trademark` and `apchem-beta-and-report`, `sw.js` (`COURSE_URLS.chem`, cache v58; v59 at publish). Site
   shell budget 282 → 283 KB for the fifth course. No tutor bank (as AP® Biology).
12. (2026-10-06) **Placeholder sample outside the course.** The one sample topic
   (`moles-molar-mass`, 15 items in two sets incl. a particle set and unit/sig-fig numerics, two
   placeholder FRQs) lives in `scripts/test/fixtures/apchem-data/` and is built only by tests
   (`APCHEM_DATA`). It is not accuracy-checked; authors write the real topic in `chem/data/`.
13. (2026-10-06, Unit 8 draft) **Unit 8 written, not yet accuracy-checked or published.** Topics
   8.1-8.11 in `chem/data/` (lessons, notes with a worked example before each calculation type,
   203 items, glossary), 11 figures in `chem/figures/`, 5 FRQs (`frq-weak-acid-titration-lab` long;
   `frq-buffer-preparation`, `frq-acid-strength-structure`, `frq-strong-weak-acid`,
   `frq-ph-solubility` short). 8.11 is qualitative only. Every numeric key and authored mistake was
   graded by the runtime grader; that found and fixed a small-key bug in `near()`
   (needs-author `unit8-values`). **Accuracy-checked 2026-10-06** (`docs/apchem-reviews/u8.md`): every
   numeric key, mistake and plotted curve point recomputed in code, all 11 figures rendered; 5 keys
   changed (`chem-weak-acids-bases-11` 11.21 → 11.22, `chem-buffers-intro-2` 4.75 → 4.74,
   `chem-ph-and-pka-5` now one correct option, `chem-acid-strength-structure-5` multi → single), three
   figures re-laid out; `unit8-values` partly resolved.

14. (2026-10-06, Unit 7) **Unit 7 content and two shared fixes.** Map: "Q < K", "Q > K", "Q = K" moved to
   `reaction-quotient` (7.3, where the CED teaches the comparison; `q-vs-k` in 7.10 keeps the justification
   terms) and `ice-table` moved to `calculating-k` (7.4 uses ICE tables before 7.7). Grader: the numeric
   floating-point slack in `chem-questions.js` (and the matching check in `check-apchem-content.mjs`) is now
   relative to the key; the old absolute 1e-9 accepted any answer to a Ksp-sized question (test added).
   Five FRQs: long `frq-iron-thiocyanate` (lab, Beer's law, Q vs K) and `frq-hydrogen-iodide-particles`;
   short `frq-methanol-shift`, `frq-strontium-fluoride`, `frq-phosgene-ice`. Open points: needs-author
   `unit7-data`, `unit7-small-x`.
15. (2026-10-06, Unit 9 review) **Unit 9 accuracy-checked** (`docs/apchem-reviews/u9.md`): 11 topics,
   173 items, 5 FRQs, 11 lesson figures and 9 stimulus drawings. Every numeric key and mistake recomputed
   in code: no key changed. Fixes were wording, sig figs in explanations, one mistake value, ΔG° labels
   on the ATP set, S° > 0 limited to pure substances, and one stem lengthened to clear a near-duplicate.
   Needs-author `unit9-data` and `unit9-atp` resolved; `unit9-exclusions-applied` partly (9.8
   exclusion confirmed in the CED; 9.10 page not fully read).
16. (2026-10-06) **Trainers and drills built** (differentiators 2-4; formats in `docs/apchem-architecture.md`,
   "Tools"): `particle-diagrams` (Units 3, 4, 7, 8), `ice-table-drills` and `q-vs-k` (Unit 7),
   `buffer-drills` and `titration-curve-reader` (Unit 8), `units-sig-figs` (math chapter, then Units 3, 6,
   8). Every number comes from seeded generators in `chem-tool-math.js` (`ApChemMath.ice`, `qk`, `buffer`,
   `titration`, `particles`, `units`); each tool's validator regenerates 300 problems per context and
   recomputes them independently; tests in `scripts/test/apchem-tools.test.mjs`. Titration curves are
   solved from the exact charge balance, not sketched. Content is served per context topic, so each
   picture or problem kind unlocks with its unit. **Free or Premium:** as AP® Biology (apbio decision 9),
   the first tool of each unit in map order and every skills tool are free: `particle-diagrams` (Unit 3),
   `ice-table-drills` (Unit 7), `titration-curve-reader` (Unit 8), `units-sig-figs`; `q-vs-k` and
   `buffer-drills` are Premium (`tools`). Owner to confirm (needs-author `tools-premium`).

17. (2026-10-06, Phase 3) **Exams, trainer and entry pages.** Formats and rules in
   `docs/apchem-architecture.md` ("Practice exams", "Justification trainer", "Exams and entry pages").
   - Two **fixed practice exams** (`chem/data/exams/forms.json`), the same for every student, offered
     before the mixed exam the bank assembles: 60 four-option MCQ (Unit 3: 13, Unit 8: 9,
     others 5-6, inside every CED range), 11-12 stimulus sets each (38-41 items in sets), then 3 long + 4 short FRQs from
     the existing set, no question shared. 44 bank items per form (mostly not lesson-check items)
     + 16 **exam-only items** each (`items.json`: a gas-over-water and a buffer set in form 1, a
     Beer's-law and a galvanic-cell set in form 2, plus discrete calculations); exam-only items
     count in the score only, never in practice or on a free page. Every keyed number is recomputed
     in `scripts/lib/apchem-exams.mjs` (`EXAM_NUMBERS`).
   - **Score estimate**: 50/50 by section (MCQ ÷ 60, FRQ ÷ 46), bands at 72/58/42/27 (the cut-offs reported for the
     2014 exam, the current format; tools-exams review), shared with the readiness band (test).
     Labelled an estimate; needs-author `score-cutoffs` (resolved).
   - **Justification trainer** `justify.html`: 37 prompts (3-6 per unit) on the reader-report misses;
     write, tick the rubric checklist, compare an answer that earns the point with one that does
     not. First 3 in course order free (`FREE_JUSTIFY`), the rest Premium (feature `justify`;
     unlocked while `onSale: false`). An app page in `pages.json` (`css` may now be a list).
   - **Entry pages** (free, indexable once published): `equations-sheet.html`,
     `score-calculator.html`, `unit-tests/unit-N.html` (12 fixed questions per unit).
   - Lessons without authored connections get them from the map (navigation, `chem-nav-ref`).
   - The map's case rule treats two-letter symbols (Ka, Kb, Ea, Rf, Kc) as case-sensitive, so a
     label like K<sub>A</sub> is not read as Ka (fixed a false ordering failure in 7.6).
   - **Accuracy-checked 2026-10-06** (`docs/apchem-reviews/tools-exams.md`): the six trainers, 32
     exam-only items, both forms, 37 prompts, the equations sheet, the score calculator and the unit
     tests. No exam key changed; Q tolerance 3% → 5%, buffer generators keep only problems where
     Henderson-Hasselbalch is within 0.02 of the exact pH, score cut-offs 72/58/42/27.
   - Inline stimulus SVGs shrink to the column (`.chem-stim-html svg`; one was 806 px at 360 px).

18. (2026-10-06, launch review) **Published, Premium not on sale.** All nine units and `skills-math`
   are in `published.json`; generators rerun (course, courses, pricing, OG tags, sitemap, crumbs,
   Worker). Hub and 404 cards say "All 96 published topics" once every map topic is out
   (`CHEM_ALL` in `build-pricing.mjs`); site search gained the AP course tints and noscript links;
   changelog entry; `sw.js` cache v59. Fixed-order singles: 22 put in natural order (key moved,
   answer text unchanged), 14 unfixed so they shuffle (as `u5.md`). Continuity pass (chem vs bio
   screenshots, every shared page, 1280/360, light/dark): two shared-layer gaps fixed, the doubled
   answer chip (`study.css` knew only `.bio-mark`) and the notes crumb spacing (`book.css`).
19. (2026-10-08) **Periodic table popup, shared with ochem.** Every AP page loads
   `ochem/assets/periodic-table.{css,js}` (head and `tail()` in `scripts/lib/apchem-build.mjs`); the
   script tag carries `data-course="chem"`, which swaps the organic-chemistry notes for group and
   period, and the cells show atomic mass (as on the exam's table) instead of electronegativity. One
   file serves both courses. Masses: IUPAC abridged standard atomic weights (Zr 91.222 per the 2024
   revision); [n] for no stable isotope. Checked from memory only (no web access that session), so
   worth a spot-check against the CIAAW table; Tc [98] vs [97] and superheavy mass numbers vary by source.
20. (2026-10-09, tools upgrade P1-Chem; `docs/tools-upgrade.md`) **Problem first on phones.**
   `ApChemTools.frame` lays out every trainer: a one-line kind picker ("Kind of problem: Any kind",
   `kindPicker`), the problem, then "About this drill/tool" (intro and how it works) folded below it
   (open from 900 px). Under 640 px the tool opener drops its lede and shrinks to the title. After a
   graded problem `ApChemTools.keepGoing` adds a "Keep going" strip: the topic's lesson and notes, the
   lessons of other topics a missed step belongs to (`partTopics`), and up to five glossary terms
   taught in those topics (`glossary.html#t-<id>`). Only built topics are linked. Problem codes,
   item ids and `toolResult` records are unchanged. **Justification trainer** opens on the first
   prompt in course order not yet self-checked (and open to the student), with "All N prompts"
   above it; the list is `justify.html?list=1` (or `?unit=`/`?skill=`); `?p=<id>` is unchanged; How it
   works is a disclosure below the work. **Equations sheet**: a row's sixth field names the trainers
   that practice it ("Practice it:" links, live tools only). **Live beaker**
   `chem/assets/tools/live-beaker.js` (`ApChemBeaker`, not loaded by any page yet; API in
   `docs/tools-upgrade.md`), tests in `scripts/test/apchem-beaker.test.mjs`.
21. (2026-10-09, tools upgrade U-Chem; `docs/tools-upgrade-notes/chem.md`) **Explore, then test yourself.**
   Every trainer opens on an Explore pane (`ApChemTools.modes`) with the existing drill as "Test yourself"
   (`?seed=`/`#quiz` open it; ids, recording and problem codes unchanged). Explore: titration with burette,
   live flask and indicator color; buffer beaker taking + OH⁻/+ H₃O⁺ past capacity; Q vs K vessel (amounts,
   volume, Let it react); ICE with x on a slider (the quiz's ICE table also drives live bars and a Q-to-K
   gauge); particle build mode with an atom tally; units set-up with cancelling chips. New pure models
   (`titration.species/region/cross`, `bufferState`, `equilibrate`, `atomsOf`, unit cancelling,
   `units.generate().setup`) in `chem-tool-math.js`, tested in `scripts/test/apchem-explore.test.mjs`;
   listed for accuracy review in the notes file.

## 8. Open items for the owner

- **Launch checklist (only you can do).** The course is published (free parts live, Premium shows
  "coming soon" and locks nothing) until these are done, in order:
  1. Apply `scripts/sql/migrations/2026-10c-apchem.sql` in Supabase (after 2026-10b).
  2. Create the Polar product "AP® Chemistry Premium (through June 30, 2027)", one-time $25.
  3. Add `"chem-2027": "<product id>"` to `POLAR_PRODUCTS` (Worker config, the `chem` pass key).
  4. Merge the PR, then deploy the Worker (`node scripts/build-worker.mjs`, then deploy).
  5. Delete `onSale: false` from `COURSES.apchem` in `assets/premium.js` and bump `CACHE_NAME` in `sw.js`.
- Questions in `docs/apchem-needs-author.md` (CED exclusions for Units 3-9, practice weights,
  which trainers are free).
- Optional: a chemistry teacher to review the course (the Beta note stays until then).
