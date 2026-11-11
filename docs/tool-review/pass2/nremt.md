# NREMT: second pass, simple and clear (2026-11-10, task nremt pass 2)

Branch `claude/tv2-nremt`. Opened at 1280x800 and 390x844, Premium on. Shots: `/home/claude/shots/pass2/nremt/`
(`<tool>_land_d.png`, `_land_p.png`; changed tools also `_before_d.png`; extra: `skillsheets_run_d.png`,
`scenario-sim_labor_d.png`). Counts are for the opening screen (labels on the picture / live numbers / controls showing
/ words outside buttons / panels); "words" were counted by script on the tool's main area, so they include the
caption, not only the stage.

| Tool | The idea | Best way to show it | Verdict | Before | After | What changed | Moved behind a tap |
|---|---|---|---|---|---|---|---|
| Body map | Where structures sit in the body; burn size by the Rule of Nines | The body itself: tap a part, it is named and explained; Burns paints regions and totals | LEAVE (the bar) | 0 / 0 / 3 / ~25 / 1 | same | Nothing | - |
| Scenario simulator | The patient responds to what you choose | The patient and the monitor as one bedside; four choices under the story | LEAVE (layout); figure fixed | case: 2 callouts / 4 vitals / 4 choices (+ survey chips, view) / ~60 story / monitor + patient | same | Women patients are drawn as a woman (see notes); "her" in the care strip for s17 | - |
| Protocol flows | The order of a protocol, and why | The chart itself, shapes for action, question, end; produce it in Build and Drill | SIMPLIFY | 14 inline amber "why" paragraphs on the charts (primary assessment: ~45 extra words on screen) | 0 inline; a small "Why?" under the step | Each chart's note is a "Why?" pill that opens in place | The notes (also in Explanation, unchanged) |
| Mnemonics | Expand the letters, then see them used | The card with its letters; Fill the letters to self-check | LEAVE | 6 rows / 0 / 4 / ~40 / 1 | same | Nothing | - |
| Station run | Say each step against the clock; a miss shows on the patient | The patient with the step's action on it, one step at a time, the clock in view | SIMPLIFY | run: clock cut off at 800 px tall; intro repeats "tick each action as you say it" | clock fully on screen; intro is the case only | Desktop stage height follows the window; the repeated instruction left all 10 intros | - |
| Sound trainer | Hear each sound where it is listened for, and when in the cycle | The chest with the listening sites; the lit site is where this sound is loudest; Play | SIMPLIFY | 9 text labels on the chest (R, L, 2, 3, 4, 5, ICS, MCL x2) | 4 to 6 (R, L, then only the rib space and MCL of the lit site) | Landmark labels follow the site in focus | The other rib numbers (shown when their site is lit) |
| Drug formulary | Decide give or withhold from a patient chart | One chart card; Give or Withhold | LEAVE | 3 vitals chips / 0 / 3 / ~30 / 1 | same | Nothing | - |
| Reference cards | Find the right row fast; score GCS, APGAR, PAT | The age strip and one range bar for the vital chosen | SIMPLIFY | Vitals: 78 words; each range said twice (row line and buttons), the "type a number" line said twice | 51 words; each said once | Row line is the row's name (plus the SBP rule in SBP mode); the empty-state hint left the stage | - |

Totals: LEAVE 4, SIMPLIFY 4, CHANGE 0.

## Graphics quality
- The scenario simulator drew every adult on the male figure, including a woman in labor with a drawn uterus. The figure
  builder now makes a woman from the same model (breasts, waist and hips; landmarks unchanged) in the scenario-only
  data set; seven adult cases whose opening names a woman use it. Body map figures are byte-identical. Limits in
  `docs/nremt-needs-author.md` (male pelvis under the skin; a real female mesh would be better).
- Station patients, body map, chest, chart card: drawn, consistent, real things. Nothing reads as clip art.

## What I chose not to simplify, and why
- **The scenario monitor keeps four numbers (HR, SpO2, BP, RR).** The standard says at most 2 live numbers, but the
  monitor is the real thing an EMT reads at a glance, and the case's choices depend on reading them together. Hiding
  two behind a tap would teach the wrong habit.
- **The body map legend has 6 items** (more than 4). It is the owner's bar; left as is.
- **Picker lists** (the protocol chips in Protocol flows, the nine sound chips, the 25 calls, the 10 stations) are one
  choice each, not separate controls; on a phone they are one scrolling row. Folding them into a dropdown would hide
  what there is to practice.
- **Protocol charts keep every box label.** A flowchart is its words; cutting them would flatten the protocol.

## Accuracy work in this pass
Station step lists checked against the Registry PDFs (E201, E202, E204, E211, E212, E215, E216, E217) and the 2025
AHA/AAP pediatric pad guidance; what changed and what was confirmed is in `docs/nremt-needs-author.md`
("Pass 2 checks"). Tests pin the sheets' critical criteria (`scripts/test/nremt-station-patient.test.mjs`).

## Weight
The female figure logic is in `scenario-care.js` (fetched with the first patient) and the figure in `body-figs/case.js`
(fetched only for these cases); `scenario-monitor.js` changed by one argument. The other changes load with their own
tool pages.
