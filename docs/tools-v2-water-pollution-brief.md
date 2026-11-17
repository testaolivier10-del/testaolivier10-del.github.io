# Tools v2, flagship: APES Water pollution (brief, 2026-11-16; shipped 2026-11-17)

Shipped: see the last section. The rules that came out of it, for every tool: `docs/tools-v2-standard.md`.

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

## Owner round: play vs quiz (2026-11-16)
The owner on the first load (`wp-v2/shots/01-first-load-1440-light.png` of the third round): "there is just way too
much going on", "I thought these were interactive, why are we having it be a test in order to use it?", and after
the first cut "there is still too much going on". Review rounds kept adding; this round removes and moves. The
science, the model, the scene art and the drills are unchanged.

### The rule for every tool (agreed with the owner)
Two modes. **EXPLORE is for playing with it. TEST YOURSELF is where you get quizzed.**
- Explore: everything works the moment you land; nothing locked, nothing graded. No predict first, no watch first,
  no locked choices, no Check, no challenges, no predictions, no recaps, no explain back.
- Explore landing holds only: compact chapter tabs, the big scene with its on-picture controls, Play, a thin progress
  line under the scene that shows ONLY the current step's name (tap or drag it to move the day; faint unlabeled ticks
  at the steps), one caption of one sentence (at most about 15 words) on what is happening now, and a simple graph.
- Hard limits on the Explore landing: no side panel (the stage is full width; a phone stacks it), at most about 25
  words of text outside the picture, at most 3 controls outside the picture (tabs, Play, the progress line).
- Not in Explore: a color key (label things on the picture where they first appear, briefly), readout cards (one
  number at most, on the picture, with its status word), speed buttons (in the ⋯ menu), instruction bars, goal
  headings, a second graph axis (a second quantity is a faint shape with no scale), long labels on graph lines.
- A setting that is not the thing to touch first is quiet (a small plain handle on the picture, no pulse, no chip).
- Test yourself: the predictions (as questions that then show the run), the challenges, the recaps and first try
  counts, and the drills. One question at a time on the same scene, the hint ladder, "Show the answer" after one try,
  a finished card. Finding a limit is graded by committed checks on both sides of it.

### What changed
- Explore (`water-pollution.js`): the side panel, Predict, the readout cards, the challenges, the gate, the six step
  timeline, the step "why" bar, the color key, the speed button, the goal line, the faint last run and its caption
  and the graph's right axis are gone. The stage: tabs (compact, left), the scene, Play with `K.progress`, one caption
  (`CAP`, `REC_CAP`, `SEW_CAP`, `SEW_BOD_CAP`, the hot water line), the graph. Changing the sacks or the lake keeps the
  day (see the change at once). The graph: one axis (oxygen, 0 to 12 mg/L), the algae a faint shape scaled to its
  own peak, the whole run drawn (solid to the day, faint after), "Most it holds" faint and dashed, "2 mg/L: dead zone"
  on the shaded band; a drag along it still moves the day (pointer only, no knob: `K.scrub` knob false). The bottom
  water card on the lake carries the status word (Healthy, Stressed, Dead zone). The lake thermometer is a quiet
  handle (`K.drag` quiet) with its temperature written beside it. Speed is "Play twice as fast" in the ⋯ menu.
