# Engagement pass (2026-10)

Status file for the retention/engagement work. A fresh session reads this, not the chat.
Branch: `claude/engagement`. Owner asked for items 1, 2, 3, 6, 7, 8 of the 2026-10-02 review.

## Items

| # | Item | Status |
|---|---|---|
| 1 | Return-visit measurement | Already existed (`visit`, `returned-second-day` in `assets/analytics.js`); only the `ref` source is added under 2 |
| 2 | Tracking gaps (NREMT drills and review were already tracked as `exam-*` with a mode); tag reminder/email/share links with `ref` and report it | done: flashcard and scenario events; `ref` capture in analytics.js, sw.js and worker email (worker needs a redeploy for email tagging) |
| 3 | Share results (`navigator.share`, copy-link fallback) at exam finish, level-up, streak milestones, chapter/course completion | done on branch `engagement-share`: `assets/share.js` via `LevlLazy`; README "Sharing a result" |
| 6 | Cross-course suggestions at milestones and on dashboards | in progress (helper B) |
| 7 | One clear "next step" at the end of every session in all three courses | in progress (helper B) |
| 8 | Milestones and a printable/shareable completion certificate | done on branch `engagement-share`: `assets/milestones.js`, `certificate.html`; NREMT milestone = full timed exam at 80%+; README "Milestones and certificates" |

## Decisions

- Every outbound link the site makes for a student to come back on carries `?ref=<source>` (`push`, `email`, `share`).
  `analytics.js` reads it, adds it to the `visit` event, fires `ref-open {ref, course}` and strips it from the address bar.
- Events stay milestones, not actions (README, Analytics). New events are listed in the README table.
- Certificates are certificates of completion from LevlPrep, not credentials; they say so and say LevlPrep is not
  affiliated with NREMT or any school. Built in the browser from local progress; the name on one is typed by the
  student and stays in the browser.
- No new third parties; CSP unchanged.
- `sw.js` `CACHE_NAME` is bumped once at the end, when the branches merge.
