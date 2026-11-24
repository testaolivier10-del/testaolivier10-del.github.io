# Tools v2 plans, group sci (AP® Biology, AP® Chemistry, AP® Physics 1)

Owner decision 2026-11-23: a ready plan for every remaining tool, so each build starts from it. These are plans
only; each builder still writes `docs/tools-v2-<tool>-brief.md`, opens the research links (rule 10), and logs
decisions in `docs/tools-v2-owner-log.md`. Standard: `docs/tools-v2-standard.md`; builder rules:
`docs/tools-v2-builder-brief.md`; order: `docs/tools-v2-rollout.md` section 5.

Left out (live, integrated or in progress in `docs/tools-v2-pipeline.md`): AP® Biology osmosis, water potential,
Simpson diversity, energy flow, Hardy-Weinberg, enzyme activity, design drills, chi-square, rates; AP® Chemistry
units and significant figures.

## Shared pieces these plans need
- **AP® Physics 1 adapter:** none exists. The first physics tool built adds `ApPhysTools.studioKit2` in
  `physics/assets/tools/phys-tools.js` (the `ApChemTools.studioKit2` pattern), the `kit2` flag in
  `scripts/build-apphys.mjs` and `"kit2": true` in `physics/data/pages.json`. In rollout order that is Free body
  diagrams (a heavy rebuild); if the speed rule "simpler tools first" puts Torque balance first, it adds it instead.
- **`K.draw`** (group B): not in the kit yet. Built by the first of Graph builder or Free body diagrams; Particle
  diagrams can use `K.drag` if it comes first.
- **Chemistry flasks:** Equilibrium and kinetics, ICE tables and Q vs K share `window.ApChemBeaker` flask art and
  must each keep their own idea (shift, how far, which way).

## Tools in rollout order
| # | Wave | Tool | Plan | Difficulty |
|---|---|---|---|---|
| 1 | 4 | AP® Bio confidence intervals (38) | `bio-confidence-intervals.md` | simple: restyle, practice part exists, `K.handle` exists |
| 2 | 4 | AP® Bio descriptive stats (45) | `bio-descriptive-stats.md` | simple: restyle, one handle per plant |
| 3 | 5 | AP® Bio tree reading (34) | `bio-tree-reading.md` | medium: drawn organisms, node swing animation, two parts kept |
| 4 | 5 | AP® Chem particle diagrams (37) | `chem-particle-diagrams.md` | medium: three tabs of atom rearranging animation |
| 5 | 5 | AP® Bio graph builder (47) | `bio-graph-builder.md` | heavy: rebuild, may build `K.draw` |
| 6 | 5 | AP® Physics 1 free body diagrams (74) | `phys-free-body-diagrams.md` | heavy: rebuild, physics adapter, `K.draw`, friction model |
| 7 | 7 | AP® Physics 1 scaling (108) | `phys-scaling-drills.md` | medium: eight small scenes, 31 relations kept in Test yourself |
| 8 | 11 | AP® Bio meiosis and nondisjunction (33) | `bio-meiosis-nondisjunction.md` | heavy: chromosome and spindle animation through nine stages |
| 9 | 11 | AP® Bio population growth (39) | `bio-population-growth.md` | medium: rabbits and grass tied to N, two tabs |
| 10 | 11 | AP® Bio operons (46) | `bio-operons.md` | heavy: many moving molecules, two operons, mutants |
| 11 | 11 | AP® Bio Hardy-Weinberg drift (59) | `bio-hardy-weinberg-drift.md` | heavy: four tabs, replicate runs cached, genotype drawn beetles |
| 12 | 11 | AP® Bio cell cycle checkpoints (87) | `bio-cell-cycle-checkpoints.md` | medium: dish cells matched to ring dots, two tabs |
| 13 | 11 | AP® Bio signal transduction (88) | `bio-signal-transduction-amplification.md` | medium: tall cascade, honest counts per level |
| 14 | 12 | AP® Chem equilibrium and kinetics (58) | `chem-equilibrium-kinetics.md` | heavy: two tabs, colliding molecules, energy histogram |
| 15 | 12 | AP® Chem titration curve reader (60) | `chem-titration-curve-reader.md` | medium: burette drops, indicator colour, magnifier |
| 16 | 12 | AP® Chem periodic trends and PES (64) | `chem-periodic-trends-pes.md` | medium: drawn atoms to scale, first chem `K.spots` |
| 17 | 12 | AP® Chem ICE tables (72) | `chem-ice-table-drills.md` | simple: one handle, beaker exists |
| 18 | 12 | AP® Chem buffers (105) | `chem-buffer-drills.md` | simple: taps, `ApChemBeaker` was made for it |
| 19 | 12 | AP® Chem Q vs K (107) | `chem-q-vs-k.md` | simple: drag particles, beaker `qk` mode exists |
| 20 | 17 | AP® Physics 1 energy bar charts (62) | `phys-energy-bar-charts.md` | heavy: four tabs, track drag, energy tubes |
| 21 | 17 | AP® Physics 1 fluids (73) | `phys-fluids-tank.md` | medium: five scenes into three tabs |
| 22 | 17 | AP® Physics 1 torque balance (75) | `phys-torque-balance.md` | simple: restyle (adds the physics adapter if first) |
| 23 | 17 | AP® Physics 1 collision lab (77) | `phys-collision-lab.md` | medium: arrow handles, contact and three tabs |
| 24 | 17 | AP® Physics 1 oscillator lab (79) | `phys-oscillator-lab.md` | medium: strip chart pen, two tabs |
| 25 | 21 | AP® Physics 1 lab design (89) | `phys-lab-design.md` | medium: readings from the swing, axis cycling |
| 26 | 21 | AP® Physics 1 projectile lab (90) | `phys-projectile-lab.md` | medium: strobe path, three tabs, zoom |
| 27 | 21 | AP® Physics 1 motion graphs (91) | `phys-motion-graphs.md` | simple: restyle, three live graphs |
| 28 | 21 | AP® Physics 1 rotation lab (92) | `phys-rotation-lab.md` | heavy: rebuild, three scenes with new controls |

Counts: simple 7, medium 13, heavy 8 (28 plans).
