# AP® Calculus BC launch: running log

A restart picks up from the last line. Steps, as the AP® Precalculus launch (`docs/apprecalc-reviews/launch.md`):
(0) merge AP® Precalculus in; (1) publish and register live, every generator; (2) site-wide wording, sources,
changelog, social card and trainer covers; (3) continuity pass at 1280 and 360 px, light and dark (Playwright
Chromium); (4) full CI with browser checks; (5) spec, CLAUDE.md, owner checklist, PR.

## 0. AP® Precalculus merged in

AP® Precalculus (PR #123, branch `claude/apprecalc`, course 11) is not merged to main, and BC is course 12, so
`origin/claude/apprecalc` was merged into `claude/apcalcbc` (a merge commit, no rebase). 44 files conflicted, all
of them course lists that each branch had extended by one course. Resolved so both are registered everywhere
(`courses.js`, `premium.js`, account, analytics, flags, study, hub, invite, tutor, search, theme and hub CSS,
offline page, worker source and dist, pricing, OG tags, sitemap, check-site, check-a11y, check-console,
check-weight, CI workflow and `ci-local.sh`, `r3-*`, videos, dashboard page, `schema.sql`, `reports.sql`).
`sw.js` went above both (v101, then v102 at launch).

The BC migration was `2026-10n-apcalcbc.sql`, which sorts before `2026-10n-apprecalc.sql`: renamed
`2026-10o-apcalcbc.sql` so it runs after Precalculus, and its course lists now read `..., 'appsych', 'apprecalc',
'apcalcbc')`. `sql-migration.test.mjs`: the Precalculus test no longer expects to run last and compares against
`schema.sql` without `apcalcbc` (`PRE_BC`); the BC test expects to run last, after Precalculus, with the full list.

## 1. Published and live (decision 11)

- `calculus-bc/data/published.json`: `skills-math`, `unit-1`..`unit-10` (121 topics, 1,902 bank questions, 510 of
  them BC's own).
- `assets/courses.js`: `status: 'live'`; `node scripts/build-courses.mjs`, `build-apcalcbc.mjs` and every generator
  rerun (course pages, notes, flashcards, question bank, lesson meta, crumbs, tool pages, homes, pricing, sitemap,
  OG tags, worker).
- Generated as a result: hub card and 404 card, premium.html block (Premium "not on sale"), terms "passes with an
  end date" list, structured data, home facts ("12 courses"), manifest description, search scope, sitemap (the 33
  BC topics, units, unit sheets and tests, BC's own FRQs, trainers; AB-topic pages are canonical to AB and left out).
- Found and fixed:
  - The home's "practice questions" total added BC's whole bank, which also serves AB's 1,392 questions, so AB was
    counted twice (20,599). It now counts BC's own questions only (`apcalcbcOwn` in `premium-data.mjs`): 19,207.
  - Course search (`site-search-all.js` `urlKey`) did not map `apcalcbc` to its folder, so a search link would
    have put the key, not `calculus-bc`, in the URL (decision 2). Fixed; `site-search.test.mjs` covers BC.
  - BC's copies of AB's 21 free-response questions were self-canonical (duplicates of the AB pages). They now name
    the AB page, as BC's AB topics do, and leave the sitemap; check-site's sitemap rule skips a page canonical to
    another course folder, as `build-sitemap.mjs` already did.
  - Course home: the bank strip said "Being written" and the covers paragraph "The course is being written"; now
    "1,902 questions" and "Built on Calculus AB" (Units 1 to 8 are AB's pages, so a fix lands in both).
- Premium stays `onSale: false` (owner checklist, spec section 9). The "not yet reviewed by an AP® Calculus BC
  teacher" note stays; no score calculator, readiness band or Beta label (checked on the home, exams, tools and
  dashboard in the sweep below).

## 2. Site-wide

- "Twelve courses": home meta description and hero lede (names Calculus BC), search page (meta, lede, noscript
  links), sources meta, `cross-course.js`, `r3-home.mjs`, `r3-reading.mjs` comments; generated "12 courses" on the
  home and in the manifest.
- `sources.html`: an AP® Calculus BC section (written originally, checked twice by code and an independent review,
  not yet reviewed by a teacher). `changelog.html`: "New course: AP® Calculus BC" (31 October 2026).
- `robots.txt` already hid `calculus-bc/data/notes/`; `sw.js` cache v102.
- Social card `calculus-bc/assets/og-image.png`: already rendered in Phase 0; re-rendered, byte-identical.
- Trainer covers: `assets/covers/tools/apcalcbc/` did not exist, so BC's home and tools page showed no trainer art.
  Six covers in the course palette (deep violet `#34104C`, lilac `#C88CFF`, gold `#FFD23F`), one per BC trainer
  (series lab, Taylor lab, parametric motion, polar lab, integration methods, Euler and logistic), with
  `index.json`. The ten AB-linked trainers on BC's tools page keep AB's covers (`coverKey: 'apcalc'` through
  `apToolsHubMain`); AB's build is byte-identical.

## 3. Continuity pass

Swept with Playwright Chromium at 1280 and 360, light and dark (prefers-color-scheme): the BC home, a BC lesson and
its notes page (10.8 the ratio test), an AB topic on BC (3.1 the chain rule), practice, review, flashcards, exams,
tools, dashboard and three BC trainers (series lab, polar lab, parametric motion). No horizontal overflow on any
page; dark mode followed on every page; no Beta label, readiness band or score calculator; the "not yet reviewed"
note on the home, tools and dashboard. Console: only blocked external requests (fonts and analytics through the
sandbox proxy).

- The course home eyebrow says "2027 exam" (set in Phase 0, as Precalculus and Psychology).
- Checked, same as the other courses, no change: Read | Interactive toggle on lessons, flashcards (decks by unit,
  term, definition and topic-summary cards), review (empty state), exams setup (practice exam, unit test; 29 + 13
  multiple choice, then 2 + 4 free response), dashboard design F (no band), Tool Studio full screen with Explore and
  Test yourself on the three trainers swept, the tutor button. The tools page lists five trainers, one skills tool
  (integration methods) and the ten Calculus AB trainers, from `pages.json` kinds.

## 4. CI

- First non-browser run, right after the merge: one failure, `build-apcalcbc.mjs --check` (the BC formula page was
  stale against the merged shared code); regenerated.
- After publishing, check-site found: 197 BC pages "missing" from the sitemap (copies canonical to AB, which the
  sitemap rightly leaves out: the coverage rule now skips them as `build-sitemap.mjs` does); British spellings
  ("cancelled", "cancelling", "labelled") in one BC question file and one figure; three meta descriptions over 160
  characters (the parametric-motion trainer, and the home and search pages after the "twelve courses" wording).
  Fixed.
- `BROWSER=1 scripts/ci-local.sh` (every job in `checks.yml`, the unit tests, check-a11y and check-console) after
  the last fix: **ALL PASS**. AB: `node scripts/build-apcalc.mjs --check` byte-identical (333 files).

**Launch phase done.** PR opened (owner reviews and merges after PR #123); Premium waits for the owner checklist in
spec section 9.
