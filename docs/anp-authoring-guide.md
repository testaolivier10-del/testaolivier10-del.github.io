# A&P authoring guide

Rules for writing A&P topic content. They come from `docs/anp-spec.md` (sections 2, 4, 5, 6, 7, 9
and 16); where this guide and the spec differ, the spec wins. File formats are in
`docs/anp-phase1-architecture.md` ("Content formats").

## Before you write a topic

1. Run `node scripts/anp-topic-brief.mjs <topic-id>`. It lists:
   - every concept the topic must teach (each term and alias it owns)
   - what the topic builds on
   - the preview boxes it may use
   - the later words it must not use
   - the tool items planned for it
2. Read the "Builds on" topics' concept lists. You may use anything taught in any earlier topic,
   but nothing taught later.
3. Write the four files:
   - `anatomy-physiology/data/lessons/<id>.json`
   - `anatomy-physiology/data/notes/<id>.html`
   - `anatomy-physiology/data/questions/<id>.json`
   - `anatomy-physiology/data/glossary/<id>.json`

   Add `anatomy-physiology/data/figures/<id>.json` too if the topic uses a figure that no
   earlier topic registered.
4. Run `node scripts/check-anp-content.mjs --topic <id>` until it reports nothing. Its `ORDER`
   failures mean you used a word that a later topic teaches. Rephrase in plain words, or use a
   preview box if the brief lists one.

## Originality (spec section 2)

- Write every sentence yourself, in LevlPrep's voice and order. Do not copy or closely
  paraphrase any textbook, OpenStax included.
- Do not read OpenStax prose while writing. Use the OpenStax learning objectives to check what a
  topic covers, and the figure catalog to choose figures. Nothing else.
- An audit flags passages whose wording overlaps OpenStax. Flagged passages get rewritten.

- **TEAS:** if a page names the TEAS, the generator adds the "not affiliated with ATI"
  disclaimer. Never imply that ATI or OpenStax endorses LevlPrep.

## Ordering (spec section 7)

- **Words you may use:** any term taught in this topic or an earlier one. The check reads the
  lesson, notes, questions and glossary definitions.
- **Later concepts:** use one only inside a declared preview box:
  `<aside class="anp-preview" data-concept="<concept-id>"><p>Preview: ...</p></aside>`. Give just
  enough (one or two sentences) and name the topic where it is taught.
- **Everyday body words** (spec decision 51): the words listed under `everydayWords` in the map (rib, nerve, cartilage, fever, hormone, gland and the like) may be used in their everyday sense before their topic; the glossary hover links forward. Their technical forms ("spinal nerve", "true ribs", "skeletal muscle") stay strict.
- **Everyday words:** plain English is always fine. "The pressure in the aorta" is fine before the
  course teaches "systolic pressure".
- **Short pulled-forward versions:** if a concept has one (the brief says "SHORT VERSION"), keep
  it brief, give a concrete example, and tell the student where the idea returns in full.

## Writing standards (spec section 5)

- Short sentences, active voice, second person: "your heart", not "the heart of the
  individual".
- **New terms:** define every technical term the first time it appears, with a plain
  explanation and its word roots, e.g. "*tachycardia* (tachy- = fast, cardi- = heart, -ia =
  condition): a resting heart rate above 100 beats per minute".
- **One name per structure:** when a synonym matters, introduce it once, explicitly: "the mitral
  valve (also called the bicuspid valve)", then use one name.
- **Concrete before abstract:** give an example or scenario first, then the general rule.
- **Mechanisms, not purposes:** "Low oxygen triggers chemoreceptors, which signal the brainstem
  to increase breathing rate", never "you breathe faster because your body needs oxygen". No
  "in order to", "so that the body can", "the body wants" or "designed to".
- **Sections:** one idea per section, and keep sections short. Tangents go in
  `<aside class="going-further">`.
- **Comparison tables:** commonly confused pairs get `<table class="compare">`, with identical
  rows for both sides.
- **Worked examples:** every quantitative question type (flow and resistance, pressure, cardiac
  output, MAP, filtration, acid–base) needs a fully worked example first, in
  `<div class="worked">`, with every step shown.
- **"Receptor":** never bare. Write "sensory receptor" for a sensor, and "receptor protein" for a
  binding molecule.
- **Contested science** (listed in `docs/anp-needs-author.md`): teach the evidence-based position.
  Where exams expect the older answer, add
  `<aside class="for-your-exam"><p>For your exam: ...</p></aside>`. If you meet something
  contested that isn't listed, write the evidence-based position and report it; don't guess.

## The lesson (spec section 4)

The generator builds the page in this fixed order. You supply the parts marked "you":

1. Clinical hook (you): one short, concrete patient scenario, 2–4 sentences, that makes the topic
   matter.
2. What this builds on (generated from the map).
3. Prerequisite check (you): 2 or 3 quick questions on earlier topics. `review` names the topic a
   wrong answer sends the student to.
4. Anatomy panel (you): a figure id, or `null` for a pure physiology topic. The generator adds
   the "hide labels" toggle.
5. Causal chain (you): at least 3 numbered steps. Each step has a `cause` and an `effect`, and each
   effect leads into the next step's cause.
