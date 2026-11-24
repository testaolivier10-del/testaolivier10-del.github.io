# AP® Human Geography, Population lab: tools v2 plan

**Tool and page:** `human-geography/tools/population-lab.html`; scripts `assets/tools/population-lab.js`,
`math/population-lab.js`, `population-lab.css`; data `data/tools/population-lab.json`; test
`scripts/test/aphug-tool-population-lab.test.mjs`. **Premium.** Rollout row 114, group P, wave 22. Twin of APES
Age structure (owner: they stay separate). Split of angles: APES lets the student set fertility directly
(`apenv-age-structure.md`); this tool walks a country through the demographic transition model over time.

**The one idea:** as a country moves through the demographic transition, its birth and death rates and its pyramid
change shape together. Two tabs:
1. Transition: drag the country through the stages; rates, growth and the pyramid follow (CED 2.4, 2.5).
2. Generations: a big or small generation moves up the pyramid as it ages (bulges and notches, 2.3).

**Research:**
- [Annenberg Learner, Demographic transition interactive](https://www.learner.org/wp-content/interactive/envsci/demographics/demo_transition_1.html):
  the DTM curve with the stage named and a pyramid beside it. Take: the stage as a place on the curve.
- [Our World in Data, Age structure](https://ourworldindata.org/age-structure) and
  [CPC pyramids simulator](https://pyramids.cpc.ac.uk/): real pyramids by year, a baby boom climbing. Take: a
  generation moving up as the years pass.
- [dmccreary, Demographic transition](https://dmccreary.github.io/ecology/sims/demographic-transition/): the curve
  with a stage slider. Take only the check of shapes.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Pyramid, Birth and death rates | Tab 1: both on one picture |
| Stage chips 1 to 5 | Tab 1: drag along the DTM curve (main); the stages are named places on it |
| TFR and life expectancy sliders | Not in Explore: the stage drag sets them, and a second control would move with the first (rule 8); they are the APES tool's screen; "?" lists each stage's values; Test yourself keeps them (logged) |
| Readouts for schools, jobs and care | Tab 1: drawn in the town (schools, workplaces, care homes) |
| Migration (net migration rate) | Test yourself (`growth-migration`) and "?" |
| Drills rates, growth, dependency, stage, shape, cohort; contexts `cohort-boom`, `cohort-men`, `cohort-notch`, `dep-old`, `dep-young`, `growth-migration`, `rates-counts`, `rates-young`, `shape-constrictive`, `shape-expansive`, `shape-stationary`, `stage-each`; partTopics `cbr`, `cdr`, `rni`, `dbl`, `nmr`, `migrate`, `stage`, `cause` | Test yourself, unchanged; ids `population-lab:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Transition: the DTM's two lines (births, deaths) drawn across the top of the stage as a road through time from a
  farming village to a city; the gap between them shaded as natural increase. Main control: drag the country's
  marker along the road. The town below changes with the stage (more schools in stage 2 and 3, more care homes in
  4 and 5), and the pyramid of people beside it reshapes (a short climb animation). Cause line: "Stage 2: deaths
  fall, births stay high → RNI 2.4% → doubles in 29 years". Takeaway: "Deaths fall first; births follow a
  generation later."
- Generations: one pyramid of people; tap a band to mark it as a baby boom (or a war notch) and drag the year
  forward: that band climbs one row each five years, and the town's needs move with it (school crowding, then job
  crowding, then care).
Outside the picture: tabs, purpose line, Show me how, time bar on tab 2, cause line: about 25 words, 4 controls.

**Science to verify:** the model's stage values (`CURVE`), RNI = (CBR − CDR) / 10 in percent (the guide: CBR 30 and
CDR 10 give 2%, not 20); rule of 70; dependency ratio = (0 to 14 + 65 and over) / (15 to 64) × 100 (PRB); stage 5
is debated (say so in "?"; the 2024 exam put negative RNI countries in stage 4 or 5); models are models (accuracy
risks section 6: never "country X is in stage 3" as a fact); the country is invented; any real example dated
(UN WPP 2024).

**Reuse:** the HuG adapter `ApHugTools.kit2` (added by the first HuG kit2 tool: see `aphug-scale-lab.md`); kit
`K.tabs`, `K.handle` along the DTM road, `K.tap` and `K.progress`, `K.cause`. The people pyramid may be shared with
APES Age structure only if built together; otherwise each course keeps its own copy.

**Risks reviewers will likely block on:** the pyramid and the town both readable at 360 (stack them: road, pyramid,
town); rate numbers derived from the drawn marker mid drag; the climb must not duplicate or lose people; "five
stages" stated as fact; dashed lines for the "natural increase" gap (use a solid tint).
