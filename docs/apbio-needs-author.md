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
- **teacher-access** (open). The repo has no instructor request flow, so `bio/teachers.html` says
  "Teachers can ask for free access to the rest of the course: email hello@levlprep.com from your
  school address." The owner should confirm that offer (and how access is granted: a coupon, a
  Polar discount, a manual pass) or have the sentence changed.
- **class-discount** (open). No student or class discount exists (`assets/premium.js` has only the
  founding-member offer, 30% off for everyone until 2027-01-31, and `docs/premium.md` lists no
  other). The teachers page says "Ask about discounts for classes" at hello@levlprep.com. Decide
  whether there is one.
- **privacy-schools** (resolved 2026-10-03). `privacy.html#schools` exists (spec decision 20);
  its legal follow-ups are under "Legal and launch" below.
- **frq-gating** (open). The spec puts "all FRQs" in Premium. The FRQ pages gate the workspace
  (rubric, self-scoring) the way lessons are gated: free in Units 1 and 2, Premium elsewhere; the
  prompt and the printable sheet stay open everywhere so teachers can assign them. Confirm.
- **readiness-band** (open). The practice exam's readiness band (1-5) weights MCQ 60% and FRQ 40%
  and uses cut-offs 75/60/45/30% of the composite. It is labelled "Not calibrated: a rough guide,
  not a predicted score." Replace with better cut-offs if a teacher can suggest them.
- **teacher-review** (open). No AP® Biology teacher has reviewed the course. Beta badge and note
  stay until one signs off.

- **tools-premium** (open). Spec: one simulator free, every simulator Premium. Osmosis is free and
  enzyme is Premium. The spec does not say whether the skills tools (stats practice, graph
  builder) and the design drills are Premium; they are free for now. Owner to decide.
- **design-drills-review** (open). The 16 design and argumentation scenarios
  (`bio/data/tools/design-drills.json`, two per unit, written 2026-10-03) replaced the placeholder
  set and are live (no Draft note), but a biology teacher should still review them: the data are
  invented but meant to be realistic (worth checking: the vestigial-wing temperature effect, the
  Himalayan rabbit thresholds, digoxin uptake numbers, the woodlice kinesis account), the "best
  control" in each (several are deliberately plausible), the claim/evidence/reasoning tags
  (graders differ on whether a general-principle sentence or a statistical test counts as
  evidence or reasoning), and the written-answer rubrics. Reviewed 2026-10-03 (docs/apbio-reviews/drills.md):
  five fixes (desiccation design now has two shared generations; wording in antibiotic, rabbit and respirometer
  items); still for a teacher: rabbit thresholds, the Elodea green-light rate (29% of red, low against leaf action
  spectra), the woodlice turning-rate direction and the χ² evidence tag.
- **tool-topic-ids** (open). The tools are tagged with the draft map's topic ids (`_shared.mjs`
  `PLACEHOLDER_TOPICS`); when the final map lands, re-tag any id it renames.

