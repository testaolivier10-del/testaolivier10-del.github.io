# u7a second pass

Second accuracy check, 2026-10-06, of topics 7.1-7.6 (`natural-selection-intro`, `natural-selection`,
`artificial-selection`, `population-genetics`, `hardy-weinberg`, `evolution-evidence`: lesson, notes, questions,
glossary, figures), FRQs `frq-finch-drought-graph`, `frq-stickleback-armor`, `frq-wildflower-drift`, and the
`hardy-weinberg-drift` tool. Checked from the reviewer's own knowledge; OpenStax not fetched. The fixes from the first
review (`docs/apbio-reviews/u7a.md`) were not redone.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| natural-selection-intro | notes, beetle paragraph under Figure 1 | "The survivors are mostly dark, so the next generation is too", but the figure has 2 dark and 2 light survivors and a next generation that is 50% dark | "Half of the survivors are dark, against 30% before, so the next generation has a larger share of dark beetles too." |
| hardy-weinberg | `bio-hardy-weinberg-18`, why for the drift option | "Drift does not act on individuals within one generation" is wrong: chance deaths within a generation are part of drift. The real reason the option fails is that drift has no direction | "Drift changes allele frequencies by chance, in no set direction; it would not reliably produce a surplus of heterozygotes among adults." |
| evolution-evidence | `bio-evolution-evidence-20`, why for the "moved away" option | "Rocks form on land and in the sea everywhere" is false (many places are eroding, not collecting sediment) | "Sediments kept forming in many places on land and in the sea; worldwide absence above one layer is not explained by moving." |

## Checked and fine

- All 120 bank items (keys, every per-option why, practice tags as written), all 12 stimuli, six lessons (prereqs,
  chains, ideas, misconceptions, summaries), six notes pages, 46 glossary entries, the figure records and the label
  text of the 8 SVGs these topics use, the three FRQs (prompts, rubric lines, samples, graph spec) and the tool (rules
  text, presets, three tables, 5 questions, mini FRQ).
- Numeric keys recomputed: relative survival and fitness 0.43, 0.75 (and 0.75 after halving), 0.51; beak change
  5.5% and ± 2 SE intervals in `natural-selection-s1` and `-s2`; oil rate 0.15; MIC 256-fold; resistant share 0.1% in
  the worked example and item 17 (10⁴- and 10³-fold enrichment); allele frequencies 0.25, 0.50, 0.40, 8 copies;
  alleles-per-gene loss 40.4%; HW p = 0.64, Aa 230, χ² for X 0.31, Z expectations 180/240/80, 90% hidden at q = 0.1,
  49%, 336; `hardy-weinberg-s2` lines 2-4 against q/(1 + q), 0.9q + 0.01 and steps of 0.05; cytochrome c 79.8%;
  half-lives 6.25%, 11,460 and 17,190 years. Stickleback p = 0.35, CL 91, χ² 32.25, C to 0.475; finch error bars
  9.20-9.40, 9.62-10.02, 9.57-9.85 mm. Tool Table 2 (q/(1 + q) and q²) and Table 3 expectations from p = 0.59 and
  0.5975, χ² 0.48 and 15.99.
- Facts rechecked: beach mice and owls, Darwin/Wallace/Malthus dates, peppered moth and *cortex*, deer-mouse
  hemoglobin, killifish LDH-B, lactase persistence, seedcracker, Karn-Penrose, elephant seal dimorphism, fox and corn
  experiments, teosinte, wild-cabbage crops, MRSA timeline, cod, bighorn, Gorongosa, Pingelap, EvC, Florida panther,
  copper-mine grass, Hardy and Weinberg 1908, Wahlund-type homozygote excess, sickle-cell heterozygote advantage,
  ABO and X-linked extensions, Tiktaalik, whale-hippo ankle, pharyngeal arch fates, rose prickles vs cactus spines,
  K-40 and U-238 half-lives. Existing needs-author entries for these topics still cover the open points.
- `node scripts/check-apbio-content.mjs`: 0 failing overall and for each of the six topics; the edited JSON files parse.

## Needs author

None. One note for whoever next edits `bio/figures/bottleneck-founder.svg` (outside this pass's edit scope): the
bottleneck panel's survivors are 4 blue : 1 orange but the recovered population is 20 blue : 4 orange (5 : 1).
Further drift could explain it, but 20 : 5 would match the survivors and read more clearly.
