# U-Chem notes (tools upgrade Phase 2)

Branch `claude/tools-upgrades-chem`. Every chem tool page now opens on an **Explore** pane with a
**Test yourself** switch (`ApChemTools.modes(app, { slug, explore, quiz, labels })` in `chem-tools.js`).
`?seed=` or `#quiz` opens the quiz; otherwise the last mode used on that tool (`localStorage`
`apchem_toolmode_<slug>`, per-viewer convenience only), explore by default. Each existing drill is the quiz,
unchanged: problem codes, ids `<slug>:<context>:<step>`, recording, Keep going. `live-beaker.js` is loaded by
the four beaker tools and particle diagrams (`BEAKER_TOOLS` in `build-apchem.mjs`). New pure models are in
`chem-tool-math.js`, tested in `scripts/test/apchem-explore.test.mjs`.

## Tools

**Titration curve reader.** Job: see what is in the flask at every point of a titration, and read the
curve from that. Changed: Explore has a burette slider (0.05 mL), Run (slows near each equivalence point),
+1 mL, +1 drop, Start over, and tap-the-graph. The curve draws up to the current volume, the beaker shows
the species in proportion to mmol, the liquid takes the chosen indicator's color across its range (with a
band on the graph and where on this curve it turns), and the half-equivalence and equivalence points are
marked when passed, with a sentence on what each means. Owner check: indicator colors are approximate
renderings (see below); Run speed on a slow phone.

**Buffers.** Job: see why a buffer holds its pH, and when it stops. Changed: a beaker of HA and A⁻ with a
pH meter; + OH⁻ / + H₃O⁺ add one particle's worth (a tenth of each form's start), particles convert in place,
the line under it shows Henderson-Hasselbalch inside capacity, the weak acid/base alone at exactly
capacity, and the leftover strong acid/base past it. A graph traces pH against what was added beside the
same additions to pure water. Quiz: each drill problem shows its buffer drawn in ratio, redrawn after the
stoichiometry step (add) or at the answer ratio (ratio); capacity shows both buffers on one scale.

**Q vs K.** Job: predict which way a mixture reacts by comparing Q with K, and see it happen. Changed:
particle vessel for the particle contexts; ± any species, volume slider 0.5-2 L; Q jumps on the log scale
around K with why (adding product raises Q; volume matters only when Δn(gas) ≠ 0, Q ∝ (1/V)^Δn); "Let it
react" runs the net reaction to Q = K. Owner check: the numbers-mode contexts (HI, NH₃, SO₃, CaCO₃, AgCl)
are quiz-only; the explore uses the two particle reactions.

**ICE tables.** Job: set up and solve an ICE table, and see what each row means. Changed: Explore x (slide
x, or Solve for x: the E row in x and as numbers, bars I vs E, beaker, Q closing on K). Quiz: beside the
table, bars and a beaker follow every typed cell (hatched until checked), C row as arrows; the Q-to-K gauge
shows Q of the I row, then of the typed E row, "at equilibrium" when within 1% (or 4%, the rounding of a
three-figure row). For Find K the gauge waits until K is answered.

**Particle diagrams.** Job: turn a reaction into a correct particle picture, and read one. Changed: Build
it (limiting reactant and A₂ + B₂ ⇌ 2 AB): drag a particle into the after box, or tap it / +; tap a
particle in the box or − to take it out. Live atom tally (conserved / missing / too many), Q from counts for
the equilibrium box, Check names the slip, Show the answer. Not recorded (practice). Pick the picture is
the quiz, unchanged. Hydration and acid pictures stay quiz-only.

**Units and sig figs.** Job: set up a calculation so the units cancel to the one asked for, and report
it with the right significant figures. Changed: Set it up (gas, calorimetry, density): each quantity goes
on top, bottom or out; a sticky fraction of unit chips strikes through cancelling pairs; the line says the
leftover unit, the value and the figures (exact 1000 J/kJ does not count). Distractors: T in °C, R in J.
Add/subtract: the two masses line up on the decimal point with the unreported places shown as ?. Quiz
unchanged. "Answer one for credit" switches to the quiz.

