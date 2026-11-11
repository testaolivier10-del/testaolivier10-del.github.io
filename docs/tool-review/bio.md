# AP Biology: tool purpose review (2026-11-10)

Every page in `bio/tools/` (19) opened in Chromium at 1280x800 and 390x844. Every view chip, button, slider end,
select option and checkbox in Explore, everything in Data & settings, and two items in each test tab. Screenshots:
`/home/claude/shots/review/bio/<tool>/` (numbered, with `labels.txt`) and `<tool>__phone.png`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Cell cycle checkpoints | Checkpoints hold cells; tumor suppressor and oncogene mutations break the holds | FIX | Mutations do nothing at the default settings (DNA damage is 0 and hidden in Data & settings), so p53 and Rb look dead. Put DNA damage on the main panel with a nonzero default. |
| Chi-square | How far observed counts sit from expected, and when that beats chance | LEAVE | Drag bars against expected boxes, contributions stack, curve and critical line move. The graph is the idea. |
| Confidence intervals | Overlapping 2 SE bars mean chance could explain the gap | LEAVE | Small: mean labels overlap each other at small SD and on phone ("7.40" over "7.04", "9.43" over "overlap"). |
| Descriptive stats | Mean vs median vs SD vs SE on one dot plot | LEAVE | Small: the dot plot uses the top third of the stage; the axis runs to 14 so the dots are cramped at the left. |
| Design drills | Name variables, controls and claims from a described experiment | REDESIGN | Every one of 16 scenarios is drawn as the same row of Erlenmeyer flasks with bar charts inside, even fat melting points, rabbits, ponds, fruit fly lines and woodlice. See notes. |
| Energy flow | Only about 10% passes up; the rest leaves as heat | FIX | Picture view is right. Pyramids view opens on log widths, so the pyramid looks like a column and hides the 10% drop; open on widths to scale. Pyramid text is tiny. |
| Enzyme activity | Substrate, temperature, pH and two kinds of inhibitor change the rate | FIX | Picture is excellent (saturation, unfolded enzymes, inhibitor in or beside the site). But inhibitor, pH and enzyme choice are buried at the bottom of Data & settings, while the legend already names both inhibitors. Put them on the main panel. |
| Graph builder | Turn a data table into a full-credit graph | FIX | Builds the graph step by step correctly. At 1280 the Plot step's point table is clipped on the right: the y value and error bar inputs are cut off in the side panel. Data set picker hides inside "What full credit needs". |
| Hardy-Weinberg and drift | Small populations drift; large ones hold p steady | FIX | At N = 500 and 1000 the beads overflow the jar over the lid. In Guess N the mystery graph is a thumbnail in the side panel while the big stage still shows your own Explore runs. "Compare population sizes" only writes a table. |
| Hardy-Weinberg calculations | p and q set the genotype areas: p², 2pq, q² | LEAVE | The Punnett square sized by p, plus 100 individuals, is the idea. |
| Meiosis and nondisjunction | Where an error happens decides which gametes are n+1 and n-1 | LEAVE | Chromosomes, cells and gametes are drawn properly; nondisjunction in I and II both show. |
| Operons | Repressor, inducer and CAP decide whether the genes are read | FIX | Explore picture is right for lac and trp. Mutant quiz shows a blank stage. Mutant genes (lacI-, Oc, lacZ-) only live in Data & settings. See notes. |
| Osmosis | Water moves toward lower water potential | LEAVE | Potato cell, red cell and dialysis bag all react correctly. Small: the three specimen chips do not fit the panel at 1280 ("Di" is cut off). |
| Population growth | Exponential vs logistic growth toward K | FIX | Picture is a meadow of tiny rabbits. At K = 2000 it switches to "1 drawn = 10", so a bigger population looks emptier than 500. The S curve only shows on the other tab. Flood and frost buttons are clipped. See notes. |
| Rates and percent change | Rate is a slope (Δy/Δt) | FIX | The tangent at the handle is a short faint stroke that runs through its own label. "Clear the triangles" leaves the tangent and label up. Percent change, half the title, has no Explore picture. |
| Signal transduction | One hormone molecule ends as millions of glucose per second | REDESIGN | A small static cell drawing over a ladder of numbered boxes with dot meters. The amplification is only in the numbers. Opens already at steady state. See notes. |
| Simpson diversity | Evenness and richness both raise D | LEAVE | Quadrat of trees plus the D bar react at once. Small: the colored stack above the D line has no label. |
| Tree reading | Read MRCA, clades and sister groups; place characters | LEAVE | Small: Build a tree shows only the table until the first join. The lizard icon reads as an arrow. |
| Water potential | ψ = ψs + ψp, and water runs downhill | LEAVE | The water levels on a shared ψ scale are the idea. |

