# AP® Biology authoring guide

Rules for writing AP® Biology topic content, adapted from `docs/anp-authoring-guide.md`. They
come from `docs/apbio-spec.md`; where this guide and the spec differ, the spec wins. File formats
are in `docs/apbio-architecture.md` ("Content formats").

## Before you write a topic

1. Find the topic in `docs/apbio-dependency-map.json`: its id, CED number, focus practices and
   the concepts it owns (`concepts[].taughtIn`). Read the topic's entry in
   `docs/apbio-ced-map.json` for what the framework expects, and write it in your own words.
2. You may use anything taught in this topic or an earlier one in course order, plus the map's
   `everydayWords`; nothing taught later, except inside a declared preview box
   (`<aside class="bio-preview">`).
3. Write `bio/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`,
   `glossary/<id>.json` (and `figures/<id>.json` for a new figure).
4. Run `node scripts/check-apbio-content.mjs --topic <id>` until it reports nothing.

## Originality and the trademark

- Everything original. Never reproduce or closely paraphrase released exam questions, AP
  Classroom items, the CED's text or any textbook (OpenStax included).
- Write the mark as **"AP®"**, with the ®, and only as an adjective before a capitalized noun:
  "the AP® Biology exam", "an AP® Biology teacher". Never "AP" alone, never plural or possessive
  ("APs", "AP's", "AP®s"), never in a URL, file name, id, meta description or ad copy. Prefer not
  to use the mark at all in content; "the exam" is usually enough.
- The generator adds the disclaimer to every page: "AP® is a trademark registered by the College
  Board, which is not affiliated with, and does not endorse, this site." Do not paste it into
  content, and never imply the College Board or OpenStax endorses LevlPrep.

## Level and voice: high school, slower, visual

- Write for a high-school student whose class moved too fast: assume nothing beyond the earlier
  topics. Short sentences, active voice, "you".
- **Slower:** one idea per section; concrete example first, then the rule; define each term the
  first time you use it, in plain words.
- **Visual:** every lesson has a figure (OpenStax *Biology 2e*, CC BY 4.0, or our own SVG), and
  every process is a numbered cause-and-effect chain where each effect is the next cause. "See the
  process, then answer questions about it": the chain comes before the check questions.
- **Mechanisms, not purposes:** "low water potential outside the cell draws water out", never
  "the cell wants" or "in order to".
- **Quantitative skills** (chi-square, SD/SE, Hardy-Weinberg, water potential, rates, Simpson's
  index): a fully worked example in `<div class="worked">` before any question asks for it, using
  the formula sheet's notation.

## CED order

Topics follow the 2025 framework's unit and topic order (the map). A lesson never leans on a later
topic. Skills topics sit right after the topic named in their `after`.

## Questions: data-heavy, calibrated to the real exam

- Every item carries `unit`, `topic` and `practice` (skill id like "4.B") written by you, never
  inferred. Pick the practice the item actually exercises.
- **At least 60% apply/analyze** per topic, and at least 40% of a concept topic's items in
  **stimulus sets** of 4-5 items sharing one table, graph, experimental setup or model. Prefer
  real-looking data: units on every column, plausible values, error bars where a mean is shown.
- A set's items each test something different about the stimulus: describe the data, calculate,
  explain with a mechanism, evaluate the design (variables, controls), predict.
- **Realistic distractors** from real misconceptions, similar in length to the key (the check
  fails a topic where the key is the longest option over 40% of the time), no absolutes
  (always, never, only...) that give the answer away.
- **Explanations:** `why.correct` gives the reasoning; `why.options[i]` says why that option is
  right or wrong, by its content, never "option B" or "the first choice".
- Numeric items state the unit and rounding; set `tol` to accept honest rounding only.
- Select-all items: at most half of all options correct across the bank, never more than two
  thirds in one item, and some with a single correct option. Predict items: about a fifth of the
  variables keyed "no change". No near-duplicates across topics.

## FRQs

Six types (two 9-point Interpreting and Evaluating Experimental Results, one with graphing; 4-point
Scientific Investigation, Conceptual Analysis, Analyze Model or Visual Representation, Analyze
Data). One rubric line per point, each with the accepted wordings; a full-credit sample for every
part; task verbs in bold (Describe, Explain, Calculate, Predict, Justify).

## Contested or uncertain science

Add it to `docs/apbio-needs-author.md` instead of guessing. Every unit gets an independent
accuracy check against OpenStax *Biology 2e* and the CED before it is published.
