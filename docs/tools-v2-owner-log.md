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
| 2026-11-18 | AP Bio Energy flow | The picture is a drawn grassland chain of four (grasses, grasshoppers, frogs, snakes); one drawn per 10 kcal, so counts are the energy | One idea, read without a chart (rule 12) | `docs/tools-v2-bio-energy-flow-brief.md` |
| 2026-11-18 | AP Bio Energy flow | Two controls on the picture (share passed on, sunlight); respiration shares, number of levels and ecosystem are fixed in Explore | One main control (rule 11) | "?" states the fixed values; restore the sliders in Test yourself or a later tool |
| 2026-11-18 | AP Bio Energy flow | Biomagnification (8.7) moves from a mode to "?" | Different idea from 8.2 | "?" section; a separate tool can come later |
| 2026-11-18 | AP Bio Energy flow | The runs table is dropped; a series table for shares 5 to 20% is in "?" | Explore records nothing | `refHtml()` |
| 2026-11-18 | AP Bio Energy flow | The cause line says "lost as heat" for all not passed on (AP shorthand); "?" splits heat and decomposers | Short cause line | `docs/apbio-needs-author.md` energy-flow-model |
| 2026-11-18 | AP Bio Energy flow | The grass's own respiration plume carries no "heat" word | Its colour matches every labelled plume; a word there crowds the first step on phones | `draw()` in energy-flow.js |
| 2026-11-18 | Ochem Resonance | One screen, no tabs: the molecule you push electrons on, its forms row and the real molecule together | The forms, their ranking and the hybrid are one idea seen three ways (rule 11) | `docs/tools-v2-resonance-brief.md`; reverse: tabs per view |
| 2026-11-18 | Ochem Resonance | Explore shows every form of the species in the row from the start (tap one to see the arrows that reach it) | Free play shows the whole set and how they rank; finding them unaided is a test | Finding them is Test yourself, Find every form (the old hunt) |
| 2026-11-18 | Ochem Resonance | The student drags the electron pair itself; the curved arrow is drawn behind it; tap then tap still works; keys too | Mechanisms (drag the electrons) plus the arrow exams ask for | `resonance.js` pointer handlers |
| 2026-11-18 | Ochem Resonance | A first push that gives an atom ten electrons is held (amber ring, "10 e⁻") until a second push makes room | Every two arrow form can be built one arrow at a time | `docs/ochem-needs-author.md` res-v2-held |
| 2026-11-18 | Ochem Resonance | A push that is not resonance springs back with its reason (cause line; the full sentence in "?" and to screen readers) | Mechanisms' snap back; nothing is locked | Old verdict panel's text kept in "?" as "The last push that sprang back" |
| 2026-11-18 | Ochem Resonance | "Add it to the collection" is gone: reaching a form counts it | One step less; the old button did nothing else | Find every form |
| 2026-11-18 | Ochem Resonance | Forms are tagged major, minor or equal, never given percentages; minor forms are drawn smaller | No honest weights from the engine | `docs/ochem-needs-author.md` res-v2-shares |
| 2026-11-18 | Ochem Resonance | The real molecule is always on the picture in Explore (the old tool showed it only after every form was found) | It is the idea's end point | In Find every form it still appears only when the row is full |
| 2026-11-18 | Ochem Resonance | "Where the charge sits" (a plain average over the forms found) is replaced by the real molecule's marks: a fraction only when every form is equal, δ otherwise | The plain average overstated minor forms | `hybridOf()`; `docs/ochem-needs-author.md` res-v2-shares |
| 2026-11-18 | Ochem Resonance | Benzyl cation: the two forms with the ring whole are major (the engine tied all five) | What texts draw | `rankForms()`; `docs/ochem-needs-author.md` res-v2-benzyl |
| 2026-11-18 | Ochem Resonance | Which is more stabilized? keeps its old verdicts; benzyl against allyl cation now wins by "How far it spreads" | The tie break above counts 2 equally good forms, not 5 | `judge()` unchanged |
| 2026-11-18 | Ochem Resonance | Every form, rule by rule (the old table), the rule order, the textbook count note and Build your own moved to "?" | Reference, not play | `refNow()` |
| 2026-11-18 | Ochem Resonance | The "revealed" and "given" tags on found forms are gone; "Show me one I'm missing" now plays the arrows to the form it reveals | The arrows teach more than the tag | Find every form |
| 2026-11-18 | Ochem Resonance | Compare's numbers (forms, equally good, charge roams over) are a small table in the side panel after the call; both species become their real molecules on the picture | Same numbers, one place | Which is more stabilized? |
| 2026-11-18 | Ochem Resonance | A takeaway line appears when every form has been reached, for species with three or more forms | With two forms the move's own line says it | `words()` |
| 2026-11-18 | Ochem Resonance | Opens on acetate, as before | Old default and links | `?sp=` |
