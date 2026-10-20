# Review: trainers A (calculation-studio, population-growth, age-structure, energy-flow, cycles, soil-texture)

Date 2026-10-20. Independent reviewer (Phase 4). Brief: `docs/apenv-briefs/review-common.md` with the tool bar of
`docs/apenv-briefs/tools-common.md`; spec sections 6 and 7. No git commands run. Only model files were edited (no
page scripts, data files or shared files); builders of `cycles` and `energy-flow` may still be polishing their pages.

## What was checked

- **Science, every claim and number in the six models** (`environmental-science/assets/tools/math/<slug>.js`) and
  the context leads in `environmental-science/data/tools/<slug>.json`:
  - 10% rule: × 0.1 per transfer, transfers counted as arrows (not levels); the reverse problem × 10 per step;
    energy pyramid never inverted, pond biomass and forest numbers pyramids inverted for the stated reasons.
  - NPP = GPP − respiration (and GPP = NPP + R, R = GPP − NPP); consumers get 10% of NPP, not GPP; respiration
    leaves as heat.
  - Nitrogen: fixation (N₂ to NH₃/NH₄⁺, free-living and legume-nodule bacteria), nitrification (NH₄⁺ to NO₂⁻ to
    NO₃⁻, nitrifying bacteria, needs O₂), assimilation (plant roots), ammonification (decomposers),
    denitrification (anaerobic bacteria, N₂ and some N₂O); lightning and Haber-Bosch as extra fixation. Correct.
  - Carbon reservoirs (GtC): atmosphere 870, land plants 450, soil 1,700, fossil 930, ocean 38,000, sedimentary
    rock ~60 million; fluxes photosynthesis ~120, ocean exchange ~80; airborne fraction ~45/25/30 split; 2.12 GtC
    per ppm. All within the rounding of IPCC AR6 WG1 ch. 5 and the Global Carbon Project. Phosphorus has no
    significant gas phase; weathering is the slow step. Water reservoirs (Trenberth et al. 2007 scale) fine;
    melting sea ice does not raise sea level.
  - USDA soil texture: I wrote my own classifier from the NRCS Soil Survey Manual rules and checked every drill
    point against it; the model's `classify` and every polygon corner agree (boundaries 7/20/27/35/40% clay,
    28/40/50/80% silt, 45/52% sand, the silt + 1.5 clay < 15 and silt + 2 clay < 30 lines). Particle sizes
    (sand 0.05-2 mm, silt 0.002-0.05 mm, clay < 0.002 mm), horizons O-A-E-B-C-R, porosity vs permeability right.
  - Logistic growth: discrete N + rN(1 − N/K), fastest growth at K/2, levels off at K by year 30 for every
    drawn r (checked); overshoot model peaks above K and dies back below the old K (degraded range).
  - Survivorship I/II/III kept separate from r/K: the "link" step teaches they are related tendencies, not the
    same idea; species assignments (humans, elephants I; songbirds II; oysters, sea turtles III) standard.
  - Demographic transition: four stages with typical CBR/CDR (40/38, 38/14, 20/8, 10/10), causes in the right
    order (deaths fall first, then births); pyramid shapes (expansive/stable/constrictive) match TFR; TFR =
    Σ ASFR × 5 / 1000; replacement 2.1; population momentum noted. Growth rate (CBR − CDR) / 10; rule of 70.
