# AP® Human Geography, Borders lab: tools v2 plan

**Tool and page:** `human-geography/tools/borders-lab.html`; scripts `assets/tools/borders-lab.js`,
`math/borders-lab.js`, `borders-lab.css`; data `data/tools/borders-lab.json`; test
`scripts/test/aphug-tool-borders-lab.test.mjs`. **Premium.** Rollout row 137, group P, wave 22. The visuals review
(`docs/tool-visuals-2026-11.md`) said: fix it; towns are dots in a box, the forces are blocks with bare arrows, the
state shape is one blob with no capital.

**The one idea:** where a border runs, and how a state holds together, comes from the land, the people and history.
Four tabs, one idea each (course topics `defining-boundaries`, `boundary-functions`, `devolution-factors`):
1. Boundary types: when a line was drawn, compared with when people settled, names its type.
2. State shapes: a state's shape changes how far its capital reaches.
3. Forces: some things pull a state together, others pull it apart.
4. Sea zones: a coastal state's rights shrink with distance from the coast.

**Research:**
- [Tufts Law of the Sea, Maritime zones](https://sites.tufts.edu/lawofthesea/?p=73) and
  [UN maritime zones presentation](https://www.un.org/oceancapacity/sites/www.un.org.oceancapacity/files/maritimezonespresentation.pdf):
  the cross section of baseline, territorial sea, contiguous zone, EEZ and high seas with what each allows. Take:
  the ship sailing out through named bands.
- [GRID Arendal, Maritime boundaries](https://abnj.grida.no/maritime/): the zones drawn over the sea floor. Take:
  the continental shelf drawn under the water.
- The Gemini second opinion in `docs/tool-visuals-2026-11.md` (owner's browser, 2026-11-10): forces on real
  geography (a rail hub, a mountain range), state shapes with the capital and the reach. Take both as given.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Scenes Boundary types, State shapes, Forces, Sea zones, Real cases | Explore: four tabs; Real cases move to "?" with neutral wording (logged) |
| Year slider and Play (draw the history of a border) | Tab 1: drag the years (main, the kit time bar) |
| Boundary type chooser (antecedent, subsequent, consequent, superimposed, geometric, relict) | Tab 1: a quiet tap on the map's legend of histories; geometric and relict shown as their own histories |
| State shape views; layers "Land Country B claims", "National railway", "Bessan-speaking region" | Tab 2: tap a shape (main); tab 3: tap a feature (main) |
| "Ship's distance from the baseline" slider (0 to 260 nm) | Tab 4: drag the ship (main) |
| Drills boundary, shape, forces, sea; contexts `boundaries`, `forces`, `sea` | Test yourself, unchanged; ids `borders-lab:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Boundary types: invented land with a river, a hill range and two peoples' villages (each people in its own
  color, with its language named). Drag the years: villages appear over time and the border is drawn at the year
  its history says: before settlement along the river (antecedent), after, following the divide between the two
  peoples (consequent, a kind of subsequent), or a straight line ruled by an outside empire across a people
  (superimposed, geometric). Relict: the border is erased but a drawn old wall and a change of roof colors remain.
  Cause line: "Drawn in 1850, before anyone settled → antecedent".
- State shapes: five invented states (compact, elongated, fragmented, perforated, prorupted) each with its capital;
  tap one: rings of travel time spread from the capital, showing which edges are far.
- Forces: one state with a national railway hub at the capital, a mountain range cutting off one province, a region
  speaking another language, a shared flag on a stadium; tap a feature: arrows on the land pull toward the capital
  (centripetal) or away (centrifugal), named.
- Sea zones: a coast in cross section and from above; drag the ship out: it crosses 12, 24 and 200 nm marks; the
  coastal state's patrol boat shows what it may do in each band (stop the ship, check customs, claim the fish and
  oil, nothing on the high seas).
Outside the picture: tabs, purpose line, Show me how, time bar (tab 1), cause line: about 25 words, 4 controls.

**Science to verify:** boundary type definitions (Hartshorne 1936 terms as the CED and the course use them);
consequent as a subtype of subsequent (course wording); UNCLOS zones: territorial sea 12 nm, contiguous zone 24 nm,
EEZ 200 nm, continental shelf up to 350 nm in some cases, high seas (UNCLOS 1982, articles 3, 33, 57, 76); state
shape names and their usual examples (only as "often classed as"); every map invented (Country A, Country B,
Corvia); "?" real cases use the control, claim and recognition pattern with a date (accuracy risks section 4), and
no answer depends on a disputed status.

**Reuse:** `ApHugTools.kit2` (added by the first HuG kit2 tool); kit `K.tabs`, `K.progress` and `K.player`,
`K.tap`, `K.drag` for the ship, `K.spots` for the features (the wave 22 piece), `K.cause`. The drawn Country A style
from `figures/base/country-a.json`.

**Risks reviewers will likely block on:** four scenes of new art (weight, the file is already 54 KB raw); colors for
peoples must not imply ranking or biology (accuracy risks section 5; a pattern plus a name, not color alone); the
border drawn before the cause line names its type; the patrol boat's labels and the nm marks crowding a 360 screen;
real places in "?" worded neutrally; no dashed lines for borders that could read as disputed when they are not (use
the line styles the legend explains).
