# Review tracker

Every item raised across four outside reviews, with its real status verified
against this repo rather than against what a review claimed.

Status: **done** · **open** · **not a defect** (verified, no change needed) ·
**needs a person** (cannot be settled from here)

Verified against `main` at the time of writing. Items move to **done** only
when the change is in the repo and the checks pass.

---

## Pending clinical review

Everything in this section is a clinical statement this repo now makes that a
credentialed reviewer should check. Nothing here is a guess — each follows the
national guidance named beside it — but none of it has been read by a
clinician, and that is the gap no amount of tooling closes.

| Change | Source followed | Where | Landed |
|---|---|---|---|
| Hypothermic arrest: standard defibrillation algorithm alongside active rewarming, replacing "shock once, wait until 30°C/86°F" | 2025 AHA | question 785 | Phase 1 |
| Field triage: red/yellow criteria replacing the four numbered steps; mechanism is a yellow consideration, not red | 2021 National Field Triage Guideline (ACS COT / NAEMSP) | questions 672, 843, 966 | Phase 1 |
| SN2 worked example moved to a secondary substrate; (R)→(S) inversion asserted for both cyanide and azide | Standard organic chemistry; priorities Br > ethyl > methyl > H, and both nucleophiles enter as priority 1 | `ochem/mechanisms/sn2.html` | Phase 1 |
| Sources now names 2025 AHA, NRP, Stop the Bleed and the 2021 Field Triage Guideline as the editions written against | — | `sources.html` | Phase 1 |
| Post-ROSC oxygen titrated to **92–98%**, stated as a window with hyperoxia named as a harm, replacing "95% or greater" | 2025 AHA | Ch 21, `study-notes.html` | Phase 2 |
| "The most reliable sign of ROSC is the return of breathing" removed; no single reliable sign, with capnography named as the earliest objective clue | 2025 AHA | Ch 21 | Phase 2 |
| Hypothermic arrest: defibrillate by the standard algorithm while rewarming; "one shock then wait for 86°F/30°C" removed | 2025 AHA | Ch 21 | Phase 2 |
| Pediatric AED: use as soon as available at any age; the "2 minutes of CPR first" rule restricted to a lone rescuer at an unwitnessed child/infant arrest | 2025 AHA | Ch 21 | Phase 2 |
| CPR numbers added where the chapter had none: 100–120/min all ages; depth 2–2.4 in adult, ~2 in child, ~1.5 in infant; 30:2, and 15:2 two-rescuer child/infant; full recoil; ~10/min with an advanced airway | 2025 AHA | Ch 21 | Phase 2 |
| NEXUS listed as **five** criteria, with intoxication and alertness separated rather than merged into "reliability" | NEXUS low-risk criteria | Ch 33 | Phase 2 |
| SUID redefined as the umbrella term including accidental suffocation/strangulation in bed, with SIDS as the narrower diagnosis of exclusion | CDC SUID/SIDS classification | Ch 21 | Phase 2 |
| Hypoglycemia threshold set at **70 mg/dL** with an explicit note that protocols vary and some use 60 | ADA Level 1 hypoglycemia | Ch 22 | Phase 2 |
| Sildenafil-type drugs (ED **and** pulmonary hypertension) asked before nitroglycerin, for patients of any sex | Standard EMT pharmacology | chest pain scenario | Phase 2 |
| Long-acting sulfonylurea named as the reason a hypoglycemia refusal is dangerous — it outlasts oral glucose | Standard EMT pharmacology | diabetic scenario | Phase 2 |
| Primary assessment: AVPU added, and catastrophic external bleeding placed before the airway for trauma (X-ABC) | Current prehospital trauma practice | `flowcharts.html` | Phase 3 |
| Anaphylaxis criteria: more than one body system, or hypotension after a known allergen; skin findings alone are an allergic reaction, not anaphylaxis | Standard anaphylaxis diagnostic criteria | `flowcharts.html` | Phase 3 |
| Anaphylaxis: epinephrine, then call ALS and start moving before reassessing; biphasic reaction named as the reason everyone transports | 2025 AHA | `flowcharts.html` | Phase 3 |
| START: "Expectant" removed (it is a SALT category), respiratory criterion stated as over 30, and "breathing only after repositioning → Immediate" added | START | `flowcharts.html`, `mnemonics.html` | Phase 3 |
| SALT triage added, including the Expectant category and its meaning as resource-dependent and revisitable | SALT | `flowcharts.html` | Phase 3 |
| Stroke: high-glucose branch added, and a swallow/airway check before any oral glucose | Standard EMT practice | `flowcharts.html` | Phase 3 |
| CPR diagram: depth given as 2–2.4 in; "AED re-analysis prompts" removed as a stopping point | 2025 AHA | `flowcharts.html` | Phase 3 |
| Infant choking: back blows and chest thrusts only, no abdominal thrusts under 1 year, with the liver named as the reason | 2025 AHA | `flowcharts.html` | Phase 3 |
| Oxygen flow rates stated: cannula 1–6 L/min, non-rebreather 12–15 L/min, BVM with reservoir at 15 L/min | Standard EMT practice | `skillsheets.html` | Phase 3 |
| Airway sounds: snoring means open the airway, gurgling means suction (≤15 s); silent chest named as a pre-arrest finding | Standard EMT practice | `sound-trainer.html` | Phase 3 |
| BE-FAST, APGAR (with acrocyanosis scoring 1), PAT and SLUDGEM cards added | Standard EMT practice | `mnemonics.html` | Phase 3 |
| EMT formulary: indications, contraindications, doses and routes for oxygen, aspirin, oral glucose, epinephrine, naloxone, albuterol and nitroglycerin | National EMS Education Standards; doses are the usual figures taught nationally | `nremt/formulary.html` | Phase 4 |
| 22 new pharmacology questions added to the bank (topic "Pharmacology") | as above | `questions.json` | Phase 4 |
| Pediatric vital-sign ranges by age, and the 70 + (2 × age) hypotension formula | Standard EMT practice; ranges vary between texts and the page says so | `nremt/reference-cards.html` | Phase 4 |
| GCS component table; APGAR scoring grid with acrocyanosis scoring 1; PAT with what each side suggests | Standard EMT practice | `nremt/reference-cards.html` | Phase 4 |
| Airway chapter written from one section to four: manual maneuvers (head-tilt/chin-lift vs jaw-thrust, and airway outranking spinal precautions), OPA/NPA sizing and insertion, suction, airway sounds, BVM technique | National EMS Education Standards; 2025 AHA for ventilation rates | Ch 9, `study-notes.html` | Phase 4 |
| Assisted ventilation rate with a pulse stated as **1 breath every 6 seconds (10/min)** for an adult and 1 every 2–3 seconds (20–30/min) for an infant or child, with a note that older texts teach 10–12/min for adults | 2025 AHA | Ch 9 | Phase 4 |
| NPA contraindicated with signs of basilar skull fracture or major mid-face trauma | Standard EMT teaching | Ch 9 | Phase 4 |
| Oxygen targets stated: about **94% or above** generally, about **88–92%** in known COPD, with titration never meaning withholding | Current practice; local protocol named as governing | Ch 10 | Phase 4 |
| Oxygen cylinder: full ≈ 2,000 psi, safe residual ≈ 200 psi | Standard EMT practice | Ch 10 | Phase 4 |
| Vital signs: adult normal ranges, pulse/respiration technique, PEARRL, capillary refill 2 s, BP cuff-size and arm-position errors, reassessment at 5 min unstable / 15 min stable | Standard EMT practice | Ch 13 | Phase 4 |
| Capnography added with a normal of **35–45 mmHg**, and the point that it measures ventilation where oximetry does not | Standard EMT practice | Ch 13 | Phase 4 |
| Tourniquet procedure: 2–3 in proximal, never over a joint, high-and-tight for amputation or unclear source, tighten until bleeding stops **and** the distal pulse is gone, time written on it, left visible, not loosened in the field, second tourniquet proximal if needed | ACS Stop the Bleed | Ch 29 | Phase 4 |
| Wound packing: pack into the wound to the bleeding source then hold pressure ≥ 3 minutes; never pack the chest or abdomen | ACS Stop the Bleed | Ch 29 | Phase 4 |
| Blood volume figures: adult ≈ 5 L; serious sudden loss ≈ 1 L adult, 500 mL child, 100–200 mL infant | Standard EMT texts | Ch 29 | Phase 4 |
| Compensated vs decompensated shock, with narrowing pulse pressure as an early sign and hypotension named as a late one; beta blockers and children named as the two things that hide it | Standard EMT practice | Ch 29 | Phase 4 |
| TBI: primary vs secondary injury, hypoxia and hypotension as the two biggest worsening factors, Cushing's triad as the inverse of shock, no routine hyperventilation, CSF drainage not packed | Standard EMT practice | Ch 33 | Phase 4 |
| Neurogenic shock distinguished from hemorrhagic by heart rate and skin; C3–C5 and the diaphragm; spinal shock kept separate from neurogenic shock | Standard EMT practice | Ch 33 | Phase 4 |
| **Correction:** adult suction attempt was stated as 10 s in the new Ch 9 draft and 15 s on `sound-trainer.html` and in four keyed questions. Reconciled to **15 s adult / ~10 s or less child and infant**, matching the bank | AAOS figures; the bank's keyed answers | Ch 9, `sound-trainer.html` | Phase 4 |
| **Correction:** non-rebreather flow was 12–15 L/min on `skillsheets.html` and `formulary.html` and 10–15 L/min in the new Ch 10. Reconciled to **10–15 L/min** everywhere, consistent with the reservoir-collapse rule the same pages already gave | AAOS figures | Ch 10, `skillsheets.html`, `formulary.html` | Phase 4 |
| **Correction:** Ch 33's takeaway listed NEXUS as four criteria while the body text warned against exactly that merge. Takeaway rewritten to five | NEXUS | Ch 33 | Phase 4 |
| Ten new branching scenarios: six pediatric (febrile seizure, croup vs epiglottitis, asthma with a silent chest, infant sepsis, suspected abuse, drowning arrest) and four obstetric (imminent delivery, third-trimester bleeding, eclampsia, neonatal resuscitation) | National EMS Education Standards; 2025 AHA and NRP for the arrest and newborn cases; ACOG-consistent obstetric practice | `scenario-sim.html` | Phase 4 |
| Drowning arrest taught as hypoxic: CPR includes ventilations rather than compression-only, no abdominal thrusts to clear water, no routine spinal precautions without a mechanism, dry the chest before AED pads, hypothermia is a reason to continue | 2025 AHA | s14 | Phase 4 |
| Newborn resuscitation: warm/dry/position/stimulate, PPV at 40–60/min for apnea or HR < 100, compressions at **3:1** only for HR < 60 after 30 s of effective ventilation | NRP | s18 | Phase 4 |
| Field delivery: no routine suctioning of a vigorous newborn, loose nuchal cord slipped over the head rather than clamped, acrocyanosis read as normal | NRP | s15 | Phase 4 |
| Third-trimester bleeding: no vaginal exam, left lateral position, and concealed abruption taught as vital signs disagreeing with visible blood | Standard obstetric emergency practice | s16 | Phase 4 |
| Eclampsia: left lateral, minimize stimulation, obstetric-capable destination, and the risk continuing postpartum | Standard obstetric emergency practice | s17 | Phase 4 |
| Suspected child abuse: treat and transport, document observations and verbatim quotes rather than conclusions, report as a mandatory reporter, do not confront on scene | Mandatory-reporter practice; state law varies and the scenario says so | s13 | Phase 4 |
| Seven further scenarios: four behavioral (agitation with a medical cause, suicidal refusal and capacity, extreme agitation with hyperthermia, diagnostic overshadowing) plus heat stroke, a geriatric fall with syncope, and a household carbon monoxide exposure | National EMS Education Standards | `scenario-sim.html` | Phase 4 |
| Agitation taught as a symptom rather than a diagnosis, with hypoglycemia, hypoxia, head injury and sepsis named as causes and a glucose check as the first move | Standard EMT practice | s19, s22 | Phase 4 |
| Capacity to refuse distinguished from being alert and oriented; active suicidal ideation named as a reason a patient may lack it; restraint framed as for present danger only, never routine for a psychiatric diagnosis | Standard EMS medical-legal practice; state law and protocol vary | s20 | Phase 4 |
| Extreme agitation with hyperthermia: prolonged prone restraint named as dangerous, active cooling started during the struggle, and the sudden calm after exertion taught as the moment of arrest | Current prehospital practice on agitation-related death | s21 | Phase 4 |
| Heat stroke distinguished from heat exhaustion by **altered mental status**, with a note that a heat-stroke patient may still be sweating; cooling continued through shivering | Standard EMT practice | s23 | Phase 4 |
| Carbon monoxide: pulse oximetry named as unable to distinguish carboxyhemoglobin, so a normal reading is meaningless; evacuate including the crew; high-flow oxygen; transport all exposed | Standard EMT practice | s25 | Phase 4 |
| Choking, adults and children: cycles of 5 back blows then 5 abdominal thrusts, replacing abdominal thrusts alone; 5 chest thrusts substituted when the rescuer cannot encircle the abdomen | 2025 AHA, Part 7 Adult BLS (CIR.0000000000001369) and Part 6 Pediatric BLS (CIR.0000000000001370); adult FBAO algorithm | `nremt/flowcharts.html`, notes ch9 §Choking, scenario s3, questions 20, 21, 466, 758, 873, 1087, 1153 | Phase 8 |
| Choking, infants: 5 back blows then 5 chest thrusts delivered with the **heel of one hand**, replacing the two-finger technique; abdominal thrusts still not used under 1 year | 2025 AHA, Part 6 Pediatric BLS | `nremt/flowcharts.html`, notes ch9 §Choking, questions 129, 467, 1774 | Phase 8 |
| Infant chest compressions: two thumbs encircling, or the heel of one hand when the rescuer cannot encircle the chest. The two-finger technique is eliminated | 2025 AHA, Part 6 Pediatric BLS | notes ch21 compression table, question 1757 | Phase 8 |
| Chain of survival: a single six-link chain for all cardiac arrest, adult and pediatric, in- and out-of-hospital — Recognition and Emergency Activation, High-Quality CPR, Defibrillation, Advanced Resuscitation, Post–Cardiac Arrest Care, Recovery and Survivorship. Newborns keep a separate Newborn Chain of Care | 2025 AHA, Part 4 Systems of Care (CIR.0000000000001378) and the AHA Chain of Survival infographic | notes ch21 §Chain of survival | Phase 8 |
| New notes section: Choking — Foreign Body Airway Obstruction (mild vs. severe, the sequence by age, what changed in 2025, the transition to CPR, aftercare, and what thrusts do not fix) | 2025 AHA, Parts 6 and 7 | notes ch9 §`ch9-fbao` | Phase 8 |
| Oxygen-induced hypercapnia in COPD explained by V/Q mismatch (oxygen relieving hypoxic pulmonary vasoconstriction, raising dead space) and the Haldane effect, with reduced minute ventilation named as the smallest contributor — replacing the hypoxic-drive account. "Do not withhold oxygen from a hypoxic patient" kept, with titration to roughly 88-92% for a known retainer | Current respiratory physiology; the hypoxic-drive account is not what the evidence supports | question 974 | Phase 8 |
| Nitroglycerin heart-rate contraindication kept at under 50 or over 100, now attributed and qualified: many EMS protocols carry no heart-rate criterion at all | ACC/AHA ACS guidance ("marked bradycardia, heart rate less than 50 beats per minute, or tachycardia, greater than 100"); state protocols reviewed showed the criterion is often absent | `nremt/formulary.html` | Phase 8 |
| Glasgow Coma Scale illustration corrected: "E3 V4 M6 and E1 V1 M11" replaced with E4 V4 M5 and E4 V3 M6, both totalling 13, contrasting localising with obeying commands | The scale itself — the motor component stops at 6 | `nremt/reference-cards.html` | Phase 8 |

