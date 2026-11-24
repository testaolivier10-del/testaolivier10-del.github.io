# Plan: NREMT, Reference cards (tools v2)

## Tool and page
- Page `nremt/reference-cards.html` (its inline script mounts the Tool Studio with four modes). Scripts
  `nremt/assets/ref-cards.js` (404 lines: GCS, APGAR, triangle and "Score a patient"), `nremt/assets/vitals-check.js`
  (167 lines: age slider and value check). The four tables in the HTML are read by the tool and by
  `scripts/build-nremt-flashcards.mjs` and `nremt/assets/search-index.js`.
- **Free.** Rollout row 44, group C (calculators and drills), size restyle; listed under "might be split" (4 ideas).
  Unchanged on `claude/tools-v2-all`.

## The one idea
The numbers an EMT scores a patient by come from what you can see on the patient. Four tabs, one idea each:
1. **Vitals**: normal heart rate, breathing and blood pressure change with age.
2. **GCS**: eyes, words and movement are scored apart and added (3 to 15).
3. **APGAR**: five signs of a newborn, 0 to 2 each.
4. **Triangle**: from the doorway, which side is abnormal tells you what kind of sick.

## Research
- [Oregon EMS for Children, pediatric assessment card](https://WWW.OREGON.GOV/oha/PH/PROVIDERPARTNERRESOURCES/EMSTRAUMASYSTEMS/EMSFORCHILDREN/Documents/Pediatric-Assessment.pdf)
  and [New Jersey EMS pediatric assessment](https://www.nj.gov/health/ems/documents/reg-enforcement/peds_assess.pdf):
  the triangle drawn with a child's picture per side. Take: each side is a look at the child, not a word.
- [Vital Values (App Store)](https://apps.apple.com/gb/app/vital-values/id460023541) and
  [EMS Pediatric Guide](https://appadvice.com/game/app/ems-pediatric-guide/389657039): pick an age, every range
  updates at once. Take: one age control, three readings move together.
- Complete Anatomy (tap a part, a card) for tapping the eyes, mouth and arms in GCS. Seen as text only; the
  builder opens them.

## Old tool inventory (origin/main) and where each goes
| Old | v2 |
|---|---|
| Vitals: age slider (stops in months then years), row name, three vital buttons (HR, RR, SBP) with this row's range, type a value box with in range / low / high verdict, tap a table row to move the slider | Explore tab 1 (age knob on the picture, the three ranges drawn on the patient); the type a value check becomes Test yourself part "Check a reading" (forgiving number input, ungraded) |
| GCS: three tap columns (eye, verbal, motor) with live total and reading band | Explore tab 2 on the drawn patient |
| APGAR: five rows of 0, 1, 2 with live total and band | Explore tab 3 on the drawn newborn |
| Triangle: tap a side, the middle names the combination | Explore tab 4 on the drawn child |
| "Score a patient" practice per card (GCS 4 cases, APGAR 3, triangle 3) with hint, Check, Show the answer, records `tool: 'reference-cards'`, id `<mode>:<case text>` | Test yourself parts "Score GCS", "Score APGAR", "Read the triangle", ids unchanged |
| Why per mode (card lead line and notes), Details with all four tables and the sources line | "?" per tab (notes); "?" also keeps all four tables, unchanged in the HTML so the flashcard builder and search still read them |
| Deep links `#pedsVitals`, `#gcs`, `#apgar`, `#pat` (and the mode values), hashchange; `?studio=0` slim page | each opens its Explore tab; `?studio=0` unchanged |

## Design
- **Vitals:** the patient drawn from `LevlBodyFigs` (infant, toddler, child, adult figures in `body-figs/`), the
  figure changing as the age knob moves along an age line under it (cross fade between figures, height grows). On
  the figure: a beating heart with pulse rings at the band's middle rate, the chest rising at the middle breathing
  rate, a BP cuff whose gauge needle marks the minimum systolic (70 + 2 × age for 1 to 10). Labels: "Heart rate
  90 to 150", "Breaths 20 to 30", "Lowest BP 76". Cause line: "Toddler → smaller heart, faster rate → 90 to 150".
- **GCS:** a patient on a stretcher, head and arms framed. Three tap targets on him: eyes (cycle open, to voice, to
  pain, closed), mouth (speech bubble: oriented sentence, confused, words, sounds, nothing), arms (obeys, localizes,
  withdraws, flexion toward the core, extension, limp; drawn poses). Total E + V + M on the picture.
- **APGAR:** a newborn on a warmer, five tap targets (skin colour with blue hands and feet for 1, pulse at the cord,
  grimace, tone, cry). Total out of 10 on the picture.
- **Triangle:** a toddler seen through a doorway; tap each side of a drawn triangle beside him; the child changes
  (limp and not looking; retractions and nasal flaring; mottled, pale skin). The centre names the category.
- **Outside the picture:** four tabs, purpose line, cause line. About 25 words.

## Science to verify
- The pediatric vitals table and the 70 + 2 × age rule: AHA PALS (2020 and the AHA 2025 guidelines, check for any
  change); ranges differ by source (the page's footer says so), keep the page's table.
- GCS components and scores, "no zero, minimum 3", decorticate flexion and decerebrate extension, 8 or below for
  airway: Teasdale and Jennett; NREMT EMT scope (National EMS Education Standards).
- APGAR signs and the acrocyanosis trap (scores 1), scored at 1 and 5 minutes, never delays care: AAP and ACOG
  APGAR statement; AHA 2025 neonatal resuscitation (ventilate for apnea or HR under 100).
- Triangle categories and the one unnamed combination: AAP PEPP; already open in `docs/nremt-needs-author.md`
  (Reference cards, score readings).
- The drawn infant figure is older than a newborn: a newborn needs its own drawing (proportions, cord clamp).

## Reuse
- `nremt/assets/nremt-kit2.js` (stage, "?", parts with their own stage and dock, `start` for the hashes).
- `LevlBodyFigs` figures; face states and clothes clipping from `nremt/assets/mnemonics.js` (AVPU already draws eyes
  and responses to voice and pain); gloved hands from `flow-explore.js` (the trapezius squeeze for "to pain").
- `ref-cards.js` table reading (`rowsOf`, `GCS`, `APGAR`) so the tool and the tables never disagree.

## Risks reviewers will likely block on
- Arm postures and the newborn drawn as blocks or the wrong age (rule 12); the infant figure reused as a newborn.
- Three tap targets on a small head at 360 px: each target 44 px, labels clear of the face.
- Speech bubble text over 3 words; GCS words wrapping in their pills at 360.
- Figure cross fade making labels name the previous age for a frame (rule 14).
- NREMT shell weight (28.6 of 28.8 KB): the tool's code goes in its own files, not the shell.
