# Plan: AP® Statistics, Sampling lab

## Tool and page
`statistics/tools/sampling-lab.html`; scripts `statistics/assets/tools/sampling-lab.js`,
`statistics/assets/tools/math/sampling-lab.js` (`ApStatMath.samplingLab`: `METHODS` srs, strat, cluster, sys, conv,
vol), `sampling-lab.css`; data `statistics/assets/tool-data/sampling-lab.json`. **Premium.** Rollout row 36, group P,
wave 15, marked rework (dense scene: 100 houses, 150 words; 12 controls in the panel).

## The one idea
Each sampling method picks its units differently; random methods centre on the truth, and the ones that let people
choose are biased.

## Research
- Rossman/Chance "Sampling words" applet (https://www.rossmanchance.com/applets/index2021.html): a self chosen sample
  vs random samples, their means against the truth. Take: one row of sample means per method on the same axis.
- Seeing Theory "Frequentist inference" (https://seeing-theory.brown.edu/frequentist-inference/index.html): samples
  drawn and stacked. Take: units lighting in the order chosen.
- StatKey "Sampling distribution" (https://www.lock5stat.com/StatKey): "generate 1 / 10 / 100 / 1000". Take: the
  button driven run on purpose (rollout wave 15 pattern).

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Scenes: households on a hillside, plots in a tomato field, students in classrooms (fixed populations) | scene picker beside "Show me how" |
| Six methods: simple random, stratified, cluster, systematic, convenience, voluntary response (vol where the scene has it) | main control: method cards on the picture's top edge (`K.tap`) |
| Draw a sample (cue "Draw a sample"): units light up in selection order with the process strip (random numbers, strata, clusters, systematic start) | "Draw a sample" (the main action button, on the picture); the process shown on the scene (strata as fences, clusters as streets lit, the systematic start and step as footprints), the random numbers in "?" |
| Its mean lands as a dot on a stacked dotplot of sample means, one row per method, against the population mean | kept, below the scene |
| "Draw 100" fills a row | "Draw 100" (secondary) |
| Tap a unit to read its label and value | kept (`K.tap`), in the cause line |
| Sample size n and population (panel) | n as a quiet knob on the dotplot; population is the scene picker |
| Colours: population and its mean first series, the sample second, the sample means third | kept |
| Test yourself: drill, 4 kinds (method, procedure, bias, numbers), a "Which kind of sample" problem shows its method on a small model; record ids `sampling-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** the hillside village (already a drawn scene; bring it to the flagship level and thin it: houses
  grouped by street so 100 units read at 360 px). A chosen house lights its windows in the order chance picks it;
  stratified draws a fence between neighbourhoods first; cluster lights whole streets; systematic leaves footprints
  every k houses; convenience lights the houses by the road; voluntary lights the ones whose owners wave.
- **Main control:** tap a method card, then Draw a sample.
- **Animates:** windows light one by one; the sample's mean drops from the scene into its method's row; Draw 100
  streams dots into the row.
- **Cause line:** "convenience → 10 houses by the road → mean 3.8 → the true mean is 2.9"; "simple random → centres
  on 2.9".
- **Takeaway:** "Methods that let people or convenience choose miss the truth in the same direction: bias."
- **Outside:** purpose line, scene picker, Show me how, cause line, Draw 100: 3 controls, about 20 words; the method
  cards and Draw a sample are on the picture.

## Science to verify
Definitions of the six methods and how each is carried out (a random start then every kth for systematic; stratified
samples within every stratum; cluster takes all units in randomly chosen clusters); bias vs variability; convenience
and voluntary response bias; undercoverage and nonresponse words (CED revised 2026-27 Unit on collecting data;
OpenStax Introductory Statistics 2e §1.2). Statistics vs parameters (x̄ vs μ). Check the cause line numbers against
the scene's fixed population.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.tap`, `K.drag` (n), `K.cause`;
`K.player` or a small run loop for Draw 100. `build-apstat --check`.

## Risks reviewers will likely block on
- 100 houses on a phone: windows must still be tappable (act on what is drawn under the pointer) and labels at 11 px.
- Draw 100 at CPU x4: batch the dots, one path per row.
- Six method cards at 360 px: two rows of three, each label 1 to 2 words.
- The process (fences, streets, footprints) must match the actual selection drawn.
