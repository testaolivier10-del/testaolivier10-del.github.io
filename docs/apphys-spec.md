# AP® Physics 1 course: spec and status

The source of truth for LevlPrep's sixth course. A fresh session reads this file, `CLAUDE.md`,
`docs/apphys-research/framework.md` and `docs/apphys-research/market.md`, not the chat history. When the
plan changes, update this file in the same commit. Open points for a person go in
`docs/apphys-needs-author.md`. Formats: `docs/apphys-architecture.md`; writing rules:
`docs/apphys-authoring-guide.md`; map: `docs/apphys-phase0.md`.

Course key `apphys` (storage, analytics, registry, SQL). URL path `/physics/`. Every new browser global
starts with `ApPhys`. Question ids start `phys-`, CSS classes `phys-`. Template: the AP® Chemistry course
(`docs/apchem-spec.md`, `docs/apchem-architecture.md`, `docs/apchem-authoring-guide.md`), itself a fork of
AP® Biology.

## 1. Owner brief (2026-10-12), condensed

- Sixth course. Chosen over a TEAS (nursing entrance) course because it is lower stakes while no course
  has had an expert review yet.
- Build the entire course in one go; site changes ship as one pull request the owner reviews.
- Tools must be high quality: at least the bar of the NREMT body map and the current AP® Chemistry
  trainers (interactive, visual, simple on landing, depth revealed progressively, never a dead end),
  ideally better. Professional illustration quality, no placeholder shapes.
- Continuity with the other five courses (shared components, same page types), own identity.
- Pricing as the other AP® passes: $25 one-time through 30 June 2027 ($17.50 founding price).
- Also fix: homepage still says "Three courses" / "See all three courses"; the Premium rules name only
  AP® Biology as a fixed-date pass.

## 2. What the research says (details and URLs in `docs/apphys-research/`)

**Framework.** CED revised for 2024-25: 8 units, 43 topics (Unit 8 Fluids is new to Physics 1).
Weights: U1 Kinematics 10-15%, U2 Force and Translational Dynamics 18-23%, U3 Work, Energy, and Power
18-23%, U4 Linear Momentum 10-15%, U5 Torque and Rotational Dynamics 10-15%, U6 Energy and Momentum of
Rotating Systems 5-8%, U7 Oscillations 5-8%, U8 Fluids 10-15%. Three science practices: 1 Creating
Representations (1.A-1.C), 2 Mathematical Routines (2.A-2.D), 3 Scientific Questioning and Argumentation
(3.A-3.C). Exclusions per topic in the framework file (section 3, "Exclusions checklist"); Units 3-8
exclusions came from a third-party copy of the CED and need a check (needs-author).

**Exam (Wed 5 May 2027, afternoon).** Format changes for 2027: Section I 42 single-select four-option MCQ
in 85 min (50%), Section II 4 FRQs in 95 min (50%), fixed order: Mathematical Routines (10 points),
Translation Between Representations (12), Experimental Design and Analysis (10), Qualitative/Quantitative
Translation (8); 40 raw points. 2025 and 2026 were 40 MCQ/80 min and 4 FRQ/100 min. Calculator on both
sections (Desmos built in). Hybrid digital: MCQ on screen, FRQs read on screen, handwritten. Equation
sheet provided; g = 9.8 m/s² on the sheet, 10 m/s² accepted. Not on the sheet: moments of inertia of
shapes (given in questions), escape speed, Torricelli, Kepler's third law.

**Scores.** About 174,000 takers in 2025. Pass rate jumped from 47% (2024) to 67% (2025) with the
redesign; 2026 about 19% fives and 68% 3+. No official cut scores published.

**Where students lose points.** Free-body diagrams with extra or missing forces, net force drawn as a
force, forces not starting on the object; mixing momentum and energy conservation; circular or vague
justifications; graphs without scales, labels or a best-fit line; lab procedures that do not name what is
measured with what instrument; functional-dependence reasoning (how a quantity scales). Full list in the
framework file, section 8.

**Market.** Fiveable $79/yr all subjects; UWorld $99-169 per subject; Albert $79 per subject; books
about $20-30. Free: Khan, Flipping Physics, Physics Classroom, PhET (simulations with no exam feedback),
AP Classroom. The gap: interactive simulations tied to exam-style practice with feedback on diagrams,
graphs and justifications.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, equations sheet page, score
calculator, unit practice tests. Premium ($25 one-time, through 30 June 2027): unlimited practice, exams,
every lesson, analytics, every trainer.

