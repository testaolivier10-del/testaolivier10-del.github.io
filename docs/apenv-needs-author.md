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
