# AP Macroeconomics: cleanup round, pass 3 (2026-11-11, builder c6)

Judge: `docs/tool-review/pass2/judge-b.md`, plus the lead's list in `docs/tool-review/CLEANUP.md`. Shots:
`/home/claude/shots/pass3/macroeconomics/<tool>_before_d.png`, `_after_d.png`, `_after_p.png`. No fact, answer or
scoring changed. The shared engine (`mac-graph.js`) and shell (`mac-tools.*`) are untouched.

| Tool | What the judge said | What I did | Now |
|---|---|---|---|
| Indicators lab | FAIL: opens on seven empty dashed columns. | Opens with transaction 1 already placed (its token in its column, its card above, the caption says why); New economy also starts at 1. Next reads "Next transaction (2 of 8)". | PASS |
| Reserves lab | FAIL: three graphs plus a six-link list, about 45 labels after one press. | One graph at a time on every screen. Opening: the reserve market alone. After an action: numbered step tabs (1 Reserves, 2 Money, 3 AD-AS) and a Next button walk the chain; the chain strip under the graph shows only the links reached so far (phone: only on the AD-AS step, and the numbered tabs are the steps). Enlarge still shows all three graphs together. | PASS |
| Multiplier lab (lead) | Drills still use the old bars. | The multiplier and total drills draw the Explore spending rounds (spent falls to the next round, saved leaks to the tank); the title gains the total once it is found. The money drill draws the Explore banks; amounts kept and lent, and the total, stay hidden until their step is answered ("New money: up to ?"). The unused bar helper is gone. Two decimals in the drill rounds, so $0.75 is not shown as $0.8. | PASS |
| Graph studio | TOUCH UP: 8 graph chips (hint covers the question: shared, not mine). | Graph chooser is a select, as in Micro. | PASS (hint placement left to the shared fix) |
| Policy chain | TOUCH UP: 5 chain chips; tiny unreadable thumbnail strip with empty placeholders. | Chain chooser is a select; numbered dots (done, now, to come) replace the thumbnail strip on the stage; the "1 of 6 links" pill is dropped (the dots say it). Phone: one link line and no title above the graph so it fits. Enlarge still shows every station. | PASS |
| PPC and trade | TOUCH UP: 6 "What happens" chips; readout pills far below the point. | Two events in view (Better technology, A recession) with the other three and Start over behind More (phone: one scrolling row). The readout ("40 robots, 57 pizzas", "next 10 robots cost 8.5 pizzas") is drawn beside the point, measured so it never crosses the curve; on or off the curve stays in the caption. | PASS |
| AD-AS lab, Forex lab | PASS | Untouched. | PASS |

Open, not mine: on a phone, Next in Policy chain scrolls the page by about 90 px (the studio shell, also before this
pass); the hint bubble and halo findings belong to the shared fix.