---

## Needs a person (cannot be resolved from here)

| Item | Why |
|---|---|
| Named clinical reviewer | The single highest-value item. Four reviews have now bottlenecked on it. |
| About section with a real name | Best done once a reviewer is named, so the two land together. Placeholder kept here deliberately. |
| Sound trainer: Hawaii COPD Coalition clips | Re-hosting permission is a question for the rights holder, not a code change. |
| Whether the state tests supine/seated spinal immobilization stations | Varies by state; needs the local office of EMS. |
| Three openly licensed recordings: snoring, gurgling, diminished/absent breath sounds | Entries and teaching are on the page; only the audio is missing. Must be openly licensed — not synthesised. |
| Whether the rhonchi and normal breath clips may be re-hosted | They are embedded as base64, not linked. Licence unestablished. |
| Whether drag-to-order items appear on the **EMT** cognitive exam | The 2024 technology-enhanced item changes are documented for AEMT and Paramedic. Could not confirm for EMT from here, so the claim is softened rather than asserted. |

---

## Phase 1 — Quick fixes — **complete**

| Item | Status |
|---|---|
| Body map iliac-crest entry reworded so it cannot read as binder placement | done |
| LICENSE file (CC BY-NC 4.0 content, MIT code, third-party noted) | done |
| SN2 page: (R)-2-bromobutane + cyanide/azide in DMSO, lone pairs, δ+/δ−, wedge/dash | done |
| Rename "Adaptive practice" → "Weak-spot practice" | done |
| Timed exam: exam-realistic mode (no Flag, no Previous), on by default | done |
| Dashboard: map 6 site domains to the Registry's 5 score-report areas | done |
| Sources: cite guideline editions explicitly | done |
| Field triage items 672, 843, 966 to the 2021 two-tier structure | done |
| Ochem scope wording — it is a two-semester sequence, not Organic Chemistry I | done |
| Hedged question 785 | done |
| Drag-to-order claim softened (could not confirm for the EMT exam) | done |
| Remove the "locked door with a doorbell" line on Privacy | done |