- **openstax-licence** (open, owner, before Premium launch). openstax.org now shows *Biology 2e*
  and *Anatomy and Physiology 2e* under CC BY-NC-SA 4.0 (non-commercial, share-alike) with "may not
  be used in the training of large language models or otherwise be ingested into large language
  models or generative AI offerings without OpenStax's prior written permission". (1) The AP®
  Biology course reproduces no OpenStax text or figure (spec decision 24). Its build helpers did
  fetch OpenStax sections into an AI model to fact-check Units 1-5; decide whether to ask OpenStax
  about that, and no helper does it any more. (2) The A&P course uses OpenStax figures credited as
  CC BY 4.0 on a site that sells Premium. CC licences cannot be revoked for copies obtained while
  CC BY applied, so check when the figures were downloaded (and keep evidence of the licence then),
  or replace them / ask OpenStax. Meanwhile nothing changes in the A&P course.

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
- **metabolic-scaling** (open). Topic 2.2 explains the higher metabolic rate per gram of small
  endotherms by heat loss through a larger surface area-to-volume ratio, the framing the CED uses.
  Physiologists still debate why metabolic rate scales with body mass to about the 3/4 power
  (Kleiber's law) rather than the 2/3 the surface rule predicts, and ectotherms show a similar
  pattern. Meanwhile: the surface-area explanation as the main reason, with no claim that it is
  the whole story; no question asks for a scaling exponent (`metabolic-rate`, `heat-exchange`).
- **permeability-values** (open). The 2.4 bilayer permeability table (stimulus and notes) gives
  values rounded to the nearest power of ten from published synthetic-bilayer measurements, which
  vary between studies by up to an order of magnitude (Na⁺ is reported from about 10⁻¹² to 10⁻¹⁴
  cm/s). Meanwhile: values are labelled approximate, and items use only the ordering and
  powers-of-ten differences (`simple-diffusion`, `selective-permeability`).
- **organelle-outer-membrane** (open, 2.10; review u2b). OpenStax 23.1 and most AP materials say
  the outer membrane of mitochondria and chloroplasts came from the host membrane that engulfed
  the bacterium. Alphaproteobacteria and cyanobacteria have two membranes of their own, and the
  organelles' outer-membrane import proteins (Tom40/Sam50, Toc75) are related to bacterial
  outer-membrane proteins, so many researchers now trace the outer membrane to the bacterium.
  Meanwhile: the engulfing model is taught and asked "according to the model"; the notes add one
  hedging sentence and no longer list "two membranes because the bacterium had two" as a mistake.
- **mitoribosome-size** (open, 2.10; review u2b). Bacterial and chloroplast ribosomes are 70 S;
  mitochondrial ribosomes vary (about 55 S in mammals, about 78 S in plants). Exams usually say
  "70 S". Meanwhile: notes say "built like bacterial 70 S ribosomes" with the variation noted;
  the stimulus table (plant mitochondria, "70 to 78") and the FRQ model (the bacterium's 70 S
  ribosomes) are left as they are.
- **ion-accumulation-active** (open, 2.5; raised by the Unit 2 review, `docs/apbio-reviews/u2a.md`).
  Topic 2.5 and `frq-root-potassium` infer active transport from K⁺ held at a higher
  concentration inside than outside ("diffusion alone could never do that"). For ions this is
  only strictly true for the electrochemical gradient: a root cell's membrane potential (about
  −120 to −200 mV) can pull K⁺ in passively through channels to 100-fold or more (Nernst), and real
  roots in millimolar K⁺ do take much of it up that way. The exam frames uptake against a
  concentration gradient as active. Meanwhile: the concentration-gradient framing; the FRQ sample
  also cites the ATP (nitrogen) result as evidence (`bio-membrane-transport-14`, `-15`, notes,
  `frq-root-potassium` part d). Decide whether to add a "For your exam" note or raise the ratios.
- **cholesterol-cold** (open, 2.3). `bio-plasma-membrane-5` keys "extra cholesterol gives somewhat
  more mixing at 15 °C" from the textbook fluidity-buffer model. In real mammalian membranes,
  which already hold 30-40% cholesterol, loading more cholesterol usually slows protein
  diffusion at any temperature; the buffer effect is clearest against a cholesterol-free bilayer.
  Meanwhile: keyed to the textbook model, which the exam uses.
- **aquaporin-gases** (open, 2.4, low priority). Some aquaporins (e.g. AQP1) have been reported to
  pass CO₂, a claim still disputed. `bio-membrane-permeability-18` keys CO₂ crossing as "no
  change" when aquaporins are blocked. Meanwhile: as keyed (most CO₂ crosses the bilayer).
- **cyanide-gradient-skills** (same point as cyanide-gradient below, for the skills item) (open, low priority; review `docs/apbio-reviews/skills.md`).
  `bio-design-prediction-mechanism-1` keys the H⁺ gradient "down" in cyanide-treated cells that
  can ferment. In intact cells ATP synthase can run in reverse, using glycolytic ATP to pump H⁺
  and hold much of the gradient, so the real fall can be partial. The exam's model (gradient
  runs down, ATP synthase makes less ATP) is what is keyed; ATP made by ATP synthase falls either
  way. Meanwhile: as keyed.
Raised while writing Unit 3 (2026-10-03, branch `claude/apbio-u3`):

- **induced-fit-models** (open). Biochemistry now often describes binding as conformational
  selection (the enzyme already samples the closed shape) as well as induced fit. The exam and
  OpenStax 6.5 use induced fit refining lock-and-key. Meanwhile: induced fit only
  (`enzyme-structure`).
