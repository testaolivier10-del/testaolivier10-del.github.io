# Plan: AP® Statistics, Data explorer

## Tool and page
`statistics/tools/data-explorer.html`; scripts `statistics/assets/tools/data-explorer.js`,
`statistics/assets/tools/math/data-explorer.js` (`ApStatMath.dataExplorer`), `data-explorer.css`; data
`statistics/assets/tool-data/data-explorer.json`. **Free.** Rollout row 54, group G, wave 13, marked restyle (control on
the picture; three plots at once; 34 controls, 20 of them the dots).

## The one idea (two tabs)
1. **Mean and median:** drag one value far out: the mean (the balance point) follows it, the median (the middle
   value) barely moves.
2. **Outliers and the boxplot:** the box holds the middle half; a value past 1.5 × IQR from the box is an outlier.

## Research
- Seeing Theory "Basic probability: expectation" and the mean as a balance (https://seeing-theory.brown.edu/basic-probability/index.html):
  a seesaw. Take: the mean as the fulcrum that balances the dots.
- Art of Stat "Explore Quantitative Data" (https://artofstat.com/web-apps): drag a point and watch mean and median.
  Take: both lines on one axis with the values.
- StatKey "One quantitative variable" (https://www.lock5stat.com/StatKey): dotplot plus summaries. Leave: the tables.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Data sets: commute times, quiz scores, resting pulse rates | data picker beside "Show me how" |
| Dotplot, histogram and boxplot on one shared axis | tab 1 the dotplot (people); tab 2 the boxplot over the dotplot; the histogram in tab 2 as its quiet companion |
| Drag a dot (mouse, touch, arrow keys; cue "Drag a dot sideways") | main control in both tabs |
| Mean and median lines, bars, box, whiskers, outliers moving with it | kept (tab by tab) |
| Tap a dot: its z score and where it sits against the fences | kept (`K.tap`): in the cause line |
| Bin width (dock) | quiet knob on the histogram (tab 2) |
| Overlays mean ± SD and the 1.5 × IQR fences | ±SD in tab 1 as a quiet toggle; fences always drawn in tab 2 |
| Why; the second sheet: every summary, ordered values, bin counts, the data set chooser | "?"; the chooser is the picker |
| Test yourself: drill, 5 kinds (summary, resist, fences, describe, zscore), each answered step drawn on the dots; record ids `data-explorer:<context>:<step>`; `?seed=`, `#quiz` | unchanged |

## Design
- **Tab 1 picture:** commuters (small people with a car or bus icon by their value) standing on a long plank marked
  in minutes; the plank rests on a fulcrum at the mean, so it balances; a flag stands at the middle person (the
  median). Dragging one commuter far right makes the fulcrum slide after them (the plank tips and settles); the flag
  hardly moves.
- **Tab 2 picture:** the same people; a drawn box (a crate) holds the middle half, whiskers reach to the last
  non outlier, fence posts stand at Q1 − 1.5 IQR and Q3 + 1.5 IQR; a person past a post is marked "outlier".
- **Main control:** drag a person.
- **Animates:** the plank tips and the fulcrum slides; the crate stretches; whiskers grow; a person crossing a fence
  gets the outlier mark (fade in).
- **Cause line:** tab 1 "one commute 22 → 95 min → mean 24.1 → 28.9 → median stays 22"; tab 2 "95 > Q3 + 1.5·IQR =
  53.5 → outlier".
- **Takeaway:** "The median resists outliers; the mean does not."
- **Outside:** 2 tabs, purpose line, data picker, Show me how, cause line: 3 controls, about 20 words.

## Science to verify
Mean as the balance point (sum of deviations is 0), median, quartiles by the course's method (the CED's and the
TI 84's: check how Q1 and Q3 are computed for even n and say it in "?"), IQR, 1.5 × IQR fences, SD with n − 1, z
scores, resistant vs non resistant measures; describing a distribution in context (shape, center, spread, unusual
features: `docs/apstat-authoring-guide.md`; CED Unit 1; OpenStax Introductory Statistics 2e §2.3 to 2.7). Check the
cause line's example numbers against the data set.

## Reuse
`ApStatTools.studioKit2`, `"kit2": true` in `statistics/data/pages.json`; `K.handle` per person (only the dragged one
loud), `K.tap`, `K.tabs`, `K.cause`; the model computes from the dots on screen (keep that). `build-apstat --check`.

## Risks reviewers will likely block on
- Twenty draggable people: one element each, no per frame DOM rebuild; perf at CPU x4.
- People stacked at the same value at 360 px: stack upward, labels only on the dragged one.
- The plank's tilt must settle to the true balance (the fulcrum at the computed mean of the drawn positions).
- Fence posts and the crate edges labelled at 11 px, clear of the people.
