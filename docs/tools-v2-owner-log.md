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
| 2026-11-18 | AP Bio Hardy-Weinberg | Explore shows snapdragons (incomplete dominance: red, pink, white), not a dominant and recessive trait | All three genotypes can be seen and counted without a key | Carriers are in Test yourself: targets 1 and 3 on a pea bed (review round 1), and the recessive problems. Reverse: `explore` in the tool's data |
| 2026-11-18 | AP Bio Hardy-Weinberg | The bed is sorted into four plots, not scattered like a real population | So the shares can be counted and the plots are p by p, p by q, q by q | Said in "?" |
| 2026-11-18 | AP Bio Hardy-Weinberg | p moves in steps of 0.1 (was 0.01) | Every plant is a whole plant, so the picture and the numbers never disagree | "Any p" to 0.01 in "?" |
| 2026-11-18 | AP Bio Hardy-Weinberg | The panel slider, the five number readout and the key left Explore | The slider repeated the control on the picture; the signs and the cause line carry the numbers | "?" (this setting, every setting, any p) |
| 2026-11-18 | AP Bio Hardy-Weinberg | The three "Try this" targets are now checked questions on a bed that is not in bloom, plus two new ones | Explore is free play; a target you can sweep to is not a test | Test yourself, "Set the alleles"; recorded as `hardy-weinberg:target-<id>` |
| 2026-11-18 | AP Bio Hardy-Weinberg | No "Watch it happen" and no "before" tick | The change is short and is seen on every drag; fewer things on screen | Add `K.player` if wanted |
| 2026-11-18 | AP Bio Hardy-Weinberg | Alleles are written R and W on the picture | Superscripts do not fit an allele drawn 20 px wide | C^R and C^W in "?" |
| 2026-11-18 | AP Bio Hardy-Weinberg | In Problems (the calculations) each individual is a pair of alleles (was a circle, dotted circle or square); the egg and sperm glyphs went | The same allele colours as Explore; "every individual carries two" is drawn | `pstage()` in `bio/assets/tools/hardy-weinberg.js` |
| 2026-11-18 | AP Bio Hardy-Weinberg | The hub blurb and the About intro were reworded; title, description, tag and URL unchanged | They described the old Explore | `bio/data/pages.json`, the tool's data |
| 2026-11-18 | AP Bio Hardy-Weinberg | The biology kit adapter gained a "practice" part for skills tools | So generated problems stay in Test yourself beside other parts | `studioKit2` and `studioPractice` in `bio-tools.js` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: targets 1 (16% recessive) and 3 (rare) are on a second bed, pea plants with complete dominance (purple, white), with the old wording; after the bloom two signs and "Aa: carriers" on the Aa plot | The carrier idea and "dominant phenotype = p² + 2pq" were lost from everything but the calculations | `sp: "pea"` on a target and the `pea` block in the tool's data |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: no hint before the first try in "Set the alleles" | It gave the method away; the wrong answer feedback carries it | `showTarget()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: plants are shorter than their row (0.8) and bushy when the cell is about square, so each plant stands apart | On phones the plants fused into ten stalks | `geo()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: each plant is one image (drawn once per colour), and grows in over three sizes set by script instead of a CSS animation | A drag was slow (100 CSS animations, two uses per plant) | `sprites()`, `grow()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: a drag that starts on the pollen row moves p (the control's hit area covers it), so "Drag the alleles" is true | Dragging an allele did nothing | `layoutNow()` |
| 2026-11-18 | AP Bio Hardy-Weinberg | Review round 1: the "eggs" caption sits at the head of the egg column; on phones the Problems key is one line | Reviewer | |
| 2026-11-18 | APES Energy flow | Three chapters (10% rule, Eat lower, Food web), each with one idea and one control on a drawn scene; the old four views and three ecosystems leave Explore | One main idea per screen (rule 11); APES angle, not Biology's screen | `docs/tools-v2-apenv-energy-flow-brief.md` |
| 2026-11-18 | APES Energy flow | Explore fixes the exam's 10% and the grass's 50% respiration; Sunlight (GPP 10,000 to 30,000, was 2,000 to 40,000) is the quiet second control | The exam uses 10%; Biology's tool is where the share is a setting | `explore()` in the tool's js; "?" gives the 5 to 20% range |
| 2026-11-18 | APES Energy flow | New chapter "Eat lower": a hectare of corn (about 40 million kcal of grain, USDA), 2,500 kcal a day a person, cattle at the 10% rule: 44 people on grain, 4 on beef | CED 1.10 consequence and 5.7; the notes stress it | `ApEnvMath.energyFlow.field`; real beef (nearer 3%) in "?" and `docs/apenv-needs-author.md` |
| 2026-11-18 | APES Energy flow | Biomass and numbers pyramids, the pond and the forest: tables in "?" of chapter 1; their webs stay in the drills | Not the screen's idea; nothing dropped | "?" of chapter 1 |
| 2026-11-18 | APES Energy flow | Pyramid tiers drawn in equal steps; at each step 9 heat wisps as wide as the 1 gold stream that goes on (one measure per step); the stream thins up the chain | Drawn to scale the top would vanish; the 9 to 1 split stays honest at every step | "?" says so |
| 2026-11-18 | APES Energy flow | The animals in a pyramid tier are not counts; "?" says a numbers pyramid can be inverted | Biology review: counts drawn as energy taught a wrong rule | "?" of chapter 1 |
| 2026-11-18 | APES Energy flow | Food web: indirect, less certain effects show as "Maybe fewer"; the cause line names only the direct ones | Keeps the cause line two rows on a phone | `causeWeb()` |
| 2026-11-18 | APES Energy flow | Hub lede and the About text reworded for the new Explore; title, description and URL unchanged | They described the old views | `environmental-science/data/pages.json`, the tool's data |
| 2026-11-18 | APES Energy flow | The beef band is drawn at least 0.6 px wide while a cow is drawn | Review round 1: a cow with nothing leaving it read as "beef is zero" | `dynEat()`; below about 15% to cattle the drawn 9 to 1 is not exact |
