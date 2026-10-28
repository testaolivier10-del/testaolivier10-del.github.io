# Review: topics 3.7-3.9 and 4.1-4.3 (author E)

Independent accuracy check, 2026-10-27, branch `claude/appsych`. Scope: `classical-conditioning`,
`operant-conditioning`, `social-cognitive-learning`, `attribution`, `attitudes`, `social-situations` (lesson, notes,
glossary, questions with stimuli; 122 items, 13 stimuli), FRQs `frq-operant-conditioning-aaq`,
`frq-social-situations-aaq`, `frq-social-cognitive-learning-ebq`, `frq-social-situations-ebq`, and the six SVG
figures from `scripts/appsych-figures/author-e.mjs`. Checked against the reviewer's own knowledge, the third-party CED
map in `docs/appsych-research/framework.md` section 3 (the CED PDF was not reopened; needs-author `ced-text` says
2.7-5.5 are only readable through a third-party copy), and the primary sources named below.

## Changes

| File / item | What was wrong | Fix |
|---|---|---|
| `attitudes-s1` (Festinger & Carlsmith study, items 11-14) method | Said students "were then randomly assigned to one of three groups". The 1959 paper (full text, Classics in the History of Psychology) says only that three conditions were run; it never states random assignment. Presenting a real study's design inaccurately | "placed in one of three groups (the paper does not say how)" |
| `attitudes-s1` method | Left out the ending the paper reports (true purpose explained in detail, paid students asked to return the money), which matters for item 12 on deception | Added one sentence |
| `attitudes-s1` discussion | The 2024 multilab replication (Vaidis et al.) used the essay paradigm, not the $1/$20 task; read as if it repeated this study | Names its method: writing an essay for a view one disagrees with |
| `social-situations-s2` (Milgram) method | "No real shocks were given." Teachers did get a real 45-volt sample shock | Learner never shocked; each teacher got one mild 45 V sample shock |
| `social-situations-s2` discussion; notes | "Historians" for the archival critics (Perry is a journalist/psychologist, Gibson and others are psychologists) | "Researchers who (later) studied Milgram's archived records" |
| notes `social-situations` | Burger "so high obedience does replicate" with no comparison | Adds that 70% was not reliably lower than Milgram's rate at the same point in a comparable version (Burger 2009) |
| `psy-social-situations-28` stem | "uses the study's own results" while the key is the later variations (phone orders), which are in the discussion, not the 1963 results | "uses the evidence in the summary" |
| lesson `social-situations` summary | "in real emergencies someone usually helps": Philpot et al. (2020) studied public conflicts, not emergencies in general | "in real public conflicts recorded on camera" |
| notes `operant-conditioning` table | Positive punishment example "a speeding ticket": a fine removes money (negative punishment); a classic ambiguous example | "extra chores for lying" (matches the figure) |
| `frq-social-cognitive-learning-ebq` B(ii) sample | "models who hit and kicked without any punishment": Source 1 says nothing about consequences in the cartoon | Removed the unsupported phrase |
| `frq-social-cognitive-learning-ebq` C(ii) accept | "availability heuristic" does not explain a short-lived rise in noise loudness; not a defensible link to that evidence | Replaced with a priming paraphrase |
| `frq-social-situations-ebq` Source 2 | Deceived students about measuring their own volume, with no debriefing in the summary | Debriefing sentence added |
| `frq-operant-conditioning-aaq` F sample and rubric | Sample leaned on fixed-ratio 9.8 vs continuous 6.2, a difference the summary does not report as significant | Sample leads with the significant variable-ratio vs continuous result and qualifies fixed-ratio; accept line added |

No keys changed. No item removed or renumbered; no id changed (forms untouched).

## Checked and fine

- Numeric recheck: all 8 numeric keys recomputed by a scratch script written from the stems (5.2, 15, 71, 9.5, 5.6,
  3, 30%, 35%), all agree with the recipes; each key graded right and every authored mistake (19) graded wrong
  through `psy-stats.js`, `psy-grade.js` and `psy-questions.js` in the test harness vm.
- Self-report claims against the papers: Festinger & Carlsmith (71 men, 11 excluded, 20 per group; -0.45, +1.35,
  -0.05 on -5 to +5; required course participation; spools then pegs, an hour) correct; Milgram 1963 (40 men 20-50,
  New Haven, $4.50, 26/40 = 65% to 450 V, all to 300 V, stress signs) correct; Burger 2009 (150 V stop, screening,
  70%) correct; Vaidis et al. 2024 (39 labs, 19 countries, about 4,900; essay vs control replicated, high vs low
  choice did not) correct; Philpot et al. 2020 (219 conflicts, three countries, intervention in about 9 of 10, more
  with more bystanders) correct. Darley & Latane 1968, Tolman & Honzik 1930 (food from day 11), Bandura 1961/1965,
  Garcia, the Brelands, Seligman, Tajfel, Sherif 1954, Asch (about a third of trials, three quarters at least once,
  plateau near three, one ally) consistent with standard sources.
- Content traps: negative reinforcement vs punishment, UCS/UCR/CS/CR, extinction vs spontaneous recovery vs
  habituation, FAE vs actor-observer vs self-serving (with Malle 2006), informational vs normative, conformity vs
  obedience, loafing vs facilitation: all taught right, distractor whys name the error.
- Excluded content: timing variants of conditioning and expectancy theory only in a "not on the exam" line;
  Stanford prison study only in a myth box; IAT and media violence worded cautiously (APA 2020 resolution).
- Research methods: every invented study labeled, methods named exactly, operational definitions as measured,
  random assignment kept apart from sampling, correlation not causation (attribution s2, EBQ Source 2), ethics as
  described, generalization from participant characteristics.
- Item quality: apply/analyze 90-100% per topic; 40-42% in sets of 3-5; key longest option at most 37% per topic.
  FRQs: 7 points, parts in exam order, one rubric line per point, a sample per part; EBQ samples cite sources, use a
  different source in C(i) and a different concept in C(ii), no restricted term as concept.
- Figures: all six SVGs rendered with Playwright and inspected; labels, arrows and text correct and legible. Plot
  stimuli match their stated numbers.
- Checks: `check-appsych-content --topic` reports 0 failing bank and FRQ items for all six topics (exam-form failures
  listed come from the concurrent exam build, not this scope); `check-appsych-map.mjs`: nothing used before taught.

## Open (for a person)

- Festinger & Carlsmith: assignment method not stated in the paper; items 12-13 do not depend on it, but a teacher
  may prefer to note it in the lesson.
- Milgram's sample shock and the Burger comparison now add detail the CED does not require (needs-author
  `milgram-detail`).
- Replication wording (dissonance, bystander, Milgram, Bobo doll, media violence, IAT) is accurate as written; the
  needs-author `replication` and `wording-cautious` entries still want a teacher's approval.
