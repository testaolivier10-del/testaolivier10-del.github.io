# Tools v2: AP® Biology Energy flow (brief and build notes)

Status file for the v2 rebuild of `bio/tools/energy-flow.html` (rollout row 61, Premium, group P). Standard:
`docs/tools-v2-standard.md`; process: `docs/tools-v2-builder-brief.md`. Branch `claude/tools-v2-bio-energy-flow`,
collecting on `claude/tools-v2-all`. NOT merged: the independent review comes first. Decisions made for the owner
are also in `docs/tools-v2-owner-log.md`.

## The one main idea
**Energy enters a food chain through its producers, and only a small share (about 10%) passes to each next level;
the rest leaves as heat, so the top of the chain supports the fewest organisms.** CED topic 8.2 (Energy Flow Through
Ecosystems): producers capture the energy, it moves up trophic levels, most is lost at each transfer, which limits
the number of levels and the size of the top level. Biomagnification is 8.7 and stays in "?" (see below).

## Research (rule 10): what exists and what we took
"Seen" means the page was opened and read as text; nothing here is claimed beyond what those pages say.

| Source | How it works | Works | Confuses or is missing | What we took |
|---|---|---|---|---|
| dmccreary, Energy pyramid sim (page seen) | Stacked bars, two sliders (producer energy 1,000 to 100,000 kcal, efficiency 5 to 20%), a dropdown for energy, biomass or numbers, a side panel of math | Efficiency 5 to 20% with 10% as the default; instant redraw | Bars, not living things; the 90% that leaves is only a discussion point, not drawn; a side panel | The same range and default for the main control; heat is drawn at every step, not left to discussion |
| dmccreary, Energy flow tracker (page seen) | A left to right chain of four boxes, a solar slider, Play and Pause; red arrows up for heat, brown down for waste, green on to the next level, particles along them | Left to right chain; heat going up at each step | Nothing moves until Play; boxes with numbers in place of organisms | The left to right chain under the sun with heat rising at each step; the sun's control as a quiet second control; no Play needed |
| ExploreLearning Gizmo, Food Chain (student sheet seen) | Grass, rabbits, snakes, hawks; + and - buttons, disease dropdowns, Play; bar chart and graph tabs | Real organisms; "populations shrink at each higher level" | It teaches predator and prey dynamics over time; the energy reason is not on the screen | Real organisms drawn and counted; the counts are made to carry the energy (one drawn per 10 kcal) so the pyramid of numbers is the energy, read without a chart |
| Annenberg Learner, Food web lab (page seen) | Feeding links switched on, predict, run twice, record a table | Predict first | A web of links, no energy amounts | Nothing for this screen (it is a food web tool) |
| LabXchange, Trophic Levels (summary only); Labster, Trophic levels (summary only: a zebra story with feedback) | (not inspected) | (not inspected) | (not inspected) | Nothing claimed |

What ours does better than all of them: one drag on the picture changes every level that instant; animals appear or
leave and the heat at each step grows or shrinks as you watch; the top level stands empty, saying why, when it gets
less than one animal's worth; the reason is written under the picture in the idea's colours.

## The design
- **Main control:** "Share passed on", a knob on the soil under the chain, 5% to 20% in steps of 1% (drag, tap the
  track, arrow keys, Home, End). Its value rides on the knob; a small "before" tick marks the last setting.
- **Quiet second control:** "Sunlight", a small track beside the sun: the energy the grass captures (GPP 10,000 to
  30,000 kcal/m²/yr). It changes the grass and so every level, and never moves the share (rule 8).
- **The picture:** a grassland under the sun, four zones left to right (grasses, grasshoppers, frogs by a pond,
  snakes by rocks). One grass plant or animal is drawn for every 10 kcal/m²/yr a level stores, so the counts are the
  energy. At each step a gold arrow carries the share on ("10%") and orange heat plumes rise with the rest, sized by
  the energy lost there. Each level is named with its energy under it ("Frogs 100 kcal").
