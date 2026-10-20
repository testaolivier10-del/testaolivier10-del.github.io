# Unit 7 and 8.1-8.11 review (19 topics, two FRQs)

Independent accuracy review, 2026-10-20, of author F's work on branch `claude/apenv`, following
`docs/apenv-briefs/review-common.md`. Scope: `air-pollution`, `photochemical-smog`, `thermal-inversion`,
`co2-particulates`, `indoor-air`, `reducing-air-pollutants`, `acid-rain`, `noise-pollution`,
`pollution-sources`, `human-impacts-ecosystems`, `endocrine-disruptors`, `wetlands-mangroves`,
`eutrophication`, `thermal-pollution`, `persistent-organic-pollutants`, `bioaccumulation-biomagnification`,
`solid-waste`, `waste-reduction` and `sewage-treatment`. For each topic I checked the lesson, notes, questions
(290 items, 38 stimuli), glossary (62 entries) and figure entries. I also checked the 19 SVG figures,
`frq-photochemical-smog-data` and `frq-eutrophication-design`.

## Sources

- **CED.** WebFetch returns only the first 112,703 characters of the CED PDF, which stops in Topic 3.7, so the
  Unit 7 and 8 learning objectives and exclusion statements could not be read (needs-author `ced-text`). I
  checked content against the official topic titles, mainstream science and the sources below.
- **EPA, *National Overview: Facts and Figures on Materials, Wastes and Recycling* (fetched).** It confirms
  292.4 million tons, 4.9 lb per person per day, 69.1 recycled, 24.9 composted, 34.6 combusted with energy
  recovery, 17.7 other food management, 32.1% recycling and composting, and paper 23.1% and food 21.6%. For
  landfilling, the page gives 146.1 million tons in one place and 146.2 in another. The stimulus uses 146.1,
  the fact-sheet Table 1 value.
- **CDC, *What Noises Cause Hearing Loss?* (fetched).** Every range in `noise-pollution-decibels` and in the
  notes matches: whisper 30 dB, refrigerator 40, conversation 65 to 80, lawn mower 80 to 100, sports events 94
  to 110, sirens 110 to 129, fireworks 140 to 160, and 85 dB as the level where hearing damage can begin.
- **USGS dissolved oxygen solubility.** The USGS page itself was not fetched. I recomputed the values with my
  own Benson-Krause script (fresh water, 1 atm): 14.62, 12.77, 11.29, 10.08, 9.09, 8.26, 7.56, 6.95 mg/L at
  0-35 °C. All eight stimulus values (14.6 ... 6.9) are these values rounded correctly.
