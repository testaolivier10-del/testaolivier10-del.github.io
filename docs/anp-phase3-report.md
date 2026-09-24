# A&P Phases 2 and 3 report: the whole course

Written 2026-09-24, when the last A&P I chapters were published. Phases 2 and 3 ran without a
review stop, as `docs/anp-spec.md` section 18 asks. Every judgment call is recorded in the
decisions log (spec section 19, decisions 51–66). Contested science and the instructor-review
lists are in `docs/anp-needs-author.md`. The course is still marked **Beta**, pending review by a
licensed A&P instructor.

## What was built

**Phase 2:** the respiratory and nervous chapters, then the rest of A&P II (endocrine, blood,
lymphatic and immune, digestive, metabolism, urinary, fluid and acid–base, reproductive,
development), then the full TEAS mode.

**Phase 3:** the rest of A&P I (integumentary, bone tissue, skeleton, joints, muscle tissue,
muscular system) and both cumulative finals.

All 27 chapters are listed in `anatomy-physiology/data/published.json`. Each one passed the
two-stage audit before it was added (decision 53).

| | Whole course | Phase 1 pilot, for comparison |
|---|---|---|
| Chapters | 27 (5 Foundations, 11 A&P I, 11 A&P II) | 6 |
| Topics (lesson and notes page each) | 162 | 49 |
| Questions | 3,328: 960 recall, 1,617 apply, 751 analyze | 925 |
| Question types | single 1,354, vignette 574, image 337, predict 236, multi 208, order 179, error 162, missing 156, graph 122 | |
| Glossary | 1,041 terms | 361 |
| Figures | 389 OpenStax figures, each license-checked (CC BY 4.0, no third-party credit), plus 26 LevlPrep SVGs registered as figures | 114 |
| Core concept pages | 8 | 8 |

**Published tool content** (`anatomy-physiology/assets/tool-data/`):

- Lab practical: 83 image sets.
- Predict the change: 377 scenarios.
- Feedback loop builder: 49 loops.
- Pathway tracer: 208 pathways, each in three variants.
- Graph reader: 76 graphs.
- Calculators: 89 calculators in 15 groups, including the acid–base interpreter.
- Word root builder: 700 parts and 957 terms.
- Flashcards: 2,029 authored cards, plus the glossary cards.

## Exams, checked with the whole course live

Checked in Chromium at 1280 px and 390 px wide. Neither width scrolls sideways.

**Cumulative finals.** Questions are split by each chapter's share of the course's topics. That
is the Phase 0 distribution: 83 topics in A&P I, 79 in A&P II, with endocrine's 6 topics moving
between the two with the switch.

| Final (50 questions) | Chapters | Largest shares |
|---|---|---|
| A&P I | 16 | Chemistry and physics 5, Cells 5, Orientation 4, Signals 4, Muscle tissue 4 |
| A&P I with endocrine | 17 | Endocrine gets 3 |
| A&P II without endocrine | 10 | Cardiovascular 10, Respiratory 6, Development 6 |
| A&P II (endocrine on by default) | 11 | Endocrine gets 4 |

- The 100-question length and the "All" length give 100 questions and every question in those chapters.
- The "By system" results match the planned shares, chapter by chapter.
- Timing is 1.5 minutes a question: 75:00 for 50 questions.
- The "include endocrine" switch adds and removes endocrine in both finals. In the custom set it
  removes endocrine's 134 questions (3,328 becomes 3,194).

**TEAS mode:**

- Every attempt gives 18 questions: one from each of the 12 areas, plus 6 rotating extras.
- The extras alternate between two halves of the area list:
  - general orientation through muscular on one attempt;
  - male and female reproductive through skeletal on the next.
- Over six attempts, every area got exactly 3 extras.
- Timing is 1.2 minutes a question: 21:36 for 18 questions.
- No prediction items appear.
- Results are broken down by TEAS area.
- The page shows the ATI disclaimer and labels the mode as an estimate, both before and after the attempt.

Every question's `teas` tag is one of the 12 areas. Every area has far more questions than an
attempt needs. Counts below exclude prediction items:

