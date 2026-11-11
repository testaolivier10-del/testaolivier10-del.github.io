# A&P redesign: pathway tracer and Predict the change (builder anp-redesign, 2026-11-10)

Brief: `docs/tool-review/BUILD.md`; review: `docs/tool-review/anatomy-physiology.md`; spec decision 94 in
`docs/anp-spec.md`. Shots: `/home/claude/shots/build/anatomy-physiology/{pathways,predict}_{before,after,after_p}.png`.

## The system (shared by both tools)

- `anatomy-physiology/data/scenes.json`: 64 scenes, each a registered OpenStax figure (CC BY 4.0, credit line
  under every plate) with named places in the figure's own pixels. Places were set by eye on a gridded copy of each
  figure and checked on rendered overlays. `hide` and `cover` blank printed stage words and numbers that would give an
  order away (AP stages, cardiac cycle phases, the zygote panels' numbers, numbered side texts).
- `data/pathway-scenes.json` (pathway: scene, one place or null per step) and `data/predict-scenes.json` (scenario:
  scene, place of the change, place per variable or null). `scripts/build-anp.mjs` publishes them on the items, with
  later-concept labels covered (decision 30). `pages.json` gained `extraScripts` / `extraCss` (the two pages load
  `assets/tools/scene.js` and `.css`). Test: `scripts/test/anp-scenes.test.mjs`.
- `scene.js` draws the plate: numbered pins (side by side when steps share a place), the route with arrowheads, a
  token that runs along it, a callout for the step in focus, open rings for places still waiting. White plate in dark
  mode; reduced motion puts the token at its end.

## Pathway tracer

- Bug fixed first: Missing step (and any tab switch) drew its map into the previous drill's slot, which was then
  removed, so the stage was empty. `clearDrill()` removes the old drill's parts before building.
- Every drill draws on the figure beside the step map (stacked on a phone, figure first): Put in order shows open
  rings at every stop, a placed step becomes a numbered pin where it happens and the route follows the student's
  order (a wrong order doubles back); Missing step shows a dashed "?" leg between its neighbours, never the true
  place; Spot the error now shows the steps as numbered pins (no labels, so the picture cannot give it away) and lights
  the one picked; after any answer Play runs the token along the route with a callout per step.
- Coverage, exactly: 106 of 208 pathways are drawn on a real figure (101 new scenes + the 5 existing figure traces,
  which now also serve their drills). 54 of them have every step placed; in the 101 new ones 660 of 748 steps have a
  place (the rest are events with no single place, such as "Signal switched off", and get no pin). The other 102 keep
  the icon map only: mostly molecular, method or time-course pathways with no fitting figure in the repo (coagulation,
  transfusion, meiosis, Punnett and karyotype methods, joint classification, hair cycle, remodeling, fluid shifts,
  several acid-base cell pathways). Next step for them: more figures (OpenStax has fitting ones not yet in the repo).

## Predict the change

- The situation is drawn: the scenario's figure with a purple "!" where the change happens and a numbered pin where
  each variable lives; the dials stay as the answer layer and carry the same numbers. A call puts an open badge on the
  pin; Run draws the chain on the figure, each arrow from the variable's cause (the change, or the variable whose chain
  is a prefix of its own), and the badge turns to the real direction with the pin green or red.
- Coverage: 207 of 377 scenarios have a scene (circulation 74, nephron 47, gut 21, glands 21, airway 18, skin 12,
  muscle fiber 10, AP trace 4), with 755 of their 1,052 variables placed. Placement is by rules on the variable names
  (in `/home/claude/scratch/anp-redesign/predict_assign.py`, not committed; the output is the data file), with the
  scene chosen as the one that places most variables (skin, fiber and AP trace only within their own chapters). A
  variable with no clear place has no pin and keeps its dial. The other 170 scenarios keep the dials only (special
  senses, CNS, joints, skeleton, development and the like have no fitting body figure yet).

## Accuracy check (A&P science)

- Pathway places: every one of the 101 scenes was rendered with its numbered pins and read against the step list; four
  figures read off the wrong scale were fixed (cardiac AP, cardiac cycle, cell cycle, knee level of the femur). Where a
  figure shows a related but different structure the place is named honestly (the dorsal column and spinothalamic
  routes ride the motor-pathway figure's levels: "Medulla", "Spinal cord, dorsal side"; the sweat-gland route ends at
  the figure's "Target effector"). Capillary exchange was kept off OpenStax 20.16, whose classic venous-end reabsorption
  contradicts the course's glycocalyx model; it uses the capillary bed with lymph capillaries (21.3). Lung development
  stops pins at the stages the figure shows (to 8 weeks); later stages have no pin.
- Predict places: a 45-scenario sample was read twice and the rules fixed (no "strength" or "lipolysis" to the wrong
  organ, blood values to blood places, norepinephrine not to the adrenal, ATP not to myosin, body-level muscle and
  spinal cases kept off the fiber figure). Risk that remains: rule-based placement can still put a variable on a
  reasonable but not ideal structure; the dial and its explanation are unchanged, so no answer or explanation changed.
- No question, answer, explanation, item id, scoring rule or deep link changed.

## Checks

`node scripts/build-anp.mjs --check`, `node scripts/check-anp-content.mjs --check` (0 failing),
`node --test scripts/test/anp-*.test.mjs` (all pass, new `anp-scenes.test.mjs`), `node scripts/check-site.mjs`,
`node scripts/check-weight.mjs` (A&P assets budget 56.4 -> 57.5 KB for scene.js and .css; measured 56.8).

## Not done

- 102 pathways and 170 scenarios still have no figure (above). The review's examples that need new drawings (enzyme
  changing shape, an axon with channels opening beside its trace, the FOOSH arm) are only partly met: the enzyme and AP
  pathways use OpenStax 2.27 and 12.24, the arm force route uses the skeleton (7.2); no new drawings were made.
- Predict "Show the chain" is still the text tree; the chain is now also drawn on the figure during Run.
- Licensing note: the BodyParts3D body renders (CC BY-SA) were not used, because spec section 2 allows only CC BY or
  public domain figures in A&P.
