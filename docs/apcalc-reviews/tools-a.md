# Independent review: limit-explorer, tangent-tracer, rule-drills (2026-10-13)

Reviewer: independent (not the builder). Scope: the three free AP® Calculus AB trainers, their models
(`calculus/assets/tools/math/<slug>.js`), pages (`<slug>.js/.css`) and data. Rules: `docs/apcalc-briefs/review-common.md`,
bar: `docs/apcalc-briefs/tools-common.md`. The phone pass for the same tools is in `docs/tools-phone-pass/calc-a.md`.

## What was checked

- **Every drill kind** (33 kinds: 12 limit-explorer, 6 tangent-tracer over 8 contexts, 13 rule-drills), generated
  through the model with the page's seeded RNG and rechecked by my own scratch scripts, written from the stems and
  pictures, not from the model's numbers or the builders' validators:
  - limit-explorer (200 seeds per kind): graph limits and f(a) read off the drawn pieces and dots (open ends where
    the dot is not); table limits by my own one-sided extrapolation of the stated function, every table cell
    re-evaluated; one-sided, continuity and "make it continuous" keys from the cases text parsed to code; limit laws
    by substituting the given limits; algebra keys by numeric two-sided limits, the cancelled expression equal to f
    off the hole; squeeze bounds checked to hold on [−2, 2]; discontinuity type from the picture; infinite limits by
    sign at a ± 10⁻⁷; limits at infinity at x = ±10⁸–10⁹; IVT counts by sign changes in the table.
  - tangent-tracer (200 seeds per context): the drawn tangent line really tangent (f(a) and f′(a) by central
    difference vs the two grid points), point B on f and the slope comparison; the table bracket and quotient, and
    no named slip within the key's tolerance; exactly one of the four "which graph" pictures equals my numeric f′,
    zeros at the dashed lines; sketch targets equal my numeric f′ of the drawn pieces and the exact answers grade
    right; tangent-line keys equal f(a) + f′(a)(x − a) from the stem; not-differentiable: exactly one marked x fails,
    and the kind (corner, cusp, vertical tangent, gap) and continuity measured from one-sided quotients.
  - rule-drills (200 seeds per kind): every expression key against a 5-point-stencil derivative of meta.f (u′, v′,
    inner u′ too), f″ by a second-difference stencil, implicit slopes by solving F(x, y) = C with Newton at x₀ ± h,
    inverse-function g′(a) = 1/f′(b) with f(b) = a checked, rewrite c·xᵖ = f; every named slip graded wrong.
- **Named-miss feedback** read for a sample of every kind (two seeds each, all steps, all "why" texts).
- **Pictures against numbers** (above) and by eye in Playwright screenshots, 1280 and 360/390/740×360 px, light and
  dark, Explore, every drill kind at 360 px, the Enlarge view; reduced motion (Play jumps to the end state:
  10,000×, verdict shown); keyboard (P and Q handles and the zoom slider move with arrow keys, the tab order
  reaches every control); no console errors (only blocked analytics requests in the sandbox).
- Validators and tests after every change: `node --test scripts/test/apcalc-tool-{limit-explorer,tangent-tracer,rule-drills}.test.mjs`
  all pass (6, 10, 6 tests).

## Numeric recheck result

No key was wrong: 0 of about 6,600 generated problems disagreed with my recomputation (the only flags were my own
script's limits: a 10⁻⁶ step near tan(2x)'s asymptote, and cbrt continuity at h = 10⁻⁶). **Keys changed: none.**

## Changes (wording and feedback; ids, step keys and recording unchanged)

| Tool / kind | Old | New | Why |
|---|---|---|---|
| limit-explorer squeeze | "multiply by x^2 (with absolute values, since x^2 can be negative)" | "multiply by x², which is never negative"; odd powers: "|x| (… negative when x < 0 and would flip the inequalities)" | false statement (x² ≥ 0) |
| limit-explorer algebra, remove | slip notes "(x − -3)", "x − -2" | "(x + 3)", "x + 2" (also in the conjugate why) | unreadable sign |
| limit-explorer continuity | distractor equal to f(a) **and** the right-hand limit: "That is f(a), not the limit." | "That is f(a), and the right side heads there too, but the left side heads for L: no two-sided limit."; when f(a) = L the right-limit distractor now says "only the right-hand limit" | incomplete / misleading named miss |
| limit-explorer infinity | "behaves like −4/4·x^1" | "behaves like −x", "(1/2)x", "−(2/5)x²" (reduced coefficient, real power) | unreduced, prints x^1 |
| limit-explorer IVT figure | x-axis label "x" drawn over the "y = 0" line label when k = 0 | no x label when k = 0 | overlap |
| tangent-tracer notdiff "why" | wrong reason "There is no corner here: the slopes from both sides agree." shown for cusps, jumps and holes; "do not get infinitely steep" shown for a vertical tangent | worded per kind: cusp "slopes grow without bound, in opposite directions"; vertical "both sides steeper in the same direction"; gap "the graph itself breaks"; cusp/vertical distinguished both ways | false statements in feedback |
| tangent-tracer power tangent line | "$\frac{d}{dx}x^2 = 2x^$" (broken TeX) | "= 2x" | broken math |
| tangent-tracer trans tangent line | "passes through x = 3.142" / 1.571 / 2.718 | "x = π", "π/2", "e" | exact form |
| tangent-tracer rate table | "the number of bacteria in a dish, in thousands, in thousand bacteria" | "… in a dish, in thousands of bacteria"; rate "thousands of bacteria per hour" | doubled phrase |
| tangent-tracer notdiff figure | "y" axis label on top of the "x = 0" mark label | y label dropped when a mark is at 0 | overlap |
| rule-drills rewrite | coefficient slip "The 2 in the bottom divides: c = 3/2" on forms with no 2 (e.g. 3/√x); "f(x) = 1√x" | the 2-slip only for c/(2x⁴); slips equal to the key dropped; coefficient 1 not written (√x, x²√x, ∛(x²)) | wrong named miss, display |
| rule-drills sum | "\frac{6}{x^{1}}", slip "it becomes −2, not −0" | "\frac{6}{x}"; "Subtract 1 from the exponent: −1 − 1 = −2. Yours went up by 1 instead." | display, confusing note |
| rule-drills inverse | "f(x) = 2x³ + 2x + 0" | "2x³ + 2x" | display |
| rule-drills rule notes | "v = cos (x)", "outer one is sin (u)" | "cos(x)", "sin(u)" | stray space from the plain-text renderer, fixed locally |

Layout and phone changes (tree depth, plots on phones, label sizes, Enlarge clearance, crumb workaround removal) are
listed in `docs/tools-phone-pass/calc-a.md`.

## Quality notes (no change made)

- limit-explorer: the Explore "Drag to zoom in" coach briefly covers the "Zoom in on x" label (shared coach).
- tangent-tracer: "y = f(x)" title is crossed by steep curves at the top left; it has a halo, so it stays legible.
- tangent-tracer tangent-given: the table highlights the x = a column (f and f′ together), which is the intended
  cue, not the key alone.
- rule-drills Explore at 1280 px: f′ often runs off the y range on the small side plot (clipped, not wrong).

## Open questions for a person

None on the mathematics. One product question: the shared drill stage shows the stem alone for formula-only
limit-explorer kinds (a large empty stage on phones); a small picture per kind (for example the graph of the
piecewise function) would use it better, but that is new content, not a fix.
