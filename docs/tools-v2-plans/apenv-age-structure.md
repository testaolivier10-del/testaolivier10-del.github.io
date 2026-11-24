# AP® Environmental Science, Age structure: tools v2 plan

**Tool and page:** `environmental-science/tools/age-structure.html`; scripts `assets/tools/age-structure.js`,
`math/age-structure.js`, `age-structure.css`; data `data/tools/age-structure.json`; test
`scripts/test/apenv-tool-age-structure.test.mjs`. **Premium.** Rollout row 65, group P, wave 10. Twin of AP HuG
Population lab (owner: they stay separate). Split of angles: this tool is fertility and its future; the HuG tool
walks the demographic transition model through time (see `human-geography-population-lab.md`).

**The one idea:** fertility sets the base of the pyramid, and the base becomes the future population. One screen,
no tabs (CED 3.6, 3.7, 3.8).

**Research:**
- [Our World in Data, Population simulation tool](https://ourworldindata.org/population-simulation-tool): change
  fertility and see the population and pyramid to 2100. Take: fertility as the one control, the future drawn.
- [Annenberg Learner, Demographics interactive lab](https://learner.org/wp-content/interactive/envsci/demographics/demo_help.html):
  set birth and death rates, watch the pyramid. Take: the stable pyramid from a TFR and a life expectancy.
- [CPC population pyramids simulator](https://pyramids.cpc.ac.uk/): real pyramids by year. Take: the three named
  shapes (expansive, stationary, constrictive) as the result words.

**Old tool inventory:**
| Old | v2 |
|---|---|
| TFR slider (1.0 to 7.0) | Explore: the main control, a knob beside a mother and her children drawn at the pyramid's base |
| Life expectancy slider (30 to 85) | Explore: a quiet knob at the pyramid's top |
| Stage chips (Stage 1 to 4 presets) | Test yourself (the stage drills) and "?" (the stage table); not in Explore because the transition through time is the HuG tool's screen (logged) |
| Growth rate, doubling time and dependency readouts | One number on the picture (growth %, with doubling time in the cause line); dependency in "?" |
| Drills rate, tfr, shape, stage, dependency; 12 contexts (`rate-young`, `rate-mid`, `tfr-high`, `tfr-low`, `tfr-near`, `shape-*`, `stage-1` to `stage-4`); partTopics `stage`, `cause` | Test yourself, unchanged; ids `age-structure:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:** a town square at the pyramid's foot; the pyramid built of rows of small people (males left, females
right, five year bands), so the shape is literally people. Main control: drag the children per woman knob on the
mother figure (the number of children beside her changes, 1 to 7). Instant: the pyramid's base widens or narrows
and the bands above follow as that generation ages (a short climb animation up the rows); a mark at 2.1 on the
knob's track named "replacement". Quiet: the life expectancy knob at the top: older bands fill out or thin. One
number on the picture: "grows 2.6% a year" (or "shrinks"). Cause line: "5 children per woman → wide base →
grows 2.6% a year, doubles in 27 years". Takeaway: "A wide base means growth for decades, even if births fall
today" (population momentum). Outside the picture: purpose line, Show me how, cause line: about 22 words, 2
controls.

**Science to verify:** the model's stable population construction (a life table at the chosen life expectancy;
check it against Coale and Demeny model life tables or the UN model tables); replacement TFR about 2.1 where
mortality is low, higher where child deaths are high (UN; accuracy risks doc section 2); growth rate = (CBR −
CDR) / 10 in percent; rule of 70; population momentum (UN WPP 2024 Key Messages). Any real country named needs a
source and year (UN WPP 2024).

**Reuse:** APES kit2; `K.drag` (two knobs), `K.cause`, `K.cue`, `K.head`. Share the people pyramid drawer with the
HuG tool only if both are built close together; otherwise each course keeps its own copy (course layers are
forks). Not the first APES tool on kit2.

**Risks reviewers will likely block on:** people icons too small to read at 360 (rows of 5 year bands; size from
the stage height, never under the 11 px text rule for labels); the pyramid's widths must equal the model's shares
(assert in the sweep); the climb animation must not show a band at a value the model never has; the 2.1 mark and
the value pill colliding with the knob; the town square decoration must not read as data (rule 6).
