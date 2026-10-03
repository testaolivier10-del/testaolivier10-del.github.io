# Unit 7a review (topics 7.1-7.6, three FRQs, one simulator)

Branch `claude/apbio-review-u7a` from `claude/apbio-u7`, 2026-10-03. Independent accuracy check from the
reviewer's own knowledge and `docs/apbio-ced-map.json` (OpenStax not fetched, spec decision 24). Scope:
`natural-selection-intro`, `natural-selection`, `artificial-selection`, `population-genetics`, `hardy-weinberg`,
`evolution-evidence` (lesson, notes, questions, glossary, figures; 120 items), `frq-finch-drought-graph`,
`frq-wildflower-drift`, `frq-stickleback-armor`, the `hardy-weinberg-drift` simulator (rules, seeded tables, 5
questions, mini FRQ, `ApBioMath.popgen`), the eight figures these topics use (rendered and read: `selection-logic`,
`selection-modes`, `mustard-crops`, `antibiotic-selection`, `bottleneck-founder`, `hw-square`, `hw-conditions`,
`forelimb-homology`) and the 7.1-7.6 needs-author entries. Topics 7.7-7.12 were left to the other reviewer.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| population-genetics | stimulus `population-genetics-s1` chart | The five series had no `name`, so the legend and data table read "undefined" and students could not tell S1, S2, S3, L1, L2 apart (items 1-5 depend on it) | Named "S1 (10 adults)" … "L2 (500 adults)" in data order (checked against item 1's why) |
| (engine) | `scripts/lib/apbio-build.mjs` `SERIES_CLASS`, `bio/assets/bio.css` | Only four series styles; a fifth series reused series 1's colour and marker | Added `s5` (grey, dashed line; light and dark tokens); index now `si % SERIES_CLASS.length`. Only this chart has five series |
| FRQ | `frq-stickleback-armor` part d(iii) prompt, rubric, sample | Asked about "next year's juveniles" with the justification "the survivors breed", but the stem says fish first breed at two years, so next year's juveniles are not this year class's offspring | "the juveniles this year class produces when it first breeds"; sample says "breed at two years old" |
| natural-selection | `bio-natural-selection-9` (predict) | Variable "Number of nests a male gets from having his tail glued longer" keyed "no change": gluing does raise his nests (the data show it), so a correct student could answer "up" | Variable now "natural tail length of the sons of a glued male vs. sons of an unaltered male with the same natural tail" (none); "over many generations" moved into the two trend variables |
| natural-selection | `bio-natural-selection-11` | Practice 2.B (visual representation) on an item with no visual; it asks for a prediction | 6.E |
| natural-selection | lesson chain, notes (biotic/abiotic) | "Bark color" listed as an abiotic factor (bark is part of a living tree) | "soot" / "soot from factories" (the notes already call the soot abiotic) |
| natural-selection-intro | notes, figure `selection-logic` (text, desc, alt) | Beetles described as having a "coat" color | "body color" |
| natural-selection, population-genetics | stimuli `natural-selection-s1`, `population-genetics-s2` | Invented numbers tied to real dates and events (1977 drought, 1992-1996 releases) with no label | "(Values are simplified for teaching.)" (matches `u7a-illustrative-data`) |
| artificial-selection | `bio-artificial-selection-15` why | "The stimulus says…" on a stand-alone item | "The question says…" |
| hardy-weinberg | `bio-hardy-weinberg-10` why | "moves q by 0.05 or more each generation": the plotted points are two generations apart and 4→6 shows no change | "in steps of 0.05 (one gene copy), often by 0.1 or more between the points plotted" |
| evolution-evidence | `bio-evolution-evidence-14` option why | Claimed the shark-dolphin ancestor "was not streamlined in this way" (unknowable) | "more than 400 million years ago, long before either streamlined form evolved" |
| evolution-evidence | `bio-evolution-evidence-9`, `-3` | "Ash crystals form when lava cools" (ash is erupted, not lava); garbled "as mammals both" | "as molten rock cools"; "lists both rabbits and dogs as mammals" |

Needs-author added: `fox-correlated-traits`, `scale-eater-handedness` (contested science, defaults stated).

## Checked and fine

- Hardy-Weinberg recomputed: s1 X p = 0.80, expected 320/160/20, χ² = 0.31; Y p = 0.64, expected Aa 230.4; Z p = 0.60,
  expected 180/240/80; s2 line 2 q' = q/(1 + q) (0.5, 0.25, 0.167, 0.125, 0.10, 0.083, 0.071, 0.063, 0.056, 0.05,
  0.045) and line 3 q' = 0.9q + 0.01 (0.424 … 0.149) match every plotted value; line 4 values are multiples of 0.05
  (20 copies); items 8 (90%), 11 (49%), 12 (336), prereq 0.40, notes' worked examples (245/210/45; 480 of 1,000;
  p = 0.90 hidden at q = 0.10), X-linked and ABO extensions.
