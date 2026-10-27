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
person confirms the format (a Bluebook test preview or a released practice exam would settle it). Phase 3 chose
10 sets of 2-5 questions per form (form 1: 4 study, 3 data, 3 figure; form 2: 5 study, 5 data, 2 figure; 35
and 37 of 75 questions in sets), on the reading that the revised exam leans on study summaries and data.

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

Merged from the Phase 1 self-reports (Phase 3, 2026-10-27), each taught as stated; a teacher should approve the
wording: Milgram named as history with Burger's (2009) partial replication and later archival critiques of the
debriefing (`research-ethics` notes, A; `social-situations`, E); the Stanford prison study only in a myth box
(coaching of guards, demand characteristics, the BBC 2002 study; E); oxytocin "trust spray" (later large studies
did not reliably replicate; B, 1.3); Phineas Gage (how much and how long his personality changed is debated; B);
cognitive dissonance with the 2024 multilab replication (Vaidis et al.: attitude change replicated, the high- vs
low-choice effect did not; E); the bystander effect as replicated for individuals, with Philpot et al. (2020) CCTV
data and the misreported Genovese case (E); actor-observer bias softened per Malle (2006) (E); Bobo doll limits (E);
facial feedback (the 17-lab pen-study replication found no effect, later multilab work small effects for some
methods; F, 4.7); the unnamed arousal-injection study (later attempts did not fully replicate; F); stereotype
threat (real but smaller and less consistent than early studies; C, 2.8); word priming robust, behavioral priming
not replicated (C); growth mindset (small average effect, larger for struggling students; C); the marshmallow test
and Harlow (1958) with its ethics and the generalization limit (D).

## help-scope: the 988 note outside Unit 5, and for non-US readers (open, 2026-10-27)

