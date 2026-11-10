# AP® Microeconomics authoring guide

Rules for writing AP® Microeconomics content, adapted from `docs/apmacro-authoring-guide.md`. They come from
`docs/apmicro-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/apmicro-architecture.md` ("Content formats", "Graphs", "Payoff matrices"). The research is in
`docs/apmicro-research/framework.md`; every rule below that names an error comes from its section 7 (the 2023-2025
Chief Reader Reports and the scoring guidelines).

## Before you write a topic

1. Find the topic in `docs/apmicro-dependency-map.json`: its id, CED number, big idea, focus skills and the
   concepts it owns. Read its entry in `docs/apmicro-ced-map.json` and write it in your own words. For 3.4-6.5 the
   knowledge comes from scoring guidelines, reader reports and standard economics, not the CED text (needs-author
   `ced-text`): stay inside it, and log anything you are unsure is in scope.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. Add a concept to the map (with
   `taughtIn` and `dependsOn`) for every term your topic teaches that the map lacks.
3. Write `microeconomics/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-apmicro-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apmicro-map.mjs --check`. The placeholder fixture `scripts/test/fixtures/apmicro-data/` shows
   every item type working (numeric with `from` and `mistakes`, graph items with shade, point, line, shift and label
   tasks, a two-panel graph, a matrix item, a specific builder, the three set kinds, a long FRQ with graph parts and
   a short FRQ with a matrix part); it is placeholder content, never a model for wording.

## Originality, sources and the trademark

- **No released questions.** Never reproduce, adapt or closely paraphrase released College Board questions (any
  year, either section), AP Classroom items, the CED's text or any textbook. Use the CED, scoring guidelines and
  Chief Reader Reports for scope and for the errors to target, in your own words (decision 4). A scenario with the
  same economic logic as a released FRQ is fine; the same firm names, numbers, part structure and wording are not.
