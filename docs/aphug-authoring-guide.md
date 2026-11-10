# AP® Human Geography authoring guide

Rules for writing AP® Human Geography content. They come from `docs/aphug-spec.md`; where this guide and the spec
differ, the spec wins. File formats are in `docs/aphug-architecture.md` ("Content formats"). The research is in
`docs/aphug-research/framework.md` (the CED, scoring guidelines and Chief Reader Reports, read 2026-11) and
`docs/aphug-research/accuracy-risks.md` (facts that go stale, disputed places, group names). Open questions are in
`docs/aphug-needs-author.md`.

## Before you write a topic

1. Find the topic in `docs/aphug-dependency-map.json`: its id, CED number, focus skills and the concepts it owns.
   Read its entry in `docs/aphug-ced-map.json` (objectives, knowledge, exclusions) and write it in your own words.
   The CED text there is our summary until needs-author `ced-text` is done; check the CED itself before you rely
   on a detail.
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. A word the student has not met yet
   is defined in the sentence that first uses it, or not used.
3. Write `human-geography/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-aphug-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-aphug-map.mjs --check`. The fixture `scripts/test/fixtures/aphug-data/` shows every item type
   and every stimulus working (each map rendering, a pyramid, a table, a chart, an image placeholder, a text, four
   model items, the three FRQ types). It is placeholder content: never copy its wording.

## Who you are writing for

A 9th grader who has never taken a geography class and may be reading in a second language.

- Short sentences, active voice, "you". One idea per sentence.
- Plain words. Say "where people live" before "population distribution", then give the term.
- **Define every term before you use it.** The first time a term appears in a lesson, the sentence says what it
  means. A term from an earlier topic may be used without a definition (the map check knows which ones).
- A concrete case first, then the idea, then its name: "In Bangladesh, most people live on the flat, wet land of the
  river delta. That is a pattern of population distribution."
- American spelling. No em dashes in anything a student reads: use a colon, a comma or two sentences.

## Name a real place, and name the scale

The readers give no credit for a vague answer (framework.md section 5). So every example we write models a strong
one.

- **Name a real place.** "In Lagos, Nigeria" and not "in some cities". An invented place is fine only when it is
  labeled as invented (Country A, "a country in Sub-Saharan Africa" in a data table marked invented).
- **Name the scale of analysis.** Local, regional, national or global (or a named region). A sentence that compares
  places says at what scale: "At the national scale, Egypt looks crowded; at the local scale, almost everyone lives
  within a few kilometers of the Nile." The content check warns when a lesson section compares places with no scale
  word.
- A pattern names where, what and how much: "Population density is highest in the Nile valley and delta and falls
  to almost zero in the desert to the west."

## Task verbs

Every FRQ part and every written prompt uses one task verb, and the sample answer does exactly what the verb asks
(`VERBS` in `scripts/lib/aphug-exams.mjs`; the page shows the demand under each part).

| Verb | What a full-credit answer does |
|---|---|
| Identify | Names the thing. One word or a phrase is enough. |
| Define | Gives the meaning in a full sentence. |
| Describe | Gives the features of the thing or pattern: more than a name. |
| Explain | Says why or how, with the link stated: "because", "so", "which leads to". |
| Compare | Says how two things are alike or different, and speaks of both sides. |
| Explain the degree | States the degree first ("to a great degree", "only partly"), then explains it. |

Use the verb's demand in hints and feedback too: "You named the factor; an explain also says how it causes the
pattern." The content check refuses a part whose prompt does not use its verb, an explain sample with no link, a
compare sample about one side and a degree sample that does not open with the degree.

## Stimulus questions need the stimulus

A question attached to a map, table, chart, pyramid, image or text must need it.

- The student must read the stimulus to answer. If the item can be answered without looking, it is a standalone
  item: move it out of the set.
- Ask about what the stimulus shows: a pattern, a change, a comparison, a limit of the data. Then, at most one item
  per set, ask the student to apply a concept to it.
- Sets have 2 to 5 items (the check enforces it), in the order a student would read.
- **Maps.** The map's `label` is real alt text that names the pattern ("Choropleth map of Africa: the share of
  people living in cities is highest in North Africa and South Africa"). Marks on the world map are at most three
  characters (A, B, C). Every word lives in HTML, so keep marks and isoline labels apart: the check measures them
  at 360 px. Give a dated `source` or set `invented: true`. A value on a disputed place needs `disputedOk` with the
  reason.
- **Pyramids.** Males on the left, females on the right, five-year groups, a dated source or `invented`.
- **Images.** We draw every image as a LevlPrep SVG; never use a photo. Until a figure exists, write the `alt` as if
  describing the drawing to a student who cannot see it: the placeholder shows that text.
- **Texts.** Short (under 150 words), dated, with the author or body named. Never quote a long passage.

## Neutral, dated and specific

Facts in human geography go stale, and some places are disputed. Follow `docs/aphug-research/accuracy-risks.md`.

- **Every number has a source and a year.** "About 8.2 billion people (UN, 2024)", "World Bank FY27 income group".
  Never "currently", "today" or "the latest" with no year; the content check flags them.
- **Disputed places.** Say who controls, who claims and who recognizes, with a date. Never state sovereignty as
  settled, and never make an answer depend on a disputed status. Use the UN name and give the other name with who
  uses it (Falkland Islands / Islas Malvinas; Gulf of Mexico / Gulf of America).
- **Group names.** Use the name a group uses for itself, capitalized. Ethnicity, language and religion are cultural
  traits, never biological ones. Never call people "illegal". Describe beliefs as "adherents believe" and never rank
  religions. The content check lists the words it refuses.
- **Models are models.** Rostow, Wallerstein, the demographic transition model, Malthus, von Thünen, Burgess and the
  others are simplified ideas with assumptions and limits. Every lesson that teaches one says what it assumes and
  where it fails. Key only models the CED names; an author may mention another one in a `hug-aside`, never in a key.
- **Country lists in models** (core, semiperiphery, periphery) are examples "often classed as", never a fixed list.

## Numbers

Population and density items use `ApHugCalc` recipes (architecture, "ApHugCalc"). Keep numbers small enough to work
without a calculator (the exam has none): round populations to millions, rates to whole numbers. RNI is a percent:
CBR 30 and CDR 10 give 2%, not 20. Doubling time uses the rule of 70.

## Originality and the trademark

- Original items only. Never reproduce, adapt or closely paraphrase released College Board questions, AP Classroom
  items, the CED's text or a textbook. Use the CED, scoring guidelines and Chief Reader Reports for scope and for the
  errors to target, in your own words.
- Invented data is labeled ("Invented data for practice"). Never present it as real, and never attribute it to a
  real agency.
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Human Geography exam").
  Never "AP" alone, "APHG", "AP HuG" or "AP Human Geo", and never in a URL, id or file name.

## Questions

- Bank singles have four options; exam forms have five (a bank item gets its fifth from the form's `fifth` map).
- Distractors are ideas a student mixes up with the key (push and pull factors, relocation and expansion diffusion,
  antecedent and subsequent boundaries), each with a `why`.
- No "all of the above", "none of the above", "always" or "never" in options.
- Model items: two to eight places, at most three distractor pieces, each piece under 40 characters, a `slips` entry
  for the mistake students really make (sector and concentric zones mixed up, stage 2 and stage 3 swapped).
- At least 70% of a topic's items ask the student to apply or analyze, not to recall.

## When you are not sure

Add a line to `docs/aphug-needs-author.md` and write around it. A wrong fact costs more than a missing one.
