# Author D: Unit 10 topics 10.6-10.15

Read `docs/apcalcbc-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (10)

`comparison-tests` (10.6), `alternating-series-test` (10.7), `ratio-test` (10.8), `absolute-conditional` (10.9), `alternating-error-bound` (10.10), `taylor-polynomials` (10.11), `lagrange-error-bound` (10.12), `radius-interval-convergence` (10.13), `taylor-series` (10.14), `power-series-functions` (10.15).

## FRQs

- `series`, `frq-u10-interval-taylor`: A power series: the ratio test, the interval of convergence with both endpoints tested, Taylor coefficients from the series, and a sum of a related geometric series. File `calculus-bc/data/frq/frq-u10-interval-taylor.json`.
- `series`, `frq-u10-taylor-error`: A Taylor polynomial from a table of derivatives (the right center), an estimate, the Lagrange error bound with the maximum justified, and when the alternating series bound applies instead. File `calculus-bc/data/frq/frq-u10-taylor-error.json`.

## Stimulus sets (at least these, besides your topics' own sets)

- `table` in `taylor-polynomials`: f and its derivatives at the center.
- `table` in `ratio-test`: the ratio of consecutive terms for a few n.
- `table` in `radius-interval-convergence`: the ratio test steps for a power series (as in the fixture).
- `graph` in `taylor-series`: a function and two of its Taylor polynomials.

## Files you own

For each topic id above: `calculus-bc/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `calculus-bc/figures/` (ids starting with your topic ids); `scripts/apcalcbc-figures/author-d.mjs` if you generate figures; your report `docs/apcalcbc-reviews/self-d.md`.

## Notes for your topics

The hardest unit by every account and the BC6 slot every year. Use `interval` items for every interval of convergence (with `ends` and the classic slips in `mistakes`), `expr` items for Taylor polynomials and series sums, and the error-bound wording of the BC guide ("error ≤ ... < ...", the conditions stated). The fixture's 10.13 topic is a placeholder: write your own, do not copy it.
