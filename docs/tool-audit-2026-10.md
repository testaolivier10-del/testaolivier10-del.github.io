# Tool audit (2026-10-27)

A hands-on pass through every study tool (93 tools across nine courses), rated against the NREMT body map bar:
it just works, is very interactive, gives good information, is good at its job and is interesting; simple on
landing with extra information revealed progressively; professional illustration quality; easy to see and use
on a phone; opens full screen as just the tool. Scores are 1 to 5 against that bar. Tags: [bug] broken
behaviour, [quick] under an hour, [bigger] more than an hour. Status file: `docs/tools-upgrade.md`.

How it was tested: every tool loaded at 390x844 and 1280x800 in headless Chromium with Premium unlocked
locally, then driven like a student through every mode, with wrong answers on purpose, Show the answer and the
Why sheet. Console errors, failed requests and sideways scroll recorded for every page.

## Headline

- No console errors or failed requests on any tool. Two pages scroll sideways on a phone (sound trainer, tree
  reading), both from the same cause: a scroller bleeds 16px past a 12px phone gutter.
- Best against the bar (4 to 4.5): body map, scenarios, drug formulary, arrow pusher, conformation lab,
  reaction predictor, resonance explorer, 3D molecule viewer, graph reader, titration curve reader, area and
  volume, curve analyzer, motion graphs, most AP Calc, Stats and APES trainers.
- Weakest (2 to 2.5): reference cards, search, pathway tracer, experimental design drills, graph builder, water
  potential calculations, units and sig figs.
- The biggest cross-course gap: Test yourself and Practice are much weaker than Explore. The figure goes static
  or disappears, input is typing only, the answer box often sits below the fold on a phone, and a wrong number
  usually gets a generic message. Most of this lives in shared code, so a few fixes lift most tools.

## Bugs to fix first

| Tool | Bug |
|---|---|
| Collision lab, energy bar charts (Physics) | Dragging a cart or the skater does nothing (listeners on `pane`; the stage moved into the studio) |
| A&P calculators | Each "New problem" adds another answer row; problem text shows twice |
| Ochem arrow pusher | Some bond tap targets are 0px wide, so vertical bonds can't be tapped |
| Sound trainer, tree reading | Sideways scroll on phones (-16px bleed vs 12px gutter) |
| Oscillator, rotation, torque labs | Sticky action row covers controls on load |
| Air pollution, earth and climate (APES) | "Start here" hint points at a picture that does nothing; the slider is below the fold |
| Probability trees | Simulate during an animation drops trials |
| Hardy-Weinberg calculations | Incomplete dominance problem calls the heterozygote a "carrier" (science error) |
| Enzyme activity | "% of Vmax" ignores temperature (91% shown at rate 0) |
| Curve analyzer, Riemann sums, distribution areas | "V' = 0.00 < 0", "9.335 matches 9.333", "fewer than 0" |
| AP Calc expression steps, APES numeric grading | "0 times the right one"; 0 called "Close" for 1.4 |
| Graph builder | Free plot says "tap the grid" with no grid |
| Free-body diagrams, projectile lab | Overlapping force labels; x-axis ticks run together at 90° |
| Periodic trends, ICE drills | Radius colors against the trend for In/Sn and Tl/Pb/Bi; unrealistic Kc for H₂ + I₂ |

## Shared fixes that lift many tools

1. Practice and Test on phones: shrink the stage outside Explore, scroll the current input into view, and show
   the full problem text (about 60 tools).
2. Make Test yourself visual: draw the student's wrong answer on the stage next to the right one, and give one
   method hint per step before Show the answer (all 32 Calc, Stats and APES tools; bio Practice needs per-step
   checking like chem and physics).
3. Put the primary slider in the sticky action row so it is on screen at 390px; pad the dock so the row never
   covers controls.
