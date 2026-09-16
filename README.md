# levlprep.com

Source for [LevlPrep](https://levlprep.com/), home to two courses:

**[NREMT-EMT Prep](https://levlprep.com/nremt/)** — a free NREMT-EMT exam prep app: a 2,106-question bank (4 difficulty levels, multiple-choice/select-N/sequencing item types), timed 100-question exams, domain drills, a dashboard with XP/streaks/mastery tracking, study notes, mnemonics, a glossary, protocol flowcharts, an interactive 3D body map, an auscultation sound trainer, and a branching clinical scenario simulator.

**[Organic Chemistry](https://levlprep.com/ochem/)** (beta) — a mastery/learning product, not exam prep: a full 14-module Organic Chemistry I curriculum (`ochem/assets/curriculum.js`), each lesson built as Explain → Visualize → Interact → Guided Practice → Independent Practice → Explanation → Challenge. **58 lessons and 10 mechanism walkthroughs are built**, covering Foundations through carbonyl and aromatic chemistry; `curriculum.js` is the single source of truth for what exists, and anything it doesn't link yet shows as "coming soon". A Mastery dashboard scores performance per module from real question attempts, not just completion, and flags concept dependencies: struggling on E2 surfaces a "possible gap detected" callout pointing at its declared prerequisites, whether or not those prerequisite lessons exist yet. Alongside the course there are **seven interactive tools** (`ochem/tools.html`) — an arrow pusher that shows you the product your mechanism makes, a resonance explorer, a 3D viewer, a conformation lab, a reaction predictor, an acid/base comparator and a spectroscopy lab — see [Tools](#tools).

## Stack

Plain HTML/CSS/vanilla JS — no framework, no bundler, no build step. Hosted on GitHub Pages. Every external script on every page is `defer`red so a page paints before its JavaScript arrives; deferred scripts still run in document order, so the shared modules in `<head>` run ahead of a page's own, and a page's inline bootstrap waits for `DOMContentLoaded`. The two typefaces are served from `assets/fonts/`, not a third party. A service worker at the site root (`sw.js`) gives the app offline support. It sits at the root rather than under `nremt/` so its scope covers the shared `/assets/` modules every subject loads. There are three manifests, one per installable thing — `manifest.json`, `nremt/manifest.json`, `ochem/manifest.json` — so installing from a course gives you that course rather than the landing page, and every page declares the one it belongs to.

## Structure

```
index.html            LevlPrep landing page (lists available courses, and says who
                         makes this and how the questions are written)
sources.html          Who makes this, what the material is written against, how
                         the bank is checked, how to report a mistake
changelog.html        What's new, dated, newest first. Content edits are listed
                         alongside site changes
privacy.html          The privacy policy, and the two controls that go with it
assets/                Shared across every course
  fonts/               Nunito and IBM Plex Mono, self-hosted (Latin + Latin
                         Extended). These came from Google Fonts through a
                         render-blocking stylesheet on every page, which cost a
                         third-party round trip before first paint and a blank
                         page wherever that host is blocked
  theme.css            The one design system, loaded by every page on the site
                         (light/dark, "Clay" visual style: soft shadows, no outlines, a
                         course-tinted panel opening every page). There is deliberately
                         no per-course copy: the two copies that used to exist drifted
                         apart and cost the NREMT course its mute-button styling
  site-chrome.js       The two-row site header every course renders: row 1 is global
                         (back arrow, LevlPrep wordmark, course name, streak, level,
                         account, mute, theme), row 2 is that course's section tabs
  chime.js             The correct-answer sound, shared by both courses
  motion.js            The moments that make progress visible: the "+N XP" chip
                         that flies to the level badge, the level-up toast and
                         confetti, and progress bars filling from zero on arrival.
                         Listens for the levl:xp / levl:levelup events
                         hub-progress.js fires; site-chrome.js mounts it
  tutor.js             The study assistant behind the mascot in the corner of every
                         page. Indexes the current course's own material in the browser
                         (NREMT's reference pages, or ochem's 64 note sections listed by
                         curriculum.js) and answers by quoting the passage that covers the
                         question. Optionally posts the question plus those passages to an
                         AI endpoint for a written answer; see worker/. site-chrome.js
                         mounts it, so no page loads it directly
  errors.js            Says when a page breaks. Loaded first on every page that
                         has an account.js, because the errors worth hearing
                         about are the ones early enough to stop a page working
                         — see When a page breaks
  reminders.js         Study reminders: when to ask, what the notification
                         says, and the row the courier reads. Inert until a
                         VAPID key is configured — see Nothing brought anyone
                         back
  site-search.js       Matching, ranking and snippet highlighting, shared by
                         both courses' search pages — see Searching a course
  report-question.js   "This looks wrong" — the one-tap report under every
                         explanation in both courses. See Reporting a bad
                         question
  account.js           One login for the whole site: Supabase auth + namespaced
                         cross-device sync (see Data & accounts)
  hub-progress.js      One shared level and one shared streak; per-subject XP.
                         Also the streak freeze (a week of study earns one, it
                         bridges one missed day) and the goal that eases off
                         after a bad stretch — see Streaks that survive a bad week
  analytics.js         Umami. Inert until WEBSITE_ID is filled in at the top of the
                         file — no script loaded, no request made, every event() a
                         no-op — so a half-configured tracker cannot quietly phone
                         home. site-chrome.js mounts it. Also keeps the per-browser
                         visit history the return-rate events are derived from.
                         See Analytics below
  icon.svg,            The mark, and the raster copies iOS and Android need.
  icon-*.png             Generated by scripts/build-icons.mjs; see Icons below
nremt/                 The NREMT-EMT Prep course
  index.html           App home
  practice.html        Question bank UI (fetches assets/questions.json at runtime)
  dashboard.html        XP, streaks, domain accuracy, readiness score
  study-plan.html       Auto-generated study checklist
  exam-day.html         How the real exam works: adaptive format, the clock, cost,
                          eligibility, retake rules, what to bring
  study-notes.html      The course textbook: forty chapters rendered one at a time
                           from inline data — see "The NREMT textbook" below
  glossary.html, mnemonics.html, flowcharts.html,
  skillsheets.html       Reference content
  body-map.html          Interactive 3D anatomy (three.js + a compressed .glb model)
  sound-trainer.html      Lung/heart sound identification
  scenario-sim.html       Branching clinical scenarios
  search.html             Client-side search across notes + the question bank
  assets/
    questions.json        The 2,106-question bank: the file you edit. Nothing fetches
                            it; questions-core.json and explanations.json are
                            generated from it (scripts/build-question-bank.mjs)
    question-ids.js        What every stored question record refers to. Pure
                             translation between a question's permanent id and
                             its position in the bank — see "Every question has
                             an id" below
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
                            64 sections, fetched on demand by the textbook
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
    practice-bank.json     2,940 multiple-choice/true-false questions, 30 per topic
                            across the 78 shipped topics, keyed by topic id. This is
                            the file you EDIT; nothing fetches it at runtime any more
    practice-bank-core.json  Generated. Stems, options and answer keys — what the two
                            pages actually wait on before their first screen (168 KB gz)
    practice-bank-why.json   Generated. The explanations, positionally aligned per
                            topic, fetched afterwards and blocking nothing (121 KB gz).
                            Nothing reads one until a question has been answered, so
                            waiting on them cost 114 KB of first paint for no reason
    bank-loader.js         Fetches the core, exposes the promise both page bootstraps
                            wait on, invalidates any pool the question engine built
                            before it landed, and fetches the explanations separately.
                            A question normalized before they arrive resolves its `why`
                            through a getter when it is displayed, so the gap closes
                            itself instead of freezing in an empty explanation
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
scripts/check-console.mjs CI: loads every page in a browser and fails on a
                            runtime error (see below)
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

The rail's box searches the prose, not just the 64 section names. `ochem/assets/textbook-search.js` indexes each note fragment as it is fetched — the index is built from the same cache the chapters read from, so there is no separate corpus to keep in sync, and the first query fetches whatever has not been read yet. A query lists the matching passages with the words highlighted; picking one opens that chapter and scrolls to the exact paragraph, still highlighted. Every query term has to appear in a section for it to match, and ordinary question words ("what is a nucleophile") are dropped so a typed question searches for the idea.

The interactive lessons are unchanged and each section links out to its own. Reading is tracked separately from mastery in `ochem_textbook_read`, set by reaching the end of a section or by hand, worth 5 XP the first time, and never mixed into the mastery number — which still comes only from answering questions. Old per-lesson `?notes=1` URLs redirect to the matching section.

### The NREMT textbook (`nremt/study-notes.html`)

The NREMT notes use the same shell as the ochem book — the shared rail and chapter frame in `theme.css` — with the forty chapters held as inline data (`CHAPTERS`) in the page itself, the way the glossary and mnemonics are, so search and the tutor index them without a fetch. Everything on the page is generated from that data, and a chapter is extended by appending to it.

What makes it read as a textbook rather than a page of notes, and where each piece comes from:

The prose itself is written as a textbook, not as revision notes. That was a second pass over the same material: every chapter's body was rewritten from "term — fragment" bullets and arrow chains into paragraphs, keeping every fact, figure, name and mnemonic. Bullets survive only where a list is the honest form — the ordered steps of a procedure, a set of criteria, named categories, a medication list — and each kept list is introduced by a sentence. Tables were not touched. The rewrite was done against a validator (`scripts/`-external, kept out of the repo) that compared each chapter with its source and failed on a changed heading, section id, takeaway or table, or on any number that went missing; the writing is checked, not trusted.


- **Chapter opener.** The chapter number set large, a two-to-four-sentence opening paragraph (`intro` on each chapter) with a drop cap, an "In this chapter" contents box listing the numbered sections with their topic headings as links, and a length line (sections, topics, an estimated reading time at 200 words a minute).
- **Numbered sections.** `14.1`, `20.2`: the number is the chapter number and the section's position, computed at render, so nothing in the data has to be renumbered when a section is added. The rail, the running head, search results and the key-points box all use the same number.
- **Running head.** Chapter on the left, the section you are in on the right, pinned under the site header once you scroll past the opener — what a book prints at the top of every page.
- **Serif prose.** The site's face is Nunito, served at 600 and up; an hour of bold sans tires the eye, so this page sets its prose in a system serif at regular weight (`--book-serif`, scoped to `.tb-main`; headings, tables, labels and buttons stay in Nunito). No font file is downloaded. Consecutive paragraphs indent instead of gapping, and the small italic remarks (`.sub`) are set as margin notes with a rule.
- **Table captions.** `Table 14.1`, `Table 14.2`, numbered in reading order within the chapter and captioned with the heading they sit under. Done after render (`numberTables`), so the notes data stays plain HTML and a table added or removed renumbers the rest.
- **Key terms.** At the end of each chapter, the glossary entries whose term appears in the chapter's text, with their definitions. The glossary stays as inline data in `glossary.html` (search and the tutor index it there); the notes page fetches that file — already cached by the service worker — and reads the entries out of it, the way `assets/tutor.js` does.
- **Check your understanding.** Five single-answer questions from the bank, fetched on demand (the bank is 1.1 MB, so it is not fetched until asked for) and chosen from the questions that belong to the chapter. The bank is tagged by exam domain and topic rather than by chapter, and one topic ("Medical", 200 questions) spans six chapters, so `CHAPTER_QUESTIONS` names a domain and/or topic per chapter and, where that is still too wide, a pattern the stem has to match. The five are stable for the day (seeded on chapter and date) so a reader who comes back finds the ones they were on; "Another five" moves the seed along. Answering reveals the bank's explanation. A chapter with no honest match (the history of EMS) has no block, the way it has no tools block.
- **Printing** lays out the whole book: a cover, a two-column contents page, then every chapter on a fresh page with its tables numbered; the questions, running head and tool links are left out.

Deep links: `#chapter-14` opens a chapter, `#ch14-principles-assessment` a section, and `#ch14-principles-assessment--3` the third topic in it (the contents box links this way). The chapter container deliberately has no `id="chapter-N"`: with one, the browser scrolls to it on load, under the sticky header.

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

### Ways in, and the way back in

The login is a nuisance charged against work a student has already done, so the
form is sized accordingly: one screen, the fewest fields that can work, and no
step that is not load-bearing.

| | |
|---|---|
| **Password** | Minimum 8 characters, length-first strength meter, a **Show** toggle. The toggle is why there is no *confirm password* field — a second box exists only to catch a typo you cannot see, and being able to look catches the same typo without doubling the work. Caps Lock is called out, because `Invalid login credentials` with Caps Lock on is the most maddening failure there is and the browser will never mention it. |
| **Forgot password** | `resetPasswordForEmail` → the link returns to `/`, the SDK fires `PASSWORD_RECOVERY`, and `account.js` opens the *Set a new password* screen wherever you land. There was previously **no way back in at all**: a forgotten password meant a permanently orphaned account with a level and a streak inside it. |
| **Magic link** | `signInWithOtp` — no password to invent, store or recall. For a site checked on a phone and a laptop this is often the whole ceremony. |
| **Social** | Google, Apple and GitHub buttons, rendered from whatever the project reports as enabled — see below. |
| **Resend confirmation** | The *Check your email* screen can send the mail again. A confirmation that lands in spam used to be a dead end. |
| **Email typos** | `gmial.com` and ~20 neighbours of the six big domains are caught on blur with a one-click fix. Mail to a typo'd address is not bounced — it is delivered nowhere, silently, while the student waits for it. |

Two rules the copy follows. **Errors say what to do next**: Supabase's own
strings leak its vocabulary (`AuthApiError`, `otp_expired`) and, in the case
that matters most, are actively unhelpful, so `authMessage()` maps every
failure reachable from the form to a sentence. **The reset screen never says
whether the address has an account** — "no account with that email" hands
anyone holding a list of addresses a free check for which ones study here.

The dialog behaves like one: Escape closes it (except mid-recovery, where the
token is single-use), Tab is trapped inside it, focus returns to the button
that opened it, the page behind cannot scroll, and errors are announced via
`role="alert"`. Inputs are 16px so iOS does not zoom the page on focus.

Signing out goes through a menu rather than a `window.confirm()`, and **pushes
before it drops the session** — signing out with unsynced work in the browser
is the one way to actually lose progress here.

`authMessage`, `passwordScore` and `emailTypo` are exported on
`StudyHubAccount` and tested in `scripts/test/auth-form.test.mjs`.

### Deleting an account

`privacy.html` invoked GDPR and CCPA and then asked people to send an email, which is a deletion right in roughly the sense that a locked door with a doorbell is an exit. It is a button now — **Delete account**, in the account menu.

Three things this screen has to get right, and only the first is obvious.

- **It is irreversible, so it asks properly.** The word has to be typed, and the submit stays dead until it matches; accepting a near miss would make the typing ceremonial, which is the one thing it must not be. Not `window.confirm()` — the sign-out menu exists precisely because that dialog was the wrong shape for a decision.
- **The account and the browser are two different things**, and almost nobody expects that. Progress lives in `localStorage`; the account is a synced copy. Left alone, "delete my account" would silently leave every streak, level and answered question sitting in the browser the person is looking at — which is either exactly what they wanted or the opposite, and they are the only one who knows. So it is a checkbox, on by default, named plainly enough that turning it off is a real option.
- **It offers the backup first.** This is the one action on the site that destroys work on purpose, and the export already exists on `privacy.html`; making someone go and find it, in a dialog they cannot leave without starting over, is how a person loses four months of study to a change of mind. `progress-backup.js` is loaded on demand here rather than on all 101 pages that carry `account.js`.

`delete_own_account()` (in `scripts/sql/schema.sql`) **takes no arguments**. It reads `auth.uid()` from the caller's verified JWT, so there is no id to pass and therefore no id to tamper with — the difference between this and every version of it that accepts a user id. It is granted to `authenticated` only.

Two orderings matter and both are the non-obvious one. The browser is cleared **after** the account is confirmed gone, because the other order risks wiping a device for a delete that then failed. And sign-out here does **not** `push()` first, which every other path in `account.js` does — here it would re-create the row that was just deleted.

The erase list is an allow-list, like the backup's, so a key nobody added on purpose survives. It keeps exactly one thing: **`levlprep_analytics_opt_out`**. That is a standing instruction not to collect something rather than progress, and wiping it would turn "delete my account" into "and start tracking me again". `scripts/test/account-delete.test.mjs` pins that, along with the walk-then-delete order — removing keys inside the index walk renumbers them underneath it and skips every other one, which leaves a browser looking mostly wiped.

### Supabase settings these depend on

Auth → URL Configuration must list the site origin under *Redirect URLs* (the
reset link returns to `/`, everything else to the page you started from).

**Move off the built-in mailer before relying on any of this.** Email went from
doing one job (signup confirmation) to four — confirmation, resend, sign-in
link, password reset — so it is now load-bearing, and Supabase's built-in SMTP
is explicitly a development convenience: a handful of messages an hour,
**counted across the whole project rather than per user**. Two students asking
for a link in the same hour can starve the third, and the failure looks exactly
like "the email never came". Any real provider (Resend, Postmark, SES) has a
free tier many times this traffic. Until then `authMessage()` at least tells the
truth about it — the mail cap gets its own sentence rather than borrowing the
sign-in cap's "wait a minute and try again", which would be a false promise,
and it points at the password instead.

**Check the identity-linking setting before enabling a provider.** If someone
signs up with `sam@gmail.com` and a password and later presses Continue with
Google, whether those become one account or two depends on Supabase's
configuration. Two accounts means their streak is in one and their session is
in the other — and progress is the entire reason accounts exist here.

### Social sign-in is discovered, not hardcoded

The provider row is **not** a list in this repo. `account.js` asks the project
what is actually enabled — GoTrue publishes it unauthenticated at
`/auth/v1/settings` — and renders exactly that, cached in `localStorage` for
12 hours and revalidated every time the dialog opens.

That is deliberate. A hardcoded list has two failure modes and this has
neither: a button for a provider with no client id behind it is a dead end
that looks like a bug, and a provider switched on in the dashboard stays
invisible on the site until someone remembers to edit and redeploy a file.
**Enabling Google in Supabase turns the button on here, with no commit and no
deploy** — within 12 hours at the outside, usually on the next page load.
Switching it off removes it the same way. `PROVIDERS` in `account.js` holds
only presentation (label, brand mark, order); a provider enabled upstream that
isn't listed there is ignored rather than rendered blank.

**To turn on Continue with Google** — both steps are outside this repo:

1. **Google Cloud Console** → APIs & Services → Credentials → *Create OAuth
   client ID* → Web application. Authorised redirect URI is
   `https://bsfcqrczehbcctwhxmrj.supabase.co/auth/v1/callback`. You will also
   need an OAuth consent screen; while it is in *Testing* only accounts you
   list can sign in, so publish it before launch.
2. **Supabase** → Authentication → Providers → Google → enable, paste the
   client id and secret.

Apple and GitHub work the same way (Apple needs a paid Apple Developer
account; GitHub is free and takes about two minutes, which makes it the
cheapest way to test that this whole path works end to end).

`redirectTo` is the page the student was on, so OAuth returns them where they
started rather than to the homepage. The origin must be listed under Auth →
URL Configuration → Redirect URLs.

### Which way in did this browser use?

Offering three routes creates a new way to get stuck, and it is the nastiest
one in the form: **an account created with Google has no password**, so typing
one fails identically and forever, and nothing on screen connects that to the
button two inches above. Supabase does not link a password identity to an
OAuth one by email, and the API cannot be asked which identities an address
has without leaking whether the address has an account at all.

So the browser remembers the method it last used (`levlprep_last_method`,
alongside `levlprep_last_email`; never the password). It buys two things: a
quiet **Last time** pill on the provider button that was this browser's way
in, and — when a sign-in fails with `invalid_credentials` *for the same
address this browser last opened with a provider* — a sentence saying so.
Both are phrased as reminders about this browser, not claims about the
account, because that is all the client can honestly know.

That memory is worth little on a **new device**, which is the case accounts
exist for and the one where "which way did I sign up?" actually bites. Nothing
client-side can know the answer there, so the fallback is one that does not
need to: a failed password attempt promotes the sign-in link and rewords it
("it works either way"). A link is addressed to the account's email, so it
gets someone in however they originally signed up — Google, password, or a
link last time. It is the only answer that is right without knowing anything,
which is why a wrong password is exactly when to stop hiding it at the bottom
of the dialog.

Signing out clears both keys. The prefilled address is a convenience on your
own laptop and a small leak on a shared one — a campus machine showing the
next student the last one's email — and signing out is precisely the signal
that distinguishes them. Closing the tab is not, which is why this hangs off
`SIGNED_OUT` rather than `pagehide`.

A provider whose OAuth call fails is dropped from the cache and re-fetched
immediately, so a provider switched off upstream cannot leave a dead button
sitting there for the rest of the 12 hours.

### Measuring it

`account.js` raises a small, milestone-level funnel through `LevlAnalytics`:
`auth-opened`, `auth-provider-chosen`, `auth-link-sent`, `auth-succeeded`,
`auth-reset-requested`, and `auth-wrong-password` (carrying only *which*
method this browser remembered, if any). No email address or account
identifier is ever in a payload, and a whole session costs a handful of events
rather than one per keystroke — `analytics.js` is explicit that events count
against a monthly total. `auth-wrong-password` is the one to watch: it is the
direct measure of whether the multiple-ways-in confusion is real, and how
often the promoted sign-in link is the thing people needed.

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

### Streaks that survive a bad week

The day someone loses a twelve-day streak is very often the last day they open the site: the run was the reason to come back, and one bad Tuesday deletes it. Two rules soften that without making the number meaningless.

- **Streak freezes.** Seven days of study earns one, you hold one at a time, and it bridges exactly one missed day. Reading a page never spends one — `walkStreak` bridges the gap *provisionally* and `recordActivity` commits it, so the freeze is paid for at the moment it is actually needed. If the student never comes back, nothing was spent and there was no streak left to protect anyway.
- **The goal eases off.** Two missed days out of the last three and the daily goal halves (floor of 5), returning to the student's own number as soon as they are studying again. `effectiveGoal` is pure, so what the dashboard shows and what counts as met cannot drift apart. **A goal set by hand is never moved** — `setGoal` clears `goalAuto` and that is the end of it.

Both needed a bound the walk never had: `firstActiveKey`, the first day this browser recorded anything. Without it the blank space *before* a student's first session reads as missed days — which spent a freeze bridging a day before they existed, and handed every brand-new student the eased-off goal meant for someone recovering. Both failures were caught by the unit tests and neither would have thrown.

### Two nudges, one shape

`.levl-prompt` in `theme.css` is shared by the only two things on the site that ask the student for anything, and **only one is ever in the DOM at once**:

- **"Save your progress"** (`assets/account.js`, `promptToSave`). Progress that lives only in a browser dies with it, and nobody is warned. So it is offered — but at a high point, straight after a level-up or a finished exam, never at the door. Signed-out only, once a week, three times ever, silent for good after two refusals, and it withdraws itself after 15 seconds without counting that as a no. The level-up path waits out the confetti `motion.js` runs for the same event.
- **"Add to home screen"** (`assets/site-chrome.js`, `showInstallPrompt`). Never on a first visit — it reads `levlprep_visits` and holds back until the student has been back at least once. Chrome's `beforeinstallprompt` is deferred so the timing is ours; Safari has no such event, so iOS gets the "Share, then Add to Home Screen" instruction instead, and its button is an acknowledgement rather than a refusal.

### Icons

`assets/icon.svg` is still the one drawing, and everything on the site uses it. The raster copies exist because **iOS ignores an SVG `apple-touch-icon`** and falls back to a screenshot of the page — so every iPhone home-screen install looked like a bookmark instead of an app, which is most of the reason to install one.

    node scripts/build-icons.mjs

renders `icon-180.png` (apple-touch), `icon-192.png`, `icon-512.png` and `icon-maskable-512.png`. Like the link-preview cards it needs Playwright's Chromium, is a local tool rather than a CI step, and the PNGs are committed. The maskable copy is the mark scaled to 60% on a full-bleed field of its own colour: a maskable icon is cropped by the platform to whatever shape it likes, and reusing the plain one is the usual way to end up with the arms of a logo sliced off.

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
   `<course>/assets/tutor-bank.json` (NREMT 2,106 entries, ochem 1,844). That
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

## Accessibility

Three things, all mounted from `assets/site-chrome.js` rather than written into pages, for the same reason the header is: one place to fix, and a page added later gets them for free.

- **Skip link.** Tabbing into any page meant tabbing the whole two-row chrome first — back arrow, wordmark, course, streak, level, account, mute, theme, then every section tab — before reaching a word of content, on every page. The link is injected as the first child of `<body>`, parked off-screen with a `transform` (not `display:none`, which is not focusable, so the link could never receive the focus meant to reveal it), and lands on `<main>` if the page has one or the first real element after the tab row otherwise. That element gets `tabindex="-1"`, or the viewport moves while the keyboard stays in the header and the next Tab returns to the first nav tab — the exact loop the link exists to break. The hub, `privacy.html`, `404.html` and `offline.html` draw their own headers and carry their own copy.
- **Answer announcements** (`assets/announce.js`) — a polite live region that speaks correct/incorrect and the explanation, wired into the one choke point each course's feedback passes through.
- **Reduced motion** — a blanket CSS rule in `assets/theme.css`, plus `window.LevlMotion` for the movement CSS cannot reach (smooth scrolls, the body map's camera flights).

## Nothing brought anyone back (`assets/reminders.js`)

The site had a real spaced-repetition scheduler and no way to say anything with it. `ochem/assets/mastery-engine.js` computes a due date per concept; `nremt/practice.html` builds a due queue from the same idea; `hub-progress.js` keeps a streak, a freeze that bridges one missed day, and a goal that eases off after a bad week. Every bit of that machinery assumed the student *chooses* to open the site.

A scheduler that knows forty items are due today and has no way to say so is doing half its job. And the day somebody loses a twelve-day streak is very often the last day they open the site at all — the run was the reason to come back, and nothing was ever going to tell them it was about to end.

**The browser decides everything.** Whether to remind, when, and what the words say are all worked out here and written into one row; the Worker is a courier. That is not a shortcut — the due counts live in `localStorage` and never leave it, so a server that decided when to remind would first have to be told everything the student has ever answered. This way it is told a number and a sentence. `privacy.html` says exactly that under **Study reminders**.

**It says something true or it says nothing.** `compose()` builds the sentence from what is actually waiting: one course names the course, two name both, and a record older than a week is not quoted at all. Nothing due and no streak worth protecting returns `null`, and `null` clears the send time rather than sending something empty. A reminder saying "12 questions due" to somebody who cleared them this morning is worse than no reminder — it is a reason to distrust the next one, and the next one is the one that was going to work. Both courses call `report()` from the page that already computes the number for its own display, which is the cheapest place to keep it honest.

**Asking is the expensive part.** A browser gives a site exactly one notification permission prompt; a "no" is usually permanent and cannot be asked for again from script. So the rules are the same shape as the other two nudges (see *Two nudges, one shape*) and tighter: never a first visit, never when there is nothing to remind them about — an offer to be told about work that does not exist is just a permission prompt — at most three times ever, a week apart, silent for good after two refusals, and never at the same time as the save prompt, which wins the tie because it protects work that already exists.

**It stops on its own.** `MAX_UNANSWERED` is 3. Three sends with no sign the student came back and it goes quiet until they open the site themselves. One is not a reminder, it is a coin flip against whether they had their phone; a daily notification forever is how an app gets its permission revoked, and a revoked permission cannot be asked for again.

**The push carries no payload.** A Web Push message can carry an encrypted one (RFC 8291: ECDH, HKDF, AES128GCM) — a few hundred lines of crypto whose failure mode is a push that silently never arrives. A payload-less push is valid: `sw.js` wakes and asks the Worker what to say. One round trip at a moment nobody is watching, in exchange for deleting the whole encryption path, and the text is fetched when it is *shown* rather than when it was queued, so it cannot be stale. VAPID is still implemented, in `worker/src/push.js`.

**Email is the fallback, and only that.** iOS Safari allows notifications only for a site added to the home screen, which is a large share of the people this site is for. Email reaches them: signed in only (there is no other way to know an address, and asking for one would turn a free tool into a mailing list with a study app attached), strictly opt in, and never alongside push — enabling one turns the other off, because the same sentence twice is the fastest way to make both unwelcome. Every message carries a one-click unsubscribe in the footer *and* in the `List-Unsubscribe` header; without that header, somebody who wants out presses "spam" instead, and that costs the domain's reputation for every message it sends including the password resets.

`privacy.html`'s promise that there was "no product email of any kind" had to change in the same commit as the table. That paragraph has now been wrong twice and corrected twice, and says so.

Setup — VAPID keys, secrets, the cron — is in `worker/README.md`. Everything is inert until it is configured: no prompt, no button, no request, same rule as `analytics.js`. Tested in `scripts/test/reminders.test.mjs`.

## Searching a course

Each course has a search page that indexes the whole course in the browser and sends nothing anywhere. `assets/site-search.js` holds the part that is the same in both — matching, ranking, snippet highlighting — because it used to live inline in `nremt/search.html` and the moment a second course wanted a search page the choice was to share it or copy it, and the two per-course copies of `theme.css` are what copying it looks like eighteen months later.

- **AND, not OR.** Every term has to appear somewhere in a chunk. Matching the whole query as one literal substring returned nothing for anything but an exact quotation; OR returns the entire bank for any query containing a common word.
- **Heading beats body, and the whole phrase intact beats its words scattered.** A chunk can also declare a `weight`, which is what puts the aldol *lesson* above the ninetieth practice question that mentions aldol.
- **Escape, then mark.** Marking the raw string and escaping afterwards eats its own `<mark>` tags; marking raw text with a raw pattern misses any term containing `& < > ' "`. So: slice, escape, then match the escaped term against the escaped text.
- **A URL has one fragment.** Ochem's textbook links already carry a hash naming the section, and appending `#:~:text=` to that produced `learn.html#e2#:~:text=…` — a second `#`, which matches no element and is not a text directive either. A broken text fragment is ignored by the browser rather than reported, so the only symptom was a link that quietly stopped opening the right chapter.

**`ochem/search.html`** is the new one. `learn.html`'s rail already searched the textbook, but only the textbook, and only the sections that happened to have been fetched already — which left the 94 lessons, the 10 mechanism walkthroughs, the 7 tools and 2,940 practice questions with no way in at all. Someone who could not remember whether anti-periplanar was explained in a lesson, a mechanism walkthrough or the textbook had to guess.

Its five sources are all *derived*, never listed: `curriculum.js` for the lessons and mechanisms (so a topic with no page yet is not a result — a hit that leads to "coming soon" is worse than no hit), the note fragments for the textbook, `tools-registry.js` for the tools, and `practice-bank-core.json` for the questions (with `practice-bank-why.json` stitched back on by position, so an explanation is searchable too). Structure is indexed synchronously so a query typed immediately finds the lessons while the megabyte of prose is still arriving; each source may fail on its own, and the status line names **what is missing** rather than only what is present — offline, the difference between "the bank isn't here" and "your search found nothing" is the whole difference between a working page and a broken one, and an empty result list cannot tell them apart. A filter row exists because a mixed index of five kinds returns forty practice questions and "show me only the lessons" is the first thing anyone wants next.

Search is now a tab in the ochem header (the tab row scrolls horizontally, so a seventh item costs nothing on a phone) and a link under the tools grid — outside it, because check #10 compares those tiles byte-for-byte against the registry and search is a way of getting somewhere rather than a tool.

## Reporting a bad question (`assets/report-question.js`)

`sources.html` promised a way to tell us when a question is wrong from the day it was written. It explained the correction policy and said where corrections get listed, and then never said *how* — the only address anywhere on the site was at the bottom of the privacy policy. For a bank of 2,106 NREMT questions and 2,940 ochem ones, written against reference material rather than by a committee, that was the most expensive gap on the site. No script can check whether an answer is clinically right; a student who has just answered one and thinks the key is wrong is the only reviewer who can, and they are on the one screen where saying so costs a tap.

So it is a tap, under the explanation — in the results list after an exam, on the back of a flashcard, and under every ochem question's feedback. Not on a contact page the reader would have to go looking for while holding the thought.

- **Four reasons and an optional box.** Most reports are one of a few things, and making someone write a sentence to say "the key is wrong" loses most of them. The reason list is a contract with `report_question()` in `scripts/sql/schema.sql`, which rejects a reason it does not recognise — so a test asserts the two are the same list, because drifting apart means every report silently fails at the far end while the dialog says thank you.
- **Reported once per browser, and the button says so.** It becomes an inert "Reported — thank you" for that question. That is less about rate limiting than about the receipt: the same question shows up in a review list *and* on a flashcard, and a button that comes back live invites a second report, because nothing told them the first one landed.
- **The id is a question id, never a position.** A report outlives the edit it asks for. NREMT reports carry the permanent id; ochem has no id scheme, so a report carries the engine's `lb:<topic>:<n>` reference *plus a short hash of the stem* — the reference finds it instantly, the hash says whether what is there is still the question that was reported. An edited stem stops matching, which is the right answer rather than a failure.
- **It reuses the auth dialog's classes** instead of bringing a second set, for the same reason there is one `theme.css`. Escape closes, Tab is trapped, focus returns to the button, the page behind cannot scroll, and the textarea is 16px so iOS does not zoom on focus.
- **The click is stopped in the capture phase.** The flashcard is one big click target that flips on any click inside it; left alone, pressing Report flipped the card away, which hid the button mid-dialog and left Escape with nothing to return focus to. Stopping it on the way back up is too late — `#fcCard`'s handler is bound to the element and has already run.
- **A failure is never silent.** If the report does not land — offline is the common case, since the rest of the site works offline and this one thing cannot — it says so and leaves the button live, rather than thanking someone for something that went nowhere.

Reading them: `scripts/sql/reports.sql`. Tested in `scripts/test/report-question.test.mjs`.

## When a page breaks (`assets/errors.js`)

183 pages of hand-written vanilla JS, no bundler and no framework — which is the point of the stack, and also means nothing checks that a page still *runs* before it ships. A typo in one lesson's bootstrap renders an inert page: the text is there, the buttons do nothing, no error is visible to the reader, and nobody finds out. The student assumes the site is broken and leaves, which is exactly the population least likely to email about it. Nothing on the site knew this had happened.

An uncaught error or a rejected promise is now reported once, to our own Supabase, through the same `security definer` RPC shape as the page counter (`report_client_error`, in `scripts/sql/schema.sql`).

- **It is loaded first**, immediately above `account.js` in every page's head, which makes it the first deferred script on the page. That position is the whole value: the errors most worth hearing about are thrown by page bootstraps at `DOMContentLoaded`, after the deferred scripts but before anything mounted asynchronously by `site-chrome.js` could have registered a listener. A reporter that arrives late reports only the failures that were not fatal. Check #11 in `check-site.mjs` fails if a page loads `account.js` without it, or loads it after.
- **Reports are queued before they are sent**, because running before `account.js` means the thing that does the sending does not exist yet at the moment of the most interesting errors. Without the queue, being early would cost exactly the reports being early was for.
- **Capped at five per load and deduplicated within a load.** One error inside a `requestAnimationFrame` loop is sixty errors a second, and a reporter that forwards all of them faithfully is a denial-of-service against our own database. The same cap bounds the queue, since a page that breaks before `account.js` arrives is exactly the page that breaks repeatedly.
- **A third party failing to load is not a bug in this site.** An ad blocker stops Umami and the Supabase CDN on a large share of visits; reporting each one would bury the real reports under noise we already design around. A *same-origin* resource failing to load is the opposite — a page just lost a module — and is reported.
- **`Script error.` is dropped.** A cross-origin script gives no file, no line and no stack, and is almost always an extension.
- **It goes through the analytics opt-out**, checked before anything is sent rather than discarded at the far end, and it never throws: a reporter that can throw turns one broken page into a broken page plus a loop.

What is sent: path, message, file/line/column, the first few stack frames with the origin stripped, and the user-agent. What is not: any stored value, any answer, any question, any email, any user or session id, any referrer. `privacy.html` says so under **When a page breaks**, including the one honest caveat — a browser-written error message can quote the fragment it choked on, which is why messages are truncated.

Tested in `scripts/test/errors.test.mjs`.

## Privacy

`privacy.html` is the site's privacy policy, linked from every page footer. The short version: no ads, no cookies, no cross-site tracking; progress lives in `localStorage`; what leaves the browser unprompted is the anonymous page counter and cookieless analytics, both described below.

It is also the only page with *controls* on it rather than prose: the analytics opt-out, and progress backup/restore. Both belong to "what this site does with your data", which is what the page is, and both are things you reach for once rather than daily — so they live there instead of taking up room in the header on all 110 pages.

Its lede claimed "no ads, no trackers and no cookies" for a while after Umami went in, which was no longer true of the middle third. Fixed. **If what the site collects changes, this page changes in the same commit** — a privacy policy that lags the code is worse than none.

## Backing up progress (`assets/progress-backup.js`)

Every scrap of study state is in `localStorage`: XP, level, streak, concept strength, the spaced-repetition schedule, exam history, flagged and missed questions, lesson position. That is what makes the site work without an account, and it is also the whole risk — `localStorage` is per-browser and per-device, and it is the first thing "clear browsing data" takes. Signing in syncs XP and streak, not every per-question record.

So there is an export to a plain JSON file and an import back, on `privacy.html`. Notes on the design, because each one is a decision that could have gone the other way:

- **An allow-list of keys, not a deny-list** (`hub_`, `nremt_`, `ochem_`, plus a few exact names). A deny-list would silently start exporting whatever a future feature stores. Anything new has to be added on purpose.
- **The Supabase session token (`sb_*`) is excluded.** It is a live credential; a backup must not be a way to hand over an account.
- **Values are kept as the raw strings `localStorage` holds.** Half are JSON and half are bare (`'dark'`, `'on'`); parsing would have to guess which, then guess back.
- **Restore replaces rather than merges**, after a confirm that names the item count and the backup's date. Two study histories mixed together are not a study history.
- **The same allow-list is applied on the way in.** The file came off a disk and could say anything; importing must not be a way to write arbitrary keys.
- **The page reloads afterwards**, because every module reads its state once at load.

## Local development

No build step — just serve the directory statically, e.g.:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`.

## CI

`.github/workflows/checks.yml` runs five jobs on every push/PR (the browser job runs two checks, so there are six in total). The first, `scripts/check-site.mjs`, has no network dependency and needs no build step, so it runs in seconds. It checks:

1. Every local `href`/`src` in every HTML file points at a file that exists.
2. Every JSON file parses.
3. Each Ochem lesson has the number of steps `lesson-concepts.js` was authored against.
4. Every URL in `sitemap.xml` maps to a real file — **and** every real page is in `sitemap.xml`. Fifty Ochem lesson pages once shipped with no path in from a search engine because the sitemap was hand-maintained; run `node scripts/build-sitemap.mjs` to regenerate it after adding a page.
5. **Both** question banks carry no answer tell: no keyed option position holds more than 40% of items, no select-N key set dominates, no true/false set drifts to one answer, and the "longest option is the answer" rate stays under its ceiling. This ran over `questions.json` alone for as long as there was one bank, and quietly went on doing so after ochem got its own — the defence existed and nothing pointed it at the second bank, which drifted to more than twice the ceiling NREMT is held to. The ceilings are a ratchet — lower one as a bank improves, never raise it. Ochem's are the exception and say so in the code: they are the bank's measured state on the day it was first guarded, written down so it cannot get worse while the editorial work happens.
6. Every advertised question count in markup, meta tags and this README matches the right bank — there are two now, and which one a page means is decided by whether it lives under `ochem/`. The README describes both, so a figure in it is correct if it matches either. The homepage went on advertising a figure from an early build long after the bank had more than doubled.
7. Every advertised Ochem count matches `curriculum.js`: a digit count of "topics" is the number of topics with an href, "lessons" the number under `lessons/`, "mechanisms" the number of pages under `ochem/mechanisms/`. The course was "58 lessons", "62 topics" and "Fifty-eight interactive lessons" on three pages at once.
8. Every question in the bank has a unique id, so every record in a learner's browser still refers to something.
9. Every page that loads `assets/account.js` also loads `assets/errors.js`, and loads it first — a page whose failures nothing reports is a page that can break silently forever, and new pages are copied from existing ones.
10. The static tool tiles written into `ochem/tools.html` (so a crawler or a reader with scripts off still gets the list) are byte-identical to what `tools-page.js` renders from `tools-registry.js`.

### Generated files

A third job re-derives everything that is generated from the pages and fails if what is committed disagrees. These all fail the same way otherwise — a page or a question is added, the derived file is not rebuilt, and nothing says so:

| Check | Guards |
|---|---|
| `build-og-tags.mjs --check` | every page has a link-preview card |
| `build-sitemap.mjs --check` | every page is in `sitemap.xml` |
| `build-question-bank.mjs --check` | the two files `practice.html` fetches match `questions.json` |
| `build-tutor-bank.mjs` + `git diff --exit-code` | the assistant's teaching index matches both banks |

`build-sitemap.mjs` reads each page's last commit date out of git, so that job checks out with `fetch-depth: 0`. Its `--check` compares the **URL set** rather than the bytes — `<lastmod>` is derived from history, and a byte comparison would fail over something nobody got wrong.

### Accessibility and weight

Two more jobs, both added because the README argued carefully about something and then nothing defended it.

**`scripts/check-a11y.mjs`** runs axe-core over one page of every *shape* the site has — twelve of them, which is enough: if a lesson is accessible then all 58 built on the same engine are, and a violation in one of them is a violation in the engine. It fails on serious and critical only; minor and moderate are printed and do not fail, because a rule at that level is often a judgement call and a check that cries wolf gets switched off within a month. It also makes three checks axe cannot, because they are about this site's own decisions: the skip link landing on something that exists and can take focus, and the `main` and `nav` landmarks surviving the runtime-rendered header.

It shares a job with `check-console.mjs` below, because those two are the only checks here that need a browser and installing Chromium twice would be paying for it twice. `check-site.mjs` is dependency-free and runs in seconds on every push; bolting a minute onto it would make the check people actually wait for slow.

Turning it on found eight real things, every one of them invisible to anybody who was not the person it locked out:

- **The brand teal failed contrast.** `#1C8C7B` measured 4.13:1 on white and 3.55:1 on the tinted panel against a 4.5:1 requirement, on ten of the twelve page shapes — and white text on the same green as a button fill failed by the same ratio, so one value was two failures. The comment beside it in `theme.css` read "safe for text and for fills" and was wrong on both counts. Now `#127264`: 5.81:1 and 4.99:1.
- **`--muted` failed on one course and not the other.** `#55706A` cleared 4.5:1 on white and on the standard surface but landed at 4.47:1 on the ochem tint — under by three hundredths, on the lede of every ochem page.
- **The "pitfall" callout was the least readable thing on the site**, at 2.89:1, on a box whose whole job is warning somebody about a mistake they are about to make. It used `--amber-press`, a *button's pressed state*, as a text colour. `--amber-text` already existed for exactly this and was not being used — and the same category error turned out to be in sixteen other places.
- **176 pages had no `main` landmark.** Four files out of 180 declared one. `site-chrome.js` already worked out where the content starts, for the skip link; it applies the same answer as `role="main"` now, so every page gets one and a page added later gets it for free.
- **208 dead keyboard tab stops in the textbook.** The 3D figures in `ochem/notes/` are snapshots baked from `mol3d.js`, which produces clickable atoms for the *tools* pages. The textbook does not load `mol3d.js`, so every one of those atoms was a `role="button"` tab stop that did nothing — dozens per chapter — inside a wrapper declaring the whole SVG a single image.
- **Wide figures scrolled but could not be focused**, so the content past their right edge did not exist for anyone not using a pointer. `textbook.js` now gives a tab stop to figures that *actually* overflow, and takes it away again on resize when they do not — a tab stop that scrolls nothing is one more thing to get past for no reason.
- **Both search inputs had no label**, only a placeholder, which disappears the moment you type.
- **Two `<figure>`s sat directly inside a `<ul>`**, which is invalid and stops a list reporting its own length.

One advisory is known and deliberately unfixed: `role="main"` on a wrapper that contains the footer leaves a `contentinfo` landmark nested inside `main`. Moving the footer out on every page is DOM surgery under CSS written around the current structure — a real risk of breaking layout to fix a moderate advisory, against a main landmark that is unambiguously worth having.

### Does the page actually run?

Every other check here *reads* the files. `check-site.mjs` proves a path resolves, `check-weight.mjs` proves a page is small, `check-a11y.mjs` proves the rendered DOM is usable. None of them proved the page **runs**. A typo'd property, a module that throws on load, a JSON fetch pointed at a file that moved, a listener bound to an element a refactor renamed: all of it parses, all of it passes every check above, and all of it is a dead page in front of a student.

`assets/errors.js` already exists for exactly this class of bug — but it reports from production, after somebody has hit one. **`scripts/check-console.mjs`** asks the same question before the commit lands. It loads every page in Chromium and fails on an uncaught exception, anything written to `console.error`, a same-origin request that 404s or fails, or the same `id` on two elements once the page has rendered.

That last one is here because this site builds most of its interactive DOM from template strings at runtime, where a duplicated id is invisible to any static scan and makes `getElementById` return the wrong element — silently, and only for whichever control lost.

It ignores **cross-origin** requests. The Supabase SDK and the analytics script come off third-party hosts, and whether those resolve says something about the CI runner's network rather than about this commit; a check that fails when somebody else's CDN has a bad afternoon gets switched off within a month, and then it is not checking anything. Same-origin is this repo's to get right, so same-origin is what is enforced.

It visits **every** page, not one per shape, which is the opposite of the sampling `check-a11y.mjs` does — deliberately. Accessibility is a property of a template, so twelve cover 180. A runtime error is a property of one page's own inline bootstrap, which is exactly where this site puts its per-page wiring, so sampling would look at the one file that cannot be wrong. Six pages load at a time; 180 pages take about a minute.

All 180 pages pass today, which is the point: it starts green and stays that way, so the first thing it ever says is about a commit that broke something. The ignore list is empty, and an entry on it that stops matching **fails** the check rather than sitting there implying a problem that was fixed years ago.

**`scripts/check-weight.mjs`** is a byte budget, and needs nothing to run: it reads the files off disk and gzips them, so it sits with the fast checks. It measures the HTML plus every same-origin stylesheet, script and font a page references. Scripts count even though all of them are deferred — deferred means "does not block the parser", not "free".

Three buckets, not one number, because every page loads the same `/assets/` shell and counting it into all twelve budgets would put every page within a few KB of every other, which is exactly the resolution at which a page-specific regression disappears. So the site shell, each course shell and each page are budgeted separately. The 2.3 MB question bank is not in any of them: it is fetched after paint, which is the entire point of the split, and folding it in here would erase the distinction that work was for.

The numbers are a **ratchet**, same rule as the answer-tell check: lower a budget when a page gets lighter, never raise one to make a build pass. A budget with more than 30% headroom is reported as stale — reported, never failed, since a ratchet that tightened itself would fail the build for making things better.

### Unit tests

A second job runs `node --test scripts/test/*.test.mjs` — 161 tests over the pieces whose failure modes are silent. Everything above checks that the site is *wired* correctly; nothing checked that it *scores* correctly. An interval that doubles too eagerly buries a shaky concept for four months, a decay curve that bites too hard makes yesterday's work look undone, a streak that resets in the wrong timezone eats a 40-day run. None of that throws, and none of it would have been caught by a link checker — the student just gets worse practice and no one finds out.

- `scripts/test/hub-progress.test.mjs` — the level curve (pinned: changing it demotes every existing user), XP accumulation and per-subject split, streak continuation across days, goal tracking, rank titles, day-log pruning.
- `scripts/test/mastery-engine.test.mjs` — unseen vs. scored-zero, the learning rate settling as evidence accumulates, the same-day guard that stops one good session reaching a six-month interval, the interval cap, the decay floor, due-ness, leech benching and its release on a lesson read, the daily review cap, mistake de-duplication, tier records.
- `scripts/test/reminders.test.mjs` — the asking rules and the composed sentence. Both fail silently in the expensive direction: a rule one condition too loose burns the one permission prompt a browser will ever give, and a sentence quoting a stale number teaches people to ignore the next one.
- `scripts/test/site-search.test.mjs` — AND vs OR, the ranking order, the escape-then-mark ordering, the one-fragment-per-URL rule, and that ranking does not mutate the index it is handed.
- `scripts/test/account-delete.test.mjs` — what a "delete my account" erases and, more to the point, what it leaves: the analytics opt-out, anything not on the allow-list, and the Supabase session the delete itself needs.
- `scripts/test/report-question.test.mjs` — the once-per-browser receipt surviving a re-render, the bounded store, and the reason list matching what the database will actually accept.
- `scripts/test/errors.test.mjs` — the cap, the dedupe, the opt-out and the queue that holds reports until `account.js` exists. All four fail silently in both directions: a broken cap floods the database, a broken queue reports nothing and looks like a site with no bugs.
- `scripts/test/question-ids.test.mjs` — what the numbers in a learner's records mean: ids surviving a deletion, a reorder and an append; the positional option-order array converting once and idempotently; a half-finished attempt abandoned rather than graded around a hole.
- `scripts/test/harness.mjs` — loads these browser IIFEs into a VM context with a window, a localStorage and, crucially, a clock the test controls. Both engines are about *time*; none of this is testable against a real `Date.now()` without either sleeping or asserting nothing.

No dependencies and no build step, in keeping with the rest of the stack. Both engines were checked by mutation: 13 deliberate breaks (level curve shifted, same-day guard removed, interval cap removed, decay floor removed, lesson never lifts the bench, and so on) and every one of them fails the suite. A test that passes either way is worse than no test, so re-run that exercise if you add to these.

## Analytics

Two things measure the site, and they are not the same thing.

**The site's own counter** (`assets/account.js`, `trackPageview`) has been there the longest: a `track_pageview` RPC that adds one to a per-path, per-day total in our own Supabase. No IP, no cookie, no id, no referrer — there is genuinely no way to tell two visits apart. It still runs and is unaffected by any of the below.

The `page_views` table it writes to has row-level security on with **no policies at all**, so nothing reaching it through the API can read or write it — the `security definer` RPC is the only way to touch it, which is what lets `privacy.html` promise the counter cannot be read back. Reading it therefore means the Supabase SQL editor, where the service role bypasses RLS. `scripts/sql/pageviews.sql` holds the queries: totals, top pages, per-day, per-course, which ochem lessons actually get opened, and a full CSV export. **This history predates Umami and Umami will never have it** — Umami knows only about traffic since the day it was installed, so for anything before that this file is the only record.

**Umami** (`assets/analytics.js`) answers what that counter never could: not "was this page opened" but "did the person who opened it finish". It is a third party and collects more — referrer, country, browser, OS, device, and a daily visitor hash so visits can be told apart within a day.

Setup: put the website id from the Umami dashboard into `WEBSITE_ID` at the top of `assets/analytics.js`. That is the only step. Until it is set the file does nothing at all, which is deliberate. `cloud.umami.is` is already in `script-src` and `connect-src` in the CSP on all 97 pages that carry one.

**Umami's script host and its data host are not the same host**, and the CSP has to name both. `script.js` comes from `cloud.umami.is`; the script then POSTs its events to `gateway.umami.is`. Only the first was in `connect-src`, so every event was blocked by the browser with a console error nobody was reading — the dashboard showed nothing and looked exactly like a site with no traffic. Both are listed now, on all 102 pages that carry a CSP.

`data-do-not-track="true"` is set, so a browser sending Do Not Track is excluded entirely. Ad blockers block it, as they block every analytics tool including the respectful ones; nothing on the site depends on it, and the site's own counter is unaffected because it goes to our own domain.

There is also a per-browser opt-out, on `privacy.html` under **Site analytics**. It writes `levlprep_analytics_opt_out` to `localStorage`, and `assets/analytics.js` checks it *before* creating the script tag, so opting out means no request to Umami rather than one discarded at the far end. Two people want this for different reasons: a visitor who would rather not be counted, and whoever runs the site, whose own testing is otherwise indistinguishable from real traffic. **Turn it on in your own browser** or every number on the dashboard includes you.

Events are **milestones, not actions**, and should stay that way. Umami's free tier counts every event against a monthly total, so tracking each answered question would cost 100 events for one exam instead of 2. The eleven that exist:

| Event | Where | Carries |
|---|---|---|
| `exam-start` | `nremt/practice.html`, `beginQuiz` | mode, question count. A resume is **not** counted — it is the same attempt, and counting it would make the completion rate read worse than it is |
| `exam-finish` | `nremt/practice.html`, `showResults` | mode, count, score as a band (`70-79`), never an exact result |
| `ochem-session-start` | `ochem/assets/session-runner.js`, `start` | mode |
| `ochem-session-finish` | same file, `finish` | mode, questions answered |
| `lesson-complete` | `ochem/assets/lesson-engine.js`, on the final step | topic id |
| `visit` | `assets/analytics.js`, from `mount()` | cohort band, days since first visit, distinct days studied, course. **Once per browser per day**, not per page load |
| `returned-second-day` | same | days since first visit |
| `first-questions` | both courses, on the first session ever started | seconds from page load, mode. Fires once per browser, ever |
| `save-prompt-shown` / `save-prompt-accepted` | `assets/account.js` | — |
| `install-prompt-shown` | `assets/site-chrome.js` | platform (`ios` / `other`) |
| `install-prompt-choice`, `installed` | same | outcome |

No answer a student gives and no question they see is ever sent.

### Measuring whether it sticks

Pageviews cannot answer the only question that matters for a study app: did the person who opened this come back tomorrow. Umami deliberately gives no stable visitor id across days — the daily hash exists precisely so it cannot — so the small amount of history needed is kept in the browser instead, in `levlprep_visits`: first day seen, last day seen, distinct days studied, and the day the last event was sent.

**None of those dates leave the browser.** What is sent is a coarse band (`new`, `d1`, `d2-7`, `d8-30`, `d31+`) and two counts, once a day at most. `privacy.html` says so under **Site analytics**, and the existing opt-out covers it, because everything goes through `event()` and `event()` returns early when opted out.

One thing `event()` had to learn: events raised on page load were being **dropped**, because the Umami script had not arrived yet. That was harmless while every caller was a student minutes into an exam, and became a real hole the moment anything fired on load — the visit event would have been lost on exactly the slow connections whose retention is most worth reading. Events now queue (bounded at 20, so a blocked script is not a leak) and flush when the script lands.

**`privacy.html` is part of this.** It previously promised "no analytics SDKs of any kind" and that claim had to go; the page now names Umami, lists field by field what it collects, and says so where the old claim stood. If what is collected here ever changes — another event, another field — that page changes in the same commit. A privacy policy that lags the code is worse than none.

## Updating the question bank

Questions live in `nremt/assets/questions.json` — a flat JSON array of objects shaped like:

```json
{"domain": "Assessment", "diff": "medium", "topic": "Primary Assessment", "q": "...", "options": ["...", "...", "...", "..."], "correct": 1, "explain": "..."}
```

Edit that file directly (it's plain JSON, not embedded in any page's markup), then rebuild what is derived from it:

```
node scripts/build-question-bank.mjs   # the two files the browser fetches
node scripts/build-tutor-bank.mjs      # the assistant's teaching index
```

### Why the bank ships as two files

`questions.json` is what you edit; it is not what the browser downloads. `practice.html` fetches `questions-core.json` and `explanations.json`, both generated from it and index-aligned with it.

The reason is that the explanations are two thirds of the bank's compressed weight — 409 KB of the 665 — and not one word of them is read until after a question has been answered. Waiting on them meant every visitor waited on all of it to see a question they could have been shown already. Measured on a 1.5 Mbps link with a 4× CPU throttle, on the page that is the site's front door:

| | question on screen |
|---|---|
| one file | 4467 ms |
| split | **2394 ms** |

The explanations are fetched immediately afterwards without blocking anything and land about 270 ms later — long before anyone could have answered. The two places that read them (`renderFlashcard`, `renderReview`) `await` that promise anyway, because "long before" is an assumption about a fast phone and not a guarantee. If the second file fails outright, every mode still works and only the "why" under an answer is missing.

**Positional alignment between the two generated files is not cosmetic.** `explanations.json` is a bare array of strings, matched to `questions-core.json` by position, which is what lets it skip repeating a key 2,106 times. Both are generated in one pass from `questions.json` and neither is ever reordered independently.

### Every question has an id

What a learner's browser stores is a different question, and it used to have the same answer. Every saved exam, flagged question, missed question, mastery record and shuffled option order was a bare **position** in this bank — which made the bank append-only forever. Deleting a wrong question, deduplicating two near-copies or sorting the file would shift every position after the edit and silently re-point every one of those records at a different question. Nothing would throw; a student's missed queue would just quietly fill with questions they had never seen. The cost of that constraint grew with every new account.

So every question carries an `id`, and everything above is keyed by id instead.

- **`build-question-bank.mjs` assigns them**, only to questions that have none, and only from above the high-water mark — so a hole left by a deleted question stays a hole rather than being handed to a new question that would inherit the deleted one's place in everybody's records. Never renumber, never hand-edit an id. **Deleting a question is now safe**, which is the entire point.
- **There is no migration step**, because the ids were introduced by numbering the bank in its existing order. `id === index` on the day of the change, so every number already on every device was already a correct id and none of them needed rewriting. Old `practice.html?q=N` links still open the question they always did, for the same reason.
- **One record changed shape rather than meaning.** `nremt_option_order` was a positional array, and an array cannot survive a question being removed — deleting one question would re-deal the letters of every question after it, including for an exam already in progress. It is now an object keyed by id. `QID.readOrders()` accepts either shape and returns the object, so the conversion happens on the next page load with no marker key and no ordering guarantee needed against account sync — which matters, because a device that has not yet converted can be handed a synced copy from one that has.
- **Unknown ids are dropped on read**, so a deleted question leaves everyone's queues by itself. This is also the behaviour the old code should have had: a stale position past the end of the bank used to sit in the missed queue forever.

`nremt/assets/question-ids.js` is pure translation — no `localStorage` access; the page owns its reads and writes and this owns what the numbers in them mean. Tested in `scripts/test/question-ids.test.mjs`, where the cases that matter are all bank edits: a question deleted, questions reordered, questions appended. Check #10 in `check-site.mjs` fails on a missing or duplicated id.

## Pages that stand in for other pages

Two files are served at URLs that are not their own, so both use absolute asset paths (a relative one would resolve against whatever folder the visitor asked for) and neither carries a canonical or a link-preview card. Both are skipped by `build-og-tags.mjs`, `build-sitemap.mjs` and the sitemap-coverage check in `check-site.mjs`.

- **`404.html`** — GitHub Pages serves it for any URL it cannot resolve. It shows the address that failed, offers a way back into each course, and only offers "back to the last page" when there is a history entry to go back to.
- **`offline.html`** — `sw.js` serves it for any page that is not in the cache while offline. It used to serve the course home page instead, which rendered something but explained nothing: you tapped Practice, landed on a home page, and read it as the app being broken. This keeps the address bar on the page you asked for (so a reload retries it) and lists what *is* cached on this device, read out of the Cache API rather than hard-coded — the precache is a core set and everything else is cached on visit, so the true answer differs per device.

## Link previews

`scripts/build-og-tags.mjs` writes the Open Graph and Twitter tags into every page, derived from the `<title>`, meta description and canonical each page already carries. Eighty pages had none — every ochem lesson, mechanism and tool — and unfurled as a bare grey URL in a chat, which for a site that spreads by students sharing links is the cheapest reach there is to lose. Hand-writing them would have put the same three facts in two places on every page and guaranteed drift.

The cards themselves are generated too, by `scripts/build-og-images.mjs`, which renders an HTML template in Playwright's Chromium at 1200×630. It is a local tool, not a CI step; the PNGs are committed. They were previously hand-made and both had gone stale without anyone noticing — the site card still said "Study Hub", a name the site had not used in months, and the NREMT card advertised a question count from an early build against a bank that had since more than doubled. (Writing that stale figure out here in full trips check #6 above, which is the check working.) The copy now lives next to the numbers it quotes and the counts are counted off disk.

Run it as `node scripts/build-og-images.mjs` after changing a card's copy. Note that ochem's lesson count is counted from `ochem/lessons/*.html` rather than from `curriculum.js`: that file lists modules and topics under the same shape, so matching it counts the module headings too and the card claims 76 where there are 58.