Differentiators, each answering a research finding:

1. **Free-body diagram builder (flagship).** Drag forces onto an object in a real scene; graded force by
   force with the reader-report misses named (extra force, missing normal, net force drawn, wrong
   direction, wrong relative length). Explore mode shows the live net force and the resulting motion.
2. **Simulations that are also tests.** Every trainer opens on an Explore pane (a live, professional
   scene) and has a seeded "Test yourself" drill with validators, as AP® Chemistry (apchem decision 21).
3. **Representations practice.** Motion graphs, energy bar charts, momentum bar charts, graph sketching
   for the TBR FRQ.
4. **Experimental design trainer.** Choose what to measure with what, what to plot to make a line, what
   the slope means; seeded noisy data sets.
5. **Functional dependence drills** ("if the mass doubles, what happens to the period?").
6. **Justification trainer** for claim-evidence-reasoning, with an answer that earns the point and one
   that does not.
7. **Exam-faithful practice**: 4-option MCQ in stimulus sets, the four FRQ types with rubrics and samples,
   full-length timed exams in the real 42/85 + 4/95 split.
8. **From zero, in CED order, nothing used before it is taught**, with a "Math you need" chapter (algebra
   with symbols, proportional reasoning, trigonometry and vectors, slopes and areas of graphs, units).

## 4. Continuity with the other courses

Built exactly like AP® Chemistry (decision 1), so every shared page type matches: home, units, lessons,
notes, unit sheets, glossary, flashcards, practice, review, exams, FRQ, justify, dashboard, search, tools,
cram, teachers, equations sheet, score calculator, unit tests. Same shared layer (`assets/course/*`,
`scripts/lib/glossary.mjs`, `hub.mjs`, `page-title.mjs`, `crumbs.mjs`, header, XP, accounts, Premium,
report, analytics, service worker), same lesson and item formats, same Tool Studio (`studio: true`,
apchem decisions 20-23), same empty states, Beta badge, "not yet reviewed by an AP® teacher" note and
trademark rules. Identity: own accent colour, own icon, own headline, own rank names (decision 3).

## 5. Build plan

