# AP® Biology: needs a person

Open questions, contested science and anything a human reviewer must confirm. Add to this file
instead of guessing. Each item: id, status (open / pending review / resolved), what, why, what the
course does meanwhile.

## Owner and policy

- **ced-verify** (open). apcentral.collegeboard.org is blocked from the build environment, so the
  topic map (`docs/apbio-dependency-map.json`) was built from secondary sources describing the
  fall 2025 CED. Someone with access should compare unit and topic titles and the exam format
  with the official CED. Meanwhile the course follows the cross-checked map.
  Specifically confirm: (1) topic titles and count (61: U1 7, U2 10, U3 6, U4 6, U5 5, U6 8,
  U7 12, U8 7; some pages still list 3.7 Fitness, which change reports say moved into 7.2);
  (2) science-practice weights (MCQ 25-33 / 16-24 / 8-14 / 8-14 / 8-14 / 20-26%, the 2019
  values; FRQ weights not found); (3) the paraphrased exclusions; (4) formula sheet contents;
  (5) stimulus set size (we use 4-5, as the owner asked); (6) long FRQ points (owner says 9,
  secondary sources say 8-10; we use 9); (7) exam date Monday 3 May 2027 (several schedules
  agree). Map summary with sources: `docs/apbio-ced-map.json`.
- **title-mark** (resolved 2026-10-03). Owner: use "AP® Biology", with the ®, in page titles
  (spec decision 3).
- **teacher-review** (open). No AP® Biology teacher has reviewed the course. Beta badge and note
  stay until one signs off.

- **tools-premium** (open). Spec: one simulator free, every simulator Premium. Osmosis is free and
  enzyme is Premium. The spec does not say whether the skills tools (stats practice, graph
  builder) and the design drills are Premium; they are free for now. Owner to decide.
- **design-drills-review** (open). The 8 design and argumentation scenarios
  (`bio/data/tools/design-drills.json`) are placeholder content: a biology teacher should review
  the scenarios, the best control in each, and the claim/evidence/reasoning tags (graders differ
  on whether a general-principle sentence counts as reasoning). The page shows a Draft note until
  `status` becomes "reviewed".
- **tool-topic-ids** (open). The tools are tagged with the draft map's topic ids (`_shared.mjs`
  `PLACEHOLDER_TOPICS`); when the final map lands, re-tag any id it renames.

## Contested science

- **ci-overlap-rule** (pending review). The confidence-interval tool teaches the course rule of
  thumb: ±2 SE bars that do not overlap → the difference is likely significant; overlapping →
  not shown to be significant. Strictly, slightly overlapping 95% CIs can still differ at
  p < 0.05. The tool says so, and its problems avoid bars that nearly touch (`ciBorderline`).
- **graph-line-vs-scatter** (pending review). For means at set values of a continuous
  independent variable the graph builder prefers a line graph but also accepts a scatter plot
  (`alsoAccept`), with a note, since many rubrics take either; for measured individuals only a
  scatter plot counts. A teacher should confirm.
- **ci-wording** (pending review). The tools describe a 95% CI as "the range that very likely
  contains the true mean": fine at this level, not the strict frequentist meaning.
- **water-heating-hydrogen-bonds** (pending review). The water/oil drill explains water's high
  specific heat as heat going into breaking hydrogen bonds before molecules speed up: the
  textbook explanation, a simplification of the physics.
- **chi-square-df3** (resolved 2026-10-03). The critical value for df 3 at p = 0.05 is 7.82 as
  printed on the formula sheet (exact 7.815); the tool accepts 7.81 and 7.82.
- Independent accuracy review (2026-10-03) of both simulators and every skills tool: numbers,
  formulas, tables and fixed answers recomputed and correct apart from df 3 (fixed); wording
  fixes applied (red blood cell swelling, lysis threshold, potato gradient, control definitions,
  salivary amylase, snapdragon notation, the n − 1 reason). Design drills stay placeholder until
  a teacher reviews them (design-drills-review).
- **osmosis-model-numbers** (pending review). The osmosis simulator's potato numbers (cell sap
  0.33 osmol/L, 45% non-water mass, wall modulus 15 bar) and red blood cell lysis at 1.55× volume
  are illustrative (lysis is tested on mass, which tracks volume here), chosen to give lab-like curves (zero crossing ≈ 0.30 M sucrose at 22 °C,
  hemolysis near 0.46% NaCl). NaCl is treated as i = 2 (real ≈ 1.9); the page says so.
- **enzyme-model** (pending review). Temperature and pH scale Vmax only (not Km); denaturation is
  modeled as instant and reversible. Both simplifications are stated on the page.
