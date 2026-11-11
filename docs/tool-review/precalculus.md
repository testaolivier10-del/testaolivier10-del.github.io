# AP Precalculus: tool purpose review (2026-11-10)

Every Explore scene, view, chip and context opened at 1280x800, a landing and one more scene at 390x844, and the
first Test yourself item of each tool. Screenshots: `/home/claude/shots/review/precalculus/` (`_p` = phone).

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Unit circle | Sine and cosine are the height and width of a point turning on the circle; the arc unrolls into the θ axis | FIX (small) | sin, cos view is the idea itself and stays. The tan view graphs tan θ only between -1 and 1, so the climb to the asymptote at π/2 is cut off: give that view its own range (about -4 to 4) |
| Function lab | g(x) = a f(b(x - h)) + k moves, stretches and flips the parent graph | LEAVE | Ghost parent, linked key points and "Play the steps" show the transformation move |
| Exponential and log lab | Linear adds, exponential multiplies; log undoes exp; log rules; semi-log straightens growth | FIX (small) | Bug in Inverse, "Reflect in y = x": the folding curve runs out of the plot frame and leaves a hook past x = 6, and the two swapped points vanish at the end |
| Polar graphs | r against θ drives the polar curve; where r grows or shrinks, and r < 0 | LEAVE | Two linked views with bands. Desktop pictures are small but readable |
| Polynomials and rationals | Factors decide zeros, holes and asymptotes and the sign of f | LEAVE | Factor pins and the sign strip are the idea |
| Rate of change | Equal-interval secant slopes rising or falling = concavity | LEAVE | Secants plus slope bars below; Estimate shades the error gap |
| Regression lab | Pick the model whose residuals have no pattern | LEAVE | The graph and residual plot are the concept |
| Sinusoid builder | A periodic situation (wheel, tide, spring, temperature) is a sinusoid you can read off | FIX | Ferris wheel, the first and main scene: the wheel is drawn on its own scale beside the graph, not linked to it. Tide, spring and temperature are linked and fine |
| Symbolic steps | A rewrite is equal only where both sides are defined | LEAVE | A drill. The domain band under the two graphs is the right picture |
| Vectors and matrices | Parametric motion, vector addition, a matrix as a map of the plane | LEAVE | Beyond the exam. Optional: draw the whole transformed grid in Matrices, not only the unit square |

Totals: LEAVE 7, FIX 3, REDESIGN 0.

## Notes

**Sinusoid builder (FIX).** `sinusoid-builder.js` `shared()`: the wheel gets the graph's vertical scale only if it fits
its panel. The Ferris data swing from 5 to 45 m, so it never fits on desktop or phone. So the wheel is about 3 to 29 m
on the graph's axis while the data run 5 to 45, and no dashed line joins the rider's cabin to the graph. During Play,
the highlighted cabin (about 23 m) and the true point on the graph (about 36 m) are at different heights. As it is, the
wheel is a picture beside a graph. That is the step this trainer exists for (circle to height to sinusoid), and the
unit circle tool already does it right. The picture should be:
- the wheel drawn on the graph's scale: hub at the midline, rim reaching the max and min data lines. Narrow it with
  a short axis break, or put the wheel and graph on one shared h axis with the wheel behind the start of the graph;
- the rider's cabin joined to the current point on the curve by a horizontal dashed line, so turning the wheel
  draws the curve the way "Unroll one turn" does on the unit circle;
- the student's model (a, d) shown on the wheel as well: a ghost rim of radius a around a hub at d, against the
  real wheel, so "raise a" means "your wheel is too small".

With a = 30 (Key points shot) the stage switches to a tiny wheel above the graph. The same fix covers that.

**Exponential and log lab (FIX).** Inverse view, press "Reflect in y = x" (`el_3_reflect.png`, `el_3b_reflect_mid2.png`):
the part of y = 2^x clipped at the top of the frame is folded too. It shows as a vertical stub outside the plot at
the right edge. Clip the folding curve to the frame. In the end state the blue log curve sits under the green one
and the two point markers are gone, although the chips below still name them. Keep both points and let the folded
copy land dashed on the blue curve. Ratios, Rules (stacked log bars) and Semi-log (straightens, or does not for
the linear set) are good.

**Unit circle (FIX, small).** `uc_4_tan.png`, `uc_5_tan_near.png`: with θ = 1.5, tan θ = 14.1 but the graph stops at
1. Give the tan view a taller range so the branches and the asymptotes at π/2 and 3π/2 show. Also small: the first
Test yourself item (radius 6 cm, arc length π) draws a bare circle with no angle or arc on it (`uc_test_p.png`).

**Smaller points, no verdict change.**
- Polynomials and rationals: the first Test yourself item ("At what x is the hole?") shows an empty grid. That is
  fine for a test, but a drawn formula with no curve looks dead.
- Function lab, phone: the formula line at the top of the stage is clipped on the left (`fl_land_p.png`), and the
  first-run hint covers the handle.
- Rate of change, phone: the first-run hint sits on the slope bars.

No accuracy problems found. Checked: transformation key points, exact unit-circle values, log-rule values, Q2
under/overestimate wording, residual verdicts.
