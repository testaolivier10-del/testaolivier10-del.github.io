# U-Bio-sims notes (tools upgrade Phase 2)

Branch `claude/tools-upgrades-bio-sims`. Ten AP® Biology simulators. Each keeps its questions, mini FRQ, run
buttons, data tables, URL params and recording; the live visual moves to the top of the model card through the
Phase 1 stage slot (`ApBioTools.mount(slug, fn, { stage })`, `ctx.redraw`). New tests:
`scripts/test/apbio-sims-upgrade.test.mjs`. `bio-tools.js` is not changed.

## Tools

### 1. Osmosis (flagship 5)
- **Job:** see which way water moves and why, from ψ inside against ψ outside.
- **Changed:** the stage is a beaker with one potato cell (green wall, brown membrane, vacuole), a red blood cell
  (biconcave dimple, crenates, bursts into a dashed torn outline with its solute spilling) or a dialysis bag on a
  string; outside solute dots at a density from the osmolarity (NaCl ions in two colors), a fixed number of
  inside dots that crowd as it shrinks; four water arrows whose width is |Δψ| right now (thin to dashed "no net"
  lines at equilibrium, moving water drops while playing); a ψ ladder (out and in markers, "downhill" arrow,
  Δψ). Every control redraws the end state at once; "Play from the start" (and picking a system, and Run one
  trial) animates t = 0 → chosen time from `ApBioMath.osmosis.trajectory`. A "why" box explains each end state
  (turgor from ψp, plasmolysis, lysis, not yet at equilibrium). System picker is three buttons. Tap the graph to
  set the beaker concentration; the current point is a square on the curve. Desktop: stage left (sticky),
  controls right.
- **Test-yourself:** "Predict, then run" mode: random clear-cut challenge (system, solute, concentration), the
  student picks direction and end state, runs it, sees both marked and the why; recorded as
  `osmosis:predict-<system>:dir` and `:state` (topic `tonicity-osmoregulation`). `#predict` (or
  `#predict-rbc` etc.) opens in this mode, so Review's "Open the tool" link lands on a challenge.
- **Water potential absorbed:** "Calculate it: ψ practice →" link to `water-potential.html` (its quiz). That page
  is U-Bio-skills'; a back link from it to `osmosis.html` is theirs to add.
- **Owner check:** the arrows show the gap *at that moment*, so the end frame of a settled run has no arrows by
  design; Play shows them.

### 2. Enzymes (flagship 9)
- **Job:** see why rate depends on substrate, temperature, pH and inhibitors, one enzyme molecule at a time.
- **Changed:** a live canvas of eight enzyme molecules (pac-man active sites) in solution with wedge-shaped substrate
  that fits the notch. Substrate binds and leaves as two product dots at a pace proportional to
  `ApBioMath.enzyme.rate` (the rate meter and product counter match the graph). Which molecules are drawn unfolded
  (heat), with a closed site (pH), with a competitive inhibitor (barred wedge, same shape as substrate) in the site,
  or bent by a noncompetitive inhibitor (circle bound on the back) comes from the new `ApBioMath.enzyme.states`.
  Molecule speed rises with temperature (Arrhenius term). A "why" line under the scene explains the current state
  (saturation, cold, denatured, pH, each inhibitor with its Km/Vmax effect). Pause button; reduced motion shows a
  still frame with sites filled in proportion. Desktop: scene left (sticky), controls right.
- **Test-yourself:** "Predict, then change": seven change types (more substrate, hotter past Tm, cooler, pH shift,
  more substrate against a competitive inhibitor, add noncompetitive inhibitor, more substrate when saturated), only
  ones where the model's rate clearly moves (>15%) or clearly does not (<3%). Predict up/down/same, then the scene
  changes. Recorded as `enzyme-activity:predict-<change>:dir` (topic `enzyme-environment`). `#predict` opens it.
- **Owner check:** the denatured text says the model treats unfolding as set by temperature alone (the model is
  reversible; real enzymes often stay unfolded).

