# Unit 7 review, part b (topics 7.7-7.12, three FRQs, one simulator)

Branch `claude/apbio-review-u7b` from `claude/apbio-u7`, 2026-10-03. Independent accuracy check from the
reviewer's own knowledge and `docs/apbio-ced-map.json` (OpenStax not fetched, spec decision 24). Scope:
`common-ancestry`, `continuing-evolution`, `phylogeny`, `speciation`, `population-variation`, `origin-of-life`
(lesson, notes, questions, glossary, figures; 129 items), `frq-hospital-resistance`, `frq-cladogram-traits`,
`frq-mating-trials`, the `tree-reading` simulator (trees, tables, 5 questions, mini FRQ, `ApBioMath.phylo`), the
thirteen figures these topics use (rendered and read) and the 7.7-7.12 and tree-reading needs-author entries.
Topics 7.1-7.6 were reviewed separately and not touched.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| common-ancestry | `bio-common-ancestry-11` | Keyed "linear chromosomes" as found "in every eukaryote but in no prokaryote"; some bacteria (*Borrelia*, *Streptomyces*) have linear chromosomes | Key is now "A nucleus"; why notes that linear chromosomes also occur in a few bacteria |
| common-ancestry | stimulus `common-ancestry-s1`, `bio-common-ancestry-1` option | A Krebs cycle enzyme listed among genes baker's yeast "cannot divide" without; TCA genes are not essential for yeast fermenting glucose | Row is now "Enzyme that makes sterols for the cell membrane" (sterol genes are essential and among the most swappable); option renamed |
| common-ancestry | notes ("A code that is nearly universal"), `bio-common-ancestry-13` why and option why | "Each variant code differs in one to three of 64 codons" / "one or two codons" / "identical at 62 or more"; the vertebrate mitochondrial code differs at four (UGA, AUA, AGA, AGG) | "only a few of the 64 codons (four in human mitochondria)"; "two in the ciliates, four in human mitochondria"; "match at nearly all 64 codons" |
| common-ancestry | notes, eukaryote feature list | "linear chromosomes, with DNA wrapped on histones" in a list of features "in no prokaryote", while the table below says many archaea have histones | "linear chromosomes, several in each nucleus" |
| population-variation | `bio-population-variation-12` why | "About 18 times as many HbS alleles are in carriers as in affected children": carriers hold 0.18 and affected children 2 × 0.01 = 0.02, so 9 times | Corrected to 9 times with the working |
| phylogeny | figure `cladogram-traits` | Key "inherited by everything to its right" is false read literally (the lancelet tip lies to the right of the skull mark) | "inherited by every taxon beyond it on the tree" |
| continuing-evolution | stimulus `continuing-evolution-s3` | Names the real Australian myxoma release but gives invented percentages with no note (needs-author illustrative-data-u7b) | Adds "The values are simplified for teaching, following the pattern of the field surveys." |
| speciation | lesson hook | Apple and hawthorn fly gene pools "drifting apart": the divergence is by host-linked selection and isolation, and "drifting" invites confusion with genetic drift | "have begun to diverge" |
| origin-of-life | glossary `early-earth` | States oceans by 4.4 billion years as fact; the notes rightly say zircons "suggest" it | "probably had oceans" |

## Checked and fine

- Every tree against its table, counting changes: phylogeny s1 (moss, fern, pine-oak nesting; 4 changes; the
  fern-first tree needs 5, `bio-phylogeny-3`), s2 SVG coordinates (nodes 1-6 match the description; MRCA of
  mouse-turtle is node 2; clades {croc, sparrow}, {turtle, croc, sparrow}), notes cladogram (5 changes; trout-newt
  tree 6), four-chambered heart (2 gains vs 3 changes under either turtle placement), `tree-rotation` (all three
  drawings are (frog,(mouse,(lizard,(croc,sparrow))))), `tree-anatomy`, `three-domains`.
- `frq-cladogram-traits`: (O,(P,(Q,(R,S)))) with 5 changes; part d tree (O,(P,(S,(Q,R)))) needs 6; rubric and
  samples earn every point; points sum to 4. `frq-hospital-resistance` (4.2 points/yr; 34% → 27%) and
  `frq-mating-trials` (null 50% same-cage with 6 + 6 flies per cage; control logic) also gradeable and summing to 4.
- Numbers: 12 × 15/31 = 5.8, 16 × 15/31 = 7.7, 62 × 15/31 = 30; 0.39 × 200 = 78; kdr rises (largest 4→5, 14 points)
  and 48/4 = 12.0; Lenski 0.16 and 0.004 per 1,000 gen, all ±2 SE overlap claims; HIV 10^5, 1, 10^-5; 1000 × 0.91 ×
  0.87 × 0.03 = 23.75; 21 chromosomes; 1.0 rib/Myr; 49/58 = 84%; rice and sickle intervals; 2pq = 0.18; glycine
  1.8 and 0.2 µmol/day; 48/3 = 16; 3.5/4.6 = 76%; timeline marks at 4.4, 3.5, 2.4, 1.8, 0.54 billion years are to
  scale.
- Facts: H4 2/102 pea-cow; Woese 1977; Lee-Nurse human CDC2 in yeast (1987) and Kachroo-scale swaps (~47%); ciliate
  UAA/UAG = Gln; Kauai flatwing crickets; Palmer amaranth EPSPS amplification; myxoma 1950; Lenski 1988, 12
  populations, 500-generation freezes, Cit+ ~31,000 via *citT* promoter capture, potentiation after ~20,000; mule
  63; gray tree frog polyploidy; apple maggot timing; Florida panther 1995 (8 females); *Fundulus* LDH-B cline;
  CCR5-Δ32 ~1% homozygous; Miller 1953 and the 2008 vial reanalysis (>20 amino acids); Ferris clay RNA; Hanczyc 2003.
- `tree-reading`: primate Newick is ultrametric (3.2 to every tip) and reproduces Table 2 exactly; rotation drawing
  order; all five question keys; 3.1/1.2 × 6 = 15.5; mini FRQ (4 points). `ApBioMath.phylo` (parse, key, MRCA,
  classify, distance, fromCharacters incl. conflict detection) read line by line; tool tests 49/49 pass.
- Needs-author defaults glycolysis-universal, two-domain-tree, luca-membrane, illustrative-data-u7b, primate-clock,
  turtle-placement, lamprey-skull, apple-maggot-sympatry, early-atmosphere, earliest-life-date, tree-group-words and
  tree-teaching-values are all defensible for the exam as stated; no item depends on the contested point.
- Trademark: no "AP" in these files. No passage read as a close paraphrase of a textbook or released item.
- `check-apbio-content` clean for all six topics (and the whole course); `check-apbio-map --check` passes with
  Unit 7 published; rebuilt with no override afterwards.
