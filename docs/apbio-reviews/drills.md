# Design drills review (`bio/data/tools/design-drills.json`)

Branch `claude/apbio-review-drills` from `claude/apbio-drills`, 2026-10-03. Independent accuracy check from the
reviewer's own knowledge (OpenStax not fetched, spec decision 24). Scope: all 16 scenarios (setup, data table,
variables, control and control-why, null slots, alternative, CER tags, predict and mechanism, both written answers
with rubric and sample), plus the page intro and how-it-works text.

## Changes

| Scenario | Item | What was wrong | Fix |
|---|---|---|---|
| desiccation-selection | setup, control option 0 and why, control-why q and why, CER reasoning, CER rubric and sample | One shared humid generation before testing: the tested flies' mothers were selected-line flies, so maternal effects were not removed, yet the keyed control-why says they were ("they or their mothers") | Two shared generations; females of the second are tested; wording updated throughout |
| antibiotic-step | CER evidence item | "RNA values differ by less than their SEs": 100 vs 96 differs by 4, equal to the control SE | "differ by no more than their SEs (4 to 6 percentage points)" |
| antibiotic-step | mechanism option 2 why | Distractor "acts like glucose, so the repressor stays bound" left the glucose misconception uncorrected | Why now says glucose acts mainly through low cAMP/CAP and inducer exclusion |
| rabbit-fur-temperature | control option 2 why | "Shaved, no pad … much like the 37 °C group": bare shaved skin is cooler than furred skin (the classic cause of dark regrowth) | Why says the bare patch's temperature is uncontrolled and the enzyme is the same |
| seed-respirometer | predict option 0 why | Explanation read as if supporting "farther" | Reworded: for farther, more gas would have to disappear; CO₂ stays, so less does |

## Checked and fine

- Biology of all 16 scenarios. Numbers plausible: tristearin 72, triolein 5, trilinolein −13, trilinolenin −24 °C;
  trielaidin above triolein; respirometer Q10 ≈ 2 and RQ ≈ 1 for the no-KOH prediction; DCMU at PSII; LuxI/LuxR
  logic; colchicine-like metaphase pile-up (8.2 → 21.4% in 4 h fits a ~20 h cycle); vg/vg wings lengthen with
  rearing temperature (real) while wild-type shrink; digoxin on red-cell α1 pump (IC50 tens of nM).
- Recomputed: woodlice χ² = 2 × 16²/25 = 20.48 (1 df, 3.84); beetle drift SDs match Wright-Fisher exactly
  (0.40 for N = 10, 0.15 for N = 100 after 20 generations); expected allele loss in N = 10 is ~50% (13/20 observed,
  within chance), ~0% for N = 100; every "SE smaller than the gap" statement (duckweed 7 < 9, fats, Elodea,
  paramecium, digoxin, vestigial).
- Every control item has exactly one option that isolates the stated variable; the other explanations are right.
- Null slots all read "no difference in [DV] among [IV groups]"; alternatives testable; purpose/"prove" distractors
  correctly rejected.
- Rubrics: 3 + 2 points each, every point gradeable; every sample earns every point. Difficulty at exam level.

## Left for a teacher (needs-author `design-drills-review`)

Illustrative values still worth a look: Himalayan rabbit thresholds (29 → 33 °C step), Elodea green rate (29% of red
at equal energy is lower than leaf action spectra, though fine for thin aquatic leaves and plastic filters), woodlice
kinesis account (turning-rate direction varies by source), and CER tags for the χ² sentence.
