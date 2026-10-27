# AP® Psychology authoring guide

Rules for writing AP® Psychology content, adapted from `docs/apenv-authoring-guide.md`. They come from
`docs/appsych-spec.md`; where this guide and the spec differ, the spec wins. File formats are in
`docs/appsych-architecture.md` ("Content formats"). The research is in `docs/appsych-research/framework.md`; every
rule below that names an error comes from its section 7 (the 2025 Chief Reader Reports and the 2025-2026 scoring
guidelines).

## Before you write a topic

1. Find the topic in `docs/appsych-dependency-map.json`: its id, CED number, focus skills and the concepts it
   owns. Read its entry in `docs/appsych-ced-map.json` (objectives, knowledge, exclusions) and write it in your
   own words. Respect every exclusion: an excluded idea is not taught as tested content (needs-author
   `exclusions` lists the ones still to confirm).
2. Use only what this topic or an earlier one teaches, plus `everydayWords`. This holds for notation:
   `$\bar{x}$`, `$z = 2$` and `$r = -0.6$` count as using the mean, z scores and correlation.
3. Write `psychology/data/lessons/<id>.json`, `notes/<id>.html`, `questions/<id>.json`, `glossary/<id>.json`.
4. Run `node scripts/check-appsych-content.mjs --topic <id>` until it reports nothing, and
   `node scripts/check-appsych-map.mjs --check`. The placeholder fixture
   `scripts/test/fixtures/appsych-data/` shows every item type working (numeric with `from` and `mistakes`,
   specific builders, the three set kinds, a study summary, a normal curve, an AAQ and an EBQ); it is
   placeholder content, never a model for wording.

## Originality, sources and the trademark

- **Original items only.** Never reproduce, adapt or closely paraphrase released College Board questions, AP
  Classroom items (the October 2025 clarifications forbid uploading them anywhere), the CED's text or any
  textbook. Use the CED, scoring guidelines and Chief Reader Reports for scope and for the errors to target, in
  your own words (decision 4).
- **Invented studies are labeled (decision 4).** Every study summary, table or graph is either invented for
  practice, `"invented": true` (the page says "Invented study for practice"), or describes a real, published
  study cited in `source` by authors and year ("Loftus & Palmer (1974)") with its findings stated accurately.
  An invented study is plausible (a real-looking sample, a believable effect) and is never attributed to a real
  researcher, journal or institution. Never present invented data as real.
- **Classic studies by name, honestly.** Name a classic study only where it helps memory, and say plainly what
  later work found: the Stanford prison study's methods and demand characteristics, the replication record of
  ego depletion, power posing and the facial feedback hypothesis (the CED itself calls the evidence mixed),
  Milgram's replications and their limits, Little Albert's ethics. A finding that has not replicated is taught
  as "an early study claimed ..., but larger replications did not find it". When in doubt, add it to
  `docs/appsych-needs-author.md`.
- Write the mark as **"AP®"**, only as an adjective before a capitalized noun ("the AP® Psychology exam").
  Never "AP" alone, plural, possessive, "AP Psych", or in a URL, id, file name or meta description.

## Spelling and style

- American spelling everywhere (behavior, color, center, judgment).
- No em dashes in anything a student reads; use a colon, a comma or two sentences.
- Short sentences, active voice, "you". A concrete situation first (a student cramming, a driver hearing a
  seatbelt alarm), then the concept, then its name.

## Apply, do not define (the core rule)

The exam asks which concept explains a new situation, and the readers give no credit for a definition alone
(framework.md section 5, "General scoring rules"). So:

- At least 70% of a topic's items are `apply` or `analyze`: a short scenario, then "Which concept best
  explains ...?", "Which of the following is an example of ...?", "What would the researcher predict ...?".
- Recall items name the concept in the stem and ask for its role, never "What is the definition of ...?".
- Distractors are concepts a student confuses with the key (negative reinforcement and punishment,
  proactive and retroactive interference, the fundamental attribution error and the actor-observer bias),
  each explanation saying why that concept does not fit this situation.
- Every model answer and FRQ sample applies the concept to the scenario's people and numbers, by name.

## Research methods and statistics

