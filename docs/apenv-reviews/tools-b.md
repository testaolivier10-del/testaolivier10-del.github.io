# Review: trainers B (earth-climate, energy-chain, air-pollution, water-pollution, dose-response, climate-change)

Independent reviewer, 2026-10-20. I read: `CLAUDE.md` (AP® Environmental Science section), `docs/apenv-spec.md`
sections 6-7, `docs/apenv-briefs/tools-common.md` and `review-common.md`, all six models
(`environmental-science/assets/tools/math/<slug>.js`), their validators (`scripts/lib/apenv-tool-checks/<slug>.mjs`,
`_drills.mjs`, `_shared.mjs`), the tool data files, and the grading runtime (`env-tool-math.js` `cell`/`diagnose*`,
`env-grade.js` `numeric`, `env-expr.js` `gradeSetup`).

I edited only model and check files. I did not touch any page script.

## How I checked

1. **My own sweep** (scratch, not the validators). It loads the runtime in a vm the way the tests do. It generates
   300 problems per context and type, which is 11,700 problems in total. For each one it recomputes the key from
   the problem text or givens with plain arithmetic. Then it grades the key, and the common wrong answers, through
   `diagnose`, `diagnoseUnit` and `diagnoseSetup`. The wrong answers tried were:
   - percent change: positive sign, dividing by the new value, no brackets;
   - chains: averaging efficiencies, multiplying where you should divide;
   - unit slips: Wh instead of kWh, a 1,000 lb ton, a metric ton for a short ton, metres for cm, mg/day for kg/day;
   - log slips: the pH difference itself, or 10 × the difference;
   - biomagnification: f × levels, or one level too many;
   - rain shadow: the dry rate all the way up, the wet rate all the way up, a moist descent;
   - sewage removals added instead of multiplied;
   - LD50: typing 50, or dividing by body mass.
2. **Rounded answers.** Every unit and num key was rounded to 3 s.f. and to the rounding the hint asks for, then
   graded. Every setup was also tested with a bare number typed in its place.
3. **Playwright.** Chromium at 390 and 1440 px, scratch build served locally. I played 10 problems per tool at
   390 px and 20 at 1440 px. Every step was answered through the real UI (radio, setup box, value + unit box) and
   had to say "Correct". I also took pre-answer screenshots of every drill kind and read their figure text.
4. **Repo checks.** All 6 tool tests pass (41 tests), and `node scripts/check-apenv-content.mjs` reports 0 failing.
   Both were rerun after my edits.

## Grading and science errors fixed (model files)

| Tool / step | Problem | Fix |
|---|---|---|
| water-pollution `load` | The hint says "Round to 0.1", but 1.25 typed as 1.3 graded wrong. The tolerance is 1% (0.0125), so a correctly rounded answer failed. | `places: 1` on both `load` and `reduce`. |
| energy-chain `power` `cost` | A student who rounds to the cent was marked wrong: $0.2025 typed as 0.20 graded "close". | `places: 2`. |
| energy-chain `fuel` `setup2` | The key carries the fuel energy at 6 s.f. (4444.44). A student carrying 4444.4 or 4444 from the step before failed the setup box, because the setup tolerance is 1e-6. | `tol: 0.002` on that setup. |
| earth-climate `sun` setup | At an equinox the bare answer "45" passed as the setup, because only the latitude was in `mustUse`. | `mustUse` now includes `90`. |
| earth-climate `enso` setup | The bare mean passed as the setup. | `mustUse` now includes `3`. |
| air-pollution `ph` setup | The bare answer "316.2…" passed as the setup. | `mustUse` now has both pH values. |
| air-pollution `ph` (science) | The "cleaner rain" used for comparison could be pH 6.0, 6.5 or 7.0. Unpolluted rain is about 5.6 (CO₂ makes carbonic acid; EPA), and the page itself teaches that. | Comparison rain is now 5.0, 5.5 or 5.6, and the acid rain is 4.0 to 4.6. |
| dose-response `read` | 46 of 300 curves had a 2% response at the first dose, so the threshold key was 0 mg/kg. That is a trivial answer, and it clashes with "the highest dose with no deaths". | The model redraws until the threshold is above 0. |
| earth-climate `shadow` | For the Himalayas (wet side: south) the descent step said "the west side". | Now gives the opposite of the wet side (north). |
| earth-climate `enso` option text | One distractor read "the water is cooler normal". | Now reads "cooler than normal". |
| dose-response `magnify` solution | The solution said mercury is "fat-soluble, stored in fat". Methylmercury binds to protein in muscle (EPA, USGS). | Reworded: DDT and PCBs are stored in fat; methylmercury binds to muscle protein. |