- **Invented firms and goods (decision 7).** Graded content (items, FRQs, tool drills) uses invented firms
  ("Arlo Bakery", "Firm A"), invented goods ("widgets", "kelp bars") and invented countries for trade ("Country
  X", "Dornia"). A real company never "does" something in graded content. Before naming a firm or country, search
  `microeconomics/data` and the tool models: a proper name belongs to one scenario set. Letters ("Firm A", "Firm B")
  may repeat across sets; within one set keep each letter for one firm. Amounts are in dollars throughout.
- **Invented data are labeled.** Every table or chart is `"invented": true` or carries a `source` naming the
  publisher and year with the numbers as published.
- **Neutral on politics.** Policy is cause and effect, never good or bad. No parties, no named politicians.
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Microeconomics exam").
  Never "AP" alone, plural, possessive, "AP Micro", or in a URL, id, file name or meta description.

## Spelling and style

- American spelling (labor, center).
- No em dashes in anything a student reads; use a colon, a comma or two sentences.
- Short sentences, active voice, "you". A concrete situation first (a bakery deciding whether to hire one more
  baker), then the model, then its name.

## Graph rules (the graph point is lost more than any other)

- **Label every axis and every curve**, in every figure, sample answer and key: "Price" and "Quantity", "Price and
  cost" for a firm, "Wage" and "Quantity of labor", D, S, MR, MC, ATC, AVC, MRP, MFC, MSB, MSC. A new curve after a
  shift gets a subscript (D2, S2). Mark equilibrium price and quantity on the axes (PE, QE, or P1, Q1 and P2, Q2).
- **MC crosses ATC and AVC at their minimums.** Every cost figure must show it (44-52% of students miss it). The
  engine draws it exactly; a hand-drawn figure in notes must too. MC is the change in total cost divided by the
  change in output (9% got MC from a table).
- **The competitive firm's demand is horizontal**: d = MR = AR = P, carried across from the market panel at the
  market price (47-49% miss it). Draw firm and market side by side, the firm's quantity in lower case (q).
- **Price comes from demand, not MR.** For a monopoly or a monopolistically competitive firm: find Q where
  MR = MC, then go up to the demand curve for P. Never read P from MR or MC.
- **Shade the right region**, out to the right quantity. Subsidy cost is the whole rectangle between the price
  sellers receive and the price buyers pay, out to the new larger quantity (8%); deadweight loss after a subsidy is
  the triangle beyond the efficient quantity (6%); tax revenue uses the quantity after the tax; profit is
  (P - ATC) times q at the profit-maximizing q, not at the minimum of ATC. Every `shade` item and FRQ part names its
  region with the engine's region name, and the explanation says where the region's edges are.
- **Market vs efficient quantity.** With an externality, say which quantity the market produces (MPB = MPC) and
  which is efficient (MSB = MSC), which is larger, and where the deadweight loss sits (11%).
- **Shutdown at minimum AVC**, not minimum ATC; long-run zero profit at minimum ATC.

## Marginal rules

- Produce where **MR = MC** (or the last unit where MR is at least MC, from a table).
- Hire where **MRP = MRC** (MFC for a monopsonist). MRP = MP x MR (for a competitive seller, MP x P). A change in
  product demand changes product price, so MRP, so labor demand (11%): name every link.
- A consumer buys where **MU per dollar** is equal across goods (MU/P); indifference curves are out of the course.
- The least-cost rule: MP/P equal across inputs.
- A monopsonist hires where MRP = MFC and pays the wage read from the **labor supply** curve at that quantity.

## Game theory: both comparisons

- A **dominant strategy** is best whatever the other player does. Prove it with both comparisons, one for each of
  the other player's choices, with the numbers ("40 > 20 if B picks Low, and 70 > 50 if B picks High"). "No
  dominant strategy" also needs both comparisons, showing the best choice changes (43-46% miss this).
- Find **every** Nash equilibrium (29-48% list only one); a cell is one when neither player gains by switching
  alone. The cell with the largest combined payoff is not, by itself, a Nash equilibrium.
- In every matrix the row player's payoff is first in each cell; say so in the stem. No ties for one player
  against the same choice of the other (the checker refuses them).

## Content traps to target (distractors and mistake feedback)

Each is in the content check's slip list: a page names one only inside a `<span class="mic-slip">` box that
corrects it.
- The monopoly price read from MR; the competitive firm's demand sloping down.
- Marginal cost without dividing by the change in output; MRP as MR times P.
- The sign of cross-price elasticity reversed; elasticity judged by its sign rather than its absolute value.
- A lump-sum tax changing MC (it changes ATC only).
- The monopsony wage read from MRP or MFC.
- Shutting down below minimum ATC.
- A dominant strategy as "the strategy with the highest payoff".
- "Supply is greater than demand" (compare quantity supplied and quantity demanded).
- Firms entering "because demand rises" (they enter because of economic profit).

## Writing answers specific enough to score

The "Make it specific" prompts and every FRQ sample state explicitly what is asked ("identify" needs a clear
statement), show work for "calculate" (the formula or steps), and link causes for "explain". The checker refuses a
long-run chain without entry or exit, a derived-demand chain without MRP, a game-theory answer without two numeric
comparisons, a price answer without the demand curve, and a marginal answer without its rule.

## Notation

Math is TeX between dollar signs, rendered at build time; in JSON every backslash is doubled. Keep it light:
`\text{MC} = \frac{\Delta \text{TC}}{\Delta Q}`, `\%`. In prose write D2, MC, ATC.

## Questions

- Every item carries `unit`, `topic`, `practice` (a skill id such as `"2.B"`; 4.A-4.C only on `graph` items) and
  its type: `single`, `multi`, `numeric`, `specific`, `order`, `graph`, `matrix`.
- **Four options** for single-answer items, similar lengths, each explanation naming the error by content, never
  by letter; no position holds the key in more than 40% of a topic's single-answer items.
- At least 60% apply/analyze. At least 40% of a topic's items in stimulus sets of 3-5 items: `data`, `graph` (a
  spec, with `letters: true` when the stem asks "which area"), `text`.
- `numeric` items for every calculation (every key from an `ApMicroCalc` recipe); `graph` items wherever the topic
  has a graph (label, shift, equilibrium, point, line, shade); `matrix` items in game theory.
- An FRQ's setup goes in its `scenario`; each part's `prompt` starts with its task verb (<b>Draw</b>,
  <b>Identify</b>, <b>Calculate</b>, <b>Explain</b>, <b>Shade</b>). A long FRQ has at least one graph part.

## Level and voice

- From middle-school math and everyday experience, for a student whose class moved too fast.
- Every lesson has a figure: a graph from its spec, a data chart, a cost table, a payoff matrix.
- A worked example, in `<div class="worked">`, before any new calculation or graph.

## Contested or uncertain points

Add them to `docs/apmicro-needs-author.md` instead of guessing. Every unit gets an independent accuracy check before
it is published, with every numeric key recomputed by code and every graph and matrix key scored by the grader.
