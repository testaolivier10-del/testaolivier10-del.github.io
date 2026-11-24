# AP® Human Geography, City lab: tools v2 plan

**Tool and page:** `human-geography/tools/city-lab.html`; scripts `assets/tools/city-lab.js`, `math/city-lab.js`,
`city-lab.css`; data `data/tools/city-lab.json`; test `scripts/test/aphug-tool-city-lab.test.mjs`. **Premium.**
Rollout row 138, group P, wave 22.

**The one idea:** every place is where it is because of distance and the people it serves. Three tabs, one idea each
(course topics `von-thunen`, `city-structure`, `city-size-distribution`):
1. Bid rent: each land use bids for land, and the highest bid wins; transport cost sets the rings.
2. Central places: a store opens only where enough people live within its range (threshold and range).
3. Rank-size: in many countries the nth biggest city is about 1/n the size of the biggest; a primate city breaks it.

**Research:**
- [swilliams APHUG interactive visuals, Topic 5.8 von Thünen](https://swilliams9151.github.io/APHUG_Interactive_Visuals/5.8.html)
  (seen): drag four land uses onto rings, then "add a river" and "modern" variants. Take: the river variant as a
  quiet case; improve: the rings come from bid lines the student moves.
- [UCL CASA, Von Thünen model](https://www.ucl.ac.uk/bartlett/casa/about/software/von-thunen-model): a simulation
  where transport cost changes the rings. Take: transport cost as the main setting.
- [Wikipedia, Bid rent theory](https://en.wikipedia.org/wiki/Bid_rent_theory): the bid lines crossing and the
  rings below. Take: lines and rings drawn on the same distance axis.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Scenes Bid rent and rings, City models, Central places, Rank-size | Explore: tabs Bid rent, Central places, Rank-size; the seven city models (Burgess, Hoyt, multiple nuclei, galactic, Latin American, African, Southeast Asian) move to Test yourself and "?", with a link to Model studio, which builds each (logged) |
| "Cost of transport" slider (50% to 150%) | Tab 1: drag the cart on the road (main) |
| "Price of milk and vegetables" slider | Tab 1: a quiet knob on the market stall |
| Range and threshold controls | Tab 2: drag the store's range ring (main) |
| Rank-size: cities and the 1/n rule, primate city | Tab 3: drag the biggest city's height (main); a quiet "primate city" tap |
| Drills rings, bidrent, models, central, ranksize; contexts `city`, `farm`, `places` | Test yourself, unchanged; ids `city-lab:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Bid rent: a town with a market at the center, a flat plain drawn around it; above it, the bid lines for each use
  (market gardening and dairy, forest, grain, ranching) on one distance axis. Drag the cart on the road (dearer or
  cheaper transport): the lines steepen or flatten and the rings on the plain grow or shrink at once, each ring
  drawn as its land use (vegetable plots, woodland, wheat, cattle). Cause line: "Transport up 30% → milk must stay
  close → the dairy ring shrinks to 4 km". Takeaway: "The use that can pay most for a spot gets it."
- Central places: a landscape of villages and farms; a store in the middle with its range drawn as a ring; drag the
  ring: the houses inside light and are counted; the store opens (lights on) when the count passes the threshold.
- Rank-size: a skyline of a country's ten cities in rank order with the 1/n heights drawn as thin guides; drag the
  biggest city's skyline: the rule's heights for the others follow as guides, and the real (invented) cities show
  how close they are; the primate tap makes one city far bigger than the rule.
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify:** von Thünen (1826) ring order and assumptions (isolated state, flat plain, one market, ox cart
transport); bid rent (Alonso 1964) for the urban version, kept apart in wording; Christaller (1933) range and
threshold; rank-size rule (Zipf 1949) and primate city (Jefferson 1939); all numbers invented to show the idea (say
so); models are models with limits (accuracy risks section 6), each tab's "?" names one limit.

**Reuse:** `ApHugTools.kit2` (added by the first HuG kit2 tool); kit `K.tabs`, `K.drag` on the road and the stall,
`K.handle` for the range ring and the skyline height, `K.tap`, `K.cause`. If Model studio has drawn the city models
first, link to it rather than drawing them twice.

**Risks reviewers will likely block on:** the bid lines plus rings can read as a bare chart (the plain must be drawn
land use, not colored circles); one control moving another (milk price must change only the dairy line, never the
cart); houses counted in the range ring must equal the drawn houses; skyline heights in proportion; moving the city
models out of Explore must be logged in the owner log.
