# AP® Precalculus: open questions for a person

Things a person (the owner, or an AP® Precalculus teacher) should decide or check. Add to this file instead of
guessing; mark an entry resolved with the date and move it to the end. Seeded in Phase 0 (2026-10-31) from
`docs/apprecalc-research/framework.md` section 9 and the build.

## Owner decisions

### identity: accent, icon, headline, ranks, cover (open, 2026-10-31)

Built as a proposal, owner to confirm (spec decision 8). Accent forest green (hue 145°, apart from AP® Biology's
green and every other course): light ink `#11592F` on tint `#E3F3E8` (7.3:1; 8.4:1 on white), dark ink `#ACE4BF`.
Cover `assets/covers/apprecalc.svg` (deep green `#0B4A33` with a mint `#8AF0C0` sine wave and unit circle). Icon: a
unit circle with a radius and a sine wave. Headline "AP® Precalculus, every function in motion."; hand line "see
every function move". Ranks: Function Explorer, Rate Reader, Asymptote Hunter, Log Unlocker, Circle Turner, Model
Builder, Precalculus Legend. One place to change them: `IDENTITY` in `scripts/lib/apprecalc-build.mjs`, the
`apprecalc` blocks in `assets/theme.css`, `assets/hub-progress.js` and `precalculus/assets/pcalc.css`.

### free-tier: Unit 1 and "Algebra you need" (open, 2026-10-31)

Spec decision 6. Free trainers `function-lab`, `rate-of-change`, `unit-circle` (spec section 6). Set in
`assets/premium.js` (`freeChapters: ['unit-1']`; the algebra chapter is free by rule) and `precalculus/data/pages.json`.

### launch: registration is hidden (open, 2026-10-31)

`status: 'hidden'` in `assets/courses.js`; `onSale: false` in `assets/premium.js`. At launch: apply
`scripts/sql/migrations/2026-10n-apprecalc.sql` (written, not applied), create the Polar product, add the Worker
`POLAR_PRODUCTS` line, set `onSale`, the "eleven courses" wording, `sources.html`, the hub and 404 cards.

### site-weight: the site shell budget moved from 340 to 341 KB (open, 2026-10-31)

`scripts/check-weight.mjs`: registering the eleventh course adds about 1.1 KB to the shared files every page loads
(course lists, premium.js, ranks, tutor, search, theme); the shell measured 339.7 KB, so the budget went up 1 KB
with a comment. The owner may prefer trimming elsewhere.

### og-image: social card not rendered (open, 2026-10-31)

`precalculus/assets/og-image.png` is a copy of AP® Calculus AB's. The card is defined in
`scripts/build-og-images.mjs`; render it where Playwright is available:
`ONLY=precalculus/assets/og-image.png node scripts/build-og-images.mjs`.

### frq-grader: the AI FRQ grader is not wired (open, 2026-10-31)

`docs/frq-grader.md`: the grader is shipped off and its eval is per course. Precalculus's 6-point rubrics would
need their own eval set before `FRQ_COURSES` lists `apprecalc`.

## Exam and CED facts to confirm

### frq2-2027: FRQ 2's new structure and point split (open, 2026-10-31)

For May 2027 part B(iii) is removed and part C expanded; the CED sample and its scoring were not readable. The guide
says write 2-2-2 until confirmed. A person with the current CED should confirm the parts and points.

### ced-text: topic pages 2.2-4.14 (open, 2026-10-31)

Learning objectives and essential knowledge for 2.2-4.14 come from College Board restatements and third-party
summaries, not the CED pages (`framework.md` section 3). `docs/apprecalc-ced-map.json` marks them. A person should
check each against the CED PDF and update the ced map.

### ced-exclusions: "outside the scope" statements in Units 2-3 (open, 2026-10-31)

Only Unit 1's exclusion statements were read. Scan the CED for "outside the scope" in Units 2-3 and add any to the
authoring guide ("Scope").

### exclusions-trig: half-angle and tangent sum/difference (open, 2026-10-31)

Excluded on a third-party source only (Break the Test); verify in CED Topic 3.12. The guide excludes them until
then; sine and cosine sum identities and double-angle identities are in.

### practice-weights: exam weighting by practice (open, 2026-10-31)