4. Readable on-stage text on phones (at least 11px), and wrap clipped chip rows and legends.
5. Ochem molecule renderer: skeletal rings, consistent hydrogens, non-zero bond hit boxes (four tools).
6. Coach bubbles anchored below their target instead of over it.
7. Start tools in an informative state (not empty panels or a finished curve).

## NREMT, Organic Chemistry, A&P

Every tool was driven at 390x844 through every mode, with wrong answers on purpose. Desktop was checked from 1280px captures. Scores are 1 to 5 against the body map bar.

### NREMT

**Body map: 4.5.** Works: tap the 3D model for the organ and a useful line; Quiz me hunts a named structure; Burns tab rule of nines with Adult/Child and live TBSA.
- [quick] Canvas is 410px wide and starts at x = -10, so model edges clip at 390px. Size the canvas to the stage.
- [quick] In Quiz, a wrong tap leaves the dock unchanged. Name what was hit and nudge toward the target (confirm on a device).
- [bigger] No round, score or misses to review. Add a 10-item round with a tally.

**Sound trainer: 3.5.** Works: illustrated chest with sites, live phonocardiogram strip, good "Why this spot" sheet, 10-round Name it quiz with a breath-phase curve.
- [bug][quick] Sideways scroll. `nremt/assets/studio/sound-trainer.css:30` sets `.st-chips{margin:0 -16px 0 0;padding:2px 16px 2px 0}` but the phone dock gutter is 12px (`assets/course/tool-studio.css:379`), so chip rows end at 394px. Add a phone override (12px) or reuse `.ls-scroll`.
- [quick] At 844px the Play button is cut off and the coach bubble covers the Lung chips.
- [quick] Test yourself blanks the chest and leaves an empty stage. Keep the chest or start round 1 right away.
- [quick] "generated" and "recorded" tags mean nothing to students. Move into Why.
- [quick] Where and When sub-modes did not respond in testing. Check they are real buttons.

**Scenarios: 4.** Works: strong branching sim with a live monitor that responds to choices, "What happened" cards, a 3D patient, and a path review with "Go back to this decision".
- [quick] SpO2 tile shows an empty box and PLETH says NO READING all case. Say "not on yet" or hide it.
- [quick] The opening call is clamped to 3 lines and hides key detail. Don't clamp the first step.
- [quick] Picker is 26 text-only cards. Add category chips and icons.
- [quick] End screen makes "Back to NREMT home" primary while "Try again" is plain text. Make retry and next scenario primary.

**Flow diagrams: 3.5.** Works: Read, Build it, Drill me; wrong placements bounce with a reason.
- [quick] Read mode is a tall column of 12px boxes; Yes/No branches are labels, not forks.
- [quick] Build's bank and slots both scroll sideways. Use a bottom-sheet bank and auto-scroll to the next slot.
- [quick] Flow chips use truncated long names. Use Read mode's short names.
- [bigger] Generic rectangles. Distinct action, decision and end boxes with icons.

**Skill sheets: 3.** Works: station timer, tick phases, badges on the figure, critical criteria listed.
- [bigger] The BVM patient never changes. Each tick should change the figure (mask on, OPA in, chest rise).
- [quick] Next, Finish and Pick another station compete and sit half off-screen.
- [quick] Credits and "What varies by program" sit in the stage. Move to Why.
- [bigger] Out-of-order ticks never trigger a critical fail. Flag critical criteria live.

**Drug formulary: 4.** Works: swipeable Give or withhold patient-chart cards; feedback quotes the deciding line.
- [quick] Verdict "No: give it." is terse and the counter didn't visibly change. Lead with the deciding fact.
- [quick] At 1280px the card is about 150px wide in a huge stage. Scale it up.
- [quick] Confirm an end-of-round summary with "drill my misses".

**Reference cards: 2.** Works: pediatric vitals slider and heart-rate check.
- [bigger] A scrolling article, not a full-screen tool; only one card is interactive. Make GCS three tap columns with a live total, APGAR five toggles, PAT a tappable triangle.
- [quick] GCS and APGAR tables are clipped at 390px with no scroll cue.
- [quick] Section chip row is truncated. Make it sticky with scroll-spy.

