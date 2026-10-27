# AP® Psychology trainer review A: article-studio, evidence-builder, stats-lab, memory-lab, conditioning-lab

Reviewer: independent (Phase 4), 2026-10-27. Scope: the five trainers' models
(`psychology/assets/tools/math/<slug>.js`), data (`psychology/data/tools/<slug>.json`) and validators
(`scripts/lib/appsych-tool-checks/<slug>.mjs`). Page scripts and CSS not edited (visual issues reported only).

## What was checked

- Rubrics against the official scoring guidelines, read directly: 2026 SG (`ap26-sg-psychology.pdf`) and 2025 set 1
  SG (`ap25-sg-psychology-set-1.pdf`), plus `docs/appsych-research/framework.md` sections 5 and 7.
  - AAQ: A method 1 (one approved method, no hybrid such as "experimental correlation"), B operational definition 1
    (measurable; "a Likert scale" alone fails), C statistic 1 (what it means for these groups; restating or defining
    fails; not significant = could be chance), D ethics 1 (a guideline the study describes AND how it was applied;
    a design feature such as random assignment fails), E generalizability 1 (participant characteristics, a named
    population; sample size, reliability, validity fail; "partly" needs both sides), F argumentation 2 (a specific,
    accurately read result plus whether it supports or refutes; "proves" and concept-without-result miss).
    article-studio matches all six parts and the 7-point total.
  - EBQ: A claim 1, B(i) 1 (cited, specific, from a source, consistent with the claim), B(ii) 2 (1 explain,
    2 apply a concept; restricted terms never earn the application point; can be earned without B(i)), C(i) 1
    (different source), C(ii) 2 (different concept, reuse caps at 1). One rule was missing (below).
  - Restricted terms in the data: random assignment, statistical significance, the mean, correlation, and the
    prompt's own topic words. Consistent with the 2025 and 2026 SG lists (mean, random assignment, statistical
    significance, standard deviation, rehearsal, retrieval, distractor; 2025: confederate, statistically
    significant, operant conditioning).
- Science: 68-95-99.7 bands (34, 13.5, 2.35, 0.15; below at z = −3..3 is 0.15, 2.5, 16, 50, 84, 97.5, 99.85),
  z = (x − mean) ÷ SD, percentile rank as percent below (not percent correct), outlier pulls mean not median, skew
  named for its tail, r rule of thumb (.7 / .4 / .1), correlation not causation; serial position (primacy from
  rehearsal into LTM, recency from STM, recency lost after a 30-s counting delay, Glanzer & Cunitz 1966), spacing
  effect, Ebbinghaus forgetting curve shape, proactive vs retroactive interference; UCS/UCR/CS/CR in six stories,
  acquisition, extinction, spontaneous recovery (weaker than end of acquisition), the four partial schedules, their
  cumulative record shapes (FR pause-and-run, VR steepest and steady, FI scallops, VI slow and steady), VR most
  resistant to extinction, continuous reinforcement extinguished fastest; all ten operant items (added/removed x
  up/down; negative reinforcement never keyed as punishment). All correct.

## Numeric recheck (my own scratch code)

`scratchpad/tools-a/check.mjs` (not in the repo) loads the runtime in a vm exactly as the tests do
(`_shared.mjs runtime()`), regenerates drills with fresh seeds, recomputes every key from the givens with its own
formulas (mean, median, range, z, rule shares from a hard-coded table, Pearson r from the points, the phase from
the trial number, the term from add/up, the schedule from the story) and grades through `ApPsychMath.diagnose`.

- stats-lab 2000 seeds x each context and type; memory-lab and conditioning-lab 2000; article-studio 500 x 4 types
  x 6 studies; evidence-builder 500 x 3 types x 3 questions. Also extra checks: outlier moves the mean more than the
  median and to the tail side; spaced mean above massed; forgetting drops shrink; recovery above end of extinction
  and below end of acquisition; support/null/reverse study variants have the stated direction, significance and r;
  every keyed ethics guideline is described in the study and no second described guideline is offered as wrong.
