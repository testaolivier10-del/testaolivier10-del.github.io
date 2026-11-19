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

| 2026-11-18 | NREMT Mnemonics | Explore is a drawn patient: four tabs (DCAP-BTLS, AVPU, OPQRST, SAMPLE), tap a letter and the EMT does that check | Owner: Explore must be free play that shows an idea; the idea is that each letter is one check on a patient | `docs/tools-v2-nremt-mnemonics-brief.md` |
| 2026-11-18 | NREMT Mnemonics | The other 15 mnemonics and scales are in Test yourself only (every card and its Fill the letters check, unchanged) | They need other patients (a newborn for APGAR, a face up close for BE-FAST); candidates for later tabs | `TABS` in `nremt/assets/mnemonics.js` |
| 2026-11-18 | NREMT Mnemonics | Reading a card (the old free view) is now in Test yourself, where each card shows until Fill the letters | Rule 7: Explore is free play, Test yourself holds the cards and the check | The page's script in `nremt/mnemonics.html` |
| 2026-11-18 | NREMT Mnemonics | A `#m-...` link to DCAP-BTLS, AVPU, OPQRST or SAMPLE opens Explore on that tab; any other `#m-...` opens Test yourself on its card; Test yourself writes `#test-m-...` | Old links keep working and land on the best view | Same script, `start()` |
| 2026-11-18 | NREMT Mnemonics | Explore's patients are made up (a rider, a man on the sidewalk, a woman of 58 with chest pain); the chest pain answers match scenario s2 | One patient per assessment | `docs/nremt-needs-author.md` (Mnemonics tool) |
| 2026-11-18 | NREMT Mnemonics | OPQRST severity drawn as 0 to 10 (the card says 1 to 10) | The usual numeric rating scale | `docs/nremt-needs-author.md`; card unchanged |
| 2026-11-18 | NREMT Mnemonics | The page's "Read a card, then press Fill the letters" line removed from the v2 frame (still there with `?studio=0`) | Test yourself's side panel already says it | The page's script |
| 2026-11-18 | NREMT Mnemonics | Letter keys are 38 to 44 px wide on a 360 px phone (eight keys in one row); 46 px tall | The letters read as the word only in one row | `.mn2-key` in `nremt/assets/mnemonics.css` |
| 2026-11-18 | NREMT Mnemonics | First NREMT tool on the v2 kit: `NremtStudio.kit2` added; no other NREMT page calls it | The ApBioTools.studioKit2 pattern | `nremt/assets/nremt-studio.js` |
