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

### precapillary-sphincters: flow into capillary beds
- **Status:** pending review. Position approved at the Phase 0 follow-up review.
- **Where:** `vessel-structure`, `capillary-exchange`, `autoregulation-local`.
- **Evidence-based position:** arterioles set how much blood enters a capillary bed. Discrete
  sphincters at capillary entrances have been shown in some tissues and species, for example
  mouse brain, but anatomical evidence for them in most human tissues is thin, so their role in
  humans is unsettled.
- **For your exam:** exams expect "precapillary sphincters regulate flow into capillary beds."
- **Also:** "precapillary sphincter" stays out of the lab practical image sets.

### calcitonin-in-adults: how much it matters
- **Status:** pending review. Position approved at the Phase 0 follow-up review.
- **Where:** `bone-calcium`, `thyroid-parathyroid`, `calcium-phosphate-balance`, the blood calcium
  feedback loops.
- **Evidence-based position:** PTH and calcitriol are the main regulators of blood calcium.
  Calcitonin lowers blood calcium by inhibiting osteoclasts, but in adults its effect is small:
  people without a thyroid, and people with calcitonin-secreting tumors, both keep normal
  calcium. It may matter more in childhood, pregnancy and breastfeeding.
- **For your exam:** exams expect calcitonin as the hormone that lowers blood calcium.
- **Also:** the calcium loop builder keeps calcitonin as the effector for "calcium high",
  labeled minor.

### apocrine-secretion-mode: how apocrine sweat glands secrete
- **Status:** pending review. Position approved at the Phase 0 follow-up review.
- **Where:** `glands`, `skin-accessory`, `mammary-glands`.
- **Evidence-based position:** "apocrine sweat gland" is a historical name. Electron microscopy
  shows these glands release their secretion mainly by exocytosis (the merocrine mode). The
  mammary gland's release of lipid droplets is the example of true apocrine secretion.
- **For your exam:** many exams give apocrine sweat glands as the example of apocrine secretion.

## Open items

None. Items that come up during Phase 1 go here.

## Decided at the Phase 0 reviews

These are recorded in the spec's decisions log (section 19) and kept here so the history stays in
one place.

- **pilot-forward-links:** no "coming soon" pages. A term shows as plain text with its glossary
  hover until its teaching page exists; then the map adds the link automatically.
- **course-slug:** `/anatomy-physiology/`.
- **teas-weighting:** split the 18 questions evenly across the TEAS 7 blueprint areas, and label
  the mode as an estimate.
- **contested-science rule:** see the top of this file.
- **receptor-two-meanings:** prose says "sensory receptor" or "receptor protein"; the loop builder
  slot reads "Receptor (sensor)".
- **endocrine-course-tag** (follow-up review): endocrine stays tagged A&P II. The cumulative
  finals and the custom set get an "include endocrine" switch.
- **chemistry-kind** (follow-up review): "Atoms, ions and chemical bonds" and "Carbohydrates,
  lipids, proteins and nucleic acids" are retagged mixed. The other six primer topics stay
  physiology and keep the 60% apply/analyze rule.
- **openstax-toc-offline** (follow-up review): done. openstax.org is reachable, and coverage was
  rechecked against the live OpenStax A&P 2e contents: all 169 sections' learning objectives
  and all 3,190 chapter key terms. The fixes are in the dependency map.
- **teas-even-split** (follow-up review): **confirmed.** The project owner checked ATI's official
  TEAS 7 content outline: 18 scored A&P questions across 12 areas. The areas are general
  orientation of human anatomy, respiratory, cardiovascular, digestive, nervous, muscular, male
  and female reproductive, integumentary, endocrine, urinary, immune, and skeletal. Each area
  gets one question, and the remaining 6 rotate across areas from attempt to attempt. Only the
  area names are used; ATI prohibits redistributing the outline, so it is not in the repo or
  on the site. (atitesting.com served only a maintenance page from this environment, and the
  copy of the outline the owner found is on a domain the network policy blocks, so the
  confirmation comes from the owner's own check of the document.)
