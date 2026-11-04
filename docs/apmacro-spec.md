# AP® Macroeconomics course: spec and status

The source of truth for LevlPrep's thirteenth course (published and live since 2026-11-03, decision 13). A fresh session reads this file, `CLAUDE.md`,
`docs/apmacro-research/framework.md` and `market.md`, not the chat history. When the plan changes, update this file
in the same commit. Open points for a person go in `docs/apmacro-needs-author.md`.

Course key `apmacro` (storage, analytics, registry, SQL). URL path `/macroeconomics/`. Pass `macro-2027`. Every new
browser global starts with `ApMacro`; question ids `mac-`; CSS classes `mac-`; files `mac-*.js`. Template: the AP®
Psychology course as it stands on main (the newest fork, carrying every shared page type: light channel redesign,
course covers, dashboards design F, video lessons, quick answers, "Make it specific" prompts, the AI FRQ grader hook,
the tools upgrade), with `ApMacroCalc` in place of `ApPsychStats` and a new `graph` item format.

## 1. Owner brief (2026-11-03), condensed

- Olivier asked to "plan and build the next course" and picked AP® Macroeconomics (recommended over AP® Human
  Geography, AP® US History and AP® CS Principles: about 176,000 takers in 2025, graph based so it plays to
  LevlPrep's interactive tools, answers checkable by code, low accuracy risk, and it sets up AP® Microeconomics
  later the way Calculus AB set up BC).
- Build it like the other courses: research, build everything, independent accuracy reviews, one PR the owner
  reviews before merging. Only stop him for what genuinely needs him (Polar, Worker setting, merge).
- Tools at the bar of the NREMT body map: interactive, visual where useful, professional illustration quality, simple
  on landing with detail revealed progressively, each tool full screen, easy to read on a phone.
- Every course feels the same (glossary, textbook with the plain/interactive toggle, practice, review with flagged
  questions only in Review, exams, flashcards tab, dashboard design F); own identity and cover art. **No score
  calculator, no readiness band, no Beta label**; the "not yet reviewed by an AP® Macroeconomics teacher" note stays.
- Premium pass one-time through 30 June 2027 at the AP® price ($25), founding discount as the other passes.

## 2. What the research says (details and URLs in `docs/apmacro-research/`, done 2026-11-03)

**Content.** No substantive change for 2026-27 (one wording fix in 2.7; PPI calculation excluded). 6 units, 42
topics: U1 Basic Economic Concepts (6, 5-10%), U2 Economic Indicators and the Business Cycle (7, 12-17%), U3
National Income and Price Determination (9, 17-27%), U4 Financial Sector (7, 18-23%), U5 Long-Run Consequences of
Stabilization Policies (7, 20-30%), U6 Open Economy (6, 10-13%). Graphing (skill category 4) is tested only on FRQs.

**Exam (Fri 7 May 2027, afternoon).** Hybrid digital. Section I: 60 MCQ in Bluebook, 70 min, 66% of the score.
Section II: 3 handwritten FRQs in 60 min including a 10-minute reading period, 33%: one long FRQ (10 points, half
the section) and two short (5 points each). Four-function calculator only, both sections.

**Scores.** 3+: 64.7% (2023), 65.2% (2024), 67.3% (2025), about 66% (2026); about 20% fives. Students earn roughly
35-45% of FRQ points.

**Where students lose points.** Ample-reserves monetary policy (wrong tool, money market instead of reserve market;
14-32% earn it); foreign exchange graphs (axis ratio flipped, wrong curve); balance of payments and real interest
rates to capital flows (12-28%); multiplier math (multiply instead of divide, wrong direction; 27-40%); long-run
self-adjustment without the cause and causal chains that skip steps (10-31%); natural vs cyclical unemployment,
inverting the deflator, the long-run Phillips curve (24-39%). Full list in `framework.md` section 7.

**Market.** No competitor grades a drawn macro graph (ReviewEcon self-check, UWorld no drawing, Fiveable unclear).
UWorld $149, Fiveable $79/yr, review books $23-26; free: Khan Academy, Jacob Clifford, ReviewEcon.

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, graph and formula page, unit practice
tests. Premium: unlimited practice, exams, every lesson, analytics, every trainer.

