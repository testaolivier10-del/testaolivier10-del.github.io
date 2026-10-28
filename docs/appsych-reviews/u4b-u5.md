# Review: topics 4.4-4.7 and 5.1-5.5 (authors F and G)

Branch `claude/appsych`, 2026-10-27. This is an independent accuracy check against `docs/appsych-ced-map.json` and `docs/appsych-research/framework.md` sections 3, 5 and 7. It also used the DSM-5-TR criteria as I know them, mainstream introductory texts, and current reviews of treatment evidence.

The scope covered these topics: `psychodynamic-humanistic`, `social-cognitive-trait`, `motivation`, `emotion`, `health-psychology`, `positive-psychology`, `explaining-disorders`, `disorders` and `treatment`. For each topic I checked the lesson, notes, questions, glossary and figure entries: 229 items and 27 stimuli in all. It also covered five FRQs (`frq-motivation-aaq`, `frq-social-cognitive-trait-ebq`, `frq-health-psychology-ebq`, `frq-treatment-depression-ebq`, `frq-treatment-anxiety-ebq`), nine figures (`author-f.mjs`, `author-g.mjs`) and the self reports `self-f.md` and `self-g.md`.

I could not read the CED PDF: WebFetch returned only binary data. So the learning objectives and exclusions for 4.4-5.5 rest on the third-party copy only (needs-author `ced-text`, `exclusions`).

## Changes

| Topic | Item / file | What was wrong | Fix |
|---|---|---|---|
| explaining-disorders | `psy-explaining-disorders-2`, option 1 | The distractor "Clinicians diagnose disorders in people under the age of 18 years" made no sense in the stem and was not plausible. | Replaced with "He lives alone, so no one can observe his symptoms", with an explanation. The key is unchanged. |
| social-cognitive-trait | `psy-social-cognitive-trait-14`, option 0 | "too large to show a clear pattern" was a nonsense distractor. | Replaced with "too small to show any pattern at all", with an explanation that names the real problem: the study is correlational. |
| disorders | `psy-disorders-1`, option 2 | "Seasonal sleep disorder" is not a DSM-5-TR disorder, so the distractor was a made-up label. | Changed to posttraumatic stress disorder, with an explanation. |
| disorders | `psy-disorders-26`, why | "The DSM-5-TR moved PTSD" was inaccurate: the DSM-5 (2013) made the move. | The explanation now says it has been in trauma- and stressor-related since the DSM-5 and still is in the DSM-5-TR. |
| disorders | glossary `schizophrenia` | It left out the DSM-5-TR rule that at least one symptom must be delusions, hallucinations or disorganized speech. It also left out the one-month active phase. | Both added. |
| disorders | notes | "some autistic people" was the one place that did not use person-first language, against the guide. | Changed to "some people with autism". Identity-first wording is also widely accepted, so this follows the house rule only. |
| explaining-disorders | notes | "The diathesis-stress model adds timing" was misleading, because the model says nothing specific about timing. | Changed to "spells out how two kinds of cause combine". |
| treatment | notes | Two claims were overstated. The therapeutic alliance was called "the strongest common predictor". "For many disorders" combined treatment beats either alone, and CBT's gains last longer. | The alliance is now "one of the most consistent predictors". The combined-treatment claim is limited to depression, and the lasting-gains claim to depression and several anxiety disorders, compared with medication alone. |
| motivation | `psy-motivation-3`, notes, glossary `instinct-theory` | The salmon homing example is wrong: salmon return to their home stream by imprinting on its smell, which is learned. A stem saying they never saw another salmon "learn" it would teach a false claim. | Replaced with a spider raised alone that spins its species' web on the first try, a standard example of a fixed, unlearned pattern. The key is unchanged (instinct theory). |
| psychodynamic-humanistic | `-13` and `-18` | The key was the longest option, and noticeably so. Across the topic the key was the longest in 9 of 20 single items (45%), above the 40% limit. | Shortened both keys. The key is now the longest in 7 of 20 (35%). |
| emotion, positive-psychology | `psy-emotion-14`, `psy-positive-psychology-11` | These numeric difference items were tagged practice `3.A`, while every other subtraction item in scope is `3.B` (calculate). | Changed to `3.B`. |
| social-cognitive-trait FRQ | B(ii) rubric line 2 accept list and `write.concept` | "personality inventory: the same inventory measured traits consistently" was accepted as the concept. That is a measurement and method point, not a psychology concept, and readers would not credit it. | Replaced with temperament (partly inborn tendencies that carry forward). |
| treatment-anxiety FRQ | C(ii) rubric line 2 accept list | The bare word "counterconditioning" was accepted. Source 3 is exposure with no pairing with a pleasant response, so it does not fit the evidence. | Replaced with habituation, applied to the evidence. Counterconditioning stays only as a live hint word. |
| treatment-depression FRQ | B(ii) sample | It stated as fact that exercise lowers depression by releasing endorphins. The mechanism is not established. | Reworded as one proposed reason. |

