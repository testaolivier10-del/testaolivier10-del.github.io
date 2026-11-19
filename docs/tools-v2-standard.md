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
12. Visual standard: every tool's picture is a drawn scene at the level of the flagship. Material and depth; the real thing drawn as the real thing (a cell looks like a cell, water like water); the full width of the stage with no empty bands; no flat blocks and no bare dot diagrams. Put your shots side by side with the flagship's before calling it done.
13. Every change of state is animated, so the student sees it happen (grow, shrink, burst, flow, break, form). Nothing important just swaps, on a plain drag as well as in a replay. Motion only while something is really happening. Reduced motion gets a calm equivalent (a short cross fade and a still mark), never nothing.
14. The picture, the labels and the cause line never disagree, at any moment, including in the middle of a change.
15. Labels name exactly what is drawn (a tab that shows a red blood cell says "Red blood cell").

The test: a student who reads almost nothing knows what to do within 5 seconds, and doing it shows them the idea.

## Process per tool

Design brief with research on the best existing versions; build; look at it on desktop and phone; count what is on
screen; real students when possible.

**The owner does not review each tool** (owner, 2026-11-17: "i shouldnt have to ask for these things. this should
just be the standard for everything", "it will take way too long to critique every tool individually so just do all
of them"). In place of his look, each tool ships only after two checks:
1. The builder's own check against every rule above, with shots at 390, 768 and 1440, light and dark, compared with
   the flagship's.
2. An independent fresh eyes review against the full standard (the visual level and the animation included), by
   someone who did not build it. The reviewer may remove as well as add, and can block the tool.

Nothing a tool could do is silently dropped. It moves to Test yourself, to "?", or to a later separate tool, and it
is logged twice: in the tool's brief, and as one line in `docs/tools-v2-owner-log.md`, the running list of every
decision made on the owner's behalf, so he can skim it later and reverse any of them.

## Where things are

- Flagship (the worked example): `environmental-science/tools/water-pollution.html`,
  `environmental-science/assets/tools/water-pollution.js` and `.css`.
- Kit: `assets/course/tool-kit2.js`, `assets/course/tool-kit2.css`. A page opts in (for AP® Environmental Science,
  `"kit2": true` in `environmental-science/data/pages.json`); no other tool loads it until it is rebuilt.
  AP® Biology opts in the same way (`"kit2": true` in `bio/data/pages.json`); its adapter is `ApBioTools.studioKit2`
  in `bio/assets/tools/bio-tools.js` (a tool hands over its stage, its "?" reference and its Test yourself parts).
  The purpose line and the cause line are in the kit (`K.head`, `K.cause`).
- Organic Chemistry opts in with `kit2: true` on the tool in `ochem/assets/tools-registry.js` (the page builder
  then writes the kit's two files and `ochem/assets/tools/<slug>.css` into the page); its adapter is
  `OchemStudioKit.kit2` in `ochem/assets/tool-shell.js` (stage, "?" reference, Test yourself parts; the page's
  Check yourself quiz becomes the last part). First sweep test: `scripts/tools-v2/conformations-sweep.mjs`.
- One file preview of a tool page to open from disk: `node scripts/tool-preview.mjs <page.html> <out.html>`.
- `docs/tools-v2-owner-log.md`: decisions made on the owner's behalf, one line each.
- Write one brief per rebuilt tool under `docs/` (name it `tools-v2-<tool>-brief.md`) and list it here.

## Status

| Tool | State | Brief |
| --- | --- | --- |
| AP® Environmental Science, Water pollution | Shipped 2026-11-17 | `docs/tools-v2-water-pollution-brief.md` |
| AP® Biology, Osmosis | Built 2026-11-17, waiting for the independent review (not merged) | `docs/tools-v2-osmosis-brief.md` |
| AP® Biology, Simpson's diversity index | Built 2026-11-18. Review PASS 2026-11-18; shipped to the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-simpson-diversity-brief.md` |
| AP® Biology, Water potential | Built 2026-11-18. Review PASS 2026-11-18; shipped to the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-water-potential-brief.md` |
| Organic Chemistry, Conformation Lab | Built 2026-11-17. Review PASS 2026-11-18; shipped to the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-conformations-brief.md` |
| AP® Biology, Energy flow | Built 2026-11-18. Review PASS 2026-11-18; shipped to the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-bio-energy-flow-brief.md` |
| AP® Biology, Hardy-Weinberg | Built 2026-11-18. Review PASS 2026-11-18 (recheck 2); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-hardy-weinberg-brief.md` |
| AP® Environmental Science, Energy flow | Built 2026-11-18. Review BLOCK, then recheck 1 PASS 2026-11-18 (and a polish round); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-apenv-energy-flow-brief.md` |
| AP® Biology, Enzyme activity | Built 2026-11-18. Review PASS 2026-11-18 (recheck 2); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-enzyme-activity-brief.md` |
| A&P, Graphs | Built 2026-11-18. Review PASS 2026-11-18 (recheck 1); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-anp-graphs-brief.md` |
| A&P, Lab practical | Built 2026-11-18; review round 1 and recheck 1 blocked, each fixed the same day. Review PASS 2026-11-18 (recheck 2); integrated on the collecting branch `claude/tools-v2-all` (not on main); first explorer (`K.spots`) | `docs/tools-v2-anp-lab-practical-brief.md` |
| AP® Chemistry, Units and significant figures | Built 2026-11-18; review round 1 blocked, fixed 2026-11-18. Review PASS 2026-11-18 (recheck 1, then polish); integrated on the collecting branch `claude/tools-v2-all` (not on main); the chemistry adapter `ApChemTools.studioKit2` | `docs/tools-v2-units-sig-figs-brief.md` |
| AP® Calculus AB, Tangent tracer | Built 2026-11-18; review round 1 blocked, fixed the same day, Review PASS 2026-11-18 (recheck 2); integrated on the collecting branch `claude/tools-v2-all` (not on main); first graph explorer (`K.handle`) and the calculus adapter | `docs/tools-v2-tangent-tracer-brief.md` |
| NREMT, Mnemonics | Built 2026-11-18; review round 1 blocked, fixed the same day. Review PASS 2026-11-18 (recheck 2, its should fix done); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-nremt-mnemonics-brief.md` |
| NREMT, Sound trainer | Built 2026-11-18; review round 1 blocked, fixed the same day. Review PASS 2026-11-19 (recheck 1, its should fix items done); integrated on the collecting branch `claude/tools-v2-all` (not on main); first sound tool (group S) | `docs/tools-v2-nremt-sound-trainer-brief.md` |
| Organic Chemistry, Resonance | Built 2026-11-18; review round 1 and recheck 1 blocked, both fixed the same day. Review PASS 2026-11-18 (recheck 2, its nit done); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-resonance-brief.md` |
| AP® Biology, Design drills | Built 2026-11-18; review round 1 and rechecks 1 and 2 blocked, each fixed the same day. Review PASS 2026-11-18 (recheck 3; the text collisions it found fixed); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-design-drills-brief.md` |
| A&P, Pathway tracer | Built 2026-11-18; review round 1 and rechecks 1 and 2 blocked, each fixed the same day. Review PASS 2026-11-18 (recheck 3); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-anp-pathways-brief.md` |
| NREMT, Body map | Built 2026-11-18 (the owner's favourite: the 3D body, Burns and all content kept; the frame, card on the picture and Burns' teaching rebuilt); waiting for the independent review (not merged) | `docs/tools-v2-nremt-body-map-brief.md` |
| Organic Chemistry, Arrow Pusher | Built 2026-11-18; review round 1 blocked, fixed the same day. Review PASS 2026-11-18 (recheck 1, its badge note done); integrated on the collecting branch `claude/tools-v2-all` (not on main); shares the electron pushing board with Resonance (`ochem/assets/push-board.js`) | `docs/tools-v2-arrow-pusher-brief.md` |
| A&P, Feedback loops | Built 2026-11-18; review round 1 and recheck 1 blocked, each fixed the same day. Review PASS 2026-11-19 (recheck 2; the before tick removed); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-anp-feedback-loops-brief.md` |
| A&P, Predict the change | Built 2026-11-19; review round 1 and recheck 1 blocked, each fixed the same day. Review PASS 2026-11-19 (recheck 2); integrated on the collecting branch `claude/tools-v2-all` (not on main) | `docs/tools-v2-anp-predict-brief.md` |
