# NREMT weight after the tool fixes: done (task nremt-weight, 2026-11-10)

Branch `claude/tv-nremt-weight`. `node scripts/check-weight.mjs --check` passed; no budget raised.

## What was over
- NREMT shell 34.4 KB against 28. The shell is the largest NREMT bucket of any weighed page, which is
  scenario-sim.html. The NREMT fixes grew `scenario-monitor.js` by about 6 KB gzipped: care rules, the pins that change,
  the birth words, the pregnancy routing and the drawn gear. The other tool scripts that grew (station-patient.js,
  ref-cards.js, flow-drill.js, vitals-check.js, the studio CSS) already load only on their own pages.
- scenario-sim.html 57.9 KB against 57.2: about 0.7 KB of that was the gear styles (`.pt-gear`, `.pt-care`, `.pt-tq`...).

## What changed
- New `nremt/assets/scenario-care.js`: CARE_ON/OFF, `care()`, RESOLVE, `resolutions()`, `settle()` (the words a fixed
  problem gets), BIRTH, UTERUS, `pregnancy()`, `keep()` (where a pregnant patient's sentence goes), BIRTH_WORDS,
  `birthWords()`, `pins()` (tourniquet, Uterus, the birth pin), the gear drawing (`paintGear`, `limbSite`, `padAt`), the
  care strip and the gear styles (injected once). Same code as before, moved.
- `scenario-monitor.js` fetches it with the first patient (`loadCare`, next to the figure data fetch) and calls it
  through `NremtSim.care` when it is there; until then the body shows the case's findings only. Exposes
  `NremtSim.util` (svgEl, esc) for it.
- `scenario-sim.html`: the gear CSS left the page; the page passes `open` and the Patient works out the pregnancy.
- `scripts/test/nremt-cases.test.mjs` loads scenario-care.js after the monitor.
- Measured: NREMT shell 28.0 KB (main 27.2), scenario-sim.html 57.2 KB (main 57.1).

## Verified
- Tests: `node --test scripts/test/nremt*` 71 pass. `node scripts/check-site.mjs` OK.
- Browser (1280x800 and 390x844, port 8832): the picker page requests no care script; starting a call fetches
  scenario-care.js. s1 tourniquet drawn with tag, chip "Tourniquet on", pin "Controlled by tourniquet"; s15 uterus,
  baby, "Cord at the neck" at the perineum; s12 infant figure with blanket and "Kept warm"; s3 toddler figure. Station
  run (long bone), protocol flows and reference cards open with no page errors.
- `build-body-figures.mjs --check` could not run here (Playwright browser path), before and after this change;
  nothing it builds was touched.

## For the lead
- `sw.js` precaches `nremt/assets/scenario-monitor.js`; add `nremt/assets/scenario-care.js` next to it so the care
  layer works offline.