- **NIEHS, *Endocrine Disruptors* fact sheet (fetched).** It lists atrazine ("one of the most commonly applied
  herbicides in the world"), BPA, phthalates, PCBs, PBDEs and dioxins.
- **UNEP, *Global Mercury Assessment 2018*, as quoted by the EPA (fetched).** Artisanal and small-scale gold
  mining causes 37.7% of human mercury emissions; stationary coal combustion causes 21%.

## Numeric recheck

My scratch script derives a value for every numeric item (42) and setup item (19) from the stem alone, not from
the `from` recipe. It then grades each one through the runtime (`env-expr.js`, `env-math.js`, `env-calc.js`,
`env-grade.js` and `env-questions.js`, loaded in a vm the way `apenv-questions.test.mjs` does).

- **Result.** 61 items checked, 0 failures. Every key is right with its unit. No authored value or setup mistake
  is graded right. Every setup key passes `gradeSetup`, and the unbracketed `72 - 96 / 96 * 100` fails the
  setup step.
- **Unit spellings.** Graded right: "percent", "tonnes", "micrograms", "degrees C", "pounds", "lb per person per
  day", "cubic meters", "4.32 billion L", "24 million liters", "percentage points", "1 million times".
- **Partial credit.** A bare number scores 0.5 when a unit is asked.
- **Limits found.** "1.65 mg" for a µg key is graded wrong (no mass conversion), which is acceptable. "10^6
  times" is not parsed as a number, which is a runtime limit and not a content fault.
- **FRQ check.** `frq-photochemical-smog-data` (b) recomputes to 538.89%. The key and setup are right; the
  ÷ 115 setup and the 638.9% value are both refused.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| eutrophication | `env-eutrophication-12` (key changed) | Select-all with two correct options. The unit had no select-all with a single correct answer (brief: convert toward 20%). | Same id and type; the stem now asks which actions cut the nutrients reaching the lake. Options: buffer strips (correct), new insecticide, aeration, algaecide. Key [0, 1] → [0]. Each option's explanation names the trap (pesticide vs fertilizer; treating the symptom). |
| sewage-treatment | `env-sewage-treatment-14` (key unit changed) | The stem asks for liters per day, but the key unit was plain L (full content check warning). The stem also said "in millions of liters", which reads as wanting the number 24. | Key unit L/day, with "L per day", "liters per day", "liters/day", L and liters all accepted; the stem asks for liters per day. Value unchanged (24,000,000). |
| sewage-treatment | `env-sewage-treatment-8` | The key "The upgrade removed most waste" was too broad (the plot shows dissolved oxygen only). Its explanation said the dip "shrank from 3.0 to 7.5". | "The upgrade removed most oxygen-demanding waste"; the explanation now says "the low point of the dip rose from 3.0 to 7.5 mg per L". |
| co2-particulates | `env-co2-particulates-3` | "By what percent did visibility fall" with key -95% marks a correct "95%" wrong. | The stem asks for the percent change. A new authored mistake, 95, explains the negative sign. Key unchanged. |
| photochemical-smog | `env-photochemical-smog-1` | Only the key used the format "time (value)"; the distractors used "time, at value", which gave the key away. | Same format as the distractors. |
| human-impacts-ecosystems | stimulus `human-impacts-ecosystems-s1` | Titled "mine drainage pipe", but the items and notes treat it as an organic, oxygen-lowering discharge. Mine drainage harms insects mainly through acidity and metals, so "DO falls, midges and worms rise" does not fit it. | Retitled "a wastewater discharge pipe". |
| endocrine-disruptors | `env-endocrine-disruptors-10` | Needs-author point: the atrazine wording ("linked in some studies") made the key look contestable. | The key now rests on the NIEHS listing; one clause keeps the note that frog studies differ in effect size. |
| endocrine-disruptors | `env-endocrine-disruptors-13` | Grammar error in the explanation ("steps ... removes"). | "remove" |
| bioaccumulation-biomagnification | notes "The real cases" | Needs-author point on mercury sources. | Adds that small-scale gold mining is the largest human source worldwide and coal burning the second (UN Environment Programme). |
| bioaccumulation-biomagnification | lesson hook | "a few parts per hundred million" contradicts the stimulus value 0.00005 ppm (5 parts per hundred billion). | "0.00005 ppm, or 5 parts per hundred billion" |
| indoor-air | notes, "Combustion indoors" | "Hundreds of millions of people" understates the WHO figure of about 2.1 to 2.3 billion. | "more than 2 billion people (WHO)" |
| indoor-air | `env-indoor-air-15` | "per winter" read as a rate and triggered the content check's rate warning. | "released in one winter"; the key stays in kg. |
| noise-pollution | lesson hook | It stated as fact that the birds "did not leave because of fumes or lost habitat". The item `env-noise-pollution-6` correctly says these data show a relationship, not proof. | The hook now names noise as a main suspect and lets fumes and lights share the cause. |
| sewage-treatment | notes, "When systems fail" | Grammar error ("rain gardens that soaks"). | "soak" |
| wetlands-mangroves | figure `wetlands-mangroves-services` | In the rendered figure, the leader line from "habitat for ducks and herons" crossed the "stores floodwater" line. | The label moved to the lower left with a short leader line (`scripts/apenv-figures/unit-7-unit-8.mjs`); only this figure was regenerated. |
| needs-author | `docs/apenv-needs-author.md` | Author F's atrazine and mercury points were open. | Marked resolved, with sources, and moved to the end of the file. |

Changed keys:

- `env-eutrophication-12`: [0, 1] → [0], with new options.
- `env-sewage-treatment-14`: unit L → L/day, same value.

The engine was not touched.

## Checked and fine

- **Content traps, never taught wrong.**
  - SO2 and particulates are never called greenhouse gases.
  - CO2 is never said to thin ozone; the one distractor that says so is refuted.
  - Acid deposition is taught as SO2 and NOx only, with VOCs, PM and CO2 named as the trap in the notes,
    lesson misconception and `env-acid-rain-9`.
  - Thermal pollution is taught as heat (items 6, 9 and 14, the misconception and the notes refute metals,
    nutrients and radiation).
  - The eutrophication chain names every link: the order item, the chain builder, the figure, the notes, and
    FRQ (e).
  - Fertilizer vs pesticide is kept apart (`env-eutrophication-10`).
  - Bioaccumulation vs biomagnification is kept apart (items 7 and 15, glossary, table).
- **Unit-9 terms.** "heat-trapping gas" for methane appears only in 8.9 and 8.10 prose; the greenhouse
  vocabulary waits for 9.3 (`check-apenv-map` clean).
- **Plot stimuli.** All 15 were drawn from their stated numbers and rendered in Chromium with the course CSS.
  Axes, units and legends are correct and nothing is clipped or overlaps.
- **Figures.** All 19 were rendered and inspected. Each figure's numbers match its stimulus or notes (smog day,
  CDC bars, the biomagnification ladder 0.00005 → 50 ppm, walleye mercury).
