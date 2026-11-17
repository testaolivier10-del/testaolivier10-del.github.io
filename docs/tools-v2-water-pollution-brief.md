# Tools v2, flagship: APES Water pollution (brief, 2026-11-16)

## Why (owner, 2026-11-16)
After the frame round the owner still finds tools hard: "hard to figure out what you are supposed to be manipulating
and what that is supposed to teach you", pages with "a bunch of information in a side panel", visuals that could be
far better. He wants every tool "the literally best it can be. No shortcuts. No confusing mess. A layout that is
translatable across all tools. Tools that are actually interactive. Tools that actually teach. Tools that don't take
time learning how to use them." He picked Water pollution as the flagship. Once he approves it, its pattern is applied
to every tool. Principle from before still holds: clean on the surface, full depth underneath; nothing the tool can
do today is lost; every change has a reason.

## What is wrong today (seen at 1440 and 390, 2026-11-16)
1. Three different lessons (eutrophication, thermal pollution, sewage treatment) hide behind a small
   Nutrients / Heat / Sewage switch in the side panel, under the Play button. The task title stays "Follow nutrient
   pollution..." in Heat and Sewage: wrong.
2. The chain strip under the scene reads "Nutrients, 2, 3, 4, 5, 6": the steps that ARE the lesson are unnamed.
3. What you change (fertilizer, warm water, treatment stage) is a slider in the side panel, far from the thing it
   changes (split attention). The Day slider duplicates Play.
4. The side panel fills with bold paragraphs (Sewage: ~70 words) while the picture waits.
5. The lake never visibly turns green; the bloom lives only in the graph. Scene and graph are not linked (no shared
   cursor, cannot scrub the graph).
6. No goal: nothing to predict, nothing to achieve, so a student presses Play once and leaves.
7. "Settings: Lake at 20 °C" is an opaque chip; "?" opens a third column that squeezes the stage.

## The concept the tool must teach (CED 8.5, 8.6, 8.11)
- Eutrophication is a CHAIN: nutrients -> algal bloom -> algae die -> aerobic decomposers break them down and use
  oxygen -> dissolved oxygen falls -> below 2 mg/L, hypoxia (dead zone), fish leave or die. The counterintuitive core:
  adding "food" for plants kills fish, and it is the decomposition, not the algae themselves, that uses up the oxygen.
  Warm water makes it worse (holds less oxygen).
- Thermal pollution: heat alone, no chemical, lowers the oxygen water can hold.
- Sewage treatment: primary removes solids, secondary removes organic matter (BOD) with aerobic bacteria, tertiary
  removes nitrogen and phosphorus, disinfection kills pathogens. Skipping tertiary sends N and P downstream: the
  same bloom chain. (This is the link between chapters 1 and 3; show it.)

## The design (this becomes the v2 pattern for every tool)
### Layout
- Stage (left, biggest): the illustrated scene and its linked graph. Chapters as named tabs ON the stage top:
  "1 Fertilizer runoff", "2 Hot water", "3 Sewage" (a tool with one lesson has no tabs).
- Side panel: the loop for the current chapter, in this order and nothing else:
  1. Goal line (one sentence, changes per chapter).
  2. Predict (one tap, before the first run; 3 short choices). After the run the panel says whether the prediction
     held, in one sentence that names the link in the chain that explains it.
  3. Live readout (2 to 3 big numbers that matter, e.g. bottom oxygen mg/L with a status word: Healthy / Stressed /
     Dead zone).
  4. Challenge card (one at a time, with a check mark when met), then the next challenge.
- "?" opens a sheet OVER the stage (not a third column) with the model notes, sources, table and settings.
### Controls live on the picture (direct manipulation)
- Fertilizer: drag the number of fertilizer sacks on the field (0 to 5) or tap the spreader; the runoff stream on the
  slope thickens.
- Hot water: a dial or handle on the power plant's outflow pipe sets how much warmer the outflow is.
- Sewage: tap a tank to make it the last stage used; skipped tanks grey out and a bypass pipe goes to the river.
- Time: Play button on the stage, and the graph itself is scrubbable (drag along it; the scene follows the day).
- One shared affordance style for anything the student can change (same handle color, grip, focus ring, a small
  "drag" or "tap" hint the first time): this is the "translatable" part every tool reuses.
