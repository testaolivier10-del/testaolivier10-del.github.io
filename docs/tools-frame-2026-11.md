# Tool frame, third round (2026-11-15): status file

## Owner request and decisions (2026-11-15)
- Tools are "way too much going on" (screenshot: ochem arrow pusher with the stage, a dock of 3 modes + 8 challenge
  chips + Explanation + Check + Show one arrow + Bookkeeping & keys, and the Why/Details drawer open holding the
  formal charge table, keyboard help, the Check yourself quiz and Keep going links).
- Owner principle: clean on the surface, full depth underneath. Cut only what adds nothing. Never box a tool in or
  make it plain and one dimensional. Every cut, restriction or move needs a reason: research or an owner decision.
- Approved mockup (direction, "I like that", then "go ahead" with the fixes): design canvas "LevlPrep shared tool
  format", https://claude.ai/artifact/Naz5YV2CuGMCRGnsyfHgU8 (8 artboards: arrow pusher first open, wrong arrow
  feedback, solved, Explore with live product, Build your own, two step challenge, a titration explore tool, phone).
- Owner does NOT want to review: Claude checks every tool itself (works, nothing missing, the way it works makes
  sense for what it teaches) and merges when its checks and CI pass. Ask the owner only for a real decision, such as
  removing something a tool does today. Helpers allowed.

