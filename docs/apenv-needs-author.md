# AP® Environmental Science: open questions for a person

Things a person (the owner, or an AP® Environmental Science teacher) should decide or check. Add to this file
instead of guessing; mark an entry resolved with the date and move it to the end.

## practice-weights: the Section I and II practice weights are third party (open, 2026-10-20)

The CED pages that print the practice weights could not be read (WebFetch stops at about 112k characters of the
CED PDF, in Topic 3.7; the shell cannot reach collegeboard.org). The weights in `docs/apenv-dependency-map.json`
(`practices[].mcqWeight`: 1 30-38%, 2 12-19%, 3 6-8%, 4 2-4%, 5 12-19%, 6 6-9%, 7 17-23%) come from Wikipedia
(citing the CED) and Fiveable, which agree. So `checkForms` does not hold the practice exams to them: it checks
them only when the map sets `"practicesConfirmed": true`. A person with the CED should confirm or correct the
ranges (and the Section II weights, not recorded), then set the flag.

## mcq-options: four answer options (open, 2026-10-20)

No official page read states the number of options. Released practice exams since 2020 and every third-party
report use four (A-D), so the bank, the forms and the content check use four. Confirm in Bluebook's test preview
for AP® Environmental Science; if it is five, the content check (`single` with 4 options), `checkForms` and the
authoring guide change together.

## ced-text: learning objectives after Topic 3.7 were not read (open, 2026-10-20)

All 99 topic titles are official (the Course at a Glance poster; they agree with every title the CED extract
showed). The `objectives` and `knowledge` lines in `docs/apenv-ced-map.json` from 3.7 on are our summaries of the
titles and the course, not the CED's. Also unread: the CED's exclusion statements for Units 4-9, the exam
overview and the sample questions, and p. 226 (which practices FRQ 1 and 2 assess under the 2027 titles). Authors
write to the titles and mainstream science; a person should check Units 4-9 against the CED before launch.

## frq-solution-part: does Q2 or Q3 still ask for a solution in 2027? (open, 2026-10-20)

