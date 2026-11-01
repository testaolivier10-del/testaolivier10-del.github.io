# Tools and exams review (Phase 4): the six BC trainers, the two practice exams, unit tests, prompts, formula rows

Branch `claude/apcalcbc`, 2026-10-31. Independent accuracy and quality check, from the reviewer's own computation
(scratch code, never the model or the validators) and hands-on play in Chrome (Playwright) on a scratch build with
every unit published. Scope: `calculus-bc/assets/tools/` (six page scripts, six models, CSS),
`calculus-bc/data/tools/`, the validators and tool tests, `calculus-bc/data/exams/` (2 forms, 26 exam-only items),
`calculus-bc/data/unit-tests.json`, `calculus-bc/data/justify/` (11 BC prompts) and the BC formula rows in
`scripts/lib/apcalcbc-exams.mjs`. No lesson, notes, bank, glossary or FRQ file was touched.

## How it was checked

- **Trainers, numbers.** 300 problems per context and kind regenerated per tool (10,800 problems) and every string
  a student can see (text, labels, hints, options, every slip's why, solutions, expression keys) scanned for raw
  TeX, NaN/undefined, long decimals, `-0`, sign clashes and unpretty keys. One or more problems per kind read in full
  and recomputed by hand or by my own code (partial sums, geometric sums, ratio limits, every endpoint series,
  Taylor coefficients, Lagrange and alternating bounds, Euler tables, logistic L, L/2, max rate and inflection time,
  parametric slope, d²y/dx², arc length, position, speed and distance by Simpson, polar x, dr/dθ, dy/dx, petal and
  between-curve areas). All agreed with the keys.
- **Trainers, play.** Each tool at 1280 and 360 px, light and dark: landing state, Explore modes, and Test yourself
  for every kind (2 problems per kind at 1280, 1 at 360 dark): a wrong try, a second wrong try, Show the answer,
  worked solution, with a check of the feedback HTML for raw TeX and of the filled-in answer. No console errors.
- **Free user.** Simulated with `apcalcbc` on sale and signed out: Series lab works in full; the five Premium
  trainers show the Premium card ("Every BC trainer ...", $17.50 founding / $25) with the free-notes link. Correct.
- **Exams.** All 26 exam-only items: every option of every item recomputed in my own script from the stem (all
  four options of all 26 match; each distractor's value matches the slip its explanation names, after the two fixes
  below). Forms: 42 MCQ each, Part A 29 no-calculator bank items, Part B 13 calculator exam-only items, none a lesson
  check, none in AB's forms, none in both forms; units 3/3/3/3/5/7/3/3/5/7 on both; Section II Q1/Q3/Q4 AB types,
  Q2 `parametric`, Q5 `techniques`, Q6 `series`, 9 points each, Q1-Q2 calculator.
- **Unit tests** (Units 9 and 10, 24 items): rules (12 each, no calculator, single/numeric, not a lesson check or
  exam item, 9 of 9 and 11 of 15 topics) and every key worked by hand. All right.
- **Justification prompts** (11 BC): every number, checklist line and the earns/misses answers worked by hand. All
  right. **Formula rows** (6 in AB groups, 24 in BC groups, 5 "easy to forget"): checked, and the page rendered
  at 360 px.

## Problems found and fixed (worst first)

| Where | What was wrong | Fix |
|---|---|---|
| Polar lab, Explore | The area readout and the set-up `½∫₀^θ r² dθ ≈ …` took the area from a 480-step table at the nearest sample, so on landing θ = 1.88 showed 9.165 (the area to 1.885); the true value is 9.160. Three-decimal values that disagree with their own stated limit | `areaTo(θ)` integrates to θ itself (`PL.area`) for the pill, the set-up and the screen-reader text |
| Taylor lab, Maclaurin drills | The coefficient step's slip explanations were shown with raw `$...$` TeX ("Substitute $3x$, so $x^3$ comes with $3^3$") in about 80% of Maclaurin problems | Slips pass through `H()` like every other why |
| Integration methods, parts drill | A slip why showed raw `F(\frac{π}{2})` | Rendered as math |
| Taylor lab, Integration methods, Euler and logistic | "Show the answer" filled in machine keys: `4*(ln(abs(x - 1)))`, `1*x^2 - (1/6)*x^4`, `x^1*ln(x)/1 - x^1/1`, `(-3) - -3*b^(-1)`, `2*x + -1*(x^2 + -1*y)`, `4*ln(1) - 4*ln(b)` | Each model runs its expression keys through `pretty()`: `4 ln|x - 1|`, `x^2 - x^4/6 + x^6/120`, `x ln(x) - x`, `-3 + 3/b`, `2x - (x^2 - y)`. A rewrite is kept only when `M.compare` finds it equal to the original at the cell's own points, so grading cannot change. At source: tabular keys reduced (`x^2*e^(2x)/2 - x*e^(2x)/2 + e^(2x)/4`, was `… - 2x*e^(2x)/4 + 2*e^(2x)/8`, also in the worked solution), improper keys with no `ln(1)` terms and exact lower values (`1/8`, not `0.125`) |
| Euler and logistic, phones | The `L` label under the dP/dt graph's axis ran into the `800` tick ("L800") at every width; on phones the lower-right corner of the plots (axis label, last tick) sat under the Enlarge button | `L` drawn under its tick label; on phones (≤ 640 px) Series lab, Integration methods and Euler/logistic keep 40 px clear under the figure for the button (Taylor, parametric and polar already have a legend row there) |
| Euler/logistic, Integration methods, Series lab, Taylor lab, dark theme | Pressed chips, mode buttons and drag handles were AB's pink (`#F7B8CA`, AB's dark `--cink`) in a violet course | BC's dark ink `#D6BFF5` with dark text |
| Formula page, phones | The integral-test row's formula (369 px of unbreakable math) pushed the table past a 360 px screen, clipping the right edge of every row on the page | "both converge or both diverge" moved into the row's description |
| Exam `cbc-exam-1-08` | Distractor 3.646 explained as "the slope at the right end of each step"; it is the slope with the step's end x and the current y | Explanation says what was done: $(x + 0.5) + \sin y$ |
| Exam `cbc-exam-1-10` | Distractor 4.352 explanation ("drops the value at $x = 1$ with the wrong sign … which is subtracted") was garbled | "Adds the value of the antiderivative at $x = 1$ instead of subtracting it: it is $-\frac19$ there, so subtracting it adds $\frac19$" |
| Series lab, absolute/conditional drill | Every wrong option's feedback was the same "Not this one: …", including "Diverges: the terms do not approach 0" | Each says what is wrong with that reason (the terms do approach 0; not geometric; the ratio limit is 1; not a p-series / here p ≤ 1; the limit comparison with 1/n is not finite and positive), then the right reason |
| Polar lab, Explore | The θ pill said 1.88 while the slider read 1.89 on landing (start angle 0.6π sat between slider steps) | Start angle rounded to the slider step |
| Polar lab, petal solution | "$\frac{4}{2}\cdot\frac{\pi}{4} = \frac{4\pi}{8}$" | Reduced: $2 \cdot \frac{\pi}{4} = \frac{\pi}{2}$ |
| Euler/logistic, logistic solution | "The rate is 0 where R = 0 and where factor: …, zero at R = 800" (broken sentence); a slip said "kP(L − P)" in an R problem | Sentence rebuilt; the slip uses the problem's letter |
| Taylor lab, coefficient solution | "$f'''(2) = 6 \cdot -1$" | $6 \cdot (-1)$ |
| Taylor lab, legend | "P  n" (the flex gap split P from its subscript) | One item, $P_n$ |
| Parametric motion, second-derivative drill | Keys like `-(2cos(t))/(4sin(t))` and the solution "$1.5 + \frac{2}{2t^2}$" unreduced | Reduced (`-cos(t)/(2sin(t))`, $\frac{1}{t^2}$) |
| Integration methods, partial fractions | Slip text "Cover up x − 0" | "Cover up x" (also "x + 3" with a true minus elsewhere) |
| Euler/logistic, phones | The error pill read "Under by 1.8…" (cut off) | Pill key "Under" / "Over", value beside it |

