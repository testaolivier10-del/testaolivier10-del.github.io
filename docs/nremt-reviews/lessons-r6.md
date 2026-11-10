# Review 6: chapters 35 to 40 (14 lessons)

Reviewer 6, 2026-11-10. Lessons edited in place: 55 text edits in 11 files; 3 files needed no change. All 80 lessons
still load through `loadLessons` (scripts/lib/nremt-lessons.mjs, read only). No em dashes in any of the 14 files.
Answer positions are spread (and are re-dealt at build time anyway).

Outputs: `notes-fixes-6.json` (40 fixes, each `find` checked to occur exactly once in its section),
`contested-6.json` (14 items).

## Sources fetched this session

- 2025 AHA and AAP Part 5, Neonatal Resuscitation (cpr.heart.org): PPV 30 to 60 per minute; compressions when the
  heart rate stays under 60 despite 30 seconds of ventilation that inflates the lungs; 3:1; two thumbs encircling;
  deferred cord clamping at least 60 seconds; routine suctioning not recommended.
- 2025 AHA Part 10, Special Circumstances (cpr.heart.org) and the 2025 BLS in Pregnancy algorithm: continuous manual
  left lateral uterine displacement with compressions when the fundus is at or above the umbilicus, patient supine;
  hypothermia (pulse and breathing may be slow or hard to detect, no check duration given, full resuscitation with
  rewarming); drowning (CPR with breaths; in-water breaths depend on rescuer safety); LVAD (perfusion by skin color,
  temperature and capillary refill, hum over left chest and left upper abdomen, compressions if unresponsive with
  impaired perfusion); hyperthermia (active cooling at once, ice water immersion preferred).
- 2024 AHA and Red Cross first aid guidelines, highlights PDF: hypothermia rewarming, frostbite, jellyfish,
  snakebite, stinger removal. Red Cross heat stroke page for the cooling methods.
- START and JumpSTART as reproduced in Sacramento County EMS policy 7508.
- ESFI Downed Power Lines sheet.
- Sentara Nightingale and Maryland State Police Aviation landing zone guides.
- JEMS report of the 2022 joint statement on lights and siren.

Where a point rests on a standard text or on my own knowledge and was not fetched, it says "not fetched".

## Chapter 35

### cold-exposure (ch35-cold): 6 edits
- Rewarming rule checked against the 2024 first aid guidelines. Lesson already said field rewarming of the severe
  patient is per protocol and trunk only; kept. Contested.
- Pulse check time. FINDING: lesson said "30 to 60 seconds per local protocol" and question 5 was keyed on "check
  for longer". AHA 2025 sets no duration. FIX: step, question key, why and summary now say check carefully for as
  long as local protocol allows (texts say 30 to 60 seconds; AHA sets no fixed time); the key no longer turns on
  the length. Contested.
- Added: a layer between a heat source and the skin (2024 guidelines); warm water rewarming of frostbite at 99 to
  104 F per protocol when transport is long and refreezing is not a risk (2024 guidelines).
- Trunk not limbs, no rubbing, gentle handling, do not thaw if it could refreeze: confirmed (2024 guidelines).
- Head heat loss myth: lesson already avoids it; notes fix written.

### heat-and-water-emergencies (ch35-heat-water): 2 edits
- Heat stroke cooling checked against Red Cross and AHA 2025. Lesson already taught cooling at once with immersion
  where allowed. FIX: named ice or cold wet sheets and towels, and that cooling starts on scene and continues in
  transport.
- Drowning checked against AHA 2025. FIX: added that CPR for drowning includes breaths. In-water breathing limit
  (trained rescuer, safely) confirmed. Spinal precautions for trauma mechanisms only: textbook, not fetched.
- Scuba and altitude content matches the notes and standard texts (not fetched). Keys all sound.
- Notes fixes: cooling row, the 10 percent "dry drowning" line, in-water breathing.

### bites-and-stings (ch35-bites-stings): 14 edits
- FINDING (serious): the hook calls a belt above the bite harmful but the never list left out tourniquets. FIX:
  tourniquet or tight band added to the step, the ideas, the misconception and the summary (2024 guidelines:
  tourniquet, pressure bandage, suction and electric shock potentially harmful, ice of unproven benefit).
- FINDING: question 2 was keyed on limb height ("no higher than the heart"), which sources dispute. FIX: question
  rewritten so the key is immobilize and rest; the elevation distractor was replaced; limb height is "per local
  protocol, usual teaching not above the heart" everywhere. Contested.
- Jellyfish. FIX: tentacles lifted or pulled off without bare hands, seawater rinse, vinegar only per protocol,
  then nonscalding hot water (2024 guidelines). Contested (vinegar).
- Stings. FIX: "be ready to treat for shock even before signs appear" replaced by treating anaphylaxis per protocol
  (epinephrine auto-injector, oxygen, care for shock). Stinger out fast by any method: confirmed (2024 guidelines).
- Stingray hot water 30 to 90 minutes: textbook figure, not fetched; not keyed on the number.

## Chapter 36

### pregnancy-and-labor (ch36-pregnancy-labor): 6 edits
- FINDING: PPV rate 40 to 60 is the 2020 number. 2025 AHA and AAP says 30 to 60. FIX: step, question option, why
  and summary now say 30 to 60, with a note that many EMT texts still say 40 to 60. Contested for the owner.
- FIX: compressions start when the heart rate stays under 60 after 30 seconds of ventilation that moves the chest
  (was "still below 60" with no condition). 3:1 and two thumbs confirmed.
