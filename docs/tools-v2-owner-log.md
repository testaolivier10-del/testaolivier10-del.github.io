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
| 2026-11-18 | AP Bio Water potential | Explore has two controls on the picture: pressure in the cell (main) and solute outside (quiet) | ψ = ψs + ψp: one handle per part of the sum; both drive the same idea, so they stay together | Brief, "The design" |
| 2026-11-18 | AP Bio Water potential | Practice mode is Test yourself, content, grading and record ids unchanged | Rule 7 | Test yourself; `?seed=` and `#practice` still open it |
| 2026-11-18 | AP Bio Water potential | The shared ψ scale with two level lines left the picture | The comparison is the word on each total ("higher", "lower", "equal") | "?" ("The two totals on one scale") |
| 2026-11-18 | AP Bio Water potential | Beaker solute NaCl, the temperature slider and the cell sap slider left Explore (sucrose, 22 °C, 0.40 M fixed) | They do not drive the screen's idea; one main control | In the practice problems and explained in "?" |
| 2026-11-18 | AP Bio Water potential | Explore rounds each ψs to 0.1 bar before adding | Every sum on the picture is exact and "equal" can be reached by hand | Practice keeps 0.01 bar; `outS` in the tool |
| 2026-11-18 | AP Bio Water potential | Cell ψs held at −9.8 bar while pressure changes; pressure capped at 9.8 bar | Textbook model of a walled cell; ψ cannot rise above pure water's 0 | `docs/apbio-needs-author.md` water-potential-explore-fixed-sap |
| 2026-11-18 | AP Bio Water potential | The cell shrinking from its wall (plasmolysis) is not drawn here | This picture is the moment the cell goes in; what happens next is Osmosis's screen | "?" points to Osmosis |
| 2026-11-18 | AP Bio Water potential | The "Try this" goals moved to "?" ("Things to try"), reworded for the two controls | Rule 6 | "?" |
| 2026-11-18 | AP Bio Water potential | The solute key (sucrose hexagon, Na⁺ and Cl⁻ dots) is gone | Particles are drawn at i × C, one kind of dot | "?" says so |
| 2026-11-18 | AP Bio Water potential | The old practice drew the student's typed ψ values as level lines on a scale ("does your arrow run downhill?"); now the typed values fill the two sums and the comparison shows only after the last part | The sums are the picture's subject; one scale beside them was a second picture | "?" ("The two totals on one scale"); review round 1 |
| 2026-11-18 | AP Bio Water potential and Osmosis | "No net movement" is drawn as thin two headed arrows (water crosses both ways at the same rate), not dashed lines | Reviewer: the dashes read as ghost arrows | `both()` in each tool |
