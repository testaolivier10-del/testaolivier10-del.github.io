# A&P course: needs author

Items that need a human decision or a human review, per `docs/anp-spec.md` section 16. Nothing
here is guessed. Each item records its status, and once it's settled, the decision and where it is
applied.

Status values:
- **open**: waiting on a decision.
- **decided**: settled; recorded in the spec's decisions log.
- **pending review**: the course follows the stated position, but a licensed A&P instructor
  should confirm it.

## Contested science

The rule (spec section 16, decided at the Phase 0 review): teach the explanation best supported by
current research and evidence, which is not simply the newest one. Where a course exam or the TEAS
may still expect an older answer, add a short "For your exam" note. Every item here stays pending
review by a licensed A&P instructor.

### hypoxic-drive: oxygen and CO2 retention in COPD
- **Status:** pending review.
- **Where:** `breathing-control`, `respiratory-disorders`, `acid-base-disorders`.
- **Evidence-based position:** giving high-flow oxygen to some people with COPD raises their
  PaCO2 mainly through two effects. First, V/Q mismatch worsens: oxygen reverses hypoxic
  pulmonary vasoconstriction, so blood flows to poorly ventilated alveoli. Second, the Haldane
  effect: oxygenated hemoglobin carries less CO2. Loss of a "hypoxic drive to breathe" plays at
  most a small part.
- **For your exam:** many EMT and nursing materials still teach hypoxic drive as the cause.
  Know that answer. Never withhold oxygen from a hypoxic patient because of it.

### starling: capillary exchange
- **Status:** pending review.
- **Where:** `capillary-exchange`, `lymphatic-system`, and the graph "Capillary pressures
  along a capillary".
- **Evidence-based position:** the revised Starling principle. Across most capillary beds,
  filtration exceeds reabsorption along the whole length at steady state. The lymphatics
  return most filtered fluid. The glycocalyx layer sets the effective oncotic gradient.
- **For your exam:** textbooks and exams usually expect the classic picture: net filtration at
  the arterial end, net reabsorption at the venous end, about 85–90% reabsorbed and the rest
  returned by lymph.
- **Note:** this reverses the Phase 0 proposal, which taught the classic picture first. The
  decided rule puts the evidence-based model first.

### coagulation-model: how clotting is described
- **Status:** pending review.
- **Where:** `hemostasis`, the table "Intrinsic vs extrinsic pathway (the lab model) vs the
  cell-based model", and the pathway "Coagulation cascade overview".
- **Evidence-based position:** the cell-based model. Tissue factor starts clotting on cells
  carrying it (initiation). A small amount of thrombin activates platelets and cofactors
  (amplification). A burst of thrombin on the platelet surface converts fibrinogen to fibrin
  (propagation).
- **For your exam:** the intrinsic, extrinsic and common pathways. They are still how PT and
  aPTT are interpreted, and most exams ask for them.

### precapillary-sphincters
- **Status:** open. See recommendation 3 in the next section.

### calcitonin-in-adults
- **Status:** open. See recommendation 4.

### apocrine-secretion-mode
- **Status:** open. See recommendation 5.

## Open items and recommendations

### 1. endocrine-course-tag: which course the endocrine chapter is tagged
- **Status:** open.
- **Question:** schools teach endocrine in either A&P I or A&P II. The map tags it A&P II. The tag
  is only a filter, but it decides which cumulative final includes endocrine.
- **Recommendation:** keep the A&P II tag. Build the cumulative finals and the custom set with an
  "include endocrine" switch, so a student whose A&P I covers endocrine can add it to their
  A&P I final. No other chapter is split this unevenly across schools, so this one switch
  covers the real variation.

### 2. chemistry-kind: which primer topics carry the 60% apply/analyze rule
- **Status:** open.
- **Question:** all eight chemistry and physics primer topics are tagged physiology. That means
  at least 60% of their questions must be at the apply or analyze level.
- **Recommendation:** keep the physiology tag, and so the 60% rule, on the six topics that exist
  to be applied: water and solutions, pH, energy and enzymes, gradients and flow, diffusion and
  osmosis, and voltage. Retag "Atoms, ions and chemical bonds" and "Carbohydrates, lipids,
  proteins and nucleic acids" as mixed. They are mostly vocabulary the rest of the course reads
  with, and forcing 60% application there would produce contrived questions.

