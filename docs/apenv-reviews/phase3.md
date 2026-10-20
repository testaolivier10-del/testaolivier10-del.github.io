# AP® Environmental Science Phase 3: build report

Built 2026-10-20 by the Phase 3 builder, exactly as AP® Statistics' Phase 3 (`docs/apstat-spec.md` decision 14), adapted
to spec sections 3, 4, 6 and 7 and decision 7. Independent accuracy review of the new content is Phase 4 (this report
lists what to check). Status and the decision: `docs/apenv-spec.md` (Phase 3 row, decision 11).

## What was built

| Part | Where | What |
|---|---|---|
| "Make it specific" | `environmental-science/data/justify/unit-1.json` ... `unit-9.json` | 45 prompts, 5 per unit, all 8 skills (chain 9, trend 8, hypothesis 7, solution 6, policy 5, variables 4, control 3, tradeoff 3); each with a 2-4 line rubric checklist, an `earns` answer and a plausible `misses` answer that shows one reader-report miss; 21 with slot builders (hypothesis: if [change], then [measure] will [direction], because [mechanism]; policy vs technology; solution fitted to a stated constraint, "other than" respected; control and purpose; variables). First 3 free (`FREE_JUSTIFY`). |
| Practice exams | `environmental-science/data/exams/forms.json`, `items.json` | Two forms, 80 four-option MCQ each, in course order. Form 1: 22 exam-only items (3 quantitative sets: grassland energy budget, Country P demography, school lighting upgrade) + 6 bank sets (visual: green-revolution, nuclear-power, thermal-inversion, ocean-acidification; text: soil-formation, reducing-ozone-depletion) + 40 bank standalones. Form 2: 22 exam-only (3 quantitative sets: city growth, drip irrigation, sea level) + 6 bank sets (visual: mining, hydroelectric, solid-waste, invasive-species; text: waste-reduction, human-impacts-biodiversity) + 40 bank standalones. Unit counts both forms 6, 6, 10, 9, 10, 10, 7, 8, 14 (all inside 4-7, 8-12, 5-8, 12-16). No bank item is a lesson check item or a free unit-test item; no item in both forms. FRQs: form 1 `frq-primary-productivity-design`, `frq-age-structure-data`, `frq-human-population-calc`; form 2 `frq-eutrophication-design`, `frq-ocean-acidification-data`, `frq-energy-conservation-calc`. |
| Recomputed numbers | `scripts/lib/apenv-exams.mjs` `EXAM_NUMBERS` (19), `JUSTIFY_NUMBERS` (8) | Every exam-only key and every named-slip distractor (forgot ×100, divided by the new value, 10% once too often, GPP not NPP, Wh not kWh, cost of new use not saving, doubling time from the wrong year, rate per 1,000 as percent ...) recomputed by `ApEnvCalc`; every number a prompt shows likewise. Tests show the check bites on a changed key, a changed distractor and a changed prompt number. |
| Timed sections | `environmental-science/assets/pages/exams.js` | A fixed exam's Section I alone (80 in 90 min) or Section II alone (3 in 70 min): a Section choice on the setup and `?section=1|2`. No score estimate (unchanged). |
| Formulas page | `scripts/lib/apenv-entry.mjs` `EQ` | 29 rows in 6 groups, every spec section 7 type (a test holds 28 recipes to rows). Each row: formula, what it is and when to use it, a worked line with units whose answer `ApEnvCalc` computes at build time, the classic trap, where it is taught and its trainers. |
| "Formulas" deck | `assets/formulas.json` (generated), `pages/flashcards.js` | One card per row (`eq:<recipe>`), front "what and when", back formula, worked line and trap; its own deck and card type; `?deck=formulas`. Free, served before any unit is published. |
| Unit tests, cram kit | unchanged generators | 12 bank questions per unit (verified on a full scratch build: 9 units × 12); cram kit already in the 80 + 3 format with the 13 May date (tests pass). |

## Shared engine fixes (task 5, plus the coordinator's added cases)

- **(a) Dual-axis plots** (`tools/env-plot.js`): the two axis names now sit in a band above the plot (one line when both
  fit, else two), never inside the plot or over each other; legend entries flow and wrap instead of running off the
  edge. All 7 authored dual plots checked at the default 360 px. Test in `apenv-plot.test.mjs`.
