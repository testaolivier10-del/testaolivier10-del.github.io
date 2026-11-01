# Unit 2 review (topics 2.1-2.15, eight FRQs)

Branch `claude/apprecalc`, 2026-10-31. Independent accuracy check (reviewer, not the author), against
`docs/apprecalc-briefs/review-common.md`, `docs/apprecalc-authoring-guide.md`, `docs/apprecalc-architecture.md`
("Math", "Content formats"), `docs/apprecalc-research/framework.md` (Unit 2, exclusions, sections 5 and 7) and the
author reports `self-b.md` (2.1-2.6) and `self-c.md` (2.7-2.15).

Scope: `sequences`, `linear-vs-exponential`, `exponential-functions`, `exponential-manipulation`,
`exponential-modeling`, `model-validation`, `composition`, `inverse-functions`, `logarithmic-expressions`,
`exp-log-inverses`, `logarithmic-functions`, `logarithmic-manipulation`, `exp-log-equations`,
`logarithmic-modeling`, `semi-log-plots` (lesson, notes, questions, glossary, figure registry each; 255 items: 83
numeric, 31 expr, the rest single, multi, order and predict; 30 stimuli), the 17 Unit 2 figures, and the FRQs
whose topics are in Unit 2: `frq-q1-exponential-justify`, `frq-q1-log-function`, `frq-q1-table-composition-inverse`,
`frq-q2-cooling-residuals`, `frq-q2-exponential-depreciation`, `frq-q2-logarithmic-sales`,
`frq-q4-exp-log-equations`, `frq-q4-quadratic-in-ex`.

## CED

- The CED PDF could be read only up to the Unit 2 "Unit at a Glance" table (WebFetch stops about 2.10); the Unit 2
  topic pages (LOs, EKs, any exclusion) were not readable, and a direct download was blocked by the proxy.
- The College Board "CED Clarifications and Corrections" PDF was read in full. It has updated EKs for 2.1.B,
  2.2.A-B, 2.3.A.4, 2.5.B.3, 2.6.B.1-2, 2.7.A.4, 2.13.B.1-2, 2.14.A.6, 2.15.A.1-2. The content matches all of them
  (geometric sequences from the kth term, exponential through a point with a known ratio, additive transformations
  of exponentials, models used to find inputs, identity function, inverses of transformed exp/log functions,
  semi-log plots without a vertical shift). No "outside the scope" statement for Unit 2 there.
- **`residual-sign` settled**: EK 2.6.B.1 (updated) defines a residual as the actual value minus the value
  predicted; EK 2.6.B.2 allows error as a signed difference or an absolute residual. The course already uses
  actual minus predicted everywhere, so no key changed. Marked resolved in `docs/apprecalc-needs-author.md`.

## Recheck

- Every numeric key (83) recomputed by my own scratch script from the stems (least squares written from scratch
  for the exponential, linear and logarithmic regressions; bisection for calculator solves), then graded through
  `pcalc-questions.js` in a vm as a three-decimal value (calculator items) or the exact value: 0 mismatches. Every
  authored numeric mistake graded wrong. No rounded-looking key on a no-calculator item.
- Every `expr` key (31) compared with an independent JS reference at 201 points of its domain, every inverse key
  composed back to the identity, every authored mistake graded wrong through the runtime: 0 problems. Domains catch
  the log slip where it matters (`logarithmic-manipulation-11` on [-3, 3] marks `2ln(x)` wrong).
- "All solutions" items brute-forced: `composition` 3, 5, 8 (every table and graph input), `logarithmic-functions`
  7 (0.430, 7.613), `exp-log-equations` 19 (only `ln 4`); FRQ solves `g(x) = 4` (2 ± √3, 2), `g(x) = 2` (−1.675,
  −0.539, 2.214), `3ln(x − 1) − 2 = 0.4x` (4.594, 14.545), `E(t) = 40` (27.610).
- Stimulus data rechecked: follower residuals match the regressions (L: 48.93 ... 59.79; E within 2.58), sapling
  regression a = 12.000, b = 13.398.
- FRQ numbers recomputed: cooling (m = −2.168, c = 89.120, residuals −2.440 and 0.198, E(30) = 38.003, L < 22 after
  30.959), depreciation (a = 28389.581, b = 0.845381, C(3) = 17152.039 < 17666.667), sales (b = 12.022, S(4) =
  28.667 > 22.714, t = 54.192), log function (g(f(6)) = 2.159, f(1) = 1.5, g⁻¹(4) = 1 + e²). All right; every
  written answer names the secant, reads concavity on the stated interval, uses limit notation and has no calculus
  wording. All eight FRQs: 6 points, one rubric line per point, a sample per part, calculator flag by type.
