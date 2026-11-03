# Review: "Graph skills you need" and Units 1-2 (17 topics, four FRQs)

Branch `claude/apmacro`, 2026-11-03. Independent accuracy check (brief `docs/apmacro-briefs/review-common.md`) from
the reviewer's own knowledge, the CED, `docs/apmacro-research/framework.md` and the authoring guide as updated
(FRQ `scenario`, `key.alt`, `linear` PPCs, one set of invented names per scenario set). Scope: `axes-points`,
`slopes-curves`, `shifts-movements`, `curves-crossing`, `scarcity`, `opportunity-cost-ppc`,
`comparative-advantage`, `demand`, `supply`, `market-equilibrium`, `gdp-circular-flow`, `gdp-limitations`,
`unemployment`, `price-indices-inflation`, `inflation-costs`, `real-nominal-gdp`, `business-cycles` (lesson,
notes, questions, glossary, figure entries: 268 items, 40 stimuli: 4 graph, 20 data (one a line plot), 16 text), the 19
figures, and `frq-ppc-trade-short`, `frq-market-shift-short`, `frq-unemployment-short`,
`frq-real-nominal-short`. Scratch work: `/tmp/claude-0/-home-claude/69a45db0-8636-5086-8846-ed8350018c47/scratchpad/rev-u02/`
(`nums.mjs`, `graphs.mjs`, `stats.mjs`, `render.mjs`).

**CED.** Read through WebFetch text extraction (Units 1-2 readable). Confirmed: demand shifters "such as" income
(1.4), supply shifters "such as" input prices (1.5), the law of supply as a positive price-quantity relationship with
no marginal cost language (1.5), "economic growth results in an outward shift of the PPC" (1.2), real GDP at
base-year prices can overstate growth so agencies use other methods (2.6), the unemployment rate understates
joblessness by leaving out discouraged and part-time workers (2.3), the output gap and potential (full-employment)
output (2.7, which does not tie the cycle to the PPC), and the only Unit 1-2 exclusion, the PPI calculation (2.4).
The CED's graph appendix was not read (needs-author `graph-labels`).

## Keys changed

None. Every key in scope was right.

## Changes

| Topic / file | Item | What was wrong | Fix |
|---|---|---|---|
| All seven Unit 2 banks | 78 `single` and 7 `multi` items | Every Unit 2 single item had its key as option 0 (78 of 78). The runtime shuffles, but the static and no-JavaScript page (`questionHtml`) and any print view show authored order, so "pick the first" scored 100% | Options and their explanations rotated in step so key positions run 0, 1, 2, 3 in turn (now 23/20/18/17 across the four places); keys unchanged in content, ids unchanged |
| curves-crossing | `mac-curves-crossing-8` mistake | The 30 slip ("the gap at \$15 plus another row") matched no real reasoning | Replaced with 80, "that is the number buyers want" |
| curves-crossing | items 3, 10 | Key the longest option by far (81 vs 36; 100 vs 63 characters) | Key shortened, distractors lengthened; same meaning |
| market-equilibrium | items 15, 16 | Key 51 characters against distractors of 8 ("It rises"); 79 vs 38 | Distractors given reasons, key 16 reworded ("The relative sizes of the demand and supply shifts") |
| comparative-advantage | items 8, 10, 11 | Key 81-103 characters against distractors of 27-65 | Balanced; same answers |
| comparative-advantage | whole set s1, items 1-5, 15 | "Corvia" is also a country in the `ppc-trade` tool's drills (one name, two sets) | Renamed Marnovia (unused anywhere) |
| frq-ppc-trade-short | part A, scenario | Part A drew the PPC of one Kestria worker, then asked for U "when some of its workers are unemployed", which one worker cannot show; the FRQ had no `scenario` | U is now the worker's output "on a day when the worker is idle for part of the day" (prompt and sample); a plain-text scenario added |
| frq-unemployment-short, frq-real-nominal-short | scenario | No `scenario` (the new field) | One plain sentence each, no task verbs |
| notes axes-points | "Coming up" box | "You will draw nine graphs" and then listed eight | "eight kinds of graph ... (plus one table, a bank's balance sheet)" |
| notes unemployment | natural rate section | Text said "actual = natural + cyclical" and the formula under it showed only cyclical = actual - natural | Formula shows both |
| figure `axes-points-plane` (generator `author-a.mjs` and SVG) | in-figure caption | "read across to the horizontal axis, up to the vertical axis" is backwards (the lesson caption and notes say down to the horizontal, across to the vertical) | Corrected |
| figure `market-equilibrium-shortage` | data | Drew lemonade with Qd 70, Qs 40 at \$2, while the lesson caption, notes and set s1 beside it use the cocoa schedule (75 and 45; equilibrium 60 cups at \$3) | Redrawn as cocoa, 75 and 45, Q* = 60; alt text and description updated |
| figure `opportunity-cost-ppc-points` | labels | PPC2's label sat on point Z and PPC1's on the curve and the growth arrow | Both labels moved clear |

## Numeric and graph recheck

