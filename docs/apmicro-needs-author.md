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
sample questions and College Board's course changes page before Phase 3. (Phase 3, 2026-11-09: still not
confirmed from a Micro source; the forms are built with five, as planned. If the exam has four, drop the fifth
options in `data/exams/fifth.json`, rewrite the 20 exam-only items to four and set `MCQ_OPTIONS = 4`.)

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

## identity: accent, cover, icon, headline and ranks (kept at launch, owner to confirm, 2026-11-10)

Provisional: raspberry accent hue 319° (`#7E1A5E` on `#F8E6F1`, dark `#F3B9DD`; between AP® Statistics at 298° and
AP® Calculus AB at 342°, at least 15° from every course, AA contrast for text on white and on its tint), cover
`#3D0C35` with `#FF9BDF` (cost curves: MC through the minimum of ATC), icon the same, headline "every curve, every
area.", ranks from "Margin Thinker". One place: `IDENTITY` in `scripts/lib/apmicro-build.mjs`, with
`assets/theme.css`, `assets/hub-progress.js`, `scripts/lib/course-homes.json`, the covers in `assets/covers/` and
the course CSS twins. AP® Human Geography was being built at the same time; if it takes a hue in the same gap,
one of the two moves before merge (the identity test in `scripts/test/apmicro-build.test.mjs` checks the gap).

Launch (2026-11-10, `docs/apmicro-reviews/launch.md` section 4): kept, except the cover's profit box is now filled
solid, because the pale box, pink dashed line and dot read close to Calculus AB's curve and tangent on the hub.

## free-tier: graph skills, Unit 1 and Topics 2.1 to 2.4 (open, 2026-11-09)

Spec decision 6. Free trainers `graph-studio`, `elasticity-lab`, `game-lab` (spec section 6). Owner to confirm.

## launch-registration: what is deferred to launch (done 2026-11-10 except the owner checklist)

Registered hidden in Phase 0. At launch: apply `scripts/sql/migrations/2026-11i-apmicro.sql` (written, not
applied); set `status: 'live'` in `assets/courses.js` and run `node scripts/build-courses.mjs`; add `apmicro` to
`ORDER` in the teacher class model (`assets/class/class-model.js`, COURSES already lists it); add it to the AI FRQ
grader's `FRQ_COURSES` only after a calibration and an eval (`docs/frq-grader.md`); add the course to
`sources.html`; create the Polar product `micro-2027` and the Worker `POLAR_PRODUCTS` entry, then `onSale: true` in
`assets/premium.js`; fill the hub and 404 card slots (`hub-mic`, `nf-mic`); update the "fifteen courses" wording.

Done at launch: live, `ORDER`, `FRQ_COURSES` (with a calibration and eval cases, the eval not rerun), sources, the
cards, "fourteen courses" (fourteen live courses in `assets/courses.js`). Left for the owner checklist (spec section
9): the migration, the Polar product, the Worker entry and removing `onSale: false`.

## frq-grader: wired at launch, grader still off (2026-11-10)

`apmicro` is in `FRQ_COURSES` with conventions, a calibration example and eval cases 41-44 (`docs/frq-grader.md`);
the eval has not been rerun and the grader is shipped off for every course. Graph and matrix parts are
checked by code; written parts need their own calibration before the grader is turned on.

## unit-5-6-scope: three teaching choices in Units 5 and 6 (author E, open, 2026-11-09)

Taught as standard economics, labeled, and never the only route to a keyed answer until the CED is checked:
(1) the profit-maximizing input rule MRP/price = 1 for each input, beside the least-cost rule MP/price equal across
inputs (`competitive-factor-markets`, one analyze item); (2) the term "club good" for excludable, nonrival goods
(`public-goods`, added to the map as `club-good`); (3) one Lorenz item asks students to shade the area the Gini
coefficient compares (identification only, no Gini value computed, as `gini` above says).

