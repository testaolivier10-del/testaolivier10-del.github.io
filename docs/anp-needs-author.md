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
- **Lymph volume (added in Phase 2, `lymphatic-system`):** about 8 L/day enters the lymphatic capillaries; the nodes return up to half of it, so about 3–4 L/day reaches the veins. For your exam: about 3 L/day (the 10–15% of filtrate not reabsorbed).

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

### osmosis-mechanism: how water crosses a membrane
- **Status:** pending review. Applied in the Phase 1 pilot (spec decision 49).
- **Where:** `diffusion-osmosis`, `passive-transport`, later `fluid-compartments`.
- **Evidence-based position:** osmotic water flow through membrane pores (including aquaporins)
  is pressure-driven bulk flow. The solute the membrane holds back lowers the water pressure in
  the pores on its side, and water streams toward it. It is not water diffusing down its own
  concentration gradient, and not solute "binding" water (Kramer & Myers, Am J Phys 2012).
  "Water follows solute" is taught as the working rule.
- **For your exam:** many textbooks and exams define osmosis as the diffusion of water from
  higher to lower water concentration. It predicts the same direction.

### atp-yield: ATP per glucose
- **Status:** pending review.
- **Where:** `cellular-respiration` (For your exam note; caption of OpenStax Figure 24.6, which
  prints "about 36"), later `carbohydrate-metabolism`.
- **Evidence-based position:** about 30–32 ATP per glucose: about 2.5 per NADH and 1.5 per
  reduced FAD, counting the proton cost of exporting ATP from the mitochondrion (Hinkle 2005).
- **For your exam:** many textbooks and exams still say 36 or 38.

### glia-ratio: glial cells vs neurons
- **Status:** pending review.
- **Where:** `nervous-tissue-overview` (notes aside, question 17), later `neurons-glia`.
- **Evidence-based position:** direct counts find about 86 billion neurons and a similar number
  of other cells, most of them glia: near 1:1 overall, varying widely by region (Azevedo 2009;
  von Bartheld 2016).
- **For your exam:** many texts say glia outnumber neurons about 10 to 1.

### cholesterol-source: where the body's cholesterol is made
- **Status:** pending review.
- **Where:** `biomolecules`, later `lipid-protein-metabolism`.
- **Evidence-based position:** the body makes most of its cholesterol, and nearly every cell can
  make some; in humans the liver makes roughly 10% of it, though the liver dominates uptake and
  clearance (Dietschy & Turley 2002).
- **For your exam:** many texts say "the liver makes most (about 80%) of your cholesterol". A
  For your exam note giving that answer is now in `lipid-protein-metabolism` (Phase 2); the ~10%
  human figure is described there as an estimate extrapolated from animal measurements.

### adult-neurogenesis: do adult human brains make new neurons?
- **Status:** pending review.
- **Where:** `nervous-tissue-overview` (going-further box), later `neurons-glia`.
- **Position taught:** mature neurons do not divide; whether new neurons form in adult human
  brains (for example in the hippocampus) is presented as unsettled, because recent studies
  disagree.

### exercise-acidosis-and-lactate
- **Status:** pending review.
- **Where:** `cellular-respiration`, later `muscle-metabolism`.
- **Position taught:** lactate is a fuel, not a waste, and not the cause of soreness a day or two
  later. The acid of hard exercise comes from the whole process of splitting glucose and
  spending ATP; what causes fatigue is still debated (going-further box).
- **For your exam:** many exams still say "lactic acid buildup causes fatigue and soreness".

### long-term-blood-pressure: how much the kidneys set it
- **Status:** pending review.
- **Where:** `bp-long-term`.
- **Position taught:** the kidneys set long-term blood pressure mainly through pressure
  natriuresis (the Guyton model), hedged with "mainly"; how much long-term sympathetic activity
  also contributes is debated.

### internodal-pathways: specialized atrial routes
- **Status:** pending review.
- **Where:** `conduction-system`.
- **Position taught:** preferred routes through atrial muscle, not insulated tracts like the
  bundle branches; whether they exist as separate tracts is disputed.

### facial-vein-valves: the "danger triangle"
- **Status:** pending review (audit of topics 103–110 in progress).
- **Where:** `systemic-veins`.
- **Evidence-based position:** facial and ophthalmic veins do have valves (Zhang & Stringer
  2010), although infection can still spread toward the cavernous sinus.
- **For your exam:** many texts say facial veins are valveless.

### oxytocin-in-labor: is oxytocin needed for labor to progress?
- **Status:** pending review.
- **Where:** `homeostasis-feedback` (childbirth loop), the feedback loop builder's childbirth
  failure question, later `labor-birth`.
- **Evidence-based position:** oxytocin strengthens contractions through the positive feedback
  loop, but labor can still start and progress without it: mice lacking oxytocin or its receptor
  give birth normally (Nishimori 1996; Takayanagi 2005), and women with little oxytocin have had
  normal spontaneous labor. The failure question's key is "this loop could no longer drive the
  contractions harder", with a note that hospitals give oxytocin when contractions are weak.
- **For your exam:** many textbooks say that without oxytocin, labor stalls or progresses slowly.

### co-cherry-red: skin color in carbon monoxide poisoning
- **Status:** pending review.
- **Where:** `o2-transport`.
- **Evidence-based position:** cherry-red skin is real but rare in living patients; it is mostly
  seen late or after death. Normal skin color does not rule out poisoning.
- **For your exam:** many texts list cherry-red skin as the classic sign.

### respiratory-rhythm-generator: where the breathing rhythm starts
- **Status:** pending review.
- **Where:** `breathing-control`.
- **Evidence-based position:** the pre-Bötzinger complex in the ventral respiratory group is the
  likely rhythm generator; an apneustic center has not been clearly identified in humans.
- **For your exam:** the textbook model of a dorsal respiratory group pacing breathing, with
  apneustic and pneumotaxic centers in the pons.

### quiet-inspiration-muscles: which muscles work in a quiet breath
- **Status:** pending review.
- **Where:** `ventilation-mechanics`.
- **Evidence-based position:** the diaphragm does most of the work; electrical recordings show the
  scalenes and parasternal intercostals are active in most quiet breaths too.
- **For your exam:** the classic list, diaphragm plus external intercostals.

### pediatric-narrowest-airway: where a child's airway is narrowest
- **Status:** pending review.
- **Where:** `upper-airway` (croup going-further box).
- **Evidence-based position:** imaging shows the glottis or the region just below it is narrowest
  in cross-section; the cricoid ring is the narrowest part that cannot stretch.
- **For your exam:** many texts and airway courses say a child's airway is funnel-shaped and
  narrowest at the cricoid. Decide whether a For your exam note is wanted.

### trigger-zone: where action potentials start
- **Status:** pending review.
- **Where:** `neurons-glia`, `action-potential`, `synapses`.
- **Evidence-based position:** action potentials start in the axon initial segment, just beyond the axon hillock, where voltage-gated sodium channels are densest (about 50 times the dendrites). The course teaches the initial segment as the trigger zone.
- **For your exam:** many texts and exams name the axon hillock. If a question offers only "axon hillock", choose it.

### ssri-serotonin: how SSRIs help depression
- **Status:** pending review.
- **Where:** `synapses`.
- **Evidence-based position:** SSRIs block serotonin reuptake and raise synaptic serotonin within hours, but the benefit takes weeks. The simple "depression is low serotonin" model is not supported by current evidence (Moncrieff 2022), and how SSRIs help is still being worked out.
- **For your exam:** many nursing and TEAS materials link depression to low serotonin and say SSRIs work by raising it.

### csf-outflow: where cerebrospinal fluid leaves
- **Status:** pending review.
- **Where:** `brain-protection`, lab practical (arachnoid granulations).
- **Evidence-based position:** CSF leaves by several routes: arachnoid granulations into the venous sinuses, along nerve sheaths (notably through the cribriform plate) to lymph nodes in the neck, and into lymphatic vessels in the dura. How much each carries in adult humans is not settled. The glymphatic system is not taught.
- **For your exam:** CSF is reabsorbed into venous blood through the arachnoid granulations in the superior sagittal sinus.

### remote-memory-hippocampus: do old memories need the hippocampus?
- **Status:** pending review.
- **Where:** `higher-functions`, predict (hippocampi removed).
- **Evidence-based position:** the hippocampus is needed to form new declarative memories. Old general knowledge becomes independent of it; whether vivid personal episodes ever do is debated (standard consolidation vs multiple-trace theories). H.M. kept old general knowledge but could re-experience few detailed personal episodes.
- **For your exam:** H.M. could not form new memories but kept his old ones; long-term memories are stored in the cortex.

### language-model: Broca, Wernicke and the arcuate fasciculus
- **Status:** pending review.
- **Where:** `higher-functions`.
- **Evidence-based position:** language depends on distributed frontal, temporal and parietal networks linked by dorsal and ventral white-matter streams. Damage limited to Broca's area often causes a milder, transient deficit. The classic model is taught as a simplification that still predicts the main clinical patterns, with the network caveat.
- **For your exam:** Broca's area = expressive aphasia, Wernicke's area = receptive aphasia, arcuate fasciculus = conduction aphasia.

### working-memory-capacity: how many items
- **Status:** pending review.
- **Where:** `higher-functions`.
- **Evidence-based position:** when rehearsal and chunking are prevented, working memory holds about 3 to 5 chunks (Cowan).
- **For your exam:** 7 plus or minus 2 items (Miller 1956).

### sleep-staging: N1–N3 or stages 1–4
- **Status:** pending review.
- **Where:** `higher-functions`.
- **Evidence-based position:** since 2007 the AASM scores N1, N2 and N3 (slow-wave sleep) plus REM; the old stages 3 and 4 are merged into N3.
- **For your exam:** older texts list four non-REM stages, with 3 and 4 as slow-wave sleep.

### root-overlap: what cutting one spinal root does
- **Status:** pending review.
- **Where:** `spinal-cord`, `spinal-nerves`, predict, lab practical, flashcards.
- **Evidence-based position:** neighboring dorsal roots overlap in the skin they supply, and most muscles get motor axons from two or more ventral roots. Cutting one dorsal root dulls sensation in its band; the band goes fully numb only when the roots above and below are cut too. Cutting one ventral root weakens its muscles rather than paralyzing them.
- **For your exam:** dorsal root cut = sensory loss in its dermatome, ventral root cut = paralysis. Pick the sensory-only or motor-only answer; the direction is what they test.

### accessory-nerve-roots: does the accessory nerve have a cranial root?
- **Status:** pending review.
- **Where:** `cranial-nerves`, lab practical (cranial nerves set).
- **Evidence-based position:** the accessory nerve is the spinal root alone, from about C1 to C5 or C6, rising through the foramen magnum; the so-called cranial root is part of the vagus.
- **For your exam:** many texts give it a cranial root (medulla, to throat and palate) and a spinal root. Give both if asked.