**Validator rules added** so these stay caught:
- `earth-climate.mjs` and `air-pollution.mjs`: a bare number is never accepted as the setup.
- `air-pollution.mjs`: the comparison rain is at most pH 5.6.
- `dose-response.mjs`: the threshold is above 0.
- `energy-chain.mjs`: the cost rounded to the cent grades right.
- `water-pollution.mjs`: the load and the reduced load rounded to 0.1 grade right.

## Science checked and correct (no change)

- **Sun angle and day length.** Noon sun angle is 90 − |lat − decl|. I compared the day-length direction against
  geometry (acos(−tan φ tan δ)) for every problem. The insolation formula is the standard daily mean, solar constant
  1361 W/m². The seasons drill uses the tilt, not distance; perihelion is in early January and the distance changes
  by about 3%.
- **Circulation cells.** Hadley 0-30°, Ferrel 30-60°, polar 60-90°. Air rises at 0° and 60° and sinks at 30° and
  90°. NE/SE trade winds, SW westerlies in the north and NW in the south, polar easterlies. Coriolis turns winds
  right in the north and left in the south.
- **Rain shadow.** 10 °C/km dry and 6 °C/km in cloud. Cloud base is 125 m per °C of dew-point spread (Espy).
- **ENSO.** Niño 3.4 anomaly, 3-month mean, ±0.5 °C (NOAA ONI). The effects match NOAA:
  - El Niño: weaker trade winds, less upwelling off Peru, drier Indonesia and Australia, wetter southern US winter.
  - La Niña: the reverse.
- **EIA figures, confirmed live.**
  - Heat rates (Electric Power Annual table 8.1, 2024): coal 10,777, gas 7,754, nuclear 10,443 Btu/kWh.
  - CO₂ per kWh (2023): coal 2.31 lb, gas 0.96 lb.
  - Fuel per kWh (2022): 1.14 lb of coal, 7.42 ft³ of gas.
  - 3,412 Btu/kWh.
  - The stage efficiencies multiply to within 0.5 points of 3412/heat rate.
- **EPA power-sector series** (Power Sector Programs progress report). 2023 values: SO₂ 0.65 Mt, NOx 0.639 Mt. The
  1995 SO₂ (11.85) and 1990 NOx (6.44) values equal the 2023 value plus EPA's stated reductions.
- **Smog timing.** In every sweep, NO peaks at about 7:30-8:30, NO₂ about an hour later, and O₃ in the early
  afternoon. Ozone falls at night through NO titration. Ozone is classed as secondary.
- **Inversion.** Warm air over cool air, with the valley and basin examples.
- **Acid rain.** Clean rain is pH 5.6; the factor is 10^Δ; acid rain comes from SO₂ and NOx; limestone buffers it.
  The EPA tolerance list matches EPA "Effects of Acid Rain: Surface Waters".
- **Dissolved oxygen vs temperature.** The OSAT table (14.6 at 0 °C down to 7.0 at 35 °C) matches the USGS
  sea-level, freshwater table to 0.1 mg/L.
- **Eutrophication chain.** Nutrients → bloom → die-off → aerobic decomposition → DO falls → hypoxia below
  2 mg/L. The model's oxygen low always comes after the algae peak.
- **Sewage treatment.** Primary is physical, secondary biological, tertiary removes N and P, then disinfection.
  Removals multiply.
- **LD50.** The dose that kills 50% of the test population; a lower LD50 is more toxic; it describes a population,
  not one animal.
- **Biomagnification vs bioaccumulation.** Biomagnification is c₀·fⁿ across trophic levels. Bioaccumulation is
  build-up in one organism. The two are kept apart.
- **Greenhouse effect vs ozone layer.** Greenhouse gases absorb IR, in the troposphere. Ozone absorbs UV-B and
  UV-C, in the stratosphere. The Cl/ClO catalytic cycle and the Montreal Protocol are right. The ozone hole is not
  the cause of warming, and CFCs are also greenhouse gases. Myhre forcing 5.35 ln(C/280).