### 3. Cell cycle checkpoints
- **Job:** see what each checkpoint checks, and what goes wrong when one fails.
- **Changed:** the ring is now first in the card: cells are dots flowing round G1, S, G2, M (counts in proportion to
  the model's, speed from its division rate), held cells pile up beside their checkpoint (highlighted, "N held"), G0
  cells sit in the middle. Each checkpoint is a button: tap for what it checks and what it is doing right now.
- **Test-yourself:** "Find the broken checkpoint": a mystery dish (p53 lost, a growth-signal oncogene/Rb loss at low
  growth factor, a spindle poison, or normal cells) shown at 24 h with clues; tap the checkpoint at fault (or "All
  working") and say what is wrong. Recorded `cell-cycle-checkpoints:find-<p53|growth|spindle|normal>:a`. For the
  p53 case G1 or G2 is accepted. `#find` opens it.

### 4. Meiosis nondisjunction
- **Job:** see where gamete variety and aneuploid gametes come from, by moving the chromosomes yourself.
- **Changed:** the figure sits above the controls and is the control. Metaphase I: tap a pair to flip it, tap its
  "fail to split" tag for meiosis I nondisjunction. Metaphase II: tap a chromosome to make its sisters stay together
  in that cell. Each tap explains the consequence. "Play to gametes" steps through to the four gametes with a fade.
  Selects stay as the keyboard path.
- **Test-yourself:** "Make this gamete": a target gamete (normal, n+1 or n−1, crossing over off so labels are
  unambiguous); set it up on the figure, Check (with a hint if wrong) or "Show me how". Right only if made without a
  failed check. Recorded `meiosis-nondisjunction:make-<normal|extra|missing>:a`. `#make` opens it.

### 5. Operons
- **Job:** see how the repressor, the inducer or corepressor, and CAP decide whether the genes are read, and spot a
  mutant from what it does.
- **Changed:** the operon diagram is first and is the control. Medium chips (Lactose, Glucose; Tryptophan): drag
  into the cell or tap. Tap lacI/trpR, the operator or lacZ on the DNA to cycle its allele. The repressor slides on or
  off the operator; mRNA ribbons stream off at a rate set by the model (4 fast or 1 slow; none for a trickle).
  On phones the diagram scrolls sideways (min 500 px) so labels stay readable.
- **Test-yourself:** "Which mutant is this?": strain X's steady-state mRNA and β-galactosidase in all four media (or
  trp mRNA with/without Trp), computed by `ApBioMath.operon` like the question tables; pick the genotype; the figure
  then shows strain X. lacI⁻ and Oᶜ give identical tables, so either counts (said in the feedback). Recorded
  `operons:mutant-<genotype>:a`. `#mutant` opens it.

### 6. Signal transduction (lighter version)
- **Job:** see how one hormone molecule becomes millions of glucose units, and what each blocked step does to
  everything after it.
- **Changed:** the cascade is first; rungs with a drug (receptor, G protein, cAMP, PKA) are buttons: tap to block
  (G protein cycles normal / locked on / locked off). Counts tween down the cascade on a log scale (drain or flood),
  each rung a beat after the one above, with seven decade dots per rung. "Play 0 to 300 s" sweeps the read time.
  A sentence explains each block. No new quiz mode (existing questions/FRQ kept).

### 7. Energy flow (lighter version)
- **Job:** see why so little energy reaches the top of a food chain.
- **Changed:** a flow stage first: level boxes (log width), energy blocks rising between levels, wavy heat leaving
  each level (width from heat), grey streams to a decomposer box. Tap a level: a 100% bar split into heat, eaten by the
  next level and to decomposers, all from `ApBioMath.energyFlow`. No new quiz mode.

### 8. Population growth (lighter version)
- **Job:** see why a population grows fast, then slows as it nears K, and how a disaster or new K changes the course.
- **Changed:** a field stage first: one dot per individual (1 dot = 10, 100... when large, said on the field), a
  dashed K fence (which shrinks/grows with a K change), new individuals since last year highlighted, an event flash
  with the share lost. "Play the years" runs year 0 to the end; Flood/Frost buttons toggle the data's events; drag
  across the N graph to scrub the year (slider stays as the keyboard path). No new quiz mode.

### 9. HW drift (lighter version)
- **Job:** see that small populations drift at random toward losing or fixing an allele, and that Hardy-Weinberg
  holds only when nothing acts.
- **Changed:** a gene-pool jar first: the chosen population's 2N alleles as beads (A solid orange, a striped blue;
  100 in proportion for a very large population) at the read generation; "Draw generations" plays generation 0 to
  the end. The jar note says what the draw does.