### referred-pain-mechanism: why organ pain is felt in the skin
- **Status:** pending review.
- **Where:** `sensory-pathways`.
- **Evidence-based position:** convergence of organ and skin sensory axons on shared dorsal horn neurons is taught as the best-supported main mechanism; branching sensory axons and central sensitization are noted as other proposed mechanisms.
- **For your exam:** convergence (convergence-projection theory); no conflict expected.

### tendon-reflex-role: what the Golgi tendon organ reflex is for
- **Status:** pending review.
- **Where:** `reflexes`.
- **Evidence-based position:** it acts at ordinary forces as part of moment-to-moment force control, and its sign can reverse to excitation during walking.
- **For your exam:** many textbooks say it protects the muscle and tendon from tearing under too much tension.

### tia-definition: what counts as a transient ischemic attack
- **Status:** pending review.
- **Where:** `neuro-exam`.
- **Evidence-based position:** a brief episode of neurological dysfunction from ischemia with no acute infarction on imaging, and no time limit (AHA/ASA 2009).
- **For your exam:** many texts still say symptoms resolve within 24 hours.

### gcs-wording: Glasgow Coma Scale terms
- **Status:** pending review.
- **Where:** `neuro-exam`, calculators (GCS).
- **Evidence-based position:** current terms are used: "to sound", "to pressure", "normal flexion" and "abnormal flexion" (Teasdale 2014). "GCS 8, intubate" is taught as a prompt, not a rule.
- **For your exam:** older terms ("to speech", "to pain", "withdrawal", "decorticate/decerebrate") and "GCS 8, intubate".

### active-cutaneous-vasodilation: why skin vessels widen in heat
- **Status:** pending review.
- **Where:** `ans-control` (going-further box), later thermoregulation.
- **Evidence-based position:** in hairy skin about 80–90% of the heat-induced rise in skin blood flow comes from active widening by sympathetic cholinergic nerves (cotransmitters and nitric oxide, not ACh itself). In the hairless skin of the palms, soles and lips it comes from withdrawal of sympathetic constrictor tone.
- **For your exam:** many texts say skin vessels widen in heat only because sympathetic tone falls.

### parasympathetic-sphincter-relaxation: how gut and bladder sphincters relax
- **Status:** pending review.
- **Where:** `ans-signaling` (organ table), `ans-control`.
- **Evidence-based position:** parasympathetic relaxation of gut and bladder-outlet sphincters comes mainly from nitric oxide (with VIP and ATP) released by parasympathetic and enteric inhibitory neurons, not from ACh on muscarinic receptor proteins, which contracts smooth muscle.
- **For your exam:** pharmacology tables list sphincter relaxation as a muscarinic (M3) effect, so exams may expect "muscarinic".

### tongue-map: are tastes zoned on the tongue?
- **Status:** pending review.
- **Where:** `chemical-senses`.
- **Evidence-based position:** all five taste qualities are detected wherever there are taste buds; regional differences in sensitivity are small.
- **For your exam:** older worksheets and exams place bitter at the back of the tongue.

### glaucoma-definition: pressure or optic nerve damage?
- **Status:** pending review.
- **Where:** `vision`.
- **Evidence-based position:** glaucoma is damage to the optic nerve. Raised eye pressure from poor drainage of aqueous humor is the main treatable risk factor, not the definition: normal-pressure glaucoma exists, and many people with raised pressure never develop it.
- **For your exam:** increased pressure inside the eye, from poor drainage of aqueous humor, that damages the optic nerve.

### rinne-labels: what a "positive" Rinne test means
- **Status:** pending review.
- **Where:** `hearing-balance`.
- **Evidence-based position:** the notes explain the test by what is heard (air conduction louder than bone conduction is normal) and flag that "positive" means normal.
- **For your exam:** "Rinne positive" = normal or sensorineural loss; "Rinne negative" = conductive loss.

### blood-temperature: 38 °C or 37 °C?
- **Status:** pending review.
- **Where:** `blood-composition`.
- **Evidence-based position:** blood deep in the trunk is at core temperature, about 37 °C; pulmonary artery blood is the clinical reference for core temperature.
- **For your exam:** many textbooks, OpenStax included, give 38 °C (100.4 °F).

### heparin-natural-anticoagulant: is heparin one of the body's own anticoagulants?
- **Status:** pending review.
- **Where:** `hemostasis`.
- **Evidence-based position:** heparin is stored in mast cell (and basophil) granules and is not normally in plasma. The heparin-like molecules (heparan sulfate) on the vessel lining are what speed antithrombin.
- **For your exam:** many textbooks list heparin from basophils and mast cells as a natural anticoagulant.

### universal-donor: universal donor and recipient
- **Status:** pending review.
- **Where:** `blood-typing`.
- **Evidence-based position:** O-negative red cells are given when there is no time to type; otherwise hospitals give type-specific, crossmatched blood. "Universal recipient" (AB positive) is an exam term, rarely used in practice. For plasma, AB is the universal donor.
- **For your exam:** O negative = universal donor; AB positive = universal recipient.

### stress-exhaustion-stage: do the adrenals wear out under stress?
- **Status:** pending review.
- **Where:** `adrenal-glands`.
- **Evidence-based position:** under ordinary chronic stress the adrenal glands do not wear out; cortisol stays normal or high or its daily rhythm flattens, and harm comes from long exposure to stress hormones. "Adrenal fatigue" is not a recognized diagnosis (Cadegiani & Kater 2016).
- **For your exam:** the stage of exhaustion is when resources are depleted and resistance fails.

### adrenal-androgens-sex-drive: do adrenal androgens drive adult sex drive?
- **Status:** pending review.
- **Where:** `adrenal-glands`.
- **Evidence-based position:** the clear roles are pubic and underarm hair at puberty and serving as precursors for stronger androgens and estrogens; DHEA replacement trials show no significant effect on women's sexual function. The page still teaches the textbook role; an author should decide.
- **For your exam:** many textbooks say adrenal androgens contribute to sex drive in women.

### calcitonin and oxytocin (see above)
- **Status:** pending review.
- **Where:** `thyroid-parathyroid`, `hypothalamus-pituitary`.
- **Evidence-based position:** the calcitonin-in-adults and oxytocin-in-labor positions are applied in the endocrine chapter too (thyroid-parathyroid, hypothalamus-pituitary and the tools).
- **For your exam:** as in those entries.

### th-subsets: which helper T cells help B cells?
- **Status:** pending review.
- **Where:** `cell-mediated-immunity`, `antibody-immunity`, `immune-disorders`.
- **Evidence-based position:** follicular helper T cells in germinal centers give most of the help B cells need for high-affinity, class-switched antibody; Th2 cytokines (IL-4, IL-5, IL-13) steer responses toward IgE, eosinophils and worm expulsion; Th17 cells recruit neutrophils at barrier surfaces.
- **For your exam:** many texts teach only Th1 (cell-mediated) and Th2 (help for B cells). If only those are offered for "helps B cells", the answer is Th2.

### hypersensitivity-classification: four types or more?
- **Status:** pending review.
- **Where:** `immune-disorders`.
- **Evidence-based position:** Gell and Coombs types I–IV are the taught scheme, noting that real diseases mix types; stimulating or blocking antibodies (Graves disease, myasthenia gravis) are taught as type II. Some texts call them "type V", and the 2023 EAACI nomenclature splits type IV and uses V–VII for other mechanisms.
- **For your exam:** four types, with Graves disease and myasthenia gravis under type II.

### tonsillectomy-long-term: does removing tonsils weaken immunity?
- **Status:** pending review.
- **Where:** `lymphatic-system`.
- **Evidence-based position:** no major lasting drop in antibody levels; a large Danish cohort linked childhood removal with more later respiratory, allergic and infectious disease, but causation is unproven. Taught as an open question.
- **For your exam:** removing the tonsils does not meaningfully weaken immunity, because other MALT compensates.

### intestinal-surface-area: how large is the gut's absorptive surface?
- **Status:** pending review.
- **Where:** `small-intestine`.
- **Evidence-based position:** about 30 m², measured directly (Helander & Fändriks 2014): folds multiply the surface about 1.6 times and villi plus microvilli 60–120 times, roughly 100–200-fold in all. The 600-fold figure appears only as a labeled textbook estimate.
- **For your exam:** 200–300 m², "a tennis court".

### small-intestine-length: how long is the small intestine?
- **Status:** pending review.
- **Where:** `small-intestine`, `large-intestine`.
- **Evidence-based position:** 3–5 m in a living person; about 6 m after death, when muscle tone is lost.
- **For your exam:** about 6 m (20 ft).

### vomiting-center: is there one vomiting center?
- **Status:** pending review.
- **Where:** `stomach`.
- **Evidence-based position:** vomiting is coordinated by a network of neurons across the medulla, fed by the chemoreceptor trigger zone and other inputs.
- **For your exam:** "the vomiting center in the medulla oblongata".

### preduodenal-lipase: which lipase digests fat before the small intestine?
- **Status:** pending review.
- **Where:** `mouth-esophagus`, `stomach`, `digestion-absorption`.
- **Evidence-based position:** in humans lingual lipase is only a trace; gastric lipase does the fat digestion before the small intestine (roughly 10–30% of it in adults, more in milk-fed babies).
- **For your exam:** many texts credit lingual lipase in saliva.

### bacteria-human-ratio: how many bacteria per human cell?
- **Status:** pending review.
- **Where:** `large-intestine`.
- **Evidence-based position:** about 38 trillion bacteria to 30 trillion human cells, roughly 1:1 (Sender, Fuchs & Milo 2016).
- **For your exam:** 10:1.

### peptide-absorption: in what form is protein absorbed?
- **Status:** pending review.
- **Where:** `digestion-absorption`.
- **Evidence-based position:** a large share, perhaps most, enters the absorptive cells as di- and tripeptides on the PepT1 carrier and is split inside the cell, so the blood receives free amino acids.
- **For your exam:** "absorbed as amino acids" (still right for what reaches the blood).

### ketone-levels: how high ketones go
- **Status:** pending review.
- **Where:** `lipid-protein-metabolism`, `absorptive-postabsorptive`, `acid-base-disorders`.
- **Evidence-based position:** nutritional ketosis about 0.5–3 mmol/L; prolonged fasting about 5–7 mmol/L with normal pH, because insulin is still present; ketoacidosis at 3 mmol/L or more with acidosis, often 5–10 or more (2024 consensus).
- **For your exam:** texts often give a single cutoff (ketosis below 3, ketoacidosis above). Pair the level with the pH and insulin state.

### brain-fatty-acids: can the brain use fatty acids?
- **Status:** pending review.
- **Where:** `lipid-protein-metabolism`, `absorptive-postabsorptive`, `pancreas-glucose`.
- **Evidence-based position:** fatty acids cross into the brain, but neurons oxidize very little of them; astrocytes oxidize some. The course teaches "the brain burns little fatty acid", not "it cannot take them up".
- **For your exam:** many texts say fatty acids cannot cross the blood–brain barrier, so the brain cannot use them.

