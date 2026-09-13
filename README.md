# testaolivier10-del.github.io

Source for [LevlPrep](https://testaolivier10-del.github.io/), home to two courses:

**[NREMT-EMT Prep](https://testaolivier10-del.github.io/nremt/)** — a free NREMT-EMT exam prep app: a 2,084-question bank (4 difficulty levels, multiple-choice/select-N/sequencing item types), timed 100-question exams, domain drills, a dashboard with XP/streaks/mastery tracking, study notes, mnemonics, a glossary, protocol flowcharts, an interactive 3D body map, an auscultation sound trainer, and a branching clinical scenario simulator.

**[Organic Chemistry](https://testaolivier10-del.github.io/ochem/)** (beta) — a mastery/learning product, not exam prep: a full 14-module Organic Chemistry I curriculum (`ochem/assets/curriculum.js`), each lesson built as Explain → Visualize → Interact → Guided Practice → Independent Practice → Explanation → Challenge. **58 lessons and 10 mechanism walkthroughs are built**, covering Foundations through carbonyl and aromatic chemistry; `curriculum.js` is the single source of truth for what exists, and anything it doesn't link yet shows as "coming soon". A Mastery dashboard scores performance per module from real question attempts, not just completion, and flags concept dependencies: struggling on E2 surfaces a "possible gap detected" callout pointing at its declared prerequisites, whether or not those prerequisite lessons exist yet. Alongside the course there are **seven interactive tools** (`ochem/tools.html`) — an arrow pusher that shows you the product your mechanism makes, a resonance explorer, a 3D viewer, a conformation lab, a reaction predictor, an acid/base comparator and a spectroscopy lab — see [Tools](#tools).

## Stack

Plain HTML/CSS/vanilla JS — no framework, no bundler, no build step. Hosted on GitHub Pages. A service worker at the site root (`sw.js`) gives the app offline support (PWA, installable via `nremt/manifest.json`). It sits at the root rather than under `nremt/` so its scope covers the shared `/assets/` modules every subject loads.

## Structure

```
index.html            LevlPrep landing page (lists available courses)
assets/                Shared across every course
  theme.css            The one design system, loaded by every page on the site
                         (light/dark, "Guided Path" visual style). There is deliberately
                         no per-course copy: the two copies that used to exist drifted
                         apart and cost the NREMT course its mute-button styling
  site-chrome.js       The two-row site header every course renders: row 1 is global
                         (back arrow, LevlPrep wordmark, course name, streak, level,
                         account, mute, theme), row 2 is that course's section tabs
  chime.js             The correct-answer sound, shared by both courses
  tutor.js             The study assistant behind the mascot in the corner of every
                         page. Indexes the current course's own material in the browser
                         (NREMT's reference pages, or ochem's 62 note fragments listed by
                         curriculum.js) and answers by quoting the passage that covers the
                         question. Optionally posts the question plus those passages to an
                         AI endpoint for a written answer; see worker/. site-chrome.js
                         mounts it, so no page loads it directly
  account.js           One login for the whole site: Supabase auth + namespaced
                         cross-device sync (see Data & accounts)
  hub-progress.js      One shared level and one shared streak; per-subject XP
nremt/                 The NREMT-EMT Prep course
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
    questions.json        The 2,084-question bank (fetched by practice.html and search.html)
    nav.js                 This course's tab list and sync namespace; hands the header
                             itself to /assets/site-chrome.js. Also the NREMT-flavored
                             shim over the site-wide level/streak engine in
                             /assets/hub-progress.js
    vendor/three/          Vendored three.js (module build + loaders/controls actually used)
    body3d.glb              Compressed 3D anatomy model (meshopt)
ochem/                 The Organic Chemistry course (beta)
  index.html             Product home
  learn.html             The textbook: a contents rail beside one chapter at a time,
                            rendered from assets/curriculum.js + notes/ (see Textbook)
  notes/                 One HTML fragment per curriculum topic — the written course,
                            62 sections, fetched on demand by the textbook
  practice.html, review.html   Question practice and the review queue, both
                            driven by assets/session-runner.js
  tools.html             Hub for the seven interactive tools, rendered from
                            assets/tools-registry.js
  tools/                 One page per tool: arrow-pusher, resonance, viewer-3d,
                            conformations, reaction-predictor, acid-base,
                            spectroscopy — see "Tools" below
  mastery.html           Mastery dashboard (overall %, per-module bars, weakest/next-up,
                         and a concept-dependency callout — see curriculum.js below)
  mechanisms/            10 interactive mechanism walkthroughs — sn1, sn2, e1, e2,
                         addition, eas, carbonyl-addition, acyl-substitution,
                         aldol, claisen. Each is click-through: identify the
                         nucleophile and electrophile, push the arrows yourself,
                         predict the product
  lessons/               58 lesson pages, from Module 1 (Foundations —
                         atomic-structure, orbitals, hybridization, bonding,
                         electronegativity, formal-charge, lewis-structures,
                         molecular-geometry, bond-polarity) through
                         stereochemistry, conformational analysis, substitution
                         and elimination, addition, spectroscopy, aromatics and
                         carbonyl chemistry — each the full 7-part design:
                         Explain -> Visualize -> Interact -> Guided ->
                         Independent -> Explanation -> Challenge
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
    practice-bank.json     1,860 multiple-choice/true-false questions, 30 per topic
                            across the 62 shipped topics, keyed by topic id. Plain
                            JSON rather than a script so Practice and Review can
                            render their setup screens while the megabyte is still
                            arriving; assets/bank-loader.js fetches it and the two
                            page bootstraps await it
    bank-loader.js         Fetches practice-bank.json, exposes the promise both page
                            bootstraps wait on, and invalidates any pool the question
                            engine built before the bank landed
    session-runner.js      The shared question loop behind Practice and Review: renders
                            each question kind, grades, diagnoses, teaches, and keeps a
                            session history so any answered card can be replayed read-only
                            via its Back control (nothing is re-graded on a replay)
    flags.js               Flagged questions (localStorage `ochem_flagged_v1`) — a manual
                            bookmark the student sets and clears by hand, including on
                            questions they got right. Surfaces as the "Flagged questions"
                            practice mode and a list on the Practice home; never added or
                            cleared by the engine
    ochem-nav.js           This course's tab list; hands the header to site-chrome.js
    textbook.js            learn.html: contents rail, chapter routing, lazy note loading,
                            full-text search UI, and read-tracking (see Textbook)
    textbook-search.js     The book's search index: splits each note fragment into
                            blocks, ranks them against a query, and returns the
                            passages to jump to
    ochem.css              Shared textbook, mastery-bar, and lesson-page
                            styles (progress bar, choice buttons, feedback boxes, etc. —
                            lessons built after E2 rely on this instead of pasting the
                            same <style> block inline)
    mastery-page.js        Dynamic list rendering for that page, kept in its own file
                            (not inline) so the CI link-checker below doesn't misread
                            generated `href="' + x + '"` text as a broken link
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
worker/                Optional AI backend for the study assistant — a Cloudflare
                         Worker on the Workers AI free allowance. The site works without
                         it; see worker/README.md
scripts/check-site.mjs   CI: broken-link + JSON-validity checks (see below)
scripts/test/            CI: unit tests over the scoring engines (see below)
```

Both courses render the identical header from `assets/site-chrome.js`, so a page only needs an empty `<div id="site-header"></div>`; each course's nav module (`nremt/assets/nav.js`, `ochem/assets/ochem-nav.js`) supplies nothing but its course name and tab list. They also share the site-wide account, level and streak: every page loads `/assets/account.js` and `/assets/hub-progress.js`.

### Answer sounds (`assets/chime.js`)

Getting one right makes a sound. `window.LevlSound.answer(isCorrect)` is called
from every place in either course that reveals a verdict the moment you answer —
`ochem/assets/lesson-engine.js` (which every lesson and drill widget routes its
feedback through), `ochem/assets/session-runner.js` (practice, review and the
diagnostic), `ochem/assets/mechanism-page.js` plus the four mechanism pages with
their own inline engines, and `nremt/sound-trainer.html`. It takes the verdict
either way: a miss is silent but still has to be reported, because the chime's
pitch climbs with a run of right answers and a miss is what drops it back down.

`window.LevlSound.flourish(ratio)` is the longer version, for the moment a
score appears — the end of an ochem practice or review session, the sound-trainer
results, and the NREMT practice exam.

That exam is the one page with no per-answer chime, deliberately: it withholds
right/wrong until you submit, the way the real NREMT does, so a sound on
selection would hand you the answer. It gets the flourish on the score reveal
instead.

Everything is synthesized with oscillators rather than played from a file, so
there is nothing to download and nothing for the service worker to precache. The
speaker button in the header mutes it, remembered in `localStorage` under
`levl_sound`.

### Textbook (`ochem/learn.html`)

Learn is the course's written half. Every topic's prose is one HTML fragment under `ochem/notes/<topic>.html` — one per curriculum topic, 62 in all, ~63,000 words — and `ochem/assets/textbook.js` renders a contents rail (14 chapters, searchable, with per-chapter read counts) beside one chapter at a time, fetching that chapter's notes on open so the book costs a chapter rather than all 62 topics.

The rail's box searches the prose, not just the 62 section names. `ochem/assets/textbook-search.js` indexes each note fragment as it is fetched — the index is built from the same cache the chapters read from, so there is no separate corpus to keep in sync, and the first query fetches whatever has not been read yet. A query lists the matching passages with the words highlighted; picking one opens that chapter and scrolls to the exact paragraph, still highlighted. Every query term has to appear in a section for it to match, and ordinary question words ("what is a nucleophile") are dropped so a typed question searches for the idea.

The interactive lessons are unchanged and each section links out to its own. Reading is tracked separately from mastery in `ochem_textbook_read`, set by reaching the end of a section or by hand, worth 5 XP the first time, and never mixed into the mastery number — which still comes only from answering questions. Old per-lesson `?notes=1` URLs redirect to the matching section.

Lesson progress is stored in `ochem_progress` (per-topic `{correct, attempts}`, read by `curriculum.js`); the concept model lives in `ochem_mastery_v1` (see `ochem/assets/mastery-engine.js`); and the game layer's own state — concept badges, daily Rounds, achievements — lives in `ochem_game_v1` (`ochem/assets/ochem-xp.js`). All three sync with an account.

### Game layer (`ochem/assets/ochem-xp.js`)

Every reward is tied to something the mastery engine already believes, so none of it can be farmed:

- **Tier-weighted XP.** A correct answer pays 6/10/15/22 XP by the question's difficulty tier — the same ordering the strength update uses. Wrong answers pay nothing; only the flat completion bonus is unconditional.
- **Concept badges** (Solid / Strong / Mastered) are gated on the engine's *decayed strength* estimate plus a minimum attempt count, not on accuracy — so a badge means "you still know this", not "you once had a good run". They are never revoked, since losing one would punish taking a week off.
- **Daily Rounds** is a quest built from the engine's real due queue, so the daily goal is by construction the highest-value work available.
- **Review debt** replaces a punishing streak: overdue concepts accumulate visibly and clear when reviewed. Missing a day costs nothing.

`ochem/assets/game-panel.js` renders all of it at the top of `ochem/mastery.html`, plus a compact resume strip on `ochem/index.html`.

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

All progress (seen/missed questions, streaks, XP, mastery, domain stats) is stored in the browser's `localStorage` — no account is required to use any feature, in any subject.

Signing in is optional and layers **cross-device sync** on top of that same local data, via Supabase (`assets/account.js`). The Supabase key committed in that file is a *publishable* anon key — safe to expose, since access is enforced entirely by Postgres row-level security (each user can read/write only their own `user_progress` row).

**One login covers the whole site.** The Supabase session lives in `localStorage` on this origin, which `/`, `/nremt/` and `/ochem/` all share, so signing in anywhere signs you in everywhere. `assets/account.js` is loaded by every page in every subject.

### Namespaced sync

`user_progress.data` is shaped as:

```json
{ "v": 2, "ns": { "hub": {...}, "nremt": {...}, "ochem": {...} } }
```

Each subject calls `StudyHubAccount.registerNamespace(name, keys)` with the `localStorage` keys it owns. A push reads the current row, merges in **only** the namespaces the current page registered, and writes the result back. This is what stops an ochem page's sync from wiping NREMT progress — the previous shape was a flat bag of `nremt_*` keys upserted wholesale, which could not survive a second subject. Rows written before this (no `v`) are read as if they were the `nremt` namespace, which is what they were, and rewritten on the next push.

### Shared level and streak (`assets/hub-progress.js`)

- **The level is shared.** One number, earned from every subject, stored in `hub_xp_v1` along with the per-subject XP split.
- **The streak is shared.** Studying *any* subject keeps it alive — `hub_activity_v1` records per-day, per-subject counts and the streak is derived from them rather than stored as a counter (a stored counter has to be corrected on read anyway, and deriving it means two subjects can't race each other into double-counting).
- **Rank names are local.** Level 7 is "Rig Veteran" on NREMT, "Mechanism Marshal" on ochem, and "Veteran" on the hub page. Same rank, each subject keeps its own voice.

Both keys are migrated once per device from the old NREMT-only records (`nremt_xp`, `nremt_streak`), so no existing user loses a level or a streak.

## Study assistant (`assets/tutor.js`)

A mascot sits in the corner of every page in both courses. It is mounted from
`assets/site-chrome.js` rather than page by page, so all ~157 pages get it,
including ochem's lessons, mechanisms and tools, and any page added later.

It works in two layers, and the first one is always on:

1. **Retrieval, in the browser.** On first open it indexes the current course's
   own material — NREMT's reference pages, or ochem's note fragments, whose ids
   come from `ochem/assets/curriculum.js` so a new topic is indexed without
   touching the tutor. Ranking is BM25 with three adjustments the material
   needed: a word and its expansions count as one concept (so "OPA" and
   "oropharyngeal" reinforce rather than compete); a passage missing the
   question's rarest content word is pushed down; and question-shaping words
   ("indicated", "difference", "explain") are dropped from queries only, since
   the rarest-word rule would otherwise read a qualifier as the subject.
   Answers quote the matching passage and link back to it. Nothing leaves the
   browser and it works offline.

   When the reference pages answer weakly, a second tier loads: each course's
   practice explanations, built by `scripts/build-tutor-bank.mjs` into
   `<course>/assets/tutor-bank.json` (NREMT 2,084 entries, ochem 1,844). That
   is the largest body of teaching prose either course has — written to explain
   why an answer is right — and it was invisible to the assistant because it
   sits inside megabyte question banks alongside answer keys. It is fetched
   only on a weak hit, so a question the glossary covers never pays for it.
   Regenerate it after editing either bank.

2. **An optional AI layer.** If an endpoint is saved under the assistant's gear
   icon, the question and the retrieved passages are posted there and a model
   writes the answer. It is grounded but not muzzled: it may rephrase,
   analogize and connect topics, and it is told never to invent EMT protocol
   specifics, doses or numeric criteria. Questions the course doesn't cover are
   still answered, labelled as coming from outside the material. Any failure —
   quota, outage, no endpoint — falls back to layer 1, so the feature degrades
   instead of breaking.

The page CSP allows `https://*.workers.dev` under `connect-src` so a deployed
Worker can actually be reached; without that the browser blocks the call
silently.

## Privacy

`privacy.html` is the site's privacy policy, linked from every page footer. The short version: no ads, no trackers, no cookies; progress lives in `localStorage`; the only thing that leaves the browser unprompted is the anonymous page counter described below.

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

`.github/workflows/checks.yml` runs `scripts/check-site.mjs` on every push/PR. It has no network dependency and needs no build step, so it runs in seconds. It checks:

1. Every local `href`/`src` in every HTML file points at a file that exists.
2. Every JSON file parses.
3. Each Ochem lesson has the number of steps `lesson-concepts.js` was authored against.
4. Every URL in `sitemap.xml` maps to a real file — **and** every real page is in `sitemap.xml`. Fifty Ochem lesson pages once shipped with no path in from a search engine because the sitemap was hand-maintained; run `node scripts/build-sitemap.mjs` to regenerate it after adding a page.
5. The question bank carries no answer tell: no keyed option position holds more than 40% of items, no select-N key set dominates, and the "longest option is the answer" rate stays under its ceiling. The ceiling is a ratchet — lower it as the bank improves, never raise it.
6. Every advertised question count in markup, meta tags and this README matches the bank. The homepage went on advertising a figure from an early build long after the bank had more than doubled.

### Unit tests

A second job runs `node --test scripts/test/*.test.mjs` — 24 tests over the two engines whose failure modes are silent. Everything above checks that the site is *wired* correctly; nothing checked that it *scores* correctly. An interval that doubles too eagerly buries a shaky concept for four months, a decay curve that bites too hard makes yesterday's work look undone, a streak that resets in the wrong timezone eats a 40-day run. None of that throws, and none of it would have been caught by a link checker — the student just gets worse practice and no one finds out.

- `scripts/test/hub-progress.test.mjs` — the level curve (pinned: changing it demotes every existing user), XP accumulation and per-subject split, streak continuation across days, goal tracking, rank titles, day-log pruning.
- `scripts/test/mastery-engine.test.mjs` — unseen vs. scored-zero, the learning rate settling as evidence accumulates, the same-day guard that stops one good session reaching a six-month interval, the interval cap, the decay floor, due-ness, leech benching and its release on a lesson read, the daily review cap, mistake de-duplication, tier records.
- `scripts/test/harness.mjs` — loads these browser IIFEs into a VM context with a window, a localStorage and, crucially, a clock the test controls. Both engines are about *time*; none of this is testable against a real `Date.now()` without either sleeping or asserting nothing.

No dependencies and no build step, in keeping with the rest of the stack. Both engines were checked by mutation: 13 deliberate breaks (level curve shifted, same-day guard removed, interval cap removed, decay floor removed, lesson never lifts the bench, and so on) and every one of them fails the suite. A test that passes either way is worse than no test, so re-run that exercise if you add to these.

## Updating the question bank

Questions live in `nremt/assets/questions.json` — a flat JSON array of objects shaped like:

```json
{"domain": "Assessment", "diff": "medium", "topic": "Primary Assessment", "q": "...", "options": ["...", "...", "...", "..."], "correct": 1, "explain": "..."}
```

Edit that file directly (it's plain JSON, not embedded in any page's markup).
