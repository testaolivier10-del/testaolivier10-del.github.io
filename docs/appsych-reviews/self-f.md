# Author F self-report: Unit 4 topics 4.4-4.7, Unit 5 topics 5.1-5.2

## Done
| Topic | Items | Apply/analyze | In sets | Sets (kind) | Numeric | Specific |
|---|---|---|---|---|---|---|
| psychodynamic-humanistic (4.4) | 22 | 95% | 50% | visual, study, data | 1 | 1 |
| social-cognitive-trait (4.5) | 21 | 100% | 52% | visual, data, study | 2 | 1 |
| motivation (4.6) | 23 | 96% | 48% | visual (Yerkes-Dodson), study, data | 2 | 1 |
| emotion (4.7) | 20 | 90% | 55% | visual, data, study | 1 | 1 |
| health-psychology (5.1) | 21 | 95% | 52% | data (GAS line graph), visual (GAS), study | 1 | 1 |
| positive-psychology (5.2) | 19 | 100% | 58% | visual, data, study | 2 | 1 |

126 items and 18 stimulus sets, with every study and data stimulus marked `invented: true`. Each topic has a lesson, a notes page (840 to 1,000 words, with worked examples and comparison tables) and a glossary entry for every concept the map gives it.

FRQs:
- `frq-motivation-aaq`: an overjustification experiment. Its ethics list is IRB approval, consent and assent, the right to withdraw, and debriefing.
- `frq-social-cognitive-trait-ebq`: three sources on rank-order stability, mean-level change and change after a new social role.
- `frq-health-psychology-ebq`: three sources on stress buffering (heart rate in a lab, sick days by stress and support, a support group).

Figures are LevlPrep original SVGs from `scripts/appsych-figures/author-f.mjs`. I rendered each to PNG and checked it. The six figures:
- psychodynamic-humanistic-views
- social-cognitive-trait-reciprocal
- motivation-yerkes-dodson (model curves, labeled as model curves)
- emotion-sequences (no theory names)
- health-psychology-gas (a model curve)
- positive-psychology-virtues

Data stimuli use plot specs or tables.

## Checks
- `check-appsych-content.mjs --topic <id>` passes for all six topics, and my three FRQs pass. `check-appsych-map.mjs --check` is clean.
- The scratch build (`APPSYCH_PUBLISHED=unit-4,unit-5 --out <scratch>`) succeeds. I looked at the rendered AAQ page and the 5.1 notes page.
- Numeric recheck: I worked out all 9 keys by hand from the stems and ran them through psy-stats and psy-grade in a vm. Every key is graded right, and every authored mistake is graded wrong and matched by its feedback. 0 problems.
- No map edits.

## Open questions (for needs-author)
- Emotion theories are taught only by sequence. The arousal-injection study appears without a name, with the note that later studies had trouble replicating it in full.
- Facial feedback: the notes say the 17-lab replication of the pen study found no reliable effect, and that later multi-lab work found small effects for some methods (such as copying a smiling face) and none for the pen method. A teacher should confirm the wording (needs-author `replication`).
- Help line: it is on health-psychology (5.1) only, not 5.2, until the owner decides (needs-author `mental-health-line`).
- Posttraumatic growth: the notes say that studies measuring people before and after a trauma find less change than people later report. The tone should be confirmed.
- Tend-and-befriend is described as first described in women and linked to oxytocin. Universal emotions are taught as recognized above chance, better within one's own culture, and still debated.
- 4.4 names Freud and Rogers only as memory hooks. Maslow and the psychosexual stages are not mentioned.
- Repression is taught with the mainstream caution: people usually remember a trauma too well, and suggestion can create false memories.
