# AP Environmental Science: tool purpose review (2026-11-10)

Every tool in `environmental-science/tools/` opened at 1280x800 and 390x844, every scene, chip and preset used, at
least two Test yourself items per tool answered (wrong first, then shown). Screenshots:
`/home/claude/shots/review/environmental-science/`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Age structure | The pyramid's shape follows from where a country is in the demographic transition | LEAVE | Pyramid and transition chart move together and teach. Phone: the "try stage 3" ring sits over the TFR slider, not the Stage 3 chip. |
| Air pollution | Smog builds through the day and an inversion traps it; acid rain hurts a lake on granite, not on limestone | FIX | Smog day is good. Acid rain: the animals are a table of tiny boxes ("Snails x pH 6.0") under the lake; they should be drawn in the lake and disappear as the pH falls. |
| Calculation studio | Units cancel like fractions; chain the factors until only the goal unit is left | FIX | The chain is the right picture. Opening Explanation squeezes the stage and the chain overlaps the question, the "still to cancel" line and the tray. Test figures are drawn tiny in an empty stage. Phone crops the scene picture. |
| Climate change | CO2 traps infrared low, CFCs thin ozone high; CO2 acidifies the sea; land ice and warming raise sea level, sea ice does not | FIX | Atmosphere and Ocean pH do their job. Sea level: the sea rises as a box with a vertical wall beside the slope; at +7.5 m the town is not flooded. The water should climb the shore and cover the houses. |
| Cycles | Where an element is stored, what moves it, what people change | LEAVE | Landscape, reservoirs and lit processes work. Accuracy flag on the human-change numbers (Notes). |
| Dose and response | LD50 and threshold on the curve; biomagnification up a chain vs bioaccumulation in one fish | LEAVE | Mice grid with the curve is the idea. Small: Solvent Z's axis ends at its LD50, so the student can never see most of the mice die. |
| Earth and climate | Tilt makes seasons; three cells make wind and rain belts; rain shadow; El Nino | FIX | Seasons, Rain shadow, El Nino are good. Winds: the six cells are rounded boxes on a strip (surface on the left, "high up" on the right), and the balloon is a red dot. Draw the cells as loops of air over the globe's edge, rising with clouds at 0 and 60, sinking dry at 30, with the balloon riding one. |
| Energy chain | Most of a fuel's energy leaves as waste heat before it reaches the outlet | FIX | The band does show the loss. The "illustrated stages" are 20 px icons above it, and half the stage is empty. Draw the plant itself (furnace, turbine, generator, pylons, house) with the band running through it. Accuracy flag on wind (Notes). |
| Energy flow | Only about 10% passes up each level, so little reaches the top | FIX | Default widths are "to scale" (header says log), so every pyramid is one bar with a hairline above it, not a pyramid. Raw numbers in bars: "5.00000e+6", "1.00000e+6". |
| Population growth | J-curve vs S-curve vs overshoot; survivorship types; r vs K recovery | FIX | Graphs are the concept and fine. Exponential: once off the chart, the line runs flat along the top, which reads as leveling off; clip it with an arrow. The deer herd in the header is not drawn. |
| Soil texture | Find a soil on the triangle and see how its grains hold and drain water | LEAVE | Triangle, magnified sample and bars teach. Small: horizon captions are cut off ("where most ro") in Test; the jar the header promises is not in Explore. |
| Water pollution | Fertilizer to bloom to decay to low oxygen; warm water holds less oxygen; what each sewage stage removes | FIX | Nutrients and Heat are good. Heat and Sewage keep the Nutrients "Play again" and "Day 0" buttons. Sewage stages are six plain boxes; draw tanks (screen and settling tank, aeration tank with bubbles, filter, UV). |

LEAVE 4, FIX 8, REDESIGN 0.

## Notes

**Across the course.** In many tools the Test yourself figure is drawn at about a third of the stage, top left,
with the rest empty: calculation studio, cycles, soil texture (three jars), population growth (r and K), energy
flow, and in psychology development. Scale the figure to the stage. Phone layouts reflow cleanly; nothing is dead.

**Air pollution, Acid rain.** The tolerance chart is nine boxes at about 8 px text (desktop) under the lake. Draw
each animal as a small figure in or by the lake at its place on the pH scale; those below the lake's pH fade or
cross out as the slider rises, so the student sees the lake empty. In Test, the "which lake's pH drops less"
step shows only the pH bar; draw the two lakes on their rock.

**Calculation studio.** After the chain has three factors, opening Explanation at 1280 px wraps the chain over the
question text and the tray (screenshot `calculation-studio_d_02_donewhy.png`). The stage should keep its width
or the chain should wrap below the picture, not over it.

**Climate change, Sea level.** The ocean is a rectangle whose left side is a vertical wall above the land slope
(`climate-change_d_03_greenland.png`). Fill water up the slope to the new level so the houses go under at large
rises, and draw the rise to scale against the houses (0.4 m should look small, 7 m should drown the town).

**Earth and climate, Winds.** The globe is right (belts at the right latitudes, trades and westerlies the right
way). The cell strip is the blocks problem: no air, no height, no rain. Picture: the globe with the atmosphere
drawn thick at one edge, three loops per hemisphere turning the right way, clouds and rain where air rises (0, 60),
clear sky and desert where it sinks (30), the surface wind arrows continuing from the loop bottoms. The balloon
latitude slider moves a drawn balloon around its loop.

**Energy chain.** Wind's rotor shows "55 units waste heat". Wind the rotor does not capture mostly passes on as
moving air (the Betz limit), not heat; the label should say "left in the wind". The same check for solar (light
reflected vs heat) is worth doing.

**Energy flow.** Start on the log scale (the code's own header says that is the default; `energy-flow.js` sets
"Widths to scale" pressed), keep "to scale" as the second view that shows the sliver. Format big numbers as
5,000,000 or 5 x 10^6, as the pond view already does.

**Population growth.** `population-growth_d_03_exp.png`: the J-curve hits 4,000 at year 13 and then a flat line
labeled "off the chart" runs to year 40. End the line at the top edge with an arrow and the value.

**Water pollution.** In Heat and Sewage the dock still shows "Play again" and "Day 0" from Nutrients
(`water-pollution_d_04_heat.png`, `_06_sew.png`); hide them or make them do something in that view.

**Accuracy flags.**
- Cycles, human changes apply to the whole planet: "Pave land (cities)" scales all infiltration by 0.3 and runoff by
  1.6 (`math/cycles.js` line 148), so after 31 years lakes and rivers are +74,710 km3 (+40%) and groundwater
  -217,139 km3. "Add fertilizer" gives plants and animals +93% in 26 years. Either say these are one watershed or
  an exaggerated case, or scale them to a believable share of land.
- Energy chain, wind "waste heat" (above).
