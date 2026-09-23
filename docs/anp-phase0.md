# A&P course: Phase 0 dependency map

Status: **awaiting review** (Phase 0 of `docs/anp-spec.md`). No lessons have been written.

The map itself is `docs/anp-dependency-map.json`, and `node scripts/check-anp-map.mjs --order`
prints the course order. This document explains the map. If the two ever disagree, the JSON is
right. `scripts/check-anp-map.mjs` runs in CI and fails the build if any concept depends on
something taught later without a declared preview box. Once pages exist, it also fails if a page
uses a term before the topic that teaches it (the spec, section 7).

## What the map contains

| | |
|---|---|
| Chapters | 27: 5 Foundations, 11 tagged A&P I, 11 tagged A&P II |
| Topics | 162: 83 tagged A&P I, 79 tagged A&P II. By kind: 93 physiology, 50 anatomy, 19 mixed |
| Concepts | 1,000, each with the topic that teaches it and the concepts it directly depends on |
| Core concepts | 8: homeostasis, flow down gradients, cell-to-cell communication, structure and function, mass balance, energy and ATP, membranes and compartments, interdependence of systems |
| Pulled-forward short versions | 27 decisions recorded in `circularDependencies` |
| Preview boxes | 32 |
| Planned tool content | 105 comparison tables, 23 feedback loops, 68 pathways, 35 graphs, 89 prediction themes (L1–L4), 13 calculators, 87 lab practical image sets |
| Open questions | 11, in `needsAuthor` (listed at the end) |

Every concept's aliases are the words its topic "owns" in two places: the glossary tooltips, and
the page check. When a plain word means two different things (ventricle, choroid, insertion, T4),
both concepts get a qualified label, for example "ventricle (heart)". The page check skips
qualified labels. When a short early version and a full later version share a word, the early
version owns the plain word. Otherwise the early page, which is the one introducing the word, would
fail its own check.

## How the map was checked

1. I drafted the map, then the validator found 32 errors: 20 previews that no concept actually
   needed, 8 words claimed by two concepts, 1 unknown id, and 3 dependency cycles. All were fixed.
2. **Coverage review.** A separate agent checked the map against OpenStax 2e, the TEAS 7 A&P
   content and the HAPS outcomes (used as a private checklist only). It found about 30 gaps, and
   all were added. The main ones: bone markings, fibrous and cartilaginous joint subtypes, other
   named joints, sex differentiation and puberty, aging, medical imaging, basic chemistry topics
   (isotopes, reaction rates, salts), cell-cycle control, the tactile and dendritic cells of the
   skin, fascicle arrangement, pituitary disorders, iron handling, pathogen-specific defenses,
   airway defenses and urinary disorders. **Caveat:** openstax.org is blocked from this
   environment, so this comparison was made from the reviewer's knowledge of the book, not the
   live table of contents (see `openstax-toc-offline` below).
3. **Ordering and accuracy review.** A second agent read the map as a skeptical instructor would.
   It looked for concepts that secretly need something taught later, and for factual errors. It
   found about 60 issues. Most were applied; the few I handled differently are listed after
   this list. The main ones:
   - Foundation pages named organs, blood cells and blood pressure long before their topics.
     These were fixed with short basic versions.
   - The primer taught pH before proteins and enzymes, which is the reason pH matters. It was
     reordered.
   - Organelles and cell junctions now come before transport.
   - Tissue repair moved after chemical messengers.
   - In the endocrine chapter, the pancreas now comes before the adrenal glands, because cortisol
     needs gluconeogenesis.
   - Factual fixes: "myogenic response" was listed as the smooth muscle stretch-relaxation
     response, which is its opposite. Vitamin K was listed under anticoagulants. Hydrocephalus
     was listed as a bleed.
   - Points where current sources disagree now have `needsAuthor` entries.

   Handled differently from the reviewer's suggestion:
   - ADH acting on the collecting duct, oxytocin in labor, and the breathing muscles needing
     inspiration can all be written in plain words ("the kidney tubules", "childbirth",
     "breathing in") without the later term. So they get no preview box.
   - Some word pairs were flagged as false synonyms: acidosis/acidemia, osmolarity/osmolality,
     ketosis/ketoacidosis, creatine phosphate/creatine kinase. These stay together as aliases,
     because an alias means "words this topic teaches", not "synonym". The JSON's `about` now
     says so.
   - Some everyday words stay tagged on purpose, because an early use of them really does need
     a preview box: "reflex", "fever", "pupil" and "accommodation".

## Proposed chapter and topic order