- **optimum-depends-on-assay** (open). A measured optimal temperature depends on how long the
  assay runs, because denaturation takes time. The course mentions this in a going-further box
  and in one data item (`bio-enzyme-environment-24`); exam items treat the optimum as a fixed
  property. Meanwhile: questions give the data and never ask for a "true" optimum.
- **atp-turnover** (open). "About 50 g of ATP in the body, about 50 kg (roughly body mass)
  hydrolyzed per day" is a widely quoted order-of-magnitude estimate; published figures vary.
  Used in the 3.4 hook, notes and `bio-cellular-energy-18` (which asks only for the ratio).
- **calvin-dark** (open). "Light-independent reactions" is kept as an alias of the Calvin cycle,
  and the course stresses that it stops in the dark (several Calvin enzymes are also
  light-activated, which the course does not teach). "Dark reactions" is not used.
- **oxygenic-origin-date** (open). The notes say oxygenic photosynthesis arose in cyanobacteria
  "more than 2.4 billion years ago" (the Great Oxidation Event); when it first evolved is
  debated (estimates run to 3 billion years or more). No question asks for a date.
- **dcmu-water-splitting** (open). `bio-photosynthesis-8` keys "O₂ release stops" when DCMU
  blocks electrons leaving photosystem II. Strictly, PSII can turn over a few times before
  water oxidation halts; over minutes the statement holds. A reviewer should confirm the
  wording.
Raised while writing Unit 1 (2026-10-03, branch `claude/apbio-u1`):

- **gc-stability** (open). Exam materials explain why G–C-rich DNA separates at higher
  temperature by "three hydrogen bonds versus two"; biophysics finds base stacking contributes at
  least as much. Meanwhile: the hydrogen-bond answer is keyed, with a going-further box and a
  "For your exam" line in the Nucleic Acids notes (`complementary-base-pairing`).
- **xylem-capillarity** (open). Many AP-style sources say adhesion/capillary action lifts water
  up xylem; capillarity alone lifts it only centimeters, and the cohesion-tension pull from
  transpiration does the work in tall plants. Meanwhile: Water notes teach the transpiration pull
  through a cohesive column, adhesion as helping hold the column; no item keys capillarity as
  the main mechanism (`capillary-action`, `transpiration`).
- **activated-monomers** (open). Dehydration synthesis is the exam's model for building every
  polymer, but in cells nucleotides arrive as triphosphates (releasing pyrophosphate) and amino
  acids are attached to carriers first. Meanwhile: the dehydration model throughout, with a
  going-further note in Introduction to Macromolecules (`dehydration-synthesis`).
- **glycogen-branching** (open). "More branches give more ends for fast glucose release" is the
  textbook advantage of glycogen; the carbohydrate stimulus deliberately does not claim branching
  explains its (invented) amylase data. The Unit 1 model FRQ (frq-starch-cellulose-model, part d)
  accepts the textbook answer. Confirm this is what the exam expects.
- **lipid-macromolecule** (open). The CED says lipids are not polymers; some texts still call
  large lipids macromolecules. Meanwhile: "large molecules but not polymers".
- **termite-cellulase** (open; Unit 1 review, 2026-10-03). Textbooks (OpenStax 3.2 included)
  credit termites' cellulose digestion to gut microbes, but termites also secrete some cellulase
  of their own, and the share varies between termite groups. Meanwhile: "mainly because of gut
  microbes" (Carbohydrates notes, lesson misconception, `bio-carbohydrates-5`, whose stem already
  says termites make a little enzyme themselves). Confirm the wording.
  wording. (Unit 3 review, `docs/apbio-reviews/u3.md`: holds for the 20-minute assay; kept.)
- **action-spectrum-green** (open, 3.5; review u3). Extracted-pigment spectra and thin algal
  suspensions show a deep green dip, but whole leaves absorb much of the green light that
  reaches them and use it fairly well (McCree-type leaf action spectra give roughly 65-75% of the
  peak rate per photon near 550 nm). `photosynthesis-s1` now says its action spectrum came from a
  thin suspension of green algae, and `bio-photosynthesis-3` grows algal cultures, not plants.
  The notes still say the action spectrum is "lowest in green", which is true but larger in
  algae than in leaves. Meanwhile: as changed; decide whether the notes need a hedge.
