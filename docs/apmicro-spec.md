# AP® Microeconomics course: spec and status

The source of truth for LevlPrep's fourteenth course. A fresh session reads this file, `CLAUDE.md`,
`docs/apmicro-research/framework.md` and `market.md`, not the chat history. When the plan changes, update this file
in the same commit. Open points for a person go in `docs/apmicro-needs-author.md`.

Course key `apmicro` (storage, analytics, registry, SQL). URL path `/microeconomics/`. Pass `micro-2027`. Every new
browser global starts with `ApMicro`; question ids `mic-`; CSS classes `mic-`; files `mic-*.js`. Template: the AP®
Macroeconomics course as it stands on main (the newest fork, carrying every shared page type, the `graph` item and
FRQ graph parts), with `ApMicroCalc` in place of `ApMacroCalc` and the graph engine extended (section 5b).

## 1. Owner brief (2026-11-09), condensed

- Olivier asked to "plan and build 2 more courses, do everything from start to finish by yourself". The lead chose
  AP® Microeconomics (the course Macro was built to set up: same graph engine, code-checkable answers, low
  accuracy risk, 117,548 exams in 2025, up 13%) and AP® Human Geography (`docs/aphug-spec.md`, its own branch).
- Build it like the other courses: research, build everything, independent accuracy reviews, one PR. He asked for
  everything start to finish, and on Macro said "do everything then merge", so the lead also does the launch steps
  it can (migration, Polar product, Worker setting, merge) and stops him only where a sign in or a payment
  setting needs his hands.
- Standing rules from earlier courses all apply: tools at the bar of the NREMT body map (interactive, professional
  illustration quality, simple on landing, detail revealed progressively, full screen, easy to read on a phone);
  every visual legible with no crowded or overlapping words; every course feels the same with its own identity and
  cover art; **no score calculator, no readiness band, no Beta label**; the "not yet reviewed by an AP®
  Microeconomics teacher" note stays; every question is select then Check; the shared score card; the guided path
  (`docs/guided-path.md`); teacher classes cover every course.
- Premium pass one-time through 30 June 2027 at the AP® price ($25), founding discount as the other passes.

## 2. What the research says (details and URLs in `docs/apmicro-research/`, done 2026-11-09)

**Content.** No content change for 2026-27. 6 units, 36 topics: U1 Basic Economic Concepts (6, 12-15%), U2 Supply
and Demand (9, 20-25%), U3 Production, Cost, and the Perfect Competition Model (7, 22-25%), U4 Imperfect Competition
(5, 15-22%), U5 Factor Markets (4, 10-13%), U6 Market Failure and the Role of Government (5, 8-13%). Indifference
curves are out of scope (MU/P ratios are in); graphing quotas is out (their effect on quantities is in).

**Exam (Tue 4 May 2027, afternoon).** Hybrid digital, 2 h 10 min. Section I: 60 MCQ in Bluebook, 70 min, 66%.
Section II: 3 handwritten FRQs in 60 min including a 10-minute reading period, 33%: one long (10 points, half the
section) and two short (5 each). Four-function calculator, both sections.

**Scores.** 3+: 68.0% (2023), 67.6% (2024), 68.1% (2025). Students earn about 45-55% of FRQ points.

**Where students lose points.** Shading areas (cost of a subsidy 8%, deadweight loss after a subsidy 6%); marginal
cost from a table (9%); product demand to labor demand through MRP (11%); market vs efficient quantity with an
externality (11%); ATC with MC through its minimum (44-52%); the competitive firm's horizontal d = MR = AR = P
(47-49%); game theory: "no dominant strategy" needs both comparisons (43-46%), every Nash equilibrium (29-48%).

**Market.** No competitor grades a drawn graph, a shaded area or payoff-matrix reasoning. Fiveable $79/yr,
ReviewEcon free drills with self-check, review books about $26.

**Not verified** (logged in needs-author `ced-text`): CED text past Topic 3.3 (essential knowledge for 3.4-6.5 is
from scoring guidelines, Chief Reader Reports and standard economics); number of MCQ choices (treated as Macro:
five on the exam forms, four in the bank); whether the midpoint formula, the Gini coefficient and increasing- or
decreasing-cost industries are required (taught briefly, labeled, never keyed as the only route to an answer).