**Foundations**

| Chapter | Topics |
|---|---|
| Orientation to the body | 1. Levels of organization and organ systems; 2. Medical word parts; 3. Anatomical position and directional terms; 4. Body planes and sections; 5. Body cavities and serous membranes; 6. Body regions and abdominal quadrants |
| Chemistry and physics for physiology | 7. Atoms, ions and chemical bonds; 8. Water, solutions and concentration; 9. Carbohydrates, lipids, proteins and nucleic acids; 10. Acids, bases, pH and buffers; 11. Energy, metabolism and enzymes; 12. Gradients, pressure and flow; 13. Diffusion and osmosis; 14. Charge, voltage and current |
| Cells | 15. The cell and its plasma membrane; 16. Organelles and the cytoskeleton; 17. Cell junctions; 18. Passive transport; 19. Active transport and vesicles; 20. The nucleus, DNA and genes; 21. From gene to protein; 22. Cell division and differentiation; 23. How cells make ATP |
| Tissues | 24. Epithelial tissue; 25. Connective tissue; 26. Muscle tissue types; 27. Nervous tissue |
| Signals, repair and control | 28. The resting membrane potential; 29. Graded potentials and action potentials; 30. Chemical messengers and receptors; 31. Glands: endocrine and exocrine; 32. Body membranes and tissue repair; 33. Homeostasis and feedback loops |

**Tagged A&P I**

| Chapter | Topics |
|---|---|
| Integumentary system | 34–37: layers of the skin; hair, nails and glands; functions of the skin; burns, wounds and repair |
| Bone tissue | 38–42: bone functions and long bone structure; bone cells and tissue; formation and growth; remodeling and fracture repair; bone and blood calcium |
| The skeleton | 43–47: axial skeleton and skull; vertebral column; thoracic cage; pectoral girdle and upper limb; pelvic girdle and lower limb |
| Joints | 48–50: classifying joints; synovial joints; movements |
| Muscle tissue | 51–58: skeletal muscle structure; neuromuscular junction; excitation–contraction coupling; cross-bridge cycle; motor units and tension; energy and fatigue; fiber types; smooth and cardiac muscle |
| The muscular system | 59–63: how muscles move bones; head and neck; trunk; shoulder and upper limb; hip and lower limb |
| Nervous tissue and neural signaling | 64–67: organization; neurons and glia; the action potential in detail; synapses and neurotransmitters |
| The brain and spinal cord | 68–71: regions of the brain; meninges, ventricles and CSF; spinal cord; cortical functions, memory, language, sleep |
| Nerves, reflexes and pathways | 72–77: spinal nerves and plexuses; cranial nerves; sensory receptors and ascending pathways; motor pathways; reflexes; the neurological exam |
| Special senses | 78–80: taste and smell; vision; hearing and equilibrium |
| The autonomic nervous system | 81–83: divisions; neurotransmitters and receptors; control and visceral reflexes |

**Tagged A&P II**

| Chapter | Topics |
|---|---|
| The endocrine system | 84–89: hormones and how they act; hypothalamus and pituitary; thyroid and parathyroid; pancreas and blood glucose; adrenal glands; other endocrine organs |
| Blood | 90–94: composition; red cells and hemoglobin; white cells and platelets; hemostasis; blood types |
| The cardiovascular system | 95–110: heart location and wall; chambers, valves and great vessels; blood flow and the two circuits; cardiac muscle action potential; conduction system; ECG; cardiac cycle; vessel structure; major arteries; major veins; blood pressure, flow and resistance; cardiac output; capillary exchange; short-term BP regulation; long-term BP regulation; hypertension, heart failure and shock |
| Lymphatic and immune systems | 111–116: lymphatic system; innate immunity; antigens and antigen presentation; T cells; B cells and antibodies; immune disorders |
| The respiratory system | 117–125: upper airway; lower airway and lungs; ventilation; lung volumes; gas exchange; O2 transport; CO2 transport; control of breathing; respiratory disorders |
| The digestive system | 126–132: organization and regulation; mouth to esophagus; stomach; small intestine; liver, gallbladder, pancreas; large intestine; chemical digestion and absorption |
| Metabolism and nutrition | 133–137: nutrients; carbohydrate metabolism; lipid and protein metabolism; fed and fasting states; energy balance and body temperature |
| The urinary system | 138–143: kidneys and tract; nephron; glomerular filtration; tubular transport; concentrating the urine; urine, clearance and kidney hormones |
| Fluid, electrolyte and acid–base balance | 144–147: fluid compartments and water; electrolytes; acid–base regulation; acid–base disorders and compensation |
| The reproductive system | 148–153: meiosis and gametes; male anatomy; spermatogenesis and male hormones; female anatomy; oogenesis and ovarian cycle; hormonal control of the cycles |
| Development and inheritance | 154–162: fertilization; cleavage and implantation; placenta; fetal development and circulation; pregnancy; labor and birth; newborn and lactation; inheritance; aging |

