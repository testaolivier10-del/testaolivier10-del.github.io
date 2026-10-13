# Accuracy review: practice exams, justification prompts, entry pages (2026-10-12)

Independent review, Phase 4, of Phase 3 (spec decision 10). Scope: the 25 exam-only items and both forms
(`physics/data/exams/*`), the 33 prompts (`physics/data/justify/*`), the equations sheet rows (`EQ`, `NOT_ON` in
`scripts/lib/apphys-entry.mjs`), the score calculator (`physics/assets/pages/score.js`, needs-author
`score-cutoffs`), and the rendered pages for exams, the trainer, unit tests and the cram kit.

## Method

- Every exam-only key and every number in a prompt recomputed by hand and in a scratch script written from
  the stems (not from `EXAM_NUMBERS`). All 25 items graded through `ApPhysQuestions.grade` in a vm: every key
  passes and every distractor fails (100 options, 0 mismatches).
- Forms recounted independently from the bank files: units, set membership, item types, overlap.
- Equations sheet compared with the official sheet (apcentral ap-physics-1-equations-sheet.pdf, © 2025). The PDF
  could not be downloaded here (proxy 403). Read through a fetch tool, it gave the constants, conventions, trig
  table and section labels but not the equations, which are images. Equations checked against the physicslearn.org
  transcription that framework.md section 5 cites.
- Score cut-offs: I rebuilt the needs-author model in my own script (2025 FRQ means and SDs, FRQ inter-question
  correlation 0.5-0.7, MCQ mean 46-56% and SD 18-22, MCQ-FRQ correlation 0.7-0.8, 2025 and 2026
  distributions; 162 cases).
- Released FRQs read for closeness: 2025 (cart with dropped block; block on spring ramp; meterstick torque lab;
  block accelerating up in fresh vs salt water) and 2026 (fountain projectile and flow rate; disk collision with
  CM; ramp μ_k lab; string-pulled rotating toys).
- Scratch site with every unit published (`--out`, own scratchpad folder). In Playwright (local chromium
  1194), I looked at equations-sheet, score-calculator, unit-tests/unit-2, justify and cram, and started both
  practice exams and stepped through all 42 questions of each, screenshotting each one.

## Findings and fixes

### Serious: the exams page did not run (fixed)

`physics/assets/pages/exams.js` lines 237 and 252 had `the exam's order` inside single-quoted JS strings. The
file threw `SyntaxError` on load, so exams.html showed only its header: no practice exam, unit test or timed set
could start. Both are now `exam&rsquo;s`. Checked with `node --check`, and both forms now start and step through
all 42 questions. None of the apphys tests loads this script, so add a `node --check` on every
`physics/assets/**/*.js` to the tests (left for the builder).

### Practice exams (25 exam-only items, 2 forms)

Keys recomputed: 3.0 s; 2.0 m/s²; 40 N static (μ_s mg = 58.8 N > 40 N); 1.8 J; 3.0 m/s; 0.46 m (0.459);
4 times as high; 250 N; 1.0 m right; 2.5 rad/s; 4.5 m/s; 9.0 × 10³ Pa; 1.5 m (1.48); 4.3 × 10³ N (4320); 18 J;
4.2 m/s (4.24); 0.35 m/s; 0.045 J (0.160 − 0.1153); 75 rad; 6.0 rad/s; 10.2 m; 60%. Each conceptual key
(1-13 Bernoulli reason, 2-05 speed greatest at 4.0 m, 2-08 inelastic) checked against the physics. **No key
changed.**

- **phys-exam-1-07**, explanation of option "√2 times as high". Old: "This is how the launch speed changes
  (v ∝ Δx gives 2 times, not √2)...", which contradicts itself. New: "This would fit a height that grows as
  √Δx. The height is set by the stored energy, which goes as (Δx)², so it is 4 times as high (the launch speed
  doubles)."
- **phys-exam-2-11**: the stem gave 1.0 × 10⁵ Pa (2 s.f.) and keyed 10.2 m (3 s.f.). The stem and
  explanation now say 1.00 × 10⁵ Pa, so the 10.2 / 1.02 / 102 m options match the data. Key text unchanged.
- Forms: 42 four-option single items each, units form 1 = form 2 = U1 5, U2 8, U3 8, U4 5, U5 5, U6 3, U7 3,
  U8 5, every one inside `unitRange` (4-7, 7-10, 7-10, 4-7, 4-7, 2-4, 2-4, 4-7). Eight stimulus sets of 3-4
  per form. No question shared. FRQ order is mr/tbr/lab/qqt in both, with point totals 10/12/10/8. Bank sets
  are used as 3-item subsets (the numeric items are left out). I checked that every kept item stands without
  the dropped ones: none refers to a previous answer, and each keeps its stimulus table.