- Test yourself: one dropdown on the stage, "What to practice": Questions on the picture (1 Fertilizer runoff, 2 Hot
  water, 3 Sewage) and Practice problems (the drill's kinds). The questions use the Explore stage (tabs step aside)
  and the side panel shows one question: the task head holds the question, the card its choices or Check, the tries,
  the hint ladder (`s.hints`), then the answer and Next. Chapter 1 (7): the prediction (4 sacks; then the run plays),
  the most sacks (Check, both sides), longer or shorter at 30 °C (two checked runs, then choose), why longer, which
  link uses the oxygen (six named steps; a pick moves the lake to that step), the six steps in order from memory
  (nothing on the stage names them while it is open), why the low comes late. Chapter 2 (3): the prediction (then
  the outflow goes to +10 °C), the warmest outflow for young trout (Check, both sides), percent less at +10 °C.
  Chapter 3 (3): the prediction (tank labels hidden until answered; then tertiary is shown), after secondary (play
  the lake below, choose), fewest stages (Check, both sides). A wrong choice is crossed out with its reason and the
  others stay open; checks are not wrong answers; "Show the answer" opens after one try and counts as not first
  try. Each chapter ends with the finished card: the recap, "Right on the first try: n of m" and the list, Next
  chapter (or Practice problems), "Do these questions again". In a question the graph shows only the days already
  played, so it never gives the answer away. `?seed=` links open on the practice problems as before.
- Kit: `K.progress` (the thin line), `K.drag` quiet, `K.scrub` knob false; Explore has no dock (`.ls-dock` hidden, the
  stage spans the grid); `.tk2-qs` on the root while Test yourself uses the stage (on a phone or tablet the question
  comes first, then the picture, no scroll inside the stage). The header states the two mode rule.
- Shared, opt in: `ApEnvTools.drill(..., { pickerPre })` puts a tool's own entries first in the drill's dropdown and
  returns `{ picker, fresh }`; other tools are unchanged (Population growth, Air pollution, Dose response and Cycles
  smoke run in the browser).

### Landing counts (Playwright, Explore, each chapter; outside the picture)
Words: every word shown ("mg/L" is one word; numbers and tick labels are not counted). Controls outside the picture:
tab stops in the stage outside the scene (the three tabs are one tab stop). Blocks: what the stage shows besides the
scene.

| Landing | Words (≤ about 25) | Controls (≤ 3) | Blocks outside the picture |
| --- | --- | --- | --- |
| 1 Fertilizer runoff, 1440 and 768 | 22 | 3: tabs, Play, progress line | tabs, Play + progress line, caption, graph |
| 1 Fertilizer runoff, 390 | 21 | 3 | same |
| 2 Hot water, 1440 and 768 | 24 | 1: tabs (no time here; the handle is on the picture) | tabs, caption, graph |
| 2 Hot water, 390 | 23 | 1 | same |
| 3 Sewage, 1440 and 768 | 23 | 3 | tabs, Play + progress line, caption, graph |
| 3 Sewage, 390 | 22 | 3 | same |

The words, chapter 1: "Fertilizer runoff, Hot water, Sewage" (5; "Fertilizer, Hot water, Sewage" on a phone), "Play",
"Drag the sacks, then press Play." (6), and on the graph "Bottom oxygen (mg/L)", "Most it holds", "2 mg/L: dead
zone", "60 days". Chapter 2: the tabs, "Drag the handle on the pipe to warm the river.", "Oxygen water can hold
(mg/L)", "Young trout need 9.5", "Upstream 11.3", "35 °C". Chapter 3: the tabs, "Play", "Tap a tank, then press
Play.", "Lake below: oxygen (mg/L)" and the same line labels. The progress line is empty at day 0 (it names a step
once there is one). The shared frame bar above the stage (tool name, course, one line lede, Explore | Test yourself,
Ask the tutor, Share, ?, ⋯) is the same on every tool and not counted; at 390 it shows the name and the two modes.
Looked at as the owner would and removed after the first count: "Day 0" on the progress line, "below" on the 2 mg/L
label, "can" in "Most it can hold", "outflow" in the hot water line, "stop treatment there" in the sewage line, the
long graph titles.

### Checks run (this round)
Playwright (Chromium; `assets/premium.js` routed to `has() { return true; ...`) at 390x844, 768x1024 and 1440x900,
light and dark: each chapter's landing (counts above), mid play in chapters 1 and 3, Test yourself (the prediction
before and after, a check, the two warm runs, a wrong link with a hint, the order from memory, the chapter card, the
trout check, after secondary playing, a practice problem; every question of every chapter answered or revealed in a
scripted run); keyboard only (tabs, sacks, thermometer, Play, progress line; a question answered and Next by keys);
reduced motion (each Play press is the next step); axe-core: no serious or critical issue (Explore, every chapter,
and the first question) at 390 and 1440, light and dark; no console errors; no horizontal scroll. `node --test
scripts/test/apenv-*.test.mjs`, `check-apenv-content --check`, `build-apenv --check`, `check-site`, `check-weight
--check`. Preview: `node scripts/tool-preview.mjs` to `wp-v2/index.html`; shots in `wp-v2/shots/` (01 to 05 Explore,
06 to 15 Test yourself, each at 1440, 768 and 390, light and dark).