**Where this departs from OpenStax order, and why:**
- Homeostasis closes Foundations, so that nerves, hormones and glands are already taught when
  the feedback loop uses them.
- Within cardiovascular, vessel anatomy comes before blood pressure physiology, because the
  baroreceptor reflex needs the carotid sinus.
- Fetal circulation moves to development, because it needs the placenta.
- The pancreas comes before the adrenal glands.
- pH comes after proteins and enzymes.
- Tissue repair follows chemical messengers.

## Topics pulled forward into Foundations (and other short early versions)

Each pulled-forward item is a short version with a concrete example that points to its full
treatment (`fullIn` in the JSON).

| Short version | Where | Full treatment | Why |
|---|---|---|---|
| Resting membrane potential; graded vs action potentials | Topics 28–29 | Action potential in detail (66), cardiac muscle AP (98) | Muscle (A&P I) comes before the nervous chapters; the heart needs them too |
| Chemical messengers, receptors, second messengers, a basic synapse | 30 | Hormones (84), synapses (67) | Bone, skin and the NMJ need hormones and transmitters early |
| Homeostasis and feedback loops (plus a one-line definition in topic 1) | 33, 1 | Every system chapter | The organizing framework |
| Gradients, flow equation and radius effect; diffusion and osmosis; voltage | 12–14 | Capillaries, lungs, kidneys | Used by every system |
| Blood pressure and blood volume (basic) | 12 | BP chapter (105, 109) | Used by vasoconstriction, sympathetic effects, RAAS, ANP and burns |
| How cells make ATP | 23 | Carbohydrate metabolism (134) | Muscle energy systems are A&P I |
| Vasoconstriction and vasodilation | 26 | Vessel structure (102) | Skin, ANS and inflammation need them |
| Arteries, veins, capillaries (basic); the major organs by name | 1 | Cardiovascular and each system | Every foundation page names them |
| Red cells, white cells, platelets; a clot | 15, 25 | Blood chapter | Tonicity, connective tissue, bone marrow, tissue repair |
| Inflammation (histamine, mast cells); macrophage | 32, 25 | Innate immunity (112) | Tissue repair, burns, fracture repair |
| Blood cell formation | 38 | Blood composition (90) | Red marrow in the bone chapter |
| Blood potassium and the resting potential | 28 | Electrolyte balance (145) | The heart uses hyperkalemia |
| Acidosis and alkalosis (definitions) | 10 | Acid–base disorders (147) | Ketoacidosis, hyperventilation, CO2 transport |
| Cardiac muscle autorhythmicity | 58 | Conduction system (99) | The muscle chapter compares all three muscle types |
| Antigen and antibody (basic) | 92 | Adaptive immunity (113, 115) | Lymphocytes and blood typing |
| Glycogenesis, glycogenolysis, gluconeogenesis | 87 | Carbohydrate metabolism (134) | Insulin, glucagon, cortisol |
| RAAS | 88 | Long-term BP (109) | BP control comes before the urinary chapter |
| Hypoxia (basic) | 89 | Oxygen transport (122) | EPO |

## Every preview box, and why

Each box is one narrow fact that isn't worth a foundation topic. It gives just enough and links
forward.

