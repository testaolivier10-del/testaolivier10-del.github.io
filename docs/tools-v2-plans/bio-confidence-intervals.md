# Plan: AP® Biology, Confidence intervals and error bars (tools v2)

**Tool and page:** `bio/tools/confidence-intervals.html`; `bio/assets/tools/confidence-intervals.js` (151 lines),
data `bio/data/tools/confidence-intervals.json` (contexts `yeast-sugars`, `catalase-tissues`, `reaction-hand`,
`cell-length`, `bean-light`; problems `temperature-enzyme`, `fertilizer`, `germination-time`); skill stage
`bio-skill-stage.js`, `bio-skill-problems.js`. Free. Rollout row 38, group G, wave 4, size restyle.

**The one idea:** when the ±2 SE error bars of two groups overlap, the difference may be chance; when they are far
apart, it likely is not. One screen, no tabs.

## Research
- [GraphPad, what you can conclude when error bars overlap](https://www.graphpad.com/support/faqid/1362): the honest
  rule (SE bars vs CI bars mean different things); take the wording for "?".
- [Krzywinski and Altman, Nature Methods "Error bars"](https://www.nature.com/articles/nmeth.2659): pictures of how
  n and SD change the bar; take "more samples, shorter bar" as the quiet control.
- Seeing Theory (Brown) confidence intervals and StatKey (known, group row): drag and resample, the interval
  redraws at once. Builder: open them.

## Old tool inventory (origin/main)
| Old | v2 |
|---|---|
| Drag a mean bar, drag a whisker (SD) | Explore: drag the second group's plants (their mean) up or down, main control |
| Sliders: mean, SD, n for each group; "SD in each group (both)", "n, samples per group (both)" | Explore: n as a quiet chip pair "5 / 10 / 20 plants" (both groups); SD as a quiet handle on the spread of one group. Per group mean, SD, n sliders to Test yourself setups, log it |
| New sample | Explore: "New sample" quiet button (the plants regrow, chance alone) |
| Contexts (5) | Explore: the bean light context drawn; the others stay in Practice |
| Practice (seeded and 3 worked problems), `#practice`, `?seed=`, record ids `confidence-intervals:<cid>:<part>` | Test yourself part "Practice", unchanged (`practice: true`) |

## Design
- **Picture:** two trays of bean seedlings on a lab bench, "Full light" and "Shade", each plant drawn at its height
  in cm against a ruler board behind them. Beside the trays on the same bench a clipboard graph: each tray's mean as
  a bar with ±2 SE whiskers, in the tray's colour; the overlap region tinted when the bars overlap.
- **Main control:** a K.handle on the shade tray's mean line: dragging it grows or shrinks every plant in that tray
  together (heights shift, spread kept). The bar and whiskers on the clipboard follow at once.
- **Quiet controls:** plant count chip (more plants grow in, the whiskers visibly shorten); New sample (plants
  regrow to new random heights, the bars jump).
- **Animates:** plants grow and shrink; new plants sprout; whiskers lengthen or shorten.
- **Cause line:** "means 2.1 cm apart → bars overlap by 0.4 cm → difference may be chance".
- **Takeaway:** "More plants make the bars shorter, so a small real difference shows."
- **Outside the picture:** purpose line, Show me how, cause line, 2 quiet controls. Under 25 words.

## Science to verify
- SE = s / √n and the bar as mean ± 2 SE (AP® Biology Equations and Formulas sheet; CED skill on error bars).
- The overlap rule is a heuristic: overlapping 95% CI bars do not prove "no difference"; non overlapping ±2 SE bars
  suggest a significant difference. Word it as "may" and "likely" (GraphPad, Krzywinski and Altman). Put the nuance
  in `docs/apbio-needs-author.md` if the course wording differs.
- Bean heights plausible (cm range for 2 week seedlings); state they are invented in "?".

## Reuse
`ApBioTools.studioKit2` with the practice part (`{ value: 'practice', practice: true }`), as chi-square and rates.
Kit: `K.handle` (first used in rates for a value on a picture), `K.tap`, `K.cue`, `K.cause`, `K.head`. Bio skill stage
stays for Practice figures. Not the first AP® Biology tool on kit2.

## Risks reviewers will likely block on
- Proportions: drawn plant heights must match the numbers used for the mean and SE (measure in the sweep).
- Whisker ends, the mean labels and the ruler numbers 4 px apart at every width.
- Twenty plants per tray at 360 px: plants stay drawn plants, not dots; may need 15 as the top chip.
- Cause line and overlap tint read from the drawn bars mid animation, not the target values.