- Result: every key right; every authored mistake (sum for mean, unsorted middle, above vs below, within-k-SD,
  one side only, wrong pair of groups, added means, negative difference, old mean averaged with the outlier,
  divide by n not n+1, delayed group for immediate) grades wrong. 0 key errors.
- Existing tests: all five `node --test scripts/test/appsych-tool-<slug>.test.mjs` pass before and after;
  `node scripts/check-appsych-content.mjs`: tools 0 failing.

## Changes

1. **evidence-builder: missing claim rule (grading error).** `score()` gave 0 to B(i), B(ii), C(i), C(ii) whenever
   the chosen claim was refused (topic, question, oversimplified, summary) or absent, so a perfect B and C built on a
   "topic" claim scored 0/7. The 2026 SG: "In the absence of a claim that earns the point in Part A, responses can
   establish an intended claim in Part B through the evidence and reasoning provided"; A still earns 0. Fix in
   `psychology/assets/tools/math/evidence-builder.js`: new `intendedClaim()` picks a defensible claim the chosen
   results support, B and C are scored against it, A stays 0 and its note says B and C can still score. Same
   build now scores 6/7. Validator `scripts/lib/appsych-tool-checks/evidence-builder.mjs` gains the rule (a refused
   claim with the keyed B and C scores 6). `howItWorks` in `psychology/data/tools/evidence-builder.json` says so.
2. **memory-lab forgetting drill: contestable distractor (science).** Step `fix` asked which plan "would most likely
   keep more of the material by day 30" and offered "Waiting until day 29 and cramming" as wrong. For a day-30 test a
   day-29 cram plausibly does keep more by day 30 (the tool's own model: 85.6% vs 42.8% for days 1, 3, 7), so the
   key was not the only defensible answer. Replaced with "Rereading it once on day 2, then never again." (one review,
   rereading not retrieval).

No keys changed in any other drill.

## Playwright (Chromium, scratch build, 390 and 1440 px)

`scratchpad/tools-a/play.cjs`: for each trainer, 6 seeded drills per width; on every step a wrong answer first,
then the key. Results: 60/60 drills won; every wrong answer got specific feedback naming the slip (0 thin); no
wrong-answer feedback quoted the key; before answering no figure or caption printed a key (memory-lab's
"Mean: massed, spaced" label appears only after the means are answered); 0 px horizontal overflow; no console errors
from the tools (only the sandbox's blocked analytics calls). Screenshots: `scratchpad/tools-a/shots/`.

Visual issues to report (not fixed, page/CSS files):
- At 390 px the fullPage drill screenshots of stats-lab, memory-lab and article-studio show the "Skip to content"
  link visible mid-page over the figure dock after a step is checked (focus moves; the skip link is shown when
  focused). Check whether it should stay hidden when focus is not on it.
- At 390 px memory-lab's drill figure sits under about 200 px of empty space above the chart.
- stats-lab outlier histogram (quiz-scores, low outlier): the y axis gets half-count ticks (0.5, 1.5, 2.5) for
  counts; whole-number ticks would read better. The overlap my script flagged ("2.5 / 0" at the axis corner) is the
  x-axis start label touching the y-axis 0; cosmetic.
- memory-lab forgetting graph: the "100%" point label sits close to the "Percent remembered" axis title (touching
  boxes in one seed at 1440); legible.

## Open questions for a person

- conditioning-lab schedule story "A worker is paid every two weeks, no matter how much work she does" is keyed
  fixed-interval. Strictly, pay with no response requirement is a fixed-time schedule; most intro texts still use the
  paycheck as the FI example, so it is left in. Consider "paid every two weeks for showing up to work" or swap for
  the existing pain-pump or Friday-quiz stories.
- evidence-builder lists "the tend-and-befriend response" as a concept that fits no source (distractor only); fine,
  but the off-text says no source let participants choose, which is a design argument rather than a content one.
