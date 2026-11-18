# Tools v2: decisions made on the owner's behalf

The owner does not review each tool (`docs/tools-v2-standard.md`, "Process per tool"). Every decision a builder or
reviewer makes for him goes here, one line each, newest last, so he can skim it and reverse any of them. Details are
in each tool's brief.

| Date | Tool | Decision | Why | Where it went / how to reverse |
|---|---|---|---|---|
| 2026-11-17 | AP Bio Osmosis | Dialysis bag left out of Explore | Two concentration controls on one picture is the Water potential tool's screen | Still in Test yourself (Predict). Reverse: a third Explore tab |
| 2026-11-17 | AP Bio Osmosis | NaCl left out of Explore (sucrose only) | "More solute" then always means higher molarity | Still in Predict and in Water potential |
| 2026-11-17 | AP Bio Osmosis | Temperature slider removed from Explore | It changes nothing you can see | Fixed at 22 °C and 37 °C, stated in "?"; still in Water potential |
| 2026-11-17 | AP Bio Osmosis | Time slider removed from Explore | Explore shows where the cell settles | Timed runs are in Predict; "Watch it happen" replays the change |
| 2026-11-17 | AP Bio Osmosis | "Run one trial", "Run a series" and the table of your own noisy runs removed | A data collecting job, not this tool's idea | The model's curve and table are in "?". Candidate for a later separate tool (a potato core lab) |
| 2026-11-17 | AP Bio Osmosis | Mass graph, readouts and equations moved | Nothing extra on the Explore screen | "?" |
| 2026-11-17 | AP Bio Osmosis | The ψ scale (ladder) taken off the picture | It is the Water potential tool's screen; the two tools stay separate | Values in "?"; the comparison is in the cause line |
| 2026-11-17 | AP Bio Osmosis | Explore's plant cell is an idealized cell, flaccid in the isotonic solution, not the potato core | So "isotonic" and "no net movement" are the same stop | `docs/apbio-needs-author.md`, osmosis-explore-plant-cell |
| 2026-11-17 | AP Bio Osmosis | No optional teaser line | Keeps the screen quiet | Add one per tab if wanted |
| 2026-11-17 | AP Bio Osmosis | Tab renamed "Animal cell" to "Red blood cell" | The label names what is drawn (rule 15) | `explore.cells` in the tool's data |
| 2026-11-17 | AP Bio Osmosis | A burst cell does not heal: dragging back puts a new cell in, marked "new cell" | The honest behavior | `changed()` in `bio/assets/tools/osmosis.js` |
| 2026-11-17 | AP Bio Osmosis | When a change sends water back the other way, the cause line tells that change ("Less solute than before → ... → water moves back in") | The cause line must never disagree with the arrows (rule 14) | `chain()` in the same file |
| 2026-11-17 | AP Bio Osmosis | Water arrows only while water is moving; with reduced motion a still mark of the last change instead | Rule 13 | Same file |
| 2026-11-17 | AP Bio Osmosis | The hub blurb and the About intro were reworded; title, description and URL unchanged | They described the old Explore | `bio/data/pages.json`, the tool's data |
| 2026-11-18 | AP Bio Osmosis | The dashed "before" outline of the cell removed; the tick on the track stays | Reviewer: it read as a second membrane or a nucleus | Review round 1 in the brief |
| 2026-11-18 | AP Bio Osmosis | While water moves the cause line stops at the water pill; the result is added when the cell is in that state | No word may run ahead of the picture (rule 14) | `chain()` |
| 2026-11-18 | AP Bio Osmosis | The change story ("than before") shows only during a reversal and never when settled | 0.30 M must always end on "no net water movement" | `chain()` |
| 2026-11-18 | AP Bio Osmosis | Reviewer's idea to keep the first two cause pills through a reversal was not taken | They would name a cause that points against the arrows | Review round 1 in the brief |
| 2026-11-18 | AP Bio Osmosis | Drawn areas follow the model (cell and vacuole by water, protoplast by mass) | Inside and outside crowding must match once settled | `shape()` |
| 2026-11-18 | AP Bio Osmosis | Potato challenges say "24 hours"; Replay sits in the feedback; a phone scrolls the picture into view for a run | Reviewer | Test yourself, Predict |
| 2026-11-18 | AP Bio Enzyme activity | Four tabs (Substrate, Temperature, pH, Inhibitor); the two kinds of inhibitor share one tab with a quiet switch | Five big tabs do not fit a phone; the two are compared one tap apart | Reverse: split into tabs 4 and 5 (`explore.tabs`) |
| 2026-11-18 | AP Bio Enzyme activity | The inhibitor tab keeps a small second knob, Substrate | "More substrate overcomes a competitive inhibitor and not a noncompetitive one" is the exam's distinction and has to be done, not read | `cSub2` in `bio/assets/tools/enzyme-activity.js` |
| 2026-11-18 | AP Bio Enzyme activity | Explore uses Enzyme A only, with the other conditions fixed on each tab (37 °C, pH 7, 10 mM substrate) | One idea and one control per screen | Enzymes B and C and mixed conditions are still in Test yourself (Predict); brief, questions 1 and 2 |
| 2026-11-18 | AP Bio Enzyme activity | A denatured enzyme does not refold on a drag back: it fades and new enzyme comes in, marked "new enzyme" | The honest behavior (lesson from Osmosis) | `step()` in the tool's file |
| 2026-11-18 | AP Bio Enzyme activity | A pH more than about 3 units from the best is drawn as denaturing; nearer, only the site's charges change and it is undone | The CED says a far pH denatures; the model has ionization only | `docs/apbio-needs-author.md`, enzyme-explore-drawing |
| 2026-11-18 | AP Bio Enzyme activity | The rate is a bar on the picture with no number; its top is the best rate that tab's control can reach | No numbers on the picture except the knob's | The number, Vmax and Km are in "?" |
| 2026-11-18 | AP Bio Enzyme activity | Run one trial, Run a series, the runs table and the live rate graph left Explore | Explore is free play on the picture | Curve and table in "?"; brief, question 3 |
| 2026-11-18 | AP Bio Enzyme activity | Temperature capped at 70 °C (was 100); the substrate knob opens at 2 mM, half the top rate | Capped ranges; a drag either way does something | `explore` in the tool's data |
| 2026-11-18 | AP Bio Enzyme activity | The hub blurb and the About intro were reworded and "run trials and" was cut from the description; title and URL unchanged | They described the old Explore | `bio/data/pages.json`, the tool's data |
