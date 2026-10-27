# Course dashboards: five questions (status file)

Approved 2026-10-26: design F ("five questions, with personality") on the dashboard canvas
(https://claude.ai/artifact/3sR679KQ1mizaV8Sg4TwD2, bottom row), after Olivier asked for research on what students
want, then for options, then for something "not as busy", "intentional", and finally with more soul. "Apply it now to
all courses."

## The design
Every dashboard answers five questions, in the order a student asks them, and nothing on the page does not answer
one of them. Every panel the old dashboards had is still there, folded in a drawer under the question it answers.
1. **What should I do now?** One action and why, two "then" steps, today, the streak, freezes, reminders.
2. **Am I getting better?** One chart: weekly accuracy, every exam on the same line, the goal, exam day, handwritten
   notes. A dashed projection to the goal only when there are three weeks and the line is rising.
3. **Will I be ready?** NREMT: the readiness estimate (Premium) as a distance to 80, and "what closes the gap", each
   line the same estimate recomputed with one thing changed (one more exam at 80%, the weakest area within 15 points),
   plus pace from the full exams' own times. Mastery courses: coverage, the share of the exam (AP: units weighted by
   the middle of the CED range) or course (A&P: chapters by built topics; ochem: concepts) at Strong (0.6) / Solid
   (0.7). Gap lines: the two costliest groups under way, then the next one in course order.
4. **Where am I losing points?** Groups ordered by what they cost (NREMT: questions missed; AP: exam weight not yet
   Strong; A&P/ochem: topics/concepts not yet Strong/Solid), not by percent. A second view: exam domains (NREMT,
   Premium), practices (AP), core concepts (A&P), weakest concepts (ochem). Untouched groups fold to "next in order".
5. **What have I built?** Level, mastery, work, badges (NREMT, ochem achievements), the next thing to earn.
The band's handwritten line is the one-sentence status; the level sits beside the band's button (the level led the
page before, owner 2026-10-26, so it stays the first thing seen).

## Files
- `assets/course/dash.js` (`window.LevlDash`): renderer, chart, icons, `dailyWeeks()`. `assets/course/dash.css`.
- `assets/course/dash-ap.js` (`window.LevlDashMastery`): `build(cfg)` for the mastery courses, `ap(o)` for the six AP.
- Adapters: `nremt/assets/dash-nremt.js`, `ochem/assets/dash-ochem.js` (runs before mastery-page.js and game-panel.js,
  which fill the drawers by id), `*/assets/pages/dashboard.js` (six AP configs), `anatomy-physiology/assets/apps/mastery.js`.
- Built pages load the assets through `dashboardPage()` (`scripts/lib/dashboard-page.mjs`); `r3-db.js` is no longer
  loaded by any dashboard.
- The weekly line: `hub_daily_v1` `{ v:1, days: { 'YYYY-MM-DD': { <course>: [right, total] } } }`, written in
  `LevlPremium.noteAnswer` (every course's answers go through it), 180 days. Local only (like the exam date), kept by
  progress-backup (hub_ prefix). It starts with this release, so existing students see their exams first and the
  weekly line fills in from now; a day already under way starts from today's score.

## Decisions and limits
- "Sure but wrong" (mockup) needs a confidence tap in practice: not built, left out rather than faked.
- No goal line or projection for the mastery courses: their 80%-style line would be invented. NREMT uses 80, the
  site's own top band and the full-exam certificate.
- Ochem keeps its Premium split: without a pass, "what to do now" is Rounds, review and the next lesson, never a pick
  from the gap detector. NREMT keeps readiness and the domains Premium; AP keeps skills and tool accuracy Premium.
- No new badges for the AP courses (no new game mechanics, owner 2026-10-17).

## Proof
Screenshots (empty, with data, locked and unlocked, phone, dark) in the PR.