## Phase 2 — Clinical corrections — **complete**

| Item | Status |
|---|---|
| Post-ROSC oxygen target 92–98% | done |
| Hypothermic arrest: standard defibrillation while rewarming | done |
| NEXUS: all five criteria | done |
| SUID: contradictory sentence | done |
| Hypoglycemia: one cutoff (70 mg/dL), note that protocols vary | done |
| Ch 21: CPR rate, depth, ratio, recoil, peds and infant numbers | done |
| Ch 21: "most reliable ROSC sign" wording | done |
| Pediatric AED statement | done |
| Anaphylaxis scenario: medical control must not be penalised | done |
| Chest pain scenario: sildenafil-type drugs before nitro; 12-lead "if in scope" | done |
| Diabetic scenario: which medication (long-acting sulfonylurea) | done |

## Phase 3 — Flow diagrams and reference content — **complete**

| Item | Status |
|---|---|
| Branch arrows must not imply a wrong path (anaphylaxis, choking) | done |
| Branches readable on mobile | done |
| Primary assessment: AVPU; massive hemorrhage first in trauma | done |
| START: remove "Expectant", correct respiratory criteria, add reposition branch | done |
| Stroke: high-glucose branch, swallow check | done |
| CPR: remove "AED re-analysis prompts" endpoint; depth 2–2.4 in | done |
| Shock: branches must differ or merge | done |
| Anaphylaxis: hives alone must not qualify; transport earlier | done |
| Infant choking diagram | done |
| Mnemonics: BE-FAST, APGAR, PAT, SLUDGEM; fix RPM "expectant" | done |
| Skill sheets: spinal immobilisation stations; non-rebreather flow rate | done |
| Sound trainer: snoring, gurgling, diminished — **entries added, audio not** (see below) | partial |
| Sound trainer: heart sounds labelled beyond EMT scope | done |
| SALT triage alongside START and JumpSTART | done |

**Sound trainer, honestly:** the three airway entries are on the page with their
full clinical teaching, marked "clip coming soon". No audio was added, because
no openly licensed recording of them was available to me and a synthesised
substitute would be worse than silence — the file's own comment says lung sounds
must not be synthesised, and airway sounds are the same kind of texture.

Sourcing three openly licensed clips is now in **Needs a person**.

While there, a licensing problem was made explicit rather than left implied: the
rhonchi and normal breath clips are **embedded in the page as base64**, not
linked as the credit line implied. The page now says so, says the licence has
not been established, and gives a route to have them removed.

## Phase 4 — New EMT content — **done, except figures**

| Item | Status |
|---|---|
| Pharmacology module (EMT formulary) | done |
| Reference cards: peds vitals, GCS, APGAR, PAT | done |
| Expand Airway, Ventilation & Oxygen, Vital Signs, Bleeding Control, Head/Neck/Spine | done |
| Figures in the notes (currently zero across 40 chapters) | **blocked — see below** |
| More branching scenarios toward 25 | done — 25 |

The five chapters were the five smallest in the book — 2,461 to 4,744
characters against a median of 8,900 — and are now 10,674 to 21,009. Airway
went from one section to four and covers everything the work order named.

**Why figures are blocked, not skipped.** The figure system this site already
has (`.notes-figure`, inline SVG with `role="img"`, `<figcaption>`) lives in
`ochem/assets/ochem.css` and is used well across the ochem notes. Porting it to
the NREMT notes is easy. The problem is where the figures would go:
`study-notes.html` carries all forty chapters inline and is now 159.6 KB
gzipped against a budget just raised to 172. Every reader downloads the whole
book to read one chapter, and every figure makes that worse for all of them.

The right order is to move `CHAPTERS` into a fetched JSON file first — the page
already refuses to render without JavaScript, so nothing regresses — and then
add figures against a per-chapter payload. Doing it the other way round means
paying the weight twice. This is a real piece of work, not a large one, and it
is not in the work order, so it is flagged here for a decision rather than
done quietly.

Schematic figures are what is on offer either way: OPA/NPA sizing landmarks,
tourniquet placement, the E-C clamp. Anatomical illustration is not something
that should be faked in SVG, and it stays in **Needs a person**.

## Phase 5 — Ochem

| Item | Status |
|---|---|
| Lessons, textbook and mechanisms readable without JavaScript | done |
| Aldol "two carbons apart" wording | done |
| "Leads to" chip overflow; floating buttons covering content | **not a defect** — see below |
| Missing mechanisms (check Grignard in carbonyl addition first) | **mostly not missing** — see below. Radical halogenation was, and is now written |
| Synthesis / reagent-roadmap tool and flashcard deck | open |
| Figures in the reaction-heavy sections | in progress — 6 added, and there is now a generator |
| Skeletal structures after the foundations module | done — and it was the largest hole in the book |
| Cut repeated caption/callout/body explanations | done — 2 real repeats, and the finding was much smaller than it looked |

**The no-JavaScript problem was bigger than the item as written.** The ochem
course's entire written half — 62 sections, about 1.2 MB of prose — lived as
bare HTML fragments with no title, stylesheet or navigation. `learn.html`
fetched and injected them, and that shell is 142 characters of static HTML, so
with JavaScript off the textbook was empty and a lesson page rendered a
heading and nothing else.

Three separate places encoded the decision to keep it that way —
`robots.txt` disallowed the fragments, `build-sitemap.mjs` skipped them and
`build-og-tags.mjs` skipped them — and all three gave the same reason:
indexed alone they would be "a wall of unstyled text with no way out". That
reason was correct, and it described a **fixable property of the files**
rather than an argument against the pages existing.

So each fragment is now a page: title, description, canonical, the site's
stylesheets, breadcrumbs, a link to its interactive lesson, and previous/next
through the book. The prose sits between two markers and is never touched by
the generator, so a section is still edited by editing its own file, and
`textbook.js` slices between the same markers — one copy of the words,
serving both the embedded textbook and the standalone page. `learn.html` also
carries a real table of contents now instead of one sentence apologising for
needing JavaScript.

Static text without JavaScript, before → after: the textbook 142 → 1,563
chars; a section 0 → 7,304; a lesson page 212 → 393 with a link that reaches
the prose.

**Verified as not a defect:** the "Leads to" chip row already has
`flex-wrap: wrap` and a `max-width: 560px` rule that gives the label its own
line, and its CSS comment already documents the no-JavaScript case. The
floating periodic-table button and the mascot are deliberately stacked with a
documented 12px gap. Neither reproduces.

**Verified as already done:** Grignard addition is covered in
`mechanisms/carbonyl-addition.html`, which contrasts it with hydride reduction
and works through why one gives a primary alcohol and the other a secondary.
The remaining gaps are real: hydroboration–oxidation, radical halogenation,
and acetal/imine formation.

**Figures: the finding was precise.** Density ran 2.8, 2.7 and 2.4 figures per
section across Foundations, Organic Structure and Alkanes, and 1.0 across
Carboxylic Acids, Enolate Chemistry and Amines — exactly backwards, since the
back of the book is where a picture stops being a nice extra and becomes the
only honest way to state the claim.

The reason nobody had fixed it: the existing figures are committed SVG with
**no source**. Coordinates precise to two decimals, and nothing checked in that
produced them, so adding one meant hand-writing trigonometry into a
4,000-character attribute soup. `scripts/lib/ochem-figure.mjs` is that missing
source; `scripts/build-ochem-figures.mjs` holds the definitions.

