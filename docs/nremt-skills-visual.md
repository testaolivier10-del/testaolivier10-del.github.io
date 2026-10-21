# NREMT skills station run on a patient: status

Branch `claude/nremt-skills-visual`. The station run (`nremt/skillsheets.html`, `nremt/assets/station-run.js`)
draws each ticked action on an illustrated patient for the stations that have a script in
`nremt/assets/station-patient.js`. Other stations keep the text-only run, unchanged.

## How it works
- The patient is the body map's own figure (`body-figs/adult-front.webp`, BodyParts3D, loaded via `body-figures.js`),
  seen from above as a supine patient. Equipment and hands are SVG over it, in that image's pixels (0.68 px/mm).
- A station script has `steps` (paraphrased from the Registry sheet, in its order), `focus` boxes for the camera,
  `build`/`update` (draw), `misses` (what stays visible at the end), `chips` and `notes` (program-dependent points).
- `station-run.js` swaps the card's phases for the script's steps, mounts the patient, tells it the current step and
  the tick order, and hands it to the result screen, where it pulls back and numbers the misses.
- Honesty rules unchanged: no points, no pass/fail, limits labeled and editable, notes say what varies.
- Tests: `scripts/test/nremt-station-patient.test.mjs` (tourniquet placement, breath timing, misses).

## Stations
| Station | Status |
|---|---|
| Bleeding control / shock (E213) | Done: BSI gloves (bare hands if skipped), gauze and pressure, tourniquet placed by tap or tick with placement rules, pool and pallor that grow while uncontrolled, distal limb pale once occluded, NRB, blanket, transport. |
| BVM, apneic adult (E203) | Done: shoulder tap, carotid check, head tilt/chin lift, vomit in the mouth, Yankauer, OPA, BVM with E-C grip, reservoir and O2, squeeze button timing rate and hold, chest rise, gastric distension. |
| Cardiac arrest / AED, trauma, medical, NRB, splinting, spinal | Not started. Same pattern; each needs its own art and accuracy check. AED and NRB are the natural next two (they reuse the chest and the mask). |

## Open questions for the owner
- Bleeding positioning: "supine" is shown; the sheet only says "properly positions". In the notes.
- Tourniquet placed "high and tight" is accepted as stopping the bleed, with a note that many sheets expect 2 to 3 inches.

## Review (independent opus pass, 2026-10-20), all fixed
BVM end view ignored skipped help/open/suction prep/recheck; rate tolerance mislabeled and a single fast gap counted as
critical (now judged on the average, 10 to 12 a minute with a stated tapping tolerance); hold time was called volume
(now a stand-in, examiner judges by chest rise); added the second manual opening before the OPA and the 30 second
suction-to-ventilation check; chin-lift fingers on the bony chin with tilt arrows; E-C grip drawn finger by finger; hand
shown on the carotid for the checks; wound and pool kept on the thigh, kneecap drawn; cue text below the stage, no longer
clipped; squeeze button below the stage so the chest stays visible; smoother edge when zoomed; "critical" wording
reconciled; BSI order judged against steps that touch the patient.
