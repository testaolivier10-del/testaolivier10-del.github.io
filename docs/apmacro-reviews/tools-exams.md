# AP® Macroeconomics Phase 4 review: practice exams, "Make it specific", formula page, the eight tools

Reviewer: independent (tools-exams scope), 2026-11-03. Brief: `docs/apmacro-briefs/review-common.md`, spec decisions
11-12 and section 5c, with `docs/apprecalc-reviews/tools-exams.md` as the model.

## What was checked

- **Exam-only items**: all 20 (`macroeconomics/data/exams/items.json`) read with their 13 stimuli; every key reasoned
  through and every number recomputed by my own Python from the stems (not from `EXAM_NUMBERS`), including each
  distractor's stated slip: 1-01 5% (3%, 5.3%, 60%, 40%), 1-02 50 (800, 66.7), 1-05 250 (2,500, 750, 100), 1-09 2,130
  (2,150, 2,170, 1,870, 130), 2-01 5% (4.8%), 2-02 160 (200, 32), 2-05 3% (9, 5, 11, 2), 2-08 4 (0.25, 2, 2,500,
  1,500), 2-10 real rates 4% and 2%. Graph reads (AD-AS gaps, reserve market with ample reserves, SRPC shift, loanable
  funds, money market with limited reserves, PPC, forex) checked by my own reasoning about which curve moved and why;
  `checkGraphs` also passes.
- **Fifth options**: all 100 in `fifth.json`, each read beside its bank question, four options and key: wrong,
  plausible, explanation right.
- **Forms**: the blueprint by `checkForms` and the tests (60 MCQ in course order, units 5/9/13/12/14/7, 10 exam-only
  each, no repeats, no shared stimulus; FRQs long with graph parts then two short, no unit twice:
  `frq-recession-long` U3-4, `frq-real-nominal-short` U2, `frq-forex-short` U6; `frq-phillips-long` U3/U5,
  `frq-money-multiplier-short` U4, `frq-ppc-trade-short` U1). Exams page: sections apart, no composite, no score
  calculator, no band, no Beta label, the "not yet reviewed by an AP® Macroeconomics teacher" note present.
- **"Make it specific"**: all 64 prompts (prompt, checklist, earns, misses, every builder slot, option and note);
  every number recomputed (930, 5%, 66.7%, 108 and 8%, 1,200, 10 and 200, 30, 40, 5% and 2%, 9,000, 5, 10,400,
  0.25 and 25, slopes and opportunity costs).
- **Formula page**: all 29 `EQ` rows, the 10 "Easy to forget" flags, the 8 `GRAPHS` traps and the balance sheet.
- **Tools**: course built to a scratch folder (`APMACRO_PUBLISHED=<all chapters> build-apmacro --out <scratch>`),
  served locally, driven in Chromium with Playwright at 1280 light and 360 dark: landing of all eight, Test yourself
  of all eight, Explore actions (graph studio, reserves lab both frameworks and every tool kind, AD-AS shock then long
  run with the Phillips panel, multiplier gap and money views, indicators prices/real/jobs, forex change, policy
  chain open economy). No page errors (only blocked external requests); no horizontal scroll at 360. Drill
  transcripts generated from every model for every context and type (12 seeds for the reserves tool menu), every
  prompt, key, option explanation, slip message and worked solution read; all 62 graph-studio scenarios read.
  Keys cross-checked by hand (CPI 116.4/133.3 and 14.5%, real GDP 689.23 and 3.38%, labor force and rates with
  discouraged workers, multiplier 5/-4 and balanced budget, gap 180/9 = 20, OMO 1,000 deposit + 4,000 loans,
  comparative advantage from output and input data, forex inverse 0.8 and 125 sels).

## Keys changed

**None.** All 20 exam-only keys and all 64 prompts' keys are right; every fifth option is wrong.

## Changes

