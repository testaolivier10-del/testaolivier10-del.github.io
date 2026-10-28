# Tools review B: neuron, brain-map, sensation, development, social-influence

Independent reviewer, branch `claude/appsych`, 2026-10-27. Scope: the five trainers' models
(`psychology/assets/tools/math/<slug>.js`), data (`psychology/data/tools/<slug>.json`), validators
(`scripts/lib/appsych-tool-checks/<slug>.mjs`) and page scripts (read for science and visual checks; page scripts not
edited). Sources: the CED knowledge statements in `docs/appsych-ced-map.json`, mainstream introductory texts, and
the original or replication papers named below (Franzen and Mader 2023 and Fischer et al. 2011 checked online).

## How it was checked

- Science: every table entry, case, drug, published number, explanation and Why sheet line read against the sources.
- Keys: my own scratch script (`keys.mjs`, written from textbook tables, not the models' recipes) generated 1,000
  problems per context and type (40,000 problems), loaded through the runtime in a vm as the tests do, and checked
  every key (the drug, lesion, fMRI, split-brain, contralateral, Weber, threshold, SDT rate, afterimage, Piaget, Erikson,
  period and mean keys, and the direction keys), that every numeric key and its rounding grade right through
  `ApPsychMath.diagnose`, and that every authored slip and common wrong answer grades wrong.
- Browser: Playwright (Chromium) at 390 and 1440 px, 20 seeded drills per tool and width (200 drills): each step
  answered wrong first (always graded wrong), then right (all 200 winnable), plus checks for horizontal overflow,
  overlapping SVG text in the drill figure, and key text shown in the figure or its aria-label before answering
  (none). Rerun on the fixed models: clean. No console errors apart from blocked outside hosts.
- All five tool tests pass; `check-appsych-content.mjs --topic` reports 0 tool failures for all nine topics. The
  exam failures it also prints come from the exam builder's work in progress.

## Changes (science or grading)

| Tool | Where | What was wrong | Fix |
|---|---|---|---|
| development | `ERIKSON` stage 4 (model and validator) | Named "Competence vs. inferiority"; Erikson's term, and the one used everywhere else in the course (glossary, notes), is **industry vs. inferiority** | Renamed "Industry vs. inferiority" (id unchanged) |
| development | `methods` mean cell | Tolerance rel 0.005 + 0.051 accepted any answer within about 0.2 to 1.5 of the mean: the median (an authored slip) graded right in 416 of 3,000 problems, as did whole-number roundings | rel 0, abs 0.051 (the one-decimal answer only) |
| development | `PIAGET_T` pretend play [2, 4] | Age 2 is the preoperational boundary; 2 years 0 months was keyed preoperational while the stage text says 2 to 7 | Ages 3 to 4 |
| development | `PIAGET_T` scaffolding [5, 7] | Age 7 fell on the concrete-operational boundary, so the stage key flipped on a scaffolding scene | Ages 5 to 6 |
| development | `TEEN_T` emerging adulthood [21, 25] | At 25 the period key became "Adulthood" while the concept key said "Emerging adulthood": contradictory keys | Ages 21 to 24 |
| social-influence | conformity change "group grows from 1 to 3" | The scene already had 3 to 6 people, so "grows from 1 to 3" contradicted the stem (a larger group read as smaller) | Now "Only one other person, not {n}, answers before #": keyed lower (Asch: 2.8% with one versus 33.3% with three) |
| social-influence | conformity change "answer privately" | Also offered for the informational (unclear-answer) scenes and keyed "lower"; private answering removes normative pressure, not informational influence, so that key is not defensible | Only drawn for the clear (normative) scenes; the validator enforces it |
| social-influence | obedience change "touch the person harmed" | Drawn for scenes with no victim (laps, moving a car, data entry) | Removed from the drill (Explore keeps Milgram's touch condition) |
| social-influence | obedience scene "A coach in uniform" | The "uniform" change then said "now wears a uniform" in the same scene | "A coach" |
| social-influence | polarization scene | A jury leaning toward a *small* fine settling on the *largest* fine is a reversal, not polarization (which amplifies the initial lean) | Leans toward a large fine, ends on the largest |
| social-influence | self-serving attribution "kind" key | Keyed "Both: situational for own case, dispositional for the other case", which is the actor-observer wording; self-serving is dispositional for the success and situational for the failure | Key text for that scene: "Both: dispositional for the success, situational for the failure." |
| brain-map | fMRI "where" distractors | The keyed area competed with areas the task also activates: finger tapping (motor) against somatosensory and cerebellum; talking (Broca) against motor and auditory; listening (Wernicke) against auditory; balance (cerebellum) against motor; touch (somatosensory) against thalamus and parietal lobe | Each task lists `also` areas, excluded from its distractors; a region's own lobe or sub-area is never a distractor |
| brain-map | locate and lesion "job" options | "Somatosensory cortex" against "Parietal lobe" (its parent; the drawing cannot separate them by name, and both `does` start "Touch") | Same overlap rule |
| brain-map | prosopagnosia case | "underside of the brain toward the back" reads as occipital (fusiform gyrus is occipitotemporal), keyed temporal | "low on the side of the brain, on its underside near the ear" |
| neuron | `NT.glutamate.fn` | "excitation, learning and memory" sat beside acetylcholine's "muscle movement, learning and memory" in the `fn` step: two defensible options (612 of 9,000 problems) | "excitation: the brain's main 'go' signal" |
| neuron | substance P note | "Blocking substance P receptors can ease some kinds of pain" overstates: NK1 antagonists failed as analgesics | Prevent chemotherapy nausea; disappointed as painkillers |
| neuron | glia case | "Most cells in the brain are not neurons": the 10:1 ratio is a myth (about 1:1, Azevedo et al. 2009) | "About half the cells" |

Keys changed: the Erikson stage 4 option text; development `methods` mean tolerance; the conformity "bigger"
change replaced by "smaller" (key Lower); self-serving `kind` key text. No context or step ids changed.

## Checked and fine

- Neuron: rest -70, threshold -55, peak +40 mV, a dip below rest, absolute (2 ms) and relative (to 5 ms)
  refractory periods, all-or-none, rate code; sodium in, potassium out; saltatory conduction from node to node and
  MS as myelin damage. The 8 CED neurotransmitters and their roles. Drugs: nicotine (ACh agonist), curare (ACh
  antagonist), ropinirole (DA agonist), haloperidol (D2 antagonist), cocaine (DA, NE, 5-HT reuptake), SSRIs,
  atomoxetine (NE reuptake), propranolol (beta antagonist, worded "some receptors for norepinephrine and adrenaline"),
  ketamine (NMDA antagonist), benzodiazepine (positive modulator, labeled as the intro "agonist"), tiagabine (GABA
  reuptake), morphine (opioid agonist), naloxone (opioid antagonist), aprepitant (NK1 antagonist). Reflex arc. Trace
  keys counted from the plotted series. ACh, endorphins and substance P correctly not "reuptake" in invented drugs.
- Brain map: functions and damage for all 22 structures; Gage (1848, Harlow 1868, the debate noted), H.M. (bilateral
  medial temporal resection, Scoville and Milner 1957, mirror drawing spared), S.M. (bilateral amygdala, Feinstein
  et al. 2011), Olds and Milner (1954), hypothalamic lesion overeating; EEG versus fMRI timing; split brain
  (visual field to the opposite hemisphere, left-hemisphere speech, contralateral hand) for every field, hand and cut
  combination; no "left-brained" myth. Drawn positions: outside view lobes, the motor strip in front of and
  somatosensory behind the central sulcus, Broca frontal above the lateral fissure, Wernicke posterior temporal,
  occipital at the back, cerebellum under the occipital lobe behind the stem; inside view: callosum arch, thalamus
  over the stem, hypothalamus below it, pituitary under it, amygdala in front of the hippocampus, pons above medulla.
- Sensation: SDT from the normal model (hit = 1 - Phi(c - d), FA = 1 - Phi(c)); hit and false-alarm rates divide by
  the right trial counts; criterion shifts. Weber fractions (weight 2%, brightness 8%, loudness 5%, salt 8%, pitch
  0.3%) are within textbook ranges and labeled as such; JND keys and the notice decision. Threshold at 50%;
  opponent pairs; trichromatic and opponent stages; rods, cones, place, frequency (volley noted), gate control,
  phantom limb; adaptation against habituation; the 7 depth cues and the monocular or binocular split; the 4 CED
  Gestalt principles.
- Development: Piaget ages and hallmarks with the "earlier than Piaget thought" caveat, theory of mind via the
  Sally-Anne task, Vygotsky scaffolding; Erikson order and ages; the four strange-situation patterns (disorganized
  from Main and Solomon) and the correlational caveat; Baumrind's styles plus Maccoby and Martin's uninvolved, with
  the culture caveat; crystallized holding and fluid declining, dementia not normal aging; cross-sectional cohort
  effects against longitudinal attrition. No psychosexual stages.
- Social influence, checked against the papers: Asch 1951 majority sizes (0.33, 1.53, 4.0, 4.2, 3.84 and 3.75
  errors of 12, which are 2.8% to 35%), a partner 5.5%, 36.8% for 123 students (1955); Franzen and Mader (2023,
  PLOS ONE, 202 students in Bern, 33% errors); Bond and Smith (1996, 133 studies). Milgram conditions: remote 65%,
  voice feedback 62.5%, proximity 40%, touch 30%, telephone 22.5%, Bridgeport office 47.5%, two peers rebel 10% (all
  n = 40, all whole numbers of men); Burger (2009) 70% past 150 V against 82.5%; Haslam et al. (2014) 43% across 21
  conditions. Darley and Latane (1968): 85%, 62%, 31% before the end of the seizure and 100%, 85%, 62% eventually.
  Fischer et al. (2011) weaker in dangerous emergencies (abstract confirmed); Philpot et al. (2020) about 9 in 10 of
  219 conflicts. Michaels et al. (1982) 71 to 80 and 36 to 25; Latane, Williams and Harkins (1979) 82% and 74%.
  The Kitty Genovese correction is right.

## Visual notes (not fixed: page scripts are the builders')

- Drill figures at 390 px: the "Skip to content" link appears over the lower left of the stage after a Check (seen
  on brain-map and sensation drill shots); it should stay off screen until focused (shared chrome, not the tools).
- Development drill at 1440: the relationship lane's short bands (0 to 2) are unlabeled slivers; fine at a glance
  but the active band reads only from the caption above it.
- Neuron explore at 390: the dock's mode switch is partly hidden behind the "Start here" tip and the Stimulate
  button until the tip goes. Not an overlap in the drawing.
- Brain map inside view: the hypothalamus leader line crosses the hippocampus outline and the reward-center blob
  sits close to the pituitary label line; readable, but dense at 390 px.
- No horizontal page overflow, no overlapping SVG labels and no answer shown before its step at either width.

## Open questions for a person

- Erikson stage 4 id is still `competence` (only the name changed); the lead can rename the id if desired.
- Propranolol is a beta blocker (adrenergic antagonist); calling it a norepinephrine antagonist is the usual
  introductory simplification and is worded carefully, but an author may prefer to drop it.
- The benzodiazepine is labeled an agonist "as introductory courses call it"; it is a positive allosteric modulator.
  Kept, with the note.