- **Numbers.** All 44 numeric keys recomputed in code from the stems (`nums.mjs`, written from the questions, not
  from the `from` recipes), then graded through `mac-calc.js`, `mac-grade.js` and `mac-questions.js` in a vm: 44 of
  44 keys right and accepted; all 77 authored mistakes graded wrong with their own explanation shown. Examples:
  GDP 930 (not 1,130 with imports added or 1,020 with transfers); value added 180; unemployment 6.25% (4% and
  6.67% slips), participation 64%, discouraged workers counted 12/162 = 7.4%; CPI 110, inflation 10% then 10% on
  a larger base; real wage 25; Maya's repayment 10,000 in borrowing-day prices; real GDP 440, deflator 125, real
  growth 10% (nominal 37.5%); Halvet 750 and 20%; per capita 20,000 (not 20); opportunity costs 0.4, 3, 3 (input
  data), gain per hat 0.5; output gap -5; cyclical 2.5%. FRQs by hand: 5%, 60%, 4/118 = 3.4%, 3%; 480, 25%,
  120, deflation 4%; 2 bushels, Kestria corn (1/3 vs 1/2 bolt), 2.5 between 2 and 3; shortage 150. All four-function.
- **Graphs.** 34 graph items and 2 FRQ graph parts: `ApMacroGraph.check` clean, the key scored 1 by
  `ApMacroGrade.graph`, the flipped direction rejected, the other movable curve alone rejected with a slip
  (`graphs.mjs`); point keys accept only the right region or the right side of the right curve. My own reasoning
  agrees with every key (income and tastes shift D; inputs, technology, taxes and subsidies shift S; a
  complement's price rise lowers demand; expected lower prices lower today's demand; expected higher prices lower
  today's supply; the two-shift laptop item leaves price out of `outcome`; recession and cyclical unemployment
  inside the PPC, a larger labor force shifts it out). No item in scope needs `key.alt` (each names one actor).
- **Rendering.** All 19 figures, the four graph stimuli, the starting state of the graph items and both FRQ graph
  parts (start and key) rendered to PNG in headless Chrome and looked at; fixes in the table above. Remaining small
  blemishes left as they are: the circular flow's "land, labor, capital, entrepreneurship" runs to the edge of its
  box; J and K labels touch their arrows in the demand figure.

## Checked and fine

- Economics: scarcity vs shortage, capital is not money, the three questions and three systems; opportunity cost
  as the next-best alternative only; output vs input methods both ways; terms of trade between the costs;
  shift vs movement and the quantity-demanded wording throughout; equilibrium, shortage and surplus arithmetic and
  direction; the two-shift indeterminacy. GDP word by word, transfers and used goods and stocks left out,
  inventories in I, imports cancel against C; GDP limits with the direction of each bias; labor force rules,
  discouraged and underemployed workers, natural = frictional + structural, actual = natural + cyclical, a negative
  cyclical rate in a boom; CPI from a basket, base 100, inflation on the old index, disinflation vs deflation,
  substitution, quality and new-goods bias, no PPI calculation; unanticipated inflation and fixed-rate
  borrowers, lenders, savers (the bank as borrower), indexed incomes, menu and shoe-leather costs; real GDP by
  dividing by the deflator, the deflator as an index not a percent; contraction and expansion as the phases,
  peak and trough as turning points (the 2026 CED correction).
- Graph labeling: Price and Quantity, goods by name on the PPC, subscripts and arrows in figures and samples.
- Item quality: one defensible key everywhere; distractor explanations name the error by content; 81-95%
  apply/analyze per topic; 25-69% in sets (the four skill topics are exempt from 40%); key the longest option 33% of
  single items overall (most remaining cases are ties of equal length); no near-duplicates found; FRQs 5 points,
  one rubric line per point, a sample per part, "calculate" samples show work.
- Scope and originality: `check-apmacro-map.mjs --check` nothing used before taught; no microeconomics market
  structures; scenarios and numbers do not follow any released question I know. Neutral language.
- Checks after the fixes: `check-apmacro-content.mjs --topic` clean for every topic touched; the full run 0
  failing for topics, bank and FRQs (its `--check` exam failures are the exam builder's work in progress, not this
  scope); `node --test scripts/test/apmacro-*.test.mjs` 146 of 147 before the exam builder's fixture change (the
  failing `apmacro-exams` test is about `data/exams/fifth.json`, outside this scope);
  `APMACRO_PUBLISHED=graph-skills,unit-1,unit-2 node scripts/build-apmacro.mjs --out <scratch>`: 17 topics, 87 files.

## Open (for a person)

- **Lettered country names.** "Country X", "Y", "Z", "W", "V" and "Q" are used across six Unit 2 sets and both Unit
  2 FRQs, and again in Unit 3 (`aggregate-demand`, `policy-short-run`, `sras`, `multipliers`). The one-name-per-set
  rule (authoring guide) seems aimed at named countries; if it covers letters too, Unit 2's would need names.
  Halvet and Berovia each appear in two or three Unit 2 sets (Unit 2's own names, so allowed as the guide reads).
- `a-ppc-growth-words`: the CED's 1.2 text says "Economic growth results in an outward shift of the PPC", so
  the term can be taught in 1.2; the map teaches `economic-growth` in 5.6 and Unit 1 avoids the words.
- `a-supply-slope-reason`: the CED gives only the positive price-quantity relationship, no marginal cost; the
  lesson's rising-cost reason is fine and stays.
- `b-real-gdp-method`: the notes match the CED 2.6 statement (base-year prices can overstate growth, agencies use
  other methods); naming chained prices is ours and correct.
- `b-cycle-graph`: CED 2.7 links the cycle to output gaps, not the PPC. Unit 2's PPC items (recession inside,
  full employment on) are an extension; the business-cycles notes word the positive gap on a PPC as "stretched
  beyond its sustainable level" without placing it outside the curve, which keeps it consistent with "outside is
  unattainable". A teacher may want that row removed.
- The static question HTML shows options in authored order; any future bank should keep key positions mixed
  (a content-check rule on key position would catch it).
