# Consistency audit (2026-11-04)

Owner request (Olivier, 2026-11-04): "for lessons [the path] will bring you to the learn right but then if you switch
to like read and scroll down there isn't that same like mark this completed. Look for stuff like that across the
entire site." Then: "fix all and merge without my confirmation."

Five read-only passes in Chrome (desktop 1280 and phone 390, light and dark) on all 13 courses. Baseline that held:
no 404s, no sideways scroll except where listed, no real JS errors, same 10 tabs in the same order everywhere.
Owner rules that apply to every fix: keep every existing feature (no deleting functions), uncluttered, no repeated
info, every course the same while keeping its identity, free users never stranded, gentle Premium nudges.

Status per finding goes in the last column of each section once fixed (`fixed`, or `kept: <reason>`).

## A. Read (textbook) vs Interactive (lesson) and the path

A1. Textbook (`<course>/learn.html`, NREMT `nremt/study-notes.html`) has no "Mark done", no path end card, no path
    awareness. Causes: `mountPath()` in `assets/site-chrome.js` only loads path.js on path.html, the course home or
    `/(lessons|notes)/` URLs; `pageTopic()`/`renderEnd()` in `assets/course/path.js` assume one topic per page while the
    textbook is many `section.bk-sec[id]`. Fix: load path.js on the textbook and give each section its own end card
    (Mark done, Next topic), keyed by section id.
A2. Free users bounced into Premium locks: `read-toggle.js` saves "Interactive" on every lesson load, including locked
    ones, so `learn.html#<premium topic>` and plain `learn.html` redirect to a locked lesson (seen bio
    `enzyme-structure`). Fix: don't save the choice on a locked lesson; never auto-redirect to a
    `data-lesson-premium` lesson for a user without the pass.
A3. NREMT loop: a locked lesson's "Read it free in the textbook" goes to `study-notes.html`, which redirects back to
    the locked lesson. Fix with A2 and point the link at the notes chapter.
A4. Read switch from a lesson lands one topic off (chem, A&P, calc AB, calc BC, stats, env, psych, precalc, macro):
    the page scrolls right but the sticky switch's caption and Interactive link name the previous section; caption
    empty on phones. Cause: `pick()` measures from a height:0 sticky bar. Fix: paint the hash's section directly on
    load/hashchange and base the line on scroll-margin-top.
A5. Done in one view doesn't show in the other:
    - NREMT: `courseDone()` returns false, so a finished lesson (`nremt_lessons_v1`) never moves the path (contradicts
      docs/guided-path.md "Done means"). Fix: use `lessonDone(t)`.
    - AP and A&P: path "Mark this stop done" never ticks the textbook rail (`*-toc.js` only reads lesson completions).
    - Ochem: finishing the lesson leaves the textbook section at "Mark read".
A6. Path never sends a Read student to the textbook (`startUrl()` opens lesson or notes), and notes pages have no
    Read/Interactive switch (0 of N in 12 courses). Fix: when `levl_book_mode_<dir>` is `read`, route topic stops to
    `learn.html#id`; give notes pages the switch.
A7. Done/next wording differs: "Lesson complete.", "Mark this stop done", "Mark done", "Mark read"/"Read"; next nav
    "Next →", "Section N →", "Topic N →", "Chapter N →"; textbook only chapter-level; ochem lessons no next lesson,
    NREMT lessons Previous only. Fix: one shared label set; topic-level Previous/Next at the end of each textbook
    section; ochem and NREMT lessons get Next lesson.
A8. `psychology/learn.html` section `thinking`: one `math.psy-m` block overflows (1638px desktop, 1268px phone).
    Fix: overflow-x:auto on math blocks (sitewide) or rewrite the formula.

## B. Practice, Review, Exams, dashboards

B1. NREMT dashboard "Nothing here yet" until a session finishes (`nremt/assets/dash-nremt.js:84` isNew). Count
    mastery, missed list and today's count.
B2. Ochem dashboard (`ochem/assets/dash-ochem.js:24`) and ochem Review headline say nothing yet while listing a missed
    question. Count missed and flagged lists in both.
B3. Ochem end screen after ending early: "0 of 1 correct, across 0 concepts" then suggests the diagnostic just done.
B4. Path never moves after practice (by design: path tracks lessons). Say so on the Path page in one short line.
B5. NREMT Review at the free limit: "Review them" (flagged) does nothing visible, "Start review" disappears while it
    still says "15 due", practice end still offers "Review 15 due questions". Say plainly it resumes tomorrow (or let
    flagged review through), and drop dead buttons.
