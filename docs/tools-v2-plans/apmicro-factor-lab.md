# Plan: AP® Microeconomics, Factor lab (tools v2)

## Tool and page
- Page `microeconomics/tools/factor-lab.html`; scripts `microeconomics/assets/tools/factor-lab.js` and `.css`, model
  `microeconomics/assets/tools/math/factor-lab.js`, data `microeconomics/data/tools/factor-lab.json` (contexts bakery,
  carwash, orchard, print, mill, clinic).
- Premium. Rollout row 142, group E, wave 24.

## The one idea (two tabs)
1. Competitive: a firm hires workers until MRP equals the wage; a higher product price raises MRP (derived demand).
2. Monopsony: the only employer hires where MRP = MFC and pays the wage read from labor supply, so it hires fewer
   and pays less.

## Research
- EconGraphs labor market graphs ([econgraphs.org/topics/firm](https://www.econgraphs.org/topics/firm/)): market and
  firm side by side, the wage carried across.
- MRU practice (group E row) for hiring from a table.
- The integrated A&P graphs brief (`docs/tools-v2-anp-graphs-brief.md`) for two linked panels on a phone.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Hiring table beside the graph (tabs on a phone), MRP column and curve one color, wage or MFC the other; hired rows light | Explore: the current row on the picture; full table in "?" |
| Competitive: price of a loaf slider, daily wage slider; MRP recomputes, MRP curve shifts (old faded) on the two panel labor graph | Tab 1: main control drag the wage line; quiet knob on the loaf price sign |
| Monopsony: MFC above supply, hire where MRP = MFC, wage from supply, wage bill shaded; minimum wage slider with W min line | Tab 2: main control drag the minimum wage line; MFC and supply drawn |
| Details: the least cost rule worked, the numbers | "?" |
| Drill kinds hire, derived, monopsony, leastcost | Test yourself unchanged, ids `factor-lab:<context>:<step>` |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Tab 1: a bakery's back door with a line of job seekers and the bakers inside; the firm panel (`labor` kind: MRP and
  the wage line W carried from the market panel). Drag the wage line: bakers are hired or leave until the last hired
  worker's MRP is at least the wage; each worker's MRP is drawn as loaves times price on their apron. Quiet: the loaf
  price sign moves MRP (derived demand), the old curve faint solid.
- Tab 2: a mill town where the mill is the only employer; `monopsony` kind (SL, MFC, MRP), the wage bill shaded.
  Drag a minimum wage line up: hiring rises until the minimum wage reaches MRP = SL, then falls; workers at the gate
  follow.
- Cause line: "Wage $90 → 5th worker's MRP $100 ≥ $90, 6th $80 < $90 → hire 5".
- Outside the picture: tabs, purpose line, context picker, Show me how. About 25 words.

## Science to verify
- MRP = MP × MR (MP × P for a competitive seller), never MR × P (trap); hire where MRP = MRC; from a table the last
  worker with MRP at least the wage.
- Derived demand: product price to MRP to labor demand, every link named.
- Monopsony: MFC above SL, hire where MRP = MFC, wage from SL (trap: from MRP or MFC); a minimum wage between the
  monopsony wage and the competitive wage raises both wage and employment.
- Least cost rule MP/P equal across inputs (in "?").

## Reuse
- `K.curve` (horizontal line drag), `ApMicroGraph` `labor` (two panels; `mfc: false` before 5.1) and `monopsony`.
- Not the first Micro kit2 tool in rollout order.

## Risks reviewers will likely block on
- Two panels (market and firm) at phone widths: stack, wage carried across stays readable.
- Worker count drawn equals the hire count at every frame; the MFC and SL labels clear at 360 px.
- The minimum wage line must not move the wage handle of tab 1 (separate state per tab).
- Byte identical: `build-apmicro --check` and `build-apmacro --check`.
