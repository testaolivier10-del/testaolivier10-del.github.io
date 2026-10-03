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

## Contested science

Raised by the Phase 0 map review (2026-10-03, `docs/apbio-phase0.md`). Each is open until a
person decides; lessons follow the "meanwhile" line.

- **ci-overlap** (open). Non-overlapping 95% CI error bars imply a difference at p < 0.05, but
  overlapping bars do not prove there is none, and "±2 SE" approximates a 95% CI only for large
  samples. AP materials state the overlap rule more strongly than statistics texts. Meanwhile:
  teach "no overlap: likely a real difference; overlap: the data do not show a difference",
  never "overlap proves no difference" (`overlap-rule`, `significance`).
- **atp-yield** (open). Older texts give 36-38 ATP per glucose; current estimates are about
  30-32, and OpenStax 7.4 says the yield varies. Meanwhile: "about 30-32 ATP", with a note that
  older sources say 36-38; no question hinges on the exact number (`atp-yield`).
- **ten-percent-rule** (open). Real trophic transfer efficiencies run about 5-20%. Meanwhile:
  "roughly 10%, varying by ecosystem"; calculations state the efficiency they use
  (`trophic-efficiency`).
- **diversity-stability** (open). The CED says more diverse ecosystems are more stable and
  recover faster; ecologists still debate how general this is. Meanwhile: teach the CED claim
  as a tendency, with evidence, not a law (`ecosystem-stability`).
- **photolysis** (open). Water is split by the oxygen-evolving complex, driven by oxidized
  P680, not by light directly; "photolysis" is common in AP materials but imprecise.
  Meanwhile: "water splitting at photosystem II" as the main term, "photolysis" as an alias.
- **noncompetitive-inhibition** (open). The AP sense ("binds elsewhere, changes the active
  site") covers pure noncompetitive and allosteric/mixed inhibition, which biochemistry texts
  separate. Meanwhile: the AP sense; allosteric regulation is its own concept.
- **organelle-inheritance** (open). Mitochondria and plastids are usually inherited from one
  parent, but plastids are paternal in many gymnosperms and biparental in some plants, and
  paternal mtDNA leakage occurs. Meanwhile: "usually from one parent (in humans, the mother)"
  (`nonnuclear`).
- **ethylene-feedback** (open). Ethylene ripening is positive feedback only in climacteric
  fruit. Meanwhile: say "in fruits such as apples and bananas" (`ethylene`).
- **prokaryote-grouping** (open). "Prokaryote" is not a clade; some curricula avoid grouping
  archaea with bacteria. Meanwhile: "prokaryote" as a cell type (no nucleus), with the three
  domains taught in 7.7.
- **membrane-infolding** (open). Infolding of the plasma membrane as the origin of the
  endomembrane system is a hypothesis, and its timing relative to mitochondrial endosymbiosis is
  debated. Meanwhile: present it as a hypothesis (`membrane-infolding`).
- **extinction-placement** (open). The 2025 CED reportedly dropped the Extinction topic; the map
  teaches extinction in 7.6 (needed by fossils, trees and adaptive radiation). Confirm with the
  official CED (see ced-verify).
- **hw-chi-square-df** (open). A chi-square test of genotype counts against Hardy-Weinberg
  expectations has 3 − 1 = 2 df by the usual goodness-of-fit rule, but 1 df when p is estimated
  from the same sample (statistics texts). Course materials differ. Meanwhile:
  `stats-hardy-weinberg` explains both and its data are chosen so both give the same decision
  (χ² = 11.6), with a "For your exam" box; no item hinges on the choice.
- **ci-two-se** (open). The skills topics use 95% CI ≈ x̄ ± 2SE, as exam materials do; for small
  samples (n = 4-9 in our items) the exact t multiplier is 2.3-3.2, so true intervals are wider.
  Meanwhile: the notes say "the exam uses 2" once (`stats-confidence-intervals`); items use 2SE.
- **nacl-ionization** (open). Items use i = 2 for NaCl and i = 3 for CaCl₂ (formula-sheet
  convention); real solutions ionize slightly less than completely. Meanwhile: the notes call it a
  convenient approximation (`stats-water-potential`).

## Map content to confirm

- **map-enrichment** (open). Some examples the 2025 changes reportedly dropped or no longer
  name are kept in the map as enrichment: plasmodesmata (4.1), peppered moth (7.2), lac and trp
  operons by name (6.5, needed by the operon simulator), rubisco/RuBP/G3P (3.5; enzyme names
  are outside the exam beyond ATP synthase). Question writers must not treat them as required
  knowledge. Someone with the official CED should confirm.
