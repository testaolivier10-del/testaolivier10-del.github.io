# Plan: AP® Microeconomics, Firm and market (tools v2)

## Tool and page
- Page `microeconomics/tools/firm-market.html`; scripts `microeconomics/assets/tools/firm-market.js` and `.css`, model
  `microeconomics/assets/tools/math/firm-market.js`, data `microeconomics/data/tools/firm-market.json` (contexts
  quantity, shutdown, longrun, monopoly, monocomp).
- Premium. Rollout row 143, group E, wave 24.

## The one idea (three tabs)
1. Perfect competition: entry and exit move market supply until price equals minimum ATC and profit is zero.
2. Monopoly: produce where MR = MC and read the price from demand, above MC.
3. Monopolistic competition: entry shifts each firm's demand left until it is tangent to ATC.

## Research
- EconGraphs market power and competition graphs ([econgraphs.org/topics/market_power](https://www.econgraphs.org/topics/market_power/)).
  Take: the profit box drawn from the curves.
- MCMR interactive ([iwant2study.moe.edu.sg](https://iwant2study.moe.edu.sg/sg.iwant2study.org/ospsg/index.php/interactive-resources/others/economics/1232-mcmr),
  search result only).
- Flagship time bar (`K.progress`) for the long run as a process.

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Structure switch (three) | Explore: three tabs |
| PC: market beside firm (`pc` kind), "Choose a change" (demand rises, demand falls), P carried as d = MR = AR = P, q where P = MC, profit or loss box | Tab 1: main control drag market demand |
| Run the long run (entry or exit until P = min ATC); old curves faded | Tab 1: the time bar with Play |
| Monopoly: Q where MR = MC, P from demand, profit box, CS and DWL on request, demand slider | Tab 2: main control drag demand; CS and DWL as quiet area taps |
| Monopolistic competition: short run profit, long run tangency, excess capacity | Tab 3: time bar from short run to long run |
| Curve buttons and arrow keys; market and firm as two tabs on a narrow stage | `K.curve`; the panels stack on a phone |
| Drill kinds quantity, shutdown, longrun, monopoly, monocomp; `firm-market:<context>:<step>` | Test yourself unchanged |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Tab 1: a farmers' market of identical apple stalls (the market) and one stall up close (the firm). Drag market
  demand: the price board moves, the firm's d = MR line follows, the firm's crates (q) change, and its cash box shows
  profit or loss as the shaded box. Scrub or Play the long run: new stalls arrive (or close), market S glides, price
  falls to minimum ATC, the box disappears.
- Tab 2: the town's only water company; drag demand; MR follows; the tap count (Q) where MR = MC, the price tag read
  up on demand; profit box; quiet taps show CS and DWL.
- Tab 3: a street of coffee shops; short run profit, then the time bar brings new shops in, our shop's demand slides
  left to tangency with ATC; excess capacity marked (Q vs minimum ATC Q).
- Cause line: "Profit → firms enter → supply right → price down to min ATC → zero profit".
- Outside the picture: tabs, purpose line, Show me how, time bar on tabs 1 and 3. About 30 words.

## Science to verify
- Competitive firm's demand horizontal at the market price (trap); q where P = MC; profit (P − ATC) × q at that q.
- Shutdown below minimum AVC (the `pc` kind puts q = 0); long run zero profit at minimum ATC; entry because of
  profit, not "because demand rises" (trap).
- Monopoly price from demand, never MR (trap); DWL and allocative inefficiency; monopolistic competition long run
  tangency, zero profit, excess capacity, P > MC.
- Stall counts honest: say in "?" the number of stalls is illustrative of entry.

## Reuse
- `K.curve`, `K.progress`, `K.player`; `ApMicroGraph` `pc`, `monopoly`, `monocomp` (named points and areas).
- Not the first Micro kit2 tool in rollout order.

## Risks reviewers will likely block on
- Two panels on a phone (tab 1): stack, P carried across stays legible.
- Profit box labels and P, ATC marks crowding near tangency (tab 3).
- Long run animation: market and firm agree on every frame; timers stop on tab switch.
- Byte identical: `build-apmicro --check` and `build-apmacro --check`.
