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

- **membrane-potential-origin** (open, 2.6). Most of the resting membrane potential comes from K⁺
  leaking out through open channels; the pump's 3:2 ratio adds only a few millivolts. Exam
  materials often say the pump "creates" the potential. Meanwhile: the pump builds the gradients
  and adds a little charge; the K⁺ leak makes most of the potential; a "For your exam" note says
  the short version is acceptable.
- **osmosis-mechanism** (open, 2.7). "Solutes bind water, so fewer free water molecules" is a
  common teaching picture (OpenStax uses it) but not the full physical account. Meanwhile: the
  free-water picture, no question hinges on the mechanism beyond direction.
- **endosymbiosis-host** (open, 2.10). Evidence suggests the host cell was related to archaea,
  and whether it already had a nucleus and endomembranes when it took in the mitochondrial
  ancestor is debated. Meanwhile: lessons say "an ancestral host cell" and draw it with a
  nucleus as a simplification; nothing is asked about the host's identity.

## Map content to confirm

- **map-enrichment** (open). Some examples the 2025 changes reportedly dropped or no longer
  name are kept in the map as enrichment: plasmodesmata (4.1), peppered moth (7.2), lac and trp
  operons by name (6.5, needed by the operon simulator), rubisco/RuBP/G3P (3.5; enzyme names
  are outside the exam beyond ATP synthase). Question writers must not treat them as required
  knowledge. Someone with the official CED should confirm.