| Topic | Previews | Taught in | Why |
|---|---|---|---|
| 33 Homeostasis | hypothalamus | 68 | "The hypothalamus is the control center" for the temperature example |
| 33 Homeostasis | oxytocin | 85 | The childbirth example of positive feedback |
| 34 Layers of the skin | hemoglobin | 91 | Skin color and cyanosis |
| 34 Layers of the skin | antigen-presenting cell | 113 | Epidermal dendritic cells |
| 36 Functions of the skin | hypothalamus | 68 | The temperature loop again |
| 36 Functions of the skin | calcitriol | 86 | The vitamin D pathway ends at the active hormone |
| 40 Bone growth | growth hormone; sex hormones | 85, 89 | What drives and closes the growth plate |
| 41 Remodeling | sex hormones | 89 | Estrogen and osteoporosis |
| 42 Bone and blood calcium | PTH, calcitonin, calcitriol | 86 | The spec's own example |
| 55 Motor units and tension | stretch reflex | 76 | Muscle tone |
| 63 Hip and lower limb | sciatic nerve | 72 | Injection sites avoid it |
| 68 Regions of the brain | pituitary gland | 85 | The hypothalamus controls it |
| 82 Autonomic receptors | bronchioles | 118 | Beta-2 effects |
| 86 Thyroid | antibody (basic) | 92 | Graves disease |
| 87 Pancreas | renal transport maximum; ketones | 141, 135 | Glucose in urine; diabetic ketoacidosis |
| 89 Other endocrine | T cell; atria | 113, 96 | Thymosin; ANP |
| 91 Red blood cells | bile; spleen; intrinsic factor | 130, 111, 128 | Bilirubin excretion; red cell removal; pernicious anemia |
| 94 Blood types | placenta; IgG vs IgM | 156, 115 | Hemolytic disease of the newborn |
| 96 Chambers and valves | foramen ovale | 157 | The fossa ovalis |
| 102 Vessel structure | ventilation pressures | 119 | The respiratory pump |
| 107 Capillary exchange | lymphatic vessels | 111 | Where filtered fluid goes |
| 109 Long-term BP | pressure natriuresis | 143 | The kidneys set blood volume |
| 110 BP disorders | anaphylaxis; LDL | 116, 135 | Anaphylactic shock; atherosclerosis |

The hypothalamus is previewed twice (topics 33 and 36). If you'd rather have no repeated
previews, a one-line "hypothalamus (basic)" could be pulled into Nervous tissue (27).

## Planned tool content per chapter

The full lists, with the topic each item belongs to and prediction levels, are in `chapters[].tools`.
Highlights by chapter:

- **Foundations:** tables for passive vs active transport, tonicity, the three junctions,
  epithelial types, the three muscle tissues, graded vs action potentials, nervous vs endocrine
  signaling, endocrine vs exocrine, negative vs positive feedback. Pathways for protein synthesis,
  the secretory pathway, mitosis and cellular respiration. Graphs for the pH scale, flow vs
  radius, enzyme activity, resting potential, a generic AP and set-point oscillation. A flow and
  resistance calculator. Histology stations for every tissue. The first word root bank.
- **Integumentary:** the temperature loop; the rule-of-nines calculator; skin layer and hair
  follicle images; a burn prediction (L3: fluid volume and blood pressure).
- **Bone and skeleton:** the blood calcium loop; endochondral ossification and fracture repair
  pathways; a bone-mass-across-life graph; six skeletal image sets and an osteon station.
- **Joints and muscle:** NMJ, excitation–contraction, cross-bridge and relaxation pathways;
  myogram, length–tension and energy-system graphs; predictions for curare-type blockers,
  cholinesterase inhibitors and rigor; fiber-type and lever tables; five muscle-region image sets.
- **Nervous (five chapters):** AP and synapse pathways; AP and summation graphs; reflex arc,
  ascending and corticospinal pathways; eye, ear, brain, spinal cord, cranial nerve and plexus
  image sets; UMN vs LMN and sympathetic vs parasympathetic tables; beta-blocker, atropine and
  fright predictions.
- **Endocrine:** loops for glucose, the thyroid axis, the cortisol axis and full calcium;
  cAMP, steroid, RAAS and HPA pathways; a steroid-withdrawal prediction (L4).
- **Blood:** EPO and clotting loops; hemostasis and bilirubin pathways; a blood smear station.
- **Cardiovascular (the pilot):** 8 tables; baroreceptor and RAAS loops; 4 pathways; 9 graphs
  (ventricular and pacemaker APs, ECG, Wiggers, PV loop, Frank–Starling, pressure profile,
  velocity vs area, capillary pressures); 5 calculators (CO, SV and EF, MAP, flow and resistance,
  capillary NFP); 10 prediction themes (L2–L4, including hemorrhage with compensation); 9 image
  sets.
- **Immune:** fever loop; inflammation, antigen presentation and B cell pathways; the
  primary vs secondary response graph.
- **Respiratory:** CO2/pH and O2 loops; 4 pathways; O2–Hb curve with shifts, spirogram, breath
  pressures and PO2/PCO2 graphs; a ventilation calculator; 7 predictions (altitude is L4).
- **Digestive and metabolism:** enzyme and GI-hormone tables; a pathway for each macronutrient;
  a fasting-fuel graph; cyanide, starvation and DKA predictions; the full thermoregulation loop.
