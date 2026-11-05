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
    Status: fixed. practice-engine.js `recordLive` records each checked answer (mastery, missed list, topic and domain accuracy, today's count) at once; `showResults` counts only the rest. The dashboard counts tracked and missed questions as a start.
B2. Ochem dashboard (`ochem/assets/dash-ochem.js:24`) and ochem Review headline say nothing yet while listing a missed
    question. Count missed and flagged lists in both.
    Status: fixed. A missed or flagged question counts as a start on the ochem dashboard (which now leads with redoing them) and on Review.
B3. Ochem end screen after ending early: "0 of 1 correct, across 0 concepts" then suggests the diagnostic just done.
    Status: fixed. The end panel no longer says "across 0 concepts", and an ended-early diagnostic says "Finish the diagnostic".
B4. Path never moves after practice (by design: path tracks lessons). Say so on the Path page in one short line.
B5. NREMT Review at the free limit: "Review them" (flagged) does nothing visible, "Start review" disappears while it
    still says "15 due", practice end still offers "Review 15 due questions". Say plainly it resumes tomorrow (or let
    flagged review through), and drop dead buttons.
    Status: fixed. At the limit Review says the queue is kept and starts again tomorrow; "Start review" and the flagged "Review them" are hidden, and the practice end no longer offers the due queue.
B6. Ochem: after a miss the only way on is "Try a similar one" (`ochem/assets/session-runner.js:687`). Make "Next
    question" the main button and the similar one optional.
    Status: fixed. `session-runner.js`: "Next question" is the main button after a miss; "Try a similar one" sits beside it as an outline button.
B7. Three end-of-session layouts (NREMT, AP/A&P, ochem). Give every course the same end panel: score, what to study
    next, Retry misses, one next-step button (keep each course's extras like XP and domain list inside it).
    Status: fixed. `LevlStudy.end` / `LevlStudy.wire` (assets/course/study.js, styles in study.css section 9): score, extras (ochem XP), what to study next, Retry misses, one next step, then tables. Used by every AP course and A&P (Practice and Review) and ochem (Practice and Review); NREMT's results keep their grid but follow the same order (XP, what to study next by domain, Retry the misses, next step).
B8. Keyboard help only on NREMT. One shared shortcut set and legend.
    Status: fixed. `LevlStudy.keys()`: one legend, folded under every session (NREMT's side card uses the same list plus its sort keys), and arrow, Home and End keys on every `.cx-opts` group.
B9. Flag wording: "Flag for review"/"Flagged" (NREMT), "Flag"/"Flagged" (ochem), bio label stays "Flag" when pressed.
    Use Flag/Flagged everywhere. One exit button per session ("Save and exit" / "End session" shown twice).
    Status: fixed. Flag/Flagged everywhere (flags.js writes the word, NREMT dropped "for review", aria-pressed on NREMT too). One exit: untimed NREMT practice shows only "End session" ("Save and exit" is gone; the attempt still autosaves), and the study band no longer copies the exit.
B10. Wrong subject words: macro and psych result tables "By science practice"
    (`macroeconomics/assets/pages/practice.js:486`, `psychology/assets/pages/practice.js:486`), macro dashboard empty
    state "science practice", calc exams "The hybrid format" vs heading "the real format"
    (`calculus/assets/pages/exams.js:316`). Use the course's practiceWord.
    Status: fixed. Macroeconomics says "skill category" (its CED's term) in practice, results, search and the dashboard; psychology keeps "science practice" (its CED's term, per docs/appsych-spec.md) with a skill hint that fits it; calculus exams say "the real format".
B11. Free allowance line worded differently; one string, shown on Practice and Review.
    Status: fixed. `LevlPremium.allowanceLine(course, note)` is the one string ("Free: N of 15 questions left today, shared by Practice and Review." plus the course's free part, or at zero "They come back at midnight."), shown on Practice and on Review in every state, in every course.
B12. Review empty state lists Flashcards twice (ochem, A&P, NREMT).
    Status: fixed. Flashcards is in the rail only, not repeated in the empty-state actions (NREMT, ochem, A&P).
B13. Two "Start practice" buttons on every practice page; two "Set up an exam" on ochem and A&P exams.
    Status: fixed. The study band no longer copies the page's Start, exit or results buttons, the exams band lost its Start/"Set up an exam" button (r3-inner.mjs and the hand-written exams pages), NREMT results keep one "Back to Start" and one Retry.
B14. `/<course>/unit-tests/` has no index page; add one or never link the folder.
    Status: fixed (never linked). No page links a bare `unit-tests/` folder; `scripts/site-rules/unit-tests-folder.mjs` fails the check if one ever does without an index page.
B15. NREMT shows a full Premium card on the practice end screen and in Review; show it only at the limit, like AP.
    Status: fixed. NREMT's Premium card shows on the results only once today's free questions are used (`LevlStudy.premiumAtLimit`), and Practice no longer shows the readiness gate (Exams and the dashboard keep it). The AP and A&P end panels follow the same rule.

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
D2. Ten `*/teachers.html` pages never link `/teach/` or mention class codes; course footers lack Teachers.
D3. Footers differ on almost every page (join, teach, certificate, AP homes, ochem home, A&P). One link list.
D4. `certificate.html` never got the redesign; `assets/milestones.js` COURSES only nremt, ochem, anp.
D5. Root stubs (practice, dashboard, study-plan, tools, glossary, study-notes...) redirect to NREMT; offline page lists
    them under LevlPrep. Generic ones go to `/#subjects`; leave stubs out of the offline list.
D6. Phone homepage: sticky "Choose your course" shows while the hero's identical button is visible, and covers the path
    card's handwritten line; path preview labels run together at 390px.
D7. "Log in" (header) vs "Sign in" (dialog, Account, Teach). Use "Sign in". Account page: two buttons plus a card that
    repeats Premium copy; cut to one line.
D8. Offline page: no Search/Sign in in header, doesn't load fonts.css.
D9. Repeated "notes free forever / no ads / one-time pass" on homepage (twice), Premium, About, Account; Privacy
    "short version" is an 8-line paragraph; changelog ~55,000px tall on phones (collapse older months).
D10. Homepage title omits math/psych/macro; Search chip "Calculus" next to "Calculus BC" (rename "Calculus AB").
D11. Env Sci home: "2026 exam" in the top line, "May 2027" in the intro. Check every AP course's exam year.
D12. NREMT and ochem `path.html` breadcrumb ends "Review" (copied by `scripts/build-path-pages.mjs`).
D13. Page titles: ~50 sampled pages lack "| LevlPrep" (long titles drop the suffix). Shorten the topic part instead.
D14. Names for the same thing: tools page titles ("Simulators and skills tools", "Trainers and drills", "Trainers",
    "Interactive Simulators", "EMT Study Tools"); Learn titles; NREMT "NREMT-EMT Prep" vs "NREMT-EMT"; "OChem
    Mechanism"; "A&P Core Concept". One pattern per page type, one name per course.
D15. Header short names uneven; Calc AB and BC both "Calculus" (set BC "Calculus BC").
D16. Formula sheet, score calculator and justify pages reachable only from inside scripts; list them as cards on each AP
    course's Exams page where they exist.
    Status: fixed. Each AP Exams page's rail lists its formula or equations sheet, score calculator (chem, physics, calc AB) and justify trainer as cards.
D17. NREMT tools page "8 tools" vs "Seven tools" (same as C5).
