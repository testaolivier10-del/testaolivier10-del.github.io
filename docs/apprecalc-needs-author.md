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

All six Q2s use 2-2-2 meanwhile (self-reviews A and B, 2026-10-31): `frq-q2-cubic-volume` (A model and maximum; B secant rate and estimate; C over/under and domain from context), `frq-q2-quadratic-attendance` and `frq-q2-cooling-residuals` (A(i), A(ii), B(i), B(ii) 1 point each, C 2: a domain bound or a solve with its reason), `frq-q2-exponential-depreciation` (C: over/under from concavity), `frq-q2-logarithmic-sales`. Its model in `frq-q2-cubic-volume` comes from geometry, not a system from data.

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

### tools-t3-models: sinusoid builder simplifications (open, 2026-10-31)

Sinusoid builder: the tide's period is 12 hours (real semidiurnal tides run about 12 h 25 min); the temperature
scene's table is rounded to one decimal and a point counts as on the curve within 3% of the range plus 0.06 °C; the
Explore sliders keep a ≥ 0 (a flipped model is reached with the shift, or with cosine under Details). Drill models are
graded by evaluation on [0, 2·period], so any equivalent sine or cosine form is right. Confirm these are acceptable.

The content uses the same 12-hour tide "in this model" (self-review D): the tide FRQ and the 3.7 tide set, and `pcalc-sinusoidal-modeling-14` uses the real 12.4-hour drift as the reason predictions degrade.

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

### tools-t2-slant: slant asymptotes in the poly-rational trainer (open, 2026-10-31, builder T2)

Polynomials and rationals draws a slant asymptote (labelled "slant y = mx + b") when the numerator's degree is one
more than the denominator's and a vertical asymptote remains, and its end-behavior sentence says "no horizontal
asymptote (a slant asymptote instead)". Confirm 1.7 covers slant asymptotes as we treat them (we never drill them;
only Explore shows one). Holes on the x-axis ((x − 1)² over (x − 1)) are called holes, not zeros.

### tools-t2-semilog-base: semi-log plots use base 10 only (open, 2026-10-31, builder T2)

Exp-log lab's semi-log view and drill use log base 10 on the vertical axis (b = 10^slope, a = 10^intercept). Confirm
the CED (2.15) does not expect natural-log semi-log plots too; adding them is one option in the model.

## From the Phase 1 self-reviews (merged 2026-10-31, integration pass)

Open points from `docs/apprecalc-reviews/self-a.md` to `self-f.md` (author in brackets). Duplicates went into
`frq2-2027` and `tools-t3-models`; points this pass closed are under "Resolved".

### growth-factor-2-3: where "growth factor" is taught (open, 2026-10-31, author B)

The map teaches `growth-factor` (with percent change) in 2.3; `framework.md` puts "base as growth factor and percent
change" in 2.5. Content follows the map (taught in 2.3, used again in 2.5). Confirm against the CED.

### slant-1-7: slant asymptotes before division (open, 2026-10-31, author A)

Long division is 1.11, so 1.7 finds a slant asymptote only by rewriting the numerator around the denominator
($x^2 + 2x + 3 = (x + 1)^2 + 2$), and its items avoid cases that need division. A teacher should confirm 1.7 needs
slant asymptotes at all (see also `tools-t2-slant`).

### frq-q1-log-function-scope: a 2.13 part on a 2.11 FRQ (open, 2026-10-31, author C)

Part C of `frq-q1-log-function` asks for the inverse of a transformed logarithm (2.13); `topics` lists
`exp-log-equations` too, so it is fine for exams (Unit 2 complete), but a reader who stops at 2.11 meets it early.
It is a form 2 exam FRQ (`phase3-frq-choice`). Keep, or move part C to a 2.11 task.

### practice-tags-2-13: an item tagged 3.C in a practice-1 topic (open, 2026-10-31, author C)

The map gives `exp-log-equations` only practice 1, but one error-analysis item there is tagged 3.C (the content
check validates tags against the framework, not the topic). Either add practice 3 to 2.13 in the map or retag.

### sinreg-items: no item keys a sinusoidal regression (open, 2026-10-31, author D)

A sinusoidal regression's constants depend on the calculator's algorithm and on rounded table values, so no
three-decimal key is safe; 3.7's calculator items solve a given model instead. Regression practice is in
`regression-lab` Explore only (`tools-t1-regression-methods`). Decide whether the exam's "sinusoidal regression"
skill needs items built on data that fit a sinusoid exactly.