## 3. Positioning and what makes it better

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, graph and formula page, unit practice
tests. Premium: unlimited practice, exams, every lesson, analytics, every trainer.

1. **Graph Studio with areas (flagship).** Every graph students must draw, drawn by hand and graded point by point,
   plus the thing nobody else grades: tap to shade consumer surplus, producer surplus, tax revenue, subsidy cost,
   profit, loss and deadweight loss, with the slip named.
2. **Cost curves that behave.** MC through the minimum of ATC and AVC, built from a table, so the 9% point (marginal
   cost from a table) and the curve placement become automatic.
3. **Firm and market side by side.** Perfect competition short run to long run, monopoly, monopolistic competition:
   find Q where MR = MC, go up to demand for price, box the profit or loss.
4. **Game theory you can argue.** Payoff matrices with dominant strategies and every Nash equilibrium, and the
   written claim checked for both comparisons.
5. **Factor markets step by step.** MRP = MRC hiring from a table, product demand shifting labor demand, monopsony.
6. **Built for May 2027**: 60 MCQ in 70 min, one 10-point and two 5-point FRQs with rubrics and full-credit
   samples, two full timed practice exams.
7. **In CED order, nothing used before it is taught**, with the "Graph skills you need" chapter before Unit 1.

## 4. Continuity with the other courses

