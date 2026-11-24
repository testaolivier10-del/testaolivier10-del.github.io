# Plan: AP® Biology, Descriptive statistics (tools v2)

**Tool and page:** `bio/tools/descriptive-stats.html`; `bio/assets/tools/descriptive-stats.js` (130 lines), data
`bio/data/tools/descriptive-stats.json` (contexts `radish`, `catalase`, `yeast`, `pulse`, `potato`, `ruler`;
problems `elodea`, `cores`, `leaves`; part topics `sd`, `se`); skill stage `bio-skill-stage.js`. Free. Rollout row
45, group G, wave 4, size restyle.

**The one idea:** one extreme value pulls the mean far more than the median. One screen, no tabs. SD and SE stay
in the cause line as numbers but are not the idea.

## Research
- [Seeing Theory (Brown)](https://seeing-theory.brown.edu/) (known, group row), Basic Probability, expectation and
  variance: values move and the mean and spread redraw at once; take the instant redraw. Builder: open it.
- [StatKey descriptive statistics](https://www.lock5stat.com/StatKey/) (known): a dot plot with summary numbers; take
  dot plot plus summary as one view.
- Desmos activities on mean vs median (known): a dot that drags along a number line; take the knob look.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Drag a dot (values of "Plant height") | Explore: drag one radish plant taller or shorter, main control |
| Add a dot, Remove a dot | Explore: quiet tap to sow a plant or pull one (on the picture, at the end of the row) |
| Reset | Explore: Start over |
| Readout: mean, median, range, SD, SE | Picture: mean and median as two marks on the ruler; SD and SE in the cause line; all values in "?" |
| Contexts (6) | Explore draws radish; others stay in Practice |
| Practice (seeded and 3 worked), `#practice`, `?seed=`, ids `descriptive-stats:<cid>:<part>` | Test yourself "Practice", unchanged |

## Design
- **Picture:** a seed tray of radish seedlings in a row on a bench, a wooden measuring board behind them in cm. Each
  plant drawn (leaves, stem, a red root top). Below the row a ruler strip with the mean as a balance point marker
  (a small fulcrum the plants "sit on") and the median as the middle plant lit; both named on pills.
- **Main control:** drag the top of any plant (K.handle per plant, one cue on the tallest). The mean fulcrum slides a
  lot, the median mark stays or hops one plant.
- **Animates:** the plant grows or shrinks, the mean marker slides, the lit middle plant changes with a soft glow
  when the order changes (plants re sort with a short slide).
- **Cause line:** "one plant to 14 cm → mean 6.1 → 7.0 cm, median stays 5.8 cm → mean pulled by one value".
- **Takeaway:** "With an outlier, the median describes the typical plant better."
- **Outside the picture:** purpose line, Show me how, cause line, Start over. About 20 words.

## Science to verify
- Mean, median, sample SD (n − 1) and SE = s / √n exactly as the AP® Biology Equations and Formulas sheet writes
  them. The SD in the old tool must be the sample SD; check.
- Radish seedling heights realistic for the stated days (invented data, said in "?").
- Trap: the median of an even count is the mean of the two middle values: light both plants in that case.

## Reuse
`ApBioTools.studioKit2` with the practice part. Kit: `K.handle` (per plant), `K.tap`, `K.cue`, `K.cause`,
`K.head`. Same practice part mechanism as chi-square and rates. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- Ten plants with handles at 360 px: each target 44 px wide; the plant row may scroll never, so cap Explore at 10.
- Re sorting mid drag must not swap the plant under the finger (sort on release, mark live).
- Mean and median pills must not overlap when the values are close (stack them with 4 px clearance).
- Keyboard: each plant a range input with arrow steps and a valuetext that updates with the current value.
