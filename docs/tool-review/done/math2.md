# math2: AP Precalculus and AP Statistics tool fixes (2026-11-10)

Branch `claude/tv-math2`, one commit per tool. Screenshots: `/home/claude/shots/build/precalculus/` and
`/home/claude/shots/build/statistics/` (`_before`, `_after`, `_after_p`). No shared files touched.

## AP Precalculus

**Sinusoid builder (FIX, done).** Ferris wheel scene has its own layout (`wheelLayout`): the wheel always shares
the graph's vertical scale, hub on the true midline and rim on the highest and lowest seats, standing left of the
h axis with the ground on the t axis. The rider's cabin is joined to the point on the curve by a horizontal dashed
line (checked: the cabin height is D + A cos(2π(t - tPk)/T), the scene's true value, so the line is level). Play
traces the true height on the graph as the wheel turns (thin dotted line, every scene). The student's a and d show
as a dashed "your wheel" rim around a hub at d, clipped to the wheel panel, gone when they match. The plot is only
as tall as lets the wheel take about 40% of the width (44% desktop, 156 of 400 units on a phone), so the svg is
letterboxed a little. Phone: wheel and graph side by side; the graph is narrow but readable, handle halos smaller.
Tide, spring and temperature unchanged.

**Exponential and log lab (FIX, done).** Inverse, "Reflect in y = x": y = b^x now stays drawn; a dashed copy folds
over y = x and lands on the log curve; everything is clipped to the plot (no stub past the right edge). Both swapped
points, their labels, the swap line and the drag handle show before and after the fold; during it, a dot rides the
folding copy. Pressing again folds back.

**Unit circle (FIX, done).** The tan view graphs tan θ from -4 to 4 (`gk()` scale factor; dotted lines at each whole
number, labels at ±2 and ±4, ±1 solid), so the branches climb to the asymptotes at π/2 and 3π/2. The static layer
is redrawn on a view change. The Explanation adds one line saying the graph's scale differs from the circle's.
Not done: the first Test yourself item (radius 6, arc π) still shows a bare circle; it may be meant not to give the
answer away, and it was marked "also small".

## AP Statistics

**Sampling lab (FIX, done).** Each unit's value now shows as a color from the start (the "Show each unit's value as
a color" option stays and starts checked), with a key above the dotplot: the variable, low and high values in its
units, five swatches. With values on, roofs go neutral grey so the wall tone is the only meaningful color, and
units not in the sample stay at 55% opacity so their tone still reads. Hillside reads dark, Riverside light: the
one-street cluster, the River Road convenience sample and the high voluntary answers are visible. Phone: the
picture is height-bound and still small (about 180 px); the colors make it read as a heat map. Not done: a phone
layout with one neighborhood at a time (tried hiding street names: it made the houses smaller, since the picture
is height-bound, so reverted).

**Design randomizer (FIX, done).** On a wide stage the bench sits left with its A/B key under it and the results
dotplot fills the right column at full height, before and after a run (the key used to take the second grid cell
and push the results under the bench into an 80 px strip). Rows are now about 100 px each with four designs. The
plot box is measured empty so it resizes. Phone unchanged (stacked, was already readable). Note: with 200 runs in
one row the stacks can still thin to small dots (the existing binning).

**Picture-versus-text mismatches (done).**
- Sampling distributions, Proportion: the 100 figures now carry "each figure = 1% of a very large population"
  (header line on desktop; under the figures on a phone, which give up a line for it; a phone's Two groups view has
  no room and skips it), matching the Explanation's 10% condition.
- Regression lab, Squares: the squares are drawn as pixel squares whose side is the residual on the y-axis; the
  Explanation now says so and that the area is the residual squared in squared y units.
- Not touched: chi-square homogeneity (a count change alters its row total); it is a behavior choice, not a
  picture-text mismatch, and was outside this brief.

## Accuracy
No accuracy flags were listed for these tools. Checked: the Ferris cabin height against the model, tan values and
asymptotes, the reflection mapping (x, y) to (y, x).

## Checks
`build-apprecalc.mjs --check`, `build-apstat.mjs --check`, `check-apprecalc-*`, `check-apstat-*`,
`node --test scripts/test/apprecalc*` (143 pass) and `apstat*` (166 pass), `check-site.mjs`: all clean.
