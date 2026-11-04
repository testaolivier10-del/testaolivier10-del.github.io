# Unit 4 review (topics 4.1-4.7, four FRQs)

Branch `claude/apmacro`, main checkout, 2026-11-03. Independent accuracy check of author D's Unit 4, from the
reviewer's own knowledge of the course and a current introductory text, `docs/apmacro-research/framework.md`
(sections 3, 5, 7-9), the authoring guide (including the 2026-11-03 additions: FRQ `scenario`, `key.alt`, unique
invented countries) and `docs/apmacro-reviews/self-d.md`. Scope: `financial-assets`, `nominal-real-rates`,
`money-functions`, `banking-money-supply`, `money-market`, `monetary-policy`, `loanable-funds` (lesson, notes,
questions, glossary, figure entries; 129 items, 16 stimuli), the seven SVG figures, and `frq-ample-reserves-long`,
`frq-open-market-long`, `frq-money-multiplier-short`, `frq-money-market-short`.

**The CED could not be read.** WebFetch returned the PDF text only through Topic 3.2 (truncated); a direct
download was refused by the proxy (403); the Firecrawl PDF parser was out of credits. So Unit 4's essential
knowledge (including the 4.3 M1 wording) is checked against current Federal Reserve definitions, the scoring
guidelines and reader reports as summarized in framework.md, not against the CED text (needs-author `ced-text`).

## Changes

