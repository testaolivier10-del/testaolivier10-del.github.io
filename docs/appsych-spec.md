# AP® Psychology course: spec and status

The source of truth for LevlPrep's tenth course. A fresh session reads this file, `CLAUDE.md`,
`docs/appsych-research/framework.md` and `docs/appsych-research/market.md`, not the chat history. When the plan
changes, update this file in the same commit. Open points for a person go in `docs/appsych-needs-author.md`.
Formats: `docs/appsych-architecture.md` (Phase 0); writing rules: `docs/appsych-authoring-guide.md` (Phase 0); map
and the CED check: `docs/appsych-phase0.md`; briefs for Phases 1, 2 and 4: `docs/appsych-briefs/`.

Course key `appsych` (storage, analytics, registry, SQL). URL path `/psychology/`. Every new browser global starts
with `ApPsych`. Question ids start `psy-`, CSS classes `psy-`, files `psy-*.js`. Template: the AP® Environmental
Science course (`docs/apenv-spec.md`, `docs/apenv-architecture.md`, `docs/apenv-authoring-guide.md`), the newest
fork, as it stands on main today (after the light channel redesign, course covers, dashboards design F, video
lessons, quick answers, the AI FRQ grader and the analytics work), so every newer shared page type is carried over.

## 1. Owner brief (2026-10-27), condensed

- Tenth course. Olivier asked for research on the next course; AP® Psychology was recommended (largest AP exam
  LevlPrep does not cover, about 334,000 takers in 2025; science-listed since the 2024-25 revision; research methods
  and data at its core; low stakes while courses are unreviewed; strong Shorts topics) over AP® Precalculus, AP®
  Calculus BC, AP® Physics C and ATI TEAS. Olivier said "build it" on 2026-10-27.
- Build it the same way as AP® Environmental Science: research, build everything, independent accuracy reviews,
  one PR the owner reviews before merging.
- Tools at the bar of the NREMT interactive body map: interactive, visual where useful, professional illustration
  quality (no placeholder shapes), simple on landing with detail revealed progressively, each tool full screen, easy
  to read on a phone.
- Every course feels the same: shared components and the same page set (glossary, textbook with the plain/interactive
  toggle, practice, review with flagged questions, exams, flashcards tab, dashboard design F). No walls of text or
  repeated info. **No score calculator.** **No Beta label** (owner 2026-10-26); the "not yet reviewed by an AP®
  Psychology teacher" note stays.
- Premium pass one-time through 30 June 2027 at the AP® price; the founding discount applies as for the other passes.
- Psychology content must be accurate and current (replication status of classic studies stated honestly, the
  DSM-5-TR for disorders, no outdated myths taught as fact: learning styles, left-brain/right-brain people, the
  10% brain myth). Mental-health topics are taught as science, never as self-diagnosis; disorder pages carry a short
  note pointing to real help (988 in the US) without making the page about that.

## 2. What the research says

Filled from `docs/appsych-research/` when Phase R lands.

## 3. Positioning and what makes it better (proposed, refined after research)

Free forever: notes and textbook pages, glossary, flashcards, unit sheets, unit practice tests. Premium: unlimited
practice, exams, every lesson, analytics, every trainer.

1. **Article Analysis Studio (flagship).** The AAQ made drillable: a short invented study summary, then each part
   the exam asks (research method, variables and their operational definitions, the statistic, ethics, whether the
   conclusion or generalization holds), graded part by part with the slip named.
2. **Evidence Builder.** The EBQ made drillable: three short sources, build a claim, pick the evidence from the
   right source, cite it, and explain how it supports the claim with the psychology concept named.
3. **Built for May 2027.** 75 four-option MCQ, the AAQ and EBQ with their rubrics, typed answers, self-scored with
   full-credit samples (and the AI grader when the owner turns it on).
4. **Apply, don't define.** Every unit's practice leads with scenario items (which concept explains this?) because
   that is how the exam asks.
5. **The mind you can see.** Simulators for the parts students mix up: the neuron and action potential, the brain
   map, sensation and perception, memory, conditioning, development, social influence, the normal curve and
   correlation.
6. **In CED order, nothing used before it is taught**, with a short "Research skills you need" chapter placed right
   before the topic that first needs each skill.

## 4. Continuity with the other courses

