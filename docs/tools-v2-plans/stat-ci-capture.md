# Plan: AP® Statistics, Interval capture

## Tool and page
`statistics/tools/ci-capture.html`; scripts `statistics/assets/tools/ci-capture.js`,
`statistics/assets/tools/math/ci-capture.js` (`ApStatMath.ciCapture`, `ApStatDist`), `ci-capture.css`; data
`statistics/assets/tool-data/ci-capture.json`. **Premium.** Rollout row 53, group G, wave 15, marked restyle (button
driven by nature; level and n controls in the panel).

## The one idea
About C% of intervals built this way capture the true value; a higher level gives wider intervals that miss less
often.

## Research
- Rossman/Chance "Simulating confidence intervals" (https://www.rossmanchance.com/applets/index2021.html): 100
  intervals, captures green, misses red, the running rate. Take: one row per interval, the running rate.
- Online Statistics Education "Confidence interval simulation" (https://onlinestatbook.com/stat_sim/conf_interval/instructions.html):
  95 and 99 percent intervals for the same samples. Take: the same samples rebuilt at a new level.
- Seeing Theory "Frequentist inference: confidence intervals" (https://seeing-theory.brown.edu/frequentist-inference/index.html):
  intervals falling onto the parameter line. Take: each interval arriving, not appearing.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Settings: proportions (students who walk, rare trait), means (normal population, skewed population) | setting picker beside "Show me how" |
| "Build 100 intervals" (cue "Start here: build 100 intervals") | the main action button (button driven on purpose) |
| 100 intervals against a line at the true value; centre dot the statistic; capture green, miss vermillion, thicker and crossed | kept |
| Level (panel): the same samples rebuild their intervals | main control after the first run: the level knob on the picture (`K.drag`, 80 to 99) |
| n (panel): new samples drawn | quiet knob |
| Long run capture rate plotted against the level | kept, small, under the intervals |
| Tap or arrow to an interval to read its parts (statistic, critical value × standard error) | kept (`K.tap`), in the cause line |
| Test yourself: drill, 4 kinds (prop, mean, claim, capture), the stage showing the interval or the 20 simulated intervals; record ids `ci-capture:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Picture:** ring toss at a fair: the true value is a fixed peg; each interval is a ring thrown at it (its centre
  where the sample landed, its width the margin of error); a ring around the peg is a catch (green), a miss lands
  beside it (vermillion, crossed). 100 rings stack in rows.
- **Main control:** Build 100 throws the rings; then the level knob widens or narrows every ring of the same throws.
- **Animates:** rings fly in, row by row (about 1.5 s for 100); a level change stretches every ring from its centre and
  some flip from miss to catch (flash); the capture rate dot moves on the small plot.
- **Cause line:** "95% → 96 of 100 caught → the long run rate is 95%"; "90% → narrower → 91 caught".
- **Takeaway:** "If we took many samples and built a 95% interval from each, about 95% would capture the true value."
- **Outside:** purpose line, setting picker, Show me how, cause line, Build 100: 3 controls, about 20 words.

## Science to verify
One proportion z interval p̂ ± z*√(p̂(1 − p̂)/n) and the t interval for a mean x̄ ± t*s/√n with df n − 1; capture
rate near C in the long run (not exactly C in 100); the skewed population with small n captures less often than C
(say why in "?"); the level sentence and "captures the true proportion" templates; never "95% chance the true value is
in this interval" (`docs/apstat-authoring-guide.md`; OpenStax Introductory Statistics 2e §8.1 to 8.3).

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.drag`, `K.tap`, `K.cause`. The "take a
sample" button pattern shared with Sampling lab and Sampling distributions (wave 15). `build-apstat --check`.

## Risks reviewers will likely block on
- Rings must be the interval's real width on the axis (a ring is drawn as an interval with two end posts, not a
  circle whose diameter misreads as two dimensional).
- 100 rows at 360 px: rows 2 px apart need a minimum tap target; tap acts on the nearest drawn row.
- The capture count from the drawn rings at the end of the animation, not before.