| Area | Questions | Area | Questions |
|---|---|---|---|
| General orientation of human anatomy | 572 | Male and female reproductive | 295 |
| Nervous | 417 | Skeletal | 263 |
| Cardiovascular | 389 | Muscular | 243 |
| Digestive | 220 | Urinary | 189 |
| Respiratory | 181 | Endocrine | 120 |
| Immune | 113 | Integumentary | 90 |

**Fixed in this pass (decision 66):**

- **TEAS question levels.** When one question was left to place, the tie went to recall every
  time. So all 12 one-per-area TEAS questions were recall questions (each attempt was 12 recall
  and 6 apply). Small chapters' shares of a final had the same bias. Ties now go to a level drawn
  by the target mix. Six attempts now give a mix of all three levels.
- **Leftover partial-course wording.** Wording written for an unfinished course still showed.
  It now appears only while some chapter is unpublished:
  - The course home said "162 topics are built: Foundations and the cardiovascular system".
  - The finals said "What this final covers today … chapters still being written are left out".
  - The glossary said "1041 terms so far".
  - The practice chapter picker said "The pilot covers Foundations and the cardiovascular system".
  - The TEAS results sentence read "…does not publish it, and A score here…".
- **Finals were missing from descriptions.** The exams page description and the course home's
  Exams card now mention the cumulative finals.

## Course home, chapters, sitemap and credits

- The course home and the All chapters page link all 27 chapter pages.
- No generated page still carries the "coming in a later part" or unbuilt markers.
- The sitemap lists all 162 lesson pages, all 162 notes pages and all 27 chapter pages. `build-sitemap.mjs --check` passes.
- The figure credits page lists all 389 OpenStax figures.

## Checks (all green)

These are the CI checks from `.github/workflows/checks.yml`, run on the working tree after the fixes.

- **Site check:** 681 HTML and 1,493 JSON files, no broken references. Open Graph tags are present on 665 pages, and the sitemap lists all 665.
- **Ordering:** 27 chapters, 162 topics, 1,041 concepts and 32 preview boxes. 324 pages checked; nothing is used before it is taught.
- **`build-anp.mjs --check`:** 162 topics, 443 files in step with their data.
- **`check-anp-content.mjs --check`:** 162 topics and 3,328 questions, 0 failing, and 0 tool failures. One warning, not a failure: Connective tissue has no anatomy panel, because no connective-tissue micrograph is cleared for commercial use.
- **Other generator checks:** every other `--check` passes, and the tutor banks show no diff.
- **Tests and weight:** 243 of 243 unit tests pass, and all 90 weight budgets are in range.
- **Accessibility:** axe-core found no serious or critical issues across 19 page shapes.
- **Console:** all 668 pages load with no runtime error.

## For the human reviewer

Everything that needs a person is in `docs/anp-needs-author.md`:

- **Contested science:** over 100 items, each with the current-evidence answer taught and a "For your exam" note where an exam may expect an older answer.
- **Per-chapter judgment calls for the instructor review:** one section each for the Phase 1 pilot, every Phase 2 chapter and every Phase 3 chapter.
- **Map gaps found while labeling:** structures OpenStax names that the dependency map does not yet carry.

## Remaining gaps

- **Histology stations.** Several are not built because no micrograph is cleared for commercial use:
  - connective tissue, trachea and lung, nervous tissue, retina, spleen and lymph node, testis and ovary;
  - the full list is in the needs-author sections.
  - They need a commercially licensed micrograph source (decision 23).
- **Beta.** The course stays marked Beta until a licensed A&P instructor has reviewed it (spec section 16).
- **TEAS rotation is per device.** The rotation pointer lives in the browser's local storage. A student on a new device starts again at the first half of the areas. Over time, each device's attempts are still balanced.
- **Analytics.** The calculators and the word root builder still fire no analytics event, as in the pilot; the spec names none for them.
- **Outside the repo.** The Phase 1 actions still apply if they have not been done: rerun `scripts/sql/schema.sql` in Supabase, and redeploy the worker.
