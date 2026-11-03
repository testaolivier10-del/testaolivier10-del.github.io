# AP® Macroeconomics course: spec and status

The source of truth for LevlPrep's thirteenth course. A fresh session reads this file, `CLAUDE.md`,
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
| 0 | Fork AP® Psychology: runtime `macroeconomics/assets/` (`mac-*`), `ApMacroCalc`, `graph` item and FRQ part, generator, checks, tests, fixture, registration hidden, SQL migration; then CED and dependency maps, exam config, tool scaffolding, architecture, authoring guide, briefs, needs-author | in progress |
| 1 | Content: lessons, notes, banks (with stimulus sets and `graph` items), FRQs, glossary, figures | |
| 2 | Trainers (section 6) | |
| 3 | Two practice exams, unit tests, "Make it specific" prompts, graph and formula page, cram kit | |
| 4 | Independent accuracy checks per unit group, tools and exams | |
| Launch | Publish, generators, continuity pass, "thirteen courses" wording, full CI with browser checks, PR | |

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

## 9. Open items for the owner

- Confirm the identity, the free tier (decision 6) and free trainers (section 6) once built.

**Launch checklist (owner), to put AP® Macroeconomics Premium on sale:** filled at launch.