From 2027 Q2 is "Analyze and interpret quantitative data" (it was "Analyze an environmental problem and propose a
solution"). The 2026 Q3 still had a propose-and-justify part. Whether a solution part survives in Q2 or Q3 in 2027
is not stated. Phase 1 FRQs include a solution or consequence part in some `data` and `calc` FRQs (spec "build
for both"); revisit when 2027 sample questions appear.

## frq-scoring: the 10-point rubric split is an estimate (open, 2026-10-20)

Each FRQ is 10 points, one rubric line per point, split from the 2024-2026 scoring guidelines. Our split per part
is an estimate until 2027 scoring guidelines exist.

## calculator-desmos: the link opens Desmos' public scientific calculator (open, 2026-10-20)

Bluebook has its own built-in Desmos scientific calculator; the course links the public one
(https://www.desmos.com/scientific) in a new tab for practice. Confirm it matches what Bluebook offers.

## identity: accent, icon, headline, ranks (owner to confirm, 2026-10-20)

Olive (hue 63°): light `--cink #474A10` on `--ctint #EFF0DA` (8.0:1), dark `--cink #DCDB98` (11.2:1 on the card,
9.1:1 on its tint); a leaf over a globe line; "AP® Environmental Science, one system at a time."; ranks Field
Observer, Cycle Tracer, Systems Thinker, Resource Steward, Data Reader, Solution Builder, Environmental Science
Legend (spec decision 5). Short name in the header and manifest: "Env Science".

## free-tier: Units 1 and 2 and the math chapter (owner to confirm, 2026-10-20)

23 of 104 topics free (22%), within the 16-33% the other AP® courses give (spec decision 9). One place to change
it: `FREE_UNITS` in `scripts/lib/apenv-build.mjs` and `COURSES.apenv.freeChapters` in `assets/premium.js` (a
test keeps them equal).

## tools-premium: which trainers are free (owner to confirm, 2026-10-20)

`calculation-studio` (the flagship), `energy-flow` and `cycles` free; the other nine `premium: 'tools'`
(spec section 6).

## exam-date: Thursday 13 May 2027 (open, 2026-10-20)

From the student course page and the exam page (Session 2). The session's start time is not on the page; the cram
plan and the countdown use the date only.

## Author A (Unit 1 and "Math you need"): points for a person to check (open, 2026-10-20)

- **10% rule from NPP or GPP.** `frq-energy-flow-calc` (b) applies the 10% rule to NPP (10,000 kcal/m²/yr), the energy
  available to consumers, and accepts an answer consistent with an incorrect part (a). Some classes apply it to GPP.
  A teacher should confirm NPP is the expected base; if GPP is also accepted, add it to part (b)'s `accept` list.
- **Fertilizer and nitrogen fixation.** The nitrogen notes say industrial fixation plus crops such as soybeans have
  "roughly doubled" the nitrogen fixed on land each year (mainstream estimate, after Vitousek et al. 1997, Galloway et
  al.). Rounded wording; check it matches the textbook a teacher uses.
- **Wolves and willows; otters and kelp.** Both appear as examples of effects passing through a food web, each with
  an explicit caution that other causes (weather, storms, disease) share the credit, because the size of the
  wolf effect is debated in the literature. A teacher may prefer to drop the wolf passage (trophic-levels-s1).
- **math-doubling builds only with Unit 3.** Its map anchor is `before: population-growth`, so the build skips it until
  Unit 3 is published (by design). Its content is checked and clean now.

## Author D (Unit 5): points for a person to check (open, 2026-10-20)

- **Irrigation efficiency percentages.** Sources disagree on the exact share of water each method delivers (flood
  roughly 40-60% lost, furrow about one third, spray about a quarter or less, drip often over 90% delivered). The
  notes teach the order (flood < furrow < spray < drip) with rough ranges; the invented data (flood 48%, furrow 64%,
  spray 80%, drip 92%) sit inside those ranges. A teacher may want one set of reference numbers.
- **"About 70% of freshwater withdrawals go to agriculture."** Widely cited (FAO AQUASTAT); used as a round figure in
  the irrigation hook and notes, not in any item key.
- **Ecological footprint figures.** Notes quote Earth's biocapacity as about 1.6 gha per person and the world average
  footprint as about 2.6 gha per person (Global Footprint Network, recent editions; values shift slightly by year).
  No item key depends on them beyond the invented chart's 1.6 line.
- **FAO 2022 aquaculture figures** (94.4 million metric tons farmed vs 91.0 million wild aquatic animals) are quoted
  from the FAO SOFIA 2024 key messages in the aquaculture notes. The aquaculture data table is labeled invented
  (rounded, regional) because older-year values could not be checked against the FAO source in this session.
- **Maximum sustainable yield at K/2** is taught as the logistic-model result. Mainstream, but a teacher may want a
  sentence noting real fisheries rarely follow the model exactly (the notes already add a safety-margin caveat).
- **Feed conversion figures** (beef about 8, pork about 4, chicken about 2 kg feed per kg; salmon about 1.3) are
  labeled invented and sit in the range of published estimates, which vary a lot by system and by whether live
  weight or edible meat is counted.
- **Bank rule, not mine alone:** the whole bank has 4 of 44 select-all items with one correct option (rule: 20%).
  Unit 5 contributes 3 of its 11. Other units' authors need to convert some of theirs.

## Author B (Units 2 and 3): points for a person to check (open, 2026-10-20)

- **Replacement level 2.1** is used as the rule throughout 3.7 to 3.9 ("about 2.1 where few children die young;
  higher where many do"). Mainstream (UN), but a teacher may prefer to say "2.1 in developed countries".
- **Rule of 70 vs natural log.** The calc FRQ (frq-human-population-calc, part b) accepts the natural-log method
  (0.693 / r) as the 2026 scoring guidelines did; whether 2027 guidelines still accept it is not known.
- **Survivorship curve examples.** Songbirds and lizards are given as Type II, as most APES texts do; real
  songbird curves are often closer to Type II in adults only. A teacher may prefer other examples.
- **Real cases quoted from memory.** Resolved 2026-10-20 (review u2-u3): St. Matthew Island 29 (1944), about 6,000
  (1963), 42 (1966) match the Alaska Science Forum account of David Klein's counts; Mount St. Helens: USGS gives
  about 230 square miles (about 600 km²) devastated by the lateral blast; bowheads: NOAA Fisheries gives first
  breeding about 25, one calf every 3 to 4 years, protection under the 1931 League of Nations convention, under 3,000
  worldwide by 1921, about 15,200 western Arctic whales now; UN DESA: under 1 billion until about 1800, 8 billion on
  15 November 2022. Corrected: elephant seals now "more than 200,000" (about 225,000 in 2010, Lowry et al. 2014;
  the passage had "well over 100,000"), and the bowhead passage now says whaling ran into the early 1900s.
- **Sea level about 120 m lower 20,000 years ago.** Resolved 2026-10-20 (review u2-u3): USGS gives about 125 m at
  the last glacial maximum, about 21,000 years ago; "about 120 meters ... about 20,000 years ago" is within the
  published 120-130 m range and stays.
- **TFR from age-specific rates** (3.7 item and notes: sum × 5 / 1,000) goes slightly beyond what the CED is
  known to require for 3.7 (objectives after 3.7 unread, see ced-text). Kept as one apply item; drop if a
  teacher judges it out of scope.
- **Grader: no number inside a unit (review u2-u3, for the lead).** `ApEnvGrade.readNumber` refuses any digit in
  the unit part, so "22 births per 1,000 people" (and every spelling with 1,000) could never be graded right. The one
  item that asked for it (`env-human-population-6`) now asks for the number only (`askUnit: false`). A runtime
  fix (allow "per 1,000" / "per 1000" as a unit) would let rate items ask for the unit again.

## Author C (Unit 4): points for a person to check (open, 2026-10-20)

- **Plot runtime limit (for the lead, not authored content).** `env-plot.js` draws a `dual` plot's two axis labels and legend at fixed positions that collide at the default 360 px width; the `bar` category labels crowd at 5 categories. Author C's stimuli set `width: 480`/`520` and short labels to fit. A layout fix in the shared plot file would help other authors.

The other Author C points were settled by the Unit 4 review; see the resolved entry at the end of this file.

## Author G (Units 8.12-8.15 and 9): points for a person to check (open, 2026-10-20)

- **Map edit: nitrous oxide moved from 9.4 to 9.3.** `nitrous-oxide` was `taughtIn: greenhouse-gas-increases` (9.4), but 9.3 (the greenhouse effect) must name it among the principal greenhouse gases. Moved to `greenhouse-effect`; the only change in `docs/apenv-dependency-map.json` by author G. Confirm.
- **Real data used, from memory or a fetch.** (GWPs and eagle counts verified by the reviewer 2026-10-20, see `docs/apenv-reviews/u8b-u9.md`: AR5 Table 8.A.1 matches exactly; USFWS 2007 gives 417 nesting pairs in 1963 and 9,789 *breeding* pairs in 2007, wording fixed.) `greenhouse-gas-increases-s1` and the Keeling figure use NOAA GML Mauna Loa annual means (316.91 ppm 1960 ... 414.21 ppm 2020, 421.08 ppm 2023), fetched from `co2_annmean_mlo.txt` (file dated 2024-10-05). `greenhouse-effect-s2` uses IPCC AR5 100-year GWPs (CH4 28, N2O 265, HFC-134a 1,300, CFC-12 10,200; lifetimes 12.4, 121, 13.4, 100 yr) from memory: spot-check against AR5 WG1 Table 8.A.1. `endangered-species-s2` uses the US Fish and Wildlife Service bald eagle counts (417 nesting pairs in 1963, 9,789 in 2007): spot-check. `pathogens-s1` summarizes WHO fact sheets (routes of spread), not numbers.
- **NASA ozone hole areas not verified.** Still open: the reviewer's fetch of ozonewatch.gsfc.nasa.gov was also blocked. The NASA Ozone Watch annual table could not be fetched, so `ozone-depletion-s1` is labeled invented ("shaped like the satellite record"). If a person can confirm the NASA 7 Sep to 13 Oct mean areas, the set could cite them instead.
- **GWP values vary by IPCC report.** Resolved 2026-10-20 (lead decision): prose says methane traps roughly 25 to 30 times as much heat as CO2 over 100 years (AR4 25, AR5 28, AR6 27.0 non-fossil / 29.8 fossil; N2O 298, 265, 273), and every item that computes a CO2 equivalent states the GWP in its stem (`env-greenhouse-effect-9`, `-10`). The AR5 table stays as the stimulus.
- **Ozone recovery dates.** Resolved 2026-10-20: WMO's January 2023 release of the 2022 assessment gives about 2066 Antarctic, 2045 Arctic, 2040 for the rest of the world; the 2007 Montreal adjustment gives HCFCs 2020 (0.5% servicing to 2030) and 2030 (2.5% average servicing to 2040). Content matches.
- **Pesticide signal words.** Resolved 2026-10-20: 40 CFR 156.62 (oral LD50: I up to and including 50; II >50 thru 500; III >500 thru 5,000; IV >5,000 mg/kg) and 156.64 (DANGER, plus POISON and skull and crossbones for oral, dermal or inhalation category I; WARNING; CAUTION; category IV none required, CAUTION if used). Notes and `env-lethal-dose-50-7` now say so.
- **Ocean station data invented.** The `ocean-acidification-s1` table and the `frq-ocean-acidification-data` stimulus are invented but shaped like the BATS/HOT records (about -0.0019 pH per year). Real HOT or BATS values could replace them with a NOAA citation.
- **CED objectives for Unit 9 unread** (see `ced-text`). Content follows the titles and mainstream science; a person with the CED should check 8.12-9.10, particularly whether 9.3 expects named GWP values and whether 9.6 expects the thermohaline circulation.

## Author E (Unit 6): points for a person to check (open, 2026-10-20)

- **CED objectives for Unit 6 unread** (see `ced-text`). Content follows the official titles, the 2026-27 clarification for 6.5 (fracking can contaminate groundwater and release VOCs; the notes say "volatile chemicals" because VOCs are taught in 7.1) and mainstream science. A person with the CED should check 6.1-6.13, especially whether 6.4 expects named regions or countries, 6.6 expects named accidents and the isotope list, and 6.13 expects named policies (CAFE standards, ENERGY STAR).
- **Map edit: tar sands moved from 6.5 to 6.3.** `docs/apenv-dependency-map.json` concept `tar-sands` now has `taughtIn: "fuel-types"`, because the CED's 6.3 Fuel Types and Uses is where tar sands (with peat, coal ranks and natural gas) are listed. Confirm against the CED; reverting is a one-line change and 6.5 still uses the term.
- **Typical values used in invented data.** Rounded values near published estimates, all labeled invented for practice: coal-plant step efficiencies (boiler 88%, steam cycle 45%, generator 98%, lines 94%, overall about 36.5%); life-cycle carbon dioxide per kWh (coal 820, natural gas 490, solar PV 45, nuclear 12, onshore wind 11 g, the IPCC AR5 medians); capacity factors (nuclear 90%, wind 35%, solar 25%, hydro 45%); fuel energy content (lignite 15, bituminous 27, anthracite 30, gasoline 46, natural gas 50 MJ/kg) and carbon dioxide per GJ; corn and sugarcane ethanol energy per hectare (75 and 135 GJ, net 20 and 120); hydrogen path efficiencies (about 27% source to wheels against about 79% for a battery car); natural gas 5.3 kg carbon dioxide per therm (EPA). A reviewer may want real sourced tables (EIA, IPCC) in place of some of these.
- **Shares stated as facts in notes.** Fossil fuels about 80% of world energy; the United States about 4% of people and about one sixth of world energy; about 2 billion people lacking clean cooking fuels (IEA/WHO put it at 2.1 to 2.3 billion); Iceland about a quarter of electricity from geothermal; Iowa more than half of electricity from wind; LEDs at least 75% less electricity than incandescent bulbs (DOE). These are stated roughly; confirm the years and figures before launch.
- **Peat as a fuel type.** The map lists peat under 6.3; the notes treat it as the first stage of coal and a minor fuel. Confirm the CED does not expect more.
- **Data FRQ title.** `frq-global-energy-consumption-data` follows the 2027 Q2 "Analyze and interpret quantitative data" shape and ends with a consequence-and-solution part (2 points), per `frq-solution-part`.

## Author F (Units 7 and 8.1-8.11): points for a person to check (open, 2026-10-20)

- **Real data quoted, with sources.** Solid waste (8.9): EPA, *Advancing Sustainable Materials Management: 2018 Fact Sheet* (December 2020), Table 1: 292.4 million tons generated, 146.1 landfilled, 69.1 recycled, 24.9 composted, 34.6 combusted with energy recovery, 17.7 other food management; 4.9 lb per person per day. The per-person item uses about 327 million people for 2018 (Census estimate, rounded) and reproduces 4.9. Thermal pollution (8.6): dissolved oxygen at saturation in fresh water (USGS tables, sea-level pressure), quoted to one decimal: 14.6, 12.8, 11.3, 10.1, 9.1, 8.3, 7.6, 6.9 mg/L at 0-35 °C; I recomputed them from the Benson-Krause equation (7.56 at 30 °C rounds to 7.6). Noise (7.8): the lesson figure uses the CDC "What Noises Cause Hearing Loss?" ranges (conversation 65-80 dB, lawn mower 80-100, sports events 94-110, sirens 110-129, fireworks 140-160; 85 dB as the level where damage can begin over time). The noise question set itself uses invented values, because "CDC" is not in the content check's list of public sources (`PUBLIC_SOURCES`); consider adding CDC and NIH there.
- **Facts stated roughly in notes; confirm before launch.** Volcanoes emit roughly one hundredth of human CO2 each year (USGS: under about 1 billion t against more than 35 billion t); the lower 48 states lost about half their original wetlands since the 1780s (USFWS); recycling aluminum saves about 95% of the energy of primary production (the per-can energy in the setup item, 0.2 kWh, is stated as an assumption, because published per-can figures vary); United States SO2 from power plants fell by more than 90% after 1990; DDT banned for most uses in the United States in 1972, PCBs in 1979; Stockholm Convention 2001, more than 180 parties.
- **Ordering choices.** "Pathogen" is taught in 8.15, so sewage treatment (8.11) says "germs" and "disease-causing bacteria and viruses" for disinfection. DDT is taught in 8.7, so 8.3 leaves it out of the endocrine disruptor examples. Malaria (8.15) is described in 8.7 as "a deadly disease spread by mosquitoes". A reviewer may prefer preview boxes instead.
- **Runtime limits found while authoring (no change made).** `ApEnvExpr` cannot read `ng`, `s` as a bare unit after a rate (`50000 L/s * 86400 s`), or combine `m2` × `m` into `m3`; setups that would need them are written without units, and the answer step carries the unit. `ApEnvPlot` bar charts are linear only, so the biomagnification set (values from 0.00005 to 50 ppm) is a table, not a bar chart.
- **FRQ scoring.** `frq-photochemical-smog-data` follows the 2027 Q2 shape and ends with a solution part (2 points), per `frq-solution-part`. `frq-eutrophication-design` gives 1 point each to the hypothesis, the constant, the design change and the solution, and 2 to the variables, the control and the explanation, an estimate per `frq-scoring`.

## Author F points settled by the Unit 7 and 8.1-8.11 review (resolved, 2026-10-20)

- **Atrazine as an endocrine disruptor.** Resolved: the National Institute of Environmental Health Sciences
  (NIEHS) fact sheet *Endocrine Disruptors* lists atrazine ("one of the most commonly applied herbicides in the
  world") among endocrine disruptors, beside BPA and phthalates. The key of `env-endocrine-disruptors-10` now
  cites the NIEHS listing; the explanation keeps one clause noting that frog studies differ in effect size. The
  notes already say "in some studies" for the frog effect. Atrazine stays the key.
- **Mercury sources.** Resolved for the science: the UN Environment Programme *Global Mercury Assessment 2018*
  (as quoted by the EPA) puts artisanal and small-scale gold mining first (37.7% of human emissions) and
  stationary coal burning second (21%). The 8.8 notes now say so; the glossary, lesson and items keep "coal
  burning and small-scale gold mining" with coal named first, and `env-bioaccumulation-biomagnification-12`
  asks only about coal. The CED wording for 8.8 could not be read (see `ced-text`); nothing in our text
  contradicts a CED that names coal.

## Author C (Unit 4): resolved by the Unit 4 review (resolved 2026-10-20)

- **Soil erodibility in `frq-soil-properties-design`.** The pilot ranking sandy soil < loam < silt loam matches the USDA
  soil erodibility factor (K, from the Wischmeier nomograph used in NRCS soil surveys): soils dominated by silt and very
  fine sand have the highest K, sandy soils the lowest, loams in between (UC ANR Publication 8194, which uses NRCS
  SSURGO K values). Leaving clay out is right: well-aggregated clay has a low to moderate K, so a clay ranking would
  depend on the test. No change.
- **Real data in `atmosphere-s1` and `atmosphere-s2`.** The plotted points match the U.S. Standard Atmosphere, 1976
  layer table (base temperature 288.15 K and lapse rates -6.5, 0, +1.0, +2.8, 0, -2.8, -2.0 K/km at 0, 11, 20, 32,
  47, 51, 71 km gives 15, -56.5, -56.5, -44.5, -2.5, -2.5, -58.5 and -86.3 °C at 84.852 km). Carbon dioxide 0.042%
  matches NOAA GML's 2024 global mean, 422.8 ppm (climate.gov). The dry-air percents (78.08, 20.95, 0.93) are the
  standard reference values; the NASA Earth fact sheet and the NOAA JetStream page could not be fetched in the
  review session, so a person may still glance at the NASA page, but nothing found disagrees.
- **Insolation curve (`solar-radiation-seasons-s1`).** Recomputed from a solar constant of 1,361 W/m² and a 23.44°
  tilt: 415.5, 402.6, 365.2, 306.9, 236.3, 185.6, 172.3 W/m² at 0-90° N. Two plotted points moved to the nearest 5
  (15° N 400 to 405, 90° N 175 to 170); still labeled invented and rounded.
