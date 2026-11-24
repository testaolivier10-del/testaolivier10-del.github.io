# Tools v2: AP® Human Geography FRQ coach (brief and build notes)

Status file for the v2 rebuild of `human-geography/tools/frq-coach.html` (Premium, rollout row 139, group R, wave 9).
Standard: `docs/tools-v2-standard.md`; builder brief: `docs/tools-v2-builder-brief.md`; plan:
`docs/tools-v2-plans/aphug-frq-coach.md`. Branch `claude/tools-v2-hug-frq-coach`, cut from `claude/tools-v2-all`.
NOT merged: the independent review comes first.

Owner rule for group R (rollout question 4, answered for Design drills on 2026-11-18): practice tools stay tools, and
Explore must be real free play that shows the idea; writing and grading stay in Test yourself.

## The one main idea
**The task verb says how much to write: each verb asks for its own piece of the answer.** Identify asks for a name;
describe adds the features; explain adds how or why, with the because; compare needs both sides (not the because);
explain the degree states the degree first, then explains. Source: the CED's task verbs and the Chief Reader
reports (`docs/aphug-research/framework.md` sections 4 and 7), `VERBS` in `scripts/lib/aphug-exams.mjs`.

One screen, one main control (the verb ladder), no tabs.

## Research (rule 10): what exists and what we took
- **2025 Chief Reader report, set 2** (read as text through a PDF parse, 2026-11-24; the plain fetch was blocked):
  per part, what earned the point. Took: explain the degree "first indicate a degree (e.g., low, moderate, or high)
  and then support it with an explanation" (Q2F), which is the degree line written first and the "?" note that any
  degree earns the point when the explanation supports it; describe parts credited for characteristics, explain
  parts for the link (Q1B, Q2E).
- **The CED's task verbs** (summary in `framework.md`, read earlier from the CED PDF): compare is "describe or
  explain similarities and/or differences". Took: Compare does not need the because, so the because goes quiet there.
- **AP Classroom and Albert.io FRQ practice** (summary only, from the rollout research; not reopened): one prompt at a
  time, the rubric after a try. Took: the rubric line after a try, kept in Test yourself's "Write a part yourself".
- **AP Bio Design drills v2** (`docs/tools-v2-design-drills-brief.md`, seen in the repo): one thing changes while the
  rest stays. Took: one answer that keeps its earlier pieces in place as the verb changes.

## The design
An exam booklet open on a wooden desk. Left page: "Question n of 8", a quiet Next question button, a drawn stimulus
for the question (polders and a dike below the sea line, a wheat field in Punjab with a well, a downtown and highway
suburbs, a birth and death rate chart, a settler ship from Britain to Australia, straight borders across two
groups' lands, invented Country A with its people as dots, three HDI inputs) and the prompt, its verb highlighted in
the verb's color. Right page: "A full-credit answer" written by hand (Kalam) on ruled lines, and the rubric line.

Main control: the **verb ladder**. Wide screens (scene 880 px and up): colored index tabs stick out of the booklet's
right edge, Identify at the bottom to Explain the degree at the top, the kit knob on a rail across them. Narrower: a
ladder printed across the page between the question and the answer (left to right), the names under the dots
(three short lines for "Explain the degree" on narrow phones). The knob drags; a tap on a name jumps there; arrows,
Home and End work (a real range input).

What happens on a change: the prompt's verb changes first (a 0.13 s fade), then the answer erases or writes one piece
at a time, word by word, in the verb's color: the name (blue), the features (green), the because link (orange), the
second side (purple), the degree on its own first line (red). The answer is exactly what the verb asks for (review
round 1): Compare has no because, Explain the degree no second side. Words on show never move: an empty piece takes no
room, and a piece only opens or folds after every word on show (writing and erasing go in climb order); the degree's
first line is always kept, and the question keeps the height of its longest prompt.

Size (review round 1): the scene is as tall as its content. On wide screens the pages keep a booklet's shape (the desk
shows at the sides), the hand is up to 30 px (20 px on phones) and the answer box fits the question's longest rung; the
stimulus takes the left page's height above the prompt (drawings 120 to 282 units tall: the landscapes grow their sky,
the maps and the chart use the height, the HDI is a clinic, a school and a paycheck feeding one score).