| Topic / file | Item / place | What was wrong | Fix |
|---|---|---|---|
| monetary-policy | `mac-monetary-policy-5` (stem and options rewritten, key position same) | Stem asked "which open market operation", but two of the four options (discount rate, reserve ratio) are not open market operations, so they could be ruled out without economics; and items 6 and 8 of the same set name the bond sale, giving the answer away | Now asks which operation and what it does to reserves: buy/adds, sell/adds, **sell/drains** (key), buy/drains; each explanation names the error. Discount rate and reserve ratio stay tested in items 18 and 19 |
| loanable-funds | `mac-loanable-funds-19` ("Make it specific") | Exam accepts government borrowing as DLF right or SLF left, but the frame graded "supply ... left" wrong on two slots while the authoring guide says to name the side when only one is keyed | Stem now asks for the demand side explicitly; the wrong-slot line says the exam accepts supply left when a question names no side |
| banking-money-supply | `mac-banking-money-supply-11` | A policy change (raising the reserve ratio) with no framework premise | Stem adds "Banks lend all of their excess reserves" (the binding-requirement premise). The term "limited reserves" cannot appear before 4.6 (the map check refuses it), so the premise is stated in words |
| frq-money-multiplier-short | new `scenario` | No setup and no framework premise for a money multiplier question | Scenario: a banking system where the reserve requirement limits lending, banks lend all excess reserves, borrowers keep no cash (again in words, for the map order) |
| FRQs | open-market C, E; money-multiplier C, E; money-market C | Prompts with no task verb ("What happens ...? Explain.") | Each now starts with or contains its bold verb (<b>Explain</b>, <b>Identify</b>), as the guide requires |
| nominal-real-rates | `mac-nominal-real-rates-12` mistakes | Two mistakes with the same value 2 (`sub(4, 2)` and `value: 2`), so the "you subtracted" feedback could never show | First mistake is now `sub(2, 4)` = -2 (subtracting inflation from the real rate) |
| nominal-real-rates | item 4 why (three places) | "keep up with expected inflation rate", "Here expected inflation rate cancels" (missing article) | "the expected inflation rate" |
| financial-assets | lesson hook | "a savings bond ... if they tried to sell it today, buyers would offer less": U.S. savings bonds cannot be resold | "a company bond" |
| money-functions | notes, "For your exam" | M1 given as currency plus checkable deposits only, while the same page (correctly) gives the current definition with other liquid deposits | Adds "(and other deposits you can withdraw at once)"; "retail" money market funds |
| key-length balance | `mac-financial-assets-13`, `mac-money-functions-12`, `mac-loanable-funds-17` | Keys longest by 28, 34 and 25 characters | Keys shortened, one distractor lengthened each; explanations kept (money-functions-12's now names the card issuer) |
| figures | `banking-money-supply-balance-sheet` | Titled "Quentar Savings Bank": Quentar is 4.2's scenario country (names are unique per set) | "An invented bank" (in `scripts/apmacro-figures/author-d.mjs`, regenerated) |
| figures | `loanable-funds-government-borrowing` | Rendered: the DLF2 label sat on its own curve | Label moved to the right of the curve's end (script and SVG) |

Keys changed: none. `mac-monetary-policy-5` keeps option 2 as the key (sell bonds), now "Sell government
bonds, which drains reserves".

## Checked and fine

- **Numeric keys (18), recomputed from the stems by my own script** (`rev-u4/recheck.mjs` in the scratchpad):
  bond yields 8% and 5%; real rates 6%, 1% (after the fact), 3%; nominal 6%; M1 800, M2 1,150; required reserves
  40,000, excess 10,000, one bank's loans 10,000, system 50,000; cash deposit excess 4,500 and system 45,000;
  multiplier 4; open market purchase from banks 100 million; public saving -100, national saving 300. All agree
  with the `from` recipes, every key grades right through `ApMacroQuestions.grade` (mac-calc, mac-grade,
  mac-questions in the vm harness) and every authored mistake grades wrong. FRQ numbers: Harbor Bank 100,000,
  50,000, 50,000, 250,000; Varne multiplier 10 and a 500 million decrease (bond sale to banks: reserves fall with no
  deposit change). Arithmetic four-function friendly throughout (ratios 0.1, 0.2, 0.25).
- **Graph keys (13 items, 4 FRQ parts)**: each `keyResponse` scores full marks in `ApMacroGrade.graph`, the reversed
  shift scores wrong, and my own reasoning agrees: recession MD left (i down, M same); MS right on a purchase; bond
  sale MS left (i up, M down); IORB up moves RD's flat part up (policy rate up, reserves same); reserves added in the
  ample range RS right (rate same, reserves up); savings incentive SLF right; investment optimism DLF right; points
  on MD, DLF, SLF in the right quadrant. `frq-ample-reserves-long` E(i) `key.alt` (SLF left) grades full, with the
  outcome read off the drawn curves. Indeterminate axes never keyed.
- **Ample vs limited reserves**: every 4.6 item and both long FRQs name the framework; ample items use administered
  rates (IORB, ON RRP) and the reserve market with supply in the flat part; limited items use open market
  operations, the discount rate, the reserve requirement, the money market and the multiplier. Notes and lesson
  state the current system correctly (IORB as the main tool, ON RRP as a floor, the federal funds rate just below
  IORB, reserve requirement zero since March 2020, open market operations to keep reserves ample) and label the
  limited framework as such. 4.4 frames itself as "the limited-reserves picture" in its notes.
- **M1/M2**: the notes and figure give the current Federal Reserve definition (savings deposits in M1 since May
  2020) and say older books differ; no item depends on where savings deposits go; M2 = M1 + small time deposits
  (under \$100,000) + retail money market funds. Cash deposited leaves M1 unchanged, everywhere.
- Real rate = nominal - expected inflation; unexpected inflation helps fixed-rate borrowers; deflation the reverse;
  bond prices opposite to rates with the chain; money demand slope (opportunity cost) vs shifters (price level,
  real GDP, payment technology); nominal on the money market, real on loanable funds; crowding out chain complete;
  monetary chain tool, policy rate, other rates, interest-sensitive spending, AD, output, price level, unemployment.
- FRQs: 10 and 5 points, one rubric line per point, a sample per part, the long ones each with graph parts; graph
  rubric lines `auto` where gradable. Scenarios in `scenario`; countries Ostra, Varne, Wren unique.
- Figures: all seven rendered in headless Chromium and inspected; rendered item and stimulus graphs (11) checked
  for axis labels and curve names (reserve market "Policy interest rate" / "Quantity of reserves", DR and SR).
- Item quality: 83-91% apply/analyze per topic; 44-58% in sets of 3-5; key longest at most 40% per topic (the
  content check); no near-duplicates found; no stem reads as a released question.
- Checks: `check-apmacro-content --topic` clean for all seven topics and the whole course run (764 items, 0
  failing); `check-apmacro-map --check` "Nothing is used before it is taught"; `node --test
  scripts/test/apmacro-*.test.mjs` 147/147.

## Open (left for a person)

- `ced-text` for Unit 4: the CED's 4.3-4.7 essential knowledge was not readable here (see above). In particular
  `d-m1-savings` (does the CED's 4.3 still put savings deposits in M2 only?) stays open; the course teaches the
  current definition and asks nothing that depends on it.
- `d-bond-yield`: two items compute a bond's yield (`mac-financial-assets-3`, `-15`); confirm in scope.
- `d-ample-tools`: the discount (primary credit) rate is taught only as a limited-reserves tool; confirm against
  the CED's 4.6.
- `d-lf-government`: both DLF right and SLF left are credited in the FRQ; confirm on current scoring guidelines.
- Framework wording before 4.6: the map refuses "limited reserves" in 4.4 and 4.5 items, so
  `mac-banking-money-supply-11`, `frq-money-multiplier-short` and the 4.5 money supply shift
  (`mac-money-market-10`) state the premise in words or rely on the topic's notes. A person may prefer to move the
  `limited-reserves` term to 4.4 so those items can say it.