- **Spec mismatch (not fixed, out of scope):** spec decision 10 gives other unit counts (form 1 "U2 7, U3 9,
  U5 6, U8 4"; form 2 "U1 6, U3 9, U7 2, U8 4"). The forms themselves are valid. Correct the spec line to the
  counts above.
- Closeness to released questions: nothing is a copy. The nearest are `frq-u4-sticky-blocks-ramp` (MR: sketch
  momentum vs time, derive v_f, like 2025 Q1, but then a ramp climb and an energy-claim critique) and
  `frq-u8-floating-coin` (QQT on buoyancy, as 2025 Q4, but a floating block sinking Δd, not acceleration
  in two fluids). `frq-u6-two-turntables` (clay on disk vs ring) differs from 2026 Q4 (string-pulled toys).
  The exam-only items are generic textbook situations.

### Justification prompts (33)

Every number recomputed: 2.0 m/s; 9.0 + 18 = 27 m (miss 36 m); 42 N vs 49 N; 1.96 and 3.27 m/s²; 588 J,
98 W, 196 W; 1.0 m/s, 2.5 J to 0.50 J (miss 2.2 m/s); 2.0 N·s, 40 m/s (miss 80); 294 N·m, 210 N, 350 N;
0.20 kg·m²; g = 9.87 m/s²; 6.2 m/s² (miss 3.6); 1020 kg/m³ (miss 2.0 × 10³). In every prompt the "earns" answer
would earn its checklist points. It names the system and the condition before the conservation law, keeps
gravity and buoyancy as separate forces, and puts no extra centripetal arrow. Each "misses" answer is a miss
the Chief Reader reports name, and its "why" is right. Two wording fixes:

- **u5-slope-gives-inertia**: the model answer said "draw the best-fit line rather than using any one point"
  and then took the slope from two data points, which teaches the move the readers penalize. It now reads two
  points far apart on the line itself, which here lie on (2.0, 0.40) and (6.0, 1.20). The checklist line was
  changed to match. Value unchanged.
- **u8-tank-jet-speed**, misses.why: "Pressure at the hole does grow 4 times" now says "The gauge pressure..."
  (the absolute pressure does not grow 4 times).

### Equations sheet (53 rows)

All rows match the sheet. Topic links and "when to use" text are right. Three fixes:
- **Work-energy theorem**: was `ΔK = ΣW_i = F_net,∥ d`. The sheet prints `ΔK = ΣW_i = ΣF_∥,i d_i`, and the old
  form holds only when every force acts over the same distance. Row and "what it is" text updated (the test
  still finds `ΔK = ΣW_i`).
- **W = τΔθ** row: "τΔθ = ΔK" now says the torque is the net torque.
- **Geometry row**: added the cylinder's surface area, S = 2πrℓ + 2πr². The sheet has S as a cylinder variable
  in the standard layout, but I could not confirm this against the image PDF (open question 1).
- `NOT_ON` is right (no I of extended bodies, escape speed, Torricelli, Kepler 3, minimum loop speed, v_max).

### Score calculator

Method: 50 × MCQ/42 + 50 × FRQ/40, with FRQ points 10/12/10/8, matches the current exam's equal section weights.
My own rebuild of the model gives medians **69.7 / 54.4 / 41.1 / 31.2** (ranges 65-74, 51-58, 38-45, 26-36),
the same as the stated 70/55/41/31. The estimate is defensible and clearly labelled: an "estimate, not a
predicted score" banner, a paragraph on how the cut-offs were chosen, and "within about 5 points of a cut-off,
treat it as either score". No change.

### Pages (scratch build, all units published)

- Equations sheet, score calculator, justify and cram render with no script errors. Cram timed sets run at
  10 questions in 20 min (85/42 min each).
- Exam stimuli render correctly: the spring setup, the narrowing pipe SVG (arrow, labels, areas), the F-x
  graph (6 N to 2 m, then down to 0 at 4 m) and the collision table.
- **Unit test lede** (`apphys-entry.mjs`) said "Four answer choices each". Unit 2's test has 4 numeric-entry
  items out of 12, so it now says "Most have four answer choices, as on the real exam, and a few ask you to
  type a value".

## Checks

`node scripts/check-apphys-content.mjs --check`: 0 failing (2 exams, 25 items, 33 prompts).
`node --test scripts/test/apphys-exams.test.mjs`: 15 pass, 0 fail. `check-apphys-map.mjs --check`: passes.

## Open questions for a person

1. Confirm the geometry box on the image PDF (the cylinder's S, and the exact work-energy line) when someone can
   open it.
2. Update spec decision 10's unit counts to the real ones (above).
3. Add a syntax check of the physics page scripts to the tests, so a stray apostrophe cannot ship again.