Words read from what is drawn: the cause line is "Verb → what it adds → “the words that add it”"; the quoted words and
the rubric line appear only when the answer drawn is exactly that verb's answer (frame checked). Takeaway, once all
five rungs have been seen: "Each task verb asks for its own piece: read the verb, then write that piece."

### What is on screen in Explore (counted at 1440 and 390, opening state)
Outside the picture: the purpose line "Each verb asks for its own piece" (7 words), Show me how, the cause line (3 pills,
about 6 words): 1 control (Show me how) and about 15 words. The controls on the picture: the verb knob, 5 verb names (taps)
and Next question.
On the picture: the kicker, Next question, the stimulus with 2 to 3 labels, the prompt (12 to 22 words), 5 verb names,
the answer kicker, the answer (2 to 66 words), the rubric line (8 to 14 words). The text count on the picture is high
by nature (an exam booklet); the plan asked to keep the outside count low, which it is.

### Explore against Test yourself
- **Explore:** the booklet. Nothing graded, nothing locked, no score.
- **Test yourself:** the shared drill (`T.drill`), every old kind unchanged with the same record ids
  (`frq-coach:<context>:<step>`): One part step by step, What each verb demands, Which answer earns the point; and
  a new kind, **Write a part yourself** (`write`): the verb card, the prompt, the old writing box with its link word
  buttons and the checklist (hints, never a score), Show the rubric line, and the earns step that opens once you have
  written a few letters (the old F6 and F8 rule); drafts kept as before (`aphug_frqcoach_v1`).