## For accuracy review

New pure functions (all in `chem/assets/tools/chem-tool-math.js`, tested in `apchem-explore.test.mjs`):

1. `titration.species(sys, v)`: mmol of each species at v mL from the exact pH (`titration.pH`) and the
   distribution fractions; tested against mass balance and the charge balance; [HA] = [A⁻] at half
   equivalence; equivalence pH from Kb = Kw/Ka.
2. `titration.region(sys, v)`: landmark bands: a half point within 2% of Veq (≥ 0.1 mL); an equivalence
   point within 0.1 mL (two drops), so a volume just past the jump reads "excess OH⁻".
3. `titration.cross(sys, pH, vmax)`: the volume where the curve first reaches a pH (for "this indicator
   turns between a and b mL"). The "within two drops" note reuses the quiz's existing 0.1 mL rule.
4. `bufferState({ Ka, nHA, nA, V, b })`: stoichiometry first, then (a) the exact pH from the charge balance
   [H₃O⁺] − Kw/[H₃O⁺] + (nA + b)/V − C·Ka/([H₃O⁺] + Ka) = 0, and (b) the exam method: HH while both forms
   remain; weak base/acid alone at exactly capacity; past capacity pH from the excess strong species alone
   (pOH = −log(excess/V)). Also the same addition to pure water (exact, Kw included). Tested: 0.010/0.010 mol
   in 0.100 L acetic buffer + 4 mmol OH⁻ → 5.11; + 12 mmol OH⁻ → 12.30; + 13 mmol H₃O⁺ → 1.52; monotonic.
   The meter shows the exact pH; the worked line shows the method and adds the exact value when they
   differ by more than 0.02.
5. `equilibrate(sp, n, V, K)`: amounts after the net reaction runs to Q = K; solids limit the extent (if a
   solid runs out first, it stops short of K). Tested with HI, A₂ ⇌ 2A (Q doubles when V halves), CaCO₃.
6. `atomsOf(counts)`: atoms from the particle templates.
7. `unitParse / unitMul / unitText / unitSame`; `units.generate` now returns `setup` (factors with units,
   significant figures, placement and two distractors for the gas problem). Tested: the right placement
   cancels to the asked unit, reproduces the key's value (calorimetry sign applied) and its significant
   figures; each distractor fails to cancel.

Display-only choices to check:
- Indicator colors (RGB) are renderings, not data: methyl orange red → yellow, methyl red red → yellow,
  bromothymol blue yellow → blue, phenolphthalein colorless → pink, alizarin yellow R yellow → red; the
  color is interpolated linearly across each indicator's existing pH range (`INDICATORS`).
- Titration flask: 1 particle = n₀/16 mmol (n₀/12 for diprotic); a species below half a particle shows 0
  (said on the page). Water and spectator ions are not drawn.
- Buffer explorer: 100 mL, 5/10/20 mmol of each form; Q vs K explorer: 1 particle = the context's `per`
  (0.10 mol), volume 0.5-2 L; equilibrium amounts are drawn rounded to whole particles (the page says so).
- Q vs K text: "Δn(gas) > 0: a smaller volume raises Q, so the mixture shifts toward fewer gas particles".

No contested science found; nothing added to `docs/apchem-needs-author.md`.

## Checks (2026-10-09)

`build-apchem --check`, `check-apchem-content` (0 failing), `check-site` (OK), `check-weight --check` (all
within; chem shell 50.3 / 52 KB, unchanged: tool scripts are page-only), axe (serious/critical) clean on all six
tools × explore/quiz × light/dark at 390 px with no console errors. `anp-tool-kit.test.mjs` fails 2 tests on the
base commit too (body-map label list), not from this work.

## Accuracy review (2026-10-09)

Independent pass: hand recomputation in node against each pure function, then every new on-screen sentence.
Sources: OpenStax *Chemistry 2e* §14.6-14.7 (buffers, titration curves, indicator table 14.7 / Fig. 14.21),
§13.3-13.4 (Q vs K, Le Chatelier volume changes, ICE and the 5% rule), §1.5 (significant figures);
College Board AP Chemistry CED (2024) topics 7.3-7.10, 8.5-8.10.

| Item | Verdict | Check |
|---|---|---|
| `titration.species` / `pH`, weak acid 0.100 M × 25.0 mL with 0.100 M NaOH | correct | start 2.87, half 4.74 = pKa, eq 8.72 (0.0500 M acetate, Kb = Kw/Ka), 30 mL 11.96, 40 mL 12.36: all match hand values; mass balance 2.50 mmol |
| Strong acid, weak base (NH₃ + HCl), diprotic (H₂CO₃-like) | correct | SA 1.00 / 1.37 / 7.00 / 11.96; WB 11.13 / 9.26 / 5.28 / 2.04; diprotic half1 = pKa1, eq1 ≈ (pKa1 + pKa2)/2, half2 = pKa2 within 0.01 |
| `titration.region` landmark bands | fixed (wording) | 24.9 and 25.1 mL read "equivalence" (pH 7.14 and 10.30) while the text gave only the exact equivalence pH (8.72). Text now says the pH quoted is at exactly V_eq and that within two drops the pH is still mid-jump |
| `titration.cross`, indicator turn volumes | correct | phenolphthalein 8.2-10.0 on the acetic curve: 24.99-25.05 mL |
| Indicator ranges and colors | correct | methyl orange 3.1-4.4 red→yellow, methyl red 4.4-6.2 red→yellow, bromothymol blue 6.0-7.6 yellow→blue, phenolphthalein 8.2-10.0 colorless→pink, alizarin yellow R 10.1-12.0 yellow→red (OpenStax Fig. 14.21; standard tables) |
| Titration region sentences (SA/WA/WB/diprotic), pKb = 14.00 − pKa | correct | |
| `bufferState`, 10/10 mmol acetic in 100 mL | correct | +4 mmol OH⁻ 5.11; +10 → weak base 0.10 M acetate 9.02; +12 → excess 0.020 M OH⁻ 12.30; −10 → 0.20 M HOAc 2.72; −13 → 0.030 M H₃O⁺ 1.52 (exact 1.52); water with 4 mmol OH⁻ 12.60 |
| Buffer worked lines (stoichiometry first, HH, capacity, excess) | correct | past-capacity method ignores the weak conjugate, as the exam does; meter shows the exact value |
| `equilibrate` | correct | A₂ ⇌ 2A, K = 4, 1 mol in 1 L → x = 0.618; at 0.5 L Q of the same amounts doubles; CaCO₃ stops when the solid runs out |
| Q vs K volume sentence | fixed | "A smaller volume raises Q, so the mixture shifts toward fewer gas particles" was shown for any volume change, including an expansion (which lowers Q and shifts the other way) and for a mixture not at equilibrium. Now: what smaller and larger volumes do to Q, that compression *from equilibrium* shifts toward fewer gas particles, then the actual direction from Q vs K |
| Q vs K zero species | fixed | with a reactant and a product both at zero the page said "only the reverse can run"; now says Q is undefined and neither direction can run, and "Let it react" no longer reports "already at equilibrium" in that state. Solids no longer count as a zero |
| ICE explore (x slider, Solve for x, Q gauge 1%) | correct | `solveExtent` reproduces K to 1% for all six contexts × 40 seeds; small-x and 5% statements unchanged from the reviewed drill |
| `atomsOf`, build-mode feedback | fixed (wording) | equilibrium hint said "let one more A₂ and B₂ react"; one event may not be enough. Now "let more react (each event…)" |
| Units setup cancellation, distractors (°C, R in J), exact 1000 J/kJ | correct | test reproduces key value and figures |
| Gas setup T in K counted as 4 significant figures | fixed (wording) | T(°C) to one decimal + 273.15 gives 4 figures only once the sum is kept to one decimal; the tile note now says so |
| Add/subtract decimal alignment text | correct | fewest decimal places, not fewest figures |

Logged to needs-author: nothing (no contested science).
