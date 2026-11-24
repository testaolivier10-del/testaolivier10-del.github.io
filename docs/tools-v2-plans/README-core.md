# Tools v2 plans, group core (NREMT, Organic Chemistry, A&P)

Written 2026-11-23 (owner decision: a ready plan for every remaining tool, so each build starts from it). Plans
only; nothing was built. Each plan follows `docs/tools-v2-standard.md` and `docs/tools-v2-builder-brief.md`; the
builder still writes `docs/tools-v2-<tool>-brief.md`, opens the research links and logs decisions in
`docs/tools-v2-owner-log.md`.

Not planned here (live, integrated or in progress in `docs/tools-v2-pipeline.md`): NREMT mnemonics, sound trainer,
flowcharts, skill sheets, body map, scenario sim (in progress); Ochem conformations, resonance, arrow pusher, 3D
viewer, reaction predictor (in progress, branch `claude/tools-v2-reaction-predictor`); A&P graphs, pathways, lab
practical, predict, feedback loops, anatomy 3D (in progress).

## The eight tools, in rollout order (use rank)

| Rank | Plan | Difficulty | Note |
|---|---|---|---|
| 30 | `ochem-acid-base.md` | medium | four ARIO tabs on one drawn molecule and pKa ruler; drawing code already exists |
| 43 | `ochem-spectroscopy.md` | heavy | two linked spectra with a vibrating bond and growing splitting trees; 18 compounds, mol builder handoff |
| 44 | `nremt-reference-cards.md` | heavy | four tabs, new posed art (GCS arms, a newborn, a child in a doorway) on the body figures |
| 69 | `ochem-reagent-roadmap.md` | heavy | a 28 station transit map with drawn molecules and phone framing; 122 roads |
| 70 | `anp-calculators.md` | heavy | five animated body scenes from 89 calculators; must not duplicate Predict and Graphs |
| 71 | `anp-word-roots.md` | medium | one organ and one patient picture; only words in the bank (some common ones missing) |
| 103 | `ochem-synthesis.md` | medium | a bench of flasks on the existing engine; build after the roadmap to share the molecule morph |
| 106 | `nremt-formulary.md` | medium | one patient, seven drawn devices, findings that flip Give or Hold |

Speed rule (builder brief): simpler first. A suggested queue: acid base, formulary, word roots, then synthesis
after the roadmap; the four heavy ones one at a time.

## Shared points for every builder in this group
- Kit pieces named in the rollout group rows (`K.sort`, `K.steps`, `K.setup`, `K.audio`) do not exist in
  `assets/course/tool-kit2.js` yet; the integrated tools built their own in the tool file. Add one to the kit only
  when a second tool needs it, small and additive, on `claude/tools-v2-all`.
- Adapters: `nremt/assets/nremt-kit2.js` (`NremtStudio.kit2`: parts with their own stage and dock, `start` for deep
  links), `OchemStudioKit.kit2` in `ochem/assets/tool-shell.js` (`kit2: true` in the registry; Check yourself is the
  last part), `AnpToolKit.kit2` in `anatomy-physiology/assets/tools/tool-kit.js` (`"kit2": true` in `pages.json`).
- Every old record id, deep link and Test yourself item is kept (each plan's inventory table); NREMT and Ochem
  pages keep `?studio=0` and the HTML the flashcard builder and search index read.
- Science checks: NREMT against the National EMS Scope of Practice Model and Education Standards and AHA 2025;
  A&P against OpenStax A&P 2e; Ochem against Klein and Clayden. Contested points go to each course's
  needs author doc.
