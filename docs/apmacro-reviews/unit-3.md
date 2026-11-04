# Unit 3 review (topics 3.1-3.9, three FRQs)

Branch `claude/apmacro`, 2026-11-03. Independent accuracy check of author C's Unit 3, following
`docs/apmacro-briefs/review-common.md`. Scope: `aggregate-demand`, `multipliers`, `sras`, `lras`,
`adas-equilibrium`, `adas-short-run-changes`, `long-run-self-adjustment`, `fiscal-policy`,
`automatic-stabilizers` (lesson, notes, questions, glossary, figure entry each; 150 items, 19 stimuli), the nine
figures from `scripts/apmacro-figures/author-c.mjs`, and `frq-recession-long`, `frq-multiplier-short`,
`frq-self-adjustment-short`. Checked against the CED, the 2023-2026 scoring guidelines and reader-report traps
summarized in `docs/apmacro-research/framework.md` (sections 3, 5, 7-9), the authoring guide, and standard
introductory macroeconomics.

**CED.** The PDF was read through WebFetch for Topics 3.1-3.6 (MOD-2.A to MOD-2.H): AD slope from the real wealth,
interest rate and exchange rate effects; shifts from non-price-level changes in a component; the expenditure and
tax multipliers depending on the MPC, MPC = ΔC / ΔDI; SRAS sloping up from sticky wages and prices and shifting
with production costs "such as a change in inflationary expectations"; LRAS vertical at full employment and
corresponding to the PPC; short run vs long run; short- and long-run equilibrium and output above, at or below
full employment; AD and SRAS shocks; demand-pull and cost-push. Unit 3 content matches all of it. Topics 3.7-3.9
and anything after MOD-2.I.1 were not in the extracted text (needs-author `ced-text` stays open). The CED's term
is "expenditure multiplier"; the course says "spending multiplier", which is the same thing and the term readers
use, so nothing was changed. The balanced-budget multiplier was not seen (needs-author `balanced-budget`,
`c-balanced-budget-use`).

## Changes

| Topic / file | Item | What was wrong | Fix |
|---|---|---|---|
| adas-equilibrium | `mac-adas-equilibrium-10` (stem and why reworded; key unchanged) | Asked for "a point X on AD that would be a long-run equilibrium at the same LRAS", but the key (`on: AD, x: down, y: up`) can only check direction along AD: a point far left of LRAS was graded correct, and even `keyResponse` sits left of LRAS. The grader cannot require a point on two curves | Stem now asks for a point on AD between today's equilibrium and LRAS, showing which way the price level and real GDP differ, which is what is graded |
| adas-equilibrium | items 7, 11, 16 (distractors) | Key was the longest option in 6 of 9 single items (67%; limit 40%); in item 16 the key was twice the length of the others | Lengthened one distractor in item 7 and item 11 and three in item 16; now 3 of 9 |
| adas-short-run-changes | `mac-adas-short-run-changes-5` why (key option) | "SRAS moved left along the AD curve": a curve shifts, the equilibrium moves along AD | "SRAS shifted left, so the equilibrium moved up and to the left along AD." |
| automatic-stabilizers | `mac-automatic-stabilizers-15` stem | Called a fixed dollar amount per household a "flat tax"; a flat tax usually means one rate (a proportional tax), which still moves with income | "one tax of the same fixed dollar amount per household" (matches the notes) |
| FRQ | `frq-multiplier-short` part D prompt | Rubric required the direction stated, but the prompt asked only to calculate (part C asks for both) | Adds "and <b>state</b> whether taxes must increase or decrease" |
| adas-equilibrium | lesson `ideas[3]` | Raw `<` and `>` in HTML text ("Y1 < YF") | `&lt;` and `&gt;`, as the notes and the other courses' lessons write them |
| multipliers | figure `multipliers-rounds` (`author-c.mjs`, figure entry alt) | Rendered: the "100" bar label sat on the title line; values mixed rounding (51.2, then 41 for 40.96, then 32.8) | Plot moved down 14 px; bars drawn from the exact rounds 100 × 0.8^k; labels 100, 80, 64, 51.2, 41.0, 32.8; alt and desc say "rounded". The other eight SVGs regenerate byte-identical |

Changed keys: none. Every numeric key, choice key and graph key in Unit 3 was right.

## Numeric recheck

All 23 numeric items recomputed from the stems by a scratch script (`rev-u3/nums.mjs`, own values, not the
`from` recipes), then graded through `mac-calc.js`, `mac-grade.js` and `mac-questions.js` in a vm as
`apmacro-questions.test.mjs` loads them: every key equals my value, is accepted exactly and at one decimal, and
every authored mistake (44) is graded wrong with its feedback. Values: AD 1,140 and net exports 40; MPC 0.8, MPS
0.2, multiplier 5, ΔY 100; Brenland G 30 and tax cut 40; tax-cut ΔY 90; balanced budget +50; wage +10%; YF +10%;
gap 60 and 5%; inflation 5.77%; wage index -5%; Country J 80 and 25; Velora 15 and 20; progressive tax 8,000 and
6,000; collections -10%. Arithmetic is four-function friendly (MPC 0.75, 0.8, 0.9). FRQ arithmetic: Calder
multiplier 4, G 20, tax multiplier -3 (tax cut 26.7 in the sample only); Pellam 5, -4, G +40, tax cut 50. Data
tables are internally consistent (multipliers-s1 rows give MPC 0.8 both ways; automatic-stabilizers-s1 after-tax
income 52,000 to 44,000 is -15.4%; long-run-self-adjustment-s1 path and adas-short-run-changes-s1 year pairs fit
the shifts the items key).

