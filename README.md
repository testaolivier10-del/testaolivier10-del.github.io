# testaolivier10-del.github.io

Source for the [Study Hub](https://testaolivier10-del.github.io/) site, home to:

**[LevlPrep](https://testaolivier10-del.github.io/nremt/)** — a free NREMT-EMT exam prep app: a 978-question bank (4 difficulty levels, multiple-choice/select-N/sequencing item types), timed 100-question exams, domain drills, a dashboard with XP/streaks/mastery tracking, study notes, mnemonics, a glossary, protocol flowcharts, an interactive 3D body map, an auscultation sound trainer, and a branching clinical scenario simulator.

**[Organic Chemistry](https://testaolivier10-del.github.io/ochem/)** (beta) — a mastery/learning product, not exam prep: a full 14-module Organic Chemistry I curriculum (`ochem/assets/curriculum.js`), each lesson built as Explain → Visualize → Interact → Guided Practice → Independent Practice → Explanation → Challenge. Four lessons are live (Formal Charge, SN1, SN2, E2); the rest of the curriculum shows as "coming soon" until built. A Mastery dashboard scores performance per module from real question attempts, not just completion, and flags concept dependencies: struggling on E2 surfaces a "possible gap detected" callout pointing at its declared prerequisites, whether or not those prerequisite lessons exist yet.

## Stack

Plain HTML/CSS/vanilla JS — no framework, no bundler, no build step. Hosted on GitHub Pages. A service worker (`nremt/sw.js`) gives the app offline support (PWA, installable via `nremt/manifest.json`).

## Structure

```
index.html            Study Hub landing page (lists available subjects)
assets/                Shared hub-level styling/icons
nremt/                 The LevlPrep app
  index.html           App home
  practice.html        Question bank UI (fetches assets/questions.json at runtime)
  dashboard.html        XP, streaks, domain accuracy, readiness score
  study-plan.html       Auto-generated study checklist
  study-notes.html, glossary.html, mnemonics.html, flowcharts.html,
  skillsheets.html       Reference content
  body-map.html          Interactive 3D anatomy (three.js + a compressed .glb model)
  sound-trainer.html      Lung/heart sound identification
  scenario-sim.html       Branching clinical scenarios
  search.html             Client-side search across notes + the question bank
  assets/
    questions.json        The 978-question bank (fetched by practice.html and search.html)
    theme.css             Shared design system (light/dark, "Guided Path" visual style)
    nav.js                 Shared header/nav, XP/level logic, and optional account sync
    vendor/three/          Vendored three.js (module build + loaders/controls actually used)
    body3d.glb              Compressed 3D anatomy model (meshopt)
ochem/                 The Organic Chemistry app (beta)
  index.html             Product home
  learn.html             Full 14-module curriculum browser, rendered from assets/curriculum.js
  practice.html, review.html, tools.html   Honest "coming soon" states — no fake functionality
  mastery.html           Mastery dashboard (overall %, per-module bars, weakest/next-up,
                         and a concept-dependency callout — see curriculum.js below)
  mechanisms/sn2.html    Interactive SN2 lesson (Module 6): click-through nucleophile/
                         electrophile identification, arrow-pushing, product prediction
  mechanisms/sn1.html    Interactive SN1 lesson (Module 6): ionization, the planar
                         carbocation, attack-from-either-face, racemization
  mechanisms/e2.html     Interactive E2 lesson (Module 6): all three concerted arrows,
                         Zaitsev vs. Hofmann regiochemistry from base bulk
  lessons/formal-charge.html   Module 1 lesson using the full 7-part lesson design:
                         Explain -> Visualize -> Interact -> Guided -> Independent ->
                         Explanation -> Challenge
  assets/
    curriculum.js          Single source of truth for modules/topics/lesson hrefs, a
                            topic's declared `dependsOn` prerequisites, and
                            localStorage-backed mastery scoring (ochem_progress) — including
                            strugglingPrerequisites(), which flags a topic once its score
                            drops under 60% across 5+ attempts and names the prerequisite
                            topics to review, whether or not those have lessons yet
    ochem-nav.js           Injects the Learn/Practice/Review/Tools/Mastery sub-nav
    ochem.css              Shared sub-nav, module/topic list, and mastery-bar styles
    learn-page.js, mastery-page.js   Dynamic list rendering for those two pages, kept in
                            their own files (not inline) so the CI link-checker below
                            doesn't misread generated `href="' + x + '"` text as a broken link
scripts/check-site.mjs   CI: broken-link + JSON-validity checks (see below)
```

`ochem/` reuses the root `assets/theme.css` design system but has its own lightweight page header and sub-nav (it doesn't use `nremt/assets/nav.js`, which is wired specifically to the NREMT XP/streak data). Lesson progress across all Ochem lessons is stored client-side in a single `localStorage` key, `ochem_progress` (per-topic `{correct, attempts}`, read by `curriculum.js`'s mastery functions); there's no account sync yet.

## Data & accounts

All progress (seen/missed questions, streaks, XP, mastery, domain stats) is stored in the browser's `localStorage` — no account is required to use any feature.

Signing in is optional and layers **cross-device sync** on top of that same local data, via Supabase (`nremt/assets/nav.js`). The Supabase key committed in that file is a *publishable* anon key — safe to expose, since access is enforced entirely by Postgres row-level security (each user can read/write only their own `user_progress` row).

## Analytics

Every page reports a pageview to a `track_pageview(path)` Postgres RPC in the same Supabase project. No IP address, cookie, user id, or session identifier is ever recorded — the RPC only increments a `(path, day)` counter in a `page_views` table. That table has row-level security enabled with **no policies at all**, so it can't be read or written directly by anyone (including the publishable anon key); the RPC (`security definer`) is the only way to touch it.

To check traffic, run this in the Supabase SQL editor (or via `mcp__Supabase__execute_sql` if working from an agent session with access to this project):

```sql
select path, day, views from page_views order by day desc, views desc limit 50;
```

## Local development

No build step — just serve the directory statically, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`.

## CI

`.github/workflows/checks.yml` runs `scripts/check-site.mjs` on every push/PR: it walks every HTML file for broken local `href`/`src` references, validates every JSON file parses, and confirms every URL in `sitemap.xml` maps to a real file. It has no network dependency and needs no build step, so it runs in seconds.

## Updating the question bank

Questions live in `nremt/assets/questions.json` — a flat JSON array of objects shaped like:

```json
{"domain": "Assessment", "diff": "medium", "topic": "Primary Assessment", "q": "...", "options": ["...", "...", "...", "..."], "correct": 1, "explain": "..."}
```

Edit that file directly (it's plain JSON, not embedded in any page's markup).