## The standard (every tool)
1. Top bar: name, one line on what the tool is for, the mode switch (only the modes the tool has, at most three:
   Explore / Build / Challenge or the tool's own names), Ask the tutor, Share (copy link), "?" (reference) and "…"
   (settings, Open in another tool, Start over, Report, About).
2. Stage (left, biggest): the tool itself. Scenario picker top left of the stage as ONE dropdown that keeps the
   groups (replaces rows of chips; a tool with 2 to 4 choices may keep a segmented control). Target, live result or
   readout on the stage. Undo / Reset bottom left, Enlarge bottom right. Feedback lands ON the object (a red arrow
   and a short note beside it), never in a separate box.
3. Side panel (the dock): the task (or "What happened" in Explore), one line on what to do first, then the actions
   (Check primary, Hint secondary). About 5 controls and about 25 words visible on landing.
4. The tool's own cues show the first move (highlight what can be touched: PhET implicit scaffolding). The one line
   of instruction is a backup.
5. Hint ladder (shared): first hint instant; further hints on request; the full answer ("Show one arrow", "Show
   solution") opens after one real attempt (tutoring research on clicking through hints). Never lock anything else.
6. Behind "?": reference tables, keyboard keys, how it works, definitions. Behind "…": settings like bookkeeping.
7. After finishing a challenge or problem: a short takeaway, Next, Full explanation, Check yourself quiz, lesson
   links (Keep going). Not on the landing screen.
8. Never on the landing screen: reference tables, quizzes, link lists, long paragraphs, the same control twice,
   controls that do not apply right now.
9. Phone: same order stacked; stage first, task and actions at the bottom within thumb reach.

Research behind it: PhET implicit scaffolding (Podolefsky, Moore, Perkins 2013); cognitive load split attention and
redundancy effects (Kalyuga, Chandler, Sweller 1999; Ginns 2006); help abuse / bottom-out hints (LearnLab, Baker et
al.); OrgChem101 Mastering the Arrows (Carle, Visser, Flynn 2020) and the Mechanisms App (instant feedback, touch).

## Rule for moving any tool
Before changing a tool, read its code and list EVERYTHING it can do (modes, scenarios, readouts, notes, settings,
send-to, quiz, links, keyboard). Nothing it can do is removed; each item gets a place in the frame. Write the list
and its mapping in docs/tools-frame-notes/<course>.md. Then check it in a browser at 390 and 1440 (light and dark):
first load, mid use, wrong answer, solved, every mode; no console errors; scripts/ci-local.sh with BROWSER=1.
Judge it as a student: is it obvious what to do, does the picture show the concept, does each control earn its place.

## Shared layer (assets/course/tool-studio.js and .css, docs/tools-calm.md has the API)
To add: `s.picker` (grouped dropdown for scenarios), `s.hints` (the ladder with attempt gate), `s.done` (finished
card), a Share button in the bar on desktop, the "what to do" line under the task. Existing pieces already match
(two columns with the drawer closed by default, pills on the stage, first-run hint ring, Enlarge, phone layout).

## Status
| Step | Scope | Status |
|---|---|---|
| F1 | Shared layer additions + ochem (9 tools, arrow pusher is the template) | done 2026-11-15: `std` frame in tool-studio.js/.css (task, picker, hints, done, foot, Share, "?" = reference); all 9 ochem tools on it; notes and open questions in `docs/tools-frame-notes/ochem.md` |
| F2 | NREMT, A&P | done 2026-11-16: all 8 NREMT tools (`nremt-studio.js` mounts std) and all 8 A&P tools (`AnpToolKit.studio` std, the item chooser as one stage dropdown); body map framed only; notes and questions in `docs/tools-frame-notes/nremt.md` and `anp.md` |
| F3 | AP Bio, AP Chem, AP Physics 1 | done 2026-11-16: all 38 tools on the `std` frame from the course layers (`bio-tools.js`, `chem-tools.js`, `phys-tools.js`): explore question and line, stage dropdowns, step and part hint ladders, finished cards, std lock screens; notes in `docs/tools-frame-notes/apbio.md`, `apchem.md`, `apphys.md` |
| F4 | AP Calc AB, AP Calc BC, AP Precalc, AP Stats | done 2026-11-16: all 36 tools on `std` through the three course kits (stage dropdowns, hint ladder, finished card); notes in `docs/tools-frame-notes/calculus.md`, `precalculus.md`, `statistics.md` |
| F5 | APES, AP Psych, AP Macro, AP Micro, AP Human Geography | F5a done 2026-11-16: APES (12) and AP Psych (10) on the std frame through `env-tools.js` / `psy-tools.js` (task, kinds dropdown, hint ladder per step, finished card, `stagePick` for scenario selects and chips); notes in `docs/tools-frame-notes/apes.md` and `psychology.md`. F5b done 2026-11-16: AP Macro, AP Micro, AP Human Geography (24 tools) through `mac-tools.js` / `mic-tools.js` / `hug-tools.js`; notes in `docs/tools-frame-notes/apmacro.md`, `apmicro.md`, `aphug.md` |
| F6 | Fresh-eyes pass on every tool, fixes, done | F6a done 2026-11-16: every item of the F6 decisions below except the accuracy check (F6b, in parallel): shared picker search, empty caption row, phone quiz figure size, Reset to the stage foot in Bio / Chem / Physics, calc parametric axes and rule drill window, HuG FRQ sample gate and Map pill, takeaways per problem type (Macro, Micro, HuG), policy chain row. Checked in every course at 390 and 1440, light and dark; AB and Macro builds byte-identical |
| F7 | Follow-ups after F6a (five small items) | done 2026-11-16: see "F7 follow-ups" below |
| F8 | Final wrap up | done 2026-11-16: FRQ coach step 3 waits for a try; tree reading's duplicate caption dropped; the flaky "every page loads" CI step fixed; accuracy check of the F6a and F7 copy (verdicts in the course notes); see "F8 wrap up" below |

**Project status: done (2026-11-16).** Every tool in every course is on the standard frame. Left for later: the hidden
original scenario controls (ochem, APES, Psych and others, kept in the page out of sight behind the pickers) could be
removed in a cleanup pass.

## F6 decisions (owner, 2026-11-16) and what F6a did
- HuG FRQ coach: the rubric line opens any time (before writing too); the full-credit sample opens only after a real
  try (four letters written in step 1). Done (`frq-coach.js`: "Show the rubric line", then the sample in place).
- HuG Map reader: no "Map" pill in the std frame (the picker names the map). Done.
- Macro / Micro / HuG finished cards: a short takeaway per problem type where the last solution line reads oddly out
  of context. F6b built the `TAKE` maps (`TAKE[slug][type]`, in `mac-tools.js`, `mic-tools.js`, `hug-tools.js`) and
  wrote most of them; F6a added the types whose last line still read oddly: adas-lab phillips, indicators-lab
  gdp-calc, multiplier-lab gap, policy-chain open; cost-lab shutdown, externality-lab public, factor-lab hire,
  surplus-lab control, trade, tariff; population-lab cohort. Every other type keeps its last line.
- Micro Firm and market shock select: left as is.
- Macro Policy chain "Write it out" row: value now "a sentence, then your words" (fits 390 px).
- APES / Psych: views stay a button row in the side panel; Psych formulas stay the first hint (no change needed).
- Hidden original scenario controls (ochem, APES, Psych, others): left in place.
- Accuracy check of all F1 to F5 copy: F6b (separate pass), not this one.
- Bio / Chem / Physics: Reset and Start over to the stage foot (`s.toFoot`) in chi-square, descriptive stats, rates
  (Clear the triangles), Simpson, tree reading (Clear the selection, Start over), buffer drills, titration, collision,
  energy bar charts, motion graphs, rotation lab (both), torque balance. Left beside its part: scaling drills "Reset
  to × 1" (it resets the panel's sliders only); "Clear runs", "Clear data" and "Start over at equilibrium" (in the
  reference sheet, they clear a log or a setting there).
- NREMT station run and scenarios keep card lists; lab practical and 3D anatomy keep four modes: no change.
- Long pickers: shared search panel for any picker list over 30 (A&P pathways 208, predict 379, calculators 90, lab
  practical 85, graphs 78, feedback loops 51; NREMT body map 71; ochem synthesis 36; physics scaling drills 31) and
  ochem acid-base's two acid lists (39 each, `LevlStudio.searchSelect`). Groups kept; the select stays.
- Std frame: an empty caption row is not drawn; Explanation moves to the end of the task's what to do line.
- No punctuation pass over course content.
- Calc parametric motion quiz: a path far taller than wide (or wider) gets each axis fitted on its own; near the
  frame's shape equal axes stay (`figSpec`).
- Calc rule drills: the yours vs right graph (piece steps and f' under the tree) uses `bothWindow` (each curve's own
  range; on very different scales the right curve's window widened until yours shows); curve marks are clipped to
  the plot; the f' plot under the tree is no longer held to 320 px wide.
- Phone quiz figure: a quiz stage with a figure keeps at least about 40% of the screen height (was 30%).

New copy for the accuracy check (F6a): the eleven F6a takeaways listed above (after F6b's pass); the FRQ coach lines "Show the rubric
line" and "A full-credit answer opens once you write yours in step 1."; the search panel's "Type to search" and
"Nothing matches. Try fewer letters."

Questions for the owner (F6a): (1) FRQ coach step 3 ("Which answer earns the point?") lists the sample as one of its
two options before any writing, so the sample can still be read early; gate step 3 behind a try too? (2) Tree reading
shows the same line as its task's what to do and as its caption ("Tap two or more names on the tree..."); drop one?

## F7 follow-ups (2026-11-16)
- AP Psych stats lab: every stated percentile uses the normal table, not the 68-95-99.7 rule (z = −2: about 2.3%,
  the 2nd percentile). The rule drill keeps its rule step; its last line gives the z table value and calls the
  rule's value a close estimate. Explore caption and the Percentile pill use the curve value too.
- AP Psych brain map: possessive names take no article ("Broca’s area", not "The Broca’s area"), in the model
  (`the(k)`) and the page (`theN(k)`); the page no longer lowercases them either.
- AP Physics 1: `ApPhysTools.sceneAsk(s, ask, todo)` lets a scene set its own Explore question; rotation lab (stool,
  orbit) and torque balance (inertia race) use it; the first scene keeps the tool's question.
- AP Micro game lab: the strategy "Do not" is "Don't advertise" (data, model, built tool data).
- AP Bio operons: first-run hint "Tap a sugar (or tryptophan) to change the medium".
New copy for an accuracy check: the stats lab line ("From a z table, about 2.3% of scores are lower, so ... is at
about the 2nd percentile (the rule's 2.5% is a close estimate).") and caption; the three scene questions and their
lines (stool: "Why does pulling the weights in make the stool spin faster?"; orbit: "Why does a planet move fastest
when it is closest to the star?"; race: "Two wheels, same mass: which one speeds up faster, and why?").

## F8 wrap up (2026-11-16)
- HuG FRQ coach: step 3 ("Which answer earns the point?") offers the sample as one of its two answers, so it now waits
  for the same try as the sample (four letters in step 1), as the standard asks (full answer after one real attempt).
  Answers the F6a question (1).
- Bio tree reading: the caption's default line repeated the task's what to do line (Read and Build); both defaults are
  dropped, so the empty caption row is not drawn. Results still show in the caption. Answers the F6a question (2).
- CI, "every page loads without a runtime error" (`scripts/check-console.mjs`, in the accessibility job): one notes or
  lesson page in about 3,400 now and then missed 'load' on both tries (30 s, then 60 s), a different page each run.
  Cause: third parties were blocked with a function `page.route`, which makes Playwright intercept every request,
  same-origin ones too, and hold each until the Node process (also the file server and the event handler for 8
  pages at once) answers. Now outside hosts fail in Chromium's resolver (`--host-resolver-rules`, `--no-proxy-server`)
  with no interception; a timed out page is retried once in a fresh context; a page that misses twice fails and
  names the same-origin requests still open. Same-origin requests, errors and ids are judged as before.
  `check-a11y.mjs` gets the same launch rule so axe never waits on an outside host.
- Accuracy check of the F6a and F7 copy: verdicts in `docs/tools-frame-notes/apmacro.md`, `apmicro.md`, `aphug.md`,
  `psychology.md`, `apphys.md`. Fixed: GDP takeaway (adds intermediate goods; "stock or bond purchases" for
  "financial trades"), shutdown takeaway ("minimum AVC and minimum ATC"), cohort takeaway ("usually", "a war"),
  rotation lab Orbit question (the scene is a satellite around Earth, not a planet and a star). Everything else correct.

## Tools v2 (2026-11-17): the standard after this one
The owner approved the rebuilt AP® Environmental Science Water pollution tool as the standard for every tool. The
v2 standard (`docs/tools-v2-standard.md`, 11 rules and the process) supersedes the frame only standard above: the
frame in this file stays (top bar, modes, "?", "…"), and v2 decides what goes inside it (one idea, the student acts,
instant response, two modes with one job each, controls that never move each other, nothing extra on screen). The
flagship's brief with every owner round is `docs/tools-v2-water-pollution-brief.md`. Rebuild the other tools to v2
one at a time, each with its own brief.
