# AP Calculus BC: second pass, simple and clear (2026-11-11)

Builder math1 (pass 2), branch `claude/tv2-math1`. Shots in `/home/claude/shots/pass2/calculus-bc/`. Counts as in
`physics.md` (L labels on the picture without axis ticks, N live numbers, C control groups, W words, P panels).

| Tool | The idea | Best way to show it | Verdict | Before (L/N/C/W/P) | After | What changed | Moved behind a tap or in time |
|---|---|---|---|---|---|---|---|
| Euler and logistic | Euler follows tangent steps and drifts by concavity; logistic is fastest at L/2 | Slope field, Euler polygon, true curve dashed; drag the start, pick steps | SIMPLIFY | 4/5/4/39/1 | 4/3/4/35/1 | The Euler and true values were labeled on the graph and again as pills; the pills go, the error pill stays. | |
| Integration methods | Parts trades the integral of u dv for v du inside the uv rectangle | The uv picture with both areas, beside the integral's area | SIMPLIFY | 7/7/3/55/2 | 7/4/3/47/2 | Parts: the three areas are labeled inside the uv picture; the three pills that repeated them go. | |
| Parametric motion | Velocity, slope and speed; distance is area under speed | Path with the particle and its vectors over the speed graph; Play | SIMPLIFY | 6/4/4/35/2 | 5/4/4/33/2 | The key no longer lists "path" and names only the layers drawn now (acceleration appears in the key when it is turned on). | Acceleration key: when shown |
| Polar lab | Area as swept sectors; sign of dr/dtheta; negative r | Theta sweeps and sectors shade; r(theta) below | SIMPLIFY | 9/5/4/54/2 | 8/4/4/49/2 | The area pill repeated the set-up box on the picture; it goes. With one curve the curve needs no key (the inner/outer pair keeps both names). | |
| Series lab | Partial sums settle or do not | Bars and partial-sum dots with the sum line; add terms | LEAVE | 3/2/3/29/1 | same | First pass fixed the divergent picture; one chart, one slider. | |
| Taylor lab | P_n hugs f near c inside the error band | f, P_n and the band; raise n | LEAVE | 3/2/4/39/1 | same | One graph; error and bound are the two live numbers. | |

Counts: 2 LEAVE, 4 SIMPLIFY, 0 CHANGE.

## Graphics quality
All graphs share AB's plot style and BC's purple accent. The rolling wheel and the polar sectors are drawn, not
symbolic. Nothing decorative found.

## Not simplified, and why
- Integration methods keeps two panels for parts: the area of x e^x and the uv rectangle are read together (the
  integral on the left is the blue area on the right).
- Polar lab and parametric motion keep the r(theta) and speed graphs under the curve: the shading there (moving
  away or toward; distance as area) is the second half of the idea, on the same parameter axis.
- Series lab keeps its ten series chips in one scrolling row (one control group); hiding some would remove the
  comparison of tests.
