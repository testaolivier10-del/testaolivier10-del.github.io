# Tools upgrade, second round (2026-10-27)

Status file for the tools work the owner asked for on 2026-10-27 (the first round, from 2026-10-09, is `docs/tools-upgrade.md`): a hands-on pass through every tool, then
three builds. Read this before continuing any of it.

## Owner brief

- Research (2026-10-27) compared LevlPrep's tools with what students use and want. The owner chose three builds:
  1. NREMT exam formats: drag-and-drop and options-table items (the Registry's technology-enhanced items), real
     dragging for build-list items, then an adaptive exam mode that stops early like the real exam and reports
     each domain as above, near or below passing.
  2. An ochem synthesis trainer: start material to target, step by step, with the reason when a route dead ends.
  3. A&P in 3D, reusing the NREMT body map engine (`nremt/assets/body-viewer.js`).
- First: a hands-on pass through every tool, rated against the body map bar (just works, very interactive, good
  information, good at its job, interesting; simple on landing with progressive disclosure; professional
  illustration quality; readable on a phone; opens full screen as just the tool).
- Ships as one pull request the owner reviews before merging.

## Hands-on pass

Harness: loads every tool at 390 px and 1280 px with Premium unlocked locally, records console errors, failed
requests and sideways scroll, and screenshots before and after interacting. Mechanical result: every tool page
loads clean; `nremt/sound-trainer.html` and `bio/tools/tree-reading.html` scroll sideways at 390 px.
Per-tool ratings and fixes: `docs/tool-audit-2026-10.md`. Fixing those findings is not part of the three builds;
it waits for the owner's go-ahead.

## Builds

| Build | Status | Files |
|---|---|---|
| NREMT item types and adaptive exam | built, accuracy reviewed, hands-on tested at 390 px (branch `tools-nremt-tei`) | `nremt/assets/tei-items.js` (dnd, table, order dragging), `nremt/assets/cat.js` (adaptive model), `nremt/practice-engine.js`, `nremt/practice.css`, `nremt/exams.html`, 60 items in `nremt/assets/questions.json` (ids 2113-2172), `scripts/test/nremt-tei.test.mjs`, tools hub counts in `scripts/build-r3-tools.mjs` |
| Ochem synthesis trainer | in progress | |
| A&P 3D anatomy | in progress | |

## Decisions

NREMT item types and adaptive exam (2026-10-27):

1. **Exam facts, checked on nremt.org (October 2026).** EMT exam: 70 to 120 items plus 10 pilot items, 2 hours,
   computer adaptive; technology-enhanced items are build list, drag and drop, and option/check box (options table);
   domains Scene Size-Up 15-19%, Primary 39-43%, Secondary 5-9%, Treatment and Transport 20-24%, Operations 10-14%
   ([EMR and EMT examinations](https://nremt.org/Pages/Examinations/EMR-and-EMT-Certification-Examinations)). CAT starts
   slightly below the standard and stops at 95% confidence above or below it, after a minimum, or at the time limit
   ([Examination structure](https://nremt.org/Handbooks/Certification-Examinations/Examinations-Structure)). Score
   scale 100-1500, pass 950; failing candidates get performance relative to the standard
   ([EMT handbook, cognitive exam](https://www.nremt.org/Handbooks/EMT/Cognitive-Exam)). The Above/Near/Below domain
   wording follows what `nremt/exam-day.html` already tells students; nremt.org's public pages do not spell it out.
2. **Item shapes.** `dnd`: `bins`, `correct[i]` = bin per option. `table`: `cols`, `correct[i]` = column per row.
   Rows shuffle per browser (stored in `nremt_option_order` like other items); groups never shuffle. Answers are
   arrays of bin/column or null, so saved exam state, missed and flagged queues need no change.
3. **Interaction.** Mouse drags anywhere on an item; touch drags only from the dotted grip, so a finger on the text
   still scrolls the page. Tap an item then a group; keyboard Enter/Space picks, number keys place, Escape or 0 takes
   it back out. Table rows are native radio groups. Build list keeps its arrow buttons and gains dragging.
4. **Scoring.** All or nothing per item; the checked state, the results list and the flashcard back mark each row.
5. **Adaptive model** (`nremt/assets/cat.js`): Rasch, tag difficulties -2/-1/0/+1, passing line 0, EAP on a grid
   with an N(0,1) prior, next item nearest the estimate in the domain furthest behind `DOMAIN_TARGETS`, unseen items
   first. Stops at 95% interval clear of the line after 70, at 120, or at 2 hours (best estimate decides; out of time
   before 70 is a fail). Domains: shrunk per-domain estimate, Above/Below beyond one SE, otherwise Near. Simulated
   students: level 0 runs about 116 items, levels of +/-0.6 stop near 77, and pass rates are 0% / 50% / 100% at
   -0.6 / 0 / +0.6.
6. **Premium.** Mode `cat` is an exam like `full`: `canStartExam` / `examStarted` (one free attempt each since decision 9), no daily
   quota (`premium-gates.js quotaApplies`). Premium copy now says "Unlimited timed and adaptive exams".
7. **Tools hub counts** come from the pages: scenario ids in `scenario-sim.html`, top-level `<h2>`s in
   `flowcharts.html`, `.skill-card`s in `skillsheets.html`, `.drug` cards in `formulary.html`
   (`scripts/build-r3-tools.mjs`). The hub on this branch already listed the Drug Formulary and 25 calls / 10
   sequences; the "eight" figures in the brief were not found in this checkout, so the stations card now states
   its count too (10) and every count is generated.
8. **Accuracy review** (independent, strongest model, checklist: EMT-scope accuracy, one defensible answer per row,
   no giveaways, explanation matches key). 60 items, 13 findings (3 must-fix, 4 should-fix, 6 notes); all must-fix
   and should-fix applied (2149 Onset row could also be SAMPLE Events; 2136 infant HR 90 is the sleeping lower limit,
   now 70; 2120 parking past the crash assumes a blocker, stem now says one is there; 2122 "hidden"; 2138
   "mid-thigh"; 2154 own prescription; 2148 bin name), plus retags 2142/2146/2147 and wording notes. Two notes are
   left for the owner in `docs/nremt-needs-author.md`.
9. **Owner decisions (2026-10-27).** (a) The adaptive exam has its own free attempt, separate from the one free timed
   exam: `premium-gates.js` keeps `nremt_free_cat_v1` (synced, registered in `nav.js`) beside `nremt_free_exam_v1`;
   `canStartExam/examStarted/canUse` take the kind; the locked card says "You've used your free adaptive exam". Free
   lists read "One full timed exam and one adaptive exam" (`assets/premium.js`, hub, premium.html, manifest).
   (b) A finished adaptive exam counts toward Pass-or-extend: the page calls `LevlPremium.recordExam('nremt', n)`
   when it ran its course (at least 70 questions; never one ended early), the database stamps it in
   `exam_completions`, and the Worker's `countableExams` already counts anything of 50+ questions, so
   `GUARANTEE.minExams` (2) is unchanged and agrees in both places. Wording now says "full timed or adaptive exams"
   (premium.js `guaranteeText`, Worker refusal, terms.html, privacy.html, rule `premium-copy`, schema comment).
   Its local history `nremt_cat_history` stays unsynced; the server record is what counts.
10. **Dark-mode contrast:** the Premium pill on round 3 tool cards had cream background with light amber text; a
   dark rule in `assets/theme.css` gives it the dark `.tag.prem` colors.

## Open points

- NREMT adaptive exam: the passing line and difficulty tags are uncalibrated; refit from `question_stats` when there
  is enough data (`docs/nremt-needs-author.md`).
- The study-notes chapter review and the formulary drill skip typed items (they show single-answer questions only).
- Verification on a shared machine: the targeted checks (question bank, r3 tools and inner pages, course homes,
  pricing, weight, crumbs, OG tags, tutor bank, `check-site.mjs`, and the NREMT, premium, ids, service-worker and
  cross-course tests) pass; axe (WCAG A/AA) is clean at 390 px light and dark on exams, practice, review, the hub,
  premium and the three live item types. The full `BROWSER=1 scripts/ci-local.sh` did not finish within its time
  limit while about ten agents shared the machine; run it once at merge.
- `sw.js` CACHE is not bumped on this branch; bump it once at merge: `nremt/assets/tei-items.js` and `nremt/assets/cat.js` are new
  precached files.