- **Global warming potentials** (AR5, 100-year): CH₄ 28, N₂O 265, CFC-12 10,200.
- **Ocean acidification.** The carbonate chemistry is right, the factor is 10^Δ, and the drill says the ocean is
  still above pH 7.
- **Sea level.** Floating sea ice adds no sea level. Land ice and thermal expansion do. Greenland is 7.4 m sea-level
  equivalent (AR6).
- **Keeling Curve values** (NOAA annual means, rounded): 317 (1960), 339 (1980), 354 (1990), 414 (2020),
  425 (2024).

## Numeric recheck result

After the fixes:
- My sweep: 11,700 problems, every key confirmed. No common wrong answer grades right.
  - One flag was an artifact of my test, not a bug: for a 1 kg duck, LD50 ÷ kg equals LD50 × kg.
- No bare number passes as a setup anywhere.
- Every key rounded the way its hint asks grades right.
- Answers rounded to 2 s.f. still grade wrong in several places (for example LD50 125 typed as 130, CO₂ 25.4%
  typed as 25). I think that is acceptable: the hints ask for 0.1 or whole numbers.

**Playwright.** Every drill played was winnable at both widths:
- 390 px: 10 of 10 problems per tool.
- 1440 px: 20 of 20 problems per tool.

There was no horizontal scroll. The only console errors were blocked analytics hosts and a service-worker 404 in
the sandbox. No page errors.

## Visual issues and answer leaks (page scripts, for the builder; not edited)

1. **earth-climate `cells` drill figure gives the answers away (serious).** The drill uses
   `windScene(…, { noLabels: true })`, but the picture still shows all of these, and the balloon dot sits next to
   them:
   - each cell named (Hadley, Ferrel, Polar);
   - "Air rises: rain" and "Air sinks: dry" at every latitude line (sun and cloud icons on a phone);
   - wind arrows for every belt.

   So the `air`, `climate`, `cell` and `wind` steps are all read straight off the figure. Suggested fix: in drill
   mode, hide the cell names, the rise/sink and wet/dry labels and the surface arrows until the step that asks for
   each is answered. The other drills' `hide` flags work this way already.
2. **energy-chain `chain` context text.** The `<ul class="ech-list">` renders as one run-on line in the side pane
   ("Reactor: 99% efficient Steam turbine: 33% efficient …"). The list styling is lost there. The figure shows the
   same values, but the text is hard to read.
3. **dose-response `read`, after answering.** The graph prints "threshold 25" and "LD50 = 125 mg/kg". It only does
   this after the steps are answered, so that is fine. Before answering, the curve shows only axes, which is good.
4. **Start-here bubbles at 390 px.** These cover controls or labels:
   - water-pollution: covers the "Fertilizer runoff" label;
   - dose-response: sits over the Insecticide X / Herbicide Y / Solvent Z chips;
   - climate-change: sits over the CO₂ slider label.

   All are cosmetic. They disappear on first use.
5. **air-pollution and climate-change explore figures at 390 px.** The circular frame crops the corners of the
   scene: the smog graph's x-axis labels "6 a.m." and "6 p.m." are cut, and the ozone panel's labels touch the edge.
   This is worth a look at 360 px.
6. **Drill step counter.** Some screenshots show the side pane's "Step 1 of N" with N = 4, while the model's step
   count for that seed was 3. This was a mismatch between my own seed→context replay and the page, not a page bug.
   The steps actually rendered always matched and were winnable.

Pre-answer figures I checked showed no keys: sun, shadow, smog, ph, lake chain, thermal, magnify, ocean pH, sea
level, chain, heat rate, ENSO, sewage, dose, GWP, CO₂. The thermal drill's USGS table values are given by design;
the drill is a reading task.

## Open questions for a person

- Should 2-significant-figure answers be accepted generally (LD50 read as 130 for 125)? APES readers usually accept
  reasonable rounding. Today the hints set the rounding, and only that rounding is guaranteed.
- earth-climate `cells`: should the figure keep the cell names visible to teach, with the step then dropped? Or
  should the labels be hidden as suggested in issue 1?

Scratch scripts: `/tmp/claude-0/-home-claude/0e369a52-8871-52a6-9ba4-41431159b4fd/scratchpad/revb/` (`sweep.mjs`,
`round.mjs`, `bare.mjs`, `play.mjs`, `pre.mjs`; screenshots in `shots/`).
