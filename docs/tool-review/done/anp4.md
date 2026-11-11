# anp4: fixes for the second A&P accuracy check (2026-11-11)

Source: `docs/tool-review/done/anp-accuracy-check-2.md` (6 errors and the "misleading" list). Branch
`claude/tv4-anp`, not pushed. Checked against OpenStax Anatomy and Physiology 2e (figures 5.2, 9.13, 11.15, 11.23,
14.1; sections 5.3, 27.3). Browser checks at 1280x800 (and 390x844 where the layout changes), port 8892, scratch
`/home/claude/scratch/anp4/`. Shots: `/home/claude/shots/build/anatomy-physiology/anp4-*`.

## The 6 errors

1. **Skin scene (os-5-2), "Blood vessels of the skin".** Pin moved from (330, 690), on the hair root, to (476, 598),
   on the red dermal arteriole in the mid dermis (pixel colour checked: red). `data/scenes.json`; rebuilt
   `predict.json`. Verified in Predict ig-hot-day: pin 1 "Dermal blood flow" sits on the vessel. The same place is
   used by ig-cold-exposure and ig-sunburn.
2. **Middle ear (middle-ear-boost).** The stapes footplate is now drawn inside the oval window: a bone-coloured
   ellipse of the footplate's area with a thin blue rim (the window's edge), the two crura ending on it. It uses the
   eardrum's shape factor, so the two drawn areas keep the ratio eardrum : footplate (55 : 3.2 drawn as 55 : 3.2),
   which the line "areas drawn to scale" promises. Label "footplate in oval window 3.2 mm²". `calc-art.js` (F.ear).
3. and 4. **Lab practical view split.** `lab-fit.js`: `views()` now stores, for each view, the side extent of the
   ink in its band, and `viewOf()` widens the crop to it, so a view holds its whole drawing and caption, not only
   its label columns. Upper-limb muscles figure 2 (11.23) upper view now shows panel (b), where "Deltoid" points;
   body movements figure 2 (9.13) lower view shows the hand and "(l) Opposition".
   The same change fixes the five crops in the misleading list: latissimus dorsi's second leader (11.23), the
   lengthwise vein with its valves (20.7, middle view), the sarcomere's thick filament (10.5), the gap and adherens
   junction panels (4.5) and the blastocyst text (28.9). Trunk muscles (11.15): a caption printed just under a
   drawing now stays with it (when the chosen gap is followed within 6% of the height by another blank gap, the cut
   moves below the caption, if the label counts still allow). Only os-11-15 changes under that rule.
   Verified: all 20 split figures (and the dermatome map, one view) screenshotted view by view; every label in
   exactly one view (465), and no label points at a cut-off drawing. Phone (390 px) checked for 11.23, 9.13, 11.15.
5. and 6. **Graph reader region names.** `graphs.js`: a region's name slides off the cursor only if it still fits
   over its own region; otherwise it stays centred on the band. The pill check now runs after the slide, and a name
   under a pill steps up one or two lines. "normal blood pH" stays over 7.35 to 7.45 at every cursor position;
   "progesterone source shifts" stays over weeks 7 to 9 and steps above the 8% pill at week 3. Scripted sweep of all
   76 graphs at 25 cursor positions: no region name off its band, none under a pill, marked-point labels within
   30 px, pills on their dots.

## Misleading items fixed

- Feedback loops: between the pulses of a negative loop the effector stays on (`is-act`), so the arteriole stays
  narrowed and shivering continues until the variable is back; it turns off at the end as before. Sampled every
  0.3 s on temperature-cold.
- Feedback loops: "PTH up/down", "islet: insulin/glucagon" and "EPO" now appear when the signal reaches the
  effector, not with the stimulus (`loop-scenes.js`, class `fs-on` to `fs-acts`). Sampled on calcium-low-pth,
  glucose-low-glucagon, epo-oxygen-delivery.
- LH surge ending: new optional `live.after` text replaces "Estradiol falls back to where it started" with "The dip
  is short: the corpus luteum soon makes estradiol again, along with progesterone" (OpenStax 27.3). Other positive
  loops keep the old ending.
- Calculators: organ-flow prints "Flow after 0.72 L/min" (pictures with a before flow). The hide rule matches a unit
  only as a whole word, so "L" no longer matches "intracellular"; the only change across all 89 calculator pictures is
  fab-compartments, whose ICF row now shows in the card (the picture prints it without a unit). The Punnett carrier
  row carries `"keep": true` and always keeps its card.
- Graph reader: a curve's name under a value pill steps back (faint), like valve labels (enzyme-ph at pH 7.0:
  "stomach enzyme" under the pill). Reset when the cursor is off.

## Checks

`node scripts/build-anp.mjs --check` clean (447 files); check-anp-content 0 failing (tools 0 failing);
check-anp-map clean; `node --test scripts/test/anp*` 55 pass; check-site OK; check-weight all 620 within budget.
No file in `assets/course/*` or another course was touched.

## Not done

Nothing open from the report. The cursor line still crosses a narrow region's name (it no longer moves away);
the name stays readable.