- Every on-picture control is a real input or button (keyboard and screen reader), with the same arrow-key behavior.
### The scene must show the concept, not decorate it
- Bloom: the surface water turns progressively green, an algae mat forms; die-off: algae turn brown and sink; the
  bottom fills with dead matter; decomposers (small dots) multiply; oxygen bubbles in the bottom water thin out; fish
  move up, gasp near the surface, then leave (no gore). Recovery as reaeration returns.
- The six chain steps are NAMED on a timeline (Runoff, Algae bloom, Algae die, Decomposers feed, Oxygen drops,
  Dead zone) and each lights as the day reaches it; tapping a step jumps to its day.
- The graph shares the day cursor; the 2 mg/L line and saturation line are labeled; algae curve on the same axis
  (or a small second axis) so the lag between bloom and oxygen crash is visible.
- Heat: same river picture upstream vs downstream with thermometers and an oxygen gauge each; trout icon needs about
  6 to 7 mg/L (check a source and cite it in "?") and stays or leaves.
- Sewage: the plant's tanks in order with what each removes drawn in it; the river and a lake below the outfall
  respond (green if N and P pass through).
### Predictions and challenges (write them, keep them honest to the model)
- Ch1 predict: "Heavy fertilizer runoff reaches the lake. Three weeks later, the fish..." (do better / about the same /
  leave or die). Challenges: "Find the most runoff the lake can take without a dead zone." "Same runoff, warmer
  lake: is the dead zone longer or shorter? Try 30 °C." "Which link in the chain actually uses up the oxygen?" (tap a
  timeline step).
- Ch2 predict: "The plant adds only heat, no chemicals. Downstream the water can hold... more / the same / less
  oxygen." Challenge: "Find the warmest outflow that keeps the river liveable for trout."
- Ch3 predict: "Which stage removes most of the nitrogen and phosphorus?" Challenges: "Stop after secondary. What
  happens in the lake below?" "Use the fewest stages that keep the lake below from blooming." The sewage to lake link
  must use the existing model honestly (map N and P left to a runoff level, documented in "?").
### Test yourself
Keep the existing drills (chain, dochange, thermal, sewage, load) and their grading. Their figures should reuse the
new scene where it helps. Finished card stays.
### Phone (390)
Chapter tabs, scene, timeline, graph stacked; controls still on the picture with 44 px targets; panel below with the
goal, predict and readout first. No horizontal scroll.

## Shared pieces to build (so the next tools reuse them)
Build these as reusable code (new shared file assets/course/tool-kit2.js and .css, documented in its header):
chapter tabs on the stage, the on-picture control affordance (drag handle, tap target, first-time hint), predict card,
live readout card, challenge card with completion state, named step timeline linked to a day cursor, scrubbable graph
cursor. Opt in per tool; nothing else on the site changes.

## Accuracy
All numbers from the existing model file (math/water-pollution.js, USGS saturation table, 2 mg/L hypoxia). Any new
number (trout oxygen need, mapping of N and P to runoff) needs a cited source in "?" and in this file. The tool must
still say it is a teaching model, not a forecast (in "?").

## Quality bar (checked by a separate reviewer before the owner sees it)
A first-time student, in 5 seconds, knows what to touch; in 2 minutes can say why fertilizer kills fish; nothing
overlaps or clips at 390, 768, 1440, light and dark; no console errors; every control works by keyboard.

## Build notes (2026-11-16, branch `claude/tools-v2-water-pollution`, not merged)
### What was built
- **Shared kit** `assets/course/tool-kit2.js` and `.css` (`window.LevlKit2`, API in the file header). Opt in per tool:
  `"kit2": true` on the tool's pages.json entry makes `build-apenv.mjs` load both after tool-studio.*; the tool calls
  `K.on(s)`. Every rule is scoped to `.tk2` (set by `K.on`) or to the kit's own classes, so no other page changes.
