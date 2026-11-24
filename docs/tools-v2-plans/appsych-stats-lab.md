# AP® Psychology, Stats lab: tools v2 plan

**Tool and page:** `psychology/tools/stats-lab.html`; scripts `assets/tools/stats-lab.js`, `math/stats-lab.js`,
`stats-lab.css`; plots `psychology/assets/tools/psy-plot.js`; statistics `ApPsychStats` (`psy-stats.js`); data
`data/tools/stats-lab.json`; test `scripts/test/appsych-tool-stats-lab.test.mjs`. **Premium.** Rollout row 124,
group G (graph explorers), wave 15 (with the AP Stats second half; it is a restyle).

**The one idea:** three pictures the exam keeps returning to. Three tabs, one idea each:
1. Curve: where a score sits on the normal curve gives its z score and percentile.
2. Center: one extreme value drags the mean but not the median.
3. Correlation: r says how tightly two things go together, not whether one causes the other.

**Research:**
- [Seeing Theory (Brown University)](https://seeing-theory.brown.edu/): drag data and distributions, the statistic
  updates on the picture. Take: the balance point idea for the mean.
- [rpsychologist, Interpreting correlations](https://rpsychologist.com/correlation/) and
  [Guess the correlation](https://www.guessthecorrelation.com/): drag r and see the cloud tighten; guess r from a
  cloud. Take: dots that move smoothly as r changes, and a cloud students learn to read.
- [GeoGebra, Visualizing z scores](https://mat.geogebra.org/m/MCcevRE6): drag a score, the shaded area and z
  update. Take: the area below drawn and named as a share.

**Old tool inventory:**
| Old | v2 |
|---|---|
| Views Curve, Center, Correlation | Explore: three tabs |
| Score slider and dragging the score along the curve; data set picker (`iq-test` and others) | Tab 1: drag the student's paper along the curve (main); the data set a quiet tap on the test's name |
| "Move one value" slider and dragging the value | Tab 2: drag one weight along the beam (main) |
| "Correlation you aim for" slider (−1 to 1) | Tab 3: drag the r knob on the picture's edge (main); the variables a quiet tap |
| 68-95-99.7 bands, histogram, scatterplot | On the picture, each named once |
| Drills rule, between, zcompare, center, outlier, scatter; contexts `iq-test`, `entrance-test`, `recall-test`, `two-tests`, `two-exams`, `texts`, `sleep-onset`, `quiz-scores`, `screens-sleep`, `study-scores`, `shoe-memory`; partTopics `mean`, `median`, `range`, `newmean`, `center`, `skew`, `r`, `words`, `cause` | Test yourself, unchanged; ids `stats-lab:<context>:<step>` |
| `?seed=`, `#quiz`, Premium gate | unchanged |

**Design:**
- Curve: a gym floor where test takers stand in columns by score, so the crowd forms the bell shape; the bands under
  them in three shades with 34%, 13.5%, 2.35%. Drag one student's paper (bright, named "You") along the floor: the
  people to the left are tinted and counted as a share ("84% scored lower"), z is named on the paper. Cause line:
  "Score 115, mean 100, SD 15 → z = +1 → 84% below". Only whole and half SD shares are named by the rule; between
  them the share comes from `ApPsychStats` and is marked "computed".
- Center: a balance beam with seven weights at their values; the fulcrum sits at the mean and the median weight is
  ringed. Drag one weight far right: the beam would tip, so the fulcrum slides to the new mean while the ring stays
  on the same weight. Takeaway: "The mean chases the outlier; the median stays put."
- Correlation: a class of students as dots on a schoolyard map (screen time across, sleep up); drag r: students
  walk to new places, the cloud tightens or loosens. A small third variable note in "?" ("busy schedules could
  cause both").
Outside the picture: tabs, purpose line, Show me how, cause line: about 25 words, 3 controls.

**Science to verify (authoring guide, statistics):** 68-95-99.7 with exact halves (34, 13.5, 2.35, 0.15) and the
audit's fix (2.5% not "about 3%"); z = (x − mean) / SD; IQ scales mean 100, SD 15 (Wechsler); mean vs median under
skew; r from −1 to 1, sign and strength; correlation vs causation with a named third variable. Every key from an
`ApPsychStats` recipe. The exam has no calculator: Explore names shares at whole and half SDs only.

**Reuse:** `ApPsychTools.kit2` (Brain map branch); `K.handle` on `psy-plot.js` layers (the rollout's G group piece,
first built for Tangent tracer), `K.tabs`, `K.cause`. AP Stats tools are separate (owner) but the crowd as a
histogram and the beam can be reused if AP Stats builds them first.

**Risks reviewers will likely block on:** the crowd of people forming the curve must match the curve's area (counts
per column honest); the knob covering "13.5%" (the audit's open item); percent words for non whole z values must not
use the rule; dots in the correlation tab must move smoothly without new random positions each frame (seeded); the
beam's tipping animation must not suggest the mean is the median.