B6. Ochem: after a miss the only way on is "Try a similar one" (`ochem/assets/session-runner.js:687`). Make "Next
    question" the main button and the similar one optional.
B7. Three end-of-session layouts (NREMT, AP/A&P, ochem). Give every course the same end panel: score, what to study
    next, Retry misses, one next-step button (keep each course's extras like XP and domain list inside it).
B8. Keyboard help only on NREMT. One shared shortcut set and legend.
B9. Flag wording: "Flag for review"/"Flagged" (NREMT), "Flag"/"Flagged" (ochem), bio label stays "Flag" when pressed.
    Use Flag/Flagged everywhere. One exit button per session ("Save and exit" / "End session" shown twice).
B10. Wrong subject words: macro and psych result tables "By science practice"
    (`macroeconomics/assets/pages/practice.js:486`, `psychology/assets/pages/practice.js:486`), macro dashboard empty
    state "science practice", calc exams "The hybrid format" vs heading "the real format"
    (`calculus/assets/pages/exams.js:316`). Use the course's practiceWord.
B11. Free allowance line worded differently; one string, shown on Practice and Review.
B12. Review empty state lists Flashcards twice (ochem, A&P, NREMT).
B13. Two "Start practice" buttons on every practice page; two "Set up an exam" on ochem and A&P exams.
B14. `/<course>/unit-tests/` has no index page; add one or never link the folder.
B15. NREMT shows a full Premium card on the practice end screen and in Review; show it only at the limit, like AP.

## C. Tools

C1. A locked Premium tool renders as a full course page (~80 tools) instead of the tool screen with a lock card;
    price wording differs ("Unlock for $17.50" vs "See Premium, from $20.30"); A&P anatomy-3d has no back link; ochem
    tutor button floats over it. Model: NREMT `scenario-sim.html` (tool bar, then lock card).
C2. 97 of 128 tools have no Start over. Add "Start over" to the ⋯ menu of `assets/course/tool-studio.js` that every
    tool can wire up (default: reload the tool state).
C3. Overlapping or clipped labels: env energy-flow (90% on Grasshoppers; Caterpillars/Warblers), env earth-climate
    (windward/leeward; 0 and 90°S), psych development (Maya age 13 months on Relationships), psych memory-lab (x ticks
    on axis title), env soil-texture (readout pills on ticks, dot on Loam), ochem reagent-roadmap (step badge on 2°
    halide), ochem conformations (360° clipped), precalc unit-circle (point P labels), physics motion-graphs (Enlarge
    over t (s)).
C4. Picture text under 10px at 390px (rule: 12px, docs/tools-phone-pass.md): chem titration-curve-reader (35),
    ice-table-drills (24), buffer-drills (20), particle-diagrams (11), ochem resonance (8).
C5. Tools index pages grouped differently (AP by kind, ochem by access, A&P one group with progress, NREMT "8 TOOLS"
    vs "Seven tools", `scripts/build-r3-tools.mjs` ~87). One grouping, counts that match.
C6. NREMT Mnemonics is listed as a tool but doesn't use the tool screen.
C7. First-visit hint bubbles cover controls at 390px (titration-curve-reader Run, ice-table-drills, age-structure).

## D. Sitewide

D1. `/teach/` hero: feature cards overlap the Sign in / See a sample class buttons (`.tm-up{margin-top:-84px}` in
    `assets/class/teach.css`); on phones the demo button is hidden by r3.css `.hero-ctas .btn-ghost`.
    **Status:** fixed: hero band pads under the buttons (`teach.css`); the sample-class button shows on phones.
D2. Ten `*/teachers.html` pages never link `/teach/` or mention class codes; course footers lack Teachers.
    **Status:** fixed: every teachers page opens with "Make a free class" (to `/teach/`) and a class-code section (`apPageR3` in `scripts/lib/r3-tools.mjs`); Teachers is in every footer (D3).
D3. Footers differ on almost every page (join, teach, certificate, AP homes, ochem home, A&P). One link list.
    **Status:** fixed: one list in `scripts/lib/footer-links.mjs` used by every builder and hand page; site rule `footer-links` fails a row that differs. A&P figure credits moved to its accuracy line.
D4. `certificate.html` never got the redesign; `assets/milestones.js` COURSES only nremt, ochem, anp.
    **Status:** fixed: site-pages look (pill, two-tone headline, grid ground, site header); `milestones.js` covers all 13 courses (AP units from `assets/path/<key>.json`, lessons from `<key>_progress_v1`), AP lessons trigger `check()`, AP dashboards list milestones; test added.
D5. Root stubs (practice, dashboard, study-plan, tools, glossary, study-notes...) redirect to NREMT; offline page lists
    them under LevlPrep. Generic ones go to `/#subjects`; leave stubs out of the offline list.
    **Status:** fixed: practice, dashboard, study-plan, tools, glossary and study-notes stubs go to `/#subjects` (an old link with a query or hash still reaches NREMT); NREMT-only tool stubs unchanged; offline page skips stubs.
D6. Phone homepage: sticky "Choose your course" shows while the hero's identical button is visible, and covers the path
    card's handwritten line; path preview labels run together at 390px.
    **Status:** fixed: phone sticky bar shows only once the hero button has scrolled away and hides again over the course list; path preview labels smaller with room between them on phones.
D7. "Log in" (header) vs "Sign in" (dialog, Account, Teach). Use "Sign in". Account page: two buttons plus a card that
    repeats Premium copy; cut to one line.
    **Status:** fixed: "Sign in" in the header (`account.js`) and on Account; Account signed-out view is one box, one line, one button.
D8. Offline page: no Search/Sign in in header, doesn't load fonts.css.
    **Status:** fixed: offline page loads fonts.css and the site header (Search, Sign in, theme) from the precache.
D9. Repeated "notes free forever / no ads / one-time pass" on homepage (twice), Premium, About, Account; Privacy
    "short version" is an 8-line paragraph; changelog ~55,000px tall on phones (collapse older months).
    **Status:** fixed: homepage keeps one short Free and Premium line (plan cards and the two price FAQs removed; premium.html keeps the full story); About links to Premium instead of repeating it; Account repeat gone (D7); Privacy short version is 2 sentences; changelog folds every month but the newest (`site-toc.js`).
D10. Homepage title omits math/psych/macro; Search chip "Calculus" next to "Calculus BC" (rename "Calculus AB").
    **Status:** fixed: title "NREMT, Organic Chemistry, A&P & 10 AP® Courses | LevlPrep"; Calculus AB short name, search chip and rank label are "Calculus AB" (`assets/courses.js`).
D11. Env Sci home: "2026 exam" in the top line, "May 2027" in the intro. Check every AP course's exam year.
    **Status:** fixed: every AP home says "May 2027 exam" (checked against each spec and `assets/exam-date.js`: all ten exams are in May 2027); long course names wrap on phones (`mast-long` now checks both words).
D12. NREMT and ochem `path.html` breadcrumb ends "Review" (copied by `scripts/build-path-pages.mjs`).
    **Status:** fixed: `build-path-pages.mjs` names the last crumb "Your study path" (JSON-LD and visible trail).
D13. Page titles: ~50 sampled pages lack "| LevlPrep" (long titles drop the suffix). Shorten the topic part instead.
    **Status:** fixed: `courseTitle` always keeps "| LevlPrep" and shortens the topic (first and last words kept, no two pages the same); site rule title-pattern now requires the suffix everywhere; hand pages fixed.
D14. Names for the same thing: tools page titles ("Simulators and skills tools", "Trainers and drills", "Trainers",
    "Interactive Simulators", "EMT Study Tools"); Learn titles; NREMT "NREMT-EMT Prep" vs "NREMT-EMT"; "OChem
    Mechanism"; "A&P Core Concept". One pattern per page type, one name per course.
    **Status:** fixed: one title per page type (Practice questions, Spaced review, Exams, Tools, Textbook, Your dashboard, Glossary, Search the course) in every course; one name per course in titles and crumbs (NREMT-EMT, Organic Chemistry, Anatomy & Physiology).
D15. Header short names uneven; Calc AB and BC both "Calculus" (set BC "Calculus BC").
    **Status:** fixed: AB "Calculus AB", BC "Calculus BC" in the header, search and offline lists.
D16. Formula sheet, score calculator and justify pages reachable only from inside scripts; list them as cards on each AP
    course's Exams page where they exist.
D17. NREMT tools page "8 tools" vs "Seven tools" (same as C5).
