# AP Human Geography tools build (task hug, branch claude/tv-hug, 2026-11-10)

Tools changed: Model Studio and Borders lab. Scale lab, map reader, diffusion lab, population lab, city lab and
FRQ coach were not touched (LEAVE or done). Screenshots: `/home/claude/shots/build/hug/`.

## Model Studio

What changed
- Five models that were blank numbered boxes now have drawn figures (`human-geography/assets/tools/math/model-studio.js`,
  ids set in `data/tools/model-studio.json`):
  - Rostow: a staircase of five rising steps, each filled with the share of farm, factory and service work (farming
    shrinks, services grow), with a small drawing on each step (fields, a cart on a road, one factory, several
    factories, a shop and a car). See it builds the staircase step by step (later steps faded).
  - Epidemiological transition: four stage columns; deaths from infection and famine (spiky in stage 1) fall, deaths
    from chronic diseases rise, and the typical age at death keeps rising (which is what tells stage 4 from stage 3).
  - World system: core, semi-periphery and periphery rings (not a world map), raw materials and cheap labor flowing
    in (brown), finished goods and profits flowing out (teal), small mines, crops, forest, factories and towers.
  - Gravity: three pairs of towns drawn from the generated model's own numbers: circle area grows with population,
    the gap is the distance, and the band between them is as wide as P1 x P2 / d squared.
  - Rank-size: bars for ranks 1 to 6 against the dashed 1/n curve, with a "Show a primate city" switch (the largest
    city more than three times the second, the rest far below the curve) and a note that changes with it.
- Gravity's bands and rank-size's bars are the answer, so they (and the numbered places) are hidden in Build it and
  in drills until the student presses Check. See it and Build it use the same generated numbers.
- Every model's drawing now fills the stage: the drawing's slot is a size container that takes the height left by
  the list of places (now under the drawing, in columns), and the picture grows to fit (measured `--ms-below`).
  Ring models (von Thunen, Burgess) and the map models grow the same way.
- Bug fixed: Check threw in the studio (it looked for its button inside the moved panel), so the feedback line and
  caption after a check never showed. It now looks in the panel.
- The models page (`models.html`, via `scripts/lib/aphug-entry.mjs`) shows the new figures, gravity and rank-size
  drawn from the same numbers as the key beside them.

Verified
- New test: gravity and rank-size figures for 200 seeds never collide at 330 to 900 px, spots match slots, and the
  widest band belongs to the pair keyed "most interaction". Existing figure overlap test covers the other three.
- Facts: gravity as P1 x P2 / d squared and a primate city as more than twice the second city match the course's
  notes and models page. The Rostow work mix is labeled "illustrative" on the figure: Rostow's stages are about
  growth, and the sector shift is the usual teaching picture of it, not numbers from Rostow.
- Screenshots at 1280x800 and 390x844, light and dark, See it, Build it after Check, the drill.

## Borders lab

What changed
- Boundary types: drawn land. Hills and woods everywhere; the Tarn as a wide river where the border follows it
  (antecedent, subsequent, relict); for geometric, a ridge and a river that the straight 41st parallel cuts across;
  for consequent, the Ardic and Bessan areas shaded so the line visibly follows where one people gives way to the
  other; for superimposed, the Ardic homeland as a shaded shape with "Corvia's line" cutting through it (the tag is
  left out of the drill so it does not answer the question). Towns are small clusters of houses in each people's
  colors. The timeline sits right under the land instead of at the foot of the stage.
- Forces: drawn on the base Country A (`figures/base/country-a.json` with sea, rivers, lake, hills, trees and the
  neighbor's border, as the diffusion lab does). Each scene is a thing on the land: the national railway as rail
  lines from the capital (the rail hub, a star) to every province; mountains along the Western Uplands, and when the
  railway is on the line to the uplands goes dashed beyond them; flags for one national history; footballs for the
  team; clinics; a hatched Bessan-speaking Eastern Plains with its own flag; factories round the capital and falling
  incomes in the Southern Forest; Country B's claim on the Lake District; bombed rail to the South Coast. Green marks
  pull together, orange pull apart; regions pulled away are shaded and named. The legend lists only what is on.
- State shapes: each outline has a capital (star), rings every 300 km clipped to the land, and the route to the
  farthest edge with its distance (compact 950 km, elongated 1,550 km, prorupted 1,500 km, perforated 2,100 km
  around the state inside, fragmented 1,100 km dashed across the sea; 1 drawing unit = 12 km, invented states).
  The drill outlines are unchanged.

Verified
- `node scripts/build-aphug.mjs --check`, `check-aphug-content`, `check-aphug-map`, `check-site`, `node --test
  scripts/test/aphug-*.test.mjs` (158 pass). Screenshots at both sizes, light and dark, and the boundary and shape
  drills.

## Not done
- Sea zones and Real cases were left as they are (the review called them fine).
- The forces drill still has no figure (it is a text scene); out of this task's scope.
- No mockups were shown to the owner first; the lead's brief said to build.
