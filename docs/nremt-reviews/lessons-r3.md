# Review 3: chapters 17 to 23 (13 lessons)

Reviewer K = 3. Every lesson was read against its notes section and the authors' logged issues. Numbers, sequences
and never/always claims were checked against fetched primary sources where one exists online. Lessons still load
through `scripts/lib/nremt-lessons.mjs` `loadLessons` (80 lessons, 13 in these chapters, every check has 4 options
and a valid key). No em dashes in any of the 13 files. 32 text edits in 6 lesson files; 7 lessons needed no change.

Sources fetched:
- 2025 AHA Highlights (cpr.heart.org): chain of survival, infant technique, post-ROSC SpO2.
- 2025 AHA Adult Post-Cardiac Arrest Care Algorithm (cpr.heart.org).
- 2025 AHA Part 6 Pediatric BLS and Part 7 Adult BLS (cpr.heart.org).
- 2025 AHA Part 10 Special Circumstances (cpr.heart.org): drowning, hypothermia, LVAD.
- 2024 AHA and Red Cross First Aid Guidelines (cpr.heart.org): aspirin, epinephrine, oral glucose, seizure, oxygen.
- EpiPen and EpiPen Jr FDA label (accessdata.fda.gov, 2026 revision).
Not available online and taken from the AHA BLS Provider Manual from memory: pediatric pulse check sites by name and
the AED and water wording. Both are flagged in the notes fixes.

## Chapter 21 (the five points named in the task)

| Point | Lesson | 2025 AHA | Result |
|---|---|---|---|
| Chain of survival | One chain, six links: recognition and emergency activation, high-quality CPR, defibrillation, advanced resuscitation, post-cardiac arrest care, recovery and survivorship; newborn has its own chain | Same six labels; single chain for adult and pediatric, in and out of hospital; separate newborn chain | Matches, no change |
| Post-ROSC oxygen | 90 to 98% | "SpO2 target 90% to 98%" | Lesson right; notes still say 92 to 98% in two places (notes fixes) |
| Pediatric pulse check | Carotid or femoral in a child, brachial in an infant, no more than 10 seconds | Up to 10 seconds (Part 6); sites per BLS manual | Lesson right; notes wrong ("brachial or femoral instead of the carotid") (notes fix) |
| Infant compressions | Two thumbs encircling or heel of one hand; two-finger gone; heel of one hand if hands cannot encircle | Same; "2-finger technique ... no longer recommended" | Matches |
| AED on a wet patient | Was: move out of standing water and dry the chest; question had the patient "in a puddle" | AED use reasonable after drowning; CPR with breaths before AED; BLS manual: out of water, wipe chest, small puddle is acceptable | Lesson reworded, question rewritten (below); notes "Never defibrillate a soaking-wet patient" replaced (notes fixes) |

### special-resuscitation-situations (ch21-special): 16 edits
- SERIOUS. Hypothermia. Lesson and notes taught that the "one shock, then wait for 86 F (30 C)" rule "has been
  dropped", and the misconception card called that rule the mistake. 2025 AHA Part 10 says the reverse: it "may be
  reasonable to defibrillate once and if unsuccessful, defer further defibrillation until the core temperature is
  >= 30 C" (adults and children, class 2b). Fix: step, key idea and summary now say full resuscitation during
  rewarming, AED used, repeat shocks per local protocol, with both the 2020 and 2025 positions named. Misconception
  replaced with an undisputed one (cold, stiff and pulseless does not mean dead; AHA: apparent rigor and fixed
  pupils are not reliable signs of death in hypothermia). Question 6: the distractor "Stop all shocks but continue
  compressions" became defensible under 2025, so it is now "Rewarm him fully on scene before more CPR"; the why no
  longer says shocks continue by the standard algorithm. Contested item 1.
- AED and water. Question 1 put the patient "in a puddle on the dock" and keyed "move him out of the water". The
  AHA BLS manual allows AED use in a small puddle once the chest is wiped, so "attach the pads" was defensible. Stem
  now has his legs still in the lake and a soaking chest, with CPR with breaths already started; key is "Pull him
  clear of the water and wipe his chest dry"; options evened in length; why explains that wiping is enough.
- Drowning step now says CPR with breaths starts before the AED (2025 Part 10, class 1). New key idea on water and
  the AED.
- Checked and left: moving ambulance (stop the vehicle), pad offset from pacemaker or ICD, LVAD (no pulse can be
  normal; unresponsive with poor perfusion gets compressions, which matches 2025 Part 10), SUID wording and family
  care, no field termination in hypothermia.

### steps-of-resuscitation (ch21-steps): 2 edits
- Checked against Part 6 and Part 7: rate 100 to 120; adult depth at least 2 inches and not over 2.4; child about
  2 inches, infant about 1.5; 30:2 and 15:2; switch about every 2 minutes; resume compressions right after the
  shock; 20 to 30 breaths a minute with an advanced airway in children; pediatric attenuator under 8. All match.
- Fix: "one third of the depth of the chest" is now "at least one third" (step and summary), the AHA wording.
- Left as textbook teaching, not AHA: pulse recheck every 30 seconds after ROSC. Not keyed.
- Six questions: keys correct, one best answer each.

### cardiac-arrest-and-chain-of-survival (ch21-arrest-pathophys): no edits
- Chain wording verified. PEA, asystole, agonal gasps and asphyxial versus sudden arrest agree with the notes. The
  author already left out the notes' unsupported percentages (contested item 3). Five questions: keys correct.

## Chapter 20

