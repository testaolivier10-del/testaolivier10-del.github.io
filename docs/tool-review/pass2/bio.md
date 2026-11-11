# AP Biology: second pass, simple and clear (2026-11-10)

Branch `claude/tv2-bio`. All 19 tools in `bio/tools/` opened at 1280x800 and 390x844. Screenshots:
`/home/claude/shots/pass2/bio/<tool>_land_d.png` and `_land_p.png` (after) for every tool, `_before_d.png` for
the changed ones.

Counts are for the opening screen at 1280x800, measured in the page (script in the builder's scratch folder):
L = text labels on the picture (axis tick numbers not counted), N = live numbers in the stage pills, C = controls
showing in the dock (a slider, select, choice group or button; a −/+ row counts once) + controls on the stage,
W = words outside buttons (caption plus stage text). Before is commit 4885638.

| Tool | The idea | Best way to show it | Verdict | Before L/N/C/W | After L/N/C/W | What changed | Behind a tap now |
|---|---|---|---|---|---|---|---|
| Signal transduction | One hormone molecule becomes thousands of glucose per second; a block stops everything after it | The cascade in the cell, filled from the top; one step read at a time | SIMPLIFY | 19 / 2 / 2 / 18 | 7 / 1 / 2 / 13 | One step in focus (name, count, gain from the step above); the other steps dimmed, molecules only. Play walks the focus down while the cascade fills, then rests on glucose. Tap any step to focus it; the focused step has its own Block / Lock button (arrow keys move the focus). | The other steps' counts (tap them; all counts in Details tables), the cAMP pill (Details readout) |
| Design drills | Name the variables, controls and claims of a real experiment | The drawn setup with its text; the data only when a drill reads it | SIMPLIFY | 14 / 0 / 4+5 / 98 | 10 / 0 / 4+2 / 98 | One picture at a time: "The setup" (scene + text) or "The results" (charts + table). Claim/evidence and predict drills switch to Results by themselves until the student picks. The part tags under the scene appear after Check (they show the roles); before that the drawn parts are the tap targets. | The charts and table (one chip), the role tags (after Check) |
| Cell cycle checkpoints | Checkpoints hold cells; mutations break the holds | The ring of phases with cells moving and piling at the gates | SIMPLIFY | 15 / 2 / 3+2 / 11 | 9 / 1 / 3+2 / 11 | Phase names only on the ring (no %), a gate's held count only when it is tapped, one short damage line, the cell count line removed (the pill says it). The strip of what a cell looks like in each phase moved to Details. | Phase shares (Details readout, label), held counts (tap a gate), phase strip (Details) |
| Energy flow | Only about 10% passes up; the rest leaves as heat | The levels stacked with heat leaving each one | SIMPLIFY | 17 / 2 / 1+2 / 15 | 10 / 1 / 1+2 / 15 | Heat and "eaten" numbers show for the level the student taps; decomposers' number too. "Top level stores" pill removed. | Heat, eaten and decomposer numbers (tap a level) |
| Enzyme activity | Substrate, temperature, pH and inhibitors change the rate | The enzymes with substrate filling active sites | SIMPLIFY | 1 / 2 / 6+3 / 23 | 1 / 1 / 4+3 / 23 | Dock: substrate, temperature, pH, inhibitor. Inhibitor amount appears once an inhibitor is chosen; enzyme choice in Data & settings. Rate bar says "% of top speed" only (the rate is the pill); products counter and Vmax pill removed. | Enzyme choice (Data & settings), Vmax share (Details readout) |
| Operons | Repressor, inducer and CAP decide whether the genes are read | The operon on DNA with its proteins, mRNA and enzyme | SIMPLIFY | 17 / 1 / 4+2 / 11 | 15 / 1 / 1+2 / 11 | mRNA number only in the pill (title, ribbon and enzyme lines no longer repeat it); "repressor gene" note only when lacI is mutant; no title for a single operon. Gene selects to Data & settings: one dock line says tap a gene on the DNA. Mutant quiz panels drop the numbers the table beside them gives. CAP pill removed. | Gene selects (Data & settings; tapping the DNA does the same) |
| Population growth | Exponential vs logistic growth toward K | The meadow with its N(t) curve under it, read together | SIMPLIFY | 5 / 2 / 6+2 / 10 | 5 / 1 / 4+2 / 10 | Flood and frost buttons moved from the Play bar to Data & settings (Events). The meadow line no longer repeats N; dN/dt pill removed. | Flood, frost (Data & settings), dN/dt (Details readout) |
| Simpson diversity | Evenness and richness both raise D | The quadrat of trees beside the D meter | SIMPLIFY | 3 / 2 / 8+6 / 17 | 3 / 2 / 2+6 / 19 | The quadrat is the control (tap to plant with the species chips, tap a tree to remove it); the six −/+ count rows moved to Details; caption says so. | Count rows (Details) |
| Tree reading | Read MRCA, clades and sister groups; place characters | The tree, names tappable | SIMPLIFY | 8 / 0 / 1+5 / 34 | 7 / 0 / 4+1 / 14 | The seven taxon checkboxes moved to Details (the names on the tree are the buttons, keyboard too). Placing characters opens from one button under the tree. | Checkboxes (Details), character chips (one tap) |
| Meiosis and nondisjunction | Where an error happens decides n+1 and n-1 gametes | Chromosomes in the cell, step by step | SIMPLIFY | 7 / 1 / 5 / 10 | 7 / 1 / 4 / 10 | Go to step moved to Details. | Go to step (Details) |
| Osmosis | Water moves toward lower water potential | The specimen in the beaker beside the ψ scale | SIMPLIFY | 7 / 1 / 5+2 / 21 | 7 / 1 / 5+2 / 21 | Specimen chips wrap ("Dialysis bag" was cut off); the clock sits under Play instead of clipped. (Chips are one choice: three buttons counted.) | nothing new |
| Graph builder | Turn a data table into a full-credit graph | The graph growing step by step beside the table | SIMPLIFY (small) | 3 / 0 / 2 / 66 | 3 / 0 / 2 / 61 | The stage note no longer repeats "start with the graph type" (the step and the hint say it). | nothing new |
| Hardy-Weinberg calculations | p and q set the genotype areas | The Punnett square sized by p, plus 100 individuals | SIMPLIFY (small) | 10 / 2 / 1 / 13 | 10 / 1 / 1 / 13 | The genotype pill (AA, Aa, aa) removed: the square shows the same numbers. | Frequencies stay in Details |
| Chi-square | How far observed counts sit from expected | Bars against expected boxes, and the curve with its critical line | LEAVE | 9 / 2 / 4 / 12 | same | The graph is the idea; one drag. | |
| Confidence intervals | Overlapping 2 SE bars mean chance could explain the gap | Two bars with error bars that move with n and SD | LEAVE | 4 / 1 / 3 / 14 | same | | |
| Descriptive stats | Mean vs median vs SD vs SE | One dot plot with the four marks | LEAVE | 6 / 2 / 3 / 23 | same | Legend is 4 items. | |
| Hardy-Weinberg and drift | Small populations drift; large ones hold p | The jar of beads, generation by generation | LEAVE | 1 / 2 / 3+3 / 11 | same | | |
| Rates and percent change | Rate is a slope | The curve with a slope triangle the student draws | LEAVE | 5 / 0 / 4 / 14 | same | | |
| Water potential | ψ = ψs + ψp; water runs downhill | Cell and beaker levels on one ψ scale | LEAVE | 7 / 2 / 3 / 24 | same | | |

Totals: LEAVE 6, SIMPLIFY 13 (two of them one-line changes), CHANGE 0.

## Graphics quality

The drawn pictures from the first pass are kept: the liver cell cascade, the 16 drawn experiment setups, the ring of
cells, the operon on DNA, the meadow, the quadrat, the enzymes. None reads as clip art or decoration. With the focus
step, the signal transduction rows are now read one at a time, so the molecule shapes (G proteins with GTP, cAMP as
a fused ring pair, phosphorylated kinases) are seen with their names instead of eight rows of text. Dark mode and
the 390 px phone were checked for signal transduction, design drills and every changed tool's landing.

## What I chose not to simplify, and why

- Design drills: about 70 words of scenario text stay on the stage. They are the question's stimulus (the
  experiment the drills ask about); cutting them would remove what the student needs to answer.