### 3. precapillary-sphincters: do they exist in humans?
- **Status:** open (a contested item; will stay pending review once decided).
- **Question:** textbooks describe rings of smooth muscle at the start of each capillary that
  open and close capillary beds. Anatomical evidence for them in most human tissues is thin.
  True sphincters have been shown in some tissues and species, for example in mouse brain.
- **Recommendation:** teach the well-supported mechanism: arterioles set how much blood enters
  a capillary bed. Say that discrete sphincters at capillary entrances have been found in some
  tissues but that their role in humans is unsettled. Add a "For your exam" note: exams expect
  "precapillary sphincters regulate flow into capillary beds." Keep "precapillary sphincter"
  out of the lab practical image sets. It isn't in them now.

### 4. calcitonin-in-adults: how much it matters
- **Status:** open (contested item).
- **Question:** calcitonin lowers blood calcium by inhibiting osteoclasts. That is true, but in
  adult humans its effect is small. People with no thyroid, and so no calcitonin, keep normal
  calcium, and so do people with calcitonin-secreting tumors.
- **Recommendation:** teach PTH and calcitriol as the main regulators of blood calcium, and
  calcitonin as a minor one in adults (it may matter more in childhood, pregnancy and
  breastfeeding). The calcium loop builder keeps calcitonin as the effector for "calcium high", labeled minor. Add
  a "For your exam" note: exams expect calcitonin as the hormone that lowers blood calcium.

### 5. apocrine-secretion-mode: how apocrine sweat glands secrete
- **Status:** open (contested item).
- **Question:** "apocrine" names both a mode of secretion (part of the cell pinches off) and a
  type of sweat gland. Electron microscopy shows these glands release their secretion mainly by
  exocytosis, the merocrine mode, with pinching-off at most a minor part.
- **Recommendation:** keep the gland's standard name, "apocrine sweat gland", and say plainly
  that it is a historical name: these glands release mostly by exocytosis. Use the mammary gland's
  release of lipid droplets as the example of apocrine secretion. Add a "For your exam" note:
  many exams give apocrine sweat glands as the example of apocrine secretion.

### 6. openstax-toc-offline: verify coverage against the live OpenStax contents
- **Status:** open.
- **Question:** the Phase 0 coverage review compared the map with OpenStax A&P 2e from the
  reviewer's knowledge. This environment's network policy blocks openstax.org.
- **Recommendation:** add `openstax.org` to the allowed domains in this cloud environment's
  settings. From the session's title bar, open the environment menu, choose Edit, then change
  Network access. Then I re-run the section-by-section comparison before any Phase 1 content is
  written. Allowing openstax.org also lets Phase 1 fetch the figures, attribute them, and run the
  OpenStax wording-similarity check (spec section 2). That check needs the OpenStax text to
  compare against, so it can't run without this.

### 7. teas-even-split: how 18 questions divide "evenly"
- **Status:** open. This question comes from Phase 0 decision 3.
- **Question:** the TEAS 7 blueprint names about a dozen A&P areas: general anatomy and
  physiology, plus the respiratory, cardiovascular, digestive, nervous, muscular, reproductive,
  integumentary, endocrine, urinary, immune and skeletal systems. 18 does not divide evenly by 12,
  and I couldn't check the exact list against ATI from here.
- **Recommendation:** give each blueprint area one question (12), and give the remaining 6 to
  different areas on each attempt, rotating, so that across attempts every area gets the same
  share. Confirm the area list against ATI's current TEAS 7 blueprint when the network allows,
  before building TEAS mode in Phase 2.

## Decided at the Phase 0 review

These are recorded in the spec's decisions log (section 19) and kept here so the history stays in
one place.

- **pilot-forward-links:** no "coming soon" pages. A term shows as plain text with its glossary
  hover until its teaching page exists; then the map adds the link automatically.
- **course-slug:** `/anatomy-physiology/`.
- **teas-weighting:** split the 18 questions evenly across the TEAS 7 blueprint systems, and label
  the mode as an estimate. The divisibility detail is item 7 above.
- **contested-science rule:** see the top of this file.
- **receptor-two-meanings:** prose says "sensory receptor" or "receptor protein"; the loop builder
  slot reads "Receptor (sensor)".