- `?seed=` and `#quiz` open Test yourself; the Premium card shows when locked (the frame's, unchanged).

### What moved (nothing dropped silently)
| Old tool | Now |
|---|---|
| Question picker (8 contexts) | Explore: Next question (one at a time); Test yourself: all 8 |
| Part strip and part card (A to D) | Test yourself, Write a part yourself (one part per problem) |
| Writing box, link word buttons, the checklist | Test yourself, Write a part yourself |
| Rubric line any time; full-credit sample after a try | Write a part yourself: rubric line any time, the earns step (with the sample) after a try; the worked solution |
| "Which answer earns the point?" step in Explore | Write a part yourself (its step) and the Which answer earns kind |
| Next part, done ticks on the strip | New question in Test yourself; results go to mastery as before (ticks dropped) |
| Choosing the question and the part to write | Write a part yourself draws a random question and part (New question draws again); logged |
| Verb demand card and "the slip readers see most", "How a part is scored" | "?" (six verb table with the slip column, scoring notes) |
| Drills part, verbs, earns; record ids | Test yourself, unchanged |
| First visit tip "Start here: read the verb" | The kit cue "Drag the verb" |

## Decisions made for the owner (also one line each in `docs/tools-v2-owner-log.md`)
1. Explore is a new drawn booklet with a verb ladder; one answer grows a piece at a time; nothing graded.
2. The old Explore writing box moved to Test yourself as a new drill kind, Write a part yourself.
3. Define is not on the ladder (a meaning, not a piece added); it stays in the drills and "?".
4. Compare is on the ladder after Explain but does not need the because; Explain the degree does not need the second
   side. Since review round 1 the answer writes only what each verb asks for (no gray pieces).
5. The plan's takeaway ("one more thing than the one below") was reworded, since compare is not a superset of explain.
6. Eight original ladder answers written (real dated places; Country A labeled invented); the rubric line per rung is
   the verb's demand in our words, not a released rubric. Open points: `docs/aphug-needs-author.md`
   (`frq-coach-ladder`).
7. Explore shows a full-credit answer, not the student's own; part strip, done ticks and Next part are gone from
   Explore.
8. The verb slips and scoring notes are in "?".
9. The HuG kit adapter `ApHugTools.kit2` (a copy of `ApPsychTools.kit2`) and kit loading in `build-aphug.mjs`; only
   this page opts in (`"kit2": true`). Other HuG tools unchanged.
10. Hub lede and description unchanged.

## Build notes
- `human-geography/assets/tools/frq-coach.js`: Explore (`explore()`, the drawings in `ART`), Test yourself (`quiz()`,
  `writeBox()`); `window.FrqCoachExplore` for the checks.
- `human-geography/assets/tools/frq-coach.css`: `.fcx-*` (Explore), `.hug-fc-*` (Test yourself).
- `human-geography/assets/tools/math/frq-coach.js`: `LADDER`, `WRITTEN`, `NEEDED`, `ADDS`, `ADD_LABEL`, `RUBRIC_LINE`,
  `ladderAnswer()`, the `write` type.
- `human-geography/data/tools/frq-coach.json`: `ladder` on each question (prompts per rung, pieces, short keys, art).
- `scripts/lib/aphug-tool-checks/frq-coach.mjs`: `ladderProblems` (each verb's signal word enters only with its own
  piece; the degree opens the degree piece) and the `write` type; tests in
  `scripts/test/aphug-tool-frq-coach.test.mjs`.
- `human-geography/assets/tools/hug-tools.js` (`kit2`), `scripts/build-aphug.mjs` (kit links), `pages.json`.
- Kept checks: `scripts/tools-v2/hug-frq-coach-sweep.mjs` (one width per process, `--dark`, `--shots`),
  `hug-frq-coach-frames.mjs`, `hug-frq-coach-perf.mjs` (with the flagship in the same run).

## Checks run (2026-11-24, 2 core container, load under 1)
- `node --test scripts/test/aphug-*.test.mjs`: 160 pass (the FRQ coach test adds the ladder and the write drill, with
  planted mistakes; the build test's fixture copy of `pages.json` updated for `kit2`). `check-aphug-content`: 0 failing.
  `build-aphug --check`, `build-apcalc --check`, `build-apmacro --check`: clean. `check-site`: clean. `check-weight
  --check`: all 626 budgets within range. `check-tool-use` with a local copy of its list (the script itself unchanged):
  FRQ coach sends tool-open, tool-touch, tool-mode, tool-use, nothing under automation.
- Sweep (`scripts/tools-v2/hug-frq-coach-sweep.mjs`, one width per process): 8 questions x 5 rungs at 360, 390, 430,
  600, 768, 820, 1024, 1280, 1440, 1920, light and dark (dark asserted): **25,019 passed, 0 failed**. Includes the
  landing cue (one, inside, on no text), a real tap (touch on phones) on a verb name, Next question, the fit at 390x844,
  1024x768 and 1280x800 (knob, scene and cause line in view at every rung, no inner scroll).
- Frames (`hug-frq-coach-frames.mjs`): 390 (CDP touch drag) and 1440 (mouse): a drag up the whole ladder and fast back,
  End and Home keys, a reversal mid writing, Next question mid writing, leaving for Test yourself mid writing (stops,
  comes back clean), reduced motion (result at once with a 0.22 s fade). 1,537 frames read, 619 while the answer was
  changing: 1,561 passed, 0 failed.
- Perf (`hug-frq-coach-perf.mjs`, CPU x4, flagship in the same run): 390 drag median 16.7 ms, p95 16.8 ms (3.4 ms main
  thread a frame); Next question 16.7 / 16.8. 1440 drag 16.7 / 33.4 (3.9 ms); Next question 16.7 / 33.3. Flagship in
  the same hour: 390 33.3 / 50.1 (9.2 ms), 1440 33.4 / 83.3 (10.4 ms).
- Test yourself by hand (Playwright, 390 and 1440): `?seed=12345` opens Test yourself with that code; `#quiz` opens it;
  Write a part yourself: the earns step hidden until a few letters, the link flag turns on, Show the rubric line, two
  options; no console errors. Locked (no Premium): the frame's Premium card, no Explore built.
- Preview `/mnt/user-data/outputs/hug-frq-coach-v2/index.html`; shots (landing at every width, light and dark, rungs,
  fits, mid writing frames, Write a part, locked) in `/mnt/user-data/outputs/hug-frq-coach-v2/shots/`.

## Review round 1 (2026-11-24, BLOCK; fixed the same day)
Review: `/home/claude/review-hug-frq/REVIEW.md`. Merged `claude/tools-v2-all` first (only the append-only docs
conflicted). Must fix: (1) empty paper on wide screens: the scene is sized from its content, pages keep a booklet's
shape, the hand goes to 30 px wide and 20 px on phones, the stimulus grows into the left page, HDI and the transition
chart redrawn as small scenes, degree pieces one short line so the answer never starts under blank lines; (2) the
answer writes only what the verb asks for (`WRITTEN` = `NEEDED`; empty pieces fold, after every word on show); (3) the
city ladder names the pattern ("Suburban sprawl."). Should fix: names 4 px clear of the knob on phones (the sweep now
checks 4 px); no gray text left (the quiet style is 72% ink if it is ever used); Test yourself's question text has a
hidden ". " after each letter and Write a part yourself lists only its own part; the write kind's random part is
logged; "Any kind" draws from the first three kinds, so old problem links keep their problem; polders "the drained
land"; the owner log's Define line cites framework.md. The frames check now also asserts that no word on show moves.

Checks after the fixes (fix round: 360, 390, 768, 1024, 1440, light and dark): sweep 12,516 passed, 0 failed (the
knob now 4 px clear of every name); frames at 390 and 1440 with the new "no word on show moves" assertion: 1,539
passed, 0 failed; HuG tests 160 pass; content check 0 failing; `build-aphug`, `build-apcalc`, `build-apmacro --check`,
`check-site`, `check-weight --check` clean; Write a part yourself reads "A. Define ..." with only its own part. Shots:
`/mnt/user-data/outputs/hug-frq-coach-v2/shots/r1-*`.

## Recheck 1 (2026-11-24, BLOCK; fixed the same day)
Must fix: on short phones (360x640, 375x667, 360x740) the last answer line ran under the rubric box. Cause: after Next
question the new answer was laid out before its empty pieces folded, so it was sized wrong, and the rubric was placed
from the box, not from the answer. Fixed: empty pieces fold from the start; the booklet is sized from the longest
answer of all eight questions (a hidden measuring copy) and every prompt, so it keeps one size between questions;
`settle()` puts the rubric under the answer box and grows the page and scene together. The sweep takes `--height`,
checks a 4 px answer to rubric gap, the booklet on the desk and the rubric clear of the scene's edge, and runs at
360x640, 375x667 and 360x740. Should fix: 1024x768 booklet on the desk (same fix); polders and Punjab grow their
ground, not their sky; 768 lets the hand (26 px) and the drawing grow; "Deaths" moved off its curve.

Checks after recheck 1's fixes: sweep at 360x640, 375x667, 360x740, 390x844, 768x1024, 1024x768 and 1440x900, light
and dark: 17,525 passed, 0 failed; frames at 390 and 1440: 1,398 passed, 0 failed; the reviewer's overlap script at
375x667, 360x640, 360x740 and 390x844: no answer under the rubric; HuG tests 160 pass; content check 0 failing; the
three build checks, `check-site` and `check-weight --check` clean. Shots: `/mnt/user-data/outputs/hug-frq-coach-v2/shots/r2-*`.

## Not done, and what I am not happy with
- At Identify and Describe most of the answer page is ruled lines waiting for the longer rungs (by design: the box fits
  the longest rung); on very wide screens a short band can stay under the prompt when the drawing reaches its tallest.
- The stimulus drawings are better than round 0 but still simple next to the flagship's lake.
- No real phone, no screen reader pass, no real students. The ladder content needs a teacher's read
  (`docs/aphug-needs-author.md`, `frq-coach-ladder`).
