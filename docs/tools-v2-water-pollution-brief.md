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
  in "?". With it, secondary gives a dead zone (lowest 0.2 mg/L) and tertiary does not (6.9 mg/L).
- Upstream river default 10 °C (a cold trout stream; was 15 °C in v1, still a setting 5 to 20 °C).

### Checks run
Browser (Playwright, Chromium): 390x844, 768x1024, 1440x900, light and dark; every chapter, before and after
predicting, mid play, scrubbing, every challenge met, wrong answers, "?" open, Test yourself; reduced motion; a
keyboard only pass (tabs, knobs, Play, timeline, graph cursor, predict, challenges); axe-core: no serious or
critical issues in any chapter at 390 and 1440, light and dark; no console errors. `node --test
scripts/test/apenv-*.test.mjs` (184 pass), `check-apenv-content --check` (tools 0 failing), `build-apenv --check`,
`check-site`, `check-weight --check` (no budget raised: tool pages are not in the weight list).

### Open points / not done
- The drills' figures were not redrawn with the new scene (they were already drawn from each problem's numbers); a
  later pass could put the station panel or the lake vignette into the thermal and chain figures.
- Fish are drawn and animated by hand (no sprites); with reduced motion they hold still in place.
- The phone stage is tall (scene, timeline, graph), so the panel starts below the graph: the first screen shows the
  tabs, the scene with its controls and Play, as the brief's phone order asks.
- The kit's hidden range inputs carry the keyboard; screen reader names come from `label` and `valuetext`. A real
  screen reader pass (VoiceOver, TalkBack) was not possible here.
- The upstream river setting and the challenge reset sit under "?"; nothing else is hidden.
