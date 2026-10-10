# Calm tools: plan and status

Owner request (2026-10-10): tools feel like opening Adobe Premiere Pro: too much at once, a learning curve. There
should be no learning curve. Keep all the information, but make every tool calm, clean and obvious. Mockups the owner
approved ("do that for all"): the "Calmer tools redesign" canvas (reaction predictor, chi-square, titration).

## The layout every tool uses (Tool Studio)
1. One screen, one job: a full-width STAGE (the visual) plus one compact DOCK with 1 to 3 primary controls. The core
   loop fits one phone screen without scrolling.
2. Chrome diet on tool pages: one slim top bar (back, tool name, "?" and a "⋯" menu holding Copy link, About,
   Premium/Beta info, Report a problem, Ask the tutor). No breadcrumb, no hero card, no bottom tab bar, no floating
   buttons over the stage.
3. Three layers of information, nothing deleted: (1) visible: stage, primary controls, one live caption;
   (2) "Why?" opens a sheet (bottom sheet on phone, side drawer on desktop that pushes the dock aside, never covers
   it); (3) "Details" tab in the same sheet: numbers, equations, tables, references, extra settings.
4. Explore | Practice (or the tool's existing mode names) as one segmented control at the top of the dock. Practice
   shows one step at a time ("Step 2 of 5", one input or choice), never a wall of inputs.
5. Point, don't explain: a soft pulsing hint on the first thing to touch, shown until the first interaction (once
   per tool per device), respecting reduced motion.
6. Feedback lands on the stage: a result pill or highlight on the visual, not a text block below.
7. One calm visual system: about three text sizes, sentence case labels (no caps kickers), no cards inside cards,
   generous whitespace, the shared controls (segmented, chips, slider, stepper), course color as the only accent.
8. The same layout in every course.

## Shared layer
`assets/course/tool-studio.css` + `assets/course/tool-studio.js` (`window.LevlStudio`). API documented in the P0 row.

## Status
| Step | Scope | Status |
|---|---|---|
| P0 | Build Tool Studio shared layer + adopt it on the 3 mockup tools (ochem reaction predictor, bio chi-square, chem titration) as the reference | pending |
| P1 | Adopt on every other tool: NREMT, Ochem, A&P, AP Bio, AP Chem (parallel, one branch per course) | pending |
| P2 | Fresh 5-second test on every tool, fixes, full CI, PR, live | pending |
