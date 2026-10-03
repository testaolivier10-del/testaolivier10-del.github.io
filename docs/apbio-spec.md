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
| 0.1 | Course registry refactor | `claude/apbio-registry` | merged (PR #33) |
| 0.2 | CED topic map (own words) | — | done: `docs/apbio-ced-map.json` (61 topics; unverified against the official PDF, needs-author ced-verify) |
| 0.3 | Dependency map, build-apbio, check-apbio-map, check-apbio-content, CI | `claude/apbio-phase0` | done: map 777 concepts, 61 CED + 14 skills topics (`docs/apbio-phase0.md`); engine and generator (`docs/apbio-architecture.md`); nothing published, all pages noindex |
| 0.4a | App pages: practice, review, exams, FRQ, dashboard, flashcards, search, teachers; share links | `claude/apbio-apps` | done against the placeholder sample (`docs/apbio-architecture.md`, "App pages") |
| 0.4b | Simulators + skills tools: osmosis and enzyme simulators, 6 skills tools + Hardy-Weinberg and Simpson (hidden until Units 7-8), design drills (placeholder) | `claude/apbio-tools` | merged into `claude/apbio-beta` |
| 0.5 | Site registration: registry, Premium and the fixed-date pass, Worker, SQL migration, hub/404/pricing (shown once a unit is published), search, tutor, sitemap, manifest, OG card, budgets, browser checks, exam-date default, privacy "For schools" | `claude/apbio-register` | done (decisions 9-19); owner steps in section 6 |
| 2 | Units 1-3 + statistics skills, Beta | `claude/apbio-beta` (authors on `claude/apbio-u1`, `-u2a`, `-u2b`, `-u3`, `-skills`) | writing |
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

9. (2026-10-03) **Tools.** One tool = a `pages.json` `tools[]` entry, a script, a data file and
   a validator, on a shared framework (`ApBioMath`, `ApBioProblems`, `ApBioTools`); details in
   `docs/apbio-architecture.md`, "Tools". Tool data is served per published topic, so the
   Hardy-Weinberg and Simpson tools (built now) go live with Units 7 and 8. The osmosis simulator
   is the free one; the enzyme simulator is Premium (`tools`). Skills tools and drills are free
   for now (owner to confirm, needs-author `tools-premium`). Formula-sheet conventions: sample SD
   with n − 1, 95% CI ≈ mean ± 2 SE, T = °C + 273, R = 0.0831 L·bar/(mol·K), χ² at p = 0.05.
10. (2026-10-03) **Free lessons: Units 1 and 2 and every skills lesson.** The brief's "the first
   lesson of each skills topic" is every skills lesson, because a skills topic has one lesson.
   `isFreeTopic` (`scripts/lib/apbio-build.mjs`) marks every topic outside the course units free;
   `topic.free` in the curriculum carries it to `ApBioCore.locked`, the lesson gate and the
   structured data. `freeChapters` in `assets/premium.js` stays `['unit-1', 'unit-2']`, so skills
   *practice* still counts against the 15 a day. One free simulator is the tools branch's to mark
   (`ApBioCore.allowed('tools')` still locks every tool when locked; 0.4b must free one).
11. (2026-10-03) **Registered now, listed once a unit is published.** `apbio` is in
   `assets/courses.js` (status `beta`) and every per-course table, the Worker and the SQL, so the
   course is a full site citizen the moment `bio/data/published.json` lists a chapter. Until then
   `isOpen()` in `scripts/lib/courses.mjs` keeps it off what build scripts write: the hub card,
   the 404 card, its premium.html section, the hub FAQ and structured data
   (`scripts/build-pricing.mjs`), and the sitemap (every page is noindex before launch). Runtime
   lists read the registry directly and show nothing because the generated data is empty (site
   search, the tutor, hub Continue links). Nothing anywhere states a count that is not counted
   from the generated data; premium.js names no bank size for this course.
   `APBIO_PUBLISHED=unit-1` shows the launched state: run `build-apbio`, `build-pricing`,
   `build-sitemap` with it, then again without.
12. (2026-10-03) **Names and the mark.** `name` and `productName` "AP® Biology" (receipts, dialog,
   hub, account); `short` "Biology" (phone header), `rankLabel` "Biology rank", `searchLabel`
   "Biology": a label shown on every page should not need the disclaimer. Aliases `bio`,
   `biology` (A&P keeps `ap`). Manifest `bio/manifest.json` is "LevlPrep — Biology" and the
   OG card says "Biology for the May exam, from scratch": neither carries the mark (an install name
   and a preview card are ad copy; an image cannot carry the disclaimer). The disclaimer is on the
   site home, account, offline, search, privacy, terms and, when the course is open, premium.html
   and the 404 card. Site rule `apbio-trademark` now also checks pages outside `bio/` that show
   "AP®" (disclaimer, adjective, no mark in meta descriptions) and every manifest.
13. (2026-10-03) **The course key never goes into a URL.** `apbio` contains the token "ap"
   (decision 2), so URLs name the course by its folder, `bio`: site search's `?course=`
   (`LevlSearchAll.urlKey`), the header's search link and overlay (`site-chrome.js`), and the
   Polar success URL (`urlCourse` in `worker/src/premium.js`; `returnCourse` in premium.js accepts
   a folder name). The pass id is `bio-2027`.
14. (2026-10-03) **A fixed-date pass.** `{ id: 'bio-2027', label: 'Through June 30, 2027', price:
   25, until: '2027-06-30' }`. The dialog says "One pass, valid through June 30, 2027" and hides
   it after the date. The Worker's PASSES entry has `until: '2027-06-30T23:59:59-10:00'` (end of the
   day in Hawaii, the last US time zone): checkout refuses it after that (410), and the webhook and
   reconcile call `premium_add_pass` with `p_until` and one day as the floor, so a pass runs at
   least to the date whenever it is bought (a purchase behind a running pass or grant starts when
   that ends and still runs to the date; inside the last day it gets one day). The founding
   discount applies exactly as for other passes (the same `FOUNDING_DISCOUNT_ID` at checkout).