## Owner round 2: clarity and visuals (2026-11-17)
The owner on the play vs quiz version: "better but still having issues like understanding what each aspect is and how
to use them and what I'm supposed to do as the user and what I'm supposed to be understanding", and "visuals can be
better still". Explore stays free play (nothing locked or graded) and uncluttered; only what answers a real question
was added, in very few words.

### The rules for every tool (agreed with the owner)
1. **A purpose line.** One plain sentence at the top of each chapter's stage says what to understand ("See how
   fertilizer on a farm can kill the fish in a lake."). A small "Show me how" link sits beside it.
2. **Labels that say what and how.** Every control on the picture is named with how to use it ("Fertilizer: drag to
   add more", "Lake temperature: drag", "Hot water: drag", "Tap a tank to stop treatment there"); the kit's one off
   "Drag" / "Tap" chip is dropped where a label says it. The value a student watches is named in words ("Oxygen at the
   bottom") with the line that makes it meaningful ("Fish need about 5 or more"). Things in the picture get tiny names
   while they are there ("runoff", "algae", "dead algae sink", "bacteria use up oxygen"), on soft pills so they stay
   clean over the art. The graph's title is a plain sentence ("Oxygen at the bottom of the lake, day by day"). A step's
   name shows once (on the progress line); the picture names things, not steps.
3. **A skippable first-visit tour.** "Show me how": 3 short callouts in order, each pointing at the real control
   (drag this, press Play, watch this), Next / Skip, Esc closes. It never blocks (no overlay; doing the step moves it
   on), shows once per device per chapter (localStorage `tk2t:`, in try/catch), and re-opens from the link and from
   "?". Shared as `K.tour` in `assets/course/tool-kit2.js` (`.tk2-tour`, `.tk2-how` in its CSS).
4. **A takeaway at the end.** When a run reaches its end (the recovery after the low, or day 60), one sentence in place
   of the caption says what should have been understood, on a tinted line with a bulb. Explore only (in a question it
   would give answers away).

### What changed
- Purpose lines: ch1 "See how fertilizer on a farm can kill the fish in a lake.", ch2 "See why warm water from a
  power plant can push trout out.", ch3 "See which treatment step keeps sewage from harming the lake below."
- Takeaways (`TAKE`, chosen from the run so they are always true): ch1 dead zone "The fish left or died because
  bacteria breaking down the dead algae used up most of the oxygen."; no dead zone but below 5 mg/L "A smaller bloom:
  decomposers pulled the oxygen down, but not into a dead zone."; otherwise "This little fertilizer makes only a small
  bloom, so the fish stay healthy." Ch2, once the downstream water cannot hold 9.5 mg/L: "Heat alone made the river
  hold less oxygen, too little for young trout, so they moved away." Ch3 secondary: "Nitrogen and phosphorus left
  after secondary fed a bloom, and its decay used up most of the oxygen."; raw or primary: "Bacteria breaking down the
  leftover sewage and dead algae used up most of the lake's oxygen."; tertiary or disinfection: "Tertiary treatment
  removed most nitrogen and phosphorus, so the lake below stayed healthy."
- Tours: ch1 drag the sacks, press Play, watch the oxygen at the bottom (the card on the lake); ch2 drag the hot water
  handle, compare upstream and downstream, read the curve; ch3 tap a tank, press Play, watch the lake below.
- Labels and graph: as in rule 2. The faint "Most it holds" line left the chapter 1 and 3 graphs (word budget; the
  starting value already shows it); "Young trout need 9.5 mg/L" carries its unit. The step callouts on the picture
  were replaced by the names of things; "Dead zone: fish leave or die" stays (it is a state you can see).
- Visuals: sky with soft clouds, a pale far ridge, haze and a tree line on the far shore; the field in cross section
  with a dark topsoil band, wavy soil layers, stones that grow with depth, roots, tilled furrows and two crop rows;
  bigger fertilizer bags (shaded, gathered top, ground shadow, green band over the N-P-K label; a pile when the field
  is narrow); during rain water runs across the field and down the slope as a muddy stream with flowing streaks and
  fertilizer specks, fanning into a brown plume under the surface; light rays that fade with depth; a wavy surface
  line with glints; a lake bed in bands that follow the basin with sand specks; reeds at the shore; the bloom as a
  floating mat that spreads from the inflow, thickens with strands hanging under it, then thins and browns; algae
  brown and sink (they settle away from the slope); a dead layer with a flaky top; fish turn cleanly, pitch with their
  bob and beat their tails with their speed. Ch2: power line on pylons, a banded chimney stack, a lined turbine hall
  with a door, a shaded cooling tower, grass tufts, a lit band near the river's surface and a grassy bank edge.
  Ch3: houses in a few colours with chimneys and trees, a paved yard under the tanks, concrete rims, and the lake
  below cut into the earth. Everything uses the theme tokens and the tool's role colours, light and dark.
- Kit: `K.tour`; `K.tap` honours `chip: false` (as `K.drag` did).

### Landing counts (Playwright, Explore, each chapter; outside the picture; the frame bar is not counted)
Words: every word shown, numbers and tick labels not counted ("mg/L" is one word). Controls: tab stops outside the
picture (the three tabs are one stop).

| Landing | Words (about 35 or fewer) | Controls |
| --- | --- | --- |
| 1 Fertilizer runoff (1440, 768) | 36 | 3 (tabs, Play, progress line) and the Show me how link |
| 1 Fertilizer runoff (390) | 35 | same |
| 2 Hot water (1440, 768) | 34 | 1 (tabs) and the link |
| 2 Hot water (390) | 33 | same |
| 3 Sewage (1440, 768) | 35 | 3 and the link |
| 3 Sewage (390) | 34 | same |

Chapter 1's words: the tabs (5), the purpose line (13), "Show me how", "Play", the graph title (9), "mg/L: dead zone",
"days". The owner's own purpose line and graph title are 22 of them; the landing caption is empty (the labels and the
tour say what to do), so nothing else was cut.

### Checks run (this round)
Playwright (Chromium; `assets/premium.js` routed to `has(course) { return true; ...` on a local `http.server`) at
390x844, 768x1024 and 1440x900, light and dark: each chapter's landing with its tour (each step), the tour gone after
reload, re-opened from "?", mid play (days 2, 5, 7, 11, 15, 22), the end with its takeaway, chapter 2 at +10 °C,
chapter 3 stopped after secondary (day 12 and day 50), Test yourself (first question and answer), keyboard (tabs, the
link, the sacks by arrow keys, Play), reduced motion; no horizontal scroll; no console errors from the tool (only the
blocked outside requests of the page itself). `node --test scripts/test/apenv-*.test.mjs` (186 pass),
`check-apenv-content --check`, `build-apenv --check`, `check-site`, `check-weight --check`. Preview: `wp-v2/index.html`;
shots in `wp-v2/shots/` (01 to 17 Explore, 20 to 21 Test yourself, at 1440, 768 and 390, light and dark).

## Owner round 3: instant response (research) (2026-11-17)
The owner approved these changes ("build it"). They come from the PhET interview studies (students grab the picture
first and rarely find Play; they read only 1 to 3 word labels attached to a control and miss small grey tabs; they
learn by changing a thing and seeing the result, not by watching; one "wiggle me" cue works better than a tour; color
beats labels; every visual detail is read as meaningful; extremes should respond), Red Blob Games (a slider the
learner controls beats a played animation; compare) and Bret Victor (immediate response; compare). Explore stays free
play with no side panel; Test yourself is unchanged (it keeps the played run).

### The rules for every tool
1. **Instant response.** Changing a control changes the picture and the graph that instant, with no Play. While a
   control is dragged, and after it is let go until the time bar is touched, the picture shows that run's result (here
   its worst day) and the graph the whole curve. Time is a bar to drag, big enough to grab, with the current step's
   name; Play is a small secondary button beside it ("Watch it happen"). Runs are cached, so a drag never recomputes.
