# Author A: the BC techniques in Units 6-8, and the BC wording of AB's 6.10 and 6.14

Read `docs/apcalcbc-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (6)

`integration-by-parts` (6.11), `partial-fractions` (6.12), `improper-integrals` (6.13), `eulers-method` (7.5), `logistic-models` (7.9), `arc-length` (8.13).

## FRQs

- `techniques`, `frq-u6-parts-improper`: Integration by parts in a definite integral, then an improper integral as a limit (limit notation to the end) and whether it converges. File `calculus-bc/data/frq/frq-u6-parts-improper.json`.
- `techniques`, `frq-u7-euler-arc-length`: Euler's method from a differential equation with a labelled table, over or under from concavity, then the arc length of a curve as a setup. File `calculus-bc/data/frq/frq-u7-euler-arc-length.json`.

## Stimulus sets (at least these, besides your topics' own sets)

- `table` in `integration-by-parts`: u, dv, du, v laid out for a tabular integral.
- `graph` in `eulers-method`: a slope field with two Euler steps drawn.
- `table` in `logistic-models`: values of a logistic population with the carrying capacity to read.
- `graph` in `arc-length`: a curve with chords approximating its length.

## Files you own

For each topic id above: `calculus-bc/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `calculus-bc/figures/` (ids starting with your topic ids); `scripts/apcalcbc-figures/author-a.mjs` if you generate figures; your report `docs/apcalcbc-reviews/self-a.md`.

## Notes for your topics

Also, in AB's files and only there (`calculus/data/notes/rewriting-integrands.html`, `choosing-integration-methods.html` and their lessons if they say it): wrap each sentence that calls parts, partial fractions or improper integrals "BC" topics in `<span class="calc-ab-only">` and add the BC wording in `<span class="cbc-only">` (6.14: the choice includes parts and linear partial fractions). AB's build must stay byte-identical: run `node scripts/build-apcalc.mjs --check` after (it must say nothing is stale) and `node scripts/check-apcalcbc-map.mjs --check` with Unit 6 published in a scratch BC build. Partial fractions: distinct linear factors only; logistic: interpret, never solve (needs-author).