**Search: 2.** Works: fast, 2,233 passages, live counts.
- [quick] At 390px results are below the fold under a 550px hero. Collapse the hero on focus.
- [quick] Not full screen. Use the tool shell or drop it from the tools list.
- [quick] One flat list. Group by type and deep-link into tools.

### Organic Chemistry

**Acid/Base comparator: 3.5.** Works: pKa reveal after answering; "Which proton?" is excellent.
- [quick] Rings drawn with "CH" at every vertex, not skeletal. Fix in the shared renderer.
- [quick] Rank four puts cards 3 and 4 below the fold. Use 4 compact rows.
- [quick] Two 30-item selects on landing. Hide behind "Pick your own pair".

**Arrow pusher: 4.** Works: big tap targets on lone pairs and bonds, two-tap arrows, Challenge with "Show one arrow".
- [bug][quick] Some bond hit targets are 0px wide (O–H and vertical C–H), so they can't be tapped. Give every bond at least 24px.
- [quick] After picking a source, pulse the valid destinations.
- [quick] Build mode hides H's while Ready-made shows them. Pick one convention.

**Conformation lab: 4.** Works: Newman projection turns over a live energy curve; 3D chairs with percentages and a stable-chair game.
- [quick] Chairs about 160px tall with grey substituents. Color axial and equatorial bonds.
- [quick] Front and back Newman bonds share a color. Lighten the back carbon.
- [quick] Newman mode has no quiz. Add Predict first.

**Reaction predictor: 4.** Works: substrate, reagent and solvent picker; mechanism arrows; SN1/SN2/E1/E2 percentages; Predict first.
- [quick] Explore shows the answer on load and a coach bubble covers reagents. Make Predict first the default.
- [quick] The product is never drawn. Draw the major product.

**Reagent roadmap: 3.** Works: very deep content; route finding; Puzzle mode.
- [bigger] "The map" is a grid of text tiles with no arrows; 12px tiles unreadable on a phone. Make a node graph with drawn arrows and a highlighted route.
- [quick] The map is taller than the stage; Start and Target scroll away. Zoom to fit the route.
- [quick] Route caption is one run-on reagent line. Show step cards.

**Resonance explorer: 4.** Works: push arrows to find forms, a found-forms strip, "Show me one I'm missing", good Compare feedback.
- [quick] Formal charges are tiny. Make them large and colored.
- [quick] "Forms found" is half off-screen. Make a thumbnail strip.

**Spectroscopy lab: 3.** Works: three modes; Identify it gives formula, DoU and both spectra.
- [bigger] IR trace is a flat line with a few V-dips, placeholder quality. Use realistic spectra (broad O–H, sharp C=O, fingerprint region).
- [quick] Reference mode has about 30 overlapping 11–12px labels. Use a list with range bars.
- [quick] NMR signals have no multiplicity labels. Add s, d, t, q.

**3D molecule viewer: 4.** Works: draggable model with angle readout, VSEPR presets, build your own, two-step Predict shape quiz.
- [quick] Atoms are grey and white only. Use CPK colors; show lone pairs by default in Predict.
- [quick] The "ringed C" is not visibly ringed. Add a halo.

### Anatomy & Physiology

**Virtual lab practical: 3.5.** Works: real figures with masked labels; Explore, Study, Quiz, Timed stations; 2,748 structures.
- [quick] On phones 14 of 17 masks are under 32px tall (some 7px). Auto-zoom to the item and pad hit areas to 44px.
- [quick] The figure uses only about 340px; the credit takes 3 lines in the stage. Move credit to Why.
- [quick] Opens on the dullest set (directional terms). Open on last used or a richer set.