Six figures so far, each the load-bearing idea of a thin chapter: the acyl
reactivity ladder, the tetrahedral-intermediate fork, enolate resonance, which
bond forms in an aldol, where the charge lands in the sigma complex, and
lone-pair availability across amine types. Those chapters now run 1.3–1.7.

**Every one of the six was wrong on first render** — a clipped column of names,
a caption on top of a heading, a double bond drawn as three lines, and a
substituent drawn on top of a charge symbol. None of it is visible in the
markup and none of it failed a check; it was found by rendering the figures in
headless Chromium and looking at them. The bounds test added alongside catches
the off-canvas half of that class. **The rest still needs eyes, and a figure
added later should be looked at before it is pushed.**

**Repeated explanations: real, but two of them, not dozens.** A first pass at
detecting this reported 128 perfect duplicates across the textbook. Every one
was an artifact: a `<figure>` can sit inside a `.notes-example`, so pulling
captions and callouts separately extracted the same caption twice and compared
it with itself. With figures stripped before reading callouts, the true count
across 3,362 sentences is **20 pairs above 0.55 overlap, of which two were
genuine** — a figure note restating the paragraph directly above it almost word
for word, in `curved-arrows` and `rs-configuration`. Both cut.

The other eighteen are the design working, and the check is written not to
flag them. A caption has to make sense to someone who only looks at the
picture, so some echo of the body is correct. And parallel construction —
"For oxygen: 3 bonds means +1" beside "For nitrogen: 4 bonds means +1", at
0.64 — is the teaching, not redundancy. The ceiling sits at 0.72 against a
measured maximum of 0.688.

**"Missing mechanisms": three named, one actually missing.** Checked each
against the prose rather than against the mechanisms directory:

- **Hydroboration–oxidation** is covered, and covered well — the concerted
  single step, boron to the less hindered carbon, syn addition, no
  carbocation so no rearrangement, and the Hammond argument for why
  Markovnikov is a consequence of a mechanism rather than a law. It has a
  figure. What it lacks is an *interactive mechanism page*, which is a
  different thing from missing content.
- **Acetal and imine formation** are likewise written: `acetals` has its own
  lesson and section, and imines have a section heading of their own inside
  `nucleophilic-addition`. Again, no interactive page.
- **Radical halogenation of alkanes** was genuinely absent. Not a thin
  section — no section, no heading, nothing on initiation, propagation or
  termination anywhere in the book. The radical content in `markovnikov` is
  HBr adding to an *alkene*, which is a different reaction that happens to
  share the mechanism class.

So `radical-halogenation` is written: why alkanes are otherwise inert, the
fishhook arrow, the three stages sorted by what each does to the radical
count, the selectivity table with the Hammond explanation for why bromine is
fussy and chlorine is not, the per-hydrogen statistics correction, racemic
products from a planar radical, and NBS for allylic bromination. It carries
the chain figure and it is the 63rd section.

Its curriculum entry has `href: null` — the "coming soon" state the curriculum
already supports — because the written section exists and the interactive
lesson does not. That makes *topics* (62, those with a lesson) and *sections*
(63) two different numbers for the first time, so check 8 now counts both.

**Still open, and now stated accurately:** interactive mechanism pages for
hydroboration–oxidation, acetal formation and imine formation, plus a lesson
for radical halogenation.

**Skeletal structures: the word appeared once in 63 sections.** Once, in
`fischer`, in passing. There was no topic, no section and no explanation of
the notation that every drawing after Foundations is written in — wedges and
dashes in Stereochemistry, arrow-pushing between atoms that are not written
down in every mechanism chapter, all of it assumed.

Written as the 64th section and placed at the head of Organic Structure &
Electron Movement, which is where the work order asked for it: the four rules,
the asymmetry that catches people (a hydrogen on carbon is invisible, a
hydrogen on oxygen or nitrogen is always drawn, because the second kind is the
one that does chemistry), a worked example reading a structure back to a name,
rings, and a fluency test. Its figure puts butan-1-ol in all three notations
side by side so the rules can be read off by comparison.

Both new sections carry `href: null` and appear in Learn as locked cards until
their lessons exist.

## Phase 6 — Answer-option rewrites

| Item | Status |
|---|---|
| Rewrite options flagged by the three tell checks, one domain per commit | **the three tells are closed**; ~128 individually weak distractors remain — see below |

The scale, measured before starting:

| Tell | Items with exactly one matching option | Key was that option | Baseline |
|---|---|---|---|
| Absolute word | 450 | 6.2% | 25% |
| Hedge | 102 | 40.2% | 25% |
| Trailing justification | 183 | 16.9% | 25% |

The absolute-word tell is the one that matters. A student who learns "the
absolute-worded option is wrong" can eliminate an option on 450 of 2,106
items — a fifth of the bank — and be right 94% of the time.

**Cardiac (Phase 6a):** 29 absolute-word distractors and 6 justification-clause
distractors rewritten. Keys untouched, clinical meaning untouched: each option
still says the same wrong thing in words a student might actually pick.
Bank-wide the absolute tell went 450 → 414 items and 6.2% → 6.8% keyed;
justification 183 → 178 and 16.9% → 17.4%.

Two things worth recording for the remaining domains:

- **Not every absolute is a strawman.** Item 38's distractor read "pain that
  only occurs during exertion and never at rest" — which is an accurate
  description of *stable angina*, and a strong distractor for a question about
  MI. Stripping the absolutes blindly would have weakened it. It was reworded
  to "comes on with exertion and eases within minutes of stopping": same
  clinical claim, no giveaway.
- **Removing one tell can expose another.** Several rewritten options had
  carried a justification clause as well. Removing it made a *different* option
  the only justification-bearing one in its question, which pulled those
  questions into the justify sample and pushed that share below its floor
  until the Cardiac justification clauses were fixed too. Do all three tells
  per domain, in one pass, or the checks will fight each other.

**Medical (Phase 6b):** 42 distractors rewritten, plus 3 keys de-hedged. Running
totals — absolute 450 → 385 items and 6.2% → 7.3% keyed; justification 183 → 172
and 16.9% → 18.0%.

**The hedge tell runs backwards, and the Medical pass got it wrong.** Hedge went
41.0% → 42.2%, away from the 25% target, while still inside its ceiling. The
reason is direction: hedge is the one tell here that marks the RIGHT answer, so
removing a hedge from a *distractor* shrinks the denominator while the keyed
count stays put and the share rises. Seven distractor hedges came out as a side
effect of fixing absolute and justification tells in the same options.

For the remaining domains the rule is:

| Tell | Marks | Fix it by |
|---|---|---|
| Absolute word | the wrong answer | rewriting **distractors** |
| Trailing justification | the wrong answer | rewriting **distractors** |
| Hedge | the **right** answer | committing **keys** to a definite answer |

Two Medical keys kept their hedge deliberately: "generally does not experience
complications" is true of sickle cell *trait*, and "the criteria generally
require" is true of the anaphylaxis criteria, which have a second limb. A key
made wrong to satisfy a metric is a worse outcome than the tell.

**Geriatrics & Special Populations (Phase 6c):** 31 distractors rewritten and 2
padded keys de-hedged, following the table above rather than fighting it. All
three tells improved for the first time in the same commit.

Running totals:

| After | Absolute | Hedge | Justification |
|---|---|---|---|
| start | 450 / 6.2% | 102 / 40.2% | 183 / 16.9% |
| Cardiac | 414 / 6.8% | 100 / 41.0% | 178 / 17.4% |
| Medical | 385 / 7.3% | 90 / 42.2% | 172 / 18.0% |
| Geriatrics | 355 / 7.9% | 88 / 40.9% | 173 / 18.5% |
| Secondary Assessment | 328 / 8.5% | 88 / 40.9% | 164 / 19.5% |
| Musculoskeletal & Burns | 301 / 9.3% | 86 / 39.5% | 159 / 20.1% |
| Obstetrics | 275 / 10.2% | 82 / 36.6% | 151 / 21.2% |
| Scene Safety & Operations | 251 / 11.2% | 79 / 34.2% | 145 / 22.1% |
| Bleeding & Shock | 228 / 12.7% | 75 / 30.7% | 140 / 22.9% |
| Pediatrics | 205 / 14.1% | 73 / 28.8% | 132 / 24.2% |
| Legal & Ethical | 194 / 14.9% | 71 / 26.8% | 119 / 26.9% |
| Trauma Systems | 172 / 17.4% | 70 / 25.7% | 107 / 29.9% ↑ |
| Incident Management | 151 / 19.9% | 70 / 25.7% | 107 / 29.9% |
| Head, Chest & Abdominal | **128 / 23.4%** | 70 / 25.7% | 107 / 29.9% |

