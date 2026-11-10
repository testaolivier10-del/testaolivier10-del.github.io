# AP® Microeconomics: open points for a person

Questions the research and the build could not settle. Add an entry instead of guessing; mark it resolved with
the date and the answer. Seeded in Phase 0 (2026-11-09) from `docs/apmicro-research/framework.md` section 11 and
spec section 2 ("Not verified").

## ced-text: essential knowledge for Topics 3.4-6.5 was not read in the CED (open, 2026-11-09)

The CED PDF could be read only through Topic 3.3. Knowledge for 3.4-6.5 in `docs/apmicro-ced-map.json` comes from
the 2023-2025 scoring guidelines, Chief Reader Reports and standard economics, and says so in each topic's
`source`. A person should scan the CED for Units 3-6 (essential knowledge and every "beyond the scope" statement)
and correct the map before those units are reviewed. In particular: increasing- and decreasing-cost industries,
the Gini coefficient, mixed strategies and sequential games (taught as out of scope until confirmed), the
least-cost input rule, tax types in 6.5, and the graph labeling appendix.

## mcq-options: four or five answer choices on the 2027 digital exam (open, 2026-11-09)

Not confirmed for Micro. Treated as Macro (resolved there: five on the CED's sample questions, no change listed for
the course): five, (A) to (E), on practice exam forms (`MCQ_OPTIONS = 5`, `scripts/lib/apmicro-exams.mjs`), four
in the bank (`BANK_OPTIONS = 4`; the forms add a fifth option to each bank question). Confirm from the Micro CED's
sample questions and College Board's course changes page before Phase 3.

## midpoint: is the midpoint elasticity formula required? (open, 2026-11-09)

Not seen in the readable CED text. `ApMicroCalc.midpointElasticity` exists and the formula page has a row for it;
authors teach it briefly, label it, and never key it as the only route to an answer (a question that needs a
percent change gives both prices, or says which method).

## gini: is the Gini coefficient required? (open, 2026-11-09)

The Lorenz curve is in 6.5; the Gini coefficient's coverage is unconfirmed. `ApMicroCalc.gini` and the `gini`
region on the Lorenz graph exist; taught as "the area between the line of equality and the Lorenz curve, as a
share", never computed in a graded item until confirmed.

## increasing-cost: increasing- and decreasing-cost industries (open, 2026-11-09)

The long-run industry supply curve for constant-cost industries is taught in 3.7; increasing- and decreasing-cost
industries are taught as a labeled extension and never keyed as the only answer until the CED confirms them.

## topic-skills: per-topic focus skills are ours (open, 2026-11-09)

No topic's skill tags were copied: every topic's `skills` in the map is our reading. Check against the CED.

## practice-weights: skill weights in Section I are not published (open, 2026-11-09)

`practicesConfirmed` is false, so the forms check enforces unit weights only.

## exam-2026: 2026 statistics (open, 2026-11-09)

The 2026 student count, mean, Chief Reader Report and scoring statistics were not posted.

## identity: accent, cover, icon, headline and ranks (provisional, owner to confirm at launch, 2026-11-09)

Provisional: raspberry accent hue 319° (`#7E1A5E` on `#F8E6F1`, dark `#F3B9DD`; between AP® Statistics at 298° and
AP® Calculus AB at 342°, at least 15° from every course, AA contrast for text on white and on its tint), cover
`#3D0C35` with `#FF9BDF` (cost curves: MC through the minimum of ATC), icon the same, headline "every curve, every
area.", ranks from "Margin Thinker". One place: `IDENTITY` in `scripts/lib/apmicro-build.mjs`, with
`assets/theme.css`, `assets/hub-progress.js`, `scripts/lib/course-homes.json`, the covers in `assets/covers/` and
the course CSS twins. AP® Human Geography was being built at the same time; if it takes a hue in the same gap,
one of the two moves before merge (the identity test in `scripts/test/apmicro-build.test.mjs` checks the gap).

## free-tier: graph skills, Unit 1 and Topics 2.1 to 2.4 (open, 2026-11-09)

Spec decision 6. Free trainers `graph-studio`, `elasticity-lab`, `game-lab` (spec section 6). Owner to confirm.

## launch-registration: what is deferred to launch (open, 2026-11-09)

Registered hidden in Phase 0. At launch: apply `scripts/sql/migrations/2026-11i-apmicro.sql` (written, not
applied); set `status: 'live'` in `assets/courses.js` and run `node scripts/build-courses.mjs`; add `apmicro` to
`ORDER` in the teacher class model (`assets/class/class-model.js`, COURSES already lists it); add it to the AI FRQ
grader's `FRQ_COURSES` only after a calibration and an eval (`docs/frq-grader.md`); add the course to
`sources.html`; create the Polar product `micro-2027` and the Worker `POLAR_PRODUCTS` entry, then `onSale: true` in
`assets/premium.js`; fill the hub and 404 card slots (`hub-mic`, `nf-mic`); update the "fifteen courses" wording.

## frq-grader: the AI FRQ grader is not wired for this course (launch, 2026-11-09)

The hook is in `pages/frq.js` as in every course; `FRQ_COURSES` does not list `apmicro`. Graph and matrix parts are
checked by code; written parts need their own calibration before the grader is turned on.

## unit-5-6-scope: three teaching choices in Units 5 and 6 (author E, open, 2026-11-09)

Taught as standard economics, labeled, and never the only route to a keyed answer until the CED is checked:
(1) the profit-maximizing input rule MRP/price = 1 for each input, beside the least-cost rule MP/price equal across
inputs (`competitive-factor-markets`, one analyze item); (2) the term "club good" for excludable, nonrival goods
(`public-goods`, added to the map as `club-good`); (3) one Lorenz item asks students to shade the area the Gini
coefficient compares (identification only, no Gini value computed, as `gini` above says).