### hdl-marker: is HDL protective?
- **Status:** pending review.
- **Where:** `lipid-protein-metabolism`.
- **Evidence-based position:** high HDL goes with lower risk, but genetic studies and drug trials show raising HDL does not itself lower risk; HDL is taught as a marker, LDL as causal.
- **For your exam:** HDL is "good cholesterol" that protects against heart disease.

### dietary-guidelines-icon: plate or pyramid?
- **Status:** pending review.
- **Where:** `energy-balance-thermoregulation`.
- **Evidence-based position:** the 2025–2030 U.S. edition (January 2026) returns to a food pyramid; MyPlate (2011) was the previous icon. The page shows MyPlate (the only OpenStax figure) and says so. An author should verify the new pyramid's layout and advice on dietaryguidelines.gov before the page describes them.
- **For your exam:** most current textbooks and the TEAS were written in the MyPlate era and may expect the plate.

### 3500-kcal-rule: a pound of fat
- **Status:** pending review.
- **Where:** `energy-balance-thermoregulation`.
- **Evidence-based position:** about 3,500 kcal is the energy in a pound of adipose tissue, but weight change is not linear: early loss is larger (glycogen and water) and over months the rule overestimates, because energy use adapts (Hall 2011).
- **For your exam:** 3,500 kcal = 1 lb, so a 500 kcal/day deficit loses 1 lb a week.

### fasting-brain-fuel-day3: how much glucose the brain uses on day 3 of a fast
- **Status:** pending review.
- **Where:** predict tool (long-fast scenario), fasting graph.
- **Evidence-based position:** by about day 3.5, ketone bodies supply about a quarter of the brain's energy and cortical glucose use has fallen about a quarter (Hasselbalch 1994). The tool still keys day-3 brain glucose as "no change" (about 120 g); the auditor recommends keying it "down" and lowering the graph's day-3 point to about 95–100 g. Not applied; author to decide.
- **For your exam:** the brain uses about 120 g of glucose a day until it switches to ketones over weeks.

### micturition-center: where the voiding reflex is controlled
- **Status:** pending review.
- **Where:** `kidney-anatomy`, `ans-control`.
- **Evidence-based position:** in healthy adults a center in the pons switches the bladder from storing to emptying, under cortical control; the sacral cord (S2–S4) carries the reflex out. A purely spinal reflex appears mainly after cord injury and does not coordinate the sphincters. The external sphincter relaxes first and the detrusor contracts seconds later.
- **For your exam:** "integrated in the sacral spinal cord (S2–S4)".

### female-internal-sphincter: is there a female internal urethral sphincter?
- **Status:** pending review.
- **Where:** `kidney-anatomy`.
- **Evidence-based position:** females have no distinct ring; the bladder-neck muscle acts as a functional sphincter, and the external sphincter and pelvic floor do more of the holding.
- **For your exam:** many texts draw an internal sphincter in both sexes.

### inner-medulla-mechanism: how the inner medulla concentrates urine
- **Status:** pending review.
- **Where:** `urine-concentration`.
- **Evidence-based position:** the outer medulla's pumping is not in doubt; the classic account of passive salt loss from the thin ascending limb, driven by urea, has not been fully supported by permeability measurements. Taught in a going-further box.
- **For your exam:** the classic countercurrent multiplier, which the page also teaches.

### glomerular-barrier: size or charge?
- **Status:** pending review.
- **Where:** `glomerular-filtration`.
- **Evidence-based position:** size is taught as the main barrier and the role of charge as still debated; a trace of albumin is filtered and reclaimed by the proximal tubule; which layer holds back albumin is debated.
- **For your exam:** many texts say the negatively charged basement membrane repels albumin.

### water-reabsorption-split: obligatory and facultative water
- **Status:** pending review.
- **Where:** `tubular-transport`, calculators.
- **Evidence-based position:** about 80–85% obligatory and 15–20% facultative, with a sentence noting that some texts use 90/10.
- **For your exam:** 90% obligatory, 10% facultative (Tortora).

### autoregulation-range: blood pressure page wording (suggestion for the owner-reviewed page)
- **Status:** pending review.
- **Where:** `bp-short-term` (pilot, not edited).
- **Evidence-based position:** bp-short-term gives organ autoregulation as about 60–150 mm Hg and names the kidneys; the kidney's GFR plateau is about 80–180. Suggested optional phrase after "60 to 150 mm Hg": "(the exact range differs between organs; in the kidney it runs a little higher, about 80 to 180)".
- **For your exam:** n/a (wording).

### hypernatremia-correction-rate: how fast chronic hypernatremia may be corrected
- **Status:** pending review.
- **Where:** `electrolyte-balance` (hypernatremia paragraph; comparison table row "Danger of correcting a chronic case too fast").
- **Evidence-based position:** brain swelling from fast correction of chronic hypernatremia is well documented in infants and children. In adults, observational data (Chauhan et al., CJASN 2019, and later hospital cohorts) show no cerebral edema or excess deaths with faster correction, and slow correction may be linked to worse outcomes. The page teaches the brain-adaptation mechanism, says the harm is shown mainly in children and less clearly in adults, and keeps the usual advice of lowering sodium by no more than about 10 mmol/L a day.
- **For your exam:** correct chronic hypernatremia slowly (about 0.5 mmol/L an hour, 10 to 12 mmol/L a day), because fast correction causes cerebral edema.

### albumin-adjusted-calcium: how far to trust "corrected" calcium
- **Status:** pending review.
- **Where:** `electrolyte-balance` (worked example 4; question 14).
- **Evidence-based position:** the adjustment (measured calcium + 0.8 × (4.0 − albumin)) is taught as a rough bedside estimate that misclassifies most often when albumin is low, where it can hide a real hypocalcemia; ionized calcium, measured directly, is the reference. Some laboratory bodies now advise against reporting "corrected" calcium; the auditor saw a reported 2026 IFCC/EFLM/IOF statement only through search summaries, so it needs verifying.
- **For your exam:** nursing and A&P exams still expect the formula, and a normal adjusted value read as "normal calcium".

### dehydration-terminology: what "dehydration" means
- **Status:** pending review.
- **Where:** `fluid-compartments-water` (notes Hypovolemia and Dehydration sections and For your exam note, lesson misconception, questions 11 and 12); `electrolyte-balance` (hypernatremia).
- **Evidence-based position:** the physiological split is kept. Hypovolemia is salt and water lost together, with osmolality about normal, so only the ECF shrinks; dehydration in the strict sense is water lost in excess of solute, so osmolality and sodium rise and the ICF shrinks too. Vomiting and most diarrhea are taught as mostly isotonic volume losses, with a hedge that some diarrheas (osmotic diarrhea, gastroenteritis in children) lose more water than salt.
- **For your exam:** many nursing texts use "dehydration" for any fluid loss and divide it into isotonic, hypertonic and hypotonic dehydration, so an exam may call a diarrhea-induced volume loss "isotonic dehydration". The page tells students to read how the question uses the word.

### main-intracellular-buffer: proteins or phosphate?
- **Status:** pending review.
- **Where:** `acid-base-regulation` (protein buffers, For your exam note).
- **Evidence-based position:** inside cells, proteins and phosphates (organic phosphates such as ATP and 2,3-BPG, plus inorganic phosphate) buffer together, and proteins supply the larger share, because most body protein is inside cells (Guyton and Hall). Texts genuinely split: many A&P texts stress phosphate.
- **For your exam:** many A&P textbooks call the phosphate buffer the main intracellular buffer. If both are offered, give the answer your course textbook gives.