## Graph recheck

20 graph items and 4 FRQ graph parts: every key scored 1.0 by `ApMacroGrade.graph` on `keyResponse`, every spec
passes `ApMacroGraph.check`, the flipped direction scores 0 (or only the label point) with the "right curve,
wrong way" slip, and moving the other movable curve gives the authored slip. By my own reasoning each key moves
the right curve the right way: investment, G, wealth and tax cuts shift AD; input prices, subsidies, droughts and
expected inflation shift SRAS; technology and the labor force shift LRAS and the PPC; the earthquake shifts SRAS
and LRAS; self-adjustment always shifts SRAS (right from a recessionary gap, left from an inflationary one), never
AD; the export boom plus wages ends at the same output and a higher price level; the double shock (SRAS left, AD
right) keys the price level only and leaves output out as indeterminate. FRQ `frq-recession-long` D keys MD right
with MS vertical and fixed under a stated limited-reserves framework, nominal rate up, quantity of money the same.
Axes are Price level and Real GDP (Nominal interest rate and Quantity of money on D), LRAS vertical, curves named
with subscripts.

Rendered (headless Chromium, every graph item's start and key state, the three graph stimuli and the nine
figures): all correct and readable after the bar-chart fix. In the shared renderer, SRAS1 and SRAS2 labels sit
close together at the top of `sras-s2` and `adas-short-run-changes-s2`, and E2's label touches AD in
`mac-adas-equilibrium-9`'s key view; legible, renderer-wide, left to the T1 owner.

## Checked and fine

- Economics: AD's three effects, components and shifters; MPC/MPS from changes, not totals; spending 1 / MPS,
  tax -MPC / MPS, one smaller and why (the first round is partly saved); direction first, divide the gap, with
  multiplying named as the slip everywhere; SRAS slope from sticky wages and its shifters (expected inflation now
  taught here, per the integrator); LRAS vertical at YF and tied to the PPC; short- vs long-run equilibrium, gaps
  and cyclical unemployment; demand-pull, cost-push, stagflation; self-adjustment with its cause (unemployment
  vs the natural rate, nominal wages and input prices, SRAS) and the AD and automatic-stabilizer slips only as
  slips; fiscal tools, transfers as MPC / MPS, lags, the price-level comparison with self-adjustment; automatic
  stabilizers soften AD and do not close the gap.
- Item quality: one defensible key per item; every option's explanation names the error by content; 94-100%
  apply/analyze per topic; 41-59% of items in sets of 3-4; keys longest at most 40% per topic after the fix;
  no near-duplicates (similar stems are siblings on different data); every single item has four options.
- FRQs: 10 and 5 points, one rubric line per point, a sample per part, scenario as plain text with the verbs in
  the parts, "calculate" samples show the work, long FRQ has graph parts. Logic is standard; no names, numbers or
  structure of a released question.
- Scope: `check-apmacro-map --check` reports nothing used before taught; no PPI, no market structures; monetary
  policy appears only in the long FRQ (unlocks with 4.6) with its framework stated.
- Checks: `check-apmacro-content --topic` clean for every touched topic, full run 0 failing;
  `node --test` apmacro questions, graph and calc tests 25/25.

## Open (for a person)

- **Currency in graded content.** The invented-country rule says graded content uses invented countries *with
  invented currencies*; every Unit 3 item and all three FRQs count amounts in "dollars" (about 100 uses). The
  integrator applied the currency half only to Unit 6. A lead should decide whether closed-economy units keep
  generic "dollars" (my view: harmless, since no exchange rate is involved) or move to each country's currency.
- **Letter names shared across units.** Proper names are unique (Quillon, Brenland, Tolva, Merovia, Velora,
  Calder, Pellam, Rivon), but letter names are shared: Country X and Z with Unit 2 and others, Q, V and W with
  Units 2, 4 and 5, and Country N twice inside Unit 3 (`lras-16`, `automatic-stabilizers-s2`). Not changed, since
  other reviewers may rename at the same time; the rule's wording covers "names" without saying letters.
- **Point items grade direction only.** `ApMacroGrade.graph` cannot require a point on two curves (on AD and on
  LRAS), so `mac-adas-equilibrium-10` was reworded to the direction it can check. A `key.point.at` (a crossing)
  would let it ask for the long-run point itself.
- Still open from author C: `c-transfer-multiplier`, `c-balanced-budget-use` (`mac-multipliers-12`, notes
  paragraph), `c-fiscal-lags` (`mac-fiscal-policy-14`), `c-long-frq-money` (part D's limited-reserves wording),
  `c-downward-stickiness`; all standard textbook content, none taught wrong, all hinge on the unread CED text for
  3.7-3.9 (`ced-text`).
