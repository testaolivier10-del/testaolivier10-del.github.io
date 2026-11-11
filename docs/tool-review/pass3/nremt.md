# NREMT: cleanup pass 3 (task c1, 2026-11-11)

Judge file: `docs/tool-review/pass2/judge-a.md`. Shots: `/home/claude/shots/pass3/nremt/` (`<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`; extra: `flowcharts_build_after_*`, `scenario-sim_call_after_*`,
`skillsheets_phase2_recheck_*`). The body map was not touched (owner's bar). No clinical text, answer or scoring
changed; every protocol box, call, sound and station step is the same words in the same order.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| flowcharts | TOUCH UP: opens on a whole 110 word chart plus 10 protocol chips; Build it shows 19 empty slots and 19 cards | Protocols are one select (dock in Read, top of the board in Build; the old chips stay hidden and are pressed by the select, so the hash links, Show all and print still work). Read opens a chart down to its first fork with "Next part of the chart" and "Whole chart" under it; each tap adds the next part under the last, scrolled into view. Build works one part at a time: about five slots (a question stays with its arms), the tray holds only that part's steps plus one tile from another protocol in each of the first two parts; the next part opens when this one is full; "Part 1 of 3: 2 / 6 placed". Simulated full builds of Primary assessment and SALT to the end card | PASS: Read about 6 boxes and 40 words on landing; Build 6 slots and 7 tiles |
| sound-trainer | TOUCH UP: 9 sound chips, Play, a waveform and Front/Back at once; the "R" label ran under the Front/Back switch; coach over the chest on the phone | R and L moved below the switch (front and back views; R is the patient's right, on the viewer's left in front). The beat strip under Play now appears with the first Play, next to the sound it draws | PASS for this pass. The sound chip rows and the coach bubble are the shared "More" overflow and hint fixes (not mine, per CLEANUP.md) |
| scenario-sim | TOUCH UP: 25 call cards plus 8 filter chips; in a call the monitor, body, 4 tabs and the story at once | Picker opens on six calls and "All 25 calls, by kind" (which shows every call and the kind chips). In a call, the opening shows the story and the patient; the monitor waits behind "Check vitals: open the monitor" (phone: the view switch opens on Patient), and opens on that tap or with the first choice. A time-critical opening (the spurting leg) keeps the monitor from the start, because the numbers falling while you wait are the lesson | PASS: picker 6 cards, 1 button; call opening 1 picture, 2 callouts, 4 tabs, no live numbers until asked |
| skillsheets | TOUCH UP: the mannequin "never changes" | Re-checked, no change made: the camera does move to each phase's region and the patient changes with each tick (phase 2 of Long Bone zooms to the deformed forearm with the partner's hands; see `skillsheets_phase2_recheck_*`). The judge saw phase 1, which is BSI and is meant to show the whole patient | PASS on re-check |
| mnemonics (PASS nit) | "Show the answers" marked every empty letter "blank" in red | An empty row now reads "not tried" in a neutral grey; a wrong answer is still red | PASS |
| body-map, formulary, reference-cards | PASS (nits: legend wraps; newborn blob) | Not touched (body map is the bar; the newborn drawing is a redraw for a later pass) | PASS |

Weight: the six-call picker and Check vitals cost about 0.5 KB gzipped on the simulator page; the NREMT shell budget
went 28 -> 28.3 and `nremt/scenario-sim.html` 57.2 -> 57.6 in `scripts/check-weight.mjs`, with the reason.
