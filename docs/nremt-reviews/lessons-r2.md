# Review 2: chapters 9, 10, 11, 13, 14, 15, 16 (14 lessons)

Reviewer K = 2, 2026-11-10. Chapter 12 (pilot) skipped. Every lesson was read against its notes section and the
authors' logged issues (notes-issues-A.json, notes-issues-B.json). 16 text fixes in 8 lesson files, no answer key
changed. All 80 lessons still load through `loadLessons` (read only); no em dashes in the 14 files.

## Sources fetched

- AHA 2025 Part 7, Adult Basic Life Support: https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support
- AHA 2025 Part 6, Pediatric Basic Life Support: https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-basic-life-support
- AHA 2025 adult FBAO algorithm (accessible text): https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Accessible/Algorithm-BLS-Adult-FBAO-LngDscrp-250618-Ed.pdf?sc_lang=en
- AHA 2025 post-cardiac arrest care algorithm: https://cpr.heart.org/-/media/CPR-Files/CPR-Guidelines-Files/2025-Algorithms/PCAC-Algorithm-ACLS-PCAC-250527.pdf?sc_lang=en
- Heart and Stroke 2025 interim BLS provider manual (AHA text): https://cpr.heartandstroke.ca/resource/Guidelines2025InterimBLSProviderManualEN
- American Red Cross suctioning fact and skill sheet: https://www.redcross.org/content/dam/redcross/training-services/no-index/SuctioningFactandSkill.pdf

Not fetched, checked from memory of the named standard only: 2021 field triage guideline, CDC 2007 isolation
guideline, AHA 2019 blood pressure measurement statement, ACC/AHA aortic disease guidelines, EMT texts (Brady, AAOS).
The searches for the blood pressure and dissection points returned links but no readable text.

## What the AHA text confirmed (the four points asked for)

- Choking sequence: confirmed. Adult severe FBAO: repeated cycles of 5 back blows then 5 abdominal thrusts until the
  object is out or the person is unresponsive (COR 1). Mild: let the person cough and watch. Unresponsive: CPR starting
  with compressions, remove a visible object when opening the airway for breaths, no blind finger sweeps (COR 3 harm).
  Children: 5 back blows alternating with 5 abdominal thrusts. Infants: 5 back blows alternating with 5 chest thrusts,
  heel of one hand; no abdominal thrusts; no pulse check. The 709 patient cohort is in the adult supporting text.
  One nuance was off: AHA gives late pregnancy its own recommendation (chest thrusts) and a separate one for "unable to
  encircle the abdomen"; it does not name obesity. Fixed in the lesson and in notes fixes.
- Suction time limits: the 2025 AHA guideline text has no suction time limit. Red Cross sheet: 15 seconds adult,
  10 child, 5 infant, measured earlobe to corner of mouth, suction on withdrawal. The lesson's adult hedge stays; child
  and infant are now split 10 and 5. Adult 15 versus 10 is in contested-2.json.
- Oxygen targets: AHA post-arrest algorithm titrates to 90 to 98%. No AHA text sets a general EMS target; "94% or
  above" and "88 to 92% in COPD" are standard EMT teaching and the lessons mark them "per local protocol". Contested
  item logged for the owner (range versus floor).
- Ventilation rates: confirmed. Adult with a pulse: 1 breath every 6 seconds, 10 per minute, visible chest rise, each
  breath over 1 second. Infant or child with a pulse: 1 every 2 to 3 seconds, 20 to 30 per minute, and the same 20 to
  30 with an advanced airway. The adult text fetched did not state the advanced airway rate; 10 per minute is the
  adult ALS figure and the lesson limits it to "adult CPR".

## Chapter 9

### airway-anatomy-and-manual-maneuvers (ch9-airway)
- Checked jaw-thrust first and head-tilt/chin-lift if it fails against AHA Part 7 section 6.3 and Part 6: matches
  (AHA adds "and airway adjunct insertion" before falling back; lesson wording is acceptable).
- Anatomy, pediatric positioning, five check questions: no findings. No fix.

### airway-adjuncts-opa-npa (ch9-adjuncts)
- Sizing, insertion, gag reflex rule, NPA caution with basilar skull fracture: standard, consistent with notes.
- Finding: check question 3 distractor "Sideways, then rotate 90 degrees past the teeth" is a real alternative OPA
  technique in some texts, so it was a second defensible option. Fix: replaced with "Right side up, pushed in without
  holding the tongue" and added a clause to the explanation.

### suctioning-and-airway-sounds (ch9-suction)
- Finding (serious): stridor from anaphylaxis was taught as "transport rapidly" only, following the notes' line that
  "nothing in an EMT's hands opens a swollen larynx". Epinephrine by auto-injector is EMT scope and is the treatment.
  Fix: step 6 and the explanation of check question 3 (bee sting with facial swelling) now say epinephrine per
  protocol plus rapid transport. Notes fixes written.