2. **Compare.** The setting before the change stays as a faint line with a tiny label ("before: 2 sacks"), and the
   value card says "was 6.3" while the value differs. Cleared on a chapter change.
3. **A cause line.** Under the picture, the chain for this setting in a few words with arrows, live as you drag, from
   the real model numbers. It replaces the caption in the instant view; a step's caption shows only while the time
   bar is dragged or the run plays; the end takeaway stays.
4. **Labels of 1 to 3 words, attached to the control**, on a pill in the idea's color. No "drag to..." text: the
   handle look and the cue carry it. The purpose line is about 8 words.
5. **One cue, not a tour.** A first visit shows one still message at the first control that names it ("Drag the
   fertilizer"). It leaves at the first interaction on the stage, once per chapter per device (`K.cue`, localStorage
   `tk2c:`). "Show me how" (the three pointers) opens only from its link and from "?".
6. **Tabs big, filled and colored**: the first thing to notice after the picture; compact on a phone (`K.tabs` big).
7. **One color per idea, everywhere** (scene, card, graph, labels, cause line). Here: oxygen blue, algae green, dead
   matter and bacteria brown, fertilizer and nutrients amber, heat vermillion, red for the dead zone only. Status
   words and "too little for trout" are plain ink.
8. **No decoration a student could misread.** The background is a calm location cue only.
9. **Extremes respond.** The largest setting must look like a disaster, the smallest clean and calm.
10. **One optional, ungraded teaser per chapter**, one small line beside the cause line, reachable in the model, with
    a quiet check mark when met. No lock, no score, a cross hides it; the next follows at the next change; at most 3.
