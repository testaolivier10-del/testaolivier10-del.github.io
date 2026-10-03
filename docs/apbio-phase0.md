# AP® Biology: Phase 0 dependency map

The map is `docs/apbio-dependency-map.json` (format: `docs/apbio-spec.md` section 4). It is
checked by `node scripts/check-apbio-map.mjs --check` (library `scripts/lib/apbio-map.mjs`, tests
`scripts/test/apbio-map.test.mjs`); `--order` prints the course order. If this file and the JSON
disagree, the JSON is right. Unit and topic facts come from `docs/apbio-ced-map.json`; no CED text
is reproduced. Open questions are in `docs/apbio-needs-author.md`.

## Counts

| | |
|---|---|
| Chapters | 10: Units 1-8 (CED weights) and two skills chapters |
| Topics | 75: the 61 CED topics in CED order, 9 statistics skills, 5 design drills |
| Concepts | 777, with about 2,640 terms and aliases |
| Pulled-forward short versions | 23 entries in `circularDependencies` |
| Preview boxes | 4 |
| Everyday words | 39 |
| Planned tools | 12 simulators, 43 FRQ themes, 49 data-heavy stimulus themes, 40 comparison tables, 28 pathways |

Concepts per chapter: Unit 1 121, Unit 2 111, Unit 3 68, Unit 4 67, Unit 5 58, Unit 6 104, Unit 7 98, Unit 8 76, statistics skills 50, design drills 24.

## Rules carried over from A&P

