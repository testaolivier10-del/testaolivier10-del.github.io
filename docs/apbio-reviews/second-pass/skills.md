# skills second pass

Independent second accuracy check, 2026-10-06, of the 14 skills topics (`stats-descriptive`, `stats-plots`,
`stats-sd-se`, `stats-rates`, `stats-confidence-intervals`, `stats-water-potential`, `stats-chi-square`,
`stats-hardy-weinberg`, `stats-simpson`, `design-variables`, `design-controls`, `design-null-hypothesis`, `design-cer`,
`design-prediction-mechanism`: lesson, notes, questions, glossary, figures and SVG labels), the nine skills tools
(`chi-square`, `confidence-intervals`, `descriptive-stats`, `design-drills`, `graph-builder`, `hardy-weinberg`, `rates`,
`simpson-diversity`, `water-potential`), and the math they use (`bio/assets/tools/bio-tool-math.js`,
`bio-skill-problems.js`, the chi-square and CI page scripts). Checked from my own knowledge (OpenStax not fetched). Prior
fixes in `docs/apbio-reviews/skills.md` and `drills.md` were not redone.

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| stats-confidence-intervals | `notes/stats-confidence-intervals.html`, "What a 95% confidence interval means" | "Strictly, the multiplier is slightly above 2 for small samples": for the worked example's own groups the exact t multiplier is 2.31 (n = 9) and 3.18 (n = 4), not "slightly" above 2, and for large samples it is 1.96, just under 2 | "Strictly, the multiplier is just under 2 for large samples and larger for small ones, about 2.3 for n = 9 and 3.2 for n = 4; the exam uses 2." |
| design-null-hypothesis (drills) | `tools/design-drills.json`, `paramecium-vacuole` alt, why of option 2 | "Water leaves cells in a more concentrated solution" contradicts the stimulus: the vacuole still empties at 100 mM NaCl (1.1 per minute), so water is still entering, just less | "Added salt lowers the water potential outside, so less water enters the cell, not more; …" |

No key, option, numeric answer or tolerance needed changing.

## Checked and fine

- All 217 question items in the 14 topics, every option and per-option why, plus every stimulus table and chart.
  Recomputed by hand or script: drop means, medians and modes (31.0, 30.5, 21.5, 15 → 14.5 after correction, 16.75,
  14.71 without the outlier); cooling means 11.13/22.13 and ranges 0.7/3.1; slopes 6.02, 3.0, 8.5, 1.5, 4.5, 0.18;
  interpolation 35 °C; SDs 24.75, 8.22, 3.16, 2.86 (six eggs), 0.258, 1.754, 2.24; SEs 3.67, 1.41, 0.71, 0.357; CI
  limits 0.05-0.11/0.06-0.14/0.40-0.52/0.50-0.74, 1.6-2.0/2.26-2.74/2.4-3.6, 0.36, s = 0.17; agar coloured volumes
  97.8/73.8/56.1% (3.6 mm) and 93.6/65.7/48.8/38.6% (3 mm, graph builder); interval rates 0.8/0.35/0.25/0.2/0.2;
  −75%, +225%, −42.6% vs 41.7 points, 400 → 300; µm/mm³ conversions; Ψs −2.48/−4.95/−7.43/−7.35/−19.6/−12.47/−12.17
  and the °C slip (−0.55, ×13.4); χ² 8.1, 8.13 (5.40 + 0.07 + 0.27 + 2.40), 0.64 (p ≈ 0.42), 5.23, 81 for n = 400,
  20.48 (woodlice); critical values df 1-8 at 0.05 and 0.01 in `CHI_CRIT`, notes and stimuli match the formula
  sheet; HW q = 0.30, 168 Aa, p = 0.65, 45.5, χ² 11.60, 2pq 0.0392 (1 in 25.5), −0.10; Simpson D 0.80, 0.35, 0.775,
  0.484, −37.5%, 0.54, 0.804, 0.75/0.27 (figure), 0.65 slip; CER Michaelis-Menten data (Vmax 10, Km 2 vs 6:
  competitive), −58%/−8%; beet means and ranges, 0.81/0.11 ≈ 7×; design-variables means.
- Notes, lessons (hooks, prerequisite checks, chains, ideas, misconceptions, summaries), glossaries and the 14 figure
  alts and SVG text labels: consistent with the data and the formula sheet (Ψs = −iCRT, R = 0.0831 L·bar/(mol·K),
  T = °C + 273; SE = s/√n; 95% CI ≈ x̄ ± 2SE; D = 1 − Σ(n/N)²; df = categories − 1).
- Tools: every fixed problem recomputed with the solver and checked by hand (χ² 2.56/4.46/10; CI 0.21/0.25,
  1.27/1.14, 0.28/0.32 with the right overlap calls; descriptive 21.17/21.5/6/2.32/0.95 and the other two sets; HW
  0.70/0.42/168 and 0.16/0.48/240; rates 6.2/1.8, +15.3%/−27.5%; Simpson 0.70 and 0.27; Ψ −9.74/−7.74/−12.17,
  −12.38/−8.88/−4.95, −8.58). Math library formulas (n − 1 SD, SE, ±2SE, overlap, χ², ψs with 273, HW, Simpson, rate,
  percent change, tolerances) are correct. Generators keep every expected count ≥ 5, avoid χ² near the critical value
  and CI bars that nearly touch. Graph-builder data sets, types, justifications and reference scales are right. All 16
  design-drill scenarios re-read (setups, data, variables, controls and what they rule out, null slots, alternatives,
  CER tags, predictions, mechanisms, rubrics and samples); numbers (fat melting points, Q10 ≈ 2, χ² 20.48, drift SDs,
  SE comparisons) fine.
- `node scripts/check-apbio-content.mjs`: 0 failing; edited JSON parses.

## Needs author

- **ci-two-se** (open; update the "Meanwhile" line). The `stats-confidence-intervals` notes now say the exact
  multiplier is "just under 2 for large samples and larger for small ones, about 2.3 for n = 9 and 3.2 for n = 4; the
  exam uses 2" (second pass 2026-10-06), instead of "slightly above 2 for small samples".
- **ci-tool-direction** (open, low priority; `bio/data/tools/confidence-intervals.json`, `genCi` in
  `bio/assets/tools/bio-skill-problems.js`). The generator puts the second group's mean above or below the first at
  random, so the `bean-light` context can produce dim-lamp plants heavier than bright-lamp plants, which reads as
  implausible biology (the other four contexts are fine either way). Not changed (code). Meanwhile: practice numbers
  only; no conclusion depends on the direction. Option: let a context fix the sign, or drop the lamp wording.