Limits on an Explore landing: no side panel; about 30 words outside the picture (see the count below); controls
outside the picture: tabs, time bar, Play, Show me how (and the teaser's cross).

### What changed
- **Instant view** (`water-pollution.js`: `instOn`, `pin`, `run.worst`): Explore opens in it (1 sack, a calm lake).
  Dragging the sacks or the lake thermometer, or tapping a tank, shows that run's worst day at once: the lowest
  oxygen (on a floor of 0 mg/L, three days into the dead zone, where it is just as low, so the dead fish show). The
  runoff stream keeps running in this view, so what the sacks do stays in the picture. Touching the time bar, the
  graph or Watch it happen switches to the time view (rain, bloom, die off, day by day); the next change of a control
  returns to the instant view. `lakeRun` and `sewRun` cache every run (a sweep of 6 settings is 5 model runs, then 0).
- **Time bar** (`K.progress` big): a 12 px bar with a 30 px thumb, "Day 16: lowest oxygen" or "Day 6: Algae bloom"
  above it. **Watch it happen** (`K.player`, class `is-sm`, `labels()`): small and outlined, right of the bar (above
  its right end on a phone); it plays from day 0. Test yourself still shows "Play".
- **Compare**: `prev` (the setting when the change began; a drag is one change, a key press is one change). The graph
  draws its curve faint and dashed with "before: 1 sack", "before: 20 °C", "before: secondary" or (chapter 2) a faint
  ring with "before: +10 °C"; the oxygen card and the downstream station add "was 6.3".
- **Cause line** (`cause`, `causeHtml`, `causeText`): chapter 1 "4 sacks → big bloom → dead algae rot → oxygen 0.0 →
  dead zone 21 days" (with "+ 30 °C lake" when the lake is not at 20 °C; "fish stressed" or "fish healthy" with no
  dead zone); chapter 2 "+10 °C → river holds 9.1 mg/L → too little for trout"; chapter 3 "Stops after secondary →
  nutrients left → big bloom → dead algae rot → oxygen 0.0 → dead zone 21 days", "No treatment → sewage rots → ...",
  "All 4 tanks → nutrients removed → small bloom → oxygen 6.5 → fish healthy". Bloom words by the peak: none, small,
  bloom, big, huge. The live region says it once when a drag ends (not at every step of the drag).
- **Labels**: "Fertilizer", "Lake temperature" (its value under it), "Hot water", the tank names; the card is
  "Oxygen", value, status word, "fish need 5+", "was ...". "Tap a tank to stop treatment there" is gone.
- **Purpose lines**: "How farm fertilizer kills a lake's fish", "How heat alone drives trout from a river", "Which
  sewage treatment step saves the lake below".