- **dcpip-entry-point** (open, 3.5; review u3). DCPIP mostly takes electrons from the
  plastoquinone/cytochrome part of the chain, before photosystem I, not from the end of the
  chain. AP lab materials say it stands in for NADP⁺, and `bio-photosynthesis-6` and `-9` use
  that framing. Meanwhile: the lab framing; no item depends on where exactly DCPIP is reduced.
- **cyanide-gradient** (open, 3.6; review u3). In intact cells after cyanide, ATP synthase can
  run backward, using ATP from glycolysis to hold part of the H⁺ gradient. `bio-cellular-respiration-22`
  keys the intermembrane H⁺ concentration as "down", which is right in direction. Meanwhile: as
  keyed.
- **mitosis-phase-names** (open, 4.5; Unit 4 authoring). The 2019 framework said students would not
  be asked to name or memorize the phases of mitosis; the 2025 wording is unconfirmed (ced-verify).
  Meanwhile: `cell-cycle` teaches the names (with prometaphase) and the order of events, with a
  "For your exam" box; items test events and reasoning, and only `bio-cell-cycle-20` (an ordering
  item phrased by events) and a few options use the names.
- **checkpoint-count** (open, 4.6). Texts differ: G1 checkpoint or restriction point (START in
  yeast); G2 or G2/M; M, metaphase or spindle-assembly checkpoint; some add an intra-S checkpoint
  and put the DNA-damage checks at several points. Meanwhile: three main checkpoints (G1: size,
  growth signals, DNA damage; G2: DNA fully copied and undamaged; M: every kinetochore attached),
  with a "For your exam" box.
- **phase-time-from-fraction** (open, 4.5). Estimating time in a phase as (fraction of cells in
  it) × (cycle length) assumes an even spread of cell ages; in a steadily growing population young
  cells are over-represented, so the estimate is approximate. `bio-cell-cycle-3` states the
  assumption in its stimulus. Confirm that this is the framing the exam uses.
- **steroid-receptor-location** (open, 4.2). Some intracellular receptors wait in the cytoplasm
  (glucocorticoid), others sit in the nucleus (estrogen, mostly); texts say one or the other.
  Meanwhile: "in the cytoplasm or nucleus", with a "For your exam" box; `bio-signal-transduction-intro-19`
  and the 4.2 figure use a cytoplasmic receptor.
- **synaptic-classification** (open, 4.1). OpenStax lists synaptic signaling as its own category;
  the framework groups neurotransmitters with local signaling. Meanwhile: four ranges taught, with
  synaptic grouped under short-distance (local) signaling and a "For your exam" box. Review u4: the 2019 framework also listed quorum sensing among its local-regulator
  examples; the notes present it as the bacterial example without assigning a range, which is compatible.
- **amplification-numbers** (open, 4.3). The rough molecule counts in the `gpcr-camp-cascade`
  figure (1, ~10², ~10⁴, ~10⁴, ~10⁵, ~10⁶, ~10⁸) are the orders of magnitude long used in
  textbooks to illustrate amplification, not measurements; the figure says "rough sizes". Confirm
  they are acceptable or replace with a qualitative column.
- **type-2-mechanism** (open, 4.4). Type 2 diabetes is taught as target cells responding weakly to
  insulin (insulin resistance), with beta cells later failing; items do not attribute it to
  "fewer receptors". Real type 2 also involves raised glucagon and liver glucose output, which
  the items leave out. Meanwhile: as taught.
- **cholera-toxin-chemistry** (open, 4.3). Cholera toxin ADP-ribosylates the Gs alpha subunit,
  blocking its GTPase. Lessons and items say it "changes the G protein so it cannot hydrolyze
  GTP", which is accurate without the chemistry. Confirm the simplification.
- **pertussis-lock** (open; Unit 4 simulator `signal-transduction-amplification`). Pertussis
  toxin locks the *inhibitory* G protein (Gi) in its GDP-bound form, which raises cAMP; the
  simulator's "G protein locked off" applies that kind of lock to the stimulatory G protein and its
  box says so. Meanwhile: as written; confirm students will not read it as "pertussis lowers cAMP".
