# Notes for Claude sessions

## Anatomy & Physiology course

`docs/anp-spec.md` is the source of truth for the A&P course. Before doing any
A&P work, read it in full. When the plan changes, update that file in the same
commit as the change. `docs/anp-dependency-map.json` is the Phase 0 concept map
the ordering build check reads; `docs/anp-phase0.md` explains it.
`docs/anp-phase1-report.md` is the Phase 1 pilot report; `docs/anp-phase3-report.md` reports
the finished course (Phases 2 and 3).
`docs/anp-needs-author.md` holds open questions and contested science for human
review; add to it instead of guessing.

## NREMT interactive lessons

`docs/nremt-lessons-spec.md` is the source of truth (format, engine, free vs Premium, accuracy rules, review process,
build plan and accuracy log); read it before NREMT lesson work and update it in the same commit. Data:
`nremt/data/lessons/*.json`; builder: `scripts/build-nremt-lessons.mjs`; open points: `docs/nremt-needs-author.md`.

## AP® Biology course

`docs/apbio-spec.md` is the source of truth (owner brief, phase status, decisions, launch checklist); read it
before AP® Biology work and update it in the same commit. Formats: `docs/apbio-architecture.md`; writing rules:
`docs/apbio-authoring-guide.md`; contested science: `docs/apbio-needs-author.md`; reviews: `docs/apbio-reviews/`.

## AP® Chemistry course

`docs/apchem-spec.md` is the source of truth (research summary, positioning, continuity rules, build plan, decisions);
read it before AP® Chemistry work and update it in the same commit. Research with sources: `docs/apchem-research/`.
Formats: `docs/apchem-architecture.md`; writing rules: `docs/apchem-authoring-guide.md`; map: `docs/apchem-phase0.md`;
contested science: `docs/apchem-needs-author.md`.

## AP® Physics 1 course

`docs/apphys-spec.md` is the source of truth (owner brief, research summary, build plan, decisions); read it before
AP® Physics 1 work and update it in the same commit. Research with sources: `docs/apphys-research/`. Formats and the
tool layout (one set of files per trainer, so authors work in parallel): `docs/apphys-architecture.md`; writing rules:
`docs/apphys-authoring-guide.md`; map: `docs/apphys-phase0.md`; open points: `docs/apphys-needs-author.md`.

## AP® Calculus AB course

`docs/apcalc-spec.md` is the source of truth (owner brief, research summary, build plan, decisions); read it before
AP® Calculus AB work and update it in the same commit. Research: `docs/apcalc-research/`. Formats, math syntax,
`expr` items and tool layout: `docs/apcalc-architecture.md`; writing rules: `docs/apcalc-authoring-guide.md`; map:
`docs/apcalc-phase0.md`; open points: `docs/apcalc-needs-author.md`. Published and live.

## AP® Calculus BC course