1. **Graph Studio (flagship).** All nine graphs students must draw, drawn and shifted by hand, graded point by point
   the way readers score them (labels, correct curve, direction, new equilibrium), the slip named.
2. **Ample reserves, finally explained.** The reserve market graph next to the money market, the Fed's tools in each
   framework, the most-missed FRQ point drilled until it sticks.
3. **Causal chains, step by step.** Policy → interest rate → investment → AD → output and price level, built link by
   link and graded, so no step gets skipped.
4. **Multiplier math made automatic.** Gap ÷ multiplier, direction first, spending vs tax vs money multipliers.
5. **Built for May 2027**: 60 MCQ in 70 min, one 10-point and two 5-point FRQs with rubrics and full-credit samples,
   two full timed practice exams.
6. **In CED order, nothing used before it is taught**, with a short "Graph skills you need" chapter (axes, slopes,
   reading a shift vs a movement along a curve) before Unit 1.

## 4. Continuity with the other courses

Built like AP® Psychology, so every shared page type matches. Same shared layer (`assets/`, Tool Studio, flagging,
XP, tutor, dashboard, covers), item formats, the "not yet reviewed" note, trademark rules. Every shared-layer fix goes
into the shared file, never a macro-only copy. Identity: own accent, icon, headline, cover art, ranks.

## 5. Build plan

