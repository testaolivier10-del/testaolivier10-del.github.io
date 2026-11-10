# Phase 3 report: practice exams, unit tests, "Make it specific", models page, cram kit (2026-11-09)

Builder: the Phase 3 builder, working in `claude/aphug` while the integrator changed the shared runtime (no edit
to `hug-tools.js`, `hug-map.js`, `hug-model.js`, `hug-plot.js`, `hug.css` or `scripts/lib/aphug-build.mjs`).
What was built is in `docs/aphug-spec.md` section 5b and decision 10; formats in `docs/aphug-architecture.md`.

## Delivered

| Part | Files | Count |
|---|---|---|
| Two practice exams | `human-geography/data/exams/forms.json`, `items.json` | 2 forms x 60 MCQ (52 bank + 8 exam-only) + 3 FRQs; 104 fifth options; 16 exam-only items, 5 stimuli |
| Free unit tests | `scripts/lib/aphug-entry.mjs` `unitSample` | 7 units x 12 questions, no form question or form set |
| "Make it specific" | `human-geography/data/justify/*.json` | 73 prompts (10 a unit, 3 in the skills chapter), every one with a builder |
| Models you must know | `human-geography/data/models.json`, `models.html` | 26 models, each drawn, with claim, assumptions, limit, dated example; 24 flagged as easy to confuse |
| Cram kit | `human-geography/assets/pages/cram.js` | forms, prompts and FRQs from the real data |
| Checks and tests | `scripts/lib/aphug-exams.mjs`, `scripts/check-aphug-content.mjs`, `scripts/test/aphug-exams.test.mjs`, `aphug-cram.test.mjs` | 157 course tests pass |

## Checklist (each item checked by code, and the forms walked in a browser)

- [x] 60 five-option questions per form in 60 minutes, by unit weight: Unit 1 six, Units 2 to 7 nine each.
- [x] 23 of 60 with a stimulus in each form (map, data, image and text), sets of two or three, whole and in order.
- [x] Bank questions are reviewed (Phase 1 unit reviews), none a lesson check item, none in both forms.
- [x] Every exam-only number recomputed by ApHugCalc; every map, pyramid and symbol read checked against its data.
- [x] Section II: none, one, two stimuli; three different units per form; no FRQ in both forms.
- [x] As served: key longest 4 and 7 of 60; key positions 20/9/10/9/12 and 12/19/11/9/8; absolutes within limit;
      no key on a disputed place or an undated real figure.
- [x] Free unit tests never show a practice exam question (tested on a full build in a temp folder).
- [x] No released exam question reproduced or adapted: every item, prompt and model example is our own scenario
      or a public fact with its source; the standard is `docs/aphug-reviews/originality.md` (a scenario plus a
      sequence of parts, or a stimulus plus two parts, tracking a released question). The invented maps, the
      pyramid, the interview text and the Hormuz map share only standard concepts with released sets.
- [x] No score calculator, no readiness band, no Beta label; results show the two sections apart (50% each).
- [x] No em dashes in anything a student reads (one in the exam's save prompt label was removed; the shared
      `assets/account.js` save toast still joins with one: see "For the integrator").

## Browser walk (Chromium 1243, scratch site `/tmp/hug-p3/site`, port 8860, every chapter published)

Practice exam 1, whole, at 1280 x 900 light and at 360 x 760 dark: setup (format text, Section I and II times),
start, a map set (isoline map of Country A), the pyramid item, a set answered and locked, end of Section I with
the confirm, the Section II break, Q1 (no stimulus), Q2 (a map), Q3 (two texts), seven parts each, end, the
self-score page, the results on the shared score card with "Section I (50% of the exam)" and "Section II (50% of
the exam)" in the chips and the two-part block. Every question showed five options. No console errors other than
the sandbox's blocked outside requests (ERR_TUNNEL_CONNECTION_FAILED for external fonts and analytics); no page
wider than the screen. Also seen at both sizes: models.html (Burgess rings, the Latin American figure with its
numbered key, the DTM), cram.html (both forms linked, 14 study-day FRQs, none from a form), justify.html, a unit
test.

## For the integrator (shared files not edited)

- Rerun `node scripts/build-aphug.mjs` after your changes (needs-author `generated-at-root`).
- `assets/account.js` line 2190: the save toast title joins score and misses with an em dash; at 360 px it showed
  behind the score card for a moment after an exam. Shared, every course.
- Link `models.html` from the course home and the Learn page (generator files outside this phase's scope); it is
  linked from the formulas page and the cram kit.
- Two one-line edits outside the owned files: `scripts/build-aphug.mjs` `OWNED_FILES` lists `models.html`, and
  `scripts/check-weight.mjs` gives it a 26 KB budget.

## Open points

needs-author `phase3-exams`, `phase3-facts`, `generated-at-root`; `mcq-sets` and `scale-words` stay open.
