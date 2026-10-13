# AP® Calculus AB: open questions for a person

Things a person (the owner, or an AP® Calculus teacher) should decide or check. Add to this file instead
of guessing; mark an entry resolved with the date and move it to the end.

## ced-exclusions: verify the Units 3-8 boundary statements (open, 2026-10-13)

The research could read the CED's Units 1-2 learning objectives and exclusion statements but not Units
3-8 (`docs/apcalc-research/framework.md`, access note). `docs/apcalc-ced-map.json` has their topics from
secondary sources. A person with the CED PDF should check every Unit 3-8 objective and any exclusion
statement, and update the ced map and `docs/apcalc-authoring-guide.md` ("Scope").

## weight-ranges: unit weights differ between sources (open, 2026-10-13)

The map uses the current course page's ranges (10-15, 10-15, 5-10, 10-15, 15-20, 15-20, 5-10, 10-15%).
Older CED copies, as summarized by third parties, give narrower ones (10-12, 10-12, 9-13, 10-15, 15-18,
17-20, 6-12, 10-15%; `docs/apcalc-research/framework.md` section 1). The practice exam form check
(`unitRange`) and the cram plan use the map's numbers. Check against the current CED.

## mcq-2027: how the 2027 exam scales 42 questions (open)

The May 2027 format (29 + 13 MCQ, 2 + 4 FRQ) is from College Board's announcement. How 42 multiple-choice
questions and 54 FRQ points combine into a composite is not published; the score calculator and the
practice exam assume 50/50.

## score-cutoffs: the score calculator's bands (placeholder, 2026-10-13)

`calculus/assets/pages/score.js` uses composite cut-offs 64/48/37/27 for a 5/4/3/2, labelled "Not
calibrated". They are placeholders, not fitted to anything. Phase 3 should estimate them from published
score distributions (as AP® Physics 1 did) or keep the label.

## shell-method: confirm it is not tested (open)

The shell method is not a CED topic and is treated as out of scope; no exclusion statement was found to
confirm it. A teacher should confirm.

## tools-premium: which trainers are free (open, 2026-10-13)

`limit-explorer`, `tangent-tracer` and `rule-drills` are free; the other seven are Premium
(`calculus/data/pages.json`, spec section 6). Owner to confirm.

## calculator: link to a free graphing calculator (open)

Calculator parts link to the free Desmos graphing calculator (a new tab; nothing embedded). On the exam,
students use the Desmos built into Bluebook or an approved handheld; web Desmos is not allowed there.
The notice says so. Check the policy for 2027, and whether a note for handheld users is wanted.

## teacher-review: an AP® Calculus teacher to review the course (open)

Every unit gets an independent accuracy check in Phase 4. A teacher review of the justification language
and the 9-point rubrics is still wanted before launch.

## Resolved

None yet.