One branch, `claude/apphys`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/apphys-research/framework.md`, `market.md` | **done 2026-10-12** |
| 0 | Fork AP® Chemistry: map (43 topics + math chapter), dependency map, generator, runtime `physics/assets/`, checks, tests, fixture, registration (registry, Premium pass, Worker, SQL migration, hub/pricing hidden until published, search, sitemap, OG card, budgets, theme colour, sw.js), tool scaffolding for every trainer, docs (architecture, authoring guide, phase0, needs-author) | **done 2026-10-12** (decisions 6-9): `docs/apphys-ced-map.json`, `docs/apphys-dependency-map.json` (48 topics, 203 concepts; `docs/apphys-phase0.md`), `scripts/build-apphys.mjs`, `check-apphys-map.mjs`, `check-apphys-content.mjs`, runtime `physics/assets/`, 11 tools pre-registered with per-tool files, formats in `docs/apphys-architecture.md`, rules in `docs/apphys-authoring-guide.md` |
| 1 | Content: every unit's lessons, notes, banks, FRQs (all four types), glossary, figures | **done 2026-10-12**: 48 topics, 747 bank questions, 21 FRQs, 203 glossary terms |
| 2 | Trainers (section 6) | **done 2026-10-12**: all 11, each with Explore, a seeded drill, a validator and tests |
| 3 | Justification trainer, two fixed practice exams, equations sheet, score calculator, unit tests, cram kit | **done 2026-10-12** (decision 10): 2 forms (42 MCQ + mr/tbr/lab/qqt each, 25 exam-only items), 33 prompts, 53 equation rows, estimated cut-offs 70/55/41/31; accuracy review of exams and prompts still due in Phase 4 |
| 4 | Independent accuracy checks per unit and for tools/exams; fixes | **done 2026-10-13**: `docs/apphys-reviews/` (u1, u2, u3-4, u5-6, u7-8, tools-a, tools-b, exams, and the authors' self-checks); open points in `docs/apphys-needs-author.md` |
| Launch | Publish, generators, continuity pass, homepage and Premium-rules fixes, full CI with browser checks, PR | **done 2026-10-13** (decision 11); Premium not on sale until the section 8 checklist |

Quality bar: AP® Chemistry authoring rules (original items only; at least 60% apply/analyze; stimulus
sets; per-option explanations; key-length balance; worked example before any calculation type); every
numeric key recomputed by code; physics content gets an independent accuracy check.

## 6. Trainers

| Slug | Unit | What |
|---|---|---|
| `motion-graphs` | 1 | A cart on a track (or a runner) driven by the student; position, velocity and acceleration graphs draw live; read slope and area; match motions to graphs |
| `projectile-lab` | 1 | Launch at any angle and speed; components, trajectory, time of flight, relative motion frames |
| `free-body-diagrams` | 2 | Flagship. Scenes (block on incline, hanging mass, elevator, Atwood, car on curve, pushed crate with friction); drag and size forces; graded with named misses; live net force and motion |
| `energy-bar-charts` | 3 | Skater track, spring launcher, ramp with friction; live energy bars; build before/after bar charts; work and power |
| `collision-lab` | 4 | Two carts on a track; elastic to perfectly inelastic; momentum and energy bars; force-time graph and impulse |
| `torque-balance` | 5 | A beam or mobile with masses at positions; torques, rotational equilibrium; rotational inertia race |
| `rotation-lab` | 6 | Rolling race down an incline, spinning skater (angular momentum), orbit energy |
| `oscillator-lab` | 7 | Mass on a spring and pendulum; x, v, a graphs; energy; what changes the period |
| `fluids-tank` | 8 | Buoyancy with objects of different density, pressure with depth, flow through a pipe (continuity, Bernoulli) |
| `lab-design` | all | Experimental design: what to measure with which instrument, linearize, fit a line, slope meaning; seeded noisy data |
| `scaling-drills` | math chapter, then all | Functional dependence and units: "if L is 4 times as long, the period is ... times" |

Free tools: `free-body-diagrams` (flagship), `motion-graphs` and `scaling-drills`; the other eight are
Premium. Most units have one trainer, so the AP® Chemistry rule would have made nine of eleven free.
Owner to confirm (needs-author `tools-premium`).

## 7. Decisions log

1. (2026-10-12) **Fork the AP® Chemistry runtime**, as AP® Chemistry forked AP® Biology.
2. (2026-10-12) **No "ap" in any served path.** Folder `/physics/`, files `phys-*.js`, question ids
   `phys-`. Registry/storage key `apphys`.
3. (2026-10-12) **Pass and price mirror AP® Chemistry:** `phys-2027`, $25 one-time, through
   30 June 2027, registered `onSale: false` until the owner checklist is done. Identity: amber accent
   (distinct from ochem lilac, AP® Biology green, A&P coral, NREMT mint, AP® Chemistry cobalt), pendulum
   icon, ranks from a physics theme. Exact values chosen in Phase 0.
4. (2026-10-12) **Sources:** College Board CED, equation sheet and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted. No OpenStax.
5. (2026-10-12) **Exam format is the May 2027 one** (42/85 + 4/95; FRQ types `mr` 10, `tbr` 12, `lab` 10,
   `qqt` 8). Default exam date Wed 2027-05-05.

6. (2026-10-12, Phase 0) **Fork shape and identity.** Everything AP® Chemistry has, renamed
   `phys`/`ApPhys`/`apphys`, built the same way (`docs/apphys-architecture.md`), minus the chemistry
   pieces (periodic table popup, particle stimuli, ICE/buffer/titration math, live beaker). Free:
   every notes page, glossary, flashcards, unit sheets, Units 1-2 lessons and every "Math you need"
   lesson, 15 questions a day, one exam; pass `phys-2027` registered `onSale: false`. Identity:
   amber `--ctint #FBEED5` / `--cink #734200` (7.3:1), dark `rgba(235,165,50,0.10)` / `#F5CF8A`
   (about 10:1 on the dark page); pendulum icon on the hub card and trainers band; headline "AP®
   Physics 1, one force at a time."; ranks Point Particle → Vector Tracer → Force Balancer →
   Energy Keeper → Momentum Master → Torque Turner → Physics Legend; manifest and OG card
   "Physics" without the mark. Registered hidden exactly as apchem decision 11 (registry, every
   generated course list, Worker, SQL with migration `2026-10f-apphys.sql` **not applied**,
   premium.js, hub/404/premium.html empty until a unit is published, site search
   `?course=physics`, tutor without a bank, sitemap, OG, budgets (site shell 287 → 288 KB), a11y
   and console samples, CI, site rules `apphys-trademark` and `apphys-beta-and-report`, `sw.js`
   `COURSE_URLS.physics` and cache v74). The registry entry has `status: 'hidden'` (no site-search chip or
   Continue link) until the first unit is published; the account page lists a not-on-sale course only
   to an account that holds its pass, so nothing changes for users.
