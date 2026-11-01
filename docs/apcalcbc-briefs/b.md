# Author B: parametric equations and vectors, and Unit 9 topics 9.1-9.6

Read `docs/apcalcbc-briefs/content-common.md` first; it holds every rule. This file lists what you own (spec section 5a).

## Topics (7)

`math-parametric-vectors` (skill, before 9.1), `parametric-derivatives` (9.1), `parametric-second-derivatives` (9.2), `parametric-arc-length` (9.3), `vector-derivatives` (9.4), `vector-integrals` (9.5), `planar-motion` (9.6).

## FRQs

- `parametric`, `frq-u9-motion-speed`: A particle in the plane from its velocity components (calculator): speed at a time, when speed equals a value, position from an initial point, total distance. File `calculus-bc/data/frq/frq-u9-motion-speed.json`.
- `parametric`, `frq-u9-motion-tangent`: A parametric curve (calculator): dy/dx and the tangent line at a time, where y is decreasing (from dy/dt), the acceleration vector, distance traveled. File `calculus-bc/data/frq/frq-u9-motion-tangent.json`.

## Stimulus sets (at least these, besides your topics' own sets)

- `graph` in `parametric-derivatives`: a parametric path with direction arrows and two marked times.
- `table` in `vector-integrals`: x′(t) and y′(t) at four times with the initial position.
- `graph` in `planar-motion`: a path with the velocity vector drawn at one point.

## Files you own

For each topic id above: `calculus-bc/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`, and its `figures/`/`labels/` entries; the FRQ files above; your figures in `calculus-bc/figures/` (ids starting with your topic ids); `scripts/apcalcbc-figures/author-b.mjs` if you generate figures; your report `docs/apcalcbc-reviews/self-b.md`.

## Notes for your topics

9.1-9.3 are free (proposed), so they are the first BC lessons a visitor sees: make them excellent. Speed is a magnitude; position from velocity adds the initial value; the `\,dt` is never dropped; the second derivative divides by dx/dt again (framework.md section 7, items 9-11).