- **Water pollution Explore** (`environmental-science/assets/tools/water-pollution.js` and `.css`, rewritten; the
  model file, the data, the drills, their grading and the finished card are unchanged):
  - Stage: chapter tabs "1 Fertilizer runoff", "2 Hot water", "3 Sewage" (phone: "Fertilizer"); the hand drawn SVG
    scene with its controls on it; chapter 1 adds Play and the named six step timeline (Runoff, Algae bloom, Algae
    die, Decomposers feed, Oxygen drops, Dead zone; each lights at its day, a tap jumps there); the graph under it
    shares the cursor (drag anywhere on it, or arrow keys).
  - Ch1: field with fertilizer sacks (drag 0 to 5), rain cloud and a runoff stream that thickens with the sacks; the
    lake: two water layers, light rays dimmed by the bloom, nutrient specks, algae colonies that grow, die one by one,
    turn brown, sink and settle, a dead layer on the bed, decomposers (pink rods, more when warm), oxygen bubbles that
    thin out, a bottom water that darkens, swaying plants, five fish that spread out, crowd the surface and gasp, swim
    out below 2 mg/L and come back. A lake thermometer (drag 10 to 30 °C). One callout names the current link where
    it happens. The graph is revealed only as days pass (so Predict is honest).
  - Ch2: power plant (building, cooling tower and steam, intake upstream, outflow downstream), a warm plume that
    spreads along the surface, two monitoring stations (temperature, a bar for the most oxygen the water can hold, the
    trout line), trout that swim up out of warm water. Handle on the outflow pipe (+0 to +15 °C); dragging along the
    saturation graph sets it too. Upstream temperature (5 to 20 °C) is a setting under "?".
  - Ch3: town, raw sewage chamber and four tanks drawn with what each does (settling, aeration with bacteria, N and P
    removal, UV), tap a tank to stop there (skipped tanks grey, a dashed bypass with "skips the rest"), the outfall
    river into the lake below, which runs the ch1 model with the N and P left; its graph and picture share a cursor.
  - Side panel per chapter: Goal (s.task), Predict (3 choices; verdict names the link), Readout (2 or 3 numbers with
    Healthy / Stressed / Dead zone, Trout can breed / Too little for trout, Feeds algae / Mostly removed), Challenge
    (one at a time; progress kept per device). Challenges: ch1 most sacks without a dead zone (checked against the
    model at the lake's temperature), longer or shorter at 30 °C, which link uses the oxygen (tap the timeline; a
    wrong step gets its own reason); ch2 warmest outflow for trout, percent drop at +10 °C (choices computed from the
    model); ch3 what happens after secondary, fewest stages without a dead zone (tertiary).
  - "?" = "How it works": the model notes, the chain, sources, the day by day table, the saturation table, the sewage
    table, the setting, "Start this chapter's challenges again". It is a sheet over the stage on a desktop (kit).
  - `?ch=heat` or `?ch=sew` in the link opens that chapter (Share copies it).
  - Test yourself: unchanged drills; the saturation figure's last point label no longer clips.
- `scripts/tool-preview.mjs page.html out.html`: a one file, offline preview of any tool page (used for the owner's
  preview). The fixture copy of pages.json (`scripts/test/fixtures/apenv-data/pages.json`) follows the real one.

### Kit API (short; the header of tool-kit2.js is the reference)
`K.on(s)`; `K.tabs({ label, items: [{ value, label, short }], value, onChange })`; `K.layer(host)`;
`K.drag(layer, { key, label, min, max, step, value, valuetext, track: [x0, y0, x1, y1], onInput, tag, tagSide, chip })`;
`K.tap(layer, { key, label, box: [x, y, w, h], pressed, onClick, chip })`;
`K.predict({ q, choices, answer, then, onPick })` -> `note(html)`, `result(held, html)`;
`K.readout({ items: [{ k, label }] })` -> `items(list, title)`, `set(k, { value, unit, status, tone, sub })`, `say(text)`;
`K.challenges({ store, items: [{ id, text }], done: { text, action }, onShow })` -> `met(id, html)`, `body(x)`,
`current()`, `reset()`; `K.timeline({ label, steps: [{ name, tone }], onPick })` -> `set({ reached, current, sub, off })`,
`flash(i, tone)`; `K.scrub(host, { key, label, min, max, step, value, valuetext, onInput, onStart, rect })`;
`K.player({ min, max, speed, get, set, onEnd, labels })`; `K.reduced()`.
The "you can change this" look: white knob, course colour ring, an arrow along the way it moves; tap targets have a
dashed course colour outline and a hand badge; a soft pulse until first used (once per device, `tk2h:` keys), a
"Drag" or "Tap" chip on the first thing to touch only; the same 3 px focus ring. Each is a real range input or button.

