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

Details and URLs in `docs/appsych-research/` (done 2026-10-27).

**Not revised for 2026-27.** The 2024-25 framework stands; the Fall 2025 CED and its October 2025 clarifications
stay in force. One change matters: AAQ Part D asks for one ethical guideline the summary describes and how the
researchers applied it.

**Framework.** 5 units, 35 topics, every unit 15-25% of the MCQ section: U1 Biological Bases of Behavior (6), U2
Cognition (8), U3 Development and Learning (9), U4 Social Psychology and Personality (7), U5 Mental and Physical
Health (5). Titles official (Course at a Glance; CED for 1.1-2.6). Four science practices; MCQ practice weights
(about 65/25/10) third party only. CED text after 2.6 read from a third-party copy: exclusions (Maslow's hierarchy,
psychosexual stages, named emotion theories, pragmatics, classical conditioning timing variants) unconfirmed.

**Exam (Fri 14 May 2027, Session 2), digital in Bluebook, 2 h 40 min, no calculator.** Section I: 75 four-option
MCQ, 90 min, 66.7%. Section II: 70 min, 33.3%, two FRQs of 7 points. AAQ (about 25 min): one study summary; method,
operational definition, statistic interpretation, ethics, generalizability (1 each), argumentation (2). EBQ (about
45 min): three labelled sources; claim (1), two pieces of evidence each cited and from different sources (1 each),
two reasoning parts (2 each: the second point needs a psychology concept, a different one in the second part).

**Scores.** 2025: 334,038 takers, 70.5% 3+, mean 3.20. 2026: 74% 3+, 15% fives.

