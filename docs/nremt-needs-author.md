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
  20, lower again after the birth) with the baby head down. The figure under it is the body map's model, which is male:
  a female figure would need a new render. The third-trimester bleeding case (abruption) shows no placenta, on purpose.
- **AED pads in the scenario simulator.** Adults and children over 5 get front pads (below the right collarbone, left side);
  toddlers and infants get one front pad mid chest and one on the back (front-to-back). Pediatric pad placement follows the
  pads' own pictures and the device; confirm this is how the course wants it shown.
- **Station run, the eight new patients.** Step lists are paraphrased from the Registry sheets E201, E202, E204, E211,
  E212, E215, E216 and E217 as remembered, not re-read line by line against the PDFs (not fetched in this session).
  Worth a check against the current sheets: the oxygen station's opening steps (crack the valve, BSI), the seated
  station's strap order (middle, bottom, top, as most programs teach), the joint station run on a knee (bones above and
  below), the long bone station run on a forearm. The trauma and medical assessments group the sheet's many items into
  phases and use their own invented cases (a 12-foot fall; chest pain treated with aspirin per protocol).
