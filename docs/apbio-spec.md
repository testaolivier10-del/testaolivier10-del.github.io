# AP® Biology course: spec and status

The source of truth for LevlPrep's fourth course. A fresh session reads this file, `CLAUDE.md` and
`docs/apbio-needs-author.md`, not the chat history. When the plan changes, update this file in the
same commit. Open points for a person go in `docs/apbio-needs-author.md`.

Course key `apbio` (storage, analytics, registry, SQL). URL path `/bio/`. Every new browser global
starts with `ApBio`. Template: the Anatomy & Physiology course (`docs/anp-spec.md`,
`docs/anp-phase1-architecture.md`, `docs/anp-tools-contract.md`).

## 1. Owner brief (2026-10-03), condensed

- **Positioning (course home):** built on the 2025 framework, in order; teaches from scratch for
  students whose class moves too fast; harder, data-heavy practice that matches the real exam; see
  the process, then answer questions about it.
- **Lessons** for every CED topic in CED order, A&P lesson format (hook, prerequisites with review
  links, figure, numbered cause-and-effect chain, key ideas, misconception, check questions,
  summary, connections), from zero at high-school level, slower and visual.
- **Notes page per topic (free forever), glossary with popups, flashcards, printable unit sheet
  per unit.**
- **Question bank:** every item tagged explicitly with unit, topic and science practice (no
  keyword inference). Standalone MCQ and stimulus sets of 4-5 MCQs sharing one stimulus (table,
  graph, experimental setup, model). At least 60% application/analysis, realistic distractors,
  data-heavy stimuli. Per-option explanations, never by letter. The A&P test-wise balance rules,
  no duplicates, no length tells.
- **Skills track** (own Learn section, mixed into practice), built on the official formula sheet,
  auto-checked numeric or structured answers: chi-square, SD and SE, 95% CI and error bars,
  Hardy-Weinberg, water potential, rates and percent change, Simpson's diversity index, graph
  construction (keyboard accessible, auto-checked).
- **Experimental design and argumentation drills:** IV/DV, choose and justify a control, null
  hypothesis, claim-evidence-reasoning, prediction plus mechanism.
- **FRQ practice, all 6 types** (2 long 9-point Interpreting and Evaluating Experimental Results,
  one with graphing; 4-point Scientific Investigation, Conceptual Analysis, Analyze Model or
  Visual Representation, Analyze Data), each with point-by-point rubric, sample full-credit
  answer, self-score checklist (no AI grading), printable PDF with lined space.
- **Simulators** (each followed by 3-5 stimulus questions and a mini FRQ), anp-tools-contract
  standards: enzyme activity and inhibition, osmosis and water potential, ETC and ATP synthase,
  light reactions and Calvin cycle, signal transduction with amplification, cell cycle
  checkpoints, meiosis and nondisjunction, lac and trp operons, Hardy-Weinberg and drift,
  phylogenetic tree reading, population growth, energy flow through trophic levels.
- **Exams:** unit tests weighted by topic; full timed practice exams in the hybrid format (60 MCQ
  in 90 min with stimulus sets, then 6 FRQs in 90 min on screen with printable answer booklet
  and timer, then rubric self-scoring); readiness estimate labelled "not calibrated". Exam date
  countdown defaults to Monday 3 May 2027.
- **Dashboard:** mastery by unit, topic and science practice; misses link to the exact lesson.
- **Cram kit by 2027-03-01:** 3-week and 2-week plans weighted by unit, unit sheets, mixed timed
  sets.
- **Teachers and under-18s:** no login for student content; stable share links, "Share to Google
  Classroom", printable versions; `/bio/teachers.html`; no new personal data; privacy.html "For
  schools" section; terms and purchase dialog fit buyers under 18 with parent permission.
- **Trademark:** "AP®" with ®, adjective only, never plural or possessive, no College Board logos,
  no "AP" in URLs, file names, meta tags or ad copy. Disclaimer on the course home, the site home
  and every page using the mark. Site rule enforces disclaimer, ®, and no "ap" in course URLs.
  Everything original; never reproduce released questions, AP Classroom items or CED text.
