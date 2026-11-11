# AP Statistics: cleanup round (pass 3, 2026-11-11, builder c8)

Judge file: `docs/tool-review/pass2/judge-c.md`. Screens: `/home/claude/shots/pass3/statistics/<tool>_before_d.png`,
`_after_d.png`, `_after_p.png`. Counts as P / L / N / C / W on the opening screen. No fact, answer or scoring changed.

| Tool | Judge said | What I did | Now |
|---|---|---|---|
| Chi-square lab | TOUCH UP (lead: dense). Colored strip on the curve's axis reads as random blocks; coach covers "Which test". | The strip is named under the axis: "Strip on the axis: each cell's share of χ², end to end" (it is the 12 cells' contributions laid end to end, ending at χ²). | PASS. 2 / 20+ (table cells, the idea) / 2 / 8 / 35. The coach is the shared builder's. |
| Interval capture | PASS (explanation long). | Opening caption trimmed to two short sentences. | PASS. |
| Data explorer | TOUCH UP. Draggable orange dot not marked; histogram "5" sits on the mean line. | Until the first drag, the dot farthest from the mean wears a dashed ring with side arrows (pulsing unless reduced motion). Bar counts are drawn above the mean and median lines with a halo. | PASS. |
| Design randomizer | TOUCH UP. Small greenhouse beside a large empty plot; "Estimates land here" on the dashed line; pot numbers and plant values about 6 px. | Before the first run the greenhouse (or room) is the whole stage; the estimate plot and its legend join after the first run, and the scene keeps the wider column (1.7 : 1). Pot numbers 17 and plant values 21 in the scene's units (about 9 to 11 px at 1280, double before the run). | PASS. |
| Distribution areas | PASS. | Left. | PASS. |
| p-value explorer | PASS. | Left. | PASS. |
| Probability trees | TOUCH UP. Six probability buttons plus two simulate buttons; caption over 40 words. | Simulate 100 and 1,000 show in the Simulation view, where their result is drawn, and not beside the tree. The caption no longer repeats the simulated share (its pill shows it). | PASS. 1 / 14 (the tree) / 1 / 7 / 30. |
| Regression lab | PASS. | Left. | PASS. |
| Sampling distributions | TOUCH UP. Seven population chips. | Not changed: the chip row is the shared "More" builder's. | Waits on the shared "More". |
| Sampling lab | TOUCH UP (lead: dense). Phone neighborhood about 220 px; "Hillside" and "Riverside" collide with street names; page scrolls after Draw. | Before the first sample the neighborhood and its color key are the whole stage (full width on the phone); the dotplot and legend join after the first draw. House numbers are lifted above the houses (the next house covered them at the larger size; the random-integer strip names houses by them). On a small picture the area names sit at the right edge, clear of the street names; the phone legend is hidden (the plot names μ and the orange dot is the sample). A real tap on Draw at 390 x 844 did not scroll the page. | PASS on open. After a draw the phone neighborhood is about 240 px wide, stacked with the plot. |

Checks: `build-apstat.mjs --check`, `check-apstat-content.mjs`, `check-apstat-map.mjs`, all `apstat*` tests,
`check-site.mjs`, `check-weight.mjs`: clean.
