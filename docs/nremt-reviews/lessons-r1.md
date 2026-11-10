# Review 1: chapters 1 to 8 (16 lessons, free tier)

Reviewer K = 1, 2026-11-10. Every lesson was read against its notes section and the author's logged issues
(notes-issues-C for chapters 1 to 4, notes-issues-D for 5 to 8). All 16 still load through
`scripts/lib/nremt-lessons.mjs` `loadLessons` (80 lessons total, 16 in chapters 1 to 8). No em dashes in any of
the 16 files. No wrong answer key was found. 22 text edits were made across 10 lesson files; 6 lessons needed none.

Sources fetched in this review (the rest was checked against the notes and standard EMT text knowledge):

- CDC, TB screening and testing of health care personnel, frequency (cdc.gov/tb-healthcare-settings/hcp/screening-testing/frequency.html)
- CDC/NIOSH needlestick document (stacks.cdc.gov/view/cdc/204396): HIV about 0.3%, hepatitis B 6 to 30%
- CDC/NIOSH Ryan White notification process (cdc.gov/niosh/ryan-white/php/notification-process/index.html)
- FCC wireless E911 Phase I and II (fcc.gov/node/24507)
- NENA 911 statistics (nena.org/page/911statistics)
- NREMT EMT recertification (nremt.org/EMT/Recertification); EMS World on the end of the ALS psychomotor exam
- Highway Safety Act of 1966 (encyclopedia.com entry, Pub. L. 89-564); EMRA EMS history
- National POLST (polst.org/history-of-polst)
- HHS HIPAA FAQ 2087 (disclosures to family and friends)
- 2024 AHA and Red Cross first aid guidelines summary (cpr.heart.org PDF)
- 2018 ACS-COT, ACEP, NAEMSP joint position statement on spinal motion restriction (naemsp.org)
- LITFL biography of Larrey (flying ambulances)

Not fetched, relied on memory of the standard: infant brachial pulse check and the puberty cut-off (AHA BLS),
Kübler-Ross stages, Selye stages, negligence elements, body mechanics figures (Limmer, Emergency Care), anatomy.

## Chapter 1

### ems-history (ch1-history)
- Checked: dates and sequence against the notes and EMRA history; Larrey against LITFL.
- Finding (serious for a keyed question): the lesson stated flatly that the 1790s French service "gave no care at
  the scene", and question 1 had "It treated them at the scene and then carried them away" as a wrong option. The
  standard EMT text says this, but historical accounts of Larrey's flying ambulances describe surgeons bringing aid
  onto the battlefield. A wrong option was therefore defensible.
- Fix: step 1, key idea 1, question 1 (stem, key, one distractor, why) and the summary now say the service was
  built to carry the wounded off the field to care; the flat "no care" claim is attributed to the textbooks; the
  disputed distractor is replaced. Logged in contested-1.json.
- Other questions: keys correct, one best answer each.

### ems-system-today (ch1-ems-today)
- Checked: 1966, 1970, 1973; the 10 NHTSA components (match the NHTSA assessment standards list); system flow.
- Finding: key idea 1 contained an author-facing aside, "(the notes call it the National Highway Safety Act)".
  The statute is the Highway Safety Act of 1966.
- Fix: now "the Highway Safety Act (many EMT texts call it the National Highway Safety Act)"; the why of question
  1 uses the same name. Notes fix added.

### accessing-911 (ch1-911)
- Checked: NENA (about 240 million calls a year, 80% or more wireless in many areas, 98.9% of the population with
  Phase I and II service); FCC Phase I (number and cell site) and Phase II (latitude and longitude).
- No lesson change. Notes fix added so Phase 1 mentions the cell site, as the lesson does.

### ems-provider-roles (ch1-ems-systems-roles)
- Checked: four levels and their descriptions against the National EMS Scope of Practice Model levels; order of
  responsibilities; traits (125 lb, 8 hours) against the notes.
- No findings. Keys correct.

### education-registry-quality (ch1-education-qi)
- Checked: NREMT 2-year renewal (nremt.org); EMT skills verified at state or program level and the ALS
  psychomotor exam ended June 30, 2024 (EMS World); on-line and off-line medical direction.
- The lesson already teaches the current position (the author logged it). No lesson change. Two notes fixes added.

### ems-public-health-evidence (ch1-public-health)
- Checked: oxygen claim against current practice (oxygen only for hypoxemia in ACS and stroke; trials show no
  benefit in patients with normal saturation and possible harm from excess).
- Finding: the hook said oxygen a patient does not need "can make a heart attack or a stroke turn out worse" as
  the research finding. Evidence supports "no benefit, possible harm".
- Fix: "does not help, and too much of it may make a heart attack or a stroke turn out worse".
- Finding: question 4 ("small mistake") left "fix it quietly yourself" arguable, and a mistake that endangers a
  patient must be stopped at once. Fix: stem now says the mistake "does not put the patient at risk".

## Chapter 2

### standard-precautions-wellness (ch2-provider-wellness)
- Checked: CDC TB testing frequency; CDC needlestick risks; Ryan White two notification routes (facility notifies
  the designated officer within 48 hours for airborne disease; the employee asks through the designated officer
  for other exposures); OSHA bloodborne pathogens standard duties.
