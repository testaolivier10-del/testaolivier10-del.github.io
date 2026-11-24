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

- Simpler look (owner 2026-11-14, approved from full-page screenshots; same information, less to read):
  chart shows only the weekly % right line, an "80% right" line and "you, N%"; the headline gives the change
  ("Up 21 points in % right"), the pace in words, the last exams in a row under it. Readiness keeps the colored
  bar with the dot (owner preferred it), the range under the number, facts as one row, one line of fine print.
  Holding back is a table (Right, If 80% / If Strong / If Solid), one dark Practice button on the costliest row and
  "Practice →" links on the rest, the area name opens its notes. Cut as repeats: best exam fact (shown under the
  chart), the band's Level · streak · Profile line (top bar chips open Profile), the 64% said twice.

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

## Files
- `assets/course/readiness.js` (`LevlReady`): the model, AP cutoffs (`CUT`), live difficulty cache. Tests:
  `scripts/test/readiness.test.mjs`.
- `assets/course/dash.js` `render()`: readiness card, chart card, ranked list (`readinessCard`, `trendCard`,
  `holdCard`); a view may carry `html` (ochem's Premium slots). Styles at the end of `assets/course/dash.css`.
- Adapters: `nremt/assets/dash-nremt.js` (answers from `nremt_mastery` + `nremt/assets/qmeta.json`, built by
  `scripts/build-nremt-qmeta.mjs`, checked in CI), `assets/course/dash-ap.js` (12 AP and A&P; projected AP score
  with `unseen: -1.4`), `ochem/assets/dash-ochem.js` (gaps and families as tabs).
- NREMT end-of-exam update: `readinessPct()` in `nremt/practice-engine.js`, the same model.
- Profile: `profile.html`, `assets/profile.js`, `assets/profile-badges.js` (see "Profile v2") (course list generated by `scripts/build-courses.mjs`). Menus:
  `assets/account.js` (signed in), `assets/site-chrome.js` settings menu; header level and streak chips link to it.
- Moved: NREMT question levels to the Review queue card (`renderDueSummary`), ochem Daily Rounds and review debt to
  `ochem/review.html` (game-panel.js). AP tool accuracy was already on each Tools page.
- Worker: `worker/src/readiness.js` (`/qdiff`, `/outcome`), migration `scripts/sql/migrations/2026-11m-readiness.sql`.

## Owner steps
- Apply migration `2026-11m-readiness.sql` (adds `question_difficulty()` and `exam_outcomes`). Until then `/qdiff`
  returns nothing (the model uses written difficulty) and `/outcome` answers are not stored. The worker deploys
  itself on merge (deploy-worker.yml).

## Status
- [x] readiness.js + tests
- [x] NREMT question meta
- [x] dash.js option 2 renderer; adapters NREMT, AP (12 + A&P), ochem
- [x] Profile page + menu
- [x] Review: NREMT levels, ochem Rounds; Tools: already had accuracy
- [x] Readiness off Practice and Exams
- [x] Worker /qdiff and /outcome, migration written (not applied: needs the owner)
- [x] Screenshots every course, desktop/phone/dark; ci-local; PR

## Profile v2 (owner 2026-11-23)

Owner asked for lifetime stats, badges with their own designs, only earned badges shown under each course with the
rest greyed and locked, each course collapsible, and more badges per course ("look at how many other sites have and
match it"). Approved mockup: the artifact "LevlPrep Profile mockup"; the live page must look and work like it.

- **All time** (new card): questions answered, practice exams taken, lessons finished, free responses written, days
  studied, added up over every course. Only numbers that never go down (owner agreed 2026-11-23: no accuracy here,
  Progress owns "how am I doing"). Read through `LevlClassModel.raw(course, get)` (new: a course's whole record, not
  the capped class summary), so `profile.html` now loads `assets/class/class-model.js`.
- **Your courses** took in the old Badges and certificates card. Each started course is a `<details>` (open state in
  `levl_profile_open_v1`; first visit opens the course studied last): its numbers, earned badges as cards (a finished
  unit or course links its certificate), the rest as a row of grey locked shapes with no name. Hover, keyboard focus
  or a tap shows what a locked badge is, how to earn it and how far along (owner 2026-11-23). Ochem's concept badges
  and achievements stay as they were, inside its course.
- **Badges**: `assets/profile-badges.js` (`LevlBadges`: `stats`, `forCourse`, `art`). About 20 a course from the same
  families everywhere: units or chapters and the course (the milestones, with certificates), questions 50/250/500/1,000,
  lessons 1/10/25, exams (first, 3, one at 80%), days studied 7/30, free responses 1/10 (AP® only). NREMT keeps its
  six and its exam certificate. Sizing: Duolingo and Khan Academy build sets from a few families with rising tiers,
  Codecademy gives about one per lesson. Nothing is stored; each badge is worked out from the records on every visit.
  Art is drawn in SVG from each course's two cover colors (`COLORS`; add a line for a new course).
- `hub-progress.js` keeps 400 days of activity (was 180), so "days studied" and the 52 week grid have a year to show.
- Checks: `scripts/test/profile-badges.test.mjs`; browser, seeded student, 1280 and 390: `scripts/class-browser/profile.py`.
- Open: a new course needs its colors in `LevlBadges.COLORS` (falls back to NREMT's); ochem counts answers only since
  2026-11-04 (`ochem_items_v1`).
