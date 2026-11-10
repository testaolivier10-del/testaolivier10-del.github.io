# AP® Human Geography launch: running log

A restart picks up from the last line. Steps, as the AP® Macroeconomics launch (`docs/apmacro-reviews/launch.md`):
(1) the tools review's two open fixes, the exams review's author items and `scale-words`; (2) publish and register
live, every generator, site-wide wording, sources, changelog, social card, covers; (3) final identity; (4) Phase 0 and
needs-author `launch` leftovers; (5) SQL migration; (6) full CI with browser checks and a look at 360 and 1280, light
and dark; (7) spec, CLAUDE.md, needs-author, owner checklist. Branch `claude/aphug`; main is not merged in (the lead
merges main and opens the PR after AP® Microeconomics merges).

## 1. Fixes before publishing

- **Phone stage plots** (tools review, open): Model Studio's apply step drew its plot (Malthus, bid-rent,
  rank-size, Ravenstein, DTM rates) at 360 x 260 units, and a short phone stage capped the card at
  `(100cqh - 74px) * 1.5` (about 250 px), so the studio raised every word to 12 px (up to 1.6x) and the axis numbers
  and legend collided. Fixed in the course, not the shared studio: `model-studio.js` `fitPlot` draws the plot at
  the size it is shown (its width in px, at most 400 units, so on a wide screen the words grow with it; the height
  the stage has left under the picture, at least 140), and redraws on `resize` and `ls-stage`;
  `model-studio.css` lets a plot card keep the stage's width. `hug-plot.js`: the y-axis shows fewer ticks on a
  short plot (3 to 6, one per 26 px); bar category names sit a fixed 15 px under the axis (they were 7% of the
  range below it, so on a short plot they sat on the axis); a y label on the bottom edge rises above the axis when an
  x label is printed at the same corner (the Malthus "0" touched "1960" at 1280). Screens at 360 and 1280, light
  and dark: no collisions. `assets/course/tool-studio.js` not touched.
- **Sea zones** (borders-lab): the EEZ slot read "24 to 200 nautical miles". UNCLOS measures the EEZ from the
  baseline out to 200 and starts beyond the territorial sea, so it overlaps the contiguous zone. Slot now "12 to 200
  nautical miles (overlaps the contiguous zone out to 24)", the Explore key "12 to 200, overlapping the contiguous
  zone", the zones table "12 to 200 (overlaps the contiguous zone)", the EEZ rights line says how it is measured, and
  the territorial-sea slip says where the EEZ starts. Answers unchanged (they were right). The 4.5 lettered figure's
  bands (24 to 200) are distance bands, not zones, and its items say band C lies inside the EEZ: kept.
- **Exams review author items**: Country Z's pyramid (`frq-aging-pyramid-one`) now sums to 100.0% (0.1 added to 13
  bars a side; shortest at 0 to 4, widest at 50 to 59 and more women at 80+ still hold); `u1-describe-elevation`
  says "eastward toward the South Coast" in the context and the answer; `u2-legend-fertility` classes are "1.5 to
  under 2.1" and "2.1 to under 3.0" (no gap for 2.05).