### frq3-split: Q3 point split and reason points (open, 2026-10-31, author D)

The four Q3s use 2-2-1-1 with a reason required in C(i) and C(ii), our reading of the task models; the 2026
guidelines say parts A-C need no supporting work. A teacher should confirm the reason points match current scoring.
`frq-q3-spring` C(ii) asks for concavity and the rate in one point.

### q1-coverage: Q1s without composition or limits (open, 2026-10-31, authors A, B, E)

Composition and inverses are taught in 2.7-2.8, so `frq-q1-rational-graph` (Unit 1) and `frq-q1-exponential-justify`
(2.6/2.2) open with values and rates instead of a composite; `frq-q1-trig-composition` puts its points on an
inverse instead of limit notation. Both exam Q1s cover composition (`phase3-frq-choice`), so the exams are fine;
confirm the practice Q1s' mixes.

### lesson-plot: no `plot` field in lessons (open, 2026-10-31, authors B, E, F)

The lesson format has only `figure`, so every lesson uses a registered SVG figure drawn from its function (stimuli use
`plot` specs). Decide whether the generator should gain a lesson `plot` field.

### calc-in-sets: hand-doable items flagged calculator in mixed sets (open, 2026-10-31, author E)

A stimulus set is all calculator or all not, so `polar-rates-s2` (the secant estimate 5.85) and `inverse-trig-s2`
(the steepest ramp) carry `calc: true` though a student could do them by hand. Fine for practice; an exam form
should not count them as calculator skill.

### unit4-transition-matrix: "from" columns and column vectors (resolved 2026-10-31, Unit 4 review, author F)

4.14 uses columns that add to 1 and $\mathbf{x}_{n+1} = T\mathbf{x}_n$, to match 4.12-4.13 (matrices act on
columns); many texts use row vectors and "from" rows. Notes say so. Confirm against the CED's examples.
**Resolved.** Kept. The CED PDF could not be read past Unit 2 (WebFetch stops at Topic 2.10), but two CED-aligned
guides to Topic 4.14 (Albert "CED: Topic 4.14", Fiveable 4.14) both use column state vectors, columns that add up
to 1 and $T$ on the left, and step back with $T^{-1}$: the course's convention. The notes' aside on the row form
stays. A person with the CED may still glance at its 4.14 example.

### unit4-scope: conics, dot product, hyperbola parametrization, determinant placement (open, 2026-10-31, author F)

4.6 teaches standard forms, centers, vertices, axis lengths, hyperbola asymptotes, classifying and completing the
square, not foci, directrices or eccentricity. 4.8 includes the dot product and angle; 4.7 parametrizes a hyperbola
with $\sec$ and $\tan$. The map teaches the determinant in 4.11 (4.10 never uses the word); the CED may introduce
it in 4.10. Confirm each against the CED (the 4.x pages were not read: `ced-text`).

### plot-parametric: parametric curves, vectors and matrix pictures are SVG figures (open, 2026-10-31, author F)

`ApPrecalcPlot` draws only $y = f(x)$, so Unit 4's parametric paths, vectors, transformed squares and the state
diagram are standalone SVG figures from `scripts/apprecalc-figures/f.mjs` (each computed). A parametric curve type
with direction arrows would let later work draw them from a spec.

### formula-stimulus: matrices shown as a "table" stimulus (open, 2026-10-31, author F)

Sets that share matrices (4.10, 4.11, 4.12 s2, 4.13) use `kind: "table"` with an `html` block of display math; there
is no "formula" stimulus kind. Decide whether to add one (the panel would read "Formula" instead of "Table").

### undefined-t2: two T2 files still say "not defined" (open, 2026-10-31)

