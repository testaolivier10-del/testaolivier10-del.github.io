# Review 5: chapters 30 to 34 (9 lessons)

Reviewer K = 5, 2026-11-10. Chapter 29 skipped (pilot). 19 text fixes in 5 lesson files; 4 lessons unchanged.
All 80 lessons still load through `loadLessons` (read only). No em dashes in any of the 9 files.

## Sources and how far each was checked

Fetched and read:
- ACS field triage page (facs.org/quality-programs/trauma/systems/field-triage-guidelines) and the ACS handout PDF
  (ww2.facs.org/media/2zdltley/field-triage-handout-vfinal-revise.pdf). 2021 is still the current version.
- 2018 ACS-COT, ACEP, NAEMSP joint position statement on spinal motion restriction (naemsp.org/?p=6929).
- 2024 AHA and Red Cross first aid guidelines, "Top things to know" page (open chest wounds).
- American Red Cross Scientific Advisory Council, Burn Cooling advisory (2019).

Not fetched, cited by name from memory (treat as pointers): AAOS Emergency Care and Transportation, Limmer
Emergency Care, ATLS 10th ed., ABA burn referral guidelines 2022, TCCC guidelines. The full text of the 2024 first
aid guideline burn section was not opened; the 10 minute figure is confirmed by the Red Cross advisory.
One fetch (the facs.org algorithm PDF) was blocked pending approval; the ACS handout PDF gave the same content.

## Ch 34: multisystem-trauma-and-field-triage
Checked every red and yellow criterion against the ACS handout.
- Red injury patterns (9 items), red mental status and vital signs (motor GCS under 6; RR under 10 or over 29;
  distress or need for support; room air SpO2 under 90%; SBP under 70 + 2 x age at 0 to 9; under 90 or HR over SBP
  at 10 to 64; under 110 or HR over SBP at 65 and over), yellow mechanism, yellow EMS judgment, both destination
  rules: all match. No wrong number.
- Fix: yellow list now says "partial or complete ejection" and "intrusion, including the roof", as the guideline does.
- Fix: Q4 (HR greater than SBP) said "stabbing victim" while the explanation called it a torso stab wound. Stem now
  says "stabbed in the abdomen".
- Keys checked: 72 year old with SBP 104 is red; ejection with normal findings is yellow (trauma center, need not be
  highest level); airway before fractures; tamponade versus tension pneumothorax by breath sounds. All single best.
- Contested (owner): ACS says the criteria may not be redistributed or used in AI tools without permission.

## Ch 30: burns
- Cooling: lesson said only "cool water per local protocol". Now: cool running water per local protocol (first aid
  guidance at least 10 minutes), limit cooling of large burns, keep warm, never ice. Summary matched. Contested.
- Fix: Q5 explanation said "any burn of the hands" meets burn center criteria; now "a partial-thickness burn of a hand".
- Checked and left: Rule of Nines adult and child (sums to 100), depth signs, chemical burn order (brush, then flush
  20 minutes, no neutralizing), electrical burn care, burn center list plus chemical burns (ABA).

## Ch 30: closed-and-open-wounds
- Impaled object exceptions: present; reworded to the two standard ones (cheek blocking the airway; object in the
  chest that makes CPR impossible) and mentioned in the Q1 explanation.
- Amputated part: removed the phrase "per the notes"; now "dry or moistened with saline, per local protocol", sealed
  bag kept cool (on ice or in cold water), part never directly on ice or in water. Key not on dry versus moist.
- Checked and left: bleeding control before cleaning, no elevation, tourniquet trigger (matches chapter 29 pilot),
  blast mechanisms, high-pressure injection care.

## Ch 31: chest-trauma
- Open chest wound: lesson taught fully occlusive only and used "cover loosely with dry gauze" as a wrong option.
  The 2024 first aid guideline accepts leaving the wound open, a non-occlusive dry dressing, or a vented chest seal,
  so that distractor was defensible. Step now says occlusive dressing or vented chest seal, taping set by local
  protocol; key is "gloved hand, then a chest seal or occlusive dressing"; the gauze option is replaced by "leave the
  wound alone until ALS arrives". Contested.
- Flail chest: kept 2 or more ribs in 2 or more places, added "(some texts say 3 or more)"; care now says assist
  ventilation with a bag-valve mask if breathing is inadequate. Not keyed on the number. Contested.
- Beck's triad: lesson gave neck veins, muffled heart sounds, narrowing pulse pressure (AAOS wording). The classic
  triad is hypotension, distended neck veins, muffled heart sounds. Step, question and explanation now say "low
  blood pressure with a narrowing pulse pressure"; stem adds equal breath sounds. Contested.
- Spinal motion restriction: "penetrating trauma alone does not call for it" agrees with the 2018 statement (no role
  in penetrating trauma). Left.
- Checked and left: tracheal deviation late, commotio cordis, oxygen to 94%, traumatic asphyxia, aortic injury.

## Ch 31: abdominal-trauma
- No change. Checked evisceration care (moist sterile dressing, occlusive layer "many protocols", no foil), position,
  liver and spleen quadrants, lower rib gunshot rule, impaled object. Occlusive layer is in contested.

## Ch 32: fractures-splinting-and-traction
- No change. Checked blood loss figures, traction splint indication and contraindications, CSM before and after,
  pelvic binder at the greater trochanters, six Ps, compartment syndrome, knee dislocation. Repositioning a
  pulseless limb is worded "per local protocol" and not keyed. Contested.

## Ch 33: neck-wounds-and-spinal-assessment
- Spinal motion restriction wording: the backboard step read as the default method. Now says a long backboard is one
  tool (scoop stretcher, vacuum mattress or stretcher with a collar also acceptable, per local protocol), matching
  the 2018 statement. Strap order kept.
- Padding age: "about 6 or younger; the age varies by text" (the statement gives no age). Contested.
- Checked and left: five NEXUS criteria (the statement's indications agree), neck wound occlusive dressing, carotid
  caution, helmet and shoulder pad rules, left tilt in late pregnancy.

## Ch 33: spinal-cord-injury-and-neurogenic-shock
- No change. C3 to C5, diaphragmatic breathing, priapism, neurogenic versus hemorrhagic shock, heat loss, spinal
  shock distinction all standard. Four questions, keys sound.

## Ch 33: traumatic-brain-injury
- No change. Secondary injury, Cushing's triad, no routine hyperventilation, basilar skull fracture care, no NPA,
  hypotension in adult head injury means bleeding elsewhere. Keys sound.

## Notes fixes
26 entries in notes-fixes-5.json, each `find` verified to occur exactly once in its section. Chapter takeaways sit
on the last section of each chapter (ch30-burns, ch31-abdomen), so impaled object, amputated part and Beck's triad
takeaway fixes are filed under those ids.

## Not changed, worth knowing
- Notes for ch34 need no change.
- The TBI lesson says "normal rate" without a number; the notes give none either.
