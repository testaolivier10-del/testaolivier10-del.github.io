# AP® Biology tools in the standard frame (F3, 2026-11-16)

Spec: `docs/tools-frame-2026-11.md`. Shared API: header of `assets/course/tool-studio.js` and `docs/tools-calm.md`.
`bio/assets/tools/bio-tools.js` mounts every bio tool with `std: true` (`studioFrame`), so all 19 get the same frame
from one place; the per tool work is in the course layer plus four tool files.

## What every bio tool got (course layer, `bio-tools.js`)
| Feature (before) | Where now |
|---|---|
| Title, back, "?" (Explanation), menu (Copy link, About, Report, tutor, Course home, All tools) | bar: name, the page's one line (hero lede), modes, Ask the tutor, Share, "?", menu |
| Mode switch in the dock (Explore / Practice, the simulator's own modes, Questions) | bar (second row on a phone) |
| "Data & settings" dock button (second sheet: readouts, more settings, the problem's text and code) | "?" opens that sheet (named as before); the menu has "Data and settings" too |
| Explanation button by the caption | same, shown only while Why has something |
| Explore caption (live "what happened") | unchanged; above it the task: kicker Explore, the question the tool answers, the line on what to do first (`STD` table) |
| First-run hint (ring and line on the control) | unchanged; now also hidden while its target is out of sight (another mode) |
| Practice / Worked set radios (in Details) | one dropdown on the stage: "New numbers" or "Worked problem n" (radios stay, out of sight, and follow it) |
| Practice problem text (caption) | the side panel's head (kicker Practice problem or Worked problem, the problem, "Answer one part at a time") |
| Part Check; on a miss the slip note, "Method:" hint and Show the answer | Check and the slip note unchanged (feedback on the part); the method hint is the ladder's first rung, on request before any try; Show the answer is the ladder's last rung, open after one wrong Check |
| After the last part: score pill, worked solution (to Why), Keep going strip, New/Next problem, Try this one again, Report | pill unchanged; finished card: the score, Next (New problem / Next problem), Full explanation (worked solution with Keep going under it), Try this one again, Review your answers, Read the lesson; Report stays under the parts (Review your answers) and in the menu |
| Questions mode (stimulus questions, mini FRQ, rubric) | unchanged; the caption became the task (Questions / Free response / Score your answer) |
| Challenge rounds in simulators (Predict, Diagnose, Challenge, Guess N, Mutant quiz): verdict, reason, Next button in the box | box unchanged; when a round ends the finished card shows the verdict, the reason, the box's own Next (Next challenge, Next dish, Next gamete, Next population, Next strain), See the result again, Full explanation, Read the lesson |
| Locked Premium tool: lock card in the calm bar | lock card in the standard bar (name and one line; no modes or Share), via `data-ls-std` set by `bio-core.js` |

## Per tool
Explore tasks below are new copy (accuracy check list at the end). "Same" = nothing else moved.

- **Chi-square test** (Explore, Practice). Explore: bars to drag, the χ² meter and curve, Chance sample, Double the sample, Reset to expected, "The test" select (6 tests). "The test" is now the stage dropdown ("2 of 6"). Practice: as above.
- **Confidence intervals and error bars**, **Mean, SD and standard error**, **Hardy-Weinberg calculations**, **Rates and percent change**, **Simpson's diversity index**, **Water potential calculations** (Explore, Practice). Same as the course layer; their explore controls (drag handles, buttons, the water potential solute select, which is a setting, not a scenario) stay.
- **Graph builder** (Plot the data, Free plot). Data set select is now the stage dropdown ("1 of 6") at every width (it was in Details on a phone). The data set's description heads the side panel with "Answer one step at a time, then check your graph." (Free plot: "Sketch any graph of these data; it is not checked."). After Check my graph: finished card (criteria met, Next data set, What to fix / Full explanation, Fix your graph / Review your graph, the lesson) instead of opening Why by itself.
- **Experimental design and argumentation** (no modes). Scenario select is the stage dropdown (16 experiments); the experiment's heading on the stage is screen-reader only (the dropdown names it). Task: "Experiment n of 16 / Look at the experiment, then answer one drill at a time." Drill filter stays in Details. New finished card when every drill of the experiment is checked and each written answer has its rubric: score, Next experiment, Review your answers, How the drills work, the lesson.
- **Osmosis and water potential** (Explore, Predict, Questions). Explore task added; Predict rounds get the finished card. Picture / Mass graph view switch, the system chips, Play, time slider, readouts all unchanged.
- **Enzyme activity and inhibition** (Explore, Predict, Questions; Premium). Same pattern; the inhibitor select is a variable, so it stays in the dock.
- **Cell cycle checkpoints** (Explore, Diagnose, Questions; Premium). Same pattern; Diagnose rounds end in the finished card (Next dish).
- **Energy flow and ecological pyramids** (Explore, Questions; Premium). Explore task added; the rest same.
- **Hardy-Weinberg and genetic drift** (Explore, Guess N, Questions; Premium). Explore task; Guess N rounds end in the finished card (Next population). N select is a variable: stays.
- **Meiosis and nondisjunction** (Explore, Challenge, Questions; Premium). Explore task; Challenge rounds (make a gamete) end in the finished card (Next gamete). Nondisjunction select is a variable: stays.
- **Lac and trp operons** (Explore, Mutant quiz, Questions; Premium). Explore task; Mutant quiz rounds end in the finished card (Next strain).
- **Population growth** (Explore, Questions; Premium). Explore task; rest same.
- **Signal transduction and amplification** (Explore, Questions; Premium). Explore task; rest same.
- **Phylogenetic tree reading** (Read a tree, Build a tree, Questions; Premium). Each of the two explore views has its own task; the tree choice stays a setting in Details.

## Bugs fixed
- Practice, Worked set: "Next problem" never moved on (a local `at = 0` in `skillTool.draw` shadowed the set's index), so a student saw problem 1 again and again and the stage state's index was always 0.
- Std frame (all courses): with the modes in the bar, a mode switch no longer dismissed the first-run hint, so an Explore hint ("Drag to aim") showed in another mode. The hint line now hides while its target is out of sight (`tool-studio.js`, `hint` place()).
- Std frame on a phone (all courses): a long tool name wrapped the bar and pushed "?" and the menu onto a row of their own (and on some tools hid the name); the name now shrinks with an ellipsis (`tool-studio.css`).

## Judgment notes
- The challenge modes keep their live line as the caption (beside Explanation); routing it into the task left Explanation alone on a line and added nothing, since the challenge box below is the task.
- No finished card for Questions mode: it ends in the mini FRQ's own rubric score, which already is its end.
- Reset buttons (Reset to expected, Clear runs...) stay beside the action they undo rather than moving to the stage foot: they reset the tool's state, not an edit history, and splitting them from their row would add a reach for no gain.
- A simulator's variable selects (inhibitor, N, nondisjunction, beaker solute) are not scenarios: they stay in the dock.

## New copy for the accuracy check
Explore questions and "what to do" lines (`STD` in `bio-tools.js`):
chi-square: "When is a gap between observed and expected too big to be chance?" / "Drag a bar away from its dashed box and watch χ² grow."
confidence-intervals: "When do two groups really differ?" / "Drag a bar and watch the error bars overlap or pull apart."
descriptive-stats: "How does one data point move the mean, median and spread?" / "Drag a dot sideways and watch the numbers change."
hardy-weinberg: "How do allele frequencies set genotype frequencies?" / "Drag the corner to change p and q."
rates: "How fast is it changing between two points?" / "Tap a point on the graph, then a second one."
simpson-diversity: "What makes a community more diverse?" / "Plant trees in the quadrat and watch the index."
water-potential: "Which way will water move?" / "Slide the beaker concentration and compare ψ inside and out."
osmosis: "Which way does water move, and why?" / "Slide the beaker concentration, then press Play."
enzyme-activity: "What limits how fast an enzyme works?" / "Slide the substrate concentration, then try an inhibitor."
cell-cycle-checkpoints: "What stops a damaged cell from dividing?" / "Tap a checkpoint on the ring, then add DNA damage."
energy-flow: "Why is so little energy left at the top of a food chain?" / "Tap a level to see where its energy goes."
hardy-weinberg-drift: "What changes allele frequencies from one generation to the next?" / "Press Draw generations, then change the population size."
meiosis-nondisjunction: "Where do extra or missing chromosomes come from?" / "Step through meiosis, then make one pair fail to separate."
operons: "When are the lac and trp genes switched on?" / "Tap a sugar to change the medium and watch the operon."
population-growth: "What slows a growing population?" / "Press Play the years, then switch to logistic growth."
signal-transduction-amplification: "How does one hormone molecule cause a big response, and how does it stop?" / "Press Play and follow the signal down the cascade."
tree-reading: Read: "Which species are most closely related?" (the todo is the tool's own line); Build: "Which groups share a derived character?"
Finished cards: "Every part right on the first try.", "The worked solution shows each part.", "This graph earns full credit.", "What to fix is in the full explanation.", "Score your written answers with their rubrics.", "The feedback is under each answer."; graph builder free plot: "Sketch any graph of these data; it is not checked."

## Questions for the owner (nothing removed)
1. The Practice / Worked set radios still sit in Details (hidden) behind the new dropdown; fine to delete that markup later?
2. Reset buttons stay in the dock beside their action (see judgment); move them to the stage foot anyway?

## Accuracy check (F6b, 2026-11-16)
Checked every string in "New copy for the accuracy check" against the tool, the course and `docs/apbio-authoring-guide.md`.
Each "what to do" line names a control the tool has (its own first-run hint or lead says the same).
- Correct as written: chi-square, confidence-intervals, descriptive-stats, rates, simpson-diversity, water-potential,
  osmosis, enzyme-activity, cell-cycle-checkpoints, energy-flow, meiosis-nondisjunction, population-growth,
  signal-transduction-amplification, tree-reading (both views); all six finished card lines; the graph builder free
  plot line; "Experiment n of 16 / Look at the experiment, then answer one drill at a time."
- Changed: hardy-weinberg "How do allele frequencies set genotype frequencies?" to "In Hardy-Weinberg equilibrium, how
  do allele frequencies set genotype frequencies?" (they only set them under the equilibrium's conditions, which is
  what the square models).
- Changed: hardy-weinberg-drift "What changes allele frequencies from one generation to the next?" to "How can chance
  alone change allele frequencies from one generation to the next?" (the tool shows drift only; the old question
  also invites selection, mutation and gene flow).
- Changed: operons "Tap a sugar to change the medium..." to "Tap a sugar (or tryptophan) to change the medium..." (the
  trp operon's chip is tryptophan, not a sugar). The tool's own first-run hint still says "Tap a sugar"; left as it is.