- **Heat and passed on on one measure** (review round 1): at each step the energy entering is a band of one length;
  the gold arrow is the share of it, the three heat wisps the rest, on the same stroke width, so heat is drawn
  (1 - share) / share times the arrow (9 times at 10%) at every step and width. The band narrows up the chain with a
  visible minimum. "heat" is written only beside a plume taller than the word. The grass's own respiration (half of
  what it captures, the biggest heat loss) rises as an unlabelled plume from the grass, on the same measure.
- **Instant response:** one loop chases the setting level by level, so a change is seen running up the chain;
  the counts are taken from the written numbers, so they can never disagree (rule 14).
- **Opens** at 20,000 kcal captured and 10%: 1,000 grass plants, 100 grasshoppers, 10 frogs, 1 snake.
- **Cue:** "Drag the share" at the knob, once per device, gone at the first touch; it covers no label.
- **Cause line** (`K.cause`): "10,000 kcal in grass → 10% passed on → 90% lost as heat → 1 snake". The count is
  added once the picture has settled; in Watch it happen the share and the heat are named only once heat is drawn.
- **Watch it happen:** builds the chain from the sun up, one level at a time, and ends on a takeaway: "Only 10%
  moves up each step. The rest leaves as heat, so few live at the top." It never moves a control.
- **Extremes:** 5% leaves the snakes' zone empty with "too little energy" (1.3 kcal at the opening sunlight, 0.6
  kcal at the least, less than one snake's worth); 20% with the most sunlight gives 15,000 kcal in the grass and
  12 snakes.
- **One colour per idea:** energy gold (arrows, share, kcal), heat vermillion (plumes, "heat", the heat pill).
  Every value is also written.
- **Reduced motion:** the result at once with a 240 ms cross fade; Watch it happen goes straight to the takeaway.

### What is on screen in Explore (counted; Playwright, opening state at 1440)
Outside the picture: the purpose line (7 words), "Show me how", the cause line (4 pills, 12 words), "Watch it
happen". That is 2 controls and about 22 words. No side panel, no graph, no readout cards.
On the picture: 2 controls (the share knob with its value and two ends; the sun's track), their names ("Share
passed on", "Sunlight"), 4 level labels (name and kcal), 3 "10%" chips on the arrows, 3 "heat" words (the plume at
the last step is shown only while it is big enough to see). Only while true: "too little energy", "before", the cue.

### Explore against Test yourself
- **Explore:** free play as above. Nothing locked, graded or asked.
- **Test yourself:** "Food chain questions": the page's stimulus questions and the mini FRQ, unchanged in content,
  grading and record ids (`energy-flow:chain:1` and on). `#questions` and `#frq` open the same place.

### What moved
| From today's tool | Where it is now |
|---|---|
| GPP slider | Explore: "Sunlight" beside the sun (range 10,000 to 30,000, was 2,000 to 40,000) |
| Fraction passed on slider | Explore: the main knob, same 5 to 20% |
| Producer respiration and consumer respiration sliders | Fixed (50% and 80%); stated in "?" with the numbers they give |
| Ecosystem picker (land, open ocean) | Explore is the grassland; the open ocean's energy and inverted biomass pyramids are in "?" |
| Add or remove a level (2 to 5) | Fixed at 4 levels (the top one can stand empty, which shows the limit); the "share passed on" table in "?" shows the top level's energy for every share |
| Energy and biomass pyramids, linear or log scale | "?": both pyramids for this setting, and the open ocean's |
| Biomagnification mode, toxin sliders | "?": "A toxin that is not broken down" for the same chain at the defaults; a later separate tool if wanted |
| Tap a level to see where its energy went | "?": "Where each level's energy goes" (takes in, heat, decomposers, stored, drawn) for every level |
| Run one trial, run a series, the runs table | "?": the series of shares 5 to 20% as a table for this sunlight; the runs table is dropped (Explore records nothing) |
| "How this model works", the intro | About (the ⋯ menu); the picture's rule (one drawn per 10 kcal) is in "?" |
| Questions and mini FRQ | Test yourself, unchanged |