### acute-coronary-syndrome (ch20-acs): 5 edits
- Aspirin. "Up to 325 mg" has no floor, and question 4 offered "One 81 mg tablet" as a wrong answer while "up to
  325 mg" literally includes 81 mg. 2024 first aid guidelines: chew 162 to 325 mg. Now "162 to 325 mg, chewed" in
  the step, key idea, option, why and summary; the why explains the 81 mg distractor. Notes fixes written.
- Nitroglycerin conditions (own prescription, systolic above protocol threshold, no recent ED medication, medical
  direction, repeat at 5 minutes, maximum 3): consistent with notes and standard texts. ED window and the 94%
  oxygen target use per-protocol wording and no question is keyed on them (contested items 4 and 5).
- Five questions: keys correct.

### angina-ami-and-heart-failure (ch20-cad-ami-hf): no edits
- Angina versus AMI, dysrhythmia as the commonest cause of death, no walking, left versus right heart failure,
  CPAP per protocol, aneurysm: all agree with notes and standard texts. Five questions: keys correct.

## Chapter 23

### anaphylaxis-and-epinephrine (ch23-allergic): 6 edits
- Doses checked against the FDA label: 0.3 mg for 30 kg or greater; 0.15 mg for 15 kg to less than 30 kg; outer
  thigh, through clothing if necessary, hold 3 seconds; second dose from 5 minutes after the first.
- Fix: "0.15 mg for a child under 66 lb" had no lower bound and "adult 0.3 mg" was by age; now about 33 to 66 lb
  (15 to 30 kg) and 0.3 mg at 66 lb (30 kg) and over, smaller infants per medical direction (step, why, summary).
- Fix: hold time and "can be given through clothing" added. That made the distractor "Into the buttock, through
  clothing" half right, so it is now "Into the buttock, held for one second".
- Fix: the repeat dose step now gives the labeled 5 minute minimum, still requiring medical direction.
- Question 4 (40 lb, 18 kg child gets 0.15 mg) is inside the labeled band. Six questions: keys correct.

## Chapter 22

### altered-mental-status-and-diabetes (ch22-ams-diabetes): 3 edits
- Oral glucose checked against the 2024 first aid guidelines: awake and able to swallow gets oral glucose; harm if
  not awake or unable to swallow. Lesson agrees. The "history of diabetes" criterion is protocol dependent
  (contested item 7); question 1 uses a known diabetic so its key does not rest on it; the why now says "the usual
  criteria".
- Fix: "HHNS" (undefined, older name) is now "hyperosmolar hyperglycemic state (HHS)"; notes fix written.
- Fix: question 1 glucose changed from 48 to 54 mg/dL, because the same lesson says that below about 50 the patient
  often cannot take oral glucose safely.
- Five questions: keys correct.

### seizures-stroke-and-syncope (ch22-seizure-stroke-syncope): no edits
- Seizure care checked against the 2024 first aid guidelines (do not restrain, nothing in the mouth, longer than 5
  minutes is an emergency). Cincinnati scale, last known well, oxygen only below 94% or in distress, TIA treated as
  stroke, syncope with ALS evaluation: agree with notes and AHA/ASA teaching. Six questions: keys correct.
- Notes only: "most common cause of seizures in adults" and the febrile seizure age range corrected (notes fix).
  Not added: thrombectomy up to 24 hours in selected patients (author's suggestion; not verified here).

## Chapter 19

### adequate-vs-inadequate-breathing (ch19-respiratory): no edits
- Ventilation rates (adult 1 every 6 seconds; infant or child 1 every 2 to 3 seconds) match 2025 AHA. Pediatric
  bradycardia, silent chest, non-rebreather versus BVM agree with notes. Five questions: keys correct.
- Notes only: cyanosis "first around the eyes" corrected to lips, mouth lining and nail beds (notes fix).

### respiratory-conditions-and-cpap (ch19-conditions): 1 edit
- CPAP indications and contraindications, lung sounds, pulmonary edema positioning, rescue versus maintenance
  inhalers, epiglottitis care: agree with notes and standard texts. Five questions: keys correct.
- Fix: COPD oxygen now "to the target in your protocol (commonly an SpO2 of 88 to 92%)", still never withheld from
  a hypoxic patient. Notes fix removes the duplicated clause. Puff interval and the croup rule: contested 9 and 10.

## Chapter 18

### emt-medications (ch18-pharmacology): no edits
- Medication list, routes, Five Rights, echo technique, alpha and beta effects, naloxone, oral glucose criteria,
  nitroglycerin (own prescription, ED medication, sublingual, check pressure per protocol): agree with notes and
  chapter 20. Six questions: keys correct.
- Notes fix adds the blood pressure condition for nitroglycerin, without a number (contested item 11).

## Chapter 17

### radio-communication (ch17-radio): no edits
- 12-part radio report order, 1 second pause, 2 to 3 inches, 30 seconds, repeat orders back, question an order that
  seems inappropriate: match Limmer. The lesson already says "wait to be told to go ahead"; the notes' "stand by
  clearance" is wrong (notes fix). Five questions: keys correct.

### patient-communication-and-pcr (ch17-pcr): no edits
- Objective versus reported information, pertinent negatives, refusal documentation, single-line error correction,
  drop report, HIPAA: agree with notes and standard texts. Five questions: keys correct.
- Notes fix: "subjective ... or your own impression" corrected. Not written (not verified): the author's point
  that "a closed stance conveys authority" is off, and the electronic PCR addendum line.

## Totals
- Lessons reviewed: 13. Lesson edits: 32 in 6 files. Wrong answer keys: 0. Questions repaired for a second
  defensible option: 3 (wet patient and AED; hypothermia termination; auto-injector site).
- Notes fixes: 23 (notes-fixes-3.json; each `find` occurs exactly once in its section, checked by script).
- Contested items: 11 (contested-3.json).