6. Core concept tags (generated).
7. Misconception box (you): name the wrong idea directly, then explain why it is wrong.
8. Retrieval check (you): 5 to 8 question ids from this topic's bank, mixing levels.
9. Summary (you): the key points in a few sentences.
10. What comes next (generated).
11. Connections (you, optional): links to related NREMT or ochem pages, as root-relative hrefs.
    Only link pages that exist in the repo.

## The notes page

The full explanation, in the lesson's order of ideas. Length follows the topic, typically
1,000–2,500 words.

- **Sections:** use `<h2>` for each section, and `<h3>` inside one if needed.
- **Search:** the notes page is the page optimized for search. Its first paragraph should read
  naturally with the brief's search phrase in mind. Do not stuff keywords.
- **Figures:** every figure is referenced in the text at the moment it matters, e.g.
  `<a class="figref" href="#fig-heart-internal">Figure 1</a>`.

## Figures (spec section 6)

- **Licenses first (spec section 2):** use only figures whose catalog entry says
  `"license": "CC BY 4.0 (OpenStax)"`. Never use one marked `needs-verification`. Those credit a
  third party (Flickr, Wikimedia, University of Michigan micrographs) and are not cleared for
  commercial use. Never use NC or SA material of any kind, and never use OpenStax adaptations
  (only openstax.org's A&P 2e).
- **OpenStax figures** (CC BY 4.0): find them in the catalog at
  `/tmp/claude-0/-home-user-testaolivier10-del-github-io/c4e9d269-cf48-5f8f-934b-8d18d7c441fd/scratchpad/ox/figure-catalog.json`.
  It lists section, figure number, alt text and image URL. Register a figure in
  `data/figures/<topic>.json`:

  ```json
  { "heart-external": { "source": "openstax", "openstax": { "figure": "19.4", "section": "19.1",
    "url": "https://openstax.org/apps/archive/..." }, "alt": "your own description of what it shows",
    "license": "CC BY 4.0", "credit": "OpenStax Anatomy and Physiology 2e, Figure 19.4", "labels": [] } }
  ```

  Leave `labels` empty. The figure pipeline finds the label boxes, and the named labels go in `data/labels/<figure id>.json`. Use a
  figure in notes with `<figure id="fig-heart-external" data-fig="heart-external"><figcaption>your
  own caption</figcaption></figure>`, and in a lesson with `"anatomy": { "figure":
  "heart-external", "caption": "..." }`. Check the other topics' figure files before
  registering: never register the same OpenStax figure twice.
- A graph or image question needs a registered figure. To use one of your own diagrams there,
  save it as `anatomy-physiology/figures/<id>.svg` (standalone: `role="img"`, an `aria-label`,
  colors written in from the anp.css tokens, no page CSS classes) and register it with
  `"source": "levlprep", "license": "LevlPrep original", "ext": "svg", "credit": "LevlPrep"`
  and real `w`/`h` (spec decision 44).
- **Our own diagrams** (physiology schematics, graphs, causal chains): write inline SVG inside
  `<figure id="fig-..." class="anp-fig">...<figcaption>...</figcaption></figure>`, using only
  these classes, never color attributes:
  - fills and strokes: `o2` (oxygenated blood), `deo2` (deoxygenated blood), `symp`
    (sympathetic), `para` (parasympathetic), `aff` (afferent), `eff` (efferent), `hi` and `lo`
    (high and low compartments), `memb` (membrane), `shape` (neutral), `accent`
  - lines: `causes` (a "causes" arrow: solid, filled head) and `flows` (a "flows to" arrow:
    dashed, open head)
  - text: `lbl`, `lbl-sm`

  Put labels on the figure itself; there are no legends. Give every `<svg>` a `role="img"` and
  an `aria-label`.

## Questions (spec section 9)

- **Count and mix:** at least 15 per topic. Mix the types: `single`, `vignette`, `multi`, `order`,
  `missing`, `error`, `predict`, and `graph` or `image` where a figure exists.
- **Tags:** give every question `level` (recall, apply or analyze), `diff` (1–3), `core` (core
  concept ids) and, where it targets one, `misconception`.
- **Physiology topics:** at least 60% apply or analyze. Anatomy topics may be mostly recall.
- **Explanations:** `why.correct` explains the answer, and `why.options[i]` says why each option is
  right or wrong. Never say "option B", "the third choice" or anything positional: answer order
  is shuffled.
- **Quality rules** (the site already checks these across the whole bank):
  - Don't let the key be the longest option.
  - Don't make distractors wrong only because they say always, never, only or must.
  - Don't end distractors with a justifying clause (", because ...", ", since ...").
  - Vary which position the correct answer sits in.
- **Predict items:** `variables` with `up`, `down` or `none`, each with a short causal `why`.
  Level 1 = one step in one system; level 2 = multistep in one system; level 3 = across systems;
  level 4 = immediate change, then the state after compensation.

## Glossary (`data/glossary/<topic>.json`)

One entry per concept the topic teaches:

```json
{ "stroke-volume": { "def": "The volume of blood one ventricle pumps out in one beat: end-diastolic volume minus end-systolic volume.", "roots": [], "say": "" } }
```

`def` is one or two plain sentences and may only use words taught by this topic or earlier.
`roots` lists word parts as `[part, meaning]` pairs where they help. `say` is a pronunciation
for hard words. A definition must never be the only place a term is taught: the lesson or notes
teach it; the glossary summarizes.
