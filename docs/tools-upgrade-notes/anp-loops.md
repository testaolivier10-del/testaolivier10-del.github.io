# U-AnP-loops notes (Feedback loops, Predict the change)

## Feedback loops (flagship 6)
- **Job:** see a homeostatic loop work, part by part, and what breaks when a part fails.
- **Changed:** each loop opens on a "Watch it work" tab. The controlled variable (`live.variable`) sits on a gauge with
  its set point in the middle; only the side this loop answers is live (the other side links to the opposite loop when
  one exists, e.g. Body temperature falls / rises). Drag the marker, use arrow keys on it (slider role), or press the
  "Stimulus: ..." button: the ring lights stimulus → sensor → afferent → control → efferent → effector → response, with
  a caption per stage, then negative loops pull the variable back cycle by cycle and positive loops push it further
  until the loop's own ending (`live.end`). "Cut a part" breaks one part: the signal stops there and nothing corrects
  the variable; for the part the loop's failure question names (tagged "a case") the gauge follows `live.broken` and
  shows the case and its right answer's explanation. Parts the loop lacks ("None: same cells") explain that nothing
  separate can be cut. Fever has "Pyrogens raise the set point" (set point 36.6 → 39 °C, both from the loop text).
  The build/classify/predict steps are the "Test yourself" tab; ids, recording, events unchanged. `?mode=test` opens
  on it; "Build it again" and "Test yourself on all N" go there.
- **Data:** new `live` block per loop in `data/tools/feedback-loops.json` (variable, dir, broken, optional setPoint,
  end, shift), validated in `scripts/lib/anp-tool-checks/feedback-loops.mjs`, tested in
  `scripts/test/anp-loops-live.test.mjs` (a number on the gauge must already appear in the loop's own text).
- **Owner check:** the gauge is qualitative; motion speeds are illustrative, not physiological time.

## Predict the change (flagship 7)
- **Job:** predict how a perturbation ripples through the body, then watch the causal chain prove or correct it.
- **Changed:** each stage shows a "The body" dashboard: the perturbation and one dial per variable (short labels for
  common ones: HR, SV, CO, MAP, TPR, EDV, ESV, PaCO2...). Tapping a dial cycles its call (↑ ↓ =) and draws a dashed
  ghost needle; the radio rows below still work. "Run it" (was "Check predictions") plays the stage's chain steps one by
  one in a feed beside the dials (depth by depth, shared steps once); when a variable's last step appears its needle
  swings, its dial is marked ✓/✗, and its row's feedback opens. Grading, partial credit, ids, review, the per-variable
  chain and "Show the chain" are unchanged; recording happens at Run, as before. Reduced motion: end state at once.
- **Owner check:** dials have no numbers (the data has none).

## For accuracy review
- Each loop's `live.variable` and `live.dir` (which variable the loop controls and which way its stimulus moves it):
  read from the stimulus slot. Debatable labels: lung-inflation "Lung inflation", stretch-reflex "Calf muscle length",
  enterogastric "Chyme in the small intestine", rp-lh-surge "Estradiol", bt-wolff-law "Strain in the bone".
- `live.broken` per loop (what the gauge does when the failure question's part fails), read from that question's
  correct answer: uncorrected (drifts on), worse, partial (corrects part way), slower, corrected (other means keep it
  near normal: glucose-high-insulin, glucose-low-glucagon, calcium-high, bt-calcium-low), stalls (positive loop does
  not build), reset (baroreflex-rise, ur-pressure-natriuresis: the set point moves to the higher level), never
  (rp-lh-surge: the stimulus never forms), text (gastrin-acid, rp-testosterone-axis, bt-wolff-law: the gauge cannot
  show it, so it does not move and the text explains).
- Generic cut rule (any part other than the case): the signal stops there and the variable is not corrected; it
  drifts further while the stimulus lasts. That is a simplification (redundant pathways exist, e.g. calcium has three
  effector arms; cutting "Effector" removes all of them).
- Set point values shown only where the loop text has them: 37 °C (temperature-cold/hot), 88 / 80 mg/dL glucose,
  9 / 9.5 mg/dL calcium, 36.6 → 39 °C fever, duodenal pH 6 to 7, 287 mOsm/kg.
- Positive loops' endings (`live.end`) paraphrase each loop's classify text.
- Predict: the dashboard's order of steps is breadth-first through the data's chains, not a claimed timeline.

## Accuracy review
Independent review 2026-10-09 (spec decision 87). Sources: OpenStax Anatomy and Physiology 2e (1.5 Homeostasis;
17.5 and 26 for ADH/aldosterone/ANP; 18.3 EPO; 19.4/20.4 baroreflex; 22.5 breathing control; 24 thermoregulation;
25.6 autoregulation; 27.6 ovarian cycle; 6.7 calcium), checked against each loop's own scenario, slots and failure key.
- `live.variable` / `live.dir` for all 49 loops: each matches the stimulus slot and the loop kind. **Correct.** Five
  debatable labels (lung inflation, calf muscle length, chyme, estradiol, bone strain) kept as defensible: **logged**
  (needs-author loop-live-debatable-variables).
- Opposite-loop links (15 pairs, e.g. temperature, baroreflex, glucose, calcium): same variable, opposite side. **Correct.**
- `live.broken` vs each failure question's right answer: 47 correct. potassium-aldosterone ("rises more and stays up
  longer") and standing-pressure ("pressure stays low for longer", heart still speeds up) were `uncorrected` / `partial`
  (drift on, or never recover) but both answers describe slow, eventual correction. **Fixed:** both `slower`.
- Corrected cases (glucose-high-insulin, glucose-low-glucagon, calcium-high, bt-calcium-low): other means keep the
  variable near normal, as each answer says. **Correct.** Reset cases (baroreflex-rise, pressure natriuresis) move the
  set point to the higher level. **Correct.** rp-lh-surge `never`: pill suppresses follicle dominance. **Correct.**
- Generic "Cut a part" rule (drifts uncorrected) is a simplification. **Fixed** (on-screen "Simplified: other routes or
  loops may partly make up for a broken part") and **logged** (loop-generic-cut).
- Set point values: every number on a gauge appears in the loop's own text (37 °C, 88 and 80 mg/dL, 9 and 9.5 mg/dL,
  pH 6 to 7, 287 mOsm/kg). **Correct.** Fever 36.6 → 39 °C, PGE2 raising the hypothalamic set point, slower rise with
  only vasoconstriction when shivering is blocked: **correct**; 36.6 vs 37 elsewhere **logged** (fever-numbers).
- Positive-loop endings: childbirth / labor (delivery removes stretch), clotting (hole sealed; local by dilution,
  endothelium, antithrombin), micturition (bladder empty), LH surge (corpus luteum, estradiol falls). **Correct**;
  LH wording **logged** (loop-positive-endings).
- Predict dashboard: dial labels (HR, SV, CO, MAP, TPR, EDV, ESV, PaCO2, PaO2, RR, GFR, HCO3-, ADH, EPO) are the
  standard abbreviations. **Correct.** Step order was breadth-first (depth by depth across chains) and drawn with a
  "causes" arrow between every pair of lines; in 1,642 of 2,728 feed lines the line above was not the cause, so the feed
  implied false causes and a time order. **Fixed:** chains play cause first, one after another; a step that branches
  from an earlier line says "From ...:" instead of an arrow; the intro says the order is cause to effect, not a clock.
  **Logged** (predict-feed-order).
