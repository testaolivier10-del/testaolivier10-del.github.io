# AP® Psychology: open questions for a person

Things a person (the owner, or an AP® Psychology teacher) should decide or check. Add to this file instead of
guessing; mark an entry resolved with the date and move it to the end.

## ced-text: learning objectives for Topics 2.7-5.5 were read only through a third-party copy (open, 2026-10-27)

All 35 topic titles are official (the Course at a Glance; they agree with every title the CED extract showed).
The CED PDF extraction stops in Topic 2.6, so the `objectives`, `knowledge` and `exclusions` in
`docs/appsych-ced-map.json` for 2.7 to 5.5 come from Lumisource pages that reproduce the CED codes, cross-checked
against Fiveable (`source` marks them [3P]). Topic 3.3 (Gender and Sexual Orientation) had no essential knowledge
readable at all. A person with the CED should check Units 3-5 and 2.7-2.8 before launch.

## exclusions: some exclusion statements are third party (open, 2026-10-27)

Read in the CED: genetics vocabulary (1.1), the sodium-potassium pump and unlisted neurotransmitters, hormones and
glands (1.3), psychoanalytic dream theory and unlisted sleep disorders (1.5), unlisted monocular cues (2.1).
Third party only: Maslow's hierarchy of needs (4.4), psychosexual stages (3.6, 4.4), names of emotion theories
(James-Lange, Cannon-Bard, Schachter-Singer; 4.7), pragmatics (3.5), delayed, trace, simultaneous and backward
conditioning and expectancy theory (3.7), prenatal stage names (3.2), labeling cognitive abilities and
disabilities (2.8), unlisted disorders (5.4). The authoring guide treats all of them as excluded; confirm against
the CED, and if one is not excluded, the map gains its concept.

## practice-weights: the Section I practice weights are third party (open, 2026-10-27)

The CED table was not readable. The weights in `docs/appsych-dependency-map.json` (`practices[].mcqWeight`:
1 Concept Application 60-70%, 2 Research Methods and Design 20-30%, 3 Data Interpretation 5-15%; Argumentation is
Section II only, which is official) are ranges around the 65/25/10 split Fiveable, Achievable and Cognito agree
on. `checkForms` checks forms against them only when the map sets `"practicesConfirmed": true`.

## mcq-sets: how many multiple-choice sets, and of what kind (open, 2026-10-27)

The exam page says Section I has more graphs, charts, tables and figures than before, standalone items plus sets
sharing one study description or data display (third party). No official count was found. `EXAM_SETS` in
`scripts/lib/appsych-exams.mjs` allows 2-6 study sets, 2-6 data sets and 0-4 figure sets per form until a
person confirms the format (a Bluebook test preview or a released practice exam would settle it).

## frq-scoring: AAQ and EBQ rubric lines follow the 2025-2026 scoring guidelines (open, 2026-10-27)

The part structure (AAQ A-F with F worth 2; EBQ A, B(i), B(ii) worth 2, C(i), C(ii) worth 2) and the AAQ Part D
change (identify a safeguard the summary describes and how it was applied, from the October 2025
clarifications) are official. The wording of each rubric line in our FRQs is our paraphrase of what the
guidelines reward; a teacher should read the first few before Phase 3 copies the pattern. The restricted-term
lists differ per prompt; ours are modeled on 2025 set 1 and 2026.

## frq-grader: the AI FRQ grader is not wired for this course (open, 2026-10-27)

`worker/src/frq-grade.js` (`FRQ_COURSES`) and `worker/src/frq-calibration.js` grade the other AP® courses'
10-point rubrics. The AAQ and EBQ (7 points; the EBQ's two-point reasoning with a restricted-term rule and a
different-concept rule for C(ii)) need their own conventions and calibration cases before the grader can be
turned on for psychology (`docs/frq-grader.md`). The FRQ page self-scores meanwhile, as every course does by
default.

## replication: classic studies to teach with their replication status (open, 2026-10-27)

The authoring guide asks for honesty about replication. A person should agree the wording for the classic
studies most likely to appear: the Stanford prison study (methods and demand characteristics criticized; not
named in the CED), Milgram's obedience studies (partial replications under modern ethics), ego depletion and
power posing (failed large replications; not in the CED), the facial feedback hypothesis (the CED says mixed
evidence), the marshmallow test (weaker in larger, more diverse samples), Little Albert (ethics; generalization
unclear), Harlow's monkeys (contact comfort; ethics), Loftus and Palmer (misinformation, robust). Authors add
entries here as they meet others.

## mental-health-line: the help line wording on disorder pages (open, 2026-10-27)

Spec section 1 asks for a short note pointing to real help (988 in the US) on disorder pages. The authoring guide
proposes one line in `<p class="psy-help">`. The owner should confirm the wording, whether it appears only on
Unit 5 disorder and treatment pages or also on health psychology (5.1), and what non-US readers see.

## identity: accent, cover, icon, headline and ranks are proposals (open, 2026-10-27)

Spec decision 5. Accent: deep cerulean `#084F78` (dark `#A8D8F0`); cover a deep purple `#33184A` with a lilac
accent `#D99CFF`, a head in profile with the brain and a gold spark (`assets/covers/appsych.svg`); headline
"AP® Psychology, from neuron to society."; ranks Curious Observer to Psychology Legend. The cover's purple sits
near Organic Chemistry's indigo cover (`#241A63`); if the two read too alike on the hub, shift the psychology
cover toward magenta (hue about 310).

## free-tier: Unit 1 and the research skills chapter (open, 2026-10-27)

Spec decision 9 (proposed): Unit 1 and the seven research skills topics free, 13 of 42 topics (31%); free
trainers article-studio, neuron and brain-map. Owner to confirm.

## exam-date: Friday 14 May 2027, Session 2 (resolved, 2026-10-27)

From the College Board exam page and student course page (framework.md section 5). `assets/exam-date.js` and
the cram kit's default use it.