- All 17 figures rendered to PNG (Playwright) and looked at; every plot spec in the stimuli checked against its
  stated function (zeros, asymptotes, points).
- `check-apprecalc-content.mjs --topic` 0 failing for all 15 topics (the per-topic "exams failing" line is the exam
  check run on a one-topic subset); full `--check` 0 failing; `node --test scripts/test/apprecalc-*.test.mjs` 143 pass; `check-apprecalc-map.mjs --check`: nothing used
  before it is taught. Scratch build of Units 1-2 (`--out` in scratch): 38 topics, no errors.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| exponential-modeling | lesson prereq 2 | Two correct options: the "wrong" option $(1.2^{12})^{t/12}$ equals $1.2^t$ too (the word "only" did not make it wrong) | Option is now $1.2^{t/12}$ |
| logarithmic-functions | `-17` option 4 and its explanation | "$f$ has no maximum on $[1, 4]$" is false: on the closed interval $\ln x$ has its maximum at the endpoint $x = 4$ | Option is "a turning point in $(1, 4)$"; explanation says the largest value on $[1, 4]$ is at the endpoint |
| exp-log-inverses, inverse-functions, logarithmic-modeling | lesson hook / idea | `\\\"` in the JSON: the built pages showed a literal backslash before each quotation mark | Plain `\"` |
| semi-log-plots | notes, "Reading values between labels" | "$10^{2.8} \approx 632$": $10^{2.8} = 631.0$; the value halfway is $10^{2.801} = \sqrt{200 \cdot 2000} \approx 632.5$ | States $\log$ about $2.801$ and $\sqrt{200 \cdot 2{,}000} \approx 632$ |
| linear-vs-exponential | lesson figure caption | "The exponential function starts lower": both start at $4$ | "Both start at $4$; the exponential falls behind at first, then passes the line between $x = 5$ and $x = 6$" |
| logarithmic-expressions | lesson hook | Threshold of hearing to "a jet engine" called a factor of about $100$ billion ($11$ steps); a jet engine nearby is about $10^{14}$ | "a very loud rock concert" (about $110$ dB, $10^{11}$) |
| logarithmic-modeling | `-9` mistakes | Two mistakes with the same value ($3.583$, the value of $\ln x$), so the second could never show | Second mistake is now the base-10 slip $10^{(60 - a)/b} \approx 3825.091$ |
| linear-vs-exponential | `-5` option 1 explanation | "The second difference is $20$": confusing for rates $5, 15, 45$ | "The rates increase by $10$, then by $30$: not by equal amounts" |
| exponential-functions | `-15`, `-6` (key-length balance) | Key 97 characters against 16-26 (`-15`) and 75 against 40-50 (`-6`): the longest option gave the answer away | Distractors lengthened, keys shortened; same keys and meanings |
| exponential-manipulation | figure `exponential-manipulation-shift` (generator `scripts/apprecalc-figures/b.mjs`) | The label "h(x) = 2ˣ⁺³ = 8(2ˣ)" crossed the y-axis and its tick label 16 | Label moved left; regenerated with b.mjs (only this SVG changed, checked by checksum) |

Keys changed: none.

## Looked at, left as is

- Option order: author C's single items all key option 1; the runtime shuffles non-fixed items, so no change.
- Key the longest option: after the fixes, the remaining cases are ties (equal-length options) or a gap of 1-7
  characters.
- `exponential-modeling-9` keys $2488.32$ members (the model's output, exact, no calculator); $2488$ is a coded
  mistake. Defensible, as the stem asks what the model predicts.
- `model-validation-11` and some other select-all items have one key; that is allowed (bank rule on one-key share).
- `semi-log-plots` 1-3 carry `calc: true` with the calculator set though they need no calculator (needs-author
  `u2-practice-calc-flags`).
- `frq-q1-log-function` C(i) uses 2.13 content (author C's note); fine for exams.
- Make it specific prompts for Unit 2 were not in this scope.

## Open questions for a person

- `ced-exclusions` (Units 2-3) stays open: the clarifications PDF has no Unit 2 exclusion, but the CED's own topic
  pages could not be read here (`u2-exclusions`).
- `growth-factor-2-3` stays open: the clarifications PDF does not settle where "growth factor" is taught.
- `framework.md` section 3 (2.6) still says "confirm against the CED"; it can now cite EK 2.6.B.1 (updated).