- **Test-yourself:** "Guess N": 8 populations of hidden size (10, 100 or 1000), p0 = 0.5, only drift, 60
  generations; pick N. Recorded `hardy-weinberg-drift:guess-n<N>:a`. `#guess` opens it.

### 10. Tree reading
- **Job:** read relationships from a tree's branching, not from the order of the tips.
- **Changed:** tap a node to rotate it (tips glide to their new rows); tap tips to select them and the MRCA and its
  clade bracket light up live, with a sentence saying whether the selection is a clade. On character trees, drag a
  numbered character chip onto a branch (drop zones highlight) or tap a chip then a branch. The rotate buttons,
  checkboxes, MRCA/clade/sister buttons and selects are kept as the keyboard path; checking and recording unchanged.
- **Owner check:** on a 390 px phone the tree still scrolls sideways (min-width 460 px, as before).

## Shared changes
- `bio-tools.js`: not changed. Stages use `ctx.stage` (osmosis) or their own first-in-card figure (the others, so
  their existing figure code and `figureFirst` keep working). The `stage` option is passed (a no-op for enzyme).
- `bio-tools.css`: one appended block per tool (`.os-*`, `.ez-*`, `.cc-*`, `.mei-*`, `.op-*`, `.sg-*`, `.ef-*`,
  `.pg-*`, `.hw-*`, `.tr-*`). Quiz blocks reuse `.os-chal`, `.os-ask`, `.os-why`, `.os-modes`.
- New review-queue item ids (all `<tool>:<content>:<item>`; Review's "Open the tool" link lands on `#<content>`,
  and each tool opens its quiz mode on a matching hash): listed per tool above.
- No new runtime files; sw.js untouched. Weight: tool scripts are not in a budget bucket; `bio/assets` shell
  unchanged (44.8 of 50 KB).

## For accuracy review
- `ApBioMath.osmosis.trajectory(sys, c, n)`: the same Euler integration as `simulate`, sampled at n + 1 times;
  tested to end exactly where `simulate` ends, move one way only, and stay lysed once lysed
  (`scripts/test/apbio-sims-upgrade.test.mjs`).
- `ApBioMath.enzyme.states(p, c)`: folded fraction, pH-ok fraction, Arrhenius motion, and site occupancy
  (competitive: S/Km and I/Ki shares of 1 + S/Km + I/Ki; noncompetitive: I/Ki over 1 + I/Ki inactive). Tested:
  motion × folded reproduces `tempFactor`, and occupancy × (1 − inactive) reproduces rate / (Vmax × temp × pH). The
  figure only uses these to choose how many molecules to draw in each state.