One branch, `claude/apmacro`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/apmacro-research/framework.md`, `market.md`; this spec | **done 2026-11-03** |
| 0 | Fork AP® Psychology: runtime `macroeconomics/assets/` (`mac-*`), `ApMacroCalc`, `graph` item and FRQ part, generator, checks, tests, fixture, registration hidden, SQL migration; then CED and dependency maps, exam config, tool scaffolding, architecture, authoring guide, briefs, needs-author | **done 2026-11-03** (section 5b) |
| 1 | Content: lessons, notes, banks (with stimulus sets and `graph` items), FRQs, glossary, figures | |
| 2 | Trainers (section 6) | |
| 3 | Two practice exams, unit tests, "Make it specific" prompts, graph and formula page, cram kit | **built 2026-11-03** (section 5c, decision 11): two forms in the May 2027 format (60 standalone five-option MCQs in course order, U1 5, U2 9, U3 13, U4 12, U5 14, U6 7; 50 bank questions each with a fifth option in `data/exams/fifth.json` plus 10 exam-only; FRQs long, short, short on different units); 20 exam-only items (numbers in `EXAM_NUMBERS`, graphs in `EXAM_GRAPHS`); 64 "Make it specific" prompts (10 per unit, 4 in graph skills, every skill, a builder on each, numbers in `JUSTIFY_NUMBERS`); formula page 28 rows, 10 flagged easy to forget, 8 graphs (4 flagged) and the balance sheet; unit tests and cram kit tested on the real forms; open points under "Phase 3" in needs-author |
| 4 | Independent accuracy checks per unit group, tools and exams | |
| Launch | Publish, generators, continuity pass, "thirteen courses" wording, full CI with browser checks, PR | **done 2026-11-03** (decision 13, `docs/apmacro-reviews/launch.md`); PR opened by the lead |

### 5b. Phase 0 as built (2026-11-03)

- Runtime `macroeconomics/assets/` forked from AP® Psychology in one rename pass, then changed as listed in
  `docs/apmacro-architecture.md` ("Runtime differences"): `ApMacroCalc` (`mac-calc.js`: GDP, CPI, inflation, the
  deflator, real values, unemployment and participation rates, real interest rates, the spending, tax,
  balanced-budget and money multipliers, reserves, closing a gap, velocity, exchange rates) in place of
  `ApPsychStats`; study summaries, AAQ/EBQ, the 988 note, the myth and mental-health rules and the statistics
  plot kinds dropped; every shared layer hook kept.
- New item format `graph` and FRQ part type `graph` (architecture "Graphs"): `mac-graph.js` (`ApMacroGraph`: the
  nine graphs as a model, the spec checker, the SVG and the drag, touch and keyboard renderer) and
  `ApMacroGrade.graph` (one point per task: labels, shift, equilibrium, outcome, point; the slip named). FRQ
  graph parts drawn on the page, "Check my graph" ticking the `auto` rubric points.
- Exam config for May 2027 in `scripts/lib/apmacro-exams.mjs` and `pages/exams.js` (compared by a test): 60 MCQ
  in 70 min (66%); 3 FRQs in 60 min with a 10-minute reading period (33%), long 10 then two short 5; four-function
  calculator; Fri 2027-05-07 (`assets/exam-date.js`, `pages/cram.js`). `MCQ_OPTIONS` 4 and `EXAM_SETS` pending
  needs-author `mcq-options`, `mcq-sets`. No score calculator, band or Beta label; the "not yet reviewed" note kept.
- Map: `docs/apmacro-ced-map.json`, `docs/apmacro-dependency-map.json` (42 CED topics, 4 graph skills topics in
  `graph-skills` before Unit 1, 132 starting concepts, 18 FRQ themes per 5a), explained in `docs/apmacro-phase0.md`.
- Generator `scripts/build-apmacro.mjs`, checks `check-apmacro-map.mjs`, `check-apmacro-content.mjs` (graph specs
  the grader must score right, the reader-report slips, neutral language, no PPI calculation, no microeconomics),
  tests `scripts/test/apmacro-*.test.mjs` (calc and graph new), fixture `scripts/test/fixtures/apmacro-data/`
  (every item format, graph items of each task, a long and a short FRQ with graph parts).
- Eight trainer stubs (four files each), registered in `macroeconomics/data/pages.json`.
- Registration hidden, twinning every AP® Psychology point (`docs/apmacro-architecture.md`, "Registration"); SQL
  migration `scripts/sql/migrations/2026-11a-apmacro.sql` written, not applied. Identity provisional (section 9,
  needs-author `identity`): yellow-green, hue 88°, the widest gap left on the wheel.
- Docs: architecture, authoring guide, phase0, needs-author, briefs (`docs/apmacro-briefs/`: common briefs for
  content, tools and review; authors A-F, builders T1-T4).

### 5c. Phase 3 as built (2026-11-03)

- **Format decisions** (needs-author `mcq-options`, `mcq-sets`, resolved): five answer choices, (A) to (E): the CED
  effective fall 2026 prints every sample MCQ with five choices, and College Board's course changes page lists no
  cut to four for this course (it does for the two English courses). Section I questions stand alone: a graph,
  table or scenario belongs to one question (the CED samples), so no stimulus carries two questions in a form.
  `MCQ_OPTIONS` 5, `BANK_OPTIONS` 4, `EXAM_SETS` (per kind) and `EXAM_STIMULI` 8-22 a form, `EXAM_ONLY` 8-16
  (`scripts/lib/apmacro-exams.mjs`).
- **Forms** (`macroeconomics/data/exams/forms.json`): one question a block, in course order, by unit weight (5, 9,
  13, 12, 14, 7). The practice bank keeps four options; each of the 100 bank questions the forms use gets a fifth
  in `fifth.json` (option and why), merged by `examVersion` into `assets/exams/items.json`, which serves all 120
  questions with five options and explanations inline (`pages/exams.js` prefers it; a miss on a bank question still
  reaches Review). 20 exam-only items (`items.json`, `mac-exam-<form>-<nn>`, 13 stimuli: 5 data, 8 graph), keys
  recomputed in `EXAM_NUMBERS` (ApMacroCalc, distractors from the slips) and every graph read checked against
  `ApMacroGraph` in `EXAM_GRAPHS` (`checkGraphs`). Stimulus questions per form: 13 (data 5, graph 6, text 2) and
  19 (10, 6, 3). Section II: form 1 `frq-recession-long`, `frq-real-nominal-short`, `frq-forex-short`; form 2
  `frq-phillips-long`, `frq-money-multiplier-short`, `frq-ppc-trade-short`; no unit in two FRQs of a form.
- **Prompts** (`macroeconomics/data/justify/*.json`): 64, ten per unit and four in graph skills, every skill (graph 12,
  identify 18, calculate 15, chain 6, tool 4, currency 4, selfadjust 3, multiplier 2), a builder on each, first 3
  free, 20 with numbers in `JUSTIFY_NUMBERS`. `JUSTIFY_PER_CHAPTER` 8-12, graph skills 3-6.
- **Formula page** (`EQ`, `GRAPHS`, `BALANCE_SHEET` in `scripts/lib/apmacro-entry.mjs`): 28 rows in six groups
  (choices and trade, output and prices, unemployment, multipliers, banks and interest rates and money, exchange
  rates), every one an ApMacroCalc recipe with a worked line; 10 rows and 4 graphs (money, reserves, loanable
  funds, forex) flagged "Easy to forget" and listed at the top; the 8 graph kinds drawn plus the bank balance
  sheet. The balanced-budget multiplier was added as a 29th row on 2026-11-03 (decision 12), since the course
  teaches it; it goes with `mac-multipliers-12` if the CED leaves it out (needs-author `balanced-budget`).
- **Unit tests** never show a practice-exam question (`unitSample` skips them, filling with recall and then lesson
  check items), 12 per unit. Cram kit tested with the real topics, FRQs, prompts and forms.
- Content check: exam-only items are checked as five-option items; fifth options for repeats, absolutes, math,
  language and position words; the length tell and test-wise limits run on each form as served. Exams page: format
  text says five choices and standalone questions; sections apart, no composite, no band, no Beta label, the "not
  yet reviewed" note kept (tested). Walked in Chromium at 1280 light and 360 dark: start, graph MCQ 24, FRQ 1 part A
  graph (AD shifted, E2, labels), end, self-score, results.

### 5a. Authors and builders (Phase 1 and 2)

| Author | Topics | FRQs |
|---|---|---|
| A | "Graph skills you need" (4) and Unit 1 (6) | 2 short (PPC and trade, market shift) |
| B | Unit 2 (7) | 2 short (unemployment and indicators, real vs nominal) |
| C | Unit 3 (9) | 1 long, 2 short (multiplier, self-adjustment) |
| D | Unit 4 (7) | 2 long, 2 short (reserve market, money multiplier and money market) |
| E | Unit 5 (7) | 2 long, 2 short (Phillips curve, crowding out) |
| F | Unit 6 (6) | 1 long, 2 short (foreign exchange, balance of payments) |

18 FRQs: 6 long (10 points, multi-unit, each with at least one graph part) and 12 short (5 points). Two exams need
two long and four short. Builders: T1 `graph-studio`; T2 `reserves-lab`, `policy-chain`; T3 `multiplier-lab`,
`indicators-lab`, `ppc-trade`; T4 `adas-lab`, `forex-lab`.

## 6. Trainers (proposed)

Each has Explore and Test yourself (seeded drills, feedback naming the slip), as the other courses.

| Slug | Unit | What |
|---|---|---|
| `graph-studio` | 1-6 | Flagship. Draw, label and shift all nine graphs (PPC, supply and demand, AD-AS, money market, reserve market, loanable funds, short- and long-run Phillips curves, foreign exchange), graded per rubric point |
| `ppc-trade` | 1 | PPC shapes and shifts, opportunity cost, comparative advantage and terms of trade |
| `indicators-lab` | 2 | GDP by expenditure, CPI and inflation, the deflator, real vs nominal, unemployment types and rates |
| `multiplier-lab` | 3, 4 | Spending, tax and balanced-budget multipliers, closing a gap (divide, direction first), money multiplier |
| `adas-lab` | 3, 5 | Short-run shocks, long-run self-adjustment with the cause, linked to the Phillips curve |
| `reserves-lab` | 4 | Ample vs limited reserves: the reserve market and money market side by side, every Fed tool |
| `policy-chain` | 3-6 | Build the causal chain link by link for fiscal, monetary and open-economy shocks |
| `forex-lab` | 6 | Currency axes the right way round, demand and supply shifts, appreciation, net exports, capital flows |

Free (proposed, owner to confirm): `graph-studio` (Explore plus the PPC and supply-and-demand drills), `ppc-trade`,
`indicators-lab`.

## 7. How answers are graded

All grading is code. Choice items exact; numbers with `ApMacroCalc` recomputing every key; `graph` items by
comparing the end state (which curve, which direction, new equilibrium relative to old) with the key and naming the
slip; FRQs self-scored with one rubric line per point and full-credit samples, graph parts auto-checked where the
student draws in the page (the AI grader hook only when its eval passes).

## 8. Decisions log

1. (2026-11-03) **Fork AP® Psychology as it is on main**, keeping every shared page type.
2. (2026-11-03) **No "ap" in any served path.** Folder `/macroeconomics/`, files `mac-*.js`, ids `mac-`. Registry and
   storage key `apmacro`.
3. (2026-11-03) **Pass and price mirror the other AP® courses:** `macro-2027`, $25 one-time, through 30 June 2027,
   registered `onSale: false` until the owner checklist.
4. (2026-11-03) **Sources:** College Board CED, exam pages, scoring guidelines and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted.
5. (2026-11-03) **Exam format as researched** (section 2). Default exam date Fri 2027-05-07. Exam results show the
   two sections apart with their weights (66% and 33%); no composite, no band.
6. (2026-11-03) **Free tier (proposed, owner to confirm):** "Graph skills you need", Unit 1 and Unit 2 (Unit 1 alone
   is only 5-10% of the exam).
7. (2026-11-03) **Ample reserves is the framework taught**, as in the current CED; limited reserves taught alongside
   for the reserve requirement and money multiplier, always labeled.
8. (2026-11-03) **Topics 3.7-6.6 essential knowledge** comes from scoring guidelines, Chief Reader Reports and
   standard economics because the CED text could not be read past 3.6; logged in needs-author for a person to check.
9. (2026-11-03) **Phase 0 done, as built** (section 5b, `docs/apmacro-architecture.md`). Choices the spec left open:
   (a) graph items grade magnitude never, only the curve, its direction and the new equilibrium against the old
   (an indeterminate axis is left out of the key); E2 is graded where the student's own curves cross, so the
   equilibrium point follows from the student's shift as readers score consistency; (b) graphing skills 4.A-4.C
   are a topic focus but only graph items carry them; (c) set kinds `data`, `graph`, `text`; (d) "Make it
   specific" skills `chain`, `tool`, `graph`, `multiplier`, `selfadjust`, `currency`, `calculate`, `identify`;
   (e) the site shell budget went from 341 to 342 KB and the course shell is 83 KB (measured 81.5, the graph
   module included).
10. (2026-11-03) **Integration of the authors' and builders' work** (the integrator, for the lead; details in
   `docs/apmacro-architecture.md` and `docs/apmacro-needs-author.md`): (a) drills have a `graph` step kind and the
   reserves, AD-AS and forex labs use it; (b) a straight-line PPC (`linear`, `ends`); (c) `key.alt` used wherever
   the exam accepts either shift, with prompts worded as the exam words them; (d) FRQs have a text `scenario`
   before the parts; (e) `expected-inflation` is taught in 3.3 (`sras`); (f) one invented-country rule: graded
   content uses invented countries and currencies, each scenario set its own names; teaching text may use real
   currencies labeled illustrative; (g) renderer point names (E3, YF, uN), label placement and exported plot box,
   with the tools' local workarounds removed; (h) no business cycle graph kind for now; (i) the course shell
   budget is 89 KB (measured 87.1; mac-graph.js grew from 9.6 to 14.5 KB gzipped across the builders' and the
   integrator's work); (j) a checkpoint build had written the course over the site's own `index.html`,
   `search.html` and four other root pages: restored, and the generator refuses `--out` at the repository root.

11. (2026-11-03, Phase 3) **Exams, prompts and the formula page as built** (section 5c): five choices and
   standalone Section I questions from the fall 2026 CED; the bank stays at four options and the forms add a fifth
   per question rather than rewriting 456 reviewed items; exam-only items only where a unit's standalone bank
   questions ran out (Unit 5 most) and to put graph-reading questions in each form.

12. (2026-11-03, Phase 3 integration; details in needs-author `phase3-integration`) (a) an outcome axis two shifts
   leave to their sizes is never keyed or graded (`ApMacroGraph.indeterminate`), and a long run back to full
   employment pins output with `key.hold`; (b) the country rule clarified: dollars where no exchange rate is
   involved, invented currencies where currencies are compared, letter names generic; (c) shifted pairs labeled
   on their outer sides, E labels off the lines; (d) graph stimuli can mark the new equilibrium (`showEq`);
   (e) `limited-reserves` is taught in 4.4; (f) a key-position balance rule in the content check, with keys rotated
   to pass; (g) `economic-growth` is taught in 1.2 (pull-forward) with 5.6 as its main topic; (h) `mac-sras-1`
   rewritten to one key; (i) the formula page lists the balanced-budget multiplier. The course shell measures
   88.7 KB of its 89 KB budget.

13. (2026-11-03, launch) **Published and live, Premium not on sale.** main merged first (the calmer site, #126,
   applied to macro: grouped FRQ list, the Review line on weakest topics, "Explanation"). All seven chapters in
   `macroeconomics/data/published.json` (`graph-skills`, `unit-1`..`unit-6`: 46 topics, 764 bank questions),
   `status: 'live'` in `assets/courses.js`, every generator rerun (hub and 404 cards, premium page, sitemap, search,
   pricing, home facts, course homes), "thirteen courses" and "ten AP® Exams" wording, `sources.html` section,
   changelog entry, `robots.txt`, `sw.js` v106, the social card rendered, eight trainer covers. Identity: accent,
   headline and ranks kept; cover and icon redrawn as AD-AS with LRAS (supply and demand read as micro, and the old
   art ran under the long title); one-word long names scale on a phone (`mast-long`). Course home says "2027
   exam". `apmacro` in the FRQ grader's `FRQ_COURSES` (still shipped off). The AD and SRAS lessons' Check yourself
   lost their AD-AS graph items (they draw LRAS before 3.5; needs-author `adas-early-graphs`). `onSale: false`
   stays until the owner checklist below.

## 9. Open items for the owner

- Confirm the identity (decision 13: yellow-green accent `#355A0A`, the AD-AS cover and icon, headline "every graph,
  every shift.", ranks Scarcity Spotter to Macroeconomics Legend; needs-author `identity`), the free tier (decision
  6) and free trainers (section 6), now live.
- The rest is in `docs/apmacro-needs-author.md` (teacher questions, `ced-text`, `adas-early-graphs`).

**Launch checklist (owner), to put AP® Macroeconomics Premium on sale:**
- [ ] Apply migration `scripts/sql/migrations/2026-11a-apmacro.sql` in Supabase (adds `apmacro` to the three course
      checks and the six functions with a course list; it lists every course including `apprecalc` and
      `apcalcbc`; needs `2026-10o-apcalcbc.sql` applied first; check the live function bodies first, as before).
- [ ] Create the Polar product "AP® Macroeconomics Premium (through June 30, 2027)", one-time, at the AP® price
      ($25), and make sure the "Founding member" discount applies to it.
- [ ] Add `"macro-2027": "<id>"` to `POLAR_PRODUCTS` in the Cloudflare Worker (levlprep-ask) settings; the Worker
      code already knows the pass (`worker/src/premium.js`) and redeploys on merge.
- [ ] Remove `onSale: false` from `COURSES.apmacro` in `assets/premium.js`, bump `sw.js`, and grant owner access.
- [ ] Confirm the identity (accent, cover, icon, headline, ranks), the free tier ("Graph skills you need", Units 1
      and 2) and the three free trainers (Graph Studio, partly: Explore plus the PPC and supply-and-demand drills;
      PPC and trade; the indicators lab).
- [ ] Merge the PR (after the Worker line, if Premium goes on sale with the merge).
- [ ] Optional: an AP® Macroeconomics teacher reviews the course (the "not yet reviewed" note stays until then).