Not readable in the CED's exam section; the map has `practicesConfirmed: false`. Items spread across each topic's
practices meanwhile.

### mcq-options: four answer choices (open, 2026-10-31)

Standard for current AP® math exams but not verified for Precalculus; the content check requires four.

### cas: CAS calculators (open, 2026-10-31)

The calculator policy page does not address CAS for Precalculus. The course assumes a graphing calculator (Desmos
in Bluebook) and never relies on CAS.

### scores-2026: 2026 taker count, mean and reader report (open, 2026-10-31)

Not posted when researched (82% 3+, 29% fives known). Update `framework.md` section 6 and the reader-report traps
when the 2026 Chief Reader Report appears.

## Build and format

### tex-subset: vectors, matrices and binomials (open, 2026-10-31)

The TeX subset has `\mathbf`, `\left\langle ... \right\rangle`, `\left\| ... \right\|` and `matrix` inside
`\left[ ... \right]`, but not `\vec`, `\overrightarrow`, a bare `\langle`, `bmatrix` or `\binom`. The map's
`vector` and `matrix` notation patterns also match the unsupported forms so a later addition is caught. Decide
whether Unit 4 needs `\vec` or `bmatrix` (a small change to `pcalc-math.js` and its test).

### teacher-review: no AP® Precalculus teacher has reviewed the course (open, 2026-10-31)

The "not yet reviewed by an AP® Precalculus teacher" note stays on every page until one does (spec section 1).

### shared-diagnose-words: calculus words in the shared number feedback (open, 2026-10-31, builder T4)

`ApPrecalcMath.diagnose` (`precalculus/assets/tools/pcalc-tool-math.js`, forked from AB) falls back to "a minus
sign from a derivative", "the antiderivative of x" and "a volume of revolution" when no authored slip matches. A
precalculus student can see these. `polar-graphs` and `vectors-matrices` author their own sign, factor-of-2 and
factor-of-π slips so the fallback never shows; the other trainers may not. Suggested shared fix: reword the three
messages ("Check the order of a subtraction or a sign from the unit circle", "Check a ½ or a doubled term",
"Check for a missing π").

### vectors-matrices-scope: which Unit 4 topics the trainer drills (open, 2026-10-31, builder T4)

Test yourself covers 4.1 (position, direction), 4.3 (average rates of x and y, slope Δy/Δx), 4.8 (k·u + v,
magnitude, dot product), 4.11 (determinant, invertible, an entry of A⁻¹) and 4.12 (image of a point, area factor).
Explore adds parametric circles and lines (4.4) and the plane under a matrix. Not drilled: conics and implicit
curves (4.5-4.7), vector-valued functions (4.9), matrix products and composition (4.10, 4.13) and matrix models
such as transition matrices (4.14). Unit 4 is beyond the exam, so this seemed enough; say if more contexts are wanted.

### polar-rates-wording: "distance from the origin" questions (open, 2026-10-31, builder T4)

The polar rates drill asks whether the distance between the point (r, θ) and the origin is increasing or decreasing
on an interval where r keeps one sign and one direction (r = 0 is allowed at an end). Its keys follow the CED rule
(same signs of r and its change: increasing). A teacher may want the "r < 0" case (the main trap) weighted more or
less than the 40% it gets now.

### tools-t3-diagnose: shared slip notes use calculus words (open, 2026-10-31)

`ApPrecalcMath.diagnose` (`precalculus/assets/tools/pcalc-tool-math.js`, shared, not edited by builder T3) still
carries AP® Calculus AB's generic notes: "a minus sign from a derivative", "the antiderivative of x", "as in a volume
of revolution". A drill shows them when no authored slip matches. Proposed wording: sign "Check the order of a
subtraction or a lost minus sign."; factor of 2 "Check a ½ or a doubled term."; factor of π "Check for a missing or
extra π." The unit circle and sinusoid builder author the sign slip on every step where it can happen, so they rarely
reach the generic note.

### tools-t3-wording: "not defined" for tan at π/2 (open, 2026-10-31)

The drill checker (`_drills.mjs`) refuses the word "undefined" in any step text, so the unit circle says "tan θ is not
defined" (OP is vertical, no slope). A teacher may prefer "undefined"; changing it needs the shared check to allow the
word in trainer text.

