# Skills chapters review (statistics and design skills, one FRQ)

Branch `claude/apbio-review-skills` from `claude/apbio-beta`, 2026-10-03. Independent accuracy check
of the 14 skills topics (`stats-descriptive`, `stats-plots`, `stats-sd-se`, `stats-rates`,
`stats-confidence-intervals`, `stats-water-potential`, `stats-chi-square`, `stats-hardy-weinberg`,
`stats-simpson`, `design-variables`, `design-controls`, `design-null-hypothesis`, `design-cer`,
`design-prediction-mechanism`: lesson, notes, questions, glossary, figures, SVGs) and
`frq-beet-membrane-heat`. Every number was recomputed by script (sample SD with n − 1, SE, x̄ ± 2SE,
χ², Ψs = −iCRT with R = 0.0831 and T in K, percent change, Hardy-Weinberg, Simpson's D).

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| stats-chi-square | stimuli s1, s2; `bio-stats-chi-square-8` (option, why); notes table and worked example | Critical value for df 3, p = 0.05 given as 7.81; the formula sheet prints 7.82 (and the course's tools use 7.82) | 7.82 everywhere (decision unchanged: 8.13 > 7.82) |
| stats-chi-square | notes, "Going further" | χ² = 0.64 (df 1): "deviations this small happen most of the time by chance"; p ≈ 0.42, and the statement should be about deviations at least this large | "a deviation at least this large happens by chance about 4 times in 10" |
| stats-rates | `bio-stats-rates-3` key | "fell in each later interval": the 6-8 and 8-10 min rates are both 0.20 mm/min | "then fell, to 0.2 mm/min in each of the last two intervals" |
| design-controls | `bio-design-controls-15` key and why | Key (oil film in the water bottle) explains the water spot but not the apple's spot (foods are rubbed on directly, no water) | Students' fingers greasy from the oil put lipid on every spot, including water and apple |
| stats-descriptive | `bio-stats-descriptive-16` (order) | "Sort" and "count n" can go in either order, so two orders are correct | Step 2 is now "Number the sorted values from 1 to n" |
| design-variables | `bio-design-variables-14` (order) | Choosing the IV and choosing the DV could go in either order | DV step now depends on the IV step ("at each of those temperatures") |
| stats-plots | `bio-stats-plots-7` why; notes | "50 mg of polymer releases at most 50 mg of monomer": hydrolysis adds water, so monomer mass slightly exceeds polymer mass | Added the water-mass caveat ("about", "slightly more") |
| stats-hardy-weinberg | `bio-stats-hardy-weinberg-11` | Stem relied on "the previous question" (items are shown on their own) | States the 1-in-2,500 incidence and q = 0.02 |
| stats-water-potential | `bio-stats-water-potential-11` | Same "previous question" dependency | States Ψs and ΨP |
| design-prediction-mechanism | lesson idea 4 | "cyanide does not alter how much light a leaf gets" mixes the cyanide and DCMU examples | "DCMU does not change how much light reaches the leaf" |
| design-controls | figure `controls-grid` alt | "six spots"; the SVG has five | "five spots" |
| design-variables | figure `experiment-variables` alt | "50 mL water", "volume of water"; the SVG and setup say 50.0 g | 50.0 g |

Severity: 1 medium (controls-15 key not fully defensible), 1 medium-low (chi-square critical value
off the formula sheet), the rest low.

## Checked and fine

- Numeric keys and tolerances (all 50+): drop means/medians (31.0, 15.0, 16.75 → 14.5), cooling
  means 11.13/22.13, slopes 6.02/3.0/8.5/4.5, SDs 24.7/8.22/3.16/2.86/0.26/1.75/2.24, SEs 3.67/0.71/0.36,
  CI limits and overlaps (beet 0.05-0.11, 0.06-0.14, 0.40-0.52, 0.50-0.74; fluidity 1.6-2.0,
  2.26-2.74, 2.4-3.6), s = 0.06√8 = 0.17, agar cube coloured volumes (97.8/73.8/56.1% from 3.6 mm
  depth) and √t depth profile, −75%, −42.6% vs 41.7 points, +225%, Ψs −2.48/−4.95/−7.43/−7.35/−12.47/−19.6
  bars, χ² 8.1/8.13/0.64/5.23/11.60, HW q = 0.30, 168 Aa, p = 0.65, 45.5, 2pq 0.0392 (98:1),
  D 0.80/0.35/0.775/0.484/0.54/0.804, −37.5%, Michaelis-Menten consistency of the compound X data
  (Km ≈ 2 mM, apparent Km ≈ 6 mM, same Vmax), FRQ error bars ±0.04/0.06/0.08/0.10.
- Statistical language: null hypotheses, "fail to reject" (never "accept"), p-value definition,
  overlap rule stated per the open `ci-overlap` decision, SD vs SE, n − 1, ±2SE approximation
  (already in Contested), HW df 1 vs 2 (already in Contested).
- Design items: keyed controls and justifications, confounders, CER parts, prediction grids
  (including "no change" variables), next-experiment items; distractors defensibly wrong.
- Figures (dot plot, graph anatomy, rate curve, bell curves, CI overlap, Ψ diagram, χ² flow, HW
  square, Simpson plots, design SVGs): coordinates and labels match the data.
- FRQ: 1 + 2 + 4 + 2 = 9 points, every rubric line gradeable, samples earn every point.
- Trademark: no "AP" in these files. Originality: data sets and wording are original.

Left for a person: `cyanide-gradient` (low priority) in `docs/apbio-needs-author.md`. Not changed:
`bio-design-prediction-mechanism-4` and `-15` test the same idea (isolated mitochondria plus
pyruvate) in one topic; acceptable but redundant.
