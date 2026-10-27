# Unit 1 review, topics 1.3-1.6 (author B scope)

Main checkout, branch `claude/appsych`, 2026-10-27. Independent accuracy check from the reviewer's own knowledge, a
current introductory text's standard content, `docs/appsych-ced-map.json`, `docs/appsych-research/framework.md`
(sections 3, 5, 7) and the original papers for the two named studies. Scope: `neural-firing` (1.3), `brain` (1.4),
`sleep` (1.5), `sensation` (1.6): lessons, notes, glossaries, questions (82 items, 9 stimuli), the tools data
`brain-map` and `sensation` (intro and how-it-works text), `frq-heredity-environment-aaq`, `frq-sleep-ebq`, and the 9
figures from `scripts/appsych-figures/author-b.mjs`. Author report: `docs/appsych-reviews/self-b.md`.

CED: the official PDF could not be read here (WebFetch returned binary data only), so objectives and exclusions were
checked against `appsych-ced-map.json` and framework.md section 3 (1.3 and 1.5 exclusions read in the CED by the
Phase 0 research; 1.4 and 1.6 codes third party). Every listed neurotransmitter, hormone, sleep disorder and sense
concept is taught; nothing excluded is taught as tested (no sodium-potassium pump, no unlisted neurotransmitters or
glands beyond the pituitary and the adrenal glands named only as adrenaline's source, psychoanalytic dream theory named
only as "outside this course" in one distractor explanation, no unlisted sleep disorders).

## Changes

| Topic / file | Item or place | What was wrong | Fix |
|---|---|---|---|
| sleep (questions) | stimulus `sleep-s1` text | Said the graph uses "W is awake, R is REM"; the plot's y labels now read Awake, REM, N1-N3, so the key text described labels that are not there | "from Awake at the top to N3 at the bottom; N1, N2 and N3 are the NREM stages from light to deep" |
| frq-sleep-ebq | Source 1 method | Students studied "until they could recall 25" pairs, yet the sleep group recalled 31 three days later: recall above the learning criterion after a delay is implausible | Criterion "at least 34" (31 and 24 after three days now read as forgetting) |
| frq-heredity-environment-aaq | Participants | "1,240 adults aged 18 to 30" included 75 birth parents of 18-30 year-old adoptees, who cannot themselves be 18-30 | Ages given for the adoptees and twins (18 to 30) and the birth parents (38 to 62); part E rubric, accept line and sample now say "most aged 18 to 30" |
| neural-firing (lesson) | hook | "Every one of these effects happens ... at the synapse": a dental anesthetic blocks firing along the axon (sodium channels), not at the synapse | "Every one of these effects comes down to how neurons fire and pass messages to one another" |
| neural-firing (notes) | glial cells | "Glial cells outnumber them": the old 10:1 claim; current counts put glia and neurons at roughly one to one (Azevedo et al., 2009) | "about as numerous as neurons" |
| sleep (notes, glossary, lesson) | restoration | Brain waste clearance during sleep stated as fact; it rests mainly on mouse work (Xie et al., 2013) and is debated in people | Notes: "animal studies suggest the brain may clear waste ... still being studied"; glossary "possibly"; lesson "recover and repair"; EBQ C(ii) sample keeps restoration without the waste claim |
| sleep (notes) | dreaming | "Everyone dreams, every night" overstated | "Nearly everyone dreams several times a night" |
| sensation (notes) | hearing loss | "Earbuds ... can cause it, which is why the high-pitch hair cells ... go first": a false "which is why" | "and noise usually damages the high-pitch hair cells near the base first" |
| figure `brain-inner` (generator) | Amygdala and RAS labels | Rendered: both leaders ended in empty space short of their labels (the label sat far left of where the leader stopped), so they read as pointing at nothing | Labels moved next to their leaders (right-aligned); label boxes regenerated |
| figure `sensation-ear` (generator) | "Damage here" bracket labels | Rendered: the tops of both labels were clipped by the top edge | Labels and brackets moved down 8-9 px |

Regenerated with `node scripts/appsych-figures/author-b.mjs`; only `brain-inner.svg`, `sensation-ear.svg` and their
`psychology/data/labels/*.json` changed (registry JSON byte-identical).

Keys changed: none. No item removed, no id changed.

## Numeric recheck

