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

Open (tool audit fixes, 2026-10-27, branch fix-nremt-tools):

- **Reference cards, score readings.** The GCS bands (13 to 15 mild, 9 to 12 moderate, 8 or below severe), the APGAR
  bands (7 to 10 reassuring, 4 to 6 moderately abnormal, 0 to 3 low, ventilate for apnea, gasping or a heart rate
  under 100) and the pediatric assessment triangle categories (appearance alone: systemic; breathing alone:
  respiratory distress; skin alone: compensated shock; appearance plus breathing: respiratory failure; appearance
  plus skin: decompensated shock; all three: cardiopulmonary failure) are written in `nremt/assets/ref-cards.js`.
  Breathing plus skin with a normal appearance has no standard name; the tool says "both abnormal, still
  compensating". Confirm the wording against the textbook the course follows.
- **Skill station, live order flags.** A critical step ticked after a later one is flagged "out of order" on the run
  and in the result. Only two official criteria light from order by themselves (No PPE; on BVM, no suctioning before
  ventilating); the rest are flagged, not scored. Confirm that is the right line for examiners' practice.
