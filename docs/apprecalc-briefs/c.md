# Author C: Unit 2 (2.7-2.15)

Read `docs/apprecalc-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (9)

`composition` (2.7), `inverse-functions` (2.8), `logarithmic-expressions` (2.9), `exp-log-inverses` (2.10), `logarithmic-functions` (2.11), `logarithmic-manipulation` (2.12), `exp-log-equations` (2.13), `logarithmic-modeling` (2.14), `semi-log-plots` (2.15).

## FRQs

- `concepts`, Q1 Function Concepts (calculator), on `inverse-functions`: f from a table and g from a formula: a composite value, solving f(x) = k, and whether f is invertible from specific values. File `precalculus/data/frq/frq-q1-table-composition-inverse.json` (id `frq-q1-table-composition-inverse`).
- `concepts`, Q1 Function Concepts (calculator), on `logarithmic-functions`: A logarithmic g with an increasing f: composition, a calculator solve and behavior near the asymptote in limit notation. File `precalculus/data/frq/frq-q1-log-function.json` (id `frq-q1-log-function`).
- `modeling`, Q2 Modeling a Non-Periodic Context (calculator), on `logarithmic-modeling`: Sales that level off: a logarithmic model, an average rate of change, and why the error grows after the data. File `precalculus/data/frq/frq-q2-logarithmic-sales.json` (id `frq-q2-logarithmic-sales`).
- `symbolic`, Q4 Symbolic Manipulations (no calculator), on `exp-log-equations`: Solve exponential and logarithmic equations exactly, and rewrite as a single logarithm. File `precalculus/data/frq/frq-q4-exp-log-equations.json` (id `frq-q4-exp-log-equations`).
- `symbolic`, Q4 Symbolic Manipulations (no calculator), on `exp-log-equations`: An equation quadratic in e^x, a single base power, and the root that cannot be. File `precalculus/data/frq/frq-q4-quadratic-in-ex.json` (id `frq-q4-quadratic-in-ex`).

## Stimulus sets (at least these, besides your topics' own sets)

- `graph` in `semi-log-plots`: A semi-log plot of exponential data.

## Files you own

For each topic id above: `precalculus/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`; the FRQ files above; your figures in `precalculus/figures/` (ids starting with your topic ids); `scripts/apprecalc-figures/c.mjs` if you generate figures; your report `docs/apprecalc-reviews/self-c.md`.

## Notes for your topics

Composition and inverses (2.7-2.8) in every representation (graph, table, formula); invertibility always argued from specific values. Logs from 2.9 on: the domain-aware `expr` grading exists for you, so give log items a domain that catches a log rule run the wrong way (`ln(x^2)` vs `2 ln x` on a two-sided domain). Your two Q4 FRQs set the "single logarithm" and "quadratic in eˣ" style for the course.
