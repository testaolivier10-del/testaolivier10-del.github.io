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

| 2026-11-18 | AP Bio Energy flow | The picture is a drawn grassland chain of four (grasses, grasshoppers, frogs, snakes); one drawn per 10 kcal, so counts are the energy | One idea, read without a chart (rule 12) | `docs/tools-v2-bio-energy-flow-brief.md` |
| 2026-11-18 | AP Bio Energy flow | Two controls on the picture (share passed on, sunlight); respiration shares, number of levels and ecosystem are fixed in Explore | One main control (rule 11) | "?" states the fixed values; restore the sliders in Test yourself or a later tool |
| 2026-11-18 | AP Bio Energy flow | Biomagnification (8.7) moves from a mode to "?" | Different idea from 8.2 | "?" section; a separate tool can come later |
| 2026-11-18 | AP Bio Energy flow | The runs table is dropped; a series table for shares 5 to 20% is in "?" | Explore records nothing | `refHtml()` |
| 2026-11-18 | AP Bio Energy flow | The cause line says "lost as heat" for all not passed on (AP shorthand); "?" splits heat and decomposers | Short cause line | `docs/apbio-needs-author.md` energy-flow-model |
