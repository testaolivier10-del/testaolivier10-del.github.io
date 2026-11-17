# Tools v2: the standard for every tool

Owner approved on 2026-11-17 on the flagship, AP® Environmental Science Water pollution ("it's the standard").
This supersedes the frame only standard in `docs/tools-frame-2026-11.md`: the frame (top bar, modes, "?", "…")
stays, and these rules decide what goes inside it. The flagship's brief, with every owner round and the research
behind each rule, is `docs/tools-v2-water-pollution-brief.md`. The shared kit is `assets/course/tool-kit2.js` and
`.css` (opt in per page; its header is the API reference).

## The rules

1. Start from what the student should learn. One main idea per tool; the kind of interaction (drag, draw, build, sort, listen, tap, step through) is chosen to fit that idea.
2. The student does the thing, not watches it. Animation supports, never replaces.
3. Obvious what to do in 5 seconds: the thing acted on is the biggest thing on screen, looks actionable, and one small cue points at the first move and disappears once made.
4. Every action gets an immediate, visible result, and it is clear why.
5. Clear what you are looking at and what you learned: one short purpose line; labels of 1 to 3 words attached to what they name; one color per idea everywhere; a plain takeaway sentence when there is one.
6. Nothing extra on screen: no walls of text, no information side panels, no decoration that could be misread; depth and reference behind "?".
7. Two modes, each with one job: Explore is free play (nothing locked, graded or quizzed); Test yourself holds questions, hints and feedback.
8. Controls behave predictably: one control never moves another; extremes do something real; undo or reset always there.
9. The same frame everywhere: the interaction changes per tool, the layout, modes, "?", labels and cues do not.
10. Research the best existing version first: before rebuilding a tool, look at how the best tools anywhere handle that exact job, take what works and improve on it. Forgiving input always: never make the student enter something in a super specific way.
11. Balance: one main idea per screen with one main control. Controls connected to the same idea stay together (a secondary one stays visually quiet; never hide a connected control behind a step). A control gets its own tab or step only when it teaches a different idea. Fix or move anything that does not drive the screen's idea; preset cases that each show something; capped ranges; extras start hidden.

The test: a student who reads almost nothing knows what to do within 5 seconds, and doing it shows them the idea.

## Process per tool

Design brief with research on the best existing versions; build; look at it on desktop and phone; independent
fresh-eyes review that may remove as well as add; count what is on screen; owner look early on; real students when
possible.

## Where things are

- Flagship (the worked example): `environmental-science/tools/water-pollution.html`,
  `environmental-science/assets/tools/water-pollution.js` and `.css`.
- Kit: `assets/course/tool-kit2.js`, `assets/course/tool-kit2.css`. A page opts in (for AP® Environmental Science,
  `"kit2": true` in `environmental-science/data/pages.json`); no other tool loads it until it is rebuilt.
- One file preview of a tool page to open from disk: `node scripts/tool-preview.mjs <page.html> <out.html>`.
- Write one brief per rebuilt tool under `docs/` (name it `tools-v2-<tool>-brief.md`) and list it here.

## Status

| Tool | State | Brief |
| --- | --- | --- |
| AP® Environmental Science, Water pollution | Shipped 2026-11-17 | `docs/tools-v2-water-pollution-brief.md` |