Counts: LEAVE 9, FIX 8, REDESIGN 2.

## Notes

**Design drills (REDESIGN).** The tool is about reading an experiment, so the sketch should be that experiment.
Right now the flask with bars inside is a bar chart dressed up as glassware, and the numbers above each flask have no
labels. Negative melting points (-12.8, -23.9 °C) are drawn as near-zero positive bars, which is misleading.
What it should show: one small scene per kind of setup, with the parts the student taps (the IV, the DV, the
controlled variables) drawn as real things. For example: flasks of duckweed with nitrate labels; a pond row with
phosphate added; a woodlouse choice chamber (moist side, dry side); fly vials at four temperatures; rabbit with an
ice pad. The data go in a plain, labeled chart beside the scene. The scenario text is cut off at the bottom of the
stage at 1280x800 ("Four flasks are grown a..."). On phone the flasks are fine but small.

**Signal transduction (REDESIGN).** The idea is amplification, so the picture should get wider at each step. Draw
the cascade as a fan or funnel inside the cell: one epinephrine at the top, a few receptors, more G proteins, many
cAMP, and so on, with the width or the number of drawn molecules growing by powers of ten, and Play filling it from
the top down. Blocking a rung (antagonist, PDE or PKA inhibitor) should visibly stop everything below it. Keep the
numbers as labels. Open at time 0, not at steady state. On phone the ladder splits into two columns, numbers are
clipped ("3,400") and the bottom rung is cut off.
Accuracy check: "1 for every 200" from cAMP to active PKA is labeled as binding; a PKA holoenzyme needs 4 cAMP. If
200 is a model rate, say so, or students may learn it as a ratio.

**Cell cycle (FIX).** The ring of cells is a fine picture. With growth factor 100% and damage 0, toggling p53 or
Rb changes nothing. Show DNA damage on the main panel, default about 2% per hour, so p53 lost visibly lets red
damaged cells through G1 check. Spindle poison (in settings) works well: cells pile up at the M check.

**Operons (FIX).** Mutant quiz: draw the mystery strain's operon in each medium (with the mutated part hidden or
marked "?"), or at least the table as a chart, instead of a blank stage. Move the lacI, operator and lacZ choices
out of Data & settings. The DNA strip fills a thin band in a tall stage; with the settings panel open it becomes
unreadable.

**Population growth (FIX).** Keep the meadow but put a live N(t) curve under it (or beside it) so the S shape and K
grow as Play runs. Keep the drawn density honest: density should rise with N whatever the scale, or scale the
meadow size with K. Show the flood and frost as events (water, frost) and a dip on the curve. The chip row with
Flood and Hard frost is clipped at 1280 ("d at year 15").

**Hardy-Weinberg and drift (FIX).** Cap the drawn beads at the jar size (or draw a bigger jar) for N of 500 and
up. In Guess N, show the mystery runs large on the stage.

**Enzyme activity (FIX).** Only control placement. Inhibitor type, inhibitor concentration and pH belong next to
substrate and temperature.

**Phone (390x844).** No page scrolls sideways. Problems: graph builder's graph is tiny under the data table and the
Next button overlaps the answer list; signal transduction clipped as above; confidence interval labels collide;
population rabbits are specks; enzyme legend runs off the right edge.

**Not opened or partly checked.** All 19 opened. Tree reading's Questions tab was not answered (the run was
stopped for time); Read and Build were used.
