# AP® Chemistry authoring guide

Rules for writing AP® Chemistry topic content, adapted from `docs/apbio-authoring-guide.md`. They
come from `docs/apchem-spec.md`; where this guide and the spec differ, the spec wins. File formats
are in `docs/apchem-architecture.md` ("Content formats"). The research behind the rules is in
`docs/apchem-research/framework.md` (section 6 lists where students lose points).

## Before you write a topic

1. Find the topic in `docs/apchem-dependency-map.json`: its id, CED number, focus practices and the
   concepts it owns (`concepts[].taughtIn`). Read its entry in `docs/apchem-ced-map.json` for what
   the framework expects and what it excludes, and write it in your own words.
2. You may use anything taught in this topic or an earlier one in course order, plus the map's
   `everydayWords`; nothing taught later, except inside a declared preview box
   (`<aside class="chem-preview" data-concept="…">`, backed by a `circularDependencies` entry).
   If the topic needs a term the map does not have, add the concept to the map first.
3. Write `chem/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`,
   `glossary/<id>.json` (and `figures/<id>.json` with `chem/figures/<fig>.svg` for a new figure).
4. Run `node scripts/check-apchem-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-apchem-map.mjs --check`.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board
  questions (free-response or multiple choice), AP Classroom items, the CED's text or any
  textbook. Use the CED, the equations sheet and the Chief Reader Reports for scope and for the
  errors to target, never as item sources. Invent your own compounds, data and contexts.
- **No OpenStax.** No OpenStax text or figures, and never paste OpenStax into an AI tool (spec
  decision 4). Figures are our own SVGs.
- Write the mark as **"AP®"**, with the ®, and only as an adjective before a capitalized noun:
  "the AP® Chemistry exam". Never "AP" alone, never plural or possessive, never in a URL, id,
  file name or meta description. Prefer "the exam". The generator adds the disclaimer.

## Scope

- **Exclusions are not tested.** Nothing in a CED exclusion statement appears in an item, FRQ or
  as a required step: quantum numbers, aufbau-exception configurations, mass spectra of more than
  one element or of species other than singly charged monatomic ions, specific crystal
  structures, hybrid-orbital derivation, d-orbital hybridization, molecular orbital theory. Until
  `docs/apchem-needs-author.md` (ced-exclusions) is resolved, also leave out molality, percent by
  mass or volume of solutions and colligative properties (3.7), solubility-vs-pH calculations
  (8.11), electrode sign labels (9.8) and quantitative Nernst calculations (9.10). Notes may
  mention an excluded idea in a `going-further` aside, never as tested content.
- **In scope, and often skipped elsewhere:** PES, the Beer-Lambert law, the EM spectrum and photon
  energy, Coulomb's law reasoning.
- **Nothing used before it is taught**, including math: logs and ln are taught right before 5.3;
  before that, no item needs a logarithm.
- **The equations sheet is the student's reference.** Use its symbols and constants
  (R = 8.314 J/(mol·K) or 0.08206 L·atm/(mol·K), F = 96,485 C/mol e⁻, Kw = 1.0 × 10⁻¹⁴ at 25 °C,
  K = °C + 273.15). Give in the item anything the sheet does not have (reduction potentials,
  solubility data, Ka values).

## Level and voice

- High school, from scratch, for a student whose class moved too fast. Short sentences, active
  voice, "you". One idea per section; a concrete example first, then the rule; define each term
  the first time.
- **Particle level first.** Every macroscopic fact is explained by what the particles do.
- **Mechanisms, not purposes:** "the larger nuclear charge pulls the electrons closer", never
  "the atom wants a full octet".
- **Worked example before any calculation type** is asked, in `<div class="worked">`, with units
  carried through every line and the answer rounded once, at the end, to the right significant
  figures.
- Every lesson has a figure (our own SVG) and a numbered cause-and-effect chain, before the check
  questions.

## Questions

- Every item carries `unit`, `topic` and `practice` (a CED skill id like `"5.F"`) written by you.
  Practice 3 (representing data) is free response only; tag the MCQ skill the item actually
  exercises.
- **Four options** for single-answer items, as on the exam. Options similar in length (the key is
  the longest at most 40% of the time), no absolutes that give the answer away, no "all of the
  above".
