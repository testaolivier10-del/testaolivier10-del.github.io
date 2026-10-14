# Review: AP® Calculus AB trainers, group B (related-rates, motion-lab, curve-analyzer, riemann-sums)

Independent reviewer, 2026-10-13. Scope: the four tools' models (`calculus/assets/tools/math/<slug>.js`), pages
(`calculus/assets/tools/<slug>.{js,css}`), data and validators. Phone pass for the same tools:
`docs/tools-phone-pass/calc-b.md`.

## Numeric recheck

A scratch script (not in the repo) regenerated problems from every context and kind and recomputed each key
from the stem's own numbers (parsed from the problem text or the figure's data), without the validators:
chain-rule rates by numerical differentiation of the relation (ladder, cone volume, shadow, ripple area,
balloon angle), velocity and acceleration by finite differences of the drawn x(t), displacement and distance by
fine Simpson on v and |v|, turning points by sign checks, candidates by solving f′ = 0 and a 1000-point grid,
inflection by the sign of f″, optimization by a 200 000-point search, table sums by their own loop, over/under by
the actual n = 4 sum against the integral (and by the stated signs of r′, r″ for the rate version), trapezoid
areas, limit-of-sum endpoints and R₄. Every numeric key was also graded through the runtime grader
(`ApCalcMath.diagnose` / `diagnoseExpr`): key and key-to-3-dp right, every authored mistake wrong.

Result: 3 360 problems checked (related-rates 600, motion-lab 600, curve-analyzer 720, riemann-sums 1 440) on the
final code, no key wrong. Keys changed: none. Three named misses and two stems were wrong (below).

## Changes (model files)

| Tool / kind | Old | New | Why |
|---|---|---|---|
| related-rates cone, step `rate` | slip "Keep the 3 from the power rule" had value dh/3 | value 3·dh, feedback adds "three times too big" | Dropping the 3 gives (k²/3)πh²·dh/dt = dV/dt, so dh/dt comes out 3× too big; a student making that slip never saw its feedback. |
| curve-analyzer optimize/fence, step `x` | slip P/6, "That would split the fence into three equal sides" | slip P/3, "That splits the fence into three equal sides, which is not the best shape" | Three equal sides means x = P/3; P/6 matched no real slip. (Now consistent with the area slip P²/9.) |
| riemann-sums table/trap, setup distractor | "one width" option was (b−a)/n·½(y₀+y₁+…+y₄) | (b−a)/n·½(y₀ + 2y₁ + 2y₂ + 2y₃ + y₄) | The option and its feedback claimed "one width for every subinterval", but the expression was not an equal-width trapezoidal sum; now it is, and it equals the numeric slip already graded. |
| curve-analyzer incdec/extrema/candidates stems | factor printed as (x − 0) when a zero is 0 | printed as x (e.g. f′(x) = −2x(x − 4)) | Stem quality. `fac()` and the candidates solution line. |
| curve-analyzer fgraph | relative maxima written x = 1.333 | exact fractions, x = 4/3 | A zero between grid points of a straight-piece f′ is a fraction; a 3-dp decimal presented as the location is not exact. |
| related-rates balloon | h = d·4/3 could be 533.333 ft | ratios limited to whole heights | Non-integer data in the stem, and the shared Tool Studio caption split the question at "533." (see open points). |
| related-rates ladder, ripple | "at 1 feet per second" | "1 foot per second" | Grammar. |

Feedback was read for every kind (dump of each kind's steps, options, slips): the remaining named misses match
their values. Validators and tests (`node --test scripts/test/apcalc-tool-<slug>.test.mjs`): all pass after the
changes (6, 5, 5, 7 tests).

## Pictures agree with numbers

Checked on screenshots: ladder/cone/shadow/ripple/balloon scenes from the problem's own values; motion graphs and
car from the same x(t)/v(t); curve analyzer marks (critical points, inflection, abs max/min, sign charts incl.
the cusp) against `analyze()`; Riemann strips from the same pieces as the sum, table points, tank level = running
sum. No mismatch found.

## Quality fixes (pages)

- Shared-fix cleanup: removed the per-tool annotation stripping in related-rates, motion-lab and curve-analyzer
  drills. It now did harm: `plainText` in calc-tools.js reads each formula from its TeX annotation, which the tools
  had deleted. (motion-lab's and curve-analyzer's rendered-formula caption override is kept.)
- motion-lab: the a/v arrows over the car could run off the left edge with their letter cut off (clamped, letter
  moves to the other side); the road was too short at phone width to hold both arrows (84 → 98 px).
- curve-analyzer: "rel max, abs max" was clipped at the top of the f panel (now beside the point near an edge);
  the soda-can note ran off the scene on phones.
- related-rates: ripple radius label sat under the drag handle and the area label under an arrow (radius drawn
  left, second arrow diagonal); flat ladder's θ sat on the rails; drill legend ("Given / Find") moved to a band
  above the scene so it never overlaps the art (the night scene had dark-stroked text on the page).
- Phone legibility, view switch, Enlarge clearance: see `docs/tools-phone-pass/calc-b.md`.
- Keyboard: every scene control reachable by Tab and moved by arrows (Playwright check at 1280 and 360), reduced
  motion shows the end state, no console errors, no horizontal scroll, light and dark.

## Open points for a person

- Shared (calc-tools.js `studioAsk` caption): the question is split into sentences at every ".", so a decimal in
  the question sentence ("2.5 feet") cuts it. Fixed here by keeping balloon heights whole; the split regex
  should skip digits (`/[^.?!]+(?:\.(?=\d)[^.?!]*)*[.?!]+/`-style) for every tool.
- Shared: the first-run hint tooltip covers the dock on phones (already noted in tools-calm.md).
- `scripts/check-apcalc-content.mjs` was not run in full; the four validators ran through their tests.
