# AP Environmental Science: cleanup round, pass 3 (2026-11-11, builder c4)

Judge file: `docs/tool-review/pass2/judge-b.md`. Lead's list: "env: climate change puts ozone loss and the
greenhouse effect on one picture with two sliders (two scenes)". Not mine (shared work): the first-run hint
placement and the pulsing halo.

Shots: `/home/claude/shots/pass3/environmental-science/<tool>_before_d.png`, `_after_d.png`, `_after_p.png`
(climate change also `_ozone_after_d.png` and `_p`).

| Tool | What the judge said | What I did | Now |
|---|---|---|---|
| Age structure | TOUCH UP: three pills plus growth; phone hint covers the caption, halo hides the slider label. | The "45% under 15" and "1% 65 and over" chips are gone from above the picture; each share is written under its own bracket on the pyramid (same rounding as before). Growth is the one pill. | PASS for the counts. Hint and halo are the shared builder's. |
| Air pollution | PASS. | Nothing. | PASS. |
| Calculation studio | TOUCH UP: hint and halo over the starting fraction. | Nothing: both are the shared hint and halo, fixed for every course by another builder. | PASS once the shared hint lands. |
| Climate change | TOUCH UP: ozone and greenhouse in one picture with two sliders. Lead: two scenes. | The scene chooser is Greenhouse, Ozone layer, Ocean pH, Sea level (two by two on desktop, one row on a phone). Greenhouse: the cross-section with CO2, visible light and infrared, the CO2 slider, one pill (Warming); the stratosphere is veiled and has no ozone, UV or chlorine. Ozone layer: ozone, chlorine and UV, the CFC slider, two pills (Ozone DU, UV-B); the troposphere is veiled and has no CO2 or infrared. One idea per caption ("This is not the greenhouse effect" on the ozone scene). Years go with Greenhouse and Ocean pH, the CFC history with Ozone layer. Test yourself still draws both layers (no focus). | PASS. |
| Cycles | TOUCH UP: 6 pools plus 11 process tags; 4 cycle chips plus 3 people chips. | Explore draws each process as a dot on its arrow (the nitrogen order keeps its numbers 1 to 5; a change switched on keeps its name); tapping a dot names the process and lights its arrow. "What people change" moved into Details, first, behind a Setup row ("People: Burn fossil fuels, Clear forests..." or "On: ..."); switching one on closes the sheet so the years run in view. | PASS (6 pool cards on the picture, 4 cycle chips plus the Setup row). |
| Dose and response | PASS. | Nothing. | PASS. |
| Earth and climate | PASS. | Nothing. | PASS. |
| Energy chain | TOUCH UP: 6 source chips plus 2 segments; the "30" at the outlet floats top right. | The six sources are one select ("Power source"). What reaches you is written at the band's end beside the outlet, with one decimal so it matches the To you pill (30.3, not 30); the phone layout uses the same figure. | PASS. |
| Energy flow | TOUCH UP: 3 view chips plus 3 ecosystem chips plus slider. | Ecosystem chips moved into Details (first, labelled), behind a Setup row "Ecosystem: Grassland"; picking one closes the sheet. | PASS (4 view chips, slider, Setup row). |
| Population growth | TOUCH UP: 2 sliders, Play, 3 segments, 3 model chips; phone hint covers the caption. | The model chips and the K slider moved into Details (first), behind a Setup row "Model: Logistic, K = 2,000"; picking a model closes the sheet. The cue says "Then open Model to try Exponential and Overshoot". Phone: a run in the millions writes "16.3 million" in the pill and the island inset, which were cut off. | PASS for the counts (r slider, Play, views, Setup row). Hint is the shared builder's. |
| Soil texture | TOUCH UP: triangle, sample and 4 bars at once; every class name lit. | Only the class the point is in is named on the triangle (colors still show the others; moving the point names them). The four property bars appear once the point has moved. I kept the magnified sample on the opening screen: it is the picture of the soil the triangle describes, and without it the right half of the stage is empty (the "simple must not mean empty" rule). The phone panel names the class beside the sample. | PASS. |
| Water pollution | PASS (optional: name each step). | Nothing (optional). | PASS. |

Accuracy: no fact, answer or scoring changed; every number drawn comes from the same model functions as before.

Checks: `build-apenv.mjs --check`, `check-apenv-content.mjs`, `check-apenv-map.mjs`, `node --test
scripts/test/apenv*` all clean.
