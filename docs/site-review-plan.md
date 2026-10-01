# Site review follow-up (2026-10)

Status file for the cross-course pass that came out of the 2026-10-01 site review.
A fresh session should read this file, not the chat history.

## Decisions (from the owner)

- **One tab vocabulary for every course:** Home · Learn · Practice · Review · Exams · Glossary · Tools · Dashboard.
  - **Learn** is the reading material: NREMT's Notes and Mnemonics, the ochem and A&P textbooks.
  - **Practice** holds every question mode: drills, flashcards and the other existing modes.
  - **Review** is its own tab in each course and holds the spaced review queue.
  - **Exams** is its own tab: timed and cumulative tests.
  - **Dashboard** is the progress page in every course. The ochem and A&P `mastery.html` pages become `dashboard.html`; the old URLs redirect.
  - **Glossary** exists in every course. Ochem's is new.
- **Search** leaves the tab row and becomes one site-wide search reached from the header. It covers all three courses.
- **NREMT Study Plan page is removed.** Its exam-date countdown and per-day target move into a card on each course's Dashboard. The old URL redirects to the Dashboard.

## Workstreams

Each workstream is done on its own branch and merged into `claude/youthful-newton-ea87o4`.

| # | Workstream | Status |
|---|---|---|
| W1 | NREMT and A&P content fixes; rebalance answer positions in A&P "missing" and "error" items | done |
| W2 | Ochem content fixes; rebalance true/false answers (71% True) | done |
| W3 | Tab unification, NREMT Review and Exams pages, Study Plan removal, Dashboard rename, root redirects keep the query string | done |
| W4 | Ochem Exams page: chapter tests and a timed cumulative final | done |
| W5 | Ochem glossary with inline term popups | done |
| W6 | Home and chrome UX: hero "Continue" buttons, per-course Continue links and A&P on the hub, course name in the phone header, tutor-button placement, header search entry | done |
| W7 | Code weak spots: worker Origin check, progress-backup merge, long-page navigation, a11y gaps, `build-anp --check` speed, `*.whl` in `.gitignore` | done |
| W8 | Site-wide search across all three courses (root `search.html`) | done |
| W9 | NREMT spaced-repetition flashcards | done |
| Final | Merge, regenerate generated files, bump `sw.js` cache, full CI, independent accuracy check of rewritten science | done |

## Review findings to fix

### NREMT
- **#938:** remove the nitroglycerin "tingling" potency check.
- **#1477 and #32:** the systolic-96 cutoff for nitroglycerin is ambiguous; make the stem say "per protocol" or change the value.
- **#35:** add the 2.4-inch upper limit for compression depth.
- **#895:** fix the he/she mismatch.
- Near-duplicates: 430/1111/1296 and 1907/2018.

### Ochem
- **claisen#14:** the product is a 1,3-diketone.
- **aromaticity#3:** the "planar" premise is wrong.
- Wrong question types: fischer#13 (true/false with 4 options), alcohol-reactions#9 and #23.
- atomic-structure#4 and orbitals#3 have only 3 options.
- Weak wording: michael-robinson#8, amine-reactions#29, multistep-synthesis#12.
- Stems that need lesson context: hofmann-elimination#26, enolate-regiochemistry#9 and #16, multistep-synthesis#28.

### A&P
- **erythrocytes-4:** say "inappropriately low EPO".
- **README line 9** is stale.
- Answer position: "missing" items have 50% of keys at A; "error" items never have the first step wrong.

### Code
- The worker accepts requests that carry no Origin header.
- `progress-backup.js` restore can overwrite newer progress.
- The A&P glossary and the ochem learn page are huge on phones.
- The ochem flashcards page has no `<main>`; `.anp-opt` buttons have no radio role.

## Outcome (2026-10-01)

All workstreams were merged into `claude/youthful-newton-ea87o4`. Every check in `checks.yml` passes locally, including axe (23 page shapes, no serious violations).

Each piece of science or clinical writing got an independent accuracy check, and every fix it found was applied:
- the ochem bank rewrites
- the NREMT flashcards
- the ochem glossary
- the NREMT and A&P question rewrites

That check also fixed NREMT study notes chapter 34: it now uses the 2021 field-triage criteria (falls over 10 ft at any age, age 65 and over).

Also done in this pass:
- The ochem periodic table fits its window with no scrolling.
- `build-sitemap` and `check-site` skip every dot-directory, so agent worktrees under `.claude/` are never scanned.

## Open follow-ups

- **Advisory colour contrast:** the tutor's `.lp-tip` tooltip, `.xp-level` in dark mode (`ochem.css`), `#qDomain` (NREMT practice) and `.anp-pr-exam-t small` (A&P practice).
- **True/false cap:** `check-site` still allows up to 75% True in ochem true/false; the bank is now 49%, so the cap could drop to about 55%.
- **No size headroom:** the A&P shared-asset budget is at 42.0 of 42 KB, and the ochem shell is just under 106 KB.
- **NREMT activated charcoal** (#42, #500, #655, #1443): confirm against the current scope of practice and state protocols.
- **NREMT choking items:** consider a note on the AHA 2025 choking-sequence change while exam banks transition.
- **`nremt/sw.js`:** it is a tombstone that unregisters itself; remove it once old installs are gone.
- **Notes pages:** they have no `<main>` and no skip link, so they are left out of `check-a11y` (noted by W5).