- Finding: step 4 implied an N-95 for any suctioning, which clashed with step 3 (face shield for suctioning).
  Fix: step 4 is now about suspected TB, with the closed ambulance and suctioning as the highest-risk moments.
- Finding: "under 0.5% against up to about 30% ... because HIV does not survive well outside the body". The
  needlestick risk figure is not explained by survival outside the body. Fix: "about 0.3% against roughly 6% to
  30% for an unvaccinated person after a needlestick. HIV also does not survive well outside the body."
- Small clarity fix: "A surgical mask on you is not enough for an airborne disease."
- The lesson correctly omits yearly TB testing and "highly contagious". Three notes fixes added; "highly
  contagious" is in contested-1.json.

### stress-grief-scene-safety (ch2-stress-safety)
- Checked: stages and reaction types against the notes; PTSD duration (more than a month).
- Finding: question 3 put nightmares and flashbacks at "three weeks" and keyed "delayed stress reaction". Three
  weeks is inside the window usually called acute, so "acute" was defensible.
- Fix: "Three months after ... an EMT begins having nightmares and flashbacks."
- Wording on grief, PTSD and seeking help is respectful. Other keys correct.

## Chapter 3

### lifting-and-moving-patients (ch3-lifting-moving)
- Checked: backboard, scoop stretcher and vacuum mattress against the 2018 joint position statement (all listed as
  devices for spinal motion restriction and transfer); recovery position against the 2024 first aid guidelines
  (decreased alertness, nontraumatic, breathing normally); shock supine and no leg raise (current teaching, in the
  notes).
- Finding: the positions key idea and the summary gave the recovery position for "unresponsive with no spine
  injury" without the breathing condition (question 5 had it). Fix: both now say "breathing adequately".
- Notes fixes added (positioning table; vacuum mattress as an accepted device).
- "Never three rescuers on a device" is the textbook rule and is kept; keys correct.

## Chapter 4

### scope-consent-refusal (ch4-scope-consent)
- Checked: consent types, refusal conditions against the notes; capacity framing.
- No lesson change. The intoxication point is worded by impairment and the question uses a plainly impaired
  patient. Logged in contested-1.json. "In a true emergency with nobody available, care is not delayed" is
  supported by the notes' takeaways (minors: "true emergencies").

### dnr-polst-ethics (ch4-dnr-ethics)
- Checked: POLST naming (National POLST: "portable medical orders", no longer expanded; states choose their own
  names).
- No lesson change; it already gives both names. Notes fix added. Two contested items (DNR with family demanding
  CPR; DNR definition). No question keys on a disputed point.

### negligence-confidentiality (ch4-negligence-confidentiality)
- Checked: HIPAA family disclosures (HHS FAQ 2087: allowed when the patient does not object); elements of
  negligence; abandonment; assault and battery; Good Samaritan scope.
- No lesson change. The lesson follows the section text, not the two faulty takeaways; two notes fixes added.

## Chapter 5

### medical-terminology (ch5-terminology)
- Checked: word parts, planes, directional terms, positions.
- Finding: recovery position "preferred for an unconscious patient without trauma" lacked the breathing
  condition. Fix: "an unresponsive patient without trauma who is breathing adequately". Notes fix added.
- Not changed, noted for the owner: the notes list "broncho, pulmo and pneumo (all of them lungs)" (broncho is
  the bronchus, the airway) and call the midaxillary line the landmark for needle decompression (not an EMT
  skill). The lesson repeats neither.

## Chapter 6

### body-systems-anatomy (ch6-anatomy)
- Checked: vertebrae counts, blood path, pulse sites, breathing mechanics.
- Fix: question 5 key shortened ("... its cord controls breathing") so it is no longer the longest option by far.
- The lesson already uses "pulmonary veins" and the two-site definition of respiration. Three notes fixes added.
  Acidosis wording and the mastectomy rule are in contested-1.json.

## Chapter 7

### pathophysiology-and-shock (ch7-pathophysiology)
- Checked: shock types and stages, minute volume, pediatric compensation, beta blockers.
- Fix: question 2 key shortened ("Low blood pressure and altered mental status") for option balance.
- No factual findings. The lesson avoids the disputed "hemoglobin carries less oxygen" line.

## Chapter 8

### life-span-development (ch8-lifespan)
- Checked: stages, fontanelles, reflexes, approach by age, puberty cut-off for CPR.
- Finding: the hook called 36 breaths a minute normal for a 9-month-old; the notes' own table gives 24 to 30 for 6
  to 12 months. Fix: 30 breaths a minute.
- Wording on adolescents, self-harm and older adults is respectful. Vital sign tables are in contested-1.json;
  no question tests an exact range.

## Totals

- Lessons reviewed: 16. Lesson edits: 22, in 10 files. Wrong keys: 0. Questions with a second defensible option
  fixed: 3 (history Q1, public health Q4, stress Q3).
- Notes fixes: 16 (notes-fixes-1.json), each `find` checked to occur exactly once in its section.
- Contested: 8 (contested-1.json).
