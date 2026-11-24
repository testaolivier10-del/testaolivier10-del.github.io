# Plan: NREMT, Drug formulary (tools v2)

## Tool and page
- Page `nremt/formulary.html` (its inline script mounts the Tool Studio, two modes). Scripts
  `nremt/assets/formulary-cards.js` (305 lines: the "Give or withhold?" deck of 20 patients, swipe, Drill my misses),
  `nremt/assets/formulary-drill.js` (108 lines: runs of 8 bank questions on topic "Pharmacology" from the question bank).
  The seven drug cards (oxygen, aspirin, oral glucose, epinephrine, naloxone, albuterol, nitroglycerin) are HTML in
  the page; `scripts/test/nremt-cases.test.mjs` fails if a card's `rule` phrase leaves its drug card.
- **Free.** Rollout row 106, group M (sorters and matchers), size rework (no free play: the landing is graded).
  It is the NREMT sample in `scripts/check-tool-use.mjs` (do not edit that file). Unchanged on `claude/tools-v2-all`.

## The one idea
One finding on the patient decides whether you give the drug or hold it. One screen: the drug in the EMT's hand,
the patient, and the findings you can switch on and off.

## Research
- Duolingo and Quizlet Match (group M row): instant right or wrong on the item, short rounds. Take: for Test
  yourself only (the deck).
- Full Code Medical Simulation and Body Interact (group N row): a patient whose findings are on the body and the
  monitor. Take: the findings are drawn on him, not listed.
- NREMT clinical judgment item types (the exam's own "drag the finding" items). Take: the student toggles the
  finding and sees the decision change. Seen as text only; the builder opens them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Mode Give or withhold?: a deck of 20 patient cards (4 aspirin, 5 nitroglycerin, 3 epinephrine, 2 each oxygen, oral glucose, naloxone, 1 albuterol), swipe or tap Give / Withhold, verdict with the card's line and dose, finished card with score, Drill my misses, Deal a new deck, "See the whole card" | Test yourself part "Give or withhold" unchanged (swipe kept), records `tool: 'formulary'`, id `gw:<card id>` |
| Mode Question drill: runs of 8 bank questions, records by question id into the Review queue | Test yourself part "Question drill" unchanged |
| The seven drug cards (indications, contraindications, dose and route, action, side effects, "Before you give it") | "?" (all seven, unchanged HTML); Explore shows only the line that decides |
| Why: intro and the verdict lines | "?" |
| Deep links `?gw=<id>#gw` (Review's "Try it again"), `#drill`, `#drug-<name>` (search) | `?gw=` opens Test yourself dealing that card first; `#drill` the drill part; `#drug-<name>` opens Explore on that drug (and its card in "?") |

## Design
- **Picture:** a patient seated on a stretcher (`LevlBodyFigs` adult or female figure, clothes clipped as in
  mnemonics), an EMT's gloved hand holding the real device: aspirin bottle and two tablets, nitroglycerin spray or
  tablet bottle, epinephrine auto injector, naloxone nasal device, albuterol inhaler with spacer, oral glucose tube,
  oxygen cylinder with a non rebreather. A drawn jump kit at the side holds the seven; tap one to swap the drug
  (secondary, quiet).
- **Main control:** findings drawn on the patient that tap on and off (one to three per drug, each from that drug's
  card): BP cuff reading 88 systolic and a sildenafil bottle for nitroglycerin; vomit with coffee ground look and a
  15 year old patient for aspirin; can he swallow (slumped, eyes closed) for oral glucose; wheeze and lip swelling
  for epinephrine. A stamp on the hand's device reads Give or Hold and flips with a short animation as a finding
  changes.
- **Cause line:** the card's own deciding phrase: "Took sildenafil yesterday → nitroglycerin can drop the pressure
  → hold it".
- **Takeaway** when every finding of a drug has been tried: "What stops you matters more than what starts you."
- **Outside the picture:** purpose line, cause line. About 20 words.

## Science to verify
- That all seven are within the EMT scope and how (assist with the patient's own nitroglycerin and albuterol; the
  epinephrine auto injector; intranasal naloxone): 2019 National EMS Scope of Practice Model, 2021 National EMS
  Education Standards, the NREMT EMT exam outline.
- Doses: aspirin 162 to 325 mg chewed (AHA 2025 ACS); nitroglycerin 0.4 mg SL every 5 minutes up to 3, the systolic
  floor (90 or 100 by protocol) and the PDE5 windows (24 hours, 48 for tadalafil); epinephrine 0.3 mg adult, 0.15 mg
  child auto injector; naloxone 4 mg intranasal; oral glucose 15 g; oxygen titrated to 94 to 98%.
- Oxygen in suspected ACS: AHA 2025 gives oxygen only below 90%; the page says hypoxia under 94%. Check and log in
  `docs/nremt-needs-author.md` before drawing any oxygen finding.
- Aspirin and Reye syndrome age cut off; the bystander nitroglycerin wording already open in
  `docs/nremt-needs-author.md`.

## Reuse
- `nremt/assets/nremt-kit2.js` (parts with their own stage and dock; `start` maps `?gw=`, `#drill`, `#drug-`).
- `LevlBodyFigs`, clothes and face states from `mnemonics.js`, gloved hands from `flow-explore.js`.
- `formulary-cards.js` `CARDS` (`rule` phrases read from the drug cards' DOM) as the source of every finding.

## Risks reviewers will likely block on
- Devices drawn as icons or blocks (rule 12); the device too small to read at 390.
- Finding labels covering the face or the device; more than one finding pulsing (one cue).
- The stamp flipping before the drawn finding changes (rule 14).
- A finding that is not a real contraindication on the card (science simplification).
- NREMT shell weight; the device drawings go in the tool's own file.
