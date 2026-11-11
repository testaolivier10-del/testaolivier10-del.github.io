# Fresh-eyes judge b: second pass (2026-11-11)

Courses: AP Chemistry, AP Environmental Science, AP Psychology, AP Human Geography, AP Macroeconomics, AP
Microeconomics (54 tools). Opened cold on branch claude/tool-fixes at 1280x800 and 390x844, read the opening screen
at full size, then took the hinted first action and two more on desktop. Screens and counts:
/home/claude/scratch/judge-b/ (tile/ = opening desktop plus phone, atile/ = three actions).

Counts on the opening screen, desktop: P pictures or panels / L text labels on the picture (tick numbers left out)
/ N live numbers / C tool controls showing (studio chrome left out) / W words outside buttons. Standard: 1 / 5-7 / 2
/ about 4 / about 40.

## Problems seen on many tools (fix once in the shared studio)
1. The first-run hint sits on top of what it should point at. Phone: it covers the caption (Age structure,
   Population growth), the slider (Neuron, Sensation), the curve (Stats lab), the graph axis (Model studio).
   Desktop: it covers the question (Macro graph studio, PPC and trade), the chain (Calculation studio), headings
   (Article studio, Evidence builder), table cells (Periodic trends). Fix: never place the tip over the caption, a
   control or the stage; put it beside or under the target, and on a phone above the dock edge.
2. The pulsing halo around the target clips the control's own label and value: "$14" (Elasticity), "0" (Externality),
   "8 people" (Social influence), "5 years" (Development), "No policy" and "World price" (Surplus), "Scale of
   analysis" (Scale lab), slider labels in Air pollution, PPC, Age structure. Fix: halo outside the label row, or
   pad the value.
3. Chip walls. Many docks show 6 to 13 chips plus sliders: the count most often over the standard. A scene chooser
   with more than 4 items belongs in a select or behind More.

## Verdicts

