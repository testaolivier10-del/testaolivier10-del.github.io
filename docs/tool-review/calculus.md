# AP Calculus AB: tool purpose review (2026-11-10)

Every scene, chip, select option and mode opened in Chromium at 1280x800 and 390x844, run (Play, Sweep, Trace,
Add one by one, drags) and at least one Test yourself item each. Screenshots:
`/home/claude/shots/review/calculus/<tool>/` and tiled sheets in `/home/claude/shots/review/calculus/*.png`.

Owner's line applied: a graph is fine where the graph is the concept. The question for each tool was whether the
hard idea moves and shows itself, or is only a plot beside a caption.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Limit explorer | A limit is where both sides head as you close in, whatever f(a) is | LEAVE | The zoom really closes in, two tracers ride in from each side, the table gains a row at each power of ten, the continuity checklist decides itself. Hole, moved point, jump, asymptote, sin(1/x) band, squeeze and at infinity all read right. The limit shows itself. |
| Tangent tracer | The tangent is the limit of secants; f′ is that slope traced out | LEAVE | Q slides into P as h → 0 with the slope closing in, Trace f′ draws f′ below, and the corner, cusp, vertical tangent and jump show two disagreeing one-sided slopes. Flagship does its job. |
| Riemann sums | Strips add up to the area; the kind of sum and the shape decide over or under | FIX | Strips, Play adding them one by one with a running sum, n slider, signed tones: good. Table modes draw a dashed smooth "Trend" curve and a "Trend 310.277" chip while the caption says a table cannot tell over or under; the tank in the flow context is tiny. See notes. |
| Accumulation | g(x) is the signed area so far; g′ = f (FTC 1); net change is the area (FTC 2) | LEAVE | Dragging or sweeping x fills the area in two tones while g draws itself below with its tangent of slope f(x); Net change shows the area as the rise of g; the Unit 8 tank fills. The theorem moves on screen. |
| Area and volume | A volume is the sum of slices you can see; the slice gives R, r or s | FIX | 2D region with a draggable slice is right, and the 3D solid is drawn with the slice. But the solid is shown already made, at a default angle where it reads as a blob (axis diagonal, inner surface in front); the act of revolving is never seen. See notes. |
| Curve analyzer | f′ and f″ signs decide every feature of f; optimize by f′ = 0 | FIX | Stacked f, f′, f″ with one cursor and sign charts that build left to right is the right picture; Optimize scenes (box, fence, can) are real drawings. Near the cusp (and any blow-up) curves that leave the panel are clamped into flat lines along the edge, which look like f′ and f″ level off. See notes. |
| Motion lab | Sign of v gives direction; v and a sharing a sign means speeding up; area under v is displacement | LEAVE | A car on a road (facing its direction, brake lights) above linked x, v, a graphs with the speeding-up and slowing-down stretches tinted the same on all three; velocity given builds x from the area. |
| Related rates | Rates in one scene move together; the chain of equations links them | FIX | Ladder, cone, shadow, ripple and balloon are real illustrated scenes that move, with given-rate and caused-rate arrows and a live table. During Play the caption's numbers trail the readout chips (see notes). |
| Rule drills | See the structure of f (which rule first, which pieces) and build f′ from it | LEAVE | The rule tree is the idea here, color coded u/v, outer/inner, with f and f′ graphed beside it. Readable at both sizes. |
| Slope fields | A solution curve follows the field everywhere; equilibria and growth shapes | LEAVE | Drag the start point and the solution traces both ways through the segments, exact solution dashed, equilibria marked, k and cooling sliders. Shared chip bug below. |

Counts: 6 LEAVE, 4 FIX, 0 REDESIGN.

## Notes

### Area and volume (FIX)
- Revolve (all regions, both slicing directions): the solid appears already finished. The default 3D camera tilts
  the axis of rotation diagonally and shows the solid nearly end-on, so on landing it reads as a blue blob with a
  yellow ring (`area-volume/d02_Revolve.png`). After a drag it reads well (crimson horn with the washer,
  `d03_rotate3d.png`), so the renderer is fine; the start is not.
- What it should show: open with the solid's axis lying the same way as the 2D graph's axis (horizontal for the
  x-axis, vertical for the y-axis) so a student matches region to solid at a glance; and add a "Revolve it" sweep
  (Play) where the shaded region and its slice turn around the axis and the solid grows from 0 to 360 degrees,
  leaving the washer as the face of the cut. That makes "revolve" an action you watch instead of a result.
- Cross sections: the solid of squares on √x and x² is small in a large empty panel; frame it to fill the panel.

### Curve analyzer (FIX)
- Cusp x^(2/3)(x − 5): as x → 0 from the left, f′ → +∞, but the curve is drawn running flat along the top of its
  panel from about x = −0.15 to 0, and from the right it runs flat along the bottom; f″ likewise has two flat tops
  (`ca_cusp.png`). A student reads "f′ levels off at about 7". Repair: clip the curve at the panel edge (let it leave)
  and, if wanted, a small arrow at the edge meaning "keeps going".
- Everything else (cursor reading all three, sign charts building, sentences that justify each point) is the idea.

### Riemann sums (FIX)
- Table modes ("Inflow, unequal widths", "A cyclist slowing down"): the stage draws a dashed smooth curve through
  the data and a chip "Trend 310.277", while the caption says "A table cannot show concavity: over or under is not
  known". Either drop the dashed curve and chip, or label them plainly as "one possible f (not given)". As it is, a
  student is shown the true value the problem says they cannot know.
- Flow context: the tank that fills to the sum is about 50 px wide beside a full-width graph; make it big enough to
  see the level rise as strips are added.
- Optional: shade the slivers between the strip tops and the curve (missing area one tone, extra area another) so
  "under by 1.833" is a visible region, not only a caption number.

### Related rates (FIX)
- While Play runs, the caption sentence lags the readout chips: ladder caption "slides down at 2.43 ft/s" with the
  chip at −2.55 ft/s; cone 0.263 against 0.258 ft/min; ripple 85.1 against 88.4 ft²/s; balloon 0.142 against
  0.134 rad/min. Repair: update the caption from the same frame as the chips (or freeze caption numbers until
  Pause). The scenes themselves are right and checked (ladder 10.23² + 8.02² = 13²; shadow tip 6.67 ft/s).

### Shared chip bug (slope fields; also four BC tools)
With a mouse, hovering the chip that is already selected turns it pale with white text, so its label disappears
until the pointer moves away (`slope-fields-hover/`, `sf_hover.png`). Cause: `assets/course/tool-studio.css`
line 278, `.ls-root .tchip:hover { background: var(--hover-tint) }`, beats the pressed-state colors in
`slope-fields.css` lines 19-20. Repair once: exclude `[aria-pressed="true"]` from the hover rule.

### Small nits on LEAVE tools
- Accumulation, Test yourself: items with no figure (for example F(x) = ∫ from 0 to sin x) show the word "Let"
  far left and the formula in the middle of an empty stage.
- Limit explorer at 1x: the graph sits in the left half with the table beside; fine, just roomy.

### Accuracy
Spot checks matched: Riemann sums and exact values, trapezoid overestimate for concave up, tangent difference
quotients for x^(1/3), cusp derivatives, ladder and shadow rates. Nothing scientifically wrong found apart from
the misleading table "Trend" display above.

### Could not open
Nothing. No page errors.
