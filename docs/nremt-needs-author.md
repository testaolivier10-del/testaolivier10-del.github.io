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

## Exam item types and the adaptive exam (2026-10-27, `docs/tools-upgrade.md`)

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