| Tool | Verdict | P/L/N/C/W | Problem | Fix |
|---|---|---|---|---|
| **AP Chemistry** | | | | |
| Buffer drills | TOUCH UP | 2/8/1/3/14 | HA and A- particle letters are about 7 px, unreadable on both sizes; the pH plot is empty until the first add. | Bigger particles with a 2-item key; ghost the expected buffer curve faintly. |
| Equilibrium and kinetics | TOUCH UP | 2/6/2/12/23 | Q bar, 3 chart tabs, temperature slider, 2 steppers, catalyst and Challenge all show; the plot is two flat stubs. | Catalyst and Challenge behind More; chart tabs into Details; trace a few seconds before landing. |
| ICE table drills | TOUCH UP | 2/12/1/4/62 | Phone jar is tiny (H and I letters unreadable); bar chart toggle text and table plus jar over the word budget. | Larger jar on phone or jar on tap; trim the dock line. |
| Particle diagrams | PASS | 2/3/0/7/27 | Before and after boxes, clear first step; checks well. | None. |
| Periodic trends and PES | TOUCH UP | 1/118/1/8/33 | Table is right for the idea, but the hint covers K, Ca, Sc and Rb on desktop; Compare plus 4 property buttons plus 3 tabs. | Hint above the table; Compare behind More. |
| Q vs K | PASS | 1/10/2/7/27 | Jar plus Q bar respond at once; Let it react moves Q to K. A and B letters small on phone. | Optional: larger letters on phone. |
| Titration curve reader | PASS | 2/8/1/4/14 | Stand, flask, particle view and curve read as one; slider responds. | None. |
| Units and sig figs | PASS | 1/7/0/2/37 | Fraction bar is the picture; tiles move on tap. | None. |
| **AP Environmental Science** | | | | |
| Age structure | TOUCH UP | 2/17/3/5/38 | Three pills plus growth; phone hint covers the caption and the halo hides the slider label. | One pill (growth); hint placement. |
| Air pollution | PASS | 2/5/1/5/22 | Skyline plus three gas curves, clock drives both. Cars are flat rectangles. | Optional: show haze when O3 peaks. |
| Calculation studio | TOUCH UP | 1/6/1/6/52 | Hint and a huge pulsing halo sit over the starting fraction, hiding "5,000,000 kWh". | Hint under the factor row. |
| Climate change | TOUCH UP | 1/5 plus ~60 molecules/2/9/39 | Ozone loss and greenhouse in one picture with two sliders; caption admits "A separate problem" and is cut by the hint. | Ozone as its own scene (CFC slider moves there); one idea per caption. |
| Cycles | TOUCH UP | 1/17/1/10/24 | 6 pools plus 11 process tags on the picture; 4 cycle chips plus 3 "What people change" chips. | Pool boxes only; name a process on tap of its arrow; people chips behind More. |
| Dose and response | PASS | 2/8/2/8/20 | Mice grid and curve read together; LD50 obvious. | None. |
| Earth and climate | PASS | 2/8/2/7/20 | Globe, orbit and noon sky respond to the date. | None. |
| Energy chain | TOUCH UP | 2/12/2/8/32 | 6 source chips plus 2 segments; the "30" that reaches the outlet floats top right, away from the outlet. | Sources in a select; put 30 at the outlet end. |
| Energy flow | TOUCH UP | 1/14/1/7/26 | 3 view chips plus 3 ecosystem chips plus slider. Pyramid is good. | Ecosystem chips behind More. |
| Population growth | TOUCH UP | 2/6/2/9/38 | 2 sliders, Play, 3 segments, 3 model chips; phone hint covers the caption. | K slider and model chips into Setup. |
| Soil texture | TOUCH UP | 3/25/1/5/24 | Triangle, magnified sample and 4 property bars all at once; every class name lit. | Show sample and bars after the point moves; label the current class, others on tap. |
| Water pollution | PASS | 2/6/1/6/17 | Lake and O2 curve read together; Play shows the dead zone. Step chevrons 2 to 6 are bare numbers. | Optional: name each step as it lights. |
| **AP Psychology** | | | | |
| Article analysis studio | TOUCH UP | 1/0/0/12/263 | Text is the material, fine; but the model answer ("Earns the point: An experiment") shows before the student tries, and the hint covers the Part A heading. | Answer behind a Show tap; hint placement. |
| Brain map | PASS | 1/7/0/4/28 | Clean lateral view, 7 labels, tap names a part. Flat colour bands, no folds. | Optional: light gyri lines. |
| Conditioning lab | TOUCH UP | 2/4/2/5/22 | Half the stage is an empty chart with a line of text; saliva line starts at the nose. Responds well after Tone + food. | Hide or shrink the chart until trial 1; start the line at the mouth. |
| Development | TOUCH UP | 2/10/2/7/35 (caption 45) | Caption lists stage, crisis, abilities and Erikson's question; 4 chips plus slider plus Play; halo cuts "5 years". | Caption to one line; chips behind More. |
| Evidence builder | TOUCH UP | 1/4/1/13/138 | 6 claim cards plus 5 part tabs; source chart below the fold; hint over "Part A Claim". | Collapse source sections after the first read; hint placement. |
| Memory lab | FAIL | 1/0/0/5/22 | Opening screen is a blank chart with one line of text. During study the current word shows as a 92% bar, which reads as a recall score. | Open on the word card with a faint class serial-position curve; mark the current word with a pointer, not a bar. |
| Neuron | TOUCH UP | 2/6/1/3/27 | Desktop passes. Phone: the hint covers the stimulus slider. | Hint placement. |
| Sensation and perception | TOUCH UP | 2/6/5/3/27 | Desktop passes. Phone: the hint covers the criterion slider. | Hint placement. |
| Social influence | TOUCH UP | 2/12/2/8/48 | Caption over 40 words; 4 chips, slider, 2 toggles; phone hint over the chart axis. | Shorter caption; chips behind More. |
| Stats lab | TOUCH UP | 1/12/2/12/32 | 7 jump-to-z buttons plus slider plus 3 segments; hint covers the curve tails on both sizes. | z buttons behind More; hint placement. |
| **AP Human Geography** | | | | |
| Borders lab | FAIL | 1/4/1/13/29 | 5 Show chips plus 6 type chips plus slider; Play, the button the hint points at, is below the fold on desktop. The map is a beige box with house dots. Year pill lags the slider during play (1750 vs 1770). | Boundary type as a select or one row; Play beside the year slider; scenes behind More; draw terrain on the map. |
| City lab | TOUCH UP | 2/9/2/8/97 | Caption lists every ring; footnote and 4-item legend; phone rings tiny and the notes crowd the graph. | One-line caption; footnote to Details; rings larger on phone. |
| Diffusion lab | TOUCH UP | 1/2/1/9/30 | 7 chips plus slider plus Play; legend line is dense; Migration scene adds 8 chips. | Type chips as a select; shorter legend. |
| FRQ coach | TOUCH UP | 0/0/0/7/182 | Writing tool, fine; but "Identify" is defined three times (caption, card, line under the box). | Keep the card, drop the other two. |
| Map reader | TOUCH UP | 1/0/1/12/51 | 6 map-type chips plus two 3-way segments. Map is good. | Map type as a select. |
| Model studio | TOUCH UP | 1/8/0/5/41 | Desktop hint detached from its button (sits under Details); phone hint covers the x axis; "1 of 5 places" for stages; DTM has no axis names; Malthus Explore lines say only "Solid line", "Dashed line". | Hint placement; "stage"; axis names; label lines in Explore. |
| Population lab | PASS | 2/17/4/3/54 | Pyramid and DTM curves together, stage switch is clear. | None. |
| Scale lab | TOUCH UP | 2/8/2/5/99 | The 64-point gap is said twice (line above the map and the caption); dot strip plus legend plus title. | Drop the summary line. |
| **AP Macroeconomics** | | | | |
| AD-AS lab | PASS | 2/12/0/4/35 | AD-AS and Phillips read as one; shock select is the obvious first step. | None. |
| Forex lab | PASS | 2/12/2/3/29 | Mirror markets respond together. | None. |
| Graph studio | TOUCH UP | 1/6/0/13/18 | Desktop hint covers the question it asks; 8 graph chips. | Graph chooser as a select (as in Micro). |
| Indicators lab | FAIL | 1/7/0/5/43 | Opening screen is seven empty dashed columns with "Each purchase lands in its column here". Works well once tapped. | Open with transaction 1 shown as a card about to drop, or already placed. |
| Multiplier lab | PASS | 1/12/2/6/24 | Rounds shrink and leak into Saved; MPC chips respond at once. | None. |
| Policy chain | TOUCH UP | 2/10/0/11/46 | 5 chain chips, 2 segments of 2, Back and Next; thumbnail strip is tiny and unreadable with empty placeholders. | Chain chooser as a select; numbered dots instead of thumbnails. |
| PPC and trade | TOUCH UP | 1/4/3/9/35 | Hint covers the end of the caption; 6 "What happens" chips; readout pills sit far below the point. | Chips behind More; pills near the point. |
| Reserves lab | FAIL | 4/20/0/8/46 | Three graphs plus a 6-link list on one screen; after the first press all are lit (about 45 labels). | Step through it: reserve market, then money market, then AD-AS, one graph at a time, hiding the rest. |
| **AP Microeconomics** | | | | |
| Cost Curve Lab | PASS | 2/8/0/2/36 | Ghost curves preview the shape; each hire fills a row and a point. | None. |
| Elasticity Lab | PASS | 2/12/2/4/22 | Demand above the TR hill, as it must be. Halo clips "$14". | Shared fix 2. |
| Externality Lab | PASS | 1/6/1/6/38 | MSC above MPC, DWL shaded, tax slider is the action. | None. |
| Factor Market Lab | TOUCH UP | 3/12/1/7/86 | Table plus two graphs on desktop; "S = MFC = W" breaks over the axis; phone opens on the table only. | Table behind Details on desktop; one-line curve label. |
| Firm and Market Lab | PASS | 2/12/0/4/22 | Market and firm side by side, linked P line. | None. |
| Game Theory Lab | TOUCH UP | 1/8/8/9/53 | Beta Jet payoffs and headers are blue and underlined, so they read as links. | Colour without underline. |
| Graph Studio | PASS | 1/6/0/6/19 | Big clear graph, one question, Show me. | None. |
| Surplus and Policy Lab | TOUCH UP | 1/8/4/10/15 | 8 policy chips inside a halo that clips them; 4 area readouts; the grey line under the chips repeats the caption. | Readouts only for areas the policy changes; drop the repeat line. |

## Counts
| Course | PASS | TOUCH UP | FAIL |
|---|---|---|---|
| AP Chemistry | 4 | 4 | 0 |
| AP Environmental Science | 4 | 8 | 0 |
| AP Psychology | 1 | 8 | 1 |
| AP Human Geography | 1 | 6 | 1 |
| AP Macroeconomics | 3 | 3 | 2 |
| AP Microeconomics | 5 | 3 | 0 |

Five worst: Borders lab, Reserves lab, Memory lab, Indicators lab, Climate change.

No page errors on load or during the actions. Nothing looked scientifically wrong; the Borders year pill lag is a
display bug only (the border logic itself is correct).
