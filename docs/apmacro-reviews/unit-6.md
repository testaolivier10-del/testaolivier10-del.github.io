# Unit 6 review (topics 6.1-6.6, three FRQs)

Branch `claude/apmacro`, 2026-11-03. Independent accuracy check (not the author) of `balance-of-payments`,
`exchange-rates`, `foreign-exchange-market`, `fx-policy-changes`, `fx-net-exports`, `real-rates-financial-flows`
(lesson, notes, questions, glossary, figure entry each; 103 items, 12 stimulus sets), the six SVG figures, and
`frq-open-economy-long`, `frq-balance-payments-short`, `frq-forex-short`. Checked against the authoring guide,
`docs/apmacro-research/framework.md` (sections 3, 5, 7-9), the author's `self-f.md`, `needs-author` (`ced-text`,
`topic-skills`, `balanced-budget`, Author F entries) and standard introductory macroeconomics.

**CED:** not read for Unit 6. The PDF fetch returned text only through Topic 3.2 (the Course at a Glance confirms the
six topic titles, 10-13% weight, 5-7 class periods); a direct download was refused by the proxy (403). Unit 6
scope therefore still rests on the scoring guidelines and reader reports (`ced-text` stays open).

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| balance-of-payments | `mac-balance-of-payments-10` | A new country "Corland" whose balances were in arls (Arland's currency); breaks the one-name-set rule for Unit 6 | Belvia, 35 billion bels; key unchanged (a deficit of 35) |
| exchange-rates | `mac-exchange-rates-12` (key changed) | "Select all" with a single true option; option 3 was a mirror false statement | Option 3 now "A Belvian good with an unchanged bel price costs fewer arls" (true); key [0] -> [0, 3]; its why marked Right |
| fx-net-exports | `mac-fx-net-exports-15` | Option 3 "a travel agency that sells Arland holidays in Belvia" could be read as selling Arland holidays to Belvians (which the appreciation hurts), giving two defensible keys | "An Arland travel agency selling trips to Belvia to Arland residents"; why reworded; key unchanged (the winery) |
| real-rates-financial-flows | `mac-real-rates-financial-flows-17` | Arland's amounts in "billion dollars" (rule: Arland's amounts in arls) | 90 billion arls in stem and options |
| FRQ | `frq-forex-short` A, `key.alt` | Rubric line 2 credits "or both" shifts (relative price levels, per `f-one-curve-keys`), but `key.alt` held only the single supply shift, so a student drawing D right and S left got the shift point refused | Added alt `[D right, S left]`; the content check and my grader run pass all three sets |
| FRQ | `frq-balance-payments-short` C sample | "When Arland buys more goods, services, income and transfers" (one does not buy income) | "pays the rest of the world more for goods, services, income and transfers than it receives from it" |

Keys changed: `mac-exchange-rates-12` ([0] -> [0, 3]). No other key was wrong.

## Checked and fine

- **Numeric keys** (13 items) recomputed in a scratch script from the stems, then graded through
  `mac-calc.js` / `mac-grade.js` / `mac-questions.js` in the test harness: every key right, every authored mistake
  graded wrong. Trade balance -50, current account -60, CFA +60, foreign purchases 150; 0.4 arl per bel,
  187.5 arls, 200 and 160 arls, 90 bels; net exports 50 and change -70; 2,000 bels; real rate 4%. Single items
  with arithmetic (`exchange-rates-17` 400 arls, `real-rates-financial-flows-16` 3% vs 4%) and every figure's
  numbers (BoP -100 / +100; 1/1.25 = 0.80, 1/1.5 = 0.67, 40 euros = 50 then 60 dollars; 20 dollars = 16 / 18
  euros, 45 euros = 56.25 / 50 dollars) also checked. FRQ arithmetic: CA = 330 - 370 - 10 - 20 = -70, CFA +70,
  F = 140, part E +50. All four-function friendly.
- **Balance-of-payments signs:** every credit/debit and account placement correct (FDI factory, bonds, interest
  paid, remittances, tourism as services); CA + CFA = 0 in every item, figure, note and FRQ; the budget deficit
  vs trade deficit trap is a distractor, never taught wrong. The FRQ table's sign convention is stated.
- **Graph keys** (15 items, 3 FRQ parts) reasoned through and graded by `ApMacroGrade.graph` on
  `ApMacroGraph.keyResponse` for the key and every alt (all full credit); every key's reversed shift fails with
  the right slip. Forex axis ratio right every time, including both mirror-market items
  (`foreign-exchange-market-12`: price of the bel, arls per bel; `real-rates-financial-flows-11`). Demand from
  foreigners buying the country's goods and assets, supply from its own holders, in every item and note. Two-curve
  shift (`fx-policy-changes-11`) leaves quantity out. `key.alt` used where the exam accepts either shift
  (relative real rates, inflation abroad, government borrowing); actor-specific prompts (tourists, imports,
  income) key one curve.
- **Monetary policy:** every policy item names its framework and uses its tool (administered rates with ample
  reserves; bond purchases with limited reserves, `fx-policy-changes-15`); `fx-policy-changes-4` targets the
  reader-report slip. `fx-policy-changes-9` says only "raises its policy rate", which fits either framework.
- **Chains:** every "specific", order item, FRQ sample and note chain has each link (real rate, capital flow,
  demand for the currency, appreciation, net exports, AD, output). "Considering only the net exports effect" set
  where the SRAS input-cost channel could interfere.
- **Rendering:** all six figures and every graph stimulus and key state rendered to PNG (Playwright, Chromium)
  and inspected: axes and labels readable, no collisions that hide a label, values match the alt text.
- **Item quality:** four options on every single item, each explanation names the error; apply/analyze 15-18 of
  17-18 per topic; 8 items in two sets of 4 per topic; key the longest option 11-40% per topic (cap 40%); no
  released question reproduced; American spelling, no em dashes, "AP®" correct.
- **Scope:** `check-apmacro-map` clean (nothing used before taught); loanable funds (4.7) and AD-AS used only
  after they are taught; no PPI, no micro market structures.
- Checks: `check-apmacro-content --topic` ok for all six topics; full run 0 failing in Unit 6 and FRQs (one
  failure in Unit 4 `monetary-policy`, key-length balance, outside this scope); `check-apmacro-map` passes;
  `node --test scripts/test/apmacro-*.test.mjs` 147/147.

## Open (left for a person)

- `ced-text`: Unit 6 essential knowledge still unread (see above). Depends on it: `f-inflow-loanable-funds`
  (inflows shift SLF, `real-rates-financial-flows-10` and -18), `f-official-reserves`, `f-policy-real-rate`,
  `f-appreciation-costs`.
- Grader limit (shared `mac-grade.js`, not changed here): for an alt with two shifts, the alt's outcome is
  computed from one step each, so it includes the quantity axis as "same". A student who draws both shifts in
  `frq-forex-short` A with different sizes (D 2 steps, S 1) keeps the shift point but loses the outcome point. The
  fix is to drop an axis the alt's shifts leave indeterminate when scoring that alt.
- Near-duplicates, kept: `fx-policy-changes-9`, `real-rates-financial-flows-9` and `frq-open-economy-long` C
  all key demand for arls right (alt supply left) for higher relative real rates; -9 in 6.6 adds labeling. A
  person may want one of the two items turned to a different shifter.
- `frq-balance-payments-short` has its setup in `stimulus.text` and no `scenario`; it reads fine, but the
  authoring guide puts setups in `scenario`.
- `mac-exchange-rates-9`'s keyed explanation uses dollars and euros as the example in a graded item (teaching
  example only; the rule allows real currencies in teaching text).