- **Keys recomputed by my own code** (scratch `recheck.mjs`, written from the stems and givens, not from the
  model's `ApEnvCalc` calls), loading the runtime in a vm exactly as the tests do (`_shared.mjs runtime`):
  300 seeds per context and type, **33,000 problems** (calculation-studio 11,700; population-growth 5,400;
  age-structure 4,200; energy-flow 5,100; cycles 4,800; soil-texture 1,800). For each: my value vs the key; the
  key graded right through `diagnoseSetup` / `diagnoseUnit` / `diagnose`; the key rounded to 3 figures graded
  right; every listed unit spelling graded right; ×10, ×0.1, ×100, ×0.01 of the key and a wrong unit graded
  wrong; every authored mistake graded wrong and carrying a named slip; choice keys checked against my own
  reading (stage from rates, shape from context, TFR vs 2.1, web effects from the arrows, nitrogen order).
- **Browser play** (Playwright, headless Chromium 1194, at 390 and 1440 px): each trainer's Explore pane
  screenshotted; in Test yourself, 3 seeds (390) and 8 seeds (1440) per tool, regenerated in the page from the
  same seed to confirm the page draws the model's problem (all matched), then for every step: the first
  authored mistake typed (feedback recorded), then the key typed (always "Correct"), every choice option tried.
  No horizontal overflow, no page or console errors, worked solution and Keep going strip shown at the end.
  Screenshots looked at: explore and drill for all six tools at both widths.

## Result

All numeric keys matched my recomputation except where noted below (one tolerance-level note). Every mistake
fed to the page got its own named slip (e.g. "That is 10% applied once too often", "GPP = NPP + respiration;
you subtracted", "Upside down: higher level ÷ lower level × 100", "Divide by 10, not 100"). Every drill was
winnable. Feedback does not print the key before an attempt.

## Changes (model files only)

| File | Old | New | Why |
|---|---|---|---|
| `math/cycles.js` `genNitrogen` | Start at assimilation: step 2 asked "After ammonification, which process comes next?" keyed Denitrification, with Nitrification among the options and its why saying "After ammonification the nitrogen is ammonium again, or nitrate". | That step now says nitrifying bacteria first turn the ammonium into nitrate again and asks which process returns the nitrogen to the atmosphere; Nitrification is left out of its options; each wrong option's why says it does not return N₂. The step after nitrification also gets a specific why for Denitrification (it starts from nitrate too, but the main path is uptake). | **Key error.** Ammonium cannot be denitrified; the next process after ammonification is nitrification, which the old step offered and marked wrong. A third of nitrogen-order drills (start index 2) hit it. |
| `math/energy-flow.js` `genNpp` | Respiration share drawn from 40-65% including 50%. | 35, 40, 45, 55, 60, 65%. | At 50% NPP equals the respiration number printed in the stem (17% of npp drills): the answer was given away and a student who copied the wrong number got "Correct". |
| `math/calculation-studio.js` `GEN.npp` | Respiration could be exactly half of GPP. | Nudged by 10 (or more for big GPP) when it is exactly half. | Same give-away (about 3% of npp drills). |
| `math/soil-texture.js` `genPercolation` | A sandy loam could draw a rate of 1.98 cm/hr (factor 0.8), keyed "Sandy", while the feedback says sandy soils take in "more than about 2 cm/hr". | Sandy loam draws factor 1 or 1.2 only (2.5-3 cm/hr). | The key contradicted the threshold the feedback teaches. |

After the changes: `node --test` for all six tool tests passes (calculation-studio 10, population-growth 9,
age-structure 7, energy-flow 7, cycles 7, soil-texture 6); my recheck is clean except the notes below;
`node scripts/check-apenv-map.mjs`: nothing used before it is taught.

## Issues for builders (not changed: page scripts or judgement calls)

1. **cycles, residence time in days** (validator/model, minor): the answer converts years to days with
   `ApEnvCalc.convert(yr, 'yr', 'day')` (365.25) while the setup key and hint use × 365. Keys differ by 0.07%;
   both grade right (rel 0.02), so no student is hurt, but the solution says "× 365 days/year". Pick one.
2. **calculation-studio, cost (LED bulbs)**: occasionally the yearly saving equals the "before" kWh value
   printed in the stem (e.g. 195 kWh before, $195 saved; 3 of 300 seeds). Coincidence of numbers, not a leak of
   the method, but a student copying 195 gets "Correct". Consider redrawing when `yearly === before`.
3. **age-structure stage drill**: the stage step's options carry the stage description (e.g. "Stage 2:
   transitional") and the correct option's why lacks a leading "Right." (the other tools say it). Cosmetic.
4. **population-growth phase drill**: the "read the peak" number step has no authored mistakes, so any wrong
   number gets only "Recheck the arithmetic". Suggest a mistake at K ("That is the carrying capacity; read the
   top of the curve").
5. **Visual (calculation-studio, 390 px)**: in the unit chain the "Start here: add a factor" cue covers the
   "Factors: tap one to add it" line and partly the "Still to cancel kWh" chip until dismissed. Readable but
   crowded; consider placing the cue below the first tile.
6. **Visual (age-structure, 390 px)**: on the transition graph the "death rate" label sits on the stage-2
   marker line and is cut by it. Minor.
7. **Visual (cycles, 390 px, drill)**: the "Skip to content" link showed over the scene in my screenshot after
   keyboard-free clicks (focus moved to the top of the page). Check that the skip link only shows on keyboard
   focus after a drill step re-renders.
8. Content scope note (no change): the carbon-reservoir question "Where is most of Earth's carbon stored?" keys
   sedimentary rock; correct, and the why names the ocean as the largest active reservoir, which is what some
   AP items mean. Keep both in the why.

## Open questions for a person

- None on the science. The spec's free/Premium split (calculation-studio, energy-flow, cycles free) still
  waits on the owner.