- **cholera-mechanism** (open; same simulator). OpenStax 9.1 says cholera toxin modifies "a
  G-protein that controls the opening of a chloride channel"; the fuller path is Gs → adenylyl
  cyclase → cAMP → PKA → CFTR chloride channel. The simulator uses the fuller path. Meanwhile:
  fuller path; no item depends on the difference.
- **rb-regulation** (open; `cell-cycle-checkpoints`). OpenStax 10.3 says Rb "largely monitors cell
  size" and is phosphorylated as the cell grows; most texts tie Rb phosphorylation to growth-factor
  signaling through cyclin D–CDK. The simulator uses the growth-factor path (stated in its box).
- **p53-loss-scope** (open; same simulator). OpenStax 10.4 says without functional p53 the cell
  "proceeds directly from G1 to S regardless of internal and external conditions". The model's p53
  loss removes only the DNA-damage holds and apoptosis; cells still need growth factor (or another
  mutation). The model also keeps the p53 G1 hold working in Rb-null cells, though Rb loss weakens
  it in real cells (box says so). Meanwhile: as modeled.
- **2n-4n-labels** (open; same simulator). The DNA histogram is labeled by DNA amount (G1 = 2
  units, G2/M = 4) because a G2 cell is still 2n; many AP® materials call the peaks "2n" and
  "4n". The box mentions both. Confirm the labeling.
- **sim-parameters** (open; both Unit 4 simulators). Molecule counts, rate constants, repair (25%
  per h), apoptosis (5% per h) and G2 escape without p53 (50% per h) are illustrative, not
  measured; phase lengths follow OpenStax 10.3 (G1 9 h, S 10 h, G2 4.5 h, M 0.5 h). Both boxes
  say the numbers are made up in realistic proportions.
- **meiosis-2n-lineups** (open; Unit 5 simulator `meiosis-nondisjunction`). OpenStax 11.1 says the
  number of possible metaphase I alignments is 2<sup>n</sup>. Strictly, mirror-image line-ups give
  the same pair of gamete sets, so there are 2<sup>n−1</sup> distinct line-ups and 2<sup>n</sup>
  distinct gametes. Meanwhile: the tool counts 2<sup>n</sup> *gametes* (and its box notes the
  mirror line-ups); confirm the wording for lessons.
- **meiosis-model-simplifications** (open; same simulator). One crossover per pair at a fixed
  point between the two inner nonsister chromatids; meiosis I nondisjunction always sends both
  homologs to cell 1; meiosis II sends sister chromatid 1 to the first gamete (Try every line-up
  also tries the other arrangements); one nondisjunction at a time; no sex chromosomes; every
  chromatid counts as equal DNA. So with crossing over the model's gamete count (4<sup>n</sup>
  over all line-ups) is far below real meiosis. The box states each rule. Confirm acceptable.

- **trisomy21-origin-numbers** (open, 5.2; Unit 5 authoring). `meiosis-genetic-diversity-s1` uses approximate
  rates of trisomy 21 births by maternal age (6, 8, 11, 26, 91, 333 per 10,000 at 20-45, rounded from the
  widely cited Hook-type tables) and "about 90% of extra copies from the egg, mostly meiosis I". Values vary by
  survey and era; confirm they are acceptable as "approximate".
- **centromere-marker-method** (open, 5.2; FRQ `frq-nondisjunction-meiosis`). Items infer meiosis I vs II from
  DNA types near the centromere (different maternal types = MI, identical = MII), stating that crossing over
  "almost never" happens there. Real studies add caveats (crossovers can occur near some centromeres; mitotic
  errors after fertilization). Meanwhile: as stated in the stimuli.
- **tsd-values** (open, 5.5). The turtle sex-ratio curve (0% female at 26 °C to 100% at 32 °C, pivotal about
  29 °C) is typical of species such as red-eared sliders, not one data set; crocodilians and some turtles show
  other patterns (females at both extremes). The figure credit and stimulus say so.
- **hydrangea-mechanism** (open, 5.5). Blue = aluminum taken up from acidic soil binding the anthocyanin
  pigment (with co-pigments, in cultivars that respond); pink in neutral soil. Simplified, and the pH ranges
  in `environment-phenotype-s1` are illustrative. Meanwhile: as taught, matching the framework's example.