- **(b) Units** (`env-expr.js`, `env-grade.js`): parser reads `s`, `sec`, `ng`, `kL`, `°C`, `°F`, `decade`, `t` and
  `MT` (metric tons), `µg`, `cm3`, `km3`; one-letter units only as whole words (`kgs` is an error, not kg·s); `m2 × m`
  is `m^3` (squared and cubed lengths are powers of the length); a conversion factor with a compound unit divides as
  one quantity (`5000 W / 1000 W/kW` is 5 kW). Normaliser: `t`, `MT`, `tonne(s)`, `metric ton(s)` agree (`Mt` does
  not: a megaton); "X per Y" = "X/Y" (°C/decade, kg/person/yr, people/km², ng/L); numbers in a denominator ("per 1,000
  people" = "/1000 people" = "per thousand"; a key "births per 1,000 people" accepts "per 1,000"); "10^6 times",
  "10⁶", "1 × 10^6 times", "a million times" all read 1,000,000, with times/x/fold/× a unitless multiplier (optional
  on a "times" key); a key whose unit starts with a scale word ("billion metric tons", "million people") is graded in
  base units, so the typed scale word and the key's cancel, and its mistakes match in the same scale. Content check:
  a warning (not an error) when a numeric or setup item's question asks for a rate ("per ...") but its key unit has no
  "/". Tests in `apenv-expr.test.mjs` and `apenv-calc.test.mjs`.
- **(c) Public sources** (`check-apenv-content.mjs` `PUBLIC_SOURCES`): added CDC and the Centers for Disease Control and
  Prevention, NIH, NIEHS, ATSDR, FDA, DOE, NREL, USFWS, NPS, USFS, NRCS, BLM, BOEM, NWS, National Hurricane Center,
  NCEI, BLS, NSF, UNEP, UNESCO, UNICEF, UN-Habitat, UN DESA, WMO, IEA, IUCN, WHO spelled out.
- **(d) "Start here" hint** (`assets/course/tool-studio.js`, `.css`): the ring is clamped to the viewport (its glow is a
  shadow, which never adds scroll) and the tip pulled back inside it. All 12 trainers at 390 px: page width 390, no
  sideways scroll.

## Items authors can now change (not edited here)

- Units that can now be written in the setup: `env-thermal-pollution-15` (`50000 L/s * 86400 s`, L),
  `env-wetlands-mangroves-15` (`120 ha * 10000 m2/ha * 0.5 m`, m³), `env-invasive-species-6` (`1420 / m2 * 3000 m2`,
  a count), `env-sewage-treatment-14` (`80000 people * 300 L/person`, L); `env-math-units-9` can accept
  `1500 W * 4 h / 1000 W/kW`.
- `env-human-population-6` can ask for "births per 1,000 people" again (it now says "the number only").
- "How many times" keys with no unit that could use `unit: "times"` (the word optional, a real unit refused):
  `env-age-structure-6`, `env-dose-response-curve-12`, `env-global-wind-patterns-12`, `env-lethal-dose-50-9`,
  `env-math-sci-notation-10`, `env-mining-10`, `env-nitrogen-cycle-11`, `env-phosphorus-cycle-11`,
  `env-population-growth-4`, `env-sustainable-forestry-13`, `env-watersheds-12`.
- Scale-word units: `env-carbon-cycle-10`, `-11` and `env-math-doubling-7` (rekeyed by the u1-math review) may go back
  to "billion metric tons" / "million people" if the authors prefer. `data/tools/air-pollution.json` "million tons"
  and "thousand tons" are display text in the percent-change drill (the graded answer is %), so they are safe.
- Rate warning (review each; several rightly fix the "per" in the stem): `env-biomass-energy-10`, `env-fuel-types-13`,
  `env-indoor-air-15`, `env-lethal-dose-50-3`, `env-math-rates-1`, `-6`, `-8`, `-10`, `env-math-sci-notation-3`, `-9`,
  `env-plate-tectonics-15`, `env-sewage-treatment-14`. The "°C per decade" item (`env-ocean-warming-15`) is already
  keyed `°C/decade`.

## Checks run

`node scripts/build-apenv.mjs --out <scratch>` with every unit published: 104 topics, 336 files, 9 unit tests of 12.
`node --test scripts/test/apenv-*.test.mjs`: 183 pass, 0 fail. `node scripts/check-apenv-content.mjs --check`: 0 failing
(2 exams, 44 exam-only items, 45 prompts). `check-apenv-map --check`: nothing used before it is taught.
`build-apenv --check` (repo, unpublished): up to date. Playwright (Chromium) at 390 and 1440: justify, exams (setup,
form 1 Section I, form 2 Section II alone), formulas page (no formula or worked line scrolls in its cell at 390, 800
or 1440) and cram kit: no sideways scroll, no page errors (only external fonts blocked by the sandbox); the Formulas
flashcard deck studies and flips.

## Open (for the lead)

- `node scripts/check-site.mjs` fails on files outside this work: a tracked root `assets/env-curriculum.js` (rewritten
  at 05:07 by another session's build run with a wrong `--out`; it duplicates `window.ApEnv*` globals), and British
  spellings in `tools/calculation-studio.js` (lines 195, 442: "colour", "cancelled") and a false "Polaris" hit in
  `tools/earth-climate.js:464` (needs an allow-list entry in `scripts/lib/spelling.mjs`).
- Phase 4 should check: every exam-only item and prompt for science and wording; the distractors' explanations; the
  worked lines on the formulas page.

## Post-review item updates

Every key below was recomputed with independent scratch arithmetic, then the key, its unit spellings, its setup
spellings and every authored mistake were graded through `ApEnvQuestions.grade` / `ApEnvExpr.gradeSetup` in a vm
(35 items, 0 failures). No ids changed, no items deleted.

- **Units back in setups** (`unit` + `requireUnits` where the stem says "with units"): `env-thermal-pollution-15`
  (`50000 L/s * 86400 s`), `env-wetlands-mangroves-15` (`120 ha * 10000 m2/ha * 0.5 m`), `env-invasive-species-6`
  (`1420 mussels/m2 * 3000 m2`, answer unit "mussels"; a bare `1420 * 3000` still earns the setup point),
  `env-sewage-treatment-14` (`80000 people * 300 L/person/day`, keyed L/day; stem no longer says "(millions of liters
  per day)", bare "L" no longer accepted), `env-solid-waste-14` (`... * 1 t / 1000 kg`), `env-clearcutting-8`
  (`250 ha * 150 t/ha`), `env-fuel-types-13` (`500 t * 27000 MJ/t`). `env-math-units-9` already accepts
  `1500 W * 4 h / 1000 W/kW` (unchanged). `env-human-population-6` asks for "births per 1,000 people" again (unit graded).
- **`unit: "times"`** on all 11 "how many times" keys listed above (the word optional, a real unit refused).
- **Rate warnings**: keyed as rates `env-biomass-energy-10` (GJ/ha), `env-math-rates-1` (L/person/day),
  `-6` (kg/student/month), `env-math-sci-notation-9` (L/person/yr), each still accepting the shorter per-person
  spelling; stem fixed for `env-fuel-types-13` ("in one day") and `env-lethal-dose-50-3` ("for one rat").
  `env-math-rates-8`, `-10`, `env-math-sci-notation-3`, `env-indoor-air-15`, `env-plate-tectonics-15` were already
  keyed or worded right (no warning); `-8`, `-10`, `sci-notation-3` gained per-year spellings.
  `env-math-units-11` was a checker false positive: "at \$0.15 per kWh," is now skipped (decimal in the price).
  `check-apenv-content --check`: 0 failing, 0 rate warnings.
- **"metric tons" in setups** (u5 review): `env-expr.js` reads "metric ton(s)/tonne(s)" as `t`; `env-grade.js`
  `normUnit` also folds "metric tonnes". Test in `apenv-expr.test.mjs`. All 7 metric-ton setup items checked
  (`clearcutting-8`, `fuel-types-13`, `greenhouse-effect-10`, `reducing-air-pollutants-14`, `solid-waste-14`, and the
  two percent-change items `el-nino-la-nina-12`, `reducing-ozone-depletion-14`). Scale words inside a setup
  ("10.8 billion metric tons") are still not parsed; the keys do not need them.
- **Select-all with one correct option**: 21 of 52 `multi` items (40.4%), above the 20% target; exams hold no `multi`.
- Checks: `node --test scripts/test/apenv-*.test.mjs` 184 pass; `check-apenv-map`: nothing used before it is taught.
