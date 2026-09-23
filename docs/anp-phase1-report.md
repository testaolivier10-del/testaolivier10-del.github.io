# A&P Phase 1 pilot report

Built 2026-09-23 on branch `claude/anp-course-spec-1cbz2v`. This is the one review stop in
`docs/anp-spec.md` section 18. The course is live on the branch at `/anatomy-physiology/` and is
marked **Beta** everywhere.

## What was built

**Content: Foundations (topics 1–33) and the whole cardiovascular chapter (topics 95–110).**
That's 49 topics. Each has an 11-part interactive lesson and a full notes page.

| | Count |
|---|---|
| Topics built | 49 (5 Foundations chapters + Cardiovascular) |
| Notes | about 122,000 words, with 60 original SVG diagrams |
| Questions | 925: 229 recall, 461 apply, 235 analyze |
| Question types | single 471, vignette 125, multi 70, predict 63, order 52, error 49, missing 48, graph 24, image 23 |
| Glossary | 361 terms, each with word roots and a link to the page that teaches it |
| Figures | 114 OpenStax figures, each license-checked one by one; all are CC BY 4.0 with no third-party credit |
| Figure labels | 1,251 printed labels named on 110 figures, used for hide-labels panels and the lab practical |
| Core concept pages | 8, each with an authored introduction |

**Tools. All 8 run on data, with a validator in the content check:**
- **Virtual lab practical:** 25 sets and 42 figures, with 586 structures to identify plus 70 follow-up questions. It has explore, study, quiz and timed bell-ringer modes. You can point at a structure or name it by typing, with forgiving spelling and a check on left/right.
- **Predict the change:** 40 scenarios and 200 predictions across levels 1–4. The two-stage level 4 items cover hemorrhage and a sudden rise in afterload.
- **Feedback loop builder:** 10 loops using the 7 slots from spec 8.3. The loop you build is then drawn as a diagram.
- **Pathway tracer:** 19 pathways, each in 3 variants (put in order, find the missing step, spot the error).
- **Graph reader:** 16 graphs with 73 questions. They include a full Wiggers diagram, a pressure–volume loop and the Frank–Starling curve.
- **Worked-example calculators:** 9 calculators that show every step, each with a practice mode.
- **Word root builder:** 205 terms built from 226 word parts.
- **Flashcards:** spaced repetition using 145 authored cards plus two cards per glossary term.

**App pages:**
- Course home, All chapters, 6 chapter pages (only chapters with content), core concept pages, glossary and figure credits.
- Practice, review and exams. Exams include a unit quiz, a system exam, cumulative finals with the "include endocrine" switch, a custom exam, and TEAS A&P practice with the ATI disclaimer, labelled as an estimate.
- Dashboard, search and the tools hub.

**Site integration:**
- A Beta card on the site home page, with the course in its JSON-LD.
- Service worker precache, and the 404 and offline pages.
- Sources section with the OpenStax non-endorsement statement and the TEAS disclaimer.
- Changelog entry and README.
- Theme, XP titles, account sync and backup, analytics, the tutor, and the report-a-question worker all know the `anp` course.

## Checks (all green)

- **Ordering:** nothing is used before it is taught. The check scans 98 generated pages plus all authored data, tool content and figure labels. It now also matches plurals, sub/superscripts and formulas.
- **Content check:** 49 topics and 925 questions, with 0 failing, and all 8 tool validators at 0 failing. It covers question rules, explanations for every option, licenses, the "receptor" rule, links that route, and figure references.
- **Site-wide checks:** the site check, every generator's `--check`, 242 unit tests and 38 weight budgets (10 of them new, for A&P).
- **Accessibility:** axe-core found no serious or critical issues on 19 page shapes, 5 of them A&P.
- **Console:** all 421 pages load with no runtime error.
- **CI:** now also runs `build-anp.mjs --check` and `check-anp-content.mjs --check`.
- **Originality:** 19 runs of 9 or more words are shared with OpenStax across 49 topics. All are lists of names or standard phrasing ("the left gastric artery, the splenic artery and the common hepatic artery").

## The audit (spec section 16)

Every topic and every tool went through two stages. First a checker listed findings. Then a
separate skeptical verifier checked each finding against current sources and applied only the
confirmed ones.