### New numbers and their sources (also in "?")
- 5 mg/L, the Healthy / Stressed line: "Scientists generally agree that the Bay's critters need dissolved oxygen
  concentrations of 5 mg/L or more to thrive" (Chesapeake Bay Program, "Dissolved oxygen").
- 2 mg/L hypoxic: USGS Water Science School, "Dissolved oxygen and water" (citing CENR 2000); already in the model.
- 9.5 mg/L for young trout: EPA freshwater DO criteria, coldwater, early life stages, 7 day mean 9.5 mg/L (other
  life stages 6.5 mg/L, 30 day mean); EPA 1986 "Quality criteria for water", table in EPA "Factsheet on water
  quality parameters: dissolved oxygen" (EPA 841F21007B, July 2021). The brief suggested 6 to 7 mg/L for trout, but
  saturated fresh water holds at least 7.0 mg/L up to 35 °C, so that line could never be crossed; the early life
  stage value is the one heat alone can break (about 18 °C), and it is the honest reason trout need cold water.
- Sewage to lake: N and P left after the last stage (W.SEWAGE, EPA typical values) × 5 = the ch1 runoff level
  (raw 5, primary 4.25, secondary 3.5, tertiary and disinfection 0.75), lake at 20 °C. A teaching scaling, said so
  in "?".