- **Distractors are real misconceptions** (framework.md section 6), and each option's explanation
  names the misconception it represents and why it fails, by content, never by letter or position.
  For example: K changing with concentration; E° multiplied by a coefficient; not squaring [OH⁻]
  in Ksp; equivalence confused with half-equivalence; ln for log in Henderson-Hasselbalch; Kb
  where the conjugate acid's Ka belongs; molar mass alone for IMF strength; covalent bonds
  breaking on boiling; catalyst confused with intermediate; "disorder" for entropy; water's
  dipole pointing the wrong way at an ion.
- **At least 60% apply/analyze**, and at least 40% of a CED topic's items in **stimulus sets** of
  4-5 items sharing one table, graph, lab setup, model or particle diagram. Real-looking data with
  units on every column. Mathematical Routines is the largest share of the exam; Argumentation is
  a large part of free response.
- **Numeric items** (see `docs/apchem-architecture.md`, "Numeric"):
  - Give `sigfigs` for a measured result, `places` for a logarithm (pH, pKa: decimal places equal
    the significant figures of the concentration), `decimals` only for an exact count.
  - Set `askUnit: true` whenever choosing the unit is part of the skill (energy in J or kJ, R's
    units, molarity); otherwise state the unit in the stem.
  - The tolerance accepts honest rounding of intermediate steps only (at most two units in the
    last digit); the checker enforces it.
  - Add `mistakes` for the slips the readers report on that calculation, each with a one-line
    `why` that names the slip and the fix ("Value: you used ln instead of log in the
    Henderson-Hasselbalch equation."). The grader already catches factors of 1000, 273 and 2.303
    and a sign error on its own.
  - `why.correct` shows the full setup with units, and the rounding.
- **Particle-diagram items** (`kind: "particle"`): our own inline SVG with `role="img"` and an
  `aria-label` that says what each box shows, plus a visible key. Ask students to pick or count:
  ions in water with O toward cations and H toward anions; particle counts for K or Q; mixtures vs
  compounds; species present at each point of a titration; before-and-after for limiting
  reactant. Ratios in a diagram follow the formula or the coefficients exactly.
- Select-all: at most half of all options correct across the bank, never more than two thirds in
  one item, some with a single correct option. Predict: about a fifth "no change". No
  near-duplicates across topics.

## Justifications (CER) in explanations and FRQ rubrics

Every "explain" or "justify" answer is a claim, the evidence (a cited number or observation from
the stimulus), and particle-level reasoning. The sample answers and rubric lines model it:

- **Q vs K**, never rate language alone and never "K changes": "Adding NO₂ makes Q < K, so the
  net reaction goes forward until Q = K." K changes only with temperature.
- **Coulomb's law with both species** and the cause: "Mg²⁺ has the larger charge and the smaller
  radius than Na⁺, so the attraction to O²⁻ is greater …"; for atoms, number of protons, number of
  occupied shells (distance) and shielding, not "bigger atom" or molar mass alone.
- **IMF comparisons name the forces in both substances** and why one is stronger (polarizability,
  number of electrons, hydrogen bonding), and never break covalent bonds on a phase change.
- **Entropy at the particle level**: dispersal of matter and energy, more microstates, more
  gas particles; never "disorder".
- **Name the linear plot** when justifying a rate order ("ln[A] vs t is linear, so first order").
- **Lab procedures are precise**: named glassware (volumetric flask, buret, analytical balance),
  "dilute to the mark", rinse the buret with titrant, and the direction of an error's effect.
- E° is intensive; Faraday chains carry mol e⁻ per mol substance; a negative E°cell means an
  electrolytic cell.

## FRQs

Two lengths, as the exam: **long** (10 points; Q1-3 on the exam) and **short** (4 points; Q4-7).
One rubric line per point, each with the accepted wordings; a full-credit sample for every part;
task verbs in bold (Calculate, Explain, Justify, Identify, Determine, Draw). Calculation points
need the setup and the answer with correct units and significant figures. At least one long FRQ
per unit after Unit 2 uses lab data or a procedure; particle-diagram parts appear where the CED
puts them (3.8, 7.8, 8.5).

## Contested or uncertain science

Add it to `docs/apchem-needs-author.md` instead of guessing. Every unit gets an independent
accuracy check before it is published, with every numeric key recomputed by code.