Built like AP® Macroeconomics, so every shared page type matches. Same shared layer (`assets/`, Tool Studio,
flagging, XP, tutor, dashboard, covers, path, score card, teacher classes), item formats, the "not yet reviewed"
note, trademark rules. Every shared-layer fix goes into the shared file, never a micro-only copy. Macro's build must
stay byte-identical: run `node scripts/build-apmacro.mjs --check` after any shared change. Identity: own accent
(a hue clear of the other fourteen, provisional until launch), icon, headline, cover art (a firm's cost curves or a
shaded surplus triangle, clearly not Macro's AD-AS), ranks.

**Overlap with Macro.** Micro 1.1, 1.3, 1.4, 2.1, 2.2 and 2.7 match Macro 1.1 to 1.6, and the graph skills chapter
is the same. These are written fresh for Micro as their own files (own ids, micro examples: a firm, a consumer, a
single market), using Macro's as a starting draft. Nothing is shared at build time: two courses a student may
take in different years should each stand alone, and only 6 of 36 topics overlap.

## 5. Build plan

One branch, `claude/apmicro`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/apmicro-research/framework.md`, `market.md`; this spec | **done 2026-11-09** |
| 0 | Fork AP® Macroeconomics: runtime `microeconomics/assets/` (`mic-*`), `ApMicroCalc`, graph engine extensions (5b), generator, checks, tests, fixture, registration hidden, SQL migration; CED and dependency maps, exam config, tool scaffolding, architecture, authoring guide, briefs, needs-author | **done 2026-11-09** (5b-as-built below; `docs/apmicro-architecture.md`) |
| 1 | Content: lessons, notes, banks (with stimulus sets and `graph` items), FRQs, glossary, figures | |
| 2 | Trainers (section 6) | |
| 3 | Two practice exams, unit tests, "Make it specific" prompts, graph and formula page, cram kit | **built 2026-11-09** (section 5c, decision 11): two forms in the May 2027 format (60 standalone five-option MCQs in course order, U1 8, U2 14, U3 14, U4 11, U5 7, U6 6; 50 bank questions each with a fifth option in `data/exams/fifth.json` plus 10 exam-only; FRQs long, short, short on different units); 20 exam-only items (numbers in `EXAM_NUMBERS`, graphs in `EXAM_GRAPHS`, payoff matrices in `EXAM_MATRICES`); 64 "Make it specific" prompts (10 per unit, 4 in graph skills, every skill, a builder on each, numbers in `JUSTIFY_NUMBERS`); formula page 29 rows, 11 flagged, 17 graphs (7 flagged) and the payoff matrix; unit tests and cram kit tested on the real forms; review `docs/apmicro-reviews/phase3.md`; open points under `phase3` in needs-author |
| 4 | Independent accuracy checks per unit group, tools and exams | |
| Launch | Publish, generators (paths included), continuity pass, "fourteen courses" wording (the live count in `assets/courses.js`), full CI with browser checks, PR, launch steps | **published and live 2026-11-10** (decision 12; log `docs/apmicro-reviews/launch.md`); Premium not on sale until the owner checklist (section 9) |

### 5a. Authors and builders (Phase 1 and 2)

| Author | Topics | FRQs |
|---|---|---|
| A | "Graph skills you need" (4) and Unit 1 (6) | 2 short (PPC and comparative advantage, marginal analysis and consumer choice) |
| B | Unit 2 (9) | 2 long, 3 short (elasticity, tax or subsidy with areas, price control or trade) |
| C | Unit 3 (7) | 1 long, 2 short (cost table, perfect competition long run) |
| D | Unit 4 (5) | 2 long, 2 short (game theory, monopolistic competition) |
| E | Unit 5 (4) and Unit 6 (5) | 1 long, 3 short (hiring table, monopsony, externality) |

18 FRQs: 6 long (10 points, multi-unit, each with at least one graph part) and 12 short (5 points). Target about
20 bank questions a topic. Builders: T1 `graph-studio`; T2 `cost-lab`, `firm-market`; T3 `surplus-lab`,
`elasticity-lab`; T4 `game-lab`, `factor-lab`, `externality-lab`.

### 5b. Graph engine extensions (Phase 0)

`mic-graph.js` starts as `mac-graph.js` and keeps its spec format, checker, renderer and grading contract. Added:
1. **Areas**: named regions (CS, PS, tax revenue, subsidy cost, DWL, profit, loss, total revenue) a student
   shades by tapping; key lists the region or regions; graded by region identity, never pixels.
2. **Curved curves**: U-shaped MC, ATC, AVC, AFC; downward MR below D; LRATC; MSB/MSC; Lorenz.
3. **Price and quantity lines**: horizontal (price ceiling, floor, world price, P = MR = d) and vertical marks.
4. **Two panels** side by side sharing a price axis (firm and market), stacking on a phone.
5. **New kinds**: `sd-micro` (controls, taxes, subsidies, tariffs with areas), `costs`, `pc` (firm and market),
   `monopoly`, `monocomp`, `labor` (competitive, with firm panel), `monopsony`, `externality`, `lorenz`.
6. **Payoff matrix** is not a graph: a separate item format `matrix` (`mic-matrix.js`): pick dominant strategies
   and every Nash cell; graded exactly.

### 5b-as-built (Phase 0, 2026-11-09)

- **Areas**: `areas(spec)` cuts each graph into cells; a region (`cs`, `ps`, `ts`, `dwl`, `tax-revenue`,
  `subsidy-cost`, `tariff-revenue`, `buyer-burden`, `seller-burden`, `profit`, `loss`, `tr`, `tc`, `wage-bill`,
  `ext-cost`, `ext-benefit`, `gini` and the `-before` regions) is a set of cells. Task `shade`, key `shade`: a name or
  a list. Graded on the exact cell set; an extra or missing cell is named. Tap a cell or use the "Area a" buttons.
- **Curves**: cost curves from one cubic total-cost model, so MC passes exactly through the minimum of AVC and ATC;
  followers move with their leader (MR with D, MFC with S_L, AVC with MC, AFC with ATC). A lump-sum fixed cost
  moves ATC alone; a per-unit cost moves MC and ATC.
- **Lines**: task `line` (key `{ to }`, `{ at }` or `{ side, of }`) for d = MR = AR = P, the wage line, price
  controls, world price, tariff, minimum wage, the regulated price. Policy lines are labeled on the price axis.
- **Panels**: `pc` and `labor` draw market and firm side by side, the price or wage carried across dashed; the
  panels wrap one above the other on a phone.
- **Kinds**: `ppc` (with `bow: 'in'`), `sd`, `sd-micro` (`policy`: ceiling, floor, tax, subsidy, world, tariff),
  `costs` (`set: short|long`, `afc`), `pc`, `monopoly` (`natural`), `monocomp` (`run`), `labor`, `monopsony`,
  `externality` (`ext.type`: neg-prod, pos-prod, pos-cons, neg-cons), `lorenz`. Named points for the `point` task
  (`profit-max`, `firm`, `min-atc`, `hire`, `efficient`, `fair-return` and others per kind).
- **Matrix**: `mic-matrix.js`, tasks `dominant`, `nash`, `best`, `joint`, optional payoff `change`; ties refused;
  slips named (largest single payoff, joint cell as Nash, one Nash only). Used as a bank item, lesson check, FRQ
  part (`type: 'matrix'`) and drill step (`kind: 'matrix'`).
- Course shell budget raised to 113 KB (`mic-graph.js` is about 27 KB gzipped); the formulas page to 24 KB.

### 5c. Phase 3 as built (2026-11-09)

- **Format**: as Macro's 5c. Five choices, (A) to (E), on the forms and four in the bank (needs-author `mcq-options`
  still open for Micro: not confirmed from the Micro CED); Section I questions stand alone, one stimulus to one
  question (`EXAM_SETS` data 2-12, graph 3-10, text 0-8; `EXAM_STIMULI` 8-22; `EXAM_ONLY` 8-16 a form,
  `scripts/lib/apmicro-exams.mjs`).
- **Forms** (`microeconomics/data/exams/forms.json`): one question a block, in course order, by unit weight (8, 14,
  14, 11, 7, 6). Each of the 100 bank questions the forms use gets a fifth option in `fifth.json` (option and why),
  merged by `examVersion` into `assets/exams/items.json`, which serves all 120 questions with five options and the
  explanations inline. No lesson check item, no stimulus twice, no question in both forms. The `EXAM_STIMULI` cap of
  22 is what forced standalone bank questions over set questions in Units 1 and 2 (bank stimulus questions per form:
  10 and 9).
- **Exam-only items** (`items.json`, `mic-exam-<form>-<nn>`, 10 a form: U2 2, U3 3, U4 3, U5 1, U6 1, where Units 3
  to 6 run short of standalone questions, and to put graph and matrix reads in each form): 20 stimuli (11 data,
  7 graph, 2 payoff matrices as text stimuli). Keys at (A) to (E) four times each. Every numeric key and its named
  distractors recomputed in `EXAM_NUMBERS` (11 items, ApMicroCalc); every graph read in `EXAM_GRAPHS` (7: the
  lettered cells of each region an option names, and named points compared, e.g. the fair-return quantity between
  MR = MC and P = MC); every matrix read in `EXAM_MATRICES` (2: dominant strategies, every Nash cell, the
  joint-payoff cell; `checkMatrices`, new). Stimulus questions per form: 20 (data 7, graph 9, text 4) and 19
  (10, 6, 3); graph-reading questions 9 and 6, payoff matrix 1 each.
- **Section II**: form 1 `frq-perfect-competition-long` (U2, U3), `frq-game-theory-short` (U4),
  `frq-externality-short` (U6); form 2 `frq-labor-market-long` (U3, U5), `frq-price-control-short` (U2),
  `frq-ppc-trade-short` (U1). Long questions carry graph parts.
- **Prompts** (`microeconomics/data/justify/*.json`): 64, ten per unit and four in graph skills; skills graph 13,
  calculate 15, identify 9, marginal 6, area 5, compare 4, efficiency 4, longrun 3, derived 3, price 2; a builder on
  each; the first 3 in course order free; 29 with numbers or matrix claims in `JUSTIFY_NUMBERS`.
- **Formula page** (`EQ`, `GRAPHS`, `MATRIX_CARD` in `scripts/lib/apmicro-entry.mjs`): 29 rows in five groups
  (choices and trade 2, elasticity and revenue 7, surplus, taxes and trade 7, production, costs and profit 9,
  factor markets 4), each an ApMicroCalc recipe with a worked line; 11 rows and 7 graphs flagged "Easy to forget"
  and listed at the top; 17 graphs drawn by the engine and the payoff matrix. Phase 3 added price elasticity of
  supply, producer surplus, average product, total cost and marginal revenue (flagged).
- **Unit tests** never show a practice-exam question (`unitSample`), 12 per unit. Cram kit tested with the real
  topics, 18 FRQs, prompts and forms. Content check: exam-only items as five-option items, fifth options for
  repeats, absolutes, math, language and position words, the length tell, key position and test-wise limits per
  form as served, graph, matrix and number recomputation.
- Walked in Chromium at 1280 light and 360 dark (form 1 whole, form 2 at 1280): start, graph MCQ 21 (ceiling, areas
  lettered), matrix MCQ 47, FRQ 1 part A graph, end, self-score, results on the shared score card with Section I
  (30/60) and Section II (self score) apart; no console errors from the pages (only the analytics call the sandbox
  blocks), no horizontal overflow. Matrix strategy names kept short (Ads, No ads) so the row headers do not break
  inside a word at 360.

## 6. Trainers

Each has Explore and Test yourself (seeded drills, feedback naming the slip), as the other courses.

| Slug | Unit | What |
|---|---|---|
| `graph-studio` | 1-6 | Flagship. Draw, label, shift and shade every required graph, graded per rubric point |
| `elasticity-lab` | 2 | Price, income and cross elasticity, the total revenue test, elastic vs inelastic ranges on a demand curve |
| `surplus-lab` | 2, 6 | Controls, taxes, subsidies and tariffs: shade CS, PS, revenue, cost and DWL and compute each area |
| `cost-lab` | 3 | Fill a cost table (MC, AFC, AVC, ATC, MP), watch the curves draw, MC through the minimums |
| `firm-market` | 3, 4 | Perfect competition short run to long run, monopoly, monopolistic competition: Q, P, profit box |
| `game-lab` | 4 | Payoff matrices: dominant strategies, Nash equilibria, the two-comparison argument |
| `factor-lab` | 5 | MRP = MRC hiring from a table, derived demand, least-cost rule, monopsony |
| `externality-lab` | 6 | MSB and MSC, market vs efficient quantity, DWL, the corrective tax or subsidy, public goods |

Free: `graph-studio` (Explore plus the PPC and supply-and-demand drills), `elasticity-lab`, `game-lab`.

## 7. How answers are graded

All grading is code. Choice items exact; numbers with `ApMicroCalc` recomputing every key; `graph` items by end
state (curve, direction, equilibrium, shaded regions) against the key, the slip named; `matrix` items exact; FRQs
self-scored with one rubric line per point and full-credit samples, graph parts auto-checked where drawn in the
page (the AI grader hook only when its eval passes).

## 8. Decisions log

1. (2026-11-09) **Fork AP® Macroeconomics as it is on main**; a standalone course, not an overlay (section 4).
2. (2026-11-09) **No "ap" in any served path.** Folder `/microeconomics/`, files `mic-*.js`, ids `mic-`. Registry
   and storage key `apmicro`.
3. (2026-11-09) **Pass and price mirror the other AP® courses:** `micro-2027`, $25 one-time, through 30 June 2027,
   registered `onSale: false` until the launch steps.
4. (2026-11-09) **Sources:** College Board CED, exam pages, scoring guidelines and Chief Reader Reports for scope and
   common errors only, in our own words. No released exam questions reproduced or adapted.
5. (2026-11-09) **Exam format as researched** (section 2). Default exam date Tue 2027-05-04. Results show the two
   sections apart with their weights; no composite, no band. Five choices on exam forms, four in the bank, as Macro.
6. (2026-11-09) **Free tier:** "Graph skills you need", Unit 1 and Unit 2 topics 2.1 to 2.4 as lessons (notes are
   always free), following Macro's shape (early units free).
7. (2026-11-09) **Invented firms, goods and countries** in graded content, as Macro's rule; dollars throughout.
8. (2026-11-09, integration) **General cost words early.** Total cost is taught in 1.5 and marginal cost (MC) in
   1.6, both in full in 3.2 (pull-forward `general-cost-words`); "technology" is an everyday word; the lump-sum tax
   is taught in 3.2 with the ATC-only shift; productive efficiency has its PPC sense in 1.3 and its minimum-ATC sense
   in 3.7. A concept's glossary definition comes from the file of the topic that teaches it. The mark "AP®" is not
   the average-product alias. Details: `docs/apmicro-reviews/integration.md`.
9. (2026-11-09, integration) **FRQ ordering stays as Macro's:** an FRQ unlocks with the latest topic it lists; a
   Unit 2 FRQ says "competitive: many buyers and sellers, each too small to set the price", never "perfectly
   competitive" (3.7).
10. (2026-11-09, integration) **Engine additions** (`mic-graph.js`): a per-unit cost lifts ATC with MC; areas follow
   the curves as shown (`start`, `show`); a regulated monopoly price has its own regions; the `demand` kind;
   `slopes` on sd and sd-micro for incidence; `showLabel`, `pointMarks`, `curveN0`, `followerOld`; shutdown below
   minimum AVC; starting shifts up to 3 steps; label placement with axis marks spread. Select-all items with one
   key: 11 of 35 (rule: at least 20%).
11. (2026-11-09, Phase 3) **Exams, prompts and the formula page as built** (section 5c), Macro's decision 11 for
   Micro: five choices on the forms and standalone Section I questions; the bank stays at four options and the forms
   add a fifth per question; exam-only items where Units 3 to 6 run short of standalone questions and to put graph
   reads and a payoff matrix in each form; payoff-matrix reads checked by `ApMicroMatrix` (`EXAM_MATRICES`) as graph
   reads are by the engine.
12. (2026-11-10, launch) **Published and live, Premium not on sale.** main had not moved since the fork (nothing to
   merge). All seven chapters in `microeconomics/data/published.json` (40 topics, 726 bank questions), `status:
   'live'`, every generator rerun, "fourteen courses" and "eleven AP® Exams" wording, `sources.html` section,
   changelog entry, `robots.txt`, `sw.js` v119, the social card rendered, eight trainer covers kept. Review points
   closed first: graph words sized up under 320 px (`data-fit`), measured label and mark widths in `mic-graph.js`,
   faded curves unlabeled on the cost lab's phone stage (`oldLabels: false`), payoff matrix `unitLabel` with a content
   rule, tool names as the covers, natural wording restored, 5.1 labor graphs read S = W (`mfc: false`), ten author
   figures relabeled. Identity kept; the cover's profit box filled solid so it reads apart from Calculus AB's.
   `apmicro` in the teacher class `ORDER` and the FRQ grader's `FRQ_COURSES` (still shipped off). Course shell budget
   119 KB. `onSale: false` stays until the owner checklist below.

## 9. Open items for the owner

- Confirm the identity (decision 12: raspberry accent `#7E1A5E`, the cost-curve cover with the filled profit box and
  its icon, headline "every curve, every area.", ranks from Margin Thinker; needs-author `identity`), the free tier
  (decision 6) and the three free trainers (section 6), now live.
- The rest is in `docs/apmicro-needs-author.md` (teacher questions, `ced-text`, `mcq-options`, `launch`).

**Launch checklist (owner), to put AP® Microeconomics Premium on sale (as Macro's):**
- [ ] Apply `scripts/sql/migrations/2026-11i-apmicro.sql` in Supabase (adds `apmicro` to the three course checks, the
      Premium functions, the teacher class checks and `free_usage_course_ok`; check first that the live function
      bodies match the migrations before it), then grant owner access.
- [ ] Create the Polar product "AP® Microeconomics Premium (through June 30, 2027)", one-time, $25 (the AP® price),
      with the Founding member discount (it has no product list, so it covers every product).
- [ ] Add `"micro-2027": "<product id>"` to `POLAR_PRODUCTS` in the Cloudflare Worker levlprep-ask settings
      (`keep_vars = true` keeps it on the merge deploy).
- [ ] Remove `onSale: false` from `COURSES.apmicro` in `assets/premium.js` and bump `sw.js`.
- [ ] Merge the PR (the lead opens it).
- [ ] Optional: an AP® Microeconomics teacher reviews the course (the "not yet reviewed" note stays until then).