## Decisions made for the owner
1. A grassland chain of four (grasses, grasshoppers, frogs, snakes) is the picture; counts stand for energy.
2. Two controls on the picture (share, sunlight); respiration shares, levels and ecosystem are fixed in Explore.
3. The toxin (8.7) leaves Explore for "?"; a separate biomagnification tool can come later.
4. The runs table is dropped; the series table in "?" replaces it.
5. The cause line says "lost as heat" for everything not passed on (the AP shorthand); "?" splits it into heat
   and decomposers (logged in `docs/apbio-needs-author.md`, energy-flow-model).

## Build notes
- Files: `bio/assets/tools/energy-flow.js` and `.css`, data `bio/data/tools/energy-flow.json` ("explore" block),
  page `"kit2": true` in `bio/data/pages.json`.
- Sweep test (kept): `node scripts/tools-v2/bio-energy-flow-sweep.mjs [--shots dir]`: 8 states at 10 widths, light
  and dark at 390, 768, 1440; clipping, label overlap, the picture largest, each organism on its ground, counts
  match the written numbers, cause line two rows at most and constant height on phones, the takeaway in the same
  two rows, no sideways scroll, no console errors.
- 2026-11-18 (second session): Watch it happen scrolls the picture into view on a phone; heat named in the replay only once drawn; takeaway shortened to two rows at 360 and
  given the cause line's height on phones; labels sized by measuring the text.
- Verified 2026-11-18: AP Bio unit tests 72/72, `build-apbio --check`, content and map checks, `check-site`,
  `check-weight`, `check-tool-use` (now lists this tool, frame v2; osmosis's stale "old" expectation fixed); Playwright
  at 390, 768, 1440 light and dark (pointer and touch drag, keyboard, mid animation frames, Watch it happen, reduced
  motion, "?", Test yourself right and wrong, `#questions`, `#frq`, the real locked state, no console errors): 244
  checks, 0 failed; sweep 806 checks, 0 failed. Preview `/mnt/user-data/outputs/bio-energy-flow-v2/index.html`, shots
  in `.../shots/` and `.../sweep/`.
- Not happy with: the grass zone is a dense uniform carpet at wide screens; the last heat plume is tiny (true to the
  numbers, but easy to miss); the open ocean, toxin and runs moved out of Explore and live only in "?".

## Review round 1 (2026-11-18, BLOCK; `/home/claude/review-bio-energy-flow/REVIEW.md`)
| Finding | Fix |
|---|---|
| Heat drawn smaller than the gold arrow at steps 2 and 3; "heat" over a tiny or missing plume | One measure per step (`stepLens`, `plume`, `heatWord`): heat is (1 - share) / share times the arrow on one stroke width; minimum band width; the word only beside a plume taller than it; the sky is a little taller (38% of the scene) so plumes have room at 600 to 820. Sweep checks the drawn ratio (within 0.75 to 1.33 of the expected), equal widths, wisps at least 12 px, and every "heat" word against its plume, at every width |
| "?" implied number pyramids are always upright | The note now says numbers can be inverted (one tree, thousands of insects); energy never |
| Producer respiration not drawn | A plume from the grass, on the same measure, unlabelled (same colour as every "heat") |
| "?" table producer row did not add up | Column renamed "Of its stored energy, not eaten: to decomposers" |
| Branch edited `scripts/check-tool-use.mjs` | Reverted; rebased on `claude/tools-v2-all`; checked with a local copy of the list (frame v2, four events) |
| Phone cause line height override in the tool's CSS | Removed; the kit's two rows (70 px) hold the chain and the takeaway alike |
| Owner log rows after a blank line | Blank line removed |

Rechecked: sweep one width per process, 10 widths, 1826 checks, 0 failed; Playwright 244 checks, 0 failed; replay
names heat only once drawn (0 frames); unit tests 72/72; content, map, site, weight checks pass.
