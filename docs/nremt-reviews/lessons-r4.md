# Review 4: chapters 24 to 28 (10 lessons)

Reviewer K = 4, 2026-11-10. Independent of the authors. Lessons read against their notes sections in
`nremt/assets/study-notes.json` and the authors' logged issues (notes-issues-D for 24 and 25, notes-issues-E for
26 to 28). 24 edits in 8 lesson files; 2 lessons needed none. After the edits `loadLessons` (called the way
`scripts/build-nremt-lessons.mjs` calls it, read only) loads all 80 lessons; no builder and no git were run.
14 notes fixes in `notes-fixes-4.json` (every `find` occurs exactly once in its section, checked by script; one of
the 14 is the suicide addition, which is a proposal gated on owner approval). 12 items in `contested-4.json`.

Sources fetched on 2026-11-10 (F = fetched and read, N = named standard, not fetched):

- F CDC, meningococcal disease in healthcare personnel (transmission, Droplet Precautions, prophylaxis exposures)
- F CDC, How Lyme Disease Spreads (more than 24 hours); CDC, Lyme signs and symptoms (rash 70 to 80 percent, 3 to 30 days)
- F CDC, Treating Flu with Antiviral Drugs (best within 1 to 2 days, later can still help)
- F HIV.gov, Post-Exposure Prophylaxis (as soon as possible, within 72 hours, 28 days). The CDC PEP page would not load.
- F CDC, Clinical Guidance for Carbon Monoxide Poisoning (100% oxygen, standard pulse oximeter not accurate)
- F STRAC Regional Carbon Monoxide Guidelines 2025 (immediate removal from the source, high-flow oxygen)
- F 2024 AHA and Red Cross first aid guidelines (chemical exposure: brush off dry chemical, irrigate at least 15 minutes, remove clothing; shock supine; recovery position for vomiting or decreased alertness)
- F CDC MMWR 2011, Chemical Suicides in Automobiles (term, responder actions)
- F NAEMSP position statement on restraint of agitated or combative patients (no prone, no hobble, de-escalation first, no handcuffs by EMS, officer present for patients in custody; no personnel number; term "delirium with agitated behavior")
- F ACEP Now, ACEP Rejects Excited Delirium (October 2023 withdrawal; "hyperactive delirium with severe agitation")
- F NIMH, 5 Action Steps; NIMH, Warning Signs of Suicide; CDC, suicide risk factors; Los Angeles County EMS Agency Ref. 1306; Recommendations for Reporting on Suicide
- F CDC, sickle cell disease data
- N Sepsis-3 (qSOFA) and the SIRS definition: the journal table was blocked by a captcha. The lesson's numbers (temperature above 38 C or below 36 C, heart rate above 90, breathing rate above 20, white cells above 12,000 or below 4,000; qSOFA altered mentation, breathing rate 22 or more, systolic 100 or less) match the published criteria as I know them, but I could not re-read them today.
- N National EMS Education Standards, NREMT skill sheets, Limmer and AAOS texts (reassessment intervals, restraint, abdominal patterns). EMS.gov was down for maintenance, so the National Model EMS Clinical Guidelines could not be read.

## Chapter 24

### communicable-diseases (ch24-communicable): 4 edits

- Checked: N-95 for suspected TB; latent TB; meningococcal picture and precautions; hepatitis A, B, C; HIV PEP timing; influenza; Lyme; all 6 answer keys.
- Finding: "Antiviral medicine helps only if started within 48 hours" is too absolute (CDC: works best early, later can still help). Fix: "works best when started within 48 hours". Notes fix written.
- Finding: Lyme "attached for many hours" was vague and the notes' 36 hours is the older figure. Fix: "more than 24 hours" in most cases (CDC). Notes fixes written for the hours and for the rash (the notes said most patients, within a week).
- Finding: meningitis prophylaxis named only mouth-to-mouth. CDC also lists airway care and suctioning without protection. Fix: "unprotected close contact with those secretions, such as mouth-to-mouth ventilation or suctioning without a mask ... so report the exposure". Two notes fixes written (table row said "Direct contact"; text said Standard Precautions generally protect you).
- Finding: "report it and start PEP" read as if the EMT starts the drugs. Fix: report right away to be evaluated for PEP; timing unchanged (as soon as possible, never later than 72 hours, 28 days; confirmed on HIV.gov).
- Keys: all 6 correct, one best answer each. No change.
- Left for the owner (contested): airborne versus droplet groups and N-95 for measles and chickenpox; who receives a TB exposure report.