7. (2026-10-12, Phase 0) **Math you need placed before first use**: units/prefixes/sig figs before
   1.1; symbols before 1.2; proportional reasoning and slopes/areas before 1.3; trigonometry and
   components before 1.5. Weight is pulled forward into 2.2 (FBDs) with its full treatment in 2.6.
8. (2026-10-12, Phase 0) **Item and FRQ formats.** Numeric grading keeps value, units and sig figs
   apart; units compare in SI base units; `numeric.gAlt` accepts the other value of g; feedback
   names sign, factor of 2, missing square or root, g 9.8/10, cm/m, kilo/milli and degrees/radians.
   Stimulus kind `diagram` (inline SVG with role="img" and a 20+ character label, or a figure).
   Practice 1 is free response only. FRQ types `mr` 10, `tbr` 12, `lab` 10, `qqt` 8 replace
   long/short everywhere; a TBR needs a `drawSpec` (fbd, bars or box: a blank box on paper) or a
   `graphSpec`, a LAB a `graphSpec`; parts may set `space`. Exams: 42 MCQ in 85 min, then the four
   types in order in 95 min (23.75/28.5/23.75/19 min); score bands placeholders (needs-author).
9. (2026-10-12, Phase 0) **Tools built for parallel authors.** All 11 trainers pre-registered in
   `pages.json` with their context `topic` and `studio: true`; each owns its page script, model
   (`tools/math/<slug>.js` registering `ApPhysMath.<camelSlug>`), data, validator and test. The
   shared `phys-tool-math.js` keeps only helpers (constants, g, rounding, seeded rng, diagnose,
   vectors, register); `phys-scene.js` (`ApPhysScene`) draws labeled force arrows and runs an
   animation loop that shows the end state under reduced motion. A tool is built only when its data
   file exists and its topic is published.