- **Cue** (`K.cue`): "Drag the fertilizer", "Drag the hot water", "Tap a tank". The tour no longer opens by itself.
- **Tabs** (`K.tabs` big): filled course color when selected, a 2.5 px colored outline otherwise, 50 px (46 on a phone).
- **Color audit**: oxygen bubbles are blue (bigger, fewer as oxygen falls, none in a dead zone) and so are the
  aeration bubbles in the secondary tank; bacteria are brown (were pink); the runoff is blue water carrying amber
  fertilizer (was muddy brown); the sack's green band is amber; status words are ink (Healthy was green, Stressed
  amber); chapter 2's low oxygen bar, value and "too little" are blue and ink (were red), the trout line ink (was
  olive), the bypass pipe brown (was red brown); windows are grey (were amber); the stack's bands grey (were red).
  The graph: the part of the curve below 2 mg/L and a bar along its days are red.
- **Removed or quieted**: the sun, its glare, the moon and stars, light rays in the water, surface glints, steam from
  the cooling tower (white puffs read as pollution), fainter clouds, flow ripples and roots.
- **Extremes**: 5 sacks at 30 °C: a thick browning mat, a dead layer up to 26 px, three dead fish on the bed, dark
  water, no bubbles, 28 days in red on the graph. 0 sacks: no stream, no algae, 20 bubbles, fish spread out. +15 °C:
  the plume, "trout left" in the empty water downstream. Raw sewage: the lake below is a dead zone for 39 days.
- **Teasers** (`TZ`; progress in localStorage `wp2tz:<chapter>`), each checked against the model:
  chapter 1 "Can you keep the fish alive with 4 sacks?" (no dead zone at 14 °C or cooler), "Can just 2 sacks make a
  dead zone?" (from 25 °C up), "Make a dead zone that lasts 4 weeks." (5 sacks from 21 °C up); chapter 2 "Find the
  warmest outflow the trout can take." (+8 °C with the river at 10 °C; skipped when the upstream setting makes it
  impossible), "Make the river hold a fifth less oxygen." (+11 °C or more); chapter 3 "Find the fewest tanks that keep
  the fish alive." (tertiary), "Make a dead zone in the first 10 days." (raw or primary).
- **Fixed on the way**: the graph was letterboxed when its box was under 200 px tall (desktop), so the day cursor sat
  about 15 px left of the curve's dot; the knob at 0 sacks was cut by the picture's edge; the time bar's step ticks
  did not follow a new run; the chapter 3 lake is wider.
- Kit (`assets/course/tool-kit2.js`, `.css`): `K.cue`; `K.tabs` big; `K.progress` big; `K.player` `labels()` and
  the `is-sm` look. All opt in; no other tool uses the kit yet.

### Landing counts (Playwright, Explore, each chapter; outside the picture; the frame bar is not counted)
| Landing | Words | Tab stops outside the picture |
| --- | --- | --- |
| 1 Fertilizer runoff (1440, 768) | 43 | 5: tabs, Show me how, time bar, Watch it happen, the teaser's cross |
| 1 Fertilizer runoff (390) | 42 | same |
| 2 Hot water (1440, 768) | 40 | 3: tabs, Show me how, the teaser's cross |
| 2 Hot water (390) | 39 | same |
| 3 Sewage (1440, 768) | 45 | 5 |
| 3 Sewage (390) | 44 | same |

**Over the limit of about 30, and why.** Chapter 1's words: the tabs (5), the purpose line (7), "Show me how" (3),
"Day: lowest oxygen" (3), "Watch it happen" (3), the cause line (9), the teaser (8), and on the graph "Oxygen (mg/L)",
"dead zone", "days" (5). The pieces the owner asked for by name (tabs, purpose, cause line, teaser, Show me how,
Watch it happen) are 35 of them. To get near 30 the owner would have to drop one: the teaser (8) is the easiest.

