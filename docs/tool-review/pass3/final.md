# Pass 3, final integration: the merged tools checked together (2026-11-11)

Branch `claude/tv4-final`: the eight cleanup builders' tool changes and the shared Tool Studio rewrite (hint as a line
in the layout, ring inside its control, chip overflow "More") merged for the first time. This pass measured all 145
tools in 15 courses at 1280x800 and 390x844, looked at every opening screen, took the first action in every tool, and
fixed what the merge broke. No fact, answer or scoring changed.

Scripts (scratch, not in the repo): `/home/claude/scratch/final/measure.mjs` (the shared builder's measuring script on
port 8893), `probe.mjs` (opening shot, where the hint's target is, local More buttons, console errors, the first
action and whether the stage changed), `tabs.mjs`, `ringlbl.mjs`. Final opening screens:
`/home/claude/shots/final/<course>/<tool>_d.png` and `_p.png` (290 files).

## Measurements, opening screen, all 145 tools

"Before" is the merged branch as handed over; "after" is this branch's head.

| Measure (tools) | Desktop before | Desktop after | Phone before | Phone after |
|---|---|---|---|---|
| Hint showing on the opening screen | 141 | 141 | 108 | 107 |
| Hint floating over the page | 0 | 0 | 0 | 0 |
| Hint covers text / a control / the picture | 0 / 1 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |
| Hint longer than one line | 4 | 0 | 0 | 0 |
| Hint with no target (no ring) | 2 | 0 | 2 | 0 |
| Hint naming an action its ring is not on | 3 | 0 | 3 | 0 |
| Ring reaches past its control | 0 of 139 | 0 of 141 | 0 of 119 | 0 of 119 |
| Ring encloses its own label's text | 1 | 0 | 1 | 0 |
| Ring paints over another item (all inside the target's own box) | 6 | 6 | 7 | 7 |
| Rows showing 6 or more chips | 11 (all opted out) | 11 (all opted out) | 7 (all opted out) | 7 (all opted out) |
| Local "More" for a chip row beside or instead of the shared one | 4 | 0 | 4 | 0 |
| Folded row whose More sits past the phone's edge (sideways-scrolling row) | - | - | 5 | 0 |
| Page errors / console errors / sideways scroll | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 | 0 / 0 / 0 |

The phone hint count is lower than desktop by design: the hint waits until its target is in view (a target below the
fold), and 4 phone hints sit at the top of the sticky band because their target is below it (graph builder, limit
explorer, age structure, memory lab), as the shared builder documented. Evidence builder's phone hint now waits for
its claim list (below the fold), hence 107. The 11 and 7 rows of 6 or more chips are the documented opt-outs
(`docs/tool-review/pass2/shared.md`: lab practical figure labels, pathway step bank, units tray, run and call pickers,
evidence chips, article and evidence parts, z marks, probability questions, Simpson's six species, spectroscopy).

## Clashes found and how each was fixed

| Tool | Clash | Fix |
|---|---|---|
| Curve analyzer (AB) | Its own "More" behind 3 functions; the shared fold never saw the row | Renders every function; the shared More (2) folds them (4 shown plus the one on) |
| Rule drills (AB) | Own "More" and `.rd-few` hiding | Removed; shared More (4) on the examples row |
| Series lab (BC) | Own "More" behind 3 series | Removed; shared More (5) |
| PPC and trade (Macro) | Own "More" and `.is-more` for events, a separate phone scroll row | Removed; events render shift first (Better technology, A recession), shared More (2) folds the rest and Start over |
| Folded rows on a phone (shared) | A folded row inside a sideways-scrolling row (`ls-scroll`, tool rows) put "More" past the screen edge (Taylor lab, surplus lab, rule drills, resonance, 3D viewer) | `.ls-chips-folded` / `.ls-chips-open` rows wrap (tool-studio.css); folded rows are short, so no scrolling is needed |
| Resonance, 3D viewer, spectroscopy (Ochem) | Shared "More (n)" chip directly above the tool's own "More species / molecules / compounds" disclosure | The disclosures read "Other species, or build your own" and the like; one "More" per area |
| Energy chain (Env) | A cleanup turned six source chips into a select; the hint pointed at an invisible spot the redraw removed (no ring) and said "below" | Hint on the source select: "Pick a source, then tap a step" |
| Lab practical (A&P) | Ring lost when the figure loaded (label boxes redrawn); first pick could be a label in the hidden part of the figure | Chosen after the figure loads, among labels in view; the box render keeps the class on the same label |
| Evidence builder (Psych) | Hint "Pick a claim" ringed the part tabs | Ring on the first claim |
| Multiplier lab (Macro) | Ring on the MPC already on: tapping it changes nothing | Ring on an MPC not on; "Tap another MPC: every round changes" |
| Regression lab (Precalc) | "Try each model" while 3 models are folded behind More | "Tap a model and watch the residual plot" |
| Scale lab (HuG) | Ring drawn round the wrapper, through its "Scale of analysis" label | Ring on the scale chips (`hug-sl-scales` first so a redraw finds it again) |
| Design drills (Bio) | Hint line under the first answer sat behind the sticky Next (counted as covering Next) | New shared hint option `above: true`; the line sits above the answers |
| Feedback loop builder, Macro graph studio, Function lab, Sinusoid builder | Hints wrapped to two lines | "Push the variable off, or drag the marker"; "Pick what happens, then drag the curve"; "Drag: up and down for a, sideways for b"; "Slide until the curve meets the points" |

Checked and left: a select a cleanup added that the shared fold also folds (none: the fold never touches selects);
hints pointing at a chip folded behind More (none); "Show all" (model studio steps), "All 25 calls" (scenario
simulator), "More practice" (ochem Details) and the caption "More" are different things, not chip overflow; arrow
pusher's "More molecules" disclosure has no shared More beside it.

## First action in every tool

Every tool's hint target (or, with no hint showing, its first visible control) was used: slider keys, select change,
click, or a drag on a stage handle, and the stage was compared before and after. All 145 respond at both sizes.
Ones that needed a second look: Play buttons (population growth, water pollution, signal transduction) move the
picture after about a second; macro graph studio's pick changes the caption and Show me shifts the curve; the 3D body
map and 3D anatomy respond to a tap on the model (their hint anchor is an aria-hidden spot over the canvas, by design);
externality lab's tax stepper starts at 0, so its minus does nothing (plus does).

## Still not simple or clear enough (judgment, not fixed here)

- Phones, tall sticky band: soil texture (three sliders), Taylor lab, series lab and model studio land with the band
  over the mode tabs or the chip row behind it. The band is the shared phone pattern; a tool with three equal sliders
  should put only one in the band. Model studio's hint line adds one line to an already tall band.
- Pathway tracer (phone): the step slots under the figure are cut at the stage's edge on landing.
- Graph builder (phone): the stage opens on the data table; the empty graph is above it, so the picture is not what a
  student sees first.
- Spectroscopy: six molecule chips plus an "Other compounds" disclosure on desktop (left whole by the shared rules
  because the row is in a quiz-like mode); seven controls before the spectrum is touched.
- Macro graph studio: a 14-option "What happens" select is the first action; fine for practice, heavy for a first look.
- Scenario simulator and station run open on a grid of 6 to 10 cards (documented opt-out); a first-time student has
  no single obvious first card.
- Psychology stats lab's seven z chips and probability trees' six questions are opt-outs that keep a busy dock.

## Checks
`bash scripts/ci-local.sh`: ALL PASS (run after the last change). Macro's and AB's builds unchanged (`--check` in CI).
