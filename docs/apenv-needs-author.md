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
- **Real cases quoted from memory, rounded and attributed in passages:** St. Matthew Island reindeer (29 in
  1944, about 6,000 in 1963, 42 in 1966), northern elephant seal bottleneck, Mount St. Helens 1980 (600 km²
  flattened), bowhead whales (protected from commercial hunting since the 1930s, first breeding about age 25,
  more than 10,000 today), world population about 1 billion around 1800 and 8 billion in 2022 (UN). Each
  passage is labeled "Invented passage for practice, summarizing ..."; a reviewer with sources should confirm
  the figures.
- **Sea level about 120 m lower 20,000 years ago** (2.5, last glacial maximum) is the common textbook value;
  published estimates run about 120 to 130 m.
- **TFR from age-specific rates** (3.7 item and notes: sum × 5 / 1,000) goes slightly beyond what the CED is
  known to require for 3.7 (objectives after 3.7 unread, see ced-text). Kept as one apply item; drop if a
  teacher judges it out of scope.

## Author C (Unit 4): points for a person to check (open, 2026-10-20)

- **Soil erodibility in `frq-soil-properties-design`.** The pilot data rank washed-off soil as sandy soil < loam < silt loam (silt is the most erodible texture, mainstream USDA erodibility). Clay was left out on purpose: clay is cohesive but sheds water, so whether it erodes more or less than loam depends on the test, and a key built on it would be contestable. Confirm the ranking reads as intended.
- **Plot runtime limit (for the lead, not authored content).** `env-plot.js` draws a `dual` plot's two axis labels and legend at fixed positions that collide at the default 360 px width; the `bar` category labels crowd at 5 categories. Author C's stimuli set `width: 480`/`520` and short labels to fit. A layout fix in the shared plot file would help other authors.
- **Real data used.** `atmosphere-s1` uses the U.S. Standard Atmosphere, 1976 layer-boundary temperatures (mesopause 84.852 km rounded to 85 km); `atmosphere-s2` uses standard dry-air volume percents with CO2 rounded to 0.042% (about 420 ppm, NOAA 2024). The NASA fact sheet fetch was not answered in this session, so the values are from standard references in memory; a person should spot-check them against NOAA/NASA before launch.
- **Insolation curve (`solar-radiation-seasons-s1`).** Labeled invented, but rounded from a calculated yearly-average top-of-atmosphere insolation (solar constant 1,361 W/m²): 415, 400, 365, 305, 235, 185, 175 W/m² at 0-90° N.

## Author G (Units 8.12-8.15 and 9): points for a person to check (open, 2026-10-20)

- **Map edit: nitrous oxide moved from 9.4 to 9.3.** `nitrous-oxide` was `taughtIn: greenhouse-gas-increases` (9.4), but 9.3 (the greenhouse effect) must name it among the principal greenhouse gases. Moved to `greenhouse-effect`; the only change in `docs/apenv-dependency-map.json` by author G. Confirm.
- **Real data used, from memory or a fetch.** `greenhouse-gas-increases-s1` and the Keeling figure use NOAA GML Mauna Loa annual means (316.91 ppm 1960 ... 414.21 ppm 2020, 421.08 ppm 2023), fetched from `co2_annmean_mlo.txt` (file dated 2024-10-05). `greenhouse-effect-s2` uses IPCC AR5 100-year GWPs (CH4 28, N2O 265, HFC-134a 1,300, CFC-12 10,200; lifetimes 12.4, 121, 13.4, 100 yr) from memory: spot-check against AR5 WG1 Table 8.A.1. `endangered-species-s2` uses the US Fish and Wildlife Service bald eagle counts (417 nesting pairs in 1963, 9,789 in 2007): spot-check. `pathogens-s1` summarizes WHO fact sheets (routes of spread), not numbers.
- **NASA ozone hole areas not verified.** The NASA Ozone Watch annual table could not be fetched, so `ozone-depletion-s1` is labeled invented ("shaped like the satellite record"). If a person can confirm the NASA 7 Sep to 13 Oct mean areas, the set could cite them instead.
- **GWP values vary by IPCC report.** Methane is 25 (AR4), 28 (AR5) or about 27 to 30 (AR6). The notes say "use the numbers a question gives you". Choose one report for the whole course if other authors also cite GWPs.
- **Ozone recovery dates.** The timeline figure and notes use the 2022 UNEP/WMO assessment: about 2040 globally, 2045 Arctic, 2066 Antarctic. HCFC phase-out given as developed countries by 2020 (servicing allowance to 2030) and developing countries by 2030 (allowance to 2040). Confirm wording.
- **Pesticide signal words.** 8.12 uses the EPA toxicity categories for oral LD50 (I ≤ 50 mg/kg DANGER; II 50-500 WARNING; III 500-5,000 CAUTION; IV > 5,000, CAUTION or none). From memory of 40 CFR 156.62; a person should confirm the boundary wording.
- **Ocean station data invented.** The `ocean-acidification-s1` table and the `frq-ocean-acidification-data` stimulus are invented but shaped like the BATS/HOT records (about -0.0019 pH per year). Real HOT or BATS values could replace them with a NOAA citation.
- **CED objectives for Unit 9 unread** (see `ced-text`). Content follows the titles and mainstream science; a person with the CED should check 8.12-9.10, particularly whether 9.3 expects named GWP values and whether 9.6 expects the thermohaline circulation.