**Predict the change: 3.5.** Works: a cause-and-effect chain explains each miss; misses go to review.
- [quick] Scenario is a 5-line block of 11px grey text. Title, 2 lines, "More".
- [quick] Gauges are decorative. Animate needles to the answer on Run, with the student's call ghosted.
- [quick] Coach bubble covers the variable name.

**Feedback loop builder: 3.** Works: draggable set point, Stimulus button, excellent per-slot feedback in Test yourself.
- [bigger] Diagram renders washed out and looks disabled; boxes only. Full strength plus a small illustration per stage.
- [quick] Test yourself shows 7 empty slots with the card bank below the fold. Keep the loop shape with a bottom-sheet bank.
- [quick] Cards are full sentences. Shorten them.

**Worked-example calculators: 3.** Works: animated tube with live gauges; Practice has worked solutions and review.
- [bug][quick] Each "New problem" adds another answer row (2, then 3, then 4 inputs). Clear before rendering.
- [bug][quick] Practice problem text renders twice.
- [quick] Practice drops the picture. Show the tube with "?" for the unknown.

**Graph reader: 4.** Works: real curve with a draggable readout, What-ifs, quiz that marks the graph.
- [quick] In Quiz the top of the graph scrolls off on a phone.
- [quick] Question pips let you skip ahead. Lock or mark skipped.

**Pathway tracer: 2.5.** Works: order, missing-step and spot-the-error exercises with good explanations.
- [bigger] Called a tracer but has no diagram, only sentence cards. Draw each pathway and light it up as steps are placed.
- [quick] Step cards are 3 to 4 lines each. Shorten.

**Word root builder: 3.** Works: big color-coded word parts; wrong answers show the origin.
- [quick] Decode uses a native select. Use 4 buttons.
- [quick] Feedback waits for the whole word. Mark each part as picked.
- [quick] Build shows only 2 bank cards. Show 6 or more.

