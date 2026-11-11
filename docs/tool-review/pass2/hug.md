# AP Human Geography: simplicity pass (pass 2, 2026-11-10)

Counts are from the opening screen (and the busiest scene named) at 1280x800: labels on the picture (SVG text),
legend or key items, live numbers (pills), words on the stage outside the panel. A chip row counts as one control.
Screenshots: `/home/claude/shots/pass2/hug/` (`_land_d`, `_land_p`, and `_before_d` for changed tools).

| Tool | The idea | Best way to show it | Verdict | Counts before -> after | What changed | Behind a tap now |
|---|---|---|---|---|---|---|
| Borders lab | Why a border runs where it does; what pulls a state together or apart | Boundary types: the land, the border and a timeline, one type at a time, Play the years. Forces: Country A with the force just tapped drawn on it | SIMPLIFY | Types (antecedent): legend 4 -> 0, stage words 10 -> 0; relict legend 6 -> 0; consequent 5 -> 2. Forces: legend 5 (up to 12 with all on) -> 2 to 3. Shapes: legend 3 -> 2, stage words 38 -> 13 | Types: scattered hills and woods removed (the geometric ridge and river stay: ignoring them is the point), 22 towns -> 14, the timeline names its events ("Towns 1820", "Border 1760", "Joined 1830"), river, ridge and customs post named on the land. Forces: the last tapped force in full, earlier ones dimmed; legend for that force plus the color key; only its region named. Shapes: legend no longer repeats the capital and the km | Shapes' "older classification" note moved to Explanation |
| Model Studio | What each of 21 models looks like and where its parts go | The model's drawing, its places revealed one at a time, the one in focus named | SIMPLIFY | DTM after Show all: key items 5 on stage + 5 in panel -> 1 line; panel words 76 -> 50; gravity stage words 65 -> 28; opening caption 50 -> 27 words | The numbered key under each drawing and the same list in the panel are gone; one line under the drawing names the place in focus, and tapping a number on the drawing focuses that place. Opening caption is the claim's first sentence. "Test yourself on this model" appears once the model is seen in full or built and checked | Every place: Details. Drawing notes (gravity formula, Rostow "illustrative"): Explanation, "About the drawing". Full claim: Explanation |
| City lab | Rings come from bid rent; city models; central places; rank-size | Rings beside the bid-rent lines; each city model drawn with its zones | SIMPLIFY (City models scene only) | City models key 5 to 9 items (two models: up to 18) -> 1 line | Each zone number names its zone on tap (zone outlined) | Full key: "All zones" |
| Diffusion lab | How a trait spreads, step by step or jumping between big places | The map with places lighting up as Play runs | SIMPLIFY (legend only) | Legend 6 to 7 -> 3 to 4 | Steps are one legend item (a row of shades), sizes another | none |
| Map reader | One data set looks different on six map types | The map type, read legend then pattern then limit | SIMPLIFY (cartogram only) | Cartogram key 8 -> 0 visible; stage words 50 -> 19 | Letter key collapsed; line repeating the caption dropped (Explore only; drills keep the open key) | "Which province is which letter" |
| Population lab | The pyramid's shape follows from birth and death rates | Pyramid beside the DTM curves with the stage marked, fertility slider | LEAVE | 2 live numbers, 3 pills of shares, 4 controls | none (axis ages are the chart, not labels) | |
| Scale lab | The same data tell a different story as the units get smaller | One map whose units split in place, with the spread line | LEAVE (owner approved and live) | | none | |
| FRQ coach | What each task verb demands | The question with the verb in focus, one part at a time | LEAVE | | none (the question is the picture; its words are the content) | |

## Graphics quality
- Borders lab: the land is now the border, the river or ridge, the towns and the peoples; nothing decorative. Forces
  keep the approved Country A base (its hills and forest marks are the base map's, unchanged).
- Model Studio drawings unchanged (first-pass figures); the focus ring on the current badge and the outline in City
  lab match the existing teal.
- Dark mode uses the existing variables; new text uses `--muted`/`--cink`.

## Not simplified, and why
- Borders lab forces keep all nine force chips in one row group: the student's job is to tap a force and see whether
  it lands green or orange, so sorting the chips into "together" and "apart" would give the answer away.
- Borders lab keeps the Year slider beside Play: scrubbing to the year the border is drawn is the cause-and-effect.
- Sea zones key stays (4 items, current zone highlighted); the pill and slider both show the ship's distance, left
  as is because the pill sits by the picture and the slider value by the control.
- Drill figures (Test yourself) unchanged: the keys there are needed to answer the question in front of the student.
- Population lab's pyramid ages and the city lab's bid-rent axes count as many SVG texts but are the chart's scale.

## Checks
`build-aphug.mjs --check`, `check-aphug-content`, `check-aphug-map`, `node --test scripts/test/aphug-*` (158 pass),
`check-site`, `check-weight`.
