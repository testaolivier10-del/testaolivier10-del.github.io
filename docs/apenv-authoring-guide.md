# AP® Environmental Science authoring guide

Rules for writing AP® Environmental Science content, adapted from `docs/apstat-authoring-guide.md`. They come
from `docs/apenv-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/apenv-architecture.md` ("Content formats"). The research is in `docs/apenv-research/framework.md`; every
rule below that names an error comes from its section 6 (the Chief Reader Reports 2023-2025, spec section 2).

## Before you write a topic

1. Find the topic in `docs/apenv-dependency-map.json`: its id, CED number, big ideas, skills and the concepts it
   owns. Read its entry in `docs/apenv-ced-map.json` and write it in your own words.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. This holds for notation:
   `$\text{NPP}$`, `$\text{LD}_{50}$` and `$2.5 \times 10^{6}$` count as using NPP, LD50 and scientific notation.
3. Write `environmental-science/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`,
   `glossary/<id>.json`.
4. Run `node scripts/check-apenv-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apenv-map.mjs --check`. The placeholder fixture
   `scripts/test/fixtures/apenv-data/questions/human-population.json` shows every item type working (numeric
   with `from` and `mistakes`, setup with `then`, specific, the three set kinds); it is placeholder content,
   never a model for wording.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board questions, AP
  Classroom items, the CED's text or any textbook. Use the CED, scoring guidelines and Chief Reader Reports for
  scope and for the errors to target, in your own words (decision 4).