- Finding: child and infant suction time lumped as "10 seconds or less". Fix: about 10 seconds child, about 5 infant
  (Red Cross sheet), in the step and the summary. Notes fixes written.
- Insert without suction, suction on withdrawal, measuring landmark: confirmed by the Red Cross sheet.

### choking-foreign-body-obstruction (ch9-fbao)
- Whole sequence checked against AHA Parts 6 and 7 and the adult algorithm: correct, all five keys correct.
- Finding: step 4 and the summary treated late pregnancy as an example of "cannot get your arms around". Fix: "The
  patient is in late pregnancy, or you cannot get your arms around the abdomen, as with significant obesity."
- Finding: the swollen airway idea listed anaphylaxis with no treatment but oxygen and transport. Fix: added
  "plus epinephrine per protocol when the cause is anaphylaxis". Notes fixes written.

### bag-valve-mask-ventilation (ch9-bvm)
- Rates, one second, chest rise, "adult CPR" wording for the advanced airway rate: confirmed (see above).
- Finding: "work through the causes in order: re-seal, reposition" is stated as fixed, but the texts disagree on
  whether seal or head position comes first. Fix: step 6 and the explanation of check question 4 now treat the seal and
  the head position as the first pair. The question's options never offered repositioning, so the key stands. Logged
  in contested-2.json. Notes fix for the missing age on the advanced airway rate.

## Chapter 10

### oxygen-or-ventilation
- Adequate versus inadequate breathing, pediatric signs, timing assisted breaths: standard, matches notes. No fix.

### oxygen-delivery-devices
- Flow ranges and percentages are the commonly taught EMT figures. Targets checked as above.
- Finding: the hook called a non-rebreather at 15 L/min for a COPD patient at 84% flatly "wrong"; many protocols
  start there and titrate down. Fix: the crew member now wants it "until the reading is 100%", which is the error.

### oxygen-equipment-safety
- 2,000 psi full, 200 psi safe residual, pin index, regulator versus flowmeter: standard. The lesson already leaves
  out "back the valve off" (contested, carried into contested-2.json). No fix.

## Chapter 11

### scene-size-up
- Danger zone distances (50 ft, 100 ft, one span), three collisions, velocity classes: standard EMT text figures.
  Fall over 10 feet at any age: matches the 2021 field triage guideline.
- Finding: check question 2 keyed on "the four components"; other sources count five (resources listed separately).
  Fix: stem now reads "the components". Logged in contested-2.json. Notes fix for "also called BSI".

## Chapter 13

### taking-core-vitals
- Normal ranges, pulse sites (brachial in an infant still current in AHA 2025), 30 or 60 second count, capillary
  refill, pupils, 5 and 15 minute intervals: standard. No fix.

### blood-pressure-oximetry-glucose
- Cuff size and arm position errors, Korotkoff points, carbon monoxide and oximetry, capnography 35 to 45 mmHg,
  glucose below 70 mg/dL: standard. The lesson already follows the topic text on the pulse-to-pressure rule. No fix.
- Notes fixes written for the takeaway that still quotes the 80/70/60 rule and for "deflating too fast reads low".

## Chapter 14

### history-and-physical-exam
- OPQRST, SAMPLE, exam techniques, toe to head for small children, heuristics: match notes and standard texts.
- Finding: check question 1 says the three wrong options are closed-ended, but one is a two-choice question that
  cannot be answered yes or no. Fix: explanation now says "yes, no or a choice you supplied".
- Finding: check question 5 (anchoring) said the EMT "stops looking", which describes search satisfying, a pitfall the
  lesson also teaches. Fix: "He holds to that view even after finding..." so anchoring is the one best answer.
- Notes fix: inter-arm pressure difference suggests aortic dissection, not aneurysm. Bowel sounds logged as contested.

## Chapter 15

### secondary-assessment
- Order by patient type, DCAP-BTLS, rapid trauma assessment, field triage mechanism list (correct but not complete:
  the guideline also lists need for extrication and an unrestrained child): accurate.
- Finding: "continue manual stabilization of the spine" for every serious trauma patient. Fix: added "when a spinal
  injury is suspected". Collar wording already "per local protocol"; soft collar statement logged as contested.
- Notes fix: nose breathing applies to young infants, not children in general.

## Chapter 16

### reassessment-and-trending
- Four components, intervals, trending, handoff order: match notes and standard teaching. Keys correct. No fix.
- "FIRR" could not be found in any standard source; the content under it is sound. Logged for the owner.
- Notes fix: "not a diagnosis" changed to "not a final diagnosis" so chapter 16 agrees with chapter 14.

## Totals

- Lessons reviewed: 14. Lesson text fixes: 16 (in 8 files). Answer keys changed: 0.
- Notes fixes: 19 (each `find` checked to occur exactly once in its section). Contested items: 8.
