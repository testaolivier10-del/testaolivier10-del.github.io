# Self-review: Unit 1 Kinematics and the "Math you need" chapter

Author pass, 2026-10-12. Not yet independently accuracy-checked (spec build plan, Phase 4).

## Topics done (10)

| Topic | Kind | Items | Apply/analyze | In sets | Notes words | Figure |
|---|---|---|---|---|---|---|
| `math-units` | skill | 11 | 82% | 0 | 912 | `meterstick-prefixes` |
| `scalars-vectors` (1.1) | concept | 16 | 94% | 63% | 845 | `walk-distance-displacement` |
| `math-symbols` | skill | 10 | 100% | 0 | 711 | `equation-anatomy` |
| `motion-quantities` (1.2) | concept | 18 | 100% | 72% | 839 | `car-speeding-slowing` |
| `math-proportional` | skill | 10 | 100% | 0 | 689 | `doubling-three-ways` |
| `math-slopes-areas` | skill | 10 | 100% | 50% | 804 | `slope-and-area` |
| `motion-representations` (1.3) | concept | 26 | 100% | 77% | 1153 | `motion-graphs-stack`, `free-fall-strobe` |
| `reference-frames` (1.4) | concept | 16 | 100% | 81% | 772 | `train-walker-frames` |
| `math-trig-components` | skill | 10 | 90% | 0 | 740 | `kick-components` |
| `motion-2d` (1.5) | concept | 17 | 100% | 82% | 810 | `table-launch-strobe` |

Totals: 144 items (single, numeric, predict), 70 numeric keys with 116 authored mistakes, 11 lesson figures plus
10 inline diagram stimuli (balcony toss, braking car, four cars with v and a, hallway walk, moving walkway,
table launch, drone drop, ramp cart) and 4 chart stimuli built from data. Each topic has a lesson (hook, prereqs,
figure, chain, ideas, misconception, 5-7 check items, summary), notes with worked examples before every
calculation type, comparison tables, and a glossary entry for every concept the map assigns to it.

Coverage asked for: motion diagrams; x-t, v-t, a-t graphs with slope and area both ways; the three
constant-acceleration equations with a "leaves out" table for choosing one; free fall including a = g at the
top; nonuniform acceleration qualitative only; 1D relative velocity (walkway, highway, river, flatcar,
accelerations agree only between frames at constant relative velocity); components, tip-to-tail addition,
projectiles (horizontal launch, angled launch, range, time of flight, 37°/53° same range, drone drop seen from
two frames). Functional-dependence items in every concept topic.

## FRQs (3)

| Id | Type | Points | Parts |
|---|---|---|---|
| `frq-u1-stopping-distance` | mr | 10 (3+3+2+2) | v-t sketch with reaction time; derive D = v₀t_r + v₀²/(2a) from area or kinematics; calculate 66 m; justify why doubling v₀ more than doubles D (3.5×) |
| `frq-u1-ramp-round-trip` | tbr | 12 (3+3+3+3) | motion diagram (drawSpec `box`); derive T = 2v₀/a; v-t sketch (graphSpec); consistency across all three |
| `frq-u1-ramp-acceleration-lab` | lab | 10 (3+2+3+2) | procedure (meterstick, stopwatch/photogate, repeated trials, range of d); linearize d vs t²; plot five given points (graphSpec); a = 2 × slope = 0.84 m/s² |

One rubric line per point with accepted wordings; a full-credit sample per part. Lab data: averages and t² recomputed,
least-squares slope 0.420 m/s² (intercept −0.002 m), a = 0.84 m/s²; rubric accepts 0.76-0.90 m/s².

## Numeric recheck

Every key and mistake is computed from its formula in scratch scripts (rounded once). A grader script
(`scratchpad/u1/verify.mjs`) loads `physics/assets/phys-questions.js` through the test harness and grades each key
as a student would type it (to its sig figs, with its unit) and each authored mistake: **70 keys right, 116
mistakes all graded wrong, 0 problems**. `check-apphys-content.mjs --topic` is clean for all 10 topics (with
key-length balance and no absolute words in distractors), the three FRQs pass `checkFrq`, the bank-wide test-wise and
near-duplicate rules pass on my 144 items, and `check-apphys-map.mjs --check` passes. A scratch build with
`APPHYS_PUBLISHED=unit-1,skills-math` builds all 10 topics and the FRQ pages; notes, lesson and FRQ pages were
rendered in Chromium and every figure and inline stimulus was screenshot and fixed for overlaps and clipping.

g: every item that uses g states "Use g = 9.8 m/s²" (no gAlt needed); ratio items (drop height ×4) need no value.

## Map edits

None.

## Open questions / notes for the merge

1. **Grader and trailing zeros.** `sigFigs("20")` counts 1, so a two-figure key like 20 m/s marks a student who
   types "20" wrong on sig figs. I avoided such keys; other authors may hit this. Consider accepting either
   reading of trailing zeros without a decimal point.
2. **TBR drawing for Unit 1.** Forces come in Unit 2, so the TBR's drawing is a motion diagram with drawSpec
   `kind: "box"` (no `fbd` or `bars`). Fits the type ("a representation"), but confirm the owner is happy with it.
3. **"Inertial".** The CED's 1.4 says frames are inertial unless stated; the map teaches "inertial reference frame" in
   2.x (first law), so the notes say "frames that move at a constant velocity relative to each other" instead.
4. **Two-figure keys from a 0.1 s interval** (`motion-quantities`, the 2.0-2.1 s average velocity 1.64 → 1.6 m/s):
   Δt = 0.1 s is arguably one figure; the key uses two and says so in the explanation.
5. Figure generators are Python scripts in my scratch folder (`fig_*.py`, `t_*.py`, `figlib.py`), not in
   `scripts/apphys-figures/`; the SVGs in `physics/figures/` are the source of record. Say if you want them ported
   to `scripts/apphys-figures/unit-1.mjs`.
6. The free Unit 1 sample card (`phys-motion-quantities-1`) is a single-answer item, as `SAMPLE_Q` expects.