- **fast-plant-linkage** (open; FRQ `frq-dihybrid-chi-square`). The mustard (Fast Plants-style) stem-color and
  leaf-color genes are presented as unlinked and the hairs gene as linked about 14 map units from stem color;
  the experiment 2 data are invented to fit that distance and are not claims about real Brassica rapa
  chromosomes. The stimulus does not name real loci.
- **mito-paternal** (open, 5.4). "An affected father, as a rule, passes a mitochondrial condition to none of his
  children" (notes, `bio-non-mendelian-genetics-14`); rare paternal leakage exists (see organelle-inheritance).

- **u6-illustrative-data** (open, Unit 6 authoring). Several stimuli use invented data in realistic proportions,
  stated as such or as "approximate": the error rates in `dna-replication-s3` (10⁻¹⁰ normal, 10⁻⁸ without proofreading,
  10⁻⁷ without mismatch repair, 10⁻⁵ without both; real mutator strains vary by about an order of magnitude), the
  Okazaki pulse data in `dna-replication-s2` (about half the label in short pieces at 5 s; in Okazaki's real experiments
  most early label was in short pieces, partly because of uracil excision repair), the α-amanitin fractions in
  `transcription-rna-processing-s3`, and the Bicoid gradient in `cell-specialization-s3` (an exponential model, length
  constant 25% of the egg; real embryos shift the hunchback boundary less, roughly 5-10% of egg length per doubling of
  bicoid dose). Confirm acceptable.
- **lac-glucose-mechanism** (open, 6.5 and `frq-operon-sugars`). The glucose effect on the lac operon is taught through
  cAMP-CAP only (low cAMP, no activation). Inducer exclusion (glucose transport blocking lactose uptake) also contributes
  and is the larger effect in some studies. For your exam: the cAMP-CAP explanation is the one expected; items avoid
  keying anything that inducer exclusion would contradict. The lac and trp operons are used by name although the 2025
  framework reportedly no longer names them (see map-enrichment); every item describes the operon in its stimulus.
- **lens-induction** (open, 6.6, `bio-cell-specialization-19`). The optic-cup transplant and filter result are the
  classic textbook account; lens induction actually involves several earlier signals, and transplant results differ by
  species. Kept as a simplified example of induction by a diffusing signal.
- **trpR-autoregulation** (open, 6.5; review u6). The trp repressor also represses its own gene, *trpR*, so
  tryptophan lowers repressor synthesis a few-fold. The course says the repressor is "made" and activated by
  tryptophan without mentioning this; the predict item `bio-gene-regulation-16` no longer keys "repressor made:
  no change" (that variable was replaced). Outside the framework; no item depends on it now.
- **lens-induction-species** (open, 6.6; review u6). The flank-transplant result comes from some frog species
  (not all), and the filter (transfilter) result from chick and mouse work, so `bio-cell-specialization-19` now
  says "some vertebrate embryos" instead of "a frog embryo". Keep or simplify further.
- **trp-attenuation** (open, 6.5). Attenuation of the trp operon is not taught; the operon is presented as controlled by
  the repressor alone. Outside the framework; flag if a teacher wants it as going-further.
- **lac-catabolite-mechanism** (open; Unit 6 simulator `operons`). OpenStax 16.2 explains the glucose
  effect only through cAMP and CAP (its Table 16.2: glucose + lactose gives "some" transcription). In
  *E. coli* much of the glucose effect is inducer exclusion (glucose transport inhibits the lactose
  permease, so less allolactose forms), and the cAMP story is debated. Meanwhile: the tool follows the
  CAP–cAMP account and sets "repressor off, no CAP" at 10% of full; confirm.
- **lacz-allolactose** (open; same simulator). Lactose becomes allolactose only through β-galactosidase,
  so a cell with no working *lacZ* cannot be induced by lactose (labs use IPTG). Many AP-style items
  treat *lacZ*⁻ + lactose as "mRNA made, no enzyme". Meanwhile: the model treats lactose as giving
  allolactose in every cell, and the box says so; no question depends on it. Also ignored: the
  permease (*lacY*), polar effects of *lacZ* mutations, and trp attenuation.