### Cross-cutting
- reference-cards and search are web pages, not tools; the other 21 open full screen.
- Coach bubbles often cover their target text on phones (sound trainer, predict, reaction predictor). Anchor below the target.
- One fix in the shared ochem molecule renderer (skeletal rings, consistent H's, non-zero bond hit boxes) improves 4 tools.

### Top 10 (this group)
1. [bug] Calculators: duplicated answer rows and problem text.
2. [bug] Sound trainer sideways scroll.
3. Lab practical: tiny masks on phones.
4. Search: results hidden under the hero on phones.
5. Reference cards: make GCS, APGAR, PAT interactive; fix clipped tables now.
6. Pathway tracer: draw each pathway.
7. Spectroscopy: realistic IR, NMR multiplicity.
8. Reagent roadmap: real node graph with arrows.
9. Word roots: buttons and per-part feedback.
10. Ochem renderer: skeletal rings, consistent H's, bond hit boxes (fixes arrow pusher).

## AP Biology, AP Chemistry, AP Physics 1

All 38 tools load clean and open full screen; only tree reading scrolls sideways. The bio tools index already has cover art, Free/Premium markers and no Beta label in the repo (the live page seen earlier was a stale cache).

### Shared problems
- X1 [bigger] Practice/Test on phones: the stage keeps 523px even when it shows only a table, so in 30 of 38 tools the first answer box sits at y 800 to 930 under the sticky Check button. Shrink the stage outside Explore and scroll the current input into view.
- X2 [quick] Problem caption clamped to 3 lines with no "More" cue; hides needed numbers (rotation lab distances, collision masses).
- X3 [bug] Sticky action row covers controls on load: oscillator m/k/A chips, rotation lab shape chips, torque balance mass buttons. Pad the dock body by the row height.
- X4 [quick] Rows and legends clipped at the right edge with no cue ("Re", "Har", "Is this grou", "Bir").
- X5 [bigger] Bio Practice gives no feedback until the end ("0 of 7 parts right"), unlike chem and physics, which check every step. Use the chem/physics stepper in bio.
- X6 [quick] Why sheet nearly empty on load in cell cycle and energy flow.

### AP Biology
- Cell cycle checkpoints 4: tap the phase ring; strong Diagnose mode. [quick] X6; DNA histogram hidden in settings.
- Chi-square 4: drag observed bars, chi-square updates live. [bigger] X5. [quick] curve panel empty until step 6.
- Confidence intervals 3. [quick] Nothing on stage is draggable; add whiskers or "new sample".
- Mean, SD and SE 3. [quick] Clipped legend; 12px dots.
- Experimental design drills 2: right content, no visual (paragraph, table, 20 radio buttons). [bigger] Add a setup schematic; identify variables by tapping it.
- Energy flow 4. [quick] Pyramids hidden in settings; X6.
- Enzyme activity 4. [bug] "% of Vmax" ignores temperature (rate 0.0 shows 91% of Vmax at 100 °C). [quick] Put the rate curve on stage.
- Graph builder 2. [bigger] Lands on a table with no graph; grid appears only at step 6. [bug] Free plot says "tap the grid" with no grid.
- Hardy-Weinberg and drift 4: memorable allele jar. [quick] p-over-generations plot hidden; clipped readout.
- Hardy-Weinberg calculations 4. [bug] Science: the snapdragon incomplete-dominance problem labels the heterozygote "carrier" and white "recessive trait". Use red, pink, white.
- Meiosis and nondisjunction 4. [quick] Plain capsule chromosomes, no crossing-over view; empty top third.
- Operons 3: good illustration. [bigger] 630px SVG in a 382px stage cuts the DNA off on phones.
- Osmosis 4: plasmolysis with a ψ scale; values correct. [quick] Empty space above beaker; mass graph hidden.
- Population growth 3. [bigger] S-curve and dN/dt graph only in settings; draw on stage as years play.
- Rates and percent change 3. [quick] Plain chart; add a draggable tangent.
- Signal transduction 3: good membrane art. [bigger] 835px of content in a 477px stage.
- Simpson's diversity 3. [quick] Clipped labels; tapping the quadrat does nothing.
- Tree reading 3: clean cladogram, MRCA and clade questions, Build mode. [bug] Sideways scroll from `bio/assets/tools/bio-tools.css` line 1167 (-16px; dock gutter is 12px).
- Water potential calculations 2. [bigger] No Explore mode; placeholder shapes and an empty beaker on landing.

### AP Chemistry
- Buffer drills 4. [quick] 14px particles with 7px letters.
- Equilibrium and kinetics 4. [quick] Long dock on landing; tabs easy to miss.
- ICE table drills 3. [quick] Test inputs in the stage but Check in the dock ("Type a number first" with no visible box); Kc = 1.28 for H₂ + I₂ ⇌ 2HI is unrealistic.
- Particle diagrams 3. [quick] Drag from palette didn't register (tap works); "Pick the picture" boxes too small to count.
- Periodic trends and PES 4. [quick] 8–10px numbers on phones; radius coloring shows In < Sn and Tl < Pb < Bi, against the trend. Verify the metallic radii.
- Q vs K 4. [quick] Test mode has no Q/K bar.
- Titration curve reader 4: one of the best tools. [quick] Test has both a slider and a typed box; say which is graded.
- Units and sig figs 2. [bigger] Empty stage on landing ("Your setup appears here").

### AP Physics 1
- Collision lab 3. [bug] Dragging a cart does nothing: `collision-lab.js` line 277 listens on `pane`, but the stage moved into the studio. Why still says "Drag a cart sideways".
- Energy bar charts 3. [bug] Same dead drag (`energy-bar-charts.js` line 489).
- Fluids tank 3. [quick] Can't drag the block into water; Drop button under the hint.
- Free-body diagrams 4: good distractors in draw mode. [bug] "Hand pressing down": Fg and FA arrows and labels overlap.
- Lab design 3. [quick] Graph on a separate tab; one checkbox among radios.
- Motion graphs 4: drag the cart, graphs draw live. [quick] Small a-t labels.
- Oscillator lab 3. [bug] X3. [quick] Empty graph until Play.
- Projectile lab 4. [bug] At 90° the x-axis ticks run together.
- Rotation lab 3. [bug] X3; stool problem numbers cut.
- Scaling drills 3. [quick] Small grey picture; Test is text-only.
- Torque balance 4: dragging masses works with torque bars. [bug] X3.

### Science and math errors found
1. Hardy-Weinberg: heterozygote called "carrier" in an incomplete-dominance problem.
2. Enzyme: % of Vmax shown while rate is 0.
3. Periodic trends: p-block metal radii against the trend on the colored table.
4. ICE drills: unrealistic Kc for H₂ + I₂ ⇌ 2HI.

### Top 10 (this group)
1. Collision lab and energy bar charts dead drags.
2. X1: answer box below the fold in 30 tools.
3. X3: sticky row covering controls in three physics labs.
4. Tree reading sideways scroll.
5. Hardy-Weinberg phenotype labels.
6. Population growth S-curve on stage.
7. X5: per-step feedback in bio practice.
8. Graph builder grid from step 1.
9. Operons and signal transduction re-laid for phones.
10. X2, X4 and the enzyme pill.

## AP Calculus AB, AP Statistics, AP Environmental Science

All 32 tools load clean, open full screen, have no sideways scroll at 390px, and the numbers spot-checked against scipy were right (chi-square p, binomial, normal, t interval, related rates, sun angle, tree simulator).

### Shared problems (shared code: assets/course/tool-studio.js and the drill engines calc-tools.js, stat-tools.js, env-tools.js)
- X1 [bigger] Test yourself is a dead end next to Explore: static or text-only stage, typing only, and a wrong number mostly gets "Not yet. Recheck the arithmetic." Draw the student's answer on the stage beside the right one, and give one method hint per step before Show the answer.
- X2 [quick] Quiz problem text is cut to 3 lines on phones, hiding givens. Show the whole caption in quiz mode.
- X3 [quick] When the quiz figure is only text (accumulation, limit explorer, design randomizer, rule drills, calculation studio), the 511px stage wastes the screen. Collapse it.
- X4 [bug] Typing 0 in an expression step says "Your answer is 0 times the right one" (calc-expr.js ~line 404). Skip the factor note at 0.
- X5 [bug] A far-off answer is called "Close" (water pollution: 0 for 1.4). env-tool-math.js line 98 uses 10x tolerance; cap at about 2x.
- X6 [quick] Worked solution hidden behind Why after a problem. Open it automatically.
- X7 [quick] Main slider below the fold on phones (climate change, earth and climate, air pollution; cycles, water pollution, soil texture, population growth pages 1140–1330px tall). Put it in the sticky action row.
- X8 [quick] On-stage text far too small on phones: sampling lab 3.5px, soil texture 6.7px, design randomizer 7.3px, probability trees 7.8px. Use the phone scale hooks for at least 11px.

### AP Calculus AB
- Accumulation 4: two linked graphs with a draggable limit. [quick] Starts at x=0 with nothing drawn; net-change mode allows "integral from 7 to 7"; quiz stage is a formula in a big box.
- Area and volume 4: draggable slice and a real rotatable 3D solid, the best visual in the course. [quick] Draw the axis of rotation; cue "try Revolve"; quiz feedback generic.
- Curve analyzer 4: f, f', f'' with sign bars and an excellent Optimize mode. [bug] Says "V'(6.00) = 0.00 < 0" (curve-analyzer.js line 371). [quick] Bands 130px tall on phones; Why sheet 200 words.
- Limit explorer 4: six cases, zoom, left/right tables. [quick] Case chips run off the edge; quiz text only.
- Motion lab 4: car synced with x, v, a graphs. [quick] Car strip 98px; legend wraps; quiz generic.
- Related rates 4: draggable ladder, cone, shadow, ripple, balloon. [quick] Hint covers the ladder; readouts 12px; X4 message.
- Riemann sums 4: four sum types, n slider, over/under explained. [bug] Says 9.335 "matches the exact value" 9.333 (riemann-sums.js line 210). [quick] Over/under for tables; shade trapezoids in quiz.
- Rule drills 3: type any function for a rule tree. [quick] No graph; chips overflow. [bigger] Quiz purely symbolic; highlight the tree node.
- Slope fields 4: draggable start traces solutions. [quick] 1px grey segments read as hatching on phones; chips overflow; small quiz fields.
- Tangent tracer 4: secant to tangent, f' traced. [quick] Hint overlaps slider label; uses a different quiz stepper from the other nine.

### AP Statistics
- Chi-square lab 4. [quick] Can't type a count; add a color legend; show the expected-count formula on a wrong cell.
- Interval capture 4. [quick] Landing nearly empty (draw 20 intervals on load); capture chart 70px; draw the student's interval.
- Data explorer 4. [quick] Why sheet 280 words; histogram labels 10.5px; show outlier fences in quiz.
- Design randomizer 3: real greenhouse illustration. [quick] Labels 7.3px; color pots instead of tiny letters; quiz text only.
- Distribution areas 4. [bug] At the minimum says "Fewer than 0" and "bars from 0 to -1"; "100.0%" shown for 0.9996. [quick] Let students drag the boundary in quiz.
- p-value explorer 4. [quick] Label overlaps curve; true-p slider below fold.
- Probability trees 3: tree, table, Venn and simulation views. [bug] Pressing Simulate 1,000 during the 100 animation drops trials (totals 1,084 to 1,092). [quick] Labels 7.8px; monospace chips; highlight table cells per step.
- Regression lab 4. [quick] Why sheet 335 words; residual ticks at ±3.73; plot the predicted point.
- Sampling distributions 4. [quick] Starts with two empty panels; chips overflow.
- Sampling lab 3: drawn town of 100 houses. [quick] Houses 20px, street names 3.5px; method chips truncated; quiz text only (let students tap houses).

### AP Environmental Science
- Age structure 4. [quick] Slider at the fold; generic quiz feedback.
- Air pollution 3. [bug] "Start here" hint points at the picture, which does nothing; the slider is at y 816. [quick] Flat city; tiny species labels.
- Calculation studio 3: units cancel in color. [quick] Greyed Undo looks broken; "20 bulb" plural; minimal visual.
- Climate change 3. [quick] Busy diagram on phones; CO2 slider below the fold; caption cut off.
- Cycles 3. [quick] Process markers 20px numbers with names in a list below; page 1330px tall. [bigger] Human actions should actually move carbon and update CO2.
- Dose and response 4: 100 drawn mice. [quick] Mice 12px, dead vs alive by color only; label y axis.
- Earth and climate 3. [bug] Same hint bug as air pollution; Date slider at y 864. [quick] Make the orbit inset the date control; El Niño chips wrap.
- Energy chain 4: 100-unit Sankey. [quick] Loss numbers have no units; chips overflow.
- Energy flow 4. [quick] Log-scale pyramid hides the 90% loss; removing a species only changes text.
- Population growth 4. [quick] Loads already finished at K; sliders below fold.
- Soil texture 4: real texture triangle. [quick] Axis titles 6.7px; say "drag the point".
- Water pollution 4. [bug] X5 "Close". [quick] Show fish leaving below 2 mg/L; Play pushed down.

### Top 10 (this group)
1. X1: visual quiz feedback and method hints (all 32 tools).
2. X2: full problem text on phones.
3. X7: primary slider in the sticky row.
4. Air pollution and earth and climate hint bug.
5. X3: collapse text-only quiz stages.
6. X8: readable on-stage text on phones.
7. Wording bugs: curve analyzer, distribution areas, Riemann sums.
8. X4 and X5 feedback bugs.
9. X6: open the worked solution.
10. Start tools in an informative state; probability trees dropped trials.