Reviewer note (Units 5-6 accuracy review, 2026-11-09, `docs/apmicro-reviews/u5-6.md`): the CED PDF could again be
read only through Topic 3.3, so none of the three is confirmed. The entry's "never the only route" is not quite
true for (2): `mic-public-goods-3` and `mic-public-goods-15` key "A club good" as the answer itself. The economics
is standard (Mankiw's term; Krugman says "artificially scarce good"), so they were left as written. If the CED does
not name club goods, rewrite those two items to ask for the two properties (nonrival, excludable) instead of the
name. `mic-inequality-17` also reads a rise in a given Gini coefficient (0.30 to 0.40) as less equality; nothing is
computed.

## u4-review: points left by the Unit 4 accuracy review (open, 2026-11-09)

From `docs/apmicro-reviews/u4.md`. (1) The CED's Unit 4 pages could not be read (the PDF text stops in Unit 3), so
4.1-4.5 scope, including mixed strategies and sequential games, is still unconfirmed (`ced-text`). (2) The loss
rectangles in `mic-monopoly-15` and `mic-monopolistic-competition-15` are thin (about 0.35 units tall) because
`graph.start` allows at most 2 steps; graded by cells, so correct, but hard to tap on a phone. Allowing 3 steps in
`start` (integrator, `mic-graph.js` check) would let a reviewer make the loss clearer. (3) `mic-monopoly-6` keys 4
kits by the MR = MC rule although profit is \$8 at both 3 and 4 kits (now explained, with 3 as a named mistake);
a person may prefer new table numbers with no tie.


## land-resources: do harvested crops and raw materials count as "land"? (open, 2026-11-09)

From `docs/apmicro-reviews/u1.md`. Textbooks differ on whether harvested crops, timber and mined raw materials are
"land" (natural resources) or goods made with land, labor and capital. The Unit 1 items now avoid classifying them.
A person should pick one house rule for the course (suggested: land is the natural resource in place, a forest or
an ore deposit; what is harvested or mined from it is a good) and say it once in the 1.1 notes, so items can use it.
(Integration 2026-11-09: since `graph.start` now allows 3 steps, point (2) of `u4-review` can be acted on by a
reviewer.)


## phase3: points left by the Phase 3 build (open, 2026-11-09)

From `docs/apmicro-reviews/phase3.md`.
1. **Engine (integrator)**: done at launch: a graph drawn under 320 px wide gets larger words (`data-fit`, `mic-core.js`
   and `mic.css`), and matrix row headers no longer break inside a word (`docs/apmicro-reviews/launch.md` 2c).
2. **Shared toast**: the "Save my progress" toast on the results screen reads "30/60 &mdash; and 26 missed ..." with
   an em dash (shared site file, not the course).
3. **Stimulus cap**: `EXAM_STIMULI` 8-22 a form is our estimate, copied from Macro. With it, Units 1 and 2 use
   standalone bank questions almost only; if the Micro exam has more stimulus questions, the cap and the forms
   could carry more of the bank's data and graph sets.
4. **Exam-only science**: items 1-02 to 1-10 and 2-02 to 2-10 cover Topics 3.2 to 6.5, where the CED text was not
   read (`ced-text`); the shutdown rule, the fair-return price, MRP = MFC with the wage from supply and the Lorenz
   curve as cumulative shares are standard and match the course's own lessons. Phase 4 reviewers check them.
5. **Bank fix made in Phase 3**: the Skylark Air stimulus (`price-discrimination-s3`) had "$90" and "$260"
   unescaped, so they rendered as one math span and overflowed the Unit 4 test page at 360 px; now `\$`. The
   content check does not catch an unescaped dollar pair that parses as TeX; a rule for "letters run together in a
   math span" would.

## launch: points left by the launch (open, 2026-11-10)

From `docs/apmicro-reviews/launch.md`.
1. **Tool overlap scan at 360** (a box test, not ink): E1 and E2 when the long run returns to the same point, P1 and
   P2, W1 and W2 axis marks 20 units apart whose font boxes still touch, D1 and MSB in the externality fix drill, ATC
   and AVC end labels in the cost lab's Explore with a large fixed cost; looked at, readable. The factor lab's
   monopsony drill graph sits under the stage's top edge on a phone, so SL reads as clipped there.
2. **Shared, for the lead**: Macro's `mac-graph.js` has the same label width estimate (9 px a character) and no
   phone sizing; not changed (Macro stays byte-identical).