- **repressor-blocks-polymerase** (open; same simulator). OpenStax says the bound repressor keeps RNA
  polymerase from binding the promoter; for lac, the repressor and polymerase can bind together and
  the repressor mainly blocks initiation. Meanwhile: the tool says the repressor "blocks RNA
  polymerase" and draws the polymerase off the DNA; confirm the wording.
- **operon-parameters** (open; same simulator). Rates 1 / 10 / 100, mRNA half-life 2 min, enzymes
  diluted by growth with a 40-min doubling, instant input changes and one F′ copy are illustrative
  choices, not measurements; the merodiploid mode is marked "going further" as beyond the course.
- **openstax-license** (open, owner). The OpenStax *Biology 2e* page fetched on 2026-10-03 shows a
  CC BY-NC-SA notice and a no-AI-ingestion line, while the course credits OpenStax figures as CC BY 4.0.
  Check which license applies to the figures already used before launch. The operons tool uses no
  OpenStax text or figures.

## Map content to confirm

- **map-enrichment** (open). Some examples the 2025 changes reportedly dropped or no longer
  name are kept in the map as enrichment: plasmodesmata (4.1), peppered moth (7.2), lac and trp
  operons by name (6.5, needed by the operon simulator), rubisco/RuBP/G3P (3.5; enzyme names
  are outside the exam beyond ATP synthase). Question writers must not treat them as required
  knowledge. Someone with the official CED should confirm.
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
  salivary amylase, snapdragon notation, the n − 1 reason). Design drills were replaced by the
  real set on 2026-10-03; a teacher review is still open (design-drills-review).
- **osmosis-model-numbers** (pending review). The osmosis simulator's potato numbers (cell sap
  0.33 osmol/L, 45% non-water mass, wall modulus 15 bar) and red blood cell lysis at 1.55× volume
  are illustrative (lysis is tested on mass, which tracks volume here), chosen to give lab-like curves (zero crossing ≈ 0.30 M sucrose at 22 °C,
  hemolysis near 0.46% NaCl). NaCl is treated as i = 2 (real ≈ 1.9); the page says so.
- **enzyme-model** (pending review). Temperature and pH scale Vmax only (not Km); denaturation is
  modeled as instant and reversible. Both simplifications are stated on the page.

## Legal and launch (site registration, 2026-10-03)

- **minor-buyers** (open). terms.html lets someone under 18 buy with a parent or guardian's
  permission (the parent accepts the terms; under 16 the parent should buy, Polar's rule), and the
  dialog and premium.html now say so. A lawyer should confirm that this is enough for a course
  sold to high-school students (contract capacity, Polar's buyer terms, refunds to a parent).
  Meanwhile the existing terms stand, unweakened.
- **student-privacy-laws** (open). A site marketed to teachers for a high-school course may be an
  "operator" under student-privacy laws such as California's SOPIPA and similar state laws. The
  site already does what those require as far as we know (no targeted ads, no profiling, no
  selling, deletion on request), and privacy.html#schools says so. A lawyer should confirm, and
  confirm the 30-day deletion promise to schools.
- **ndpa** (open). privacy.html#schools says LevlPrep is willing to sign the SDPC National Data
  Privacy Agreement (the brief asked for it). The owner should confirm before a district asks;
  the NDPA has security and breach-notice terms to check.
- **retention-unknowns** (open). Not knowable from the code: Umami Cloud's retention of
  analytics, Supabase backups (how long a deleted account survives in a backup), Resend's
  message logs, Cloudflare's request logs. privacy.html points to "How long things are kept",
  which says the providers keep short-lived logs. Look these up and add numbers if they matter
  to a school. Question reports, error reports and the page counter are never deleted by code.
- **cram-kit-claim** (open). premium.js lists "The cram kit (study plans and timed mixed sets,
  from March 2027)" as Premium; it does not exist yet (spec schedule: by 2027-03-01). If it
  slips, change the line before anyone buys on it.
- **free-simulator** (open). The free list says "One simulator"; `ApBioCore.allowed('tools')`
  locks every tool when locked. The tools branch (0.4b) must free exactly one simulator, or the
  line changes.
- **polar-product-name** (open). The product name proposed in the launch checklist (spec section
  6) uses the mark as an adjective with the ®; receipts and Polar's pages then carry it. Confirm,
  or name it "LevlPrep Biology Premium (through June 30, 2027)" instead.
