# Plan: AP® Macroeconomics, Reserves lab (tools v2)

## Tool and page
- Page `macroeconomics/tools/reserves-lab.html`; scripts `macroeconomics/assets/tools/reserves-lab.js` and `.css`,
  model `macroeconomics/assets/tools/math/reserves-lab.js`, data `macroeconomics/data/tools/reserves-lab.json`
  (contexts ample, limited, multiplier).
- Premium. Rollout row 116, group E, wave 19. Overlaps Policy chain (merge table): owner decided no merges, so this
  tool stops at the policy rate and interest rates; the full chain to output is Policy chain's screen.

## The one idea (two tabs)
1. Ample reserves: the Fed moves the policy rate by moving its administered rates; adding reserves does nothing.
2. Limited reserves: open market operations, the discount rate and the reserve requirement move the money supply,
   and so the interest rate.

## Research
- Chair the Fed, FRBSF ([frbsf.org](https://frbsf.org/?p=11507)): one lever, the economy answers. Take: one lever per screen.
- Money creation tool ([ihelfrich.github.io](https://ihelfrich.github.io/macroprep/interactive/money-creation-tool.html)) and
  NetLogo Bank Reserves ([ccl.northwestern.edu](https://ccl.northwestern.edu/netlogo/models/BankReserves)), search
  results only: banks and reserves drawn as places. Take: reserves as something you can see in a vault.
- The Fed's own explainer of ample reserves and IORB (builder to open on federalreserve.gov).

## Old tool inventory (origin/main)
| Old | v2 |
| --- | --- |
| Framework switch ample or limited | Explore: two tabs |
| Five Fed tools (IORB, ON RRP rate, open market operations, discount rate, reserve requirement) with raise and lower buttons (10 buttons) | Tab 1: IORB is the main control, ON RRP a quiet second; tab 2: open market operations main, discount rate and reserve requirement quiet |
| A tool that does nothing in the framework says so with the reason | Kept: buying bonds in tab 1 is a quiet tap whose result is "rate unchanged" |
| Three linked graphs: reserve market, money market, AD-AS | Tab 1 reserve market; tab 2 money market; AD-AS to "?" (a small linked figure) and Test yourself; the full chain is Policy chain |
| Chain under the graphs lit link by link | Cause line |
| Details: the tool table for both frameworks, money multiplier worked | "?" |
| Drill kinds tool, shift, multiplier; shift step `reserves-lab:<context>:shift` | Test yourself unchanged |
| `?seed=`, `#quiz`; Premium gate | Kept |

## Design
- Picture: the Federal Reserve building on the left with a rate board (IORB, ON RRP), a row of banks with vaults of
  reserves (stacks sized by the quantity of reserves), and the reserve market graph (`reserves` kind: RD flat in the
  ample range, RS vertical) hung as the building's big board.
- Tab 1 main control: drag the IORB rate (the flat part of RD, `K.curve` vertical shift); the policy rate tag and the
  banks' lending signs follow. Quiet: buying bonds adds reserve stacks to the vaults and RS moves right, the rate stays.
- Tab 2: the same banks, a bond desk at the Fed, the money market graph (`money` kind). Main control: drag MS (buy or
  sell bonds animates bonds and reserves trading places). Quiet: discount window sign and the reserve requirement.
- Cause line: "IORB up 0.5 → banks keep reserves at the Fed → policy rate up 0.5 → loan rates up".
- Outside the picture: tabs, purpose line, Show me how. About 25 words.

## Science to verify
- Ample reserves framework (authoring guide, decision 7): administered rates set the floor; RS crosses in the flat
  part; reserve supply changes there leave the rate alone. Check against the Fed's Policy tools pages.
- Limited reserves: OMO shift MS; discount rate and reserve requirement directions; money multiplier 1 / rrr applied
  to excess reserves (`ApMacroCalc.maxMoneyChange`); a cash deposit does not change the money supply at first.
- Every question names its framework; the reader report miss (a limited tool in an ample question) stays as the slip.

## Reuse
- `K.curve` from forex lab, here on a vertical shift of RD's flat part (the engine already moves it "up or down").
- `ApMacroGraph` `reserves` and `money` kinds; drill unchanged.
- Not the first Macro kit2 tool in rollout order.

## Risks reviewers will likely block on
- The rate labels on the flat RD and the IORB tag colliding at 360 px.
- Reserve stacks must be proportional to the drawn quantity of reserves.
- Dropping AD-AS from Explore must be logged twice (brief and owner log).
- Byte identical: `build-apmacro --check`; `apmacro-graph` tests after any engine option.