Research methods and data run through every unit (Practices 2 and 3, about a third of Section I, and four of
the AAQ's seven points). Every topic with a study in it:

1. **Names the method exactly**: an experiment only when the researcher manipulates a variable and randomly
   assigns participants; otherwise a correlational study, a case study, naturalistic observation or a survey.
   Never a hybrid ("an experimental correlation").
2. **States operational definitions** as the study measured them ("the number of words recalled in two
   minutes"), never the concept in general.
3. **Keeps random sampling (who is studied) apart from random assignment (which condition each person gets).**
4. **Says correlation is not causation** wherever a correlation appears, with the third variable named.
5. **Reads a statistic for these groups**: which group was higher, by how much, and what that shows; "not
   statistically significant" means the difference could plausibly be due to chance; significance is not size.
6. **Ethics as the summary describes it**: name a safeguard the study actually used (informed consent or assent,
   the right to withdraw, confidentiality, protection from harm, debriefing after deception, IRB or animal care
   committee approval) and how the researchers applied it.
7. **Generalizes from participant characteristics** (age, culture, setting), never from sample size or a design
   flaw; "partly" needs both sides.
8. **Numbers by hand.** The exam has no calculator. Keep data small: a mean of four to eight whole numbers, a
   median of an odd or even list, a range, a share under the normal curve at whole standard deviations, a z
   score with round numbers. Every key comes from an `ApPsychStats` recipe (`from`), never typed by hand, with
   2-3 authored `mistakes` (the sum instead of the mean, the mean instead of the median, one side of the curve
   instead of both, the sign of z).

The statistics page (`formula-sheet.html`, "Statistics you must know") lists every statistic in our own words; a
lesson links to it rather than repeating a list.

## The free-response questions

Two types, in exam order, 7 points each, one rubric line per point, accepted wordings per line, a full-credit
sample per part, task verbs in bold (Identify, State, Describe, Explain, Propose, Support).

| Type | Reading | Parts and points |
|---|---|---|
| `aaq` (Q1, about 25 min) | one invented (or real, cited) study summary in the exam's sections, with a graph or table of group results and the ethical safeguards it used (`study.ethics`) | A method (1), B operational definition (1), C statistic (1), D ethical guideline applied (1), E generalizability (1), F argumentation (2) |
| `ebq` (Q2, about 45 min) | three short source summaries on one question, each with a graph or table; `claimTopic`; `restricted` terms | A claim (1), B(i) evidence (1), B(ii) reasoning (2), C(i) evidence from a different source (1), C(ii) reasoning with a different concept (2) |

The rubric lines follow the 2025-2026 scoring guidelines (framework.md section 5). The EBQ samples model the
structure the readers reward: evidence, then the psychology concept, then the link to the claim. They cite as
"(Source 2)" or "According to Source 2", use a different source in C(i), and a different concept in C(ii). A
restricted term (methods and statistics words such as random assignment, statistical significance, mean or
standard deviation, or the prompt's own topic) never earns the concept point; list the prompt's own topic in
`restricted`. Part `write` rules (`{ cite: true }`, `{ concept: [...] }`) turn on the live hints.

## Writing answers specific enough to score

Every model, `earns` answer and FRQ sample follows these, and every `misses` answer shows one real miss
(framework.md section 7):

- **Method**: one method, named; not "a survey" when the study manipulated a variable.
- **Operational definition**: how this study measured it, with the scale or count.
- **Statistic**: the groups, the direction and what it means; not a definition of "mean".
- **Ethics**: a safeguard in the summary and how it was applied; not one the study did not describe, not a
  design feature such as random assignment.
- **Generalizability**: a named population and the participant characteristics that support the claim.
- **Claim**: a defensible statement that answers the question; not a topic sentence or a question.
- **Evidence**: a specific, accurate result with its source; not a method or participant detail.
- **Reasoning**: evidence, concept, link; not a dropped-in definition.

## Mental health: science, respect and help

Unit 5 and every disorder mention:

- **The DSM-5-TR** (American Psychiatric Association, 2022) for criteria and names, and the ICD for the WHO
  system. Only the disorders the CED lists, as representative examples.
- **Taught as science, never as self-diagnosis.** Symptoms are described so a student can recognize the concept
  in a scenario, not to label themselves or anyone they know. No quizzes that ask a student about their own
  feelings or behavior.
- **Respectful, person-first language**: "a person with schizophrenia", not "a schizophrenic"; "died by
  suicide", not "committed suicide"; never "crazy", "insane", "psycho", or a diagnosis as a casual adjective
  ("so OCD"). The content check refuses the common forms.
- **A short help line on disorder and treatment pages**, in `<p class="psy-help">`: "If you are struggling, you
  are not alone. In the US, call or text 988 (the Suicide and Crisis Lifeline), or talk to a trusted adult." One
  line, never the subject of the page.
- Treatments are presented by their evidence (evidence-based practice), including what does not work
  (hypnosis does not recover memories; lobotomy is history, not treatment).

## No myths taught as fact

Never teach as fact: learning styles (matching teaching to a "visual" or "auditory" learner does not improve
learning), left-brained or right-brained people (the hemispheres specialize but work together), the 10% brain
myth, subliminal persuasion as a strong effect, "repressed memories recovered under hypnosis", polygraphs as lie
detectors, or "opposites attract" as the rule. A myth may be named only inside `<aside class="psy-myth">` (or any
element with the class `psy-myth`) that corrects it; the content check refuses the common phrasings elsewhere.

## Content traps to target

Write distractors and misconception callouts from these confusions (framework.md sections 3 and 7):

- Negative reinforcement vs punishment; positive vs negative in operant conditioning (adding vs removing).
- Classical vs operant conditioning; the UCS, UCR, CS and CR of a scenario; extinction vs spontaneous recovery.
- Proactive vs retroactive interference; recall vs recognition; episodic vs semantic vs procedural memory.
- The fundamental attribution error vs the actor-observer bias vs the self-serving bias.
- Sympathetic vs parasympathetic; agonist vs antagonist vs reuptake inhibitor.
- Rods vs cones; trichromatic vs opponent-process; place vs frequency theory.
- Crystallized vs fluid intelligence; reliability vs validity; achievement vs aptitude.
- Cross-sectional vs longitudinal; random sampling vs random assignment; correlation vs causation.
- Schizophrenia vs dissociative identity disorder; bipolar disorder vs major depressive disorder.
- Emotion theories by sequence, not by name (the CED excludes the names; needs-author `exclusions`).

## Notation

Math is TeX between dollar signs, rendered at build time; in JSON every backslash is doubled. Keep it light:
`\bar{x}`, `\frac`, `\%`, `z = \frac{x - \bar{x}}{\text{SD}}`.

## Questions

- Every item carries `unit`, `topic`, `practice` (a skill id such as `"2.B"`; never 4.A or 4.B) and its type.
- **Four options** for single-answer items, similar lengths (the key is the longest at most 40% of the time),
  each option's explanation naming the error by content, never by letter.
- At least 70% apply/analyze. At least 40% of a topic's items in stimulus sets of 3-5 items. Mix the kinds across
  a unit: `study` (a study summary: method, variables, ethics, conclusions), `data` (a table or graph of results:
  read it, compute a mean or median, interpret significance), `visual` (a brain diagram, an illusion, a neuron,
  a conditioning curve).
- `numeric` items for descriptive statistics and the normal curve; `specific` items for methods, operational
  definitions, claims, citations and links.
- No `calc` flag, no `setup` items.

## Level and voice

- From middle-school science and everyday experience, for a student whose class moved too fast. A concrete
  situation first, then the idea, then the name.
- Every lesson has a figure: a brain or neuron diagram, a conditioning curve, a normal curve drawn from its
  numbers (a `plot` spec), or a clean diagram. Every data figure says whether its numbers are invented or cites
  the study.
- A worked example, in `<div class="worked">`, before any new calculation or writing type, written out in full.
- Explain why before how: why reinforcement schedules differ in persistence, why random assignment allows a
  causal claim.

## Contested or uncertain points

Add them to `docs/appsych-needs-author.md` instead of guessing. Every unit gets an independent accuracy check
before it is published, with every numeric key recomputed by code.