No key changed on any exam, unit-test, prompt or bank item. In the trainers no graded answer changed (expression
keys are rewritten only when equal at every grading point; the polar change is a display value).

## The bar, per trainer

All six are interactive simulations with one Start-here cue, Why and Details, Explore plus Test yourself with
seeded drills and the Keep going strip, full screen in the Tool Studio, legible at 360 px in both themes after the
fixes above. Series lab (number and power series, partial sums against the limit, interval on a number line with
open and filled ends) and Polar lab (sweep with the slice and the ½∫r² set-up built live, r-against-θ strip with
toward/away shading) are the strongest. Every displayed number I checked agrees with the function the tool states.

## Check results

- `node scripts/check-apcalcbc-content.mjs --check`: 0 failing (510 items, tools 0, exams 0).
- `node --test scripts/test/apcalcbc-*.test.mjs`: 71 of 71 pass.
- `node scripts/check-apcalcbc-map.mjs --check`: clean. `node scripts/build-apcalc.mjs --check`: AB unchanged.
- My string scan over 10,800 generated problems: no raw TeX, NaN or unpretty key left.

## Open points (not fixed; for the lead or a person)

- **Shared, cosmetic**: `|a_n|` renders with a gap after the first bar ("|aₙ |") wherever the shared TeX renderer
  meets bare `|` (Series lab labels, AB too). A fix belongs in the shared renderer (`\lvert … \rvert` handling).
- **Wording**: Series lab interval endpoints say "a p-series with p > 1 (in absolute value)" even when the endpoint
  series is all positive; harmless, slightly odd.
- **Parametric motion**: $y'(t) = e^{\frac{-t}{2}}$ is typeset as a fraction in the exponent; $e^{-t/2}$ reads better.
- **Unit tests and Part B balance** (`p3-part-b`) stay owner/lead calls; the content is correct.