| Where | Old | New | Why |
|---|---|---|---|
| `scripts/lib/apmacro-exams.mjs` `examVersion` (+ `fifthAt`) | A bank question's fifth option always placed last, so (E) was the key only on exam-only items | The fifth goes in at `fifthAt(id)`, a fixed position from the id (all five used: form 1 fifths at 12/10/5/9/14, keys 16/8/12/14/10; form 2 keys 10/13/14/9/14); key and explanations move with their options | Known open point: a position tell in print and review. `keyPositionTell` passes on both forms; test updated to check alignment. |
| `fifth.json` `mac-gdp-limitations-16` | "One has a higher GDP per capita than the other" | "One's residents earn a higher average income from production" (why: GDP per capita is average income, so it would show) | Contradicted the stem; not plausible. |
| `fifth.json` `mac-financial-assets-12` why | "Only the central bank creates money this way" | Selling bonds creates no money; the company borrows existing money | Banks also create money; the old line misled. |
| `fifth.json` `mac-loanable-funds-8` why | "National saving is now 400 - 100 = 300" | "starts at 300, with the deficit subtracted" | "now" read as after the change. |
| `justify/unit-3.json` `u3-close-gap-spending` slot note | "four times too large in every round" | "Multiplying by 4 gives 480, sixteen times the change that closes the gap" | Wrong factor. |
| `data/tools/graph-studio.json` `money-discount` | "banks hold more and lend less" | "banks borrow fewer reserves and lend less" | Wrong mechanism. |
| `data/tools/graph-studio.json` `res-lower` slip | "The Federal Reserve lowers…" | "The central bank lowers…" | Scenario names a generic central bank. |
| `math/graph-studio.js`, `graph-studio.js` (3 places) | "Purchases of securities shifts…", "Higher incomes for a normal good is not on either axis" | "With purchases of securities, the supply of reserves shifts right"; "That change, …, is not on either axis" | Subject-verb errors from plural cause phrases. |
| `math/policy-chain.js` | Distractor notes: money demand "depends on … the interest rate"; "More government borrowing raises the real rate" shown when borrowing falls; "higher returns attract" when rates fall; "it is the demand for dollars that changes" | Direction-correct notes (money demand shifts with income and the price level; a change in borrowing moves the real rate; capital moves toward the higher real rate; supply of dollars moves the other way) | Explanations contradicted the scenario or the model. |
| `math/reserves-lab.js` | Solution "lower the iorb rate"; money demand "depends on … the interest rate" | "lower the IORB rate"; "shifts with the price level and real output (a change in the interest rate moves along it)" | Casing; movement vs shift. |
| `math/adas-lab.js` | "a inflationary gap" | "an inflationary gap" | Article. |
| `math/ppc-trade.js` | "1 shirts costs", "1 shoes", "one shirts", "gives up less shoes", "as more computers is made" | "1 unit of shirts", "1 unit of shoes", "fewer units of shoes", "as the economy makes more of it" (`amt` helper) | Grammar across count and mass nouns. |
| `reserves-lab.js` | With ample reserves the money market panel was captioned "the nominal interest rate" next to an MS shift; switching to limited reserves kept the IORB tool selected | Caption "follows the policy rate" with ample reserves; switching framework selects that framework's tool (IORB / bonds) | The course teaches the reserve market as the ample-reserves graph; the old view suggested drawing the money market. |
| `mac-tools.css` (drill graph steps) | On a phone the quiz fit left the stage 230-330 px for a 300 px graph plus its curve buttons: the axis and the buttons were hidden in the stage's scroll; at 1280 the drill graph was capped at 320 px in an 800 px stage | Graph steps keep a stage of min(450 px, 70svh) on phones (help line the step text repeats hidden); the graph scales to the stage up to 640 px wide | Phone usability and the full-screen bar (forex, AD-AS, reserves drills). |
| `mac-graph.js` | Point chip "E2: at 5, 5" (grid numbers) | "E2: where the curves cross" / "placed"; live region keeps the coordinates | Meaningless numbers on screen. |
| `fifth.json` about, `docs/apmacro-architecture.md` | "four options, then this one" | describes `fifthAt` | Docs follow the change. |

## Tools against the bar

All eight land on one picture with one cue, detail behind Why and Details, a full-screen button, linked views
(reserve/money/AD-AS chain, AD-AS with Phillips, two forex mirror markets, multiplier rounds with the balance sheet).
Economics of every Explore state looked at was right (tax cut: E2 then SRAS left to E3 at YF and a higher price
level, B then C on the Phillips curves; ample-reserves bond purchase leaves the policy rate; Europeans buying US goods:
euro 1.10 to 0.995, dollar 0.909 to 1.00). With the drill-stage fix the graph steps are usable at 360 px.

## Check results

- `node scripts/check-apmacro-content.mjs --check`: 46 topics, 764 items, 0 failing; exams 2 forms, 20 exam-only,
  64 prompts, 0 failing; tools 0 failing.
- `node scripts/check-apmacro-map.mjs --check`: nothing used before it is taught.
- `node --test scripts/test/apmacro-*.test.mjs`: 155 pass, 0 fail.
- `node scripts/build-apmacro.mjs --check`: 25 files checked, clean (no hidden page changed).

## Open points for a person

- Graded tool drills name real places and institutions (indicators GDP sort: Ohio, Texas, US GDP; multiplier and
  reserves drills: "the Federal Reserve", "since March 2020"; policy chain open economy: the US and the euro area;
  forex Explore: euros and dollars). Decision 10f/12b keeps graded content invented; these are tools rather than
  bank items, so I left them. Owner to decide.
- The money market panel in the reserves lab still shows MS moving with ample reserves (now captioned as following
  the policy rate). Whether to keep a money market in the ample view at all is a teaching choice for a teacher.
- The drill AD-AS graph labels the starting output "Y" (shared `ApMacroGraph`) where the labeling rule asks for YF at
  LRAS; Explore says YF. Left for the graph module owner.
- Could not read the CED PDF in this pass; scope from `docs/apmacro-research/framework.md`.