- **Urinary and fluid/acid–base:** TGF, osmolarity and pH loops; filtrate and blood-through-kidney
  pathways; GFR autoregulation, Tm and medullary gradient graphs; NFP, clearance and the stepwise
  ABG interpreter; vomiting, diarrhea, DKA and COPD (L4) predictions.
- **Reproduction and development:** HPG and LH surge loops; a 28-day cycle graph; labor and milk
  ejection loops; fetal circulation pathway; a Punnett square calculator.

## What could not be ordered cleanly

1. **The pilot is out of order by design.** Cardiovascular (topics 95–110) directly depends on 22
   concepts from chapters the pilot won't build:
   - muscle: cardiac features, calcium release, tetanus, length–tension, smooth muscle
   - nervous: AP phases, refractory periods, the brainstem, the vagus nerve, receptor types
   - autonomic: beta and muscarinic receptors, sympathetic effects
   - endocrine: ADH, RAAS, ANP, the portal system
   - blood: plasma proteins
   - two bones used as landmarks

   The build check compares course order, not build order, so it will pass. But the "what this
   builds on" links will point at pages that don't exist yet. See `pilot-forward-links`.
2. **The feedback loop's standard examples** (temperature, childbirth) still need two preview
   boxes even at the end of Foundations. The alternative is examples built only from Foundations
   material, such as blood pH and blood glucose without naming insulin.
3. **Starling forces and the coagulation cascade** are taught one way in exams and textbooks and
   another in current physiology. Both are flagged, and neither can be settled by ordering.
4. **Plain words with two meanings** (ventricle, alveolus, choroid, cleavage, insertion) are
   ordered correctly, but the page check can't see them. They are qualified and skipped, so the
   check covers them through their unambiguous companions ("left ventricle", "lateral ventricles").

## Estimate for Phases 1–3

These are counts from the map. The time ranges are agent working time, excluding your review.

| Phase | Scope | Topics | Minimum questions (15 per topic) | Estimate |
|---|---|---|---|---|
| 1 Pilot | Foundations and cardiovascular; all eight tools built; course home, chapter page, dashboard pieces, glossary, visual language file, OpenStax similarity check, page-level build check | 49 (33 and 16) | 735, plus CV prediction, pathway and ID items | 30–40 hours. Roughly a third of that is tool and page infrastructure built once; the rest is content and the two-stage audit, at about 25–35 minutes per topic with parallel agents |
| 2 | Respiratory and nervous (STOP), then the rest of A&P II, then TEAS mode | 83 (9 + 20, then 54) | 1,245 | 40–55 hours. Tools already exist, so this is content, audit and image pin sets |
| 3 | The rest of A&P I and both cumulative finals | 30 | 450 | 20–30 hours. Anatomy-heavy: about 30 lab image sets with pin coordinates are the slowest part |
| **Total** | | **162** | **2,430** | **90–125 hours** |

The biggest uncertainties:
- how many passages the OpenStax similarity check sends back for rewriting
- how much time pinning the lab-practical images takes (placing pins by hand is slow; I'll
  measure it on the cardiovascular sets and re-estimate before Phase 2)
- how often the skeptical audit rejects a draft

## Decisions for you (`needsAuthor`)

1. **pilot-forward-links:** during the pilot, prerequisite links to unbuilt chapters show a
   "coming soon" page. The 22 concepts above get glossary entries in Phase 1, so tooltips work.
   Accept, or build short stub topics instead?
2. **course-slug:** `/anp/` (proposed, matches `/nremt/` and `/ochem/`) or `/anatomy-physiology/`?
3. **teas-weighting:** ATI publishes no per-system count for the 18 A&P items. Proposal: weight
   by this map's topic counts and label the result as an estimate.
4. **receptor-two-meanings:** prose always says "sensory receptor" or "receptor protein". The
   loop builder slot reads "Receptor (sensor)".
5. **hypoxic-drive:** teach V/Q mismatch and the Haldane effect as the mechanism, and name hypoxic
   drive as a misconception. Needs instructor review.
6. **starling:** teach the classic picture that exams test, with a going-further box on the
   revised Starling principle.
7. **coagulation-model:** teach the cell-based sequence, and present the intrinsic and extrinsic
   pathways as the lab model.
8. **endocrine-course-tag:** endocrine is tagged A&P II. It is a filter only.
9. **chemistry-kind:** the primer topics count as physiology for the 60% apply/analyze rule.
10. **minor-contested:** precapillary sphincters, calcitonin in adults, apocrine secretion mode.
11. **openstax-toc-offline:** re-run the coverage comparison against the live OpenStax table of
    contents once the network allows it, before Phase 1 content is written.
