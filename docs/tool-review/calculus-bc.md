# AP Calculus BC: tool purpose review (2026-11-10)

Every scene, chip and mode opened in Chromium at 1280x800 and 390x844, run (Play, drags, steps, degree and term
sliders) and at least one Test yourself item each. Screenshots: `/home/claude/shots/review/calculus-bc/<tool>/`
and tiled sheets in `/home/claude/shots/review/calculus-bc/*.png`.

| Tool | The idea | Verdict | What is wrong and what it should show |
|---|---|---|---|
| Euler and logistic | Euler follows tangent steps and drifts by concavity; halving the step halves the error. Logistic growth is fastest at L/2 | LEAVE | Slope field, the Euler polygon with each run and rise, the true solution dashed; 1 to 16 steps shows the error shrink. Logistic P(t) beside dP/dt as a parabola in P, one linked moving point, L and L/2 marked. |
| Integration methods | Parts trades ∫u dv for ∫v du inside the uv rectangle; partial fractions are pieces that add to f; an improper integral is a limit of areas | LEAVE | The uv picture (two areas filling the rectangle) is the honest geometric meaning of parts; partial fractions draw f and both pieces with a moving x; improper draws the area against b levelling off or not. |
| Parametric motion | A particle's velocity and acceleration vectors, slope and speed; distance as area under speed | FIX | Paths (ellipse, loop, figure eight, a real rolling wheel, velocity given) with the particle, vectors, tangent and the speed graph filling as distance. Same caption lag as AB related rates (see notes). |
| Polar lab | Area as swept sectors ½r²Δθ; the sign of dr/dθ says toward or away; r < 0 plots on the opposite ray | LEAVE | θ sweeps, sectors shade (twice-traced stretches darker), the current slice highlighted, r(θ) below tinted away/toward, negative r shown on the opposite ray. Between two curves works. |
| Series lab | Partial sums settle or do not; the tests decide; power series converge on an interval | FIX | Terms as bars and partial sums as dots with the sum dashed, the alternating bound bracket, the power series number line with a draggable x. But N stops at 40, so 1/n and 1/(n ln n) look as if they level off while the label says "Diverges". See notes. |
| Taylor lab | P_n hugs f near c and the error bound bands it | LEAVE | f and P_n with draggable center, error gap at x, Lagrange or alternating band; raising n visibly widens the fit. |

Counts: 4 LEAVE, 2 FIX, 0 REDESIGN.

## Notes

### Series lab (FIX, the most important one in this course)
- Number series 1/n and 1/(n ln n): the Terms slider stops at N = 40 (`series-lab.js` line 132). At N = 30 the
  harmonic partial sums are 3.995 and the dots bend over and look like they are settling; 1/(n ln n) looks even
  flatter (`se.png`, panels 3 and 6). The chip says "Diverges" and the caption says "grow without bound, slowly",
  but the picture says the opposite. This is the one idea the picture must not get wrong.
- What it should show: let N jump by powers of ten (40, 100, 1,000, 10,000, 10⁶) on a log n axis, or add a
  "×10 terms" button, with the partial sums drawn against ln N (harmonic) and ln ln N (for 1/(n ln n)) as a guide,
  so the student sees the climb never stops; for 1/n² the same jump shows the dots pinned under π²/6. Keep the
  bars for small N where they are readable.
- Power series view is good (interval with open or closed ends, x on the line, S_N(x) against the function).

### Parametric motion (FIX)
- During Play the caption numbers trail the readout chips: ellipse caption "speed 2.16" with the chip at 2.12;
  loop 2.47 against 2.83; figure eight 1.85 against 2.65; rolling wheel 0.98 against 0.82. Update the caption from
  the same frame as the chips, or hold its numbers until Pause.

### Shared chip bug (euler-logistic, integration-methods, series-lab, taylor-lab; also AB slope fields)
With a mouse, hovering the chip that is already selected turns it pale with white text, so its label disappears
(`ta_hover.png`: "sin x" vanishes). Cause: `assets/course/tool-studio.css` line 278,
`.ls-root .tchip:hover { background: var(--hover-tint) }`, wins over the pressed colors. One fix for all: leave
`[aria-pressed="true"]` out of the hover rule.

### Small nits on LEAVE tools
- Polar lab, Test yourself: the point asked for is already plotted on the stage (correctly; checked r = 4 sin 2θ at
  θ = 7π/6 gives (−3, −1.73)); fine for a coordinate question, but it hands over the quadrant.
- Series lab, Test yourself: the question sits in the middle of an empty stage until the conclusion step.
- Euler, Test yourself: the field window (x from 2 to 2.5) puts the start point near the bottom edge.

### Accuracy
Spot checks matched: Euler values and errors for x + y and −x/y, the parts identity uv = ∫u dv + ∫v du for x eˣ
and x²eˣ, improper limits, polar points and areas, Taylor errors and the alternating bound 1/9 for arctan at 1.
Nothing scientifically wrong; the series picture for divergent series is misleading (above).

### Could not open
Nothing. No page errors.
