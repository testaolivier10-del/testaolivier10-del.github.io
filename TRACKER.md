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
| Rewrite options flagged by the three tell checks, one domain per commit | in progress — 7 domains done, ~8 to go |

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
| Scene Safety & Operations | **251 / 11.2%** | **79 / 34.2%** | **145 / 22.1%** |

Thresholds now `absoluteFloor: 0.11`, `hedgeCeiling: 0.35`, `justifyFloor: 0.22`.

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
| Normalize British spellings to American (~170 occurrences, mostly ochem prose: centre, favour, behaviour, haemoglobin) | open |
| Terms of Use page with medical disclaimer, linked in every footer | open |
| FAQPage schema on exam-day; Course schema on both hubs | open |
| Homepage screenshots or GIFs | open |
| About section with name and reviewer | needs a person |

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
thing twice** across its body, callouts and captions · 8 now also covers
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

The three wording-tell thresholds are set at the bank's measured state, not at
the target, following the convention already used for the ochem ceilings: they
stop the numbers getting worse while the editorial work in Phase 6 happens.
Lower them as that work lands. Never raise one.
