# Pass 2 (simple, clear, high quality): AP Environmental Science

Branch `claude/tv2-env`, one commit per tool. Screenshots (after): `/home/claude/shots/pass2/environmental-science/<tool>_land_d.png`
and `_land_p.png`; before: `<tool>_before_d.png` (plus `earth-climate_winds_before_d.png`). Every scene was opened at
1280x800 and 390x844 before and after; Test yourself opened for every tool; dark mode checked on the two biggest changes.

Counts are for the Explore opening screen at 1280 px (the scene named): **labels** = words drawn on the picture, axis
ticks and row headers left out; **numbers** = live values on the picture, pills included; **controls** = control groups in
the dock (a slider with its buttons is one; a row of chips is one; Explore/Test, Explanation and Numbers & setup not
counted); **panels** = separate drawings on the stage.

| Tool | The idea | Best way to show it | Verdict | Before | After | What changed | Moved behind a tap |
|---|---|---|---|---|---|---|---|
| Earth and climate | Tilt makes seasons; three cells make the wind and rain belts; rain shadow; El Nino | Seasons: the tilted globe and the noon sky at one place, drag the date. Winds: the globe with its loops, move the balloon and read the cell it rides | SIMPLIFY | Seasons: labels 13, numbers 7, panels 4, words 40. Winds: labels 24, numbers 2-3 | Seasons: labels 9, numbers 2, panels 3, words 26. Winds: labels 5, numbers 1-2 | Winds: only the cell in focus is named; only its two edges carry words (belt on the globe, "Air rises"/"Air sinks" outside); other loops, clouds and suns dim; no bottom caption; no Cell pill. Seasons: sunlight-by-latitude chart off the stage; globe tag shows the latitude, not the angle again; no beam-factor, W/m2 or day-length text on the sky. Rain shadow: start and far-side temperatures sit at the ends of the air's path, no pills. El Nino: no repeated name tag | Seasons chart, beam factor, W/m2: Numbers & setup (chart was already there on phones). Cloud base and summit temperatures: Numbers & setup |
| Climate change | CO2 traps infrared low, CFCs thin ozone high; CO2 acidifies the sea; land ice and warm water raise sea level, sea ice does not | One cross-section of the air, rays named where they act; the coast flooding house by house | SIMPLIFY | Atmosphere: labels 15, numbers 6, panels 3, words 50 | labels 5, numbers 2, panels 1, words 44 | Atmosphere fills the stage: no ray key, short layer names, no repeated +1.8 C and UV-B. Ocean pH: carbonate drawn as ions (one label) instead of 16 "CO3 2-" words; formulas without the side notes; no pH text on the scale. Sea level: contribution bar off the stage; houses flooded is the caption line; no Sea ice pill | Two response curves and the contribution bar: Numbers & setup (curves drawn there) |
| Air pollution | Ozone builds through the day and an inversion traps it; acid rain hurts a lake on granite, not limestone | The city through the day with the three curves under it; the lake with its animals dying out as pH falls | SIMPLIFY | Smog: labels 9, numbers 4, panels 3. Acid: labels 14, numbers 4 | Smog: labels 5, numbers 1, panels 2 (3 with the inversion on). Acid: labels 7, numbers 2 | Smog: temperature profile appears when the inversion is switched on (it shows the lid); O3 is the one readout. Acid: rain and lake pH sit on the cloud and the lake, no pills; only the animals at the lake's edge (next to go, last lost) are named | NO and NO2 now: Numbers & setup. Every animal's name: hover, and the tolerance table in Numbers & setup |
| Energy chain | Most of a fuel's energy leaves as waste before the outlet | The plant's machines with the band running under them, losses dropping off | SIMPLIFY | labels 15, numbers 13, panels 2 | labels 7, numbers 6, panels 1 | Band shows 100 in, the outlet's 30 and each waste; a machine's efficiency and passed-on value show when tapped; the summary bar that repeated the wastes is gone; caption says to tap a machine | Efficiency per machine: tap; full table in Numbers & setup |
| Energy flow | About 10% passes up each level | The pyramid on a log scale, first step labeled | SIMPLIFY | step labels 8, numbers 2 pills | step labels 2, numbers 1 pill | Only the first step carries "10%" and "-90% heat"; the steps above keep arrows and heat squiggles; NPP pill dropped in the energy view (NPP is under the producers' bar) | - |
| Cycles | Where an element is stored, what moves it, what people change | The landscape with reservoirs and process arrows, tap a process | SIMPLIFY | controls 3 groups + a 9-button list repeating the picture | controls 2 groups | The process list in the dock repeated the nine names on the picture (which are the tap targets): it moves under More; the first-run hint points at a process on the picture | Process list: Numbers & setup, "Process list and units" |
| Water pollution | Fertilizer to bloom to decay to low oxygen; warm water holds less oxygen; what each sewage stage removes | Lake over 60 days with the oxygen curve; river and plant with the saturation curve; drawn tanks with the bars | SIMPLIFY | Nutrients: chain labels 6, numbers 3, controls 6. Heat: numbers 6. Sewage: tank words 6, numbers 6 | Nutrients: chain labels 1, numbers 1, controls 5 (Day 0 shows after day 0). Heat: numbers 4. Sewage: tank words 1, numbers 4 | One chain link named at a time (numbers for the rest); no pills repeating the gauge, the Day slider (that pill also went stale during Play), thermometers, graph or bars; inner tank names only for the tank in focus; heat caption says the difference, not the two values again | - |
| Soil texture | Find a soil on the triangle and see how its grains hold and drain water | The triangle with a drag point, the magnified sample and four bars | SIMPLIFY | controls 5, numbers 2 pills; horizons 18 lines | controls 4, pills 0; horizons 12 lines | Example soils under More; no Class pill (named beside the sample) or Sum pill (always 100%); horizon long lines only for the tapped horizon (also stops the cut-off "where most ro") | Example soils: More |
| Population growth | J vs S vs overshoot; survivorship types; r vs K recovery | The curve with the herd on its island | SIMPLIFY | pills 2, controls 5 | pills 1, controls 4 in exponential | K slider hides in exponential (it had been shown disabled); no K pill (K on its line), no log pill, no r/K recovery pills (each time is on its curve) | - |
| Age structure | The pyramid's shape follows the demographic transition stage | Pyramid and the transition chart read together | SIMPLIFY (small) | numbers 5 | numbers 3 | No TFR pill (the slider's readout); 15 to 64 share off the picture | 15 to 64 share: Numbers & settings |
| Dose and response | LD50 and threshold on the curve; biomagnification vs bioaccumulation | Mice grid beside the curve; the chain; one fish over time | SIMPLIFY (small) | pills 2 per scene | pills 0 | All six pills repeated a number on the picture or the slider beside it | - |
| Calculation studio | Units cancel like fractions; chain factors to the goal | The scene card, the question and the chain with its tray | SIMPLIFY (small) | pills 2 | pills 1 | "To cancel" pill repeated "Still to cancel" under the chain; it is gone until the answer | - |

