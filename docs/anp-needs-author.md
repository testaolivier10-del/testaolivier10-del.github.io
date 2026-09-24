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
  For your exam note has not been added yet; the reviewer should decide whether one is needed.

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
