# Unit 5 review (topics 5.1-5.7, four FRQs)

Branch `claude/apmacro`, 2026-11-03. Independent accuracy check of author E's Unit 5, from the reviewer's own
knowledge of introductory macroeconomics, `docs/apmacro-authoring-guide.md`, `docs/apmacro-research/framework.md`
(sections 3, 5, 7-9) and the sources named below. Scope: `policy-short-run`, `phillips-curve`,
`money-growth-inflation`, `deficits-debt`, `crowding-out`, `economic-growth`, `growth-policy` (lesson, notes,
questions, glossary, figure entries; 114 items, 15 stimuli), the eight figures from
`scripts/apmacro-figures/author-e.mjs`, and `frq-phillips-long`, `frq-deficit-long`, `frq-phillips-short`,
`frq-crowding-out-short`. Also the real-world facts in needs-author `e-real-facts`.

**CED.** The PDF could be read through WebFetch only up to Unit 3 (the Course at a Glance lists the Unit 5 topic
titles, POL/MOD/MEA tags and the 20-30% weighting; MOD-2.D.1 and MOD-2.E.1 in Unit 3 state the short-run trade-off
and no long-run trade-off). The Unit 5 essential knowledge was not readable (a direct download is blocked by the
proxy), so `ced-text` stays open for 5.1-5.7: the content was checked against the scoring-guideline knowledge in
framework.md and a standard text, not the CED wording.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| deficits-debt | stimulus `deficits-debt-s1`; `mac-deficits-debt-2` (key changed), `-3` (key changed), `-4`, `-5` | Brenna's table (1,000; 800/900, 850/920, 900/880, 820/960) was the notes worked example and the lesson figure number for number, and items 2-4 are the lesson's check items: the figure prints the item 3 answer (1,150) and the item 4 answer | New table: start 1,200; 760/850, 800/860, 880/850, 790/920. Item 2 key -70 to -60 (mistakes 60, 1,660); item 3 key 1,150 to 1,320 (mistakes 1,380, 1,050); item 4 explanations and item 5 stem (140 to 130) follow |
| economic-growth | `mac-economic-growth-11` | Grader marked "LRAS and SRAS both right" wrong, but Unit 3's `lras` notes teach that a lasting productivity rise shifts both | `key.alt` [[LRAS right, SRAS right]]; SRAS slip and why say both are accepted, SRAS alone is not |
| growth-policy | `mac-growth-policy-12` | Same: highways that "cut shipping times and costs" lower costs (SRAS) as well as raise capacity; SRAS shift was marked wrong | Same `key.alt`, slip and why |
| policy-short-run | `mac-policy-short-run-4`, `-12` | With ample reserves the policy rate follows the administered rates, so "the interest rate falls for sure" (item 4 option A) was arguably right for the policy rate; the indeterminate rate is the market (loan) rate | Stems and options say "loan rates" / "Interest rates on loans"; whys note the policy rate itself falls. Keys unchanged |
| policy-short-run | notes, "The policy mix" | Same ambiguity in the teaching paragraph | One sentence: with ample reserves read "the interest rate" as loan rates |
| policy-short-run | stimulus `policy-short-run-s2`, items 6-9, item 14 | "Country Z" and "Country Q" are used by other authors in Units 2-3 (rule: each set's names used by no other set) | Tolmar (s2, items 6-9), Ruskel (item 14); both unused elsewhere |
| crowding-out | `mac-crowding-out-5` why | Said the rate rose "from r1 to r2", but the stimulus graph (as the builder draws `show` stimuli) marks only the old r and no E2 | "the new crossing is higher: the real interest rate rose" |
| economic-growth | lesson hook, notes intro (`e-real-facts`) | "Several times" (output per hour) and "roughly three times" (real GDP per person) since 1960; the data give 3.75 and 3.7 | "about three and a half times" for both (sources below) |
| FRQ | `frq-phillips-long` D, rubric line 1 accept | Accepted "wages fall as the oil price shock fades", which credits the oil price falling back, not the self-adjustment mechanism | "wages fall because many workers are looking for jobs" |
| figures | `money-growth-inflation-longrun` | Rendered: the "Real GDP" axis name ran into the caption; the A label sat on the LRAS line | Figure 465 px high, caption moved down, A moved right (script and registry regenerated) |
| figures | `economic-growth-ppc-lras` | Rendered: "inside: idle resources" crossed the PPC1 curve | "idle resources", moved left inside the curve |

Keys changed: `mac-deficits-debt-2` (-70 to -60), `mac-deficits-debt-3` (1,150 to 1,320). Grading widened (no
key changed): `mac-economic-growth-11`, `mac-growth-policy-12` (an alt set). Reworded options, same key:
`mac-policy-short-run-4`, `-12`. No item deleted, no id changed. `author-e.mjs` was first confirmed to
regenerate all eight SVGs and the seven registry files byte for byte before editing.

## Numeric recheck (own code, then the runtime graders)

Scratch script `recheck.mjs` holds the reviewer's own value for each of the 14 numeric items, worked from the stem
(not from the `from` recipe), compares it with `ApMacroCalc.evaluate(from)`, then grades it and every authored
mistake through `mac-questions.js` in a vm (as `apmacro-questions.test.mjs` does). All 14 keys agree and grade
right; all 23 mistakes grade wrong and return their feedback. Values: gap 200 / 4 = 50; cyclical 6.5 - 5.0 = 1.5;
M x V 500 x 4 = 2,000; P = 2,200 / 2,000 = 1.1; inflation 10%; 40 + 0 - 2 = 38%; V = 16 / 2 = 8; budget
balance -60 (new); debt 1,320 (new); deficit 0.6 trillion; net AD (100 - 40) x 5 = 300; growth 10% and 5%
(per capita 20 to 21); 20,000 x 1.03 = 20,600. All four-function friendly (MPC 0.75, 0.8).

## Graph recheck

Scratch script `graphcheck.mjs` states, for each of the 17 graph items and 6 FRQ graph parts, which curve moves
which way, every shift set the exam would accept, and the outcome per axis, reasoned from the stem; then grades
`keyResponse` (full credit everywhere), each accepted set (credited), and each set with a direction flipped (not
credited). Before the fixes two accepted sets failed (LRAS with SRAS, items above); after, 23 of 23 pass.
Checked by reasoning: SRAS left for oil (FRQ long A), SRPC right for a supply shock or higher expected inflation
(LRPC still), AD as a movement along SRPC (points B up-left and down-right), LRPC left for a lower natural rate,
AD right then SRAS left with output "same" for a one-time money increase, DLF right or SLF left for borrowing
(and the mirror for a balanced budget), SLF right for more saving, PPC out, a recession point inside, AD right
for construction spending at full employment. Labels: Inflation rate / Unemployment rate, Real interest rate /
Quantity of loanable funds, Price level / Real GDP, LRAS and LRPC vertical; no indeterminate axis in any key.

All eight figures, both graph stimuli, and the start and key state of every graph item were rendered to PNG in
headless Chrome (Playwright) and inspected.

## Checked and fine

- Monetary policy: every item states its framework; ample-reserves items use the administered rate and the
  policy rate, limited-reserves items (Dren, Esk, the notes table) open market operations and the money market.
  No reserve requirement or multiplier in an ample-reserves question.
- Chains: monetary (tool, policy rate, loan rates, investment and durables, AD, output, price level,
  unemployment), tax (disposable income, consumption), crowding out (DLF, real rate, investment, capital stock,
  potential output), growth (capital and skills, productivity, LRAS and PPC, per capita). Self-adjustment always
  through nominal wages and SRAS (5.1 item 8, 5.2 item 11, FRQ long D), never AD.
- Multiplier: gap divided by the multiplier with the direction first (5.1 item 9, notes); multiplying is the named
  slip.
- Phillips curves: SRPC shifts only for supply shocks and expected inflation; LRPC at the natural rate; expected
  inflation where they cross; the Velor table's moves (1 to 2 along, 2 to 3 and 3 to 4 shifts) read correctly.
- Quantity theory: identity vs theory, velocity, the growth-rate form labeled "about", money neutrality in the long
  run and not in the short run; nominal rates rise with expected inflation.
- Deficits and debt: flow vs stock, a smaller deficit still raises the debt, interest is an outlay, automatic
  stabilizers widen the deficit; a budget deficit is never a trade deficit.
- Growth: recovery vs growth, per capita growth, capital goods today vs consumption; growth policy neutral on
  supply-side size ("remains debated").
- FRQs: 10 = 3+1+3+2+1 (both long), 5 = 3+1+1 (both short), one rubric line per point, a sample per part, a graph
  part in each long question, `scenario` text, task verbs bold; the loanable funds parts accept either shift.
- Item quality: 93-94% apply/analyze per topic; 43-70% of items in sets of 3-5; the key is strictly the longest
  in at most 2-4 of 8-11 single items per topic (36% or less); every distractor explanation names its error.
- Scope: `check-apmacro-map` reports nothing used before it is taught; no PPI calculation; no market structures;
  nothing reads as a released question. American spelling; no em dashes; "AP®" only as an adjective.
- Real-world facts (`e-real-facts`, now resolved): US real GDP per person 19,614 (1960 Q1) to 71,751 (2026 Q3),
  chained 2017 dollars (BEA via FRED, A939RX0Q048SBEA): 3.7 times. Nonfarm business output per hour, index 32.0
  to 120.0 (BLS via FRED, OPHNFB): 3.75 times. The 1960s inflation-unemployment trade-off and the 1970s oil-shock
  stagflation: CRS report RL34428 ("Understanding Stagflation"). Germany 1923 and Zimbabwe 2008 as hyperinflations
  financed by money creation: standard accounts (Hanke and Kwok, "On the Measurement of Zimbabwe's
  Hyperinflation", Cato Journal 29(2), 2009, for Zimbabwe).
- Checks after the changes: `check-apmacro-content --topic` clean for all seven topics; the full run 764 items,
  0 failing; `check-apmacro-map` passes; `node --test scripts/test/apmacro-*.test.mjs` 147/147.

## Open (for a person or the integrator)

- `ced-text` for Unit 5: the CED's 5.1-5.7 essential knowledge was not read; `e-quantity-theory-scope` (velocity
  arithmetic, the growth-rate form) and `e-growth-policy-scope` depend on it.
- `e-lrpc-shift-srpc`: item 13 lets only LRPC move. Many texts shift the SRPC with LRPC when the natural rate
  changes; left as is until a scoring guideline settles it.
- Policy mix with ample reserves (5.1 items 4, 12, notes): the course now reads the indeterminate rate as loan
  rates. If the exam's newer ample-reserves questions word the policy mix differently, align the wording.
- Builder: a graph stimulus with `show` is drawn with the old equilibrium only (no E2, no r2 or PL2), as in
  `policy-short-run-s2` and `crowding-out-s1`. Marking the new crossing would help any "after the shift" stimulus.
- Renderer: on AD-AS keys with an LRAS shift, the LRAS1, LRAS2 and SRAS labels crowd one another at the top
  (`mac-economic-growth-11`, `mac-growth-policy-12`); readable but cramped.
- Authoring guide: it lists "Sundra in 5.5", but Sundra is the 5.1 scenario (5.5 uses Garrow and Ferro).