### fully-compensated: can compensation return pH to normal?
- **Status:** pending review.
- **Where:** `acid-base-disorders` (Compensation, For your exam note; worked example 8; questions 4 and 21), ABG interpreter.
- **Evidence-based position:** compensation seldom brings pH all the way back to normal; the main exception is respiratory alkalosis lasting days to weeks. A normal pH with both PaCO2 and bicarbonate well outside their ranges suggests two disorders at once, checked against expected-compensation rules (Winter's formula and similar, in a going-further box).
- **For your exam:** nursing and paramedic exams call any gas with both numbers abnormal and a pH of 7.35 to 7.45 "fully compensated", naming the primary disorder from the side of 7.40 the pH sits on. Use that label when asked.

### lactiferous-sinuses: do breast ducts have milk-storing sinuses?
- **Status:** pending review.
- **Where:** `female-anatomy` (notes Mammary glands and For your exam note; glossary mammary glands; question 14's explanations; Figure 27.17 caption).
- **Evidence-based position:** ultrasound of lactating breasts (Ramsay et al., J Anat 2005) found about 9 duct openings per nipple rather than 15 to 20, ducts that are small, easily compressed and branch close to the nipple, and no sinuses; the ducts widen only briefly during milk ejection, so milk is not stored in the ducts near the nipple. The page describes the sinus as the older textbook description; the figure's printed label is kept and the caption calls it the textbook name.
- **For your exam:** many textbooks say each breast has 15 to 20 lobes, each drained by a lactiferous duct that widens into a lactiferous sinus under the areola, where milk is stored. If asked where milk collects before leaving the nipple, the expected answer is the lactiferous sinuses.

### menstruation-mechanism: what causes the functional layer to be shed?
- **Status:** pending review.
- **Where:** `female-hormones-cycle` (notes Menstrual phase and For your exam note; question 10; glossary uterine cycle; lesson chain).
- **Evidence-based position:** progesterone withdrawal when the corpus luteum dies sets off a local inflammatory response: prostaglandins, chemokines and invading white blood cells, and matrix metalloproteinases that digest the functional layer (Critchley et al., Physiol Rev 2020). Spasm of the coiled (spiral) arteries contributes but is not the main driver; the classic ischemia account goes back to Markee (1940).
- **For your exam:** many textbooks explain menstruation mainly as spasm of the coiled arteries starving the functional layer until it dies. If asked what causes menstruation, answer that falling progesterone, when the corpus luteum dies, causes the functional layer to break down and be shed.

### puberty-onset: gonadostat or central restraint?
- **Status:** pending review.
- **Where:** `female-hormones-cycle` (notes Puberty and For your exam note; glossary puberty).
- **Evidence-based position:** puberty starts mainly because a central restraint on the GnRH pulse generator is lifted, with kisspeptin-releasing neurons central to the reawakening and leptin acting as a permissive signal (Plant, Front Neuroendocrinol 2015). Children without working gonads still show the pubertal rise in FSH and LH at the usual age (Conte, Grumbach et al. 1975). Reduced sensitivity to sex-steroid negative feedback happens too, but is not the main cause.
- **For your exam:** many textbooks explain puberty as the hypothalamus and pituitary becoming less sensitive to negative feedback from the sex hormones (the gonadostat model). If asked why hormone levels rise at puberty, "decreased sensitivity of the hypothalamus to negative feedback" is the expected answer.

### testosterone-sex-drive-women: does testosterone drive women's sex drive?
- **Status:** pending review.
- **Where:** `male-physiology` (notes Throughout adult life, Sex drive, and For your exam note). Related: adrenal-androgens-sex-drive (`adrenal-glands`), which still teaches the textbook role; an author should decide the two together.
- **Evidence-based position:** in men, desire depends partly on testosterone and partly on the estradiol made from it (Finkelstein et al., NEJM 2013). In women, her own testosterone level does not predict desire well and no blood level separates women with and without low desire; testosterone given to postmenopausal women with low desire, at doses near premenopausal levels, raises it modestly (Global Consensus Position Statement, Davis et al. 2019). The page says "older women" because menopause is taught later.
- **For your exam:** many textbooks say androgens, including testosterone, help drive sex drive in both sexes. Give that answer if asked; the evidence in women is weaker than in men.

### epididymal-transit: how long sperm take to pass through the epididymis
- **Status:** pending review.
- **Where:** `male-anatomy` (notes; lesson chain step 1), `male-physiology` (notes).
- **Evidence-based position:** human epididymal transit is a few days: about 2 to 6 days by testicular-output and reserve estimates (Amann and Howards 1980), shorter in high producers, and up to about 12 days by older labeling studies (Rowley et al. 1970). The pages say "several days", with a range of about 2 days to 2 weeks in the male-anatomy notes. The 2 to 3 month lag after an insult to sperm production still holds.
- **For your exam:** many textbooks (OpenStax among them) say about 12 days, some older texts up to 20; give the textbook figure if a question asks for a number. The page has no For your exam note, because 12 days falls inside the range it teaches.

### ovary-default: is the ovary the "default" gonad?
- **Status:** pending review.
- **Where:** `meiosis` (notes For your exam note).
- **Evidence-based position:** ovary development is actively switched on by its own genes (RSPO1/WNT4/beta-catenin, FOXL2), which also hold off the testis program throughout life; loss of FOXL2 in adult mouse ovaries turns granulosa cells toward Sertoli-like cells. SRY tips the balance toward a testis; without it the ovary program wins, but it is not a passive default.
- **For your exam:** older texts say the ovary is the "default" that forms whenever SRY is absent. The exam answer to "what makes the gonad a testis?" is SRY on the Y chromosome.

### erection-mediator: acetylcholine or nitric oxide?
- **Status:** pending review.
- **Where:** `male-anatomy` (notes For your exam note; comparison table).
- **Evidence-based position:** erection is driven by nitric oxide from nitrergic parasympathetic nerves and the endothelium, acting through cGMP to relax arterial and cavernous smooth muscle; acetylcholine acts mainly indirectly, by releasing endothelial nitric oxide.
- **For your exam:** autonomic tables list erection as a parasympathetic effect, and that is the answer to give. The chemical that relaxes the smooth muscle is nitric oxide rather than acetylcholine acting directly on the muscle.

### maternal-age-cohesion: why oocyte nondisjunction rises with the mother's age
- **Status:** pending review.
- **Where:** `meiosis` (notes, "the likely reason"); `ovarian-cycle` (going-further box, "thought to be the main reason").
- **Evidence-based position:** loss of cohesin that is laid down before birth and not replaced is the leading, well-supported explanation for the maternal-age rise in oocyte aneuploidy (mouse and human oocyte data), with contributions from spindle and checkpoint changes. The pages teach it in plain words ("the proteins that hold chromosomes together") without naming cohesin.
- **For your exam:** texts may give "older eggs" or "the long arrest in prophase I" without a mechanism; either matches what the page teaches. The page has no For your exam note.

### alpha-blocker-ejaculation: reduced emission or retrograde ejaculation?
- **Status:** pending review.
- **Where:** `male-anatomy` (notes Point and Shoot paragraph; question 15).
- **Evidence-based position:** selective alpha-1A blockers (tamsulosin, silodosin) mainly cause reduced or absent emission; true retrograde ejaculation is more typical after prostate surgery or nerve damage from diabetes. The notes say this. Question 15 keeps retrograde ejaculation in an unnamed alpha-1 blocker but proves it with sperm in the urine, and its explanation notes that these drugs can also weaken emission itself.
- **For your exam:** many texts and pharmacology lists say alpha-blockers cause retrograde ejaculation. The page has no For your exam note; question 15 matches that answer.

## Open items

None blocking. The Phase 1 review list below collects judgment calls for the instructor review.

## Phase 1 pilot: judgment calls for instructor review

Not contested science, but places where the writers chose a number, a simplification or a
wording, listed so a licensed A&P instructor can check them. Each is taught as stated.

- **Figures with printed labels that are wrong or misleading:** OpenStax Figure 3.17 prints
  "Plasma membrane" on the peroxisome's own membrane (label covered for good, never quizzed;
  spec decision 48; human peroxisomes also usually lack the crystalline core it draws). Figure
  24.6 prints "about 36 ATP" (caption note). Figure 20.6 draws classic precapillary sphincters
  (caption note; not a lab practical set). Figure 19.18 prints "Bachman's bundle" and Figure 1.12 prints "Thorcis" (both shown correctly spelled, with the printed form accepted). Figure 19.25
  was not used (it calls third-degree block partial conduction).
- **Labels covered by the ordering rule:** decided for the heart (spec decision 52: chambers and
  great vessels are now taught in the first heart lesson, so its figure shows them). The
  "Basal lamina" label is likewise covered on the cell-junctions panel until epithelium.
- **Map gaps found while labeling:** six thoracic aortic branches (internal thoracic, esophageal, intercostal, mediastinal,
  pericardial, superior phrenic) have no map concept; the bronchial arteries belong to the
  lung blood supply topic and their label is covered until then.
  "ligand" is taught in Chemical signaling, after the passive-transport topic that needs
  ligand-gated channels (worded around).
- **Plain-word paraphrases:** decided by the owner (spec decision 51): everyday body words may be
  used early, and Foundations was rewritten with natural wording. Technical terms (femur,
  intestine names, urea, hemoglobin, kidney cell names) still wait for their topics.
- **Normal values chosen:** body temperature about 36.6 °C with a For your exam note for 37 °C;
  hypertension categories from the ACC/AHA guideline (130/80 and 140/90); HRmax 220 − age with
  208 − 0.7 × age noted; MAP = DBP + one third of PP at resting rates; EF 50–70% normal;
  intrinsic rates SA 60–100, AV junction 40–60, ventricles 20–40; K+ equilibrium potential about
  −90 mV; cardiac AP numbers; blood distribution (veins 60–65%); capillary area and velocity;
  hemorrhage classes 15/30/40%; pump share of resting ATP 20–40%.
- **Simplifications:** hyperkalemia as a smaller K+ gradient only; inward-rectifier K+ channels
  as "leak channels that close while depolarized"; hyperthermia as harmful positive feedback;
  the Bainbridge reflex as weak in humans; appendicitis pain migration; D5W as isosmotic in the
  bag but hypotonic once infused.
- **Classification conventions:** eleven organ systems (immune treated as a chapter, not a
  twelfth system); dorsal and ventral body cavities (with a caveat); older names for the nine
  abdominal regions with the newer ones as alternates; filtration counted as passive transport;
  vesicle transport counted as active transport; anaphase counted as 92 chromosomes; flashcards
  do not change mastery (spec decision 39).
- **Etymology to confirm:** "alkaline" from Arabic al-qily; "saphenous" (Greek "visible" vs
  Arabic "hidden"); "exon" and "intron" from "expressed region" and "intragenic region".

## Phase 2: respiratory chapter, judgment calls for instructor review

- **Figures with printed labels that are wrong or misleading:** Figure 22.3 prints "Septal
  cartilage" twice; the upper leader lands on the lateral wing of the cartilage (the lab
  practical explains this) and the lower one points near the alar cartilage. Figure 22.28 label
  (b), "HCO3- dissolved in plasma as carbonic acid", is wrong and is covered; the caption
  corrects it. Figure 22.19 is not used (it lists TLC, FRC and RV as spirometry measures).
- **Labels without a map concept:** the tongue on the airway figures (taught in the mouth topic);
  philtrum, piriform fossa and fat pad in the lab practical, each taught by its follow-up line.
- **Map gaps:** upper and lower respiratory tract, lobar and segmental bronchi, bronchopulmonary
  segment, lingula, laryngeal cartilages, recurrent laryngeal nerve, tension pneumothorax, law of
  Laplace, pleurisy, pleural effusion. ARDS is not named (its name contains a later term);
  "PaCO2" is written "arterial PCO2" until arterial blood gases.
- **Normal values chosen:** alveolar PO2 about 100 and arterial about 95 (80–100) mm Hg, venous
  40/46, with a For your exam note for 104/100; lung volumes for a young man (TV 500, IRV 3000,
  ERV 1200, RV 1200, VC 4700, TLC 5900 mL; women about 20–25% smaller); dead space 150 mL; about
  480 million alveoli and 70 m²; a 0.5 µm barrier; capillary transit 0.75 s (a third of a second
  in exercise); V/Q about 3 at the apex and 0.6 at the base; P50 27 (fetal 19) mm Hg; carbon
  monoxide affinity 200–250 times oxygen's, COHb half-life 4–6 h on room air and 1–1.5 h on
  100% oxygen; intrapleural −4 to −6 and alveolar ±1 mm Hg; pulmonary artery 25/10; CO2 carried
  about 70% as bicarbonate, 20–23% on hemoglobin, 7–10% dissolved; carotid bodies respond below
  about 60 mm Hg; PCO2 40 to 45 "roughly doubles" ventilation (least certain); at 4,300 m about
  60% of sea-level pressure; oxygen target "often 88–92%" in COPD.
- **Other positions:** FEV1/FVC uses the fixed 0.70 cutoff, with the lower limit of normal in a
  going-further box; pulse oximeters overestimate saturation more often in darker skin; in a
  swallow the vocal folds close at or before the start of the larynx's rise (Shaker 1990; Ohmae
  1995).
- **Simplifications:** the intrapleural curve has no resistive component; type I cells rarely
  divide; bronchodilation mainly from circulating epinephrine; most airway resistance in the
  medium bronchi; the chloride shift through band 3; altitude acclimatization through kidney
  bicarbonate loss; exercise breathing driven by central command and joint sensors; the larynx
  counted in the upper tract.
- **Not built:** a trachea and lung histology station. No micrograph is cleared for commercial use.

## Phase 2: nervous tissue and central nervous system, judgment calls for instructor review