15. (2026-10-03) **Under-18 buyers.** terms.html already required a parent or guardian's
   permission (and the parent making the purchase under 16, as Polar's rule); nothing was
   weakened. The purchase dialog now says so for every course, premium.html too, and terms gained
   the fixed-date pass rule (`#fixed-date`) and the College Board in "Not affiliated". Legal
   questions for a person: `docs/apbio-needs-author.md`, "Legal".
16. (2026-10-03) **SQL.** `scripts/sql/migrations/2026-10b-apbio.sql` (named so it sorts after
   `2026-10-audit.sql`: migrations run and are tested in file-name order) re-adds the course check on
   `premium_passes`, `premium_funnel`, `exam_completions` and replaces every function with a
   course list (`report_question`, `join_waitlist`, `count_premium_step`, `premium_add_pass`,
   `record_exam_completion`, `count_premium_paid`), adding `apbio`; `premium_add_pass` gains
   `p_until` (old nine-argument version dropped). Same edits in `schema.sql` and `reports.sql`.
   Run twice against PGlite on the old schema plus the audit migration and on a fresh schema: one
   `premium_add_pass`, checks include `apbio`, a dated pass ends at the date. Not applied anywhere.
17. (2026-10-03) **Exam date default.** `assets/exam-date.js` has `DEFAULTS.apbio` (2027-05-03,
   "AP® Biology exam (Mon, May 3, 2027)"): the card counts down to it, named, until the student
   sets a date; Clear stores "none" so it does not come back. The dashboard's one-time seeding
   (decision 8) is gone.
18. (2026-10-03) **Tutor, search, offline.** The tutor indexes the published notes
   (`bio/assets/notes-index.json`) and the glossary page, falls back to `bio/search.html`, and has
   AP® Biology rules in the Worker (`COURSE_RULES.apbio`: high-school level, mechanism, no released
   exam content, coach FRQs rather than write them). No tutor bank (as A&P). Site search indexes
   published lessons, glossary and notes. `sw.js` precaches the bio shell (`COURSE_URLS.bio`).
19. (2026-10-03) **Checks are data-driven.** `check-weight` budgets the bio shell (50 KB, measured
   45.5), the home and app shells, and, from `notes-index.json`, the first published lesson,
   notes page and unit sheet, plus every bank file (A&P's per-chapter budgets), glossary,
   notes index and summaries. `check-a11y` adds the bio home, glossary, practice, exams and FRQ
   pages and, when they exist, the first lesson, notes page, unit sheet, FRQ and tool;
   `check-console` loads every bio page and runs a practice flow once a topic is published. With
   Unit 1 published both passed after one fix: an unpublished unit's card used opacity, which
   took its text below 4.5:1, and now uses a dashed outline.
20. (2026-10-03) **Privacy "For schools"** (`privacy.html#schools`): no login for student
   content; what a student who never signs in leaves (nothing with a name: device storage, the
   anonymous counter, Umami's cookieless analytics, error and problem reports); what signing in
   adds; Polar for purchases; processors Supabase, Cloudflare, Polar, Umami Cloud, Resend (and
   GitHub Pages, Google Classroom on press); retention as the existing section; no ads, no
   selling, no profiling; deletion in-app or by email; willingness to sign the SDPC NDPA. It
   summarizes the page and adds no new collection.

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

## 6. AP® Biology launch: owner checklist (only you can do these)

In this order: the Worker calls `premium_add_pass` with `p_until`, so **the migration must be
applied before the Worker is deployed**, or every purchase webhook fails.

- [ ] **1. Apply the migration before selling.** Supabase → project → SQL Editor → New query → paste
      `scripts/sql/migrations/2026-10b-apbio.sql` → Run (idempotent). Check:
      `select pg_get_constraintdef(oid) from pg_constraint where conname = 'premium_passes_course_check';`
      lists `apbio`, and `select count(*) from pg_proc where proname = 'premium_add_pass';` is 1.
- [ ] **2. Create the Polar product.** Polar → Products → New product:
      - Name: **AP® Biology Premium (through June 30, 2027)**
      - Pricing: **one-time purchase, fixed price, $25.00 USD**
      - Description: "Premium for LevlPrep's AP® Biology course until June 30, 2027, whenever you
        buy it: every interactive lesson, every simulator, unlimited practice and review, all
        free-response questions and practice exams, the cram kit (from March 2027) and the full
        dashboard. One-time, never renews. Buyers under 18 need a parent or guardian's permission.
        AP® is a trademark registered by the College Board, which is not affiliated with, and does
        not endorse, this site."
      - If the founding-member discount (Polar → Discounts) is limited to products, add this one.
      Copy the product id.
- [ ] **3. Add it to `POLAR_PRODUCTS`.** Cloudflare → Workers → levlprep-ask → Settings →
      Variables and Secrets → `POLAR_PRODUCTS` (plaintext JSON, pass id → Polar product id). Add one
      entry to the existing object, keeping the five there:
      `"bio-2027": "<the product id from step 2>"`, e.g.
      `{"nremt-90":"…","ochem-semester":"…","ochem-year":"…","anp-semester":"…","anp-year":"…","bio-2027":"<id>"}`.
- [ ] **4. Deploy the Worker** after merging to main (the "Deploy Worker" Action, or paste
      `worker/dist/worker.js`). Then buy `bio-2027` once in Polar's sandbox (or with a 100% code),
      check the `premium_passes` row ends `2027-07-01 09:59:59+00` (June 30, 23:59:59 Hawaii), and
      refund it from the Account page.
- [ ] **5. Publish Unit 1** (`bio/data/published.json`) only after its accuracy check; the hub
      card, pricing section, sitemap and search entries appear with it.