- Sewage organic matter (review round): the BOD left (W.SEWAGE: raw 100%, primary 65%, secondary 15%, tertiary and
  disinfection 5%) enters the lake model on day 0 as dead organic matter, `W.BOD_D` = 30 relative units at 100%
  (`W.lake(level, T, bod)`). BOD is the oxygen bacteria use to break organic matter down (USGS, "Biological oxygen
  demand (BOD) and water"; EPA, "Indicators: dissolved oxygen"). 30 is a teaching scale chosen so the stages differ
  the way the textbook says: raw sewage drives a 20 °C lake below 2 mg/L by day 8 (39 days hypoxic), primary sags it
  to about 3.4 mg/L by day 8 (32 days), secondary barely dips it in the first days and the bloom chain does the rest
  (21 days), tertiary keeps it out of a dead zone (lowest 6.5 mg/L). Left out (every other caller, the drills),
  nothing changes. The unit test and the validator check the order and that `bod` 0 is the old model.
- Upstream river default 10 °C (a cold trout stream; was 15 °C in v1, still a setting 5 to 20 °C).

### Checks run
Browser (Playwright, Chromium): 390x844, 768x1024, 1440x900, light and dark; every chapter, before and after
predicting, mid play, scrubbing, every challenge met, wrong answers, "?" open, Test yourself; reduced motion; a
keyboard only pass (tabs, knobs, Play, timeline, graph cursor, predict, challenges); axe-core: no serious or
critical issues in any chapter at 390 and 1440, light and dark; no console errors. `node --test
scripts/test/apenv-*.test.mjs` (184 pass), `check-apenv-content --check` (tools 0 failing), `build-apenv --check`,
`check-site`, `check-weight --check` (no budget raised: tool pages are not in the weight list).

### Open points / not done
- Fish are drawn and animated by hand (no sprites); with reduced motion they hold still in place.
- The phone stage is tall (scene, timeline, graph), so the readout and challenge start below the graph; the goal
  sits above the tabs and Predict sits under Play until it is answered.
- The kit's hidden range inputs carry the keyboard; screen reader names come from `label` and `valuetext`. A real
  screen reader pass (VoiceOver, TalkBack) was not possible here.
- The upstream river setting and the challenge reset sit under "?"; nothing else is hidden.

## Review round (2026-11-16, `/home/claude/review-wp/REVIEW.md`, 38 issues, all addressed)
Scores before: clarity 7, teaches 6, interactivity 8, visual 7, phone 6, a11y 7. What changed (issue numbers):
- Pacing (1): Play runs about 1.15 days a second until the dead zone (or the low) and holds 2.4 s at each step's day
  (and just after day 0 for the runoff); a line under the scene names the step and gives its one line why, framed
  while held; then 6 days a second. A 1x/2x toggle. Reduced motion: each press goes to the next step.
- Challenges (2, 3, 4, 8, 15, 20, 21): nothing solves itself. "Find the most" (sacks, outflow) and "fewest stages" are
  committed checks: a Check button plays that run to day 60 (or reads that outflow), shows its worst day, and keeps
  a list of what was tried; met only when both sides of the boundary were checked, quoting the student's own runs.
  Ch1 challenge 2 sets 3 sacks, shows the thermometer, needs both runs (20 and 30 °C) seen to day 60, then asks WHY
  it is longer (3 choices; a wrong one is disabled with its reason): no 50/50 guess. Ch1 cannot finish without
  seeing dead zone runs (challenges 1 and 2 need them). Ch2's "% less" line hides while its percent challenge is open.
  Ch3 "after secondary" needs the lake below played to day 60 first. After a challenge is met only its success
  shows. Chapter done cards: a one sentence recap; ch1 adds "Explain it back: tap the six steps in order" (K.order).
- Panel at 1440x900 (3, 17): Predict folds to one line ("You predicted: leave or die. Held." + Why) once the next
  challenge opens or a check is made; readout cards one line labels and shorter; the dock was checked to have no
  overflow through every challenge (with and without a prediction). A skipped prediction settles as "No prediction
  this time" with the same teaching sentence.
- Phone (4, 22 to 27): the goal line sits above the tabs (the dock's copy is hidden below 1000 px); Predict sits under
  Play until answered and Play first nudges it; graph plot 186 px tall; timeline one row of six numbered steps (names
  stay as accessible names; the step line under it names the current one); hot water tag left of the handle, the
  handle stands on the outflow pipe's elbow, "Power plant" is a sign on the building; the lake chip says "Bottom
  water"; graph labels move clear of the line labels; sacks stand in a pile with the knob in the soil under them.
- Numbers (5, 12, 13, 14, 9): one rule (phase) drives the scene label, timeline and readout (dead zone only below
  2 mg/L; recovery after the low); oxygen written with two decimals between 1.95 and 2.05; algae everywhere as
  "× day 0" (readout, a right axis 0 to 120 on the graph, the "?" table), "a bloom" only near the peak; the graph
  is fixed at 0 to 12 mg/L with the last run drawn faint and named under it; the hot water verdict follows the
  handle; "Dead zone: N days, by day D".
- Sewage (5, 6): BOD as an oxygen demand (above), readout "BOD left"; chapter 3 has Play, the step line and the
  timeline ("Outfall" first) for the lake below, holding at each step like chapter 1.
- Visuals (7, 28 to 34): fertilizer bags with a stitched top and an N-P-K label; the surface turns green and a mat
  forms, thinning and browning as the bloom dies; algae turn brown before they sink (so "Algae die" shows brown);
  a key under the scene (algae, dead algae, decomposer bacteria, oxygen, nutrients) and a leader from "Decomposer
  bacteria use oxygen" to a bacterium; bigger oxygen bubbles with a shine, none in a dead zone; the "Bottom water"
  card has a leader to the bed; station gauges 16 px bars with a tall trout tick and "Can hold"; a moon (no sun) in
  dark mode; tank labels dark on white pills (12 px), readable when skipped; the lake thermometer is a control only
  from challenge 2 on (drawn, "Lake 20 °C", before that).
- Accuracy (8, 10, 11): "uses up most of the oxygen"; the bloom also respires at night (in the wrong step reason and
  "?"); trout: "Young trout need at least 9.5 mg/L. Above about 18 °C, the river cannot hold that much even when
  full" ("?"), the challenge hint does not give the answer away.
- "?" (35, 37): a real dialog (role dialog, aria-modal, focus to its title, Tab kept inside, Esc and focus return);
  the sheet is titled per chapter (How the lake / river / plant works) with no second title in the body; the
  sewage stages are a numbered list; the lake below's mapping is a bullet list.
- Test yourself (16, 33, 36, 38): the first try card keeps the wrong answer (env-tools.js, shared, a plain bug fix);
  number and unit boxes each have a visible label (env-tools, shared); specific hints for every choice step and the
  three bare "Round to 0.1" unit steps; figures redrawn in the Explore's style (the lake graph with its right algae
  axis, the saturation curve, the plant's tanks with BOD pills, a field with fertilizer bags and a stream).

### Checks run (review round)
Playwright (Chromium) at 390x844, 768x1024 and 1440x900, light and dark: every chapter before and after predicting,
Play before a prediction, full plays (timings logged: holds of about 2.4 to 3 s per step, about 34 s for 60 days),
every challenge done properly and attempted wrongly, a sweep that must not solve, "?" open (dialog, focus, Tab trap,
Esc), Test yourself (every drill type, the first try repro), keyboard only, reduced motion (Next step, To the end);
axe-core: no serious or critical issue in any chapter at 390 and 1440, light and dark; no console errors; no
horizontal scroll. `node --test scripts/test/apenv-*.test.mjs`, `check-apenv-content --check`, `build-apenv --check`,
`check-site`, `check-weight --check`.

## Second review round (2026-11-16, `/home/claude/review-wp2/REVIEW.md`: N1 to N12 and the partial 2, 7, 16, 17, 26, 33)
Scores before: clarity 8, teaches 8, interactivity 9, visual 8, phone 7, a11y 8.
- N1 (and 7): while the explain back is open the timeline's step names and the step line are hidden (dots only,
  `timeline.blank`), and the scene's step labels too; the task is "from memory", then a cause question that cannot be
  copied: "Why does the oxygen low come days after the bloom?" (3 choices, a reason for each wrong one).
- N2: on a phone the timeline shows short names under its dots (Runoff, Bloom, Algae die, Decomposers, O₂ drops, Dead
  zone; `steps[i].short`), and the "which link" challenge has six named buttons below 1000 px.
- N3 (and 2): one rule (`gate`) for every chapter's first action (Play, Check, dragging the graph, the outflow handle,
  a tank): the first time, with no prediction, it only says "Predict first: tap one" (Predict sits under the scene on
  a phone and tablet); the next try acts. A drag is one try until it is let go (or 0.7 s without input). The tank
  pills ("removes N and P") stay hidden until the sewage prediction is made. Chapter 1's Check also needs the chain
  watched once with Play (to the dead zone or day 21), so the chapter cannot end without Play.