10. (2026-10-12, Phase 3) **Exams, trainer and entry pages**, as apchem decision 17 with the 2027 format.
   - Two **fixed practice exams** (`physics/data/exams/forms.json`): 42 four-option MCQ each, every unit
     inside its CED range (both forms: U1 5, U2 8, U3 8, U4 5, U5 5, U6 3, U7 3, U8 5; exams review), 7-9 stimulus sets of 3-5, bank items none of which is a
     lesson-check item, plus 13 (form 1) and 12 (form 2) **exam-only items** (`items.json`: a spring
     launcher set and a narrowing pipe set in form 1, a force-position graph set and a two-cart
     collision table in form 2, plus discrete calculations). Section II one of each type in order:
     form 1 `frq-u4-sticky-blocks-ramp`, `frq-u2-hill-crest`, `frq-u5-platform-inertia-lab`,
     `frq-u8-floating-coin`; form 2 `frq-u1-stopping-distance`, `frq-u2-ramp-slide`, `frq-u7-pendulum-g`,
     `frq-u6-two-turntables`. No question or FRQ in both. Every keyed number is recomputed in
     `EXAM_NUMBERS` and every exam-only item is graded through `ApPhysQuestions.grade` in the test.
   - **Justification trainer**: 33 prompts (`physics/data/justify/<unit>.json`, 4-5 per unit) on the
     reader-report misses: FBDs and third-law pairs, normal force on a ramp, net force vs motion, energy
     with the system named, momentum before energy in sticky collisions, friction as an internal force,
     torque with the axis chosen, rotational inertia from mass distribution, angular momentum vs kinetic
     energy, SHM period and energy, buoyancy with both forces, Bernoulli, and lab procedures/graphs.
     Skill tags are the physics `JUSTIFY_SKILLS` (forces, conservation, energy-momentum,
     functional-dependence, graphs, procedure, fluids); every number in a prompt is in `JUSTIFY_NUMBERS`.
   - **Equations sheet page** (`EQ` in `scripts/lib/apphys-entry.mjs`): all 53 equations, constants and
     conventions of the official sheet in nine groups of our own, each with what it is, when to use it,
     the topic that teaches it and the live trainers that practise it; "not on the sheet" adds the
     oscillator's greatest speed. A test lists the sheet's equations and fails if one goes missing.
   - **Score estimate**: 50 × MCQ/42 + 50 × FRQ/40; **estimated cut-offs 70/55/41/31**, fitted to the
     published 2025 and 2026 distributions (needs-author `score-cutoffs` has the method), labelled
     estimates, shared with the readiness band (test).
   - Cram kit: timed sets at the exam pace (85/42 min a question, was chemistry's 1.5), justification
     prompts on study days as well as weak-spot days, exam day n opens practice exam n.

11. (2026-10-13, launch) **Published, Premium not on sale**, as apchem decision 18.
   - All eight units and `skills-math` in `physics/data/published.json`; registry `status: 'beta'`; every
     generator rerun (course, courses, pricing, OG tags, sitemap, crumbs, Worker, tutor). Hub and 404 cards say
     "All 48 published topics" (`PHYS_ALL` in `build-pricing.mjs`). `sw.js` cache v75. Changelog entry.
     `onSale: false` stays, so Premium shows "coming soon" and locks nothing.
   - Owner's site fixes: the hub hero's course count is now generated from the registry by
     `build-pricing.mjs` ("Six courses", "See all six courses"), the hero lede and meta description name every
     course (no "AP" in the meta); the Premium rules and `terms.html#fixed-date` (now generated between
     `<!-- fixed-date:start/end -->`) name every pass that runs through a date (`DATED`). Also stale course
     lists on `search.html` (lede, meta, noscript links), a "Three courses" comment, and `sources.html` (new
     AP® Chemistry and AP® Physics 1 sections).
   - Publishing turned on the site checks for `physics/`: British spellings in data (cancelled, labelled,
     grey) and the "centre of mass" alias removed; two descriptions rewritten (`gravitational-force` notes
     opened "you met", `torque-balance` was 228 characters); a Unit 3 lesson prerequisite distractor said
     "momentum" before it is taught (now "speed"). `courseTitle` puts " | LevlPrep" back when cutting a long
     topic at a word frees the room (title-pattern; changes physics titles only). Home-page weight budget
     8.5 → 8.8 KB (hub card, FAQ pass and offers; measured 8.6).
   - Continuity pass (physics vs chemistry, every shared page type, 1280/360, light/dark, Playwright; practice
     answered on a set item and a numeric item, a practice exam started). Shared-layer gaps fixed, the
     same kind apchem decision 18 found: `assets/course/book.css` crumb spacing knew no `.phys-crumb`
     (notes, unit and learn pages), `assets/course/study.css` answer chips knew no `.phys-mark` (doubled
     chip), `assets/course/tool-studio.js` did not move `.phys-foot` into a trainer's About panel. Physics
     fixes: the home trainers band named one free trainer (now "The motion graphs and free-body diagrams
     trainers are free"); `premium.js` said "The first trainer of each unit" was free (now the three free
     trainers by name, plus the progress line every course has); the teachers page's example URL overflowed
     at 360 px (`<wbr>`); the free-body diagrams Explore pane gave its heading the id `fbx-h`, which its hatch
     `<pattern>` also used (check-console duplicate id; the heading is now `fbx-title`). Tests: `site-search`
     now expects `?course=physics` to pick the course.
12. (2026-10-20, `docs/frq-grader.md`) **AI FRQ grader, built and OFF.** "Grade my answer" beside the rubric self-score on each FRQ page (shared `assets/course/frq-grader.js`, Worker `/frq/grade`): Premium only, 10 a day, Claude then the Workers AI backup then the self-score, each point quoting the student's words. Self-scoring stays the default and is never removed; the grader is an estimate the student can overrule. Turned on only after its accuracy eval passes.

## 8. Open items for the owner

- **Launch checklist: done 2026-10-13.** Migration `2026-10f-apphys.sql` applied in Supabase (live function
  bodies checked identical apart from `apphys` first); Polar product "AP® Physics 1 Premium (through June 30,
  2027)" $25 one-time, id `49838969-bfd0-449a-a29f-afab5a5572d9`; `"phys-2027"` added to `POLAR_PRODUCTS` in the
  Cloudflare Worker settings; `onSale: false` removed from `COURSES.apphys`, `sw.js` cache v76. Merging this PR
  redeploys the Worker (`.github/workflows/deploy-worker.yml`) and puts AP® Physics 1 Premium on sale.
- Questions in `docs/apphys-needs-author.md` (CED exclusions for Units 3-8 and the scope calls that rest on
  them, Unit 7 names, practice weights, g policy, score cut-offs, which trainers are free, the equations
  sheet's geometry row).
- Optional: an AP® Physics 1 teacher to review the course (the Beta note stays until then).
