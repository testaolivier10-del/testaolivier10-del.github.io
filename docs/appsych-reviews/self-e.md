# Author E self-report (Phase 1, 2026-10-27)

## Done

| Topic | Items | In sets | Numeric | Specific | Figure |
|---|---|---|---|---|---|
| classical-conditioning (3.7) | 20 | 8 (study, data) | 1 | 1 | classical-conditioning-pairing |
| operant-conditioning (3.8) | 19 | 8 (data: cumulative curves, study) | 2 | 1 | operant-conditioning-grid |
| social-cognitive-learning (3.9) | 17 | 7 (data, study) | 1 | 1 | social-cognitive-learning-model |
| attribution (4.1) | 17 | 7 (study: classmate's failure, data scatter) | 1 | 1 | attribution-biases |
| attitudes (4.2) | 17 | 7 (study: Festinger & Carlsmith 1959, cited; data table) | 1 | 0 | attitudes-dissonance |
| social-situations (4.3) | 32 | 13 (data: conformity by group size; study: Milgram 1963, cited; visual) | 2 | 0 | social-situations-helping |

122 items. Every topic has a lesson, notes page (500+ words, worked example, comparison tables), glossary for every
concept the map lists, and a figure. FRQs (4): `frq-operant-conditioning-aaq`, `frq-social-situations-aaq`,
`frq-social-cognitive-learning-ebq`, `frq-social-situations-ebq`; all studies invented and labeled. Figures: six SVG
diagrams from `scripts/appsych-figures/author-e.mjs` plus 5 plot specs in sets and 9 in FRQs, each rendered to PNG
and inspected.

Checks: `check-appsych-content --topic` clean for all six; full content check, `check-appsych-map --check` and
`build-appsych --check` clean; scratch build with units 3 and 4 published renders. Numeric recheck: all 8 keys
recomputed by hand from the stems and graded through psy-stats/psy-grade in a vm; every key right, every authored
mistake graded wrong. No map edits.

## Open points (for needs-author)

- replication: dissonance taught with the 2024 multilab replication (Vaidis et al., 39 labs, ~4,900 people: attitude
  change replicated, the high-choice vs low-choice effect did not). Bystander effect taught as replicated for
  individuals, plus Philpot et al. (2020) CCTV finding (help in ~9 of 10 conflicts) and the misreported Genovese
  case. Stanford prison study only in a psy-myth box (coaching of guards, demand characteristics, BBC 2002 study).
  Milgram with Burger (2009) partial replication and Perry's archival critiques. Actor-observer bias softened per
  Malle (2006) meta-analysis. Bobo doll limits stated. A teacher should approve this wording.
- media violence (3.9 notes, EBQ): stated as a small, debated average link (APA 2020 resolution: no evidence for a
  link to criminal violence). Contested; confirm wording.
- implicit attitudes: IAT described as a research tool with low test-retest reliability and weak individual
  prediction. Confirm.
- Asch figures in notes ("about a third of trials, about three quarters at least once") are from the classic
  reports, not ApPsychStats; they are prose, not items.