Thresholds now `absoluteFloor: 0.195`, `hedgeCeiling: 0.28`, `justifyFloor: 0.25`
and `justifyCeiling: 0.34`.

From Incident Management on, the apply script **asserts** that a rewrite keeps
any justification clause the original had, and adds none where there was none.
That kept hedge and justification exactly flat while absolute moved 17.4% →
19.9% → 23.4% — passes that move one number without disturbing the other two.

## All three tells are closed

| Tell | Start | Now | Baseline |
|---|---|---|---|
| Absolute word | 450 items / 6.2% | 128 / **23.4%** | 25% |
| Hedge | 102 / 40.2% | 70 / **25.7%** | 25% |
| Trailing justification | 183 / 16.9% | 107 / **29.9%** | 25% |

All three now carry a bound on both sides, because a ratchet that only tightens
is right for a number heading toward a target and wrong for one that has
arrived.

**What is NOT finished, and it is worth being exact about the difference.**
The *tell* is closed: a student who spots an absolute-worded option learns
nothing from it, on the 128 items where one still exists, and on the other 322
there is no longer a lone absolute-worded option to spot. That is the pattern
gone.

Individual weak distractors are a separate problem. "Chest injuries never
affect oxygen saturation readings" is a lazy option whatever the aggregate
statistic says, and roughly 128 items still contain one. Rewriting them would
improve those items **and push the metric past chance**, turning the absolute
word into a tell that marks keys.

So the remaining work is no longer tell-removal, it is a balancing act: each
further distractor rewritten needs a key somewhere that is legitimately
absolute — "never delay compressions to place an advanced airway", "always
clear before defibrillating" — to hold the ratio. Those keys would teach
something true, and they are the edit the work order's "keep keys unchanged"
was read as excluding. **This needs a decision before it continues.**

**The justification tell overshot, and the check now has a far side.** It went
past the 25% baseline to 29.9% — the previous commit had written down that a
floor cannot catch this and named ~32% as the point where a clause would start
marking the *right* answer. It kept climbing, so `check-site.mjs` grew a
two-sided bound: a row can declare an `opposite` threshold and is then checked
on both sides. Verified by setting the new ceiling below the measured value and
watching it fail.

The mechanism is the hedge problem in mirror image. Taking a justification
clause out of a **distractor** shrinks the denominator and leaves the keyed
count alone, so the share rises — which is what you want while the tell marks
distractors, and harmful once it is past chance. For the remaining domains:
leave justification clauses in distractors alone, and take them out of keys if
the number needs to come back down.

The same logic is why `hedgeCeiling` was **not** tightened this round despite
measuring 25.7%. Squeezing it below 25% would make it a tell pointing the other
way.

**Two of the three tells are closed.** Justification went 16.9% → 26.9% and
hedge 40.2% → 26.8%, both against a 25% baseline and both now within one
standard error of it. Neither a trailing ", since ..." clause nor a "per
protocol" tells a student anything about whether an option is right, which is
the whole goal. What remains on those two is holding the numbers, not moving
them.

Absolute is the one still moving: 6.2% → 14.9%, with 57% of the flagged items
already gone.

**Where distractor rewriting runs out.** Absolute has gone 6.2% → 9.3% across
five domains, and the remaining work will keep moving it, but not to 25%.
Rewriting distractors can only remove the tell; it cannot create the balancing
evidence that an absolute-worded option is *sometimes* the answer. Reaching the
baseline needs keys that are legitimately absolute — "never delay compressions
to place an advanced airway", "always clear before defibrillating" — which is a
different edit, on key wording rather than distractor wording, and one worth
agreeing before starting.
The hedge ceiling moved for the first time here — it had only ever been held,
never tightened, because until this commit the work kept pushing it the wrong
way.

## Phase 7 — Trust and polish

| Item | Status |
|---|---|
| Normalize British spellings to American | done for prose; code identifiers deliberately left |
| Terms of Use page with medical disclaimer, linked in every footer | done — every page, not just every footer |
| Footers on the 80 ochem lessons and mechanisms (they had none) | done |
| FAQPage schema on exam-day; Course schema on both hubs | **verified already done** |
| Homepage screenshots or GIFs | **open — buildable, but needs a decision first. Measured below.** |
| About section with name and reviewer | needs a person |

**Terms of Use (Phase 7a).** `terms.html` covers the thing that actually
matters first: this is study material, not medical advice, and your own
protocols and medical director govern where they disagree with it. It names
the specific places that vary — a second dose of epinephrine, realigning a limb
to restore a pulse, treating a fever, implied consent for a minor — because
those are the ones this site has had to hedge in its own answer keys.

It also says plainly, under *accuracy*, that the clinical content has **not**
been reviewed and signed off by a named clinician. That is the same open item
sitting at the top of this file, and a terms page is the honest place to
disclose it rather than the place to imply otherwise.

Coverage: 89 pages link it, 13 are redirect stubs that are a meta-refresh and
nothing else, and 3 are 404/offline/ownership-token pages. Check 22 enforces
that any page with a footer link row reaches it.

**Schema: already done, and done properly.** `exam-day.html` already carries
FAQPage, and both hubs already carry Course. The part worth recording is that
the FAQ passes the test that usually fails: Google requires FAQ content to be
*visible on the page*, and all six questions and answers are, word for word,
with a dated caveat telling the reader to confirm the figures in the current
candidate handbook. Nothing to do.

