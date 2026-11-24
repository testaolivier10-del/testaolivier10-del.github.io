# Tools v2 plans, group soc (AP® Environmental Science, AP® Psychology, AP® Human Geography)

Plans only (owner decision 2026-11-23: a ready plan for every remaining tool, so each build starts from it). Nothing
here is built. Each plan follows `docs/tools-v2-standard.md` and `docs/tools-v2-builder-brief.md`; the order is
`docs/tools-v2-rollout.md` section 5. Not planned here: APES Water pollution and Energy flow (done), AP Psych Brain map
and Neuron (in progress on `claude/tools-v2-brain-map` and `claude/tools-v2-neuron`).

Before building:
- AP Psych tools need the course adapter `ApPsychTools.kit2` and the kit loading in `scripts/build-appsych.mjs`,
  which arrive with the Brain map. Start them after it is integrated on `claude/tools-v2-all`.
- AP HuG has no adapter yet. The first HuG tool built adds `ApHugTools.kit2` to `human-geography/assets/tools/hug-tools.js`
  (a copy of the Psych one) and kit loading to `scripts/build-aphug.mjs`. In rollout order that is Model studio.
- APES is on kit2 already (per page `"kit2": true`; each tool calls `K.on(s)` in its studio hook).
- Every "moved out of Explore" line in a plan is a decision made for the owner: log it in the tool's brief and in
  `docs/tools-v2-owner-log.md` when the tool is built.
- Group R tools (Article studio, Evidence builder, FRQ coach) follow the owner's answer to rollout question 4 (given
  for Design drills, 2026-11-18): practice tools stay tools, with a real free play Explore.

## Tools in rollout order

Difficulty: simple (one screen, art mostly exists), medium (two or three tabs, or one new scene), heavy (four tabs,
much new art, a shared piece or a fragile shared file).

| Wave | Tool (use rank) | Plan | Difficulty |
|---|---|---|---|
| 2 | APES Cycles (31), Free | `apenv-cycles.md` | heavy: four landscapes, a tap per process, atoms that travel |
| 5 | HuG Model studio (131), Free | `aphug-model-studio.md` | heavy: 21 figures (5 new), snap mode on the shared `hug-model.js`, adds the HuG adapter |
| 7 | APES Calculation studio (68), Free | `apenv-calculation-studio.md` | medium: four drawn scenes; lifting the Chem chain into the kit as `K.setup` would make it heavy |
| 9 | Psych Article analysis studio (84), Free | `appsych-article-studio.md` | medium: two tabs on one drawn study |
| 9 | Psych Evidence builder (98), Premium | `appsych-evidence-builder.md` | medium: one desk scene, drag and link, no grading in Explore |
| 9 | HuG FRQ coach (139), Premium | `aphug-frq-coach.md` | simple: one booklet scene, a verb ladder |
| 10 | APES Earth and climate (32), Premium | `apenv-earth-climate.md` | heavy: four tabs (orbit, globe cells, mountain, Pacific section) |
| 10 | APES Climate change (41), Premium | `apenv-climate-change.md` | heavy: four tabs, many drawn photons and molecules (perf) |
| 10 | APES Population growth (42), Premium | `apenv-population-growth.md` | medium: three tabs, a herd that must match the count |
| 10 | APES Soil texture (57), Premium | `apenv-soil-texture.md` | medium: two tabs; the triangle plus a drawn soil column |
| 10 | APES Age structure (65), Premium | `apenv-age-structure.md` | simple: one screen, a pyramid of people, two knobs |
| 10 | APES Dose and response (66), Premium | `apenv-dose-response.md` | medium: three tabs, 100 drawn mice (perf) |
| 10 | APES Energy chain (67), Premium | `apenv-energy-chain.md` | medium: two tabs, reuses Energy flow's heat measure |
| 10 | APES Air pollution (83), Premium | `apenv-air-pollution.md` | medium: two tabs, sun on an arc, animals with pH limits |
| 14 | Psych Development (80), Premium | `appsych-development.md` | heavy: four tabs, one person drawn at many ages |
| 14 | Psych Conditioning lab (97), Premium | `appsych-conditioning-lab.md` | heavy: three scenes (dog, rat with a cumulative recorder, a bedroom) |
| 14 | Psych Memory lab (99), Premium | `appsych-memory-lab.md` | medium: three tabs, typing on phones |
| 14 | Psych Sensation and perception (122), Premium | `appsych-sensation.md` | heavy: four tabs, a real afterimage, `K.spots` on a street scene |
| 14 | Psych Social influence (123), Premium | `appsych-social-influence.md` | heavy: four rooms of people, published values only |
| 15 | Psych Stats lab (124), Premium | `appsych-stats-lab.md` | medium: three tabs on `K.handle` (crowd curve, balance beam, scatter) |
| 22 | HuG Scale lab (86), Free | `aphug-scale-lab.md` | medium: units that split in place on inline Country A paths |
| 22 | HuG Population lab (114), Premium | `aphug-population-lab.md` | medium: the DTM road and a pyramid of people |
| 22 | HuG Diffusion lab (130), Premium | `aphug-diffusion-lab.md` | medium: two tabs on Country A |
| 22 | HuG Map reader (133), Free | `aphug-map-reader.md` | medium: morphs between six map types (the hard part) |
| 22 | HuG Borders lab (137), Premium | `aphug-borders-lab.md` | heavy: four tabs of new art the visuals review asked for |
| 22 | HuG City lab (138), Premium | `aphug-city-lab.md` | medium: three tabs; the city models move to Model studio |

Totals: 26 plans (10 APES, 8 Psych, 8 HuG): 2 simple (FRQ coach, Age structure), 15 medium, 9 heavy. Energy chain
and Stats lab, restyle sized in the rollout, sit at the easy end of medium. By the builder brief's speed rule
(simpler tools first in the queue), inside each wave start with the simple ones: FRQ coach in wave 9, Age structure
in wave 10, Stats lab before the heavy Psych tools if waves 14 and 15 run together.