The note is on 5.3-5.5 (required). Phase 3 kept it on 3.6 Social-Emotional Development, beside the adverse
childhood experiences section (abuse, neglect), through `HELP_EXTRA`, and removed it from 5.1. Confirm 3.6, and
decide whether non-US readers get a line (for example "outside the US, contact local emergency services or a
crisis line").

## frq-order: FRQs refiled to the topic they unlock with (resolved, 2026-10-27)

Phase 3 added the check (an FRQ may not use a term taught after its latest topic) and refiled the six that failed
by adding the topics they use: `frq-heredity-environment-aaq`, `frq-research-methods-aaq` and
`frq-stats-correlation-aaq` (+ Ethics in Research, so part D), `frq-forgetting-aaq` (+ Descriptive Statistics and
Statistical Significance), `frq-retrieving-memories-ebq` (+ Forgetting, for the forgetting curve as a concept);
`frq-health-psychology-ebq` reworded ("physical or mental health", not "well-being"). `frq-development-methods-aaq`
already listed 3.6 and passes. Teachers who assign the heredity AAQ before research ethics should know part D
needs it.

## milgram-detail: Milgram on the research ethics notes page (open, 2026-10-27)

Author A names Milgram as history and notes later reviews found the debriefing was not always complete or
immediate, plus Burger's (2009) partial replication. The CED names no researchers; confirm this level of detail.

## poll-1936: the 1936 Literary Digest poll (open, 2026-10-27)

The research-sampling hook and notes give about ten million ballots mailed and more than two million returned,
and name both causes (the mailing list and who chose to reply) because accounts disagree. Confirm.

## effect-size: Cohen's benchmarks in stats-significance (open, 2026-10-27)

About 0.2, 0.5 and 0.8 standard deviations are called small, medium and large (Cohen not named), with the caveat
that importance depends on the question. Confirm the CED wants benchmarks at all.

## wording-cautious: claims kept cautious on purpose (open, 2026-10-27)

Slow breathing "associated with" a shift toward parasympathetic activity (A, 1.2); brain maturation "into the early
to mid 20s" (D; the end point is debated); Piaget's ages as typical with the sequence holding up better than the
ages, Erikson as a framework (D); attachment stability as moderate and ACEs as population risk, Felitti et al.
(1998) as the first report from a study that surveyed 17,000+ adults (D); media violence as a small, debated
average link (APA 2020: no evidence for criminal violence; E); the IAT as a research tool with low test-retest
reliability (E); posttraumatic growth smaller in prospective studies than people report (F); tend-and-befriend
and universal emotions (recognized above chance, better within one's own culture, debated; F); repression taught
with the mainstream caution (C, F); multiple intelligences without naming Gardner (C); short-term memory "about
seven, newer estimates about four chunks" in notes, "a few items, about 20 to 30 seconds" in the figure and
glossary (C); sleep clearing brain waste as a tentative finding mostly from animal studies, glia "about as numerous" as neurons (B, Phase 4 review). A reviewer should confirm each.

## numbers-secondary: figures taken from secondary sources (open, 2026-10-27)

Ebbinghaus's savings (58.2, 44.2, 35.8, 33.7, 27.8, 25.4, 21.1% at 20 min to 31 days): three values checked
against a secondary source, the rest the standard textbook table (C). Asch's "about a third of trials, about three
quarters at least once" in prose (E). Confirm against a primary source.

## sensitive-scope: 3.3 Gender and Sexual Orientation and Unit 5 categories (open, 2026-10-27)

3.3 had no readable essential knowledge (`ced-text`); author D wrote to the title and mainstream science (sex vs
gender, gender identity incl. transgender and nonbinary as normal variation, gender roles and typing, Hyde 2005,
sexual orientation with twin data, Ganna et al. 2019, the fraternal birth-order effect, no parenting cause, change
efforts ineffective and harmful); the accuracy reviewer should check scope and tone. Unit 5 (author G): DID causes
taught as debated (trauma vs sociocognitive model); OCD, hoarding and PTSD placed by the DSM-5-TR, not beside the
anxiety disorders as the third-party CED copy lists them; ataque de nervios and taijin kyofusho as "cultural
concepts of distress"; DSM-5-TR time rules in our words (MDD 2 weeks, PDD 2 years adults and 1 year youth, mania 1
week, hypomania 4 days, GAD 6 months, PTSD more than 1 month, schizophrenia 6 months); treatment evidence (exercise
about as effective as CBT and medication for mild to moderate depression, CBT gains lasting longer after
treatment stops, DBT's origin, lithium and blood tests, hypnosis and memory). Check each against the manual and
current reviews.

## figures-schematic: brain figures and the hypnogram (open, 2026-10-27)

The brain figures are schematic (lobe borders; deep structures dashed on a midline view); a teacher should
confirm they read correctly. The hypnogram's y labels now read Awake, REM and N1-N3 (Phase 3: `ApPsychPlot`
measures its tick labels, so the short codes W and R are no longer needed).

## page-title-dash: built page titles use an em dash (open, 2026-10-27)

`courseTitle` (`scripts/lib/page-title.mjs`, shared by every course) writes "Topic — AP® Psychology | LevlPrep".
The no-em-dash rule is for our writing; changing the shared separator changes every course's titles and search
snippets, so it is the owner's call.

## mental-health-line: the help line wording on disorder pages (resolved, 2026-10-27)

Owner approved the short 988 note as proposed (spec decision 11). Phase 3 (spec decision 12) made it a lesson
field: `"help": true` prints one shared line (`HELP_LINE` in `scripts/lib/appsych-build.mjs`) at the end of the
lesson summary and on the notes page; required on 5.3-5.5, refused when pasted. 5.1 (health psychology) dropped it:
stress and coping is not a disorder topic. 3.6 keeps it beside its adverse childhood experiences section (see
`help-scope`). What non-US readers see is still open (`help-scope`).

Spec section 1 asks for a short note pointing to real help (988 in the US) on disorder pages. The authoring guide
proposes one line in `<p class="psy-help">`. The owner should confirm the wording, whether it appears only on
Unit 5 disorder and treatment pages or also on health psychology (5.1), and what non-US readers see.

## identity: accent, cover, icon, headline and ranks (resolved, 2026-10-27)

Owner approved the identity with the cover moved to the blue family (spec decision 11): cover `#07608A` with a gold accent `#FFD23F` and a light-blue head `#8CC8E8`, clearly apart from Statistics' dark steel `#0E3A52` and Chemistry's cobalt. The text below is the original proposal.

Spec decision 5. Accent: deep cerulean `#084F78` (dark `#A8D8F0`); cover a deep purple `#33184A` with a lilac
accent `#D99CFF`, a head in profile with the brain and a gold spark (`assets/covers/appsych.svg`); headline
"AP® Psychology, from neuron to society."; ranks Curious Observer to Psychology Legend. The cover's purple sits
near Organic Chemistry's indigo cover (`#241A63`); if the two read too alike on the hub, shift the psychology
cover toward magenta (hue about 310).

## free-tier: Unit 1 and the research skills chapter (resolved, 2026-10-27)

Owner approved (spec decision 11).

Spec decision 9 (proposed): Unit 1 and the seven research skills topics free, 13 of 42 topics (31%); free
trainers article-studio, neuron and brain-map. Owner to confirm.

## exam-date: Friday 14 May 2027, Session 2 (resolved, 2026-10-27)

From the College Board exam page and student course page (framework.md section 5). `assets/exam-date.js` and
the cram kit's default use it.

## justify-prompts: the "Make it specific" prompts (resolved, 2026-10-27)

Written: 46 prompts in `psychology/data/justify/` (Units 1-5 and the research skills chapter, 7-8 each), every
AAQ and EBQ skill the checker knows, a slot builder on every prompt, the first 3 free. Every study is invented
and labeled; every derived number is in `JUSTIFY_NUMBERS`. The content check's skip is gone: it now requires
40+ prompts and 6 to 9 per chapter (`JUSTIFY_PER_CHAPTER`); research skills ids start `rs-`.
