# Engagement pass (2026-10)

Status file for the retention/engagement work. A fresh session reads this, not the chat.
Branch: `claude/engagement`. Owner asked for items 1, 2, 3, 6, 7, 8 of the 2026-10-02 review.

## Items

| # | Item | Status |
|---|---|---|
| 1 | Return-visit measurement | Already existed (`visit`, `returned-second-day` in `assets/analytics.js`); only the `ref` source is added under 2 |
| 2 | Tracking gaps (NREMT drills and review were already tracked as `exam-*` with a mode); tag reminder/email/share links with `ref` and report it | done: flashcard and scenario events; `ref` capture in analytics.js, sw.js and worker email (worker needs a redeploy for email tagging) |
| 3 | Share results (`navigator.share`, copy-link fallback) at exam finish, level-up, streak milestones, chapter/course completion | done (merged): `assets/share.js` via `LevlLazy`; README "Sharing a result" |
| 6 | Cross-course suggestions at milestones and on dashboards | done (merged): `assets/cross-course.js` (16 curated pairs, gating, dashboard card); README "The other courses" |
| 7 | One clear "next step" at the end of every session in all three courses | done (merged): `assets/next-step.js` + `LevlNextStep()` in site-chrome.js; README "One next step" |
| 8 | Milestones and a printable/shareable completion certificate | done (merged): `assets/milestones.js`, `certificate.html`; NREMT milestone = full timed exam at 80%+; README "Milestones and certificates" |

## Decisions

- Every outbound link the site makes for a student to come back on carries `?ref=<source>` (`push`, `email`, `share`).
  `analytics.js` reads it, adds it to the `visit` event, fires `ref-open {ref, course}` and strips it from the address bar.
- Events stay milestones, not actions (README, Analytics). New events are listed in the README table.
- Certificates are certificates of completion from LevlPrep, not credentials; they say so and say LevlPrep is not
  affiliated with NREMT or any school. Built in the browser from local progress; the name on one is typed by the
  student and stays in the browser.
- No new third parties; CSP unchanged.
- `sw.js` `CACHE_NAME` v55 after merging main (AP Biology, course registry). Full CI passed (2026-10-03). Weight budgets raised: site 279 -> 280, nremt/practice.html 45 -> 45.2 (reasons in check-weight.mjs). The Worker needs a redeploy for `ref=email`.
- End screens: one pressed button from `LevlNext.pick` (due review, then the next lesson, then the weakest area, then
  the course home), at most two quiet links. Styles live in `assets/next-step.css`, linked on load, for weight.
- A cross-course suggestion counts as an ask: it never shows with `.levl-prompt` or `.levl-cele` up, and the install
  prompt stands down while one is shown. Once per pair, ever.
