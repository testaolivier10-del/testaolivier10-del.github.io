# NREMT tool fixes: done (task nremt, 2026-11-10)

Branch `claude/tv-nremt`. Shots: `/home/claude/shots/build/nremt/`. Checks: `node --test scripts/test/nremt*` (71 pass),
`node scripts/check-site.mjs` clean, `node scripts/build-body-figures.mjs --check` up to date.

## Reference cards (FIX)
- Vitals: on a wide stage the age strip, figures, range bar and input scale up and sit in the middle; the three vitals
  are big buttons that show this row's range (HR, RR, lowest SBP for the age). The row line reads "SBP lowest acceptable
  about 76 to 82 (70 + 2 x age)" instead of "SBP > 76-82". The table (and the monitor test that reads it) is unchanged.
- Triangle: fills the stage; each side has its picture (face, chest with lungs, hand) with an abnormal look when marked
  (limp face, retractions, mottled hand); long side names wrap to two lines (no overlap with "normal").
- Verified at 1280, 390 and dark.

## Protocol flows (FIX)
- Read: end boxes are rounded rectangles (radius 24), so the stroke chart's long High and Normal text stays inside.
- Drill: bug fixed. A fork that hangs off a question inside the previous fork's arm (stroke: Low, then "Can the patient
  swallow safely?") now has that question as its parent; before, it showed "Check blood glucose" above "Swallows
  safely". The stage draws the path so far in the chart's shapes (up to four boxes, answer tabs at forks, the tab of an
  arm that rejoins when only some arms do), then the gap, centered on a desktop.
- Build, phone: compact empty slots and connectors. The bottom sheet with its feedback still takes about half the
  screen; a bigger change (collapsible feedback) was not made.

## Scenario simulator (FIX)
- Accuracy flag verified (crowning is the baby's head at the vaginal opening; contractions are the uterus) and fixed:
  see `docs/nremt-needs-author.md`. Tested in `scripts/test/nremt-cases.test.mjs`.
- Pins follow the call: the choices taken are drawn on the patient (tourniquet with tag, gauze, NRB mask, blow-by, BVM,
  hands on the chest, AED pads, collar, splint, blanket, cold packs, epinephrine pen, naloxone, glucose gel) plus a
  "care given" strip; a fixed problem changes its pin ("Spurting bleed" becomes "Controlled by tourniquet"; also
  breathing, pulse, airway cleared, waking). Rules in `care()` and `RESOLVE`, tested.
- Patients: toddler (1 to 5) and infant figures rendered from the same model (bigger head, shorter legs and arms) in a
  new data set `body-figs/case.js` loaded only by the simulator; the body map's own figures are byte-identical. A
  pregnant patient shows the uterus for the weeks with the baby head down, crowning when the case says so.
- Not done: a female figure (the model is male).

## Station run (FIX)
- All eight missing patients built (long bone, joint, supine and seated spinal, oxygen, AED, trauma and medical
  assessment) with one pattern, `station()` in `station-patient.js`: each tick shows on the body, critical misses are
  red marks at the end, order checks (head before torso, splint before stabilization, mask before the bag was filled,
  shock before clear). Notes say what varies by program. Tests: every page station finds a patient; a full ordered run
  leaves no marks; an empty run marks every critical step.
- Bleeding: the floor pool is a flat puddle under the thigh, not a round blob beside it.
- Phone: the patient and the step being ticked are both on screen at 390 x 844.
- Left for the owner: step lists checked against the sheets from memory, not the PDFs (needs-author).

## Body map (LEAVE): the review gap
Headless screenshots still hang after a tap (the compositor, with WebGL in software). Tested instead with SwiftShader
(`--use-angle=swiftshader`), real pointer events and the canvas read back inside an animation frame: a fresh tap on the
chest selects the sternum, the abdomen the small intestine, the thigh the skin, the jaw the mandible; each is
highlighted and the camera flies to it (captures `body-map_tap_*.png`). A tap after a selection is read in the zoomed
view, as intended. No bug found; nothing changed.

## For the lead
- `sw.js` not touched; it does not list `body-figs/`, so the new figure files need nothing there.