No key changed on any item. No item was removed and no id changed, so `psychology/data/exams/forms.json` is unaffected.

## Numeric recheck

I recomputed all 15 numeric keys in scope with my own scratch script, written from the stems and not from the `from` recipes. Each was then graded through `psy-stats.js`, `psy-grade.js` and `psy-questions.js`, loaded in a vm in the same way as `appsych-questions.test.mjs`. Every key graded right. Every authored mistake (30) graded wrong, and each matched its own feedback note. There were 0 problems before and after the edits.

Examples:
- median 22 and mean 25.14 (hurricane scores)
- 3.25 (mood weeks)
- 118.8 (immune index)
- 84% below +1 SD
- 9.67 (mean of the three drops)
- 0.5 (gratitude change)

The scatter in `social-cognitive-trait-s2` recomputes to r = 0.90, which matches "about 0.9" in the item's explanation. Every plot label matches its values and the numbers in its stems. All of the numbers can be worked by hand.

## Checked and fine

- **DSM-5-TR categories and time rules.** These all match the manual:
  - MDD: 5 or more symptoms, including low mood or loss of interest, for 2 weeks or more.
  - PDD: 2 years in adults, 1 year in youth.
  - Mania: 1 week, or any length if the person is hospitalized. Hypomania: 4 days.
  - Bipolar I needs mania only. Bipolar II needs hypomania plus a major depressive episode.
  - GAD: 6 months. Panic disorder: a month or more of worry after the attacks. PTSD: more than 1 month.
  - Schizophrenia: 6 months.
  - ADHD: 2 or more settings.
  - Antisocial personality disorder: an adult whose pattern began by early adolescence.

  The category placement follows the DSM-5-TR: OCD and hoarding in obsessive-compulsive and related, and PTSD in trauma- and stressor-related. The culture-bound syndromes are called "cultural concepts of distress", which is correct. Only the disorders the CED lists appear, and personality clusters A, B and C are complete.
- **Language and help.** Person-first language is used throughout (no "schizophrenic", "committed suicide" or diagnosis used as an adjective). There are no self-diagnosis prompts, and the notes for 5.3 and 5.4 say only a clinician can diagnose. `"help": true` is set on explaining-disorders, disorders and treatment. Health psychology (5.1) correctly does not have it (needs-author `mental-health-line`).
- **Treatment evidence.** The claims are stated honestly:
  - Exposure is among the best-supported treatments for phobias, panic and OCD (with ERP).
  - CBT has the broadest support of any psychotherapy.
  - DBT was developed for self-harm and borderline personality disorder.
  - Aversion therapy's effects fade.
  - SSRIs take weeks to work. Benzodiazepines carry a risk of tolerance and dependence. Lithium has a narrow therapeutic range and lowers suicide risk.
  - Antipsychotics act as D2 antagonists and can cause tardive dyskinesia.
  - ECT is effective for severe, treatment-resistant depression, with memory side effects. TMS is done awake.
  - Hypnosis helps with pain and anxiety but not memory recovery. The lobotomy is history.

  The FRQ claims are also fair. Exercise matching CBT and medication is in line with recent meta-analyses, and the depression source design has a stretching control. The anxiety FRQ shows CBT relapse lower than SSRI relapse after treatment stops.
