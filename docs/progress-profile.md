# Progress, Profile and readiness accuracy (status file)

Owner decisions 2026-11-13 (chat; options page https://claude.ai/artifact/SfNiQd5tmrLM8ANesiR4dL). Replaces the
five-question layout in docs/dashboard.md (design F); the dashboard adapters stay, the renderer changes.

## Decisions
- Readiness lives only on Progress: removed from NREMT Practice and Exams (the end-of-exam compact update stays).
- Progress answers three questions and nothing else, all visible (no drawers of leftovers):
  how close am I (readiness card), what is holding me back (ranked list), am I getting better (chart).
  Layout: option 2 "Split": readiness card and chart side by side, ranked list full width below.
- "What should I do now?" leaves Progress (course Home owns it). Level, XP, streak, daily goal, reminders,
  badges, milestones, certificates, sync and backup move to the new Profile page (option 1, one column), opened
  from "Profile" in the menu under the username and in the dots menu. Review queue and mastery levels go to Review;
  tool accuracy goes to Tools.
- Same Progress format in every course; only the measure differs (NREMT exam %, AP "% of the exam at Strong",
  A&P and ochem topic coverage).
- NREMT readiness shown as an exam percentage (option A), on track at 80%, the chart's line.
- Accuracy work (owner: "do all of that"): difficulty-weighted ability, every answer counted with recency, weighted
  by the real exam's blueprint, an 80% range, AP bands from per-course cutoffs with free response, live difficulty
  from question_stats once a question has 20 answers, and an optional outcome question after exam day.

## Readiness model (assets/course/readiness.js, window.LevlReady)
- 1PL (Rasch) ability per area: P(right) = sigmoid(theta - b). b from live p (n >= 20, worker /qdiff) else the
  authored difficulty (easy 0.82, medium 0.68, hard 0.52 expected right for a typical student; AP d 1/2/3 the same).
  MAP estimate with a normal prior (area prior centered on the overall theta, so thin areas shrink to the overall).
- Each answer weighted by recency (half-life 30 days); repeats of one question count as at most 1.5 answers.
- Predicted exam % = sum over blueprint areas of weight * mean sigmoid(theta_area - b) over that area's bank.
  Unstarted areas use the overall theta (or the prior when nothing is answered).
- Range: theta +- 1.28 SE (80%), carried through the same sum.
- AP composite = (1 - frq) * MCQ% + frq * FRQ% (FRQ from graded free responses when any, else MCQ% with a wider
  range); band from the course's cutoffs below. Shown only with 30+ answers.

## AP cutoffs (percent of composite for a 3 / 4 / 5) and free-response share
Median of published estimates (Fiveable, EduCalcDb, GetAPScore, APScoreHub, APCurve, read 2026-11-13). College
Board publishes no official cut points; these move a few points each year.
| Course | FRQ share | 3 | 4 | 5 |
|---|---|---|---|---|
| Biology | 50% | 44 | 59 | 73 |
| Chemistry | 50% | 40 | 57 | 73 |
| Physics 1 | 50% | 40 | 57 | 75 |
| Statistics | 50% | 40 | 55 | 70 |
| Environmental Science | 40% | 45 | 60 | 73 |
| Psychology | 33% | 49 | 62 | 75 |
| Human Geography | 50% | 46 | 60 | 75 |
| Macroeconomics | 33% | 49 | 65 | 83 |
| Microeconomics | 33% | 50 | 63 | 81 |
| Calculus AB | 50% | 35 | 48 | 65 |
| Calculus BC | 50% | 37 | 48 | 60 |
| Precalculus | 38% | 35 | 48 | 64 (low confidence: sources disagree, 56 to 72) |
A 2 starts at 0.65 of the 3 cutoff.

## Live data (2026-11-13)
question_stats: 6 questions site-wide have 20+ answers, so authored difficulty carries the model for now; the worker
route switches each question over as it reaches 20.

## Status
- [ ] readiness.js + tests
- [ ] NREMT question meta (nremt/assets/qmeta.json, scripts/build-nremt-qmeta.mjs)
- [ ] dash.js option 2 renderer; adapters NREMT, AP, A&P, ochem
- [ ] Profile page + menu
- [ ] Review: queue and mastery levels; Tools: tool accuracy
- [ ] Readiness off Practice and Exams
- [ ] Worker /qdiff and /outcome, migration exam_outcomes
- [ ] Screenshots every course, desktop/phone/dark; ci-local; PR