Own script (keys worked by hand from each stem, then graded through `psy-stats.js`, `psy-grade.js` and
`psy-questions.js` in the test harness vm): 7 of 7 keys right and every authored mistake graded wrong.
`psy-neural-firing-12` 35 (15, 75 wrong); `-21` 15 ms (0.015, 54 wrong); `psy-brain-7` 74 (110, 1 wrong);
`psy-sleep-3` 110 (5, 30 wrong); `psy-sleep-4` 23% (13.75 wrong); `psy-sensation-7` 92% (46, 36 wrong);
`psy-sensation-13` 9 Hz (3, 903 wrong). Worked examples in the notes (15 ms; 23%; 4 g) also check. Hypnogram plot
points read back: REM at 1.25, 2.50, 4.08, 5.50, 6.83 h lasting 10, 20, 25, 25, 30 min; N3 only before 3.5 h; matches
the stimulus text and items 1-4. FRQ plots match their stated numbers (AAQ r values; EBQ 31/24, 2.6/3.0/3.3; table
15/11 and 4/13 lapses, "about three times").

## Checked and fine

- Science: resting potential, threshold, peak and undershoot values; all-or-none and rate coding; refractory period;
  reflex arc; every listed neurotransmitter and hormone; agonist, antagonist and reuptake inhibitor (cocaine as a
  dopamine reuptake blocker, SSRIs, opioids as endorphin agonists, alcohol as a GABA enhancer); tolerance and
  withdrawal; MS (myelin) vs myasthenia gravis (acetylcholine receptors). Brainstem, medulla, RAS, cerebellum, reward
  center, limbic structures, lobes, motor and somatosensory strips, Broca's and Wernicke's areas and aphasias,
  contralateral control, EEG vs fMRI, lesioning limited to animal research, plasticity after hemispherectomy. Sleep
  stages (AASM N1-N3, REM), 90-minute cycles, N3 early and REM late, the five listed disorders with their stages,
  activation-synthesis vs consolidation vs restoration. Thresholds, Weber's law, signal detection, adaptation,
  interaction, synesthesia, rods and cones, blind spot, trichromatic and opponent-process theories, prosopagnosia,
  blindsight, place, frequency and volley theories, conduction vs sensorineural loss, umami, oleogustus (taught as
  proposed), supertasters, gate control, phantom limbs, vestibular sense, kinesthesis.
- Myths only inside correcting boxes (10% brain, left/right-brain people, subliminal advertising); oxytocin "trust
  spray" and Phineas Gage taught with their uncertainty.
- Real studies: Gazzaniga, Bogen & Sperry (1965) split-brain (case studies of a few epilepsy patients, visual field
  to opposite hemisphere, left hand finds the object) and Bartoshuk, Duffy & Miller (1994) PROP tasting (blue dye,
  papillae count, more supertasters among women) described accurately; the correlational limit is stated. Invented
  stimuli are labeled and attributed to no real researcher.
- Methods: experiment only for the randomly assigned drug trial and sleep studies; correlational for the phones, taste
  and twin studies; case studies for split-brain; operational definitions as measured; correlation never read as
  cause, third variable named; ethics items name safeguards the summaries describe.
- FRQs: 7 points, parts in exam order, one rubric line per point, a sample per part. AAQ samples name the method,
  measure, groups and safeguard and support generalization with participant traits. EBQ samples cite sources, use
  Source 1 then Source 3, consolidation then restoration, no restricted term as the concept.
- Items: one defensible key each; distractors are the course's content traps with explanations by content; apply or
  analyze 81 of 82 (the order item is recall); key strictly longest 6/18, 1/17, 3/15, 7/22 singles (under 40%);
  options are shuffled at display, so the key's authored position (always first) does not matter; sets of 3-5 items.
- Figures rendered with Playwright and inspected: neuron, lettered neuron (A-F as the alt text and items say), action
  potential, lobes, lettered lobes (A prefrontal, B motor strip, C occipital, D Broca, E Wernicke, F cerebellum: the
  keys of `psy-brain-1` to `-4` match), midline view, hypnogram, eye, ear. Anatomy is schematic but correct: front on
  the left, central sulcus with motor strip in front and somatosensory behind, temporal lobe below the lateral fissure,
  cerebellum under the occipital lobe, pituitary below the hypothalamus, amygdala in front of the hippocampus, the
  fovea on the visual axis with the optic disc offset, base of the cochlea for high pitches.
- Checks: `check-appsych-content --topic` 0 failing items for all four (the per-topic run counts exam-form unit
  weights from one topic only; the full run is 0 failing, FRQ 0); `check-appsych-map --check` "Nothing is used before
  it is taught"; `node --test scripts/test/appsych-*.test.mjs` 151 pass, 0 fail.

## Open (for a person)

- `ced-text`: confirm the 1.4 and 1.6 objectives and the 1.3 drug categories (stimulants, depressants, hallucinogens,
  opioids are taught; the map's knowledge line names only agonist, antagonist and reuptake inhibitor) against the CED
  PDF, which this review could not read.
- `figures-schematic`: a teacher should still glance at the brain figures; they read correctly to this reviewer.
- Sleep waste clearance (glymphatic system) is now taught as a tentative animal finding; add to needs-author
  `wording-cautious` if the lead agrees.