| Group | Findings | Confirmed | Rejected | Contested |
|---|---|---|---|---|
| Topics 1–10 | 44 | 34 | 10 | 0 |
| Topics 11–19 | 49 | 47 | 2 | 0 |
| Topics 20–27 | 42 | 39 | 3 | 0 |
| Topics 28–33 | 38 | 30 | 8 | 0 |
| Topics 95–98 | 26 | 24 | 1 | 0 |
| Topics 99–102 | 22 | 22 | 0 | 0 |
| Topics 103–110 | 35 | 33 | 1 | 1 |
| Predict, loops, pathways, graphs | 16 | 16 | 0 | 0 |
| Flashcards, calculators, word roots | 22 | 21 | 1 | 0 |
| Lab practical | 31 | 31 | 0 | 0 |

These fixes changed what a student is taught:
- **Osmosis:** now taught as bulk flow through pores.
- **Heart and vessels:**
  - Systemic resistance now comes from narrow, muscular small arteries, not branching.
  - The AV junction escapes at 40–60 per minute.
  - The Wiggers diagram was redrawn so every valve event sits where the traces cross.
  - Venule pressure no longer rises downstream.
  - A heart rate of 180 alone no longer nearly doubles cardiac output.
- **Blood loss:** plasma refills over hours through lower filtration plus lymph return, not a long inward flow.
- **Chemistry and cells:**
  - Glycogen is broken down by phosphorolysis, not hydrolysis.
  - Blood pH recovers after a sprint because the liver and muscles use up the acid, not the kidneys.
  - Connective tissue is defined by structure, not embryonic origin.
  - White blood cells leave the blood through venule walls.
- **Tools:** the childbirth loop no longer claims labor fails without oxytocin.

The answer-key length tell was also balanced. The key had been the longest option in as few as
2–7% of items in some groups; it now sits near 18–30% in each group.

## Flagged for human review

All of it is in `docs/anp-needs-author.md`:

- **Contested science:**
  - pending from Phase 0: hypoxic drive, Starling, coagulation model, precapillary sphincters, calcitonin, apocrine
  - new in Phase 1: osmosis mechanism, ATP yield, glia ratio, cholesterol source, adult neurogenesis, exercise acidosis and lactate, long-term blood pressure, internodal pathways, facial vein valves, oxytocin in labor
- **Judgment calls for the instructor review:** figures with wrong or misleading printed labels, labels covered by the ordering rule, map gaps, plain-word paraphrases, chosen normal values, simplifications, classification conventions and etymologies.

Two items worth your eye first:

1. **Chamber labels on the first heart lesson.** Heart position and coverings (topic 95) covers
   its figure's chamber and great-vessel labels, because the ordering rule says those names are
   taught in the next topic. You may prefer to move the chamber names one topic earlier or allow
   a preview box.
2. **Paraphrases in Foundations.** Early Foundations pages paraphrase around later words (ribs,
   cartilage, nerve, inflammation, and others) instead of using preview boxes (decision 38). You
   may want some of those to become previews.

## Spec decisions made during Phase 1

Decisions 25–50 in `docs/anp-spec.md` section 19. In short:

- **25–28 (architecture):** data-driven pages, shared site modules, masked OpenStax figures, parallel authors plus audit.
- **29:** no chapter page until a chapter has content.
- **30, 46, 48:** figure labels covered when they name a later concept, when the printed text uses a later term, or when the label is wrong.
- **31:** navigation and tags are exempt from the ordering check.
- **32, 50:** ordering check matching: plain letters, formulas, plurals.
- **33–36:** table wrappers, distinct titles, a figure credits page, the originality audit.
- **37:** tool validators in the content check.
- **38:** plain-word paraphrases in Foundations.
- **39:** flashcards don't change mastery.
- **40:** the "receptor" rule enforced by the content check.
- **41:** core concept introductions.
- **42–43:** exams record answers at the end, and TEAS scales to the built areas.
- **44:** our own SVG diagrams can be registered as figures.
- **45:** the exercise theme moves to short-term blood pressure control.
- **47:** pilot calculator scope.
- **49:** osmosis as bulk flow.

## What you need to do outside the repo

- Rerun `scripts/sql/schema.sql` in Supabase, so `report_question` accepts the course key `anp`.
- Redeploy the worker (`worker/`), which gained the `anp` tutor rules.

## Known limits of the pilot

- **TEAS mode:** only 2 of the 12 TEAS areas have content (general orientation and cardiovascular), so it serves 3 questions for now. It reaches 18 as the other systems are built.
- **Connective-tissue histology:** there is no lab station yet. Every OpenStax connective-tissue micrograph credits a third party, so none is cleared for commercial use.
- **Analytics:** the calculators and the word root builder fire no analytics event; the contract names none for them.
