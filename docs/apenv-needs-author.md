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