- **Positions taken without an exam note:** microglia come from yolk-sac precursors that seed the
  brain early (older texts: blood monocytes); the unipolar neuron's peripheral branch is treated
  as axon-like; co-transmission is taught (Dale's one-transmitter rule is the older view); GABA
  excites the fetal brain (going-further); heat worsens MS through earlier sodium-channel
  inactivation; the left-brain/right-brain personality idea is called a myth; a lucid interval
  is seen in a minority of epidural bleeds; trauma is the most common cause of subarachnoid
  bleeding overall; "basal nuclei" preferred to "basal ganglia".
- **Simplifications:** somatic vs autonomic defined by the effector (shivering and breathing are
  somatic); the astrocyte–neuron lactate shuttle stated plainly (could be hedged); the sodium
  inactivation gate drawn as a loop plugging the pore; the absolute refractory period about 1 ms;
  schematic channel curves and enlarged EPSP/IPSP sizes on the graphs; a constructed hypnogram.
- **Tool predictions to confirm:** hyperkalemia (a modest rise makes firing easier; hours of
  depolarization inactivate sodium channels and make it harder); partial tetrodotoxin block
  (threshold up, smaller spike); organophosphate weakness as depolarization block plus receptor
  desensitization.
- **Normal values chosen:** axon regrowth about 1 mm/day; myelin 70–80% lipid; conduction 0.5–2
  m/s unmyelinated and up to 120 m/s myelinated; internodes 1–2 mm, nodes about 1 µm;
  afterhyperpolarization to about −80 mV; synaptic delay about 0.5 ms; about 10,000 synapses on a
  motor neuron; CSF about 150 mL, made at about 500 mL/day; brain about 1,400 g; lumbar puncture
  opening pressure 7–18 cm H2O; cord ends at L1–L2 (L3 at birth), dural sac at S2; two-point
  threshold 2–3 mm at the fingertip and about 4 cm on the back; corpus callosum about 200 million
  axons; the cerebellum holds over half the brain's neurons; language on the left in about 95% of
  right-handers and 70% of left-handers.
- **Figures:** OpenStax 12.20 not used (it mixes up the gates); the catalog caption for 12.28 is
  wrong ("G protein hydrolyzes ATP"), the image is fine; Figure 16.5 uses nonstandard area names
  (motor association area for premotor, general interpretation area).
- **Map gaps:** Nissl bodies, axonal transport, dendritic spines, axolemma, neurilemma,
  internode, Wallerian degeneration, glioma, falx cerebri, tentorium, blood–CSF barrier,
  bridging veins, middle meningeal artery, arcuate fasciculus, long-term potentiation, cingulate
  gyrus, arbor vitae, frontal eye fields, sleep spindles and K-complexes, adenosine, neglect,
  prosopagnosia.
- **Etymology to confirm:** "parasympathetic" (para- = beside); "rhombencephalon"; "metabotropic"
  (bol/o); "diencephalon" (through, or between).
- **Not built:** a nervous-tissue histology station. No micrograph is cleared for commercial use.

## Phase 2: peripheral nervous system, judgment calls for instructor review

- **Positions and ranges chosen:** plexus ranges C1–C4 (some sources C1–C5), L1–L4 and L4–S4
  (Figure 13.24 brackets L5–S5); dermatome landmarks from C5 on the upper arm to S1 on the
  lateral foot (published maps disagree; the course uses its own SVG, since OpenStax 16.13 needs
  license verification); knee jerk L2–L4 for the arc and L3–L4 in the table; triceps C7; ankle S1.
- **Normal values chosen:** the vagus carries about three quarters of parasympathetic output and
  its axons are about 80% sensory; a transplanted heart beats about 90–110 a minute; knee-jerk
  delay about 20–23 ms; 85–87% of strokes ischemic; about 1.9 million neurons lost per minute in
  a large stroke (Saver 2006); Babinski sign normal to 1–2 years; 85–90% of corticospinal axons
  cross.
- **Simplifications:** the pronator drift mechanism; the basal nuclei direct and indirect paths
  with a caveat; "extrapyramidal" called a dated term; one dorsal root cut dulls rather than
  removes feeling (see root-overlap); the stretch reflex only helps restore posture, with the
  brainstem doing most of it.
- **Mnemonics:** folk mnemonics were replaced with landmark statements and "Really Tired? Drink
  Cold Beverages"; "C3, 4 and 5 keep the diaphragm alive" and "LR6, SO4" are kept.
- **Figures:** Figure 15.6 prints presynaptic and postsynaptic for preganglionic and
  postganglionic axons (named correctly, printed form accepted).

## Phase 2: special senses and autonomic nervous system, judgment calls for instructor review

- **Special senses, positions:** many taste cells fire action potentials but the signals never
  leave the taste bud (taught as an exception in sensory-pathways); a possible sixth taste (fat)
  is mentioned as debated; rods and cones are called specialized neurons; rods drop out in
  daylight because they are saturated, not bleached; only the outer hair cells' tallest
  stereocilia are embedded in the tectorial membrane; high-frequency hearing loss is explained
  with a hedge.
- **Special senses, normal values chosen:** about 90 million rods and 4.5 million cones per
  retina (Curcio 1990; older texts say 120 and 6 million); pigment peaks 420, 498, 534 and 564
  nm; the cornea does about two thirds of the focusing; eye pressure 10–21 mm Hg with aqueous
  replaced about every 2 hours; a rod at −40 mV in the dark, toward −70 mV in light; dark
  adaptation about 10 minutes for cones and 20–30 for rods; red–green color blindness in about 1
  in 12 males of northern European ancestry and 1 in 200 females; about 3,500 inner and 12,000
  outer hair cells, with about 95% of cochlear nerve fibers from inner hair cells; middle-ear
  gain about 20-fold (22 in the calculator); cochlea 3.5 cm; endolymph about +80 mV; hearing
  damage risk from about 85 dB over hours and minutes at 100–110 dB; near point 7–10 cm in
  childhood and early adulthood.
- **Special senses, simplifications:** the superior oblique as "down, most strongly when turned
  in", plus rotation; "lacrimal ducts" as the gland's ducts; no word roots for mydriasis; the
  audiogram and pigment curves are schematic.
- **Special senses, figures:** Figure 14.15 prints "Lateral" and "Medial" on a view where they
  mean superior and inferior (covered) and "Suspensory ligaments" twice; 14.17 not used (prints
  "11-trans-retinal" and draws an ATP-driven step); 14.18's "red" cones peak at 564 nm, which is
  yellow-green (noted); 14.22 draws the pituitary in front of the optic chiasm (it sits below,
  behind its stalk); a caption note on 14.12 printed the cupula answer (covered).
- **Special senses, not built:** a retina histology station (Figure 14.16 needs license
  verification). The vision notes run about 5,000 words (nine concepts).
- **Autonomic, normal values chosen:** sympathetic divergence of 10 or more; the adrenal medulla
  about 80% epinephrine; 22–23 chain ganglia a side; splanchnic nerves from T5–T9 and T10–T11;
  a denervated heart at about 100 a minute; vagal tone 20–40 beats below that; a full atropine
  dose raises the rate 30 or more.
- **Autonomic, simplifications:** parasympathetic nerves have little direct effect on
  ventricular force; thick sympathetic saliva mainly through beta-1; bladder wall relaxation
  mainly beta-3; vasovagal fainting; the autonomic blockade heart-rate graph is schematic.
- **Autonomic, figures:** Figure 15.3 panel (b) sends one "Gray ramus" leader to the white
  ramus (the pin question uses the white ramus instead) and panel (c) prints "spinal ganglion"
  for the chain ganglion; 15.4 prints "Super salivatory nucleus" and puts the "Otic ganglion"
  label beside the submandibular ganglion (covered); 15.6 prints presynaptic and postsynaptic
  for preganglionic and postganglionic; 15.9 and 15.11 not used (wrong claims, misspelled
  Edinger–Westphal).

## Phase 2: blood chapter, judgment calls for instructor review

- **Positions taught:** the cell-based model of clotting first, with tissue factor acting as
  platelets stick, and the lab intrinsic/extrinsic model for exams (coagulation-model); neutrophils
  circulate for under a day (labeling studies range from hours to about 5 days); many tissue
  macrophages descend from cells present before birth; the two-branch blood cell tree as a
  simplification; how injected anti-D prevents sensitization is not fully understood; gut bacteria's
  vitamin K contribution is uncertain, and newborn deficiency comes from low stores and little in
  breast milk; ABO antibodies as a response to similar sugars on bacteria; platelets make a few
  proteins from stored RNA but no new RNA; anemia speeds breathing mainly on exertion (oxygen
  sensors are not triggered).
- **Normal values chosen:** hematocrit 37–47% (women) and 42–52% (men), from Figure 18.2 (many
  labs use 36–46 and 41–50); hemoglobin 13.5–17.5 and 12–15.5 g/dL with the WHO anemia cutoffs;
  red cells 4.2–5.4 and 4.7–6.1 million per µL; white cells 4,500–11,000 per µL; platelets
  150,000–450,000 per µL; blood volume about 70 mL/kg; plasma proteins albumin 55–60%, globulins
  35–38%, fibrinogen 4–7%; bilirubin below 1.2 mg/dL, jaundice above 2.5–3; PT 11–13.5 s, aPTT
  25–35 s; bleeding risk below 50,000 platelets with injury and 10,000–20,000 without; about
  2.4 million red cells made a second; the marrow makes 100 billion or more white cells a day;
  newborn red cells live 60–90 days; Rh positive in about 85% of people of European ancestry.
- **Tool values:** a healthy marrow can raise red cell output about 6–8 times; the bleed graph
  (1 L of 5 L lost: hematocrit 45 to about 36% by day 2–3, reticulocytes peaking near 4% at days
  7–10, recovery by about 8 weeks) uses typical numbers; the clotting loop is fitted to the seven
  slots as a local positive loop with no nerve or brain.
- **Figures:** Figure 18.2's tube titles ("Anemia", "Polycythemia") are covered so they don't
  give away answers; 18.9, 18.13 and 18.14 credit third parties and are not used, so there is no
  blood smear station; 18.16 (a commercial typing card) is replaced by our own drawing; the
  catalog lists 18.6 as CC BY with no credit (confirmed on the OpenStax page).
- **Map gaps:** band cells, reticulocyte count, hemolysis, H antigen, anti-D immune globulin,
  polycythemia vera, sickle cell trait, hepcidin, von Willebrand disease, PT/INR/aPTT, tPA,
  D-dimer, protein C, thrombomodulin, Virchow's triad, DIC, the blast cell stages; the alias
  "sensitization" belongs to hypersensitivity, so the Rh pages say "sensitized".

## Phase 2: endocrine chapter, judgment calls for instructor review

- **Positions taught:** thyroid hormones enter cells on transporter proteins (the hormone-action
  page makes them the exception to lipid-soluble diffusion); T4 takes about 5–6 weeks to level
  off, hence the six-week TSH recheck; ACTH stays low for weeks after stopping long-term
  steroids; prolactin is held back mainly by dopamine; growth hormone acts mostly through IGF-1;
  primary aldosteronism comes from a one-sided tumor or overgrowth of both glands; only strong
  alcoholic drinks raise urine beyond their own water; thymosins are hedged; the 2022 names for
  diabetes insipidus (arginine vasopressin deficiency and resistance) are in a going-further
  note; old diabetes names (juvenile-onset, adult-onset) are mapped to type 1 and type 2; in
  type 1 diabetes the glucagon response to lows fades, so epinephrine is the main defense.
- **Normal values chosen:** plasma osmolality 275–295 mOsm/kg and an ADH trigger at a 5–10%
  volume fall (matching the published chapters); lipid-soluble hormones more than 90% bound;
  epinephrine half-life about 2 minutes, T4 about a week; about 90% of thyroid output as T4; T3
  binds about 10 times more tightly; 2–3 months of stored hormone; iodine need 150 µg a day;
  total blood calcium 8.5–10.5 mg/dL; calcium absorption 10–15% without calcitriol, 30–40% with
  it; fasting glucose 70–99 mg/dL, diabetes cutoffs 126 fasting, 200 at 2 hours and A1C 6.5%;
  hypoglycemia below 70 (important below 54); counterregulation thresholds about 80 and 65–70;
  kidney glucose threshold about 180 mg/dL; one to three million islets; glycogen 100 g in the
  liver and 400 g in muscle; adrenal gland 4–5 g; cortisol about 90% bound; body clock 24.2 h.
- **Simplifications:** the insulin receptor as "an enzyme that adds phosphate groups"; GLUT
  types not named; only the vascular permissive effect of cortisol; estrogen closes growth plates
  in both sexes; sweating in hypoglycemia from sympathetic cholinergic fibers; diabetic
  ketoacidosis described as "acid blood from unchecked fat breakdown" until ketones are taught;
  the tool graph's insulin-resistance curve is schematic.
- **Figures:** Figure 17.16 prints that PTH inhibits osteoblasts and stimulates osteoclasts
  directly and that calcitonin stimulates osteoblasts (covered; PTH acts through osteoblasts);
  17.19 prints that glucagon inhibits glucose uptake and puts gluconeogenesis in the ER
  (covered); 17.8, 17.11 and 17.3 not used (swapped nuclei, ADH as a releasing hormone, wrong
  amino acids); 17.13 prints "basal metabolic rate" (covered until metabolism); no cleared
  thyroid or adrenal micrograph (17.12 and 17.17 need verification), so the adrenal panel is our
  own drawing; the islet station uses Figure 23.26, a drawing.
- **Lab sets:** the gland-location set belongs to hormone-action, so the pineal and parathyroid
  labels stay covered; a later full set could ask them.
- **Etymology to confirm:** glucagon ("-agon", leading, or "glucose agonist" as its discoverers
  reportedly meant; both are given); calcitonin; oxytocin; thymus; melatonin; estrogen;
  aldosterone.
- **Map gaps:** isthmus, follicular and chief cells, the calcium-sensing receptor, 25-hydroxyvitamin D,
  tetany, Hashimoto thyroiditis, somatostatin, supraoptic and paraventricular nuclei, short-loop
  feedback, central vs nephrogenic diabetes insipidus, phosphatase, glycoprotein hormones.

## Phase 2: lymphatic and immune chapter, judgment calls for instructor review

- **Positions taught:** fever as negative feedback around a raised set point; trained immunity in
  a going-further box (qualifying "innate immunity has no memory"); dendritic cells are "by far
  the best" at switching on naive T cells; peripheral tolerance mostly via resting dendritic
  cells, with long-lasting (not permanent) anergy; MHC class I peptides from the proteasome,
  including faulty new proteins; AIRE deficiency mainly targets the parathyroid and adrenal glands;
  CD8 T cells, not antibodies, control early HIV; GAMED taught as a list, not an abundance order
  (true order G > A > M > D > E); hypersensitivity "usually" needs an earlier symptom-free
  exposure (ABO reactions are the exception); beta-2 stimulation lowers mast cell release; IgA is
  made in the largest amount each day; lymphedema's fibrosis driven by white cells drawn into
  stagnant fluid; the spleen's platelet reserve is released after splenectomy; "pathogen" is taught
  late (in antibody-immunity), so earlier topics say "microbe" — the map may want it earlier.
- **Normal values chosen:** 500–700 lymph nodes; spleen about 150 g holding about a third of the
  platelets; the thoracic duct drains about three quarters of the body; about 98% of thymocytes
  die; blood lymphocytes T 70–80%, B 10–15%, NK 5–15%; 1 in 100,000 to 1 in a million naive cells
  fit an epitope; divisions every 6–8 hours, clones of tens of thousands or more; memory cells
  100–1,000 times more numerous; HLA versions in the tens of thousands; 1–10% of T cells react to
  a foreign HLA type; primary response antibody after 5–10 days, peaking at 7–14 days, secondary
  lag 1–3 days, peak 10–100 times higher; serum IgG 75–80%, IgA 10–15%, IgM 5–10%, IgD under 1%,
  IgE well under 0.1%; IgG half-life about 3 weeks; CD4 count 500–1,500 per µL, AIDS below 200;
  about 10 years untreated to AIDS; about 85% of generalized myasthenia with AChR antibodies; about
  4 in 5 people with autoimmune disease are women (lupus 9 in 10); fever from 38 °C, danger above
  about 41 °C, 10–12% more energy per °C; epinephrine for anaphylaxis per the 2023 AAAAI/ACAAI
  parameter (0.01 mg/kg IM, max 0.5 mg adult and 0.3 mg child; auto-injectors 0.3 and 0.15 mg;
  repeat after 5–15 minutes); antivenom protection lasts only days.
- **Tool values:** the antibody-response graph's secondary peak about 12 times the primary; the
  HIV graph is schematic (early weeks stretched, with an axis break).
- **Figures:** Figure 21.16 prints "Antibody 1–3" on lymphocytes its caption calls T cells
  (covered; an author should decide the cell type); 21.20's heading says the enzymes "rupture cell
  membranes" and draws the target shattered (heading covered, captions correct it to apoptosis);
  21.28 not used (credits T cells with antibody-dependent killing, which NK cells do); 21.26 and
  21.22 replaced with our own drawings; 21.7–21.11 credit third-party micrographs, so the node and
  spleen are our own drawings and there is no spleen or node histology station; 21.29's "Pleura"
  label is tied to the general organs concept and stays visible.
- **Map gaps:** subcapsular sinus, paracortex, medullary sinus, the spleen's central artery and
  venous sinus, chronic granulomatous disease, AIRE, hapten, cross-presentation, C-reactive
  protein, Toll-like receptors, HLA, CD28/B7, FOXP3, affinity maturation, conjugate vaccine,
  immune complex, molecular mimicry, opportunistic infection, PD-1 and CTLA-4, CAR T cells,
  Lambert–Eaton syndrome.
- **Etymology to confirm:** interferon ("interfere"), opsonin, tonsilla (uncertain origin),
  anaphylaxis ("ana-" = against), the bursa of Fabricius for "B".

## Phase 2: digestive chapter, judgment calls for instructor review

- **Positions taught without an exam note:** gastrin acts mostly by releasing histamine from ECL
  cells; GERD is mainly brief lower esophageal sphincter relaxations not caused by swallowing,
  and the sphincter is a 3–4 cm zone of muscle plus the diaphragm's pinch; stress and spicy
  food are not ulcer causes (H. pylori and NSAIDs are); lactase is the first brush border enzyme
  lost when villi are damaged, and about two thirds of adults lose it with age (about 12 g of
  lactose is usually tolerated); hepatic stellate cells, not macrophages, make cirrhosis scar;
  scarring, even cirrhosis, can partly regress once the cause is removed; the classic lobule is
  taught, with the acinus in a going-further box; detoxification can make a molecule more
  harmful (acetaminophen); gut bacteria's vitamin K contribution is uncertain; without bile,
  fat is digested more slowly and much of it is not absorbed; B12 and bile salts depend on
  carriers found only in the terminal ileum (very large oral B12 doses cross without intrinsic
  factor); the colon can absorb about 4–5 L a day; early enamel damage can remineralize; the
  esophagus has little acid defense; opioids cut propulsive colon movement, not mixing.
- **Normal values chosen:** saliva 1–1.5 L, gastric juice about 2 L (the fluid worked example
  uses Figure 23.32's 1.5 L), intestinal juice 1–2 L, bile 0.5–1 L and pancreatic juice 1.2–1.5 L
  a day; stomach about 50 mL empty, 1–1.5 L after a meal, up to about 4 L; emptying in 2–4 hours;
  slow waves 3, 12 and 8 a minute (stomach, duodenum, ileum); small intestine transit 3–5 hours;
  migrating motor complex every 90–120 minutes; lining renewed every 3–5 days; esophagus and
  duodenum about 25 cm; large intestine 1.5 m; enamel about 96% mineral; enteric nervous system
  200–600 million neurons; H. pylori in about 4 in 10 adults; liver about 1.5 kg; bile salt pool
  2–4 g, 95% reabsorbed; gallbladder 30–50 mL, concentrating bile about 10-fold; colon receives
  about 1.5 L a day and absorbs about 1.3 L; feces 100–200 g a day; about 40 trillion gut
  bacteria weighing about 200 g; short-chain fatty acids supply 5–10% of energy; pepsin does
  10–15% of protein digestion; B12 stores last 3–5 years; SGLT1 carries 2 Na+ per glucose.
- **Tool values:** the gastrin, gastric emptying and breath test graphs are schematic; the breath
  test uses the classic 50 g lactose dose (current guidelines use 25 g) and a 20 ppm cutoff.
- **Figures:** Figure 23.25 prints "Interlobular vein" for a sublobular vein (covered); 23.29
  shows sucrose and lactose as products of salivary amylase (covered; the caption corrects it);
  23.33 labels triglyceride droplets "fatty acids and monoglycerides" and says chylomicrons form
  "inside the Golgi" (both covered); 23.14 and 23.17 not used (misnamed muscles, typos, bare
  "receptors"); 23.19 and 23.22 (villus micrographs) need license verification, so there is no
  villi station and the villus is our own drawing.
- **Ordering workarounds:** the stomach topic cannot say "duodenum" and uses "the first part of
  the small intestine" throughout (awkward; consider moving the term earlier or a preview box);
  vitamins are "vitamins that dissolve in fat" until nutrition; urea and ammonia are avoided;
  the interstitial cells of Cajal are called "pacesetter cells" because the map's "interstitial
  cells" are the Leydig cells.
- **Map gaps:** muscularis mucosae, adventitia, ECL and D cells, somatostatin, Paneth cells,
  crypts, plicae circulares, receptive relaxation, hiatal hernia, Barrett esophagus, celiac
  disease, chemoreceptor trigger zone, haptocorrin, colipase, GLUT2 and GLUT5, Kupffer cells,
  sphincter of Oddi, short-chain fatty acids, oral rehydration, portal hypertension, ascites.
- **Etymology to confirm:** haustrum, epiploic, cirrhosis, emulsify, dextrin, micelle,
  deglutition ("de-" = down).

## Phase 2: metabolism and nutrition chapter, judgment calls for instructor review

- **Positions taught:** ATP 30–32 per glucose (exam 36–38); lactate as a fuel and the Cori cycle
  with its cost; most stored fat comes from dietary fat; glucagon has little direct effect on
  human fat tissue (lipolysis in untreated diabetes driven by epinephrine, cortisol and growth
  hormone); after a meal gluconeogenesis slows and feeds glycogen; kwashiorkor is not simply
  protein lack; brown fat's role in adults is unsettled; "most heat is lost through the head" is
  a myth; the thyroid is slow and minor in adult temperature control; in heat, gut and kidney
  vessels narrow; core temperature 36.6–37 °C with a For your exam note for 37 °C; chromium is
  left off the trace-mineral list (its essential status is debated).
- **Normal values chosen:** BMR 1,200–1,800 kcal a day (60–70% of the total); food handling
  about 10%; 4.8 kcal per liter of oxygen; about 580 kcal per liter of sweat evaporated;
  resting heat loss 60% radiation, 3% conduction, 15% convection, 20% evaporation; skin blood
  flow up to 6–8 L/min; sweat 1–2 L an hour; shivering 3–5 times resting heat; heat stroke above
  40 °C; hypothermia stages 35/32/28 °C; frostbite rewarmed at 37–39 °C; about 12 kg of fat
  (about 100,000 kcal) in a lean adult; palmitate 106 ATP; protein turnover 250–300 g and urea
  20–30 g a day; Cahill fasting values (protein 75 to 20 g, brain glucose 120 to 40 g a day);
  9 essential amino acids; iodine 150 µg; folate 400 µg; scurvy after 1–3 months; B12 stores
  3–5 years; the RDA covers 97–98% of people; GLP-1 drugs about 15% weight loss; statins lower
  LDL by a third to a half.
- **Tool values:** the fasting fuel and heat-loss graphs are schematic (heat made about 75
  kcal/h; evaporation floors at about 15 kcal/h in cool air); the ATP-count practice uses
  matched value sets only.
- **Figures:** Figure 24.8 prints "FAD+" (covered); 24.5 says "energy-releasing phase" (the course
  says energy-yielding); 24.14 leaves out the third acetyl CoA in ketone body synthesis; 24.23
  shows the thyroid as a temperature effector and says gut blood flow is not diverted in heat
  (the heat label is covered, the caption corrects it); 24.3 prints "starvation response" and
  "cannibalization of muscle" (covered until starvation is taught); 24.9, 24.21, 24.22, 24.16,
  24.10, 24.13 and 24.18 not used (errors or heavy chemistry).
- **Ordering workarounds:** "diabetic ketoacidosis" is written "ketoacidosis in untreated type 1
  diabetes" until acid–base; ammonium is written NH4+.
- **Map gaps:** the individual vitamins and deficiency diseases, omega-3 and omega-6,
  substrate-level phosphorylation, the mitochondrial matrix, glycogen synthase and phosphorylase,
  glucose-6-phosphatase, phosphorolysis, the Cori cycle, carnitine, HMG CoA reductase and
  statins, ALT and AST, marasmus, refeeding syndrome, the preoptic area, heat acclimatization,
  GLP-1.
- **Etymology to confirm:** kwashiorkor, ghrelin, vitamin, chemiosmosis.

## Phase 2: urinary chapter, judgment calls for instructor review

- **Positions taught:** efferent arterioles narrower than afferent "in most nephrons"; a steady
  GFR does not stop pressure natriuresis; PTH lowers urine calcium at first (it can rise later);
  400 mL of maximally concentrated urine carries only about 480 of the day's 600 mOsm; thiazides
  raise salt loss for only 3–4 days before compensation; the eGFR equation is the 2021 race-free
  version, with cystatin C mentioned; pressure natriuresis hedged as in bp-long-term, with no
  single sensor known.
- **Normal values chosen:** kidneys at T12–L3, about 11 × 6 × 3 cm and 150 g; 20–25% of cardiac
  output; about 1 million nephrons per kidney; fenestrations 70–100 nm, filtration slits 25–40
  nm; glomerular pressures 55/15/25–35, net about 10 mm Hg; GFR 125 mL/min (180 L a day); Kf 12.5;
  filtration fraction 20%; urine protein under 150 mg a day; sodium reabsorbed 65% proximal, 25%
  loop, 5% distal, 2–5% collecting duct; glucose Tm 375 mg/min, threshold 180 mg/dL; medulla
  300–1,200 mOsm/L; urine 50–1,200 mOsm/L and 0.5–12 L a day; specific gravity 1.005–1.030;
  oliguria below 400 mL a day; KDIGO AKI and CKD criteria; ureter 25–30 cm; bladder first
  sensation 150–250 mL, strong urge 300–500 mL; urethra 3–4 cm (female), 18–20 cm (male).
- **Tool values:** graph overlays (loop diuretic, low-protein diet, strong sympathetic, SGLT2
  blocker) are schematic; the Tm calculator treats every nephron alike, so it spills near 300
  mg/dL, with a note on splay; the hemorrhage scenario uses a MAP of 65.
- **Figures:** Figure 25.10 prints "Proximal conboluted tubule" (named correctly, printed form
  accepted); 25.3 and 25.5 print reproductive labels taught later (covered); 25.18 draws chloride
  and calcium entering with sodium (caption corrects); 26.12 prints "collecting tubule" (caption
  explains); 25.4, 25.6 and 25.13 need license verification, so there are no bladder, ureter or
  renal corpuscle micrograph stations.
- **Map gaps:** renal sinus, renal lobe, capsular space, thick ascending limb, connecting tubule,
  slit diaphragm, filtration coefficient, filtration fraction, pontine micturition center,
  glomerulonephritis, apical and basolateral membranes, filtered load, splay, SGLT2,
  aquaporin-2, urea carriers, named diuretics, urochrome, cystatin C, eGFR, AKI subtypes,
  cystitis, pyelonephritis.
- **Etymology to confirm:** obligatory, facultative, intercalated, calculus, dialysis.
- **Names:** "Mr. Osei" is reused with different ages in about six chapters (ecg, lung-volumes,
  biomolecules, brain-regions, respiratory-disorders, acid-base-regulation).

## Phase 2: fluid, electrolyte and acid-base chapter, judgment calls for instructor review

- **Positions taught:** ADH release starts at a plasma osmolality of about 280–285 mOsm/kg and
  thirst slightly higher (the order is debated); urea raises measured osmolality but not
  tonicity; a small rise in potassium makes cells easier to excite and a larger one harder;
  hypokalemia makes skeletal muscle harder to fire but slows cardiac repolarization (flat T, U
  wave, extra beats); acidemia shifts potassium out of cells mainly with mineral acids, little
  with lactic or keto acids; DKA potassium is high at first from insulin lack and
  hyperosmolality despite a total-body loss; vomiting alkalosis is generated by the alkaline
  tide and kept up by the kidneys holding bicarbonate when volume, chloride and potassium are
  low (paradoxical aciduria in a going-further box); diarrhea gives a normal-gap, high-chloride
  acidosis, but in cholera with shock the gap can rise (Wang 1986); DKA criteria follow the 2024
  ADA/EASD/JBDS/AACE/DTS consensus (glucose 200 mg/dL or known diabetes, beta-hydroxybutyrate
  3.0 mmol/L or more, pH below 7.30 or bicarbonate below 18); aldosterone raises H+ secretion
  directly on type A intercalated cells and indirectly through principal-cell sodium uptake;
  the bicarbonate buffer matters because it is an open system, not because of its pK;
  "balanced" crystalloids make little or no difference to outcomes (going further); the
  revised Starling view of how much of an infusion stays in plasma is a going-further box; IV
  magnesium is described in plain words as given to "pregnant women with a dangerous rise in
  blood pressure"; paper-bag rebreathing is no longer recommended; hypoxic drive, calcitonin,
  dehydration, the intracellular buffer, compensation, corrected calcium and hypernatremia
  correction are logged above.
- **Normal values chosen:** total body water 60% of body mass in a young adult man, 50–55% in
  women, 45–50% in older adults, about 75% in infants; ICF two thirds and ECF one third (three
  quarters interstitial, one quarter plasma); transcellular fluid about 1 L; daily intake 1.5 L
  drink, 0.75 L food, 0.25 L metabolic water; output 1.5 L urine, 0.7 L insensible, 0.2 L
  feces, 0.1 L sweat; kidneys excrete at most about 0.7–1 L of water an hour; sodium 135–145
  mmol/L (severe below 125), chronic hyponatremia corrected by no more than about 8–10 mmol/L a
  day; calculated osmolality = 2 × Na + glucose/18 + BUN/2.8; potassium 3.5–5.0 mmol/L (some
  labs 5.5), about 3,500 mmol inside cells vs 60 in the ECF, intake 70–100 mmol a day, 90% out
  in urine; IV calcium protects the heart for 30–60 minutes; total calcium 8.5–10.5 mg/dL (50%
  ionized, 40% bound, 10% complexed); phosphate 2.5–4.5 mg/dL, 85% in bone; chloride 98–106
  mmol/L; magnesium 1.7–2.2 mg/dL, 60% in bone. Blood gas: pH 7.35–7.45, PaCO2 35–45 mm Hg,
  bicarbonate 22–26 mmol/L, PaO2 about 80–100 mm Hg; anion gap about 8–12 mmol/L on modern
  analyzers (older 8–16 or 12 ± 4 in a going-further box), albumin correction about 2.5 per 1
  g/dL fall; CO2 13,000–20,000 mmol a day; fixed acid about 1 mmol/kg a day; filtered
  bicarbonate 4,320 mmol a day, 80% reclaimed proximally and 10–15% in the thick ascending limb;
  titratable acid 20–30 and ammonium 30–50 mmol a day, ammonium up five- to tenfold over 3–5
  days; lowest urine pH 4.5; respiratory compensation full in 12–24 hours, renal in 3–5 days;
  compensation rules of thumb (Winter's formula 1.5 × HCO3 + 8 ± 2; PaCO2 up about 0.7 per 1
  mmol/L in metabolic alkalosis and rarely above about 55; bicarbonate up 1 per 10 mm Hg acute,
  3.5–4 chronic in respiratory acidosis; down 2 acute, 4–5 chronic in respiratory alkalosis).
- **Simplifications:** the potassium shift with acidosis is given without its mechanism;
  hypokalemia is taught as hyperpolarizing (the paradoxical depolarization at very low
  potassium appears only as a caveat on the potassium graph); FGF23 is a going-further box; the
  ADH and thirst threshold graph is schematic; the edema example uses a sodium of 130; very high
  cortisol in Cushing syndrome "acts like aldosterone" (the enzyme overflow is not named);
  glutamine yields two ammonium and two new bicarbonate; the type A intercalated cell H+/K+ pump
  is "the same kind" as the stomach's; the bicarbonate exchanger is named band 3; urea synthesis
  using bicarbonate is not taught; ROME is taught as a student aid; pregnancy is not named as a
  cause of respiratory alkalosis (taught later).
- **Tool calls (tool audit):** the diuretic scenario asks about sodium "in her urine in the hours
  after a dose", because within days the RAAS and the distal segments catch more between doses
  (diuretic braking) and daily output again matches intake at a smaller ECF; the ABG interpreter
  gives no label when the pH is in range and only one of PaCO2 and bicarbonate is abnormal (it
  says to recheck and interpret with the patient), and "uncompensated" only when the pH is out
  of range; the anion-gap calculator's practice cases are limited to gaps of 8–35, and a gap
  below 8 gets its own message (uncommon, most often low albumin, then lab error); the
  body-water calculator keeps its infant preset but warns that the two-thirds / one-third split
  is an adult rule (in a newborn the ECF is close to half of body water or more). Also: the
  failing-kidneys graph item asks about kidneys that "could not raise their H+ secretion" (kidneys
  failing outright would let bicarbonate drift down); the insulin preset in the potassium-shift
  calculator says the potassium must still be removed; the SIADH urine osmolality is compared with
  what his dilute plasma should produce; the burns scenario leaves out evaporation; a
  high-protein diet roughly doubles ammonium; the steak dinner adds about 40 mmol of hydrogen
  ions as sulfuric acid; the dialysis item drops the calcitriol step (a fixed background); the
  renal new-bicarbonate pathway merges bicarbonate exit into its final step (6 steps), since exit
  runs in parallel with H+ secretion; the potassium graph notes that real cells fall short of
  the Nernst line at low potassium.
- **Figures:** Figure 26.5 draws plasma sodium near 150 and potassium near 9 (caption gives the
  clinical 140 and 4); 26.4 shows the ICF at about 55% of body water (the course uses two
  thirds); 25.19 draws ATP on the apical H+ exit (caption: mostly the sodium–hydrogen exchanger);
  26.16 prints "brain and arterial receptors" (caption: chemoreceptors); 26.18 lists seizures
  under muscular signs (caption note); 26.13 (sodium trigger, ambiguous potassium box) and 26.17
  are not used.
- **Map gaps:** transcellular fluid, mEq, third spacing, osmotic demyelination, Chvostek and
  Trousseau signs, U wave, torsades, refeeding, FGF23, pseudohyperkalemia, potassium binders,
  balanced crystalloids and lactated Ringer's, ionized and adjusted calcium, BUN, glutamine,
  titratable acid, net acid excretion, type A and B intercalated cells, Kussmaul breathing,
  Winter's formula, mixed disorder, lactic acidosis, paradoxical aciduria, pK.
- **Etymology to confirm:** natrium, kalium, magnesium, insensible, volatile, titratable,
  compensation, metabolic.

## Phase 2: reproductive chapter, judgment calls for instructor review

- **Positions taught:** emergency contraception works mainly by delaying or preventing
  ovulation, not by ending an established pregnancy, split by drug (levonorgestrel fails once
  the LH surge begins; ulipristal can still delay rupture early in the surge but not after the
  LH peak; Brache 2010, 2013); the hymen is a thin mucosal fold of widely varying shape whose
  appearance cannot show sexual history; the side of ovulation is close to random between the
  ovaries from cycle to cycle; high doses of prostaglandin blockers can delay or prevent follicle
  rupture without changing the LH surge or oocyte maturation; no follicle can ovulate during the
  luteal phase (rather than "none can be selected", since luteal follicle waves with an
  anovulatory dominant follicle occur; Baerwald 2003); high estradiol excites the kisspeptin
  neurons that drive the GnRH neurons, with the separate positive-feedback group noted in rodents
  and the human site called debated; the LH surge sets up its own ending (luteinization lowers
  estradiol), so an author may want Foundations' "positive feedback needs an outside event to end
  it" softened to "something must end it"; testosterone is taught as more essential to sperm
  production than FSH; PSA is described as a test to use "with care"; the ovarian-cycle
  going-further box on the maternal-age risk now says "thought to be the main reason", matching
  the meiosis page; ovary-default, erection-mediator, maternal-age-cohesion,
  testosterone-sex-drive-women, epididymal-transit, alpha-blocker-ejaculation,
  lactiferous-sinuses, menstruation-mechanism and puberty-onset are logged above.
- **Follicle naming:** tertiary = antral follicle; vesicular (Graafian) = the mature
  preovulatory follicle, treated as the last tertiary stage. OpenStax equates tertiary with
  vesicular (Graafian); textbooks vary.
- **Normal values chosen (male side):** spermatogenesis 64–74 days (Heller and Clermont 74;
  newer estimates nearer 64 or shorter), kept as a range; about 100 million sperm a day for both
  testes ("on the order of"; published ranges about 45–200 million); epididymis about 6 m
  uncoiled (some sources 4–6 m); ductus deferens about 45 cm (sources 30–45 cm); scrotal testes
  2–3 °C below core temperature; about 250 lobules per testis (range 200–300); ejaculate 2–5 mL
  (WHO 2021 lower reference limit 1.4 mL); semen pH about 7.2–8.0; seminal vesicles 60–70% of
  the volume and prostate 20–30%; testosterone in the tubules about 50–100 times the blood
  level; adult serum testosterone about 300–1,000 ng/dL (harmonized range 264–916, Travison
  2017), falling about 1% a year from middle age; GnRH pulses about every 1–3 hours in men;
  emission from sympathetic outflow about T10–L2 (texts vary: T10–L2 or T11–L2), expulsion by
  the pudendal nerve S2–S4, contractions about 0.8 s apart; cryptorchidism about 3% of full-term
  boys; torsion salvage window about 6 hours; oocyte about 0.1 mm, sperm about 60 µm; BPH in
  about half of men by 60 and most by 85 (autopsy prevalence); Y chromosome "a few dozen
  distinct protein-coding genes, several in many copies", X about 800; trisomy 21 arises in the
  egg "about 9 times in 10".
- **Normal values chosen (female side):** oocytes about 6–7 million before birth, 1–2 million at
  birth, 300,000–400,000 at puberty, about 1,000 at menopause, about 400 ovulated in a lifetime;
  cycle 24–38 days normal; luteal phase 12–14 days (range 11–17); estradiol about 200 pg/mL or
  more for about 2 days before the surge; ovulation 34–36 hours after LH onset; surge about 2
  days; oocyte viable 12–24 hours; menses 3–7 days, blood loss 30–40 mL on average and more than
  80 mL heavy; menarche 12–13 years; breast budding about 10; GnRH reawakening 8–13 years in
  girls; menopause about 51 (45–55); uterus about 7.5 cm, uterine tube about 10 cm, vagina
  7–10 cm; mature follicle about 2 cm; vaginal pH 3.8–4.5; progesterone temperature rise
  0.3–0.5 °C; pill failure under 1% with perfect use and about 7% typical; hormone therapy
  benefit judged favorable under 60 or within 10 years of menopause (NAMS 2022).
- **Simplifications:** spermatogonia types are not named; the meiosis page avoids
  fertilization, zygote, polar body, trisomy and Down syndrome (taught later) and the
  male-physiology page avoids capacitation and the acrosome reaction; "infundibulum" is avoided
  for the uterine tube (the pituitary owns the term), which gets a plain "funnel end"; the
  male-physiology sperm-motility question keys the midpiece as the best of the listed parts,
  with axonemal defects noted in the explanation.
- **Tool calls (tool writer and tool audit):** the 28-day hormone graph uses typical textbook
  values, not one woman's data, with estradiol peaking on day 12.5, LH on day 13.5 and
  ovulation on day 14; the endometrium on that graph is ultrasound thickness across both walls
  of the cavity (about 3–13 mm; the axis is labeled "Endometrium (ultrasound)"), and it now
  thins in the last days before bleeding and runs on continuously into day 1 instead of jumping
  from 11.5 to 7 mm; the ovulation-day calculator takes cycle length and a luteal phase of
  10–17 days (default 14), computes ovulation as cycle length minus luteal length, reports the
  follicular phase as cycle length minus luteal length against the model's 14 days, and gives
  a range from real luteal phases of 11–17 days; the word-root builder keeps separate part ids
  metr/o-uterus (Greek mētra, womb; distinct from metr/o, measure) and stat/o-stand (prostate,
  "one standing before"; distinct from stat/o, holding still); oocyte transport through the
  uterine tube is kept at about 3–4 days after the oocyte is caught, because unfertilized human
  ova have been recovered from the uterine cavity about 80 hours after ovulation (Croxatto
  1978); the testosterone-axis loop has inhibin braking FSH release by the pituitary, not the
  GnRH pulses; "ovary" is glossed through Latin ovarium (-arium, a place for) and
  "contraception" as "against conceiving" (coined in the 1880s).
- **Figures:** Figure 27.9 prints "Posterior fornix of uterus" (it is the vagina's fornix;
  covered for good and never asked, decision 48) and "Labium minora/majora" (named correctly,
  printed forms accepted); 27.4 prints "Septa (tunica albuginea)" (septa are extensions of the
  tunica albuginea; kept, "septa" is the answer); 27.8 draws an arrow from androgen-binding
  protein to testosterone release (label note and caption explain that ABP binds testosterone
  and does not cause its release); 27.11 draws the first polar body always dividing (label note:
  it often breaks down undivided); 27.17's widened ducts keep their "lactiferous sinuses" label,
  called the textbook name in the caption; 27.15 has errors and 27.18 teaches the gonadostat
  model (neither used); 27.5, 27.12, 27.14 and 28.24 credit third parties and need license
  verification, so there are no testis or ovary histology stations (the lab practical has male
  and female reproductive anatomy and a sperm and testis set instead).
- **Map gaps:** chiasma, synapsis, Klinefelter and Turner syndromes, dartos, cremaster,
  pampiniform plexus, tunica vaginalis and albuginea, rete testis, efferent ductules, the parts
  of the male urethra, PSA, BPH, vasectomy, cryptorchidism, torsion, inguinal hernia, emission
  and expulsion, PDE5, cGMP, ABP, the tubule compartments, DHT, 5-alpha reductase, aromatase,
  androgen insensitivity; ovarian and round ligaments, the tube's funnel end, vestibule and
  bulbs, areolar glands, Cooper's ligaments, atresia, the two-cell model, cumulus, kisspeptin,
  AMH, pulse coding, progestin, withdrawal bleed, perimenopause, thelarche, hypothalamic
  amenorrhea, PCOS.
- **Map change at publish:** "ovarian cycle" is now its own concept, taught in `ovarian-cycle`
  (spec decision 61), with a new glossary definition written at publish and not yet audited: the
  monthly sequence of follicle growth, ovulation and the corpus luteum's life and breakdown.
- **Etymology to confirm:** clitoris (no root given, because the origin of Greek kleitoris is
  uncertain), pubertas, prolifer-, theca, Graafian.
- **Names:** the androgen insensitivity vignette uses "she" (raised as a girl).

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