- **`scale-words` settled**: keys say "local (subnational)"; notes may say a province or state is a subnational
  unit; nothing says "regional scale" for part of one country. Changed: notes `settlement-survey` (Midwest, Great
  Plains), `cultural-patterns` (Quebec), `centrifugal-centripetal` ("provincial scale"), `cities-worldwide` (US metros
  now the national scale), `second-agricultural-revolution` (inside Britain), `development-measures` (Kerala),
  `culture-intro` (Bali, twice), `urban-sustainability` (Portland: "the local scale of one metro area"); lesson
  summary `sustainability-challenges`; bank `world-economy-changes-18` (the scale slot's key and model answer for
  Spartanburg), `trade-world-economy-14`, `development-measures-3` and `-12`, `industrial-revolution-7` (explanations),
  `culture-intro-12` (stem: "this island-by-island pattern"); FRQ `frq-rail-boundary-one` A (no scale in the prompt).
  "Regional" stays for groups of countries (Schengen, Europe's cities, the Kurds, Koreans).

## 2. Published and live (spec decision 11)

- `human-geography/data/published.json`: `geo-skills`, `unit-1`..`unit-7` (71 topics, 1,107 bank questions, 21
  FRQs), all together (needs-author `publish-order`). `assets/courses.js`: `status: 'live'`. Every generator in
  `ci-local.sh` order rerun twice (courses, og tags, sitemap, notes pages, videos, from-video, the course, homes,
  inner pages, tool pages, lesson meta, leads-to, crumbs, flashcards, question bank, worker, site config, paths and
  path pages, practice panel, pricing). Generated as a result: hub and 404 cards, premium.html block (not on sale),
  terms "passes with an end date", manifest, search scope, sitemap (with `models.html`), home pill "14 courses ·
  21,078 questions" (it counts live courses; 15 once AP® Microeconomics goes live), structured data.
- `scripts/lib/course-homes.json`: the exam strip's bank cell said "Being written": now "1,107 questions".
- `models.html` linked from the course home (a "The models you must know" link beside "All 8 tools":
  `HOME_MORE` in `course-home.mjs`, `L.more` in `r3-home.mjs`) and from Learn (a fourth "Models" item on the
  Textbook / Glossary / Videos switch, AP® Human Geography only, in `learn-band.mjs`). Every other course's build
  stays byte-identical (all `--check` clean).
- Hand-written counts: "Fifteen courses" and "twelve AP® Exams" (with AP® Microeconomics, merged here at its
  Phase 0; its own status and pages untouched): home meta and lede, search meta, og and noscript links (Human
  Geography added), sources meta, certificate og, `cross-course.js`, `r3-home.mjs`, `r3-reading.mjs`,
  `check-weight.mjs`; "twelve AP® courses" in the comments of `milestones.js` and the class files.
- `sources.html`: an AP® Human Geography section (framework, Section I and II format, the dated sources, Natural
  Earth base maps and the border note, the checks, "not yet reviewed"). `changelog.html`: "New course: AP® Human
  Geography" (10 November 2026). `robots.txt` hides `human-geography/data/notes/`. `sw.js` v119.
- Social card `human-geography/assets/og-image.png` rendered (`ONLY=... CHROMIUM_PATH=/opt/pw-browsers/chromium`).
  Eight tool covers in `assets/covers/tools/aphug/` with `index.json` (from Phase 2); looked at, kept.
- Premium stays `onSale: false`. Vault: 56 Human Geography lessons vaulted (`build-deploy.mjs --list`), the 15
  free lessons not. Teacher classes already list `aphug` (`ORDER`).
- Tests: the Phase 0 "nothing published" test is now "published and live everywhere it is registered" (as
  Macro's); `site-search.test.mjs` scope list has `aphug`.

## 3. Identity (decision 11)

- Accent kept: deep ocean teal `#094953`, the cover's clay `#7A3310` keeps it apart from every other cover on the
  hub (A&P is dark red, Physics near black). Headline "from local to global.", hand line "every model, every scale",
  ranks Map Reader to Geography Legend kept; owner to confirm.
- Cover redrawn: the provisional wire globe (outline, meridians, parallels) read as a ball at card size. Now an
  Earth: a deep teal disc with light teal land (the Americas, Europe and Africa), its grid faint over it, and a
  gold dashed migration path from a white dot to a gold pin; a warm glow behind. Cover, thumb and band art from one
  source (written by a throwaway script; the three SVGs are the source now). Looked at beside A&P, Physics, Macro
  and Statistics.
- Icon: the common globe sign (outline, one meridian, the equator); two parallels read as a ball at 24 px.
- Hub: the course names on the hub covers take their accent color (`index.html`); Precalculus, Calculus BC,
  Macroeconomics, Microeconomics and Human Geography had none (white).

## 4. Phase 0 and `launch` leftovers

- `check-console.mjs`: the Human Geography practice flow (index first, unit file, explanations only after an
  answer; a model item answered by placing pieces). `check-a11y.mjs`: plus the models page, Model Studio and the map
  reader (home, glossary, practice, exams, FRQ list, formulas, "Make it specific", a lesson, notes page, unit sheet,
  FRQ and a tool were there). `scripts/lib/app-pages.mjs` already lists dashboard, review, search and path.
- AI FRQ grader: `aphug` in `FRQ_COURSES`, course conventions (the task verb sets what earns a part, named places,
  scale words, usual confusions), a calibration example (`frq-population-policy-none` C and G) and four eval cases
  (41-44: strong, partial, weak, injection, 28 points) on two no-stimulus FRQs; `docs/frq-grader.md` updated. Still
  shipped off; the eval is not rerun.
- `check-aphug-map.mjs` skipped nothing before publishing; published, the footer's "this site" hit the Unit 1
  concept "site" on the skills chapter's pages: `preStrip` drops `<footer>` (not teaching).
- check-site on the published pages: "grey" and "cancelled" (now "gray", "canceled" in the bank, an FRQ, a figure
  alt and its SVG, map-reader), four tool descriptions over 160 characters (shortened in `pages.json` and the
  fixture), two notes descriptions (hand-written in `descriptions.json`: `agriculture-consequences`,
  `infrastructure`).
- Weight budgets: all 600 within range after publishing (no change needed).
- Needs-author `launch` checks: Sri Lanka's FY27 upper-middle class confirmed by July 2026 reports; no WPP revision
  after 2024 found. The WUP 2025 and WPP portal reads stay open (low risk).

## 5. SQL

- `2026-11j-aphug.sql`: every course list ends `'apmacro', 'apmicro', 'aphug'` in the three checks and nine
  functions; bodies equal `2026-11i-apmicro.sql`'s with `aphug` added (diffed); the same revokes and grants as
  Micro's added; the stale "Microeconomics was not on this branch" header fixed. `sql-migration.test.mjs` passes. Not
  applied.
