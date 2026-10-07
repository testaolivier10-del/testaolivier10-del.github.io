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
| 0 | CED topic map (own words, 91 topics), dependency map, fork generator and runtime, checks, registration (registry, Premium pass, Worker, SQL migration, hub/pricing hidden until published, search, sitemap, OG card, budgets, theme colour) | **done 2026-10-06** (decisions 6-12): `docs/apchem-ced-map.json`, `docs/apchem-dependency-map.json` (96 topics, 285 concepts; `docs/apchem-phase0.md`), `scripts/build-apchem.mjs`, `check-apchem-map.mjs`, `check-apchem-content.mjs`, runtime `chem/assets/`, formats in `docs/apchem-architecture.md`, rules in `docs/apchem-authoring-guide.md`. Nothing published (`chem/data/published.json` empty, every page noindex); placeholder sample only in `scripts/test/fixtures/apchem-data/` |
| 1 | Units 1-3 (where students are now) with the math refresher, notes, lessons, banks, FRQs, particle-diagram practice; independent accuracy check per unit; Beta | in progress. **Unit 3 written 2026-10-06** (13 topics, 220 items, 6 FRQs: 2 long, 4 short; 13 figures in `chem/figures/`), all checks clean, not published, independent accuracy check pending (needs-author `unit3-real-gas-data`, `unit3-scope-checks`) |
| 2 | Units 4-6, then 7-8 with the drills and titration reader, then 9; accuracy check per unit | |
| 1 | Units 1-3 (where students are now) with the math refresher, notes, lessons, banks, FRQs, particle-diagram practice; independent accuracy check per unit; Beta | next |
| 2 | Units 4-6, then 7-8 with the drills and titration reader, then 9; accuracy check per unit | Unit 4 drafted 2026-10-06 (9 topics, 147 items, 4 FRQs: `frq-oxalic-acid-titration` long, `frq-ammonia-limiting`, `frq-metal-displacement`, `frq-sulfate-precipitate` short; 9 figures); not published, accuracy check pending. Map: `limiting-reactant` moved to 4.3 (needs-author `unit4-limiting-reactant-moved`) |
| 1 | Units 1-3 (where students are now) with the math refresher, notes, lessons, banks, FRQs, particle-diagram practice; independent accuracy check per unit; Beta | next |
| 2 | Units 4-6, then 7-8 with the drills and titration reader, then 9; accuracy check per unit | Unit 7 content written 2026-10-06 (decision 13): 12 topics, 200 items, 13 figures, 5 FRQs; not yet accuracy-checked or published; ICE and Q-vs-K trainers not built |
| 2 | Unit 5 accuracy check | **done 2026-10-06**: `docs/apchem-reviews/u5.md` (171 items, 3 FRQs, 11 figures; 31 items fixed, no key wrong in substance); needs-author `unit5-kinetics-scope` resolved (Arrhenius calculations excluded per the CED; the rest kept) |
| 3 | Justification trainer, full practice exams, equations-sheet page, score calculator, cram kit | |
| 4 | Second accuracy pass on the whole course; PR to owner | |

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
   `apchem-trademark` and `apchem-beta-and-report`, `sw.js` (`COURSE_URLS.chem`, cache v58). Site
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
   (needs-author `unit8-values`). Next: the independent accuracy check (section 6).

13. (2026-10-06, Unit 7) **Unit 7 content and two shared fixes.** Map: "Q < K", "Q > K", "Q = K" moved to
   `reaction-quotient` (7.3, where the CED teaches the comparison; `q-vs-k` in 7.10 keeps the justification
   terms) and `ice-table` moved to `calculating-k` (7.4 uses ICE tables before 7.7). Grader: the numeric
   floating-point slack in `chem-questions.js` (and the matching check in `check-apchem-content.mjs`) is now
   relative to the key; the old absolute 1e-9 accepted any answer to a Ksp-sized question (test added).
   Five FRQs: long `frq-iron-thiocyanate` (lab, Beer's law, Q vs K) and `frq-hydrogen-iodide-particles`;
   short `frq-methanol-shift`, `frq-strontium-fluoride`, `frq-phosgene-ice`. Open points: needs-author
   `unit7-data`, `unit7-small-x`.

## 8. Open items for the owner

- Launch checklist (only you can do), as `docs/apbio-spec.md` section 6, once Units 1-3 are
  published: (1) apply `scripts/sql/migrations/2026-10c-apchem.sql` in Supabase (after
  2026-10b); (2) Polar product "AP® Chemistry Premium (through June 30, 2027)", one-time $25;
  (3) add `"chem-2027": "<product id>"` to `POLAR_PRODUCTS`; (4) deploy the Worker after merging;
  (5) delete `onSale: false` from `COURSES.apchem` in `assets/premium.js` and bump `sw.js`.
- Questions in `docs/apchem-needs-author.md` (CED exclusions for Units 3-9, practice weights,
  which trainers are free).
- Optional: a chemistry teacher to review the course (the Beta note stays until then).