Spec decision 17 makes "undefined" the course word. `precalculus/assets/tools/symbolic-steps.js` (legend "one not
defined", band labels "rewrite not defined", "first not defined") and `precalculus/assets/tools/math/poly-rational.js`
(hole notes "is not defined") were left for builder T2, who was editing them. Switch them when T2 is done.

## Phase 3

### phase3-exam-only-share: most of Section I Part B is exam-only (open, 2026-10-31)

The bank has no standalone calculator singles, and its calculator stimulus sets hold one or two four-option items
each (the rest are numeric or lesson checks). So each form's Part B is one bank calculator set of 2
(`trig-equations-s2` in form 1, `logarithmic-functions-s2` in form 2) plus 11 exam-only items (22 in all, keys in
`EXAM_NUMBERS`). The Unit 1 set `rates-of-change-s2` was left out because the free Unit 1 unit test shows it. The
Phase 4 exam review should check all 22 exam-only items, their distractors and explanations, by hand.

### phase3-frq-choice: which FRQs the two exams use (open, 2026-10-31)

Form 1: `frq-q1-table-composition-inverse`, `frq-q2-quadratic-attendance`, `frq-q3-ferris-wheel`,
`frq-q4-quadratic-in-ex`. Form 2: `frq-q1-log-function`, `frq-q2-cubic-volume`, `frq-q3-tide`,
`frq-q4-single-tangent`. Both Q1s cover composition (and inverses), matching the recurring Q1 task model; both are
Unit 2, so neither exam has a Unit 1 Q1 (`frq-q1-rational-graph` stays practice). `frq-q1-trig-composition` is a
Unit 3 Q1; the released Q1s draw on Units 1-2, so it was not used in an exam. Confirm the mix, and whether one
exam should swap in `frq-q1-rational-graph`. No new FRQ was needed.

### phase3-unit-split: 15, 13 and 14 questions per unit (open, 2026-10-31)

Both forms have Unit 1 15, Unit 2 13, Unit 3 14 (Part A 10/9/10, Part B 5/4/4), near the midpoints of the CED
ranges (12-17, 10-17, 12-15 of 42). The CED does not split the units between Parts A and B; ours is a guess.
Practice (skill) weights stay unconfirmed (`practice-weights`).

### phase3-formula-page: what the formula page lists (open, 2026-10-31)

`EQ` in `scripts/lib/apprecalc-entry.mjs`: 39 rows in seven groups (rates of change; polynomial and rational
functions; transformations and models; exponential and logarithmic functions; the unit circle and sinusoids;
identities and equations; polar coordinates) and 8 "easy to forget" lines. It leaves out half-angle and tangent sum
identities (`exclusions-trig`) and Unit 4. A teacher should confirm nothing the exam expects by heart is missing
(for example the slant asymptote row is folded into the horizontal asymptote row).

## Resolved

### secant-1-2: secant wording in 1.2 (resolved 2026-10-31, integration pass, author A)

1.2 says "the slope of the line through $(a, f(a))$ and $(b, f(b))$"; the map (and the CED) teach "secant line" in 1.3.
**Resolved.** Kept as the map has it (spec decision 17): 1.2 uses "the line through" consistently, every topic from
1.3 names the secant line; the authoring guide now says so.

### restricted-domain-1-4: endpoint extrema in 1.4 (resolved 2026-10-31, integration pass, author A)

"Restricted domain" is the map's 1.13 term (an alias of `model-assumption`). **Resolved.** 1.4 says "on a closed
interval" and "an included endpoint" throughout (lessons, notes, glossary, items), and the authoring guide makes
that the rule for 1.4-1.12.

### expr-single-form: form tasks graded by value only (resolved 2026-10-31, integration pass, author C)

**Resolved.** `expr.form` (architecture, "Forms"; spec decision 15). `logarithmic-manipulation-10` and `-11` take
`{ type: "log" }`, `-12` a constant times $\log_2 x$, and 26 other items whose stems demand a form (single power,
the form $a(2)^x$, $ab^t$, vertex form, multiply out, simplified, single fraction, a sum of two terms, a single
trigonometric function, cosine only). The content check refuses a form stem without `form`.

### q4-stimulus: Q4 FRQs carried stand-in "directions" tables (resolved 2026-10-31, integration pass, authors C, E)

**Resolved.** `stimulus` is optional for `symbolic` (format, content check, FRQ page, exam and booklet); the five
Q4s have no stimulus and a one-line `intro` instead. Checked in the browser (desktop and phone): the intro sits in
a tinted band above the parts.

### plot-log-axis and unscaled-graphs: plot helper options (resolved 2026-10-31, integration pass, authors C, D)

**Resolved (tooling).** `ApPrecalcPlot` has `yLog: true` and `ticks: false` (spec decision 18). The semi-log and
unscaled Q3 graphs already made as SVG figures were not converted; they are correct, and converting them is optional
later work (`exp-log-lab` can use the log axis now).

### inverse-trig-notation: \sin^{-1} or \arcsin (resolved 2026-10-31, integration pass, author E)

**Resolved.** `\sin^{-1}` everywhere (spec decision 17); `ApPrecalcExpr.toTex` renders keys and the preview that
way, and the content check refuses `\arcsin` except beside the `^{-1}` form or in a rubric's accept list.

### log-near-duplicate: logarithmic-expressions-15 and logarithmic-manipulation-15 (resolved 2026-10-31, integration pass, author E)

Both asked for a logarithm's value with a calculator (ln 50; log₇ 20). **Resolved.** `logarithmic-expressions-15`
now asks for $\log 0.004$ (a negative common logarithm, checked between $-3$ and $-2$; mistakes: the lost sign and
$\ln 0.004$), so 2.9 drills the meaning of the exponent and 2.12 keeps change of base.

### select-all-single-key: bank-wide 20% rule (resolved 2026-10-31, authors B, C, D, E)

**Resolved.** Authors switched select-all items to one key; the content check's test-wise rule passes (0 failing).

### radians-3-1: no radians in 3.1 (resolved 2026-10-31, author D)

The map teaches `radian` in 3.2, so 3.1 has no trig notation. **No change needed**; recorded in case the lead wanted
a preview.

### shared-diagnose-words: calculus words in the shared number feedback (resolved 2026-10-31, integration pass, builder T4)

`ApPrecalcMath.diagnose` (`precalculus/assets/tools/pcalc-tool-math.js`, forked from AB) falls back to "a minus
sign from a derivative", "the antiderivative of x" and "a volume of revolution" when no authored slip matches. A
precalculus student can see these. `polar-graphs` and `vectors-matrices` author their own sign, factor-of-2 and
factor-of-π slips so the fallback never shows; the other trainers may not. Suggested shared fix: reword the three
messages ("Check the order of a subtraction or a sign from the unit circle", "Check a ½ or a doubled term",
"Check for a missing π").

**Resolved.** Verified in `precalculus/assets/tools/pcalc-tool-math.js`: `diagnose` now says "Check the order of a subtraction or a dropped minus sign", "Check a missing ½ or a term counted twice" and "Check for a missing π, as in the area of a circle or a radian conversion"; no calculus word remains.

### tools-t3-diagnose: shared slip notes use calculus words (resolved 2026-10-31, integration pass)

`ApPrecalcMath.diagnose` (`precalculus/assets/tools/pcalc-tool-math.js`, shared, not edited by builder T3) still
carries AP® Calculus AB's generic notes: "a minus sign from a derivative", "the antiderivative of x", "as in a volume
of revolution". A drill shows them when no authored slip matches. Proposed wording: sign "Check the order of a
subtraction or a lost minus sign."; factor of 2 "Check a ½ or a doubled term."; factor of π "Check for a missing or
extra π." The unit circle and sinusoid builder author the sign slip on every step where it can happen, so they rarely
reach the generic note.

**Resolved.** Same fix as `shared-diagnose-words`.

### tools-t3-wording: "not defined" for tan at π/2 (resolved 2026-10-31, integration pass)

The drill checker (`_drills.mjs`) refuses the word "undefined" in any step text, so the unit circle says "tan θ is not
defined" (OP is vertical, no slope). A teacher may prefer "undefined"; changing it needs the shared check to allow the
word in trainer text.

**Resolved.** The course word is "undefined" (spec decision 17): the CED and 96 of 103 uses in the content already said it. The drill checker (`scripts/lib/apprecalc-tool-checks/_drills.mjs`) now refuses only a bare JS `undefined` (it allows "is undefined", `\text{undefined}` and a label that is just the word); the unit circle (page and model), the function lab, `data/tools/unit-circle.json` and five content strings were switched. Still saying "not defined": `symbolic-steps.js` (legend "one not defined") and `math/poly-rational.js` (hole notes), builder T2's files while T2 works; see `undefined-t2`.

### tools-t2-single-form: Q4 "single term" answers are typed as their inside (resolved 2026-10-31, integration pass, builder T2)

Symbolic steps asks for a single log, power, sine or tangent by its inside ("the expression is ln(B); type B"), so
the form is one term by construction and B is graded by value on the problem's domain. The shared grader has no
"form" check, so a fully typed `ln(...)` answer cannot be graded as a single term without one. If the owner wants
students to type the whole single-term answer, the shared change is a `form` option on an `expr` step (for example
`{ form: { outer: 'ln' } }` checked on the parse tree in `ApPrecalcExpr.grade`). A teacher should also confirm the
domain step ("equal for x > 0, where the original is defined") matches how Q4 rubrics treat domain.

**Resolved.** The shared change exists: `expr.form` (architecture, "Forms"), e.g. `{ type: "log" }` or `{ type: "power", base: 2 }`, passed through `ApPrecalcMath.exprCell(answer, { form })`. Typing the inside stays a fine design; switching to whole single-term answers is T2's call. The domain-step question for a teacher stays open under `teacher-review`.

### residual-sign: residual = actual minus predicted (resolved 2026-10-31, Unit 2 review, author B)

Items, notes, glossary and `frq-q2-cooling-residuals` use residual = actual − predicted. Confirmed against College
Board's "AP Precalculus CED Clarifications and Corrections" (ap-precalculus-ced-clarification-and-guidance.pdf),
updated EK 2.6.B.1: a residual is "the actual value of the dependent variable ... minus the value predicted";
EK 2.6.B.2 lets error be the signed difference or the absolute value of the residual. No key changed. The CED
topic page itself (2.6) could not be read (WebFetch stops at the Unit 2 table), and `framework.md` section 3 still
says "confirm"; its wording now matches.

## Unit 2 review (2026-10-31)

Points from the independent Unit 2 accuracy review (`docs/apprecalc-reviews/unit-2.md`).

### u2-exclusions: no Unit 2 exclusion in the clarifications PDF (open, 2026-10-31, Unit 2 review)

The CED clarifications PDF lists updated EKs for 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.13, 2.14 and 2.15 and no "outside
the scope" statement for Unit 2; its only exclusion is Unit 1's open/closed endpoints. The CED's own Unit 2 topic
pages were not readable here, so `ced-exclusions` stays open for a person with the PDF.

### u2-practice-calc-flags: calculator flags on semi-log set 1 (open, 2026-10-31, Unit 2 review)

`semi-log-plots` 1-3 are `calc: true` because they share the calculator stimulus with 4-5, though they need no
calculator. Harmless in practice; exams take sets whole, so a form using this set puts all five in Part B.

## Unit 3 review (2026-10-31)

Points from the independent Unit 3 accuracy review (`docs/apprecalc-reviews/unit-3.md`).

### u3-ced-unread: Unit 3 topic pages and exclusions not read (open, 2026-10-31, Unit 3 review)

WebFetch of the CED PDF stops partway through Unit 2; a direct download was refused by the network proxy (403) and
the scraping service had no credits. So 3.1-3.15 were checked against `framework.md` section 3 (third-party), not
the CED, and `exclusions-trig` (half-angle, tangent sum) and `ced-exclusions` stay open. Nothing in Unit 3 uses a
half-angle or tangent-sum identity, so the content is safe whichever way that resolves.

### u3-rate-at-a-point: "the rate of change is 0 at the top" (open, 2026-10-31, Unit 3 review)

A few explanations speak of the rate of change at a single point, not on an interval: `pcalc-sinusoidal-modeling-4`
("it starts at 0 at the peak"), the 3.4 notes ("from 0 at the lowest point toward its steepest at the zero"), and
`frq-q3-spring` C(ii) (rubric and sample: "the negative rate of change increases toward 0", "momentarily stops").
None uses the refused calculus words, and the CED's own 1.3 speaks of a rate of change at a point, but a teacher
should confirm Q3 readers accept this wording, or the lines can be cut back to the interval statements.

## Unit 4 review (2026-10-31, independent accuracy review; report `docs/apprecalc-reviews/unit-4.md`)

### unit4-scope-review: what the review could and could not confirm (open, 2026-10-31, Unit 4 review)

`unit4-scope` stays open: the CED topic pages for 4.6-4.11 were not readable (the PDF text ends at Topic 2.10;
the Firecrawl route was out of credits). Third-party CED-aligned guides (Fiveable 4.6) mention a parabola's focus and
directrix and an ellipse's foci ($c^2 = a^2 - b^2$), which 4.6 does not teach. Unit 4 is not on the exam, so this is
low risk; if the CED's 4.6 lists foci or directrix, add a short notes section and two items. The dot product (4.8),
the $\sec$/$\tan$ hyperbola (4.7) and the determinant in 4.11 are standard and kept.

