# Tool purpose review: brief for reviewers (2026-11-10)

Read `docs/tool-visuals-2026-11.md` first (the owner's words, the test, and the Human Geography review, which is
the model for yours). This is a REVIEW. Change no site file, run no git command that changes anything. Write only
your own review files in `docs/tool-review/` and screenshots under `/home/claude/shots/review/<course>/`.

## The owner's question, for every tool
"Think about what a tool is meant to do and is it portraying it in the best way, or is it confusing, or not doing
its job entirely, or not showing what it should be." Tools should visualize difficult concepts. A plain graph is
fine where the graph IS the concept (graphs "don't need anything crazy"); pictures that are blocks, numbered
boxes, dots in a box or bare arrows standing in for a real thing fail. Not everything needs changing: say "leave"
when a tool does its job, and expect most to.

## What to do for each tool in your courses
1. Find what it is for: the header comment of `<course>/assets/tools/<tool>.js` (or the tool's own script), its
   page, its data file. One sentence: the idea a student should leave with.
2. Open it in a real browser and go through EVERY scene, tab, mode, chip and select option in Explore, and at
   least two Test yourself items. Use it: drag, press Play, change sliders. Look at what the picture does.
   Desktop 1280x800 and phone 390x844.
3. Judge: at the moment it opens, can a student tell what they are looking at and what to do first? Is the
   picture the idea itself, or shapes beside a caption that states it? Does the picture react to the controls in a
   way that teaches? Anything confusing, misleading, wrong, empty, tiny, clipped or dead?
4. Verdict: LEAVE, FIX (same design, specific repairs) or REDESIGN (the picture must become something else).
   For FIX and REDESIGN say concretely what the picture should show and what the student does with it. Be honest
   and specific; do not pad. Flag anything that looks scientifically or factually wrong separately.

## How to open the tools
Static server at the repo root on port 8765 (start `python3 -m http.server 8765` there if it is down).
Playwright from the repo's node_modules, Chromium at `/opt/pw-browsers/chromium-1243/chrome-linux64/chrome`.
Create the context with `serviceWorkers: 'block'`; abort requests to other hosts; serve `assets/premium.js` with
`function has(course) {` replaced by `function has(course) { return true;` so Premium tools open. Example scripts:
`/home/claude/shots/scenes.mjs` and `/home/claude/shots/one.mjs`. Look at your screenshots (Read tool); tile
several into one image to save context, but large enough to read.

## What to write
`docs/tool-review/<course>.md`, one per course:

    # <Course>: tool purpose review (2026-11-10)
    | Tool | The idea | Verdict | What is wrong and what it should show |
    (one row per tool; LEAVE rows can be one short line)
    ## Notes
    (per FIX/REDESIGN tool: which scenes fail, the concrete picture, phone issues, any accuracy flags)

Plain words, no em dashes. Your final reply to the lead: under 12 lines: counts of LEAVE/FIX/REDESIGN per course,
the three worst tools, and anything you could not open.
