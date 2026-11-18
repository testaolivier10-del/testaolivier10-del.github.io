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

| 2026-11-18 | AP Bio Simpson diversity | Explore is a drawn woodland plot of trees; the icon quadrat stays in Calculate D | Rule 12: the real thing drawn | `docs/tools-v2-simpson-diversity-brief.md` |
| 2026-11-18 | AP Bio Simpson diversity | Five species and 36 places in Explore (old: six species, up to 200) | Five drawn trees fit the tray at 360 px; 36 stay trees, not dots | `explore.species`, `explore.spots` in the tool's data |
| 2026-11-18 | AP Bio Simpson diversity | Last Build goal is D above 0.75 (old 0.80) | With five species D can be at most 0.80 | `explore.goalHigh` |
| 2026-11-18 | AP Bio Simpson diversity | The −/+ rows and the stacked (n/N)² meter moved to "?" | No controls or panels beside the picture | "?" (Numbers & formula) |
| 2026-11-18 | AP Bio Simpson diversity | The old Explore goals are "Build a community" in Test yourself, on the same plot; it starts from the opening plot and leaves the Explore plot alone | Rule 7 | `#build` |
| 2026-11-18 | AP Bio Simpson diversity | The gauge marks the most D can be with that many species (1 − 1/S) | Shows richness and evenness as two different moves | `syncWords()` in the tool's js |
| 2026-11-18 | AP Bio Simpson diversity | The plot can be emptied (old kept one organism) | Empty reads "No trees, nothing to measure" | Same file |
| 2026-11-18 | AP Bio Simpson diversity | Second tab named "Numbers & formula"; hub blurb reworded; title, description and URL unchanged | Name what is in it | `bio-tools.js`, `pages.json` |
| 2026-11-18 | A&P Graphs | Explore shows five drawn screens (Heart, Lungs, Red blood cell, Axon, Sarcomere); the other 71 graphs are in Test yourself | Rollout open question 5: a short curated set in Explore, the full bank in Test yourself | `docs/tools-v2-anp-graphs-brief.md`. Reverse: add a screen to `SCENES` in `graphs-explore.js` |
| 2026-11-18 | A&P Graphs | Each graph's old Explore (reading cursor and What if) kept in Test yourself as "Read it" beside "Questions" | 71 graphs have no drawn screen yet; nothing dropped | Same brief. Reverse: remove the Read it switch |
| 2026-11-18 | A&P Graphs | No Play or "Watch it happen": the student drags time along the graph | One control; nothing moves by itself | Same brief |
| 2026-11-18 | A&P Graphs | The Heart screen draws the pressure panel only; the volume is the ventricle's drawn size and its number; ECG and sounds stay in Test yourself | One idea per screen | Same brief |
| 2026-11-18 | A&P Graphs | The left ventricle's curve and label are blue, not the course's red tones | Its curve runs on top of the aorta's in ejection and the two must stay apart in light and dark | `graphs-explore.css` |
| 2026-11-18 | A&P Graphs | Hemoglobin drawn filling one molecule at a time (cooperative binding) | Shows the S shape's cause; said in "?" | `docs/anp-needs-author.md` gx-hb-fill-order |
