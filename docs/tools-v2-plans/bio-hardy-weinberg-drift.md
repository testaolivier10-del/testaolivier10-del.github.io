# Plan: AP® Biology, Hardy-Weinberg and the forces of evolution (tools v2)

**Tool and page:** `bio/tools/hardy-weinberg-drift.html`; `bio/assets/tools/hardy-weinberg-drift.js` (364 lines),
data `bio/data/tools/hardy-weinberg-drift.json` (defaults p₀ 0.5, N 50, 100 generations, 10 populations; sizes 4 to
1000 and infinite; 7 presets `hw`, `drift`, `lethal`, `hetadv`, `flow`, `inbreed`, `bottle`). Premium. Rollout
row 59, group P, wave 11, size rework (split candidate: drift, selection, migration). Must stay a different screen
from the integrated Hardy-Weinberg tool (its Punnett square).

**The one idea:** chance alone changes allele frequencies, and more so in small populations. Tabs, one idea each:
"Drift" (N), "Selection" (fitness), "Gene flow" (migrants), "Mating" (inbreeding changes genotypes, not p).

## Research
- [Genie, a real time drift simulation (Evolution: Education and Outreach)](https://evolution-outreach.biomedcentral.com/track/pdf/10.1186/s12052-016-0059-6):
  individuals drawn as animals that breed; take "see the animals, not only the lines".
- [Genetic drift simulator (biomics teaching apps)](https://tahirali-biomics.github.io/teaching/apps/drift-app.html):
  many replicate p lines at once; take replicate lines that fan out more at small N.
- [UCLA Library, founder effect vs bottleneck](https://uclalibrary.github.io/research-tips/genetic-drift/) and PhET
  Natural Selection (known): bead or bunny pictures for events. Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Draw generations (Play), Read generation slider | Every tab: instant: the whole run draws as soon as a setting changes; time bar to read a generation; Watch it |
| N slider, replicate populations, generations | Drift tab: N is the main handle (island size); replicates and generations as quiet settings in ⋯, log it |
| Starting p | Every tab: quiet handle on the start of the p graph |
| Fitness of AA, Aa, aa | Selection tab: main control, three drawn beetles with a survival handle each |
| Migrants' share m and migrant p | Gene flow tab: main control, a boat bringing migrants (m), quiet migrant p |
| Inbreeding F | Mating tab: main control |
| Mutation u, v | "?" and Test yourself setups (no tab: too slow to see in 100 generations), log it |
| Bottleneck and founder events (start, length) | Drift tab: quiet tap "Bottleneck" (a storm) and "Founders" (a raft); timing in ⋯ |
| Scenario presets (7), Run with a new seed, Record this run, Compare population sizes, Clear runs | Presets become each tab's opening state; "New run" quiet button; recording and the compare series to "?", log it |
| Guess N mode (Back to the jar, Check, Next population; ids `hardy-weinberg-drift:guess-n<N>:a`; `#guess`) | Test yourself "Guess N", same ids |
| Questions (5: `...:drift:1`, `...:flow:2`, `...:sel:3`, `...:hwe:4`, `...:hwe:5`), stimulus `hw-s1`, mini FRQ | Test yourself, unchanged |

## Design
- **Picture:** an island beach with a population of ground beetles drawn as beetles, shell colour by genotype (AA
  dark, Aa mottled, aa pale), one drawn beetle per individual up to 50, then a scale pill. Beside it, on a field
  notebook, p over generations: several faint replicate islands and the current one bold.
- **Main control (Drift):** drag the island's shoreline to make the island and N larger or smaller. The p lines
  redraw at once: tight around 0.5 for a big island, fanning to 0 and 1 for a small one; beetles on the beach show
  the generation at the time bar.
- **Selection:** a hungry bird over the beach; each genotype's beetle has a survival handle. **Gene flow:** a log
  raft ferries migrants each generation. **Mating:** pairs drawn with relatives; Aa beetles thin out while p holds.
- **Animates:** each generation, beetles fade out and offspring crawl in; lost or fixed lines end with a small mark
  ("A lost").
- **Cause line:** "N 10 → each generation a small sample → p wanders → A lost by generation 38".
- **Takeaway:** "Small populations lose alleles by chance alone."
- **Outside the picture:** 4 tabs, purpose line, Show me how, time bar, cause line. One quiet "New run".

## Science to verify
- Wright Fisher sampling of 2N gene copies per generation; expected loss time scales with N; heterozygosity falls by
  about 1/(2N) a generation (Hartl and Clark "Principles of Population Genetics", or NCBI Bookshelf).
- Selection recursion with fitnesses w; heterozygote advantage equilibrium q* = s / (s + t) with w_AA = 1 − s, w_aa = 1 − t (the preset 0.8, 1, 0.6 gives
  q* = 0.2 / 0.6 = 0.33); recompute in code.
- Inbreeding: genotype frequencies p² + Fpq, 2pq(1 − F), q² + Fpq; p unchanged (Hartl and Clark).
- Island model gene flow p' = (1 − m)p + m p_m.
- Trap: drift is not "random mutation"; "fitness" is reproductive success. No OpenStax.

## Reuse
`ApBioTools.studioKit2` (parts Guess N, Questions). Kit: `K.tabs`, `K.drag`/`K.handle`, `K.scrub`, `K.player`,
`K.tap`, `K.cue`, `K.cause`. Beetle drawing could be shared with the Hardy-Weinberg tool's art if it has animals;
check before drawing new. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- Four tabs at 360 px must fit (short names); the kit's compact tabs.
- Beetle colours by genotype must stay readable in dark mode and to colour blind students (pattern plus colour).
- Drawn beetle counts by genotype must match the model's generation at the time bar, frame by frame.
- Perf: 10 replicates × 300 generations redrawn on every drag; cache runs per setting (flagship rule).