### sepsis (ch24-sepsis): no edits

- Checked: definition, the two perfusion mechanisms, SIRS thresholds and the Fahrenheit conversions (36 C = 96.8 F, 38 C = 100.4 F), the screen add-ons (systolic below 90, new confusion) labeled as not SIRS, qSOFA numbers and purpose, oxygen to 94 percent, sepsis alert; all 6 keys and the arithmetic in questions 1 and 3.
- No finding. The lesson stays inside its notes. Criteria numbers not re-read today (see N above).

## Chapter 25

### alcohol-and-substance-abuse (ch25-substance-abuse): 1 edit

- Checked: mimics of intoxication, withdrawal and delirium tremens, opioid triad, breathing support before naloxone (agrees with the 2024 first aid guidance on opioid overdose), category signs, scene safety, all 6 keys.
- Finding (wording): summary said "Abused substances". Fix: "Commonly misused substances".
- The refusal wording is careful ("can take away ... assess their capacity ... local protocol and medical direction") and no question is keyed on it. The notes' flat rule is in contested.

### ingested-and-inhaled-poisons (ch25-ingested-inhaled): 4 edits

- Checked: routes, poison control number (1-800-222-1222), charcoal contraindications, acetaminophen timeline, carbon monoxide, smoke, decontamination, all 5 keys.
- Finding (serious, scene safety): the carbon monoxide step and the summary gave oxygen and never moved the family or the crew out of the building. Fix: "Get everyone out to fresh air, yourselves included ... Then give high-concentration oxygen whatever the pulse oximeter says"; summary matched. Notes fix written.
- Finding: "Brush off dry powder" stopped there. 2024 first aid guidelines: brush off, then irrigate. Fix: "Brush off dry powder before flushing." Notes fix written. Irrigation "at least 20 minutes" kept (the guideline floor is 15).
- Finding (wording): "detergent suicide" described how the gas is made. Fix: "chemical suicide (older texts say 'detergent suicide'), in which a toxic gas such as hydrogen sulfide fills a small closed space. Stay back, keep bystanders away and call the hazmat team." Notes fix written with the same wording.
- Not changed: "cherry-red skin ... is not typically seen" (the notes' "myth" is in contested).

## Chapter 26

### abdominal-pain-and-its-causes (ch26-abdominal): 3 edits

- Checked: visceral, parietal, referred and tearing pain; appendicitis, cholecystitis, pancreatitis, bleeding, aneurysm, hernia, renal colic, cardiac and ectopic rules; all 5 keys.
- Finding: a key idea said "the notes also link it to a perforating stomach ulcer", which is student-facing text citing the notes for a claim with no source. Fix: tearing pain points first to the aorta. Contested item kept for the notes' "only the aorta and stomach".
- Finding: "Pulses may differ between limbs" fits a thoracic dissection more than an abdominal aneurysm. Fix: "Pulses in the legs may be weak or unequal." Contested for the notes.
- Finding (wording): "the cause that can cause fatal bleeding fastest" in an explanation. Reworded.
- Keys: all correct. The tearing pain question keys the aorta, which is not disputed.

### abdominal-assessment-and-care (ch26-assessment): no edits

- Checked: shock signs before vital signs, questions for women of childbearing age, palpating the painful area last, older patients and beta blockers, nothing by mouth, oxygen target, all 5 keys.
- No finding in the lesson; the author had already avoided the notes' three weak points. Notes fixes written for two of them: shock is positioned supine and the recovery position is for vomiting or an airway at risk (2024 first aid guidelines), and vital signs every 5 minutes if unstable, every 15 if stable. The "9 times higher mortality" figure is in contested.

## Chapter 27

### assessing-behavioral-emergencies (ch27-behavioral-assessment): 1 edit

- Checked for respectful, current wording as well as accuracy: definition, culture and context, medical mimics, psychosis features, de-escalation, history, all 5 keys. Language is person-first ("people living with a mental illness") and the patient is treated as a patient throughout.
- Finding: "Do not argue with the beliefs or pretend to share them" is not in the notes and I could not confirm it in a fetched source. Fix: replaced with wording the notes support (calm, respectful, non-judgmental, acknowledge feelings). Contested item asks for a textbook reference so the line can be restored.
- Finding (gap, not fixed in the lesson by design): the chapter is titled "... and Suicide" and nothing in the notes or the lesson covers it. A carefully worded notes addition is proposed in notes-fixes-4.json and logged in contested-4.json for the owner. The lesson was not extended.
- Not changed: the notes tie psychosis to schizophrenia; the lesson names no diagnosis (contested).

### aggressive-patients-and-restraint (ch27-restraint): 6 edits

- Checked: safety rules, who may restrain, reasonable force, medical necessity, restraint steps, position, monitoring, sudden calm, police restraints, all 5 keys. NAEMSP confirms no prone and no hobble restraint, de-escalation before restraint, reassessment, and an officer with a patient in custody.
- Finding (serious, review rule): question 4 was keyed on "minimum of 4 rescuers", a disputed number (texts and protocols say 4 or 5; NAEMSP gives none), and its stem said "the notes call for". Fix: replaced with a scene safety question (stay together with a clear path to the door). The step now says "at least 4 rescuers ... (the exact number is set by local protocol)".
- Finding: the step said `the notes' "excited delirium"`. Fix: "hyperactive delirium with severe agitation (older texts call it 'excited delirium', a term medical groups no longer use)", and the two places that said "severe agitated delirium" now use the same term. Notes fix written for the body text; the topic heading, section title, chapter intro and takeaway still say "excited delirium" and need a hand edit.
- Finding: nothing said restraint is a last resort. Fix: added to the step and the summary (NAEMSP). Notes fix written.
- Face-up only versus side-lying where protocol allows is in contested; the position question does not turn on it.

## Chapter 28

### blood-disorders-and-sickle-cell (ch28-hematologic): 4 edits

- Checked: clotting, drug classes, head injury on a blood thinner (in line with the 2021 field triage guideline's anticoagulant criterion), acute and chronic anemia, sickle cell complications, trait versus disease, all 4 keys. The pain of a sickle cell crisis is treated as real, which is the respectful and correct framing.
- Finding: question 2 turned on word order ("in that order", with "Plavix and Xarelto" as a reversed pair), a trick with no clinical value. Fix: the stem asks for the pair with one drug from each class and the reversed pair became "Xarelto and Lovenox"; explanation updated.
- Finding (wording): an explanation said "the mistake the notes warn against". Fix: "the mistake to avoid".
- Notes fix written for sickle cell ancestry (CDC); the lesson gives none.

### renal-system-and-dialysis (ch28-renal): 1 edit

- Checked: infections, stones, renal failure, both kinds of dialysis, no blood pressure on a fistula arm, fistula bleeding (direct pressure, tourniquet only if life-threatening, consistent with chapter 29), missed dialysis, peritonitis, transplant, all 5 keys.
- Finding: "the arrest may not respond to standard defibrillation" could read as doubt about normal arrest care. Fix: "Start CPR and use the AED exactly as you would for any arrest ... high potassium can make the arrest harder to reverse and needs treatment they can give." Contested for the notes sentence.

## Across the ten lessons

- No answer key was wrong. Right answers are spread across the four positions in every lesson.
- No em dashes in any of the ten files. None of the ten now cites "the notes" in student-facing text.
- Not verified from a fetched source today and left as the notes have them: activated charcoal contraindications, the acetaminophen 8 to 10 hour window, latent TB 90 percent, the TB baseline and repeat test, delirium tremens, dialysis schedule, fistula thrill.
