# Author A: Unit 1 (1.1-1.10) and the first seven "Algebra you need" topics

Read `docs/apprecalc-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (17)

`change-in-tandem` (1.1), `rates-of-change` (1.2), `linear-quadratic-rates` (1.3), `polynomial-rates` (1.4), `complex-zeros` (1.5), `polynomial-end-behavior` (1.6), `rational-end-behavior` (1.7), `rational-zeros` (1.8), `vertical-asymptotes` (1.9), `rational-holes` (1.10), `alg-functions` (algebra), `alg-intervals` (algebra), `alg-lines` (algebra), `alg-quadratics` (algebra), `alg-polynomial-algebra` (algebra), `alg-complex-numbers` (algebra), `alg-rational-expressions` (algebra).

## FRQs

- `concepts`, Q1 Function Concepts (calculator), on `vertical-asymptotes`: A rational function from its graph and formula: limits at the asymptotes, the hole, solving f(x) = k on a calculator. File `precalculus/data/frq/frq-q1-rational-graph.json` (id `frq-q1-rational-graph`).
- `modeling`, Q2 Modeling a Non-Periodic Context (calculator), on `polynomial-rates`: An open box: a cubic volume model, its rate of change on an interval and the domain from the context. File `precalculus/data/frq/frq-q2-cubic-volume.json` (id `frq-q2-cubic-volume`).

## Stimulus sets (at least these, besides your topics' own sets)

- `table` in `linear-quadratic-rates`: A table of values at equal input steps with first and second differences.
- `graph` in `rational-holes`: A rational function with a hole and two asymptotes.

## Files you own

For each topic id above: `precalculus/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`; the FRQ files above; your figures in `precalculus/figures/` (ids starting with your topic ids); `scripts/apprecalc-figures/a.mjs` if you generate figures; your report `docs/apprecalc-reviews/self-a.md`.

## Notes for your topics

Unit 1 and the algebra chapter are free: they are the first impression of the course. Topics 1.2-1.4 set the rate-of-change wording every later unit reuses (secant slope, rates over equal intervals, concavity in precalculus words; authoring guide "Rates of change and concavity"): get it exactly right, since B-E copy it. Limit notation starts at 1.6 and one-sided limits at 1.9; write them fully. The algebra topics are short and sit right before the topic that needs them (`docs/apprecalc-phase0.md`, "Course order").
