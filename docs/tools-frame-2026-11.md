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
| F2 | NREMT, A&P | not started |
| F3 | AP Bio, AP Chem, AP Physics 1 | not started |
| F4 | AP Calc AB, AP Calc BC, AP Precalc, AP Stats | not started |
| F5 | APES, AP Psych, AP Macro, AP Micro, AP Human Geography | not started |
| F6 | Fresh-eyes pass on every tool, fixes, done | not started |