- **Exclusions.** Emotion theories are taught by sequence only. No James-Lange, Cannon-Bard or Schachter-Singer name appears in scope. The arousal-injection study is unnamed and has its replication caveat. Maslow and the psychosexual stages do not appear, and Freud is named only as a memory hook.
- **Replication status.** Facial feedback is described accurately: the 17-lab pen replication found no effect, and later multi-lab work found small effects for some methods. Repression comes with the false-memory caution. Posttraumatic growth notes the prospective-study caveat. Tend-and-befriend and universal emotions are hedged.
- **Research methods.** Every study stimulus is `invented: true`, and none is attributed to a real researcher. Each method is named correctly: the hurricane study is correlational and the resilience study is longitudinal. Random sampling and random assignment are kept apart. Every correlation item names a third variable. Significance is never treated as size (gratitude: significant but small). Each ethics key names a safeguard the summary actually describes. Generalization is based on participant characteristics.
- **AAQ (motivation).** The parts are A-F, worth 1,1,1,1,1,2 = 7 points. The study describes four safeguards. The overjustification design is faithful to the original research: the reward was expected, the measure was free-choice time, and there was debriefing after the hidden timer.
- **EBQs.** Each has three sources with a graph or table, 7 points, and parts in exam order. Each C(i) uses a different source from B(i), and each C(ii) uses a different concept from B(ii). No sample uses a restricted term as its concept.
- **Item quality.**
  - Apply/analyze rates by topic range from 90% to 100%, so all are at least 70%.
  - The key is the longest option in 11% to 37% of single items per topic after the fixes.
  - Key positions are spread evenly.
  - Each stimulus set has 3-5 items.
  - No near-duplicates.
- **Figures.** All nine were rendered to PNG with Playwright and inspected. They are correct and readable:
  - the iceberg and humanistic chain
  - reciprocal determinism
  - the Yerkes-Dodson curves (labeled as model curves)
  - the three emotion sequences with no theory names
  - the GAS curve (alarm dip, resistance above normal, exhaustion below normal)
  - the six virtues with their strengths in the right categories
  - the diathesis-stress bars, which agree with items 14-16
  - the categories grid, which agrees with items 26-29
  - the treatment approaches table, which agrees with items 33-37

  No regeneration was needed.
- **Checks.** `check-appsych-content --topic` passes for all nine topics, and the full run shows FRQ 0 and bank 0 failing. The per-topic runs report exam-form weight failures that belong to the exams builder's in-progress `forms.json`, not to this scope; the full run reports 0. `check-appsych-map` says nothing is used before it is taught. `appsych-questions.test.mjs` passes 5 of 5.

## Open (for a person)

- **`ced-text` and `exclusions`.** The CED PDF was not readable here. Someone should confirm the LOs and exclusions for 4.4-5.5, especially whether the CED lists OCD, hoarding and the cultural concepts beside the anxiety disorders. We follow the DSM-5-TR (author G, point 2).
- **DID causes.** These are taught as debated (trauma model versus sociocognitive model). That is mainstream, but the owner should approve the framing.
- **Person-first versus identity-first for autism.** We follow the house rule ("person with autism"). Many autistic self-advocates prefer identity-first language, so the owner may want to allow both.
- **Exercise for depression.** The FRQ says exercise works "about as well as CBT or medication". That is consistent with recent meta-analyses for mild to moderate depression, but blinding is weak in those trials, so a teacher should confirm the wording.
- **Help line for non-US readers.** This is still open (`help-scope`).