As in `docs/anp-phase0.md`: aliases are the words a topic owns (glossary and page check), not
strict synonyms; a word with two meanings gets qualified labels ("base (chemistry)", "base
(nucleotide)", "transduction (signaling)", "transduction (bacteria)") that the page check skips;
when a short early version and a full later version share a word, the early one owns the plain
word and names the full topic in `fullIn`; everyday words may be used early in their everyday
sense. New for this course: a forward dependency needs a preview box on the topic **and** a
`circularDependencies` entry naming it, and every `fullIn` short version must be listed in a
pull-forward entry. Pages declare `<meta name="bio-topic">`; exempt text sits in `.bio-preview` or
`.bio-nav-ref` (no "ap" in served files). Questions in `bio/data/questions/<topic>.json` are
checked the same way (q, options, stimulus, why; stimulus sets share their stimulus).

## Course order

Skills and drills sit right after their anchor (`after`), so they publish with that unit.

| Unit | Order (CED topics; skills and drills in italics) |
|---|---|
| 1 Chemistry of Life (8-11%) | 1.1 water-hydrogen-bonding, *stats-descriptive*, *design-variables*, 1.2 elements-of-life, 1.3 macromolecules-intro, *stats-plots*, 1.4 carbohydrates, 1.5 lipids, *design-controls*, 1.6 nucleic-acids, 1.7 proteins, *stats-sd-se* |
| 2 Cell Structure and Function (10-13%) | 2.1 cell-structure-function, 2.2 cell-size, *stats-rates*, 2.3 plasma-membrane, *design-null-hypothesis*, 2.4 membrane-permeability, *stats-confidence-intervals*, 2.5 membrane-transport, 2.6 facilitated-diffusion, 2.7 tonicity-osmoregulation, *stats-water-potential*, 2.8 transport-mechanisms, 2.9 cell-compartmentalization, 2.10 compartment-origins, *stats-chi-square* |
| 3 Cellular Energetics (12-16%) | 3.1 enzyme-structure, 3.2 enzyme-catalysis, 3.3 enzyme-environment, *design-cer*, 3.4 cellular-energy, 3.5 photosynthesis, 3.6 cellular-respiration, *design-prediction-mechanism* |
| 4 Cell Communication and Cell Cycle (10-15%) | 4.1 cell-communication, 4.2 signal-transduction-intro, 4.3 signal-transduction-pathways, 4.4 feedback, 4.5 cell-cycle, 4.6 cell-cycle-regulation |
| 5 Heredity (8-11%) | 5.1 meiosis, 5.2 meiosis-genetic-diversity, 5.3 mendelian-genetics, 5.4 non-mendelian-genetics, 5.5 environment-phenotype |
| 6 Gene Expression and Regulation (12-16%) | 6.1 dna-rna-structure, 6.2 dna-replication, 6.3 transcription-rna-processing, 6.4 translation, 6.5 gene-regulation, 6.6 cell-specialization, 6.7 mutations, 6.8 biotechnology |
| 7 Natural Selection (13-20%) | 7.1 natural-selection-intro, 7.2 natural-selection, 7.3 artificial-selection, 7.4 population-genetics, 7.5 hardy-weinberg, *stats-hardy-weinberg*, 7.6 evolution-evidence, 7.7 common-ancestry, 7.8 continuing-evolution, 7.9 phylogeny, 7.10 speciation, 7.11 population-variation, 7.12 origin-of-life |
| 8 Ecology (10-15%) | 8.1 environment-responses, 8.2 energy-flow-ecosystems, 8.3 population-ecology, 8.4 population-density, 8.5 community-ecology, 8.6 biodiversity, *stats-simpson*, 8.7 ecosystem-disruptions |

**Skill anchors.** Every skill except Hardy-Weinberg and Simpson's lands in Units 1-3, so it
publishes with Phase 2. Each topic lists `contexts` that need only biology taught before it
(water drops on a coin, cooling flasks, agar cubes, beet pigment, potato cores, choice chambers,
enzyme data, an electron transport chain poison). Chi-square comes at the end of Unit 2 because it
needs the null hypothesis drill; 5.4 then uses it with genetic crosses. The null hypothesis drill
follows 2.3 and comes before confidence intervals (after 2.4), so "statistically significant" is
defined against a null hypothesis; hypothesis, if-then prediction and control group are taught in
the first drill (after 1.1). Simpson's: the CED
names the index in 8.5, so 8.5 owns the term and what it means; the skill after 8.6 owns the
calculation. Same split for Hardy-Weinberg (7.5 owns the equations, the skill the arithmetic)
and water potential (2.7 owns the idea, the skill owns -iCRT and its constants).

## Pulled-forward short versions

| Short version | Taught in | Full treatment | Why |
|---|---|---|---|
| kinetic, potential and chemical energy | 1.1 | 3.4 | specific heat, stored fuel, ATP, gradients |
| carbohydrate, lipid, protein, amino acid, nucleic acid | 1.2 | 1.4-1.7 | 1.2 says which elements build them |
| ATP | 1.2 | 3.4 | phosphorus (1.2), pumps (2.5-2.6), mitochondria (2.1) |
| photosynthesis, cellular respiration (the matter cycle) | 1.2 | 3.5, 3.6 | starch, chloroplasts, mitochondria, metabolic rate |
| enzyme | 1.3 | 3.1 | hydrolysis, cellulose digestion, lysosomes |
| membrane (bilayer) | 1.5 | 2.3 | why phospholipids form bilayers |
| cell wall | 1.4 | 2.4 | cellulose |
| DNA, RNA, gene | 1.6 (CED placement) | 6.1, 6.3 | Units 2-5 use them throughout |
| mRNA, gene expression, chromosome | 2.1 | 6.3, 6.5, 4.5 | ribosomes, rough ER, signaling responses |
| diffusion, concentration gradient | 2.2 | 2.4 | surface area-to-volume exchange, agar cubes |
| endotherm and ectotherm | 2.2 | (3.6, 8.2 build on it) | body size and metabolic rate moved to 2.2 in 2025 |
| adaptation (one line) | 2.2 | 7.2 | exchange surfaces; keeps the Lamarckian sense out |
| homeostasis | 2.5 | 4.4 | internal conditions, osmoregulation |
| apoptosis | 2.1 | 4.6 | lysosomes; a signaling response can be cell death |
| receptor, signaling molecule | 2.3 | 4.2, 4.1 | membrane proteins, receptor-mediated endocytosis, gated channels |
| membrane potential | 2.6 | (none) | pump, proton-motive force, synaptic signaling; no CED nerve topic |
| evolution, common ancestry | 2.10 | 7.1, 7.7 | endosymbiosis, origin of photosynthesis, universal code |
| symbiosis, mutualism | 2.10 | 8.5 | endosymbiosis, squid and Vibrio, root nodules |
| DNA replication | 4.5 | 6.2 | S phase |
| mutation | 4.3 | 6.7 | pathways stuck on; cancer genes |
| DNA damage and repair | 4.6 | 6.2 | checkpoints, p53 |
| allele | 5.1 | 5.3 | homologous chromosomes, crossing over |
| niche | 7.10 | 8.5 | adaptive radiation fills open niches |

## Every preview box, and why

| Topic | Previews | Taught in | Why |
|---|---|---|---|
| 1.2 Elements of life | phospholipid | 1.5 | the CED lists phospholipids among phosphorus-containing molecules |
| 6.7 Mutations | natural selection | 7.1 | a mutation is harmful, neutral or helpful only relative to the environment |
| 8.3 Population ecology | carrying capacity | 8.4 | K-selected life histories |
| 8.4 Effect of density | predation | 8.5 | predation is a standard density-dependent factor |

## Everyday words

cell(s), protein(s), DNA, gene(s), hormone(s), insulin, bacteria/bacterium/bacterial, virus(es),
fungi/fungus, pathogen(s), parasite(s), pollution, ammonia, climate change, species, population(s),
ecosystem(s), cancer, predator(s), prey, fossil(s), kidney(s), behavior(s) Each is a real term of a later (or same) topic; the page check skips it and the
glossary links it to where it is taught. Technical relatives stay strict (for example "gene" is
everyday, "allele" is not; "insulin" is everyday, "glucagon" is not). "Photosynthesis", "enzyme" and
"adaptation" are deliberately not everyday: each has an early short version instead.

## Tool plan per unit

Full lists with topics, FRQ types and stimulus kinds are in `chapters[].tools`.

| Unit | Simulators | Highlights |
|---|---|---|
| 1 | none | water heating data, fatty acid melting points, DNA base composition, side-chain substitution data; macromolecule and protein-structure tables |
| 2 | osmosis and water potential (2.7) | potato-core percent mass change with graphing FRQ, agar cubes, dialysis bags, carrier saturation curves, metabolic rate vs body mass; secretory and cotransport pathways |
| 3 | enzyme activity and inhibition (3.3); light reactions and Calvin cycle (3.5); electron transport and ATP synthase (3.6) | inhibitor rate curves, catalase data, respirometer, leaf disks, absorption vs action spectra, poison/uncoupler predictions |
| 4 | signal transduction with amplification (4.3); cell cycle checkpoints (4.6) | cAMP with inhibitors, DNA content per cell, cyclin levels, glucose-insulin-glucagon, quorum sensing light output |
| 5 | meiosis and nondisjunction (5.2) | testcross counts with chi-square, linkage, pedigrees, karyotypes, plasticity data |
| 6 | lac and trp operons (6.5) | gels, Meselson-Stahl bands, enzyme activity with sugars, mutant sequences, Hershey-Chase |
| 7 | Hardy-Weinberg and genetic drift (7.5); phylogenetic tree reading (7.9) | beak depth across droughts (graphing FRQ), drift curves, protein sequence differences, trait matrices, mating trials |
| 8 | population growth (8.4); energy flow through trophic levels (8.2) | predator-prey cycles, dissolved oxygen downstream of farms, toxin by trophic level, species counts, choice chambers, survivorship |
| Skills | (interactive graph builder lives in stats-plots) | error-bar graphing FRQ, chi-square FRQ, investigation-design FRQ, CER from enzyme data |

## What could not be ordered cleanly

1. **Unit 1 before cells.** Unit 1 talks about molecules whose jobs are inside cells (membranes,
   cell walls, energy storage, enzymes) before Unit 2 teaches cells. Handled with short versions
   in 1.2-1.5 and the everyday word "cell"; lessons should keep Unit 1 examples at that level.
2. **Nucleic acids in Unit 1, gene expression in Unit 6.** Units 2-5 lean on DNA, genes,
   chromosomes, mRNA and mutations. Five pull-forwards cover it; "transcription" and
   "translation" are deliberately not used before Unit 6.
3. **Photosynthesis before respiration (2025 CED order).** The electron transport chain, ATP
   synthase and chemiosmosis are taught first in 3.5 and reused in 3.6, the reverse of most
   textbooks.
4. **Membrane potential has no home topic.** It is taught once at a basic level with the pump
   (2.6) and never revisited at depth, because the CED has no nervous-system topic.
5. **Words owned by one topic that earlier pages may want.** Quorum sensing (4.1) owns "cell
   density" so it need not say "population density" (8.3); gated channels (2.6) say "nerve
   cells", not "neuron" (4.1); the matter cycle in 1.2 says "plants, algae and some bacteria",
   not "producers" (8.2); feedback inhibition (3.4) must not say "negative feedback" (4.4).
   Pages that reach for the later word fail the check. That is intended.

## Review

One independent reviewer (a separate session that had not written the map) read it as a
skeptical AP Biology teacher against `docs/apbio-ced-map.json`, the scanner rules and spot checks
of OpenStax 8.3, 14.3 and 46.2. It raised 33 points (6 high, 17 medium, 10 low) and 11 contested
science items, which are now in `docs/apbio-needs-author.md` under "Contested science".

**Applied** (map went from 752 to 777 concepts):
- Hidden forward dependencies: isotopes moved to 1.2 (Hershey-Chase, Meselson-Stahl);
  bacterial transformation moved to 6.1 (Griffith); sex-linked inheritance moved to 5.3
  (pedigrees), with reciprocal crosses left in 5.4; single/double/triple bonds moved to 1.1;
  "conformational change" moved to 1.7; biotic/abiotic factors to 7.2; community to 8.2;
  extinction to 7.6; divergence to 7.9; immigration/emigration to gene flow (7.4); camouflage to
  7.2; DDT to pesticide resistance; greenhouse terms to the carbon cycle; a general "limiting
  factor" in 3.3; "cell density" for quorum sensing.
- New pull-forwards: energy forms (1.1), diffusion (2.2), endotherm (2.2), adaptation (2.2,
  replacing the everyday-word listing), homeostasis (2.5), symbiosis and mutualism (2.10), DNA
  damage (4.6), niche (7.10). Each is in `circularDependencies`.
- Skills: hypothesis, if-then prediction and control group moved to the first drill; slope
  moved to graphing; the null-hypothesis drill now comes before confidence intervals, and
  "statistically significant" depends on it; "knockout" dropped.
- Wrong groupings split: histogram, causation, significance level (alpha), allosteric
  regulation (activators too; repressors depend on it), post-translational modification,
  shared ancestral character, PCR primer versus RNA primer; "heat capacity", "compound" and
  "chemical bond" no longer mislabelled; neutron and atomic proton added to atom.
- Added coverage: stomata and guard cells (1.1), methyl and carbonyl groups (1.2), rubisco/RuBP/
  G3P (3.5, enrichment), fungi, pathogen, macroevolution.
- Everyday words: parasite, pollution, ammonia, climate change, fungi, pathogen added; enzyme,
  photosynthesis and adaptation removed (they have short versions).
- Small fixes: ocean acidification depends on the carbon cycle, not warming; flagellum no
  longer depends on the cytoskeleton; the behavior concept is "innate and learned behavior";
  bare "differentiate", "specialized cells", "crop plants" and "dog breeds" dropped as aliases;
  the 1.2 and 1.4 pull-forward texts reworded so they no longer use later words; the photolysis
  concept is now "water splitting".

**Rejected or handled differently:**
- *Move the chi-square skill after 5.3.* Rejected: the owner wants the statistics skills to
  publish with Units 1-3. Choice-chamber counts (organisms choosing moist or dry, light or dark)
  and seed or color counts against an expected split need no later biology and no "taxis"
  vocabulary; genetics contexts come back in 5.4 practice, which depends on it.
- *Move the membrane pull-forward from 1.5 to 1.4.* Handled differently: the membrane short
  version depends on the lipid bilayer (1.5), so moving it would create a new forward
  dependency. The 1.4 cell-wall text is reworded to "around the outside of plant cells".
- *Tag 2025-dropped examples (plasmodesmata, peppered moth, lac operon) as enrichment in the
  JSON.* Handled in `docs/apbio-needs-author.md` (map-enrichment) instead of a new map field,
  since the spec's format has none.
- *Add "neutron" to the isotope concept.* Put on atom instead, where it belongs.
- *Feedback inhibition (3.4) wanting "negative feedback".* No preview: the page can say "the
  end product shuts down an early enzyme". Listed under "could not be ordered cleanly".