- N4 (and 16): shared, all APES tools: a factor slip (×100, ÷100, ×1000, sign) is named only when its tolerance is at
  most a tenth of the answer (`env-tool-math.js` diagnose, `env-grade.js` numeric), so 7 against 0.2 mg/L now says
  "too high"; the first try card keeps the first wrong answer once (`env-tools.js`). Checked on Population growth too.
- N5: every multiple choice challenge (longer or shorter, why longer, which link, the order and its cause question,
  percent, after secondary): a wrong pick shows its reason and locks the choices until "Try again"; the first answer
  is kept (localStorage `wp2first:<chapter>`) and the chapter recap lists the first tries with ticks.
- N6: when the second warm run is in, focus moves to the new question. N9: that question is "At 30 °C, is the dead
  zone longer or shorter?" first, then "Why".
- N7: each held step during Play is announced once in the readout's live region ("Step 3, Algae die. ...").
- N8 (and 26): fish keep out of a box round the thermometer; a fish lies belly up on the bed once the lake has been a
  dead zone for a day; the dead zone label reads "Dead zone: fish leave or die".
- N10: the algae axis runs to 160 times day 0 (ticks to 120), so raw sewage's bloom (about 114) stays inside.
- N11 (and 17): a chapter link opens with the side panel at the top; the kit only keeps a card in view after the
  student acts. N12: "Check: no treatment"; tried rows use a cross (bad), a check (good) or a dot (neutral, the warm
  slots); "Already run at 20 °C" instead of a check button for a run already in; the percent drill's dead zone note
  sits under the axis; the nutrient load drill is a field with bags sloping to a stream in its channel; drill tanks
  are named under the tank like the scene (33).