LEAVE 0, SIMPLIFY 12, CHANGE 0. No picture or main action needed replacing: the first pass made the pictures right,
and every tool's overload was repeats (pills saying what the picture says) and labels on everything at once.

## Graphics quality
- Drawn and representative: the wind loops on the globe, the coast with houses, the acid lake's animals, the plant
  machines over the energy band, the sewage tanks, the cycles landscape, the deer island, the mice grid. None reads as
  clip art or decoration.
- Still weak: the Seasons sky panel is plain (a beam on a strip of ground); the Ocean pH scene is mostly an empty blue
  rectangle with formulas in it. Both teach, so they were not redrawn in this pass.
- Dark mode: dimmed wind cells and carbonate ions needed their own dark values (done).

## Not simplified, and why
- Cycles keeps every process name on the picture (about 9 plus 6 reservoirs): the names are the tap targets, like the
  NREMT body map's parts, and the reservoir sizes are the content. The duplicate list was removed instead.
- Energy flow keeps all five organisms and their level names: they are the pyramid's row headers.
- Soil texture keeps the 12 class names on the triangle: the triangle is the chart.
- Population growth (logistic) shows five control groups: K is the logistic idea and its slider stays beside r.
- Air pollution keeps the three curves under the city: cause (time of day) and effect read together.
- Water pollution Heat keeps the thermometer temperatures and the two graph points (4 numbers): that pair is the comparison.

## Not done
- Dose and response's "Showing" setup menu (the studio's setup slot, `setup: 'Showing'`) repeats the chemical chips;
  it also holds the chain and fish presets, so removing it needs a look at what else it carries. Left as is.
- First-pass LEAVE notes still open: age structure's phone hint ring over the TFR slider; dose-response Solvent Z axis.
