# Independent review: accumulation, slope-fields, area-volume (2026-10-13)

Reviewer: independent (not the builder). Scope: the three AP® Calculus AB trainers, their models
(`calculus/assets/tools/math/<slug>.js`), pages (`calculus/assets/tools/<slug>.{js,css}`), data
(`calculus/data/tools/<slug>.json`), validators and tests. Rules: `docs/apcalc-briefs/review-common.md`; bar:
`docs/apcalc-briefs/tools-common.md`. The phone pass for the same tools is `docs/tools-phone-pass/calc-c.md`.

## What was checked

- **Every drill kind** (21 kinds: accumulation 6, slope-fields 6, area-volume 9), generated through the model with the
  page's seeded RNG on seeds the validators do not use (500000 + 104729·i), 25 to 60 per context (1,240 problems in
  the main pass, 1,650 in all), and rechecked by a Python script (sympy and mpmath, a different toolchain from the
  page) written from the problem data and stem text, never from the model's numbers:
  - accumulation: g(c) and h(c) by adaptive quadrature of the drawn pieces (segments, semicircles), signed and with
    reversed limits; g′ = f(c), g″ = slope of f by differencing; every behavior choice (increasing/decreasing,
    max/min, concavity, inflection, all four inflection options) tested on the graph by sampling; absolute maximum of
    h by a 400-point grid; the chain-rule key against a numerical derivative of F(x) = ∫ from a to u(x) of h; tank
    rate R − D, direction, A(T) = A0 + ∫(R − D) exactly, and the time of the maximum by a 600-point search.
  - slope-fields: slopes at the marked points; the horizontal-segment set by substituting each option's equation into
    the DE (the key vanishes there, no distractor does); match: the keyed field is the target, and the keyed feature
    holds for exactly that one of the four fields (my own predicates per feature); sketch: the true heights by an
    independent ODE solver (mpmath odefun) and the long-run answer (unbounded, equilibrium, the line y = x − 1, or the
    line y = −x − 1) from the solution at x = 6 and 7; separation: the particular solution against sympy dsolve with
    the initial condition, C, and the antiderivative step by quadrature; concavity: d²y/dx² = f_x + f_y·f at seven
    (x, y) points, its value and the keyed option; exponential models: k, y(t1), the time to reach the target from the
    numbers in the text.
  - area-volume: limits are crossings or named boundaries, no crossing inside (except the three-crossing kind), top on
    top; areas, three-crossing total and net, cross-section volumes (square, equilateral triangle, semicircle) and
    disc/washer volumes by quadrature with radii measured from the stated axis; hole iff washer; the axis named in
    the text; the outer radius key at seven points.
- **Grading through the runtime** (`ApCalcMath.diagnose` / `diagnoseExpr`): every key graded right, every authored
  mistake graded wrong and returning its own message, on every problem above.
- **Named-miss feedback:** each slip value recomputed independently (unsigned area, area from the left end,
  "only the change" for net change and the tank, rate in only, A0 + ∫R, squared difference, the base area for a cross
  section, missing π, the region about the coordinate axis, linear growth) and matched to a message that names it.
- **Scope:** AB only. No Euler's method or logistic models, no shells or arc length (the "How it works" sheets say
  so); semicircle cross sections sit under 8.9 with triangles, as in the CED.
- **Pictures against numbers and quality as a student:** Playwright, 1280, 360, 390 and 740×360 px, light and dark,
  Explore and every drill kind, drills solved end to end through the page (keys typed or chosen, the sketch dragged
  with the keyboard), the Enlarge view; no console errors, no horizontal scroll.
- Validators and tests: `node --test scripts/test/apcalc-tool-{accumulation,slope-fields,area-volume}.test.mjs`
  8/8 each; `node scripts/check-apcalc-content.mjs --tools --topic ftc-accumulation`: tools 0 failing (the exam
  failures it also prints belong to the exam builder's work in progress).

## Numeric recheck result

All keys right: 0 wrong keys in 1,650 problems. The only flags my script raised were in my own checker (a sign
convention for the "unsigned area" slip when c < a, and the principal complex cube root where the page correctly
uses the real one); both resolved in the page's favor.

## Changes

| Where | Old | New | Why |
|---|---|---|---|
| `math/area-volume.js` revProblem, volume slip for an axis other than 0 | value π∫(far² − near²) with the note "That revolves the region about the x-axis" | washers: π·\|∫(far² − near²)\| with the same note; discs: π∫far² with "You used the curve's distance from the x-axis as the radius. The radius runs from the axis of rotation, y = k, to the curve." | The old value was negative for an axis above the region (so a student who really revolved about the x-axis was not recognized), and for discs it is not the volume about the x-axis at all (π∫x⁴ for the region under y = 4 above y = x²), so the message misnamed the slip. Keys unchanged. |
| `accumulation.js` drill figure | fixed 540-wide SVG, 46 px per unit up but about 64 across | drawn at its box's size with equal units | "Grid squares are 1 by 1" was false on screen and the semicircles were drawn as ellipses (a picture that disagreed with the stem). |
| `accumulation.js` Explore | f beside g, units unequal (a semicircle drawn as a tall arch on desktop) | g under f, x-axes aligned, f to scale (up to 1.5× stretch on a short stage), adaptive tick steps | Same: the shape of f is the data; aligned axes also make g′ = f readable. |
| `slope-fields.js` drill fields, Explore | the [−3, 3]² field stretched to the box | square (drill) / widened along the longer side (Explore) so a slope of 1 is drawn at 45°; field density scales with stage width | Students read slopes off the segments' angles. |
| `slope-fields.js` match | four stretched rectangles | four squares as large as the stage allows, darker 1.7 px segments, denser when large | Owner's weak spot (small pictures). |
| `area-volume.js` 3D renderer | solid scaled to a sphere fitting min(w, h) | scaled to fit its projection at every yaw at the current tilt (cached) | A long solid now fills a wide canvas (about 1.5 to 1.8 times bigger); owner's weak spot. |
| `area-volume.js` drill labels | curve labels at 30% / 70% of the interval | 22% / 80% | They sat on the slice strip drawn at the midpoint. |

Phone-only changes (stacking, text sizes, touch targets, Enlarge corner) are listed in `docs/tools-phone-pass/calc-c.md`.

Keys changed: none. Item ids, step keys, recording and validators unchanged.

## Weak spots left (for a person)

- The accumulation drill's tank picture at t = 0 only repeats A(0); on a phone on its side the stage is short and the
  rates graph is small (Enlarge helps). Consider dropping the tank there or showing it at time T.
- The Explore solid's default view (yaw −0.75) shows a disc solid mostly end-on; a slightly more side-on default
  (yaw near −0.4) would show its shape better. Not changed (taste).
- `ApCalcPlot` uses fixed 11 px tick labels and fixed margins; each tool now overrides the size on phones in its own
  CSS. A shared `.ls-phone .calc-plot{font-size:12.5px}` in `calc-tools.css` would cover every calculus tool at once.