- Chi-square: `frq-stickleback-armor` p = 0.35, expected CL 91 (CC 24.5, LL 84.5); one-year-olds against juvenile
  frequencies χ² = 20 + 1 + 11.25 = 32.25, df 2 (expected proportions come from another sample, so the goodness-of-fit
  df is right here), 32.3 > 5.99, and 3.84 also accepted; C rises to 190/400 = 0.475. Juveniles fit HWE
  (χ² ≈ 1.96, below 3.84 and 5.99). Simulator Table 3 recomputed independently from the seeded model: P 72/92/36 vs
  69.62/96.76/33.62, χ² 0.484; Q 85/69/46 vs 71.40/96.20/32.40, χ² 15.99; same decision at df 1 and df 2.
  `bio-hardy-weinberg-3` (0.31) and `-15` (12.4) hold under either df. `hw-chi-square-df`/`hw-drift-chi-df`
  defaults are defensible: no key hinges on the df choice.
- Selection numbers: relative fitness 0.75 / 0.63 / 0.43 (10/30 ÷ 23/30) / 0.51 (42/400 ÷ 82/400); white
  relative fitness stays 0.75 when survival halves; worked fish-flood survival 10/30/60/80/100%; beak 5.5%; corn
  0.15 points per generation; MIC 256-fold; resistant share 0.1% in both worked example (2 × 10⁹, 10⁻⁷, 99.99%) and
  item 17 (4 × 10⁸, 10⁻⁶, 99.9%); allele counts 0.25, 0.50, 8 copies, 40.4%; cytochrome c 79.8%; half-lives 6.25%,
  11,460 and 17,190 years; error-bar intervals in `natural-selection-s1`/`-s2` and `frq-finch-drought-graph`
  (9.20-9.40, 9.62-10.02, 9.57-9.85 mm; parts sum 1 + 2 + 4 + 2 = 9).
- Simulator: model order, inbreeding genotype formula, Wright-Fisher sampling, fixed/lost/extinct handling and the
  χ² helper read in `bio-tool-math.js`; Table 1 fates (7/3/0, 5/4/1, 3/1/6, 0/0/10, 0/0/10) and Table 2 recomputed by
  running the model; magnitudes match (1 − 1/2N)^100 heterozygosity decay. Five questions and the mini FRQ correct.
  `apbio-tools.test.mjs` + `tool-content.test.mjs` 49/49 (no model code changed).
- FRQs: `frq-wildflower-drift` (4 points, 50 vs 10,000 copies) and `frq-finch-drought-graph` rubrics gradeable and the
  samples earn every point.
- Figures: beetle counts (3/10 → 5 light and 1 dark eaten → 6/12 dark offspring → 5/10), selection-mode shading,
  mustard crops, antibiotic panels (23 + 1, 22 of 24 resistant), bottleneck/founder counts (3:2:1 → 12:8:4),
  `hw-square` areas, HW conditions, forelimb bones (whale hyperphalangy, reduced bat ulna).
- Facts checked: Darwin-Wallace 1858/1859, Malthus 1798; peppered moth 1848, 98% by 1895, Clean Air Act 1956,
  *cortex* transposon about 1819; deer mouse hemoglobin, killifish LDH-B, lactase persistence; seedcracker,
  Karn-Penrose; widowbird design; Belyaev 1959; Illinois corn 1896; teosinte; MRSA 1961; Gorongosa; cod; bighorn;
  Pingelap; elephant seals; cheetah grafts; EvC in the Amish; Florida panther 1995; copper-mine grass; Tiktaalik
  (375 Myr, 2004); K-40 1.25 and U-238 4.5 billion years; C-14 5,730; horse toes by layer; whale-hippo ankle; β-globin
  table. All within the rounding stated in `u7a-history-numbers`.
- Needs-author defaults defensible for the exam: `u7a-illustrative-data` (now with labels on the two date-tied
  stimuli), `cytochrome-c-counts` (no key depends on one position; kangaroo 10 is the classic value),
  `vestigial-meaning`, `u7a-history-numbers`, `stabilizing-birth-weight` (stem states 1935-1946),
  `popgen-model-order`, `hw-drift-chi-df`.
- No "AP" mark in any reviewed file; no passage reads as a close paraphrase of a textbook, the CED or a released item.
- Checks: `check-apbio-content --topic` clean for all six topics; built with Unit 7 published, `check-apbio-map
  --check` and `check-apbio-content --check` pass; `check-site`, `check-weight` and the apbio tests (87/87) pass;
  rebuilt with no override at the end.