**Where students lose points** (2025 Chief Reader Reports, 2025-26 scoring guidelines; the EBQ scores below the
AAQ). EBQ reasoning with no concept, a bare definition, or the same concept twice (C(ii) weakest); evidence not
cited, a method instead of a result, one source used twice; a restricted term offered as the concept (random
assignment, statistical significance, mean, the prompt's own topic). AAQ statistic restated instead of interpreted,
or its direction reversed; wrong or several methods; a textbook definition instead of how this study measured the
variable; generalizability argued from sample size instead of participant traits; ethics guidelines the summary
never mentions.

**Market.** See `market.md`: paid prep (UWorld, Fiveable, Albert, Barron's, Princeton Review) is mostly videos and
question banks; almost nothing drills the AAQ and EBQ part by part. That is the gap.

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
| R | Research: `docs/appsych-research/framework.md`, `market.md`; this spec | **done 2026-10-27** |
| 0 | Fork AP® Environmental Science: runtime `psychology/assets/` (`psy-*`), `ApPsychStats` (descriptive statistics) in place of `ApEnvCalc`, generator, checks, tests, fixture, CED and dependency maps, registration hidden, tool scaffolding, architecture, authoring guide, briefs, needs-author | **done 2026-10-27** (decision 7) |
| 1 | Content: lessons, notes, banks (incl. stimulus sets), AAQs and EBQs, glossary, figures | |
| 2 | Trainers (section 6) | |
| 3 | Two fixed practice exams, unit tests, cram kit, extras | |
| 4 | Independent accuracy checks per unit group, tools and exams | |
| Launch | Publish, generators, continuity pass, "ten courses" wording, full CI with browser checks, PR | |

### 5a. Authoring split

Balanced by work (the research skills topics are short; Unit 5's disorders and treatments are heavy). Each author
owns every file of its topics and the FRQs listed (17 in all: 8 AAQ, 9 EBQ, ids in
`docs/appsych-dependency-map.json`); briefs in `docs/appsych-briefs/`.

| Author | Topics | Count | FRQs | Stimulus sets |
|---|---|---|---|---|
| A | "Research skills you need" (7) and 1.1-1.2 | 9 | 2 AAQ (research methods, correlation) | study, 2 data, visual |
| B | 1.3-1.6 | 4 | AAQ heredity and environment, EBQ sleep | visual, study, data |
| C | Unit 2 (2.1-2.8) | 8 | AAQ forgetting, EBQ retrieval | 2 data, study, visual |
| D | 3.1-3.6 | 6 | AAQ development methods, EBQ social-emotional development | study, data |
| E | 3.7-3.9, 4.1-4.3 | 6 | 2 AAQ (operant conditioning, social situations), 2 EBQ (social-cognitive learning, social situations) | 2 data, 2 study |
| F | 4.4-4.7, 5.1-5.2 | 6 | AAQ motivation, 2 EBQ (personality, health psychology) | visual, data |
| G | 5.3-5.5 | 3 | 2 EBQ (treatment of depression, of anxiety) | study, data |

Trainer builders (Phase 2), four at once, each owning whole slugs:

| Builder | Trainers |
|---|---|
| T1 | `article-studio` (flagship), `evidence-builder` |
| T2 | `neuron`, `brain-map`, `sensation` |
| T3 | `memory-lab`, `conditioning-lab`, `stats-lab` |
| T4 | `development`, `social-influence` |

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
7. (2026-10-27) **Exam format as researched** (framework.md section 5): 75 four-option MCQ in 90 min (66.7%), AAQ
   and EBQ in 70 min (33.3%), 7 points each, no calculator, Friday 14 May 2027 (`assets/exam-date.js`). Item types
   keep `numeric` (descriptive statistics by hand, unit optional) and `specific` (method, variable, operational
   definition, claim, citation); no `setup` items, no expression grader, no calculator page.
8. (2026-10-27) **Stimulus kinds `study`, `data`, `visual`.** A `study` stimulus is a summary in the exam's
   sections (introduction, participants, method, results, discussion); every study or data stimulus is
   `invented: true` or cites a real study by authors and year (content check). Plot kinds: line, bar, scatter
   (with r), histogram, normal (68-95-99.7 bands, shaded region); pyramid, dual-axis and curve dropped.
9. (2026-10-27) **Free tier (approved, decision 11):** Unit 1 and the seven research skills topics, 13 of 42
   topics (31%); free trainers `article-studio`, `neuron`, `brain-map`.
10. (2026-10-27) **Phase 0 done, as built** (`docs/appsych-phase0.md`, `docs/appsych-architecture.md`). Accent:
    deep cerulean, light `--cink #084F78` on `--ctint #E3F0F8` (7.5:1; 8.8:1 on white, 8.3:1 as button text on
    the page), dark `--cink #A8D8F0` (11.1:1 on the card) on `rgba(80,170,220,0.10)` (9.4:1); soft `#8CC8E8`;
    header short name "Psychology". Cover deep purple `#33184A` with lilac `#D99CFF` (needs-author `identity`:
    close to Organic Chemistry's indigo). Choices the spec left open or that differ from it: (a) the course adds a
    "Research skills you need" chapter (7 topics placed before the topic that first needs each), 42 topics in
    all; (b) `ApPsychStats` recipes `{fn, args, pick}` evaluated to 12 significant digits, the 68-95-99.7 rule
    exact; (c) FRQ JSON carries `readings` (one study for an AAQ, three sources for an EBQ), `restricted` terms
    and part `write` rules, so the FRQ page gives live hints (cite a source, name a concept, restricted term) in
    place of "check my number"; (d) the content check refuses common myths (unless inside `.psy-myth`), slurs
    and "commit suicide", inferential test names and skills 4.A/4.B on items; (e) practice weights not enforced
    until confirmed (`practicesConfirmed`); (f) the AI FRQ grader is not wired for this course (needs-author
    `frq-grader`); (g) the site shell budget went from 334 to 335 KB. SQL migration `2026-10l-appsych.sql`
    written, not applied.
11. (2026-10-27) **Owner approvals ("all those things").** Free tier as decision 9 (Unit 1 and the research skills
    chapter, 31%; free trainers `article-studio`, `neuron`, `brain-map`); the short 988 help note on disorder and
    treatment pages as proposed in the authoring guide; the identity of decision 5, with the cover moved to the
    blue family to match the accent: background `#07608A`, gold title accent `#FFD23F`, light-blue head `#8CC8E8`
    (Statistics' cover is dark steel `#0E3A52`, Chemistry's cobalt `#1A2C78`, so the hub keeps every cover apart).
