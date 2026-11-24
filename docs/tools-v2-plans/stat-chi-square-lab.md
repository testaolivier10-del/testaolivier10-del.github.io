# Plan: AP® Statistics, Chi-square lab

## Tool and page
`statistics/tools/chi-square-lab.html`; scripts `statistics/assets/tools/chi-square-lab.js`,
`statistics/assets/tools/math/chi-square-lab.js` (`ApStatMath.chiSquareLab`, through `ApStatDist`),
`chi-square-lab.css`; data `statistics/assets/tool-data/chi-square-lab.json`. **Premium.** Rollout row 52, group G,
wave 13, marked rework (30 controls; 118 words on the stage; the count slider in the panel).

## The one idea
χ² adds up how far each cell's count is from what we would expect if there were no association; the cells far from
expected drive it, and a large χ² gives a small p-value.

## Research
- The integrated AP® Biology Chi-square (`docs/tools-v2-chi-square-brief.md`, a choice chamber of pill bugs): the
  nearest v2 picture on the kit. Take: its stage layout, the observed vs expected drawn as real things, its review
  lessons (Explore empty after a deep link; figures collapsing in Test yourself).
- StatKey "Chi-square test for association" (https://www.lock5stat.com/StatKey): a randomization distribution of χ².
  Take: "Chance table" as tables drawn under H₀.
- Rossman/Chance "Chi-square" applets (https://www.rossmanchance.com/applets/index2021.html): cell contributions.
  Take: the contributions as parts of one bar.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Studies: lunch choice at three schools (homogeneity), age and news source (independence), fertilizer and flowering (homogeneity, an experiment) | study picker beside "Show me how" |
| Two way table: observed, expected, heat colour of each component (orange O above E, blue below); totals | the picture (below), colours kept |
| χ² distribution for the table's df, statistic marked, p-value shaded, a stacked bar of the components (selected cell outlined in both) | kept under the table |
| Tap a cell and change its count: slider, − and +, arrow keys on the cell (cue "Change a count, or tap any cell") | main control: the cell's pile knob (`K.handle`, vertical) on the picture; keys on the cell; the slider and − + go |
| "Chance table": a table drawn from H₀ | kept (secondary) |
| "Step by step": hide E and fill one cell at a time with the formula | Test yourself (its "Carry out the test" kind asks E cell by cell); logged |
| Test switch homogeneity or independence, saying when it does not fit the design | follows the study; the "does not fit" sentence in "?" |
| Test yourself: drill on `chiSquareLab.generate`, 2 kinds (Carry out the test: an expected count, its component, df, χ², the p-value, decision, conclusion; Choose and set up: the test, hypotheses, expected counts condition), the table filling on the stage; record ids `chi-square-lab:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** for the lunch study, a cafeteria counter at each school: each cell is a stack of lunch trays (pizza,
  salad, sandwich) with a thin line at the expected height; the gap between the stack and its line is tinted orange
  (more than expected) or blue (fewer). Each study has its own objects (people with phones for news source, pots of
  flowering plants for fertilizer). Below, the χ² curve with the statistic as a marker and the p-value shaded; the
  components stacked as one bar along its axis.
- **Main control:** drag a stack up or down (the tapped cell's knob).
- **Animates:** trays are added or removed one by one; the other cells' expected lines shift (they depend on totals)
  smoothly; the component bar and the marker slide; the p-value shading grows or shrinks.
- **Cause line:** "pizza at B: 40 vs 28.0 expected → component 5.14 → χ² 9.30 → p = 0.054".
- **Takeaway:** "Big gaps from expected make a big χ² and a small p-value."
- **Outside:** purpose line, study picker, Show me how, cause line, Chance table: 3 controls, about 20 words.

## Science to verify
Expected count = row total × column total / table total; component (O − E)²/E; df = (r − 1)(c − 1); p-value from the
χ² distribution (ApStatDist, check to 4 places against R `pchisq`); homogeneity vs independence chosen by the design
(several samples vs one sample with two variables); conditions: random, 10%, all expected counts at least 5; the
conclusion templates (`docs/apstat-authoring-guide.md` "Writing conclusions in context"; CED revised 2026-27 unit on
inference for categorical data; OpenStax Introductory Statistics 2e §11.3 and 11.4). Goodness of fit is excluded from
the revised course: not on the picture, not in "?" except a going further line. Changing one count changes the
totals and so every expected count: the picture must show that.

## Reuse
`ApStatTools.studioKit2` (added by the first Statistics tool, Probability trees; check `claude/tools-v2-all`),
`"kit2": true` in `statistics/data/pages.json`; `K.handle`, `K.tap`, `K.cause`. The AP® Biology chi-square's sweep
and frame scripts (`scripts/tools-v2/chi-square-*`) as the pattern for this sweep. `build-apstat --check`.

## Risks reviewers will likely block on
- Deep links `?seed=` and `#quiz` then Explore: a laid out picture (the Biology chi-square blocked on this).
- Stacks over 60 trays at 360 px: one tray per fixed count, stated in "?".
- Expected lines moving when one count changes: rule 8 ("one control never moves another") is not broken because the
  lines are results, not controls; say so in the brief.
- p-value wording: "the probability, assuming H₀, of a χ² this large or larger".