- Added: deferred cord clamping at least 60 seconds for a vigorous baby; APGAR at 1 and 5 minutes.
- Suction only if needed: agrees with 2025 (routine suctioning not recommended).
- Gap not added: third stage care (placenta, postpartum bleeding, fundal massage). In contested-6.json for the
  owner.
- All five keys checked; no second defensible option.

### obstetric-complications-and-gynecologic-emergencies (ch36-complications): 8 edits
- Left uterine displacement checked against AHA 2025. Lesson already taught manual displacement only. FIX:
  threshold is a uterus at or above the navel (about 20 weeks or more), displacement is continuous, patient stays
  flat and is not tilted. Standard hand position and AED use unchanged.
- FINDING: question 1 uses "push the cord back inside" as a wrong answer but the lesson never said so. FIX: step
  now says do not push the cord back; keep it covered, moist and warm (texts, not fetched).
- FINDING: breech step was only "transport, never pull". FIX: added support of the body and the two-finger V
  airway if the head does not deliver within about 3 minutes (Limmer, AAOS; not fetched).
- FIX: abruption bleeding can be hidden; preeclampsia signs now include face and hand swelling, severe headache
  and vision changes (ACOG; not fetched). Altered mental status removed from the notes by a notes fix.
- Sexual assault wording is respectful and matches the notes.

## Chapter 37

### special-challenges-approach (ch37-special-challenges): no change
- Checked against the notes and standard texts. Wording is respectful; "meltdown" is explained as involuntary.
  Keys sound.

### advanced-medical-devices (ch37-devices): 2 edits
- LVAD checked against AHA 2025. FIX: pump hum heard over the left chest and upper abdomen, skin temperature
  added, and chest compressions for an unresponsive VAD patient with poor perfusion, per protocol.
- Tracheostomy. FINDING: lesson named the problem (mucus) but gave no action. FIX: suction the tube as protocol
  allows. Contested (scope varies).
- DOPE and bagging off the ventilator first, AED pad offset from an implanted device, fistula arm, cloudy
  peritoneal fluid, VP shunt: consistent with standard texts (not fetched). Feeding tube dressing stays "a
  dressing" (contested).
- Gap not added: bring the VAD controller, batteries and caregiver; call the VAD coordinator.

### abuse-neglect-trafficking (ch37-abuse): 4 edits
- FINDING: question 3 was keyed on "keep your suspicion private and report to law enforcement", which is
  disputed for adult victims. FIX: step, key, why and summary now say do not confront the companion or voice
  suspicion at the scene and report as protocols direct. Contested.
- Wording about victims is respectful and non-blaming. Other keys sound.

## Chapter 38

### ambulance-readiness-and-response (ch38-ambulance-readiness): no change
- Matches the notes; operational content with no disputed numbers. Keys sound.

### operating-the-ambulance-and-air-rescue (ch38-operating): 2 edits
- Landing zone checked against two flight program guides. 100 by 100 feet is supported; slope under 8 degrees
  and the 200 foot no smoking figure are textbook numbers I could not confirm; distances vary by program. FIX:
  the "around the helicopter" bullet now teaches approach from the front, never the rear, downhill side on a
  slope (both guides), and gives the distances as the notes' figures. No question is keyed on a number. Contested.
- FINDING: "fewer than 5% of transports truly need lights and siren" stated as fact. The joint statement gives
  21.6% use and 42 seconds to 3.8 minutes saved, no 5%. FIX: bullet reworded around time saved and risk, with 5%
  as "the figure usually quoted". Contested.
- Due regard, vitals every 5 and 15 minutes, abandonment, staging: consistent with texts. Keys sound.

## Chapter 39

### mci-and-incident-command (ch39-mci-ics): 6 edits
- START checked against the published algorithm. FINDINGS: the lesson left out that a patient who starts
  breathing when the airway is opened is red; mental status was "not alert" instead of "cannot follow simple
  commands"; capillary refill was missing; JumpSTART was not mentioned. FIX: all four added (steps, summary, a new
  ideas bullet for JumpSTART: 5 rescue breaths for an apneic child with a pulse, under 15 or over 45 is red).
- Keys rechecked after the edits; all five still have one best answer.

### hazardous-materials (ch39-hazmat): 2 edits
- FIX: "placards are often wrong" softened to "can be wrong, missing or out of date" (no source for the notes'
  25 to 50 percent). Added "uphill and upwind" (ERG; not fetched). CHEMTREC number is correct.

## Chapter 40

### highway-operations-and-scene-hazards (ch40-highway): 3 edits
- Downed lines checked against ESFI. FINDING (serious, in the notes): "never let your feet come together" is the
  reverse of the guidance. The lesson had already dropped it. FIX: lesson now says small steps with feet close
  together and on the ground, adds the 35 foot energized ground warning, and no longer says "do not hop"
  (contested). Notes fix written.
- Night lighting, upstream blocking, airbags, vehicle fire, hybrid shutdown: consistent with texts (not fetched).

### vehicle-stabilization-and-extrication (ch40-extrication): no change
- Matches the notes and standard texts. Keys sound.

## Three most serious findings

1. Notes, ch40-highway: "never let your feet come together" when leaving energized ground is the opposite of
   utility guidance and could get someone killed. Lesson is right; notes fix written.
2. Newborn and START gaps against the current standards: PPV rate was the 2020 figure (now 30 to 60), and START
   omitted "breathing starts after the airway is opened = red". Both fixed in the lessons and the notes fixes.
3. Snakebite: tourniquets were missing from the never list and a question was keyed on the disputed limb height.
   Both fixed; jellyfish care brought in line with the 2024 guidelines.