### Checks run (this round)
Playwright (Chromium; `assets/premium.js` routed to `has(course) { return true; ...`, service workers blocked, a local
`http.server`) at 390x844, 768x1024 and 1440x900, light and dark, 110 screenshots, every assertion passing: each
chapter's landing with its cue; the scene and the graph change while the sacks or the hot water handle are held mid
drag and at once on a tank tap; the cause line, the faint "before" line and "was" during the drag; the live region
says the cause line when the drag ends; 5 sacks at 30 °C (red bar, 3 dead fish, no bubbles) and 0 sacks (no red, 12 or
more bubbles); every teaser met and the next one shown, the cross hides them; the time bar by mouse and by arrow
keys (step captions); Watch it happen from day 0, the takeaway at day 60; a sack change by keyboard (valuetext, live
region); Show me how on request, Esc; after a reload no cue and no tour; chapter 2 at +10 and +15 °C; chapter 3
secondary, raw (day 4 by the time bar) and tertiary; Test yourself (first question, answer, the run plays, "Play"),
back to Explore in the instant view; reduced motion (the instant view, then each press is the next step); no
horizontal scroll; no console errors. axe-core on the stage: no serious or critical issue (3 chapters, 390 and 1440,
light and dark). Drag cost: a scene write is about 2.5 ms (worst 19 ms), a graph write 0.3 ms; frames while dragging
ran at about 20 ms against 17 ms idle in headless Chromium. `node --test scripts/test/apenv-*.test.mjs` (186 pass),
`check-apenv-content --check`, `build-apenv --check`, `check-site`, `check-weight --check`. Preview:
`wp-v2/index.html`; shots in `wp-v2/shots/` (01 to 09 chapter 1, 10 to 12 chapter 2, 13 to 17 chapter 3, 20 to 21 Test
yourself).

### Open points
- The word count (above). The instant view shows the worst day, when the bloom has mostly died back: the green
  bloom itself is seen on the graph's green shape and by dragging the time bar, not in the instant picture.
- Tab color is the course color (dark olive in light mode); a brighter accent would need a new token.
- A real screen reader pass (VoiceOver, TalkBack) and a real phone were not possible here.

## Owner round 4: controls never move each other (2026-11-17)
Owner: "Some of the sliders adjust other sliders?" In round 3 a change of fertilizer, lake temperature or tank made
the time bar jump to that run's worst day. A control that moves by itself is confusing. This replaces that part of
round 3 rule 1 ("the picture shows that run's result (here its worst day)") and the round 3 open point about it.

### The rule for every tool
**One control never moves another.** A handle moves only when the student moves it (or presses a button whose
job is to play it). A value that depends on another control is shown as a **mark** (a notch, a dot, a small label),
never by moving a handle. The mark may be a button that takes the handle there when tapped.

### What changed here
- **The day stays put.** Only the time bar, a drag on the graph, the "lowest" mark's button and Watch it happen move
  the day (`setDay`, `setSday`). `pin()` and `run.worst` are gone; `instView()` only switches to the cause line and
  the whole curve. After a scrub, a pause or the end of a run, the next change of setting keeps the day and shows the
  whole curve with the faint "before" curve.
- **Explore opens partway through** (`DAY0`): chapter 1 on day 17 (the default run's lowest oxygen; at 20 °C every
  sack count is at or near its low there), chapter 3 on day 16 (the low with all 4 tanks, inside the dead zone when
  treatment stops earlier). Each chapter keeps its own day; coming back from Test yourself resets both.
- **The lake shows the new setting on the handle's day**, redrawn while dragging (runs are cached as before).
- **The "lowest" mark** (`K.progress` `low(v, ariaLabel)`, `lowLabel`, `onLow`; `lowDay(run)` = `run.minDay`): a blue
  notch on the bar and a small triangle with "lowest" under it, at the thumb's true position for that day; a ring on
  the graph's curve at the same day. It shifts as the setting changes. It is a real button ("Go to the lowest oxygen
  day, day N"); a tap moves the handle there. No mark at 0 sacks (nothing to find), in chapter 2 or in Test yourself.
- **Name line**: the handle's day and step ("Day 17: Oxygen drops"); "Day 16: lowest oxygen" only on that day.
- **Oxygen card**: the oxygen on the handle's day (it matches the picture). In the instant view a small blue line
  "lowest: 0.0 on day 9", and "was 6.3" still compares the lowest values. The cause line still describes the whole run.
- **Watch it happen**: from day 0 after a change of setting (from the handle's day after a scrub or a pause, as
  before); the handle stays where it stops. Chapter 2 and Test yourself are unchanged.
