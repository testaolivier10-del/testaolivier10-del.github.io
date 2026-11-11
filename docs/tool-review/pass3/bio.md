# AP Biology: cleanup round (pass 3), 2026-11-11

Builder c3, branch claude/tv3-c3. Judge file: `pass2/judge-a.md` (AP Biology rows) plus the lead's list in
`CLEANUP.md`. Every tool below was reopened cold at 1280x800 and 390x844 after the change. Shots:
`/home/claude/shots/pass3/bio/<tool>_before_d.png`, `_after_d.png`, `_after_p.png`. One commit per tool.
Counts are desktop opening screen, pics/labels on the picture/live numbers/controls showing (dock)/words outside
buttons, measured by eye on the screenshots (the judge's control counts include tabs and tappable parts; mine
count the dock controls only).

| Tool | Judge said | What I did | Verdict now |
|---|---|---|---|
| signal-transduction-amplification | FAIL: rows unnamed until tapped; "Glucose out 1,540/s" pill disagrees with the picture's "1,050,000"; glucose flows before Play while receptors read 0 | Every cascade row now carries a short name at its left (receptor, G protein, adenylyl cyclase, cAMP, PKA, phosphorylase kinase, glycogen phosphorylase, glucose out), muted; the step in focus adds its full name, count, gain and any drug. The pill and the readout now follow the moment the picture shows (they were stuck at the read time while Play swept the picture). At time zero the rate is marked "(resting)" on the pill and the focused row: with no receptor bound the model's basal G protein activity still makes a little glucose, which is real, so it is named rather than hidden. Dropped the "inside the cell" label (membrane and shading say it). 1/13/1/3/16 (was 1/7/1/3/18; the extra labels are the row names the brief asked for) | PASS |
| population-growth | TOUCH UP: unidentifiable green sprites; year label overprinted; switching to Exponential leaves the logistic graph | The bug: Play captured the simulation when it started, so a model switch mid-run drew the old curve until the end. Play now simulates from the current settings each frame. The rabbits take rabbit brown (the icon's own green had overridden it), births this year a warmer tan. The year tag sits on its own paper chip, says "1 rabbit = 5", and shows the readout's year (it said year 30 while the run had stopped at 24). | PASS |
| energy-flow | TOUCH UP: heat squiggles read as worms; coach covers "GPP 20,000" (lead: bottom number hidden); phone labels about 6 px | Heat is a thin wavy arrow with a head leaving each box (thicker for more heat), and "heat" is named once. GPP was said twice (box "20,000 captured" and the bottom line): the producer box now reads "20,000 GPP" and the bottom line is "sunlight · kcal/m²/yr", so nothing is lost under the hint. On a phone the picture is drawn narrower (340 wide, narrower boxes, shorter arrows) so its words read at about 13 px. 1/10/1/2/24 | PASS (the hint bubble itself is the shared builder's) |
| design-drills | TOUCH UP: about 164 words; 70 word paragraph under the flasks | The setup paragraph sits behind "Read the setup" under the drawing (hidden on the Results view as before). Caption cut to "Look at the experiment, then answer one drill at a time." Words outside buttons about 80 (was 164; the rest is the drill question and its choices, which are the task). | PASS |
| cell-cycle-checkpoints | TOUCH UP: 2 sliders and 4 mutation checkboxes on landing | The four mutations fold under one "Mutations: break a checkpoint" row, which opens by itself after the first checkpoint tap. Dock: 2 sliders + 1 row. | PASS |
| confidence-intervals | TOUCH UP: "10.93 / overlap / 8.07" cramped; on the phone "overlap" runs into "9.43" | "overlap" or "gap" now sits inside the band, centered in the free space between the left bar's values and the right bar; values stay beside the caps. Checked on both sizes. | PASS |
| descriptive-stats | TOUCH UP: -1 SD, +1 SD, ±1 SE, median, mean piled up | In Explore only mean and median are named on the plot; the band and bracket are named by the key under it. Practice (no key) keeps its labels. 1/2 on the plot (was 5). | PASS |
| enzyme-activity | TOUCH UP: 3 sliders and an inhibitor select on landing | Substrate is the one slider; temperature, pH and the inhibitor sit under "Change conditions" (a Predict challenge that changes them opens it). | PASS |
| graph-builder | TOUCH UP: opens on a blank grid plus a table plus 90 words; phone shows the table first | Until the axes are set the data appear as faint dots on their own scale on the practice grid, and the grid drops its placeholder 0 to 10 numbers so the dots read as a shape, not values. Real points replace them once the axes are set; grading unchanged. Phone: left as designed (the data are open for step 1, which needs them, then fold so the grid has the stage; the dots show from step 2). | PASS on desktop; phone step 1 still data first by design |
| hardy-weinberg-drift | TOUCH UP: opens at generation 100 with a summary of runs never seen | Opens at generation 0; the caption says every population starts at p = 0.500 and to press Draw generations. The fates appear as Play reaches them. Scenarios and settings changes still jump to the end (the student asked for that run). | PASS |
| operons | TOUCH UP: about 15 labels; phone gene row wraps, proteins far from the operator | lacI, lacY and lacA labels dimmed (a mutated lacI keeps its full label). Phone: looked again; the two-line strip keeps CAP over the CAP site and RNA pol over the promoter; the released repressor waits above lacI by design (it is not bound when lactose is present). Left. | PASS |

Untouched (judge PASS): chi-square, hardy-weinberg, meiosis-nondisjunction, osmosis, rates, simpson-diversity,
tree-reading, water-potential.

## Accuracy
No fact, answer or scoring changed. Signal transduction: the "(resting)" tag describes the model's own basal rate
(kBasal G protein activation, receptors at 0); the numbers are the model's. Energy flow: GPP for the producers is the
same value as before (the energy they capture). Population growth: the bug was display only.

## Checks
`node scripts/build-apbio.mjs --check` clean; `check-apbio-content` 0 failing; `check-apbio-map` clean;
`node --test scripts/test/apbio*` 71 pass, 0 fail; check-site clean (no broken local references); check-weight: all 620 budgets within range.

## Not mine (for the lead)
The hint bubble covers the producer box on energy flow (phone) and the drill choices on design drills; the shared
builder is fixing it.