`docs/apcalcbc-spec.md` is the source of truth (owner brief, research summary, build plan, authoring split,
decisions); read it before AP® Calculus BC work and update it in the same commit. Built on AP® Calculus AB: AB's
docs still describe every shared format. Research: `docs/apcalcbc-research/`. How BC reuses AB (one generator,
`build-apcalcbc.mjs`; AB topics read from `calculus/data/`, never copied; AB's runtime with `window.ApCalcCourse`),
interval items and BC FRQ slots: `docs/apcalcbc-architecture.md`; writing rules on top of AB's:
`docs/apcalcbc-authoring-guide.md`; map (an overlay on AB's): `docs/apcalcbc-phase0.md`; open points:
`docs/apcalcbc-needs-author.md`; briefs (authors A-D, builders T1-T3): `docs/apcalcbc-briefs/`; launch log:
`docs/apcalcbc-reviews/launch.md`. Published and live; Premium on sale once merged (Worker setting in spec
section 9); merges after AP® Precalculus. AB's build must stay byte-identical: run
`node scripts/build-apcalc.mjs --check` after any shared change.

## AP® Statistics course

`docs/apstat-spec.md` is the source of truth (owner brief, research summary, trainers, grading, build plan, decisions,
launch checklist); read it before AP® Statistics work and update it in the same commit. Research:
`docs/apstat-research/` (the course was revised for 2026-27: five units, new exam). Formats: `docs/apstat-architecture.md`;
writing rules and conclusion templates: `docs/apstat-authoring-guide.md`; map and the CED check: `docs/apstat-phase0.md`;
open points: `docs/apstat-needs-author.md`; briefs: `docs/apstat-briefs/`. Published and live.

## AP® Environmental Science course

`docs/apenv-spec.md` is the source of truth (owner brief, research summary, trainers, grading, build plan,
decisions, launch checklist); read it before AP® Environmental Science work and update it in the same commit.
Research: `docs/apenv-research/`. Formats, `ApEnvCalc` recipes and unit-aware grading: `docs/apenv-architecture.md`;
writing rules (setups with brackets and units, specific answers, content traps): `docs/apenv-authoring-guide.md`;
map and the CED check: `docs/apenv-phase0.md`; open points: `docs/apenv-needs-author.md`; briefs (authors A-G,
builders T1-T4): `docs/apenv-briefs/`. Published and live.

## AP® Psychology course

`docs/appsych-spec.md` is the source of truth (owner brief, research summary, trainers, grading, build plan,
decisions); read it before AP® Psychology work and update it in the same commit. Research: `docs/appsych-research/`.
Formats, `ApPsychStats` recipes, study summaries and AAQ/EBQ FRQs: `docs/appsych-architecture.md`; writing rules
(apply concepts, research methods, mental-health language, no myths): `docs/appsych-authoring-guide.md`; map and the
CED check: `docs/appsych-phase0.md`; open points: `docs/appsych-needs-author.md`; briefs (authors A-G, builders
T1-T4): `docs/appsych-briefs/`; launch log: `docs/appsych-reviews/launch.md`. Published and live; Premium not on
sale (`onSale: false`) until the owner checklist in spec section 9.

## AP® Precalculus course

`docs/apprecalc-spec.md` is the source of truth (owner brief, research summary, build plan with the author and
builder split, decisions); read it before AP® Precalculus work and update it in the same commit. Research:
`docs/apprecalc-research/`. Formats, domain-aware `expr` grading, FRQ types and tool layout:
`docs/apprecalc-architecture.md`; writing rules (three-decimal rule, limit notation, rate and concavity wording, Q4
forms, no calculus words): `docs/apprecalc-authoring-guide.md`; map: `docs/apprecalc-phase0.md`; open points:
`docs/apprecalc-needs-author.md`; briefs (authors A-F, builders T1-T4): `docs/apprecalc-briefs/`; launch log:
`docs/apprecalc-reviews/launch.md`. Published and live; Premium on sale once merged (Worker setting in spec
section 9); Unit 4 is "beyond the exam".

## AP® Macroeconomics course

`docs/apmacro-spec.md` is the source of truth (owner brief, research summary, build plan with the author and
builder split, decisions); read it before AP® Macroeconomics work and update it in the same commit. Research:
`docs/apmacro-research/`. Formats, `ApMacroCalc`, the `graph` item and FRQ graph parts (`mac-graph.js`,
`ApMacroGrade.graph`) and tool layout: `docs/apmacro-architecture.md`; writing rules (graph labeling, ample
reserves, causal chains with every link, divide the gap, the currency axis ratio, no released questions):
`docs/apmacro-authoring-guide.md`; map: `docs/apmacro-phase0.md`; open points: `docs/apmacro-needs-author.md`;
briefs (authors A-F, builders T1-T4): `docs/apmacro-briefs/`; launch log: `docs/apmacro-reviews/launch.md`. Published
and live; Premium on sale since 2026-11-04 (owner checklist in spec section 9 done).

## AP® Microeconomics course

`docs/apmicro-spec.md` is the source of truth (owner brief, research summary, build plan with the author and
builder split, decisions); read it before AP® Microeconomics work and update it in the same commit. Research:
`docs/apmicro-research/`. Forked from AP® Macroeconomics (`microeconomics/`, `mic-*`, `ApMicro*`, storage
`apmicro_`). Formats, `ApMicroCalc`, the graph engine with areas, curved curves, lines and two panels
(`mic-graph.js`), the `matrix` item (`mic-matrix.js`) and tool layout: `docs/apmicro-architecture.md`; writing rules
(label every axis and curve, MC through the minimums, price from demand, shade the right region, both comparisons,
MRP = MRC, market vs efficient quantity): `docs/apmicro-authoring-guide.md`; map: `docs/apmicro-phase0.md`; open
points: `docs/apmicro-needs-author.md`; briefs (authors A-E, builders T1-T4): `docs/apmicro-briefs/`; launch log:
`docs/apmicro-reviews/launch.md`. Published and live; Premium on sale since 2026-11-10 (owner checklist in spec
section 9; the migration `2026-11i-apmicro.sql` is applied by the lead). Macro's build must stay
byte-identical: run `node scripts/build-apmacro.mjs --check` after any shared change.

## AP® Human Geography course

`docs/aphug-spec.md` is the source of truth (owner brief, research summary, trainers, grading, build plan,
decisions); read it before AP® Human Geography work and update it in the same commit. Research:
`docs/aphug-research/` (`accuracy-risks.md` for stale facts, disputed places and group names). Formats, `ApHugCalc`,
maps (`hug-map.js`, base maps in `human-geography/figures/base/`, map files in `figures/maps/`), the `model` item
(`hug-model.js`), pyramids and the three FRQ types with task verbs: `docs/aphug-architecture.md`; writing rules
(plain words, define before use, a named real place and scale, task verbs, stimulus questions need the stimulus,
neutral and dated, no released questions): `docs/aphug-authoring-guide.md`; map: `docs/aphug-phase0.md`; open
points: `docs/aphug-needs-author.md`; briefs (authors A-G, builders T1-T4): `docs/aphug-briefs/`; launch log:
`docs/aphug-reviews/launch.md`. Published and live (all seven units and the skills chapter); Premium on sale once merged (Polar product,
`hug-2027` in the Worker, migration `2026-11j-aphug.sql` and the owner grant done: spec section 9); merges right after
AP® Microeconomics, which this branch already contains (fifteen courses, twelve AP® Exams).

## AI FRQ grader (AP® courses)

`docs/frq-grader.md` is the status file (owner decisions, design, setup, eval and launch rule). Worker:
`worker/src/frq-grade.js`; page: `assets/course/frq-grader.js`; eval: `scripts/frq-eval/`. Shipped off.

## Ochem readability and diagram pass

`docs/ochem-readability-audit.md` lists every notes and lesson page's findings, worst first, and
`docs/ochem-phase1-report.md` reports the first rewrites. Open points for a person go in
`docs/ochem-needs-author.md`. Figures for a rewritten topic live in `scripts/ochem-figures/<topic>.mjs`
and can also appear in its lesson (see the header of `scripts/build-ochem-figures.mjs`).

## Site audit follow-up (2026-10)

`docs/site-audit-followup.md` is the status file for fixing `docs/site-audit-2026-10.md`: owner checklist, decisions,
open items. Per-finding notes are in `docs/site-audit-notes/w1.md`–`w9.md`. `scripts/ci-local.sh` runs every CI job
locally (`BROWSER=1` adds the browser checks). New check-site rules go in `scripts/site-rules/`.

## Trust and conversion

`docs/trust-conversion-plan.md` is the status file (funnel numbers, owner facts for the About page, plan).

## Invite friends

`docs/invites.md` is the status file: owner decisions (3-day gift, 7-day reward after 20 answers, 8 a year),
the codes and claims in `scripts/sql/migrations/2026-10m-referrals.sql`, `assets/invite.js` and the `r=` on shared links.

## Site redesign (light channel look)

`docs/site-redesign.md` is the status file: the approved design canvas, the visual system (course covers in
`assets/covers/`, display fonts at the end of `assets/fonts/fonts.css`) and which pages are done.

## Course dashboards

`docs/dashboard.md` is the status file: the five-question dashboard every course uses (design F, owner 2026-10-26),
its files, the daily accuracy log `hub_daily_v1` and what was left out.

## Guided study path

`docs/guided-path.md` is the status file: the three ways to study, the rules that keep a student from getting stuck,
`assets/path/<course>.json` (`scripts/build-paths.mjs`, from each curriculum and dependency map), each course's
`path.html` (`scripts/build-path-pages.mjs`, from its review.html), `assets/course/path.js` and `.css`, and the Path
tab in `assets/site-chrome.js`. Rebuild both scripts after changing a course's topics, map or review page.

## Question quality

`docs/question-quality.md` is the status file: what the 2026-11 audit measured in every bank, what was fixed
(NREMT reshuffle, honest "explained" wording, NREMT per-option lines in `nremt/assets/option-whys.json`, dealt
choices on teacher printed tests, Env Sci length cues, tally fixes), live answer data and what is open. The analytics runs check question health (Project doc A3.9).

## Analytics

`docs/analytics-plan.md` is the status file: the Umami proxy and bot filter, first-touch source, question tallies
(`question_stats`), exam-quit, read depth and the rest, plus how to verify and read them.

## Video lessons

`docs/video-lessons.md` is the status file: `docs/videos.json` lists each public YouTube video and its pages;
`scripts/add-video.mjs` adds one (the daily long-video run), `scripts/build-videos.mjs` writes the click-to-load block.
Never paste a YouTube iframe into a page.

## Quick answers and the homepage video card

`docs/quick-answers.md`: the "Quick answer" box on notes pages (`docs/quick-answers.json`, placed through
`applyVideo`). `docs/from-video.md`: the homepage card for visitors from TikTok and Instagram
(`docs/from-video.json`, `scripts/build-from-video.mjs`).

## Tools upgrade, second round (2026-10-27)

`docs/tools-upgrade-2026-10.md` is the status file: the hands-on audit of every tool (`docs/tool-audit-2026-10.md`),
the fixes for it, and three builds (NREMT exam item types and adaptive exam, ochem synthesis trainer, A&P 3D anatomy).

## Making the site fuller (2026-11)

`docs/fuller-2026-11.md` is the status file: what the 2026-11-10 round did (NREMT lessons and bank audit, deeper AP
banks, precalculus figures, the tool audit of the four newer courses in `docs/tool-audit-2026-11.md`) and what is
next (audit of the other banks, ochem per-option lines, tool rebuild mockups).

## Tool visuals (2026-11)

`docs/tool-visuals-2026-11.md` is the status file: what the owner means by better tool visuals (the picture shows
the concept; no blocks or bare charts), what is done (Country A drawn as a country) and the order for the rest.

## Database backups

`docs/backups.md` is the status file: the nightly copy the Worker makes itself (`worker/src/backup.js`, its own
cron, into Cloudflare KV `levlprep-backups`; nothing for the owner to set up), the weekly proof
(`.github/workflows/db-backup.yml`, `scripts/backup/check.mjs`) and how to restore.

## Premium vault and the Cloudflare host

`docs/premium-vault.md` is the status file: which lesson pages are vaulted (`scripts/vault/rules.mjs`), the deploy
build (`scripts/build-deploy.mjs` into `.deploy/`), the stub loader `assets/vault.js`, the Worker route
`worker/src/vault.js`, the site Worker `worker/site/`, free limits on the server (`2026-11h-free-usage.sql`) and the
owner's cutover checklist. levlprep.com is served by the Cloudflare site Worker since 2026-11-08 (GitHub Pages is
only the fallback); the repo is still public (see the status file). A new lesson page type must carry its free marker
or the deploy fails.

## Site health (search, speed, capacity)

`docs/site-health.md` is the status file: why Google indexes slowly, the sitemap rules (no Premium stubs, `<lastmod>`
from page text in `scripts/sitemap-dates.json`), cache headers, plan limits and the owner's open steps.

## Study reminders

`docs/reminders.md` is the status file for who is offered reminders (every course's score card, the all-course due
scan, the email offer, the one question after a new account) and the owner decisions behind it. How they are sent:
README "Nothing brought anyone back" and `worker/README.md`.

## Simulated students

`docs/student-sim.md` is the status file: `scripts/sim-students.mjs` runs headless "students" (practice, phone,
exam, random clicks, damaged or full storage, offline, path, flashcards, review) through a local copy of every course,
with all outside requests blocked, and what the first run found.

## Usage rules (save tokens, keep quality)

Quality wins: if a rule would hurt quality on a task, follow quality and say why in one line.

Context
- Context size is the main cost; keep it small.
- For big multi-step jobs, keep one plan/status file per project under `docs/` (like the `anp-*` files), so a fresh
  session can continue without the history. Commit and push it: the cloud container is temporary.
- Put what later work needs to know in that file and read it instead of reopening finished work.
- When a task is finished or context looks large, suggest /compact or /clear.

Reading
- Don't reread a file unless it changed or the context was compacted.
- Read only what you need: search first, then use offset/limit. Never read question bank or lesson JSON files in
  full; search them.
- Use Serena's symbol tools for code lookups when it's connected; otherwise grep plus targeted reads.

Agents
- Use helpers only for big or parallel work. Strongest model for writing, reasoning and accuracy checks; cheaper
  models for mechanical checks.
- Keep briefs short and point to files by path instead of pasting content. Send small fixes back to the same agent.
- One review pass with a clear checklist; add another only if serious problems turn up. A&P and ochem science
  content always gets an accuracy check.

Working style
- Batch related changes into one pass.
- For large or risky changes, propose a short plan and wait for OK.
- Keep replies short; no recaps.
