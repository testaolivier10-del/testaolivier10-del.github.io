# AP® Chemistry: Phase 0 dependency map

The map is `docs/apchem-dependency-map.json`. It is checked by
`node scripts/check-apchem-map.mjs --check` (library `scripts/lib/apchem-map.mjs`, tests
`scripts/test/apchem-map.test.mjs`); `--order` prints the course order. If this file and the JSON
disagree, the JSON is right. Unit and topic facts come from `docs/apchem-ced-map.json` (our own
words, from `docs/apchem-research/framework.md`); no CED text is reproduced. Open questions are in
`docs/apchem-needs-author.md`.

## Counts

| | |
|---|---|
| Chapters | 10: Units 1-9 (CED weights) and one skills chapter, "Math you need" |
| Topics | 96: the 91 CED topics in CED order, 5 math refresher topics |
| Concepts | 285, with about 1,130 terms and aliases |
| Pulled-forward short versions | 2 entries in `circularDependencies` |
| Preview boxes | 0 |
| Everyday words | 41 |
| Planned tools | 14 trainers/drills, 26 FRQ themes, 31 stimulus themes, 12 comparison tables, 9 pathways |

Concepts per chapter: Unit 1 61, Unit 2 39, Unit 3 48, Unit 4 30, Unit 5 21, Unit 6 16, Unit 7 15,
Unit 8 22, Unit 9 17, math 16. The later units carry fewer concepts because each concept there
names a family of terms (the 2024 CED's later topics reuse earlier vocabulary). Authors add a
concept to the map, with `taughtIn` and `dependsOn`, whenever a topic teaches a term the map does
not have; the check then holds every page to it.

## Format

As `docs/apbio-spec.md` section 4, with these differences:

- No `bigIdeas` (the 2024 CED removed them).
- `practices[]` carry `skills` (the CED's skill ids, e.g. `"5.F"`), `mcqWeight` and `frqWeight`.
  Practice 3 has `mcqWeight: [0, 0]`: it is free response only.
- A skill topic is placed with `before: "<topic id>"` (right before that topic) or
  `after: "<topic id>"` (right after), never both. The math refresher uses `before`, so it sits
  just ahead of the topic that first needs it.
- Stimulus themes may be `particle` (a particle diagram) as well as table, graph, setup, model.
- FRQ themes have type `Long` (10 points) or `Short` (4 points), the exam's two lengths.
- `REQUIRED_SIMULATORS` in `scripts/lib/apchem-map.mjs` lists the spec's trainers that must be
  planned in some unit: justification trainer, particle diagrams, ICE-table drills, buffer
  drills, titration curve reader.

Slugs and ids never contain the token "ap" (spec decision 2); the check also warns on the letters
"ap" inside a word (so "buffer-capacity" became `buffer-limits`).

## Course order

Units in CED order. The math refresher sits right before the topic that first needs it.

| Where | Order |
|---|---|
| Before 1.1 | *math-units* (dimensional analysis, prefixes, kelvin, density), *math-exponents*, *math-scientific-notation*, *math-sig-figs* |
| 1 Atomic Structure and Properties (7-9%) | 1.1 moles-molar-mass … 1.8 ionic-compounds-valence |
| 2 Compound Structure and Properties (7-9%) | 2.1 bond-types … 2.7 vsepr-hybridization |
| 3 Properties of Substances and Mixtures (18-22%) | 3.1 intermolecular-forces … 3.13 beer-lambert-law |
| 4 Chemical Reactions (7-9%) | 4.1 reactions-intro … 4.9 redox-reactions |
| 5 Kinetics (7-9%) | 5.1, 5.2, *math-logs* (ln and log), 5.3 concentration-time … 5.11 catalysis |
| 6 Thermochemistry (7-9%) | 6.1 endo-exothermic … 6.9 hess-law |
| 7 Equilibrium (7-9%) | 7.1 equilibrium-intro … 7.12 common-ion-effect |
| 8 Acids and Bases (11-15%) | 8.1 acids-bases-intro … 8.11 ph-and-solubility |
| 9 Thermodynamics and Electrochemistry (7-9%) | 9.1 entropy-intro … 9.11 electrolysis-faraday |

Logs come before 5.3 because the first-order integrated rate law is the first place the course
uses ln; pH (8.1) and ΔG° = −RT ln K (9.5) come later and depend on it. A skill topic publishes
with the chapter of its anchor topic (the four refreshers with Unit 1, logs with Unit 5).

## Pulled-forward short versions

| Short version | Taught in | Full treatment | Why |
|---|---|---|---|
| photon | 1.6 (PES) | 3.11-3.12 | PES knocks electrons out with light before the EM spectrum and E = hν are taught |
| dynamic equilibrium ("equilibrium") | 3.3 (vapor pressure) | 7.1 | vapor pressure and the pre-equilibrium step (5.9) need equal opposing rates before Unit 7 |

## Choices worth knowing

- The CED order places Coulomb's law in 1.5, so 1.2 (mass spectra) uses "ion" and "cation" from
  its own concepts: a mass spectrometer works on singly charged ions, taught there.
- Molality and colligative properties are not in the map (reported CED exclusion for 3.7,
  needs-author `ced-exclusions`). If the CED says otherwise, add them to 3.7.
- The Nernst equation is a concept of 9.10 with the CED's qualitative emphasis noted in the CED
  map; quantitative Nernst items wait for the exclusion check.
- Each unit's `tools` entry is a plan, not a promise of a page; `pages.json` `tools[]` is what is
  built.

## The ordering rule

As A&P and AP® Biology: no concept used before the topic that teaches it, except everyday words
and declared preview boxes (`<aside class="chem-preview" data-concept="…">` backed by a
`circularDependencies` entry with resolution `preview`). Pages declare their topic with
`<body data-topic>` (the generator writes it) or `<meta name="chem-topic">`; text inside
`.chem-preview` or `.chem-nav-ref` is exempt. Question files are read the same way (q, options,
stimulus, why).
