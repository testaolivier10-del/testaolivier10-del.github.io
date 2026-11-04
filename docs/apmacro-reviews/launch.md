# AP® Macroeconomics launch: running log

A restart picks up from the last line. Steps, as the AP® Precalculus launch (`docs/apprecalc-reviews/launch.md`):
(0) merge main and match the calmer site (#126); (1) publish and register live, every generator; (2) site-wide
wording, sources, changelog, social card, covers; (3) final identity; (4) Phase 0 leftovers; (5) full CI with
browser checks and a continuity look at 360 and 1280, light and dark; (6) spec, CLAUDE.md, owner checklist.

## 0. Merge and the calmer site (#126)

- `origin/main` (16 commits, ending in "A calmer site: declutter every page (owner comments) (#126)") merged with
  no conflicts; main's `sw.js` v104 kept, then bumped to v105 at publish.
- What #126 changed in every AP® course, applied to macro: the free-response list grouped by question type with
  plain rows and no "How it works" line (`pages/frq.js`, `fq-groups`); the weakest-topics practice option says
  "Missed questions wait in Review" (`pages/practice.js`); trainer captions say the worked solution is "under
  Explanation" (the button's new name; `mac-tools.js`, `graph-studio.js`; the other courses' trainers still say
  "under Why", not touched). Through the shared generators (rebuilt): course home without the second tagline or
  the notes card cover, separate video and tool rows, FRQ band "the written part of the exam", tool cards with no
  topic label, course search "Search the entire course", Tool Studio "Explanation". The build test follows
  AP® Psychology's (no `deck`, the band drawing `covers/art/apmacro.svg`).

## 1. Published and live (spec decision 13)

- `macroeconomics/data/published.json`: `graph-skills`, `unit-1`..`unit-6` (46 topics, 764 bank questions).
- `assets/courses.js`: `status: 'live'`; every generator in `ci-local.sh` order rerun twice (courses, og tags,
  sitemap, notes pages, the course, homes, inner pages, tool pages, lesson meta, crumbs, flashcards, question
  bank, worker, site config, pricing).
- Generated as a result: hub card and 404 card, premium.html block (Premium "not on sale"), terms "passes with an
  end date" list, manifest description, search scope, sitemap, home pill "13 courses · 19,971 questions".
- `scripts/lib/course-homes.json` said "0 questions" in the home's exam strip (hand-kept): now 764.
- Premium stays `onSale: false` (owner checklist, spec section 9). The "not yet reviewed by an AP® Macroeconomics
  teacher" note stays; no score calculator, band or Beta label. The home eyebrow says "2027 exam".

## 2. Site-wide

- "Thirteen courses": home meta description (short forms to stay under 160 characters) and hero line ("ten AP®
  Exams"), search page (meta, og, noscript links, a macro tint), sources meta, `cross-course.js`, `r3-home.mjs`,
  `r3-reading.mjs` and `check-weight.mjs` comments.
- `sources.html`: an AP® Macroeconomics section. `changelog.html`: "New course: AP® Macroeconomics" (3 November
  2026). `robots.txt` hides `macroeconomics/data/notes/`. `sw.js` v106.
- Social card `macroeconomics/assets/og-image.png` re-rendered (three lines, fits).
- Trainer covers: all eight in `assets/covers/tools/apmacro/` with `index.json` (made in Phase 2); looked at, kept.

## 3. Identity (decision 13)

- Accent kept: yellow-green `#355A0A`, the widest gap left on the wheel (13 courses), the lime display colour
  `#C8F07A` on an olive band, distinct from Environmental Science's leaf and Biology's cell on the hub.
- Cover redrawn: the provisional cover was a supply and demand cross (reads as microeconomics) in one colour, and its
  axis ran under the long title on the hub card. Now AD-AS with LRAS: AD shifts right (dashed lime), the economy
  moves from long-run equilibrium on LRAS (white dot) to a new short-run equilibrium (gold dot), labels LRAS and
  AD₂; drawn smaller and further right so "Macroeconomics" clears it. Cover, thumb and band art from one script.
- Icon: the same AD-AS picture in 24-px strokes (axes, LRAS, AD, SRAS).
- Headline "every graph, every shift." and ranks (Scarcity Spotter to Macroeconomics Legend) kept; owner to confirm.
- Phone: "Macroeconomics" (one long word) overflowed the band at 60 px on a 360 px screen, cutting the title and
  the lede. `r3-home.mjs` adds `mast-long` to a one-word name of 13+ letters; `r3.css` scales it
  (`clamp(42px,7vw,104px)`, `min(60px,10.6vw)` under 860 px). No other course has such a name; their pages are
  unchanged.

## 4. Phase 0 leftovers

- `check-console.mjs`: the macro practice flow (index first, unit file, explanations only after an answer).
- `check-a11y.mjs`: home, glossary, practice, exams, FRQ list, graphs and formulas page, "Make it specific",
  Graph Studio, plus a lesson, notes page, unit sheet, FRQ and a tool.
- `scripts/lib/app-pages.mjs`: macro dashboard, review and search (noindex, out of the sitemap). AP® Psychology's
  three are not listed there either (noted, not changed).
- AI FRQ grader: `apmacro` in `FRQ_COURSES`, course conventions, a calibration example (`frq-real-nominal-short`
  A and B) and four eval cases (37-40) on text-only FRQs; `docs/frq-grader.md` updated. Still shipped off; the eval
  has not been rerun. AP® Psychology, Precalculus and Calculus BC are not in `FRQ_COURSES` (not added).
- SQL `2026-11a-apmacro.sql`: every course in the three checks and six functions, including `apprecalc` and
  `apcalcbc`; its bodies equal `2026-10o-apcalcbc.sql`'s with `apmacro` added (diffed); `sql-migration.test.mjs`
  passes. Not applied (owner).

## 5. CI and the continuity look

- First `BROWSER=1 scripts/ci-local.sh`: check-a11y and check-console passed (every page, the macro flow). Failed:
  check-site ("Cancelled" in one explanation: now "Canceled"); the map check, once published (the AD and SRAS
  lessons' Check yourself held AD-AS graph items and an AD-AS stimulus that draw LRAS and SRAS before they are
  taught: swapped for unused bank questions that are not on a practice exam; the graph items stay in Practice;
  needs-author `adas-early-graphs`); check-weight (formula page 14.2 KB against 14: budget 15, reason in the file);
  three tests written for the hidden course (now live) and the site-search scope list (now has `apmacro`).
- Looked at, 360 and 1280, light and dark: course home, the AD lesson, practice, exams, FRQ list (grouped), Graph
  Studio ("Explanation" button). No horizontal overflow. The hub card and band show the new cover.