- **FRQs.**
  - Both are 10 points, with one rubric line per point and a full-credit sample per part.
  - The design FRQ's hypothesis is directional; the control has its purpose; part (e) gives the full
    decomposition chain; part (f) changes the independent variable to temperature.
  - The data FRQ's solution respects "other than reducing traffic" and says how it works.
- **Written answers.** Every `specific` model names a direction, the measured variable, or a fitted solution
  that says how it works. Policy items name rules, not devices.
- **Item quality.** One defensible key per single item, four options, and explanations that name the
  misconception by content.
- **Stimuli.** All invented except the EPA and USGS sets, which name their source.
- **Text passages.** The three passages are labeled "Invented passage for practice".
- **Style.** No em dashes in user-facing text. Spelling is American.
- **Checks.**
  - `check-apenv-content --topic` is clean for all 19 topics.
  - The full content check reports 104 topics with 0 failing, and no warnings remain for these topics.
  - `check-apenv-map` reports "Nothing is used before it is taught".
  - `node --test scripts/test/apenv-questions.test.mjs scripts/test/apenv-map.test.mjs`: 30 pass.
- **Select-all bank.** 19 of 52 select-all items now have one correct option (37%, above the 20% target). The
  other F multi (`env-bioaccumulation-biomagnification-11`, persistent + fat-soluble) keeps both keys because
  the two properties define the idea.

## Open (left for a person)

- **`ced-text`.** The Unit 7 and 8 objectives and exclusions are unread. Topics to check in particular:
  - whether 7.8 expects named decibel values;
  - whether 8.3 names specific chemicals;
  - whether 8.8 names mercury sources beyond coal.
- **Facts still from memory or rough, in the notes only (no item key depends on them):**
  - wetlands loss of about half since the 1780s (USFWS);
  - United States power-plant SO2 down more than 90% after 1990;
  - DDT 1972 and PCBs 1979;
  - Stockholm Convention parties;
  - the 2014 Toledo water event;
  - aluminum recycling saves about 95%.
- **Runtime.** `ApEnvGrade` does not read "10^6 times" as a number. It would help on items keyed in powers of
  ten (shared engine, not changed here).
