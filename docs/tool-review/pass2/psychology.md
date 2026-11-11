# AP Psychology: second pass, simple and clear (2026-11-10)

Standard: `docs/tool-review/SIMPLIFY.md`. Every tool opened at 1280x800 and 390x844, every scene in Explore and the
Test yourself view of the changed tools. Shots: `/home/claude/shots/pass2/psychology/` (`<tool>_land_d.png`,
`_land_p.png` for all ten; `_before_d.png` for the six changed). Counts are for the busiest Explore view of the tool
(the view named): text labels on the picture / live numbers / control groups showing / panels.

LEAVE 4, SIMPLIFY 6, CHANGE 0.

| Tool | The idea | Best way to show it | Verdict | Before | After | What changed | Behind a tap now |
|---|---|---|---|---|---|---|---|
| Article analysis studio | Where each AAQ part is answered in a study and what earns the point | The study as a page, the part's sentence lit, one part at a time | LEAVE | page + 6 part tabs | same | Nothing | |
| Brain map | Where each structure is and what it does; contralateral control; split brain | The drawn brain, tap a part | LEAVE | Outside 7 / 0 / 3 / 1; Inside 9 / 0 / 3 / 1 | same | Nothing (see notes on Inside) | |
| Conditioning lab | Classical acquisition to recovery; schedule shapes; the four consequences | Dog with gauge over its record; the cumulative record with a close-up; the example drawn above the 2x2 answer | SIMPLIFY | Schedules 12 / 3 / 3 / 3; Consequences 20 / 0 / 3 / 4 | Schedules 7 / 2 / 3 / 3; Consequences 12 / 0 / 3 / 4 | Schedules: Skinner box carries only its name (the 4-line schedule rule was the side text again), no press-count bubble on the pen (the Presses readout counts), close-up titled "the last 2 minutes" without end times. Consequences: no step headings, no "times a day" note, no quadrant sublines (the row and column labels already say added or removed, up or down); the BEEP word the cross covered is gone | Schedule rule: side text and Explanation |
| Development | Piaget and Erikson stages across a life; attachment; parenting; aging | The person at an age above four lanes, a marker crossing them | SIMPLIFY | Lifespan 28 / 1 / 4 / 2 | Lifespan 9 / 1 / 4 / 2 | Explore timeline names only the stage the marker is in, per lane; a stage too narrow for its name is written beside its band; the others carry their name as a tooltip and are named as the marker reaches them (drag, tap, Play a life). Lane subtitles moved to tooltips (the Piaget and Erikson chips name them). Phone: the lane heading names the stage, no band text. Test yourself timelines unchanged | Other stage names: on hover, or by moving the marker |
| Evidence builder | Build an EBQ answer: claim, cited evidence, concept, reasoning | Sources as the exam shows them, one part at a time, scored live | LEAVE | writing tool | same | Nothing | |
| Memory lab | Serial position; spacing beats massing; proactive vs retroactive interference | List run on you; the forgetting curve you shape; the recall going wrong | SIMPLIFY | Interference 19 / 2 / 3 / 2; Forgetting 4 numbers | Interference 11 / 1 / 3 / 2; Forgetting 3 numbers | Interference: two cards (learned first, learned second) without sublines; the third "now trying to recall" card became a Now dot on the timeline tied to the recall below, which shows the same thing; no "got in" note and no Proactive/Retroactive pill (the arrow's label names it). Forgetting: day 30 percent shown once (readout), not also as a bubble | |
| Neuron | Threshold and all-or-none; what drugs do at the synapse | Neuron over its trace; the synapse over receptor activation | SIMPLIFY | Synapse: result drawn before any action | result appears on Release | Receptor graph, no-drug dashed curve and the Signal readout wait for Release; a new drug or transmitter clears them until the next Release | |
| Sensation and perception | Signal detection; Weber; afterimage; depth cues and Gestalt | The two curves and criterion; two patches; the real flag; one drawn cue at a time | SIMPLIFY | Perceive: 11 chips + button (5 control rows) | 1 picker with previous and next + button | The eleven figure chips are one select (Depth cues / Gestalt grouping) with ‹ › beside it | Figure list: in the picker |
| Social influence | Classic results and what changes them | The study drawn beside its published results, the student's condition highlighted | SIMPLIFY | Groups 2 scenes + 2 charts, 2 readouts, 2 chip rows; Obedience 3 panels, 65% shown 5 times | Groups 1 scene + 1 chart, 1 readout, Effect choice + 1 chip row; Obedience 2 panels, 65% 3 times | Groups: new Effect choice (Being watched / Working in a group) shows one study filling the stage with its own chart and readout; the side text speaks to that study. Obedience: the 40-figure grid and its line (the selected bar again) removed; the bars are titled "Went to the last switch (450 V)". Test yourself figures unchanged | The other group effect: one tap on Effect |
| Stats lab | z and the normal curve; mean vs median; correlation | The curve with a draggable score; the dot plot with a balance point; the scatter | LEAVE | Curve 9 / 3 / 3 / 1 | same | Nothing | |

## Notes

**Graphics.** The drawn pictures are consistent with the site and look like the real thing: the dog, rat and Skinner
box, the strange-situation poses, the synapse, the Asch, Milgram, Darley and Latane and pool scenes. Fixed: the crossed-
out speaker in Consequences had a BEEP word half under the cross. In Groups the single-study scenes are drawn larger
than when both shared the stage. Small, not changed: in Perceive, relative size's two labels sit on the horizon line
rather than next to each tree.

**Chose not to simplify.**
- Brain map Inside shows nine structure names at once (over the 7 label guide). It is a map: the names are what a
  student needs to answer the question in front of them, the leader lines are clean, and "Key labels" already lets a
  student hide them. Kept.
- Stats lab Curve repeats z and the percentile in the two readouts and in the tag at the handle. The tag sits on the
  handle (cause next to effect) and the readouts are the course-wide pattern; removing either hurts more than it helps.
- Conditioning Classical and Schedules keep two panels (scene with gauge over its record; record with its close-up):
  each pair is read as one thing, and the close-up is what makes FR's pause and run visible.
- Social influence Conformity keeps all bar values: comparing group sizes is the lesson.

**Nothing lost.** Every scene, chip value, example, figure, data table, drill, readout and saved key is still
reachable; the only state added is the Groups Effect choice (Explore only, not saved). Mental-health language and
no-myths rules: no wording about conditions was added.

## Checks
`node scripts/build-appsych.mjs --check`, `check-appsych-content.mjs`, `check-appsych-map.mjs`,
`node --test scripts/test/appsych*` (152 pass, 0 fail), `node scripts/check-site.mjs`, `node scripts/check-weight.mjs`.
