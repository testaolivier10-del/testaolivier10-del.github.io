# AP® Calculus BC authoring guide

**Read `docs/apcalc-authoring-guide.md` first: every AB rule holds for BC** (originality, the trademark, math
syntax, notation the exam rewards, justifications, the three-decimal rule, items, stimuli, figures, FRQs). This
file adds what BC needs. Formats: `docs/apcalcbc-architecture.md`; scope and the misses to target:
`docs/apcalcbc-research/framework.md` (sections 4 and 7). Where this guide and `docs/apcalcbc-spec.md` differ,
the spec wins.

## Before you write a BC topic

1. Find it in `docs/apcalcbc-dependency-map.json` (the overlay) and `docs/apcalcbc-ced-map.json`; write the
   objectives in your own words. The ordering rule runs on the merged order (`node scripts/check-apcalcbc-map.mjs
   --order`): a BC topic may use every AB topic before it in CED order, and nothing later.
2. Write **only under `calculus-bc/data/`**: `lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`,
   `glossary/<id>.json`, `figures/<id>.json` (figures in `calculus-bc/figures/`), FRQs in `frq/`. Never copy an
   AB file: AB topics are read from `calculus/data/` (the check fails on an AB topic's file here).
3. Question ids are **`cbc-<topic>-<n>`**; stimulus ids `<topic>-s<n>`; FRQ ids `frq-<unit>-<theme>`.
4. Run `node scripts/check-apcalcbc-content.mjs --topic <id>` until clean, then `node scripts/check-apcalcbc-map.mjs --check`.
   To see pages: `APCALCBC_PUBLISHED=unit-10 node scripts/build-apcalcbc.mjs --out <your scratch dir>`.

## Changing what an AB page says on BC pages (no copies)

An AB notes page or lesson that is wrong for a BC reader ("partial fractions belong to the BC course", a 6.14
technique list without parts) is fixed in the AB file with two classes, in one element each, never nested:

- `<span class="calc-ab-only">...</span>`: shown on AB pages, dropped from BC pages.
- `<span class="cbc-only">...</span>`: shown on BC pages, dropped from AB pages.

AB's output stays byte-identical as long as the `calc-ab-only` text is the old text. A `cbc-only` block on an AB
page is scanned by the BC ordering rule at that AB topic's place: it may name only BC concepts taught before it.

## Scope (CED, text-verified; framework.md section 4)

- Tests assessed in Unit 10: the **nth term test** (divergence only), **integral**, **direct comparison**,
  **limit comparison**, **alternating series** and **ratio** tests. The root test and others are not assessed;
  mention them only in a `going-further` aside.
- Series to know by heart: the Maclaurin series of `1/(1 - x)`, `sin x`, `cos x`, `e^x`. Others (ln(1 + x),
  arctan x) are **derived** in 10.15 from these, never listed as memorized.
- **Linear partial fractions** with distinct linear factors only (no repeated or irreducible quadratic factors;
  needs-author `partial-fractions-scope`). **Logistic models** are interpreted, not solved.
- Unit 9 does not teach polar arc length, dot or cross products, unit tangent vectors or curvature.
- Indeterminate forms in items stay 0/0 and ∞/∞ (the CED excludes others on AB and BC).

## Notation

- **Series**: `$\sum_{n=1}^{\infty} a_n$`, `$\sum_{n=0}^{\infty} \frac{x^n}{n!}$`; the nth term `$a_n$`, the nth
  partial sum `$S_n$` ("the sum of the first n terms"), the sum `$S$`. Say "the **series** converges" (never "the
  terms converge" for the series; the 2024 report). Limits in `n`, not `x`, for sequences: `$\lim_{n \to \infty} a_n$`.
- **Factorials** `$n!$`, `$(2n + 1)!$`; higher derivatives `$f^{(4)}(0)$`; Taylor coefficient `$\frac{f^{(n)}(a)}{n!}$`.
- **Taylor polynomials** `$P_3(x)$`, written out term by term, with no `+ \cdots` (a polynomial is not a
  series: the 2023 and 2025 reports). A series is written with `+ \cdots` or with sigma notation and a general term.
- **Vectors** `$\left\langle x(t), y(t) \right\rangle$` (the renderer needs `\left\langle ... \right\rangle`),
  speed `$\sqrt{(x'(t))^2 + (y'(t))^2}$`, never `$\left|\frac{dy}{dx}\right|$`.
- **Parametric**: Leibniz form `$\frac{dy}{dx} = \frac{dy/dt}{dx/dt}$` (dx/dt ≠ 0 stated);
  `$\frac{d^2y}{dx^2} = \frac{\frac{d}{dt}\left(\frac{dy}{dx}\right)}{dx/dt}$`. Position from velocity always
  **adds** the initial value: `$x(3) = x(0) + \int_0^3 x'(t)\,dt$`; the `\,dt` is never dropped.
- **Polar**: `$r = f(\theta)$`, `$x = r\cos\theta$`, `$y = r\sin\theta$`, area `$\frac{1}{2}\int_{\alpha}^{\beta} r^2\,d\theta$`
  with the ½ and the square shown in every setup; θ in radians.
- **Improper integrals**: limit notation to the end, `$\lim_{b \to \infty} \int_1^b \frac{1}{x^2}\,dx$`; never
  "arithmetic with ∞" (`$-\frac{1}{\infty}$`). The 2026 guidelines give the point only with correct notation throughout.
- **Integration by parts**: name `u` and `dv` explicitly; evaluate `uv` at both bounds. Tabular layout is fine.
- **Euler's method**: a table with labelled columns `x`, `y`, `dy/dx`, `Δx`; no simplification needed in FRQ answers.

## Typed answers in BC

- **Intervals of convergence** are `interval` items (architecture, "interval items"): key the endpoints exactly,
  set `loIn`/`hiIn` from each endpoint's own test, write `ends.lo` and `ends.hi` (the series at that endpoint
  and the test that decides it), and author the classic slips in `mistakes`: both endpoints open (the ratio
  test used at an endpoint), both closed, the radius given for the interval. The checker grades each `mistakes`
  entry wrong and the key right.
- **Taylor polynomials and power-series sums** are `expr` items in `x` (`mode: "exact"`), with a `domain`
  inside the interval of convergence and slips such as the wrong center, a missing factorial, the wrong sign
  pattern. The expression parser does not read `!`: write factorials in the key as numbers (`x^3/6`).
- **Radius**, sums of geometric series, error bounds as numbers: `numeric` items (exact on no-calculator items).
- **Vectors** (velocity at t, position): ask one component at a time, or a single-answer item.

## Wording that earns the BC points (framework.md section 7)

- **Endpoints**: test each endpoint with a named test and its conditions; say why the ratio test cannot (its
  limit is 1 there); give the interval with brackets. Radius and interval are different answers.
- **Error bounds**: name the bound and why it applies ("the series alternates, its terms decrease in size and
  approach 0, so the alternating series error bound applies"), compute it, and write the inequality the
  question asks for: `$\text{error} \le \frac{1}{120} < 0.01$`. "Error is at most", never "error equals".
  Lagrange: say on which interval the maximum of the next derivative is taken and why that value bounds it.
- **Comparison tests**: compare positive terms with a series whose behavior is named and known (geometric with
  its ratio, p-series with its p); limit comparison needs a finite positive limit, written with `n`.
- **Polar**: square r, keep the ½, find the θ limits from where the curves meet or r = 0; "distance from the
  y-axis" is |x| = |r cos θ|; "moving toward the origin" reads the sign of `dr/dθ`.
- **Parametric motion**: speed is a magnitude; "y is decreasing" reads `dy/dt`, not `dy/dx`; a tangent line
  states its slope and point; calculator answers carry the setup and three decimals.
- **Classification** (polar or parametric critical points): a sign change or second derivative argument for a
  local extremum, the candidates test for a global one, as in AB.

## Items, stimuli and FRQs

As AB (15+ items per CED topic, 60% apply/analyze, 40% in sets of 4-5, four options, per-option explanations,
key-length balance). BC stimulus sets that work: a table of derivatives at a center (Taylor), partial sums
plotted against n, a parametric path with direction arrows, a polar curve with a shaded sector, a ratio-test
table. FRQs of type `parametric` (calculator), `techniques` and `series` (no calculator), 9 points, one
rubric line per point, a full-credit sample per part, no drawing parts.