- **Figures:** OpenStax Biology 2e (CC BY 4.0) via the A&P pipeline (own credit line, CC BY or PD
  only, "Adapted: labels hidden") plus generated SVGs.
- **Free:** every notes page, glossary, unit sheets, all Unit 1 and 2 lessons, the first lesson of
  each skills topic, one simulator, 15 practice questions a day, one full practice exam.
  **Premium:** "AP® Biology pass", $25 one-time, valid through 2027-06-30, founding discount
  applies: every lesson, every simulator, unlimited practice and review, all FRQs and exams, cram
  kit, full dashboard.
- **Quality:** independent accuracy check per unit (separate helper, against OpenStax Biology 2e
  and the CED); contested items to `docs/apbio-needs-author.md`; Beta badge and "not yet reviewed
  by an AP® Biology teacher" until sign-off; Report a problem on lessons, notes, questions; every
  audit lesson held (no false free claims, gated structured data, no global collisions, ordered
  items never shuffled, explicit concept tags, accessible SVG, contrast, lazy banks within
  budgets, no hard-coded counts, title pattern, noindex app pages).
- **Schedule:** (1) Phase 0 merged; (2) Units 1-3 + statistics skills, published in Beta, with
  hub card, sitemap, OG image, search, tutor, manifest, pricing; (3) Units 4-8 one at a time, full
  course and practice exams by 2027-01-15; (4) cram kit by 2027-03-01. After (2): summary, Polar
  product, human-review list; update README, sources.html, changelog, generated counts.

## 2. Phase status

| Phase | What | Branch | Status |
|---|---|---|---|
| 0.1 | Course registry refactor | `claude/apbio-registry` | in progress |
| 0.2 | CED topic map (own words) | — | in progress |
| 0.3 | Dependency map, build-apbio, check-apbio-map, check-apbio-content, CI | `claude/apbio-phase0` | engine and generator done (`docs/apbio-architecture.md`); map open |
| 0.4 | App pages: practice, review, exams, FRQ, dashboard, flashcards, search, teachers; share links | `claude/apbio-apps` | done against the placeholder sample (`docs/apbio-architecture.md`, "App pages") |
| 2 | Units 1-3 + statistics skills, Beta | | not started |
| 3 | Units 4-8, practice exams (by 2027-01-15) | | not started |
| 4 | Cram kit (by 2027-03-01) | | not started |

## 3. Decisions log

1. (2026-10-03) **Fork, not generalize, the A&P runtime.** The course gets its own `ApBio*`
   modules under `bio/assets/`, copied from the A&P ones and adapted (units, science practices,
   stimulus sets, numeric answers). Reason: the A&P engines are reviewed and live; generalizing
   them risks A&P for no gain to it (the reason A&P itself gave for not reusing ochem's engines,
   anp-spec decision 26). Shared site modules (header, XP, accounts, report, analytics, service
   worker, premium) are used as they are, through the course registry.
2. (2026-10-03) **No "ap" in any served course path.** Files under `bio/` never contain the
   token "ap" or "apbio" (`bio/assets/bio-core.js`, not `apbio-core.js`), and question ids start
   `bio-`. Storage keys, analytics names and the registry key stay `apbio` (never in a URL). The
   course key in query strings is `bio`. Build scripts and docs outside `bio/` keep the names the
   owner gave (`build-apbio.mjs`, `docs/apbio-spec.md`).
3. (2026-10-03, owner) **"AP® Biology" in page titles, always with the ®.** The owner allowed the
   mark in `<title>` (and so in `og:title`, which the site copies from it) when written "AP®
   Biology", e.g. "Cell Membranes — AP® Biology Notes | LevlPrep". Every other meta tag
   (description, keywords, og:description), URLs and file names stay free of "AP". The site rule
   fails a title with "AP" not followed by "®" or not used as an adjective, and any other meta tag
   with "AP".
4. (2026-10-03) **CED source access.** apcentral.collegeboard.org is blocked by this environment's
   network policy, so the topic map was built from secondary sources that reproduce the CED's
   structure, cross-checked against each other, and written in our own words. A person should
   confirm it against the official CED (needs-author).