- **Data (decision 4).** Every number in a stimulus is either clearly invented for practice or taken from a
  public source named on the page. Invented data: `"invented": true` on the stimulus (the page says "Invented
  data for practice"); plausible for its context (a real range of birth rates, a believable NPP); never
  attributed to a real place, agency or study. Real data: `"source"` naming the public source and year (NOAA,
  NASA, EPA, USGS, USDA, EIA, the UN, IPCC, FAO, WHO, the World Bank, the Census Bureau, Our World in Data), the
  numbers exactly as published or rounded and said so. A text passage is written by us; its `source` says
  "Invented passage for practice" or names the public report it summarizes.
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Environmental Science
  exam"). Never "AP" alone, plural, possessive, "APES", or in a URL, id, file name or meta description.

## Spelling and style

- American spelling everywhere (`scripts/check-site.mjs` refuses British forms in visible text): fertilizer,
  sulfur, color, behavior, meter, liter, ton (say "metric ton" when it is 1,000 kg).
- No em dashes in anything a student reads; use a colon, a comma or two sentences.
- Numbers: thousands commas (2,500,000), units after a space (25 %, as Bluebook types it, or 25%), scale words
  spelled out ("2.5 million").

## Calculations: the setup, then the answer with its unit

The exam gives one point for the setup and one for the answer with units (spec section 2), there is no formula
sheet, and only a four-function or scientific calculator is allowed. So every worked example, explanation and
sample answer:

1. **Writes the setup with brackets and units**, as the student would type it in Bluebook:
   `(150 - 120) / 120 × 100`, never `150 - 120 / 120 × 100`; `5,000 kWh × 0.9 kg CO2 / 1 kWh`, so the units
   visibly cancel. A difference that is divided always has its brackets.
2. **Then the answer with its unit**: `= 25%`, `= 4,500 kg CO2`. Never a bare number.
3. **Multiplies by 100 for a percent** and says so; divides crude rates by 10 (per 1,000 to percent).
4. **Reads the question to the end**: "in what year" means add the doubling time to the start year; "in
   millions" means give the scale; "per person" means divide by the population.
5. **Scale words and powers of ten** are written both ways at least once per topic that uses them: 2.5 million
   = 2.5 × 10⁶ = 2,500,000.
6. Arithmetic a student can do by hand or with a scientific calculator; no graphing-calculator steps, no
   regressions, no statistics tests (the content check refuses p-values, t-tests and confidence intervals).
7. Every calculated key in an item comes from an `ApEnvCalc` recipe (`from`), never typed by hand. Authored
   `mistakes` are the real slips, each with its own recipe or value and a `why` that names the fix: forgot × 100;
   divided by the new value; the 10% rule applied once too often; the doubling time not added to the year; a
   factor of 1,000 from kW and W or kg and g; a scale word dropped.

The formulas page (`formula-sheet.html`, "Formulas you must memorize") lists every equation in our own words;
a lesson links to it rather than repeating a formula list.

## Writing answers specific enough to score

The readers' most common misses (spec section 2; the "Make it specific" trainer is built on them). Every model
answer, `earns` answer and FRQ sample follows these, and every `misses` answer shows one of them:

- **A hypothesis is a statement with a direction**: "If more nitrate is added, then algae growth will
  increase." Never a question, never "affects", "changes" or "impacts" without saying which way.
- **Name the variable the study measures.** The dependent variable is the one in the data table, not a related
  one (species richness, not dissolved oxygen, when richness is what was counted).
- **A control and its purpose**: say what the control group is and what it is for (a baseline to compare with).
- **Complete cause-and-effect chains**, every link named: fertilizer runoff → algal bloom → algae die →
  decomposers use oxygen → dissolved oxygen falls → fish die. Do not restate the stem.
- **A solution fitted to the scenario**: its scale (a household, a town, a country), its constraints, and how it
  works ("buffer strips of plants absorb nitrate before runoff reaches the stream"). Respect "other than ..."
  in the question.
- **A policy is a law or rule**, not a technology: "a law requiring scrubbers on coal plants", not "scrubbers".
- **Compare both sides** when asked to compare; an advantage and a disadvantage each with its reason.

## Content traps to target

Write distractors and misconception callouts from these confusions (framework.md section 6):

- Greenhouse gases vs ozone depleters vs acid-rain gases: SO2 and particulates are not greenhouse gases; CO2
  does not destroy ozone; CFCs deplete ozone; NOx and SOx cause acid rain, not VOCs or PM; natural gas is not
  "zero emissions".
- Thermal pollution is heat (it lowers dissolved oxygen), not metals, nutrients or radioactivity. Nuclear fuel
  is uranium, not water or steam.
- Melting sea ice does not raise sea level (land ice and thermal expansion do); thermal expansion is not caused
  by dissolved CO2.
- El Niño vs La Niña; a watershed vs an aquifer; savanna vs grassland vs desert.
- Fertilizers (eutrophication) vs pesticides; bioaccumulation (one organism, over time) vs biomagnification (up
  a food chain).
- r- and K-selection vs survivorship curves (related, never the same thing); an adaptation evolves over
  generations, not within one lifetime.
- Primary vs secondary succession; trees store carbon, not "CO2"; a hydrogen fuel cell's drawbacks vs a
  battery car's.

## Notation

Math is TeX between dollar signs, rendered at build time; in JSON every backslash is doubled. Keep it light:
`\frac`, `\times`, `10^{6}`, `\text{kWh}`, `\text{LD}_{50}`, `t_{1/2}`, `\%`. Units in formulas inside
`\text{}` with a thin space: `5{,}000\,\text{kWh}`.

## Questions

- Every item carries `unit`, `topic`, `practice` (a skill id such as `"5.B"`; never 3.D, 3.E or 4.D) and its
  type.
- **Four options** for single-answer items (needs-author `mcq-options`), similar lengths (the key is the longest
  at most 40% of the time), distractors from the traps above, each option's explanation naming the error by
  content, never by letter.
- At least 60% apply/analyze. At least 40% of a topic's items in stimulus sets of 3-5 items. Mix the three
  kinds across a unit: `quantitative` (tables and data), `visual` (graphs, maps, models, diagrams), `text`
  (a short passage, as the exam's text sets; Practice 3).
- Practice 6 topics (and every topic with a calculation) write `numeric` and `setup` items; Practice 1, 4 and 7
  topics write `specific` items for hypotheses, solutions, policies and chains.
- No `calc` flag (a calculator is allowed everywhere), no `interval` or `conclude` items.

## FRQs: the 10-point analytic style

Three types, in exam order, 10 points each with one rubric line per point, accepted wordings per line, a
full-credit sample per part, task verbs in bold (Identify, Describe, Explain, Justify, Calculate, Propose,
Make a claim).

| Type | Shape | Points go to |
|---|---|---|
| `design` (Q1) | a scenario with a model or visual | a testable directional hypothesis; independent and dependent variables; a control and its purpose; a constant; a design change and its effect; explanations of the system |
| `data` (Q2) | a table, chart or graph | reading values and trends with numbers; describing and comparing; a claim justified from the data; explaining the pattern; a solution or a consequence (new title for 2027) |
| `calc` (Q3) | a problem with quantitative data | each calculation as setup (1 point) and answer with units (1 point); then explanations, a solution with how it works, or a policy |

Each `calc` FRQ has at least one `check` (numeric or setup) recomputed by the build. The 10-point split is our
estimate from the 2024-2026 scoring guidelines (needs-author `frq-scoring`).

## Level and voice

- From middle-school science and Algebra 1, for a student whose class moved too fast. Short sentences, active
  voice, "you". A concrete system first (a pond, a town's water, a power plant), then the idea, then any formula.
- Every lesson has a figure drawn from its data (a `plot` spec) or a clean diagram; every data figure says
  whether its numbers are invented or where they come from.
- A worked example, in `<div class="worked">`, before any new calculation or writing type, with the setup, the
  units and the answer written out.
- Explain why before how: why energy drops at each trophic level, why fertilizer lowers dissolved oxygen.

## Contested or uncertain points

Add them to `docs/apenv-needs-author.md` instead of guessing. Every unit gets an independent accuracy check
before it is published, with every calculation key recomputed by code.