Built exactly like AP® Environmental Science, so every shared page type matches. Same shared layer (`assets/`, Tool
Studio, flagging, XP, tutor, dashboard, covers), item formats, the "not yet reviewed by an AP® Psychology teacher"
note, trademark rules. Every shared-layer fix goes into the shared file, never a psychology-only copy. Identity: own
accent colour, icon, headline, cover art and rank names (decision 5).

## 5. Build plan

One branch, `claude/appsych`, one PR at the end.

| Phase | What | Status |
|---|---|---|
| R | Research: `docs/appsych-research/framework.md`, `market.md`; this spec | in progress |
| 0 | Fork AP® Environmental Science: runtime `psychology/assets/` (`psy-*`), `ApPsychStats` (descriptive statistics) in place of `ApEnvCalc`, generator, checks, tests, fixture, CED and dependency maps, registration hidden, tool scaffolding, architecture, authoring guide, briefs, needs-author | in progress |
| 1 | Content: lessons, notes, banks (incl. stimulus sets), AAQs and EBQs, glossary, figures | |
| 2 | Trainers (section 6) | |
| 3 | Two fixed practice exams, unit tests, cram kit, extras | |
| 4 | Independent accuracy checks per unit group, tools and exams | |
| Launch | Publish, generators, continuity pass, "ten courses" wording, full CI with browser checks, PR | |

## 6. Trainers (proposed; final list after the CED map)

Each has an Explore pane and Test yourself (seeded drills, feedback naming the slip), as the other courses.

| Slug | What |
|---|---|
| `article-studio` | Flagship AAQ trainer (section 3.1) |
| `evidence-builder` | EBQ trainer (section 3.2) |
| `neuron` | Neuron, action potential, neurotransmitters, agonists and antagonists |
| `brain-map` | Brain regions and lobes, structure to function, lesion and imaging cases, split brain |
| `sensation` | Senses, thresholds, signal detection, perception and illusions |
| `memory-lab` | Encoding, storage, retrieval, serial position, interference, forgetting |
| `conditioning-lab` | Classical and operant conditioning, reinforcement schedules |
| `development` | Lifespan timeline: Piaget, attachment, Erikson, moral reasoning as the CED requires |
| `social-influence` | Attribution, conformity, obedience, group effects |
| `stats-lab` | Normal curve, percentiles, central tendency and variation, correlation and scatterplots |

## 7. How answers are graded

All grading is code; nothing is graded by an AI model (the shared AI FRQ grader stays optional and off until its
eval passes). Choice items exact; numbers (descriptive statistics only) with a tolerance; written parts through
`specific` builders (method, variable, operational definition, claim, citation) with hint flags; FRQs self-scored
with one rubric line per point and full-credit samples.

## 8. Decisions log

1. (2026-10-27) **Fork AP® Environmental Science as it is on main**, keeping every newer shared page type. Replace
   `ApEnvCalc` with a small `ApPsychStats` (mean, median, mode, range, standard deviation, percentile and z on the
   normal curve, correlation from points); drop setup items and the unit-aware grading unless the CED needs them.
2. (2026-10-27) **No "ap" in any served path.** Folder `/psychology/`, files `psy-*.js`, ids `psy-`. Registry and
   storage key `appsych`, order 10, aliases `psychology` (the folder), `psych`, `psy`.
3. (2026-10-27) **Pass and price mirror the other AP® courses:** `psy-2027`, one-time, through 30 June 2027, the
   founding discount through the shared rule, registered `onSale: false` until the owner checklist.
4. (2026-10-27) **Sources:** College Board CED, course and exam pages, scoring guidelines and Chief Reader Reports for
   scope and common errors only, in our own words. No released exam questions reproduced or adapted. Study
   summaries in items and FRQs are clearly invented for practice unless they describe a real, cited study (the
   classic studies the CED names), never invented data presented as real.
5. (2026-10-27) **Identity (proposed, owner to confirm).** An accent distinct from every other course (Phase 0 picks
   exact values with contrast at least 7:1 light and dark). Icon: a head in profile with a spark. Headline "AP®
   Psychology, from neuron to society." Ranks: Curious Observer, Hypothesis Maker, Neuron Firer, Data Reader,
   Theory Tester, Behavior Analyst, Psychology Legend.
6. (2026-10-27) **No score calculator, no readiness band, no Beta label.**