A first pass at checking this reported 5 of 6 entries missing from the page. It
was comparing exact strings against headings the page shortens ("How long do
you get?" against "How long do you get for the NREMT-EMT exam?"). A matcher
that is stricter than the thing it is checking invents findings, which is the
second time that has happened here.

**Spellings: 79 in visible prose, all fixed.** Only text nodes were touched —
never a tag, an attribute, a `<script>` or a `<style>` — and that was verified
by extracting every attribute value from all 40 changed files before and after
and confirming the multisets were identical.

Four more needed hand-fixing because they were not text nodes: an `aria-label`
on a generated figure, two pieces of prose living inside JavaScript strings,
and — the one that mattered — the copy of an FAQ answer inside the ld+json
block on `exam-day.html`, which the text-node pass could not see and which
would otherwise have said "licence" three lines from a visible "license".

About 130 occurrences remain in `.js`, `.css` and `.mjs`. Those are identifiers
(`centre()`, `.centred`) and code comments. Renaming an identifier to fix a
spelling is a bad trade, and the comments are not user-visible.

**Homepage screenshots: buildable, and measured rather than guessed.** The
capture works — the headless Chromium in this environment renders the tools
over a local server, and cropping to a region is possible by loading the tool
in an offset iframe inside a fixed-size frame, which is how these numbers were
obtained with no image tooling installed.

What the measurement turned up, in order of how much it matters:

1. **Dark mode doubles it.** The site has a real dark theme. A light-theme
   screenshot on a dark page looks broken, so honest support means two
   captures per tool behind `<picture>` and `prefers-color-scheme` — four
   images for the arrow pusher and the body map.
2. **No compression tooling.** There is no PIL, no ImageMagick and no `cwebp`
   here, so the output is PNG at roughly **50 KB per crop**. Four of those is
   ~200 KB against 188 KB of images in the entire repo today. It would roughly
   double the site's image payload for two illustrations.
3. **`check-weight.mjs` would not notice**, because it deliberately excludes
   images. Being unmeasured is not the same as being free, and adding weight
   specifically where the checker cannot see it is the wrong instinct.
4. **A screenshot is a second copy of the UI with nothing checking it.**
   `build-og-images.mjs` exists precisely because hand-made images went stale —
   its own comment records a card advertising "978 practice questions" against
   a bank of 2,084. A screenshot has exactly that failure mode, and no
   `--check` can catch it because what it drifts from is a rendering.

None of that makes it a bad idea — the reviewer's point stands, the homepage
does not show what the tools look like. It makes it a **front-door design
decision with a real cost**, and the reasonable options are:

- capture all four and accept ~200 KB of lazy-loaded PNGs, regenerated by a
  script alongside `build-og-images.mjs`;
- capture light-theme only and accept that it looks wrong in dark mode;
- draw theme-aware inline SVG previews instead — near-zero weight, never
  mismatched to the palette, but schematic rather than a real screenshot;
- leave it.

Not chosen unilaterally. The capture harness works and the remaining work is
short once the direction is set.

**The 80 ochem lessons, mechanisms, tools and hub pages had no footer at all**,
which is why "linked in every footer" was true while a fifth of the site had no
route to the disclaimer. They have one now, inside an `.xshell` so it picks up
the site's gutter — a bare `<footer>` would have sat flush against the viewport
edge, since the base rule sets `max-width: 60ch` and does no centring.

Coverage is now 169 pages. What is left is 13 redirect stubs that are a
meta-refresh and nothing else, plus `404.html`, `offline.html` and the Search
Console ownership token — none of which are pages in the sense that matters.

---

## Phase 8 — 2025 AHA guideline update, per-word tells and the deferred decisions

The fourth work order. Items are numbered as they were given.

| # | Item | Status |
|---|---|---|
| 1 | 2025 AHA choking update: flowcharts, the choking toddler scenario, the named questions, every two-finger explanation, a choking section in the notes, and a check so neither can come back | **done** |
| 2 | Chain of survival: chapter 21 to the 2025 single chain, after verifying its links | **done** |
| 3 | Per-word tell checks (entirely, completely, all, regardless / per protocol, appropriate), fix what they flag, and bring the longest-option-is-key rate toward 25% | **done** — length tell closed at 24.8%; `only` measured and frozen, not yet worked |
| 4 | Question 974: V/Q mismatch and the Haldane effect in place of hypoxic drive, keeping "don't withhold oxygen" | **done** |
| 5 | Reference cards: the impossible "M11" GCS example | **done** |
| 6 | Formulary: the nitroglycerin heart-rate contraindication, and that protocols vary | **done** |
| 7 | SN2 figure: cyanide's triple bond and lone pair, overlapping atoms, the ethyl group outside the frame | **done** |
| 8 | The remaining British spellings in visible text | **done** |
| 9 | Confirm the live site matches main (2,106 questions, Terms link) | pending |
| 10 | The three deferred decisions: notes chapters to JSON with figures; light and dark homepage screenshots, lazy-loaded; balance the absolute-word tell using only genuinely absolute keys | **split and figures done**; screenshots and absolute keys next |

### Item 1 — what the 2025 guidelines actually say

Verified against the primary text before anything was edited, because the whole
point of a guideline update is that the old wording was also confidently
written down somewhere:

- **Adults** (Part 7, Adult BLS): "rescuers should perform cycles of 5 back
  blows followed by 5 abdominal thrusts until the object is expelled or the
  patient becomes unresponsive." The adult FBAO algorithm adds that if the
  rescuer cannot encircle the patient's abdomen, 5 chest thrusts are used
  instead. The change rests on a cohort of 709 patients in which back blows
  relieved more obstructions, with fewer injuries, than abdominal thrusts.
- **Children** (Part 6, Pediatric BLS): "repeated cycles of 5 back blows
  alternating with 5 abdominal thrusts." Previously abdominal thrusts alone.
- **Infants** (Part 6): "repeated cycles of 5 back blows alternating with 5
  chest thrusts (no abdominal thrusts)." The thrusts use the heel of one hand,
  which "generates greater compression depth than the previously recommended
  2-finger technique." The AHA deliberately avoids the phrase *chest
  compression* here, because rate and recoil do not apply.
- **Infant CPR** (Part 6): the 2-finger technique is eliminated "due to
  ineffectiveness of achieving proper depth"; the recommendation is the 1-hand
  or 2-thumb–encircling hands technique, and the heel of one hand specifically
  when the rescuer cannot physically encircle the chest.
- **Chain of survival** (Part 4): "we have elected to revert to a single Chain
  of Survival for all forms of cardiac arrest, whether adult or pediatric, in-
  or out-of-hospital." Six links, named above. Neonatal is out of scope and
  keeps its own Newborn Chain of Care.

### Item 1 — the named questions, and the ones that turned out to be fine

Eighteen ids were given. Twelve carried superseded guidance and were rewritten;
six did not, and are recorded here rather than edited for the sake of it.

| Question | What was done |
|---|---|
| 20, 466, 1087 | Adult key rewritten to 5 back blows then 5 abdominal thrusts; the pregnancy/obesity substitution moved into the explanation |
| 873 | Child key rewritten the same way. The infant sequence stays as the discriminating distractor — what separates a child from an infant is now only the second half of the cycle |
| 758 | Key and explanation rewritten to give the sequence by age rather than "abdominal thrusts (or back blows/chest thrusts per age)" |
| 1153 | Ordering item rebuilt: back blows added as a step, hand placement kept, six steps instead of five |
| 129, 467, 1774 | Infant explanations: heel of one hand in place of two fingers, and the 5-and-5 stated |
| 21 | Explanation updated to name back blows, and a stale sentence about a jaw-thrust option that this question does not have was removed |
| 176 | Explanation referred to "Option 1" and "Options 3 and 4" — option numbers, in a bank whose options shuffle at runtime, and wrong even unshuffled, since one of the numbers it called wrong was the key. Rewritten without numbers |
| 474, 756, 1009, 1177, 1193 | **No change needed.** Each mentions choking or abdominal thrusts, but none states guidance the 2025 update changed: thrusts are still the wrong answer for drowning, for angioedema, and for a well-fitting set of dentures |
| 1167, 1836 | **No change needed.** Both are partial-obstruction items where the answer is still to encourage coughing, and both explanations already reserve thrusts *and* back blows for a complete obstruction |

Two further questions the list did not name were found by scanning the whole
bank for the changed guidance:

| Question | What was wrong |
|---|---|
| 1757 | Asked for the infant compression technique with two rescuers. After the 2025 change its distractor "the heel of one hand over the center of the chest" became a **second correct answer**, and its explanation taught both eliminated claims — that two fingers are for a single rescuer, and that a one-hand technique is adult-only. Rewritten around the case the guidelines answer directly: a lone rescuer whose hands cannot encircle the chest |
| 917 | **No change needed.** Its explanation already said "back blows/abdominal thrusts per pediatric BLS guidelines" for a 3-year-old, which is what the 2025 sequence is |

### Item 7 — the SN2 figure, measured rather than eyeballed

All three reported faults were real, and the numbers say so:

| Fault | Measurement |
|---|---|
| Cyanide's triple bond missing | The carbon and its nitrogen were placed 28px apart with radii of 15 and 13. Bonds are drawn edge to edge, so the visible length was exactly **0**, and the triple bond rendered as three lines of no length |
| Atoms overlapping | The same pair, touching at a single point. The nitrogen also sat 1px off the left edge of the canvas |
| Ethyl group outside the frame | The terminal carbon was at y 136 with r 12 in a 140-high viewBox — **8px** below the bottom, shipping with a flat edge |

A fourth turned up while measuring: the attacking lone pair was at 200 degrees,
which put both dots inside the neighbouring nitrogen's circle. Invisible, and
read literally, drawn on the wrong atom. Both nucleophiles here are linear, so
it now sits at 0 degrees — on the group's axis, pointing at the carbon it
attacks.

Check 26 fails the build on every one of them. Verified by restoring the
original coordinate block verbatim, which produces five failures. The fix was
then rendered in headless Chromium to confirm the triple bond reads as three
lines, the lone pair as two dots facing the electrophile, and the ethyl group
as whole.

### Item 8 — why two earlier spelling passes kept leaving some behind

Both earlier passes swept text nodes. Most of the words on this site are not in
text nodes: the study-notes chapters, the scenario graph, both question banks
and every tool's copy live inside JavaScript strings, and a text-node sweep
cannot see any of them. That left **235 occurrences across 67 files**.

The difficulty was never the word list. It was telling text from names.
`stereocentre` in a sentence is a misspelling; `stereocentre` as an object key
is a name, and renaming a key silently breaks a lookup that no test would
notice. So `scripts/lib/spelling.mjs` decides what counts as visible: text
nodes, the attributes a reader sees or hears (`alt`, `title`, `aria-label`,
`placeholder`, meta `content`), and string literals of **three words or more**
— a threshold chosen because a lookup key is almost never a sentence fragment.
Nothing outside a string, a text node or a visible attribute is ever touched.

Verified structurally rather than by reading 235 diffs:

- every changed `.js` file had all its string and template literals stripped,
  and the remaining code was **byte-identical** to the committed version, in
  all 15 of them. Nothing outside a string moved;
- every changed `.html` file had its tag structure compared with the committed
  version, with visible attribute values masked. Identical in all 50. Only text
  and visible attributes moved.

Two occurrences were deliberately left:

| Left alone | Why |
|---|---|
| `analyse()` in `ochem/assets/tools/acid-base.js` prose | It names the real function `analyse(a, b)` in that file. Rewriting the sentence would make it point at nothing. The check exempts a word followed by a bracket for the same reason |
| Test names and assertion messages under `scripts/` | Developer-facing, not anything a student reads |

One occurrence could not be fixed on the page at all. `ochem/notes/radical-halogenation.html`
carries an `aria-label` that is **generated** by `scripts/build-ochem-figures.mjs`,
so the page-level edit was overwritten by the next rebuild. Check 27 caught it
immediately, which is the check working exactly as intended: it reads the
generated output, so a stale generator cannot hide behind a corrected page. The
generator string was fixed at source.

### Item 3 — the grouped tell was an average hiding two perfect giveaways

The absolute-word row read **22.7%** against a 25% baseline and looked all but
closed. Measured one word at a time, it was not:

| Word | Before | Keyed | After | Now |
|---|---|---|---|---|
| entirely | 0 / 83 | **0.0%** | 0 / 3 | — sample gone |
| completely | 1 / 71 | 1.4% | 6 / 48 | 12.5% |
| all | 8 / 191 | 4.2% | 8 / 131 | 6.1% |
| regardless | 5 / 79 | 6.3% | 7 / 70 | 10.0% |
| only | 14 / 105 | 13.3% | *not worked* | 13.3% |
| appropriate | 38 / 43 | **88.4%** | 0 / 6 | — sample gone |
| per protocol | 11 / 12 | 91.7% | 4 / 5 | — sample gone |

A student who eliminated any option containing **entirely** was right every
single time, on 83 questions. One who picked the option containing
**appropriate** was right 88% of the time, on 43. The group average survived
because `immediately` (30.3%) and `never` (22.2%) sat the other side of chance
and cancelled the rest out — which is exactly what a grouped measurement cannot
show you. Check 5(g) now measures each word on its own.

What was actually done, and it is different for each word, because the word is
doing something different in each:

- **entirely** was an intensifier bolted onto a strawman. 80 distractors lost it
  and stayed wrong for the reason they were always wrong. Three kept it, where
  the word is load-bearing: a tourniquet loose enough not to stop distal
  circulation entirely, energy absorbed entirely by clothing, a system relying
  almost entirely on standing orders. Two were rewritten by hand rather than by
  deleting a word, because deleting it would have made a false option true.
- **appropriate** was filler that made a key unfalsifiable — "appropriate
  warning devices", "appropriate channels", "appropriate resources", "appropriate
  PPE". All 38 now name the thing: warning lights and cones; the authority your
  state names; the utility crew; the PPE the hazmat team directs. Naming it is
  the improvement; closing the tell is the side effect.
- **per protocol** stays where protocols genuinely differ, which is the four
  statements this file already records as protocol-dependent. Five keys that
  were padding with it lost it.
- **completely** usually describes something real — a pain that resolves
  completely, a bag that collapses completely, a patient completely
  unresponsive with no gag. Only 28 padding uses came out, and five keys that
  are genuinely complete now say so (a TIA resolving completely, a cervix
  completely dilated, bleeding stopping completely, a reservoir bag inflated
  completely, bleeding not completely controlled).
- **all**: 96 options carried the bare intensifier **"at all"**, which is padding
  wherever it appears. That alone took the sample from 191 to 131.
- **regardless** is usually the substance of a wrong option — "transport to the
  nearest facility regardless of its capabilities" stops being wrong if you
  delete the clause. What came out was a template tail bolted onto nine
  distractors ("regardless of the patient's response to treatment" and its
  variants), which says nothing and is itself a pattern to learn. Three keys
  where universality IS the teaching point gained it: treating every patient's
  fluids as infectious regardless of diagnosis, hand hygiene after every contact
  regardless of whether gloves were worn, transport regardless of whether an
  injury is apparent.

**only** is measured, recorded and frozen at 13.3% on 105 items, and is the
strongest single-word tell left in the bank. It was not in the brief and closing
it is a pass of its own.

### Item 3 — the longest option is no longer the answer

**54% → 32% → 24.8%**, which is chance for a four-option item, on 2,004 items.

The last eight points did not come from padding distractors. They came from the
other side of the same problem: 135 keys ran 20 to 140 characters longer than
every distractor beside them, because they were carrying parenthetical
explanation that belongs in the `explain` field. One key was 331 characters. Two
sentences of it were a legal argument. Trimming those keys shortens the option
AND sharpens the item, so the tell closed with no distractor padded to close it.

Twenty-one items needed the opposite treatment, and they were this session's own
fault: taking padding out of distractors shortened them, which handed the length
tell 21 items it had not had before. Those runner-up distractors were written
out to match their keys rather than having the padding put back.

`lengthCeiling` for questions.json is now **0.25**. There is no room left to
give: at chance the number has stopped being information, and any further
movement in either direction is a new tell.

### Item 10a — the notes are data now

`scripts/check-weight.mjs` had carried the instruction for months: *"at ~160 KB
gzipped every reader downloads forty chapters to read one, and the fix from
here is to move CHAPTERS into a fetched JSON file, not to raise the budget
again."* Done.

| | Before | After |
|---|---|---|
| `nremt/study-notes.html` | 536 KB raw, **172 KB gzipped** | 58 KB raw, **18.4 KB gzipped** |
| `nremt/assets/study-notes.json` | — | 445 KB raw, 144 KB gzipped, fetched after paint |

The request starts in a script in `<head>`, so it is in flight during parse
rather than after `DOMContentLoaded`. The page renders once, when the data
lands; the `hashchange` listener is registered at the same moment, so a hash
arriving first cannot route into an empty book. A failed fetch gets a real
error state with the HTTP status and a retry button, not a permanent
"Loading…".

Four things had to move with it, and three of them would have failed silently:

- **`assets/tutor.js`** indexed the notes by scraping string literals out of
  the page's inline script. With the data gone it would have kept working and
  quietly lost the largest body of teaching text on the site. It now gets a
  third pass — a walker over the fetched JSON using the same key names, which
  is better input than regex-scraping ever was. Verified by running the real
  function over the real file: **540 passages, 379 distinct headings.**
- **`sw.js`** precaches the page. Without the data file it would work online
  and be an empty shell offline, which is the one state nobody tests. Added,
  cache bumped to v33.
- **`scripts/check-weight.mjs`** measures pages by walking `href` and `src`.
  Nothing links to a file fetched by JavaScript, so the 144 KB was invisible —
  "it is fetched separately" was about to become "it is unbounded". New
  `DATA_BUDGETS` section, and while adding it, the question banks and both
  tutor banks turned out to have been unbudgeted all along. Six files, now
  budgeted.
- **`scripts/check-a11y.mjs` and `scripts/check-console.mjs`** drive the page
  in a real browser and waited a fixed moment after load. That was fine while
  the chapters were inline; now it is a race, and they would sometimes audit a
  "Loading the notes…" paragraph. The page sets `data-content-async` up front
  and `data-content-ready` when it has rendered — on failure too, because the
  error state is worth auditing — and both checks wait for that instead.

Check 28 and `scripts/test/notes-data.test.mjs` guard the rest. The test lifts
the real walker out of `tutor.js` by name rather than reimplementing it, since
a reimplementation would pass while the real one was broken; deleting one line
of the walker fails three of the five tests.

### Item 10a — four figures, and the four ways I drew them wrong

The notes had no figures, and the reason was structural: the chapters were an
inline array in a 536 KB page, so a figure meant hand-writing SVG into a
template literal nobody could diff. With the chapters in a JSON file that stops
being true, and the drawing kit the ochem textbook uses turned out to be half
generic — `panel`, `bar`, `rule`, `arrow`, `text` and `figure` know nothing
about chemistry.

| Figure | Section | What the prose could not do |
|---|---|---|
| `ch21-chain` | 21.1 | Six links in order, with the EMT's two shaded. The notes were describing a chain in an ordered list, which is the one shape a chain is not |
| `ch9-airway-path` | 9.1 | Where a breath goes, and where the epiglottis sits in it — which is the whole reason that structure matters |
| `ch9-fbao-cycle` | 9.4 | The 2025 five-and-five as a cycle, with the one half that changes by age |
| `ch21-depth` | 21.2 | 2 in, 2 in and 1.5 in drawn against the chests they are measured in, where they stop looking like three rules |

The figure CSS moved from `ochem/assets/ochem.css` to `assets/theme.css`, since
a drawing vocabulary only half the site can reach is not a vocabulary. Net cost
is a wash: the site shell went 226.5 → 228.6 KB and the ochem shell 85.8 → 83.9.

Every one of these was drawn wrong first, and every fault was found by
rendering it:

1. **900 units wide.** `.notes-figure svg` carries `min-width: calc(--vb *
   0.92px)`, so a figure wider than the column does not shrink — it becomes a
   horizontal scroll. For a diagram whose job is a shape at a glance that is a
   worse trade than a smaller drawing. All four are now ≤ 700, and a test caps
   it.
2. **The left edge was unreachable.** The svg was centred with `margin:0 auto`,
   which centres the *overflow* too and puts the left end of a wide drawing at a
   negative offset no scrolling can reach. Every wide figure on the site was
   losing its left edge that way, ochem's included. Fixed at the source:
   `.notes-figure` is a flex column and the svg uses `align-self: safe center`,
   which centres while it fits and falls back to flex-start when it does not.
3. **Ten labels were centred on their own left margin.** `text()` defaults
   `text-anchor` to `middle`, so a heading placed at x=20 to sit against the
   left edge is centred on x=20 with half of it off the canvas. The bounds test
   read anchor coordinates and called all of them fine.
4. **The `size` option does nothing for these classes.** Every `fg-` class in
   `theme.css` sets `font-size`, and a CSS declaration beats a presentation
   attribute — so labels render at 13px however they were sized, and one
   overflowed the canvas while the test, measuring the attribute, said it fit.

Faults 3 and 4 are now in the test rather than in my memory: it measures a
label's real extent from its anchor, its text and the size its class actually
renders at. Reverting either fix fails it.

A fifth thing turned up and was not this session's to fix: **8 of the 133
hand-written figures in `ochem/notes/` draw measurably outside their canvas**
(worst: `pka.html`, 95 units off the left). Those are hand-written SVG rather
than generated, so neither check 20 nor check 26 looks at them. Measured, not
fixed — recorded here as its own piece of work.

---

## Already settled

### Done in earlier pushes

Privacy page: the Google Fonts claim (fonts are self-hosted) and the sync
description (per-question records do sync). Exam-day malformed paragraph.
"Reactions" link label, fixed at source in `curriculum.js`. Seven molecules
redrawn with full methyls. SN2 step counter and the Below/Above slip. Step-rail
labels. Aniline nitration caveat. pKa table order. COPD oxygen settled across
notes and bank. Bleeding: tourniquet-first, elevation removed. Stroke and
motorcycle scenarios. Body map ribs and temporal bone. Seven wrong answer keys,
five clobbered option sets, eleven contradiction pairs, stale guidance (fall
height, burn cooling, newborn suctioning, CPR effectiveness, dialysis fistula),
scope framing on capnography and 12-lead items.

### Verified as **not a defect** — no change made or needed

| Claim | Finding |
|---|---|
| Pelvic binder taught at the iliac crest | False. That text is the anatomical location of the pelvis. `study-notes.html` already says greater trochanters. Phase 1 rewords it anyway so it cannot be misread. |
| Chapter 33 teaches the long backboard as default | False. It already teaches spinal motion restriction and calls the backboard a transport device. |
| Changelog is future-dated | False. UTC date, correct. |
| "58 lessons" contradicts "62 topics" | Both true and already distinguished: 58 lesson pages plus SN1/SN2/E1/E2 whose primary page is a mechanism walkthrough. `check-site.mjs` enforces it. |
| "Sign in to sync" overpromises | Backwards. Sync does carry per-question records; the privacy page was the inaccurate half, and was fixed. |
| Questions 2028/2029 share copied options | False positive of naive similarity. Two musculoskeletal definitions drawing on the same four terms, both correct. |
| Nav links to `/index.html` split search signals | Internal links are relative and canonicals handle it. Not worth the churn. |

### Deliberately not done

| Item | Why |
|---|---|
| Making the repo private | Would not protect the banks (the browser fetches them as plain JSON) and would unpublish the site on a free plan. A license is the real answer. |
| Removing the site's self-critical asides | The candour is what makes the honesty claims credible. Only the doorbell line goes, as a single joke too many on a page about deletion rights. |

---

## Automated checks now guarding these

`scripts/check-site.mjs`, run in CI on every push:

1. Local references resolve · 2. JSON parses · 3. Sitemap resolves ·
4. Lesson-concept map · 5. Answer tells: keyed position, option length,
true/false polarity, select-N key sets, **absolute words**, **hedge words**,
**trailing justification clauses** · 6. Advertised question counts ·
7. Sitemap completeness · 8. Advertised ochem counts · 9. Tool tiles ·
10. Unique question ids · 11. Error reporters load first ·
12. **Molecule valence** · 13. **Scenario graph** · 14. **Copied option sets** ·
15. **Flow-diagram branches** · 16. **Tables inside a scroll wrapper** ·
17. **Figures that appear on more than one page agree** ·
18. **Advertised scenario count**, and scenario nodes must be able to reach an
ending, not merely be reachable from the start ·
19. **Every lesson and mechanism links to its written section**, in the body
rather than the head · 20. **Generated figures draw inside their own canvas**,
and carry alt text and a caption · 21. **No textbook section explains the same
thing twice** across its body, callouts and captions ·
22. **A page with a footer link row reaches terms.html** ·
23. **Superseded resuscitation guidance cannot come back** ·
24. **The bank cannot outgrow the option letters the page can render** ·
25. **No impossible Glasgow Coma Scale score**, and a total written beside a
triple has to be the sum ·
26. **Hand-placed molecule diagrams are actually drawable** — inside the
canvas, no touching circles, no bond with nothing to draw, no lone pair sitting
on a neighbor ·
27. **No British spelling in anything a reader sees** — text nodes, the
attributes a reader hears or sees, and string literals of three words or more ·
28. **The study notes and their data file stay in step** — the file parses, no
two sections share an id, the page still fetches it, sw.js still precaches it,
the chapters have not been pasted back inline, and every page claiming a
chapter count agrees with the data ·
8 now also covers
**advertised section counts**, with changelog.html exempt because a dated
entry is a record rather than a claim about now

Bold entries were added in response to these reviews. Each was verified by
reintroducing the defect it exists to catch.

Checks 16 and 17 both came out of Phase 4 catching this session's own work.
Check 16 found four tables added to the notes without the scrolling wrapper
every other table on the site already had, plus one more on a page nobody had
looked at. Check 17 exists because two numbers — the adult suction limit and
the non-rebreather flow rate — had drifted into two values across pages; it is
a short list of repeated figures, not a fact-checker, and it should grow a row
only when a number starts appearing in a second place.

Check 23 is the one that most repaid the reintroduction habit. It reads every
block of prose the site can show a learner and fails on a unit that
*prescribes* the superseded guidance — not one that merely mentions it, since
the sentences that fixed the site all name the old technique in order to
correct it. Nine defects were put back to test it. The first version caught
five. The four it missed were all the same shape, a unit too small to carry its
own context:

- a flowchart box reading "Abdominal thrusts, repeated", with the word
  *obstruction* only in the `<h2>` above it;
- a notes table cell reading "5 abdominal thrusts", with the back blows in the
  row above and the word *choking* in a JavaScript `title:` key rather than any
  HTML heading;
- the same table again, because a `<div class="table-wrap">` matched as one
  block and flattened the whole grid, so a row saying "Abdominal thrusts are
  not used at this age" excused every other cell beside it;
- and then every table cell at once, because a single alternating regex walks
  the file left to right, so matching the wrapping `<div>` consumed its `<td>`s
  before they could be seen.

So a unit now carries the heading above it and, for a cell, the table around
it; a rule's *prescribes* half is tested against the block alone and its
*topic* half against the wider scope; exemptions are read from the block, never
the scope; and the tags are scanned one at a time rather than in one
alternation. Distractors are out of scope by design — a wrong answer is often
required to state the superseded technique, which is what makes it wrong — so
only stems, keyed options and explanations are read.

The wording-tell thresholds are set at the bank's measured state, not at
the target, following the convention already used for the ochem ceilings: they
stop the numbers getting worse while the editorial work in Phase 6 happens.
Lower them as that work lands. Never raise one.
