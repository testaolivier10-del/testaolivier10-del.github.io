# bio-fix: AP Biology tool fixes (2026-11-10)

Builder for the eight AP Bio FIX tools in `docs/tool-review/bio.md`, plus the tree-reading Questions tab the review
did not finish. Design drills and signal transduction are another builder's. Screenshots:
`/home/claude/shots/build/bio/<tool>_before.png`, `_after.png`, `_after_p.png` (extra pairs for operons explore,
the Hardy-Weinberg guess and compare views, rates percent change and the tree FRQ).

| Tool | What changed | Verified |
|---|---|---|
| Operons | Mutant quiz stage was blank: now strain X in every medium (the sugars or tryptophan, the operon with its switch parts behind "?", mRNA ribbons and enzyme clusters, each = 10; one row per medium on a phone). Explore draws the enzyme band under the DNA (beta-galactosidase as tetramers, lacZ⁻ protein gray and dashed; trp enzymes). lacI, operator and lacZ choices moved from Data & settings into the dock (`primarySel: '.op-genes'`; hidden during the quiz). Caption and pills say the quiz task instead of the Explore state. | lac and trp quiz, Check and reveal, mero, desktop, phone, dark |
| Cell cycle | DNA damage moved next to growth factor on the main panel, default 2% per hour (`damage.value` 0 to 2; validator and stimuli use their own numbers). Damaged cells are drawn red through each phase (new `a.dam` per phase from `popCount`, nothing else in the model changed); a line on the picture gives the damaged share, and says when Rb, cyclin D or ras cannot show anything (full growth factor). | p53 lost empties the G1 hold and turns 45% red; Rb note; phone; dark |
| Energy flow | Pyramids open with widths to scale (log one tap away); taller rows and 14/16 px labels. | desktop, phone |
| Enzyme activity | pH, inhibitor type and amount and the enzyme choice moved into the dock (`data-primary` 7). Phone: the key sits beside Pause, one item per line. | desktop, phone, dark |
| Graph builder | Plot step: each point's controls wrap under its name in the dock (no clipped y or error-bar inputs at 1280). Data set choice at the top of the dock on a wide screen (Details on a phone, where the dock is short). Phone: while the data table is open (first steps) it has the stage to itself; it folds after step 1 and the grid fills the stage. Dock scrolls clear of Next. | step 1 and step 6, desktop and phone |
| Hardy-Weinberg drift | Big pools get smaller beads packed inside the glass (every allele drawn; at N = 1000, 2000 beads). Guess N draws the eight mystery populations large on the stage (jar, views and play hidden; caption says the task). Compare population sizes draws N = 10, 50, 200, 1000 side by side (same start and seed, how many lost an allele), with Back to the jar; it still records the four runs. | N = 1000, guess, compare, phone |
| Population growth | Live N(t) curve under the meadow (K dashed, events marked, grows as Play runs). Honest density: one drawn rabbit is worth the same for the whole run; for logistic the meadow is the largest K the slider allows and the K fence a patch of it in proportion, so a bigger N is always more rabbits. Flood floods and frost frosts the meadow in the year it strikes, with the dip on the curve. Event chips wrap (no "d at year 15"). | K 500 and 2000, flood at year 16, phone, dark |
| Rates | Tangent: bold, across the plot, a one-step rise over run drawn on it, value boxed in the empty corner. Clear the triangles leaves the tangent on purpose (says so); new Hide/Show the tangent button. Percent change gets an Explore view (switch in the dock): a potato core's before and after bars, start cut into tenths, drag (or arrow keys) the after bar; the caption works the formula and shows what dividing by the end would wrongly give. | desktop, phone, dark, keyboard |
| Tree reading, Questions tab (the review's gap) | Answered every item: keys, explanations, the 15.5 million year clock answer and the FRQ rubric are right; table values check against the trees (validator). Wrong on screen: Q3 compares Drawing 1 and Drawing 2 but they were only words; both are now drawn (Read tab drawing code, still) under the paragraph. And every simulator's FRQ says "Use Table 1 above" while `studioQuestions` (bio-tools.js) hid the stimulus for the FRQ, leaving a blank stage; it now stays shown. | all eight steps, desktop and phone, dark |

Accuracy: no accuracy flags were on these tools. New wording checked: beta-galactosidase is a tetramer; trpEDCBA
enzymes build tryptophan; percent change uses the start as the base.

Checks: `node scripts/build-apbio.mjs --check`, `check-apbio-content.mjs`, `check-apbio-map.mjs`,
`node --test scripts/test/apbio-*` (71 pass) and `node scripts/check-site.mjs` all clean.

Shared-file note for the merge: `bio/assets/tools/bio-tools.css` (rules appended at the end, one block per tool)
and one line in `bio/assets/tools/bio-tools.js` (`studioQuestions`) are shared with the design drills and signal
transduction builder.

Not done: the review's small LEAVE notes (confidence interval labels, descriptive stats axis, osmosis chips, Simpson
label, tree-reading Build blank start and lizard icon) were not in scope. Population growth rabbits are still small
on a 390 px phone (the meadow is 400 units wide); the curve under it carries the story there.