- Explanatory sentences added (check the wording): osmosis "why" box (turgor, plasmolysis gap filled by outside
  solution, lysis threshold, "not at equilibrium yet"); enzyme state lines; checkpoint descriptions ("G1 checks DNA
  damage via p53 and the growth signal via Rb / cyclin D–CDK"; "M (spindle) checkpoint checks every chromosome is
  attached"); mystery-dish answers; operon mutant explanations ("only a merodiploid tells Oᶜ from lacI⁻"); drift
  guess explanations; energy-flow "heat leaves for good, energy flows one way".
- Challenge generators pick only clear-cut cases from the models (osmosis: |Δψ| > 1.2 bar or ≈ 0 and the state the
  same at ±0.04 M; enzyme: rate change > 15% or < 3%).

## Owner checks
- Predict/quiz modes record new item ids into mastery and Review; confirm that is wanted for every tool.
- Osmosis "Calculate it: ψ practice" links to `water-potential.html`; U-Bio-skills may add the link back.

## Accuracy review

Independent review 2026-10-09 (branch `claude/tools-review-bio`). Models run in node on representative cases and
compared with hand calculations; sources: OpenStax Biology 2e (ch. 5.2 osmosis/tonicity, 6.5 enzymes, 10.3 cell
cycle control, 11.1 meiosis, 16.2 prokaryotic gene regulation, 19.2 population genetics, 46.2 energy flow),
College Board AP Biology CED (topics 2.8, 3.2, 4.6, 6.5, 7.3, 8.2) and the AP Biology Equations and Formulas sheet.

| Item | Verdict | Note / source |
|---|---|---|
| `osmosis.trajectory` | correct | Same Euler step as `simulate`; endpoint, monotone and lysis tests pass. |
| Osmosis ψ = ψs + ψp, ψs = −iCRT (R 0.0831 L·bar/(mol·K), T in K) | correct | Formula sheet. Potato isotonic ≈ 0.30 M sucrose (model 0.298). |
| Osmosis "why": turgor, plasmolysis (gap filled by outside solution), lysis, crenation, not at equilibrium | correct | OpenStax 5.2. |
| Osmosis "why" for a turgid cell losing water (0.30 M at 0 °C) said "as the cell fills… stops the intake" | fixed | Now: loses a little water, ψp falls, stays turgid. |
| Predict challenges: water moves but end state is "About unchanged"/"Normal"/"Flaccid" (e.g. bag 0.4 M in 0.35 M, 30 min, +0.7%) | fixed | Not clear-cut; generator now skips them. |
| Dialysis bag with NaCl outside treated as impermeable | logged | Real tubing passes NaCl; challenges now use sucrose for the bag; why-text says so (needs-author `osmosis-bag-nacl`). |
| `enzyme.states` occupancy and folded/motion split | correct | Reproduces `rate` (tested). Competitive: apparent Km = Km(1 + I/Ki), Vmax same; noncompetitive: Vmax/(1 + I/Ki), Km same (OpenStax 6.5). |
| Enzyme denaturation reversibility | logged | Text already states the simplification honestly (needs-author `enzyme-reversible-denaturation`). |
| Enzyme predict: >15% / <3% only | correct | Checked rate changes for all seven change types. |
| Checkpoint texts (G1: p53 + Rb/cyclin D–CDK; G2; M spindle-assembly) | correct | OpenStax 10.3. |
| Mystery-dish keys (p53, growth signal, spindle poison = checkpoint working, normal; G1 or G2 accepted for p53) | correct | Model: p53 loss → 24-33% divisions by damaged cells, 0 apoptosis. |
| Meiosis MI nondisjunction → 2 n+1, 2 n−1; MII → 1 n+1, 1 n−1, 2 n | correct | Ran `meiosis.simulate`; OpenStax 13.1 (Biology 2e). |
| lac mutant tables (wt, I⁻, Iˢ, Oᶜ, Z⁻), cAMP-CAP lowering in glucose | correct | I⁻ and Oᶜ identical haploid; either accepted. |
| trp mutant quiz accepted only the exact one of trpR⁻ / trp Oᶜ, whose tables are identical (100/100) | fixed | Either now accepted, feedback says why; unit test added. |
| wt lac explanation "tiny level in glucose with no lactose" (also in neither sugar) | fixed | "with no lactose". |
| Signal-transduction block sentences (antagonist, G locked on = cholera toxin, locked off, PDE inhibitor, PKA inhibitor) | correct | Cholera toxin locks Gs on (OpenStax 9.3). |
| Energy flow "heat leaves for good, energy flows one way"; ~10% "typical" | correct | OpenStax 46.2 (5-20% range; "about 10%" stated as typical). |
| HW drift Guess N: N = 100 and N = 1000 sets overlapped in ~1-2% of draws (spread of final p) | fixed | Redraws unless SD of 8 final p > 0.15 (N 100) or < 0.10 (N 1000); test added. N = 1000 text softened ("drift only a little"). |
| Tree reading: MRCA/clade sentence, rotation | correct | |
