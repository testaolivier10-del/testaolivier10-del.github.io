# NREMT: open points for a person

Questions the NREMT lesson work (`docs/nremt-lessons-spec.md`) could not settle alone.

Decided (2026-10-26, Olivier):

- **Free and Premium lessons:** chapters 1 to 8 free, the rest Premium, notes always free (built; spec "Free and
  Premium").
- **Soaked dressings, remove or add (reviewer B1, B2):** don't peel the dressing off to look; if bleeding continues,
  escalate (packing or tourniquet) rather than relying on more layers. Lessons and the Chapter 29 notes now say this.
- **Neck wounds:** occlusive dressing against air embolism, pressure that spares the airway and both carotids, pack
  only with caution and per protocol (lessons and notes).
- **Pilot review:** the independent accuracy pass is done and logged in the spec; the pilot is merged.

Open: none.

## Exam item types and the adaptive exam (2026-10-27, `docs/tools-upgrade-2026-10.md`)

Open, for Olivier:

1. **The adaptive exam's passing line.** LevlPrep's model puts it where a student gets about half of the "hard" and
   about three quarters of the "medium" questions right (Rasch, ability 0; tags easy -2, medium -1, hard 0, expert +1).
   The difficulty tags were never calibrated against real answer data. Once `question_stats` has a few hundred answers
   per item, the tags (or per-item difficulties) should be refit from it; until then the page calls the line an
   estimate. Is that wording enough, or should the result hide pass/fail and show only the domains?
2. **Free users and the adaptive exam.** Decided 2026-10-27 (Olivier): it gets its own free attempt, separate from
   the free timed exam. Built.
3. **Pass-or-extend.** Decided 2026-10-27 (Olivier): a finished adaptive exam counts toward the minimum exams.
   Built: recorded server-side like the timed exam; `nremt_cat_history` itself stays local.
4. **Tourniquet first (item 2138).** The options-table bleeding item keys a tourniquet first for life-threatening
   limb bleeding (Stop the Bleed), and its explanation notes the psychomotor sheet scores direct pressure first.
   Confirm that is the line the course takes everywhere.
5. **Reviewer notes left as is:** 2118 suctioning without known airborne disease is keyed eye and face protection
   (some services treat suctioning as aerosol-generating and want an N95); 2144 (diabetic emergencies) stays tagged
   Primary Assessment. Change either if your program teaches otherwise.

Open (tool audit fixes, 2026-10-27, branch fix-nremt-tools):

- **Reference cards, score readings.** The GCS bands (15 normal, 13 to 14 mild, 9 to 12 moderate, 8 or below severe), the APGAR
  bands (7 to 10 reassuring, 4 to 6 moderately abnormal, 0 to 3 low, ventilate for apnea, gasping or a heart rate
  under 100 whatever the total; compressions if the heart rate stays under 60 after 30 seconds of effective ventilation) and the pediatric assessment triangle categories (appearance alone: systemic; breathing alone:
  respiratory distress; skin alone: compensated shock; appearance plus breathing: respiratory failure; appearance
  plus skin: decompensated shock; all three: cardiopulmonary failure) are written in `nremt/assets/ref-cards.js`.
  Breathing plus skin with a normal appearance has no standard name; the tool says "both abnormal, still
  compensating". Confirm the wording against the textbook the course follows.
- **Skill station, live order flags.** A critical step ticked after a later one is flagged "out of order" on the run
  and in the result. Only two official criteria light from order by themselves (No PPE, and only when a hands-on step was
  ticked before BSI, since calling for help or a scene size-up first is not a failure; on BVM, no suctioning before
  ventilating); the rest are flagged, not scored. Confirm that is the right line for examiners' practice.
- **Formulary, bystander nitroglycerin card.** Its verdict now says why (an EMT assists only with the patient's own
  prescription) instead of quoting the indication line, which read as a reason to give. Confirm the wording.

Open (2026-11-10, all 80 lessons and the bank audit):

- The 62 contested lesson points and the 44 question notes that need a person are listed in
  `docs/nremt-reviews/needs-decision-2026-11.md`. The biggest: hypothermic arrest shocks (2025 AHA: one shock, then
  defer until 30°C, class 2b, against older textbook wording), newborn ventilation rate (2025 AHA/AAP 30 to 60,
  many texts 40 to 60), adult suction time (15 against 10 seconds), open chest wound dressing type, and whether the
  ACS field triage lists may be reproduced in a paid product (the ACS page asks for written permission).
- **Chapter 27 has no suicide content** although its title promises it. A carefully worded notes addition (EMT
  scope, no method detail, 988) is drafted as the last ch27 entry of the reviewer's notes fixes, quoted in
  `docs/nremt-reviews/lessons-r4.md`. Not applied: owner approval needed. "Excited delirium" also still appears in
  the ch27 headings (body text updated to "hyperactive delirium with severe agitation").
- 137 notes fixes were applied so the textbook agrees with the reviewed lessons. Those the reviewer could not open a
  primary source for are marked "not fetched" in the review logs; a clinician spot check should start there.

Open (2026-11-10, tool fixes: scenario simulator and station run, task nremt):

- **Crowning pin (fixed, confirm the wording).** "Crowning in the Driveway" pinned "Contractions" on the mother's head,
  because "the top of the head at the vaginal opening" (the baby's head, crowning) matched the head region. For a
  pregnant patient, birth and baby sentences now go to a Perineum pin (Crowning, Head delivered, Cord at the neck, Baby
  born, Waters broken, Vaginal bleeding) and contractions stay on the uterus. Not contested; listed so the owner sees it.
- **Pregnant figure.** The uterus is drawn at its height for the weeks (about the xiphoid from 36 weeks, the umbilicus at
  20, lower again after the birth) with the baby head down. Since pass 2 (2026-11-10) the figure under it is a woman (see
  "Female figure" below). The third-trimester bleeding case (abruption) shows no placenta, on purpose.
- **AED pads in the scenario simulator.** Adults and children over 5 get front pads (below the right collarbone, left side);
  toddlers and infants get one front pad mid chest and one on the back (front-to-back). Pediatric pad placement follows the
  pads' own pictures and the device; confirm this is how the course wants it shown.
- **Station run, the eight new patients.** Checked in pass 2 against the current Registry PDFs (below).

## Pass 2 checks (2026-11-10, task nremt pass 2)

**Station step lists against the Registry sheets.** Each of E201, E202, E204, E211, E212, E215, E216 and E217 was read
from content.nremt.org (the E202 form is dated 10-16) and compared step by step and criterion by criterion. Changed:

- Which steps are critical. PPE is a scored step but **not** a critical criterion on E211, E212, E216 or E217 (it is on
  E201, E202, E203, E204, E213 and E215); the run now marks a missed BSI there as a lost point (amber), not a fail (red).
  The first distal check on both spinal sheets (E211, E212) is scored but not critical; only the recheck after
  immobilization is. On E216 and E217 both checks stay critical ("before and after splinting").
- Joint (E216): the sheet's step "Secures the entire injured extremity" was missing; added (a cravat at the ankle).
- Oxygen (E204): added "Gathers appropriate equipment"; the pressure check now comes before the leak check, as on the
  sheet; the flow step says "at least 10 L/min" (the sheet's floor and critical criterion; the old note wrongly said the
  sheet asks for 12); the three closing steps (remove the mask, shut off, bleed the regulator) are not on the current
  11-point sheet and were removed (a note says some program sheets still have them).
- Trauma (E201): baseline vital signs moved to before the secondary exam (the sheet's History Taking section).
- Medical (E202): "Fails to provide accurate report to arriving EMS unit" is a critical criterion: the report step is now
  critical. The old "no medical direction or standing order for a medication" criterion is not on the current sheet: the
  interventions step is now "Field impression, then interventions per protocol", scored, not critical, and the
  skillsheets.html summary row was corrected the same way.
- Seated (E211): the strap order is not on the sheet; the step now says "many programs: middle, bottom, then top".
- Matched with no change: long bone (E217) steps and criteria, cardiac arrest/AED (E215), supine (E212) order.
- Left as is, for you: the run merges the spinal sheets' two head steps ("place in neutral, in line" and "maintain manual
  stabilization") into one, and the trauma and medical runs group the sheets' 42 points into phases (said on the page).
  Confirm both are fine for practice.

**AED pads for small children.** 2025 AHA/AAP Pediatric BLS (Part 6): use the largest pads that fit with good separation
(COR 1, LOE C-EO); anteroposterior or anterolateral placement "may be reasonable" (COR 2b, LOE C-LD), neither preferred.
The simulator's front-to-back pads for toddlers and infants and front pads from age 5 are consistent with it. Not
changed. (The figure fix below also stops the adult woman being drawn with infant pads.)

**Female figure.** The model (BodyParts3D) is one male body; there is no female scan in the repo. The builder now makes
a woman from it (`femaleWarp` in `scripts/body-figures/render.js`: breasts, waist and hips on the skin only; landmarks,
bones and organs unchanged; prostate left out of the anatomy view), in the scenario-only `case` set, so the body map's
`body.js` and `chest.js` are byte-identical (`build-body-figures.mjs --check` passes). Every adult case whose opening
names a woman uses it (s2, s7, s15, s16, s17, s20, s24), and those patients get "her" in the care strip (s17 said
"his" because of "her husband"). Limits: the skeleton is still the male pelvis and the face is a mannequin; a true
female model would need a second CC BY-SA or similar female mesh, rendered
through the same pipeline.

Decided (2026-11-12, owner: "do the best possible decision for the NREMT content review"): every point in
`docs/nremt-reviews/needs-decision-2026-11.md` now has a decision, recorded with its reason in
`docs/nremt-reviews/decisions-2026-11-12.md` and applied by `scripts/nremt-decisions-2026-11-12.py`. Chapter 27 has a
"Suicide risk" notes topic (no lesson step yet). Field triage lists are summarized and linked to ACS. Still open: a
clinician or EMS instructor spot check.

## Mnemonics tool, tools v2 Explore (2026-11-18, branch claude/tools-v2-nremt-mnemonics)

Explore (`nremt/assets/mnemonics.js`) acts four mnemonics out on drawn, made up patients. Checked against the cards on
`nremt/mnemonics.html`, the course notes and the sources in `docs/nremt-lessons-spec.md`; for a person to confirm:

- **OPQRST severity, 0 to 10 or 1 to 10. Resolved (review round 1, 2026-11-18):** 0 to 10 is the standard numeric
  rating scale (0 is no pain). The card now says "often rated on a 0 to 10 scale, where 0 is no pain" and the
  flashcards were rebuilt; Explore uses the same scale.
- **AVPU painful stimulus.** Explore shows a trapezius squeeze (the stimulus most EMT sources name first; sternal rub
  is also taught, and some programs discourage it). Any response to voice (eyes opening, a mumble) counts as V; A is awake and aware, not only eyes open (review round 1). The UK
  ACVPU adds C (new confusion); not shown, since the NREMT uses AVPU.
- **The made up patients.** The chest pain patient's answers (crushing pain for 20 minutes, to the left arm, 8 of 10,
  nitroglycerin and a blood pressure pill, a stent two years ago, coffee an hour ago) are consistent with scenario s2.
  The rider has one finding per DCAP-BTLS letter, including a burn on the right lower leg (from the exhaust pipe). Explore shows one finding per letter on one body; "?" says that a real exam checks every
  region for all eight.

## Body map, tools v2 (2026-11-18)

Points from the v2 rebuild of `nremt/body-map.html` (`docs/tools-v2-nremt-body-map-brief.md`); the body's content
did not change. For a person to confirm:

- **The child chart's age.** Burns' child chart (head and neck 18%, each leg 13.5%) is the infant and small child
  Rule of Nines from the course notes. "?" says the shares move toward the adult chart as a child grows and that many
  protocols use a Lund and Browder chart for children (burns.js said this before in its side panel). Should it name
  an age (often "under about 1 year" for the 18% head)? Not guessed.
- **Why each region carries its share.** The cause line now says "half of the arm's 9%", "one nine of the front's
  18%", "half of the leg's 13.5%" (child), "the last 1%" (genitals). These restate burns.js's tables, which the unit
  test checks add up to 100 on both charts.
- **Over 10% or 10% and over.** The course notes and the tool say partial thickness burns "over 10%" of the body
  surface meet burn center criteria. The American Burn Association's current referral page uses "partial thickness
  ≥10% TBSA" (https://ameriburn.org/burnreferral). It only matters at exactly 10% (for example 9 + 1). Not changed
  without the author.

## Sound trainer, tools v2 Explore (2026-11-18, branch claude/tools-v2-nremt-sound-trainer)

Explore (`nremt/assets/sound-explore.js`) puts a stethoscope on the drawn chest; a lens beside it draws what makes
each sound. The sounds, sites, loudness by site and the Test yourself questions are unchanged (`sound-stage.js`,
whose accuracy notes are in `docs/tools-upgrade-notes/nremt-body.md`). Checked against the course notes (airway
management, primary assessment, principles of assessment, cardiac emergencies) and the sources in
`docs/nremt-lessons-spec.md`; for a person to confirm:

- **Crackles, the cause.** The lens shows air sacs, some holding fluid, snapping open on breathing in; the cause line
  says "fluid filled air sacs pop open" and the takeaway "small airways and air sacs with fluid in them popping open".
  The usual explanation is collapsed or fluid filled small airways popping open (fine crackles), with fluid in the
  airways for coarse ones; the course notes say "fluid in the alveoli, or small airways popping open". Kept at that
  level for EMTs; confirm the wording.
- **Normal breath sounds (review round 1, 2026-11-18).** The Normal side of the lung switch is never silent (silence
  over a lung field is the finding "diminished or absent breath sounds"). Over the lung fields it plays recording
  DP31 (label N, normal; posterior left middle; 27 year old woman; diaphragm mode; 20 s, 4 kHz) from Fraiwan M,
  Fraiwan L, Khassawneh B, Ibnian A, "A dataset of lung sounds recorded from the chest wall using an electronic
  stethoscope" (Data in Brief 2021; Mendeley Data jwyy9np4gv), CC BY 4.0, saved as
  `nremt/assets/audio/normal-vesicular.wav` and credited in "?" and the page footer. For a person: (1) the file came
  from a GitHub copy of the dataset (`IKnowUCantPvp/Lung-Sound-Classification-PCEN`, folder "Additional Lung Sounds",
  the file used unaltered, sha256 ffce627849d0b2e2...), since Mendeley is not reachable from the
  build container: confirm it against the original download, and which version it is (the credit links version 3,
  doi:10.17632/jwyy9np4gv.3, the current one, checked on 2026-11-19); (2) listen to it: it could not be listened to here (its
  breath bursts were checked by their energy, 150 to 800 Hz, about every 2.7 s; much of its low end is heart sound);
  pick another normal file from the dataset if a cleaner one exists. Over the trachea, Normal plays a GENERATED
  tracheal (bronchial) breath, tagged "Generated breath": louder and harsher, heard breathing in and out about equally
  with a short gap. Confirm, or replace with a recorded tracheal sound.
- **Crackles wording (review round 1).** The cause pill now follows the course's words: "small airways and air sacs
  stuck by fluid snap open".
- **The live trace of a lung clip.** The strip draws the clip's own loudness as it plays only if Wikimedia's file
  server answers the CORS request (`liveUrl`, the file's direct address). Could not be checked from this container
  (Wikimedia is blocked here); if it fails the clip plays as before and the strip draws a typical breath, named as one. Worth one look on
  the live site.
- **The heart in the lens is a schematic** (four chambers from the front, valves as leaflets, the aorta and pulmonary
  artery). Timing follows the same table as the sound: AV valves close at S1, aortic and pulmonic at S2 (split: aortic
  first), ventricles squeeze in systole, the atria at the end of diastole. The murmurs are one example each (aortic
  stenosis, aortic regurgitation), as the old page already said.

## Skill sheets, tools v2 Explore (2026-11-19, branch claude/tools-v2-nremt-skillsheets)

No step, critical criterion, order rule, examiner cue or finding was changed: Explore reuses station-patient.js as
checked on 2026-11-10. For a person to confirm:
- **Registry PDFs not reopened.** The proxy here refused content.nremt.org, so the ten sheets could not be read again
  this session. If the Registry has published new EMT sheets since 2026-11-10, the step lists need a fresh check.
- **Does the Registry still run these sheets?** Searches suggest psychomotor verification for EMT has moved to
  programs and states in many places; the tool already says to verify against your program's sheet. Confirm the
  wording on the page ("the official sheets") is still right for 2026 candidates.
- **The short names and effects** on the clipboard and the cause line (`STEP`, `LIVE`, `TQ` in
  `nremt/assets/skill-explore.js`) paraphrase each step's own text in 1 to 3 words. Worth a glance by an EMT
  instructor, especially "Ventilate on rate" (one breath every 5 to 6 s), "Set the flow: at least 10 L/min",
  "Breaths through vomit: vomit into the lungs" and "Tourniquet first: sheet wants pressure first".
- **Review round 1 pictures (no content change).** The settings (a roadside for the supine spinal, a car for the
  seated spinal, a lawn and ladder for the trauma case, a sports hall for the arrest, a room for oxygen and the
  medical case) are illustrations of each case, not part of any sheet. The seated figure is the standing render
  posed (lower legs moved to the front of the cushion); the arms on the spinal stations are turned in to lie at the
  sides; the log roll is shown as the body narrowing and the board sliding in. Worth a glance that none of this
  suggests a technique the sheet does not teach.

## Flowcharts, tools v2 Explore (2026-11-19, branch claude/tools-v2-nremt-flowcharts)

Explore (`nremt/assets/flow-explore.js`) walks two made up calls through a protocol on a drawn patient. Checked against
the course notes, the AHA 2025 adult BLS algorithm (healthcare provider, accessible text) and the page's own charts;
for a person to confirm:

- **Circulation fork of the Primary assessment chart.** The page's chart asks "bleeding still uncontrolled / perfusion
  adequate". A patient whose bleeding is controlled can still be in shock, so neither arm fits him. Explore asks "Signs
  of shock?" (yes: keep him warm, high priority) and "?" says why; the chart itself (and Build it and Drill me, which
  read it) is unchanged. Should the chart's fork be reworded?
- **Order of AVPU and the bleeding check.** Explore follows the page's chart (AVPU, then life threatening bleeding).
  Some programs teach X-ABC with massive bleeding controlled as soon as it is seen in the general impression; the
  chart's note says bleeding comes before the airway in trauma, which Explore keeps.
- **Jaw thrust for a fall.** A fall from a ladder puts the spine in question, so the snoring airway is opened with a
  jaw thrust (course notes). The gloved hands stay on the jaw for the rest of the call (maintaining the airway); an
  adjunct is not shown.
- **Blue lips clearing after the jaw thrust.** After the wrong "airway open: yes" arm, the lips turn blue; they clear
  once the jaw thrust opens the airway (oxygenation recovers). Everything else a wrong arm does stays (blood lost,
  pallor, the clock).
- **The lost time clock.** 1, 2 and 10 minutes are illustrative figures for the wrong arms, said in "?".
- **Cardiac arrest, three way fork.** Explore uses AHA 2025's three outcomes (normal breathing and a pulse; a pulse
  without normal breathing; no pulse with no breathing or only gasping). The page's BLS chart has two arms; unchanged.