- One more tab stop outside the picture in chapters 1 and 3 (the mark's button), and one more word ("lowest").

### Checks run (this round)
Playwright (Chromium, same setup) at 390x844, 768x1024 and 1440x900, light and dark, 319 assertions passing: the time
input's value does not change while the sacks or the thermometer are dragged by mouse (checked mid drag), by keyboard,
or when a tank is tapped or pressed with Enter; the mark and the graph's ring move and the graph's cursor does not;
the scene and the card change mid drag; scrub (keys, mouse, graph drag) then a change keeps the day and draws the
whole curve; the mark's button moves the handle onto the mark (within 2 px); Watch it happen from day 0, pause keeps
the day, the end stays on day 60, a change after either keeps the day; chapter 2 has no bar; Test yourself (no mark,
first question, the run plays); back to Explore on day 17; no horizontal scroll; no console errors; axe-core on the
stage, no serious or critical issue. `node --test scripts/test/apenv-*.test.mjs` (186 pass), `check-apenv-content
--check`, `build-apenv --check`, `check-site`, `check-weight --check`. Shots: all of 01 to 09, 11, 13 to 17, 20, 21
redone; new 02 "middrag", 22 (handle on the mark) and 23 (day 6, then 3 sacks).

### Open points
- With the handle far from the low (say day 60) the lake can look healthy while the cause line says "dead zone 21
  days". The card's "lowest" line and the mark carry it; the owner may want the picture to hint at it too.
- The instant view still keeps the runoff stream running on any day (round 3), so it also runs on day 40.

## Shipped (2026-11-17)
Owner after round 4: "I think that's good", "it's the standard", "go ahead" (finishing touches, make it live, then
roll the standard to other tools). The standard is `docs/tools-v2-standard.md` (11 rules and the process). This
closes both open points of round 4.

### Finishing touches (Explore)
- **Oxygen card, three lines**: "Oxygen", the value with its status word for the handle's day, and in the instant
  view "lowest: X on day N". "fish need 5+" is off the card in Explore (the fact stays in "?", Sources; Test yourself
  keeps the line) and "was ..." is gone (the faint "before" curve compares). Both lake cards (chapters 1 and 3).
- **Far from the low** (`barName`, `cardStatus`, `causePre`): the cause line starts with a tiny grey "Over 60 days:"
  (chapters 1 and 3; the live region says it too), so it reads as the whole run. The name line says "Day 0: Before
  the bloom" on day 0 when a bloom is coming, and "Recovered" (was "Recovery") once the lake is back to 5 mg/L or
  more after the low; on those days the card's status word is "Recovered" instead of "Healthy" when the run had a
  dead zone. Between 2 and 5 mg/L after the low it still says "Recovery" with "Stressed". Checked on days 0, 3, 8,
  12, 17, 25, 30, 40 and 60.
- **The "lowest" mark** lands on the run's lowest day: the name line says "lowest oxygen", the card "Dead zone" and
  the scene shows the "Dead zone" label (dead fish may come a few days later; nothing contradicts).
- **Watch it happen always starts from day 0** in Explore, also after a scrub or a pause (with reduced motion each
  press is still the next step). Test yourself is unchanged.
- **The runoff stream runs only on the days the model has runoff** (about days 0 to 7), in every view; so do the
  granules on the field. Not on day 40.
- Also fixed: at tablet widths the long words under the sewage tanks overlapped; the short words are used whenever
  the longest would not fit.
- Left as it is: chapter 2's downstream card still says "was 11.3" beside the faint "before" ring (the owner's note
  was about the oxygen card); on a phone the cause line can take three rows with the new label.

### Checks run
Rebased on `origin/main` (no conflicts). `node --test scripts/test/apenv-*.test.mjs` (186 pass), `check-apenv-content
--check`, `build-apenv --check`, `check-site`, `check-weight --check`, `build-apmacro --check`, `build-apcalc --check`.
Playwright (Chromium, service workers blocked, local server) at 390x844, 768x1024 and 1440x900, light and dark: the
three Explore chapters (landing cue, drag, 5 sacks at 30 °C, day 60, 0 sacks, a tank by keyboard), keyboard on the
sacks, the time bar, the mark and Watch it happen, Show me how and Esc, "?", Test yourself (the three question sets
and the five drills), back to Explore, no sideways scroll, no console errors. The Premium lock screen (the real
`premium.js`, not unlocked) has the same text and look as on `main` at every size and theme. Air pollution, Dose
and response, Population growth and (not APES) the Microeconomics cost lab load and work at 390 and 1440 and do not
load the kit.

