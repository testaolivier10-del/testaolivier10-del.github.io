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
| 2026-11-17 | Ochem Conformation Lab | Two tabs: Turn a bond, Flip a chair | Chairs are a different idea from turning a bond | Were two modes of one screen |
| 2026-11-17 | Ochem Conformation Lab | The main picture is a 3D ball and stick model; the Newman projection is a live inset | The real thing drawn as the real thing (rule 12) | Full size Newman in the "Where on the curve?" drill |
| 2026-11-17 | Ochem Conformation Lab | Opens on butane at anti (was ethane at 60°) | Calm, and a turn either way costs energy | `tor`, `theta` at the top of the model block in `conformations.js` |
| 2026-11-17 | Ochem Conformation Lab | All eight molecules kept, in one picker on the picture | Dropping five would be a silent removal | The picker |
| 2026-11-17 | Ochem Conformation Lab | Molecule builder and ring builder moved behind "?" | Extras start hidden | "?" sheet; the picture follows every change |
| 2026-11-17 | Ochem Conformation Lab | Dihedral slider and the Eclipsed / Gauche / Anti buttons replaced by turning the model, tappable dots on the hill and keys | The control is the picture | Same range input behind the handle |
| 2026-11-17 | Ochem Conformation Lab | Energy scale fixed at 0 to 6.5 kcal/mol for the listed molecules | So hills compare | `maxFor()` |
| 2026-11-17 | Ochem Conformation Lab | A shape keeps its name within 10° of its landmark (was 4°) | A dragged model rarely lands exactly | `AT` |
| 2026-11-17 | Ochem Conformation Lab | One ring you flip instead of two side by side; the strain meter bars are gone | One main object; the two chairs stand at the ends of the control | Strain number in the cause line, term table in "?" |
| 2026-11-17 | Ochem Conformation Lab | The flip can be stopped on the way and goes chair, half chair, boat; the twist boat is not drawn | The old animation passed through a flat ring, which is not on the path | `docs/ochem-needs-author.md`, conf-v2-flip-path |
| 2026-11-17 | Ochem Conformation Lab | Check yourself moved from the "?" sheet into Test yourself; "The left chair..." became "This chair is the stable one" | Quizzing lives in Test yourself; there is one ring | Same questions and record ids |
| 2026-11-17 | Ochem Conformation Lab | After an answer in "Where on the curve?" the picture stays as asked until Next one | The answer marks stay true | Old tool gave the slider back |
| 2026-11-17 | Ochem Conformation Lab | No optional teaser line | The screen is full | Add one per tab if wanted |
| 2026-11-17 | Ochem Conformation Lab | Wording fixes: anti is "lowest" only where the numbers say so; halogens and OH "repel"; ethane note gives both accounts of the barrier; em dashes out | Accuracy and the copy rule | `conf()`, `chainBond()`; ids unchanged |
| 2026-11-17 | Ochem Conformation Lab | Neighboring ring groups pay 0.9 kcal/mol (gauche) when at least one is a carbon group; two polar neighbors are not costed | OpenStax 4.8 for CH₃/CH₃; reviewer for the polar pairs | `chairEnergy()`; needs-author conf-v2-vicinal |
| 2026-11-17 | Ochem Conformation Lab | F A-value 0.25 (was 0.15) | The lessons print 0.25 | `SUBS.F.a` and the unit test |
| 2026-11-17 | Ochem Conformation Lab | Tab 1 view is side on and fixed; the model stands on a stand | No back group hides at a landmark; no second control | `bondCam()` |
| 2026-11-17 | Ochem Conformation Lab | "Half chair" and "Boat" each name a stretch of the flip; "high energy" only between the half chairs | Every frame has a name that matches the picture (rule 14) | `flipShape()` |
| 2026-11-17 | Ochem Conformation Lab | A ring with a group on C2 or C3 is seen from a little higher | Both gauche partners in view | `viewFor()`; left alone once the student turns the view |
| 2026-11-18 | Ochem Conformation Lab | Removed: the "before: ..." text (dashed line stays), the "Ring flip" pill, the third in between pill, the 360° button | Reviewer | Review round 1 in the brief |
| 2026-11-18 | Ochem Conformation Lab | Shorter cause pills ("Eclipsed: torsional strain", "CH₃ on CH₃: steric", "strain 1.7 kcal/mol"); "almost no / almost all molecules" at the extremes | Two rows at 360 px | `chainBond()`, `chainChair()`; screen readers get the long form |
| 2026-11-18 | Ochem Conformation Lab | A name with no clear spot on the picture is left out | Never laid over another name or a group | `placer()`; the cause line still says it |
| 2026-11-18 | Ochem Conformation Lab | Below 1100 px the two end chairs are small, without letters, on the bench; below 1000 px the hill is under the model | The ring or model keeps the stage | `layoutNow()` |