- Operons: 15 labels remain. They are the parts of the operon (lacI, CAP site, promoter, operator, lacZ, lacY,
  lacA) and the molecules acting on it (repressor, inducer, CAP, cAMP, RNA polymerase); naming them is what the
  tool teaches. Only the repeated numbers and notes went.
- Energy flow: each level keeps its stored-energy number. Twenty thousand, 5,000, 500, 50 going up the stack is the
  10% lesson; hiding them would hide the idea.
- Cell cycle: the dock keeps growth factor, DNA damage and the four mutation boxes together (one group). Cause and
  effect: a mutation only shows when growth factor or damage lets it, so they belong on one screen.
- Population growth: the meadow and its N(t) curve stay together; they are read as one thing.
- Graph builder: the data set description in the dock (about 30 words) is the stimulus; left.
- Chi-square shows χ² both in the pill and at the curve's marker. The marker is where the value sits on the
  curve against the critical line, so it was left.

## Checks

`node scripts/build-apbio.mjs --check`, `check-apbio-content.mjs` (0 failing), `check-apbio-map.mjs`,
`node --test scripts/test/apbio*` (71 pass), `node scripts/check-site.mjs`, `node scripts/check-weight.mjs`.

Shared-file note: all new rules are appended at the end of `bio/assets/tools/bio-tools.css` (the course's tool
stylesheet, where every bio tool's rules already live), one commented block per tool. No `assets/course/*` file was
touched.
