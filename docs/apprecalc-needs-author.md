# AP® Precalculus: open questions for a person

Things a person (the owner, or an AP® Precalculus teacher) should decide or check. Add to this file instead of
guessing; mark an entry resolved with the date and move it to the end. Seeded in Phase 0 (2026-10-31) from
`docs/apprecalc-research/framework.md` section 9 and the build.

## Owner decisions

### identity: accent, icon, headline, ranks, cover (open, 2026-10-31)

Built as a proposal, owner to confirm (spec decision 8). Accent forest green (hue 145°, apart from AP® Biology's
green and every other course): light ink `#11592F` on tint `#E3F3E8` (7.3:1; 8.4:1 on white), dark ink `#ACE4BF`.
Cover `assets/covers/apprecalc.svg` (deep green `#0B4A33` with a mint `#8AF0C0` sine wave and unit circle). Icon: a
unit circle with a radius and a sine wave. Headline "AP® Precalculus, every function in motion."; hand line "see
every function move". Ranks: Function Explorer, Rate Reader, Asymptote Hunter, Log Unlocker, Circle Turner, Model
Builder, Precalculus Legend. One place to change them: `IDENTITY` in `scripts/lib/apprecalc-build.mjs`, the
`apprecalc` blocks in `assets/theme.css`, `assets/hub-progress.js` and `precalculus/assets/pcalc.css`.

### free-tier: Unit 1 and "Algebra you need" (open, 2026-10-31)

Spec decision 6. Free trainers `function-lab`, `rate-of-change`, `unit-circle` (spec section 6). Set in
`assets/premium.js` (`freeChapters: ['unit-1']`; the algebra chapter is free by rule) and `precalculus/data/pages.json`.

### launch: registration is hidden (open, 2026-10-31)

`status: 'hidden'` in `assets/courses.js`; `onSale: false` in `assets/premium.js`. At launch: apply
`scripts/sql/migrations/2026-10n-apprecalc.sql` (written, not applied), create the Polar product, add the Worker
`POLAR_PRODUCTS` line, set `onSale`, the "eleven courses" wording, `sources.html`, the hub and 404 cards.

### site-weight: the site shell budget moved from 340 to 341 KB (open, 2026-10-31)

`scripts/check-weight.mjs`: registering the eleventh course adds about 1.1 KB to the shared files every page loads
(course lists, premium.js, ranks, tutor, search, theme); the shell measured 339.7 KB, so the budget went up 1 KB
with a comment. The owner may prefer trimming elsewhere.

### og-image: social card not rendered (open, 2026-10-31)

`precalculus/assets/og-image.png` is a copy of AP® Calculus AB's. The card is defined in
`scripts/build-og-images.mjs`; render it where Playwright is available:
`ONLY=precalculus/assets/og-image.png node scripts/build-og-images.mjs`.

### frq-grader: the AI FRQ grader is not wired (open, 2026-10-31)

`docs/frq-grader.md`: the grader is shipped off and its eval is per course. Precalculus's 6-point rubrics would
need their own eval set before `FRQ_COURSES` lists `apprecalc`.

## Exam and CED facts to confirm

### frq2-2027: FRQ 2's new structure and point split (open, 2026-10-31)

For May 2027 part B(iii) is removed and part C expanded; the CED sample and its scoring were not readable. The guide
says write 2-2-2 until confirmed. A person with the current CED should confirm the parts and points.

### ced-text: topic pages 2.2-4.14 (open, 2026-10-31)

Learning objectives and essential knowledge for 2.2-4.14 come from College Board restatements and third-party
summaries, not the CED pages (`framework.md` section 3). `docs/apprecalc-ced-map.json` marks them. A person should
check each against the CED PDF and update the ced map.

### ced-exclusions: "outside the scope" statements in Units 2-3 (open, 2026-10-31)

Only Unit 1's exclusion statements were read. Scan the CED for "outside the scope" in Units 2-3 and add any to the
authoring guide ("Scope").

### exclusions-trig: half-angle and tangent sum/difference (open, 2026-10-31)

Excluded on a third-party source only (Break the Test); verify in CED Topic 3.12. The guide excludes them until
then; sine and cosine sum identities and double-angle identities are in.

### practice-weights: exam weighting by practice (open, 2026-10-31)

Not readable in the CED's exam section; the map has `practicesConfirmed: false`. Items spread across each topic's
practices meanwhile.

### mcq-options: four answer choices (open, 2026-10-31)

Standard for current AP® math exams but not verified for Precalculus; the content check requires four.

### cas: CAS calculators (open, 2026-10-31)

The calculator policy page does not address CAS for Precalculus. The course assumes a graphing calculator (Desmos
in Bluebook) and never relies on CAS.

### scores-2026: 2026 taker count, mean and reader report (open, 2026-10-31)

Not posted when researched (82% 3+, 29% fives known). Update `framework.md` section 6 and the reader-report traps
when the 2026 Chief Reader Report appears.

## Build and format

### tex-subset: vectors, matrices and binomials (open, 2026-10-31)

The TeX subset has `\mathbf`, `\left\langle ... \right\rangle`, `\left\| ... \right\|` and `matrix` inside
`\left[ ... \right]`, but not `\vec`, `\overrightarrow`, a bare `\langle`, `bmatrix` or `\binom`. The map's
`vector` and `matrix` notation patterns also match the unsupported forms so a later addition is caught. Decide
whether Unit 4 needs `\vec` or `bmatrix` (a small change to `pcalc-math.js` and its test).

### teacher-review: no AP® Precalculus teacher has reviewed the course (open, 2026-10-31)

The "not yet reviewed by an AP® Precalculus teacher" note stays on every page until one does (spec section 1).
