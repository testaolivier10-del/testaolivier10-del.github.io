# AP® Chemistry: open questions for a person

Open points and contested science for human review (`docs/apchem-spec.md`). Add an entry instead
of guessing; mark it resolved with the date and the answer.

## ced-exclusions: verify the Units 3-9 exclusion statements (open, 2026-10-06)

The CED's exclusion statements for Units 1-2 were read in the CED itself. For Units 3-9 the CED
text could not be extracted (`docs/apchem-research/framework.md`, section 4), so these come from
secondary sources and memory of the 2019 CED, and need checking against the current CED PDF
(https://apcentral.collegeboard.org/media/pdf/ap-chemistry-course-and-exam-description.pdf):

- 3.7: molality, percent by mass and percent by volume calculations not assessed; colligative
  properties not assessed.
- 8.11: calculations of solubility as a function of pH not assessed (qualitative only).
- 9.8: labeling electrodes as positive or negative not assessed.
- 9.10: the Nernst equation is on the sheet; the exam emphasizes qualitative reasoning (sign and
  direction from Q vs 1). Is any quantitative Nernst calculation assessed?
- Any other Unit 3-9 exclusion statement the CED has that is not listed here.

Until this is resolved, authors treat every item above as excluded (`docs/apchem-authoring-guide.md`,
"Scope"). Where: `docs/apchem-ced-map.json` (`exclusions`, `exclusionsSummary`).

## ced-practices: science practice weights and skill ids (open, 2026-10-06)

The MCQ and FRQ weight ranges per practice and the skill ids 1.A-6.G come from third-party copies
of the CED table. Check them against the CED (`docs/apchem-ced-map.json`, `sciencePractices`); the
content check accepts exactly the skill ids listed there.

## teacher-review: an AP® Chemistry teacher to review the course (open)

The Beta pill and "not yet been reviewed by an AP® Chemistry teacher" stay on every page until a
teacher signs off (site rule `apchem-beta-and-report`).

## tools-premium: which trainers are free (open)

AP® Biology frees one simulator and all skills tools (apbio decision 9). Proposed for AP®
Chemistry: the particle-diagram trainer free, the other trainers and drills Premium. Owner to
confirm before the first trainer ships.

## unit5-kinetics-scope: Unit 5 choices to confirm (open, 2026-10-06)

Written for Unit 5 (`chem/data/*/` for the 11 kinetics topics); check against the CED:

- **Arrhenius equation.** Not on the equations sheet. The notes for 5.5 mention it only in a
  `going-further` aside and teach the qualitative idea (higher T or lower Ea gives a larger k);
  no item calculates with it. Confirm no quantitative Arrhenius is assessed.
- **Zero-order integrated law.** Not on the sheet, but 5.3 teaches [A]t = [A]0 − kt and the
  [A]-vs-t plot, and one set (NH₃ on hot tungsten) asks for a zero-order k from the slope.
  Confirm zero order is assessed this way.
- **Half-lives other than first order.** Only t½ = 0.693/k is calculated. Second-order halving
  times appear only as reasoning from the integrated law (one MCQ). Confirm no second- or
  zero-order half-life formula is expected.
- **Fractional orders.** Rate laws use orders 0, 1 and 2 only (the 5.2 notes say so); a
  pre-equilibrium with A ⇌ 2 B (giving order ½) was left out. Confirm.
- **Pre-equilibrium notation.** 5.9 uses k₁, k₋₁, k₂ and k = k₂k₁/k₋₁ with one numeric item on
  combining constants. Confirm a numeric item like this is within scope (it may be
  qualitative-only on the exam), and that "forward/reverse rates equal" is the wording wanted
  before Unit 7 introduces equilibrium.
- **Pseudo-first-order.** The long FRQ `frq-dye-fading` uses a large excess of OH⁻ and asks for
  k = k_obs/[OH⁻] without naming "pseudo-first-order". Confirm this is fair at this level.