## Third review round (2026-11-16, `/home/claude/review-wp2/REVIEW3.md`: R1 to R8 and the partial N8)
Scores before: clarity 8, teaches 9, interactivity 9, visual 8, phone 8, a11y 8. Rule kept for every tool: guide,
never frustrate (no two blocks in a row, every block says the exact next action).
- R1: until the chain has been watched, chapter 1's first Check button reads "Watch the chain first" (play icon) and
  pressing it plays the chain from day 0 (with reduced motion each press is the next step, never back to day 0); a
  line under it says it turns into Check at the dead zone. Play or a drag along the graph that reaches the dead zone
  (or day 21) counts as watched. The card intro: "Press Play once and watch the chain. Then change the sacks ...";
  the goal line says the same. Before a prediction it blocks once ("Predict first"), then acts.
- R2: the gate's nudge names the action just tried ("(Or press Play again to skip.)", "press Check", "press Watch the
  chain", "move along the graph", "move the outflow handle", "tap a tank"). Two option questions (longer or shorter)
  never lock: a wrong pick shows its reason, is crossed out, and the other answer stays tappable. Three or more
  choices still lock, and the reason ends "Read this, then press Try again."; a timeline tap while the link question
  is locked adds "Locked for a moment: read the hint above, then press Try again." (a status line; on a phone the
  same words also show under the timeline, since the card is far below).
- R3: only chapter 1's card touches the timeline's hidden names (other chapters' cards used to clear or keep the
  flag); `syncCh` shows names in every other chapter. The blank step number on dark: the blank disc rule outweighed
  the current step's background while the dark current step colour still applied (navy on navy); a dark blank rule
  keeps the number muted and readable (kit CSS).
- R4 (kit): `challenges.met` moves focus to the success line (tabindex -1) when focus was in the card or already
  lost; Tab then reaches Next challenge. A timeline tap keeps its focus.
- R5: in challenge 2 the faint line is the other one of the two 3 sack runs (20 or 30 °C) once that run is in, with
  the caption "Faint line: your run with 3 sacks at 20 °C, to compare"; no faint line before; cleared when met.
- R6: the two "why" questions have options of near equal length, the right one never the longest (56/59/55 and
  68/71/65 characters; authoring guide: similar lengths).
- R7 (shared, opt in): `env-tool-math.js` diagnose uses a cell's own `close` line when it has one, else the old
  rounding line, so no other tool changes (unit test checks both). Water pollution's two graph readings carry one:
  "Close. Read the lowest point of the blue curve to 0.1 mg/L." and "Close. Read the curve right above T °C, to
  0.1 mg/L." Other APES tools' drills were run in the browser: no errors.
- R8: on a phone, when Predict is off screen and the control has a line of its own (a Check button), the nudge is
  shown next to the button with a "Go to Predict" link (the page does not jump; focus stays); Play and the stage
  controls bring Predict, which sits just under them, into view gently. The nutrient load figure's label is
  "Water flowing in: N L/day" (the water is a creek, lake or reservoir by context, so the label names the flow).
- N8: the fish's swimming range ends short of the thermometer, and fish leaving drop into their own lanes below its
  bulb before swimming out at the right edge; nothing pushes them onto the bulb any more.

### Checks run (third round)
Playwright (Chromium) at 390x844, 768x1024 and 1440x900, light and dark: Check before predicting and before watching
(one block, then it plays), the graph scrub path, every challenge met by keyboard with the focus logged (success
line each time), the two option question, the locked timeline tap, chapter 3 after leaving the explain back open,
dark phone blank timeline, fish at 30 °C on days 6 to 30, the load figure, reduced motion; axe-core: no serious or
critical issue in any chapter at 390, 768 and 1440, light and dark; no horizontal scroll; no console errors; other
APES tools' Test yourself smoke run. `node --test scripts/test/apenv-*.test.mjs` (186 pass), `check-apenv-content
--check`, `build-apenv --check`, `check-site`, `check-weight --check`.
