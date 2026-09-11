# testaolivier10-del.github.io

Source for the [Study Hub](https://testaolivier10-del.github.io/) site, home to:

**[LevlPrep](https://testaolivier10-del.github.io/nremt/)** — a free NREMT-EMT exam prep app: a 2,078-question bank (4 difficulty levels, multiple-choice/select-N/sequencing item types), timed 100-question exams, domain drills, a dashboard with XP/streaks/mastery tracking, study notes, mnemonics, a glossary, protocol flowcharts, an interactive 3D body map, an auscultation sound trainer, and a branching clinical scenario simulator.

**[Organic Chemistry](https://testaolivier10-del.github.io/ochem/)** (beta) — a mastery/learning product, not exam prep: a full 14-module Organic Chemistry I curriculum (`ochem/assets/curriculum.js`), each lesson built as Explain → Visualize → Interact → Guided Practice → Independent Practice → Explanation → Challenge. **Module 1 (Foundations) is fully built** — atomic structure, orbitals, hybridization, bonding, electronegativity, formal charge, Lewis structures, molecular geometry, bond polarity — plus SN1/SN2/E2 in Module 6; the rest of the curriculum shows as "coming soon" until built. A Mastery dashboard scores performance per module from real question attempts, not just completion, and flags concept dependencies: struggling on E2 surfaces a "possible gap detected" callout pointing at its declared prerequisites, whether or not those prerequisite lessons exist yet. Alongside the course there are **seven interactive tools** (`ochem/tools.html`) — an arrow pusher that shows you the product your mechanism makes, a resonance explorer, a 3D viewer, a conformation lab, a reaction predictor, an acid/base comparator and a spectroscopy lab — see [Tools](#tools).

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
    questions.json        The 2,078-question bank (fetched by practice.html and search.html)
    theme.css             Shared design system (light/dark, "Guided Path" visual style)
    nav.js                 Shared header/nav, XP/level logic, and optional account sync
    vendor/three/          Vendored three.js (module build + loaders/controls actually used)
    body3d.glb              Compressed 3D anatomy model (meshopt)
ochem/                 The Organic Chemistry app (beta)
  index.html             Product home
  learn.html             Full 14-module curriculum browser, rendered from assets/curriculum.js
  practice.html, review.html   Honest "coming soon" states — no fake functionality
  tools.html             Hub for the seven interactive tools, rendered from
                            assets/tools-registry.js
  tools/                 One page per tool: arrow-pusher, resonance, viewer-3d,
                            conformations, reaction-predictor, acid-base,
                            spectroscopy — see "Tools" below
  mastery.html           Mastery dashboard (overall %, per-module bars, weakest/next-up,
                         and a concept-dependency callout — see curriculum.js below)
  mechanisms/sn2.html    Interactive SN2 lesson (Module 6): click-through nucleophile/
                         electrophile identification, arrow-pushing, product prediction
  mechanisms/sn1.html    Interactive SN1 lesson (Module 6): ionization, the planar
                         carbocation, attack-from-either-face, racemization
  mechanisms/e2.html     Interactive E2 lesson (Module 6): all three concerted arrows,
                         Zaitsev vs. Hofmann regiochemistry from base bulk
  lessons/               All 9 Module 1 (Foundations) lessons: atomic-structure,
                         orbitals, hybridization, bonding, electronegativity,
                         formal-charge, lewis-structures, molecular-geometry,
                         bond-polarity — each the full 7-part design: Explain ->
                         Visualize -> Interact -> Guided -> Independent ->
                         Explanation -> Challenge
  assets/
    curriculum.js          Single source of truth for modules/topics/lesson hrefs, a
                            topic's declared `dependsOn` prerequisites, and
                            localStorage-backed mastery scoring (ochem_progress) — including
                            strugglingPrerequisites(), which flags a topic once its score
                            drops under 60% across 5+ attempts and names the prerequisite
                            topics to review, whether or not those have lessons yet
    lesson-engine.js       Shared step-machine (progress bar, feedback, choice buttons,
                            retry-until-correct) that every lesson after E2 is built on —
                            a lesson supplies a small array of step configs (mostly
                            declarative 'explain'/'mcq'/'final', plus a `render` function
                            for its one genuinely hands-on interactive step) instead of
                            hand-rolling the plumbing; Formal Charge/SN1/SN2/E2 predate it
                            and still carry their own copy inline
    step-back.js           The "Previous step" control every step page shares — the
                            engine lessons, the config-driven mechanism walkthroughs and
                            the five hand-rolled pages — plus the rule that keeps going
                            back safe: a step you have already left never records a
                            second attempt, so walking back and forth can't move a score
                            (retries within a step are unaffected)
    session-runner.js      The shared question loop behind Practice and Review: renders
                            each question kind, grades, diagnoses, teaches, and keeps a
                            session history so any answered card can be replayed read-only
                            via its Back control (nothing is re-graded on a replay)
    flags.js               Flagged questions (localStorage `ochem_flagged_v1`) — a manual
                            bookmark the student sets and clears by hand, including on
                            questions they got right. Surfaces as the "Flagged questions"
                            practice mode and a list on the Practice home; never added or
                            cleared by the engine
    ochem-nav.js           Injects the Learn/Practice/Review/Tools/Mastery sub-nav
    ochem.css              Shared sub-nav, module/topic list, mastery-bar, and lesson-page
                            styles (progress bar, choice buttons, feedback boxes, etc. —
                            lessons built after E2 rely on this instead of pasting the
                            same <style> block inline)
    learn-page.js, mastery-page.js   Dynamic list rendering for those two pages, kept in
                            their own files (not inline) so the CI link-checker below
                            doesn't misread generated `href="' + x + '"` text as a broken link
    chem-core.js           Molecules as STRUCTURES rather than pictures: elements, lone
                            pairs, numeric charges, implicit hydrogens, formal charge,
                            octet checks — and apply(), which takes a set of curved arrows
                            and returns the structure they actually produce. Arrows are
                            applied simultaneously, not in sequence, because an SN2's
                            nucleophile arrow alone would blow carbon's octet and only the
                            leaving group's arrow in the same step saves it
    resonance-engine.js    Enumerates the resonance forms of a species instead of storing
                            them, and filters to the contributors a marker would accept
    mol3d.js               A small SVG 3D engine (rotate, project, depth-sort) plus the
                            VSEPR construction that generates the geometries, so reported
                            bond angles are measured off the coordinates being drawn
    mol3d-library.js       The molecules the 3D viewer offers
    tool-molecules.js      Extra structures the tools need that no question references
    tools-registry.js      The single list of tools — the hub, every tool's switcher, and
                            the sitemap entries all come from it
    tool-shell.js          Shared chrome for a tool page
    tools/                 One script per tool
scripts/check-site.mjs   CI: broken-link + JSON-validity checks (see below)
```

`ochem/` reuses the root `assets/theme.css` design system but has its own lightweight page header and sub-nav (it doesn't use `nremt/assets/nav.js`, which is wired specifically to the NREMT XP/streak data). Lesson progress across all Ochem lessons is stored client-side in a single `localStorage` key, `ochem_progress` (per-topic `{correct, attempts}`, read by `curriculum.js`'s mastery functions); there's no account sync yet.

## Tools

`ochem/tools.html` is a hub; each tool is its own page under `ochem/tools/`.
They are deliberately ungraded and record nothing, but nothing in them is
faked either — every verdict is computed, and where the computation and the
measured data disagree the tool says so rather than reporting whichever
answer makes the rules look tidy.

| Tool | What it does |
| --- | --- |
| **Arrow Pusher** | Draw curved arrows on a molecule and the product appears beside them — bonds broken, formal charges recalculated, fragments separated. Legality is valence rules, not an answer key, so an arrow that would put ten electrons on a carbon is caught on a structure nobody anticipated. |
| **Resonance Explorer** | Checks whether what you drew is a resonance form or a different compound (the skeleton is the test students fail), knows how many forms exist because it enumerates them, and ranks contributors. |
| **3D Molecule Viewer** | Drag-to-rotate VSEPR geometry with measured bond angles — ammonia reports 107°, water 104.5°, and the lone-pair compression is visible rather than asserted. |
| **Conformation Lab** | Newman projections against a live energy curve, and a 3D cyclohexane whose axial/equatorial assignments are derived from the geometry, so a ring flip re-derives all six at once. |
| **Reaction Predictor** | Commit to SN1/SN2/E1/E2 before the answer appears, then see the four factors and which one overruled which. Includes Zaitsev vs. Hofmann. |
| **Acid/Base Comparator** | Two acids by atom, resonance, induction and orbital, with measured pKa as the ground truth and an explicit note when the structural rules cannot separate them. |
| **Spectroscopy Lab** | IR and ¹H NMR drawn from real wavenumbers and couplings (so picture and peak table cannot drift apart), plus a reference chart and a work-backwards puzzle mode. |

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
