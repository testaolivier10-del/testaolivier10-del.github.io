# AP® Calculus BC: Phase 0 dependency map

The map is `docs/apcalcbc-dependency-map.json`, an **overlay** on AB's map (`docs/apcalc-dependency-map.json`,
format in `docs/apcalc-phase0.md`): it holds only what BC adds, and `mergeBcMap` in
`scripts/lib/apcalc-build.mjs` merges the two into the BC course map at load. Checked by
`node scripts/check-apcalcbc-map.mjs --check` (AB's `validateMap` with `{ course: 'bc' }`); `--order` prints the
course order. Unit and topic facts come from `docs/apcalcbc-ced-map.json` (our own words, from
`docs/apcalcbc-research/framework.md`, where the BC text was read in the CED). If this file and the JSON
disagree, the JSON is right.

## Counts (merged map)

| | |
|---|---|
| Chapters | 11: Units 1-10 (BC weights) and "Math you need" (`skills-math`) |
| Topics | 121: the 111 CED topics in CED order (AB's 81 and the 30 BC-only), 10 math topics (AB's 7 and BC's 3) |
| Concepts | 181: AB's 136 and BC's 45 (math 5, Unit 6 4, Unit 7 3, Unit 8 1, Unit 9 10, Unit 10 22) |
| Planned tools | AB's 11 plus BC's 6 trainers; BC FRQ themes (`parametric`, `techniques`, `series`), stimulus themes, comparison tables, pathways |
| Circular dependencies | AB's one; BC adds none |

## The overlay's fields

- `overlay: true`, `about`, `version`, `ced`.
- `chapterWeights`: BC's MCQ weights for Units 1-8 (1-4, 7, 8 at 5-10%; 5 at 10-15%; 6 at 15-20%).
- `chapterTools`: BC tool plans added to AB units (Units 6, 7 and 8).
- `chapters`: Units 9 and 10, with weights and tool plans.
- `topics`: the 30 BC topics (`ced` 6.11-6.13, 7.5, 7.9, 8.13, 9.1-9.9, 10.1-10.15, kind `concept`) and three
  math topics: `math-parametric-vectors` before 9.1, `math-polar` before 9.7, `math-sequences` (sequences,
  sigma notation for infinite sums, factorials) before 10.1. The CED expects "basic familiarity with sequences
  and series, and some exposure to parametric and polar equations" (framework.md section 2).
- `concepts`: BC's 45, each with `taughtIn`, `dependsOn` (AB concepts included) and, where TeX shows the concept
  without its name, `notation`.
- `everydayWords`, `circularDependencies`: empty.

The merged map tags every topic and concept with `source` (`ab` or `bc`): the folder its files live in.

## Course order

AB's order with BC topics where the CED places them: 6.11, 6.12, 6.13 between 6.10 and 6.14; 7.5 between 7.4
and 7.6; 7.9 after 7.8; 8.13 after 8.12; then `math-parametric-vectors`, Unit 9 (`math-polar` before 9.7),
`math-sequences`, Unit 10. AB's math topics keep their places. The free tier (proposed) is Units 1 and 2, every
math topic and 9.1-9.3.

## Notation patterns BC adds (regex on the TeX of a formula)

| Concept | Taught in | Notation |
|---|---|---|
| vector | math-parametric-vectors | `\left\langle`, `\langle` |
| factorial | math-sequences | `[A-Za-z0-9)}]!` (not `\!`) |
| improper-integral | 6.13 | `\int_` with an upper limit `\infty`, or a lower limit `-\infty` |
| polar-derivative | 9.7 | `\frac{dr}{d\theta}` |
| infinite-series | 10.1 | `\sum_{n=1}^{\infty}` (any letter, any start) |

Words chosen so AB text does not trip them: "arc length of a curve" (AB's trigonometry uses "arc length" for a
circle), "infinite sequence" (AB says "sequence" in its everyday sense), "convergence" family taught in 6.13
(improper integrals converge before series do), no "remainder" alias (AB's long division).

## The ordering rule on BC pages

As AB's, on the merged order. BC's check also scans every question file BC serves (AB's
`calculus/data/questions/` and BC's), so an AB question that names a BC concept fails here while AB's check passes
it (none does today: 1,556 checked). Pages are scanned once built: AB notes 6.10 and 6.14 mention partial
fractions and parts as "BC" topics, which needs a `cbc-only`/`calc-ab-only` pass before Unit 6 is published in
BC (needs-author `ab-text-on-bc`).
