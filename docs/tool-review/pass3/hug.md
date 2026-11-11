# AP Human Geography: cleanup pass 3 (2026-11-11, builder c5)

Judge: `docs/tool-review/pass2/judge-b.md`. Shots: `/home/claude/shots/pass3/hug/<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`. The owner-approved Country A base map (Forces) and the scale lab's spread line are
unchanged. Hint placement, halo clipping and chip rows in the dock are the shared fix. No fact, answer or scoring
changed.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| Borders lab (FAIL) | 13 controls; Play below the fold; map a beige box with house dots; Year pill lags during play | Scene ("Show") and boundary type are selects; Play sits on the Year label row, right above the slider (visible at 1280x800). The borderland gets a few woods and low hills, kept clear of the towns and the border band so no type seems to follow them. The Year pill updates on every tick of Play | PASS (Forces keeps its 9 chips: sorting them would give the answer away, pass 2 note; hint is shared) |
| City lab | Caption lists every ring; footnote and legend; phone rings tiny | Caption is one line ("The steepest line wins near the center."); the ring list moved to Details as a "Rings now" table that follows the sliders, with the footnote (invented numbers, rings not to scale, river note). Phone rings drawn larger (more of the stage, and the footnote no longer takes height) | PASS |
| Diffusion lab | 7 chips plus slider plus Play; dense legend; Migration adds 8 chips | Type of diffusion and Migration idea are selects; Play on the Step label row; legend "Reached (darker is earlier)", "Not yet", "Bigger dot, bigger place" | PASS |
| FRQ coach | "Identify" defined three times | Defined once, on the verb card. Caption: "Part A: Identify. Write your answer, then check it."; the line under the box for checklist-free verbs is gone. The common slip stays in Explanation | PASS |
| Map reader | Six map-type chips plus two segments | Map type is a select | PASS |
| Model studio | "1 of 5 places" for stages; DTM no axis names; Malthus Explore lines unnamed; hint | DTM, epidemiological and Rostow count stages ("Start: the first stage", "2 of 5 stages"). DTM gets the Time axis name (a "Rate" label collided with stage badge 1 at 330 px, caught by `check-aphug-content`; left out, the legend names both rates). Malthus in See it names each line in the legend once its place is shown (Build it still says "Solid line" / "Dashed line" so it does not give the answer). `models.html` rebuilt | PASS (hint is shared) |
| Scale lab | The 64-point gap said twice | The caption drops the gap sentence; the approved spread line (dots plus its line) is kept as is | PASS |
| Population lab | PASS | None | PASS |

Checks: `build-aphug --check`, `check-aphug-content`, `check-aphug-map`, `node --test scripts/test/aphug*`
(158 pass), `check-site`, `check-weight`: clean.