5. (2026-10-03) **Phase 0 engine.** Data layout, formats, generator, runtime and checks are in
   `docs/apbio-architecture.md`; authoring rules in `docs/apbio-authoring-guide.md`. The
   generator's own small map loader (`scripts/lib/apbio-build.mjs`) stands in for
   `scripts/lib/apbio-map.mjs` until the map lands; without `docs/apbio-dependency-map.json`
   nothing is generated, and tests use `scripts/test/fixtures/apbio-map-stub.json` under
   `APBIO_MAP_STUB=1`. `bio/data/published.json` starts empty, and while it is empty every
   generated page is noindex. The sample topic `water-hydrogen-bonding` is placeholder content.
6. (2026-10-03) **Item formats.** Every item carries `unit`, `topic` and `practice` (skill id,
   e.g. "4.B"); types single, multi, numeric (absolute tolerance, unit, decimals), order (graded
   against authored order), predict; stimulus sets are 4-5 consecutive items sharing a stimulus
   (table, graph drawn from data at build time, setup, model); a concept topic needs 15+ items,
   60% apply/analyze and 40% in sets; the key may be the longest option at most 40% of the time.
   The bank is split per unit with a lazy index (A&P decision 76).
7. (2026-10-03) **Beta, report, disclaimer on every page.** Every course page's footer carries the
   Beta note ("not yet been reviewed by an AP® Biology teacher"), the trademark disclaimer and a
   Report a problem button; site rules `apbio-trademark` and `apbio-beta-and-report`.
8. (2026-10-03) **App pages** (`docs/apbio-architecture.md`, "App pages"). Stimulus sets are
   served whole everywhere (practice step, unit test, Section I). The practice exam scales down
   honestly to a "shorter practice exam" while the bank is incomplete. Readiness band from 60% MCQ
   + 40% FRQ, labelled "Not calibrated". FRQ workspace gated like lessons, prompt and printable
   sheet always open (needs-author frq-gating). The dashboard seeds the exam date 2027-05-03 once
   (exam-date.js has no per-course default). teachers.html is generated, not an app.

## 4. Map format (Phase 0)

`docs/apbio-dependency-map.json` (validated by `scripts/lib/apbio-map.mjs`, checked by
`scripts/check-apbio-map.mjs`). Source for unit/topic facts: `docs/apbio-ced-map.json`.

```
{ "about", "version", "ced": { "edition", "effective", "note" },
  "bigIdeas":  [{ "id": "EVO|ENE|IST|SYI", "name", "summary" }],
  "practices": [{ "id": 1..6, "name", "mcqWeight": [min, max] }],
  "parts":     [{ "id": "course", "title" }, { "id": "skills", "title": "Skills" }],
  "chapters":  [{ "id": "unit-1", "n": 1, "part": "course", "title", "weight": [8, 11],
                  "tools": { "simulators": [], "frqThemes": [], "stimulusThemes": [],
                             "comparisonTables": [], "pathways": [] } },
                { "id": "skills-stats", "part": "skills", "title", ... }],
  "topics":    [{ "id": "<slug>", "ced": "1.1" | null, "title", "chapter", "kind": "concept|skill|drill",
                  "bigIdeas": [], "practices": [focus practice ids], "after": "<topic id>" (skills
                  and drills only: placed right after that topic in the course order),
                  "searchPhrase" }],
  "concepts":  [{ "id", "term", "aliases": [], "taughtIn": "<topic id>", "dependsOn": [] }],
  "everydayWords": { "about", "words": [] },
  "circularDependencies": [{ "id", "problem", "resolution": "pull-forward|preview", "into": [],
                  "fullIn": [], "detail" }] }
```

Course order: unit topics in CED order; each skill/drill topic sits right after its `after`
topic. Slugs and ids never contain the token "ap" (decision 2). Ordering rule as A&P: no concept
used before the topic that teaches it, except everyday words and declared preview boxes.

## 5. Open items

See `docs/apbio-needs-author.md`.
