# AP® Physics 1: Phase 0 dependency map

The map is `docs/apphys-dependency-map.json`. It is checked by
`node scripts/check-apphys-map.mjs --check` (library `scripts/lib/apphys-map.mjs`, tests
`scripts/test/apphys-map.test.mjs`); `--order` prints the course order. If this file and the JSON
disagree, the JSON is right. Unit and topic facts come from `docs/apphys-ced-map.json` (our own
words, from `docs/apphys-research/framework.md`); no CED text is reproduced. Open questions are in
`docs/apphys-needs-author.md`.

## Counts

| | |
|---|---|
| Chapters | 9: Units 1-8 (CED weights) and one skills chapter, "Math you need" |
| Topics | 48: the 43 CED topics in CED order, 5 math topics |
| Concepts | 203, each with its terms and aliases |
| Pulled-forward short versions | 1 entry in `circularDependencies` (weight in 2.2) |
| Preview boxes | 0 |
| Everyday words | 13 (speed, distance, position, mass, weight, gravity, friction, pressure, density, pulley...) |
| Planned tools | 12 simulators (the 11 trainers of spec section 6 and the justification trainer), 12 FRQ themes, 15 stimulus themes, 9 comparison tables, 8 pathways |

Concepts per chapter: math 26, Unit 1 32, Unit 2 50, Unit 3 19, Unit 4 13, Unit 5 21, Unit 6 15,
Unit 7 12, Unit 8 15. Authors add a concept to the map, with `taughtIn` and `dependsOn`, whenever a
topic teaches a term the map does not have; the check then holds every page to it.

## Format

As `docs/apchem-phase0.md`, with these differences:

- `practices[]` are the three physics practices with `skills` 1.A-1.C, 2.A-2.D, 3.A-3.C,
  `mcqWeight` and `frqWeight` (third-party figures, unverified). Practice 1 (Creating
  Representations) has `mcqWeight: [0, 0]`: it is free response only (the content check enforces
  it on single and multi items).
- FRQ themes have type `MR`, `TBR`, `LAB` or `QQT`, the exam's four types.
- Stimulus themes may be `diagram` (a scene picture) as well as table, graph, setup, model.
- `REQUIRED_SIMULATORS` in `scripts/lib/apphys-map.mjs` lists the eleven trainers of spec section 6
  plus the justification trainer; each must be planned in some chapter exactly once.

Slugs and ids never contain the token "ap" (spec decision 2); the check also warns on the letters
"ap" inside a topic id.

## Course order

Units in CED order. Each math topic sits right before the topic that first needs it.

| Where | Order |
|---|---|
| Before 1.1 | *math-units* (SI units, prefixes, conversions, scientific notation, significant figures) |
| 1 Kinematics (10-15%) | 1.1 scalars-vectors, *math-symbols*, 1.2 motion-quantities, *math-proportional*, *math-slopes-areas*, 1.3 motion-representations, 1.4 reference-frames, *math-trig-components*, 1.5 motion-2d |
| 2 Force and Translational Dynamics (18-23%) | 2.1 systems-center-of-mass … 2.9 circular-motion |
| 3 Work, Energy, and Power (18-23%) | 3.1 kinetic-energy … 3.5 power |
| 4 Linear Momentum (10-15%) | 4.1 linear-momentum … 4.4 collisions |
| 5 Torque and Rotational Dynamics (10-15%) | 5.1 rotational-kinematics … 5.6 rotational-second-law |
| 6 Energy and Momentum of Rotating Systems (5-8%) | 6.1 rotational-kinetic-energy … 6.6 orbits |
| 7 Oscillations (5-8%) | 7.1 shm-intro … 7.4 shm-energy (names unverified) |
| 8 Fluids (10-15%) | 8.1 density-fluids … 8.4 fluid-flow |

Why each math topic sits where it does:

- **Units, prefixes and sig figs before 1.1**: the first measured quantity is a position in meters.
- **Symbols before 1.2**: Δx/Δt is the first equation, and `delta-notation` is what 1.2 uses.
- **Proportional reasoning and slopes/areas before 1.3**: the constant-acceleration equations
  (`kinematic-equations`), the free-fall square laws and slope/area of motion graphs are the first
  uses of `proportional`, `square-relationship`, `slope` and `area-under-graph`.
- **Trig and components before 1.5**: projectiles are the first place a vector is resolved
  (`vector-components`, `sine-cosine`). 1.1-1.4 are one-dimensional by the CED's own boundary.

All five publish with Unit 1 (a skill topic publishes when its own chapter and its anchor's
chapter are both in `published.json`).

## Pulled-forward short version

| Short version | Taught in | Full treatment | Why |
|---|---|---|---|
| weight ("F_g, Earth on block") | 2.2 (free-body diagrams) | 2.6 gravitational-force | every FBD from 2.2 on needs the downward pull of Earth; 2.6 owns Newton's law of gravitation, the field and apparent weight |

## Choices worth knowing

- `net-force` is taught in 2.2 (an FBD's forces add to it), so 2.4 (`translational-equilibrium`) and
  2.5 (`second-law`) build on it. It depends on `vector-components`, which is why trig sits before
  1.5 and not later.
- `system` (2.1) is the root of energy, momentum and `closed-system`; conservation laws (3.4, 4.3,
  6.4) each depend on `external-force` (2.3) so a justification that names the condition can be
  checked against the order.
- Waves, sound, circuits, electric and magnetic forces are not in the map (moved out of the course;
  the test asserts no concept term mentions them).
- `kepler-third` is a concept of 2.9 (derived from F_g = ma_c); Kepler's first and second laws are
  excluded and have no concept.
- Each unit's `tools` entry is a plan, not a promise of a page; `physics/data/pages.json` `tools[]`
  is what is registered, and a tool is built only when its data file exists and its context topic
  is published.

## The ordering rule

As AP® Chemistry: no concept used before the topic that teaches it, except everyday words and
declared preview boxes (`<aside class="phys-preview" data-concept="…">` backed by a
`circularDependencies` entry with resolution `preview`). Pages declare their topic with
`<body data-topic>` (the generator writes it) or `<meta name="phys-topic">`; text inside
`.phys-preview` or `.phys-nav-ref` is exempt. Question files are read the same way (q, options,
stimulus, why).
