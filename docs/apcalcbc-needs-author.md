# AP® Calculus BC: open points for a person

Questions and contested calls for the owner or a reviewer. Authors add here instead of guessing; each entry has
an id, the question, what was done meanwhile, and who decides. AB's open points stay in
`docs/apcalc-needs-author.md`.

## For the owner

- **identity** (Phase 0, decision 7, proposed). Accent violet, hue 270: light `--cink #5A1E96` on `--ctint #F1E7FA`
  (8.5:1; 10.2:1 on white, 9.7:1 on the page), dark `--cink #D6BFF5` (11.2:1 on the page, 9.8:1 on the tint).
  It sits between Organic Chemistry's indigo (249°) and Statistics' plum (298°), clear of the site teal and of
  Precalculus' forest green (`#11592F`, 145°), which ruled out the first proposal, emerald. Cover deep violet
  `#34104C` with lilac `#C88CFF` and gold `#FFD23F` (a function, a Taylor polynomial hugging it near its center,
  Σ). Icon: a sigma over a partial-sum curve. Headline "AP® Calculus BC, all the way to series."; hand line
  "every AB topic, then series". Ranks Sequence Starter, Curve Tracer, Polar Plotter, Series Tester, Taylor
  Builder, Convergence Prover, Calculus BC Legend. Close in hue to Psychology's old cover lilac and AB's crimson
  is a sibling, not a clash; confirm.
- **free-tier** (decision 6, proposed): Units 1 and 2, every "Math you need" lesson and 9.1-9.3; free trainer
  `series-lab`. Confirm or change (`PROFILES.bc.freeTopics`, `assets/premium.js` `apcalcbc`, `pages.json`).
- **ab-pass-upgrade**: does an AB pass holder get a discount on the BC pass? The shared pricing has no upgrade
  path today; nothing was built.
- **ab-pages-in-bc**: BC renders every AB topic's lesson and notes under `/calculus-bc/` from AB's files, so a
  BC student stays in one course (one progress store, review queue, dashboard, BC order and navigation). Those
  copies name the AB page as canonical (one copy indexed). The alternative, linking BC students out to the AB
  pages, splits their progress across two courses. Confirm the choice.
- **ab-trainers**: BC links AB's ten trainers on their AB pages rather than building them again, so answers
  there count in Calculus AB, not BC. Building them under `/calculus-bc/` would mean parameterizing the ten
  tool scripts the way the core runtime is now (Phase 2 work). Confirm.
- **launch-checklist** (filled at launch): apply `2026-10n-apcalcbc.sql`, create the Polar product "AP® Calculus
  BC Premium (through June 30, 2027)" $25, add `"cbc-2027"` to `POLAR_PRODUCTS` in the Worker settings, remove
  `onSale: false`, set the registry status, merge.

## For the course (Phase 1 and later)

- **ab-text-on-bc** (Phase 1, author A): AB's notes for 6.10 (`rewriting-integrands`) and 6.14
  (`choosing-integration-methods`) say partial fractions and parts "belong to the BC course". On BC pages that
  is wrong, and 6.10 names partial fractions before 6.12. Wrap those sentences in `calc-ab-only` and add BC
  wording in `cbc-only` (6.14 lists parts and partial fractions among the choices); the BC map check flags
  6.10 once Unit 6 is published in BC.
- **partial-fractions-scope**: "linear partial fractions" read as distinct linear factors only (framework.md
  section 10 item 7: our reading of "linear, nonrepeating", not an exclusion statement). Items use two or three
  distinct linear factors.
- **logistic-solving**: the CED asks for interpretation, not an explicit solution; items do not ask students to
  solve dy/dt = ky(a - y).
- **mcq-mix**: the share of BC-only versus AB-content questions on the 2027 MCQ is not published (about 60% of
  the exam is AB content). Practice exams use the BC unit weights only (`unitRange`).
- **justify-counts** (Phase 3): AB's trainer holds 3-5 prompts per unit and 32+ in all; BC's counts (Units 9
  and 10 and the BC topics of 6-8) are set in Phase 3. The content check skips AB's counts for BC.
- **frq-grader**: the AI FRQ grader is not wired for BC (`docs/frq-grader.md`); decide at launch.
- **ab-score-calculator**: BC has no score calculator and no readiness band (owner 2026-10-14, 2026-10-26). AB
  still has its score calculator page live (`calculus/score-calculator.html`) and its band; left as is.
- **teacher-review**: the "not yet reviewed by an AP® Calculus BC teacher" note stays until a teacher reviews
  the course.
- **2026-statistics**: 2026 BC FRQ means, CR report and AB subscore distribution were not posted on 2026-10-31
  (framework.md section 10); refresh before quoting them.