### tools-t3-models: sinusoid builder simplifications (open, 2026-10-31)

Sinusoid builder: the tide's period is 12 hours (real semidiurnal tides run about 12 h 25 min); the temperature
scene's table is rounded to one decimal and a point counts as on the curve within 3% of the range plus 0.06 °C; the
Explore sliders keep a ≥ 0 (a flipped model is reached with the shift, or with cosine under Details). Drill models are
graded by evaluation on [0, 2·period], so any equivalent sine or cosine form is right. Confirm these are acceptable.

### tools-t1-regression-methods: which calculator the regression keys follow (open, 2026-10-31, builder T1)

Regression lab keys follow the TI-84 methods: ExpReg is least squares on ln y and LnReg on ln x, in the forms
`y = a·b^x` and `y = a + b ln x`; SinReg is reported as `y = a sin(bx + c) + d`. Desmos fits `y = ab^x` by nonlinear
least squares on y itself, so a student using Desmos gets slightly different constants and can miss the third decimal
on the exponential drill (linear and quadratic agree on every calculator). Decide: name the TI method in the drill
text, accept both, or drop exponential constants from the drill and keep only the prediction. The sinusoid is in
Explore only (no drill keys), because calculators can return different but equivalent `c` values or local fits.

### tools-t1-residual-pattern: the "pattern" verdict is a runs test (open, 2026-10-31, builder T1)

Regression lab labels a residual plot "pattern" or "no clear pattern" by a runs test on the residual signs in x order
(runs at or below the expected count minus one standard deviation). The validator checks every built data set: each
set's own model reads "no clear pattern" and a linear fit to a curved set reads "pattern". A teacher should confirm
the wording, and that a runs test is a fair stand-in for "look at the residual plot" on 8 to 12 points.

### tools-t1-transformation-words: CED wording of dilations (open, 2026-10-31, builder T1)

Function lab describes g(x) = a f(b(x − h)) + k in the order the changes act (b, h, then a, k) as "a horizontal
dilation by a factor of 1/|b|", "a vertical dilation by a factor of |a|", "a reflection over the x-axis / y-axis", and
"a horizontal (vertical) translation n units right/left (up/down)", with "(narrower)/(wider)" or "(taller)/(flatter)"
added. Confirm against the CED's 1.12 language. Families unlock with their topics: exponential (2.3), log base 2
(2.11), sine (3.4). The shared numeric slip notes (`diagnose` in pcalc-tool-math.js) can name "antiderivative" and
"volume of revolution" in T1's number steps too (see shared-diagnose-words).

### tools-t2-single-form: Q4 "single term" answers are typed as their inside (open, 2026-10-31, builder T2)

Symbolic steps asks for a single log, power, sine or tangent by its inside ("the expression is ln(B); type B"), so
the form is one term by construction and B is graded by value on the problem's domain. The shared grader has no
"form" check, so a fully typed `ln(...)` answer cannot be graded as a single term without one. If the owner wants
students to type the whole single-term answer, the shared change is a `form` option on an `expr` step (for example
`{ form: { outer: 'ln' } }` checked on the parse tree in `ApPrecalcExpr.grade`). A teacher should also confirm the
domain step ("equal for x > 0, where the original is defined") matches how Q4 rubrics treat domain.

### tools-t2-slant: slant asymptotes in the poly-rational trainer (open, 2026-10-31, builder T2)

Polynomials and rationals draws a slant asymptote (labelled "slant y = mx + b") when the numerator's degree is one
more than the denominator's and a vertical asymptote remains, and its end-behavior sentence says "no horizontal
asymptote (a slant asymptote instead)". Confirm 1.7 covers slant asymptotes as we treat them (we never drill them;
only Explore shows one). Holes on the x-axis ((x − 1)² over (x − 1)) are called holes, not zeros.

### tools-t2-semilog-base: semi-log plots use base 10 only (open, 2026-10-31, builder T2)

Exp-log lab's semi-log view and drill use log base 10 on the vertical axis (b = 10^slope, a = 10^intercept). Confirm
the CED (2.15) does not expect natural-log semi-log plots too; adding them is one option in the model.
